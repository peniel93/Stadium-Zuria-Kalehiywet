import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { departmentConfigs } from "@/lib/departments";

export type DepartmentRecord = {
  id: string;
  code: string;
  nameEn: string;
  nameAm: string;
  description: string | null;
  isPublic: boolean;
  isActive: boolean;
};

function toFallbackDepartments() {
  return departmentConfigs.map((item) => ({
    id: item.slug,
    code: item.slug,
    nameEn: item.name,
    nameAm: item.amharicName,
    description: item.summary,
    isPublic: true,
    isActive: true,
  })) as DepartmentRecord[];
}

export async function listDepartments(options?: { includeInactive?: boolean }) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return toFallbackDepartments();
  }

  let query = adminClient
    .from("departments")
    .select("id, code, name_en, name_am, description, is_public, is_active")
    .order("name_en", { ascending: true });

  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return toFallbackDepartments();
  }

  return data.map((row) => ({
    id: row.id,
    code: row.code,
    nameEn: row.name_en,
    nameAm: row.name_am,
    description: row.description,
    isPublic: row.is_public,
    isActive: row.is_active,
  })) as DepartmentRecord[];
}

export async function getDepartmentByCode(code: string) {
  const rows = await listDepartments({ includeInactive: true });
  return rows.find((row) => row.code === code) ?? null;
}

export async function createDepartment(input: {
  code: string;
  nameEn: string;
  nameAm: string;
  description?: string;
  isPublic?: boolean;
  isActive?: boolean;
}) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { data, error } = await adminClient
    .from("departments")
    .insert({
      code: input.code,
      name_en: input.nameEn,
      name_am: input.nameAm,
      description: input.description ?? null,
      is_public: input.isPublic ?? true,
      is_active: input.isActive ?? true,
    })
    .select("id, code, name_en, name_am, description, is_public, is_active")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create department.");
  }

  return {
    id: data.id,
    code: data.code,
    nameEn: data.name_en,
    nameAm: data.name_am,
    description: data.description,
    isPublic: data.is_public,
    isActive: data.is_active,
  } as DepartmentRecord;
}
