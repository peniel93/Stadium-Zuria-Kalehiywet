import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadMediaPreviewMap } from "@/lib/supabase/media-preview";

export async function listMemberCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("member_categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createMemberCategory(input: { code: string; name: string; description?: string }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("member_categories")
    .insert({
      code: input.code,
      name: input.name,
      description: input.description ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create member category.");
  }

  return data;
}

export async function updateMemberCategory(
  categoryId: string,
  input: { code: string; name: string; description?: string; isActive?: boolean },
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("member_categories")
    .update({
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      is_active: input.isActive ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update member category.");
  }

  return data;
}

export async function deleteMemberCategory(categoryId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("member_categories").delete().eq("id", categoryId);

  if (error) {
    throw new Error(error.message);
  }

  return { categoryId };
}

export async function listChurchMembers(filters: {
  q?: string;
  zone?: string;
  categoryId?: string;
  roleLabel?: string;
  status?: "all" | "active" | "inactive" | "moved" | "archived";
}) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("church_members")
    .select("*,member_categories(id,code,name)")
    .order("created_at", { ascending: false });

  if (filters.q) {
    query = query.or(
      `full_name.ilike.%${filters.q}%,contact_phone.ilike.%${filters.q}%,contact_email.ilike.%${filters.q}%,address.ilike.%${filters.q}%`,
    );
  }

  if (filters.zone) {
    query = query.eq("medeb_sefer_zone", filters.zone);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.roleLabel) {
    query = query.eq("role_label", filters.roleLabel);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []).map((row) => ({
    ...row,
    member_categories: Array.isArray(row.member_categories)
      ? row.member_categories[0] ?? null
      : row.member_categories ?? null,
  }));

  const previewMap = await loadMediaPreviewMap(rows.map((row) => row.photo_media_id));

  return rows.map((row) => ({
    ...row,
    photo_media_preview_url: previewMap.get(row.photo_media_id ?? "")?.previewUrl ?? null,
  }));
}

export async function createChurchMember(input: {
  fullName: string;
  photoMediaId?: string | null;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  medebSeferZone?: string;
  roleLabel?: string;
  categoryId?: string | null;
  educationStatus?: string;
  occupationStatus?: string;
  marriageStatus?: string;
  studentStage?: string;
  employmentType?: string;
  status?: "active" | "inactive" | "moved" | "archived";
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("church_members")
    .insert({
      full_name: input.fullName,
      photo_media_id: input.photoMediaId ?? null,
      contact_phone: input.contactPhone ?? null,
      contact_email: input.contactEmail ?? null,
      address: input.address ?? null,
      medeb_sefer_zone: input.medebSeferZone ?? null,
      role_label: input.roleLabel ?? null,
      category_id: input.categoryId ?? null,
      education_status: input.educationStatus ?? null,
      occupation_status: input.occupationStatus ?? null,
      marriage_status: input.marriageStatus ?? null,
      student_stage: input.studentStage ?? null,
      employment_type: input.employmentType ?? null,
      status: input.status ?? "active",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create church member.");
  }

  return data;
}

export async function updateChurchMember(
  memberId: string,
  input: {
    fullName: string;
    photoMediaId?: string | null;
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
    medebSeferZone?: string;
    roleLabel?: string;
    categoryId?: string | null;
    educationStatus?: string;
    occupationStatus?: string;
    marriageStatus?: string;
    studentStage?: string;
    employmentType?: string;
    status?: "active" | "inactive" | "moved" | "archived";
  },
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("church_members")
    .update({
      full_name: input.fullName,
      photo_media_id: input.photoMediaId ?? null,
      contact_phone: input.contactPhone ?? null,
      contact_email: input.contactEmail ?? null,
      address: input.address ?? null,
      medeb_sefer_zone: input.medebSeferZone ?? null,
      role_label: input.roleLabel ?? null,
      category_id: input.categoryId ?? null,
      education_status: input.educationStatus ?? null,
      occupation_status: input.occupationStatus ?? null,
      marriage_status: input.marriageStatus ?? null,
      student_stage: input.studentStage ?? null,
      employment_type: input.employmentType ?? null,
      status: input.status ?? "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update church member.");
  }

  return data;
}

export async function deleteChurchMember(memberId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("church_members").delete().eq("id", memberId);

  if (error) {
    throw new Error(error.message);
  }

  return { memberId };
}
