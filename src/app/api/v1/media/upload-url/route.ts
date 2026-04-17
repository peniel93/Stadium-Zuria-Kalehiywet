import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import { createMediaUploadUrl } from "@/lib/supabase/media-repo";

const mediaWriteRoles = ["super_admin", "global_admin", "department_admin", "editor"] as const;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...mediaWriteRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to upload media.");
  }

  try {
    const body = (await request.json()) as {
      fileName?: string;
      mimeType?: string;
      departmentIdentifier?: string;
    };

    const fileName = body.fileName?.trim();
    const mimeType = body.mimeType?.trim();

    if (!fileName || !mimeType) {
      return apiError(400, "INVALID_PAYLOAD", "fileName and mimeType are required.");
    }

    const result = await createMediaUploadUrl({
      fileName,
      mimeType,
      departmentIdentifier: body.departmentIdentifier,
    });

    return apiOk(result);
  } catch (error) {
    return apiError(400, "MEDIA_UPLOAD_URL_FAILED", "Failed to create upload URL.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
