import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createChurchMember,
  deleteChurchMember,
  listChurchMembers,
  updateChurchMember,
} from "@/lib/supabase/member-registry-repo";

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

function parseMemberInput(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";

  if (!fullName) {
    throw new Error("fullName is required.");
  }

  return {
    fullName,
    photoMediaId:
      typeof body.photoMediaId === "string" && body.photoMediaId.trim() ? body.photoMediaId.trim() : null,
    contactPhone:
      typeof body.contactPhone === "string" && body.contactPhone.trim() ? body.contactPhone.trim() : undefined,
    contactEmail:
      typeof body.contactEmail === "string" && body.contactEmail.trim() ? body.contactEmail.trim() : undefined,
    address: typeof body.address === "string" && body.address.trim() ? body.address.trim() : undefined,
    medebSeferZone:
      typeof body.medebSeferZone === "string" && body.medebSeferZone.trim() ? body.medebSeferZone.trim() : undefined,
    roleLabel:
      typeof body.roleLabel === "string" && body.roleLabel.trim() ? body.roleLabel.trim() : undefined,
    categoryId:
      typeof body.categoryId === "string" && body.categoryId.trim() ? body.categoryId.trim() : null,
    educationStatus:
      typeof body.educationStatus === "string" && body.educationStatus.trim() ? body.educationStatus.trim() : undefined,
    occupationStatus:
      typeof body.occupationStatus === "string" && body.occupationStatus.trim() ? body.occupationStatus.trim() : undefined,
    marriageStatus:
      typeof body.marriageStatus === "string" && body.marriageStatus.trim() ? body.marriageStatus.trim() : undefined,
    studentStage:
      typeof body.studentStage === "string" && body.studentStage.trim() ? body.studentStage.trim() : undefined,
    employmentType:
      typeof body.employmentType === "string" && body.employmentType.trim() ? body.employmentType.trim() : undefined,
    status:
      body.status === "inactive" || body.status === "moved" || body.status === "archived"
        ? body.status
        : "active",
  } as const;
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have access to members registry.");
  }

  try {
    const url = new URL(request.url);
    const rows = await listChurchMembers({
      q: url.searchParams.get("q") ?? undefined,
      zone: url.searchParams.get("zone") ?? undefined,
      categoryId: url.searchParams.get("categoryId") ?? undefined,
      roleLabel: url.searchParams.get("roleLabel") ?? undefined,
      status:
        (url.searchParams.get("status") as
          | "all"
          | "active"
          | "inactive"
          | "moved"
          | "archived"
          | null) ?? "all",
    });

    return apiOk(rows, { count: rows.length });
  } catch (error) {
    return apiError(400, "MEMBERS_LIST_FAILED", "Failed to load members.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to create members.");
  }

  try {
    const payload = parseMemberInput(await request.json());
    const row = await createChurchMember(payload);
    return apiOk(row);
  } catch (error) {
    return apiError(400, "MEMBER_CREATE_FAILED", "Failed to create member.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to update members.");
  }

  try {
    const body = (await request.json()) as { memberId?: string };
    const memberId = body.memberId?.trim();

    if (!memberId) {
      throw new Error("memberId is required.");
    }

    const row = await updateChurchMember(memberId, parseMemberInput(body));
    return apiOk(row);
  } catch (error) {
    return apiError(400, "MEMBER_UPDATE_FAILED", "Failed to update member.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to delete members.");
  }

  try {
    const body = (await request.json()) as { memberId?: string };
    const memberId = body.memberId?.trim();

    if (!memberId) {
      throw new Error("memberId is required.");
    }

    const row = await deleteChurchMember(memberId);
    return apiOk(row);
  } catch (error) {
    return apiError(400, "MEMBER_DELETE_FAILED", "Failed to delete member.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
