"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { MediaSelectorModal } from "@/components/media-selector-modal";
import { usePortalLocale } from "@/lib/portal-locale";

type HrWorkerItem = {
  id: string;
  full_name: string;
  photo_media_id: string | null;
  photo_media_preview_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  post_title: string | null;
  salary_amount: number | null;
  education_level: string | null;
  employment_status: "active" | "inactive" | "on_leave" | "replaced" | "retired";
  role_label: string | null;
  medeb_sefer_zone: string | null;
  joined_on: string | null;
  notes: string | null;
};

type WorkerForm = {
  workerId?: string;
  fullName: string;
  photoMediaId: string;
  contactPhone: string;
  contactEmail: string;
  postTitle: string;
  salaryAmount: string;
  educationLevel: string;
  employmentStatus: "active" | "inactive" | "on_leave" | "replaced" | "retired";
  roleLabel: string;
  medebSeferZone: string;
  joinedOn: string;
  notes: string;
};

const initialForm: WorkerForm = {
  fullName: "",
  photoMediaId: "",
  contactPhone: "",
  contactEmail: "",
  postTitle: "",
  salaryAmount: "",
  educationLevel: "",
  employmentStatus: "active",
  roleLabel: "",
  medebSeferZone: "",
  joinedOn: "",
  notes: "",
};

export function HrWorkerManager() {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [items, setItems] = useState<HrWorkerItem[]>([]);
  const [form, setForm] = useState<WorkerForm>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const loadWorkers = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch("/api/v1/hr/workers");
    const result = (await response.json()) as {
      success: boolean;
      data: HrWorkerItem[];
      error: { message?: string } | null;
    };

    if (result.success) {
      setItems(result.data);
      setMessage(null);
    } else {
      setMessage(
        result.error?.message ??
          (locale === "am" ? "የሰራተኞች መረጃ መጫን አልተሳካም።" : "Failed to load workers."),
      );
    }

    setIsLoading(false);
  }, [locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadWorkers]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const response = await fetch("/api/v1/hr/workers", {
      method: form.workerId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workerId: form.workerId,
        fullName: form.fullName,
        photoMediaId: form.photoMediaId || null,
        contactPhone: form.contactPhone || undefined,
        contactEmail: form.contactEmail || undefined,
        postTitle: form.postTitle || undefined,
        salaryAmount: form.salaryAmount ? Number(form.salaryAmount) : null,
        educationLevel: form.educationLevel || undefined,
        employmentStatus: form.employmentStatus,
        roleLabel: form.roleLabel || undefined,
        medebSeferZone: form.medebSeferZone || undefined,
        joinedOn: form.joinedOn || null,
        notes: form.notes || undefined,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to save worker.", "ሰራተኛ ማስቀመጥ አልተሳካም።"));
      setIsSaving(false);
      return;
    }

    setForm(initialForm);
    setMessage(form.workerId ? t("Worker updated.", "ሰራተኛው ተሻሽሏል።") : t("Worker created.", "ሰራተኛ ተፈጥሯል።"));
    await loadWorkers();
    setIsSaving(false);
  }

  async function handleDelete(workerId: string) {
    const response = await fetch("/api/v1/hr/workers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerId }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to delete worker.", "ሰራተኛ መሰረዝ አልተሳካም።"));
      return;
    }

    setMessage(t("Worker deleted.", "ሰራተኛው ተሰርዟል።"));
    await loadWorkers();
  }

  function startEdit(item: HrWorkerItem) {
    setForm({
      workerId: item.id,
      fullName: item.full_name,
      photoMediaId: item.photo_media_id ?? "",
      contactPhone: item.contact_phone ?? "",
      contactEmail: item.contact_email ?? "",
      postTitle: item.post_title ?? "",
      salaryAmount: item.salary_amount ? String(item.salary_amount) : "",
      educationLevel: item.education_level ?? "",
      employmentStatus: item.employment_status,
      roleLabel: item.role_label ?? "",
      medebSeferZone: item.medeb_sefer_zone ?? "",
      joinedOn: item.joined_on ?? "",
      notes: item.notes ?? "",
    });
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>{t("HR Workers Registry", "የሰራተኞች መዝገብ")}</h2>
        <button className="control-btn" type="button" onClick={() => void loadWorkers()}>
          {t("Refresh", "አድስ")}
        </button>
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
            placeholder={t("Post / title", "ሹመት / ርዕስ")}
            value={form.postTitle}
            onChange={(event) => setForm({ ...form, postTitle: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Role", "ሚና")}
            value={form.roleLabel}
            onChange={(event) => setForm({ ...form, roleLabel: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder={t("Salary", "ደመወዝ")}
            type="number"
            value={form.salaryAmount}
            onChange={(event) => setForm({ ...form, salaryAmount: event.target.value })}
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
            placeholder={t("Medeb sefer / zone", "መደብ ሰፈር / ዞን")}
            value={form.medebSeferZone}
            onChange={(event) => setForm({ ...form, medebSeferZone: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Contact phone", "የስልክ ቁጥር")}
            value={form.contactPhone}
            onChange={(event) => setForm({ ...form, contactPhone: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder={t("Contact email", "ኢሜይል")}
            value={form.contactEmail}
            onChange={(event) => setForm({ ...form, contactEmail: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <select
            className="portal-input"
            value={form.employmentStatus}
            onChange={(event) =>
              setForm({ ...form, employmentStatus: event.target.value as WorkerForm["employmentStatus"] })
            }
          >
            <option value="active">{t("Active", "ንቁ")}</option>
            <option value="inactive">{t("Inactive", "የተቋረጠ")}</option>
            <option value="on_leave">{t("On leave", "በፈቃድ")}</option>
            <option value="replaced">{t("Replaced", "ተተክቷል")}</option>
            <option value="retired">{t("Retired", "ጡረታ ወጥቷል")}</option>
          </select>
          <input
            className="portal-input"
            type="date"
            value={form.joinedOn}
            onChange={(event) => setForm({ ...form, joinedOn: event.target.value })}
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
          selectedMediaId={form.photoMediaId}
          onSelect={(mediaId) => setForm({ ...form, photoMediaId: mediaId })}
          onClose={() => setIsMediaModalOpen(false)}
          title={t("Pick worker photo", "የሰራተኛ ፎቶ ምረጥ")}
        />

        <input
          className="portal-input"
          placeholder={t("Notes", "ማስታወሻ")}
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
        />

        <button className="control-btn" type="submit" disabled={isSaving}>
          {form.workerId ? t("Update worker", "ሰራተኛ አሻሽል") : t("Create worker", "ሰራተኛ ፍጠር")}
        </button>
      </form>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {isLoading ? <p>{t("Loading workers...", "ሰራተኞች በመጫን ላይ...")}</p> : null}
        {items.map((item) => (
          <article key={item.id} className="content-card">
            {item.photo_media_preview_url ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 170,
                  borderRadius: 16,
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
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
              <span className="tag">{item.employment_status}</span>
              <span>{item.medeb_sefer_zone ?? t("No zone", "ዞን የለም")}</span>
            </div>
            <h3>{item.full_name}</h3>
            <p>{item.post_title ?? t("No post", "ሹመት የለም")}</p>
            <p>{t("Role", "ሚና")}: {item.role_label ?? "N/A"}</p>
            <p>{t("Salary", "ደመወዝ")}: {item.salary_amount ?? "N/A"}</p>
            <p>{t("Education", "ትምህርት")}: {item.education_level ?? "N/A"}</p>
            <p>{item.contact_phone ?? t("No phone", "ስልክ የለም")} | {item.contact_email ?? t("No email", "ኢሜይል የለም")}</p>
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
