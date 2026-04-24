import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const authUserId = (session.user as any)?.id;
  const role = (session.user as any)?.role;
  const { searchParams } = new URL(request.url);
  const adminView = searchParams.get("adminView") === "true";

  try {
    let whereClause: any = {};
    
    if (adminView && role === "admin") {
      // Management view: see everything
      whereClause = {};
    } else if (role !== "admin") {
      whereClause.userId = authUserId;
    } else {
      // Regular admin view: see global notifications (userId=null) or ones specifically for them
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

// Create notification (Admin only)
export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, message, type, userId, link } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || "INFO",
        userId: userId || null,
        link: link || null,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
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

// Bulk delete (Admin only)
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid IDs provided" }, { status: 400 });
    }

    await prisma.notification.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notifications bulk error:", error);
    return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });
  }
}
