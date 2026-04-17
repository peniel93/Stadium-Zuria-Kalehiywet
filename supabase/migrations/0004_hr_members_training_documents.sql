-- HR, members registry, children grades, training dashboard, and live documents support.

create table if not exists public.hr_workers (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete set null,
  full_name text not null,
  photo_media_id uuid references public.media_assets(id) on delete set null,
  contact_phone text,
  contact_email text,
  post_title text,
  salary_amount numeric(12, 2),
  education_level text,
  employment_status text not null default 'active' check (employment_status in ('active', 'inactive', 'on_leave', 'replaced', 'retired')),
  role_label text,
  medeb_sefer_zone text,
  joined_on date,
  replaced_by_worker_id uuid references public.hr_workers(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.church_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  photo_media_id uuid references public.media_assets(id) on delete set null,
  contact_phone text,
  contact_email text,
  address text,
  medeb_sefer_zone text,
  role_label text,
  category_id uuid references public.member_categories(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive', 'moved', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.children_grades (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children_profiles(id) on delete cascade,
  subject text not null,
  term_label text not null,
  age_group text,
  score numeric(5, 2),
  grade_letter text,
  teacher_name text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, subject, term_label)
);

create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete set null,
  code text unique,
  title text not null,
  description text,
  course_status text not null default 'draft' check (course_status in ('draft', 'open', 'closed')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  participant_type text not null check (participant_type in ('teacher', 'student')),
  education_level text,
  contact_phone text,
  contact_email text,
  photo_media_id uuid references public.media_assets(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_course_participants (
  course_id uuid not null references public.training_courses(id) on delete cascade,
  participant_id uuid not null references public.training_participants(id) on delete cascade,
  role_in_course text not null check (role_in_course in ('teacher', 'student')),
  created_at timestamptz not null default now(),
  primary key (course_id, participant_id)
);

create table if not exists public.training_grades (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  student_participant_id uuid not null references public.training_participants(id) on delete cascade,
  teacher_participant_id uuid references public.training_participants(id) on delete set null,
  assessment_title text not null,
  score numeric(5, 2),
  grade_letter text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.department_documents
  add column if not exists is_live boolean not null default false,
  add column if not exists downloadable boolean not null default true,
  add column if not exists live_from timestamptz,
  add column if not exists live_until timestamptz,
  add column if not exists published_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_hr_workers_department on public.hr_workers (department_id, employment_status, medeb_sefer_zone);
create index if not exists idx_church_members_filters on public.church_members (status, medeb_sefer_zone, category_id, role_label);
create index if not exists idx_children_grades_child on public.children_grades (child_id, term_label, subject);
create index if not exists idx_training_courses_status on public.training_courses (course_status, start_date);
create index if not exists idx_training_grades_course on public.training_grades (course_id, student_participant_id);
create index if not exists idx_department_documents_live on public.department_documents (department_id, is_live, downloadable, live_from, live_until);
