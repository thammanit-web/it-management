import { z } from "zod";

export const itNoteDetailSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Value is required"),
  order: z.number().default(0),
});

export const itNoteSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  isPrivate: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  content: z.string().optional(),
  attachment: z.string().optional().nullable(),
  details: z.array(itNoteDetailSchema).default([]),
});

export type ItNoteFormValues = z.infer<typeof itNoteSchema>;
export type ItNoteDetailFormValues = z.infer<typeof itNoteDetailSchema>;
