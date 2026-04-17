import { cookies } from "next/headers";
import { apiError, apiOk } from "@/lib/api/response";
import { isSupabaseConfigured } from "@/lib/config/env";
import { listStudentGradeHistoryByIdentity } from "@/lib/supabase/admin-advanced-repo";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    const cookieStore = await cookies();
    const identityId = cookieStore.get("student-identity-id")?.value;

    if (!identityId) {
      return apiError(401, "STUDENT_SESSION_REQUIRED", "Student login is required.");
    }

    const history = await listStudentGradeHistoryByIdentity(identityId);
    return apiOk(history, { count: history.length });
  } catch (error) {
    return apiError(400, "STUDENT_GRADE_HISTORY_FAILED", "Failed to load student grade history.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
