-- Close the contest at the database boundary.
--
-- This intentionally leaves historical votes readable and deletable by the
-- admin workflow, but rejects every new insert into public.votes from now on.

begin;

create or replace function public.reject_vote_inserts_after_close()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Voting is closed'
    using errcode = '23514';
end;
$$;

drop trigger if exists votes_closed_no_more_inserts on public.votes;
create trigger votes_closed_no_more_inserts
  before insert on public.votes
  for each row
  execute function public.reject_vote_inserts_after_close();

commit;
