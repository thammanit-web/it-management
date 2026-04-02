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
    // Removed restriction to allow seeing others' requests too
    const where = {};

    const requests = await prisma.request.findMany({
      where,
      include: {
        employee: true,
        user: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'asc' }
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const authUserId = (session.user as any)?.id;

  try {
    const body = await request.json();
      const { 
        employeeId, 
        type_request, 
        description, 
        reason, 
        category, 
        priority, 
        status, 
        approval, 
        approval_status,
        approval_comment,
        it_approval,
        it_approval_status,
        it_approval_comment
      } = body;
  
      // Use authUserId instead of relying on client-provided id
      if (!employeeId || !authUserId || !description || !category || !priority) {
        return NextResponse.json({ error: "Required fields are missing" }, { status: 400 });
      }
  
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });
  
      if (!employee) {
        return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
      }

      // Generate the new request code
      const request_code = await generateNewCode('request');
  
      // Server-side auto-approval logic for Standard Requests (Pre-approved)
      const typeLabels: Record<string, string> = {
        SUPPORT: "บริการสนับสนุนอุปกรณ์ไอที",
        PASSWORD_ACCOUNT: "แก้รหัสผ่าน / บัญชี",
        BORROW_ACC: "ขอยืมอุปกรณ์เสริม-อุปกรณ์ไอทีพื้นฐาน",
        REPAIR: "แจ้งซ่อมอุปกรณ์ตามมาตรฐาน",
        ACCESS: "ขอสิทธิ์เข้าใช้งานระบบมาตรฐาน"
      };  

      const typeName = typeLabels[type_request] || type_request;
      const standardTypes = ["SUPPORT", "PASSWORD_ACCOUNT", "BORROW_ACC", "REPAIR"];
      const finalApprovalStatus = standardTypes.includes(type_request) ? "APPROVED" : (approval_status || "PENDING");
  
      const newRequest = await prisma.request.create({
        data: {
          employeeId,
          userId: authUserId,
          request_code,
          type_request,
          description,
          reason,
          category,
          priority,
          status: status || "OPEN",
          approval,
          approval_status: finalApprovalStatus,
          approval_comment: standardTypes.includes(type_request) 
            ? `รายการงาน "${typeName}" นี้เป็นบริการมาตรฐานที่มีความเสี่ยงต่ำ จึงไม่ต้องรอการอนุมัติรายกรณี / Pre-approved standard ${type_request} request.` 
            : approval_comment,
          it_approval,
          it_approval_status: it_approval_status || "PENDING",
          it_approval_comment,
        },
      include: {
        employee: true,
        user: true,
      },
    });

    const headList = await headers();
    const ip = headList.get("x-forwarded-for") || "unknown";
    const ua = headList.get("user-agent") || "unknown";

    await logAudit({
      userId: authUserId,
      userName: (session.user as any)?.name, 
      action: "CREATE_REQUEST",
      module: "SUPPORT_TICKET",
      details: { requestId: newRequest.id, description: newRequest.description },
      ipAddress: ip,
      userAgent: ua
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
