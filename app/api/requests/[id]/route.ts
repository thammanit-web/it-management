import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    const apiRequest = await prisma.request.findUnique({
      where: { id: id },
      include: {
        employee: true,
        user: true,
        comments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!apiRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json(apiRequest);
  } catch (error) {
    console.error("GET /api/requests/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { 
      employeeId, 
      type_request, 
      description, 
      reason, 
      category, 
      priority, 
      status, 
      userId, 
      approval, 
      approval_status,
      approval_comment,
      it_approval,
      it_approval_status,
      it_approval_comment
    } = body;

    const requestUpdate = await prisma.request.update({
      where: { id: id },
      data: {
        employeeId,
        userId,
        type_request,
        description,
        reason,
        category,
        priority,
        status: it_approval_status === "APPROVED" ? "RESOLVED" : status,
        approval,
        approval_status,
        approval_comment,
        approval_date: (approval_status === "APPROVED" || approval_status === "REJECTED") ? new Date() : undefined,
        it_approval,
        it_approval_status,
        it_approval_comment,
        it_approval_date: (it_approval_status === "APPROVED" || it_approval_status === "REJECTED") ? new Date() : undefined,
      },
      include: {
        employee: true,
        user: true,
      },
    });

    const isApproval = (body.approval_status && body.approval_status !== "PENDING") || (body.it_approval_status && body.it_approval_status !== "PENDING");
    
    const headList = await headers();
    const ip = headList.get("x-forwarded-for") || "unknown";
    const ua = headList.get("user-agent") || "unknown";

    await logAudit({
      userId: (session.user as any)?.id,
      userName: (session.user as any)?.name, 
      action: isApproval ? "APPROVE_ACTION" : "UPDATE_REQUEST",
      module: "SUPPORT_TICKET",
      details: { 
         requestId: id, 
         status: requestUpdate.status, 
         approvalStatus: requestUpdate.approval_status,
         itApprovalStatus: requestUpdate.it_approval_status
      },
      ipAddress: ip,
      userAgent: ua
    });

    return NextResponse.json(requestUpdate);
  } catch (error) {
    console.error("PATCH /api/requests/[id] error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    const headList = await headers();
    const ip = headList.get("x-forwarded-for") || "unknown";
    const ua = headList.get("user-agent") || "unknown";

    await prisma.request.delete({
      where: { id: id }
    });

    await logAudit({
      userId: (session.user as any)?.id,
      userName: (session.user as any)?.name,
      action: "DELETE_REQUEST",
      module: "SUPPORT_TICKET",
      details: { requestId: id },
      ipAddress: ip,
      userAgent: ua
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/requests/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete request" }, { status: 500 });
  }
}
