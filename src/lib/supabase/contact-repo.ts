import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings-repo";

export type ContactMessageStatus = "pending" | "read" | "replied" | "closed";

export type ContactMessageRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  departmentId: string | null;
  recipientEmails: string[];
  status: ContactMessageStatus;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function createContactMessage(input: {
  fullName: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  departmentId?: string | null;
}) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const settings = await getPublicSiteSettings();

  const { data, error } = await adminClient
    .from("contact_messages")
    .insert({
      full_name: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      subject: input.subject ?? null,
      message: input.message,
      department_id: input.departmentId ?? null,
      recipient_emails: settings.contactRecipientEmails,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to submit message.");
  }

  return { id: data.id };
}

export async function listContactMessages(status?: ContactMessageStatus) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return [] as ContactMessageRecord[];
  }

  let query = adminClient
    .from("contact_messages")
    .select("id, full_name, email, phone, subject, message, department_id, recipient_emails, status, admin_reply, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [] as ContactMessageRecord[];
  }

  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    departmentId: row.department_id,
    recipientEmails: row.recipient_emails ?? [],
    status: row.status,
    adminReply: row.admin_reply,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })) as ContactMessageRecord[];
}

export async function updateContactMessage(input: {
  id: string;
  status?: ContactMessageStatus;
  adminReply?: string;
  repliedBy?: string;
}) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.status) {
    payload.status = input.status;
  }

  if (typeof input.adminReply === "string") {
    payload.admin_reply = input.adminReply;
    payload.replied_by = input.repliedBy ?? null;
    payload.replied_at = new Date().toISOString();
    payload.status = "replied";
  }

  const { error } = await adminClient
    .from("contact_messages")
    .update(payload)
    .eq("id", input.id);

  if (error) {
    throw new Error(error.message);
  }

  return { id: input.id };
}
