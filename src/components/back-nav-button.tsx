"use client";

import { useRouter, usePathname } from "next/navigation";

export function BackNavButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    router.push("/");
  }

  return (
    <button
      type="button"
      className="back-nav-btn"
      onClick={goBack}
      aria-label="Go to previous page"
    >
      Back
    </button>
  );
}
