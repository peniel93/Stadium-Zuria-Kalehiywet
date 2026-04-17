import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDepartmentIdOrThrow } from "@/lib/supabase/department-members-repo";

type DepartmentGroupRow = {
  id: string;
  department_id: string;
  code: string;
  name_en: string;
  name_am: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export async function listDepartmentGroups(departmentIdentifier: string) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("department_member_groups")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DepartmentGroupRow[];
}

export async function createDepartmentGroup(
  departmentIdentifier: string,
  input: {
    code: string;
    nameEn: string;
    nameAm: string;
    description?: string;
  },
) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("department_member_groups")
    .insert({
      department_id: departmentId,
      code: input.code,
      name_en: input.nameEn,
      name_am: input.nameAm,
      description: input.description ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create department group.");
  }

  return data as DepartmentGroupRow;
}

export async function updateDepartmentGroup(
  groupId: string,
  departmentIdentifier: string,
  input: {
    code: string;
    nameEn: string;
    nameAm: string;
    description?: string;
  },
) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("department_member_groups")
    .update({
      code: input.code,
      name_en: input.nameEn,
      name_am: input.nameAm,
      description: input.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)
    .eq("department_id", departmentId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update department group.");
  }

  return data as DepartmentGroupRow;
}

export async function deleteDepartmentGroup(groupId: string, departmentIdentifier: string) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("department_member_groups")
    .delete()
    .eq("id", groupId)
    .eq("department_id", departmentId);

  if (error) {
    throw new Error(error.message);
  }

  return { groupId };
}
