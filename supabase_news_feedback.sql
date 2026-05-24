create table if not exists public.news_feedback (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references public.news(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote text not null check (vote in ('up', 'down')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (news_id, user_id)
);

alter table public.news_feedback enable row level security;

drop policy if exists "Anyone can read news feedback" on public.news_feedback;
create policy "Anyone can read news feedback"
on public.news_feedback
for select
using (true);

drop policy if exists "Users can insert their own news feedback" on public.news_feedback;
create policy "Users can insert their own news feedback"
on public.news_feedback
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own news feedback" on public.news_feedback;
create policy "Users can update their own news feedback"
on public.news_feedback
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own news feedback" on public.news_feedback;
create policy "Users can delete their own news feedback"
on public.news_feedback
for delete
using (auth.uid() = user_id);
