import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type DepartmentCategoryRecord = {
  id: string;
  departmentId: string;
  departmentCode: string;
  departmentNameEn: string;
  departmentNameAm: string;
  code: string;
  nameEn: string;
  nameAm: string;
  description: string | null;
};

export async function listDepartmentCategories() {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return [] as DepartmentCategoryRecord[];
  }

  const { data, error } = await adminClient
    .from("department_categories")
    .select("id, department_id, code, name_en, name_am, description, departments(code, name_en, name_am)")
    .order("name_en", { ascending: true });

  if (error || !data) {
    return [] as DepartmentCategoryRecord[];
  }

  return data.map((row) => {
    const department = row.departments as
      | { code?: string; name_en?: string; name_am?: string }
      | { code?: string; name_en?: string; name_am?: string }[]
      | null;
    const pickedDepartment = Array.isArray(department) ? department[0] : department;

    return {
      id: row.id,
      departmentId: row.department_id,
      departmentCode: pickedDepartment?.code ?? "",
      departmentNameEn: pickedDepartment?.name_en ?? "",
      departmentNameAm: pickedDepartment?.name_am ?? "",
      code: row.code,
      nameEn: row.name_en,
      nameAm: row.name_am,
      description: row.description,
    };
  }) as DepartmentCategoryRecord[];
}

export async function createDepartmentCategory(input: {
  departmentId: string;
  code: string;
  nameEn: string;
  nameAm: string;
  description?: string;
}) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { error } = await adminClient.from("department_categories").insert({
    department_id: input.departmentId,
    code: input.code,
    name_en: input.nameEn,
    name_am: input.nameAm,
    description: input.description ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return listDepartmentCategories();
}

export async function updateDepartmentCategory(input: {
  categoryId: string;
  departmentId: string;
  code: string;
  nameEn: string;
  nameAm: string;
  description?: string;
}) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { error } = await adminClient
    .from("department_categories")
    .update({
      department_id: input.departmentId,
      code: input.code,
      name_en: input.nameEn,
      name_am: input.nameAm,
      description: input.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.categoryId);

  if (error) {
    throw new Error(error.message);
  }

  return listDepartmentCategories();
}

export async function deleteDepartmentCategory(categoryId: string) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { error } = await adminClient
    .from("department_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    throw new Error(error.message);
  }

  return listDepartmentCategories();
}
