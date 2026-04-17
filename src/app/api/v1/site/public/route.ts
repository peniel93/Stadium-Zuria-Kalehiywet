import { apiError, apiOk } from "@/lib/api/response";
import { isSupabaseConfigured } from "@/lib/config/env";
import { listDepartments } from "@/lib/supabase/departments-repo";
import {
  getPublicPagesSettings,
  getPublicSiteSettings,
  listPortalCounters,
} from "@/lib/supabase/site-settings-repo";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    const [settings, counters, departments, publicPages] = await Promise.all([
      getPublicSiteSettings(),
      listPortalCounters(),
      listDepartments(),
      getPublicPagesSettings(),
    ]);

    return apiOk({
      settings: {
        siteNameEn: settings.siteNameEn,
        siteNameAm: settings.siteNameAm,
        footerDescriptionEn: settings.footerDescriptionEn,
        footerDescriptionAm: settings.footerDescriptionAm,
        copyrightEn: settings.copyrightEn,
        copyrightAm: settings.copyrightAm,
      },
      counters,
      departments,
      publicPages,
    });
  } catch (error) {
    return apiError(400, "PUBLIC_SITE_DATA_FAILED", "Failed to load public site data.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
