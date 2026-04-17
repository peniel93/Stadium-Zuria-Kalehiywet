import { NextResponse } from "next/server";
import { listAnnouncements } from "@/lib/supabase/announcements-repo";
import { getPublicPagesSettings } from "@/lib/supabase/site-settings-repo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category")?.trim().toLowerCase() ?? "";
  const limit = Number(searchParams.get("limit") ?? "8");

  const [rows, publicPages] = await Promise.all([
    listAnnouncements({ activeOnly: true }),
    getPublicPagesSettings(),
  ]);
  const categoryOrder = publicPages.homeCategoryOrder;
  const categoryLimits = publicPages.homeCategoryLimits ?? {};
  const categoryWeight = new Map(categoryOrder.map((code, index) => [code, index]));

  const sortedItems = rows
    .filter((item) => item.show_on_main_board && item.posts)
    .filter((item) => {
      if (!category) {
        return true;
      }

      return (item.posts?.post_categories?.[0]?.code ?? "announcement") === category;
    })
    .map((item) => {
      const category = item.posts?.post_categories?.[0];
      const publishDate = item.posts?.publish_at ?? item.created_at;

      return {
        id: item.id,
        title: {
          en: item.posts?.title_en ?? "",
          am: item.posts?.title_am ?? item.posts?.title_en ?? "",
        },
        summary: {
          en: item.posts?.body_en ?? "",
          am: item.posts?.body_am ?? item.posts?.body_en ?? "",
        },
        date: publishDate,
        categoryCode: category?.code ?? "announcement",
        categoryName: {
          en: category?.name_en ?? "Announcement",
          am: category?.name_am ?? "ማስታወቂያ",
        },
        tag: category?.name_en ?? category?.code ?? "Announcement",
        urgent: item.priority === "urgent" || item.priority === "high",
        mediaUrl: item.posts?.featured_media_preview_url ?? null,
      };
    })
    .sort((a, b) => {
      const aWeight = categoryWeight.get(a.categoryCode) ?? Number.MAX_SAFE_INTEGER;
      const bWeight = categoryWeight.get(b.categoryCode) ?? Number.MAX_SAFE_INTEGER;

      if (aWeight !== bWeight) {
        return aWeight - bWeight;
      }

      if (a.urgent !== b.urgent) {
        return a.urgent ? -1 : 1;
      }

      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const cappedItems = category
    ? sortedItems
    : (() => {
        const counts = new Map<string, number>();
        const included: typeof sortedItems = [];

        for (const item of sortedItems) {
          const code = item.categoryCode;
          const current = counts.get(code) ?? 0;
          const cap = Number(categoryLimits[code] ?? 0);

          if (Number.isFinite(cap) && cap > 0 && current >= cap) {
            continue;
          }

          included.push(item);
          counts.set(code, current + 1);
        }

        return included;
      })();

  const prioritized = cappedItems.slice(0, Number.isFinite(limit) && limit > 0 ? Math.min(limit, 60) : 8);

  return NextResponse.json({
    success: true,
    data: prioritized,
    error: null,
    meta: {
      count: prioritized.length,
      generatedAt: new Date().toISOString(),
    },
  });
}
