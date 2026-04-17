import { InternalCommunicationsManager } from "@/components/internal-communications-manager";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";

export default async function AdminInternalCommunicationsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Internal Communications</h1>
        <p>Set up Supabase environment variables to use this dashboard.</p>
      </main>
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, ["super_admin", "global_admin", "department_admin", "church_leader", "editor", "moderator"])) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to access internal communications.</p>
      </main>
    );
  }

  return <InternalCommunicationsManager />;
}
