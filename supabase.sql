-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists public.appstate (
  id text not null,
  user_id uuid not null default auth.uid(),
  payload jsonb not null,
  updated_at bigint not null default 0,
  primary key (id, user_id)
);
alter table public.appstate enable row level security;
create policy "users can only touch their own rows" on public.appstate
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Stores your Dropbox connection so the weekly GitHub backup can run
create table if not exists public.backup_config (
  user_id uuid not null default auth.uid() primary key,
  dropbox_app_key text not null,
  dropbox_refresh_token text not null,
  updated_at bigint not null default 0
);
alter table public.backup_config enable row level security;
create policy "own backup config" on public.backup_config
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
