import { DepartmentGroupManager } from "@/components/department-group-manager";
import { LogoutButton } from "@/components/logout-button";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { resolveDepartmentForDashboard } from "@/lib/departments-resolver";
import { isSupabaseConfigured } from "@/lib/config/env";

type DepartmentGroupsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

export default async function DepartmentGroupsPage({ params }: DepartmentGroupsPageProps) {
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
        <h1>{department.name} Groups</h1>
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
    <main style={{ width: "min(1180px, calc(100% - 2rem))", margin: "1rem auto 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>{department.name} Groups</h1>
          <p style={{ color: "var(--muted)" }}>
            Manage zones, classes, age groups, or other record containers for this department.
          </p>
        </div>
        <LogoutButton />
      </div>

      <DepartmentGroupManager departmentSlug={slug} departmentName={department.name} />
    </main>
  );
}
