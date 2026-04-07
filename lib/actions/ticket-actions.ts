"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getPendingTicketsCount() {
  const session = await auth();
  if (!(session?.user as any)?.id || (session?.user as any)?.role !== "admin") {
    return 0;
  }

  try {
    const [ticketCount, eqCount] = await Promise.all([
      prisma.request.count({
        where: {
          OR: [
            { it_approval_status: "PENDING" },
            { it_approval_status: null },
            { it_approval_status: "" }
          ]
        },
      }),
      prisma.equipmentBorrowGroup.count({
        where: {
          OR: [
            { it_approval_status: "PENDING" },
            { it_approval_status: null },
            { it_approval_status: "" }
          ]
        }
      })
    ]);
    return ticketCount + eqCount;
  } catch (error) {
    console.error("Error fetching pending count:", error);
    return 0;
  }
}
