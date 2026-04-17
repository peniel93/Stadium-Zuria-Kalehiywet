"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { usePortalLocale } from "@/lib/portal-locale";
import type { DepartmentConfig } from "@/lib/departments";

type DepartmentDashboardViewProps = {
  department: DepartmentConfig;
};

export function DepartmentDashboardView({ department }: DepartmentDashboardViewProps) {
  const locale = usePortalLocale();

  return (
    <main style={{ width: "min(1180px, calc(100% - 2rem))", margin: "1rem auto 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>
            {locale === "am" ? `${department.amharicName} ዳሽቦርድ` : `${department.name} Dashboard`}
          </h1>
          <p style={{ color: "var(--muted)" }}>
            {locale === "am"
              ? `${department.amharicName} - ${department.summary}`
              : `${department.name} - ${department.summary}`}
          </p>
        </div>
        <LogoutButton />
      </div>

      <section className="panel" style={{ display: "grid", gap: 12 }}>
        <div className="section-head">
          <h2 style={{ margin: 0 }}>{locale === "am" ? "የዘርፉ ሞጁሎች" : "Department modules"}</h2>
          <span>
            {locale === "am"
              ? "ለመዝገብ፣ ማስታወቂያ እና ሚዲያ የተዘጋጀ ተደጋጋሚ ቅርጽ።"
              : "Reusable template for records, announcements, and media."}
          </span>
        </div>
        <Link className="content-card" href={`/admin/departments/${department.slug}/members`}>
          <h3>{locale === "am" ? "አባላትን አስተዳድር" : "Manage members"}</h3>
          <p>
            {locale === "am"
              ? "የዘርፉን አባላት መዝገቦች ፍጠር፣ አሻሽል እና ሰርዝ።"
              : "Create, update, and delete department member records."}
          </p>
        </Link>
        <Link className="content-card" href={`/admin/departments/${department.slug}/children`}>
          <h3>{locale === "am" ? "የልጆች መዝገቦችን አስተዳድር" : "Manage children profiles"}</h3>
          <p>
            {locale === "am"
              ? "ልጆችን በእድሜ፣ በክፍል እና በምዝገባ ዝርዝሮች ተከታተል።"
              : "Track children by age, class, section, and registration details."}
          </p>
        </Link>
        <Link className="content-card" href={`/admin/departments/${department.slug}/children/grades`}>
          <h3>{locale === "am" ? "የልጆች ውጤት አስተዳድር" : "Manage children grades"}</h3>
          <p>
            {locale === "am"
              ? "አስተማሪዎች ለልጆች እና ለወቅት ውጤት እንዲሰጡ ያስችላል።"
              : "Allow teachers to post grades per child, age group, and term."}
          </p>
        </Link>
        <Link className="content-card" href={`/admin/departments/${department.slug}/youth`}>
          <h3>{locale === "am" ? "የወጣቶች መዝገቦችን አስተዳድር" : "Manage youth profiles"}</h3>
          <p>
            {locale === "am"
              ? "ወጣቶችን በእድሜ ቡድኖች እና በአገልግሎት ሁኔታ ተከታተል።"
              : "Track youth by age groups, service status, and profile media."}
          </p>
        </Link>
        <Link className="content-card" href={`/admin/departments/${department.slug}/groups`}>
          <h3>{locale === "am" ? "ቡድኖችን አስተዳድር" : "Manage groups"}</h3>
          <p>
            {locale === "am"
              ? "ዞኖችን፣ ክፍሎችን ወይም የእድሜ ቡድኖችን ፍጠር።"
              : "Create zones, classes, or age groups for structured records."}
          </p>
        </Link>
        <Link className="content-card" href={`/admin/departments/${department.slug}/committees`}>
          <h3>{locale === "am" ? "ኮሚቴዎችን አስተዳድር" : "Manage committees"}</h3>
          <p>
            {locale === "am"
              ? "የኮሚቴ ወቅቶችን እና ዙሮችን ተከታተል።"
              : "Track current and previous committee terms and rounds."}
          </p>
        </Link>
        <Link className="content-card" href={`/admin/departments/${department.slug}/media`}>
          <h3>{locale === "am" ? "ሚዲያ አስተዳድር" : "Manage media"}</h3>
          <p>
            {locale === "am"
              ? "ለዚህ ዘርፍ ምስሎችን፣ ድምጽን፣ ቪዲዮን እና ሰነዶችን ያስገቡ።"
              : "Upload photos, audio, video, and documents for this department."}
          </p>
        </Link>
        <Link className="content-card" href={`/admin/departments/${department.slug}/documents`}>
          <h3>{locale === "am" ? "ሰነዶችን እና ሀብቶችን አስተዳድር" : "Manage documents and resources"}</h3>
          <p>
            {locale === "am"
              ? "ለድር ጣቢያ እና ለዘርፉ የሚለጠፉ ፋይሎችን አትም።"
              : "Publish live downloadable files for the website and department use."}
          </p>
        </Link>
        <Link className="content-card" href={`/admin/departments/${department.slug}/announcements`}>
          <h3>{locale === "am" ? "ማስታወቂያዎችን አስተዳድር" : "Manage announcements"}</h3>
          <p>
            {locale === "am"
              ? "የጊዜ ገደብ ያላቸውን እና አስቸኳይ ማስታወቂያዎችን ፍጠር።"
              : "Create time-bound notices and urgent updates for this department."}
          </p>
        </Link>
        <div className="card-grid">
          {department.sections.map((section) => (
            <article key={section.title} className="content-card">
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}