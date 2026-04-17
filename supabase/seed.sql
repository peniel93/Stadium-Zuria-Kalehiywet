-- Seed data for Durame Stadium Zuria Kalehiywet Church Portal

insert into public.roles (code, name)
values
  ('super_admin', 'Super Admin'),
  ('global_admin', 'Global Admin'),
  ('department_admin', 'Department Admin'),
  ('editor', 'Editor'),
  ('moderator', 'Moderator'),
  ('member', 'Member')
on conflict (code) do nothing;

insert into public.permissions (code, name)
values
  ('manage_all', 'Manage all data'),
  ('manage_departments', 'Manage departments'),
  ('manage_announcements', 'Manage announcements'),
  ('manage_members', 'Manage members'),
  ('manage_media', 'Manage media'),
  ('manage_documents', 'Manage documents'),
  ('manage_roles', 'Manage roles'),
  ('view_reports', 'View reports')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where (r.code = 'super_admin' and p.code in ('manage_all', 'manage_departments', 'manage_announcements', 'manage_members', 'manage_media', 'manage_documents', 'manage_roles', 'view_reports'))
   or (r.code = 'global_admin' and p.code in ('manage_departments', 'manage_announcements', 'manage_members', 'manage_media', 'manage_documents', 'view_reports'))
   or (r.code = 'department_admin' and p.code in ('manage_announcements', 'manage_members', 'manage_media', 'manage_documents'))
   or (r.code = 'editor' and p.code in ('manage_announcements', 'manage_media', 'manage_documents'))
   or (r.code = 'moderator' and p.code in ('manage_announcements'))
  or (r.code = 'member' and false)
on conflict do nothing;

insert into public.departments (code, name_en, name_am, description)
values
  ('medeb-sefer', 'Medeb Sefer', 'መደብ ሰፈር', 'Zone-level church member and committee management.'),
  ('children-service', 'Kids and Children Service', 'የልጆች አገልግሎት', 'Children records, age groups, classes, and teachers.'),
  ('youth-service', 'Youth Service', 'የወጣቶች ዘርፍ', 'Youth programs, committees, and training activities.'),
  ('women-service', 'Women Service', 'የእናቶች/ሴቶች ዘርፍ', 'Women ministry records, programs, and communication.'),
  ('worship-choir', 'Worship and Choir Teams', 'የአምልኮ እና መዝሙር ቡድኖች', 'Worship schedules, choir teams, and service media.'),
  ('outreach-mission', 'Outreach and Mission', 'ወንጌል እና ተልዕኮ', 'Mission activity planning and evangelism reports.'),
  ('media-sound-team', 'Media and Sound Team', 'ሚዲያ እና ድምጽ ቡድን', 'Media production, sound operations, and equipment workflows.'),
  ('administration', 'Administration', 'አስተዳደር', 'Operational planning, finance coordination, and office management.')
on conflict (code) do nothing;

insert into public.post_categories (code, name_en, name_am)
values
  ('news', 'News', 'ዜና'),
  ('announcement', 'Announcement', 'ማስታወቂያ'),
  ('vacancy', 'Vacancy', 'የስራ እድል'),
  ('training', 'Training', 'ስልጠና'),
  ('event', 'Event', 'ዝግጅት')
on conflict (code) do nothing;

insert into public.member_categories (code, name, description)
values
  ('occupation', 'Occupation / Job / Career Status', 'Occupation, work type, and career tracking category.'),
  ('education', 'Educational Status', 'Education level and student progression status category.'),
  ('marriage', 'Marriage Status', 'Marriage/family status category for member records.')
on conflict (code) do nothing;
