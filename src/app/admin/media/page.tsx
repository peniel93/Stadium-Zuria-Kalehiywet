import { MediaManager } from "@/components/media-manager";
import { LogoutButton } from "@/components/logout-button";
import { DashboardShell } from "@/components/dashboard-shell";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";

const mediaRoles = ["super_admin", "global_admin", "department_admin", "editor"] as const;

export default async function MediaAdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Media Library</h1>
        <p>Set up Supabase environment variables to use this dashboard.</p>
      </main>
    );
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...mediaRoles])) {
    return (
      <main style={{ padding: "2rem", fontFamily: "var(--font-body)" }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to access media management.</p>
      </main>
    );
  }

  return (
    <DashboardShell
      title={{ en: "Media Library", am: "የሚዲያ ማዕከል" }}
      description={{
        en: "Upload and register files for use in members, posts, and department pages.",
        am: "ለአባላት፣ ልጥፎች እና የዘርፍ ገጾች ጥቅም የሚውሉ ፋይሎችን አስገቡ እና ይመዝግቡ።",
      }}
      action={<LogoutButton />}
    >
      <MediaManager title="Global Media Library" />
    </DashboardShell>
  );
}
