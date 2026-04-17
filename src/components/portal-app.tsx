"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  quickStats as defaultQuickStats,
  homeSlides as defaultHomeSlides,
  navItems,
  siteTitle,
  spotlightCards as defaultSpotlightCards,
  type Bilingual,
  type Locale,
} from "@/lib/portal-data";
import { getCategoryMeta } from "@/lib/content/category-meta";

type QuickStatItem = {
  label: Bilingual;
  value: string;
};

type DepartmentItem = {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string;
};

type HomeSlideItem = {
  heading: Bilingual;
  text: Bilingual;
};

type MainBoardItem = {
  id?: string;
  title: Bilingual;
  summary: Bilingual;
  date: string;
  categoryCode?: string;
  categoryName?: Bilingual;
  tag: string;
  urgent: boolean;
  mediaUrl?: string | null;
};

const THEME_KEY = "portal-theme";
const LANG_KEY = "portal-lang";

function setPortalLangCookie(locale: Locale) {
  document.cookie = `portal-lang=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

function localize(text: Bilingual, locale: Locale) {
  return locale === "am" ? text.am : text.en;
}

function formatDate(rawDate: string, locale: Locale) {
  const parsedDate = new Date(rawDate);
  const date = Number.isNaN(parsedDate.getTime()) ? new Date(`${rawDate}T00:00:00Z`) : parsedDate;
  return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function defaultCategoryName(code: string): Bilingual {
  const meta = getCategoryMeta(code);
  return { en: meta.labelEn, am: meta.labelAm };
}

export function PortalApp() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");
  const [isDark, setIsDark] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slides, setSlides] = useState<HomeSlideItem[]>(defaultHomeSlides);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStatItem[]>(defaultQuickStats);
  const [siteName, setSiteName] = useState<Bilingual>(siteTitle);
  const [mainBoardItems, setMainBoardItems] = useState<MainBoardItem[]>(
    defaultSpotlightCards.slice().sort((a, b) => (a.urgent === b.urgent ? 0 : a.urgent ? -1 : 1)),
  );
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const savedLang = window.localStorage.getItem(LANG_KEY);
    const savedTheme = window.localStorage.getItem(THEME_KEY);

    queueMicrotask(() => {
      if (savedLang === "am" || savedLang === "en") {
        setLocale(savedLang);
        document.documentElement.lang = savedLang;
        setPortalLangCookie(savedLang);
      }

      if (savedTheme === "dark") {
        setIsDark(true);
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, [isDark]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const [departmentResponse, settingsResponse, mainBoardResponse] = await Promise.all([
        fetch("/api/v1/departments"),
        fetch("/api/v1/site/public"),
        fetch("/api/v1/main-board/feed"),
      ]);

      const departmentResult = await departmentResponse.json();
      const publicSiteResult = await settingsResponse.json();
      const mainBoardResult = await mainBoardResponse.json();

      if (departmentResult.success) {
        setDepartments(departmentResult.data);
      }

      if (publicSiteResult.success) {
        const settings = publicSiteResult.data.settings as {
          siteNameEn: string;
          siteNameAm: string;
        };

        setSiteName({
          en: settings.siteNameEn,
          am: settings.siteNameAm,
        });

        const mappedStats = (publicSiteResult.data.counters as Array<{
          labelEn: string;
          labelAm: string;
          value: number;
          isActive: boolean;
        }>)
          .filter((item) => item.isActive)
          .map((item) => ({
            label: {
              en: item.labelEn,
              am: item.labelAm,
            },
            value: new Intl.NumberFormat().format(item.value),
          }));

        if (mappedStats.length > 0) {
          setQuickStats(mappedStats);
        }

        const dynamicSlides = (publicSiteResult.data.publicPages?.homeSlides as Array<{
          headingEn: string;
          headingAm: string;
          textEn: string;
          textAm: string;
        }> | undefined)?.map((slide) => ({
          heading: {
            en: slide.headingEn,
            am: slide.headingAm,
          },
          text: {
            en: slide.textEn,
            am: slide.textAm,
          },
        }));

        if (dynamicSlides && dynamicSlides.length > 0) {
          setSlides(dynamicSlides);
          setSlideIndex(0);
        }
      }

      if (mainBoardResult.success && Array.isArray(mainBoardResult.data) && mainBoardResult.data.length > 0) {
        setMainBoardItems(mainBoardResult.data as MainBoardItem[]);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const activeSlide = slides[slideIndex];
  const availableCategories = Array.from(
    new Set(mainBoardItems.map((item) => item.categoryCode ?? "announcement")),
  );
  const visibleMainBoardItems =
    selectedCategory === "all"
      ? mainBoardItems
      : mainBoardItems.filter((item) => (item.categoryCode ?? "announcement") === selectedCategory);

  function closeDrawer() {
    setIsDrawerOpen(false);
  }

  function handleShellClick() {
    if (isDrawerOpen) {
      closeDrawer();
    }
  }

  function handleThemeToggle() {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const nextTheme = nextDark ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  function handleLanguageToggle() {
    const next = locale === "en" ? "am" : "en";
    setLocale(next);
    document.documentElement.lang = next;
    window.localStorage.setItem(LANG_KEY, next);
    setPortalLangCookie(next);
  }

  return (
    <div className="portal-shell" id="home" onClick={handleShellClick}>
      <div className="atmosphere" aria-hidden="true" />
      <header className="top-bar">
        <button
          className="menu-btn"
          onClick={(event) => {
            event.stopPropagation();
            setIsDrawerOpen((prev) => !prev);
          }}
          aria-label="Toggle menu"
          aria-expanded={isDrawerOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="logo logo-left">DSZ</div>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={item.key === "home" ? "active" : undefined}
              aria-current={item.key === "home" ? "page" : undefined}
            >
              {localize(item.label, locale)}
            </Link>
          ))}
        </nav>

        <div className="controls">
          <Link className="control-btn" href="/admin">
            {locale === "en" ? "Admin" : "አስተዳደር"}
          </Link>
          <button className="control-btn" onClick={handleLanguageToggle}>
            {locale === "en" ? "AM" : "EN"}
          </button>
          <button className="control-btn" onClick={handleThemeToggle}>
            {isDark ? "Light" : "Dark"}
          </button>
          <div className="logo logo-right">KH</div>
        </div>
      </header>

      <aside
        className={`drawer ${isDrawerOpen ? "open" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-glow" aria-hidden="true" />
        <h2>{localize(siteName, locale)}</h2>
        <div className="drawer-links">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={closeDrawer}
              className={item.key === "home" ? "active" : undefined}
              aria-current={item.key === "home" ? "page" : undefined}
            >
              {localize(item.label, locale)}
            </Link>
          ))}
        </div>
      </aside>

      <main>
        <section className="hero panel">
          <p className="eyebrow">{localize(siteName, locale)}</p>
          <h1>{localize(activeSlide.heading, locale)}</h1>
          <p>{localize(activeSlide.text, locale)}</p>
          <div className="slider-actions">
            <Link className="control-btn" href="/admin">
              {locale === "en" ? "Super Admin Login" : "ዋና አስተዳዳሪ ግባ"}
            </Link>
            <button
              className="control-btn"
              onClick={() =>
                setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)
              }
            >
              Prev
            </button>
            <button
              className="control-btn"
              onClick={() => setSlideIndex((prev) => (prev + 1) % slides.length)}
            >
              Next
            </button>
          </div>
        </section>

        <section className="stats-grid panel" aria-label="Church analytics">
          {quickStats.map((item) => (
            <article key={item.value + item.label.en} className="stat-card">
              <p>{localize(item.label, locale)}</p>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

        <section className="panel" id="services">
          <div className="section-head">
            <h2>{locale === "en" ? "News and Announcements" : "ዜና እና ማስታወቂያዎች"}</h2>
            {selectedCategory === "all" ? (
              <Link href="/admin">{locale === "en" ? "Open Admin" : "አስተዳደር ክፈት"}</Link>
            ) : (
              <Link href={`/updates/${selectedCategory}?lang=${locale}`}>
                {locale === "en" ? "View All" : "ሁሉንም ይመልከቱ"}
              </Link>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <button
              className="control-btn"
              type="button"
              onClick={() => setSelectedCategory("all")}
              style={{ opacity: selectedCategory === "all" ? 1 : 0.78 }}
            >
              {locale === "en" ? "All" : "ሁሉም"}
            </button>
            {availableCategories.map((code) => {
              const fromData = mainBoardItems.find((item) => (item.categoryCode ?? "announcement") === code)
                ?.categoryName;
              const label = fromData ?? defaultCategoryName(code);

              return (
                <button
                  key={code}
                  className="control-btn"
                  type="button"
                  onClick={() => setSelectedCategory(code)}
                  style={{ opacity: selectedCategory === code ? 1 : 0.78 }}
                >
                  {localize(label, locale)}
                </button>
              );
            })}
          </div>

          <div className="card-grid">
            {visibleMainBoardItems.map((item) => (
              <article key={item.id ?? item.title.en} className={`content-card ${item.urgent ? "urgent" : ""}`}>
                <div className="tag-row">
                  <span className="tag">
                    {localize(item.categoryName ?? defaultCategoryName(item.categoryCode ?? "announcement"), locale)}
                  </span>
                  <span>{formatDate(item.date, locale)}</span>
                </div>
                <h3>{localize(item.title, locale)}</h3>
                {item.mediaUrl ? (
                  <Image
                    src={item.mediaUrl}
                    alt={localize(item.title, locale)}
                    width={1200}
                    height={680}
                    unoptimized
                    style={{ width: "100%", height: "auto", maxHeight: 220, objectFit: "cover", borderRadius: 12 }}
                  />
                ) : null}
                <p>{localize(item.summary, locale)}</p>
              </article>
            ))}
          </div>
          {visibleMainBoardItems.length === 0 ? (
            <p style={{ marginTop: 12, color: "var(--muted)" }}>
              {locale === "en"
                ? "No items in this category yet."
                : "በዚህ ምድብ ውስጥ ገና ይዘት የለም።"}
            </p>
          ) : null}
        </section>

        <section className="panel" id="departments">
          <div className="section-head">
            <h2>{locale === "en" ? "Departments" : "ዘርፎች"}</h2>
            <span>{locale === "en" ? "Dynamically managed from dashboard" : "ከዳሽቦርድ በቀጥታ የሚተዳደር"}</span>
          </div>
          <div className="department-list">
            {departments.map((department) => (
              <div key={department.id} className="department-chip">
                {locale === "am" ? department.nameAm : department.nameEn}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
