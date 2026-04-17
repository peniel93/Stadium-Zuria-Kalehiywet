import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createHrWorker,
  deleteHrWorker,
  listHrWorkers,
  updateHrWorker,
} from "@/lib/supabase/hr-workers-repo";

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

function parseWorkerInput(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";

  if (!fullName) {
    throw new Error("fullName is required.");
  }

  return {
    departmentIdentifier:
      typeof body.departmentIdentifier === "string" && body.departmentIdentifier.trim()
        ? body.departmentIdentifier.trim()
        : null,
    fullName,
    photoMediaId:
      typeof body.photoMediaId === "string" && body.photoMediaId.trim() ? body.photoMediaId.trim() : null,
    contactPhone:
      typeof body.contactPhone === "string" && body.contactPhone.trim() ? body.contactPhone.trim() : undefined,
    contactEmail:
      typeof body.contactEmail === "string" && body.contactEmail.trim() ? body.contactEmail.trim() : undefined,
    postTitle:
      typeof body.postTitle === "string" && body.postTitle.trim() ? body.postTitle.trim() : undefined,
    salaryAmount: typeof body.salaryAmount === "number" && Number.isFinite(body.salaryAmount) ? body.salaryAmount : null,
    educationLevel:
      typeof body.educationLevel === "string" && body.educationLevel.trim() ? body.educationLevel.trim() : undefined,
    employmentStatus:
      body.employmentStatus === "inactive" ||
      body.employmentStatus === "on_leave" ||
      body.employmentStatus === "replaced" ||
      body.employmentStatus === "retired"
        ? body.employmentStatus
        : "active",
    roleLabel:
      typeof body.roleLabel === "string" && body.roleLabel.trim() ? body.roleLabel.trim() : undefined,
    medebSeferZone:
      typeof body.medebSeferZone === "string" && body.medebSeferZone.trim() ? body.medebSeferZone.trim() : undefined,
    joinedOn:
      typeof body.joinedOn === "string" && body.joinedOn.trim() ? body.joinedOn.trim() : null,
    replacedByWorkerId:
      typeof body.replacedByWorkerId === "string" && body.replacedByWorkerId.trim()
        ? body.replacedByWorkerId.trim()
        : null,
    notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : undefined,
  } as const;
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have access to HR workers.");
  }

  try {
    const url = new URL(request.url);
    const departmentIdentifier = url.searchParams.get("departmentIdentifier");
    const q = url.searchParams.get("q") ?? undefined;
    const zone = url.searchParams.get("zone") ?? undefined;
    const roleLabel = url.searchParams.get("roleLabel") ?? undefined;
    const status = url.searchParams.get("status") as
      | "all"
      | "active"
      | "inactive"
      | "on_leave"
      | "replaced"
      | "retired"
      | null;

    const rows = await listHrWorkers({
      departmentIdentifier,
      q,
      zone,
      roleLabel,
      status: status ?? "all",
    });

    return apiOk(rows, { count: rows.length });
  } catch (error) {
    return apiError(400, "HR_WORKERS_LIST_FAILED", "Failed to load workers.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to create workers.");
  }

  try {
    const payload = parseWorkerInput(await request.json());
    const row = await createHrWorker(payload);
    return apiOk(row);
  } catch (error) {
    return apiError(400, "HR_WORKER_CREATE_FAILED", "Failed to create worker.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to update workers.");
  }

  try {
    const body = (await request.json()) as { workerId?: string };
    const workerId = typeof body.workerId === "string" ? body.workerId.trim() : "";

    if (!workerId) {
      throw new Error("workerId is required.");
    }

    const payload = parseWorkerInput(body);
    const row = await updateHrWorker(workerId, payload);
    return apiOk(row);
  } catch (error) {
    return apiError(400, "HR_WORKER_UPDATE_FAILED", "Failed to update worker.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to delete workers.");
  }

  try {
    const body = (await request.json()) as { workerId?: string };
    const workerId = body.workerId?.trim();

    if (!workerId) {
      throw new Error("workerId is required.");
    }

    const row = await deleteHrWorker(workerId);
    return apiOk(row);
  } catch (error) {
    return apiError(400, "HR_WORKER_DELETE_FAILED", "Failed to delete worker.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
