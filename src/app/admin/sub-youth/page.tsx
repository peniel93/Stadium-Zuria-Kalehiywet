import { YouthSubDashboard } from "@/components/youth-sub-dashboard";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";

export default async function AdminSubYouthPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Sub Youth Dashboard</h1>
        <p>Set up Supabase environment variables to use this dashboard.</p>
      </main>
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, ["super_admin", "department_admin", "church_leader", "youth_leader"])) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to access the youth dashboard.</p>
      </main>
    );
  }

  return <YouthSubDashboard />;
}
