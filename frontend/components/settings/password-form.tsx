"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/lib/queries";

export function PasswordForm() {
  const change = useChangePassword();
  const [values, setValues] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [status, setStatus] = React.useState<
    { type: "success" | "error"; msg: string } | null
  >(null);

  const set = (k: keyof typeof values, v: string) =>
    setValues((s) => ({ ...s, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (values.newPassword.length < 6) {
      setStatus({ type: "error", msg: "New password must be at least 6 characters." });
      return;
    }
    if (values.newPassword !== values.confirm) {
      setStatus({ type: "error", msg: "New passwords do not match." });
      return;
    }
    try {
      await change.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setStatus({ type: "success", msg: "Password changed." });
      setValues({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setStatus({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to change password.",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Password</CardTitle>
        <CardDescription>
          Change your password. You&apos;ll need your current one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={values.currentPassword}
              onChange={(e) => set("currentPassword", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={values.newPassword}
                onChange={(e) => set("newPassword", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={values.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                required
              />
            </div>
          </div>

          {status && (
            <p
              className={
                status.type === "success"
                  ? "text-sm text-emerald-600"
                  : "text-sm text-destructive"
              }
            >
              {status.msg}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={change.isPending}>
              {change.isPending ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
