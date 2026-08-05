// Shared client/server type for a note summary shown in the sidebar and used
// as the initial list payload. Kept free of Prisma-generated types so it can
// cross the server/client boundary safely.
import type { TaskStatus } from "@prisma/client";

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
