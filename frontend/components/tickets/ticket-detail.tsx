"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Pencil } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeadlineBadge } from "@/components/board/deadline-badge";
import { TicketFormDialog } from "@/components/board/ticket-form-dialog";
import {
  useAddComment,
  useMembers,
  useSprints,
  useTicket,
  useUpdateTicket,
} from "@/lib/queries";
import { useSession } from "@/lib/use-session";
import { formatDeadline } from "@/lib/deadline";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_STATUSES,
  TYPE_LABELS,
  isManager,
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

function userName(u?: { displayName?: string | null; username?: string } | null) {
  return u?.displayName || u?.username || "Unknown";
}

function activityText(
  activity: ActivityLog,
  memberById: Map<string, Member>
): string {
  const { action, fromValue, toValue } = activity;
  switch (action) {
    case "created":
      return "created this ticket";
    case "status_changed":
      return `changed status from “${STATUS_LABELS[fromValue as TicketStatus] ?? fromValue}” to “${STATUS_LABELS[toValue as TicketStatus] ?? toValue}”`;
    case "priority_changed":
      return `changed priority from “${fromValue}” to “${toValue}”`;
    case "deadline_changed": {
      const from = fromValue ? formatDeadline(fromValue) : "none";
      const to = toValue ? formatDeadline(toValue) : "none";
      return `changed deadline from ${from} to ${to}`;
    }
    case "assigned": {
      const to = toValue ? userName(memberById.get(toValue)) : "no one";
      return `assigned this ticket to ${to}`;
    }
    default:
      return action;
  }
}

interface TicketDetailProps {
  documentId: string;
}

export function TicketDetail({ documentId }: TicketDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: ticket, isLoading, isError, error } = useTicket(documentId);
  const { data: members = [] } = useMembers();
  const { data: sprints = [] } = useSprints();

  const [editOpen, setEditOpen] = React.useState(false);
  const [commentBody, setCommentBody] = React.useState("");

  const updateTicket = useUpdateTicket(documentId);
  const addComment = useAddComment(documentId);

  const manager = isManager(session);
  const isAssignee = ticket?.assignee?.id === session?.id;
  const canEditStatus = manager || (session?.role?.type === "developer" && isAssignee);

  const memberById = React.useMemo(() => {
    const map = new Map<string, Member>();
    for (const m of members) map.set(String(m.id), m);
    return map;
  }, [members]);

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Loading ticket…
      </p>
    );
  }
  if (isError || !ticket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/board")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to board
        </Button>
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Ticket not found."}
        </p>
      </div>
    );
  }

  const comments = ticket.comments ?? [];
  const activities = ticket.activities ?? [];

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const body = commentBody.trim();
    if (!body) return;
    await addComment.mutateAsync(body);
    setCommentBody("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/board")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to board
        </Button>
        {manager && (
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main column */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">{ticket.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{TYPE_LABELS[ticket.type]}</Badge>
              <Badge variant="secondary">
                {PRIORITY_LABELS[ticket.priority]}
              </Badge>
              <DeadlineBadge
                deadline={ticket.deadline}
                status={ticket.status}
                showAbsolute
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.description ? (
                <div className="markdown space-y-2 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-3">
                  <ReactMarkdown>{ticket.description}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No description.</p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}
              {comments.map((c) => (
                <div key={c.documentId} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {initials(userName(c.author))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">
                        {userName(c.author)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.body}</p>
                  </div>
                </div>
              ))}

              <form onSubmit={submitComment} className="space-y-2 pt-2">
                <Textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Add a comment…"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!commentBody.trim() || addComment.isPending}
                  >
                    {addComment.isPending ? "Posting…" : "Comment"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Status
                </p>
                {canEditStatus ? (
                  <Select
                    value={ticket.status}
                    onValueChange={(v) =>
                      updateTicket.mutate({ status: v as TicketStatus })
                    }
                  >
                    <SelectTrigger className="h-9">
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
                ) : (
                  <Badge variant="secondary">
                    {STATUS_LABELS[ticket.status]}
                  </Badge>
                )}
              </div>

              <SidebarRow label="Assignee" value={userName(ticket.assignee)} />
              <SidebarRow label="Reporter" value={userName(ticket.reporter)} />
              <SidebarRow
                label="Sprint"
                value={ticket.sprint?.name ?? "None"}
              />
              <SidebarRow
                label="Deadline"
                value={formatDeadline(ticket.deadline)}
              />
              {ticket.labels && ticket.labels.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Labels
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {ticket.labels.map((l) => (
                      <Badge key={l.id} variant="outline">
                        {l.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ol className="space-y-3">
                  {activities.map((a) => (
                    <li key={a.documentId} className="text-sm">
                      <span className="font-medium">{userName(a.actor)}</span>{" "}
                      <span className="text-muted-foreground">
                        {activityText(a, memberById)}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {manager && (
        <TicketFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          ticket={ticket}
          members={members}
          sprints={sprints}
        />
      )}
    </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
