import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePOCode } from "@/lib/code-generator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";
  const sortField = searchParams.get("sortField") || "po_code";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { po_code: { contains: search, mode: "insensitive" } },
        { list: { contains: search, mode: "insensitive" } },
        { buyer: { contains: search, mode: "insensitive" } },
        { reviewer: { contains: search, mode: "insensitive" } },
        { approver: { contains: search, mode: "insensitive" } },
        { reason_order: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status !== "ALL") where.status = status;

    const [orders, total] = await Promise.all([
      prisma.equipmentPurchaseOrder.findMany({
        where,
        include: {
          entries: true,
        },
        orderBy: {
          [sortField]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.equipmentPurchaseOrder.count({ where }),
    ]);

    return NextResponse.json({
      data: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/equipment-purchase-orders error:", error);
    return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      list, 
      detail, 
      quantity, 
      reason_order, 
      picture, 
      buyer, 
      reviewer, 
      approver, 
      status,
      date_order 
    } = body;

    const po_code = await generatePOCode();

    const order = await prisma.equipmentPurchaseOrder.create({
      data: {
        po_code,
        list,
        detail,
        quantity: quantity || 0,
        reason_order,
        picture,
        buyer,
        reviewer,
        approver,
        status,
        date_order: date_order ? new Date(date_order) : undefined,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/equipment-purchase-orders error:", error);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}
