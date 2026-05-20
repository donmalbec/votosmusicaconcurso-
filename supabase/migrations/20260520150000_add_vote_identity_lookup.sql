-- Read-only identity lookup for vote preflight checks.
--
-- This does not alter historical votes. It gives the server a normalized
-- email/device check before sending Supabase Auth emails.

begin;

create or replace function public.get_vote_identity_status(
  candidate_email text,
  primary_device_id text default null,
  secondary_device_id text default null
)
returns table (
  email_exists boolean,
  device_exists boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with normalized_input as (
    select
      lower(trim(candidate_email)) as normalized_email,
      array_remove(array[primary_device_id, secondary_device_id], null) as device_ids
  )
  select
    exists (
      select 1
      from public.votes v, normalized_input i
      where lower(trim(v.email)) = i.normalized_email
      limit 1
    ) as email_exists,
    exists (
      select 1
      from public.votes v, normalized_input i
      where v.device_id = any(i.device_ids)
      limit 1
    ) as device_exists;
$$;

revoke all on function public.get_vote_identity_status(text, text, text) from public;
revoke all on function public.get_vote_identity_status(text, text, text) from anon;
revoke all on function public.get_vote_identity_status(text, text, text) from authenticated;
grant execute on function public.get_vote_identity_status(text, text, text) to service_role;

commit;
