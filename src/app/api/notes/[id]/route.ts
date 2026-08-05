import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  errorJson,
  isTaskStatus,
  json,
  parseDate,
  extractReferencedImageIds,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

// GET /api/notes/[id] - fetch a single note with its image list.
export async function GET(_req: NextRequest, { params }: Params) {
  const note = await prisma.note.findUnique({
    where: { id: params.id },
    include: {
      images: {
        select: { id: true, mimeType: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!note) return errorJson("Note not found.", 404);
  return json({ note });
}

// PATCH /api/notes/[id] - update editable fields.
export async function PATCH(req: NextRequest, { params }: Params) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return errorJson("Invalid JSON body.", 400);
  }

  const data: Record<string, unknown> = {};

  if ("title" in body) {
    if (typeof body.title !== "string") {
      return errorJson("title must be a string.", 400);
    }
    data.title = body.title.trim().slice(0, 200) || "Untitled Note";
  }
  if ("assignee" in body) {
    if (body.assignee !== null && typeof body.assignee !== "string") {
      return errorJson("assignee must be a string or null.", 400);
    }
    data.assignee =
      body.assignee === null ? null : (body.assignee as string).slice(0, 120);
  }
  if ("status" in body) {
    if (!isTaskStatus(body.status)) {
      return errorJson("status must be OPEN, IN_PROGRESS, or DONE.", 400);
    }
    data.status = body.status;
  }
  if ("startDate" in body) {
    const d = parseDate(body.startDate as string | null);
    data.startDate = d;
  }
  if ("dueDate" in body) {
    const d = parseDate(body.dueDate as string | null);
    data.dueDate = d;
  }
  if ("content" in body) {
    if (typeof body.content !== "string" && body.content !== null) {
      return errorJson("content must be a string or null.", 400);
    }
    data.content = body.content;
  }

  if (Object.keys(data).length === 0) {
    return errorJson("No valid fields to update.", 400);
  }

  // When content changes, garbage-collect NoteImage rows that are no longer
  // referenced by the note's HTML. This prevents DB/storage bloat from images
  // that were pasted in and later deleted in the editor.
  const contentChanged = "content" in data;

  try {
    const note = await prisma.$transaction(async (tx) => {
      const updated = await tx.note.update({
        where: { id: params.id },
        data,
        include: {
          images: {
            select: { id: true, mimeType: true, createdAt: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (contentChanged) {
        const referenced = extractReferencedImageIds(
          typeof updated.content === "string" ? updated.content : null
        );
        // Delete image rows belonging to this note that aren't referenced.
        const orphans = updated.images.filter(
          (img) => !referenced.has(img.id.toLowerCase())
        );
        if (orphans.length > 0) {
          await tx.noteImage.deleteMany({
            where: { id: { in: orphans.map((o) => o.id) } },
          });
          // Reflect the cleanup in the returned note payload.
          const orphanIds = new Set(orphans.map((o) => o.id));
          updated.images = updated.images.filter(
            (img) => !orphanIds.has(img.id)
          );
        }
      }

      return updated;
    });
    return json({ note });
  } catch {
    return errorJson("Note not found.", 404);
  }
}

// DELETE /api/notes/[id] - delete a note; cascades to NoteImage rows.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await prisma.note.delete({ where: { id: params.id } });
    return json({ ok: true });
  } catch {
    return errorJson("Note not found.", 404);
  }
}
