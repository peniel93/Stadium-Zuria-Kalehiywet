import { DepartmentDashboardView } from "@/components/department-dashboard-view";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { resolveDepartmentForDashboard } from "@/lib/departments-resolver";
import { isSupabaseConfigured } from "@/lib/config/env";

type DepartmentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

export default async function DepartmentDashboardPage({ params }: DepartmentPageProps) {
  const { slug } = await params;
  const department = await resolveDepartmentForDashboard(slug);

  if (!department) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Department Not Found</h1>
        <p>The department dashboard you requested does not exist yet.</p>
      </main>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>{department.name}</h1>
        <p>Set up Supabase environment variables to use this dashboard.</p>
      </main>
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this dashboard.</p>
      </main>
    );
  }

  return (
    <DepartmentDashboardView department={department} />
  );
}
