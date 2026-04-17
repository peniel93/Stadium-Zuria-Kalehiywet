alter table if exists public.posts
  add column if not exists featured_media_id uuid references public.media_assets(id) on delete set null;

create index if not exists idx_posts_featured_media_id on public.posts (featured_media_id);
