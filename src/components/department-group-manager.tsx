"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalLocale } from "@/lib/portal-locale";

type DepartmentGroupItem = {
  id: string;
  code: string;
  name_en: string;
  name_am: string;
  description: string | null;
};

type DepartmentGroupFormState = {
  groupId?: string;
  code: string;
  nameEn: string;
  nameAm: string;
  description: string;
};

type DepartmentGroupManagerProps = {
  departmentSlug: string;
  departmentName: string;
};

const initialForm: DepartmentGroupFormState = {
  code: "",
  nameEn: "",
  nameAm: "",
  description: "",
};

export function DepartmentGroupManager({ departmentSlug, departmentName }: DepartmentGroupManagerProps) {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [items, setItems] = useState<DepartmentGroupItem[]>([]);
  const [form, setForm] = useState<DepartmentGroupFormState>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/v1/departments/${departmentSlug}/groups`);
    const result = (await response.json()) as {
      success: boolean;
      data: DepartmentGroupItem[];
      error: { message?: string } | null;
    };

    if (result.success) {
      setItems(result.data);
      setMessage(null);
    } else {
      setMessage(result.error?.message ?? (locale === "am" ? "የቡድን መረጃ መጫን አልተሳካም።" : "Failed to load groups."));
    }

    setIsLoading(false);
  }, [departmentSlug, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGroups();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadGroups]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const payload = {
      groupId: form.groupId,
      code: form.code,
      nameEn: form.nameEn,
      nameAm: form.nameAm,
      description: form.description || undefined,
    };

    const response = await fetch(`/api/v1/departments/${departmentSlug}/groups`, {
      method: form.groupId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Unable to save group.", "ቡድን ማስቀመጥ አልተሳካም።"));
      setIsSaving(false);
      return;
    }

    setForm(initialForm);
    setMessage(form.groupId ? t("Group updated.", "ቡድኑ ተሻሽሏል።") : t("Group created.", "ቡድን ተፈጥሯል።"));
    await loadGroups();
    setIsSaving(false);
  }

  async function handleDelete(groupId: string) {
    setMessage(null);

    const response = await fetch(`/api/v1/departments/${departmentSlug}/groups`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Unable to delete group.", "ቡድን መሰረዝ አልተሳካም።"));
      return;
    }

    setMessage(t("Group deleted.", "ቡድኑ ተሰርዟል።"));
    await loadGroups();
  }

  function startEdit(item: DepartmentGroupItem) {
    setForm({
      groupId: item.id,
      code: item.code,
      nameEn: item.name_en,
      nameAm: item.name_am,
      description: item.description ?? "",
    });
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>{departmentName} {t("Groups", "ቡድኖች")}</h2>
        <button className="control-btn" type="button" onClick={() => void loadGroups()}>
          {t("Refresh", "አድስ")}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Code", "ኮድ")}
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder={t("Name English", "የእንግሊዝኛ ስም")}
            value={form.nameEn}
            onChange={(event) => setForm({ ...form, nameEn: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Name Amharic", "የአማርኛ ስም")}
            value={form.nameAm}
            onChange={(event) => setForm({ ...form, nameAm: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder={t("Description", "መግለጫ")}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </div>

        <button className="control-btn" type="submit" disabled={isSaving}>
          {form.groupId ? t("Update group", "ቡድን አሻሽል") : t("Create group", "ቡድን ፍጠር")}
        </button>
      </form>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {isLoading ? <p>{t("Loading groups...", "ቡድኖች በመጫን ላይ...")}</p> : null}
        {items.map((item) => (
          <article key={item.id} className="content-card">
            <div className="tag-row">
              <span className="tag">{item.code}</span>
            </div>
            <h3>{item.name_en}</h3>
            <p>{item.name_am}</p>
            <p>{item.description ?? t("No description", "መግለጫ የለም")}</p>
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
