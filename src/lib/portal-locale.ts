"use client";

import { useSyncExternalStore } from "react";

export type Locale = "en" | "am";

const LANG_KEY = "portal-lang";
const LOCALE_EVENT = "portal-locale-change";

function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(/(?:^|; )portal-lang=(en|am)(?:;|$)/);
  return match?.[1] === "am" ? "am" : match?.[1] === "en" ? "en" : null;
}

function writeCookieLocale(locale: Locale) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `portal-lang=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

function getDefaultLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }

  const savedLang = window.localStorage.getItem(LANG_KEY);
  if (savedLang === "am" || savedLang === "en") {
    return savedLang;
  }

  return readCookieLocale() ?? "en";
}

function subscribe(callback: () => void) {
  window.addEventListener(LOCALE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(LOCALE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Locale {
  return getDefaultLocale();
}

export function usePortalLocale(): Locale {
  return useSyncExternalStore(subscribe, getSnapshot, () => "en" as Locale);
}

export function setPortalLocale(locale: Locale) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LANG_KEY, locale);
  writeCookieLocale(locale);
  document.documentElement.lang = locale;
  window.dispatchEvent(new Event(LOCALE_EVENT));
}

export function getPortalLocale() {
  return getDefaultLocale();
}