"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
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
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:gap-6">
        <Link
          href="/board"
          className="font-semibold tracking-tight transition-opacity hover:opacity-80"
        >
          Appardas
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
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

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5 text-sm transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8">
                    {user.avatar?.url ? (
                      <AvatarImage src={user.avatar.url} alt={displayName} />
                    ) : null}
                    <AvatarFallback>
                      {initials(displayName || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[8rem] truncate font-medium sm:inline">
                    {displayName}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:inline" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span className="truncate">{displayName}</span>
                  {roleLabel ? (
                    <Badge variant="secondary" className="w-fit font-normal">
                      {roleLabel}
                    </Badge>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </header>
  );
}
