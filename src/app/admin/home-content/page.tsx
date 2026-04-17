import { DashboardShell } from "@/components/dashboard-shell";
import { HomeContentManager } from "@/components/home-content-manager";
import { LogoutButton } from "@/components/logout-button";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";

const adminRoles = ["super_admin", "global_admin", "department_admin", "editor"] as const;

export default async function AdminHomeContentPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Home Content</h1>
        <p>Set up Supabase environment variables first.</p>
      </main>
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Forbidden</h1>
        <p>You do not have permission to manage home content.</p>
      </main>
    );
  }

  return (
    <DashboardShell
      title={{ en: "Home Content Dashboard", am: "የመነሻ ገፅ ይዘት ዳሽቦርድ" }}
      description={{
        en: "Manage homepage sliders, announcements, conferences, programs, vacancies, and featured notices.",
        am: "የመነሻ ገፅ ስላይዶችን፣ ማስታወቂያዎችን፣ ኮንፈረንሶችን፣ ፕሮግራሞችን እና የስራ ማስታወቂያዎችን ያስተዳድሩ።",
      }}
      action={<LogoutButton />}
    >
      <HomeContentManager />
    </DashboardShell>
  );
}
