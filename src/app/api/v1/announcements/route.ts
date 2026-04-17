import { apiError, apiOk } from "@/lib/api/response";
import {
  announcementWriteRoles,
  parseAnnouncementInput,
} from "@/lib/api/announcements";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createAnnouncement,
  listAnnouncements,
} from "@/lib/supabase/announcements-repo";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(
      503,
      "SUPABASE_NOT_CONFIGURED",
      "Supabase environment variables are not configured.",
    );
  }

  const url = new URL(request.url);

  try {
    const items = await listAnnouncements({
      priority: url.searchParams.get("priority"),
      departmentId: url.searchParams.get("departmentId"),
      activeOnly: url.searchParams.get("state") !== "all",
    });

    return apiOk(items, { count: items.length });
  } catch (error) {
    return apiError(500, "ANNOUNCEMENT_LIST_FAILED", "Failed to fetch announcements.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request) {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to create announcements.");
  }

  try {
    const payload = parseAnnouncementInput(await request.json());
    const result = await createAnnouncement(authContext.user.id, payload);

    return apiOk(result);
  } catch (error) {
    return apiError(400, "ANNOUNCEMENT_CREATE_FAILED", "Failed to create announcement.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
