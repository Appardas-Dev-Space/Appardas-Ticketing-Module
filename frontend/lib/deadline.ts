import { differenceInHours, format, formatDistanceToNowStrict } from "date-fns";
import type { TicketStatus } from "./types";

export type DeadlineState = "overdue" | "due_soon" | "on_track" | "none";

const DUE_SOON_HOURS = 48;

/**
 * Classify a ticket's deadline relative to *now* (client-side, local time).
 *
 * - overdue:  deadline is in the past and the ticket is not done
 * - due_soon: deadline is within the next 48h (and not done)
 * - on_track: deadline is further out
 * - none:     no deadline set
 *
 * `now` is injectable for testing; defaults to the current instant.
 */
export function getDeadlineState(
  deadline: string | null | undefined,
  status: TicketStatus,
  now: Date = new Date()
): DeadlineState {
  if (!deadline) return "none";
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) return "none";
  if (status === "done") return "on_track";

  if (due.getTime() < now.getTime()) return "overdue";
  if (differenceInHours(due, now) <= DUE_SOON_HOURS) return "due_soon";
  return "on_track";
}

/**
 * Format a UTC ISO deadline in the browser's *local* timezone.
 * date-fns `format` operates on the local time of the Date object, so we never
 * surface raw UTC strings to users (see IMPLEMENTATION_PLAN §8).
 */
export function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return "No deadline";
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) return "No deadline";
  return format(due, "MMM d, yyyy 'at' h:mm a");
}

/** Short, relative label e.g. "in 3 hours" / "2 days ago". */
export function formatDeadlineRelative(
  deadline: string | null | undefined
): string | null {
  if (!deadline) return null;
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) return null;
  return formatDistanceToNowStrict(due, { addSuffix: true });
}

/**
 * Convert a value from an <input type="datetime-local"> (local wall-clock,
 * no timezone) into a UTC ISO 8601 string for storage.
 */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Convert a stored UTC ISO string into the `YYYY-MM-DDTHH:mm` shape a
 * <input type="datetime-local"> expects (rendered in local time).
 */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd'T'HH:mm");
}
