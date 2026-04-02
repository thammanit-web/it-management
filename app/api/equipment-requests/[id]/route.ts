import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Check if it's a Group first
    const group = await prisma.equipmentBorrowGroup.findUnique({
      where: { id },
      include: {
        user: { include: { employee: true } },
        requests: {
          include: {
            equipmentList: { include: { equipmentEntry: { include: { purchaseOrder: true } } } }
          }
        }
      }
    });

    if (group) return NextResponse.json(group);

    // Fallback to individual request (Legacy or specific item view)
    const eqRequest = await prisma.equipmentRequest.findUnique({
      where: { id },
      include: {
        user: { include: { employee: true } },
        equipmentList: { include: { equipmentEntry: { include: { purchaseOrder: true } } } }
      }
    });

    if (!eqRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(eqRequest);

  } catch (error) {
    console.error("GET /api/equipment-requests/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const body = await request.json();
    const { 
      approval_status, 
      approval_comment,
      approval,
      it_approval_status,
      it_approval_comment,
      it_approval
    } = body;

    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.equipmentBorrowGroup.findUnique({
        where: { id },
        include: { requests: { include: { equipmentList: true } } }
      });

      if (!group) {
        // Handle as solo request if no group found
        const solo = await tx.equipmentRequest.findUnique({ where: { id }, include: { equipmentList: true } });
        if (!solo) throw new Error("Request not found");
        
        // Single item stock logic
        if (solo.equipment_list_id) {
          if (it_approval_status === "APPROVED" && (solo as any).it_approval_status !== "APPROVED") {
             await tx.equipmentList.update({ where: { id: solo.equipment_list_id }, data: { remaining: { decrement: solo.quantity } } });
          } else if (it_approval_status !== "APPROVED" && (solo as any).it_approval_status === "APPROVED") {
             await tx.equipmentList.update({ where: { id: solo.equipment_list_id }, data: { remaining: { increment: solo.quantity } } });
          }
        }

        return await tx.equipmentRequest.update({
           where: { id },
           data: {
             approval_status, approval_comment, approval, approval_date: approval_status ? new Date() : undefined,
             it_approval_status, it_approval_comment, it_approval, it_approval_date: it_approval_status ? new Date() : undefined,
           }
        });
      }

      // Group update logic
      for (const item of group.requests) {
        if (item.equipment_list_id) {
          if (it_approval_status === "APPROVED" && (item as any).it_approval_status !== "APPROVED") {
             await tx.equipmentList.update({ where: { id: item.equipment_list_id }, data: { remaining: { decrement: item.quantity } } });
          } else if (it_approval_status !== "APPROVED" && (item as any).it_approval_status === "APPROVED") {
             await tx.equipmentList.update({ where: { id: item.equipment_list_id }, data: { remaining: { increment: item.quantity } } });
          }
        }
      }

      await tx.equipmentRequest.updateMany({
        where: { groupId: group.id },
        data: {
          approval_status, approval_comment, approval, approval_date: approval_status ? new Date() : undefined,
          it_approval_status, it_approval_comment, it_approval, it_approval_date: it_approval_status ? new Date() : undefined,
        }
      });

      return await tx.equipmentBorrowGroup.update({
        where: { id },
        data: {
          approval_status, approval_comment, approval, approval_date: approval_status ? new Date() : undefined,
          it_approval_status, it_approval_comment, it_approval, it_approval_date: it_approval_status ? new Date() : undefined,
        },
        include: { requests: true }
      });
    });

    const headList = await headers();
    await logAudit({
      userId: session?.user?.id,
      userName: (session?.user as any)?.name,
      action: "UPDATE_BORROW_BATCH",
      module: "EQUIPMENT_BORROW",
      details: { id, status: approval_status || it_approval_status },
      ipAddress: headList.get("x-forwarded-for") || "unknown",
      userAgent: headList.get("user-agent") || "unknown"
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: error.message || "Failed to update" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();

    await prisma.$transaction(async (tx) => {
      const group = await tx.equipmentBorrowGroup.findUnique({
        where: { id },
        include: { requests: true }
      });

      if (group) {
        for (const item of group.requests) {
          if (item.equipment_list_id && (item as any).it_approval_status === "APPROVED") {
            await tx.equipmentList.update({ where: { id: item.equipment_list_id }, data: { remaining: { increment: item.quantity } } });
          }
        }
        await tx.equipmentRequest.deleteMany({ where: { groupId: group.id } });
        await tx.equipmentBorrowGroup.delete({ where: { id } });
      } else {
        const solo = await tx.equipmentRequest.findUnique({ where: { id } });
        if (solo) {
          if (solo.equipment_list_id && (solo as any).it_approval_status === "APPROVED") {
            await tx.equipmentList.update({ where: { id: solo.equipment_list_id }, data: { remaining: { increment: solo.quantity } } });
          }
          await tx.equipmentRequest.delete({ where: { id } });
        }
      }
    });

    const headList = await headers();
    await logAudit({
      userId: (session?.user as any)?.id,
      userName: (session?.user as any)?.name,
      action: "DELETE_BORROW_BATCH",
      module: "EQUIPMENT_BORROW",
      details: { id },
      ipAddress: headList.get("x-forwarded-for") || "unknown",
      userAgent: headList.get("user-agent") || "unknown"
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

