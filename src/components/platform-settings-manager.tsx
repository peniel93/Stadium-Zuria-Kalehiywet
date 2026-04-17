"use client";

import { useCallback, useEffect, useState } from "react";

type PublicSiteSettings = {
  siteNameEn: string;
  siteNameAm: string;
  footerDescriptionEn: string;
  footerDescriptionAm: string;
  copyrightEn: string;
  copyrightAm: string;
  contactRecipientEmails: string[];
};

type CounterItem = {
  code: string;
  labelEn: string;
  labelAm: string;
  value: number;
  sortOrder: number;
  isActive: boolean;
};

type DepartmentItem = {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string;
  description: string | null;
  isPublic: boolean;
  isActive: boolean;
};

type DepartmentCategoryItem = {
  id: string;
  departmentId: string;
  departmentCode: string;
  departmentNameEn: string;
  departmentNameAm: string;
  code: string;
  nameEn: string;
  nameAm: string;
  description: string | null;
};

type PublicPageSlide = {
  headingEn: string;
  headingAm: string;
  textEn: string;
  textAm: string;
};

type PublicPagesSettings = {
  aboutTitleEn: string;
  aboutDescriptionEn: string;
  aboutBodyEn: string;
  servicesTitleEn: string;
  servicesDescriptionEn: string;
  servicesBodyEn: string;
  contactTitleEn: string;
  contactDescriptionEn: string;
  contactOfficeAddressEn: string;
  contactOfficeHoursEn: string;
  contactPhones: string[];
  contactPublicEmails: string[];
  churchSocialLinks: Array<{ label: string; url: string }>;
  developerTitleEn: string;
  developerDescriptionEn: string;
  developerName: string;
  developerEmail: string;
  developerPhone: string;
  developerSocialLinks: Array<{ label: string; url: string }>;
  homeSlides: PublicPageSlide[];
};

const emptyDepartment = {
  code: "",
  nameEn: "",
  nameAm: "",
  description: "",
};

