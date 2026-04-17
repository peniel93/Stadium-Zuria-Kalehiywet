import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import { registerMediaAsset } from "@/lib/supabase/media-repo";

const mediaWriteRoles = ["super_admin", "global_admin", "department_admin", "editor"] as const;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...mediaWriteRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to register media.");
  }

  try {
    const body = (await request.json()) as {
      departmentIdentifier?: string;
      bucketName?: string;
      storagePath?: string;
      mediaType?: "image" | "audio" | "video" | "document";
      title?: string;
      description?: string;
    };

    if (!body.bucketName || !body.storagePath || !body.mediaType) {
      return apiError(
        400,
        "INVALID_PAYLOAD",
        "bucketName, storagePath, and mediaType are required.",
      );
    }

    const asset = await registerMediaAsset({
      departmentIdentifier: body.departmentIdentifier,
      bucketName: body.bucketName,
      storagePath: body.storagePath,
      mediaType: body.mediaType,
      title: body.title,
      description: body.description,
      uploadedBy: authContext.user.id,
    });

    return apiOk(asset);
  } catch (error) {
    return apiError(400, "MEDIA_REGISTER_FAILED", "Failed to register media asset.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
