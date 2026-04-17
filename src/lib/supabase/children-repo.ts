import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDepartmentIdOrThrow } from "@/lib/supabase/department-members-repo";
import { loadMediaPreviewMap } from "@/lib/supabase/media-preview";

type ChildRow = {
  id: string;
  department_id: string;
  full_name: string;
  age: number | null;
  education_level: string | null;
  class_name: string | null;
  section_name: string | null;
  status: "active" | "inactive" | "graduated";
  date_of_registration: string | null;
  photo_media_id: string | null;
  created_at: string;
  updated_at: string;
};

type ChildRowWithPreview = ChildRow & {
  photo_media_preview_url: string | null;
};

export async function listChildrenProfiles(departmentIdentifier: string) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("children_profiles")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ChildRow[];
  const previewMap = await loadMediaPreviewMap(rows.map((row) => row.photo_media_id));

  return rows.map((row) => ({
    ...row,
    photo_media_preview_url: previewMap.get(row.photo_media_id ?? "")?.previewUrl ?? null,
  })) as ChildRowWithPreview[];
}

export async function createChildProfile(
  departmentIdentifier: string,
  input: {
    fullName: string;
    age?: number | null;
    educationLevel?: string;
    className?: string;
    sectionName?: string;
    status?: "active" | "inactive" | "graduated";
    dateOfRegistration?: string | null;
    photoMediaId?: string | null;
  },
) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("children_profiles")
    .insert({
      department_id: departmentId,
      full_name: input.fullName,
      age: input.age ?? null,
      education_level: input.educationLevel ?? null,
      class_name: input.className ?? null,
      section_name: input.sectionName ?? null,
      status: input.status ?? "active",
      date_of_registration: input.dateOfRegistration ?? null,
      photo_media_id: input.photoMediaId ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create child profile.");
  }

  return data as ChildRow;
}

export async function updateChildProfile(
  childId: string,
  departmentIdentifier: string,
  input: {
    fullName: string;
    age?: number | null;
    educationLevel?: string;
    className?: string;
    sectionName?: string;
    status?: "active" | "inactive" | "graduated";
    dateOfRegistration?: string | null;
    photoMediaId?: string | null;
  },
) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("children_profiles")
    .update({
      full_name: input.fullName,
      age: input.age ?? null,
      education_level: input.educationLevel ?? null,
      class_name: input.className ?? null,
      section_name: input.sectionName ?? null,
      status: input.status ?? "active",
      date_of_registration: input.dateOfRegistration ?? null,
      photo_media_id: input.photoMediaId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", childId)
    .eq("department_id", departmentId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update child profile.");
  }

  return data as ChildRow;
}

export async function deleteChildProfile(childId: string, departmentIdentifier: string) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("children_profiles")
    .delete()
    .eq("id", childId)
    .eq("department_id", departmentId);

  if (error) {
    throw new Error(error.message);
  }

  return { childId };
}
