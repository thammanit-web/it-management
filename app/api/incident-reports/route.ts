import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { generateNewCode } from "@/lib/code-generator";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const sortField = searchParams.get("sortField") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { report_code: { contains: search, mode: "insensitive" } },
        { reporterName: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.incidentReport.findMany({
        where,
        orderBy: {
          [sortField]: sortOrder,
        },
        skip,
        take: limit,
        include: {
          user: { select: { username: true } },
        }
      }),
      prisma.incidentReport.count({ where }),
    ]);

    return NextResponse.json({
      data: reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/incident-reports error:", error);
    return NextResponse.json({ error: "Failed to fetch incident reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any)?.id;

  try {
    const body = await request.json();
    const { 
      incidentTime,
      location,
      employeeCode,
      reporterName,
      department,
      incidentType,
      incidentTypeOther,
      details,
      reportSignatureDate,
      reporterSign
    } = body;
    
    // Server-side generate unique code
    const report_code = await generateNewCode('incidentReport');

    const report = await prisma.incidentReport.create({
      data: {
        report_code,
        incidentTime: new Date(incidentTime),
        location,
        employeeCode,
        reporterName,
        department,
        incidentType,
        incidentTypeOther,
        details,
        reportSignatureDate: reportSignatureDate ? new Date(reportSignatureDate) : null,
        reporterSign,
        userId
      }
    });

    await logAudit({
      userId,
      userName: (session.user as any)?.name,
      action: "CREATE_INCIDENT_REPORT",
      module: "INCIDENT_REPORT",
      details: { id: report.id, report_code }
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("POST /api/incident-reports error:", error);
    return NextResponse.json({ error: "Failed to create incident report" }, { status: 500 });
  }
}
