"use client";

import type { ReactNode } from "react";
import { usePortalLocale, type Locale } from "@/lib/portal-locale";

type BilingualText = {
  en: string;
  am: string;
};

type DashboardShellProps = {
  title: BilingualText;
  description: BilingualText;
  action?: ReactNode;
  children: ReactNode;
};

function localize(text: BilingualText, locale: Locale) {
  return locale === "am" ? text.am : text.en;
}

export function DashboardShell({ title, description, action, children }: DashboardShellProps) {
  const locale = usePortalLocale();

  return (
    <main style={{ width: "min(1180px, calc(100% - 2rem))", margin: "1rem auto 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>{localize(title, locale)}</h1>
          <p style={{ color: "var(--muted)" }}>{localize(description, locale)}</p>
        </div>
        {action}
      </div>

      {children}
    </main>
  );
}