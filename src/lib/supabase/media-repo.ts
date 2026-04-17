import { getMediaBucketName } from "@/lib/config/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDepartmentIdOrThrow } from "@/lib/supabase/department-members-repo";

type MediaType = "image" | "audio" | "video" | "document";

type AuditAction = "media.updated" | "media.deleted" | "media.restored";

async function writeMediaAuditLog(input: {
  actorUserId?: string;
  actionType: AuditAction;
  entityId: string;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
}) {
  const supabase = await createSupabaseServerClient();

  await supabase.from("audit_logs").insert({
    actor_user_id: input.actorUserId ?? null,
    action_type: input.actionType,
    entity_name: "media_assets",
    entity_id: input.entityId,
    before_json: input.beforeJson ?? null,
    after_json: input.afterJson ?? null,
  });
}

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function resolveDepartmentIdMaybe(identifier: string | null | undefined) {
  if (!identifier) {
    return null;
  }

  if (looksLikeUuid(identifier)) {
    return identifier;
  }

  try {
    return await resolveDepartmentIdOrThrow(identifier);
  } catch {
    return null;
  }
}

function extensionFromFilename(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : "bin";
}

function normalizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/-+/g, "-");
}

export async function createMediaUploadUrl(input: {
  fileName: string;
  mimeType: string;
  departmentIdentifier?: string;
}) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const bucketName = getMediaBucketName();
  const departmentId = await resolveDepartmentIdMaybe(input.departmentIdentifier ?? null);
  const ext = extensionFromFilename(input.fileName);
  const safeName = normalizeFileName(input.fileName);
  const path = `${departmentId ?? "global"}/${Date.now()}-${safeName || `file.${ext}`}`;

  const { data, error } = await adminClient.storage.from(bucketName).createSignedUploadUrl(path);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Failed to create signed upload URL.");
  }

  return {
    bucketName,
    storagePath: path,
    signedUrl: data.signedUrl,
    token: data.token,
  };
}

export async function registerMediaAsset(input: {
  departmentIdentifier?: string;
  bucketName: string;
  storagePath: string;
  mediaType: MediaType;
  title?: string;
  description?: string;
  uploadedBy?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const ownerDepartmentId = await resolveDepartmentIdMaybe(input.departmentIdentifier ?? null);

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      owner_department_id: ownerDepartmentId,
      bucket_name: input.bucketName,
      storage_path: input.storagePath,
      media_type: input.mediaType,
      title: input.title ?? null,
      description: input.description ?? null,
      uploaded_by: input.uploadedBy ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to register media asset.");
  }

  return data;
}

export async function listMediaAssets(filters: {
  departmentIdentifier?: string | null;
  mediaType?: MediaType | null;
  includeDeleted?: boolean;
}) {
  const supabase = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  let query = supabase.from("media_assets").select("*").order("created_at", { ascending: false });

  const departmentId = await resolveDepartmentIdMaybe(filters.departmentIdentifier ?? null);

  if (departmentId) {
    query = query.eq("owner_department_id", departmentId);
  }

  if (filters.mediaType) {
    query = query.eq("media_type", filters.mediaType);
  }

  if (!filters.includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];

  if (!adminClient) {
    return rows;
  }

  const withPreview = await Promise.all(
    rows.map(async (item) => {
      const { data: signedData } = await adminClient.storage
        .from(item.bucket_name)
        .createSignedUrl(item.storage_path, 60 * 60);

      return {
        ...item,
        preview_url: signedData?.signedUrl ?? null,
      };
    }),
  );

  return withPreview;
}

export async function updateMediaAsset(
  mediaId: string,
  input: {
    title?: string | null;
    description?: string | null;
    actorUserId?: string;
  },
) {
  const supabase = await createSupabaseServerClient();

  const { data: existingAsset, error: existingError } = await supabase
    .from("media_assets")
    .select("id,title,description,deleted_at")
    .eq("id", mediaId)
    .single();

  if (existingError || !existingAsset) {
    throw new Error(existingError?.message ?? "Media asset not found.");
  }

  if (existingAsset.deleted_at) {
    throw new Error("Deleted media assets cannot be updated. Restore first.");
  }

  const { data, error } = await supabase
    .from("media_assets")
    .update({
      title: input.title ?? null,
      description: input.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update media asset.");
  }

  await writeMediaAuditLog({
    actorUserId: input.actorUserId,
    actionType: "media.updated",
    entityId: mediaId,
    beforeJson: {
      title: existingAsset.title,
      description: existingAsset.description,
    },
    afterJson: {
      title: data.title,
      description: data.description,
    },
  });

  return data;
}

export async function deleteMediaAsset(mediaId: string, actorUserId?: string) {
  const supabase = await createSupabaseServerClient();

  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .select("id,bucket_name,storage_path,title,description,deleted_at")
    .eq("id", mediaId)
    .single();

  if (assetError || !asset) {
    throw new Error(assetError?.message ?? "Media asset not found.");
  }

  if (asset.deleted_at) {
    return { mediaId };
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("media_assets")
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", mediaId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await writeMediaAuditLog({
    actorUserId,
    actionType: "media.deleted",
    entityId: mediaId,
    beforeJson: {
      title: asset.title,
      description: asset.description,
      deleted_at: null,
    },
    afterJson: {
      title: asset.title,
      description: asset.description,
      deleted_at: now,
    },
  });

  return { mediaId };
}

export async function restoreMediaAsset(mediaId: string, actorUserId?: string) {
  const supabase = await createSupabaseServerClient();

  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .select("id,title,description,deleted_at")
    .eq("id", mediaId)
    .single();

  if (assetError || !asset) {
    throw new Error(assetError?.message ?? "Media asset not found.");
  }

  if (!asset.deleted_at) {
    return { mediaId };
  }

  const now = new Date().toISOString();

  const { error: restoreError } = await supabase
    .from("media_assets")
    .update({
      deleted_at: null,
      updated_at: now,
    })
    .eq("id", mediaId);

  if (restoreError) {
    throw new Error(restoreError.message);
  }

  await writeMediaAuditLog({
    actorUserId,
    actionType: "media.restored",
    entityId: mediaId,
    beforeJson: {
      title: asset.title,
      description: asset.description,
      deleted_at: asset.deleted_at,
    },
    afterJson: {
      title: asset.title,
      description: asset.description,
      deleted_at: null,
    },
  });

  return { mediaId };
}
