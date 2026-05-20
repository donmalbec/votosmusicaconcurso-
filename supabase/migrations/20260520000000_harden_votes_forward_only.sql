-- Forward-only hardening for public.votes.
--
-- This migration does not delete, update, or invalidate historical votes.
-- It closes direct public access and rejects new duplicate/invalid inserts
-- from this point on.

begin;

alter table public.votes enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'votes'
  loop
    execute format('drop policy if exists %I on public.votes', policy_record.policyname);
  end loop;
end $$;

revoke all on table public.votes from public;
revoke all on table public.votes from anon;
revoke all on table public.votes from authenticated;
grant select, insert, delete on table public.votes to service_role;

do $$
begin
  if to_regclass('public.votes_id_seq') is not null then
    revoke all on sequence public.votes_id_seq from public;
    revoke all on sequence public.votes_id_seq from anon;
    revoke all on sequence public.votes_id_seq from authenticated;
    grant usage, select on sequence public.votes_id_seq to service_role;
  end if;
end $$;

create index if not exists votes_normalized_email_lookup_idx
  on public.votes ((lower(trim(email))));

create index if not exists votes_device_lookup_idx
  on public.votes (device_id)
  where device_id is not null and device_id <> '';

create index if not exists votes_ip_created_at_idx
  on public.votes (ip_address, created_at);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'votes_email_format_chk'
  ) then
    alter table public.votes
      add constraint votes_email_format_chk
      check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'votes_email_required_chk'
  ) then
    alter table public.votes
      add constraint votes_email_required_chk
      check (email is not null and length(trim(email)) between 3 and 254)
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'votes_device_id_format_chk'
  ) then
    alter table public.votes
      add constraint votes_device_id_format_chk
      check (device_id ~ '^[a-f0-9]{64}$')
      not valid;
  end if;
end $$;

create or replace function public.enforce_vote_insert_guardrails()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
begin
  normalized_email := lower(trim(new.email));

  if normalized_email is null
    or length(normalized_email) not between 3 and 254
    or normalized_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  then
    raise exception 'Invalid email for vote'
      using errcode = '23514';
  end if;

  if new.device_id is null or new.device_id !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid device id for vote'
      using errcode = '23514';
  end if;

  new.email := normalized_email;

  perform pg_advisory_xact_lock(1, hashtext(normalized_email));
  perform pg_advisory_xact_lock(2, hashtext(new.device_id));

  if exists (
    select 1
    from public.votes
    where lower(trim(email)) = normalized_email
    limit 1
  ) then
    raise exception 'This email already voted'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.votes
    where device_id = new.device_id
    limit 1
  ) then
    raise exception 'This device already voted'
      using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists votes_insert_guardrails on public.votes;
create trigger votes_insert_guardrails
  before insert on public.votes
  for each row
  execute function public.enforce_vote_insert_guardrails();

commit;
