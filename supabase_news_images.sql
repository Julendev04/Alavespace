insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Anyone can read news images" on storage.objects;
create policy "Anyone can read news images"
on storage.objects
for select
using (bucket_id = 'news-images');

drop policy if exists "Admins can upload news images" on storage.objects;
create policy "Admins can upload news images"
on storage.objects
for insert
with check (
  bucket_id = 'news-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update news images" on storage.objects;
create policy "Admins can update news images"
on storage.objects
for update
using (
  bucket_id = 'news-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'news-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete news images" on storage.objects;
create policy "Admins can delete news images"
on storage.objects
for delete
using (
  bucket_id = 'news-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can delete news" on public.news;
create policy "Admins can delete news"
on public.news
for delete
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
