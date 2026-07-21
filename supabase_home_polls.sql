create table if not exists public.polls (
  id uuid not null default extensions.uuid_generate_v4(),
  question text not null,
  is_active boolean not null default false,
  votes_count integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint polls_pkey primary key (id)
);

create table if not exists public.poll_options (
  id uuid not null default extensions.uuid_generate_v4(),
  poll_id uuid not null,
  label text not null,
  votes_count integer not null default 0,
  sort_order smallint not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint poll_options_pkey primary key (id),
  constraint poll_options_poll_id_fkey foreign key (poll_id) references public.polls (id) on delete cascade
);

create table if not exists public.poll_votes (
  id uuid not null default extensions.uuid_generate_v4(),
  poll_id uuid not null,
  option_id uuid not null,
  user_id uuid null,
  created_at timestamp with time zone not null default now(),
  constraint poll_votes_pkey primary key (id),
  constraint poll_votes_poll_id_fkey foreign key (poll_id) references public.polls (id) on delete cascade,
  constraint poll_votes_option_id_fkey foreign key (option_id) references public.poll_options (id) on delete cascade,
  constraint poll_votes_one_vote_per_user unique (poll_id, user_id)
);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

drop policy if exists "Polls are readable" on public.polls;
create policy "Polls are readable"
on public.polls for select
using (true);

drop policy if exists "Admins can insert polls" on public.polls;
create policy "Admins can insert polls"
on public.polls for insert
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update polls" on public.polls;
create policy "Admins can update polls"
on public.polls for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Poll options are readable" on public.poll_options;
create policy "Poll options are readable"
on public.poll_options for select
using (true);

drop policy if exists "Admins can insert poll options" on public.poll_options;
create policy "Admins can insert poll options"
on public.poll_options for insert
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Users can vote polls" on public.poll_votes;
create policy "Users can vote polls"
on public.poll_votes for insert
with check (auth.uid() = user_id);

drop policy if exists "Poll votes are readable" on public.poll_votes;
create policy "Poll votes are readable"
on public.poll_votes for select
using (true);

create or replace function public.refresh_poll_vote_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_poll_id uuid;
  affected_option_id uuid;
begin
  affected_poll_id := coalesce(new.poll_id, old.poll_id);
  affected_option_id := coalesce(new.option_id, old.option_id);

  update public.poll_options
  set votes_count = (
    select count(*) from public.poll_votes where option_id = affected_option_id
  )
  where id = affected_option_id;

  update public.polls
  set votes_count = (
    select count(*) from public.poll_votes where poll_id = affected_poll_id
  )
  where id = affected_poll_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_refresh_poll_vote_counts_insert on public.poll_votes;
create trigger trg_refresh_poll_vote_counts_insert
after insert on public.poll_votes
for each row execute function public.refresh_poll_vote_counts();

drop trigger if exists trg_refresh_poll_vote_counts_delete on public.poll_votes;
create trigger trg_refresh_poll_vote_counts_delete
after delete on public.poll_votes
for each row execute function public.refresh_poll_vote_counts();
