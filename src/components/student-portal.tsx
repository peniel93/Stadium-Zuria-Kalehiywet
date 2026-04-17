"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortalLocale } from "@/lib/portal-locale";

type StudentProfile = {
  class_name: string | null;
  section_name: string | null;
  age_group: string | null;
  courses: string[] | null;
  teachers: string[] | null;
  grades: Record<string, string | number> | null;
  member:
    | {
        full_name: string | null;
        contact_phone: string | null;
        contact_email: string | null;
      }
    | Array<{
        full_name: string | null;
        contact_phone: string | null;
        contact_email: string | null;
      }>
    | null;
  identity:
    | {
        identity_number: string;
        username: string;
      }
    | Array<{
        identity_number: string;
        username: string;
      }>
    | null;
};

type StudentAnnouncement = {
  id: string;
  categoryCode: string;
  title: {
    en: string;
    am: string;
  };
  summary: {
    en: string;
    am: string;
  };
  date: string;
  categoryName: {
    en: string;
    am: string;
  };
  urgent: boolean;
};

type GradeHistoryItem = {
  id: string;
  class_name: string | null;
  section_name: string | null;
  age_group: string | null;
  courses: string[] | null;
  teachers: string[] | null;
  grades: Record<string, string | number> | null;
  created_at: string;
};

