import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveDepartmentIdOrThrow } from "@/lib/supabase/department-members-repo";

type DocumentRow = {
  id: string;
  department_id: string;
  title: string;
  description: string | null;
  file_media_id: string;
  access_scope: "public" | "members" | "department" | "admins";
  is_live: boolean;
  downloadable: boolean;
  live_from: string | null;
  live_until: string | null;
  created_at: string;
  updated_at: string;
};

async function buildMediaMap(mediaIds: string[]) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient || !mediaIds.length) {
    return new Map<string, { title: string | null; download_url: string | null }>();
  }

  const { data, error } = await adminClient
    .from("media_assets")
    .select("id,bucket_name,storage_path,title")
    .in("id", mediaIds);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, { title: string | null; download_url: string | null }>();

  for (const row of data ?? []) {
    const { data: signed } = await adminClient.storage
      .from(row.bucket_name)
      .createSignedUrl(row.storage_path, 60 * 60);

    map.set(row.id, {
      title: row.title,
      download_url: signed?.signedUrl ?? null,
    });
  }

  return map;
}

export async function listDepartmentDocuments(departmentIdentifier: string, liveOnly = false) {
  const supabase = await createSupabaseServerClient();
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);

  let query = supabase
    .from("department_documents")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });

  if (liveOnly) {
    query = query.eq("is_live", true).eq("downloadable", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as DocumentRow[];
  const mediaMap = await buildMediaMap(rows.map((row) => row.file_media_id));

  return rows.map((row) => ({
    ...row,
    media_title: mediaMap.get(row.file_media_id)?.title ?? null,
    download_url: mediaMap.get(row.file_media_id)?.download_url ?? null,
  }));
}

export async function listLiveDocuments() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("department_documents")
    .select("*,departments(name_en,name_am,code)")
    .eq("is_live", true)
    .eq("downloadable", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const now = Date.now();

  const rows = ((data ?? []) as Array<DocumentRow & { departments?: unknown }>).filter((row) => {
    const fromOk = !row.live_from || new Date(row.live_from).getTime() <= now;
    const untilOk = !row.live_until || new Date(row.live_until).getTime() > now;
    return fromOk && untilOk;
  });

  const mediaMap = await buildMediaMap(rows.map((row) => row.file_media_id));

  return rows.map((row) => ({
    ...row,
    department: Array.isArray(row.departments)
      ? row.departments[0] ?? null
      : (row.departments as { name_en?: string; name_am?: string; code?: string } | null),
    media_title: mediaMap.get(row.file_media_id)?.title ?? null,
    download_url: mediaMap.get(row.file_media_id)?.download_url ?? null,
  }));
}

export async function createDepartmentDocument(
  departmentIdentifier: string,
  input: {
    title: string;
    description?: string;
    fileMediaId: string;
    accessScope?: "public" | "members" | "department" | "admins";
    isLive?: boolean;
    downloadable?: boolean;
    liveFrom?: string | null;
    liveUntil?: string | null;
    publishedBy?: string | null;
  },
) {
  const supabase = await createSupabaseServerClient();
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);

  const { data, error } = await supabase
    .from("department_documents")
    .insert({
      department_id: departmentId,
      title: input.title,
      description: input.description ?? null,
      file_media_id: input.fileMediaId,
      access_scope: input.accessScope ?? "department",
      is_live: input.isLive ?? false,
      downloadable: input.downloadable ?? true,
      live_from: input.liveFrom ?? null,
      live_until: input.liveUntil ?? null,
      published_by: input.publishedBy ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create department document.");
  }

  return data;
}

export async function updateDepartmentDocument(
  documentId: string,
  departmentIdentifier: string,
  input: {
    title: string;
    description?: string;
    fileMediaId: string;
    accessScope?: "public" | "members" | "department" | "admins";
    isLive?: boolean;
    downloadable?: boolean;
    liveFrom?: string | null;
    liveUntil?: string | null;
    publishedBy?: string | null;
  },
) {
  const supabase = await createSupabaseServerClient();
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);

  const { data, error } = await supabase
    .from("department_documents")
    .update({
      title: input.title,
      description: input.description ?? null,
      file_media_id: input.fileMediaId,
      access_scope: input.accessScope ?? "department",
      is_live: input.isLive ?? false,
      downloadable: input.downloadable ?? true,
      live_from: input.liveFrom ?? null,
      live_until: input.liveUntil ?? null,
      published_by: input.publishedBy ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("department_id", departmentId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update department document.");
  }

  return data;
}

export async function deleteDepartmentDocument(documentId: string, departmentIdentifier: string) {
  const supabase = await createSupabaseServerClient();
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);

  const { error } = await supabase
    .from("department_documents")
    .delete()
    .eq("id", documentId)
    .eq("department_id", departmentId);

  if (error) {
    throw new Error(error.message);
  }

  return { documentId };
}
