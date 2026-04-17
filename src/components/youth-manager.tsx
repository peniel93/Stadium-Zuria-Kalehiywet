"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { MediaSelectorModal } from "@/components/media-selector-modal";
import { usePortalLocale } from "@/lib/portal-locale";

type YouthItem = {
  id: string;
  full_name: string;
  age: number | null;
  age_group: string | null;
  status: "active" | "inactive" | "graduated";
  photo_media_id: string | null;
  photo_media_preview_url: string | null;
};

type YouthManagerProps = {
  departmentSlug: string;
  departmentName: string;
};

type YouthFormState = {
  youthId?: string;
  fullName: string;
  age: string;
  ageGroup: string;
  status: "active" | "inactive" | "graduated";
  photoMediaId: string;
};

const initialForm: YouthFormState = {
  fullName: "",
  age: "",
  ageGroup: "",
  status: "active",
  photoMediaId: "",
};

export function YouthManager({ departmentSlug, departmentName }: YouthManagerProps) {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [items, setItems] = useState<YouthItem[]>([]);
  const [form, setForm] = useState<YouthFormState>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const loadYouth = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/v1/departments/${departmentSlug}/youth`);
    const result = (await response.json()) as {
      success: boolean;
      data: YouthItem[];
      error: { message?: string } | null;
    };

    if (result.success) {
      setItems(result.data);
      setMessage(null);
    } else {
      setMessage(result.error?.message ?? (locale === "am" ? "የወጣቶች መገለጫ መጫን አልተሳካም።" : "Failed to load youth profiles."));
    }

    setIsLoading(false);
  }, [departmentSlug, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadYouth();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadYouth]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const response = await fetch(`/api/v1/departments/${departmentSlug}/youth`, {
      method: form.youthId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        youthId: form.youthId,
        fullName: form.fullName,
        age: form.age ? Number(form.age) : null,
        ageGroup: form.ageGroup || undefined,
        status: form.status,
        photoMediaId: form.photoMediaId || null,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Unable to save youth profile.", "የወጣት መገለጫ ማስቀመጥ አልተሳካም።"));
      setIsSaving(false);
      return;
    }

    setForm(initialForm);
    setMessage(form.youthId ? t("Youth profile updated.", "የወጣት መገለጫ ተሻሽሏል።") : t("Youth profile created.", "የወጣት መገለጫ ተፈጥሯል።"));
    await loadYouth();
    setIsSaving(false);
  }

  async function handleDelete(youthId: string) {
    const response = await fetch(`/api/v1/departments/${departmentSlug}/youth`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youthId }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Unable to delete youth profile.", "የወጣት መገለጫ መሰረዝ አልተሳካም።"));
      return;
    }

    setMessage(t("Youth profile deleted.", "የወጣት መገለጫ ተሰርዟል።"));
    await loadYouth();
  }

  function startEdit(item: YouthItem) {
    setForm({
      youthId: item.id,
      fullName: item.full_name,
      age: item.age ? String(item.age) : "",
      ageGroup: item.age_group ?? "",
      status: item.status,
      photoMediaId: item.photo_media_id ?? "",
    });
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>{departmentName} {t("Youth Profiles", "የወጣቶች መገለጫዎች")}</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="control-btn" href={`/admin/departments/${departmentSlug}/media`}>
            {t("Open media", "ሚዲያ ክፈት")}
          </a>
          <button className="control-btn" type="button" onClick={() => void loadYouth()}>
            {t("Refresh", "አድስ")}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Full name", "ሙሉ ስም")}
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
          <input
            className="portal-input"
            type="number"
            placeholder={t("Age", "እድሜ")}
            value={form.age}
            onChange={(event) => setForm({ ...form, age: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Age group", "የእድሜ ቡድን")}
            value={form.ageGroup}
            onChange={(event) => setForm({ ...form, ageGroup: event.target.value })}
          />
          <button className="control-btn" type="button" onClick={() => setIsMediaModalOpen(true)}>
            {t("Pick from media", "ከሚዲያ ምረጥ")}
          </button>
        </div>

        <input
          className="portal-input"
          placeholder={t("Photo media ID", "የፎቶ ሚዲያ ID")}
          value={form.photoMediaId}
          onChange={(event) => setForm({ ...form, photoMediaId: event.target.value })}
        />

        <MediaSelectorModal
          isOpen={isMediaModalOpen}
          departmentIdentifier={departmentSlug}
          selectedMediaId={form.photoMediaId}
          onSelect={(mediaId) => setForm({ ...form, photoMediaId: mediaId })}
          onClose={() => setIsMediaModalOpen(false)}
        />

        <div className="admin-grid">
          <select
            className="portal-input"
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value as YouthFormState["status"] })
            }
          >
            <option value="active">{t("Active", "ንቁ")}</option>
            <option value="inactive">{t("Inactive", "የተቋረጠ")}</option>
            <option value="graduated">{t("Graduated", "ተመርቋል")}</option>
          </select>
          <button className="control-btn" type="submit" disabled={isSaving}>
            {form.youthId ? t("Update youth profile", "የወጣት መገለጫ አሻሽል") : t("Create youth profile", "የወጣት መገለጫ ፍጠር")}
          </button>
        </div>
      </form>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {isLoading ? <p>{t("Loading youth profiles...", "የወጣቶች መገለጫ በመጫን ላይ...")}</p> : null}
        {items.map((item) => (
          <article key={item.id} className="content-card">
            {item.photo_media_preview_url ? (
              <div style={{ position: "relative", width: "100%", height: 180, borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
                <Image
                  src={item.photo_media_preview_url}
                  alt={item.full_name}
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>
            ) : null}
            <div className="tag-row">
              <span className="tag">{item.status}</span>
              <span>{item.age_group ?? t("No age group", "የእድሜ ቡድን የለም")}</span>
            </div>
            <h3>{item.full_name}</h3>
            <p>{t("Age", "እድሜ")}: {item.age ?? "N/A"}</p>
            <p>{item.photo_media_id ? `${t("Photo media ID", "የፎቶ ሚዲያ ID")}: ${item.photo_media_id}` : t("No photo", "ፎቶ የለም")}</p>
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
