import { MemberRegistryManager } from "@/components/member-registry-manager";
import { LogoutButton } from "@/components/logout-button";
import { DashboardShell } from "@/components/dashboard-shell";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

export default async function MembersDashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Members Registry</h1>
        <p>Set up Supabase environment variables to use this dashboard.</p>
      </main>
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Access Denied</h1>
      </main>
    );
  }

  return (
    <DashboardShell
      title={{ en: "Members Registry Dashboard", am: "የአባላት መዝገብ ዳሽቦርድ" }}
      description={{
        en: "Admin-managed categories with search and filtering by zones, roles, status, and member groups.",
        am: "በአስተዳዳሪ የሚተዳደሩ ምድቦችን በዞን፣ በሚና፣ በሁኔታ እና በአባላት ቡድኖች ለመፈለግ እና ለማጣራት።",
      }}
      action={<LogoutButton />}
    >
      <MemberRegistryManager />
    </DashboardShell>
  );
}
