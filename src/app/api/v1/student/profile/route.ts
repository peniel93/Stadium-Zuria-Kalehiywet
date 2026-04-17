import { cookies } from "next/headers";
import { apiError, apiOk } from "@/lib/api/response";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  getStudentProfileByIdentity,
  upsertStudentProfileByIdentity,
} from "@/lib/supabase/admin-advanced-repo";

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

    const profile = await getStudentProfileByIdentity(identityId);
    return apiOk(profile);
  } catch (error) {
    return apiError(400, "STUDENT_PROFILE_FAILED", "Failed to load student profile.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    const cookieStore = await cookies();
    const identityId = cookieStore.get("student-identity-id")?.value;

    if (!identityId) {
      return apiError(401, "STUDENT_SESSION_REQUIRED", "Student login is required.");
    }

    const body = (await request.json()) as {
      className?: string;
      sectionName?: string;
      ageGroup?: string;
      courses?: string[];
      teachers?: string[];
      grades?: Record<string, string | number>;
    };

    const profile = await upsertStudentProfileByIdentity(identityId, {
      className: typeof body.className === "string" ? body.className.trim() : undefined,
      sectionName: typeof body.sectionName === "string" ? body.sectionName.trim() : undefined,
      ageGroup: typeof body.ageGroup === "string" ? body.ageGroup.trim() : undefined,
      courses: Array.isArray(body.courses) ? body.courses.map((item) => String(item).trim()).filter(Boolean) : undefined,
      teachers: Array.isArray(body.teachers) ? body.teachers.map((item) => String(item).trim()).filter(Boolean) : undefined,
      grades:
        body.grades && typeof body.grades === "object"
          ? Object.fromEntries(
              Object.entries(body.grades).map(([key, value]) => [key, typeof value === "number" ? value : String(value)]),
            )
          : undefined,
    });

    return apiOk(profile);
  } catch (error) {
    return apiError(400, "STUDENT_PROFILE_UPDATE_FAILED", "Failed to update student profile.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
