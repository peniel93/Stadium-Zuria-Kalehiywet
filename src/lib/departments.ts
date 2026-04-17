export type DepartmentSection = {
  title: string;
  description: string;
};

export type DepartmentConfig = {
  slug: string;
  name: string;
  amharicName: string;
  summary: string;
  sections: DepartmentSection[];
};

export const departmentConfigs: DepartmentConfig[] = [
  {
    slug: "medeb-sefer",
    name: "Medeb Sefer",
    amharicName: "መደብ ሰፈር",
    summary:
      "Zone management for members, committees, election notices, and area-level announcements.",
    sections: [
      { title: "Zone members", description: "Searchable member records with photos and roles." },
      { title: "Committees", description: "Current and previous committee terms with service years." },
      { title: "Announcements", description: "Urgent notices, election time updates, and program locations." },
      { title: "Zone check", description: "Quick lookup of the current zone and assigned records." },
    ],
  },
  {
    slug: "children-service",
    name: "Kids and Children Service",
    amharicName: "የልጆች አገልግሎት",
    summary:
      "Children records, age-grouping, classes, teachers, special moments, and program notices.",
    sections: [
      { title: "Children registry", description: "Names, ages, education level, class, and status." },
      { title: "Age groups and classes", description: "Dynamic grouping that admins can expand anytime." },
      { title: "Teachers", description: "Assigned teachers, photos, and mapped sections." },
      { title: "Programs", description: "Annual activities, holidays, and visible time-bound announcements." },
    ],
  },
  {
    slug: "youth-service",
    name: "Youth Service",
    amharicName: "የወጣቶች ዘርፍ",
    summary:
      "Youth profiles, committees, trainings, special moments, and department documents.",
    sections: [
      { title: "Youth profiles", description: "Member names, photos, age group, and status." },
      { title: "Committee history", description: "Current, former, and recent service terms." },
      { title: "Training records", description: "Session history, media, and notes." },
      { title: "Documents", description: "Department file storage and retrieval." },
    ],
  },
];

export function getDepartmentBySlug(slug: string) {
  return departmentConfigs.find((department) => department.slug === slug) ?? null;
}
