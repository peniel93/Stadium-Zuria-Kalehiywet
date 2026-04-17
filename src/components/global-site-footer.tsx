import Link from "next/link";
import { cookies } from "next/headers";
import { navItems } from "@/lib/portal-data";
import { listDepartments } from "@/lib/supabase/departments-repo";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings-repo";

export async function GlobalSiteFooter() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("portal-lang")?.value === "am" ? "am" : "en";
  const t = (en: string, am: string) => (locale === "am" ? am : en);

  const [settings, departments] = await Promise.all([
    getPublicSiteSettings(),
    listDepartments(),
  ]);

  const contactEmails = settings.contactRecipientEmails.slice(0, 3);

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="footer-brand footer-brand--wide">
        <div className="footer-brand-heading">
          <strong>{locale === "am" ? settings.siteNameAm : settings.siteNameEn}</strong>
          <span className="footer-brand-kicker">{t("Church portal and administration", "የቤተክርስቲያን ፖርታል እና አስተዳደር")}</span>
        </div>
        <p>{locale === "am" ? settings.footerDescriptionAm : settings.footerDescriptionEn}</p>
      </div>

      <div className="footer-links-grid">
        <section className="footer-group" aria-label={t("Footer navigation links", "የግርጌ አሰሳ አገናኞች")}>
          <h2 className="footer-group-title">{t("Quick Links", "ፈጣን አገናኞች")}</h2>
          <nav className="footer-nav" aria-label={t("Footer navigation links", "የግርጌ አሰሳ አገናኞች")}>
            {navItems.map((item) => (
              <Link key={item.key} className="footer-nav-link" href={item.href}>
                <span>{locale === "am" ? item.label.am : item.label.en}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        </section>

        <section className="footer-group" aria-label={t("Departments quick links", "የዘርፎች ፈጣን አገናኞች")}>
          <h2 className="footer-group-title">{t("Departments", "ዘርፎች")}</h2>
          <div className="footer-departments">
            {departments.slice(0, 8).map((department) => (
              <Link key={department.code} className="footer-chip" href={`/admin/departments/${department.code}`}>
                {locale === "am" ? department.nameAm : department.nameEn}
              </Link>
            ))}
          </div>
        </section>

        <section className="footer-group" aria-label={t("Contact recipient emails", "የመገናኛ ኢሜይሎች")}>
          <h2 className="footer-group-title">{t("Contact", "አግኙን")}</h2>
          <div className="footer-contact-list">
            {contactEmails.length > 0 ? (
              contactEmails.map((email) => (
                <a key={email} className="footer-contact-link" href={`mailto:${email}`}>
                  {email}
                </a>
              ))
            ) : (
              <span className="footer-contact-muted">{t("No contact inbox configured yet.", "የመገናኛ ሳጥን ገና አልተቀናበረም።")}</span>
            )}
          </div>
        </section>
      </div>

      <div className="copyright-strip">
        <span>{new Date().getFullYear()} {locale === "am" ? settings.siteNameAm : settings.siteNameEn}</span>
        <span>{locale === "am" ? settings.copyrightAm : settings.copyrightEn}</span>
      </div>
    </footer>
  );
}
