import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryMeta,
  HOME_CATEGORY_META,
} from "@/lib/content/category-meta";
import { PublicSiteHeader } from "@/components/public-site-header";
import { UpdatesListScrollMemory } from "@/components/updates-list-scroll-memory";
import { listAnnouncements } from "@/lib/supabase/announcements-repo";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings-repo";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string; lang?: string }>;
};

export default async function UpdatesByCategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const query = await searchParams;
  const code = category.toLowerCase();
  const locale = query.lang === "am" ? "am" : "en";
  const t = (en: string, am: string) => (locale === "am" ? am : en);
  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const pageSize = Math.min(24, Math.max(4, Number(query.pageSize ?? "8") || 8));

  if (!HOME_CATEGORY_META.some((item) => item.code === code)) {
    notFound();
  }

  const siteSettings = await getPublicSiteSettings();
  const categoryMeta = getCategoryMeta(code);
  const rows = await listAnnouncements({ activeOnly: true });

  const items = rows
    .filter((item) => item.show_on_main_board && item.posts)
    .filter((item) => (item.posts?.post_categories?.[0]?.code ?? "announcement") === code)
    .sort((a, b) => {
      const aUrgent = a.priority === "urgent" || a.priority === "high";
      const bUrgent = b.priority === "urgent" || b.priority === "high";

      if (aUrgent !== bUrgent) {
        return aUrgent ? -1 : 1;
      }

      const aDate = new Date(a.posts?.publish_at ?? a.created_at).getTime();
      const bDate = new Date(b.posts?.publish_at ?? b.created_at).getTime();
      return bDate - aDate;
    });

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);
  const showingStart = totalItems === 0 ? 0 : start + 1;
  const showingEnd = Math.min(start + pageSize, totalItems);

  const previousHref = `/updates/${code}?page=${currentPage - 1}&pageSize=${pageSize}&lang=${locale}`;
  const nextHref = `/updates/${code}?page=${currentPage + 1}&pageSize=${pageSize}&lang=${locale}`;
  const englishHref = `/updates/${code}?page=${currentPage}&pageSize=${pageSize}&lang=en`;
  const amharicHref = `/updates/${code}?page=${currentPage}&pageSize=${pageSize}&lang=am`;
  const pageSize8Href = `/updates/${code}?page=1&pageSize=8&lang=${locale}`;
  const pageSize12Href = `/updates/${code}?page=1&pageSize=12&lang=${locale}`;
  const pageSize24Href = `/updates/${code}?page=1&pageSize=24&lang=${locale}`;

  return (
    <div className="portal-shell" id="updates-page">
      <div className="atmosphere" aria-hidden="true" />

      <PublicSiteHeader
        locale={locale}
        extraNavLink={{
          href: `/updates/${code}?lang=${locale}`,
          labelEn: "Updates",
          labelAm: "ዝማኔዎች",
          isActive: true,
        }}
        rightControls={
          <>
            <Link className="control-btn" href={englishHref} style={{ opacity: locale === "en" ? 1 : 0.78 }}>
              EN
            </Link>
            <Link className="control-btn" href={amharicHref} style={{ opacity: locale === "am" ? 1 : 0.78 }}>
              አማ
            </Link>
            <Link className="control-btn" href="/">
              {t("Back to Home", "ወደ መነሻ ተመለስ")}
            </Link>
            <div className="logo logo-right">KH</div>
          </>
        }
      />

      <main>
        <UpdatesListScrollMemory detailPathPrefix={`/updates/${code}/`} />

        <section className="panel" style={{ display: "grid", gap: 16 }}>
          <p className="eyebrow" style={{ margin: 0 }}>
            {locale === "am" ? siteSettings.siteNameAm : siteSettings.siteNameEn}
          </p>

          <div className="section-head">
            <h1 style={{ margin: 0 }}>
              {locale === "am" ? categoryMeta.labelAm : categoryMeta.labelEn} {t("Updates", "ዝማኔዎች")}
            </h1>
          </div>

          <p style={{ margin: 0, color: "var(--muted)" }}>
            {t("Browse all published items in this category.", "በዚህ ምድብ ውስጥ የታተሙ ይዘቶችን ሁሉ ይመልከቱ።")}
          </p>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            {t("Showing", "እየታየ ያለው")}: {showingStart}-{showingEnd} / {totalItems}
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: "var(--muted)" }}>{t("Page size", "የገጽ መጠን")}</span>
            <Link className="control-btn" href={pageSize8Href} style={{ opacity: pageSize === 8 ? 1 : 0.78 }}>
              8
            </Link>
            <Link className="control-btn" href={pageSize12Href} style={{ opacity: pageSize === 12 ? 1 : 0.78 }}>
              12
            </Link>
            <Link className="control-btn" href={pageSize24Href} style={{ opacity: pageSize === 24 ? 1 : 0.78 }}>
              24
            </Link>
          </div>

          <div className="card-grid">
            {pagedItems.map((item) => {
              const post = item.posts;
              if (!post) {
                return null;
              }

              const detailHref = `/updates/${code}/${item.id}?lang=${locale}&page=${currentPage}&pageSize=${pageSize}`;

              return (
                <Link
                  key={item.id}
                  href={detailHref}
                  className={`content-card ${item.priority === "urgent" ? "urgent" : ""}`}
                >
                  <div className="tag-row">
                    <span className="tag">{locale === "am" ? categoryMeta.labelAm : categoryMeta.labelEn}</span>
                    <span>
                      {new Date(post.publish_at ?? item.created_at).toLocaleDateString(
                        locale === "am" ? "am-ET" : "en-US",
                      )}
                    </span>
                  </div>
                  <h3>{locale === "am" ? post.title_am ?? post.title_en : post.title_en}</h3>
                  {post.featured_media_preview_url ? (
                    <Image
                      src={post.featured_media_preview_url}
                      alt={locale === "am" ? post.title_am ?? post.title_en : post.title_en}
                      width={1200}
                      height={680}
                      unoptimized
                      style={{ width: "100%", height: "auto", maxHeight: 260, objectFit: "cover", borderRadius: 12 }}
                    />
                  ) : null}
                  <p>{locale === "am" ? post.body_am ?? post.body_en : post.body_en}</p>
                  <p style={{ margin: 0, color: "var(--accent)", fontWeight: 700 }}>
                    {t("Read more", "ተጨማሪ ያንብቡ")} →
                  </p>
                </Link>
              );
            })}
          </div>

          {pagedItems.length === 0 ? (
            <p style={{ margin: 0, color: "var(--muted)" }}>
              {t("No published items found for this category yet.", "ለዚህ ምድብ እስካሁን የታተመ ይዘት አልተገኘም።")}
            </p>
          ) : null}

          {totalItems > 0 ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "var(--muted)" }}>
                {t("Page", "ገጽ")} {currentPage} {t("of", "ከ")} {totalPages}
              </span>
              {currentPage > 1 ? (
                <Link className="control-btn" href={previousHref}>
                  {t("Previous", "የቀድሞ")}
                </Link>
              ) : null}
              {currentPage < totalPages ? (
                <Link className="control-btn" href={nextHref}>
                  {t("Next", "ቀጣይ")}
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
