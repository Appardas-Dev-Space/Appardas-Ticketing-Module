import { getDeadlineState } from "./deadline";
import type { Ticket } from "./types";

export interface Workload {
  total: number;
  inProgress: number;
  overdue: number;
}

export const EMPTY_WORKLOAD: Workload = { total: 0, inProgress: 0, overdue: 0 };

/** Aggregate per-assignee workload counts from the tickets cache. */
export function computeWorkload(tickets: Ticket[]): Map<number, Workload> {
  const map = new Map<number, Workload>();
  for (const t of tickets) {
    const id = t.assignee?.id;
    if (id == null) continue;
    const w = map.get(id) ?? { total: 0, inProgress: 0, overdue: 0 };
    w.total += 1;
    if (t.status === "in_progress") w.inProgress += 1;
    if (getDeadlineState(t.deadline, t.status) === "overdue") w.overdue += 1;
    map.set(id, w);
  }
  return map;
}
