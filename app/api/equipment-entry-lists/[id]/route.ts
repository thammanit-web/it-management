import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await prisma.equipmentEntryList.findUnique({
      where: { id: id },
      include: {
        purchaseOrder: true,
        equipmentLists: true,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Equipment entry list not found" }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("GET /api/equipment-entry-lists/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const entry = await prisma.equipmentEntryList.update({
      where: { id: id },
      data: {
        purchase_id,
        list,
        brand_name,
        quantity,
        unit,
        recipient,
        item_type,
        date_received: date_received ? new Date(date_received) : undefined,
      },
      include: {
        purchaseOrder: true,
      },
    });

    

    return NextResponse.json(entry);
  } catch (error) {
    console.error("PATCH /api/equipment-entry-lists/[id] error:", error);
    return NextResponse.json({ error: "Failed to update equipment entry list" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.equipmentEntryList.delete({
      where: { id: id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/equipment-entry-lists/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete equipment entry list" }, { status: 500 });
  }
}
