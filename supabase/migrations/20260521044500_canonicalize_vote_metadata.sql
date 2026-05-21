-- Canonical contest candidate registry for vote certification.
--
-- The database now owns the official candidate metadata for new votes. Inserts
-- may provide title/artist for compatibility, but the trigger overwrites them
-- with canonical values from public.contest_videos before the vote is stored.

begin;

create table if not exists public.contest_videos (
  id text primary key,
  title text not null check (length(trim(title)) between 1 and 200),
  artist text not null check (length(trim(artist)) between 1 and 200)
);

revoke all on table public.contest_videos from public;
revoke all on table public.contest_videos from anon;
revoke all on table public.contest_videos from authenticated;
grant select on table public.contest_videos to service_role;

insert into public.contest_videos (id, title, artist)
values
    ('v1', 'Esto es PizzaDao', 'MelitzagMusic y MHA'),
    ('v2', 'Maratón de Pizza', 'Canto de Río'),
    ('v3', 'Modo Avión', 'Canto de Río'),
    ('v4', 'Shud b Free', 'Tony Sky x Davi Ruiz x Los Onchain'),
    ('v5', 'Bitcoin Legend', 'Joan Barbosa'),
    ('v6', 'Zappi Infinita', 'Driado'),
    ('v7', 'Apolo Bacco - GPP', 'Apolo Bacco ft. LuckyKid'),
    ('v8', 'Pizza Gratis', 'La Macabrita'),
    ('v9', 'Solo unas Pizzas', 'Marco Crypto'),
    ('v10', 'PizzaDaoParty', 'Marco Crypto'),
    ('v11', 'Masa Y Fuego', 'Sebastián Ceciliano'),
    ('v12', 'Pura Pizza', 'Sebastián Ceciliano'),
    ('v13', 'Pizza X', 'Brauxelion ft. YoungBleak'),
    ('v14', 'Free Pizza', 'Blackjales'),
    ('v15', 'Global Pizza Party', 'Herimax'),
    ('v16', 'Tango, Pizza y Amigos', 'RGabrielDiaz'),
    ('v17', 'Arcade Pizza Session II', 'MrRayius'),
    ('v18', 'Pizza DA0', 'FVST'),
    ('v19', 'Cariddi Records #1', 'Cariddi Crypto'),
    ('v20', 'JOSHA \ ZONAS', 'Josha'),
    ('v21', 'Ñam Ñam Ñam Ñam', 'Sandro B.'),
    ('v22', 'PizzaDao x Cariddi Cowork', 'Wincoiner'),
    ('v23', 'JOSHA * Muzza Boy', 'Joya'),
    ('v24', 'Pizza Day', 'Keleven ft. Sielo')
on conflict (id) do update
set title = excluded.title,
    artist = excluded.artist;

create or replace function public.enforce_vote_insert_guardrails()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  canonical_video record;
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

  select id, title, artist
    into canonical_video
    from public.contest_videos
    where id = new.video_id;

  if canonical_video.id is null then
    raise exception 'Invalid contest video id for vote'
      using errcode = '23514';
  end if;

  new.email := normalized_email;
  new.video_id := canonical_video.id;
  new.video_title := canonical_video.title;
  new.artist := canonical_video.artist;

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
