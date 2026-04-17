import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDepartmentIdOrThrow } from "@/lib/supabase/department-members-repo";
import { loadMediaPreviewMap } from "@/lib/supabase/media-preview";

type YouthRow = {
  id: string;
  department_id: string;
  full_name: string;
  age: number | null;
  age_group: string | null;
  status: "active" | "inactive" | "graduated";
  photo_media_id: string | null;
  created_at: string;
  updated_at: string;
};

type YouthRowWithPreview = YouthRow & {
  photo_media_preview_url: string | null;
};

export async function listYouthProfiles(departmentIdentifier: string) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("youth_profiles")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as YouthRow[];
  const previewMap = await loadMediaPreviewMap(rows.map((row) => row.photo_media_id));

  return rows.map((row) => ({
    ...row,
    photo_media_preview_url: previewMap.get(row.photo_media_id ?? "")?.previewUrl ?? null,
  })) as YouthRowWithPreview[];
}

export async function createYouthProfile(
  departmentIdentifier: string,
  input: {
    fullName: string;
    age?: number | null;
    ageGroup?: string;
    status?: "active" | "inactive" | "graduated";
    photoMediaId?: string | null;
  },
) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("youth_profiles")
    .insert({
      department_id: departmentId,
      full_name: input.fullName,
      age: input.age ?? null,
      age_group: input.ageGroup ?? null,
      status: input.status ?? "active",
      photo_media_id: input.photoMediaId ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create youth profile.");
  }

  return data as YouthRow;
}

export async function updateYouthProfile(
  youthId: string,
  departmentIdentifier: string,
  input: {
    fullName: string;
    age?: number | null;
    ageGroup?: string;
    status?: "active" | "inactive" | "graduated";
    photoMediaId?: string | null;
  },
) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("youth_profiles")
    .update({
      full_name: input.fullName,
      age: input.age ?? null,
      age_group: input.ageGroup ?? null,
      status: input.status ?? "active",
      photo_media_id: input.photoMediaId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", youthId)
    .eq("department_id", departmentId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update youth profile.");
  }

  return data as YouthRow;
}

export async function deleteYouthProfile(youthId: string, departmentIdentifier: string) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("youth_profiles")
    .delete()
    .eq("id", youthId)
    .eq("department_id", departmentId);

  if (error) {
    throw new Error(error.message);
  }

  return { youthId };
}
