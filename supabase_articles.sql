create table if not exists public.articles (
  id uuid not null default extensions.uuid_generate_v4(),
  title text not null,
  intro text null,
  content text not null default '',
  image_url text null,
  tagline text null,
  category text null,
  author text null,
  published_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  constraint articles_pkey primary key (id)
) tablespace pg_default;

alter table public.articles
add column if not exists author text null;

create or replace function public.set_articles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_articles_updated_at on public.articles;

create trigger trg_articles_updated_at
before update on public.articles
for each row
execute function public.set_articles_updated_at();

alter table public.articles enable row level security;

drop policy if exists "articles are public readable" on public.articles;
create policy "articles are public readable"
on public.articles
for select
using (true);

drop policy if exists "admins can insert articles" on public.articles;
create policy "admins can insert articles"
on public.articles
for insert
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "admins can update articles" on public.articles;
create policy "admins can update articles"
on public.articles
for update
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

drop policy if exists "admins can delete articles" on public.articles;
create policy "admins can delete articles"
on public.articles
for delete
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
