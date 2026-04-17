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

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";
  const priority = searchParams.get("priority") || "ALL";
  const category = searchParams.get("category") || "ALL";
  const type_request = searchParams.get("type_request") || "ALL";
  const sortField = searchParams.get("sortField") || "request_code";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { request_code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
        { employee: { employee_name_th: { contains: search, mode: "insensitive" } } },
        { employee: { department: { contains: search, mode: "insensitive" } } },
        { user: { username: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (status !== "ALL") where.status = status;
    if (priority !== "ALL") where.priority = priority;
    if (category !== "ALL") where.category = category;
    if (type_request !== "ALL") where.type_request = type_request;

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: {
          employee: true,
          user: true,
          comments: {
            include: { user: true },
            orderBy: { createdAt: 'asc' }
          },
        },
        orderBy: {
          [sortField]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.request.count({ where }),
    ]);

    return NextResponse.json({
      data: requests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
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
        it_approval_comment,
        createdAt,
        ai_reasoning
      } = body;
  
      // Use authUserId instead of relying on client-provided id
      const missingFields = [];
      if (!employeeId) missingFields.push("employeeId");
      if (!authUserId) missingFields.push("authUserId");
      if (!description) missingFields.push("description");
      if (!category) missingFields.push("category");
      if (!priority) missingFields.push("priority");
      if (!type_request) missingFields.push("type_request");

      if (missingFields.length > 0) {
        console.error(`[API/REQUESTS] POST 400 - Missing Fields:`, missingFields, `Payload:`, body);
        return NextResponse.json({ error: `Required fields are missing: ${missingFields.join(", ")}` }, { status: 400 });
      }
  
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });
  
      if (!employee) {
        console.error(`[API/REQUESTS] POST 404 - Employee profile not found for employeeId:`, employeeId);
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
        ACCESS: "ขอสิทธิ์เข้าใช้งานระบบมาตรฐาน",
        INSTALLATION: "ติดตั้ง / เซ็ตอัพ"
      };  

      const typeName = typeLabels[type_request] || type_request;
      const standardTypes = ["SUPPORT", "PASSWORD_ACCOUNT", "BORROW_ACC", "REPAIR", "INSTALLATION"];
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
          createdAt: createdAt ? new Date(createdAt) : undefined,
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

    try {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3003";

      const creatorName = (newRequest as any).employee?.employee_name_th || (newRequest as any).user?.username || 'Unknown';
      const creatorPosition = (newRequest as any).employee?.position || '-';
      const creatorDept = (newRequest as any).employee?.department || '-';
      const creatorDisplay = `${creatorName} (ตำแหน่ง: ${creatorPosition}, แผนก: ${creatorDept})`;

      // Save to database
      await createSystemNotification({
        title: `New IT Support Ticket: ${newRequest.request_code}`,
        message: `Ticket ${newRequest.request_code} created by ${creatorDisplay}. Category: ${newRequest.category}, Priority: ${newRequest.priority}.`,
        type: "TICKET",
        link: `/admin/requests/${newRequest.id}`
      });

      const ticketUrl = `${baseUrl}/admin/requests/${newRequest.id}`;
      const emailContent = `
        <table class="details-table">
          <tr><th>Created by</th><td>${creatorDisplay}</td></tr>
          <tr><th>Type</th><td>${typeName}</td></tr>
          <tr><th>Priority</th><td><span style="font-weight:bold; color: ${newRequest.priority === 'HIGH' ? '#e11d48' : newRequest.priority === 'MEDIUM' ? '#d97706' : '#2563eb'}">${newRequest.priority}</span></td></tr>
          <tr><th>Category</th><td>${newRequest.category || "N/A"}</td></tr>
          <tr><th>Status</th><td>${newRequest.status}</td></tr>
          <tr><th>Description</th><td>${newRequest.description || "N/A"}</td></tr>
          <tr><th>Reason</th><td>${newRequest.reason || "N/A"}</td></tr>
          <tr><th>Approval Req.</th><td>${newRequest.approval || "None"}</td></tr>
          ${ai_reasoning ? `<tr><th>เหตุผลจาก AI</th><td>${ai_reasoning}</td></tr>` : ''}
        </table>
      `;

      await sendOutlookEmail({
        subject: `IT Ticket: ${newRequest.request_code} has been created`,
        content: generateEmailTemplate(
          `New IT Support Ticket: ${newRequest.request_code}`,
          emailContent,
          ticketUrl,
          "View Ticket Details"
        )
      });
    } catch (e) {
      console.error("Failed to send webhook:", e);
    }

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
