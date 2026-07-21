create table if not exists public.lineup_community (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  formation text not null,
  image_path text not null unique,
  image_url text not null,
  author_name text not null default 'Aficionado',
  created_at timestamptz not null default now()
);

create index if not exists lineup_community_created_at_idx
on public.lineup_community (created_at desc);

alter table public.lineup_community enable row level security;

drop policy if exists "Public can read community lineups" on public.lineup_community;
create policy "Public can read community lineups"
on public.lineup_community
for select
using (true);

drop policy if exists "Users can publish community lineups" on public.lineup_community;
create policy "Users can publish community lineups"
on public.lineup_community
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can delete own community lineups" on public.lineup_community;
create policy "Users can delete own community lineups"
on public.lineup_community
for delete
to authenticated
using (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('lineup-community', 'lineup-community', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view lineup community images" on storage.objects;
create policy "Public can view lineup community images"
on storage.objects
for select
using (bucket_id = 'lineup-community');

drop policy if exists "Users can upload own lineup community images" on storage.objects;
create policy "Users can upload own lineup community images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'lineup-community'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own lineup community images" on storage.objects;
create policy "Users can delete own lineup community images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'lineup-community'
  and (storage.foldername(name))[1] = auth.uid()::text
);
