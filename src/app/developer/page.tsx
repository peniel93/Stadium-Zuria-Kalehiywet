import { PublicPageShell } from "@/components/public-page-shell";
import { getPublicPagesSettings } from "@/lib/supabase/site-settings-repo";

function getSocialBadge(label: string, url: string) {
  const source = `${label} ${url}`.toLowerCase();

  if (source.includes("facebook") || source.includes("fb")) {
    return "FB";
  }

  if (source.includes("telegram") || source.includes("t.me")) {
    return "TG";
  }

  if (source.includes("youtube") || source.includes("youtu")) {
    return "YT";
  }

  if (source.includes("instagram") || source.includes("insta")) {
    return "IG";
  }

  if (source.includes("tiktok")) {
    return "TT";
  }

  if (source.includes("x.com") || source.includes("twitter") || source.includes("x ")) {
    return "X";
  }

  if (source.includes("linkedin")) {
    return "IN";
  }

  return "WEB";
}

export default async function DeveloperPage() {
  const publicPages = await getPublicPagesSettings();

  return (
    <PublicPageShell
      title={publicPages.developerTitleEn}
      description={publicPages.developerDescriptionEn}
      activeNavKey="developer"
    >
      <section className="panel">
        <div className="card-grid">
          <article className="content-card">
            <h3>Developer</h3>
            <p>{publicPages.developerName}</p>
            <p>
              <a href={`mailto:${publicPages.developerEmail}`}>{publicPages.developerEmail}</a>
            </p>
            <p>
              <a href={`tel:${publicPages.developerPhone}`}>{publicPages.developerPhone}</a>
            </p>
          </article>
          <article className="content-card">
            <h3>Social Links</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {publicPages.developerSocialLinks.map((social) => (
                <a
                  key={`${social.label}-${social.url}`}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <span className="tag">{getSocialBadge(social.label, social.url)}</span>
                  <span>{social.label}</span>
                </a>
              ))}
            </div>
          </article>
          <article className="content-card">
            <h3>Platform</h3>
            <p>
              Church admins can maintain departments, members, HR, training, announcements,
              resources, and public page content from one dashboard.
            </p>
          </article>
        </div>
      </section>
    </PublicPageShell>
  );
}
