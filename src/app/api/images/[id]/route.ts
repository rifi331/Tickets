import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

// GET /api/images/[id] - stream a stored NoteImage blob back to the client.
export async function GET(_req: NextRequest, { params }: Params) {
  const image = await prisma.noteImage.findUnique({
    where: { id: params.id },
    select: { mimeType: true, data: true },
  });
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(image.data, {
    status: 200,
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
