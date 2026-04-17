import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import { getMemberDimensionSummary } from "@/lib/supabase/admin-advanced-repo";

const allowedRoles = ["super_admin", "global_admin", "department_admin", "editor"] as const;

export async function GET() {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();

  if (!auth.user || !hasAnyRole(auth.roles, [...allowedRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to view youth summary.");
  }

  try {
    const summary = await getMemberDimensionSummary();
    return apiOk(summary);
  } catch (error) {
    return apiError(400, "YOUTH_SUMMARY_FAILED", "Failed to load summary.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
