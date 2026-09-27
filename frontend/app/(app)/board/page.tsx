"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/board/kanban-board";
import {
  DEFAULT_FILTERS,
  FilterBar,
  type BoardFilters,
} from "@/components/board/filter-bar";
import { TicketFormDialog } from "@/components/board/ticket-form-dialog";
import { useMembers, useSprints, useTickets } from "@/lib/queries";
import { useSession } from "@/lib/use-session";
import { getDeadlineState } from "@/lib/deadline";
import { isManager, type Ticket } from "@/lib/types";

function applyFilters(tickets: Ticket[], filters: BoardFilters): Ticket[] {
  return tickets.filter((t) => {
    if (filters.assignee !== "all") {
      if (filters.assignee === "unassigned") {
        if (t.assignee) return false;
      } else if (String(t.assignee?.id) !== filters.assignee) {
        return false;
      }
    }
    if (filters.priority !== "all" && t.priority !== filters.priority)
      return false;
    if (filters.type !== "all" && t.type !== filters.type) return false;
    if (filters.overdueOnly && getDeadlineState(t.deadline, t.status) !== "overdue")
      return false;
    return true;
  });
}

export default function BoardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: tickets, isLoading, isError, error } = useTickets();
  const { data: members = [] } = useMembers();
  const { data: sprints = [] } = useSprints();

  const [filters, setFilters] = React.useState<BoardFilters>(DEFAULT_FILTERS);
  const [createOpen, setCreateOpen] = React.useState(false);

  const manager = isManager(session);

  const filtered = React.useMemo(
    () => applyFilters(tickets ?? [], filters),
    [tickets, filters]
  );

  const openTicket = React.useCallback(
    (documentId: string) => router.push(`/tickets/${documentId}`),
    [router]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Board</h1>
        {manager && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New ticket
          </Button>
        )}
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        members={members}
        currentUserId={session?.id}
      />

      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading board…
        </p>
      )}
      {isError && (
        <p className="py-12 text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load tickets."}
        </p>
      )}
      {!isLoading && !isError && (
        <KanbanBoard
          tickets={filtered}
          user={session}
          onOpenTicket={openTicket}
        />
      )}

      {manager && (
        <TicketFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          members={members}
          sprints={sprints}
        />
      )}
    </div>
  );
}
