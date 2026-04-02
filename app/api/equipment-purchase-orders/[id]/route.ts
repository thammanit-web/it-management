import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const order = await prisma.equipmentPurchaseOrder.findUnique({
      where: { id: id },
      include: {
        entries: {
          include: {
            equipmentLists: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET /api/equipment-purchase-orders/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { 
      list, 
      detail, 
      quantity, 
      reason_order, 
      picture, 
      buyer, 
      reviewer, 
      status,
      approver, 
      date_order 
    } = body;

    // Fetch original order to check for old picture
    const originalOrder = await prisma.equipmentPurchaseOrder.findUnique({
      where: { id: id },
      select: { picture: true }
    });

    // If picture has changed and old one exists, delete it
    if (originalOrder?.picture && originalOrder.picture !== picture) {
      try {
        await del(originalOrder.picture);
      } catch (blobError) {
        console.error("Failed to delete old blob:", blobError);
        // Continue even if blob deletion fails
      }
    }

    const order = await prisma.equipmentPurchaseOrder.update({
      where: { id: id },
      data: {
        list,
        detail,
        quantity,
        reason_order,
        picture,
        buyer,
        reviewer,
        status,
        approver,
        date_order: date_order ? new Date(date_order) : undefined,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("PATCH /api/equipment-purchase-orders/[id] error:", error);
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Fetch order to check for picture
    const order = await prisma.equipmentPurchaseOrder.findUnique({
      where: { id: id },
      select: { picture: true }
    });

    // Delete associated picture from Vercel Blob if exists
    if (order?.picture) {
      try {
        await del(order.picture);
      } catch (blobError) {
        console.error("Failed to delete blob during order deletion:", blobError);
      }
    }

    await prisma.equipmentPurchaseOrder.delete({
      where: { id: id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/equipment-purchase-orders/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete purchase order" }, { status: 500 });
  }
}
