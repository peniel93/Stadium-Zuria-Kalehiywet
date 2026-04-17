import { TrainingManager } from "@/components/training-manager";
import { LogoutButton } from "@/components/logout-button";
import { DashboardShell } from "@/components/dashboard-shell";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";

const adminRoles = ["super_admin", "global_admin", "department_admin", "editor"] as const;

export default async function TrainingDashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Training and Education Dashboard</h1>
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
      title={{ en: "Training and Education Dashboard", am: "የስልጠና እና ትምህርት ዳሽቦርድ" }}
      description={{
        en: "Create courses and assessments, register teachers and students, and post grades.",
        am: "ኮርሶችን እና ምዘናዎችን ይፍጠሩ፣ አስተማሪዎችን እና ተማሪዎችን ይመዝግቡ፣ ውጤት ይለጥፉ።",
      }}
      action={<LogoutButton />}
    >
      <TrainingManager />
    </DashboardShell>
  );
}
