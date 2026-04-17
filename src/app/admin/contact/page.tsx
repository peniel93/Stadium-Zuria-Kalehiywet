import { DashboardShell } from "@/components/dashboard-shell";
import { ContactInboxManager } from "@/components/contact-inbox-manager";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

export default async function AdminContactPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Contact Inbox</h1>
        <p>Set up Supabase environment variables first.</p>
      </main>
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Forbidden</h1>
        <p>You do not have permission to access contact inbox.</p>
      </main>
    );
  }

  return (
    <DashboardShell
      title={{ en: "Contact Inbox", am: "የግንኙነት መልዕክት ሳጥን" }}
      description={{ en: "Review contact messages, mark status, and save replies.", am: "የግንኙነት መልዕክቶችን ይመልከቱ፣ ሁኔታ ይስጡ እና ምላሽ ያስቀምጡ።" }}
    >
      <ContactInboxManager />
    </DashboardShell>
  );
}