export function StudentLoginCard() {
  const locale = usePortalLocale();
  const router = useRouter();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [identityNumber, setIdentityNumber] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();

    const response = await fetch("/api/v1/student/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identityNumber, username }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Login failed.", "መግቢያ አልተሳካም።"));
      return;
    }

    setMessage(null);
    router.push("/student");
    router.refresh();
  }

  return (
    <section className="panel" style={{ width: "min(560px, calc(100% - 2rem))", margin: "2rem auto", display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>{t("Student Login", "የተማሪ መግቢያ")}</h1>
      <p style={{ margin: 0, color: "var(--muted)" }}>{t("Use your auto-generated ID number and username.", "በራሱ የተፈጠረ ID ቁጥር እና የተጠቃሚ ስም ይግቡ።")}</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input className="portal-input" value={identityNumber} onChange={(event) => setIdentityNumber(event.target.value)} placeholder={t("Student ID number", "የተማሪ ID ቁጥር")} />
        <input className="portal-input" value={username} onChange={(event) => setUsername(event.target.value)} placeholder={t("Username", "የተጠቃሚ ስም")} />
        <button className="control-btn" type="submit">{t("Sign in", "ግባ")}</button>
      </form>
      {message ? <p style={{ margin: 0, color: "var(--warn)" }}>{message}</p> : null}
    </section>
  );
}

export function StudentDashboard() {
  const locale = usePortalLocale();
  const router = useRouter();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [announcements, setAnnouncements] = useState<StudentAnnouncement[]>([]);
  const [history, setHistory] = useState<GradeHistoryItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    className: "",
    sectionName: "",
    ageGroup: "",
    coursesCsv: "",
    teachersCsv: "",
    gradesCsv: "",
  });

  const loadProfile = useCallback(async () => {
    const response = await fetch("/api/v1/student/profile");
    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? (locale === "am" ? "ፕሮፋይል መጫን አልተሳካም።" : "Failed to load profile."));
      return;
    }

    const nextProfile = result.data as StudentProfile;
    const courses = Array.isArray(nextProfile.courses) ? nextProfile.courses.join(", ") : "";
    const teachers = Array.isArray(nextProfile.teachers) ? nextProfile.teachers.join(", ") : "";
    const grades = nextProfile.grades
      ? Object.entries(nextProfile.grades)
          .map(([k, v]) => `${k}:${v}`)
          .join(", ")
      : "";

    setProfile(nextProfile);
    setForm({
      className: nextProfile.class_name ?? "",
      sectionName: nextProfile.section_name ?? "",
      ageGroup: nextProfile.age_group ?? "",
      coursesCsv: courses,
      teachersCsv: teachers,
      gradesCsv: grades,
    });
    setMessage(null);
  }, [locale]);

  const loadAnnouncements = useCallback(async () => {
    const response = await fetch("/api/v1/main-board/feed?limit=4");
    const result = await response.json();

    if (result.success) {
      setAnnouncements(result.data as StudentAnnouncement[]);
    }
  }, []);

  const loadGradeHistory = useCallback(async () => {
    const response = await fetch("/api/v1/student/grade-history");
    const result = await response.json();

    if (result.success) {
      setHistory(result.data as GradeHistoryItem[]);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAnnouncements();
      void loadGradeHistory();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAnnouncements, loadGradeHistory]);

  const normalizedGrades = useMemo(() => {
    const map: Record<string, string> = {};

    for (const item of form.gradesCsv.split(",")) {
      const [subjectRaw, valueRaw] = item.split(":");
      const subject = subjectRaw?.trim();
      const value = valueRaw?.trim();

      if (subject && value) {
        map[subject] = value;
      }
    }

    return map;
  }, [form.gradesCsv]);

  async function save(event: FormEvent) {
    event.preventDefault();

    const response = await fetch("/api/v1/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        className: form.className,
        sectionName: form.sectionName,
        ageGroup: form.ageGroup,
        courses: form.coursesCsv.split(",").map((item) => item.trim()).filter(Boolean),
        teachers: form.teachersCsv.split(",").map((item) => item.trim()).filter(Boolean),
        grades: normalizedGrades,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to save profile.", "ፕሮፋይል ማስቀመጥ አልተሳካም።"));
      return;
    }

    setMessage(t("Profile updated.", "ፕሮፋይል ተሻሽሏል።"));
    await loadProfile();
  }

  async function logout() {
    await fetch("/api/v1/student/session", { method: "DELETE" });
    router.push("/student/login");
    router.refresh();
  }

  const member = Array.isArray(profile?.member) ? profile?.member[0] : profile?.member;
  const identity = Array.isArray(profile?.identity) ? profile?.identity[0] : profile?.identity;
  const courses = profile?.courses ?? [];
  const teachers = profile?.teachers ?? [];
  const grades = profile?.grades ?? {};
  const gradeEntries = Object.entries(grades);

  function toComparableList(values: string[] | null | undefined) {
    return (values ?? []).map((item) => item.trim()).filter(Boolean).join(" | ");
  }

  function buildHistoryDiff(current: GradeHistoryItem, previous?: GradeHistoryItem) {
    if (!previous) {
      return [t("First recorded snapshot", "የመጀመሪያ ተመዝግቦ ነበር")];
    }

    const changes: string[] = [];

    const compare = (label: string, currentValue: string, previousValue: string) => {
      if (currentValue !== previousValue) {
        changes.push(`${label}: ${previousValue || "-"} → ${currentValue || "-"}`);
      }
    };

    compare(t("Class", "ክፍል"), current.class_name ?? "", previous.class_name ?? "");
    compare(t("Section", "ሴክሽን"), current.section_name ?? "", previous.section_name ?? "");
    compare(t("Age Group", "የእድሜ ቡድን"), current.age_group ?? "", previous.age_group ?? "");
    compare(t("Courses", "ኮርሶች"), toComparableList(current.courses), toComparableList(previous.courses));
    compare(t("Teachers", "አስተማሪዎች"), toComparableList(current.teachers), toComparableList(previous.teachers));
    compare(t("Grades", "ውጤቶች"), JSON.stringify(current.grades ?? {}), JSON.stringify(previous.grades ?? {}));

    return changes.length ? changes : [t("No field changes recorded", "የተመዘገበ ለውጥ የለም")];
  }

  function downloadStudentReport() {
    const rows = [
      ["Field", "Value"],
      ["Name", member?.full_name ?? ""],
      ["Student ID", identity?.identity_number ?? ""],
      ["Username", identity?.username ?? ""],
      ["Class", form.className],
      ["Section", form.sectionName],
      ["Age Group", form.ageGroup],
      ["Courses", courses.join(" | ")],
      ["Teachers", teachers.join(" | ")],
    ];

    for (const [subject, score] of gradeEntries) {
      rows.push([`Grade: ${subject}`, String(score)]);
    }

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `student-report-${identity?.identity_number ?? "profile"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function printStudentCard() {
    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!printWindow) {
      setMessage(t("Popup blocked. Please allow popups to print the card.", "ማውጫ ተዘግቷል። እባክዎ ፖፕ-አፕ ይፍቀዱ።"));
      return;
    }

    const gradeMarkup = gradeEntries
      .map(([subject, score]) => `<li><strong>${subject}</strong>: ${String(score)}</li>`)
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${identity?.identity_number ?? "Student Card"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #12324b; }
            .card { border: 2px solid #1f6fb2; border-radius: 20px; padding: 24px; max-width: 720px; margin: 0 auto; }
            h1, h2, p { margin: 0 0 12px; }
            .muted { color: #4b657d; }
            .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
            .chip { border: 1px solid #9dc7e8; border-radius: 999px; padding: 6px 12px; }
            ul { margin: 0; padding-left: 18px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${member?.full_name ?? "Student"}</h1>
            <p class="muted">${identity?.identity_number ?? ""} | ${identity?.username ?? ""}</p>
            <div class="chips">
              <span class="chip">${form.className || t("Class not set", "ክፍል አልተዘጋጀም")}</span>
              <span class="chip">${form.sectionName || t("Section not set", "ሴክሽን አልተዘጋጀም")}</span>
              <span class="chip">${form.ageGroup || t("Age group not set", "የእድሜ ቡድን አልተዘጋጀም")}</span>
            </div>
            <h2>${t("Courses", "ኮርሶች")}</h2>
            <p>${courses.length ? courses.join(" | ") : t("No courses yet", "እስካሁን ኮርስ የለም")}</p>
            <h2>${t("Grades", "ውጤቶች")}</h2>
            <ul>${gradeMarkup || `<li>${t("No grades yet", "እስካሁን ውጤት የለም")}</li>`}</ul>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <main style={{ width: "min(1100px, calc(100% - 2rem))", margin: "1rem auto 2rem", display: "grid", gap: 16 }}>
      <section className="panel" style={{ display: "grid", gap: 8 }}>
        <h1 style={{ margin: 0 }}>{t("Student Dashboard", "የተማሪ ዳሽቦርድ")}</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          {t("View profile, class, courses, teachers, and grades.", "ፕሮፋይል፣ ክፍል፣ ኮርሶች፣ አስተማሪዎች እና ውጤቶችን ይመልከቱ።")}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="department-chip">{t("Name", "ስም")}: {member?.full_name ?? "N/A"}</span>
          <span className="department-chip">{t("Student ID", "የተማሪ ID")}: {identity?.identity_number ?? "N/A"}</span>
          <span className="department-chip">{t("Username", "የተጠቃሚ ስም")}: {identity?.username ?? "N/A"}</span>
        </div>
        <div className="card-grid">
          <article className="content-card">
            <h3>{t("Class", "ክፍል")}</h3>
            <p>{form.className || t("Not set yet", "እስካሁን አልተዘጋጀም")}</p>
          </article>
          <article className="content-card">
            <h3>{t("Section", "ሴክሽን")}</h3>
            <p>{form.sectionName || t("Not set yet", "እስካሁን አልተዘጋጀም")}</p>
          </article>
          <article className="content-card">
            <h3>{t("Courses", "ኮርሶች")}</h3>
            <p>{courses.length} {t("active courses", "ንቁ ኮርሶች")}</p>
          </article>
          <article className="content-card">
            <h3>{t("Grades", "ውጤቶች")}</h3>
            <p>{gradeEntries.length} {t("tracked results", "የተከታተሉ ውጤቶች")}</p>
          </article>
        </div>
        <button className="control-btn" type="button" onClick={() => void logout()} style={{ width: "fit-content" }}>
          {t("Sign out", "ውጣ")}
        </button>
        <button className="control-btn" type="button" onClick={downloadStudentReport} style={{ width: "fit-content" }}>
          {t("Download report", "ሪፖርት አውርድ")}
        </button>
        <button className="control-btn" type="button" onClick={printStudentCard} style={{ width: "fit-content" }}>
          {t("Print profile card", "የፕሮፋይል ካርድ አትም")}
        </button>
      </section>

      <section className="panel" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t("Profile / Classes / Grades", "ፕሮፋይል / ክፍል / ውጤት")}</h2>
        <form onSubmit={save} style={{ display: "grid", gap: 10 }}>
          <div className="admin-grid">
            <input className="portal-input" placeholder={t("Class", "ክፍል")} value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} />
            <input className="portal-input" placeholder={t("Section", "ሴክሽን")} value={form.sectionName} onChange={(event) => setForm({ ...form, sectionName: event.target.value })} />
          </div>
          <input className="portal-input" placeholder={t("Age Group", "የእድሜ ቡድን")} value={form.ageGroup} onChange={(event) => setForm({ ...form, ageGroup: event.target.value })} />
          <input className="portal-input" placeholder={t("Courses (comma separated)", "ኮርሶች (በኮማ ይለዩ)")} value={form.coursesCsv} onChange={(event) => setForm({ ...form, coursesCsv: event.target.value })} />
          <input className="portal-input" placeholder={t("Teachers (comma separated)", "አስተማሪዎች (በኮማ ይለዩ)")} value={form.teachersCsv} onChange={(event) => setForm({ ...form, teachersCsv: event.target.value })} />
          <textarea className="portal-input" rows={4} placeholder={t("Grades as Subject:Score, Subject:Score", "ውጤት እንደ ትምህርት:ነጥብ")}
            value={form.gradesCsv}
            onChange={(event) => setForm({ ...form, gradesCsv: event.target.value })}
          />
          <button className="control-btn" type="submit">{t("Update profile", "ፕሮፋይል አዘምን")}</button>
        </form>
        {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}
      </section>

      <section className="panel" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t("Courses and Grades", "ኮርሶች እና ውጤቶች")}</h2>

        <div>
          <h3 style={{ marginTop: 0 }}>{t("Courses", "ኮርሶች")}</h3>
          <div className="department-list">
            {courses.length ? courses.map((course) => <span key={course} className="department-chip">{course}</span>) : <span className="department-chip">{t("No courses yet", "እስካሁን ኮርስ የለም")}</span>}
          </div>
        </div>

        <div>
          <h3 style={{ marginTop: 0 }}>{t("Teachers", "አስተማሪዎች")}</h3>
          <div className="department-list">
            {teachers.length ? teachers.map((teacher) => <span key={teacher} className="department-chip">{teacher}</span>) : <span className="department-chip">{t("No teachers yet", "እስካሁን አስተማሪ የለም")}</span>}
          </div>
        </div>

        <div>
          <h3 style={{ marginTop: 0 }}>{t("Grades", "ውጤቶች")}</h3>
          <div className="card-grid">
            {gradeEntries.length ? gradeEntries.map(([subject, score]) => (
              <article key={subject} className="content-card">
                <h3>{subject}</h3>
                <p>{String(score)}</p>
              </article>
            )) : <p style={{ margin: 0, color: "var(--muted)" }}>{t("No grades yet", "እስካሁን ውጤት የለም")}</p>}
          </div>
        </div>
      </section>

      <section className="panel" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t("Announcements", "ማስታወቂያዎች")}</h2>
        <div className="card-grid">
          {announcements.length ? announcements.map((announcement) => (
            <Link key={announcement.id} href={`/updates/${announcement.categoryCode}/${announcement.id}?lang=${locale}`} className={`content-card ${announcement.urgent ? "urgent" : ""}`}>
              <div className="tag-row">
                <span className="tag">{locale === "am" ? announcement.categoryName.am : announcement.categoryName.en}</span>
                {announcement.urgent ? <span className="tag">{t("Urgent", "አስቸኳይ")}</span> : null}
              </div>
              <h3>{locale === "am" ? announcement.title.am : announcement.title.en}</h3>
              <p>{locale === "am" ? announcement.summary.am : announcement.summary.en}</p>
            </Link>
          )) : <p style={{ margin: 0, color: "var(--muted)" }}>{t("No announcements yet", "እስካሁን ማስታወቂያ የለም")}</p>}
        </div>
      </section>

      <section className="panel" style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t("Grade History", "የውጤት ታሪክ")}</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {history.length ? history.map((item, index) => {
            const previous = history[index + 1];
            const changes = buildHistoryDiff(item, previous);

            return (
            <article key={item.id} className="content-card">
              <div className="tag-row">
                <span className="tag">{new Date(item.created_at).toLocaleString(locale === "am" ? "am-ET" : "en-US")}</span>
                <span className="tag">{item.class_name || t("No class", "ክፍል የለም")}</span>
              </div>
              <p>{t("Section", "ሴክሽን")}: {item.section_name ?? "N/A"}</p>
              <p>{t("Age Group", "የእድሜ ቡድን")}: {item.age_group ?? "N/A"}</p>
              <p>{t("Courses", "ኮርሶች")}: {(item.courses ?? []).join(" | ") || "N/A"}</p>
              <p>{t("Teachers", "አስተማሪዎች")}: {(item.teachers ?? []).join(" | ") || "N/A"}</p>
              <p>{t("Grades", "ውጤቶች")}: {Object.entries(item.grades ?? {}).map(([subject, score]) => `${subject}: ${score}`).join(" | ") || "N/A"}</p>
              <div className="department-list" style={{ marginTop: 12 }}>
                {changes.map((change) => (
                  <span key={change} className="department-chip">{change}</span>
                ))}
              </div>
            </article>
          );
          }) : <p style={{ margin: 0, color: "var(--muted)" }}>{t("No grade history yet", "እስካሁን የውጤት ታሪክ የለም")}</p>}
        </div>
      </section>
    </main>
  );
}
