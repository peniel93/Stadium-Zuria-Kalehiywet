-- Dynamic site settings, contact inbox workflow, dashboard communication, and department/category management.

create table if not exists public.portal_settings (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portal_counters (
  code text primary key,
  label_en text not null,
  label_am text not null,
  value integer not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.department_categories (
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

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  department_id uuid references public.departments(id) on delete set null,
  recipient_emails text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'read', 'replied', 'closed')),
  admin_reply text,
  replied_by uuid references public.profiles(id) on delete set null,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dashboard_messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid references public.profiles(id) on delete set null,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  recipient_role_code text,
  subject text not null,
  body text not null,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  status text not null default 'sent' check (status in ('sent', 'read', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_access_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  person_type text not null,
  generated_numeric_id text not null,
  username text not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (generated_numeric_id),
  unique (username),
  unique (user_id, person_type)
);

create index if not exists idx_department_categories_department on public.department_categories (department_id, code);
create index if not exists idx_contact_messages_status on public.contact_messages (status, created_at desc);
create index if not exists idx_contact_messages_department on public.contact_messages (department_id, status);
create index if not exists idx_dashboard_messages_recipient on public.dashboard_messages (recipient_user_id, status, created_at desc);

insert into public.portal_counters (code, label_en, label_am, value, sort_order)
values
  ('missionaries_count', 'Missionaries Count', 'የሚስዮናውያን ብዛት', 0, 10),
  ('evangelists_count', 'Evangelists Count', 'የወንጌላውያን ብዛት', 0, 20),
  ('full_time_servants_count', 'Full-Time Servants Count', 'የሙሉ ጊዜ አገልጋዮች ብዛት', 0, 30),
  ('medeb_sefers_count', 'Number Medeb Sefers Count', 'የመደብ ሰፈሮች ብዛት', 0, 40),
  ('childrens_count', 'Childrens Count', 'የልጆች ብዛት', 0, 50),
  ('university_students_count', 'University Students Count', 'የዩኒቨርሲቲ ተማሪዎች ብዛት', 0, 60),
  ('highschool_students_count', 'Highschool Students Count', 'የሁለተኛ ደረጃ ተማሪዎች ብዛት', 0, 70),
  ('primary_students_count', 'Primary School Students Count', 'የመጀመሪያ ደረጃ ተማሪዎች ብዛት', 0, 80),
  ('graduates_count', 'Graduates Count', 'የተመራቂዎች ብዛት', 0, 90),
  ('undergraduates_count', 'Undergraduates Count', 'የቅድመ ምረቃ ተማሪዎች ብዛት', 0, 100),
  ('employed_count', 'Employed Count', 'የተቀጠሩ ብዛት', 0, 110),
  ('business_people_count', 'Business Man/Women Count', 'የንግድ ሰዎች ብዛት', 0, 120),
  ('self_employed_count', 'Self Employed Count', 'የራስ ሥራ ያላቸው ብዛት', 0, 130),
  ('freelancer_count', 'Freelancer Count', 'የፍሪላንሰሮች ብዛት', 0, 140),
  ('remote_workers_count', 'Remote Worker/Employed Count', 'የርቀት ሥራ ተቀጣሪዎች ብዛት', 0, 150)
on conflict (code) do nothing;

insert into public.portal_settings (key, value_json)
values
  (
    'public_site',
    jsonb_build_object(
      'siteNameEn', 'Durame Stadium Zuria Kalehiywet Church Portal',
      'siteNameAm', 'ዱራሜ ስታዲየም ዙሪያ ቃለሕይወት ቤተክርስቲያን ፖርታል',
      'footerDescriptionEn', 'Dynamic church portal for announcements, programs, teams, and administration.',
      'footerDescriptionAm', 'ለማስታወቂያ፣ ፕሮግራሞች፣ ቡድኖች እና አስተዳደር የተዘጋጀ ተለዋዋጭ የቤተክርስቲያን ፖርታል።',
      'copyrightEn', 'All rights reserved.',
      'copyrightAm', 'መብቱ የተጠበቀ ነው።',
      'contactRecipientEmails', jsonb_build_array('admin@dsz-kalehiywetchurch.org')
    )
  )
on conflict (key) do nothing;
