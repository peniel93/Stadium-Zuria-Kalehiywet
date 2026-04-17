"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { MediaSelectorModal } from "@/components/media-selector-modal";
import { usePortalLocale } from "@/lib/portal-locale";

type DepartmentMemberItem = {
  id: string;
  full_name: string;
  full_name_am: string | null;
  photo_media_id: string | null;
  photo_media_preview_url: string | null;
  role_title: string | null;
  contact: string | null;
  address: string | null;
  status: "active" | "inactive" | "archived";
  group_id: string | null;
  department_member_groups: {
    id: string;
    code: string;
    name_en: string;
    name_am: string;
    description: string | null;
  } | null;
};

type DepartmentMemberFormState = {
  memberId?: string;
  fullName: string;
  fullNameAm: string;
  photoMediaId: string;
  roleTitle: string;
  contact: string;
  address: string;
  status: "active" | "inactive" | "archived";
  groupId: string;
};

type DepartmentMemberManagerProps = {
  departmentSlug: string;
  departmentName: string;
};

type DepartmentGroupItem = {
  id: string;
  code: string;
  name_en: string;
  name_am: string;
  description: string | null;
};

const initialForm: DepartmentMemberFormState = {
  fullName: "",
  fullNameAm: "",
  photoMediaId: "",
  roleTitle: "",
  contact: "",
  address: "",
  status: "active",
  groupId: "",
};

export function DepartmentMemberManager({ departmentSlug, departmentName }: DepartmentMemberManagerProps) {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [items, setItems] = useState<DepartmentMemberItem[]>([]);
  const [groups, setGroups] = useState<DepartmentGroupItem[]>([]);
  const [form, setForm] = useState<DepartmentMemberFormState>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/v1/departments/${departmentSlug}/members`);
    const result = (await response.json()) as {
      success: boolean;
      data: DepartmentMemberItem[];
      error: { message?: string } | null;
    };

    if (result.success) {
      setItems(result.data);
      setMessage(null);
    } else {
      setMessage(result.error?.message ?? (locale === "am" ? "የአባላት መረጃ መጫን አልተሳካም።" : "Failed to load members."));
    }

    setIsLoading(false);
  }, [departmentSlug, locale]);

  const loadGroups = useCallback(async () => {
    const response = await fetch(`/api/v1/departments/${departmentSlug}/groups`);
    const result = (await response.json()) as {
      success: boolean;
      data: DepartmentGroupItem[];
    };

    if (result.success) {
      setGroups(result.data);
    }
  }, [departmentSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMembers();
      void loadGroups();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadMembers, loadGroups]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const payload = {
      memberId: form.memberId,
      fullName: form.fullName,
      fullNameAm: form.fullNameAm || undefined,
      photoMediaId: form.photoMediaId || undefined,
      roleTitle: form.roleTitle || undefined,
      contact: form.contact || undefined,
      address: form.address || undefined,
      groupId: form.groupId || undefined,
      status: form.status,
    };

    const response = await fetch(`/api/v1/departments/${departmentSlug}/members`, {
      method: form.memberId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Unable to save member.", "አባል ማስቀመጥ አልተሳካም።"));
      setIsSaving(false);
      return;
    }

    setForm(initialForm);
    setMessage(form.memberId ? t("Member updated.", "አባሉ ተሻሽሏል።") : t("Member created.", "አባል ተፈጥሯል።"));
    await loadMembers();
    setIsSaving(false);
  }

  async function handleDelete(memberId: string) {
    setMessage(null);

    const response = await fetch(`/api/v1/departments/${departmentSlug}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Unable to delete member.", "አባል መሰረዝ አልተሳካም።"));
      return;
    }

    setMessage(t("Member deleted.", "አባሉ ተሰርዟል።"));
    await loadMembers();
  }

  function startEdit(item: DepartmentMemberItem) {
    setForm({
      memberId: item.id,
      fullName: item.full_name,
      fullNameAm: item.full_name_am ?? "",
      photoMediaId: item.photo_media_id ?? "",
      roleTitle: item.role_title ?? "",
      contact: item.contact ?? "",
      address: item.address ?? "",
      status: item.status,
      groupId: item.group_id ?? "",
    });
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>{departmentName} {t("Members", "አባላት")}</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="control-btn" href={`/admin/departments/${departmentSlug}/media`}>
            {t("Open media", "ሚዲያ ክፈት")}
          </a>
          <button className="control-btn" type="button" onClick={() => void loadMembers()}>
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
            placeholder={t("Full name Amharic", "ሙሉ ስም በአማርኛ")}
            value={form.fullNameAm}
            onChange={(event) => setForm({ ...form, fullNameAm: event.target.value })}
          />
        </div>

        <div className="admin-grid">
          <input
            className="portal-input"
            placeholder={t("Role / title", "ሚና / ሀላፊነት")}
            value={form.roleTitle}
            onChange={(event) => setForm({ ...form, roleTitle: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder={t("Contact", "መገኛ")}
            value={form.contact}
            onChange={(event) => setForm({ ...form, contact: event.target.value })}
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
          <input
            className="portal-input"
            placeholder={t("Address", "አድራሻ")}
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
          />
          <select
            className="portal-input"
            value={form.groupId}
            onChange={(event) => setForm({ ...form, groupId: event.target.value })}
          >
            <option value="">{t("No group", "ቡድን የለም")}</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name_en}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-grid">
          <select
            className="portal-input"
            value={form.status}
            onChange={(event) =>
              setForm({
                ...form,
                status: event.target.value as DepartmentMemberFormState["status"],
              })
            }
          >
            <option value="active">{t("Active", "ንቁ")}</option>
            <option value="inactive">{t("Inactive", "የተቋረጠ")}</option>
            <option value="archived">{t("Archived", "ተማህዷል")}</option>
          </select>
          <button className="control-btn" type="submit" disabled={isSaving}>
            {form.memberId ? t("Update member", "አባል አሻሽል") : t("Create member", "አባል ፍጠር")}
          </button>
        </div>
      </form>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {isLoading ? <p>{t("Loading members...", "አባላት በመጫን ላይ...")}</p> : null}
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
              <span>{item.department_member_groups?.name_en ?? t("No group", "ቡድን የለም")}</span>
            </div>
            <h3>{item.full_name}</h3>
            <p>
              {item.full_name_am ? `${item.full_name_am} · ` : ""}
              {item.role_title ?? t("No role title", "የሚና ርዕስ የለም")}
            </p>
            <p>{item.photo_media_id ? `${t("Photo media ID", "የፎቶ ሚዲያ ID")}: ${item.photo_media_id}` : t("No photo asset", "የፎቶ ንብረት የለም")}</p>
            <p>{item.address ?? t("No address", "አድራሻ የለም")}</p>
            <p>{item.contact ?? t("No contact", "መገኛ የለም")}</p>
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
