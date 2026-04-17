import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_HOME_CATEGORY_ORDER,
  normalizeCategoryOrder,
} from "@/lib/content/category-meta";

export type PublicSiteSettings = {
  siteNameEn: string;
  siteNameAm: string;
  footerDescriptionEn: string;
  footerDescriptionAm: string;
  copyrightEn: string;
  copyrightAm: string;
  contactRecipientEmails: string[];
};

export type PortalCounter = {
  code: string;
  labelEn: string;
  labelAm: string;
  value: number;
  sortOrder: number;
  isActive: boolean;
};

export type PublicPageSlide = {
  headingEn: string;
  headingAm: string;
  textEn: string;
  textAm: string;
};

export type PublicPagesSettings = {
  aboutTitleEn: string;
  aboutDescriptionEn: string;
  aboutBodyEn: string;
  servicesTitleEn: string;
  servicesDescriptionEn: string;
  servicesBodyEn: string;
  contactTitleEn: string;
  contactDescriptionEn: string;
  contactOfficeAddressEn: string;
  contactOfficeHoursEn: string;
  contactPhones: string[];
  contactPublicEmails: string[];
  churchSocialLinks: Array<{ label: string; url: string }>;
  developerTitleEn: string;
  developerDescriptionEn: string;
  developerName: string;
  developerEmail: string;
  developerPhone: string;
  developerSocialLinks: Array<{ label: string; url: string }>;
  homeSlides: PublicPageSlide[];
  homeCategoryOrder: string[];
  homeCategoryLimits: Record<string, number>;
};

const DEFAULT_PUBLIC_SITE_SETTINGS: PublicSiteSettings = {
  siteNameEn: "Durame Stadium Zuria Kalehiywet Church Portal",
  siteNameAm: "ዱራሜ ስታዲየም ዙሪያ ቃለሕይወት ቤተክርስቲያን ፖርታል",
  footerDescriptionEn: "Dynamic church portal for announcements, programs, teams, and administration.",
  footerDescriptionAm: "ለማስታወቂያ፣ ፕሮግራሞች፣ ቡድኖች እና አስተዳደር የተዘጋጀ ተለዋዋጭ የቤተክርስቲያን ፖርታል።",
  copyrightEn: "All rights reserved.",
  copyrightAm: "መብቱ የተጠበቀ ነው።",
  contactRecipientEmails: ["admin@dsz-kalehiywetchurch.org"],
};

const DEFAULT_COUNTERS: PortalCounter[] = [
  { code: "missionaries_count", labelEn: "Missionaries Count", labelAm: "የሚስዮናውያን ብዛት", value: 0, sortOrder: 10, isActive: true },
  { code: "evangelists_count", labelEn: "Evangelists Count", labelAm: "የወንጌላውያን ብዛት", value: 0, sortOrder: 20, isActive: true },
  { code: "full_time_servants_count", labelEn: "Full-Time Servants Count", labelAm: "የሙሉ ጊዜ አገልጋዮች ብዛት", value: 0, sortOrder: 30, isActive: true },
  { code: "medeb_sefers_count", labelEn: "Number Medeb Sefers Count", labelAm: "የመደብ ሰፈሮች ብዛት", value: 0, sortOrder: 40, isActive: true },
  { code: "childrens_count", labelEn: "Childrens Count", labelAm: "የልጆች ብዛት", value: 0, sortOrder: 50, isActive: true },
];

