alter table public.matches
  add column if not exists preview_title text,
  add column if not exists preview_intro text,
  add column if not exists preview_content text,
  add column if not exists preview_image_url text,
  add column if not exists preview_tags text[] default '{}',
  add column if not exists preview_updated_at timestamptz default now(),
  add column if not exists preview_published boolean not null default false,
  add column if not exists preview_published_at timestamptz;

create table if not exists public.match_preview_comments (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.match_preview_comments enable row level security;

drop policy if exists "Anyone can read match preview comments" on public.match_preview_comments;
create policy "Anyone can read match preview comments"
on public.match_preview_comments
for select
using (true);

drop policy if exists "Users can insert their own match preview comments" on public.match_preview_comments;
create policy "Users can insert their own match preview comments"
on public.match_preview_comments
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own match preview comments" on public.match_preview_comments;
create policy "Users can update their own match preview comments"
on public.match_preview_comments
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own match preview comments" on public.match_preview_comments;
create policy "Users can delete their own match preview comments"
on public.match_preview_comments
for delete
using (auth.uid() = user_id);
