import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { listDepartments } from "@/lib/supabase/departments-repo";

export default async function DepartmentsPage() {
  const departmentConfigs = await listDepartments();

  return (
    <PublicPageShell
      title="Departments"
      description="Each ministry department is managed through a dedicated dashboard with members, programs, documents, and announcements."
      activeNavKey="departments"
    >
      <section className="panel">
        <div className="card-grid">
          {departmentConfigs.map((department) => (
            <article key={department.id} className="content-card">
              <h3 style={{ marginTop: 0 }}>{department.nameEn}</h3>
              <p style={{ marginTop: 0 }}>{department.nameAm}</p>
              <p>{department.description ?? "Department profile and services are managed in the admin dashboard."}</p>
              <Link href={`/admin/departments/${department.code}`}>Open Department Dashboard</Link>
            </article>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}
