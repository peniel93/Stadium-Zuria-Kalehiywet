import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import { listMessagingRecipients } from "@/lib/supabase/admin-advanced-repo";

const allowedRoles = ["super_admin", "global_admin", "department_admin", "church_leader", "editor", "moderator"] as const;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();

  if (!auth.user || !hasAnyRole(auth.roles, [...allowedRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to view admin users.");
  }

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? undefined;
    const pageRaw = Number(url.searchParams.get("page") ?? "1");
    const perPageRaw = Number(url.searchParams.get("perPage") ?? "50");
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const perPage =
      Number.isFinite(perPageRaw) && perPageRaw > 0
        ? Math.min(200, Math.floor(perPageRaw))
        : 50;

    const result = await listMessagingRecipients({ search, page, perPage });
    return apiOk(result.items, {
      count: result.items.length,
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      hasMore: result.hasMore,
    });
  } catch (error) {
    return apiError(400, "ADMIN_USERS_LIST_FAILED", "Failed to load admin users.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
