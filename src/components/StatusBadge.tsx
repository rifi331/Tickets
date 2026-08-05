"use client";

import type { TaskStatus } from "@prisma/client";
import { STATUS_META } from "@/lib/utils";

export default function StatusBadge({
  status,
  size = "sm",
}: {
  status: TaskStatus;
  size?: "sm" | "xs";
}) {
  const meta = STATUS_META[status];
  const sizeCls =
    size === "xs"
      ? "px-1.5 py-0.5 text-[10px]"
      : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${meta.classes} ${sizeCls}`}
    >
      {meta.label}
    </span>
  );
}
