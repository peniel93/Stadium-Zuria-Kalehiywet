import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import { createDepartment, listDepartments } from "@/lib/supabase/departments-repo";

const adminRoles = ["super_admin", "global_admin"] as const;

function parseBody(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;

  const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : "";
  const nameEn = typeof body.nameEn === "string" ? body.nameEn.trim() : "";
  const nameAm = typeof body.nameAm === "string" ? body.nameAm.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!code || !nameEn || !nameAm) {
    throw new Error("code, nameEn, and nameAm are required.");
  }

  if (!/^[a-z0-9-]+$/.test(code)) {
    throw new Error("code must use lowercase letters, numbers, and hyphens.");
  }

  return {
    code,
    nameEn,
    nameAm,
    description,
    isPublic: body.isPublic !== false,
    isActive: body.isActive !== false,
  };
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    const items = await listDepartments({ includeInactive });
    return apiOk(items, { count: items.length });
  } catch (error) {
    return apiError(400, "DEPARTMENTS_LIST_FAILED", "Failed to load departments.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to create departments.");
  }

  try {
    const body = parseBody(await request.json());
    const created = await createDepartment(body);
    return apiOk(created);
  } catch (error) {
    return apiError(400, "DEPARTMENT_CREATE_FAILED", "Failed to create department.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
