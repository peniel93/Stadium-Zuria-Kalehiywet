import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadMediaPreviewMap } from "@/lib/supabase/media-preview";

type DepartmentMemberRow = {
  id: string;
  department_id: string;
  group_id: string | null;
  full_name: string;
  full_name_am: string | null;
  photo_media_id: string | null;
  role_title: string | null;
  contact: string | null;
  address: string | null;
  status: "active" | "inactive" | "archived";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type DepartmentGroupRow = {
  id: string;
  department_id: string;
  code: string;
  name_en: string;
  name_am: string;
  description: string | null;
};

type DepartmentMemberRawRow = Omit<DepartmentMemberRow, "metadata"> & {
  metadata: Record<string, unknown>;
  department_member_groups: DepartmentGroupRow[] | null;
};

type DepartmentMemberWithPreviewRow = DepartmentMemberRow & {
  photo_media_preview_url: string | null;
};

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function resolveDepartmentIdentifier(identifier: string) {
  if (looksLikeUuid(identifier)) {
    return identifier;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("departments")
    .select("id")
    .eq("code", identifier)
    .maybeSingle();

  return data?.id ?? null;
}

export async function resolveDepartmentIdOrThrow(identifier: string) {
  const departmentId = await resolveDepartmentIdentifier(identifier);

  if (!departmentId) {
    throw new Error("Department not found.");
  }

  return departmentId;
}

export async function listDepartmentMembers(departmentIdentifier: string) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("department_members")
    .select(
      `
        id,
        department_id,
        group_id,
        full_name,
        full_name_am,
        photo_media_id,
        role_title,
        contact,
        address,
        status,
        metadata,
        created_at,
        updated_at,
        department_member_groups (
          id,
          department_id,
          code,
          name_en,
          name_am,
          description
        )
      `,
    )
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data ?? []) as DepartmentMemberRawRow[]).map((row) => ({
    ...row,
    department_member_groups: row.department_member_groups?.[0] ?? null,
  }));

  const previewMap = await loadMediaPreviewMap(rows.map((row) => row.photo_media_id));

  return rows.map((row) => ({
    ...row,
    photo_media_preview_url: previewMap.get(row.photo_media_id ?? "")?.previewUrl ?? null,
  })) as DepartmentMemberWithPreviewRow[];
}

export async function createDepartmentMember(
  departmentIdentifier: string,
  input: {
    fullName: string;
    fullNameAm?: string;
    photoMediaId?: string | null;
    groupId?: string | null;
    roleTitle?: string;
    contact?: string;
    address?: string;
    status?: "active" | "inactive" | "archived";
  },
) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("department_members")
    .insert({
      department_id: departmentId,
      group_id: input.groupId ?? null,
      full_name: input.fullName,
      full_name_am: input.fullNameAm ?? null,
      photo_media_id: input.photoMediaId ?? null,
      role_title: input.roleTitle ?? null,
      contact: input.contact ?? null,
      address: input.address ?? null,
      status: input.status ?? "active",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create department member.");
  }

  return data as DepartmentMemberRow;
}

export async function updateDepartmentMember(
  memberId: string,
  departmentIdentifier: string,
  input: {
    fullName: string;
    fullNameAm?: string;
    photoMediaId?: string | null;
    groupId?: string | null;
    roleTitle?: string;
    contact?: string;
    address?: string;
    status?: "active" | "inactive" | "archived";
  },
) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("department_members")
    .update({
      group_id: input.groupId ?? null,
      full_name: input.fullName,
      full_name_am: input.fullNameAm ?? null,
      photo_media_id: input.photoMediaId ?? null,
      role_title: input.roleTitle ?? null,
      contact: input.contact ?? null,
      address: input.address ?? null,
      status: input.status ?? "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("department_id", departmentId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update department member.");
  }

  return data as DepartmentMemberRow;
}

export async function deleteDepartmentMember(memberId: string, departmentIdentifier: string) {
  const departmentId = await resolveDepartmentIdOrThrow(departmentIdentifier);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("department_members")
    .delete()
    .eq("id", memberId)
    .eq("department_id", departmentId);

  if (error) {
    throw new Error(error.message);
  }

  return { memberId };
}
