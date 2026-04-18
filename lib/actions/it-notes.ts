"use server";

import { itNoteSchema } from "@/lib/validations/it-note";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { del } from "@vercel/blob";

export async function createItNote(data: z.infer<typeof itNoteSchema>) {
  const session = await auth();
  if (!(session?.user as any)?.id) throw new Error("Unauthorized");

  const validated = itNoteSchema.parse(data);

  const result = await prisma.itNote.create({
    data: {
      title: validated.title,
      isPrivate: validated.isPrivate,
      isPublished: validated.isPublished,
      content: validated.content,
      attachment: validated.attachment,
      userId: (session?.user as any).id as string,
      details: {
        create: validated.details.map((d, index) => ({
          label: d.label,
          value: d.value,
          order: index,
        })),
      },
    },
    include: {
      details: true,
    },
  });

  revalidatePath("/user/notes");
  revalidatePath("/");
  return { success: true, data: result };
}

export async function updateItNote(id: string, data: z.infer<typeof itNoteSchema>) {
  const session = await auth();
  if (!(session?.user as any)?.id) throw new Error("Unauthorized");

  const validated = itNoteSchema.parse(data);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.itNote.findUnique({ where: { id } });
    if (!existing) throw new Error("Note not found");

    // Delete details
    await tx.itNoteDetail.deleteMany({ where: { noteId: id } });

    // Update Note and create new details
    return await tx.itNote.update({
      where: { id },
      data: {
        title: validated.title,
        isPrivate: validated.isPrivate,
        isPublished: validated.isPublished,
        content: validated.content,
        attachment: validated.attachment,
        details: {
          create: validated.details.map((d, index) => ({
            label: d.label,
            value: d.value,
            order: index,
          })),
        },
      },
      include: {
        details: true,
      },
    });
  });

  revalidatePath("/user/notes");
  revalidatePath("/");
  return { success: true, data: result };
}

export async function deleteItNote(id: string) {
  const session = await auth();
  if (!(session?.user as any)?.id) throw new Error("Unauthorized");

  // Fetch the note first to see if it has an attachment
  const note = await prisma.itNote.findUnique({
    where: { id },
    select: { attachment: true }
  });

  if (note?.attachment) {
    try {
      await del(note.attachment);
    } catch (error) {
      console.error("Failed to delete attachment blob:", error);
      // We continue with note deletion even if blob deletion fails
    }
  }

  await prisma.itNote.delete({
    where: { id },
  });

  revalidatePath("/user/notes");
  revalidatePath("/");
  return { success: true };
}

export async function getItNotes(query?: string) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "admin";

  const where: any = {};
  
  if (!isAdmin) {
    where.isPrivate = false;
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { content: { contains: query, mode: "insensitive" } },
      {
        details: {
          some: {
            OR: [
              { label: { contains: query, mode: "insensitive" } },
              { value: { contains: query, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  return await prisma.itNote.findMany({
    where,
    include: {
      details: {
        orderBy: { order: "asc" },
      },
      user: {
        select: {
          username: true,
          role: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Get published notes for Public Directory
 * Simplified: just pulls all isPublished notes
 */
export async function getPublishedNotes() {
  const where: any = {
    isPublished: true,
    isPrivate: false,
  };

  return await prisma.itNote.findMany({
    where,
    include: {
      details: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getItNoteById(id: string) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "admin";

  const note = await prisma.itNote.findUnique({
    where: { id },
    include: {
      details: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!note) return null;
  if (note.isPrivate && !isAdmin) return null;

  return note;
}
