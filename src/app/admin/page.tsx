import { redirect } from "next/navigation";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import { AdminDashboardView } from "@/components/admin-dashboard-view";

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Super Admin Dashboard</h1>
        <p>
          Supabase environment variables are not configured yet. Add values in .env.local
          to enable protected dashboard access.
        </p>
      </main>
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user) {
    redirect("/login?next=/admin");
  }

  if (!hasAnyRole(authContext.roles, [...adminRoles])) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Forbidden</h1>
        <p>
          Your account is authenticated but does not have admin permissions for this
          dashboard.
        </p>
        <p>
          Ask a super admin to assign your role in Access Management, or add your email to
          SUPER_ADMIN_EMAILS in .env.local for initial bootstrap access.
        </p>
      </main>
    );
  }

  return (
    <AdminDashboardView email={authContext.user.email} roles={authContext.roles} />
  );
}
