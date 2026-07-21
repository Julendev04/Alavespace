alter table public.transfers
  add column if not exists team_logo_url text,
  add column if not exists player_image_url text,
  add column if not exists source_url text,
  add column if not exists transfer_type text not null default 'entrada';

alter table public.transfers
  alter column transfer_type set default 'entrada';

update public.transfers
set transfer_type = 'entrada'
where transfer_type is null;

alter table public.transfers
  alter column transfer_type set not null;

alter table public.transfers
  drop constraint if exists transfers_transfer_type_check;

alter table public.transfers
  add constraint transfers_transfer_type_check
  check (transfer_type in ('entrada', 'salida'));

insert into storage.buckets (id, name, public)
values ('transfer-team-logos', 'transfer-team-logos', true)
on conflict (id) do update
set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('transfer-player-images', 'transfer-player-images', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Anyone can read transfer team logos" on storage.objects;
create policy "Anyone can read transfer team logos"
on storage.objects
for select
using (bucket_id = 'transfer-team-logos');

drop policy if exists "Anyone can read transfer player images" on storage.objects;
create policy "Anyone can read transfer player images"
on storage.objects
for select
using (bucket_id = 'transfer-player-images');

drop policy if exists "Admins can upload transfer team logos" on storage.objects;
create policy "Admins can upload transfer team logos"
on storage.objects
for insert
with check (
  bucket_id = 'transfer-team-logos'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can upload transfer player images" on storage.objects;
create policy "Admins can upload transfer player images"
on storage.objects
for insert
with check (
  bucket_id = 'transfer-player-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update transfer team logos" on storage.objects;
create policy "Admins can update transfer team logos"
on storage.objects
for update
using (
  bucket_id = 'transfer-team-logos'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'transfer-team-logos'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update transfer player images" on storage.objects;
create policy "Admins can update transfer player images"
on storage.objects
for update
using (
  bucket_id = 'transfer-player-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'transfer-player-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete transfer team logos" on storage.objects;
create policy "Admins can delete transfer team logos"
on storage.objects
for delete
using (
  bucket_id = 'transfer-team-logos'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete transfer player images" on storage.objects;
create policy "Admins can delete transfer player images"
on storage.objects
for delete
using (
  bucket_id = 'transfer-player-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
