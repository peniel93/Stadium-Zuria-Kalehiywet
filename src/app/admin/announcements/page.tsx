import { AnnouncementManager } from "@/components/announcement-manager";
import { LogoutButton } from "@/components/logout-button";
import { DashboardShell } from "@/components/dashboard-shell";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

export default async function AnnouncementsAdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Announcements Management</h1>
        <p>Set up Supabase environment variables to use this dashboard.</p>
      </main>
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Access Denied</h1>
        <p>You do not have access to this management page.</p>
      </main>
    );
  }

  return (
    <DashboardShell
      title={{ en: "Announcements Management", am: "የማስታወቂያዎች አስተዳደር" }}
      description={{
        en: "Manage active announcements, urgent notices, and expiry-controlled posts.",
        am: "አግባቡ ያላቸውን ማስታወቂያዎች፣ አስቸኳይ ማሳሰቢያዎችን እና ጊዜ የሚያበቃቸውን ልጥፎችን ያስተዳድሩ።",
      }}
      action={<LogoutButton />}
    >
      <AnnouncementManager />
    </DashboardShell>
  );
}
