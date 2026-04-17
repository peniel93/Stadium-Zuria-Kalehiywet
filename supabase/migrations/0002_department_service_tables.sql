-- Department service tables for reusable member, committee, and group management.

create table if not exists public.department_member_groups (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  code text not null,
  name_en text not null,
  name_am text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (department_id, code)
);

create table if not exists public.department_members (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  group_id uuid references public.department_member_groups(id) on delete set null,
  full_name text not null,
  full_name_am text,
  photo_media_id uuid references public.media_assets(id) on delete set null,
  role_title text,
  contact text,
  address text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.department_committees (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  name text not null,
  description text,
  term_label text,
  round_number integer,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.department_committee_members (
  committee_id uuid not null references public.department_committees(id) on delete cascade,
  member_id uuid not null references public.department_members(id) on delete cascade,
  position_title text,
  created_at timestamptz not null default now(),
  primary key (committee_id, member_id)
);

create table if not exists public.children_profiles (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  full_name text not null,
  age integer,
  education_level text,
  class_name text,
  section_name text,
  status text not null default 'active' check (status in ('active', 'inactive', 'graduated')),
  date_of_registration date,
  photo_media_id uuid references public.media_assets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.youth_profiles (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  full_name text not null,
  age integer,
  age_group text,
  status text not null default 'active' check (status in ('active', 'inactive', 'graduated')),
  photo_media_id uuid references public.media_assets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.department_documents (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  title text not null,
  description text,
  file_media_id uuid not null references public.media_assets(id) on delete cascade,
  access_scope text not null default 'department' check (access_scope in ('public', 'members', 'department', 'admins')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_department_member_groups_department on public.department_member_groups (department_id, code);
create index if not exists idx_department_members_department on public.department_members (department_id, group_id, status);
create index if not exists idx_department_committees_department on public.department_committees (department_id, is_current, start_date);
create index if not exists idx_children_department on public.children_profiles (department_id, class_name, section_name, status);
create index if not exists idx_youth_department on public.youth_profiles (department_id, age_group, status);
create index if not exists idx_department_documents_department on public.department_documents (department_id, access_scope);
