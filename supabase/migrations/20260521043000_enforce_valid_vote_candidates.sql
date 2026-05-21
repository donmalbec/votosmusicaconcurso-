-- Forward-only certification guardrails for vote candidate data.
--
-- New votes must point to one of the official contest video ids and include
-- non-empty display metadata. This keeps the database as the final authority
-- even if a future server/client change accidentally submits an invalid target.

begin;

alter table public.votes
  add constraint votes_video_id_allowed_chk
  check (video_id in (
    'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8',
    'v9', 'v10', 'v11', 'v12', 'v13', 'v14', 'v15', 'v16',
    'v17', 'v18', 'v19', 'v20', 'v21', 'v22', 'v23', 'v24'
  ))
  not valid;

alter table public.votes
  add constraint votes_video_metadata_required_chk
  check (
    video_title is not null
    and length(trim(video_title)) between 1 and 200
    and artist is not null
    and length(trim(artist)) between 1 and 200
  )
  not valid;

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

  if new.video_id is null or new.video_id not in (
    'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8',
    'v9', 'v10', 'v11', 'v12', 'v13', 'v14', 'v15', 'v16',
    'v17', 'v18', 'v19', 'v20', 'v21', 'v22', 'v23', 'v24'
  ) then
    raise exception 'Invalid contest video id for vote'
      using errcode = '23514';
  end if;

  if new.video_title is null
    or length(trim(new.video_title)) not between 1 and 200
    or new.artist is null
    or length(trim(new.artist)) not between 1 and 200
  then
    raise exception 'Invalid contest metadata for vote'
      using errcode = '23514';
  end if;

  new.email := normalized_email;
  new.video_title := trim(new.video_title);
  new.artist := trim(new.artist);

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

commit;
