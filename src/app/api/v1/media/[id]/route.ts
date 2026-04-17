import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import { deleteMediaAsset, restoreMediaAsset, updateMediaAsset } from "@/lib/supabase/media-repo";

const mediaWriteRoles = ["super_admin", "global_admin", "department_admin", "editor"] as const;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...mediaWriteRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to update media assets.");
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      description?: string;
    };

    const asset = await updateMediaAsset(id, {
      title: body.title?.trim() ?? null,
      description: body.description?.trim() ?? null,
      actorUserId: authContext.user.id,
    });

    return apiOk(asset);
  } catch (error) {
    return apiError(400, "MEDIA_UPDATE_FAILED", "Failed to update media asset.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...mediaWriteRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to delete media assets.");
  }

  try {
    const { id } = await context.params;
    const result = await deleteMediaAsset(id, authContext.user.id);
    return apiOk(result);
  } catch (error) {
    return apiError(400, "MEDIA_DELETE_FAILED", "Failed to delete media asset.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...mediaWriteRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to restore media assets.");
  }

  try {
    const { id } = await context.params;
    const result = await restoreMediaAsset(id, authContext.user.id);
    return apiOk(result);
  } catch (error) {
    return apiError(400, "MEDIA_RESTORE_FAILED", "Failed to restore media asset.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
