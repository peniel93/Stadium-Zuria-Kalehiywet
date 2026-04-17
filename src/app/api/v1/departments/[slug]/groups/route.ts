import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createDepartmentGroup,
  deleteDepartmentGroup,
  listDepartmentGroups,
  updateDepartmentGroup,
} from "@/lib/supabase/department-groups-repo";

type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

function parseGroupInput(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const nameEn = typeof body.nameEn === "string" ? body.nameEn.trim() : "";
  const nameAm = typeof body.nameAm === "string" ? body.nameAm.trim() : "";

  if (!code || !nameEn || !nameAm) {
    throw new Error("code, nameEn, and nameAm are required.");
  }

  return {
    code,
    nameEn,
    nameAm,
    description: typeof body.description === "string" ? body.description.trim() : undefined,
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
    const items = await listDepartmentGroups(slug);
    return apiOk(items, { count: items.length });
  } catch (error) {
    return apiError(400, "DEPARTMENT_GROUPS_LIST_FAILED", "Failed to load groups.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to create groups.");
  }

  try {
    const { slug } = await params;
    const payload = parseGroupInput(await request.json());
    const item = await createDepartmentGroup(slug, payload);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "DEPARTMENT_GROUP_CREATE_FAILED", "Failed to create group.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to update groups.");
  }

  try {
    const body = await request.json();
    const groupId = typeof body.groupId === "string" ? body.groupId : "";

    if (!groupId) {
      throw new Error("groupId is required.");
    }

    const payload = parseGroupInput(body);
    const { slug } = await params;
    const item = await updateDepartmentGroup(groupId, slug, payload);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "DEPARTMENT_GROUP_UPDATE_FAILED", "Failed to update group.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to delete groups.");
  }

  try {
    const body = (await request.json()) as { groupId?: string };
    const groupId = body.groupId?.trim();

    if (!groupId) {
      throw new Error("groupId is required.");
    }

    const { slug } = await params;
    const item = await deleteDepartmentGroup(groupId, slug);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "DEPARTMENT_GROUP_DELETE_FAILED", "Failed to delete group.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
