import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type UserRoleRow = {
  roles: { code: string }[] | { code: string } | null;
};

function flattenRoleCodes(rows: UserRoleRow[]) {
  const all = rows.flatMap((row) => {
    const value = row.roles;
    if (!value) {
      return [] as string[];
    }
    if (Array.isArray(value)) {
      return value.map((item) => item.code).filter(Boolean);
    }
    return value.code ? [value.code] : [];
  });

  return Array.from(new Set(all));
}

export async function getMemberDimensionSummary() {
  const supabase = await createSupabaseServerClient();

  const { data: members, error } = await supabase
    .from("church_members")
    .select("education_status,occupation_status,marriage_status,student_stage,employment_type")
    .neq("status", "archived");

  if (error) {
    throw new Error(error.message);
  }

  const rows = members ?? [];

  function countBy(field: "education_status" | "occupation_status" | "marriage_status" | "student_stage" | "employment_type") {
    const map: Record<string, number> = {};

    for (const row of rows) {
      const key = ((row as Record<string, unknown>)[field] as string | null | undefined)?.trim();
      if (!key) {
        continue;
      }
      map[key] = (map[key] ?? 0) + 1;
    }

    return map;
  }

  return {
    totalMembers: rows.length,
    educationStatus: countBy("education_status"),
    occupationStatus: countBy("occupation_status"),
    marriageStatus: countBy("marriage_status"),
    studentStage: countBy("student_stage"),
    employmentType: countBy("employment_type"),
  };
}

