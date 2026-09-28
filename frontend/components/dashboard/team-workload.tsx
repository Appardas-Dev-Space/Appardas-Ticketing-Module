"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeWorkload, EMPTY_WORKLOAD } from "@/lib/workload";
import type { Member, Ticket } from "@/lib/types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface TeamWorkloadProps {
  members: Member[];
  tickets: Ticket[];
}

export function TeamWorkload({ members, tickets }: TeamWorkloadProps) {
  const workload = React.useMemo(() => computeWorkload(tickets), [tickets]);

  const rows = React.useMemo(
    () =>
      members
        .map((m) => ({ member: m, w: workload.get(m.id) ?? EMPTY_WORKLOAD }))
        .sort((a, b) => b.w.total - a.w.total),
    [members, workload]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team Workload</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <ul className="divide-y">
            {rows.map(({ member, w }) => {
              const name = member.displayName || member.username;
              return (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      {member.avatar?.url ? (
                        <AvatarImage src={member.avatar.url} alt={name} />
                      ) : null}
                      <AvatarFallback className="text-[10px]">
                        {initials(name || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm">{name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant="secondary">{w.total} total</Badge>
                    {w.inProgress > 0 && (
                      <Badge variant="default">{w.inProgress} active</Badge>
                    )}
                    {w.overdue > 0 && (
                      <Badge variant="critical">{w.overdue} overdue</Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
