import { DepartmentDocumentManager } from "@/components/department-document-manager";
import { LogoutButton } from "@/components/logout-button";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { resolveDepartmentForDashboard } from "@/lib/departments-resolver";
import { isSupabaseConfigured } from "@/lib/config/env";

const adminRoles = ["super_admin", "global_admin", "department_admin", "editor"] as const;

type DepartmentDocumentsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DepartmentDocumentsPage({ params }: DepartmentDocumentsPageProps) {
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
        <h1>{department.name} Documents</h1>
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
          <h1 style={{ marginBottom: 0 }}>{department.name} Documents and Resources</h1>
          <p style={{ color: "var(--muted)" }}>
            Publish live resources for the website and keep downloadable documents available at any time.
          </p>
        </div>
        <LogoutButton />
      </div>

      <DepartmentDocumentManager departmentSlug={slug} />
    </main>
  );
}
