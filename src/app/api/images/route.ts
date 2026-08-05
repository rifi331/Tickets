import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per image

// POST /api/images?noteId=... - upload a single image as raw binary body.
// Returns { id, url, mimeType }.
export async function POST(req: NextRequest) {
  const noteId = req.nextUrl.searchParams.get("noteId");
  if (!noteId) {
    return errorJson("Missing noteId query parameter.", 400);
  }

  const contentType = (req.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!ALLOWED_MIME.has(contentType)) {
    return errorJson(`Unsupported image type: ${contentType || "unknown"}`, 415);
  }

  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length === 0) {
    return errorJson("Empty image payload.", 400);
  }
  if (buf.length > MAX_BYTES) {
    return errorJson("Image exceeds the 10 MB limit.", 413);
  }

  // Verify the note exists before storing.
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true },
  });
  if (!note) return errorJson("Note not found.", 404);

  const image = await prisma.noteImage.create({
    data: { noteId, mimeType: contentType, data: buf },
    select: { id: true, mimeType: true },
  });

  return json(
    {
      id: image.id,
      url: `/api/images/${image.id}`,
      mimeType: image.mimeType,
    },
    { status: 201 }
  );
}
