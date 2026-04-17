"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalLocale } from "@/lib/portal-locale";

type ChildRow = {
  id: string;
  full_name: string;
  age: number | null;
  class_name: string | null;
  section_name: string | null;
};

type GradeRow = {
  id: string;
  child_id: string;
  subject: string;
  term_label: string;
  age_group: string | null;
  score: number | null;
  grade_letter: string | null;
  teacher_name: string | null;
  remarks: string | null;
  child: ChildRow | null;
};

type GradeForm = {
  gradeId?: string;
  childId: string;
  subject: string;
  termLabel: string;
  ageGroup: string;
  score: string;
  gradeLetter: string;
  teacherName: string;
  remarks: string;
};

const initialForm: GradeForm = {
  childId: "",
  subject: "",
  termLabel: "",
  ageGroup: "",
  score: "",
  gradeLetter: "",
  teacherName: "",
  remarks: "",
};

export function ChildrenGradeManager({ departmentSlug }: { departmentSlug: string }) {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [form, setForm] = useState<GradeForm>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    const [childrenResponse, gradesResponse] = await Promise.all([
      fetch(`/api/v1/departments/${departmentSlug}/children/grades?mode=children`),
      fetch(`/api/v1/departments/${departmentSlug}/children/grades`),
    ]);

    const childrenResult = await childrenResponse.json();
    const gradesResult = await gradesResponse.json();

    if (childrenResult.success) {
      setChildren(childrenResult.data);
    }

    if (gradesResult.success) {
      setGrades(gradesResult.data);
      setMessage(null);
    } else {
      setMessage(gradesResult.error?.message ?? (locale === "am" ? "የልጆች ውጤት መጫን አልተሳካም።" : "Failed to load children grades."));
    }

    setIsLoading(false);
  }, [departmentSlug, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const response = await fetch(`/api/v1/departments/${departmentSlug}/children/grades`, {
      method: form.gradeId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gradeId: form.gradeId,
        childId: form.childId,
        subject: form.subject,
        termLabel: form.termLabel,
        ageGroup: form.ageGroup || undefined,
        score: form.score ? Number(form.score) : null,
        gradeLetter: form.gradeLetter || undefined,
        teacherName: form.teacherName || undefined,
        remarks: form.remarks || undefined,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to save grade.", "ውጤት ማስቀመጥ አልተሳካም።"));
      setIsSaving(false);
      return;
    }

    setForm(initialForm);
    setMessage(form.gradeId ? t("Grade updated.", "ውጤቱ ተሻሽሏል።") : t("Grade created.", "ውጤት ተፈጥሯል።"));
    await loadData();
    setIsSaving(false);
  }

  async function handleDelete(gradeId: string) {
    const response = await fetch(`/api/v1/departments/${departmentSlug}/children/grades`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gradeId }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to delete grade.", "ውጤት መሰረዝ አልተሳካም።"));
      return;
    }

    setMessage(t("Grade deleted.", "ውጤቱ ተሰርዟል።"));
    await loadData();
  }

  function startEdit(item: GradeRow) {
    setForm({
      gradeId: item.id,
      childId: item.child_id,
      subject: item.subject,
      termLabel: item.term_label,
      ageGroup: item.age_group ?? "",
      score: item.score !== null ? String(item.score) : "",
      gradeLetter: item.grade_letter ?? "",
      teacherName: item.teacher_name ?? "",
      remarks: item.remarks ?? "",
    });
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>{t("Children Grades", "የልጆች ውጤቶች")}</h2>
        <button className="control-btn" type="button" onClick={() => void loadData()}>
          {t("Refresh", "አድስ")}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div className="admin-grid">
          <select
            className="portal-input"
            value={form.childId}
            onChange={(event) => setForm({ ...form, childId: event.target.value })}
          >
            <option value="">{t("Select child", "ልጅ ምረጥ")}</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.full_name}
              </option>
            ))}
          </select>
          <input
            className="portal-input"
            placeholder={t("Subject", "ትምህርት")}
            value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Term / assessment", "ወቅት / ምዘና")}
            value={form.termLabel}
            onChange={(event) => setForm({ ...form, termLabel: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder={t("Age group", "የእድሜ ቡድን")}
            value={form.ageGroup}
            onChange={(event) => setForm({ ...form, ageGroup: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Score", "ነጥብ")}
            type="number"
            value={form.score}
            onChange={(event) => setForm({ ...form, score: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder={t("Grade letter", "የፊደል ውጤት")}
            value={form.gradeLetter}
            onChange={(event) => setForm({ ...form, gradeLetter: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Teacher name", "የአስተማሪ ስም")}
            value={form.teacherName}
            onChange={(event) => setForm({ ...form, teacherName: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder={t("Remarks", "ማስታወሻ")}
            value={form.remarks}
            onChange={(event) => setForm({ ...form, remarks: event.target.value })}
          />
        </div>

        <button className="control-btn" type="submit" disabled={isSaving}>
          {form.gradeId ? t("Update grade", "ውጤት አሻሽል") : t("Post grade", "ውጤት ለጥፍ")}
        </button>
      </form>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {isLoading ? <p>{t("Loading grades...", "ውጤቶች በመጫን ላይ...")}</p> : null}
        {grades.map((item) => (
          <article key={item.id} className="content-card">
            <div className="tag-row">
              <span className="tag">{item.subject}</span>
              <span>{item.term_label}</span>
            </div>
            <h3>{item.child?.full_name ?? t("Unknown child", "ያልታወቀ ልጅ")}</h3>
            <p>{t("Teacher", "አስተማሪ")}: {item.teacher_name ?? "N/A"}</p>
            <p>{t("Score", "ነጥብ")}: {item.score ?? "N/A"} | {t("Grade", "ውጤት")}: {item.grade_letter ?? "N/A"}</p>
            <p>{item.remarks ?? t("No remarks", "ማስታወሻ የለም")}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <button className="control-btn" type="button" onClick={() => startEdit(item)}>
                {t("Edit", "አሻሽል")}
              </button>
              <button className="control-btn" type="button" onClick={() => void handleDelete(item.id)}>
                {t("Delete", "ሰርዝ")}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
