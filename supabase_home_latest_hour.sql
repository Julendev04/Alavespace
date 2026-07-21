create table if not exists public.home_latest_hour (
  id uuid primary key default gen_random_uuid(),
  tag text not null default 'Ultima hora',
  status text not null default 'Venta',
  headline text not null,
  body text not null,
  source text not null default 'Fuente por editar',
  footer text not null default 'Mercado Alaves',
  image_url text,
  source_url text,
  published_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.home_latest_hour enable row level security;

create policy "Public can read active home latest hour"
on public.home_latest_hour
for select
using (is_active = true);

create index if not exists home_latest_hour_active_published_idx
on public.home_latest_hour (is_active, published_at desc);
