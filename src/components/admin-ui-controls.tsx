"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getPortalLocale, setPortalLocale, usePortalLocale, type Locale } from "@/lib/portal-locale";

const THEME_KEY = "portal-theme";

export function AdminUiControls() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const locale = usePortalLocale();

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);

    document.documentElement.lang = getPortalLocale();

    queueMicrotask(() => {
      if (savedTheme === "dark") {
        setIsDark(true);
        document.documentElement.dataset.theme = "dark";
      }
    });
  }, []);

  if (!pathname.startsWith("/admin")) {
    return null;
  }

  function toggleTheme() {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const nextTheme = nextDark ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  function toggleLanguage() {
    const nextLocale: Locale = locale === "en" ? "am" : "en";
    setPortalLocale(nextLocale);
  }

  return (
    <div className="admin-ui-controls" aria-label="Admin appearance controls">
      <button type="button" className="control-btn" onClick={toggleLanguage}>
        {locale === "en" ? "AM" : "EN"}
      </button>
      <button type="button" className="control-btn" onClick={toggleTheme}>
        {isDark ? "Light" : "Dark"}
      </button>
    </div>
  );
}