export function PlatformSettingsManager() {
  const [settings, setSettings] = useState<PublicSiteSettings | null>(null);
  const [counters, setCounters] = useState<CounterItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [categories, setCategories] = useState<DepartmentCategoryItem[]>([]);
  const [publicPages, setPublicPages] = useState<PublicPagesSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newDepartment, setNewDepartment] = useState(emptyDepartment);
  const [categoryForm, setCategoryForm] = useState({
    categoryId: "",
    departmentId: "",
    code: "",
    nameEn: "",
    nameAm: "",
    description: "",
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    const [settingsResponse, departmentsResponse] = await Promise.all([
      fetch("/api/v1/site/settings"),
      fetch("/api/v1/departments?includeInactive=true"),
    ]);

    const categoriesResponse = await fetch("/api/v1/departments/categories");

    const settingsResult = await settingsResponse.json();
    const departmentsResult = await departmentsResponse.json();
    const categoriesResult = await categoriesResponse.json();

    if (settingsResult.success) {
      setSettings(settingsResult.data.settings);
      setCounters(settingsResult.data.counters);
      setPublicPages(settingsResult.data.publicPages);
    }

    if (departmentsResult.success) {
      setDepartments(departmentsResult.data);
    }

    if (categoriesResult.success) {
      setCategories(categoriesResult.data);
    }

    if (!settingsResult.success || !departmentsResult.success || !categoriesResult.success) {
      setMessage("Failed to load platform settings.");
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function saveSettings() {
    if (!settings) {
      return;
    }

    setMessage(null);

    const response = await fetch("/api/v1/site/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? "Failed to save settings.");
      return;
    }

    setSettings(result.data.settings);
    setMessage("Settings updated.");
  }

  async function savePublicPages() {
    if (!publicPages) {
      return;
    }

    const response = await fetch("/api/v1/site/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert-public-pages",
        ...publicPages,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? "Failed to save public page content.");
      return;
    }

    setPublicPages(result.data.publicPages);
    setMessage("Public pages content updated.");
  }

  async function saveCounter(counter: CounterItem) {
    const response = await fetch("/api/v1/site/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert-counter",
        code: counter.code,
        labelEn: counter.labelEn,
        labelAm: counter.labelAm,
        value: counter.value,
        sortOrder: counter.sortOrder,
        isActive: counter.isActive,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? "Failed to save counter.");
      return;
    }

    setCounters(result.data.counters);
    setMessage(`Counter updated: ${counter.labelEn}`);
  }

  async function createDepartment() {
    setMessage(null);

    const response = await fetch("/api/v1/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDepartment),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? "Failed to create department.");
      return;
    }

    setNewDepartment(emptyDepartment);
    setMessage("Department created.");
    await loadData();
  }

  async function saveCategory() {
    if (!categoryForm.departmentId || !categoryForm.code || !categoryForm.nameEn || !categoryForm.nameAm) {
      setMessage("Department, code, English name, and Amharic name are required.");
      return;
    }

    const payload = {
      categoryId: categoryForm.categoryId || undefined,
      departmentId: categoryForm.departmentId,
      code: categoryForm.code,
      nameEn: categoryForm.nameEn,
      nameAm: categoryForm.nameAm,
      description: categoryForm.description || undefined,
    };

    const response = await fetch("/api/v1/departments/categories", {
      method: categoryForm.categoryId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? "Failed to save department category.");
      return;
    }

    setCategories(result.data);
    setCategoryForm({
      categoryId: "",
      departmentId: "",
      code: "",
      nameEn: "",
      nameAm: "",
      description: "",
    });
    setMessage(payload.categoryId ? "Department category updated." : "Department category created.");
  }

  async function deleteCategory(categoryId: string) {
    const response = await fetch("/api/v1/departments/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.error?.message ?? "Failed to delete department category.");
      return;
    }

    setCategories(result.data);
    setMessage("Department category deleted.");
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 16 }}>
      <div className="section-head">
        <h2 style={{ margin: 0 }}>Platform Settings</h2>
        <button className="control-btn" type="button" onClick={() => void loadData()}>
          Refresh
        </button>
      </div>

      {isLoading ? <p>Loading settings...</p> : null}
      {message ? <p style={{ margin: 0, color: "var(--accent-strong)" }}>{message}</p> : null}

      {settings ? (
        <div style={{ display: "grid", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Website Identity</h3>
          <div className="admin-grid">
            <input className="portal-input" placeholder="Site name (EN)" value={settings.siteNameEn} onChange={(event) => setSettings({ ...settings, siteNameEn: event.target.value })} />
            <input className="portal-input" placeholder="Site name (AM)" value={settings.siteNameAm} onChange={(event) => setSettings({ ...settings, siteNameAm: event.target.value })} />
          </div>
          <textarea className="portal-input" rows={3} placeholder="Footer description (EN)" value={settings.footerDescriptionEn} onChange={(event) => setSettings({ ...settings, footerDescriptionEn: event.target.value })} />
          <textarea className="portal-input" rows={3} placeholder="Footer description (AM)" value={settings.footerDescriptionAm} onChange={(event) => setSettings({ ...settings, footerDescriptionAm: event.target.value })} />
          <div className="admin-grid">
            <input className="portal-input" placeholder="Copyright (EN)" value={settings.copyrightEn} onChange={(event) => setSettings({ ...settings, copyrightEn: event.target.value })} />
            <input className="portal-input" placeholder="Copyright (AM)" value={settings.copyrightAm} onChange={(event) => setSettings({ ...settings, copyrightAm: event.target.value })} />
          </div>
          <input
            className="portal-input"
            placeholder="Contact recipient emails (comma separated)"
            value={settings.contactRecipientEmails.join(", ")}
            onChange={(event) =>
              setSettings({
                ...settings,
                contactRecipientEmails: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          />
          <button className="control-btn" type="button" onClick={() => void saveSettings()}>
            Save Site Settings
          </button>
        </div>
      ) : null}

      <section style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0 }}>Homepage Counters</h3>
        {counters.map((counter) => (
          <article key={counter.code} className="content-card" style={{ display: "grid", gap: 8 }}>
            <div className="admin-grid">
              <input className="portal-input" value={counter.labelEn} onChange={(event) => setCounters((prev) => prev.map((item) => (item.code === counter.code ? { ...item, labelEn: event.target.value } : item)))} />
              <input className="portal-input" value={counter.labelAm} onChange={(event) => setCounters((prev) => prev.map((item) => (item.code === counter.code ? { ...item, labelAm: event.target.value } : item)))} />
              <input className="portal-input" type="number" value={counter.value} onChange={(event) => setCounters((prev) => prev.map((item) => (item.code === counter.code ? { ...item, value: Number(event.target.value) } : item)))} />
            </div>
            <button className="control-btn" type="button" onClick={() => void saveCounter(counter)}>
              Save Counter
            </button>
          </article>
        ))}
      </section>

      {publicPages ? (
        <section style={{ display: "grid", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Public Page Content</h3>

          <article className="content-card" style={{ display: "grid", gap: 10 }}>
            <h4 style={{ margin: 0 }}>Home Slides</h4>
            {publicPages.homeSlides.map((slide, index) => (
              <div key={`slide-${index}`} className="admin-grid">
                <input
                  className="portal-input"
                  placeholder={`Slide ${index + 1} heading (EN)`}
                  value={slide.headingEn}
                  onChange={(event) =>
                    setPublicPages((prev) =>
                      prev
                        ? {
                            ...prev,
                            homeSlides: prev.homeSlides.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, headingEn: event.target.value } : item,
                            ),
                          }
                        : prev,
                    )
                  }
                />
                <input
                  className="portal-input"
                  placeholder={`Slide ${index + 1} heading (AM)`}
                  value={slide.headingAm}
                  onChange={(event) =>
                    setPublicPages((prev) =>
                      prev
                        ? {
                            ...prev,
                            homeSlides: prev.homeSlides.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, headingAm: event.target.value } : item,
                            ),
                          }
                        : prev,
                    )
                  }
                />
                <input
                  className="portal-input"
                  placeholder={`Slide ${index + 1} text (EN)`}
                  value={slide.textEn}
                  onChange={(event) =>
                    setPublicPages((prev) =>
                      prev
                        ? {
                            ...prev,
                            homeSlides: prev.homeSlides.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, textEn: event.target.value } : item,
                            ),
                          }
                        : prev,
                    )
                  }
                />
                <input
                  className="portal-input"
                  placeholder={`Slide ${index + 1} text (AM)`}
                  value={slide.textAm}
                  onChange={(event) =>
                    setPublicPages((prev) =>
                      prev
                        ? {
                            ...prev,
                            homeSlides: prev.homeSlides.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, textAm: event.target.value } : item,
                            ),
                          }
                        : prev,
                    )
                  }
                />
              </div>
            ))}
          </article>

          <article className="content-card" style={{ display: "grid", gap: 10 }}>
            <h4 style={{ margin: 0 }}>About Page</h4>
            <input className="portal-input" placeholder="About title" value={publicPages.aboutTitleEn} onChange={(event) => setPublicPages({ ...publicPages, aboutTitleEn: event.target.value })} />
            <textarea className="portal-input" rows={2} placeholder="About description" value={publicPages.aboutDescriptionEn} onChange={(event) => setPublicPages({ ...publicPages, aboutDescriptionEn: event.target.value })} />
            <textarea className="portal-input" rows={6} placeholder="About body (use blank line between sections)" value={publicPages.aboutBodyEn} onChange={(event) => setPublicPages({ ...publicPages, aboutBodyEn: event.target.value })} />
          </article>

          <article className="content-card" style={{ display: "grid", gap: 10 }}>
            <h4 style={{ margin: 0 }}>Services Page</h4>
            <input className="portal-input" placeholder="Services title" value={publicPages.servicesTitleEn} onChange={(event) => setPublicPages({ ...publicPages, servicesTitleEn: event.target.value })} />
            <textarea className="portal-input" rows={2} placeholder="Services description" value={publicPages.servicesDescriptionEn} onChange={(event) => setPublicPages({ ...publicPages, servicesDescriptionEn: event.target.value })} />
            <textarea className="portal-input" rows={6} placeholder="Services body (use blank line between sections)" value={publicPages.servicesBodyEn} onChange={(event) => setPublicPages({ ...publicPages, servicesBodyEn: event.target.value })} />
          </article>

          <article className="content-card" style={{ display: "grid", gap: 10 }}>
            <h4 style={{ margin: 0 }}>Contact Page</h4>
            <input className="portal-input" placeholder="Contact title" value={publicPages.contactTitleEn} onChange={(event) => setPublicPages({ ...publicPages, contactTitleEn: event.target.value })} />
            <textarea className="portal-input" rows={2} placeholder="Contact description" value={publicPages.contactDescriptionEn} onChange={(event) => setPublicPages({ ...publicPages, contactDescriptionEn: event.target.value })} />
            <input className="portal-input" placeholder="Office address" value={publicPages.contactOfficeAddressEn} onChange={(event) => setPublicPages({ ...publicPages, contactOfficeAddressEn: event.target.value })} />
            <input className="portal-input" placeholder="Office hours" value={publicPages.contactOfficeHoursEn} onChange={(event) => setPublicPages({ ...publicPages, contactOfficeHoursEn: event.target.value })} />
            <input className="portal-input" placeholder="Public phones (comma separated)" value={publicPages.contactPhones.join(", ")} onChange={(event) => setPublicPages({ ...publicPages, contactPhones: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
            <input className="portal-input" placeholder="Public emails (comma separated)" value={publicPages.contactPublicEmails.join(", ")} onChange={(event) => setPublicPages({ ...publicPages, contactPublicEmails: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
            <input
              className="portal-input"
              placeholder="Church social links (Label|URL, Label|URL)"
              value={publicPages.churchSocialLinks.map((item) => `${item.label}|${item.url}`).join(", ")}
              onChange={(event) =>
                setPublicPages({
                  ...publicPages,
                  churchSocialLinks: event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((item) => {
                      const [label, url] = item.split("|").map((part) => part.trim());
                      return { label: label ?? "", url: url ?? "" };
                    })
                    .filter((item) => item.label && item.url),
                })
              }
            />
          </article>

          <article className="content-card" style={{ display: "grid", gap: 10 }}>
            <h4 style={{ margin: 0 }}>Developer Page</h4>
            <input className="portal-input" placeholder="Developer page title" value={publicPages.developerTitleEn} onChange={(event) => setPublicPages({ ...publicPages, developerTitleEn: event.target.value })} />
            <textarea className="portal-input" rows={2} placeholder="Developer page description" value={publicPages.developerDescriptionEn} onChange={(event) => setPublicPages({ ...publicPages, developerDescriptionEn: event.target.value })} />
            <div className="admin-grid">
              <input className="portal-input" placeholder="Developer name" value={publicPages.developerName} onChange={(event) => setPublicPages({ ...publicPages, developerName: event.target.value })} />
              <input className="portal-input" placeholder="Developer email" value={publicPages.developerEmail} onChange={(event) => setPublicPages({ ...publicPages, developerEmail: event.target.value })} />
              <input className="portal-input" placeholder="Developer phone" value={publicPages.developerPhone} onChange={(event) => setPublicPages({ ...publicPages, developerPhone: event.target.value })} />
            </div>
            <input
              className="portal-input"
              placeholder="Social links (Label|URL, Label|URL)"
              value={publicPages.developerSocialLinks.map((item) => `${item.label}|${item.url}`).join(", ")}
              onChange={(event) =>
                setPublicPages({
                  ...publicPages,
                  developerSocialLinks: event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((item) => {
                      const [label, url] = item.split("|").map((part) => part.trim());
                      return { label: label ?? "", url: url ?? "" };
                    })
                    .filter((item) => item.label && item.url),
                })
              }
            />
          </article>

          <button className="control-btn" type="button" onClick={() => void savePublicPages()}>
            Save Public Page Content
          </button>
        </section>
      ) : null}

      <section style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0 }}>Create Department</h3>
        <div className="admin-grid">
          <input className="portal-input" placeholder="Department code (slug)" value={newDepartment.code} onChange={(event) => setNewDepartment({ ...newDepartment, code: event.target.value })} />
          <input className="portal-input" placeholder="Department name (EN)" value={newDepartment.nameEn} onChange={(event) => setNewDepartment({ ...newDepartment, nameEn: event.target.value })} />
          <input className="portal-input" placeholder="Department name (AM)" value={newDepartment.nameAm} onChange={(event) => setNewDepartment({ ...newDepartment, nameAm: event.target.value })} />
        </div>
        <textarea className="portal-input" rows={2} placeholder="Description" value={newDepartment.description} onChange={(event) => setNewDepartment({ ...newDepartment, description: event.target.value })} />
        <button className="control-btn" type="button" onClick={() => void createDepartment()}>
          Create Department
        </button>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0 }}>Department Categories</h3>
        <div className="admin-grid">
          <select
            className="portal-input"
            value={categoryForm.departmentId}
            onChange={(event) =>
              setCategoryForm({ ...categoryForm, departmentId: event.target.value })
            }
          >
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.nameEn}
              </option>
            ))}
          </select>
          <input
            className="portal-input"
            placeholder="Category code (slug)"
            value={categoryForm.code}
            onChange={(event) =>
              setCategoryForm({ ...categoryForm, code: event.target.value.toLowerCase() })
            }
          />
          <input
            className="portal-input"
            placeholder="Category name (EN)"
            value={categoryForm.nameEn}
            onChange={(event) => setCategoryForm({ ...categoryForm, nameEn: event.target.value })}
          />
          <input
            className="portal-input"
            placeholder="Category name (AM)"
            value={categoryForm.nameAm}
            onChange={(event) => setCategoryForm({ ...categoryForm, nameAm: event.target.value })}
          />
        </div>
        <textarea
          className="portal-input"
          rows={2}
          placeholder="Category description"
          value={categoryForm.description}
          onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })}
        />
        <div className="admin-grid">
          <button className="control-btn" type="button" onClick={() => void saveCategory()}>
            {categoryForm.categoryId ? "Update Category" : "Create Category"}
          </button>
          <button
            className="control-btn"
            type="button"
            onClick={() =>
              setCategoryForm({
                categoryId: "",
                departmentId: "",
                code: "",
                nameEn: "",
                nameAm: "",
                description: "",
              })
            }
          >
            Clear
          </button>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {categories.map((category) => (
            <article key={category.id} className="content-card">
              <div className="tag-row">
                <span className="tag">{category.departmentNameEn || category.departmentCode}</span>
                <span>{category.code}</span>
              </div>
              <h3>{category.nameEn}</h3>
              <p>{category.nameAm}</p>
              <p>{category.description ?? "No description"}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="control-btn"
                  type="button"
                  onClick={() =>
                    setCategoryForm({
                      categoryId: category.id,
                      departmentId: category.departmentId,
                      code: category.code,
                      nameEn: category.nameEn,
                      nameAm: category.nameAm,
                      description: category.description ?? "",
                    })
                  }
                >
                  Edit
                </button>
                <button className="control-btn" type="button" onClick={() => void deleteCategory(category.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0 }}>Existing Departments ({departments.length})</h3>
        <div className="department-list">
          {departments.map((department) => (
            <span key={department.id} className="department-chip">
              {department.nameEn} ({department.code})
            </span>
          ))}
        </div>
      </section>
    </section>
  );
}
