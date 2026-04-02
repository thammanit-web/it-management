import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    const comments = await prisma.comment.findMany({
      where: { requestId: id },
      include: {
        user: {
          select: { username: true, role: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(comments);
  } catch (err) {
    console.error("GET comments error:", err);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    const { content, parentId } = await req.json();
    if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });

    const comment = await prisma.comment.create({
      data: {
        content,
        requestId: id,
        userId: (session.user as any).id,
        parentId: parentId || null
      },
      include: {
        user: {
          select: { username: true, role: true }
        }
      }
    });

    return NextResponse.json(comment);
  } catch (err) {
    console.error("POST comment error:", err);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
