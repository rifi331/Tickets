"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TaskStatus } from "@prisma/client";
import type { NoteDetail, NoteSummary } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import NoteDetailPanel from "./NoteDetailPanel";

export default function Workspace({
  initialNotes,
  user,
}: {
  initialNotes: NoteSummary[];
  user: string;
}) {
  const [notes, setNotes] = useState<NoteSummary[]>(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialNotes[0]?.id ?? null
  );
  const [detail, setDetail] = useState<NoteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [creating, setCreating] = useState(false);

  // Re-sort notes by updatedAt desc whenever they change.
  const sortedNotes = useMemo(
    () =>
      [...notes].sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      ),
    [notes]
  );

  // Keep selection valid.
  useEffect(() => {
    if (selectedId && notes.some((n) => n.id === selectedId)) return;
    setSelectedId(sortedNotes[0]?.id ?? null);
  }, [notes, sortedNotes, selectedId]);

  // Fetch full detail whenever the selection changes.
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    (async () => {
      try {
        const res = await fetch(`/api/notes/${selectedId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { note: NoteDetail };
        if (!cancelled) setDetail(data.note);
      } catch (err) {
        console.error("Failed to load note:", err);
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const patchNoteInList = useCallback(
    (id: string, patch: Partial<NoteSummary>) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...patch } : n))
      );
    },
    []
  );

  const handleMetaChanged = useCallback(
    (patch: Partial<NoteDetail>) => {
      if (!selectedId || !detail) return;
      setDetail((d) => (d ? { ...d, ...patch } : d));
      patchNoteInList(selectedId, patch);
    },
    [selectedId, detail, patchNoteInList]
  );

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { note: NoteSummary };
      setNotes((prev) => [data.note, ...prev]);
      setSelectedId(data.note.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleted = useCallback(
    (deletedId: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== deletedId));
      if (selectedId === deletedId) {
        const remaining = sortedNotes.filter((n) => n.id !== deletedId);
        setSelectedId(remaining[0]?.id ?? null);
      }
    },
    [selectedId, sortedNotes]
  );

  const handleSidebarDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title || "Untitled Note"}"?`)) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      handleDeleted(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-12 shrink-0 bg-brand-700 text-white flex items-center justify-between px-4">
        <div className="flex items-center gap-2 font-semibold">
          <span className="h-6 w-6 rounded bg-white/20 grid place-items-center text-sm">
            T
          </span>
          Tickets
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-brand-100 hidden sm:inline">
            Signed in as <strong>{user}</strong>
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Two-column body */}
      <div className="flex-1 min-h-0 flex">
        {/* Sidebar */}
        <aside className="w-80 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-3 border-b border-slate-200">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="w-full rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 flex items-center justify-center gap-1"
            >
              <span className="text-base leading-none">+</span> New Note
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedNotes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center mt-8 px-4">
                No notes yet. Click <strong>+ New Note</strong> to begin.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sortedNotes.map((n) => (
                  <li key={n.id}>
                    <div
                      className={`group relative px-3 py-3 cursor-pointer hover:bg-white transition-colors ${
                        selectedId === n.id
                          ? "bg-white border-l-4 border-brand-600"
                          : "border-l-4 border-transparent"
                      }`}
                      onClick={() => setSelectedId(n.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {n.title || "Untitled Note"}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {n.assignee || "Unassigned"}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <StatusBadge status={n.status} size="xs" />
                            {n.dueDate && (
                              <span className="text-[11px] text-slate-400">
                                due{" "}
                                {new Date(n.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          title="Delete note"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleSidebarDelete(n.id, n.title);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.75 1A2.75 2.75 0 0 0 6 3.75H3.5a.75.75 0 0 0 0 1.5h13a.75.75 0 0 0 0-1.5H14A2.75 2.75 0 0 0 11.25 1h-2.5ZM7.5 3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25H7.5ZM5.5 7a.75.75 0 0 1 .75.75v8.5c0 .14.11.25.25.25h7c.14 0 .25-.11.25-.25v-8.5a.75.75 0 0 1 1.5 0v8.5A1.75 1.75 0 0 1 13.5 18h-7A1.75 1.75 0 0 1 4.75 16.25v-8.5A.75.75 0 0 1 5.5 7Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 min-w-0 min-h-0">
          {selectedId && detail ? (
            <NoteDetailPanel
              key={detail.id}
              note={detail}
              onDeleted={handleDeleted}
              onMetaChanged={handleMetaChanged}
            />
          ) : selectedId && loadingDetail ? (
            <div className="h-full grid place-items-center text-slate-400">
              Loading…
            </div>
          ) : (
            <EmptyState onCreate={handleCreate} creating={creating} />
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState({
  onCreate,
  creating,
}: {
  onCreate: () => void;
  creating: boolean;
}) {
  return (
    <div className="h-full grid place-items-center text-center px-6">
      <div>
        <div className="h-14 w-14 rounded-2xl bg-brand-100 text-brand-700 grid place-items-center text-2xl font-bold mx-auto">
          T
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-800">
          No note selected
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Create a new task note to capture details, assignees, due dates, and
          paste screenshots directly into the editor.
        </p>
        <button
          type="button"
          onClick={onCreate}
          disabled={creating}
          className="mt-4 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2"
        >
          + New Note
        </button>
      </div>
    </div>
  );
}
