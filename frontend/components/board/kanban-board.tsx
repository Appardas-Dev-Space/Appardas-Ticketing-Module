"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { generateKeyBetween } from "fractional-indexing";
import { useQueryClient } from "@tanstack/react-query";

import {
  TICKET_STATUSES,
  type SessionUser,
  type Ticket,
  type TicketStatus,
} from "@/lib/types";
import { isManager } from "@/lib/types";
import { qk, useMoveTicket } from "@/lib/queries";

import { KanbanColumn } from "./kanban-column";
import { TicketCard } from "./ticket-card";

type Columns = Record<TicketStatus, Ticket[]>;

function buildColumns(tickets: Ticket[]): Columns {
  const cols = {
    backlog: [],
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  } as Columns;
  for (const t of tickets) {
    (cols[t.status] ?? cols.backlog).push(t);
  }
  for (const status of TICKET_STATUSES) {
    cols[status].sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0));
  }
  return cols;
}

function findContainer(id: string, columns: Columns): TicketStatus | null {
  if ((TICKET_STATUSES as string[]).includes(id)) return id as TicketStatus;
  for (const status of TICKET_STATUSES) {
    if (columns[status].some((t) => t.documentId === id)) return status;
  }
  return null;
}

interface KanbanBoardProps {
  tickets: Ticket[];
  user: SessionUser | null | undefined;
  onOpenTicket: (documentId: string) => void;
}

export function KanbanBoard({ tickets, user, onOpenTicket }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const moveTicket = useMoveTicket();
  const manager = isManager(user);

  const [columns, setColumns] = React.useState<Columns>(() =>
    buildColumns(tickets)
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Re-sync from server data whenever it changes and we're not mid-drag.
  React.useEffect(() => {
    if (!activeId) setColumns(buildColumns(tickets));
  }, [tickets, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const canDragTicket = React.useCallback(
    (ticket: Ticket) => {
      if (manager) return true;
      if (user?.role?.type === "developer") {
        return ticket.assignee?.id === user.id;
      }
      return false;
    },
    [manager, user]
  );

  const activeTicket = React.useMemo(() => {
    if (!activeId) return null;
    for (const status of TICKET_STATUSES) {
      const found = columns[status].find((t) => t.documentId === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const from = findContainer(activeIdStr, columns);
    const to = findContainer(overIdStr, columns);
    if (!from || !to) return;

    const activeTicketRef = columns[from].find(
      (t) => t.documentId === activeIdStr
    );
    if (!activeTicketRef) return;

    const statusChanged = from !== to;

    // Developers may only change status on their own tickets; a same-column
    // reorder cannot persist (server ignores rank for non-managers) — snap back.
    if (!manager) {
      if (!statusChanged) {
        setColumns(buildColumns(tickets));
        return;
      }
    }

    // Build the destination column ordering after the move.
    let nextColumns: Columns;
    if (from === to) {
      const list = columns[from];
      const oldIndex = list.findIndex((t) => t.documentId === activeIdStr);
      let newIndex: number;
      if ((TICKET_STATUSES as string[]).includes(overIdStr)) {
        newIndex = list.length - 1;
      } else {
        newIndex = list.findIndex((t) => t.documentId === overIdStr);
        if (newIndex === -1) newIndex = list.length - 1;
      }
      if (oldIndex === newIndex) return; // nothing changed
      nextColumns = {
        ...columns,
        [from]: arrayMove(list, oldIndex, newIndex),
      };
    } else {
      const sourceList = columns[from].filter(
        (t) => t.documentId !== activeIdStr
      );
      const destBase = columns[to];
      let insertIndex: number;
      if ((TICKET_STATUSES as string[]).includes(overIdStr)) {
        insertIndex = destBase.length;
      } else {
        const overIdx = destBase.findIndex((t) => t.documentId === overIdStr);
        insertIndex = overIdx >= 0 ? overIdx : destBase.length;
      }
      const movedTicket: Ticket = { ...activeTicketRef, status: to };
      const destList = [
        ...destBase.slice(0, insertIndex),
        movedTicket,
        ...destBase.slice(insertIndex),
      ];
      nextColumns = { ...columns, [from]: sourceList, [to]: destList };
    }

    // Compute the fractional rank from the moved card's new neighbours.
    const finalList = nextColumns[to];
    const idx = finalList.findIndex((t) => t.documentId === activeIdStr);
    const prevRank = idx > 0 ? finalList[idx - 1].rank : null;
    const nextRank = idx < finalList.length - 1 ? finalList[idx + 1].rank : null;

    let newRank = activeTicketRef.rank;
    try {
      newRank = generateKeyBetween(prevRank, nextRank);
    } catch {
      // Neighbours out of order (shouldn't happen with sorted columns); keep old.
      newRank = activeTicketRef.rank;
    }

    // Apply the new rank locally so the optimistic order is stable.
    if (manager) {
      nextColumns = {
        ...nextColumns,
        [to]: nextColumns[to].map((t) =>
          t.documentId === activeIdStr ? { ...t, rank: newRank, status: to } : t
        ),
      };
    }

    setColumns(nextColumns);

    // Optimistically update the shared cache so the board doesn't flicker.
    const cached = queryClient.getQueryData<Ticket[]>(qk.tickets) ?? [];
    queryClient.setQueryData<Ticket[]>(
      qk.tickets,
      cached.map((t) =>
        t.documentId === activeIdStr
          ? { ...t, status: to, rank: manager ? newRank : t.rank }
          : t
      )
    );

    moveTicket.mutate({
      documentId: activeIdStr,
      status: to,
      rank: manager ? newRank : undefined,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {TICKET_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={columns[status]}
            canDragTicket={canDragTicket}
            onOpenTicket={onOpenTicket}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket ? (
          <TicketCard
            ticket={activeTicket}
            canDrag
            onOpen={() => {}}
            overlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
