-- Custom vote email confirmation tokens sent via Resend.
-- Keeps Supabase as the database but removes Supabase Auth from the vote flow.

begin;

create table if not exists public.vote_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  video_id text not null,
  device_id text not null,
  token_hash text not null unique,
  ip_address text,
  confirm_ip_address text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.vote_verifications enable row level security;

revoke all on table public.vote_verifications from public;
revoke all on table public.vote_verifications from anon;
revoke all on table public.vote_verifications from authenticated;
grant select, insert, update, delete on table public.vote_verifications to service_role;

create index if not exists vote_verifications_email_created_at_idx
  on public.vote_verifications ((lower(trim(email))), created_at desc);

create index if not exists vote_verifications_device_created_at_idx
  on public.vote_verifications (device_id, created_at desc);

create index if not exists vote_verifications_token_hash_unused_idx
  on public.vote_verifications (token_hash)
  where used_at is null;

create index if not exists vote_verifications_expires_at_idx
  on public.vote_verifications (expires_at);

commit;
