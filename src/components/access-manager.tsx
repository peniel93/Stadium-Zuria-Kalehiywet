"use client";

import { useEffect, useState } from "react";
import type { AppRole } from "@/lib/auth/app-roles";
import { usePortalLocale } from "@/lib/portal-locale";

type AccessSummary = {
  user: {
    id: string;
    email: string | null;
  };
  roles: Array<{ code: string; name: string }>;
  departmentAssignments: Array<{
    id: string;
    departmentId: string;
    accessLevel: "full" | "limited";
    departmentCode: string;
    departmentNameEn: string;
    departmentNameAm: string;
  }>;
};

type DepartmentItem = {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string;
};

const roleOptions: Array<{ value: AppRole; label: string }> = [
  { value: "super_admin", label: "Super Admin" },
  { value: "global_admin", label: "Global Admin" },
  { value: "department_admin", label: "Department Admin" },
  { value: "church_leader", label: "Church Leader" },
  { value: "youth_leader", label: "Youth Leader" },
  { value: "women_leader", label: "Women Leader" },
  { value: "education_worker", label: "Education Worker" },
  { value: "choir_leader", label: "Choir Leader" },
  { value: "team_leader", label: "Team Leader" },
  { value: "hr_staff", label: "HR Staff" },
  { value: "pastor", label: "Pastor" },
  { value: "evangelist", label: "Evangelist" },
  { value: "full_timer", label: "Full Timer" },
  { value: "employee", label: "Employee" },
  { value: "missionary", label: "Missionary" },
  { value: "editor", label: "Editor" },
  { value: "moderator", label: "Moderator" },
  { value: "member", label: "Member" },
];

type ActionState = {
  identifier: string;
  roleCode: AppRole;
  departmentIdentifier: string;
  accessLevel: "full" | "limited";
};

export function AccessManager() {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [identifier, setIdentifier] = useState("");
  const [summary, setSummary] = useState<AccessSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<ActionState>({
    identifier: "",
    roleCode: "editor",
    departmentIdentifier: "",
    accessLevel: "full",
  });

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/v1/departments?includeInactive=true");
      const result = await response.json();

      if (result.success) {
        setDepartments(result.data);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function loadSummary() {
    const target = identifier.trim();

    if (!target) {
      setMessage(t("Enter a user email or ID first.", "በመጀመሪያ የተጠቃሚ ኢሜይል ወይም ID ያስገቡ።"));
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const response = await fetch(`/api/v1/admin/access?identifier=${encodeURIComponent(target)}`);
    const result = (await response.json()) as {
      success: boolean;
      data: AccessSummary;
      error: { message?: string } | null;
    };

    if (result.success) {
      setSummary(result.data);
      setAction((current) => ({ ...current, identifier: target }));
      setMessage(null);
    } else {
      setSummary(null);
      setMessage(result.error?.message ?? t("Unable to load user access summary.", "የተጠቃሚ የመዳረሻ ማጠቃለያ መጫን አልተሳካም።"));
    }

    setIsLoading(false);
  }

  async function sendAction(endpointAction: string, method: "POST" | "DELETE") {
    const response = await fetch("/api/v1/admin/access", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: endpointAction,
        identifier: action.identifier,
        roleCode: action.roleCode,
        departmentIdentifier: action.departmentIdentifier,
        accessLevel: action.accessLevel,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Action failed.", "እርምጃው አልተሳካም።"));
      return;
    }

    setMessage(t("Access update saved.", "የመዳረሻ ማሻሻያ ተቀምጧል።"));
    await loadSummary();
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h1 style={{ margin: 0 }}>{t("Access Management", "የመዳረሻ አስተዳደር")}</h1>
      </div>

      <div className="admin-grid">
        <input
          className="portal-input"
          placeholder={t("User email or UUID", "የተጠቃሚ ኢሜይል ወይም UUID")}
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />
        <button className="control-btn" type="button" onClick={() => void loadSummary()}>
          {t("Load user", "ተጠቃሚ ጫን")}
        </button>
      </div>

      {isLoading ? <p>{t("Loading user access...", "የተጠቃሚ መዳረሻ በመጫን ላይ...")}</p> : null}
      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      {summary ? (
        <div style={{ display: "grid", gap: 16 }}>
          <article className="content-card">
            <h3>{t("User", "ተጠቃሚ")}</h3>
            <p>{summary.user.email ?? summary.user.id}</p>
          </article>

          <article className="content-card">
            <h3>{t("Current roles", "የአሁኑ ሚናዎች")}</h3>
            <div className="department-list">
              {summary.roles.map((role) => (
                <span className="department-chip" key={role.code}>
                  {role.name || role.code}
                </span>
              ))}
            </div>
          </article>

          <article className="content-card">
            <h3>{t("Department assignments", "የዘርፍ ምደባዎች")}</h3>
            <div className="department-list">
              {summary.departmentAssignments.map((assignment) => (
                <span className="department-chip" key={assignment.id}>
                  {locale === "am"
                    ? assignment.departmentNameAm || assignment.departmentCode
                    : assignment.departmentNameEn || assignment.departmentCode} ({assignment.accessLevel})
                </span>
              ))}
            </div>
          </article>

          <div className="admin-grid">
            <select
              className="portal-input"
              value={action.roleCode}
              onChange={(event) =>
                setAction({ ...action, roleCode: event.target.value as AppRole })
              }
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>

            <select
              className="portal-input"
              value={action.departmentIdentifier}
              onChange={(event) =>
                setAction({ ...action, departmentIdentifier: event.target.value })
              }
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.code}>
                  {locale === "am" ? department.nameAm : department.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-grid">
            <button className="control-btn" type="button" onClick={() => void sendAction("add-role", "POST") }>
              {t("Add role", "ሚና ጨምር")}
            </button>
            <button className="control-btn" type="button" onClick={() => void sendAction("remove-role", "DELETE") }>
              {t("Remove role", "ሚና አስወግድ")}
            </button>
          </div>

          <div className="admin-grid">
            <select
              className="portal-input"
              value={action.accessLevel}
              onChange={(event) =>
                setAction({ ...action, accessLevel: event.target.value as "full" | "limited" })
              }
            >
              <option value="full">{t("Full access", "ሙሉ መዳረሻ")}</option>
              <option value="limited">{t("Limited access", "የተገደበ መዳረሻ")}</option>
            </select>
            <button
              className="control-btn"
              type="button"
              onClick={() => void sendAction("assign-department-admin", "POST")}
            >
              {t("Assign department admin", "የዘርፍ አስተዳዳሪ መድብ")}
            </button>
          </div>

          <button
            className="control-btn"
            type="button"
            onClick={() => void sendAction("remove-department-admin", "DELETE")}
          >
            {t("Remove department admin", "የዘርፍ አስተዳዳሪ ምደባ አስወግድ")}
          </button>
        </div>
      ) : null}
    </section>
  );
}
