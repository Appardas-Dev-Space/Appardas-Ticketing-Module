"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  TICKET_TYPES,
  TYPE_LABELS,
  type Member,
} from "@/lib/types";

export interface BoardFilters {
  assignee: string; // "all" | "unassigned" | "<userId>"
  priority: string; // "all" | priority
  type: string; // "all" | type
  overdueOnly: boolean;
}

export const DEFAULT_FILTERS: BoardFilters = {
  assignee: "all",
  priority: "all",
  type: "all",
  overdueOnly: false,
};

interface FilterBarProps {
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
  members: Member[];
  currentUserId?: number;
}

export function FilterBar({
  filters,
  onChange,
  members,
  currentUserId,
}: FilterBarProps) {
  const set = (patch: Partial<BoardFilters>) =>
    onChange({ ...filters, ...patch });

  const isDefault =
    filters.assignee === "all" &&
    filters.priority === "all" &&
    filters.type === "all" &&
    !filters.overdueOnly;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.assignee}
        onValueChange={(v) => set({ assignee: v })}
      >
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          {currentUserId != null && (
            <SelectItem value={String(currentUserId)}>My tickets</SelectItem>
          )}
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {members
            .filter((m) => m.id !== currentUserId)
            .map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.displayName || m.username}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(v) => set({ priority: v })}
      >
        <SelectTrigger className="h-9 w-[150px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.type} onValueChange={(v) => set({ type: v })}>
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {TICKET_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant={filters.overdueOnly ? "default" : "outline"}
        size="sm"
        className="h-9"
        onClick={() => set({ overdueOnly: !filters.overdueOnly })}
      >
        Overdue only
      </Button>

      {!isDefault && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => onChange(DEFAULT_FILTERS)}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
