"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInviteMember, type InviteMemberValues } from "@/lib/queries";
import {
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  type RoleType,
  type SessionUser,
} from "@/lib/types";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: SessionUser | null | undefined;
}

const EMPTY: InviteMemberValues = {
  username: "",
  email: "",
  role: "developer",
  displayName: "",
  title: "",
};

export function InviteMemberDialog({
  open,
  onOpenChange,
  currentUser,
}: InviteMemberDialogProps) {
  const [values, setValues] = React.useState<InviteMemberValues>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [tempPassword, setTempPassword] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const invite = useInviteMember();

  // A Lead Dev cannot create a Scrum Master (mirrors the server guard).
  const isLeadDev = currentUser?.role?.type === "lead_dev";
  const roleOptions: RoleType[] = ASSIGNABLE_ROLES.filter(
    (r) => !(isLeadDev && r === "scrum_master")
  );

  React.useEffect(() => {
    if (open) {
      setValues(EMPTY);
      setError(null);
      setTempPassword(null);
      setCopied(false);
    }
  }, [open]);

  const set = <K extends keyof InviteMemberValues>(
    key: K,
    value: InviteMemberValues[K]
  ) => setValues((v) => ({ ...v, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.username.trim() || !values.email.trim()) {
      setError("Username and email are required.");
      return;
    }
    try {
      const result = await invite.mutateAsync({
        username: values.username.trim(),
        email: values.email.trim(),
        role: values.role,
        displayName: values.displayName?.trim() || undefined,
        title: values.title?.trim() || undefined,
      });
      setTempPassword(result.temporaryPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member.");
    }
  }

  async function copyPassword() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard. Copy the password manually.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {tempPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Member invited</DialogTitle>
              <DialogDescription>
                {values.displayName || values.username} was added to the team.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Label>Temporary password</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 select-all break-all rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                  {tempPassword}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Copy password"
                  onClick={copyPassword}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-amber-600">
                Share this one-time password with the member. It will not be
                shown again.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite member</DialogTitle>
              <DialogDescription>
                Directly add a team member. A temporary password is generated
                for their first login.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={values.username}
                  onChange={(e) => set("username", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input
                    id="displayName"
                    value={values.displayName}
                    onChange={(e) => set("displayName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={values.title}
                    onChange={(e) => set("title", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={values.role}
                  onValueChange={(v) => set("role", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r] ?? r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={invite.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={invite.isPending}>
                  {invite.isPending ? "Inviting…" : "Invite member"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
