import { PasswordForm } from "@/components/settings/password-form";
import { ProfileForm } from "@/components/settings/profile-form";

export default function ProfileSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and password.
        </p>
      </div>
      <ProfileForm />
      <PasswordForm />
    </div>
  );
}
