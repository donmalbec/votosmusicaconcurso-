# Redacted Supabase Snapshot

Generated from project `migquiivlhupijgmlbup` / `pizza-music-vote`.

These files are intentionally redacted. Email, IP, and device identifiers are
HMAC-hashed with an ephemeral salt that was not saved, so the snapshot can be
used for cluster analysis without storing raw voter PII in the repo.

## Files

- `live_public_types.ts`: Supabase-generated TypeScript shape for the live
  `public` schema.
- `vote_audit_summary.json`: high-level totals and duplicate counts.
- `vote_audit_clusters.json`: redacted duplicate-email, duplicate-device,
  top-IP, invalid-device, leaderboard, and hourly activity aggregates.

## Current Findings

- Total votes: 966
- Distinct emails: 960
- Distinct devices: 926
- Distinct IPs: 761
- Invalid device-id format rows: 140
- Duplicate email groups: 6, producing 6 extra votes
- Duplicate device groups: 32, producing 40 extra votes

Because duplicates already exist, strict one-vote-per-email or
one-vote-per-device database constraints should not be applied until the contest
team decides how to handle historical duplicate rows.
