import { DashboardShell } from "@/components/dashboard-shell";
import { AdminAppearanceControls } from "@/components/admin-appearance-controls";
import { PlatformSettingsManager } from "@/components/platform-settings-manager";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";

const adminRoles = ["super_admin", "global_admin"] as const;

export default async function AdminSettingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Platform Settings</h1>
        <p>Set up Supabase environment variables first.</p>
      </main>
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Forbidden</h1>
        <p>You do not have permission to access platform settings.</p>
      </main>
    );
  }

  return (
    <DashboardShell
      title={{ en: "Platform Settings", am: "የፕላትፎርም ቅንብሮች" }}
      description={{ en: "Manage website branding, footer, counters, and dynamic departments.", am: "የድር ጣቢያ ማንነት፣ ፉተር፣ ቆጠራዎች እና ዘርፎችን አስተዳድር።" }}
      action={<AdminAppearanceControls />}
    >
      <PlatformSettingsManager />
    </DashboardShell>
  );
}
