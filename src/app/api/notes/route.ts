import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/notes - list all notes for the sidebar, newest first.
export async function GET() {
  const notes = await prisma.note.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      assignee: true,
      status: true,
      startDate: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return json({ notes });
}

// POST /api/notes - create a new empty note.
export async function POST(req: NextRequest) {
  let title: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.title === "string" && body.title.trim()) {
      title = body.title.trim();
    }
  } catch {
    // ignore - default title used
  }

  const note = await prisma.note.create({
    data: { title: title ?? "Untitled Note" },
  });
  return json({ note }, { status: 201 });
}
