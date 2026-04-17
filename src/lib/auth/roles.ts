import "server-only";
import type { User } from "@supabase/supabase-js";
import { appRoles, type AppRole } from "@/lib/auth/app-roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBootstrapSuperAdminEmails } from "@/lib/config/env";

type AuthContext = {
  user: User | null;
  roles: AppRole[];
};

function toAppRoleList(input: unknown): AppRole[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter(
    (item): item is AppRole =>
      typeof item === "string" && (appRoles as readonly string[]).includes(item),
  );
}

async function getRolesFromDatabase(userId: string): Promise<AppRole[]> {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return [];
  }

  const { data, error } = await adminClient
    .from("user_roles")
    .select("roles(code)")
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  const roleCodes = data
    .flatMap((row) => {
      const roleRow = row.roles as { code?: string } | { code?: string }[] | null;

      if (!roleRow) {
        return [];
      }

      if (Array.isArray(roleRow)) {
        return roleRow.map((entry) => entry.code).filter(Boolean) as string[];
      }

      return roleRow.code ? [roleRow.code] : [];
    })
    .filter((value): value is AppRole =>
      (appRoles as readonly string[]).includes(value),
    );

  return Array.from(new Set(roleCodes));
}

async function hasAnySuperAdminAssigned() {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return false;
  }

  const { data: roleRow, error: roleError } = await adminClient
    .from("roles")
    .select("id")
    .eq("code", "super_admin")
    .single();

  if (roleError || !roleRow) {
    return false;
  }

  const { count, error } = await adminClient
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role_id", roleRow.id);

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}

async function ensureSuperAdminRole(userId: string) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return false;
  }

  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      id: userId,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return false;
  }

  let { data: roleRow, error: roleError } = await adminClient
    .from("roles")
    .select("id")
    .eq("code", "super_admin")
    .single();

  if (roleError || !roleRow) {
    const { error: createRoleError } = await adminClient.from("roles").upsert(
      {
        code: "super_admin",
        name: "Super Admin",
      },
      { onConflict: "code" },
    );

    if (createRoleError) {
      return false;
    }

    const roleQuery = await adminClient
      .from("roles")
      .select("id")
      .eq("code", "super_admin")
      .single();

    roleRow = roleQuery.data;
    roleError = roleQuery.error;

    if (roleError || !roleRow) {
      return false;
    }
  }

  const { error } = await adminClient.from("user_roles").upsert(
    {
      user_id: userId,
      role_id: roleRow.id,
    },
    { onConflict: "user_id,role_id" },
  );

  return !error;
}

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { user: null, roles: [] };
  }

  const claimRoles = toAppRoleList(data.user.app_metadata?.roles);
  const dbRoles = await getRolesFromDatabase(data.user.id);
  const roles = Array.from(new Set([...claimRoles, ...dbRoles]));

  const hasSuperAdmin = roles.includes("super_admin");
  const allowlistedEmails = getBootstrapSuperAdminEmails();
  const normalizedEmail = data.user.email?.toLowerCase() ?? "";
  const isAllowlisted = normalizedEmail && allowlistedEmails.includes(normalizedEmail);

  if (!hasSuperAdmin) {
    const anySuperAdminAssigned = await hasAnySuperAdminAssigned();

    if (isAllowlisted || !anySuperAdminAssigned) {
      const assigned = await ensureSuperAdminRole(data.user.id);

      if (assigned) {
        roles.push("super_admin");
      }
    }
  }

  return {
    user: data.user,
    roles,
  };
}

export function hasAnyRole(roles: AppRole[], accepted: AppRole[]) {
  return accepted.some((role) => roles.includes(role));
}
