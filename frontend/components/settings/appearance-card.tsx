"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, Laptop, Moon, Sun } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
        <CardDescription>Choose how Appardas looks to you.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = mounted && theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors",
                  active
                    ? "border-primary bg-accent"
                    : "border-border hover:bg-accent/50"
                )}
                aria-pressed={active}
              >
                <Icon className="h-5 w-5" />
                <span className="flex items-center gap-1 font-medium">
                  {opt.label}
                  {active && <Check className="h-3.5 w-3.5 text-primary" />}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
