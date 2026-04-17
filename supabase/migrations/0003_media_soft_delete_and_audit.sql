-- Media lifecycle upgrades: update tracking + soft delete support.

alter table if exists public.media_assets
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

create index if not exists idx_media_assets_deleted_at on public.media_assets (deleted_at, created_at desc);
