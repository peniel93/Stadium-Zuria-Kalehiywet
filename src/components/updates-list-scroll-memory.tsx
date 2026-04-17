"use client";

import { useEffect, useMemo } from "react";

type UpdatesListScrollMemoryProps = {
  detailPathPrefix: string;
};

const STORAGE_PREFIX = "updates:list-scroll:";

export function UpdatesListScrollMemory({ detailPathPrefix }: UpdatesListScrollMemoryProps) {
  const listUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.pathname}${window.location.search}`;
  }, []);

  useEffect(() => {
    if (!listUrl) {
      return;
    }

    const storageKey = `${STORAGE_PREFIX}${listUrl}`;
    const storedY = window.sessionStorage.getItem(storageKey);

    if (storedY) {
      const y = Number(storedY);
      if (Number.isFinite(y) && y >= 0) {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: "auto" });
        });
      }

      window.sessionStorage.removeItem(storageKey);
    }

    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith(detailPathPrefix)) {
        return;
      }

      window.sessionStorage.setItem(storageKey, String(window.scrollY));
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [detailPathPrefix, listUrl]);

  return null;
}
