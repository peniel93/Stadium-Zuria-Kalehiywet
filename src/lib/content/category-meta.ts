export type CategoryMeta = {
  code: string;
  labelEn: string;
  labelAm: string;
};

export const HOME_CATEGORY_META: CategoryMeta[] = [
  { code: "announcement", labelEn: "Announcement", labelAm: "ማስታወቂያ" },
  { code: "news", labelEn: "News", labelAm: "ዜና" },
  { code: "event", labelEn: "Event", labelAm: "ዝግጅት" },
  { code: "program", labelEn: "Program", labelAm: "ፕሮግራም" },
  { code: "conference", labelEn: "Conference", labelAm: "ኮንፈረንስ" },
  { code: "training", labelEn: "Training", labelAm: "ስልጠና" },
  { code: "vacancy", labelEn: "Vacancy", labelAm: "የስራ እድል" },
];

export const DEFAULT_HOME_CATEGORY_ORDER = HOME_CATEGORY_META.map((item) => item.code);

export function getCategoryMeta(code: string) {
  return HOME_CATEGORY_META.find((item) => item.code === code) ?? HOME_CATEGORY_META[0];
}

export function normalizeCategoryOrder(input: string[] | null | undefined) {
  const cleaned = Array.isArray(input)
    ? input.map((item) => item.trim().toLowerCase()).filter(Boolean)
    : [];

  const known = new Set(HOME_CATEGORY_META.map((item) => item.code));
  const orderedKnown = cleaned.filter((item) => known.has(item));
  const deduped = Array.from(new Set(orderedKnown));

  for (const fallback of DEFAULT_HOME_CATEGORY_ORDER) {
    if (!deduped.includes(fallback)) {
      deduped.push(fallback);
    }
  }

  return deduped;
}
