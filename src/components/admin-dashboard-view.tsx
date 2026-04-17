"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAppearanceControls } from "@/components/admin-appearance-controls";
import { LogoutButton } from "@/components/logout-button";
import { usePortalLocale } from "@/lib/portal-locale";

type DepartmentItem = {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string;
  description: string | null;
};

type AdminDashboardViewProps = {
  email?: string | null;
  roles: string[];
};

export function AdminDashboardView({ email, roles }: AdminDashboardViewProps) {
  const locale = usePortalLocale();
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [isQuickDrawerOpen, setIsQuickDrawerOpen] = useState(false);
  const [unreadCommsCount, setUnreadCommsCount] = useState(0);
  const featuredDepartmentCodes = ["menfesawi_zerf", "women_ministry", "prayer_team", "choir_ministry"];

  const dashboardDepartments = departments
    .filter((department) => department.code)
    .filter(
      (department, index, list) =>
        list.findIndex((item) => item.code.toLowerCase() === department.code.toLowerCase()) === index,
    )
    .sort((a, b) => {
      const aIndex = featuredDepartmentCodes.indexOf(a.code);
      const bIndex = featuredDepartmentCodes.indexOf(b.code);

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      if (aIndex !== -1) {
        return -1;
      }

      if (bIndex !== -1) {
        return 1;
      }

      const aName = (locale === "am" ? a.nameAm : a.nameEn) || a.code;
      const bName = (locale === "am" ? b.nameAm : b.nameEn) || b.code;
      return aName.localeCompare(bName);
    });

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const [departmentResponse, communicationResponse] = await Promise.all([
        fetch("/api/v1/departments?includeInactive=true"),
        fetch("/api/v1/admin/internal-communications"),
      ]);

      const result = await departmentResponse.json();
      const communicationResult = await communicationResponse.json();

      if (result.success) {
        setDepartments(result.data);
      }

      if (communicationResult.success) {
        const unreadCount = (communicationResult.data as Array<{ reviewed_at?: string | null }>).filter(
          (item) => !item.reviewed_at,
        ).length;
        setUnreadCommsCount(unreadCount);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main style={{ width: "min(1180px, calc(100% - 2rem))", margin: "1rem auto 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>
            {locale === "am" ? "የዋና አስተዳዳሪ ዳሽቦርድ" : "Super Admin Dashboard (Authorized)"}
          </h1>
          <p style={{ color: "var(--muted)" }}>
            {locale === "am"
              ? `ገብተዋል: ${email ?? "unknown"}. የሚታዩ ሚናዎች: ${roles.join(", ") || "none"}`
              : `Logged in as ${email ?? "unknown"}. Roles: ${roles.join(", ") || "none"}`}
          </p>
          <AdminAppearanceControls />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
          <button
            className="control-btn"
            type="button"
            onClick={() => setIsQuickDrawerOpen((prev) => !prev)}
            aria-expanded={isQuickDrawerOpen}
            aria-controls="admin-mobile-quick-links"
          >
            {locale === "am" ? "ፈጣን ሊንኮች" : "Quick links"}
          </button>
          <LogoutButton />
        </div>
      </div>

      {isQuickDrawerOpen ? (
        <section id="admin-mobile-quick-links" className="panel" style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <h2 style={{ margin: 0 }}>{locale === "am" ? "የሞባይል ፈጣን እርምጃዎች" : "Mobile quick actions"}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Link className="department-chip" href="/admin/internal-communications" onClick={() => setIsQuickDrawerOpen(false)}>
              {locale === "am" ? "የውስጥ መልዕክቶች" : "Internal Comms"}
              {unreadCommsCount > 0 ? ` (${unreadCommsCount})` : ""}
            </Link>
            <Link className="department-chip" href="/admin/identities" onClick={() => setIsQuickDrawerOpen(false)}>
              {locale === "am" ? "የID አስተዳደር" : "ID Management"}
            </Link>
            <Link className="department-chip" href="/admin/sub-youth" onClick={() => setIsQuickDrawerOpen(false)}>
              {locale === "am" ? "ንዑስ ወጣቶች" : "Sub Youth"}
            </Link>
            <Link className="department-chip" href="/student/login" onClick={() => setIsQuickDrawerOpen(false)}>
              {locale === "am" ? "የተማሪ መግቢያ" : "Student Login"}
            </Link>
          </div>
        </section>
      ) : null}

      <section className="panel" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{locale === "am" ? "የዳሽቦርድ ፈጣን መንገዶች" : "Dashboard shortcuts"}</h2>
        <div className="card-grid">
          <Link className="content-card" href="/admin/hr">
            <h3>{locale === "am" ? "የሰራተኞች ዳሽቦርድ" : "HR Dashboard"}</h3>
            <p>
              {locale === "am"
                ? "ሰራተኞች፣ ግንኙነት፣ ደመወዝ፣ ትምህርት እና የሥራ ሁኔታን ያስተዳድሩ።"
                : "Manage all workers, contacts, posts, salary, education, and employment status."}
            </p>
          </Link>
          <Link className="content-card" href="/admin/members">
            <h3>{locale === "am" ? "የአባላት መዝገብ" : "Members Registry"}</h3>
            <p>
              {locale === "am"
                ? "በዞን፣ በምድብ፣ በሚና እና በሁኔታ ይፈልጉ እና ያጣሩ።"
                : "List and filter all members by zone, category, role, and status."}
            </p>
          </Link>
          <Link className="content-card" href="/admin/training">
            <h3>{locale === "am" ? "ስልጠና እና ትምህርት" : "Training and Education"}</h3>
            <p>
              {locale === "am"
                ? "ኮርሶችን ይፍጠሩ፣ አስተማሪዎችን እና ተማሪዎችን ያክሉ፣ ውጤት ይመዝግቡ።"
                : "Create courses, assign teachers/students, and post assessment grades."}
            </p>
          </Link>
          <Link className="content-card" href="/admin/access">
            <h3>{locale === "am" ? "የመዳረሻ አስተዳደር" : "Access Management"}</h3>
            <p>
              {locale === "am"
                ? "ሚናዎችን እና የዘርፍ አስተዳዳሪ ፍቃዶችን ይመድቡ።"
                : "Assign roles and department-admin privileges to users."}
            </p>
          </Link>
          <Link className="content-card" href="/admin/identities">
            <h3>{locale === "am" ? "የID እና የተጠቃሚ ስም" : "ID and Username"}</h3>
            <p>
              {locale === "am"
                ? "የ8 ዲጂት መለያ ቁጥር እና የተጠቃሚ ስም ይፍጠሩ እና ያስተዳድሩ።"
                : "Generate auto 8-digit IDs, set usernames, and manage role groups."}
            </p>
          </Link>
          <Link className="content-card" href="/admin/internal-communications">
            <h3>
              {locale === "am" ? "የዳሽቦርድ ውስጥ መልዕክት" : "Internal Communications"}
              {unreadCommsCount > 0 ? ` (${unreadCommsCount} ${locale === "am" ? "አዲስ" : "new"})` : ""}
            </h3>
            <p>
              {locale === "am"
                ? "በሚና፣ በዘርፍ ወይም በተጠቃሚ መልዕክቶችን ይላኩ፣ አባሪ ሰነድ ያክሉ።"
                : "Send role/department/user messages and attach documents for inter-dashboard coordination."}
            </p>
          </Link>
          <Link className="content-card" href="/admin/sub-youth">
            <h3>{locale === "am" ? "ንዑስ ወጣቶች ዳሽቦርድ" : "Sub Youth Dashboard"}</h3>
            <p>
              {locale === "am"
                ? "የትምህርት፣ የሙያ፣ የጋብቻ፣ የተማሪ እና የቅጥር ሁኔታ ሪፖርቶችን ይመልከቱ።"
                : "See member dimensions by education, career, marriage, student stage, and employment."}
            </p>
          </Link>
          <Link className="content-card" href="/student/login">
            <h3>{locale === "am" ? "የተማሪ ፖርታል" : "Student Portal"}</h3>
            <p>
              {locale === "am"
                ? "በID እና username የተማሪ መግቢያ፣ ፕሮፋይል፣ ክፍል እና ውጤት።"
                : "Student sign-in with ID and username, plus profile/classes/grades dashboard."}
            </p>
          </Link>
          <Link className="content-card" href="/admin/media">
            <h3>{locale === "am" ? "የሚዲያ ማዕከል" : "Media Library"}</h3>
            <p>
              {locale === "am"
                ? "ምስሎችን፣ ድምጽን፣ ቪዲዮን እና ሰነዶችን ያስገቡ።"
                : "Upload images, audio, video, and documents for portal modules."}
            </p>
          </Link>
          <Link className="content-card" href="/admin/announcements">
            <h3>{locale === "am" ? "ማስታወቂያዎች አስተዳደር" : "Announcements Management"}</h3>
            <p>
              {locale === "am"
                ? "ማስታወቂያዎችን ይፍጠሩ፣ ያሻሽሉ እና ይቆምቱ።"
                : "Create, update, and archive notices with expiry control."}
            </p>
          </Link>
          <Link className="content-card" href="/admin/home-content">
            <h3>{locale === "am" ? "የመነሻ ገፅ ይዘት" : "Home Content"}</h3>
            <p>
              {locale === "am"
                ? "ስላይዶችን፣ ፕሮግራሞችን፣ ኮንፈረንሶችን እና የመነሻ ገፅ ማስታወቂያዎችን በአንድ ቦታ ያስተዳድሩ።"
                : "Manage homepage sliders, programs, conferences, vacancies, and featured notices in one place."}
            </p>
          </Link>
          <Link className="content-card" href="/admin/contact">
            <h3>{locale === "am" ? "የግንኙነት መልዕክቶች" : "Contact Inbox"}</h3>
            <p>
              {locale === "am"
                ? "ከአግኙን ገጽ የሚላኩ መልዕክቶችን ይቀበሉ፣ ይምልከቱ እና ሁኔታ ይስጡ።"
                : "Review messages from Contact page, track status, and store replies."}
            </p>
          </Link>
          <Link className="content-card" href="/admin/settings">
            <h3>{locale === "am" ? "የፕላትፎርም ቅንብሮች" : "Platform Settings"}</h3>
            <p>
              {locale === "am"
                ? "ፉተር፣ የቅጂ መብት ጽሑፍ፣ ቆጠራዎች እና ዘርፎችን በዳታቤዝ ያስተዳድሩ።"
                : "Edit footer/copyright text, homepage counters, and create departments."}
            </p>
          </Link>
          <Link className="content-card" href="/resources">
            <h3>{locale === "am" ? "የሕዝብ ሀብቶች ገጽ" : "Public Resources Page"}</h3>
            <p>
              {locale === "am"
                ? "በዘርፎች የተለጠፉ ሰነዶችን ይመልከቱ።"
                : "View live downloadable documents published by departments."}
            </p>
          </Link>
        </div>
      </section>

      <section className="panel" style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <div className="section-head">
          <h2 style={{ margin: 0 }}>{locale === "am" ? "የዘርፍ ዳሽቦርዶች" : "Department dashboards"}</h2>
          <span>
            {locale === "am"
              ? "ሁሉም የተመዘገቡ ዘርፎች ከልዩ ዳሽቦርድ ጋር።"
              : "All registered departments with dedicated dashboards."}
          </span>
        </div>
        <div className="card-grid">
          {dashboardDepartments.map((department) => (
            <Link key={department.id} className="content-card" href={`/admin/departments/${department.code}`}>
              <h3>{locale === "am" ? department.nameAm : department.nameEn}</h3>
              <p>{department.description ?? (locale === "am" ? "የዘርፍ መግለጫ አልተጨመረም።" : "No department summary added yet.")}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}