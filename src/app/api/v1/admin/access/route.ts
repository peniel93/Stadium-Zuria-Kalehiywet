import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  addRoleToUser,
  assignDepartmentAdmin,
  getUserAccessSummary,
  removeDepartmentAdmin,
  removeRoleFromUser,
} from "@/lib/supabase/access-admin-repo";

type AccessActionBody = {
  identifier?: string;
  roleCode?: string;
  departmentIdentifier?: string;
  accessLevel?: "full" | "limited";
};

const superAdminRoles = ["super_admin"] as const;

function parseBody(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as AccessActionBody;
  const identifier = body.identifier?.trim();

  if (!identifier) {
    throw new Error("identifier is required.");
  }

  return {
    identifier,
    roleCode: body.roleCode?.trim(),
    departmentIdentifier: body.departmentIdentifier?.trim(),
    accessLevel: body.accessLevel === "limited" ? "limited" : "full",
  } as const;
}

async function assertSuperAdmin() {
  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...superAdminRoles])) {
    throw new Error("FORBIDDEN");
  }

  return authContext;
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    await assertSuperAdmin();
    const url = new URL(request.url);
    const identifier = url.searchParams.get("identifier")?.trim();

    if (!identifier) {
      return apiError(400, "IDENTIFIER_REQUIRED", "identifier query parameter is required.");
    }

    const summary = await getUserAccessSummary(identifier);
    return apiOk(summary);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return apiError(403, "FORBIDDEN", "You do not have permission to use this page.");
    }

    return apiError(400, "ACCESS_SUMMARY_FAILED", "Failed to load access summary.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    await assertSuperAdmin();
    const raw = await request.clone().json();
    const parsed = parseBody(raw);
    const resolvedAction = (raw as { action?: string }).action;

    if (resolvedAction === "add-role") {
      if (!parsed.roleCode) {
        throw new Error("roleCode is required.");
      }
      return apiOk(await addRoleToUser(parsed.identifier, parsed.roleCode as never));
    }

    if (resolvedAction === "assign-department-admin") {
      if (!parsed.departmentIdentifier) {
        throw new Error("departmentIdentifier is required.");
      }
      return apiOk(
        await assignDepartmentAdmin(
          parsed.identifier,
          parsed.departmentIdentifier,
          parsed.accessLevel,
        ),
      );
    }

    return apiError(400, "INVALID_ACTION", "Unsupported action.");
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return apiError(403, "FORBIDDEN", "You do not have permission to use this page.");
    }

    return apiError(400, "ACCESS_ACTION_FAILED", "Failed to process access action.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    await assertSuperAdmin();
    const raw = await request.json();
    const body = parseBody(raw);
    const action = (raw as { action?: string }).action;

    if (action === "remove-role") {
      if (!body.roleCode) {
        throw new Error("roleCode is required.");
      }
      return apiOk(await removeRoleFromUser(body.identifier, body.roleCode as never));
    }

    if (action === "remove-department-admin") {
      if (!body.departmentIdentifier) {
        throw new Error("departmentIdentifier is required.");
      }
      return apiOk(await removeDepartmentAdmin(body.identifier, body.departmentIdentifier));
    }

    return apiError(400, "INVALID_ACTION", "Unsupported action.");
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return apiError(403, "FORBIDDEN", "You do not have permission to use this page.");
    }

    return apiError(400, "ACCESS_DELETE_FAILED", "Failed to process access removal.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
