"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { MediaSelectorModal } from "@/components/media-selector-modal";
import { usePortalLocale } from "@/lib/portal-locale";

type MemberCategory = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

type MemberItem = {
  id: string;
  full_name: string;
  photo_media_id: string | null;
  photo_media_preview_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  medeb_sefer_zone: string | null;
  role_label: string | null;
  category_id: string | null;
  education_status: string | null;
  occupation_status: string | null;
  marriage_status: string | null;
  student_stage: string | null;
  employment_type: string | null;
  status: "active" | "inactive" | "moved" | "archived";
  member_categories: { id: string; code: string; name: string } | null;
};

type CategoryForm = {
  categoryId?: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
};

type MemberForm = {
  memberId?: string;
  fullName: string;
  photoMediaId: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  medebSeferZone: string;
  roleLabel: string;
  categoryId: string;
  educationStatus: string;
  occupationStatus: string;
  marriageStatus: string;
  studentStage: string;
  employmentType: string;
  status: "active" | "inactive" | "moved" | "archived";
};

const initialCategoryForm: CategoryForm = {
  code: "",
  name: "",
  description: "",
  isActive: true,
};

const initialMemberForm: MemberForm = {
  fullName: "",
  photoMediaId: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  medebSeferZone: "",
  roleLabel: "",
  categoryId: "",
  educationStatus: "",
  occupationStatus: "",
  marriageStatus: "",
  studentStage: "",
  employmentType: "",
  status: "active",
};