export async function listDashboardMessagesForUser(userId: string) {
  const supabase = await createSupabaseServerClient();

  const [{ data: roleRows, error: roleError }, { data: assignmentRows, error: assignmentError }] = await Promise.all([
    supabase.from("user_roles").select("roles(code)").eq("user_id", userId),
    supabase.from("department_admin_assignments").select("department_id").eq("user_id", userId),
  ]);

  if (roleError) {
    throw new Error(roleError.message);
  }

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const roleCodes = flattenRoleCodes((roleRows ?? []) as UserRoleRow[]);
  const departmentIds = (assignmentRows ?? []).map((row) => row.department_id);

  let query = supabase
    .from("dashboard_messages")
    .select(
      `
      id,
      sender_user_id,
      recipient_scope,
      recipient_role_code,
      recipient_department_id,
      recipient_user_id,
      title,
      body,
      attachment_media_id,
      created_at,
      reviewed_at,
      reviewed_by,
      sender_profile:sender_user_id(full_name),
      recipient_department:recipient_department_id(code,name_en,name_am)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const orConditions = [
    "recipient_scope.eq.all_admins",
    `recipient_user_id.eq.${userId}`,
  ];

  for (const roleCode of roleCodes) {
    orConditions.push(`and(recipient_scope.eq.role,recipient_role_code.eq.${roleCode})`);
  }

  for (const departmentId of departmentIds) {
    if (departmentId) {
      orConditions.push(`and(recipient_scope.eq.department,recipient_department_id.eq.${departmentId})`);
    }
  }

  query = query.or(orConditions.join(","));

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const recipientIds = Array.from(
    new Set(
      rows
        .map((row) => (typeof row.recipient_user_id === "string" ? row.recipient_user_id : null))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const recipientEmailMap = new Map<string, string | null>();
  const recipientNameMap = new Map<string, string | null>();
  const adminClient = createSupabaseAdminClient();

  if (adminClient && recipientIds.length > 0) {
    const { data: usersData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

    for (const user of usersData?.users ?? []) {
      if (recipientIds.includes(user.id)) {
        recipientEmailMap.set(user.id, user.email ?? null);
        recipientNameMap.set(
          user.id,
          typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
        );
      }
    }
  }

  return rows.map((row) => ({
    ...row,
    recipient_user:
      typeof row.recipient_user_id === "string"
        ? {
            id: row.recipient_user_id,
            email: recipientEmailMap.get(row.recipient_user_id) ?? null,
            full_name: recipientNameMap.get(row.recipient_user_id) ?? null,
          }
        : null,
  }));
}

export async function createDashboardMessage(input: {
  senderUserId: string;
  recipientScope: "all_admins" | "role" | "department" | "user";
  recipientRoleCode?: string | null;
  recipientDepartmentId?: string | null;
  recipientUserId?: string | null;
  title: string;
  body?: string | null;
  attachmentMediaId?: string | null;
}) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("dashboard_messages")
    .insert({
      sender_user_id: input.senderUserId,
      recipient_scope: input.recipientScope,
      recipient_role_code: input.recipientRoleCode ?? null,
      recipient_department_id: input.recipientDepartmentId ?? null,
      recipient_user_id: input.recipientUserId ?? null,
      title: input.title,
      body: input.body ?? null,
      attachment_media_id: input.attachmentMediaId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create dashboard message.");
  }

  return data;
}

export async function reviewDashboardMessage(messageId: string, reviewerUserId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dashboard_messages")
    .update({
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerUserId,
    })
    .eq("id", messageId)
    .select("id,reviewed_at,reviewed_by")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to review message.");
  }

  return data;
}

export async function listIdentityProfiles() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_identities")
    .select("id,profile_id,member_id,identity_number,username,role_group,is_active,created_at,updated_at,member:member_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createIdentityProfile(input: {
  createdBy: string;
  profileId?: string | null;
  memberId?: string | null;
  username: string;
  roleGroup: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_identities")
    .insert({
      created_by: input.createdBy,
      profile_id: input.profileId ?? null,
      member_id: input.memberId ?? null,
      username: input.username,
      role_group: input.roleGroup,
    })
    .select("id,identity_number,username,role_group")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create identity profile.");
  }

  return data;
}

export async function updateIdentityProfile(input: {
  identityId: string;
  username?: string;
  roleGroup?: string;
  isActive?: boolean;
}) {
  const supabase = await createSupabaseServerClient();

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof input.username === "string") {
    payload.username = input.username;
  }

  if (typeof input.roleGroup === "string") {
    payload.role_group = input.roleGroup;
  }

  if (typeof input.isActive === "boolean") {
    payload.is_active = input.isActive;
  }

  const { data, error } = await supabase
    .from("user_identities")
    .update(payload)
    .eq("id", input.identityId)
    .select("id,identity_number,username,role_group,is_active")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update identity profile.");
  }

  return data;
}

export async function authenticateStudent(identityNumber: string, username: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_identities")
    .select("id,identity_number,username,role_group,is_active")
    .eq("identity_number", identityNumber)
    .eq("username", username)
    .eq("role_group", "student")
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getStudentProfileByIdentity(identityId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("student_academic_profiles")
    .select("id,class_name,section_name,age_group,courses,teachers,grades,member:member_id(full_name,contact_phone,contact_email),identity:identity_id(identity_number,username)")
    .eq("identity_id", identityId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Student profile not found.");
  }

  return data;
}

export async function listStudentGradeHistoryByIdentity(identityId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("student_grade_history")
    .select("id,class_name,section_name,age_group,courses,teachers,grades,created_at")
    .eq("identity_id", identityId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function upsertStudentProfileByIdentity(
  identityId: string,
  input: {
    className?: string;
    sectionName?: string;
    ageGroup?: string;
    courses?: string[];
    teachers?: string[];
    grades?: Record<string, string | number>;
  },
) {
  const supabase = await createSupabaseServerClient();

  const { data: identityRow, error: identityError } = await supabase
    .from("user_identities")
    .select("id,member_id")
    .eq("id", identityId)
    .single();

  if (identityError || !identityRow) {
    throw new Error(identityError?.message ?? "Identity not found.");
  }

  const { data: currentProfile } = await supabase
    .from("student_academic_profiles")
    .select("class_name,section_name,age_group,courses,teachers,grades")
    .eq("identity_id", identityId)
    .maybeSingle();

  const payload = {
    identity_id: identityId,
    member_id: identityRow.member_id ?? null,
    class_name: input.className ?? null,
    section_name: input.sectionName ?? null,
    age_group: input.ageGroup ?? null,
    courses: input.courses ?? [],
    teachers: input.teachers ?? [],
    grades: input.grades ?? {},
  };

  const { error } = await supabase
    .from("student_academic_profiles")
    .upsert(payload, { onConflict: "identity_id" });

  if (error) {
    throw new Error(error.message);
  }

  const hasChanged =
    !currentProfile ||
    currentProfile.class_name !== payload.class_name ||
    currentProfile.section_name !== payload.section_name ||
    currentProfile.age_group !== payload.age_group ||
    JSON.stringify(currentProfile.courses ?? []) !== JSON.stringify(payload.courses) ||
    JSON.stringify(currentProfile.teachers ?? []) !== JSON.stringify(payload.teachers) ||
    JSON.stringify(currentProfile.grades ?? {}) !== JSON.stringify(payload.grades);

  if (hasChanged) {
    const { error: historyError } = await supabase.from("student_grade_history").insert({
      identity_id: identityId,
      member_id: identityRow.member_id ?? null,
      class_name: payload.class_name,
      section_name: payload.section_name,
      age_group: payload.age_group,
      courses: payload.courses,
      teachers: payload.teachers,
      grades: payload.grades,
    });

    if (historyError) {
      throw new Error(historyError.message);
    }
  }

  return getStudentProfileByIdentity(identityId);
}

export async function listMessagingRecipients(input?: {
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const normalizedSearch = input?.search?.trim().toLowerCase() ?? "";
  const page = input?.page && input.page > 0 ? Math.floor(input.page) : 1;
  const perPage = input?.perPage && input.perPage > 0 ? Math.min(200, Math.floor(input.perPage)) : 50;

  const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers(
    normalizedSearch
      ? {
          page: 1,
          perPage: 1000,
        }
      : {
          page,
          perPage,
        },
  );

  if (usersError) {
    throw new Error(usersError.message);
  }

  const filteredUsers = (usersData?.users ?? []).filter((user) => {
    if (!normalizedSearch) {
      return true;
    }

    const email = user.email?.toLowerCase() ?? "";
    const metadataName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name.toLowerCase()
        : "";

    return email.includes(normalizedSearch) || metadataName.includes(normalizedSearch);
  });

  const total = filteredUsers.length;

  const pagedUsers = filteredUsers.slice((page - 1) * perPage, (page - 1) * perPage + perPage);

  const userIds = pagedUsers.map((item) => item.id);

  if (!userIds.length) {
    return {
      items: [] as Array<{ id: string; email: string | null; fullName: string | null; roles: string[] }>,
      total,
      page,
      perPage,
      hasMore: page * perPage < total,
    };
  }

  const [{ data: roleRows, error: roleError }, { data: profileRows, error: profileError }] = await Promise.all([
    adminClient.from("user_roles").select("user_id,roles(code)").in("user_id", userIds),
    adminClient.from("profiles").select("id,full_name").in("id", userIds),
  ]);

  if (roleError) {
    throw new Error(roleError.message);
  }

  if (profileError) {
    throw new Error(profileError.message);
  }

  const roleMap = new Map<string, string[]>();

  for (const row of roleRows ?? []) {
    const roleValue = row.roles as { code?: string } | { code?: string }[] | null;
    const codes = Array.isArray(roleValue)
      ? roleValue.map((item) => item.code).filter((item): item is string => Boolean(item))
      : roleValue?.code
        ? [roleValue.code]
        : [];

    roleMap.set(row.user_id, Array.from(new Set([...(roleMap.get(row.user_id) ?? []), ...codes])));
  }

  const profileMap = new Map((profileRows ?? []).map((row) => [row.id, row.full_name as string | null]));

  const items = pagedUsers
    .map((user) => ({
      id: user.id,
      email: user.email ?? null,
      fullName:
        profileMap.get(user.id) ??
        (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null),
      roles: roleMap.get(user.id) ?? [],
    }))
    .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));

  return {
    items,
    total,
    page,
    perPage,
    hasMore: page * perPage < total,
  };
}
