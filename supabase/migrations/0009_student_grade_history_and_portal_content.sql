create table if not exists public.student_grade_history (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references public.user_identities(id) on delete cascade,
  member_id uuid references public.church_members(id) on delete set null,
  class_name text,
  section_name text,
  age_group text,
  courses jsonb not null default '[]'::jsonb,
  teachers jsonb not null default '[]'::jsonb,
  grades jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_student_grade_history_identity_created
  on public.student_grade_history (identity_id, created_at desc);

create index if not exists idx_student_grade_history_member_created
  on public.student_grade_history (member_id, created_at desc);
