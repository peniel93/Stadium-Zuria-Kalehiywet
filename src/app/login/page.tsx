import { redirect } from "next/navigation";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import { AuthForm } from "@/components/auth-form";

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

export default async function LoginPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ width: "min(1180px, calc(100% - 2rem))", margin: "1rem auto 2rem" }}>
        <AuthForm />
      </main>
    );
  }

  const authContext = await getAuthContext();

  if (authContext.user && hasAnyRole(authContext.roles, [...adminRoles])) {
    redirect("/admin");
  }

  return (
    <main style={{ width: "min(1180px, calc(100% - 2rem))", margin: "1rem auto 2rem" }}>
      <AuthForm />
    </main>
  );
}
