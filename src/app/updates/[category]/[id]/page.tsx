import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSiteHeader } from "@/components/public-site-header";
import { UpdateDetailKeyboardNav } from "@/components/update-detail-keyboard-nav";
import { listAnnouncements } from "@/lib/supabase/announcements-repo";

type UpdateDetailPageProps = {
  params: Promise<{ category: string; id: string }>;
  searchParams: Promise<{ lang?: string; page?: string; pageSize?: string }>;
};

export default async function UpdateDetailPage({ params, searchParams }: UpdateDetailPageProps) {
  const { category, id } = await params;
  const query = await searchParams;
  const locale = query.lang === "am" ? "am" : "en";
  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const pageSize = Math.min(24, Math.max(4, Number(query.pageSize ?? "8") || 8));
  const listHref = `/updates/${category}?lang=${locale}&page=${page}&pageSize=${pageSize}`;
  const t = (en: string, am: string) => (locale === "am" ? am : en);

  const rows = await listAnnouncements({ activeOnly: true });
  const item = rows.find(
    (row) =>
      row.id === id &&
      (row.posts?.post_categories?.[0]?.code ?? "announcement") === category,
  );

  if (!item?.posts) {
    notFound();
  }

  const post = item.posts;
  const categoryItems = rows
    .filter((row) => row.show_on_main_board && row.posts)
    .filter((row) => (row.posts?.post_categories?.[0]?.code ?? "announcement") === category)
    .sort((a, b) => {
      const aDate = new Date(a.posts?.publish_at ?? a.created_at).getTime();
      const bDate = new Date(b.posts?.publish_at ?? b.created_at).getTime();
      return bDate - aDate;
    });

  const currentIndex = categoryItems.findIndex((row) => row.id === id);
  const previousItem = currentIndex >= 0 ? categoryItems[currentIndex + 1] : undefined;
  const nextItem = currentIndex > 0 ? categoryItems[currentIndex - 1] : undefined;
  const relatedItems = categoryItems.filter((row) => row.id !== id).slice(0, 3);
  const previousHref = previousItem
    ? `/updates/${category}/${previousItem.id}?lang=${locale}&page=${page}&pageSize=${pageSize}`
    : undefined;
  const nextHref = nextItem
    ? `/updates/${category}/${nextItem.id}?lang=${locale}&page=${page}&pageSize=${pageSize}`
    : undefined;

  return (
    <div className="portal-shell" id="updates-detail-page">
      <div className="atmosphere" aria-hidden="true" />

      <PublicSiteHeader
        locale={locale}
        extraNavLink={{
          href: listHref,
          labelEn: "Updates",
          labelAm: "ዝማኔዎች",
          isActive: true,
        }}
        rightControls={
          <>
            <Link className="control-btn" href={listHref}>
              {t("Back to list", "ወደ ዝርዝር ተመለስ")}
            </Link>
            <div className="logo logo-right">KH</div>
          </>
        }
      />

      <main>
        <UpdateDetailKeyboardNav previousHref={previousHref} nextHref={nextHref} />

        <section className="panel" style={{ display: "grid", gap: 14 }}>
          <div className="tag-row">
            <span className="tag">{post.post_categories?.[0]?.code ?? "announcement"}</span>
            <span>
              {new Date(post.publish_at ?? item.created_at).toLocaleDateString(
                locale === "am" ? "am-ET" : "en-US",
              )}
            </span>
          </div>

          <h1 style={{ margin: 0 }}>{locale === "am" ? post.title_am ?? post.title_en : post.title_en}</h1>

          {post.featured_media_preview_url ? (
            <Image
              src={post.featured_media_preview_url}
              alt={locale === "am" ? post.title_am ?? post.title_en : post.title_en}
              width={1280}
              height={720}
              unoptimized
              style={{ width: "100%", height: "auto", borderRadius: 14, maxHeight: 520, objectFit: "cover" }}
            />
          ) : null}

          <p style={{ margin: 0, lineHeight: 1.7 }}>
            {locale === "am" ? post.body_am ?? post.body_en : post.body_en}
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {previousItem ? (
              <Link className="control-btn" href={previousHref ?? listHref}>
                {t("Previous", "የቀድሞ")}
              </Link>
            ) : null}
            {nextItem ? (
              <Link className="control-btn" href={nextHref ?? listHref}>
                {t("Next", "ቀጣይ")}
              </Link>
            ) : null}
          </div>

          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem" }}>
            {t("Keyboard: Left arrow for previous, Right arrow for next.", "ቁልፍ ሰሌዳ: የግራ ቀስት ለየቀድሞ፣ የቀኝ ቀስት ለቀጣይ።")}
          </p>
        </section>

        <section className="panel" style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <h2 style={{ margin: 0 }}>{t("Related announcements", "ተዛማጅ ማስታወቂያዎች")}</h2>
          <div className="card-grid">
            {relatedItems.map((related) => {
              const relatedPost = related.posts;
              if (!relatedPost) {
                return null;
              }

              return (
                <Link
                  key={related.id}
                  className="content-card"
                  href={`/updates/${category}/${related.id}?lang=${locale}&page=${page}&pageSize=${pageSize}`}
                >
                  <div className="tag-row">
                    <span className="tag">{relatedPost.post_categories?.[0]?.code ?? category}</span>
                    <span>
                      {new Date(relatedPost.publish_at ?? related.created_at).toLocaleDateString(
                        locale === "am" ? "am-ET" : "en-US",
                      )}
                    </span>
                  </div>
                  <h3>{locale === "am" ? relatedPost.title_am ?? relatedPost.title_en : relatedPost.title_en}</h3>
                  <p>{locale === "am" ? relatedPost.body_am ?? relatedPost.body_en : relatedPost.body_en}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
