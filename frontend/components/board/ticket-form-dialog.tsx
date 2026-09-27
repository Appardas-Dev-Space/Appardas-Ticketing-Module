"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isoToLocalInput, localInputToIso } from "@/lib/deadline";
import { useCreateTicket, useUpdateTicket } from "@/lib/queries";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_STATUSES,
  TICKET_TYPES,
  TYPE_LABELS,
  type Member,
  type Sprint,
  type Ticket,
  type TicketFormValues,
  type TicketPriority,
  type TicketStatus,
  type TicketType,
} from "@/lib/types";

const NONE = "__none__";

interface TicketFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present → edit mode; absent → create mode. */
  ticket?: Ticket | null;
  members: Member[];
  sprints: Sprint[];
  onSaved?: () => void;
}

function initialValues(ticket?: Ticket | null): TicketFormValues {
  return {
    title: ticket?.title ?? "",
    description: ticket?.description ?? "",
    status: ticket?.status ?? "backlog",
    priority: ticket?.priority ?? "medium",
    type: ticket?.type ?? "task",
    deadline: ticket?.deadline ?? null,
    assignee: ticket?.assignee?.id ?? null,
    sprint: ticket?.sprint?.id ?? null,
  };
}

export function TicketFormDialog({
  open,
  onOpenChange,
  ticket,
  members,
  sprints,
  onSaved,
}: TicketFormDialogProps) {
  const isEdit = Boolean(ticket);
  const [values, setValues] = React.useState<TicketFormValues>(() =>
    initialValues(ticket)
  );
  const [error, setError] = React.useState<string | null>(null);

  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket(ticket?.documentId ?? "");
  const pending = createTicket.isPending || updateTicket.isPending;

  // Reset form whenever the dialog opens or the target ticket changes.
  React.useEffect(() => {
    if (open) {
      setValues(initialValues(ticket));
      setError(null);
    }
  }, [open, ticket]);

  const set = <K extends keyof TicketFormValues>(
    key: K,
    value: TicketFormValues[K]
  ) => setValues((v) => ({ ...v, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.title.trim()) {
      setError("Title is required.");
      return;
    }
    try {
      if (isEdit) {
        await updateTicket.mutateAsync(values);
      } else {
        await createTicket.mutateAsync(values);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ticket.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit ticket" : "New ticket"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the ticket details."
              : "Create a ticket and assign it to a team member."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Short summary"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (Markdown)</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the work. Markdown supported."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={values.status}
                onValueChange={(v) => set("status", v as TicketStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={values.priority}
                onValueChange={(v) => set("priority", v as TicketPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={values.type}
                onValueChange={(v) => set("type", v as TicketType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={isoToLocalInput(values.deadline)}
                onChange={(e) =>
                  set("deadline", localInputToIso(e.target.value))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select
                value={values.assignee != null ? String(values.assignee) : NONE}
                onValueChange={(v) =>
                  set("assignee", v === NONE ? null : Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.displayName || m.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Sprint</Label>
              <Select
                value={values.sprint != null ? String(values.sprint) : NONE}
                onValueChange={(v) =>
                  set("sprint", v === NONE ? null : Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No sprint</SelectItem>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
