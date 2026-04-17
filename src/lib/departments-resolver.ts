import { departmentConfigs, getDepartmentBySlug, type DepartmentConfig } from "@/lib/departments";
import { getDepartmentByCode } from "@/lib/supabase/departments-repo";

export async function resolveDepartmentForDashboard(slug: string): Promise<DepartmentConfig | null> {
  const fromStatic = getDepartmentBySlug(slug);

  if (fromStatic) {
    return fromStatic;
  }

  const fromDb = await getDepartmentByCode(slug);

  if (!fromDb) {
    return null;
  }

  return {
    slug: fromDb.code,
    name: fromDb.nameEn,
    amharicName: fromDb.nameAm,
    summary: fromDb.description ?? "Department dashboard and operational modules.",
    sections:
      departmentConfigs.find((item) => item.slug === fromDb.code)?.sections ?? [],
  };
}