export function MemberRegistryManager() {
  const locale = usePortalLocale();
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const [categories, setCategories] = useState<MemberCategory[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(initialCategoryForm);
  const [memberForm, setMemberForm] = useState<MemberForm>(initialMemberForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "moved" | "archived">("all");

  const loadAll = useCallback(async () => {
    setIsLoading(true);

    const query = new URLSearchParams();
    if (search.trim()) query.set("q", search.trim());
    if (zoneFilter.trim()) query.set("zone", zoneFilter.trim());
    if (roleFilter.trim()) query.set("roleLabel", roleFilter.trim());
    if (categoryFilter) query.set("categoryId", categoryFilter);
    if (statusFilter !== "all") query.set("status", statusFilter);

    const [categoriesResponse, membersResponse] = await Promise.all([
      fetch("/api/v1/members/categories"),
      fetch(`/api/v1/members?${query.toString()}`),
    ]);

    const categoriesResult = await categoriesResponse.json();
    const membersResult = await membersResponse.json();

    if (categoriesResult.success) {
      setCategories(categoriesResult.data);
    }

    if (membersResult.success) {
      setMembers(membersResult.data);
      setMessage(null);
    } else {
      setMessage(
        membersResult.error?.message ??
          (locale === "am" ? "የአባላት መረጃ መጫን አልተሳካም።" : "Failed to load members."),
      );
    }

    setIsLoading(false);
  }, [search, zoneFilter, roleFilter, categoryFilter, statusFilter, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAll();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAll]);

  async function saveCategory(event: React.FormEvent) {
    event.preventDefault();
    setIsSavingCategory(true);
    setMessage(null);

    const response = await fetch("/api/v1/members/categories", {
      method: categoryForm.categoryId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: categoryForm.categoryId,
        code: categoryForm.code,
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        isActive: categoryForm.isActive,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to save category.", "ምድብ ማስቀመጥ አልተሳካም።"));
      setIsSavingCategory(false);
      return;
    }

    setCategoryForm(initialCategoryForm);
    setMessage(categoryForm.categoryId ? t("Category updated.", "ምድቡ ተሻሽሏል።") : t("Category created.", "ምድብ ተፈጥሯል።"));
    await loadAll();
    setIsSavingCategory(false);
  }

  async function deleteCategory(categoryId: string) {
    const response = await fetch("/api/v1/members/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to delete category.", "ምድብ መሰረዝ አልተሳካም።"));
      return;
    }

    setMessage(t("Category deleted.", "ምድቡ ተሰርዟል።"));
    await loadAll();
  }

  async function saveMember(event: React.FormEvent) {
    event.preventDefault();
    setIsSavingMember(true);
    setMessage(null);

    const response = await fetch("/api/v1/members", {
      method: memberForm.memberId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: memberForm.memberId,
        fullName: memberForm.fullName,
        photoMediaId: memberForm.photoMediaId || null,
        contactPhone: memberForm.contactPhone || undefined,
        contactEmail: memberForm.contactEmail || undefined,
        address: memberForm.address || undefined,
        medebSeferZone: memberForm.medebSeferZone || undefined,
        roleLabel: memberForm.roleLabel || undefined,
        categoryId: memberForm.categoryId || null,
        educationStatus: memberForm.educationStatus || undefined,
        occupationStatus: memberForm.occupationStatus || undefined,
        marriageStatus: memberForm.marriageStatus || undefined,
        studentStage: memberForm.studentStage || undefined,
        employmentType: memberForm.employmentType || undefined,
        status: memberForm.status,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to save member.", "አባል ማስቀመጥ አልተሳካም።"));
      setIsSavingMember(false);
      return;
    }

    setMemberForm(initialMemberForm);
    setMessage(memberForm.memberId ? t("Member updated.", "አባሉ ተሻሽሏል።") : t("Member created.", "አባል ተፈጥሯል።"));
    await loadAll();
    setIsSavingMember(false);
  }

  async function deleteMember(memberId: string) {
    const response = await fetch("/api/v1/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? t("Failed to delete member.", "አባል መሰረዝ አልተሳካም።"));
      return;
    }

    setMessage(t("Member deleted.", "አባሉ ተሰርዟል።"));
    await loadAll();
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>{t("Church Members Registry", "የቤተክርስቲያን አባላት መዝገብ")}</h2>
        <button className="control-btn" type="button" onClick={() => void loadAll()}>
          {t("Refresh", "አድስ")}
        </button>
      </div>

      <form onSubmit={(event) => void saveCategory(event)} style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>{t("Admin Categories", "የአስተዳዳሪ ምድቦች")}</h3>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Code", "ኮድ")} value={categoryForm.code} onChange={(event) => setCategoryForm({ ...categoryForm, code: event.target.value })} />
          <input className="portal-input" placeholder={t("Name", "ስም")} value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} />
        </div>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Description", "መግለጫ")} value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} />
          <label className="toggle-box">
            <input type="checkbox" checked={categoryForm.isActive} onChange={(event) => setCategoryForm({ ...categoryForm, isActive: event.target.checked })} />
            <span>{t("Active", "ንቁ")}</span>
          </label>
        </div>
        <button className="control-btn" type="submit" disabled={isSavingCategory}>{categoryForm.categoryId ? t("Update category", "ምድብ አሻሽል") : t("Create category", "ምድብ ፍጠር")}</button>
      </form>

      <div style={{ display: "grid", gap: 10 }}>
        {categories.map((category) => (
          <article key={category.id} className="content-card">
            <div className="tag-row"><span className="tag">{category.code}</span><span>{category.is_active ? t("active", "ንቁ") : t("inactive", "የተቋረጠ")}</span></div>
            <h3>{category.name}</h3>
            <p>{category.description ?? t("No description", "መግለጫ የለም")}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="control-btn" type="button" onClick={() => setCategoryForm({ categoryId: category.id, code: category.code, name: category.name, description: category.description ?? "", isActive: category.is_active })}>{t("Edit", "አሻሽል")}</button>
              <button className="control-btn" type="button" onClick={() => void deleteCategory(category.id)}>{t("Delete", "ሰርዝ")}</button>
            </div>
          </article>
        ))}
      </div>

      <form onSubmit={(event) => void saveMember(event)} style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0 }}>{t("All Members (create/update)", "ሁሉም አባላት (ፍጠር/አሻሽል)")}</h3>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Full name", "ሙሉ ስም")} value={memberForm.fullName} onChange={(event) => setMemberForm({ ...memberForm, fullName: event.target.value })} />
          <input className="portal-input" placeholder={t("Zone / Medeb sefer", "ዞን / መደብ ሰፈር")} value={memberForm.medebSeferZone} onChange={(event) => setMemberForm({ ...memberForm, medebSeferZone: event.target.value })} />
        </div>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Role", "ሚና")} value={memberForm.roleLabel} onChange={(event) => setMemberForm({ ...memberForm, roleLabel: event.target.value })} />
          <select className="portal-input" value={memberForm.categoryId} onChange={(event) => setMemberForm({ ...memberForm, categoryId: event.target.value })}>
            <option value="">{t("No category", "ምድብ የለም")}</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Phone", "ስልክ")} value={memberForm.contactPhone} onChange={(event) => setMemberForm({ ...memberForm, contactPhone: event.target.value })} />
          <input className="portal-input" placeholder={t("Email", "ኢሜይል")} value={memberForm.contactEmail} onChange={(event) => setMemberForm({ ...memberForm, contactEmail: event.target.value })} />
        </div>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Address", "አድራሻ")} value={memberForm.address} onChange={(event) => setMemberForm({ ...memberForm, address: event.target.value })} />
          <select className="portal-input" value={memberForm.status} onChange={(event) => setMemberForm({ ...memberForm, status: event.target.value as MemberForm["status"] })}>
            <option value="active">{t("Active", "ንቁ")}</option>
            <option value="inactive">{t("Inactive", "የተቋረጠ")}</option>
            <option value="moved">{t("Moved", "ተዛውሯል")}</option>
            <option value="archived">{t("Archived", "ተመዝግቧል")}</option>
          </select>
        </div>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Educational status", "የትምህርት ሁኔታ")} value={memberForm.educationStatus} onChange={(event) => setMemberForm({ ...memberForm, educationStatus: event.target.value })} />
          <input className="portal-input" placeholder={t("Occupation/Career status", "የስራ/ሙያ ሁኔታ")} value={memberForm.occupationStatus} onChange={(event) => setMemberForm({ ...memberForm, occupationStatus: event.target.value })} />
        </div>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Marriage status", "የጋብቻ ሁኔታ")} value={memberForm.marriageStatus} onChange={(event) => setMemberForm({ ...memberForm, marriageStatus: event.target.value })} />
          <input className="portal-input" placeholder={t("Student stage", "የተማሪ ደረጃ")} value={memberForm.studentStage} onChange={(event) => setMemberForm({ ...memberForm, studentStage: event.target.value })} />
        </div>
        <input className="portal-input" placeholder={t("Employment type", "የቅጥር አይነት")} value={memberForm.employmentType} onChange={(event) => setMemberForm({ ...memberForm, employmentType: event.target.value })} />
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Photo media ID", "የፎቶ ሚዲያ ID")} value={memberForm.photoMediaId} onChange={(event) => setMemberForm({ ...memberForm, photoMediaId: event.target.value })} />
          <button className="control-btn" type="button" onClick={() => setIsMediaModalOpen(true)}>{t("Pick from media", "ከሚዲያ ምረጥ")}</button>
        </div>

        <MediaSelectorModal isOpen={isMediaModalOpen} selectedMediaId={memberForm.photoMediaId} onSelect={(mediaId) => setMemberForm({ ...memberForm, photoMediaId: mediaId })} onClose={() => setIsMediaModalOpen(false)} title={t("Pick member photo", "የአባል ፎቶ ምረጥ")} />

        <button className="control-btn" type="submit" disabled={isSavingMember}>{memberForm.memberId ? t("Update member", "አባል አሻሽል") : t("Create member", "አባል ፍጠር")}</button>
      </form>

      <section style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>{t("Search and Filters", "ፍለጋ እና ማጣሪያ")}</h3>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Search by name, phone, email", "በስም፣ በስልክ፣ በኢሜይል ፈልግ")} value={search} onChange={(event) => setSearch(event.target.value)} />
          <input className="portal-input" placeholder={t("Filter by zone", "በዞን አጣራ")} value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)} />
        </div>
        <div className="admin-grid">
          <input className="portal-input" placeholder={t("Filter by role", "በሚና አጣራ")} value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} />
          <select className="portal-input" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="">{t("All categories", "ሁሉም ምድቦች")}</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div className="admin-grid">
          <select className="portal-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="all">{t("All statuses", "ሁሉም ሁኔታዎች")}</option>
            <option value="active">{t("Active", "ንቁ")}</option>
            <option value="inactive">{t("Inactive", "የተቋረጠ")}</option>
            <option value="moved">{t("Moved", "ተዛውሯል")}</option>
            <option value="archived">{t("Archived", "ተመዝግቧል")}</option>
          </select>
          <button className="control-btn" type="button" onClick={() => void loadAll()}>{t("Apply Filters", "ማጣሪያ ተግብር")}</button>
        </div>
      </section>

      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {isLoading ? <p>{t("Loading members...", "አባላት በመጫን ላይ...")}</p> : null}
        {members.map((item) => (
          <article key={item.id} className="content-card">
            {item.photo_media_preview_url ? (
              <div style={{ position: "relative", width: "100%", height: 170, borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
                <Image src={item.photo_media_preview_url} alt={item.full_name} fill sizes="(max-width: 768px) 100vw, 360px" style={{ objectFit: "cover" }} unoptimized />
              </div>
            ) : null}
            <div className="tag-row"><span className="tag">{item.status}</span><span>{item.medeb_sefer_zone ?? t("No zone", "ዞን የለም")}</span></div>
            <h3>{item.full_name}</h3>
            <p>{t("Category", "ምድብ")}: {item.member_categories?.name ?? t("Uncategorized", "ያልተመደበ")}</p>
            <p>{t("Role", "ሚና")}: {item.role_label ?? "N/A"}</p>
            <p>{t("Education", "ትምህርት")}: {item.education_status ?? "N/A"}</p>
            <p>{t("Occupation", "ሙያ")}: {item.occupation_status ?? "N/A"}</p>
            <p>{t("Marriage", "ጋብቻ")}: {item.marriage_status ?? "N/A"}</p>
            <p>{t("Student stage", "የተማሪ ደረጃ")}: {item.student_stage ?? "N/A"}</p>
            <p>{t("Employment", "ቅጥር")}: {item.employment_type ?? "N/A"}</p>
            <p>{item.contact_phone ?? t("No phone", "ስልክ የለም")} | {item.contact_email ?? t("No email", "ኢሜይል የለም")}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <button className="control-btn" type="button" onClick={() => setMemberForm({ memberId: item.id, fullName: item.full_name, photoMediaId: item.photo_media_id ?? "", contactPhone: item.contact_phone ?? "", contactEmail: item.contact_email ?? "", address: item.address ?? "", medebSeferZone: item.medeb_sefer_zone ?? "", roleLabel: item.role_label ?? "", categoryId: item.category_id ?? "", educationStatus: item.education_status ?? "", occupationStatus: item.occupation_status ?? "", marriageStatus: item.marriage_status ?? "", studentStage: item.student_stage ?? "", employmentType: item.employment_type ?? "", status: item.status })}>{t("Edit", "አሻሽል")}</button>
              <button className="control-btn" type="button" onClick={() => void deleteMember(item.id)}>{t("Delete", "ሰርዝ")}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
