import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { generateNewCode } from "@/lib/code-generator";

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
         include: { requests: { include: { equipmentList: { include: { equipmentEntry: true } } } } }
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

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/equipment-requests error:", error);
    return NextResponse.json({ error: error.message || "Failed to create batch request" }, { status: 500 });
  }
}
