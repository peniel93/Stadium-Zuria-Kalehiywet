import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDepartmentIdOrThrow } from "@/lib/supabase/department-members-repo";
import { loadMediaPreviewMap } from "@/lib/supabase/media-preview";

type WorkerStatus = "active" | "inactive" | "on_leave" | "replaced" | "retired";

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function resolveDepartmentIdMaybe(identifier?: string | null) {
  if (!identifier) {
    return null;
  }

  if (looksLikeUuid(identifier)) {
    return identifier;
  }

  try {
    return await resolveDepartmentIdOrThrow(identifier);
  } catch {
    return null;
  }
}

export async function listHrWorkers(filters: {
  departmentIdentifier?: string | null;
  q?: string;
  zone?: string;
  roleLabel?: string;
  status?: WorkerStatus | "all";
}) {
  const supabase = await createSupabaseServerClient();
  const departmentId = await resolveDepartmentIdMaybe(filters.departmentIdentifier);

  let query = supabase.from("hr_workers").select("*").order("created_at", { ascending: false });

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  if (filters.zone) {
    query = query.eq("medeb_sefer_zone", filters.zone);
  }

  if (filters.roleLabel) {
    query = query.eq("role_label", filters.roleLabel);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("employment_status", filters.status);
  }

  if (filters.q) {
    query = query.or(
      `full_name.ilike.%${filters.q}%,post_title.ilike.%${filters.q}%,contact_phone.ilike.%${filters.q}%,contact_email.ilike.%${filters.q}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const previewMap = await loadMediaPreviewMap(rows.map((row) => row.photo_media_id));

  return rows.map((row) => ({
    ...row,
    photo_media_preview_url: previewMap.get(row.photo_media_id ?? "")?.previewUrl ?? null,
  }));
}

export async function createHrWorker(input: {
  departmentIdentifier?: string | null;
  fullName: string;
  photoMediaId?: string | null;
  contactPhone?: string;
  contactEmail?: string;
  postTitle?: string;
  salaryAmount?: number | null;
  educationLevel?: string;
  employmentStatus?: WorkerStatus;
  roleLabel?: string;
  medebSeferZone?: string;
  joinedOn?: string | null;
  replacedByWorkerId?: string | null;
  notes?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const departmentId = await resolveDepartmentIdMaybe(input.departmentIdentifier);

  const { data, error } = await supabase
    .from("hr_workers")
    .insert({
      department_id: departmentId,
      full_name: input.fullName,
      photo_media_id: input.photoMediaId ?? null,
      contact_phone: input.contactPhone ?? null,
      contact_email: input.contactEmail ?? null,
      post_title: input.postTitle ?? null,
      salary_amount: input.salaryAmount ?? null,
      education_level: input.educationLevel ?? null,
      employment_status: input.employmentStatus ?? "active",
      role_label: input.roleLabel ?? null,
      medeb_sefer_zone: input.medebSeferZone ?? null,
      joined_on: input.joinedOn ?? null,
      replaced_by_worker_id: input.replacedByWorkerId ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create worker.");
  }

  return data;
}

export async function updateHrWorker(
  workerId: string,
  input: {
    fullName: string;
    photoMediaId?: string | null;
    contactPhone?: string;
    contactEmail?: string;
    postTitle?: string;
    salaryAmount?: number | null;
    educationLevel?: string;
    employmentStatus?: WorkerStatus;
    roleLabel?: string;
    medebSeferZone?: string;
    joinedOn?: string | null;
    replacedByWorkerId?: string | null;
    notes?: string;
  },
) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("hr_workers")
    .update({
      full_name: input.fullName,
      photo_media_id: input.photoMediaId ?? null,
      contact_phone: input.contactPhone ?? null,
      contact_email: input.contactEmail ?? null,
      post_title: input.postTitle ?? null,
      salary_amount: input.salaryAmount ?? null,
      education_level: input.educationLevel ?? null,
      employment_status: input.employmentStatus ?? "active",
      role_label: input.roleLabel ?? null,
      medeb_sefer_zone: input.medebSeferZone ?? null,
      joined_on: input.joinedOn ?? null,
      replaced_by_worker_id: input.replacedByWorkerId ?? null,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workerId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update worker.");
  }

  return data;
}

export async function deleteHrWorker(workerId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("hr_workers").delete().eq("id", workerId);

  if (error) {
    throw new Error(error.message);
  }

  return { workerId };
}
