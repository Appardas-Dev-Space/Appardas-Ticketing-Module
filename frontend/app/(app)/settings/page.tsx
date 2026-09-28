import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { AppearanceCard } from "@/components/settings/appearance-card";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Preferences and account management.
        </p>
      </div>

      <AppearanceCard />

      <Card>
        <CardContent className="p-0">
          <Link
            href="/settings/profile"
            className="flex items-center justify-between rounded-lg p-4 transition-colors hover:bg-accent/50"
          >
            <div>
              <p className="text-sm font-medium">Profile Settings</p>
              <p className="text-sm text-muted-foreground">
                Update your username, email, and password.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
