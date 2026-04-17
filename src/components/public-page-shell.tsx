import Link from "next/link";
import { cookies } from "next/headers";
import { PublicSiteHeader } from "@/components/public-site-header";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings-repo";

type PublicPageShellProps = {
  title: string;
  description: string;
  activeNavKey?: string;
  children?: React.ReactNode;
};

export async function PublicPageShell({ title, description, activeNavKey, children }: PublicPageShellProps) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("portal-lang")?.value === "am" ? "am" : "en";
  const settings = await getPublicSiteSettings();

  return (
    <div className="portal-shell">
      <div className="atmosphere" aria-hidden="true" />

      <PublicSiteHeader
        locale={locale}
        activeNavKey={activeNavKey}
        rightControls={
          <>
            <Link className="control-btn" href="/admin">
              Admin
            </Link>
            <div className="logo logo-right">KH</div>
          </>
        }
      />

      <main>
        <section className="panel">
          <p className="eyebrow">{settings.siteNameEn}</p>
          <h1 style={{ margin: "0.4rem 0 0.55rem" }}>{title}</h1>
          <p style={{ margin: 0, color: "var(--muted)", maxWidth: 900 }}>{description}</p>
        </section>

        {children}
      </main>
    </div>
  );
}
