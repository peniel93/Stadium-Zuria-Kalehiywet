import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createIdentityProfile,
  listIdentityProfiles,
  updateIdentityProfile,
} from "@/lib/supabase/admin-advanced-repo";

const allowedRoles = ["super_admin", "global_admin", "department_admin"] as const;

function parseCreate(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const roleGroup = typeof body.roleGroup === "string" ? body.roleGroup.trim() : "";

  if (!username || !roleGroup) {
    throw new Error("username and roleGroup are required.");
  }

  return {
    username,
    roleGroup,
    profileId: typeof body.profileId === "string" ? body.profileId.trim() : null,
    memberId: typeof body.memberId === "string" ? body.memberId.trim() : null,
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();

  if (!auth.user || !hasAnyRole(auth.roles, [...allowedRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to view identities.");
  }

  try {
    const rows = await listIdentityProfiles();
    return apiOk(rows, { count: rows.length });
  } catch (error) {
    return apiError(400, "IDENTITIES_LIST_FAILED", "Failed to load identities.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();

  if (!auth.user || !hasAnyRole(auth.roles, [...allowedRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to create identities.");
  }

  try {
    const payload = parseCreate(await request.json());
    const row = await createIdentityProfile({
      createdBy: auth.user.id,
      profileId: payload.profileId,
      memberId: payload.memberId,
      username: payload.username,
      roleGroup: payload.roleGroup,
    });
    return apiOk(row);
  } catch (error) {
    return apiError(400, "IDENTITY_CREATE_FAILED", "Failed to create identity.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();

  if (!auth.user || !hasAnyRole(auth.roles, [...allowedRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to update identities.");
  }

  try {
    const body = (await request.json()) as {
      identityId?: string;
      username?: string;
      roleGroup?: string;
      isActive?: boolean;
    };

    const identityId = body.identityId?.trim();

    if (!identityId) {
      throw new Error("identityId is required.");
    }

    const row = await updateIdentityProfile({
      identityId,
      username: typeof body.username === "string" ? body.username.trim().toLowerCase() : undefined,
      roleGroup: typeof body.roleGroup === "string" ? body.roleGroup.trim() : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    });

    return apiOk(row);
  } catch (error) {
    return apiError(400, "IDENTITY_UPDATE_FAILED", "Failed to update identity.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
