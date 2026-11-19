create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null check (length(trim(full_name)) between 1 and 120),
  phone text not null default '' check (length(phone) <= 40),
  quantity smallint not null check (quantity between 1 and 50),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create sequence if not exists public.tickets_ticket_number_seq;

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.ticket_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  ticket_number bigint not null default nextval('public.tickets_ticket_number_seq'),
  code uuid not null unique default gen_random_uuid(),
  issued_at timestamptz not null default now()
);

alter table public.tickets alter column ticket_number type bigint;
alter table public.tickets drop constraint if exists tickets_ticket_number_check;
alter table public.tickets drop constraint if exists tickets_request_id_ticket_number_key;

do $$
begin
  if exists (
    select 1 from public.tickets group by ticket_number having count(*) > 1
  ) then
    with numbered as (
      select id, row_number() over (order by issued_at, id) as new_number
      from public.tickets
    )
    update public.tickets
    set ticket_number = numbered.new_number
    from numbered
    where public.tickets.id = numbered.id;
  end if;
end;
$$;

select setval(
  'public.tickets_ticket_number_seq',
  coalesce((select max(ticket_number) from public.tickets), 1),
  exists(select 1 from public.tickets)
);

alter table public.tickets
  alter column ticket_number set default nextval('public.tickets_ticket_number_seq');
create unique index if not exists tickets_ticket_number_unique
  on public.tickets (ticket_number);

alter table public.admin_users enable row level security;
alter table public.ticket_requests enable row level security;
alter table public.tickets enable row level security;

revoke all on public.admin_users, public.ticket_requests, public.tickets from anon, authenticated;
grant select on public.admin_users, public.ticket_requests, public.tickets to authenticated;
grant insert on public.ticket_requests to authenticated;

drop policy if exists "admins can read own membership" on public.admin_users;
create policy "admins can read own membership"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "owners and admins can read requests" on public.ticket_requests;
create policy "owners and admins can read requests"
  on public.ticket_requests for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

drop policy if exists "users can request their own tickets" on public.ticket_requests;
create policy "users can request their own tickets"
  on public.ticket_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

drop policy if exists "owners and admins can read tickets" on public.tickets;
create policy "owners and admins can read tickets"
  on public.tickets for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
  );

create or replace function public.approve_ticket_request(p_request_id uuid)
returns table (request_id uuid, tickets_issued integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row public.ticket_requests%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ) then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  select * into request_row
  from public.ticket_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Ticket request not found.' using errcode = 'P0002';
  end if;

  if request_row.status <> 'pending' then
    raise exception 'Only pending requests can be approved.' using errcode = '22023';
  end if;

  update public.ticket_requests
  set status = 'approved'
  where id = request_row.id;

  insert into public.tickets (request_id, user_id)
  select request_row.id, request_row.user_id
  from pg_catalog.generate_series(1, request_row.quantity);

  return query select request_row.id, request_row.quantity::integer;
end;
$$;

revoke all on function public.approve_ticket_request(uuid) from public, anon;
grant execute on function public.approve_ticket_request(uuid) to authenticated;