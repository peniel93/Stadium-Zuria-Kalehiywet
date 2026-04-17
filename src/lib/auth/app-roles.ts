export const appRoles = [
  "super_admin",
  "global_admin",
  "department_admin",
  "church_leader",
  "youth_leader",
  "women_leader",
  "education_worker",
  "choir_leader",
  "team_leader",
  "hr_staff",
  "pastor",
  "evangelist",
  "full_timer",
  "employee",
  "missionary",
  "editor",
  "moderator",
  "member",
] as const;

export type AppRole = (typeof appRoles)[number];
