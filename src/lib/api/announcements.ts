import type { AppRole } from "@/lib/auth/roles";

export const announcementWriteRoles: AppRole[] = [
  "super_admin",
  "global_admin",
  "department_admin",
  "editor",
];

export const announcementPriority = ["low", "normal", "high", "urgent"] as const;
export type AnnouncementPriority = (typeof announcementPriority)[number];

export type AnnouncementCreateInput = {
  departmentId?: string | null;
  categoryCode?: string;
  featuredMediaId?: string | null;
  title: {
    en: string;
    am?: string;
  };
  body: {
    en: string;
    am?: string;
  };
  visibilityScope?: "public" | "members" | "admins";
  publishAt?: string | null;
  expiresAt?: string | null;
  priority?: AnnouncementPriority;
  pinToHome?: boolean;
  showOnMainBoard?: boolean;
  countdownEnabled?: boolean;
};

export function parseAnnouncementInput(raw: unknown): AnnouncementCreateInput {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid payload.");
  }

  const body = raw as Record<string, unknown>;
  const title = body.title as Record<string, unknown> | undefined;
  const content = body.body as Record<string, unknown> | undefined;

  const titleEn = typeof title?.en === "string" ? title.en.trim() : "";
  const bodyEn = typeof content?.en === "string" ? content.en.trim() : "";

  if (!titleEn || !bodyEn) {
    throw new Error("title.en and body.en are required.");
  }

  const visibilityScope =
    body.visibilityScope === "members" || body.visibilityScope === "admins"
      ? body.visibilityScope
      : "public";

  const priorityValue =
    typeof body.priority === "string" &&
    (announcementPriority as readonly string[]).includes(body.priority)
      ? (body.priority as AnnouncementPriority)
      : "normal";

  const publishAt = typeof body.publishAt === "string" ? body.publishAt : null;
  const expiresAt = typeof body.expiresAt === "string" ? body.expiresAt : null;

  if (publishAt && expiresAt) {
    const publishDate = new Date(publishAt);
    const expireDate = new Date(expiresAt);

    if (Number.isNaN(publishDate.getTime()) || Number.isNaN(expireDate.getTime())) {
      throw new Error("publishAt and expiresAt must be valid ISO date strings.");
    }

    if (expireDate <= publishDate) {
      throw new Error("expiresAt must be later than publishAt.");
    }
  }

  return {
    departmentId: typeof body.departmentId === "string" ? body.departmentId : null,
    categoryCode: typeof body.categoryCode === "string" ? body.categoryCode.trim().toLowerCase() : "announcement",
    featuredMediaId: typeof body.featuredMediaId === "string" && body.featuredMediaId.trim() ? body.featuredMediaId.trim() : null,
    title: {
      en: titleEn,
      am: typeof title?.am === "string" ? title.am.trim() : undefined,
    },
    body: {
      en: bodyEn,
      am: typeof content?.am === "string" ? content.am.trim() : undefined,
    },
    visibilityScope,
    publishAt,
    expiresAt,
    priority: priorityValue,
    pinToHome: body.pinToHome === true,
    showOnMainBoard: body.showOnMainBoard !== false,
    countdownEnabled: body.countdownEnabled === true,
  };
}
