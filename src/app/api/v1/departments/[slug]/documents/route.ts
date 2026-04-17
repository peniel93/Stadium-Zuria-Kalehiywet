import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  createDepartmentDocument,
  deleteDepartmentDocument,
  listDepartmentDocuments,
  updateDepartmentDocument,
} from "@/lib/supabase/department-documents-repo";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

const adminRoles = ["super_admin", "global_admin", "department_admin", "editor"] as const;

function parseDocumentInput(raw: unknown, publishedBy: string) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const fileMediaId = typeof body.fileMediaId === "string" ? body.fileMediaId.trim() : "";

  if (!title || !fileMediaId) {
    throw new Error("title and fileMediaId are required.");
  }

  return {
    title,
    description:
      typeof body.description === "string" && body.description.trim() ? body.description.trim() : undefined,
    fileMediaId,
    accessScope:
      body.accessScope === "public" ||
      body.accessScope === "members" ||
      body.accessScope === "admins"
        ? body.accessScope
        : "department",
    isLive: body.isLive === true,
    downloadable: body.downloadable !== false,
    liveFrom: typeof body.liveFrom === "string" && body.liveFrom ? body.liveFrom : null,
    liveUntil: typeof body.liveUntil === "string" && body.liveUntil ? body.liveUntil : null,
    publishedBy,
  } as const;
}

export async function GET(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have access to department documents.");
  }

  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const liveOnly = url.searchParams.get("liveOnly") === "true";
    const rows = await listDepartmentDocuments(slug, liveOnly);
    return apiOk(rows, { count: rows.length });
  } catch (error) {
    return apiError(400, "DEPARTMENT_DOCUMENTS_LIST_FAILED", "Failed to load documents.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to create documents.");
  }

  try {
    const { slug } = await params;
    const row = await createDepartmentDocument(slug, parseDocumentInput(await request.json(), auth.user.id));
    return apiOk(row);
  } catch (error) {
    return apiError(400, "DEPARTMENT_DOCUMENT_CREATE_FAILED", "Failed to create document.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to update documents.");
  }

  try {
    const body = (await request.json()) as { documentId?: string };
    const documentId = body.documentId?.trim();

    if (!documentId) {
      throw new Error("documentId is required.");
    }

    const { slug } = await params;
    const row = await updateDepartmentDocument(documentId, slug, parseDocumentInput(body, auth.user.id));
    return apiOk(row);
  } catch (error) {
    return apiError(400, "DEPARTMENT_DOCUMENT_UPDATE_FAILED", "Failed to update document.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  const auth = await getAuthContext();
  if (!auth.user || !hasAnyRole(auth.roles, [...adminRoles])) {
    return apiError(403, "FORBIDDEN", "You do not have permission to delete documents.");
  }

  try {
    const body = (await request.json()) as { documentId?: string };
    const documentId = body.documentId?.trim();

    if (!documentId) {
      throw new Error("documentId is required.");
    }

    const { slug } = await params;
    const row = await deleteDepartmentDocument(documentId, slug);
    return apiOk(row);
  } catch (error) {
    return apiError(400, "DEPARTMENT_DOCUMENT_DELETE_FAILED", "Failed to delete document.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
