"use client";

import { differenceInCalendarDays } from "date-fns";
import { CheckCircle2, CircleDot, Flag, AlertTriangle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getDeadlineState } from "@/lib/deadline";
import { cn } from "@/lib/utils";
import type { Sprint, Ticket } from "@/lib/types";

interface KpiCardsProps {
  tickets: Ticket[];
  sprints: Sprint[];
}

function activeSprintSummary(sprints: Sprint[]) {
  const active = sprints.find((s) => s.status === "active");
  if (!active) return { name: "No active sprint", sub: "—" };
  if (!active.endDate) return { name: active.name, sub: "No end date" };
  const days = differenceInCalendarDays(new Date(active.endDate), new Date());
  const sub =
    days > 0
      ? `${days} day${days === 1 ? "" : "s"} left`
      : days === 0
        ? "Ends today"
        : `${Math.abs(days)} day${days === -1 ? "" : "s"} over`;
  return { name: active.name, sub };
}

export function KpiCards({ tickets, sprints }: KpiCardsProps) {
  const open = tickets.filter((t) => t.status !== "done").length;
  const completed = tickets.filter((t) => t.status === "done").length;
  const overdue = tickets.filter(
    (t) => getDeadlineState(t.deadline, t.status) === "overdue"
  ).length;
  const sprint = activeSprintSummary(sprints);

  const cards = [
    {
      label: "Open Tickets",
      value: String(open),
      sub: "Not yet done",
      icon: CircleDot,
      accent: "text-blue-600",
    },
    {
      label: "Completed",
      value: String(completed),
      sub: "Marked done",
      icon: CheckCircle2,
      accent: "text-emerald-600",
    },
    {
      label: "Overdue",
      value: String(overdue),
      sub: "Past deadline",
      icon: AlertTriangle,
      accent: "text-red-600",
      critical: overdue > 0,
    },
    {
      label: "Active Sprint",
      value: sprint.name,
      sub: sprint.sub,
      icon: Flag,
      accent: "text-violet-600",
      small: true,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.label}
            className={cn(c.critical && "border-red-300 bg-red-50/50")}
          >
            <CardContent className="flex items-start justify-between gap-2 pt-6">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {c.label}
                </p>
                <p
                  className={cn(
                    "mt-1 truncate font-semibold",
                    c.small ? "text-lg" : "text-3xl"
                  )}
                  title={c.value}
                >
                  {c.value}
                </p>
                <p className="text-xs text-muted-foreground">{c.sub}</p>
              </div>
              <Icon className={cn("h-5 w-5 shrink-0", c.accent)} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
