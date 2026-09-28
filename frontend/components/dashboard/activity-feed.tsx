"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  STATUS_LABELS,
  type ActivityLog,
  type Member,
  type TicketStatus,
} from "@/lib/types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function actorName(a: ActivityLog): string {
  return a.actor?.displayName || a.actor?.username || "Someone";
}

/** Human-readable action phrase (actor rendered separately). */
function describe(a: ActivityLog, memberById: Map<string, Member>): string {
  const title = a.ticket?.title ? `“${a.ticket.title}”` : "a ticket";
  switch (a.action) {
    case "created":
      return `created ${title}`;
    case "status_changed":
      return `moved ${title} to ${STATUS_LABELS[a.toValue as TicketStatus] ?? a.toValue}`;
    case "priority_changed":
      return `set ${title} priority to ${a.toValue}`;
    case "deadline_changed":
      return `updated the deadline on ${title}`;
    case "assigned": {
      if (!a.toValue) return `unassigned ${title}`;
      const m = memberById.get(a.toValue);
      const name = m?.displayName || m?.username || "a member";
      return `assigned ${title} to ${name}`;
    }
    default:
      return `${a.action} ${title}`;
  }
}

interface ActivityFeedProps {
  activities: ActivityLog[];
  members: Member[];
}

export function ActivityFeed({ activities, members }: ActivityFeedProps) {
  const memberById = React.useMemo(() => {
    const map = new Map<string, Member>();
    for (const m of members) map.set(String(m.id), m);
    return map;
  }, [members]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ol className="space-y-4">
            {activities.map((a) => {
              const name = actorName(a);
              return (
                <li key={a.documentId} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px]">
                      {initials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{name}</span>{" "}
                      <span className="text-muted-foreground">
                        {describe(a, memberById)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
