create table if not exists public.site_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Aviso de Alavesfera',
  message text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.site_notifications enable row level security;

drop policy if exists "Anyone can read site notifications" on public.site_notifications;
create policy "Anyone can read site notifications"
on public.site_notifications
for select
using (true);

drop policy if exists "Admins can create site notifications" on public.site_notifications;
create policy "Admins can create site notifications"
on public.site_notifications
for insert
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
