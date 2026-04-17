"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { MediaSelectorModal } from "@/components/media-selector-modal";
import { usePortalLocale } from "@/lib/portal-locale";

type AnnouncementFormState = {
  id?: string;
  departmentId: string;
  categoryCode: string;
  featuredMediaId: string;
  titleEn: string;
  titleAm: string;
  bodyEn: string;
  bodyAm: string;
  visibilityScope: "public" | "members" | "admins";
  publishAt: string;
  expiresAt: string;
  priority: "low" | "normal" | "high" | "urgent";
  pinToHome: boolean;
  showOnMainBoard: boolean;
  countdownEnabled: boolean;
};

type AnnouncementManagerProps = {
  departmentId?: string;
  departmentLabel?: string;
  allowDepartmentSelection?: boolean;
};

type AnnouncementItem = {
  id: string;
  priority: string;
  pin_to_home: boolean;
  show_on_main_board: boolean;
  countdown_enabled: boolean;
  posts: {
    id: string;
    department_id: string | null;
    category_id: string | null;
    post_categories: { code: string; name_en: string; name_am: string }[] | null;
    featured_media_id: string | null;
    featured_media_preview_url?: string | null;
    title_en: string;
    title_am: string | null;
    body_en: string;
    body_am: string | null;
    visibility_scope: "public" | "members" | "admins";
    is_published: boolean;
    publish_at: string | null;
    expires_at: string | null;
  } | null;
};

type DepartmentItem = {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string;
};

const initialForm: AnnouncementFormState = {
  departmentId: "",
  categoryCode: "announcement",
  titleEn: "",
  featuredMediaId: "",
  titleAm: "",
  bodyEn: "",
  bodyAm: "",
  visibilityScope: "public",
  publishAt: "",
  expiresAt: "",
  priority: "normal",
  pinToHome: true,
  showOnMainBoard: true,
  countdownEnabled: false,
};

function toLocalDatetimeInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AnnouncementManager({
  departmentId,
  departmentLabel,
  allowDepartmentSelection = true,
}: AnnouncementManagerProps) {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [form, setForm] = useState<AnnouncementFormState>({
    ...initialForm,
    departmentId: departmentId ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const payload = useMemo(
    () => ({
      departmentId: form.departmentId || null,
      categoryCode: form.categoryCode,
      featuredMediaId: form.featuredMediaId || null,
      title: { en: form.titleEn, am: form.titleAm || undefined },
      body: { en: form.bodyEn, am: form.bodyAm || undefined },
      visibilityScope: form.visibilityScope,
      publishAt: form.publishAt || null,
      expiresAt: form.expiresAt || null,
      priority: form.priority,
      pinToHome: form.pinToHome,
      showOnMainBoard: form.showOnMainBoard,
      countdownEnabled: form.countdownEnabled,
    }),
    [form],
  );

  const loadAnnouncements = useCallback(async () => {
    setIsLoading(true);
    const searchParams = new URLSearchParams({ state: "all" });

    if (departmentId) {
      searchParams.set("departmentId", departmentId);
    }

    const response = await fetch(`/api/v1/announcements?${searchParams.toString()}`);
    const result = (await response.json()) as {
      success: boolean;
      data: AnnouncementItem[];
      error: { message?: string } | null;
    };

    if (result.success) {
      setItems(result.data);
      setMessage(null);
    } else {
      setMessage(result.error?.message ?? (locale === "am" ? "ማስታወቂያዎች መጫን አልተሳካም።" : "Failed to load announcements."));
    }

    setIsLoading(false);
  }, [departmentId, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAnnouncements();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAnnouncements]);

  useEffect(() => {
    if (!allowDepartmentSelection) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/v1/departments?includeInactive=true");
      const result = await response.json();

      if (result.success) {
        setDepartments(result.data);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [allowDepartmentSelection]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const isEditing = Boolean(form.id);
    const response = await fetch(
      isEditing ? `/api/v1/announcements/${form.id}` : "/api/v1/announcements",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Unable to save announcement.", "ማስታወቂያ ማስቀመጥ አልተሳካም።"));
      setIsSaving(false);
      return;
    }

    setForm({
      ...initialForm,
      departmentId: departmentId ?? "",
    });
    setMessage(isEditing ? t("Announcement updated.", "ማስታወቂያው ተሻሽሏል።") : t("Announcement created.", "ማስታወቂያ ተፈጥሯል።"));
    await loadAnnouncements();
    setIsSaving(false);
  }

  async function handleArchive(id: string) {
    setMessage(null);
    const response = await fetch(`/api/v1/announcements/${id}`, { method: "DELETE" });
    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Unable to archive announcement.", "ማስታወቂያውን ማህደር ውስጥ ማስገባት አልተሳካም።"));
      return;
    }

    setMessage(t("Announcement archived.", "ማስታወቂያው ተማህዷል።"));
    await loadAnnouncements();
  }

  function startEdit(item: AnnouncementItem) {
    const post = item.posts;

    if (!post) {
      return;
    }

    setForm({
      id: item.id,
      departmentId: post.department_id ?? departmentId ?? "",
      categoryCode: post.post_categories?.[0]?.code ?? "announcement",
      featuredMediaId: post.featured_media_id ?? "",
      titleEn: post.title_en,
      titleAm: post.title_am ?? "",
      bodyEn: post.body_en,
      bodyAm: post.body_am ?? "",
      visibilityScope: post.visibility_scope,
      publishAt: post.publish_at ?? "",
      expiresAt: post.expires_at ?? "",
      priority: item.priority as AnnouncementFormState["priority"],
      pinToHome: item.pin_to_home,
      showOnMainBoard: item.show_on_main_board,
      countdownEnabled: item.countdown_enabled,
    });
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h1 style={{ margin: 0 }}>
          {departmentLabel
            ? `${departmentLabel} ${t("Announcements", "ማስታወቂያዎች")}`
            : t("Announcement Management", "የማስታወቂያ አስተዳደር")}
        </h1>
        <button className="control-btn" onClick={() => void loadAnnouncements()} type="button">
          {t("Refresh", "አድስ")}
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: "grid", gap: 12 }}>
        <div className="admin-grid">
          {allowDepartmentSelection ? (
            <select
              className="portal-input"
              value={form.departmentId}
              onChange={(event) => setForm({ ...form, departmentId: event.target.value })}
            >
              <option value="">{t("Select department", "ዘርፍ ምረጥ")}</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {locale === "am" ? department.nameAm : department.nameEn}
                </option>
              ))}
            </select>
          ) : (
            <input className="portal-input" value={departmentLabel ?? form.departmentId} readOnly />
          )}
          <select
            className="portal-input"
            value={form.categoryCode}
            onChange={(event) => setForm({ ...form, categoryCode: event.target.value })}
          >
            <option value="announcement">{t("Announcement", "ማስታወቂያ")}</option>
            <option value="news">{t("News", "ዜና")}</option>
            <option value="vacancy">{t("Vacancy", "የስራ እድል")}</option>
            <option value="training">{t("Training", "ስልጠና")}</option>
            <option value="event">{t("Event", "ዝግጅት")}</option>
            <option value="program">{t("Program", "ፕሮግራም")}</option>
            <option value="conference">{t("Conference", "ኮንፈረንስ")}</option>
          </select>
          <select
            className="portal-input"
            value={form.priority}
            onChange={(event) =>
              setForm({ ...form, priority: event.target.value as AnnouncementFormState["priority"] })
            }
          >
            <option value="low">{t("Low", "ዝቅተኛ")}</option>
            <option value="normal">{t("Normal", "መደበኛ")}</option>
            <option value="high">{t("High", "ከፍተኛ")}</option>
            <option value="urgent">{t("Urgent", "አስቸኳይ")}</option>
          </select>
        </div>

        <input
          className="portal-input"
          placeholder={t("Title English", "የእንግሊዝኛ ርዕስ")}
          value={form.titleEn}
          onChange={(event) => setForm({ ...form, titleEn: event.target.value })}
        />
        <input
          className="portal-input"
          placeholder={t("Title Amharic", "የአማርኛ ርዕስ")}
          value={form.titleAm}
          onChange={(event) => setForm({ ...form, titleAm: event.target.value })}
        />
        <textarea
          className="portal-input"
          placeholder={t("Body English", "የእንግሊዝኛ ይዘት")}
          rows={4}
          value={form.bodyEn}
          onChange={(event) => setForm({ ...form, bodyEn: event.target.value })}
        />
        <textarea
          className="portal-input"
          placeholder={t("Body Amharic", "የአማርኛ ይዘት")}
          rows={4}
          value={form.bodyAm}
          onChange={(event) => setForm({ ...form, bodyAm: event.target.value })}
        />

        <div className="admin-grid">
          <input
            className="portal-input"
            type="datetime-local"
            value={form.publishAt}
            onChange={(event) => setForm({ ...form, publishAt: event.target.value })}
          />
          <input
            className="portal-input"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="control-btn"
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, publishAt: toLocalDatetimeInputValue(new Date()) }))}
          >
            {t("Publish now", "አሁን አትም")}
          </button>
          <button
            className="control-btn"
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                publishAt: toLocalDatetimeInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
              }))
            }
          >
            {t("Publish tomorrow", "ነገ አትም")}
          </button>
          <button
            className="control-btn"
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                expiresAt: toLocalDatetimeInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
              }))
            }
          >
            {t("Expire in 7 days", "በ7 ቀን ያበቃ")}
          </button>
          <button
            className="control-btn"
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, publishAt: "", expiresAt: "" }))}
          >
            {t("Clear dates", "ቀናትን አጥፋ")}
          </button>
        </div>

        <div className="admin-grid">
          <select
            className="portal-input"
            value={form.visibilityScope}
            onChange={(event) =>
              setForm({
                ...form,
                visibilityScope: event.target.value as AnnouncementFormState["visibilityScope"],
              })
            }
          >
            <option value="public">{t("Public", "ለሁሉም")}</option>
            <option value="members">{t("Members", "ለአባላት")}</option>
            <option value="admins">{t("Admins", "ለአስተዳዳሪዎች")}</option>
          </select>
          <label className="toggle-box">
            <input
              type="checkbox"
              checked={form.pinToHome}
              onChange={(event) => setForm({ ...form, pinToHome: event.target.checked })}
            />
            {t("Pin to home", "በመነሻ ላይ አሳይ")}
          </label>
          <label className="toggle-box">
            <input
              type="checkbox"
              checked={form.showOnMainBoard}
              onChange={(event) => setForm({ ...form, showOnMainBoard: event.target.checked })}
            />
            {t("Show on main board", "በዋና ቦርድ ላይ አሳይ")}
          </label>
          <label className="toggle-box">
            <input
              type="checkbox"
              checked={form.countdownEnabled}
              onChange={(event) => setForm({ ...form, countdownEnabled: event.target.checked })}
            />
            {t("Countdown enabled", "ቆጠራ አንቃ")}
          </label>
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            value={form.featuredMediaId}
            placeholder={t("Featured media id", "የተመረጠ ሚዲያ ID")}
            onChange={(event) => setForm({ ...form, featuredMediaId: event.target.value })}
          />
          <button className="control-btn" type="button" onClick={() => setIsMediaModalOpen(true)}>
            {t("Pick media", "ሚዲያ ምረጥ")}
          </button>
          <button
            className="control-btn"
            type="button"
            onClick={() => setForm({ ...form, featuredMediaId: "" })}
          >
            {t("Clear media", "ሚዲያ አጥፋ")}
          </button>
        </div>

        <button className="control-btn" type="submit" disabled={isSaving}>
          {form.id ? t("Update announcement", "ማስታወቂያ አሻሽል") : t("Create announcement", "ማስታወቂያ ፍጠር")}
        </button>
      </form>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {isLoading ? <p>{t("Loading announcements...", "ማስታወቂያዎች በመጫን ላይ...")}</p> : null}
        {items.map((item) => {
          const post = item.posts;

          return (
            <article key={item.id} className="content-card">
              <div className="tag-row">
                <span className="tag">{item.priority}</span>
                <span>{post?.is_published ? t("Published", "ታትሟል") : t("Draft", "ረቂቅ")}</span>
              </div>
              <h3>{post?.title_en ?? t("Untitled", "ርዕስ የለም")}</h3>
              {post?.featured_media_preview_url ? (
                <Image
                  src={post.featured_media_preview_url}
                  alt={post.title_en ?? "Announcement media"}
                  width={1200}
                  height={680}
                  unoptimized
                  style={{ width: "100%", height: "auto", maxHeight: 220, objectFit: "cover", borderRadius: 12 }}
                />
              ) : null}
              <p>{post?.body_en ?? t("No body", "ይዘት የለም")}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <button className="control-btn" type="button" onClick={() => startEdit(item)}>
                  {t("Edit", "አሻሽል")}
                </button>
                <button className="control-btn" type="button" onClick={() => void handleArchive(item.id)}>
                  {t("Archive", "ማህደር አስገባ")}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <MediaSelectorModal
        isOpen={isMediaModalOpen}
        departmentIdentifier={form.departmentId || undefined}
        selectedMediaId={form.featuredMediaId || undefined}
        onSelect={(mediaId) => setForm({ ...form, featuredMediaId: mediaId })}
        onClose={() => setIsMediaModalOpen(false)}
        title={t("Select featured media", "የመነሻ ሚዲያ ምረጥ")}
      />
    </section>
  );
}
