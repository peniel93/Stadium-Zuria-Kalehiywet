import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createChildProfile,
  deleteChildProfile,
  listChildrenProfiles,
  updateChildProfile,
} from "@/lib/supabase/children-repo";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

function parseChildInput(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";

  if (!fullName) {
    throw new Error("fullName is required.");
  }

  return {
    fullName,
    age: typeof body.age === "number" && Number.isFinite(body.age) ? body.age : null,
    educationLevel:
      typeof body.educationLevel === "string" && body.educationLevel.trim()
        ? body.educationLevel.trim()
        : undefined,
    className:
      typeof body.className === "string" && body.className.trim() ? body.className.trim() : undefined,
    sectionName:
      typeof body.sectionName === "string" && body.sectionName.trim()
        ? body.sectionName.trim()
        : undefined,
    status: body.status === "inactive" || body.status === "graduated" ? body.status : "active",
    dateOfRegistration:
      typeof body.dateOfRegistration === "string" && body.dateOfRegistration
        ? body.dateOfRegistration
        : null,
    photoMediaId:
      typeof body.photoMediaId === "string" && body.photoMediaId.trim()
        ? body.photoMediaId.trim()
        : null,
  } as const;
}

export async function GET(_: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have access to this department.");
  }

  try {
    const { slug } = await params;
    const items = await listChildrenProfiles(slug);
    return apiOk(items, { count: items.length });
  } catch (error) {
    return apiError(400, "CHILDREN_LIST_FAILED", "Failed to load children profiles.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to create child profiles.");
  }

  try {
    const { slug } = await params;
    const payload = parseChildInput(await request.json());
    const item = await createChildProfile(slug, payload);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "CHILD_CREATE_FAILED", "Failed to create child profile.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to update child profiles.");
  }

  try {
    const body = await request.json();
    const childId = typeof body.childId === "string" ? body.childId : "";

    if (!childId) {
      throw new Error("childId is required.");
    }

    const payload = parseChildInput(body);
    const { slug } = await params;
    const item = await updateChildProfile(childId, slug, payload);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "CHILD_UPDATE_FAILED", "Failed to update child profile.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to delete child profiles.");
  }

  try {
    const body = (await request.json()) as { childId?: string };
    const childId = body.childId?.trim();

    if (!childId) {
      throw new Error("childId is required.");
    }

    const { slug } = await params;
    const item = await deleteChildProfile(childId, slug);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "CHILD_DELETE_FAILED", "Failed to delete child profile.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
