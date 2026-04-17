import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createChildrenGrade,
  deleteChildrenGrade,
  listChildrenForGrades,
  listChildrenGrades,
  updateChildrenGrade,
} from "@/lib/supabase/children-grades-repo";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

function parseGradeInput(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const childId = typeof body.childId === "string" ? body.childId.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const termLabel = typeof body.termLabel === "string" ? body.termLabel.trim() : "";

  if (!childId || !subject || !termLabel) {
    throw new Error("childId, subject, and termLabel are required.");
  }

  return {
    childId,
    subject,
    termLabel,
    ageGroup:
      typeof body.ageGroup === "string" && body.ageGroup.trim() ? body.ageGroup.trim() : undefined,
    score: typeof body.score === "number" && Number.isFinite(body.score) ? body.score : null,
    gradeLetter:
      typeof body.gradeLetter === "string" && body.gradeLetter.trim() ? body.gradeLetter.trim() : undefined,
    teacherName:
      typeof body.teacherName === "string" && body.teacherName.trim() ? body.teacherName.trim() : undefined,
    remarks:
      typeof body.remarks === "string" && body.remarks.trim() ? body.remarks.trim() : undefined,
  } as const;
}

export async function GET(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have access to children grades.");
  }

  try {
    const { slug } = await params;
    const url = new URL(request.url);

    if (url.searchParams.get("mode") === "children") {
      const children = await listChildrenForGrades(slug);
      return apiOk(children, { count: children.length });
    }

    const grades = await listChildrenGrades(slug);
    return apiOk(grades, { count: grades.length });
  } catch (error) {
    return apiError(400, "CHILD_GRADES_LIST_FAILED", "Failed to load children grades.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to create grades.");
  }

  try {
    const { slug } = await params;
    const row = await createChildrenGrade(slug, parseGradeInput(await request.json()));
    return apiOk(row);
  } catch (error) {
    return apiError(400, "CHILD_GRADE_CREATE_FAILED", "Failed to create grade.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to update grades.");
  }

  try {
    const { slug } = await params;
    const body = (await request.json()) as { gradeId?: string };
    const gradeId = body.gradeId?.trim();

    if (!gradeId) {
      throw new Error("gradeId is required.");
    }

    const row = await updateChildrenGrade(gradeId, slug, parseGradeInput(body));
    return apiOk(row);
  } catch (error) {
    return apiError(400, "CHILD_GRADE_UPDATE_FAILED", "Failed to update grade.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to delete grades.");
  }

  try {
    const { slug } = await params;
    const body = (await request.json()) as { gradeId?: string };
    const gradeId = body.gradeId?.trim();

    if (!gradeId) {
      throw new Error("gradeId is required.");
    }

    const row = await deleteChildrenGrade(gradeId, slug);
    return apiOk(row);
  } catch (error) {
    return apiError(400, "CHILD_GRADE_DELETE_FAILED", "Failed to delete grade.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
