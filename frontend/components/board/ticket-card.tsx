"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Lock, MessageSquare } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PRIORITY_LABELS,
  TYPE_LABELS,
  type Ticket,
  type TicketPriority,
} from "@/lib/types";

import { DeadlineBadge } from "./deadline-badge";

function priorityVariant(priority: TicketPriority) {
  switch (priority) {
    case "critical":
      return "critical" as const;
    case "high":
      return "warning" as const;
    case "medium":
      return "default" as const;
    default:
      return "secondary" as const;
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface TicketCardProps {
  ticket: Ticket;
  canDrag: boolean;
  onOpen: (documentId: string) => void;
  /** Render as the drag overlay (no sortable wiring, elevated styling). */
  overlay?: boolean;
}

export function TicketCard({
  ticket,
  canDrag,
  onOpen,
  overlay = false,
}: TicketCardProps) {
  const sortable = useSortable({
    id: ticket.documentId,
    disabled: !canDrag,
  });

  const style = overlay
    ? undefined
    : {
        transform: CSS.Translate.toString(sortable.transform),
        transition: sortable.transition,
      };

  const assigneeName =
    ticket.assignee?.displayName || ticket.assignee?.username || null;
  const commentCount = ticket.comments?.length ?? 0;

  return (
    <div
      ref={overlay ? undefined : sortable.setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-card p-4 transition-all",
        "hover:border-primary/40",
        sortable.isDragging && !overlay && "opacity-40",
        overlay && "rotate-1 shadow-md ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle / lock indicator */}
        {canDrag ? (
          <button
            type="button"
            aria-label="Drag ticket"
            className="mt-0.5 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : (
          <span
            className="mt-0.5 text-muted-foreground/30"
            title="You can only move tickets assigned to you"
          >
            <Lock className="h-4 w-4" />
          </span>
        )}

        <button
          type="button"
          onClick={() => onOpen(ticket.documentId)}
          className="flex-1 text-left"
        >
          <p className="text-sm font-medium leading-snug">{ticket.title}</p>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-6">
        <Badge variant={priorityVariant(ticket.priority)} className="text-[10px]">
          {PRIORITY_LABELS[ticket.priority]}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {TYPE_LABELS[ticket.type]}
        </Badge>
        <DeadlineBadge deadline={ticket.deadline} status={ticket.status} />
      </div>

      <div className="mt-3 flex items-center justify-between pl-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </span>
          )}
        </div>
        {assigneeName ? (
          <Avatar className="h-6 w-6" title={assigneeName}>
            <AvatarFallback className="text-[10px]">
              {initials(assigneeName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-[10px] text-muted-foreground">Unassigned</span>
        )}
      </div>
    </div>
  );
}
