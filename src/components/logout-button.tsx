"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button className="control-btn" onClick={handleLogout} type="button">
      Sign out
    </button>
  );
}
