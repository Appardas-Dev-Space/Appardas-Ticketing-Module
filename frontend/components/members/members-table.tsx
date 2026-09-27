"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeactivateMember, useUpdateMemberRole } from "@/lib/queries";
import { getDeadlineState } from "@/lib/deadline";
import {
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  type Member,
  type RoleType,
  type SessionUser,
  type Ticket,
} from "@/lib/types";

interface Workload {
  total: number;
  inProgress: number;
  overdue: number;
}

function computeWorkload(tickets: Ticket[]): Map<number, Workload> {
  const map = new Map<number, Workload>();
  for (const t of tickets) {
    const id = t.assignee?.id;
    if (id == null) continue;
    const w = map.get(id) ?? { total: 0, inProgress: 0, overdue: 0 };
    w.total += 1;
    if (t.status === "in_progress") w.inProgress += 1;
    if (getDeadlineState(t.deadline, t.status) === "overdue") w.overdue += 1;
    map.set(id, w);
  }
  return map;
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

interface MembersTableProps {
  members: Member[];
  tickets: Ticket[];
  currentUser: SessionUser | null | undefined;
}

export function MembersTable({
  members,
  tickets,
  currentUser,
}: MembersTableProps) {
  const workload = React.useMemo(() => computeWorkload(tickets), [tickets]);
  const updateRole = useUpdateMemberRole();
  const deactivate = useDeactivateMember();

  const [confirm, setConfirm] = React.useState<Member | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const isLeadDev = currentUser?.role?.type === "lead_dev";

  function roleOptionsFor(): RoleType[] {
    return ASSIGNABLE_ROLES.filter(
      (r) => !(isLeadDev && r === "scrum_master")
    );
  }

  async function handleRoleChange(member: Member, role: string) {
    setError(null);
    try {
      await updateRole.mutateAsync({ id: member.documentId ?? member.id, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role.");
    }
  }

  async function handleDeactivate() {
    if (!confirm) return;
    setError(null);
    try {
      await deactivate.mutateAsync(confirm.documentId ?? confirm.id);
      setConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate.");
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Member</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Workload</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m) => {
              const isSelf = m.id === currentUser?.id;
              const name = m.displayName || m.username;
              const w = workload.get(m.id) ?? {
                total: 0,
                inProgress: 0,
                overdue: 0,
              };
              const roleType = m.role?.type ?? "";
              return (
                <tr key={m.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {m.avatar?.url ? (
                          <AvatarImage src={m.avatar.url} alt={name} />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {initials(name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <div className="font-medium">{name}</div>
                        <div className="text-xs text-muted-foreground">
                          @{m.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.title || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={roleType}
                      onValueChange={(v) => handleRoleChange(m, v)}
                      disabled={isSelf || updateRole.isPending}
                    >
                      <SelectTrigger className="h-8 w-[150px]">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptionsFor().map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r] ?? r}
                          </SelectItem>
                        ))}
                        {/* Keep the current (possibly non-assignable) role visible. */}
                        {roleType &&
                          !roleOptionsFor().includes(roleType as RoleType) && (
                            <SelectItem value={roleType} disabled>
                              {ROLE_LABELS[roleType] ?? roleType}
                            </SelectItem>
                          )}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant="secondary" title="Total assigned">
                        {w.total} total
                      </Badge>
                      {w.inProgress > 0 && (
                        <Badge variant="default" title="In progress">
                          {w.inProgress} active
                        </Badge>
                      )}
                      {w.overdue > 0 && (
                        <Badge variant="critical" title="Overdue">
                          {w.overdue} overdue
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={m.isActive === false ? "outline" : "success"}
                    >
                      {m.isActive === false ? "Deactivated" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={isSelf}
                      onClick={() => setConfirm(m)}
                    >
                      Deactivate
                    </Button>
                  </td>
                </tr>
              );
            })}
            {members.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Deactivate member</DialogTitle>
            <DialogDescription>
              {confirm
                ? `${confirm.displayName || confirm.username} will be blocked from logging in and removed from the active team list. Their historical tickets and comments are preserved.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={deactivate.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivate.isPending}
            >
              {deactivate.isPending ? "Deactivating…" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
