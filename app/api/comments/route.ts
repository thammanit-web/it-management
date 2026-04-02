import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const comments = await prisma.comment.findMany({
      include: {
        request: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET /api/comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { 
      content, 
      requestId, 
      userId, 
      parentId 
    } = body;

    const finalUserId = userId || session?.user?.id;

    if (!content || !requestId || !finalUserId) {
      return NextResponse.json({ error: "Content, requestId, and userId are required" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        requestId,
        userId: finalUserId,
        parentId,
      },
      include: {
        request: true,
        user: true,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
