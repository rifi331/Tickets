"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TaskStatus } from "@prisma/client";
import type { NoteDetail } from "@/lib/types";
import {
  TASK_STATUSES,
  STATUS_META,
  toDateInputValue,
} from "@/lib/utils";
import RichTextEditor from "./RichTextEditor";

export default function NoteDetailPanel({
  note,
  onDeleted,
  onMetaChanged,
}: {
  note: NoteDetail;
  onDeleted: (id: string) => void;
  onMetaChanged: (patch: Partial<NoteDetail>) => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [assignee, setAssignee] = useState(note.assignee ?? "");
  const [status, setStatus] = useState<TaskStatus>(note.status);
  const [startDate, setStartDate] = useState(toDateInputValue(note.startDate));
  const [dueDate, setDueDate] = useState(toDateInputValue(note.dueDate));
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset local field state whenever a different note is selected.
  useEffect(() => {
    setTitle(note.title);
    setAssignee(note.assignee ?? "");
    setStatus(note.status);
    setStartDate(toDateInputValue(note.startDate));
    setDueDate(toDateInputValue(note.dueDate));
    setSaveError(null);
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced autosave for metadata fields.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title, assignee, status, startDate, dueDate });
  latest.current = { title, assignee, status, startDate, dueDate };

  const persistMeta = useCallback(
    async (id: string, fields: Record<string, unknown>) => {
      setSaving(true);
      setSaveError(null);
      try {
        const res = await fetch(`/api/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error || `HTTP ${res.status}`);
        }
        const { note: updated } = (await res.json()) as { note: NoteDetail };
        setLastSaved(new Date());
        onMetaChanged({
          title: updated.title,
          assignee: updated.assignee,
          status: updated.status,
          startDate: updated.startDate,
          dueDate: updated.dueDate,
          updatedAt: updated.updatedAt,
        });
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [onMetaChanged]
  );

  const scheduleMetaSave = useCallback(
    (fields: Record<string, unknown>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persistMeta(note.id, fields);
      }, 600);
    },
    [note.id, persistMeta]
  );

  // Save metadata on blur for immediate fields (title, assignee, dates).
  const handleBlurSave = () => {
    const f = latest.current;
    scheduleMetaSave({
      title: f.title,
      assignee: f.assignee.trim() || null,
      status: f.status,
      startDate: f.startDate || null,
      dueDate: f.dueDate || null,
    });
  };

  // Status changes save immediately.
  const changeStatus = (next: TaskStatus) => {
    setStatus(next);
    void persistMeta(note.id, { status: next });
  };

  // Content (rich text) autosave, debounced.
  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleContentUpdate = useCallback(
    (html: string) => {
      if (contentTimer.current) clearTimeout(contentTimer.current);
      contentTimer.current = setTimeout(async () => {
        setSaving(true);
        setSaveError(null);
        try {
          const res = await fetch(`/api/notes/${note.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: html }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            throw new Error(d?.error || `HTTP ${res.status}`);
          }
          const { note: updated } = (await res.json()) as { note: NoteDetail };
          setLastSaved(new Date());
          onMetaChanged({ updatedAt: updated.updatedAt });
        } catch (err) {
          setSaveError(err instanceof Error ? err.message : "Save failed");
        } finally {
          setSaving(false);
        }
      }, 800);
    },
    [note.id, onMetaChanged]
  );

  // Manual Save button — flush pending content + metadata.
  const handleSaveNow = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (contentTimer.current) {
      clearTimeout(contentTimer.current);
      contentTimer.current = null;
    }
    const f = latest.current;
    void persistMeta(note.id, {
      title: f.title,
      assignee: f.assignee.trim() || null,
      status: f.status,
      startDate: f.startDate || null,
      dueDate: f.dueDate || null,
    });
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete "${note.title || "Untitled Note"}"? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || `HTTP ${res.status}`);
      }
      onDeleted(note.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <section className="flex flex-col h-full bg-white">
      {/* Header / metadata */}
      <div className="px-6 pt-5 pb-3 border-b border-slate-200">
        <div className="flex items-start gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlurSave}
            placeholder="Note title"
            className="flex-1 text-2xl font-semibold text-slate-900 placeholder-slate-300 bg-transparent border-0 outline-none focus:ring-0 px-0"
          />
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 h-5 flex items-center">
              {saving
                ? "Saving…"
                : saveError
                ? "Error"
                : lastSaved
                ? `Saved ${lastSaved.toLocaleTimeString()}`
                : ""}
            </span>
            <button
              type="button"
              onClick={handleSaveNow}
              className="rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-1.5"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleDelete}
              title="Delete note"
              className="rounded-md bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-600 text-sm px-3 py-1.5"
            >
              Delete
            </button>
          </div>
        </div>

        {saveError && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
            {saveError}
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Assignee">
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              onBlur={handleBlurSave}
              placeholder="Unassigned"
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 outline-none"
            />
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => changeStatus(e.target.value as TaskStatus)}
              className={`w-full rounded-md border px-2.5 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/30 border-slate-300`}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start date">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onBlur={handleBlurSave}
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 outline-none"
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onBlur={handleBlurSave}
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 outline-none"
            />
          </Field>
        </div>
      </div>

      {/* Rich-text content editor */}
      <div className="flex-1 overflow-auto">
        <RichTextEditor
          key={note.id}
          noteId={note.id}
          initialContent={note.content ?? ""}
          onUpdate={handleContentUpdate}
        />
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
