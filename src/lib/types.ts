// Shared client/server type for a note summary shown in the sidebar and used
// as the initial list payload. Kept free of Prisma-generated types so it can
// cross the server/client boundary safely.
import type { TaskStatus } from "@prisma/client";
import { toDate } from "./utils";

export type NoteSummary = {
  id: string;
  title: string;
  assignee: string | null;
  status: TaskStatus;
  startDate: Date | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NoteImageRef = {
  id: string;
  mimeType: string;
  createdAt: Date;
};

export type NoteDetail = NoteSummary & {
  content: string | null;
  images: NoteImageRef[];
};

/**
 * Normalize a note returned by fetch().json(): dates arrive as ISO strings and
 * must be coerced to Date (or null) before any Date method is called on the
 * client, otherwise calls like getFullYear() throw.
 */
export function normalizeNote<T extends NoteSummary>(n: T): T {
  return {
    ...n,
    startDate: toDate(n.startDate),
    dueDate: toDate(n.dueDate),
    createdAt: toDate(n.createdAt) ?? new Date(0),
    updatedAt: toDate(n.updatedAt) ?? new Date(0),
  };
}

export function normalizeNoteDetail(n: NoteDetail): NoteDetail {
  return {
    ...normalizeNote(n),
    images: (n.images ?? []).map((img) => ({
      ...img,
      createdAt: toDate(img.createdAt) ?? new Date(0),
    })),
  };
}
