import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";
import { generatePOCode } from "@/lib/code-generator";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type) {
      return NextResponse.json({ error: "Missing file or type" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (data.length === 0) {
      return NextResponse.json({ error: "No data found in file" }, { status: 400 });
    }

    let count = 0;

    if (type === "PURCHASE_ORDER") {
      for (const row of data) {
        const po_code = row.po_code || await generatePOCode();
        await prisma.equipmentPurchaseOrder.create({
          data: {
            po_code,
            list: String(row.list || "Unnamed PO"),
            detail: String(row.detail || "-"),
            quantity: parseInt(row.quantity) || 0,
            reason_order: String(row.reason_order || "-"),
            buyer: String(row.buyer || "ADMIN"),
            reviewer: String(row.reviewer || "-"),
            approver: String(row.approver || "-"),
            status: String(row.status || "PENDING"),
            date_order: (() => {
              const d = new Date(row.date_order);
              if (!row.date_order || isNaN(d.getTime()) || d.getFullYear() <= 1970) return new Date();
              return d;
            })(),
          }
        });
        count++;
      }
    } else if (type === "REQUEST") {
      for (const row of data) {
        const employee = await prisma.employee.findUnique({
          where: { employee_code: String(row.employee_code) },
          include: { user: true }
        });

        if (!employee || !employee.user) {
          console.warn(`Skipping request: Employee ${row.employee_code} or linked user not found`);
          continue;
        }

        await prisma.request.create({
          data: {
            request_code: String(row.request_code || `REQ-${Date.now()}-${count}`),
            employeeId: employee.id,
            userId: employee.user.id,
            type_request: row.type_request || "General",
            description: row.description || "-",
            reason: row.reason || "-",
            category: (row.category as any) || "GENERAL",
            priority: (row.priority as any) || "MEDIUM",
            status: (row.status as any) || "OPEN",
            createdAt: new Date(),
          }
        });
        count++;
      }
    } else if (type === "IT_NOTE") {
      const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });
      if (!adminUser) {
        return NextResponse.json({ error: "No admin user found to assign notes to" }, { status: 400 });
      }

      // Group rows by title — each row is one detail line, same title = same note
      const noteMap = new Map<string, {
        content: string | null;
        isPrivate: boolean;
        isPublished: boolean;
        details: { label: string; value: string; order: number }[];
      }>();

      for (const row of data) {
        const title = String(row.title || "Untitled Note").trim();
        const label = row.detail_label ? String(row.detail_label).trim() : "";
        const value = row.detail_value ? String(row.detail_value).trim() : "";

        if (!noteMap.has(title)) {
          noteMap.set(title, {
            content: row.content ? String(row.content) : null,
            isPrivate: row.isPrivate === true || String(row.isPrivate ?? "").toLowerCase() === "true",
            isPublished: row.isPublished === true || String(row.isPublished ?? "").toLowerCase() === "true",
            details: [],
          });
        }

        const note = noteMap.get(title)!;
        if (label || value) {
          note.details.push({ label, value, order: note.details.length });
        }
      }

      for (const [title, note] of noteMap) {
        await prisma.itNote.create({
          data: {
            title,
            content: note.content,
            isPrivate: note.isPrivate,
            isPublished: note.isPublished,
            userId: adminUser.id,
            details: { create: note.details },
          },
        });
        count++;
      }
    } else if (type === "EMPLOYEE_USER") {
      // Import by name + email — creates User + Employee linked together
      for (const row of data) {
        const email = row.email ? String(row.email).trim() : null;
        const name = row.name ? String(row.name).trim() : null;

        if (!email || !name) {
          console.warn(`Skipping row: missing name or email`);
          continue;
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          console.warn(`Skipping: user with email ${email} already exists`);
          continue;
        }

        // Generate employee_code from email prefix (e.g. austin.zhang from Austin@xxx.co.th)
        const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
        const employee_code = `EMP-${emailPrefix}-${Date.now()}`.slice(0, 50);

        const employee = await prisma.employee.create({
          data: {
            employee_code,
            employee_name_en: name,
            employee_name_th: name,
            position: row.position ? String(row.position) : null,
            department: row.department ? String(row.department) : null,
            work_location: row.work_location ? String(row.work_location) : null,
            status: "ACTIVE",
          },
        });

        await prisma.user.create({
          data: {
            email,
            username: email.split("@")[0].toLowerCase(),
            role: row.role ? String(row.role) : "user",
            employeeId: employee.id,
          },
        });

        count++;
      }
    } else if (type === "EMPLOYEE") {
      // Import employees only — MS365 users are created automatically on first login
      for (const row of data) {
        const existingEmployee = await prisma.employee.findUnique({
          where: { employee_code: String(row.employee_code) }
        });

        if (existingEmployee) {
          console.warn(`Skipping employee: ${row.employee_code} already exists`);
          continue;
        }

        await prisma.employee.create({
          data: {
            employee_code: String(row.employee_code),
            employee_name_th: String(row.employee_name_th),
            employee_name_en: row.employee_name_en ? String(row.employee_name_en) : null,
            gender: row.gender ? String(row.gender) : null,
            position: row.position ? String(row.position) : null,
            department: row.department ? String(row.department) : null,
            work_location: row.work_location ? String(row.work_location) : null,
            supervisor_name: row.supervisor_name ? String(row.supervisor_name) : null,
            status: "ACTIVE",
          }
        });
        count++;
      }
    }

    return NextResponse.json({ message: "Import completed successfully", count });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message || "Failed to process import" }, { status: 500 });
  }
}
