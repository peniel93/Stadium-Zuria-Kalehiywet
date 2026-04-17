import { LogoutButton } from "@/components/logout-button";
import { YouthManager } from "@/components/youth-manager";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import { resolveDepartmentForDashboard } from "@/lib/departments-resolver";

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

type DepartmentYouthPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DepartmentYouthPage({ params }: DepartmentYouthPageProps) {
  const { slug } = await params;
  const department = await resolveDepartmentForDashboard(slug);

  if (!department) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Department Not Found</h1>
      </main>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>{department.name} Youth Profiles</h1>
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
    <main style={{ width: "min(1180px, calc(100% - 2rem))", margin: "1rem auto 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>{department.name} Youth Profiles</h1>
          <p style={{ color: "var(--muted)" }}>
            Manage youth records by age groups, status, and profile media attachments.
          </p>
        </div>
        <LogoutButton />
      </div>

      <YouthManager departmentSlug={slug} departmentName={department.name} />
    </main>
  );
}
