"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteMemberDialog } from "@/components/members/invite-member-dialog";
import { MembersTable } from "@/components/members/members-table";
import { useMembers, useTickets } from "@/lib/queries";
import { useSession } from "@/lib/use-session";
import { isManager } from "@/lib/types";

export default function MembersPage() {
  const { data: session, isLoading: sessionLoading } = useSession();
  const { data: members = [], isLoading, isError, error } = useMembers();
  const { data: tickets = [] } = useTickets();
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const manager = isManager(session);

  // Manager-only screen. Developers/viewers get a polite unauthorized state.
  if (!sessionLoading && !manager) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-16 text-center">
        <h1 className="text-xl font-semibold">Access restricted</h1>
        <p className="text-sm text-muted-foreground">
          Member management is available to Scrum Masters and Lead Devs only.
        </p>
        <Button asChild variant="outline">
          <Link href="/board">Back to board</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team, roles, and workload.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Invite member
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2 rounded-lg border p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-8 w-[150px]" />
            </div>
          ))}
        </div>
      )}
      {isError && (
        <p className="py-12 text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load members."}
        </p>
      )}
      {!isLoading && !isError && (
        <MembersTable
          members={members}
          tickets={tickets}
          currentUser={session}
        />
      )}

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        currentUser={session}
      />
    </div>
  );
}
