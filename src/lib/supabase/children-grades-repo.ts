import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDepartmentIdOrThrow } from "@/lib/supabase/department-members-repo";

export async function listChildrenGrades(departmentIdentifier: string) {
  const supabase = await createSupabaseServerClient();
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);

  const { data: children, error: childrenError } = await supabase
    .from("children_profiles")
    .select("id,full_name,age,class_name,section_name")
    .eq("department_id", departmentId)
    .order("full_name", { ascending: true });

  if (childrenError) {
    throw new Error(childrenError.message);
  }

  const childRows = children ?? [];
  const childIds = childRows.map((item) => item.id);

  if (!childIds.length) {
    return [];
  }

  const { data: grades, error: gradeError } = await supabase
    .from("children_grades")
    .select("*")
    .in("child_id", childIds)
    .order("created_at", { ascending: false });

  if (gradeError) {
    throw new Error(gradeError.message);
  }

  const childMap = new Map(childRows.map((item) => [item.id, item]));

  return (grades ?? []).map((grade) => ({
    ...grade,
    child: childMap.get(grade.child_id) ?? null,
  }));
}

export async function listChildrenForGrades(departmentIdentifier: string) {
  const supabase = await createSupabaseServerClient();
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);

  const { data, error } = await supabase
    .from("children_profiles")
    .select("id,full_name,age,class_name,section_name")
    .eq("department_id", departmentId)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createChildrenGrade(
  departmentIdentifier: string,
  input: {
    childId: string;
    subject: string;
    termLabel: string;
    ageGroup?: string;
    score?: number | null;
    gradeLetter?: string;
    teacherName?: string;
    remarks?: string;
  },
) {
  const supabase = await createSupabaseServerClient();
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);

  const { data: child, error: childError } = await supabase
    .from("children_profiles")
    .select("id")
    .eq("id", input.childId)
    .eq("department_id", departmentId)
    .single();

  if (childError || !child) {
    throw new Error("Child profile not found in this department.");
  }

  const { data, error } = await supabase
    .from("children_grades")
    .insert({
      child_id: input.childId,
      subject: input.subject,
      term_label: input.termLabel,
      age_group: input.ageGroup ?? null,
      score: input.score ?? null,
      grade_letter: input.gradeLetter ?? null,
      teacher_name: input.teacherName ?? null,
      remarks: input.remarks ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create grade record.");
  }

  return data;
}

export async function updateChildrenGrade(
  gradeId: string,
  departmentIdentifier: string,
  input: {
    childId: string;
    subject: string;
    termLabel: string;
    ageGroup?: string;
    score?: number | null;
    gradeLetter?: string;
    teacherName?: string;
    remarks?: string;
  },
) {
  const supabase = await createSupabaseServerClient();
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);

  const { data: child, error: childError } = await supabase
    .from("children_profiles")
    .select("id")
    .eq("id", input.childId)
    .eq("department_id", departmentId)
    .single();

  if (childError || !child) {
    throw new Error("Child profile not found in this department.");
  }

  const { data, error } = await supabase
    .from("children_grades")
    .update({
      child_id: input.childId,
      subject: input.subject,
      term_label: input.termLabel,
      age_group: input.ageGroup ?? null,
      score: input.score ?? null,
      grade_letter: input.gradeLetter ?? null,
      teacher_name: input.teacherName ?? null,
      remarks: input.remarks ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gradeId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update grade record.");
  }

  return data;
}

export async function deleteChildrenGrade(gradeId: string, departmentIdentifier: string) {
  const supabase = await createSupabaseServerClient();
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);

  const { data: children, error: childrenError } = await supabase
    .from("children_profiles")
    .select("id")
    .eq("department_id", departmentId);

  if (childrenError) {
    throw new Error(childrenError.message);
  }

  const childIds = (children ?? []).map((item) => item.id);

  const { error } = await supabase
    .from("children_grades")
    .delete()
    .eq("id", gradeId)
    .in("child_id", childIds);

  if (error) {
    throw new Error(error.message);
  }

  return { gradeId };
}
