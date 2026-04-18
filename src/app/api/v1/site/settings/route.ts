import { apiError, apiOk } from "@/lib/api/response";
import { getAuthContext, hasAnyRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config/env";
import { normalizeCategoryOrder } from "@/lib/content/category-meta";
import {
  getPublicPagesSettings,
  getPublicSiteSettings,
  listPortalCounters,
  upsertPublicPagesSettings,
  upsertPortalCounter,
  upsertPublicSiteSettings,
} from "@/lib/supabase/site-settings-repo";

const adminRoles = ["super_admin", "global_admin"] as const;

function parseSettingsBody(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

  const emails = Array.isArray(body.contactRecipientEmails)
    ? body.contactRecipientEmails.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  return {
    siteNameEn: text(body.siteNameEn),
    siteNameAm: text(body.siteNameAm),
    footerDescriptionEn: text(body.footerDescriptionEn),
    footerDescriptionAm: text(body.footerDescriptionAm),
    copyrightEn: text(body.copyrightEn),
    copyrightAm: text(body.copyrightAm),
    contactRecipientEmails: emails,
  };
}

function parseCounterBody(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const labelEn = typeof body.labelEn === "string" ? body.labelEn.trim() : "";
  const labelAm = typeof body.labelAm === "string" ? body.labelAm.trim() : "";
  const value = typeof body.value === "number" ? body.value : Number(body.value ?? 0);

  if (!code || !labelEn || !labelAm || Number.isNaN(value)) {
    throw new Error("code, labelEn, labelAm, and numeric value are required.");
  }

  return {
    code,
    labelEn,
    labelAm,
    value,
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    isActive: body.isActive !== false,
  };
}

function parsePublicPagesBody(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;

  const toText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const toStringArray = (value: unknown) =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];

  const socialLinks = Array.isArray(body.developerSocialLinks)
    ? body.developerSocialLinks
        .filter(
          (item): item is { label: string; url: string } =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as { label?: unknown }).label === "string" &&
            typeof (item as { url?: unknown }).url === "string",
        )
        .map((item) => ({ label: item.label.trim(), url: item.url.trim() }))
    : [];

  const churchSocialLinks = Array.isArray(body.churchSocialLinks)
    ? body.churchSocialLinks
        .filter(
          (item): item is { label: string; url: string } =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as { label?: unknown }).label === "string" &&
            typeof (item as { url?: unknown }).url === "string",
        )
        .map((item) => ({ label: item.label.trim(), url: item.url.trim() }))
    : [];

  const homeSlides = Array.isArray(body.homeSlides)
    ? body.homeSlides
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => ({
          headingEn: toText(item.headingEn),
          headingAm: toText(item.headingAm),
          textEn: toText(item.textEn),
          textAm: toText(item.textAm),
        }))
    : [];

  const homeCategoryOrder = normalizeCategoryOrder(
    Array.isArray(body.homeCategoryOrder)
      ? body.homeCategoryOrder.filter((item): item is string => typeof item === "string")
      : [],
  );

  const homeCategoryLimits =
    body.homeCategoryLimits && typeof body.homeCategoryLimits === "object"
      ? Object.fromEntries(
          Object.entries(body.homeCategoryLimits as Record<string, unknown>)
            .map(([code, value]) => [code.trim().toLowerCase(), Number(value)])
            .filter(([code, value]) => {
              if (!code || !Number.isFinite(value)) {
                return false;
              }
              return Number(value) > 0;
            })
            .map(([code, value]) => [code, Math.min(20, Math.floor(Number(value)))]),
        )
      : {};

  return {
    aboutTitleEn: toText(body.aboutTitleEn),
    aboutDescriptionEn: toText(body.aboutDescriptionEn),
    aboutBodyEn: toText(body.aboutBodyEn),
    servicesTitleEn: toText(body.servicesTitleEn),
    servicesDescriptionEn: toText(body.servicesDescriptionEn),
    servicesBodyEn: toText(body.servicesBodyEn),
    contactTitleEn: toText(body.contactTitleEn),
    contactDescriptionEn: toText(body.contactDescriptionEn),
    contactOfficeAddressEn: toText(body.contactOfficeAddressEn),
    contactOfficeHoursEn: toText(body.contactOfficeHoursEn),
    contactPhones: toStringArray(body.contactPhones),
    contactPublicEmails: toStringArray(body.contactPublicEmails),
    churchSocialLinks,
    developerTitleEn: toText(body.developerTitleEn),
    developerDescriptionEn: toText(body.developerDescriptionEn),
    developerName: toText(body.developerName),
    developerEmail: toText(body.developerEmail),
    developerPhone: toText(body.developerPhone),
    developerSocialLinks: socialLinks,
    homeSlides,
    homeCategoryOrder,
    homeCategoryLimits,
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    const [settings, counters, publicPages] = await Promise.all([
      getPublicSiteSettings(),
      listPortalCounters(),
      getPublicPagesSettings(),
    ]);

    return apiOk({ settings, counters, publicPages });
  } catch (error) {
    return apiError(400, "SITE_SETTINGS_LIST_FAILED", "Failed to load site settings.", {
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
    return apiError(403, "FORBIDDEN", "You do not have permission to update site settings.");
  }

  try {
    const raw = await request.json();
    const action = (raw as { action?: string }).action;

    if (action === "upsert-counter") {
      const counter = parseCounterBody(raw);
      const data = await upsertPortalCounter(counter, authContext.user.id);
      return apiOk({ counters: data });
    }

    if (action === "upsert-public-pages") {
      const publicPages = parsePublicPagesBody(raw);
      const data = await upsertPublicPagesSettings(publicPages, authContext.user.id);
      return apiOk({ publicPages: data });
    }

    const settings = parseSettingsBody(raw);
    const data = await upsertPublicSiteSettings(settings, authContext.user.id);
    return apiOk({ settings: data });
  } catch (error) {
    return apiError(400, "SITE_SETTINGS_UPDATE_FAILED", "Failed to update site settings.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
