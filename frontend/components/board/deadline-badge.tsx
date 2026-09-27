"use client";

import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatDeadline,
  formatDeadlineRelative,
  getDeadlineState,
} from "@/lib/deadline";
import type { TicketStatus } from "@/lib/types";

interface DeadlineBadgeProps {
  deadline: string | null | undefined;
  status: TicketStatus;
  /** Show the absolute local date on hover / as full label. */
  showAbsolute?: boolean;
}

/**
 * Deadline indicator rendered in the browser's local timezone.
 *  - overdue  → red (critical)
 *  - due_soon → amber (warning)
 *  - on_track → neutral (secondary)
 */
export function DeadlineBadge({
  deadline,
  status,
  showAbsolute = false,
}: DeadlineBadgeProps) {
  const state = getDeadlineState(deadline, status);
  if (state === "none") return null;

  const variant =
    state === "overdue"
      ? "critical"
      : state === "due_soon"
        ? "warning"
        : "secondary";

  const label = showAbsolute
    ? formatDeadline(deadline)
    : (formatDeadlineRelative(deadline) ?? formatDeadline(deadline));

  return (
    <Badge
      variant={variant}
      className="gap-1 font-medium"
      title={formatDeadline(deadline)}
    >
      <Clock className="h-3 w-3" />
      {state === "overdue" && !showAbsolute ? `Overdue ${label}` : label}
    </Badge>
  );
}