const DEFAULT_PUBLIC_PAGES: PublicPagesSettings = {
  aboutTitleEn: "About Our Church",
  aboutDescriptionEn:
    "Durame Stadium Zuria Kalehiywet Church exists to disciple believers, serve families, and strengthen communities through worship, teaching, and practical love.",
  aboutBodyEn:
    "Vision: Build a Christ-centered church where every generation grows in faith and service.\n\nMission: Proclaim the Gospel, train leaders, care for members, and plant healthy church communities.\n\nCore Values: Scripture, prayer, holiness, stewardship, unity, and compassion-led ministry.",
  servicesTitleEn: "Church Services",
  servicesDescriptionEn:
    "Explore worship gatherings, discipleship programs, and ministries available throughout the week.",
  servicesBodyEn:
    "Main Worship Service: Sunday worship, sermon, and congregational prayer for all members and visitors.\n\nPrayer and Intercession: Midweek and special prayer sessions focused on spiritual renewal and church mission.\n\nChildren and Youth Programs: Age-based classes, mentorship, and leadership development for younger generations.\n\nTraining and Education: Faith foundations, ministry skills, and practical courses for workers and members.",
  contactTitleEn: "Contact",
  contactDescriptionEn:
    "Reach the church office and department leaders for prayer support, ministry inquiries, and member services.",
  contactOfficeAddressEn: "Durame, Kembata Tembaro Zone",
  contactOfficeHoursEn: "Monday to Friday, 8:30 AM to 5:00 PM",
  contactPhones: ["+251 900 000 000", "+251 911 000 000"],
  contactPublicEmails: ["info@dsz-kalehiywetchurch.org", "admin@dsz-kalehiywetchurch.org"],
  churchSocialLinks: [
    { label: "Facebook", url: "https://facebook.com" },
    { label: "Telegram", url: "https://t.me" },
  ],
  developerTitleEn: "About The Developer",
  developerDescriptionEn:
    "This portal is engineered for scalable church operations with role-based access, media workflows, and department-level management.",
  developerName: "Portal Engineering Team",
  developerEmail: "admin@dsz-kalehiywetchurch.org",
  developerPhone: "+251900000000",
  developerSocialLinks: [
    { label: "Website", url: "https://example.com" },
    { label: "Telegram", url: "https://t.me/example" },
  ],
  homeSlides: [
    {
      headingEn: "One Dynamic Portal For Every Department",
      headingAm: "ለሁሉም ዘርፎች አንድ ተለዋዋጭ ፖርታል",
      textEn: "Announcements, trainings, vacancies, and church updates from one coordinated system.",
      textAm: "ማስታወቂያዎች፣ ስልጠናዎች፣ የስራ እድሎች እና የቤተክርስቲያን ማሻሻያዎች ከአንድ የተደራጀ ስርዓት።",
    },
    {
      headingEn: "Super Admin Plus Department Dashboards",
      headingAm: "ዋና አስተዳዳሪ እና የዘርፍ ዳሽቦርዶች",
      textEn: "Permission-based management to simplify operations and reduce manual overhead.",
      textAm: "በፈቃድ መቆጣጠሪያ ላይ የተመሰረተ አስተዳደር ሂደቶችን ለማቀላጠፍ እና የእጅ ስራን ለመቀነስ።",
    },
    {
      headingEn: "Web First, Mobile Ready",
      headingAm: "መጀመሪያ ድር ከዚያ ሞባይል ዝግጁ",
      textEn: "Built in React architecture that transitions smoothly to React Native APK builds.",
      textAm: "በReact አቀማመጥ የተገነባ ስርዓት ወደ React Native APK ግንባታ በቀላሉ ይተላለፋል።",
    },
  ],
  homeCategoryOrder: DEFAULT_HOME_CATEGORY_ORDER,
  homeCategoryLimits: {},
};

