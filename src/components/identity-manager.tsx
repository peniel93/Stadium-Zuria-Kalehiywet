"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePortalLocale } from "@/lib/portal-locale";

type IdentityItem = {
  id: string;
  profile_id: string | null;
  member_id: string | null;
  identity_number: string;
  username: string;
  role_group: string;
  is_active: boolean;
  member: { full_name: string | null }[] | { full_name: string | null } | null;
};

const roleGroups = [
  "student",
  "teacher",
  "pastor",
  "evangelist",
  "full_timer",
  "employee",
  "missionary",
  "church_leader",
  "women_leader",
  "youth_leader",
  "education_worker",
  "admin_office_worker",
  "choir_leader",
  "team_leader",
  "hr_staff",
];

export function IdentityManager() {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [items, setItems] = useState<IdentityItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    roleGroup: "student",
    memberId: "",
    profileId: "",
  });

  const loadItems = useCallback(async () => {
    const response = await fetch("/api/v1/admin/identities");
    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? (locale === "am" ? "መለያዎችን መጫን አልተሳካም።" : "Failed to load identities."));
      return;
    }

    setItems(result.data);
    setMessage(null);
  }, [locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadItems]);

  async function createIdentity(event: FormEvent) {
    event.preventDefault();

    const response = await fetch("/api/v1/admin/identities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username,
        roleGroup: form.roleGroup,
        memberId: form.memberId || undefined,
        profileId: form.profileId || undefined,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to create identity.", "መለያ መፍጠር አልተሳካም።"));
      return;
    }

    setMessage(`${t("Identity created with ID", "መለያ ተፈጥሯል፣ ID")} ${result.data.identity_number}`);
    setForm({ username: "", roleGroup: "student", memberId: "", profileId: "" });
    await loadItems();
  }

  async function toggleIdentity(item: IdentityItem) {
    const response = await fetch("/api/v1/admin/identities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityId: item.id,
        isActive: !item.is_active,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to update identity.", "መለያ ማሻሻል አልተሳካም።"));
      return;
    }

    await loadItems();
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <h2 style={{ margin: 0 }}>{t("ID and Username Management", "የID እና የተጠቃሚ ስም አስተዳደር")}</h2>
      <p style={{ margin: 0, color: "var(--muted)" }}>
        {t("IDs are auto-generated (8 digits). Username is set by admin and stored for recovery.", "ID በራሱ 8 ዲጂት ይፈጠራል፣ የተጠቃሚ ስም በአስተዳዳሪ ይመደባል።")}
      </p>

      <form onSubmit={createIdentity} style={{ display: "grid", gap: 10 }}>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Username", "የተጠቃሚ ስም")} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
          <select className="portal-input" value={form.roleGroup} onChange={(event) => setForm({ ...form, roleGroup: event.target.value })}>
            {roleGroups.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Member ID (optional)", "የአባል ID (አማራጭ)")} value={form.memberId} onChange={(event) => setForm({ ...form, memberId: event.target.value })} />
          <input className="portal-input" placeholder={t("Profile user UUID (optional)", "የተጠቃሚ UUID (አማራጭ)")} value={form.profileId} onChange={(event) => setForm({ ...form, profileId: event.target.value })} />
        </div>
        <button className="control-btn" type="submit">{t("Create identity", "መለያ ፍጠር")}</button>
      </form>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => {
          const member = Array.isArray(item.member) ? item.member[0] : item.member;

          return (
            <article className="content-card" key={item.id}>
              <div className="tag-row">
                <span className="tag">{item.role_group}</span>
                <span>{item.is_active ? t("active", "ንቁ") : t("inactive", "የተቋረጠ")}</span>
              </div>
              <h3>{item.username}</h3>
              <p>{t("Identity Number", "የመለያ ቁጥር")}: <strong>{item.identity_number}</strong></p>
              {member?.full_name ? <p>{t("Member", "አባል")}: {member.full_name}</p> : null}
              <button className="control-btn" type="button" onClick={() => void toggleIdentity(item)}>
                {item.is_active ? t("Deactivate", "አቁም") : t("Activate", "አንቃ")}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
