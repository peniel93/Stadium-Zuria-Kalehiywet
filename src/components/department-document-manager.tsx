"use client";

import { useCallback, useEffect, useState } from "react";
import { usePortalLocale } from "@/lib/portal-locale";

type DocumentItem = {
  id: string;
  title: string;
  description: string | null;
  file_media_id: string;
  access_scope: "public" | "members" | "department" | "admins";
  is_live: boolean;
  downloadable: boolean;
  live_from: string | null;
  live_until: string | null;
  download_url: string | null;
  media_title: string | null;
};

type DocumentForm = {
  documentId?: string;
  title: string;
  description: string;
  fileMediaId: string;
  accessScope: "public" | "members" | "department" | "admins";
  isLive: boolean;
  downloadable: boolean;
  liveFrom: string;
  liveUntil: string;
};

const initialForm: DocumentForm = {
  title: "",
  description: "",
  fileMediaId: "",
  accessScope: "department",
  isLive: false,
  downloadable: true,
  liveFrom: "",
  liveUntil: "",
};

export function DepartmentDocumentManager({ departmentSlug }: { departmentSlug: string }) {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [form, setForm] = useState<DocumentForm>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/v1/departments/${departmentSlug}/documents`);
    const result = (await response.json()) as {
      success: boolean;
      data: DocumentItem[];
      error: { message?: string } | null;
    };

    if (result.success) {
      setItems(result.data);
      setMessage(null);
    } else {
      setMessage(result.error?.message ?? (locale === "am" ? "ሰነዶች መጫን አልተሳካም።" : "Failed to load documents."));
    }

    setIsLoading(false);
  }, [departmentSlug, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDocuments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDocuments]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const response = await fetch(`/api/v1/departments/${departmentSlug}/documents`, {
      method: form.documentId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: form.documentId,
        title: form.title,
        description: form.description || undefined,
        fileMediaId: form.fileMediaId,
        accessScope: form.accessScope,
        isLive: form.isLive,
        downloadable: form.downloadable,
        liveFrom: form.liveFrom || null,
        liveUntil: form.liveUntil || null,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to save document.", "ሰነድ ማስቀመጥ አልተሳካም።"));
      setIsSaving(false);
      return;
    }

    setForm(initialForm);
    setMessage(form.documentId ? t("Document updated.", "ሰነዱ ተሻሽሏል።") : t("Document created.", "ሰነድ ተፈጥሯል።"));
    await loadDocuments();
    setIsSaving(false);
  }

  async function handleDelete(documentId: string) {
    const response = await fetch(`/api/v1/departments/${departmentSlug}/documents`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to delete document.", "ሰነድ መሰረዝ አልተሳካም።"));
      return;
    }

    setMessage(t("Document deleted.", "ሰነዱ ተሰርዟል።"));
    await loadDocuments();
  }

  function startEdit(item: DocumentItem) {
    setForm({
      documentId: item.id,
      title: item.title,
      description: item.description ?? "",
      fileMediaId: item.file_media_id,
      accessScope: item.access_scope,
      isLive: item.is_live,
      downloadable: item.downloadable,
      liveFrom: item.live_from ?? "",
      liveUntil: item.live_until ?? "",
    });
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>{t("Documents and Resources", "ሰነዶች እና ሀብቶች")}</h2>
        <button className="control-btn" type="button" onClick={() => void loadDocuments()}>
          {t("Refresh", "አድስ")}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Document title", "የሰነድ ርዕስ")}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder={t("File media ID", "የፋይል ሚዲያ ID")}
            value={form.fileMediaId}
            onChange={(event) => setForm({ ...form, fileMediaId: event.target.value })}
          />
        </div>

        <input
          className="portal-input"
          placeholder={t("Description", "መግለጫ")}
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />

        <div className="admin-grid">
          <select
            className="portal-input"
            value={form.accessScope}
            onChange={(event) =>
              setForm({ ...form, accessScope: event.target.value as DocumentForm["accessScope"] })
            }
          >
            <option value="public">{t("Public", "ለሁሉም")}</option>
            <option value="members">{t("Members", "ለአባላት")}</option>
            <option value="department">{t("Department", "ለዘርፍ")}</option>
            <option value="admins">{t("Admins", "ለአስተዳዳሪዎች")}</option>
          </select>
          <label className="toggle-box">
            <input
              type="checkbox"
              checked={form.isLive}
              onChange={(event) => setForm({ ...form, isLive: event.target.checked })}
            />
            <span>{t("Live on website", "በድር ጣቢያ ላይ አሳይ")}</span>
          </label>
        </div>

        <div className="admin-grid">
          <label className="toggle-box">
            <input
              type="checkbox"
              checked={form.downloadable}
              onChange={(event) => setForm({ ...form, downloadable: event.target.checked })}
            />
            <span>{t("Downloadable", "ሊወርድ የሚችል")}</span>
          </label>
          <input
            className="portal-input"
            type="datetime-local"
            value={form.liveFrom}
            onChange={(event) => setForm({ ...form, liveFrom: event.target.value })}
          />
        </div>

        <input
          className="portal-input"
          type="datetime-local"
          value={form.liveUntil}
          onChange={(event) => setForm({ ...form, liveUntil: event.target.value })}
        />

        <button className="control-btn" type="submit" disabled={isSaving}>
          {form.documentId ? t("Update document", "ሰነድ አሻሽል") : t("Create document", "ሰነድ ፍጠር")}
        </button>
      </form>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {isLoading ? <p>{t("Loading documents...", "ሰነዶች በመጫን ላይ...")}</p> : null}
        {items.map((item) => (
          <article key={item.id} className="content-card">
            <div className="tag-row">
              <span className="tag">{item.access_scope}</span>
              <span>{item.is_live ? t("Live", "ቀጥታ") : t("Draft", "ረቂቅ")}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description ?? t("No description", "መግለጫ የለም")}</p>
            <p>{t("File media ID", "የፋይል ሚዲያ ID")}: {item.file_media_id}</p>
            {item.download_url ? (
              <a className="control-btn" href={item.download_url} target="_blank" rel="noreferrer">
                {t("Download document", "ሰነድ አውርድ")}
              </a>
            ) : null}
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