function parsePublicPagesSettings(value: unknown): PublicPagesSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_PUBLIC_PAGES;
  }

  const raw = value as Record<string, unknown>;
  const text = (input: unknown, fallback: string) =>
    typeof input === "string" && input.trim() ? input.trim() : fallback;

  const contactPhones = Array.isArray(raw.contactPhones)
    ? raw.contactPhones.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : DEFAULT_PUBLIC_PAGES.contactPhones;

  const contactPublicEmails = Array.isArray(raw.contactPublicEmails)
    ? raw.contactPublicEmails.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : DEFAULT_PUBLIC_PAGES.contactPublicEmails;

  const parseSocialLinks = (value: unknown, fallback: Array<{ label: string; url: string }>) =>
    Array.isArray(value)
      ? value
          .filter(
            (item): item is { label: string; url: string } =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as { label?: unknown }).label === "string" &&
              typeof (item as { url?: unknown }).url === "string",
          )
          .map((item) => ({ label: item.label.trim(), url: item.url.trim() }))
          .filter((item) => item.label && item.url)
      : fallback;

  const churchSocialLinks = parseSocialLinks(raw.churchSocialLinks, DEFAULT_PUBLIC_PAGES.churchSocialLinks);
  const developerSocialLinks = parseSocialLinks(raw.developerSocialLinks, DEFAULT_PUBLIC_PAGES.developerSocialLinks);

  const homeSlides = Array.isArray(raw.homeSlides)
    ? raw.homeSlides
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item, index) => ({
          headingEn: text(item.headingEn, DEFAULT_PUBLIC_PAGES.homeSlides[index]?.headingEn ?? ""),
          headingAm: text(item.headingAm, DEFAULT_PUBLIC_PAGES.homeSlides[index]?.headingAm ?? ""),
          textEn: text(item.textEn, DEFAULT_PUBLIC_PAGES.homeSlides[index]?.textEn ?? ""),
          textAm: text(item.textAm, DEFAULT_PUBLIC_PAGES.homeSlides[index]?.textAm ?? ""),
        }))
        .filter((slide) => slide.headingEn && slide.textEn)
    : DEFAULT_PUBLIC_PAGES.homeSlides;

  const homeCategoryOrder = normalizeCategoryOrder(
    Array.isArray(raw.homeCategoryOrder)
      ? raw.homeCategoryOrder.filter((item): item is string => typeof item === "string")
      : DEFAULT_PUBLIC_PAGES.homeCategoryOrder,
  );

  const homeCategoryLimits =
    raw.homeCategoryLimits && typeof raw.homeCategoryLimits === "object"
      ? Object.fromEntries(
          Object.entries(raw.homeCategoryLimits as Record<string, unknown>)
            .map(([code, value]) => [code.trim().toLowerCase(), Number(value)])
            .filter(([code, value]) => Boolean(code) && Number.isFinite(value) && value > 0)
            .map(([code, value]) => [code, Math.min(20, Math.floor(value))]),
        )
      : DEFAULT_PUBLIC_PAGES.homeCategoryLimits;

  return {
    aboutTitleEn: text(raw.aboutTitleEn, DEFAULT_PUBLIC_PAGES.aboutTitleEn),
    aboutDescriptionEn: text(raw.aboutDescriptionEn, DEFAULT_PUBLIC_PAGES.aboutDescriptionEn),
    aboutBodyEn: text(raw.aboutBodyEn, DEFAULT_PUBLIC_PAGES.aboutBodyEn),
    servicesTitleEn: text(raw.servicesTitleEn, DEFAULT_PUBLIC_PAGES.servicesTitleEn),
    servicesDescriptionEn: text(raw.servicesDescriptionEn, DEFAULT_PUBLIC_PAGES.servicesDescriptionEn),
    servicesBodyEn: text(raw.servicesBodyEn, DEFAULT_PUBLIC_PAGES.servicesBodyEn),
    contactTitleEn: text(raw.contactTitleEn, DEFAULT_PUBLIC_PAGES.contactTitleEn),
    contactDescriptionEn: text(raw.contactDescriptionEn, DEFAULT_PUBLIC_PAGES.contactDescriptionEn),
    contactOfficeAddressEn: text(raw.contactOfficeAddressEn, DEFAULT_PUBLIC_PAGES.contactOfficeAddressEn),
    contactOfficeHoursEn: text(raw.contactOfficeHoursEn, DEFAULT_PUBLIC_PAGES.contactOfficeHoursEn),
    contactPhones,
    contactPublicEmails,
    churchSocialLinks,
    developerTitleEn: text(raw.developerTitleEn, DEFAULT_PUBLIC_PAGES.developerTitleEn),
    developerDescriptionEn: text(raw.developerDescriptionEn, DEFAULT_PUBLIC_PAGES.developerDescriptionEn),
    developerName: text(raw.developerName, DEFAULT_PUBLIC_PAGES.developerName),
    developerEmail: text(raw.developerEmail, DEFAULT_PUBLIC_PAGES.developerEmail),
    developerPhone: text(raw.developerPhone, DEFAULT_PUBLIC_PAGES.developerPhone),
    developerSocialLinks,
    homeSlides: homeSlides.length > 0 ? homeSlides : DEFAULT_PUBLIC_PAGES.homeSlides,
    homeCategoryOrder,
    homeCategoryLimits,
  };
}

