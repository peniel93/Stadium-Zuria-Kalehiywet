import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createDepartmentMember,
  deleteDepartmentMember,
  listDepartmentMembers,
  updateDepartmentMember,
} from "@/lib/supabase/department-members-repo";

type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

function parseMemberInput(raw: unknown) {
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
    fullNameAm: typeof body.fullNameAm === "string" ? body.fullNameAm.trim() : undefined,
    photoMediaId:
      typeof body.photoMediaId === "string" && body.photoMediaId.trim()
        ? body.photoMediaId.trim()
        : null,
    groupId: typeof body.groupId === "string" && body.groupId.trim() ? body.groupId.trim() : null,
    roleTitle:
      typeof body.roleTitle === "string" && body.roleTitle.trim() ? body.roleTitle.trim() : undefined,
    contact:
      typeof body.contact === "string" && body.contact.trim() ? body.contact.trim() : undefined,
    address:
      typeof body.address === "string" && body.address.trim() ? body.address.trim() : undefined,
    status:
      body.status === "inactive" || body.status === "archived" ? body.status : "active",
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
    const items = await listDepartmentMembers(slug);
    return apiOk(items, { count: items.length });
  } catch (error) {
    return apiError(400, "DEPARTMENT_MEMBERS_LIST_FAILED", "Failed to load members.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to create members.");
  }

  try {
    const { slug } = await params;
    const payload = parseMemberInput(await request.json());
    const item = await createDepartmentMember(slug, payload);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "DEPARTMENT_MEMBER_CREATE_FAILED", "Failed to create member.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to update members.");
  }

  try {
    const body = await request.json();
    const memberId = typeof body.memberId === "string" ? body.memberId : "";

    if (!memberId) {
      throw new Error("memberId is required.");
    }

    const payload = parseMemberInput(body);
    const { slug } = await params;
    const item = await updateDepartmentMember(memberId, slug, payload);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "DEPARTMENT_MEMBER_UPDATE_FAILED", "Failed to update member.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to delete members.");
  }

  try {
    const body = (await request.json()) as { memberId?: string };
    const memberId = body.memberId?.trim();

    if (!memberId) {
      throw new Error("memberId is required.");
    }

    const { slug } = await params;
    const item = await deleteDepartmentMember(memberId, slug);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "DEPARTMENT_MEMBER_DELETE_FAILED", "Failed to delete member.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
