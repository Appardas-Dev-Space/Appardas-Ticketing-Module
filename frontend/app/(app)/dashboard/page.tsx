"use client";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Distribution } from "@/components/dashboard/distribution";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { TeamWorkload } from "@/components/dashboard/team-workload";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useActivityLogs,
  useMembers,
  useSprints,
  useTickets,
} from "@/lib/queries";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-2 pt-6">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-2 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: tickets = [], isLoading, isError, error } = useTickets();
  const { data: sprints = [] } = useSprints();
  const { data: members = [] } = useMembers();
  const { data: activities = [] } = useActivityLogs(15);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Project overview and recent team activity.
        </p>
      </div>

      {isError ? (
        <p className="py-12 text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load dashboard."}
        </p>
      ) : isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <KpiCards tickets={tickets} sprints={sprints} />
          <Distribution tickets={tickets} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TeamWorkload members={members} tickets={tickets} />
            <ActivityFeed activities={activities} members={members} />
          </div>
        </>
      )}
    </div>
  );
}
