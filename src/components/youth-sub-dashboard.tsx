"use client";

import { useEffect, useState } from "react";
import { usePortalLocale } from "@/lib/portal-locale";

type Summary = {
  totalMembers: number;
  educationStatus: Record<string, number>;
  occupationStatus: Record<string, number>;
  marriageStatus: Record<string, number>;
  studentStage: Record<string, number>;
  employmentType: Record<string, number>;
};

function StatGroup({ title, values }: { title: string; values: Record<string, number> }) {
  const entries = Object.entries(values).sort((a, b) => b[1] - a[1]);

  return (
    <article className="content-card" style={{ display: "grid", gap: 8 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {entries.length === 0 ? <p style={{ margin: 0 }}>No records yet.</p> : null}
      {entries.map(([label, count]) => (
        <div key={label} className="tag-row">
          <span className="tag">{label}</span>
          <strong>{count}</strong>
        </div>
      ))}
    </article>
  );
}

export function YouthSubDashboard() {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/v1/admin/youth-summary");
      const result = await response.json();

      if (!result.success) {
        setMessage(result.error?.message ?? (locale === "am" ? "ማጠቃለያ መጫን አልተሳካም።" : "Failed to load summary."));
        return;
      }

      setSummary(result.data);
      setMessage(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [locale]);

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>{t("Sub Youth Dashboard", "ንዑስ የወጣቶች ዳሽቦርድ")}</h2>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          {t(
            "Track student and workforce dimensions: university/highschool/primary, graduates/undergraduates, employed/business/self-employed/freelancer/remote.",
            "የተማሪ እና የሥራ ክፍል ልኬቶችን ይከታተሉ።",
          )}
        </p>
      </div>

      {summary ? (
        <article className="content-card">
          <h3 style={{ margin: 0 }}>{t("Total tracked members", "የተከታተሉ አባላት ጠቅላላ")}: {summary.totalMembers}</h3>
        </article>
      ) : null}

      {message ? <p style={{ margin: 0, color: "var(--warn)" }}>{message}</p> : null}

      {summary ? (
        <div className="card-grid">
          <StatGroup title={t("Educational Status", "የትምህርት ሁኔታ")} values={summary.educationStatus} />
          <StatGroup title={t("Occupation/Career", "የስራ/ሙያ ሁኔታ")} values={summary.occupationStatus} />
          <StatGroup title={t("Marriage Status", "የጋብቻ ሁኔታ")} values={summary.marriageStatus} />
          <StatGroup title={t("Student Stage", "የተማሪ ደረጃ")} values={summary.studentStage} />
          <StatGroup title={t("Employment Type", "የቅጥር አይነት")} values={summary.employmentType} />
        </div>
      ) : null}
    </section>
  );
}
