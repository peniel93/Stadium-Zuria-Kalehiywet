import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createDepartmentCategory,
  deleteDepartmentCategory,
  listDepartmentCategories,
  updateDepartmentCategory,
} from "@/lib/supabase/department-categories-repo";

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

type CategoryBody = {
  categoryId?: string;
  departmentId?: string;
  code?: string;
  nameEn?: string;
  nameAm?: string;
  description?: string;
};

function parseBody(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as CategoryBody;
  const code = body.code?.trim().toLowerCase() ?? "";

  return {
    categoryId: body.categoryId?.trim() ?? "",
    departmentId: body.departmentId?.trim() ?? "",
    code,
    nameEn: body.nameEn?.trim() ?? "",
    nameAm: body.nameAm?.trim() ?? "",
    description: body.description?.trim() ?? "",
  };
}

async function assertAdmin() {
  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    throw new Error("FORBIDDEN");
  }
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    await assertAdmin();
    const items = await listDepartmentCategories();
    return apiOk(items, { count: items.length });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return apiError(403, "FORBIDDEN", "You do not have permission to view department categories.");
    }

    return apiError(400, "DEPARTMENT_CATEGORIES_LIST_FAILED", "Failed to load department categories.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    await assertAdmin();
    const body = parseBody(await request.json());

    if (!body.departmentId || !body.code || !body.nameEn || !body.nameAm) {
      return apiError(400, "INVALID_PAYLOAD", "departmentId, code, nameEn, and nameAm are required.");
    }

    if (!/^[a-z0-9-]+$/.test(body.code)) {
      return apiError(400, "INVALID_CODE", "code must use lowercase letters, numbers, and hyphens.");
    }

    const data = await createDepartmentCategory({
      departmentId: body.departmentId,
      code: body.code,
      nameEn: body.nameEn,
      nameAm: body.nameAm,
      description: body.description,
    });

    return apiOk(data, { count: data.length });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return apiError(403, "FORBIDDEN", "You do not have permission to create department categories.");
    }

    return apiError(400, "DEPARTMENT_CATEGORY_CREATE_FAILED", "Failed to create department category.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    await assertAdmin();
    const body = parseBody(await request.json());

    if (!body.categoryId || !body.departmentId || !body.code || !body.nameEn || !body.nameAm) {
      return apiError(
        400,
        "INVALID_PAYLOAD",
        "categoryId, departmentId, code, nameEn, and nameAm are required.",
      );
    }

    if (!/^[a-z0-9-]+$/.test(body.code)) {
      return apiError(400, "INVALID_CODE", "code must use lowercase letters, numbers, and hyphens.");
    }

    const data = await updateDepartmentCategory({
      categoryId: body.categoryId,
      departmentId: body.departmentId,
      code: body.code,
      nameEn: body.nameEn,
      nameAm: body.nameAm,
      description: body.description,
    });

    return apiOk(data, { count: data.length });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return apiError(403, "FORBIDDEN", "You do not have permission to update department categories.");
    }

    return apiError(400, "DEPARTMENT_CATEGORY_UPDATE_FAILED", "Failed to update department category.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    await assertAdmin();
    const body = parseBody(await request.json());

    if (!body.categoryId) {
      return apiError(400, "CATEGORY_ID_REQUIRED", "categoryId is required.");
    }

    const data = await deleteDepartmentCategory(body.categoryId);
    return apiOk(data, { count: data.length });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return apiError(403, "FORBIDDEN", "You do not have permission to delete department categories.");
    }

    return apiError(400, "DEPARTMENT_CATEGORY_DELETE_FAILED", "Failed to delete department category.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
