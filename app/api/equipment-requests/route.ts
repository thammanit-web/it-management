import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { generateNewCode } from "@/lib/code-generator";
import { sendOutlookEmail, createSystemNotification, generateEmailTemplate } from "@/lib/notifier";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const sortField = searchParams.get("sortField") || "group_code";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

    const where: any = {};
    if (search) {
       where.OR = [
          { group_code: { contains: search, mode: 'insensitive' } },
          { user: { username: { contains: search, mode: 'insensitive' } } },
          { user: { employee: { employee_name_th: { contains: search, mode: 'insensitive' } } } },
          { reason: { contains: search, mode: 'insensitive' } },
       ];
    }

    // Return groups (batches) instead of solo requests if possible
    const groups = await prisma.equipmentBorrowGroup.findMany({
      where,
      include: {
        user: { include: { employee: true } },
        requests: {
          include: {
            equipmentList: {
              include: {
                equipmentEntry: {
                  include: {
                    purchaseOrder: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { [sortField]: sortOrder },
    });
    return NextResponse.json(groups);
  } catch (error) {
    console.error("GET /api/equipment-requests error:", error);
    return NextResponse.json({ error: "Failed to fetch equipment requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { 
      items, // Array of { equipmentListId, quantity, borrow_type, remarks }
      reason,
      approval,
      userId
    } = body;

    const finalUserId = userId || session?.user?.id;
    if (!items || !Array.isArray(items) || items.length === 0 || !finalUserId) {
      return NextResponse.json({ error: "Items and User ID are required" }, { status: 400 });
    }



    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Group first
      const group_code = await generateNewCode('equipmentGroup', tx);
      const group = await tx.equipmentBorrowGroup.create({
        data: {
          group_code,
          userId: finalUserId,
          reason: reason || "",
          approval: approval,
          approval_status: "PENDING", // Initial state
        }
      });

      let overallStatus = "PENDING"; // All requests start as PENDING for manual review

      // 2. Process each item
      for (const item of items) {
        let invItem = null;
        if (item.equipmentListId) {
          invItem = await tx.equipmentList.findUnique({
             where: { id: item.equipmentListId },
             include: { equipmentEntry: true }
          });
          
          if (!invItem) throw new Error(`Item ${item.equipmentListId} not found`);
          
          // Only throw if it's NOT a purchase-style request and stock is low
          if (item.borrow_type !== 'PURCHASE' && invItem.remaining < (item.quantity || 1)) {
            throw new Error(`Insufficient stock for ${invItem.equipmentEntry?.list}`);
          }
        }

        const equipment_code = await generateNewCode('equipmentRequest', tx);
        await tx.equipmentRequest.create({
          data: {
             equipment_code,
             equipment_list_id: item.equipmentListId || null,
             manual_item_name: item.manual_item_name || null,
             manual_item_type: item.manual_item_type || null,
             groupId: group.id,
             userId: finalUserId,
             quantity: item.quantity || 1,
             reason: reason,
             borrow_type: item.borrow_type || "NEW",
             remarks: item.remarks || "",
             approval: approval,
             approval_status: "PENDING",
             approval_comment: "",
             approval_date: null,
             it_approval: null,
             it_approval_status: "PENDING",
             it_approval_date: null,
          }
        });
      }

      // 4. Update group status based on items
      const updatedGroup = await tx.equipmentBorrowGroup.update({
         where: { id: group.id },
         data: { approval_status: overallStatus },
         include: { requests: { include: { equipmentList: { include: { equipmentEntry: true } } } }, user: { include: { employee: true } } }
      });

      return updatedGroup;
    });

    const headList = await headers();
    const ip = headList.get("x-forwarded-for") || "unknown";
    const ua = headList.get("user-agent") || "unknown";

    await logAudit({
      userId: finalUserId,
      userName: (session?.user as any)?.name,
      action: "CREATE_BATCH_BORROW",
      module: "EQUIPMENT_BORROW",
      details: { groupId: result.id, itemCount: items.length },
      ipAddress: ip,
      userAgent: ua
    });

    try {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3003";

      const creatorName = (result as any).user?.employee?.employee_name_th || (result as any).user?.username || (session?.user as any)?.name || 'Unknown';
      const creatorPosition = (result as any).user?.employee?.position || '-';
      const creatorDept = (result as any).user?.employee?.department || '-';
      const creatorDisplay = `${creatorName} (ตำแหน่ง: ${creatorPosition}, แผนก: ${creatorDept})`;

      // Save to database
      await createSystemNotification({
        title: `New Equipment Request: ${result.group_code}`,
        message: `Equipment request ${result.group_code} submitted by ${creatorDisplay}. Items: ${result.requests.length}.`,
        type: "EQUIPMENT",
        link: `/admin/equipment-requests`
      });

      const reqUrl = `${baseUrl}/admin/equipment-requests`;
      const htmlItemsList = result.requests.map((r: any) => `<li style="margin-bottom: 4px;">${r.quantity}x ${r.equipmentList?.equipmentEntry?.list || r.manual_item_name || 'Unknown Item'}</li>`).join('');

      const emailContent = `
        <table class="details-table">
          <tr><th>Submitted by</th><td>${creatorDisplay}</td></tr>
          <tr><th>Reason</th><td>${result.reason || "N/A"}</td></tr>
          <tr><th>Approval Req.</th><td>${result.approval || "None"}</td></tr>
          <tr>
            <th>Items Requested</th>
            <td><ul style="margin: 0; padding-left: 16px;">${htmlItemsList || "<li>No items listed</li>"}</ul></td>
          </tr>
        </table>
      `;

      await sendOutlookEmail({
        subject: `New Equipment Request: ${result.group_code}`,
        content: generateEmailTemplate(
          `New Equipment Request: ${result.group_code}`,
          emailContent,
          reqUrl,
          "View Request Details"
        )
      });
    } catch (e) {
      console.error("Failed to send webhook:", e);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/equipment-requests error:", error);
    return NextResponse.json({ error: error.message || "Failed to create batch request" }, { status: 500 });
  }
}
