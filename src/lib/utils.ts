import { NextResponse } from "next/server";
import type { TaskStatus } from "@prisma/client";

export const TASK_STATUSES: TaskStatus[] = ["OPEN", "IN_PROGRESS", "DONE"];

export const STATUS_META: Record<
  TaskStatus,
  { label: string; classes: string }
> = {
  OPEN: {
    label: "Open",
    classes: "bg-blue-100 text-blue-800 ring-blue-600/20",
  },
  IN_PROGRESS: {
    label: "In Progress",
    classes: "bg-amber-100 text-amber-800 ring-amber-600/20",
  },
  DONE: {
    label: "Done",
    classes: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  },
};

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorJson(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    (TASK_STATUSES as string[]).includes(value)
  );
}

/** Parse a possibly-empty date input into a Date or null. */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** Convert a Date (or null) to an ISO string suitable for <input type="date">. */
export function toDateInputValue(d: Date | null): string {
  if (!d) return "";
  // Use the local date portion only (YYYY-MM-DD).
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
