import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createDashboardMessage,
  listDashboardMessagesForUser,
  reviewDashboardMessage,
} from "@/lib/supabase/admin-advanced-repo";

const allowedRoles = ["super_admin", "global_admin", "department_admin", "editor", "moderator"] as const;

type Scope = "all_admins" | "role" | "department" | "user";

function parseCreateBody(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title) {
    throw new Error("title is required.");
  }

  const recipientScope =
    body.recipientScope === "role" || body.recipientScope === "department" || body.recipientScope === "user"
      ? (body.recipientScope as Scope)
      : "all_admins";

  return {
    recipientScope,
    recipientRoleCode: typeof body.recipientRoleCode === "string" ? body.recipientRoleCode.trim() : null,
    recipientDepartmentId:
      typeof body.recipientDepartmentId === "string" ? body.recipientDepartmentId.trim() : null,
    recipientUserId: typeof body.recipientUserId === "string" ? body.recipientUserId.trim() : null,
    title,
    body: typeof body.body === "string" ? body.body.trim() : null,
    attachmentMediaId: typeof body.attachmentMediaId === "string" ? body.attachmentMediaId.trim() : null,
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();

  if (!auth.user || !hasAnyRole(auth.roles, [...allowedRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to view internal communications.");
  }

  try {
    const rows = await listDashboardMessagesForUser(auth.user.id);
    return apiOk(rows, { count: rows.length });
  } catch (error) {
    return apiError(400, "INTERNAL_COMMUNICATION_LIST_FAILED", "Failed to load messages.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();

  if (!auth.user || !hasAnyRole(auth.roles, [...allowedRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to send internal messages.");
  }

  try {
    const payload = parseCreateBody(await request.json());

    if (payload.recipientScope === "role" && !payload.recipientRoleCode) {
      throw new Error("recipientRoleCode is required for role scope.");
    }

    if (payload.recipientScope === "department" && !payload.recipientDepartmentId) {
      throw new Error("recipientDepartmentId is required for department scope.");
    }

    if (payload.recipientScope === "user" && !payload.recipientUserId) {
      throw new Error("recipientUserId is required for user scope.");
    }

    const row = await createDashboardMessage({
      senderUserId: auth.user.id,
      recipientScope: payload.recipientScope,
      recipientRoleCode: payload.recipientRoleCode,
      recipientDepartmentId: payload.recipientDepartmentId,
      recipientUserId: payload.recipientUserId,
      title: payload.title,
      body: payload.body,
      attachmentMediaId: payload.attachmentMediaId,
    });

    return apiOk(row);
  } catch (error) {
    return apiError(400, "INTERNAL_COMMUNICATION_CREATE_FAILED", "Failed to send message.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();

  if (!auth.user || !hasAnyRole(auth.roles, [...allowedRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to review messages.");
  }

  try {
    const body = (await request.json()) as { messageId?: string };
    const messageId = body.messageId?.trim();

    if (!messageId) {
      throw new Error("messageId is required.");
    }

    const row = await reviewDashboardMessage(messageId, auth.user.id);
    return apiOk(row);
  } catch (error) {
    return apiError(400, "INTERNAL_COMMUNICATION_REVIEW_FAILED", "Failed to review message.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
