import { HrWorkerManager } from "@/components/hr-worker-manager";
import { LogoutButton } from "@/components/logout-button";
import { DashboardShell } from "@/components/dashboard-shell";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

export default async function HrDashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>HR Dashboard</h1>
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
      title={{ en: "HR Dashboard", am: "የሰራተኞች ዳሽቦርድ" }}
      description={{
        en: "Manage workers, posts, salaries, education level, status, and contact information.",
        am: "ሰራተኞችን፣ ስራዎችን፣ ደመወዝን፣ የትምህርት ደረጃን እና የእውቂያ መረጃን ያስተዳድሩ።",
      }}
      action={<LogoutButton />}
    >
      <HrWorkerManager />
    </DashboardShell>
  );
}
