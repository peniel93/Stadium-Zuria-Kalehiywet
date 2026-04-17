import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  assignTrainingParticipant,
  createTrainingCourse,
  createTrainingGrade,
  createTrainingParticipant,
  deleteTrainingCourse,
  deleteTrainingGrade,
  deleteTrainingParticipant,
  listTrainingDashboard,
  removeTrainingAssignment,
  updateTrainingCourse,
  updateTrainingGrade,
  updateTrainingParticipant,
} from "@/lib/supabase/training-repo";

const adminRoles = ["super_admin", "global_admin", "department_admin", "editor"] as const;

export async function GET() {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have access to training dashboard.");
  }

  try {
    const data = await listTrainingDashboard();
    return apiOk(data);
  } catch (error) {
    return apiError(400, "TRAINING_LIST_FAILED", "Failed to load training data.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to create training records.");
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const entity = typeof body.entity === "string" ? body.entity : "";

    if (entity === "course") {
      const row = await createTrainingCourse({
        code: typeof body.code === "string" ? body.code.trim() : undefined,
        title: typeof body.title === "string" ? body.title.trim() : "",
        description: typeof body.description === "string" ? body.description.trim() : undefined,
        courseStatus:
          body.courseStatus === "open" || body.courseStatus === "closed" ? body.courseStatus : "draft",
        startDate: typeof body.startDate === "string" && body.startDate ? body.startDate : null,
        endDate: typeof body.endDate === "string" && body.endDate ? body.endDate : null,
      });
      return apiOk(row);
    }

    if (entity === "participant") {
      const row = await createTrainingParticipant({
        fullName: typeof body.fullName === "string" ? body.fullName.trim() : "",
        participantType: body.participantType === "teacher" ? "teacher" : "student",
        educationLevel:
          typeof body.educationLevel === "string" && body.educationLevel.trim()
            ? body.educationLevel.trim()
            : undefined,
        contactPhone:
          typeof body.contactPhone === "string" && body.contactPhone.trim() ? body.contactPhone.trim() : undefined,
        contactEmail:
          typeof body.contactEmail === "string" && body.contactEmail.trim() ? body.contactEmail.trim() : undefined,
        photoMediaId:
          typeof body.photoMediaId === "string" && body.photoMediaId.trim() ? body.photoMediaId.trim() : null,
        status: body.status === "inactive" ? "inactive" : "active",
      });
      return apiOk(row);
    }

    if (entity === "assignment") {
      const courseId = typeof body.courseId === "string" ? body.courseId.trim() : "";
      const participantId = typeof body.participantId === "string" ? body.participantId.trim() : "";
      const roleInCourse = body.roleInCourse === "teacher" ? "teacher" : "student";

      if (!courseId || !participantId) {
        throw new Error("courseId and participantId are required.");
      }

      const row = await assignTrainingParticipant({ courseId, participantId, roleInCourse });
      return apiOk(row);
    }

    if (entity === "grade") {
      const row = await createTrainingGrade({
        courseId: typeof body.courseId === "string" ? body.courseId.trim() : "",
        studentParticipantId:
          typeof body.studentParticipantId === "string" ? body.studentParticipantId.trim() : "",
        teacherParticipantId:
          typeof body.teacherParticipantId === "string" && body.teacherParticipantId.trim()
            ? body.teacherParticipantId.trim()
            : null,
        assessmentTitle: typeof body.assessmentTitle === "string" ? body.assessmentTitle.trim() : "",
        score: typeof body.score === "number" && Number.isFinite(body.score) ? body.score : null,
        gradeLetter:
          typeof body.gradeLetter === "string" && body.gradeLetter.trim() ? body.gradeLetter.trim() : undefined,
        remarks: typeof body.remarks === "string" && body.remarks.trim() ? body.remarks.trim() : undefined,
      });
      return apiOk(row);
    }

    throw new Error("Unsupported entity for create action.");
  } catch (error) {
    return apiError(400, "TRAINING_CREATE_FAILED", "Failed to create training record.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to update training records.");
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const entity = typeof body.entity === "string" ? body.entity : "";

    if (entity === "course") {
      const courseId = typeof body.courseId === "string" ? body.courseId.trim() : "";
      if (!courseId) throw new Error("courseId is required.");

      const row = await updateTrainingCourse(courseId, {
        code: typeof body.code === "string" ? body.code.trim() : undefined,
        title: typeof body.title === "string" ? body.title.trim() : "",
        description: typeof body.description === "string" ? body.description.trim() : undefined,
        courseStatus:
          body.courseStatus === "open" || body.courseStatus === "closed" ? body.courseStatus : "draft",
        startDate: typeof body.startDate === "string" && body.startDate ? body.startDate : null,
        endDate: typeof body.endDate === "string" && body.endDate ? body.endDate : null,
      });
      return apiOk(row);
    }

    if (entity === "participant") {
      const participantId = typeof body.participantId === "string" ? body.participantId.trim() : "";
      if (!participantId) throw new Error("participantId is required.");

      const row = await updateTrainingParticipant(participantId, {
        fullName: typeof body.fullName === "string" ? body.fullName.trim() : "",
        participantType: body.participantType === "teacher" ? "teacher" : "student",
        educationLevel:
          typeof body.educationLevel === "string" && body.educationLevel.trim()
            ? body.educationLevel.trim()
            : undefined,
        contactPhone:
          typeof body.contactPhone === "string" && body.contactPhone.trim() ? body.contactPhone.trim() : undefined,
        contactEmail:
          typeof body.contactEmail === "string" && body.contactEmail.trim() ? body.contactEmail.trim() : undefined,
        photoMediaId:
          typeof body.photoMediaId === "string" && body.photoMediaId.trim() ? body.photoMediaId.trim() : null,
        status: body.status === "inactive" ? "inactive" : "active",
      });
      return apiOk(row);
    }

    if (entity === "grade") {
      const gradeId = typeof body.gradeId === "string" ? body.gradeId.trim() : "";
      if (!gradeId) throw new Error("gradeId is required.");

      const row = await updateTrainingGrade(gradeId, {
        courseId: typeof body.courseId === "string" ? body.courseId.trim() : "",
        studentParticipantId:
          typeof body.studentParticipantId === "string" ? body.studentParticipantId.trim() : "",
        teacherParticipantId:
          typeof body.teacherParticipantId === "string" && body.teacherParticipantId.trim()
            ? body.teacherParticipantId.trim()
            : null,
        assessmentTitle: typeof body.assessmentTitle === "string" ? body.assessmentTitle.trim() : "",
        score: typeof body.score === "number" && Number.isFinite(body.score) ? body.score : null,
        gradeLetter:
          typeof body.gradeLetter === "string" && body.gradeLetter.trim() ? body.gradeLetter.trim() : undefined,
        remarks: typeof body.remarks === "string" && body.remarks.trim() ? body.remarks.trim() : undefined,
      });
      return apiOk(row);
    }

    throw new Error("Unsupported entity for update action.");
  } catch (error) {
    return apiError(400, "TRAINING_UPDATE_FAILED", "Failed to update training record.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to delete training records.");
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const entity = typeof body.entity === "string" ? body.entity : "";

    if (entity === "course") {
      const courseId = typeof body.courseId === "string" ? body.courseId.trim() : "";
      if (!courseId) throw new Error("courseId is required.");
      return apiOk(await deleteTrainingCourse(courseId));
    }

    if (entity === "participant") {
      const participantId = typeof body.participantId === "string" ? body.participantId.trim() : "";
      if (!participantId) throw new Error("participantId is required.");
      return apiOk(await deleteTrainingParticipant(participantId));
    }

    if (entity === "grade") {
      const gradeId = typeof body.gradeId === "string" ? body.gradeId.trim() : "";
      if (!gradeId) throw new Error("gradeId is required.");
      return apiOk(await deleteTrainingGrade(gradeId));
    }

    if (entity === "assignment") {
      const courseId = typeof body.courseId === "string" ? body.courseId.trim() : "";
      const participantId = typeof body.participantId === "string" ? body.participantId.trim() : "";
      if (!courseId || !participantId) throw new Error("courseId and participantId are required.");
      return apiOk(await removeTrainingAssignment({ courseId, participantId }));
    }

    throw new Error("Unsupported entity for delete action.");
  } catch (error) {
    return apiError(400, "TRAINING_DELETE_FAILED", "Failed to delete training record.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