function parseSettings(value: unknown): PublicSiteSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_PUBLIC_SITE_SETTINGS;
  }

  const raw = value as Record<string, unknown>;
  const toText = (input: unknown, fallback: string) =>
    typeof input === "string" && input.trim() ? input.trim() : fallback;

  const contactRecipientEmails = Array.isArray(raw.contactRecipientEmails)
    ? raw.contactRecipientEmails.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : DEFAULT_PUBLIC_SITE_SETTINGS.contactRecipientEmails;

  return {
    siteNameEn: toText(raw.siteNameEn, DEFAULT_PUBLIC_SITE_SETTINGS.siteNameEn),
    siteNameAm: toText(raw.siteNameAm, DEFAULT_PUBLIC_SITE_SETTINGS.siteNameAm),
    footerDescriptionEn: toText(raw.footerDescriptionEn, DEFAULT_PUBLIC_SITE_SETTINGS.footerDescriptionEn),
    footerDescriptionAm: toText(raw.footerDescriptionAm, DEFAULT_PUBLIC_SITE_SETTINGS.footerDescriptionAm),
    copyrightEn: toText(raw.copyrightEn, DEFAULT_PUBLIC_SITE_SETTINGS.copyrightEn),
    copyrightAm: toText(raw.copyrightAm, DEFAULT_PUBLIC_SITE_SETTINGS.copyrightAm),
    contactRecipientEmails,
  };
}

export async function getPublicSiteSettings() {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return DEFAULT_PUBLIC_SITE_SETTINGS;
  }

  const { data, error } = await adminClient
    .from("portal_settings")
    .select("value_json")
    .eq("key", "public_site")
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_PUBLIC_SITE_SETTINGS;
  }

  return parseSettings(data.value_json);
}

export async function upsertPublicSiteSettings(input: PublicSiteSettings, updatedBy?: string) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const payload = {
    key: "public_site",
    value_json: {
      siteNameEn: input.siteNameEn,
      siteNameAm: input.siteNameAm,
      footerDescriptionEn: input.footerDescriptionEn,
      footerDescriptionAm: input.footerDescriptionAm,
      copyrightEn: input.copyrightEn,
      copyrightAm: input.copyrightAm,
      contactRecipientEmails: input.contactRecipientEmails,
    },
    updated_by: updatedBy ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await adminClient
    .from("portal_settings")
    .upsert(payload, { onConflict: "key" });

  if (error) {
    throw new Error(error.message);
  }

  return getPublicSiteSettings();
}

export async function listPortalCounters() {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return DEFAULT_COUNTERS;
  }

  const { data, error } = await adminClient
    .from("portal_counters")
    .select("code, label_en, label_am, value, sort_order, is_active")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return DEFAULT_COUNTERS;
  }

  return data.map((row) => ({
    code: row.code,
    labelEn: row.label_en,
    labelAm: row.label_am,
    value: row.value,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  })) as PortalCounter[];
}

export async function upsertPortalCounter(
  input: {
    code: string;
    labelEn: string;
    labelAm: string;
    value: number;
    sortOrder?: number;
    isActive?: boolean;
  },
  updatedBy?: string,
) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { error } = await adminClient.from("portal_counters").upsert(
    {
      code: input.code,
      label_en: input.labelEn,
      label_am: input.labelAm,
      value: input.value,
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "code" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return listPortalCounters();
}

export async function getPublicPagesSettings() {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return DEFAULT_PUBLIC_PAGES;
  }

  const { data, error } = await adminClient
    .from("portal_settings")
    .select("value_json")
    .eq("key", "public_pages")
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_PUBLIC_PAGES;
  }

  return parsePublicPagesSettings(data.value_json);
}

export async function upsertPublicPagesSettings(input: PublicPagesSettings, updatedBy?: string) {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { error } = await adminClient.from("portal_settings").upsert(
    {
      key: "public_pages",
      value_json: input,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return getPublicPagesSettings();
}
