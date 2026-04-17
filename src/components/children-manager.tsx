"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { MediaSelectorModal } from "@/components/media-selector-modal";
import { usePortalLocale } from "@/lib/portal-locale";

type ChildItem = {
  id: string;
  full_name: string;
  age: number | null;
  education_level: string | null;
  class_name: string | null;
  section_name: string | null;
  status: "active" | "inactive" | "graduated";
  date_of_registration: string | null;
  photo_media_id: string | null;
  photo_media_preview_url: string | null;
};

type ChildrenManagerProps = {
  departmentSlug: string;
  departmentName: string;
};

type ChildFormState = {
  childId?: string;
  fullName: string;
  age: string;
  educationLevel: string;
  className: string;
  sectionName: string;
  status: "active" | "inactive" | "graduated";
  dateOfRegistration: string;
  photoMediaId: string;
};

const initialForm: ChildFormState = {
  fullName: "",
  age: "",
  educationLevel: "",
  className: "",
  sectionName: "",
  status: "active",
  dateOfRegistration: "",
  photoMediaId: "",
};

export function ChildrenManager({ departmentSlug, departmentName }: ChildrenManagerProps) {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [items, setItems] = useState<ChildItem[]>([]);
  const [form, setForm] = useState<ChildFormState>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const loadChildren = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/v1/departments/${departmentSlug}/children`);
    const result = (await response.json()) as {
      success: boolean;
      data: ChildItem[];
      error: { message?: string } | null;
    };

    if (result.success) {
      setItems(result.data);
      setMessage(null);
    } else {
      setMessage(result.error?.message ?? (locale === "am" ? "የልጆች መረጃ መጫን አልተሳካም።" : "Failed to load children profiles."));
    }

    setIsLoading(false);
  }, [departmentSlug, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadChildren();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadChildren]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const response = await fetch(`/api/v1/departments/${departmentSlug}/children`, {
      method: form.childId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId: form.childId,
        fullName: form.fullName,
        age: form.age ? Number(form.age) : null,
        educationLevel: form.educationLevel || undefined,
        className: form.className || undefined,
        sectionName: form.sectionName || undefined,
        status: form.status,
        dateOfRegistration: form.dateOfRegistration || null,
        photoMediaId: form.photoMediaId || null,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Unable to save child profile.", "የልጅ መገለጫ ማስቀመጥ አልተሳካም።"));
      setIsSaving(false);
      return;
    }

    setForm(initialForm);
    setMessage(form.childId ? t("Child profile updated.", "የልጅ መገለጫ ተሻሽሏል።") : t("Child profile created.", "የልጅ መገለጫ ተፈጥሯል።"));
    await loadChildren();
    setIsSaving(false);
  }

  async function handleDelete(childId: string) {
    const response = await fetch(`/api/v1/departments/${departmentSlug}/children`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Unable to delete child profile.", "የልጅ መገለጫ መሰረዝ አልተሳካም።"));
      return;
    }

    setMessage(t("Child profile deleted.", "የልጅ መገለጫ ተሰርዟል።"));
    await loadChildren();
  }

  function startEdit(item: ChildItem) {
    setForm({
      childId: item.id,
      fullName: item.full_name,
      age: item.age ? String(item.age) : "",
      educationLevel: item.education_level ?? "",
      className: item.class_name ?? "",
      sectionName: item.section_name ?? "",
      status: item.status,
      dateOfRegistration: item.date_of_registration ?? "",
      photoMediaId: item.photo_media_id ?? "",
    });
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>{departmentName} {t("Children Profiles", "የልጆች መገለጫዎች")}</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="control-btn" href={`/admin/departments/${departmentSlug}/media`}>
            {t("Open media", "ሚዲያ ክፈት")}
          </a>
          <button className="control-btn" type="button" onClick={() => void loadChildren()}>
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
            placeholder={t("Age", "እድሜ")}
            type="number"
            value={form.age}
            onChange={(event) => setForm({ ...form, age: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Education level", "የትምህርት ደረጃ")}
            value={form.educationLevel}
            onChange={(event) => setForm({ ...form, educationLevel: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder={t("Class", "ክፍል")}
            value={form.className}
            onChange={(event) => setForm({ ...form, className: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Section", "ክፍለ ክፍል")}
            value={form.sectionName}
            onChange={(event) => setForm({ ...form, sectionName: event.target.value })}
          />
          <input
            className="portal-input"
            type="date"
            value={form.dateOfRegistration}
            onChange={(event) => setForm({ ...form, dateOfRegistration: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Photo media ID", "የፎቶ ሚዲያ ID")}
            value={form.photoMediaId}
            onChange={(event) => setForm({ ...form, photoMediaId: event.target.value })}
          />
          <button className="control-btn" type="button" onClick={() => setIsMediaModalOpen(true)}>
            {t("Pick from media", "ከሚዲያ ምረጥ")}
          </button>
        </div>

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
              setForm({ ...form, status: event.target.value as ChildFormState["status"] })
            }
          >
            <option value="active">{t("Active", "ንቁ")}</option>
            <option value="inactive">{t("Inactive", "የተቋረጠ")}</option>
            <option value="graduated">{t("Graduated", "ተመርቋል")}</option>
          </select>
        </div>

        <button className="control-btn" type="submit" disabled={isSaving}>
          {form.childId ? t("Update child profile", "የልጅ መገለጫ አሻሽል") : t("Create child profile", "የልጅ መገለጫ ፍጠር")}
        </button>
      </form>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {isLoading ? <p>{t("Loading children profiles...", "የልጆች መገለጫ በመጫን ላይ...")}</p> : null}
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
              <span>{item.class_name ?? t("No class", "ክፍል የለም")}</span>
            </div>
            <h3>{item.full_name}</h3>
            <p>
              {t("Age", "እድሜ")}: {item.age ?? "N/A"} | {t("Section", "ክፍለ ክፍል")}: {item.section_name ?? "N/A"}
            </p>
            <p>{t("Education", "ትምህርት")}: {item.education_level ?? "N/A"}</p>
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
