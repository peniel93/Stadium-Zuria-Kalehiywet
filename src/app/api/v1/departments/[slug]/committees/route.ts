import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createDepartmentCommittee,
  deleteDepartmentCommittee,
  listDepartmentCommittees,
  updateDepartmentCommittee,
} from "@/lib/supabase/department-committees-repo";

type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

function parseCommitteeInput(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    throw new Error("name is required.");
  }

  return {
    name,
    description: typeof body.description === "string" ? body.description.trim() : undefined,
    termLabel: typeof body.termLabel === "string" ? body.termLabel.trim() : undefined,
    roundNumber:
      typeof body.roundNumber === "number" && Number.isFinite(body.roundNumber)
        ? body.roundNumber
        : null,
    startDate: typeof body.startDate === "string" && body.startDate ? body.startDate : null,
    endDate: typeof body.endDate === "string" && body.endDate ? body.endDate : null,
    isCurrent: body.isCurrent === true,
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
    const items = await listDepartmentCommittees(slug);
    return apiOk(items, { count: items.length });
  } catch (error) {
    return apiError(400, "DEPARTMENT_COMMITTEES_LIST_FAILED", "Failed to load committees.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to create committees.");
  }

  try {
    const { slug } = await params;
    const payload = parseCommitteeInput(await request.json());
    const item = await createDepartmentCommittee(slug, payload);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "DEPARTMENT_COMMITTEE_CREATE_FAILED", "Failed to create committee.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to update committees.");
  }

  try {
    const body = await request.json();
    const committeeId = typeof body.committeeId === "string" ? body.committeeId : "";

    if (!committeeId) {
      throw new Error("committeeId is required.");
    }

    const payload = parseCommitteeInput(body);
    const { slug } = await params;
    const item = await updateDepartmentCommittee(committeeId, slug, payload);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "DEPARTMENT_COMMITTEE_UPDATE_FAILED", "Failed to update committee.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to delete committees.");
  }

  try {
    const body = (await request.json()) as { committeeId?: string };
    const committeeId = body.committeeId?.trim();

    if (!committeeId) {
      throw new Error("committeeId is required.");
    }

    const { slug } = await params;
    const item = await deleteDepartmentCommittee(committeeId, slug);
    return apiOk(item);
  } catch (error) {
    return apiError(400, "DEPARTMENT_COMMITTEE_DELETE_FAILED", "Failed to delete committee.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
