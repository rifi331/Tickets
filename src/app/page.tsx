import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import Workspace from "@/components/Workspace";
import { APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (!session.user) redirect("/login");

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

  return (
    <>
      <Workspace initialNotes={notes} user={session.user} />
      <div className="pointer-events-none fixed bottom-2 right-3 text-xs text-slate-400 select-none">
        Tickets {APP_VERSION}
      </div>
    </>
  );
}
