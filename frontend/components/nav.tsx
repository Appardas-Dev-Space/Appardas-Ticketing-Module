"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/lib/use-session";
import { isManager, ROLE_LABELS } from "@/lib/types";

const NAV_LINKS = [
  { href: "/board", label: "Board", managerOnly: false },
  { href: "/members", label: "Members", managerOnly: true },
  { href: "/dashboard", label: "Dashboard", managerOnly: false },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useSession();

  const manager = isManager(user);
  const links = NAV_LINKS.filter((l) => !l.managerOnly || manager);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.setQueryData(["session"], null);
    await queryClient.invalidateQueries();
    router.replace("/login");
    router.refresh();
  }

  const displayName = user?.displayName || user?.username || "";
  const roleLabel = user?.role
    ? ROLE_LABELS[user.role.type] ?? user.role.name
    : null;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link href="/board" className="font-semibold tracking-tight">
          Appardas
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <Avatar className="h-8 w-8">
                  {user.avatar?.url ? (
                    <AvatarImage src={user.avatar.url} alt={displayName} />
                  ) : null}
                  <AvatarFallback>{initials(displayName || "U")}</AvatarFallback>
                </Avatar>
                <div className="leading-tight">
                  <div className="text-sm font-medium">{displayName}</div>
                  {roleLabel ? (
                    <Badge variant="secondary" className="mt-0.5">
                      {roleLabel}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Log out"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
