import { apiError, apiOk } from "@/lib/api/response";
import { isSupabaseConfigured } from "@/lib/config/env";
import { listLiveDocuments } from "@/lib/supabase/department-documents-repo";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    const rows = await listLiveDocuments();
    return apiOk(rows, { count: rows.length });
  } catch (error) {
    return apiError(400, "LIVE_DOCUMENTS_LIST_FAILED", "Failed to load live documents.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
