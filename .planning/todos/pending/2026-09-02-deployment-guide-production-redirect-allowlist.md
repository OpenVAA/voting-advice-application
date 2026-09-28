---
title: Deployment guide must document the production auth redirect allowlist
priority: high
source: Phase 158 plan 06 checkpoint answer (a), 2026-09-02
---

Phase 158 plan 06 moved the candidate auth callback from
`/<locale>/candidate/auth/callback` to `/api/candidate/auth/callback`.

The local half of the redirect allowlist lives in
`apps/supabase/supabase/config.toml` under `[auth] additional_redirect_urls` and is
under version control. **The production half does not exist in this repository.** It
lives in the Supabase project dashboard under Authentication → URL Configuration →
Redirect URLs, and nothing in the test suite can see it. A deploy that lands the moved
code while the production list still names the old path breaks invite emails and
password-recovery emails in production only, with a fully green suite.

There is no deployment guide document in this repository today — `render.example.yaml`
and `CLAUDE.md` § Deployment are the closest things, and neither mentions the redirect
allowlist at all. Whichever document becomes the deployment guide MUST carry this step.

## Exact URLs that must be present in the production redirect allowlist

Substitute the deployed frontend origin for `<INSTANCE_ORIGIN>` (e.g.
`https://vaa.openvaa.org`). The path parts below are exact and are not placeholders.

1. `<INSTANCE_ORIGIN>/api/candidate/auth/callback`
2. `<INSTANCE_ORIGIN>/en/api/candidate/auth/callback`

Entry 1 is what `SupabaseDataWriter._requestForgotPasswordEmail` emits from the browser
(an origin-relative unprefixed path). Entry 2 is the locale-prefixed form the E2E
helpers and the base-locale mail links use.

If the local allowlist in `config.toml` is later widened to a single-segment mid-path
pattern of the form `<ORIGIN>/*/api/candidate/auth/callback`, the production list should
carry the same pattern INSTEAD of enumerating every supported locale — but only that
form. A trailing wildcard, a prefix wildcard, a bare `/**` or a host wildcard must never
be added: the list is an exact-URL boundary by design and broadening it converts a closed
redirect boundary into an open one.

## Old entries to remove

`<INSTANCE_ORIGIN>/en/candidate/auth/callback` and any sibling locale-prefixed form of
the old path are dead after this move and should be removed once the new code is live.
