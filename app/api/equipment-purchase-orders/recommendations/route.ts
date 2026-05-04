import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    if (!search || search.length < 1) return NextResponse.json([]);

    const results: any[] = [];

    // 1. Fetch search-matched POs only (as requested by user)
    const matchingPOs = await prisma.equipmentPurchaseOrder.findMany({
      where: {
        list: { contains: search, mode: 'insensitive' }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        list: true,
        detail: true,
        picture: true,
        po_code: true
      },
      take: 100
    });

    matchingPOs.forEach(po => {
      results.push({
        id: po.id,
        name: po.list || "Unnamed",
        detail: po.detail || `PO: ${po.po_code || '-'}`,
        picture: po.picture || "",
        source: "Purchase Order"
      });
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET recommendations error:", error);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
