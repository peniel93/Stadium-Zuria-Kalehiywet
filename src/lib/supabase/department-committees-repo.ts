import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDepartmentIdOrThrow } from "@/lib/supabase/department-members-repo";

type DepartmentCommitteeRow = {
  id: string;
  department_id: string;
  name: string;
  description: string | null;
  term_label: string | null;
  round_number: number | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
};

export async function listDepartmentCommittees(departmentIdentifier: string) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("department_committees")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DepartmentCommitteeRow[];
}

export async function createDepartmentCommittee(
  departmentIdentifier: string,
  input: {
    name: string;
    description?: string;
    termLabel?: string;
    roundNumber?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    isCurrent?: boolean;
  },
) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("department_committees")
    .insert({
      department_id: departmentId,
      name: input.name,
      description: input.description ?? null,
      term_label: input.termLabel ?? null,
      round_number: input.roundNumber ?? null,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      is_current: input.isCurrent ?? false,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create department committee.");
  }

  return data as DepartmentCommitteeRow;
}

export async function updateDepartmentCommittee(
  committeeId: string,
  departmentIdentifier: string,
  input: {
    name: string;
    description?: string;
    termLabel?: string;
    roundNumber?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    isCurrent?: boolean;
  },
) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("department_committees")
    .update({
      name: input.name,
      description: input.description ?? null,
      term_label: input.termLabel ?? null,
      round_number: input.roundNumber ?? null,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      is_current: input.isCurrent ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", committeeId)
    .eq("department_id", departmentId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update department committee.");
  }

  return data as DepartmentCommitteeRow;
}

export async function deleteDepartmentCommittee(committeeId: string, departmentIdentifier: string) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("department_committees")
    .delete()
    .eq("id", committeeId)
    .eq("department_id", departmentId);

  if (error) {
    throw new Error(error.message);
  }

  return { committeeId };
}
