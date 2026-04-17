import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnnouncementCreateInput } from "@/lib/api/announcements";
import { loadMediaPreviewMap } from "@/lib/supabase/media-preview";

type AnnouncementRow = {
  id: string;
  priority: "low" | "normal" | "high" | "urgent";
  pin_to_home: boolean;
  show_on_main_board: boolean;
  countdown_enabled: boolean;
  created_at: string;
  posts: {
    id: string;
    department_id: string | null;
    category_id: string | null;
    post_categories: { code: string; name_en: string; name_am: string }[] | null;
    featured_media_id: string | null;
    featured_media_preview_url?: string | null;
    title_en: string;
    title_am: string | null;
    body_en: string;
    body_am: string | null;
    visibility_scope: "public" | "members" | "admins";
    is_published: boolean;
    publish_at: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
  } | null;
};

type AnnouncementRawRow = Omit<AnnouncementRow, "posts"> & {
  posts:
    | {
        id: string;
        department_id: string | null;
        category_id: string | null;
        post_categories: { code: string; name_en: string; name_am: string }[] | null;
        featured_media_id: string | null;
        title_en: string;
        title_am: string | null;
        body_en: string;
        body_am: string | null;
        visibility_scope: "public" | "members" | "admins";
        is_published: boolean;
        publish_at: string | null;
        expires_at: string | null;
        created_at: string;
        updated_at: string;
      }[]
    | null;
};

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function resolveDepartmentIdentifier(identifier: string | null | undefined) {
  if (!identifier) {
    return null;
  }

  if (looksLikeUuid(identifier)) {
    return identifier;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id")
    .or(`code.eq.${identifier},name_en.eq.${identifier}`)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id;
}

async function resolveCategoryId(identifier: string | null | undefined) {
  if (!identifier) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("post_categories")
    .select("id")
    .eq("code", identifier)
    .maybeSingle();

  return data?.id ?? null;
}

export async function listAnnouncements(filters: {
  priority?: string | null;
  departmentId?: string | null;
  activeOnly?: boolean;
}) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("announcements")
    .select(
      `
        id,
        priority,
        pin_to_home,
        show_on_main_board,
        countdown_enabled,
        created_at,
        posts:post_id (
          id,
          department_id,
          category_id,
          post_categories:category_id (
            code,
            name_en,
            name_am
          ),
          featured_media_id,
          title_en,
          title_am,
          body_en,
          body_am,
          visibility_scope,
          is_published,
          publish_at,
          expires_at,
          created_at,
          updated_at
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  let rows: AnnouncementRow[] = ((data as AnnouncementRawRow[] | null) ?? []).map(
    (row) => ({
      ...row,
      posts: row.posts?.[0] ?? null,
    }),
  );

  const resolvedDepartmentId = await resolveDepartmentIdentifier(filters.departmentId);

  if (resolvedDepartmentId) {
    rows = rows.filter((row) => row.posts?.department_id === resolvedDepartmentId);
  }

  if (filters.activeOnly) {
    const now = new Date();
    rows = rows.filter((row) => {
      const post = row.posts;

      if (!post || !post.is_published) {
        return false;
      }

      const publishOk = !post.publish_at || new Date(post.publish_at) <= now;
      const expiryOk = !post.expires_at || new Date(post.expires_at) > now;

      return publishOk && expiryOk;
    });
  }

  const mediaPreviewMap = await loadMediaPreviewMap(
    rows.map((row) => row.posts?.featured_media_id ?? null),
  );

  return rows.map((row) => {
    const mediaId = row.posts?.featured_media_id ?? null;
    const mediaPreview = mediaId ? mediaPreviewMap.get(mediaId) : undefined;

    if (!row.posts) {
      return row;
    }

    return {
      ...row,
      posts: {
        ...row.posts,
        featured_media_preview_url: mediaPreview?.previewUrl ?? null,
      },
    };
  });
}

export async function createAnnouncement(userId: string, input: AnnouncementCreateInput) {
  const supabase = await createSupabaseServerClient();
  const resolvedDepartmentId = await resolveDepartmentIdentifier(input.departmentId);
  const resolvedCategoryId = await resolveCategoryId(input.categoryCode ?? "announcement");

  const { data: postData, error: postError } = await supabase
    .from("posts")
    .insert({
      department_id: resolvedDepartmentId,
      category_id: resolvedCategoryId,
      featured_media_id: input.featuredMediaId ?? null,
      title_en: input.title.en,
      title_am: input.title.am ?? null,
      body_en: input.body.en,
      body_am: input.body.am ?? null,
      visibility_scope: input.visibilityScope ?? "public",
      is_published: true,
      publish_at: input.publishAt,
      expires_at: input.expiresAt,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (postError || !postData) {
    throw new Error(postError?.message ?? "Failed to create post.");
  }

  const { data: announcementData, error: announcementError } = await supabase
    .from("announcements")
    .insert({
      post_id: postData.id,
      priority: input.priority ?? "normal",
      pin_to_home: input.pinToHome ?? false,
      show_on_main_board: input.showOnMainBoard ?? true,
      countdown_enabled: input.countdownEnabled ?? false,
    })
    .select("id")
    .single();

  if (announcementError || !announcementData) {
    await supabase.from("posts").delete().eq("id", postData.id);
    throw new Error(announcementError?.message ?? "Failed to create announcement.");
  }

  return {
    announcementId: announcementData.id,
    postId: postData.id,
  };
}

export async function updateAnnouncement(
  announcementId: string,
  userId: string,
  input: AnnouncementCreateInput,
) {
  const supabase = await createSupabaseServerClient();
  const resolvedDepartmentId = await resolveDepartmentIdentifier(input.departmentId);
  const resolvedCategoryId = await resolveCategoryId(input.categoryCode ?? "announcement");

  const { data: announcementRow, error: announcementLookupError } = await supabase
    .from("announcements")
    .select("post_id")
    .eq("id", announcementId)
    .single();

  if (announcementLookupError || !announcementRow) {
    throw new Error("Announcement not found.");
  }

  const { error: postUpdateError } = await supabase
    .from("posts")
    .update({
      department_id: resolvedDepartmentId,
      category_id: resolvedCategoryId,
      featured_media_id: input.featuredMediaId ?? null,
      title_en: input.title.en,
      title_am: input.title.am ?? null,
      body_en: input.body.en,
      body_am: input.body.am ?? null,
      visibility_scope: input.visibilityScope ?? "public",
      publish_at: input.publishAt,
      expires_at: input.expiresAt,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", announcementRow.post_id);

  if (postUpdateError) {
    throw new Error(postUpdateError.message);
  }

  const { error: announcementUpdateError } = await supabase
    .from("announcements")
    .update({
      priority: input.priority ?? "normal",
      pin_to_home: input.pinToHome ?? false,
      show_on_main_board: input.showOnMainBoard ?? true,
      countdown_enabled: input.countdownEnabled ?? false,
    })
    .eq("id", announcementId);

  if (announcementUpdateError) {
    throw new Error(announcementUpdateError.message);
  }

  return { announcementId };
}

export async function archiveAnnouncement(announcementId: string, userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: announcementRow, error: announcementLookupError } = await supabase
    .from("announcements")
    .select("post_id")
    .eq("id", announcementId)
    .single();

  if (announcementLookupError || !announcementRow) {
    throw new Error("Announcement not found.");
  }

  const { error: postArchiveError } = await supabase
    .from("posts")
    .update({
      is_published: false,
      expires_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", announcementRow.post_id);

  if (postArchiveError) {
    throw new Error(postArchiveError.message);
  }

  return { announcementId };
}
