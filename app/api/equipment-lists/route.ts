import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const sortField = searchParams.get("sortField") || "eq_code";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

    const where: any = {};
    if (search) {
      where.OR = [
        { eq_code: { contains: search, mode: 'insensitive' } },
        { equipmentEntry: { list: { contains: search, mode: 'insensitive' } } },
        { equipmentEntry: { brand_name: { contains: search, mode: 'insensitive' } } },
        { equipmentEntry: { purchaseOrder: { po_code: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const equipmentLists = await prisma.equipmentList.findMany({
      where,
      include: {
        equipmentEntry: {
          include: {
            purchaseOrder: true
          }
        }
      },
      orderBy: {
        [sortField]: sortOrder
      }
    });

    return NextResponse.json(equipmentLists);
  } catch (error) {
    console.error("GET Equipment Lists Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
