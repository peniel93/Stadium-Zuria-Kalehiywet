import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createMemberCategory,
  deleteMemberCategory,
  listMemberCategories,
  updateMemberCategory,
} from "@/lib/supabase/member-registry-repo";

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

function normalizeCode(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-");
}

function parseCategoryInput(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const codeInput = typeof body.code === "string" ? body.code : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!codeInput.trim() || !name) {
    throw new Error("code and name are required.");
  }

  return {
    code: normalizeCode(codeInput),
    name,
    description:
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : undefined,
    isActive: body.isActive === false ? false : true,
  } as const;
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have access to member categories.");
  }

  try {
    const rows = await listMemberCategories();
    return apiOk(rows, { count: rows.length });
  } catch (error) {
    return apiError(400, "MEMBER_CATEGORIES_LIST_FAILED", "Failed to load categories.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to create categories.");
  }

  try {
    const row = await createMemberCategory(parseCategoryInput(await request.json()));
    return apiOk(row);
  } catch (error) {
    return apiError(400, "MEMBER_CATEGORY_CREATE_FAILED", "Failed to create category.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to update categories.");
  }

  try {
    const body = (await request.json()) as { categoryId?: string };
    const categoryId = body.categoryId?.trim();

    if (!categoryId) {
      throw new Error("categoryId is required.");
    }

    const row = await updateMemberCategory(categoryId, parseCategoryInput(body));
    return apiOk(row);
  } catch (error) {
    return apiError(400, "MEMBER_CATEGORY_UPDATE_FAILED", "Failed to update category.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to delete categories.");
  }

  try {
    const body = (await request.json()) as { categoryId?: string };
    const categoryId = body.categoryId?.trim();

    if (!categoryId) {
      throw new Error("categoryId is required.");
    }

    const row = await deleteMemberCategory(categoryId);
    return apiOk(row);
  } catch (error) {
    return apiError(400, "MEMBER_CATEGORY_DELETE_FAILED", "Failed to delete category.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
