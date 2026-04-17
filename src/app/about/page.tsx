import { PublicPageShell } from "@/components/public-page-shell";
import { getPublicPagesSettings } from "@/lib/supabase/site-settings-repo";

export default async function AboutPage() {
  const publicPages = await getPublicPagesSettings();
  const sections = publicPages.aboutBodyEn
    .split("\n\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <PublicPageShell
      title={publicPages.aboutTitleEn}
      description={publicPages.aboutDescriptionEn}
      activeNavKey="about"
    >
      <section className="panel">
        <div className="card-grid">
          {sections.map((section) => (
            <article key={section} className="content-card">
              <p>{section}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}
