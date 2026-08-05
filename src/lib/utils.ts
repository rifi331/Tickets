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

/**
 * Coerce a value that may be a Date, an ISO string, or null/undefined into a
 * Date | null. fetch().json() deserializes dates to ISO strings, so any data
 * crossing a fetch boundary must be normalized before calling Date methods.
 */
export function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Convert a Date (or ISO string, or null) to YYYY-MM-DD for <input type="date">. */
export function toDateInputValue(
  d: Date | string | null | undefined
): string {
  const date = toDate(d);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
