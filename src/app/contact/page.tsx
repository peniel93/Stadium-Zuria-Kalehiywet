import { PublicPageShell } from "@/components/public-page-shell";
import { ContactForm } from "@/components/contact-form";
import { listDepartments } from "@/lib/supabase/departments-repo";
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

export default async function ContactPage() {
  const [departments, publicPages] = await Promise.all([
    listDepartments(),
    getPublicPagesSettings(),
  ]);

  return (
    <PublicPageShell
      title={publicPages.contactTitleEn}
      description={publicPages.contactDescriptionEn}
      activeNavKey="contact"
    >
      <section className="panel">
        <div className="card-grid">
          <article className="content-card">
            <h3>Office</h3>
            <p>{publicPages.contactOfficeAddressEn}</p>
            <p>{publicPages.contactOfficeHoursEn}</p>
          </article>
          <article className="content-card">
            <h3>Phone</h3>
            {publicPages.contactPhones.map((phone) => (
              <p key={phone}>
                <a href={`tel:${phone}`}>{phone}</a>
              </p>
            ))}
          </article>
          <article className="content-card">
            <h3>Email</h3>
            {publicPages.contactPublicEmails.map((email) => (
              <p key={email}>
                <a href={`mailto:${email}`}>{email}</a>
              </p>
            ))}
          </article>
          <article className="content-card">
            <h3>Church Social Media</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {publicPages.churchSocialLinks.map((social) => (
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
        </div>
      </section>

      <ContactForm departments={departments} />
    </PublicPageShell>
  );
}
