import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEQCode } from "@/lib/code-generator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const filterType = searchParams.get("filterType") || "ALL";
    const sortField = searchParams.get("sortField") || "po_code";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { list: { contains: search, mode: 'insensitive' } },
        { brand_name: { contains: search, mode: 'insensitive' } },
        { recipient: { contains: search, mode: 'insensitive' } },
        { purchaseOrder: { po_code: { contains: search, mode: 'insensitive' } } },
        { purchaseOrder: { list: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (filterType !== "ALL") {
      where.item_type = filterType;
    }

    // Determine orderBy object
    let orderBy: any = {};
    if (sortField === 'date_received') {
      orderBy = { date_received: sortOrder };
    } else if (sortField === 'list') {
      orderBy = { list: sortOrder };
    } else if (sortField === 'quantity') {
      orderBy = { quantity: sortOrder };
    } else if (sortField === 'po_code') {
      orderBy = { purchaseOrder: { po_code: sortOrder } };
    } else {
      orderBy = { createdAt: 'asc' };
    }

    const [entries, total] = await Promise.all([
      prisma.equipmentEntryList.findMany({
        where,
        include: {
          purchaseOrder: true,
          equipmentLists: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.equipmentEntryList.count({ where }),
    ]);

    return NextResponse.json({
      entries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit
    });
  } catch (error) {
    console.error("GET /api/equipment-entry-lists error:", error);
    return NextResponse.json({ error: "Failed to fetch equipment entry lists" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
      const { 
      purchase_id, 
      list, 
      brand_name, 
      quantity, 
      unit, 
      recipient, 
      date_received,
      item_type 
    } = body;

    if (!purchase_id) {
      return NextResponse.json({ error: "purchase_id is required" }, { status: 400 });
    }

    const entry = await prisma.$transaction(async (tx) => {
      const newEntry = await tx.equipmentEntryList.create({
        data: {
          purchase_id,
          list,
          brand_name,
          quantity: quantity || 0,
          unit,
          recipient,
          item_type: item_type || "MAIN",
          date_received: date_received ? new Date(date_received) : null,
        },
        include: {
          purchaseOrder: true,
        },
      });

      const eq_code = await generateEQCode();
      
      // Automatically create inventory record
      await tx.equipmentList.create({
        data: {
          eq_code,
          equipment_entry_id: newEntry.id,
          payout_amount: 0,
          remaining: newEntry.quantity,
          status: "In Stock",
        },
      });

      // Automatically update Purchase Order status
      await tx.equipmentPurchaseOrder.update({
        where: { id: purchase_id },
        data: { status: "RECEIVED" },
      });

      return newEntry;
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/equipment-entry-lists error:", error);
    return NextResponse.json({ error: "Failed to create equipment entry list" }, { status: 500 });
  }
}
