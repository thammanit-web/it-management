import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // 1. Fetch most recent purchase orders by name
    const recentPOs = await prisma.equipmentPurchaseOrder.findMany({
      where: {
        list: { contains: search, mode: 'insensitive' }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        list: true,
        detail: true,
        picture: true,
      },
      take: 100
    });

    // 2. Clear duplicates, keep only unique and most recent
    const recommendationsMap = new Map();
    recentPOs.forEach(po => {
      if (po.list && !recommendationsMap.has(po.list)) {
        recommendationsMap.set(po.list, {
          name: po.list,
          detail: po.detail || "",
          picture: po.picture || ""
        });
      }
    });

    // 3. (Optional) Could also pull from inventory entries
    const inventoryEntries = await prisma.equipmentEntryList.findMany({
        where: {
            list: { contains: search, mode: 'insensitive' }
        },
        orderBy: { createdAt: 'desc' },
        select: {
            list: true,
        },
        take: 50
    });
    
    inventoryEntries.forEach(entry => {
        if (entry.list && !recommendationsMap.has(entry.list)) {
            recommendationsMap.set(entry.list, {
                name: entry.list,
                detail: "",
                picture: ""
            });
        }
    });

    const result = Array.from(recommendationsMap.values());

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET recommendations error:", error);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
