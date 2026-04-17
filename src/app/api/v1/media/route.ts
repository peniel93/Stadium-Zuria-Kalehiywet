import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import { listMediaAssets } from "@/lib/supabase/media-repo";

const mediaReadRoles = ["super_admin", "global_admin", "department_admin", "editor"] as const;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...mediaReadRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to view media assets.");
  }

  try {
    const url = new URL(request.url);
    const departmentIdentifier = url.searchParams.get("departmentIdentifier");
    const mediaType = url.searchParams.get("mediaType");
    const includeDeleted = url.searchParams.get("includeDeleted") === "true";
    const items = await listMediaAssets({
      departmentIdentifier,
      mediaType:
        mediaType === "image" || mediaType === "audio" || mediaType === "video" || mediaType === "document"
          ? mediaType
          : null,
      includeDeleted,
    });
    return apiOk(items, { count: items.length });
  } catch (error) {
    return apiError(400, "MEDIA_LIST_FAILED", "Failed to load media assets.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
