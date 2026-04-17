"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePortalLocale } from "@/lib/portal-locale";
import { MediaSelectorModal } from "@/components/media-selector-modal";
import { appRoles } from "@/lib/auth/app-roles";

type DepartmentItem = {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string;
};

type RecipientUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  roles: string[];
};

type MessageItem = {
  id: string;
  recipient_scope: "all_admins" | "role" | "department" | "user";
  recipient_role_code: string | null;
  recipient_user_id: string | null;
  recipient_user?: { id: string; email: string | null; full_name: string | null } | null;
  recipient_department: { code: string; name_en: string; name_am: string }[] | { code: string; name_en: string; name_am: string } | null;
  title: string;
  body: string | null;
  attachment_media_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  sender_profile: { full_name: string | null }[] | { full_name: string | null } | null;
};

export function InternalCommunicationsManager() {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [items, setItems] = useState<MessageItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [users, setUsers] = useState<RecipientUser[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersHasMore, setUsersHasMore] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "unreviewed" | "reviewed">("all");
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [form, setForm] = useState({
    recipientScope: "all_admins",
    recipientRoleCode: "",
    recipientDepartmentId: "",
    recipientUserId: "",
    title: "",
    body: "",
    attachmentMediaId: "",
  });

  const loadItems = useCallback(async () => {
    const response = await fetch("/api/v1/admin/internal-communications");
    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? (locale === "am" ? "መልዕክቶችን መጫን አልተሳካም።" : "Failed to load messages."));
      return;
    }

    setItems(result.data);
    setMessage(null);
  }, [locale]);

  const loadDepartments = useCallback(async () => {
    const response = await fetch("/api/v1/departments?includeInactive=true");
    const result = await response.json();

    if (result.success) {
      setDepartments(result.data);
    }
  }, []);

  const loadUsers = useCallback(
    async (page: number, append: boolean) => {
      setUsersLoading(true);

      if (page === 1 && !append) {
        setUsers([]);
        setUsersPage(1);
        setUsersHasMore(true);
      }

      const response = await fetch(
        `/api/v1/admin/users?perPage=25&page=${page}${userSearch.trim() ? `&search=${encodeURIComponent(userSearch.trim())}` : ""}`,
      );
      const result = await response.json();

      if (result.success) {
        const nextUsers = result.data as RecipientUser[];
        setUsers((current) => (append ? [...current, ...nextUsers] : nextUsers));
        setUsersPage(result.meta?.page ?? page);
        setUsersHasMore(Boolean(result.meta?.hasMore));
      }

      setUsersLoading(false);
    },
    [userSearch],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadItems]);

  useEffect(() => {
    const run = async () => {
      await loadDepartments();
    };

    void run();
  }, [loadDepartments]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers(1, false);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadUsers, userSearch]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();

    const response = await fetch("/api/v1/admin/internal-communications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to send message.", "መልዕክት መላክ አልተሳካም።"));
      return;
    }

    setForm({
      recipientScope: "all_admins",
      recipientRoleCode: "",
      recipientDepartmentId: "",
      recipientUserId: "",
      title: "",
      body: "",
      attachmentMediaId: "",
    });

    setMessage(t("Message sent.", "መልዕክት ተልኳል።"));
    await loadItems();
  }

  async function markReviewed(messageId: string) {
    const response = await fetch("/api/v1/admin/internal-communications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to review message.", "መልዕክት ማረጋገጥ አልተሳካም።"));
      return;
    }

    await loadItems();
  }

  async function markAllVisibleReviewed() {
    const targets = visibleItems.filter((item) => !item.reviewed_at).map((item) => item.id);

    if (!targets.length) {
      setMessage(t("No unreviewed messages in this filter.", "በዚህ ማጣሪያ ውስጥ ያልተገምገሙ መልዕክቶች የሉም።"));
      return;
    }

    for (const messageId of targets) {
      const response = await fetch("/api/v1/admin/internal-communications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      const result = await response.json();

      if (!result.success) {
        setMessage(result.error?.message ?? t("Failed while bulk reviewing messages.", "መልዕክቶችን በጋራ ማረጋገጥ ላይ ችግር ተፈጥሯል።"));
        return;
      }
    }

    setMessage(t("All visible messages marked as reviewed.", "የሚታዩ መልዕክቶች ሁሉ ተገምግመዋል።"));
    await loadItems();
  }

  async function loadMoreUsers() {
    await loadUsers(usersPage + 1, true);
  }

  const reviewCounts = {
    all: items.length,
    unreviewed: items.filter((item) => !item.reviewed_at).length,
    reviewed: items.filter((item) => Boolean(item.reviewed_at)).length,
  };

  const visibleItems = items.filter((item) => {
    if (statusFilter === "unreviewed") {
      return !item.reviewed_at;
    }

    if (statusFilter === "reviewed") {
      return Boolean(item.reviewed_at);
    }

    return true;
  });

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <h2 style={{ margin: 0 }}>{t("Inter-Dashboard Communication", "የዳሽቦርድ መካከል ግንኙነት")}</h2>

      <form onSubmit={sendMessage} style={{ display: "grid", gap: 10 }}>
        <div className="admin-grid">
          <select
            className="portal-input"
            value={form.recipientScope}
            onChange={(event) => {
              const scope = event.target.value;
              setForm((current) => ({
                ...current,
                recipientScope: scope,
                recipientRoleCode: scope === "role" ? current.recipientRoleCode : "",
                recipientDepartmentId: scope === "department" ? current.recipientDepartmentId : "",
                recipientUserId: scope === "user" ? current.recipientUserId : "",
              }));
            }}
          >
            <option value="all_admins">{t("All admins", "ሁሉም አስተዳዳሪዎች")}</option>
            <option value="role">{t("By role", "በሚና")}</option>
            <option value="department">{t("By department", "በዘርፍ")}</option>
            <option value="user">{t("Single user", "ነጠላ ተጠቃሚ")}</option>
          </select>
          {form.recipientScope === "role" ? (
            <select className="portal-input" value={form.recipientRoleCode} onChange={(event) => setForm({ ...form, recipientRoleCode: event.target.value })}>
              <option value="">{t("Select role", "ሚና ይምረጡ")}</option>
              {appRoles.filter((role) => role !== "member").map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          ) : null}
        </div>
        {form.recipientScope === "department" ? (
          <select className="portal-input" value={form.recipientDepartmentId} onChange={(event) => setForm({ ...form, recipientDepartmentId: event.target.value })}>
            <option value="">{t("Select department", "ዘርፍ ይምረጡ")}</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {(locale === "am" ? department.nameAm : department.nameEn) || department.code}
              </option>
            ))}
          </select>
        ) : null}
        {form.recipientScope === "user" ? (
          <div style={{ display: "grid", gap: 8 }}>
            <input
              className="portal-input"
              placeholder={t("Search users by name or email", "ተጠቃሚ በስም ወይም ኢሜይል ፈልግ")}
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
            />
            <select className="portal-input" value={form.recipientUserId} onChange={(event) => setForm({ ...form, recipientUserId: event.target.value })}>
              <option value="">{t("Select recipient user", "ተቀባይ ተጠቃሚ ይምረጡ")}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName ? `${user.fullName} - ` : ""}{user.email ?? user.id}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="control-btn" type="button" onClick={() => void loadMoreUsers()} disabled={!usersHasMore || usersLoading}>
                {usersLoading ? t("Loading users...", "ተጠቃሚዎች በመጫን ላይ...") : t("Load more users", "ተጨማሪ ተጠቃሚዎች ጫን")}
              </button>
              <span style={{ alignSelf: "center", color: "var(--muted)" }}>
                {t("Showing", "እየታዩ ያሉ")} {users.length}
              </span>
            </div>
          </div>
        ) : null}
        <input className="portal-input" placeholder={t("Title", "ርዕስ")} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <textarea className="portal-input" rows={4} placeholder={t("Message body", "የመልዕክት አካል")} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Attachment media ID", "አባሪ ሚዲያ ID")} value={form.attachmentMediaId} onChange={(event) => setForm({ ...form, attachmentMediaId: event.target.value })} />
          <button className="control-btn" type="button" onClick={() => setIsMediaModalOpen(true)}>
            {t("Pick from media", "ከሚዲያ ምረጥ")}
          </button>
        </div>
        <button className="control-btn" type="submit">{t("Send message", "መልዕክት ላክ")}</button>
      </form>

      <MediaSelectorModal
        isOpen={isMediaModalOpen}
        mediaType="document"
        selectedMediaId={form.attachmentMediaId || undefined}
        onSelect={(mediaId) => setForm({ ...form, attachmentMediaId: mediaId })}
        onClose={() => setIsMediaModalOpen(false)}
        title={t("Pick attachment", "አባሪ ምረጥ")}
      />

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="control-btn" type="button" onClick={() => setStatusFilter("all")}>
          {t("All", "ሁሉም")} ({reviewCounts.all})
        </button>
        <button className="control-btn" type="button" onClick={() => setStatusFilter("unreviewed")}>
          {t("Unreviewed", "ያልተገምገመ")} ({reviewCounts.unreviewed})
        </button>
        <button className="control-btn" type="button" onClick={() => setStatusFilter("reviewed")}>
          {t("Reviewed", "ተገምግሟል")} ({reviewCounts.reviewed})
        </button>
        <button className="control-btn" type="button" onClick={() => void markAllVisibleReviewed()}>
          {t("Mark all visible reviewed", "የሚታዩትን ሁሉ ተገምግሟል አድርግ")}
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {visibleItems.map((item) => {
          const sender = Array.isArray(item.sender_profile) ? item.sender_profile[0] : item.sender_profile;
          const recipientDepartment = Array.isArray(item.recipient_department)
            ? item.recipient_department[0]
            : item.recipient_department;

          return (
            <article key={item.id} className="content-card">
              <div className="tag-row">
                <span className="tag">{item.recipient_scope}</span>
                <span>{new Date(item.created_at).toLocaleString(locale === "am" ? "am-ET" : "en-US")}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body ?? t("No body", "ይዘት የለም")}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                <span className="department-chip">
                  {t("Scope", "ወሰን")}: {item.recipient_scope}
                </span>
                {item.recipient_role_code ? <span className="department-chip">{t("Role", "ሚና")}: {item.recipient_role_code}</span> : null}
                {recipientDepartment ? (
                  <span className="department-chip">
                    {t("Department", "ዘርፍ")}: {locale === "am" ? recipientDepartment.name_am : recipientDepartment.name_en}
                  </span>
                ) : null}
                {item.recipient_user_id ? (
                  <span className="department-chip">
                    {t("User", "ተጠቃሚ")}: {item.recipient_user?.full_name ?? item.recipient_user?.email ?? item.recipient_user_id}
                  </span>
                ) : null}
              </div>
              <p style={{ margin: 0, color: "var(--muted)" }}>
                {t("Sender", "ላኪ")}: {sender?.full_name ?? "N/A"}
              </p>
              {item.attachment_media_id ? <p style={{ margin: 0 }}>{t("Attachment media", "አባሪ ሚዲያ")}: {item.attachment_media_id}</p> : null}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {!item.reviewed_at ? (
                  <button className="control-btn" type="button" onClick={() => void markReviewed(item.id)}>
                    {t("Mark reviewed", "ተገምግሟል ምልክት አድርግ")}
                  </button>
                ) : (
                  <span className="department-chip">{t("Reviewed", "ተገምግሟል")}</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
