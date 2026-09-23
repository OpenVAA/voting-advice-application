---
created: 2026-08-29T07:10:00.000Z
title: Fifteen hard-coded ports and hosts in apps/supabase/supabase/config.toml — hand-off from Phase 155's sweep to Phase 156 criterion 8 (REVIEW-DB-08)
area: apps/supabase — Supabase local configuration
severity: low
source: Phase 155 (edge-function-hardening) Plan 06 repo-wide port/loopback sweep — handed off by naming, deliberately not edited
files:
  - apps/supabase/supabase/config.toml
---

## Problem

`REVIEW-EDGE-02` requires a repo-wide search for hard-coded ports and localhost URLs **and a
disposition for every result**. Phase 155 ran that sweep (see the sweep record below). The single
largest concentration outside test infrastructure is `apps/supabase/supabase/config.toml`, with
**15 hits**.

Measured 2026-08-29 at HEAD `f1f575b62`:

| Line | Key | Value |
|---|---|---|
| `apps/supabase/supabase/config.toml:10` | `port` | `54321` (API) |
| `apps/supabase/supabase/config.toml:29` | `port` | `54322` (Postgres) |
| `apps/supabase/supabase/config.toml:31` | `shadow_port` | `54320` |
| `apps/supabase/supabase/config.toml:41` | `port` | `54329` (db pooler) |
| `apps/supabase/supabase/config.toml:72` | `allowed_cidrs` | `["0.0.0.0/0"]` |
| `apps/supabase/supabase/config.toml:91` | `port` | `54323` (Studio) |
| `apps/supabase/supabase/config.toml:93` | `api_url` | `"http://127.0.0.1"` |
| `apps/supabase/supabase/config.toml:102` | `port` | `54324` (Mailpit) |
| `apps/supabase/supabase/config.toml:104` | `smtp_port` | `54325` |
| `apps/supabase/supabase/config.toml:105` | `pop3_port` | `54326` |
| `apps/supabase/supabase/config.toml:164` | `site_url` | `"http://127.0.0.1:5173"` |
| `apps/supabase/supabase/config.toml:166` | `additional_redirect_urls` | `["https://127.0.0.1:3000", "http://127.0.0.1:5173/en/candidate/auth/callback"]` |
| `apps/supabase/supabase/config.toml:169` | *(comment)* | names the default JWT issuer URL `http://127.0.0.1:<port>/auth/v1` |
| `apps/supabase/supabase/config.toml:374` | `inspector_port` | `8083` |
| `apps/supabase/supabase/config.toml:383` | `port` | `54327` (analytics) |

Reproduce with:

```bash
git grep -nIP 'localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|\b(5173|2500|8083|3000|8000|5432[0-9])\b' \
  -- apps/supabase/supabase/config.toml
```

Note `:72 allowed_cidrs = ["0.0.0.0/0"]` is not a port; it is included because it lives in the file
being handed off, and splitting it out would mean editing the file.

## Solution

**This item is a hand-off, not a work order for Phase 155.**

`REQUIREMENTS.md` **REVIEW-DB-08** already owns this: *"…the `config.toml` hard-coded ports resolved
from env or documented as a caveat…"*. It is scheduled as **Phase 156 — Supabase Schema Corrections**,
criterion 8. `155-CONTEXT.md` `<open>` item 5 names the collision explicitly, and the disposition rule
Phase 155 adopted routes every `config.toml` hit to Phase 156 **by naming it rather than editing it**.

**Phase 155 deliberately did not modify this file.** Asserted at the close of Plan 06:

```bash
$ git status --porcelain apps/supabase/supabase/config.toml
                                       # empty
```

Two things Phase 156 will want that this sweep can supply:

1. **`site_url` and `additional_redirect_urls` are now coupled to `SITE_URL`.** Phase 155 made
   `SITE_URL` a mandatory Edge Function variable (`identity-callback`, `invite-candidate`) with a
   throw naming it. `config.toml:164` hard-codes the same origin for Supabase Auth's own redirects.
   If Phase 156 parameterises one, the two must not be allowed to drift — a deployment where
   `SITE_URL` and `site_url` disagree sends the auth redirect and the invite link to different
   origins, and nothing today would notice.
2. **The frontend port `5173` in `:164` and `:166` is the `FRONTEND_PORT` escape hatch's value.**
   `CLAUDE.md` documents `FRONTEND_PORT` as overridable for the dev server and the E2E preflight, but
   `config.toml` does not follow it. An operator running on an alternate port today has a working
   frontend and a broken auth redirect. Worth checking against the preflight's own contract before
   choosing "resolve from env" versus "document as a caveat".

## Related

- `.planning/REQUIREMENTS.md` REVIEW-DB-08 — the owner, Phase 156 criterion 8
- `.planning/phases/155-edge-function-hardening-env-jwt-provider-identity/155-PORT-LOCALHOST-SWEEP.md` § 4, bucket B
- `.planning/phases/155-edge-function-hardening-env-jwt-provider-identity/155-CONTEXT.md` `<open>` item 5 — the collision this hand-off resolves
- `.env.example:113` — `SITE_URL`, made mandatory by Phase 155 Plan 01
