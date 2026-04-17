-- Durame Stadium Zuria Kalehiywet Church Portal
-- Initial foundation schema

create extension if not exists "pgcrypto";

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'am')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_en text not null,
  name_am text not null,
  description text,
  parent_department_id uuid references public.departments(id) on delete set null,
  is_public boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table if not exists public.department_admin_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  access_level text not null check (access_level in ('full', 'limited')),
  created_at timestamptz not null default now(),
  unique (user_id, department_id)
);

create table if not exists public.post_categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_en text not null,
  name_am text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete set null,
  category_id uuid references public.post_categories(id) on delete set null,
  title_en text not null,
  title_am text,
  body_en text not null,
  body_am text,
  visibility_scope text not null default 'public' check (visibility_scope in ('public', 'members', 'admins')),
  is_published boolean not null default false,
  publish_at timestamptz,
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or publish_at is null or expires_at > publish_at)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts(id) on delete cascade,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  pin_to_home boolean not null default false,
  show_on_main_board boolean not null default true,
  countdown_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_department_id uuid references public.departments(id) on delete set null,
  bucket_name text not null,
  storage_path text not null,
  media_type text not null check (media_type in ('image', 'audio', 'video', 'document')),
  title text,
  description text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action_type text not null,
  entity_name text not null,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_publish_window on public.posts (is_published, publish_at, expires_at);
create index if not exists idx_posts_department on public.posts (department_id, is_published, publish_at);

alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.posts enable row level security;
alter table public.announcements enable row level security;

-- Public read policies for launch baseline.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'departments' and policyname = 'Public can read active public departments'
  ) then
    create policy "Public can read active public departments"
      on public.departments for select
      using (is_public = true and is_active = true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'posts' and policyname = 'Public can read visible published posts'
  ) then
    create policy "Public can read visible published posts"
      on public.posts for select
      using (
        visibility_scope = 'public'
        and is_published = true
        and (publish_at is null or publish_at <= now())
        and (expires_at is null or expires_at > now())
      );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'announcements' and policyname = 'Public can read announcements of visible posts'
  ) then
    create policy "Public can read announcements of visible posts"
      on public.announcements for select
      using (
        exists (
          select 1
          from public.posts p
          where p.id = announcements.post_id
            and p.visibility_scope = 'public'
            and p.is_published = true
            and (p.publish_at is null or p.publish_at <= now())
            and (p.expires_at is null or p.expires_at > now())
        )
      );
  end if;
end $$;
