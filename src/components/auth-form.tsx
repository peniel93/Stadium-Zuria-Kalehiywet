"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  async function handleSignIn() {
    setIsBusy(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setIsBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    const nextPath = new URLSearchParams(window.location.search).get("next") || "/admin";
    setMessage("Signed in successfully. Redirecting to admin dashboard...");
    router.replace(nextPath);
    router.refresh();
  }

  async function handleSignUp() {
    setIsBusy(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setIsBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created. Check your email if confirmation is enabled.");
  }

  async function handleMagicLink() {
    setIsBusy(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });

    setIsBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Magic link sent. Check your email inbox.");
  }

  return (
    <div className="panel" style={{ maxWidth: 560, margin: "2rem auto", width: "100%" }}>
      <h1 style={{ marginTop: 0 }}>Sign in</h1>
      <p style={{ color: "var(--muted)" }}>
        Super admins and department admins can sign in here to manage protected dashboards.
      </p>

      <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="portal-input"
          placeholder="admin@example.com"
        />
      </label>

      <label style={{ display: "grid", gap: 6, marginBottom: 16 }}>
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="portal-input"
          placeholder="Your password"
        />
      </label>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="control-btn" onClick={handleSignIn} disabled={isBusy}>
          Sign in
        </button>
        <button className="control-btn" onClick={handleSignUp} disabled={isBusy}>
          Sign up
        </button>
        <button className="control-btn" onClick={handleMagicLink} disabled={isBusy}>
          Send magic link
        </button>
      </div>

      {message ? <p style={{ marginTop: 16, color: "var(--accent-strong)" }}>{message}</p> : null}
    </div>
  );
}
