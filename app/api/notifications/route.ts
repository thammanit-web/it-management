import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const authUserId = (session.user as any)?.id;
  const role = (session.user as any)?.role;

  // We only permit admins to view these notifications unless userId matches
  try {
    const whereClause: any = {};
    if (role !== "admin") {
      whereClause.userId = authUserId;
    } else {
      // Admins can see global notifications (userId=null) or ones specifically for them
      whereClause.OR = [
        { userId: null },
        { userId: authUserId }
      ];
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { ...whereClause, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// Mark all as read
export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const authUserId = (session.user as any)?.id;
  const role = (session.user as any)?.role;

  try {
    const whereClause: any = {};
    if (role !== "admin") {
      whereClause.userId = authUserId;
    } else {
      whereClause.OR = [
        { userId: null },
        { userId: authUserId }
      ];
    }

    await prisma.notification.updateMany({
      where: { ...whereClause, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
