import { apiError, apiOk } from "@/lib/api/response";
import {
  announcementWriteRoles,
  parseAnnouncementInput,
} from "@/lib/api/announcements";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  archiveAnnouncement,
  updateAnnouncement,
} from "@/lib/supabase/announcements-repo";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(
      503,
      "SUPABASE_NOT_CONFIGURED",
      "Supabase environment variables are not configured.",
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user) {
    return apiError(401, "UNAUTHORIZED", "Login is required.");
  }

  if (!hasAnyRole(authContext.roles, announcementWriteRoles)) {
    return apiError(403, "FORBIDDEN", "You do not have permission to update announcements.");
  }

  try {
    const payload = parseAnnouncementInput(await request.json());
    const { id } = await params;
    const result = await updateAnnouncement(id, authContext.user.id, payload);

    return apiOk(result);
  } catch (error) {
    return apiError(400, "ANNOUNCEMENT_UPDATE_FAILED", "Failed to update announcement.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(
      503,
      "SUPABASE_NOT_CONFIGURED",
      "Supabase environment variables are not configured.",
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user) {
    return apiError(401, "UNAUTHORIZED", "Login is required.");
  }

  if (!hasAnyRole(authContext.roles, announcementWriteRoles)) {
    return apiError(403, "FORBIDDEN", "You do not have permission to archive announcements.");
  }

  try {
    const { id } = await params;
    const result = await archiveAnnouncement(id, authContext.user.id);
    return apiOk(result);
  } catch (error) {
    return apiError(400, "ANNOUNCEMENT_ARCHIVE_FAILED", "Failed to archive announcement.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
