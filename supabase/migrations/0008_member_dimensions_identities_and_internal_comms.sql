alter table if exists public.church_members
  add column if not exists education_status text,
  add column if not exists occupation_status text,
  add column if not exists marriage_status text,
  add column if not exists student_stage text,
  add column if not exists employment_type text;

create sequence if not exists public.identity_number_seq start 10000000;

create table if not exists public.user_identities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  member_id uuid references public.church_members(id) on delete set null,
  identity_number text not null unique default lpad(nextval('public.identity_number_seq')::text, 8, '0'),
  username text not null unique,
  role_group text not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dashboard_messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid references public.profiles(id) on delete set null,
  recipient_scope text not null check (recipient_scope in ('all_admins', 'role', 'department', 'user')),
  recipient_role_code text,
  recipient_department_id uuid references public.departments(id) on delete set null,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  body text,
  attachment_media_id uuid references public.media_assets(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

alter table if exists public.dashboard_messages
  add column if not exists recipient_scope text,
  add column if not exists recipient_role_code text,
  add column if not exists recipient_department_id uuid references public.departments(id) on delete set null,
  add column if not exists recipient_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists attachment_media_id uuid references public.media_assets(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;

update public.dashboard_messages
set recipient_scope = 'all_admins'
where recipient_scope is null;

alter table if exists public.dashboard_messages
  alter column recipient_scope set default 'all_admins',
  alter column recipient_scope set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'dashboard_messages_recipient_scope_check'
      and conrelid = 'public.dashboard_messages'::regclass
  ) then
    alter table public.dashboard_messages
      add constraint dashboard_messages_recipient_scope_check
      check (recipient_scope in ('all_admins', 'role', 'department', 'user'));
  end if;
end
$$;

create table if not exists public.student_academic_profiles (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.church_members(id) on delete set null,
  identity_id uuid references public.user_identities(id) on delete set null,
  class_name text,
  section_name text,
  age_group text,
  courses jsonb not null default '[]'::jsonb,
  teachers jsonb not null default '[]'::jsonb,
  grades jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_church_members_dimensions
  on public.church_members (education_status, occupation_status, marriage_status, student_stage, employment_type);

create index if not exists idx_user_identities_role_group
  on public.user_identities (role_group, is_active);

create index if not exists idx_dashboard_messages_scope
  on public.dashboard_messages (recipient_scope, recipient_role_code, recipient_department_id, recipient_user_id, created_at desc);

insert into public.roles (code, name)
values
  ('pastor', 'Pastor'),
  ('evangelist', 'Evangelist'),
  ('full_timer', 'Full Timer'),
  ('employee', 'Employee'),
  ('missionary', 'Missionary'),
  ('teacher', 'Teacher'),
  ('church_leader', 'Church Leader'),
  ('women_leader', 'Women Main Leader'),
  ('youth_leader', 'Youth Leader'),
  ('education_worker', 'Education and Training Worker'),
  ('admin_office_worker', 'Administrative Office Worker'),
  ('choir_leader', 'Choir Leader'),
  ('team_leader', 'Team Leader'),
  ('hr_staff', 'HR Staff'),
  ('student', 'Student')
on conflict (code) do nothing;

insert into public.departments (code, name_en, name_am, description, is_public, is_active)
values
  ('menfesawi_zerf', 'Menfesawi Zerf', 'መንፈሳዊ ዘርፍ', 'Spiritual Affairs Cluster dashboard and ministry operations.', true, true),
  ('women_ministry', 'Women Ministry', 'የሴቶች ዘርፍ', 'Women fellowship, discipleship and outreach coordination.', true, true),
  ('prayer_team', 'Prayer Team', 'የጸሎት ቡድን', 'Prayer coordination, intercession schedules and support.', true, true),
  ('choir_ministry', 'Choir Ministry', 'የመዝሙር ዘርፍ', 'Choir operations, songs and service planning.', true, true)
on conflict (code) do nothing;
