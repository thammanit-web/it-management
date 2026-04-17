import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await context.params;

  try {
    const report = await prisma.incidentReport.findUnique({
      where: { id },
      include: {
        user: { select: { username: true } }
      }
    });

    if (!report) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("GET /api/incident-reports/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await context.params;
  const userId = (session.user as any)?.id;

  try {
    const body = await request.json();
    const dataToUpdate: any = { ...body };

    // Dates need to be parsed, empty strings should become null
    if (dataToUpdate.incidentTime !== undefined) dataToUpdate.incidentTime = dataToUpdate.incidentTime ? new Date(dataToUpdate.incidentTime) : null;
    if (dataToUpdate.reportSignatureDate !== undefined) dataToUpdate.reportSignatureDate = dataToUpdate.reportSignatureDate ? new Date(dataToUpdate.reportSignatureDate) : null;
    if (dataToUpdate.maintenanceDate !== undefined) dataToUpdate.maintenanceDate = dataToUpdate.maintenanceDate ? new Date(dataToUpdate.maintenanceDate) : null;
    if (dataToUpdate.responsibleDate !== undefined) dataToUpdate.responsibleDate = dataToUpdate.responsibleDate ? new Date(dataToUpdate.responsibleDate) : null;
    if (dataToUpdate.reviewerDate !== undefined) dataToUpdate.reviewerDate = dataToUpdate.reviewerDate ? new Date(dataToUpdate.reviewerDate) : null;

    // Prevent overriding important fields from client
    delete dataToUpdate.id;
    delete dataToUpdate.report_code;
    delete dataToUpdate.userId;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;
    
    // Explicit relations shouldn't be overridden like this
    delete dataToUpdate.user;

    const report = await prisma.incidentReport.update({
      where: { id },
      data: dataToUpdate
    });

    await logAudit({
      userId,
      userName: (session.user as any)?.name,
      action: "UPDATE_INCIDENT_REPORT",
      module: "INCIDENT_REPORT",
      details: { id: report.id, report_code: report.report_code }
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("PUT /api/incident-reports/[id] error:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await context.params;
  const userId = (session.user as any)?.id;

  try {
    const report = await prisma.incidentReport.delete({
      where: { id }
    });

    await logAudit({
      userId,
      userName: (session.user as any)?.name,
      action: "DELETE_INCIDENT_REPORT",
      module: "INCIDENT_REPORT",
      details: { id: report.id, report_code: report.report_code }
    });

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/incident-reports/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
