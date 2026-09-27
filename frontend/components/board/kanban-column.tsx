"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { cn } from "@/lib/utils";
import { STATUS_LABELS, type Ticket, type TicketStatus } from "@/lib/types";

import { TicketCard } from "./ticket-card";

interface KanbanColumnProps {
  status: TicketStatus;
  tickets: Ticket[];
  canDragTicket: (ticket: Ticket) => boolean;
  onOpenTicket: (documentId: string) => void;
}

export function KanbanColumn({
  status,
  tickets,
  canDragTicket,
  onOpenTicket,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/40">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-semibold">{STATUS_LABELS[status]}</h2>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {tickets.length}
        </span>
      </div>

      <SortableContext
        items={tickets.map((t) => t.documentId)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-[120px] flex-1 flex-col gap-2 p-2 transition-colors",
            isOver && "bg-primary/5"
          )}
        >
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.documentId}
              ticket={ticket}
              canDrag={canDragTicket(ticket)}
              onOpen={onOpenTicket}
            />
          ))}
          {tickets.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No tickets
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
