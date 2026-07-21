alter table public.matches
  add column if not exists rival_title text,
  add column if not exists rival_description text,
  add column if not exists rival_image_url text,
  add column if not exists rival_title_color text default '#0f5ca3',
  add column if not exists rival_player_ids uuid[] not null default '{}',
  add column if not exists rival_player_slots jsonb not null default '[]'::jsonb,
  add column if not exists rival_formation text not null default '4-2-3-1';

drop policy if exists "Admins can update matches" on public.matches;
create policy "Admins can update matches"
on public.matches
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

insert into storage.buckets (id, name, public)
values ('match-rivals', 'match-rivals', true)
on conflict (id) do update set public = true;

drop policy if exists "match rivals public read" on storage.objects;
drop policy if exists "match rivals admin upload" on storage.objects;
drop policy if exists "match rivals admin update" on storage.objects;

create policy "match rivals public read"
on storage.objects for select
using (bucket_id = 'match-rivals');

create policy "match rivals admin upload"
on storage.objects for insert
with check (
  bucket_id = 'match-rivals'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "match rivals admin update"
on storage.objects for update
using (
  bucket_id = 'match-rivals'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'match-rivals'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
