-- Accurate public vote counts via server-side aggregation.
--
-- The server previously counted votes by fetching every row of public.votes and
-- tallying them in JS. PostgREST caps result sets at 1000 rows by default, so
-- once the contest passed 1000 votes the public counts silently undercounted.
-- This function does the GROUP BY in the database and returns one row per song
-- (<= 24 rows), so the row cap never applies and totals stay accurate.

begin;

create or replace function public.get_public_vote_counts()
returns table (
  video_id text,
  votes bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select video_id, count(*)::bigint as votes
  from public.votes
  group by video_id;
$$;

revoke all on function public.get_public_vote_counts() from public;
revoke all on function public.get_public_vote_counts() from anon;
revoke all on function public.get_public_vote_counts() from authenticated;
grant execute on function public.get_public_vote_counts() to service_role;

commit;
