import { AccessManager } from "@/components/access-manager";
import { LogoutButton } from "@/components/logout-button";
import { DashboardShell } from "@/components/dashboard-shell";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";

const superAdminRoles = ["super_admin"] as const;

export default async function AccessAdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Access Management</h1>
        <p>Configure Supabase environment variables to use access controls.</p>
      </main>
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...superAdminRoles])) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Access Denied</h1>
        <p>You must be a super admin to use this page.</p>
      </main>
    );
  }

  return (
    <DashboardShell
      title={{ en: "Access Management", am: "የመዳረሻ አስተዳደር" }}
      description={{
        en: "Assign roles and department admin privileges to authenticated users.",
        am: "ሚናዎችን እና የዘርፍ አስተዳዳሪ ፍቃዶችን ለተረጋገጡ ተጠቃሚዎች ይመድቡ።",
      }}
      action={<LogoutButton />}
    >
      <AccessManager />
    </DashboardShell>
  );
}
