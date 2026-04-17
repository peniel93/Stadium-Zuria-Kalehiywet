import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type MediaAssetRow = {
  id: string;
  bucket_name: string;
  storage_path: string;
  title: string | null;
};

export type MediaPreviewInfo = {
  previewUrl: string | null;
  title: string | null;
};

export async function loadMediaPreviewMap(mediaIds: Array<string | null | undefined>) {
  const uniqueIds = Array.from(
    new Set(mediaIds.filter((value): value is string => Boolean(value))),
  );

  if (uniqueIds.length === 0) {
    return new Map<string, MediaPreviewInfo>();
  }

  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return new Map<string, MediaPreviewInfo>();
  }

  const { data, error } = await adminClient
    .from("media_assets")
    .select("id,bucket_name,storage_path,title")
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, MediaPreviewInfo>();

  for (const item of (data ?? []) as MediaAssetRow[]) {
    const { data: signedData } = await adminClient.storage
      .from(item.bucket_name)
      .createSignedUrl(item.storage_path, 60 * 60);

    map.set(item.id, {
      previewUrl: signedData?.signedUrl ?? null,
      title: item.title,
    });
  }

  return map;
}