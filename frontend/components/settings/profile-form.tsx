"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProfile } from "@/lib/queries";
import { useSession } from "@/lib/use-session";

export function ProfileForm() {
  const { data: user } = useSession();
  const update = useUpdateProfile();

  const [values, setValues] = React.useState({
    username: "",
    email: "",
    displayName: "",
    title: "",
  });
  const [status, setStatus] = React.useState<
    { type: "success" | "error"; msg: string } | null
  >(null);

  // Hydrate the form once the session loads.
  React.useEffect(() => {
    if (user) {
      setValues({
        username: user.username ?? "",
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        title: user.title ?? "",
      });
    }
  }, [user]);

  const set = (k: keyof typeof values, v: string) =>
    setValues((s) => ({ ...s, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      await update.mutateAsync({
        username: values.username.trim(),
        email: values.email.trim(),
        displayName: values.displayName.trim(),
        title: values.title.trim(),
      });
      setStatus({ type: "success", msg: "Profile updated." });
    } catch (err) {
      setStatus({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to update profile.",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
        <CardDescription>Your account details and identity.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
