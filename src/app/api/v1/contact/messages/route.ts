import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createContactMessage,
  listContactMessages,
  updateContactMessage,
  type ContactMessageStatus,
} from "@/lib/supabase/contact-repo";

const adminRoles = ["super_admin", "global_admin", "department_admin"] as const;

function parseCreateBody(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!fullName || !email || !message) {
    throw new Error("fullName, email, and message are required.");
  }

  return {
    fullName,
    email,
    phone: typeof body.phone === "string" ? body.phone.trim() : undefined,
    subject: typeof body.subject === "string" ? body.subject.trim() : undefined,
    message,
    departmentId:
      typeof body.departmentId === "string" && body.departmentId.trim()
        ? body.departmentId.trim()
        : null,
  };
}

function parsePatchBody(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id.trim() : "";

  if (!id) {
    throw new Error("id is required.");
  }

  const status =
    body.status === "pending" ||
    body.status === "read" ||
    body.status === "replied" ||
    body.status === "closed"
      ? (body.status as ContactMessageStatus)
      : undefined;

  return {
    id,
    status,
    adminReply: typeof body.adminReply === "string" ? body.adminReply.trim() : undefined,
  };
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to view contact messages.");
  }

  try {
    const url = new URL(request.url);
    const statusRaw = url.searchParams.get("status");
    const status =
      statusRaw === "pending" || statusRaw === "read" || statusRaw === "replied" || statusRaw === "closed"
        ? (statusRaw as ContactMessageStatus)
        : undefined;

    const items = await listContactMessages(status);
    return apiOk(items, { count: items.length });
  } catch (error) {
    return apiError(400, "CONTACT_MESSAGES_LIST_FAILED", "Failed to load contact messages.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    const payload = parseCreateBody(await request.json());
    const created = await createContactMessage(payload);
    return apiOk(created);
  } catch (error) {
    return apiError(400, "CONTACT_MESSAGE_CREATE_FAILED", "Failed to submit your message.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const authContext = await getAuthContext();

  if (!authContext.user || !hasAnyRole(authContext.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to update contact messages.");
  }

  try {
    const body = parsePatchBody(await request.json());
    const data = await updateContactMessage({
      ...body,
      repliedBy: authContext.user.id,
    });

    return apiOk(data);
  } catch (error) {
    return apiError(400, "CONTACT_MESSAGE_UPDATE_FAILED", "Failed to update message state.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
