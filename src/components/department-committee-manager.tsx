"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalLocale } from "@/lib/portal-locale";

type DepartmentCommitteeItem = {
  id: string;
  name: string;
  description: string | null;
  term_label: string | null;
  round_number: number | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
};

type DepartmentCommitteeFormState = {
  committeeId?: string;
  name: string;
  description: string;
  termLabel: string;
  roundNumber: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

type DepartmentCommitteeManagerProps = {
  departmentSlug: string;
  departmentName: string;
};

const initialForm: DepartmentCommitteeFormState = {
  name: "",
  description: "",
  termLabel: "",
  roundNumber: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
};

export function DepartmentCommitteeManager({ departmentSlug, departmentName }: DepartmentCommitteeManagerProps) {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [items, setItems] = useState<DepartmentCommitteeItem[]>([]);
  const [form, setForm] = useState<DepartmentCommitteeFormState>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadCommittees = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/v1/departments/${departmentSlug}/committees`);
    const result = (await response.json()) as {
      success: boolean;
      data: DepartmentCommitteeItem[];
      error: { message?: string } | null;
    };

    if (result.success) {
      setItems(result.data);
      setMessage(null);
    } else {
      setMessage(result.error?.message ?? (locale === "am" ? "የኮሚቴ መረጃ መጫን አልተሳካም።" : "Failed to load committees."));
    }

    setIsLoading(false);
  }, [departmentSlug, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCommittees();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCommittees]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const response = await fetch(`/api/v1/departments/${departmentSlug}/committees`, {
      method: form.committeeId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        committeeId: form.committeeId,
        name: form.name,
        description: form.description || undefined,
        termLabel: form.termLabel || undefined,
        roundNumber: form.roundNumber ? Number(form.roundNumber) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        isCurrent: form.isCurrent,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Unable to save committee.", "ኮሚቴ ማስቀመጥ አልተሳካም።"));
      setIsSaving(false);
      return;
    }

    setForm(initialForm);
    setMessage(form.committeeId ? t("Committee updated.", "ኮሚቴው ተሻሽሏል።") : t("Committee created.", "ኮሚቴ ተፈጥሯል።"));
    await loadCommittees();
    setIsSaving(false);
  }

  async function handleDelete(committeeId: string) {
    setMessage(null);

    const response = await fetch(`/api/v1/departments/${departmentSlug}/committees`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ committeeId }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Unable to delete committee.", "ኮሚቴ መሰረዝ አልተሳካም።"));
      return;
    }

    setMessage(t("Committee deleted.", "ኮሚቴው ተሰርዟል።"));
    await loadCommittees();
  }

  function startEdit(item: DepartmentCommitteeItem) {
    setForm({
      committeeId: item.id,
      name: item.name,
      description: item.description ?? "",
      termLabel: item.term_label ?? "",
      roundNumber: item.round_number ? String(item.round_number) : "",
      startDate: item.start_date ?? "",
      endDate: item.end_date ?? "",
      isCurrent: item.is_current,
    });
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>{departmentName} {t("Committees", "ኮሚቴዎች")}</h2>
        <button className="control-btn" type="button" onClick={() => void loadCommittees()}>
          {t("Refresh", "አድስ")}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Committee name", "የኮሚቴ ስም")}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder={t("Term label", "የወቅት ምልክት")}
            value={form.termLabel}
            onChange={(event) => setForm({ ...form, termLabel: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Description", "መግለጫ")}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder={t("Round number", "የዙር ቁጥር")}
            type="number"
            value={form.roundNumber}
            onChange={(event) => setForm({ ...form, roundNumber: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            type="date"
            value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })}
          />
          <input
            className="portal-input"
            type="date"
            value={form.endDate}
            onChange={(event) => setForm({ ...form, endDate: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <label className="toggle-box">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(event) => setForm({ ...form, isCurrent: event.target.checked })}
            />
            {t("Current committee", "የአሁኑ ኮሚቴ")}
          </label>
          <button className="control-btn" type="submit" disabled={isSaving}>
            {form.committeeId ? t("Update committee", "ኮሚቴ አሻሽል") : t("Create committee", "ኮሚቴ ፍጠር")}
          </button>
        </div>
      </form>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {isLoading ? <p>{t("Loading committees...", "ኮሚቴዎች በመጫን ላይ...")}</p> : null}
        {items.map((item) => (
          <article key={item.id} className="content-card">
            <div className="tag-row">
              <span className="tag">{item.is_current ? t("Current", "አሁን") : t("Archived", "ተማህዷል")}</span>
              <span>{item.term_label ?? t("No term label", "የወቅት ምልክት የለም")}</span>
            </div>
            <h3>{item.name}</h3>
            <p>{item.description ?? t("No description", "መግለጫ የለም")}</p>
            <p>{item.start_date ?? t("No start date", "የመጀመሪያ ቀን የለም")} - {item.end_date ?? t("No end date", "የመጨረሻ ቀን የለም")}</p>
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
