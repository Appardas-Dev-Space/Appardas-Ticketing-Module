"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_STATUSES,
  type Ticket,
} from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  backlog: "bg-slate-400",
  todo: "bg-blue-400",
  in_progress: "bg-amber-400",
  in_review: "bg-violet-400",
  done: "bg-emerald-500",
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-400",
  high: "bg-amber-500",
  critical: "bg-red-600",
};

interface Row {
  key: string;
  label: string;
  count: number;
  color: string;
}

function Bars({ rows, total }: { rows: Row[]; total: number }) {
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
        return (
          <div key={r.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>{r.label}</span>
              <span className="text-muted-foreground">{r.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", r.color)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Distribution({ tickets }: { tickets: Ticket[] }) {
  const total = tickets.length;

  const statusRows: Row[] = TICKET_STATUSES.map((s) => ({
    key: s,
    label: STATUS_LABELS[s],
    count: tickets.filter((t) => t.status === s).length,
    color: STATUS_COLOR[s],
  }));

  const priorityRows: Row[] = PRIORITIES.map((p) => ({
    key: p,
    label: PRIORITY_LABELS[p],
    count: tickets.filter((t) => t.priority === p).length,
    color: PRIORITY_COLOR[p],
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tickets by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets yet.</p>
          ) : (
            <Bars rows={statusRows} total={total} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tickets by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets yet.</p>
          ) : (
            <Bars rows={priorityRows} total={total} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
