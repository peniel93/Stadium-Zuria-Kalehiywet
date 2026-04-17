import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createYouthProfile,
  deleteYouthProfile,
  listYouthProfiles,
  updateYouthProfile,
} from "@/lib/supabase/youth-repo";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

function parseYouthInput(raw: unknown) {
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
    ageGroup:
      typeof body.ageGroup === "string" && body.ageGroup.trim() ? body.ageGroup.trim() : undefined,
    status: body.status === "inactive" || body.status === "graduated" ? body.status : "active",
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
    const items = await listYouthProfiles(slug);
    return apiOk(items, { count: items.length });
  } catch (error) {
    return apiError(400, "YOUTH_LIST_FAILED", "Failed to load youth profiles.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to create youth profiles.");
  }

  try {
    const { slug } = await params;
    const payload = parseYouthInput(await request.json());
    const item = await createYouthProfile(slug, payload);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "YOUTH_CREATE_FAILED", "Failed to create youth profile.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to update youth profiles.");
  }

  try {
    const body = await request.json();
    const youthId = typeof body.youthId === "string" ? body.youthId : "";

    if (!youthId) {
      throw new Error("youthId is required.");
    }

    const payload = parseYouthInput(body);
    const { slug } = await params;
    const item = await updateYouthProfile(youthId, slug, payload);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "YOUTH_UPDATE_FAILED", "Failed to update youth profile.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to delete youth profiles.");
  }

  try {
    const body = (await request.json()) as { youthId?: string };
    const youthId = body.youthId?.trim();

    if (!youthId) {
      throw new Error("youthId is required.");
    }

    const { slug } = await params;
    const item = await deleteYouthProfile(youthId, slug);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "YOUTH_DELETE_FAILED", "Failed to delete youth profile.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
