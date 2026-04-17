import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDepartmentIdOrThrow } from "@/lib/supabase/department-members-repo";
import type { AppRole } from "@/lib/auth/roles";

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function resolveUserId(identifier: string) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  if (looksLikeUuid(identifier)) {
    const { data, error } = await adminClient.auth.admin.getUserById(identifier);

    if (!error && data.user) {
      return data.user.id;
    }
  }

  const { data, error } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const matchedUser = data?.users.find((user) => user.email?.toLowerCase() === identifier.toLowerCase());

  if (error || !matchedUser) {
    throw new Error("User not found.");
  }

  return matchedUser.id;
}

async function resolveRoleIdOrThrow(roleCode: AppRole) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("roles").select("id").eq("code", roleCode).single();

  if (error || !data) {
    throw new Error("Role not found.");
  }

  return data.id;
}

async function resolveDepartmentIdMaybe(identifier: string) {
  try {
    return await resolveDepartmentIdOrThrow(identifier);
  } catch {
    return null;
  }
}

export async function getUserAccessSummary(identifier: string) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const userId = await resolveUserId(identifier);

  const [userResult, rolesResult, assignmentsResult] = await Promise.all([
    adminClient.auth.admin.getUserById(userId),
    adminClient
      .from("user_roles")
      .select("roles(code, name)")
      .eq("user_id", userId),
    adminClient
      .from("department_admin_assignments")
      .select("id, department_id, access_level, departments(code, name_en, name_am)")
      .eq("user_id", userId),
  ]);

  if (userResult.error || !userResult.data.user) {
    throw new Error("User not found.");
  }

  return {
    user: {
      id: userResult.data.user.id,
      email: userResult.data.user.email,
    },
    roles:
      (rolesResult.data ?? []).map((row) => {
        const role = row.roles as { code?: string; name?: string } | null;
        return {
          code: role?.code ?? "",
          name: role?.name ?? "",
        };
      }) ?? [],
    departmentAssignments:
      (assignmentsResult.data ?? []).map((row) => {
        const department = row.departments as
          | { code?: string; name_en?: string; name_am?: string }
          | { code?: string; name_en?: string; name_am?: string }[]
          | null;

        const departmentRow = Array.isArray(department) ? department[0] : department;

        return {
          id: row.id,
          departmentId: row.department_id,
          accessLevel: row.access_level,
          departmentCode: departmentRow?.code ?? "",
          departmentNameEn: departmentRow?.name_en ?? "",
          departmentNameAm: departmentRow?.name_am ?? "",
        };
      }) ?? [],
  };
}

export async function addRoleToUser(identifier: string, roleCode: AppRole) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const userId = await resolveUserId(identifier);
  const roleId = await resolveRoleIdOrThrow(roleCode);

  const { error } = await adminClient.from("user_roles").insert({
    user_id: userId,
    role_id: roleId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { userId, roleCode };
}

export async function removeRoleFromUser(identifier: string, roleCode: AppRole) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const userId = await resolveUserId(identifier);
  const roleId = await resolveRoleIdOrThrow(roleCode);

  const { error } = await adminClient
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role_id", roleId);

  if (error) {
    throw new Error(error.message);
  }

  return { userId, roleCode };
}

export async function assignDepartmentAdmin(
  identifier: string,
  departmentIdentifier: string,
  accessLevel: "full" | "limited",
) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const userId = await resolveUserId(identifier);
  const departmentId = await resolveDepartmentIdMaybe(departmentIdentifier);

  if (!departmentId) {
    throw new Error("Department not found.");
  }

  const { error } = await adminClient.from("department_admin_assignments").upsert(
    {
      user_id: userId,
      department_id: departmentId,
      access_level: accessLevel,
    },
    { onConflict: "user_id,department_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { userId, departmentId, accessLevel };
}

export async function removeDepartmentAdmin(identifier: string, departmentIdentifier: string) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const userId = await resolveUserId(identifier);
  const departmentId = await resolveDepartmentIdMaybe(departmentIdentifier);

  if (!departmentId) {
    throw new Error("Department not found.");
  }

  const { error } = await adminClient
    .from("department_admin_assignments")
    .delete()
    .eq("user_id", userId)
    .eq("department_id", departmentId);

  if (error) {
    throw new Error(error.message);
  }

  return { userId, departmentId };
}
