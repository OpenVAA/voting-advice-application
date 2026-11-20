---
title: Deployment guide must document the production auth redirect allowlist
priority: high
source: Phase 158 plan 06 checkpoint answer (a), 2026-09-02
created: 2026-09-02
completed: 2026-11-21
status: completed
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

## Update 2026-10-07 (Phase 174, plan 174-10)

The paths above are the callback's as they were at Phase 158. On the current tree the route is the confirm page, `/auth/confirm`, and the local allowlist in `config.toml` admits it with and without one locale segment (`http://localhost:5173/auth/confirm` and `http://localhost:5173/*/auth/confirm`). The production list therefore needs `<INSTANCE_ORIGIN>/auth/confirm` and `<INSTANCE_ORIGIN>/*/auth/confirm`, the single-segment mid-path form this todo anticipated, and none of the entries listed above.

(corrected 2026-11-21, phase 189: the route is the confirm page; this paragraph named `/api/auth/callback`, the route at the close of Phase 174)

The deployment page now carries the step (`apps/docs/src/routes/(content)/developers-guide/deployment/+page.md`, § 2 item 3 and § The sign-in link of an invitation). What remains is doing it on a hosted project and observing the result, which is filed as `2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md`. `account-access` asks the auth service whether its callback URL is admitted and mails no link when it is not, so a missing entry now shows as a log line of that function rather than as a broken link.

## Closed (phase 189), 2026-11-21

Closed by plan 189-18.

- **What was built.** The production half of the allowlist is now in this repository. The Supabase module writes it: `infra/modules/supabase/hosted-settings.json` declares `redirect_callback_paths` (`/auth/confirm` and `/*/auth/confirm`), and `infra/modules/supabase/settings.tf` builds `uri_allow_list` from them, each prefixed by the project's `public_origin`. No wildcard but the single-segment mid-path form is written. Staging applied it on 2026-11-17 (Step 18 of `infra/envs/staging/supabase/README.md` § Observations): `uri_allow_list` went from the two `/api/auth/callback` paths to `https://staging.openvaa.org/auth/confirm,https://staging.openvaa.org/*/auth/confirm`, and the plan after it read `No changes`. The conformance probe's `auth.redirects` check compares the served list with the module's, and passed on the persistent project on 2026-11-20 (`.planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-05-staging-reads.md`). The allowlist's five cases, with `/auth/v1/verify` answering 303, were observed on a throwaway hosted project in phase 184 (`.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-16-throwaway-mail-redirects-slot.md`). The deployment guide carries the step (`apps/docs/src/routes/(content)/developers-guide/deployment/+page.md` § The sign-in link of an invitation, which names `uri_allow_list` and the `redirect_callback_paths` it is written from), and `developers-guide/deployment/hosted-settings` lists `redirect_callback_paths` and `uri_allow_list` with their check (plans 189-08 and 189-12). The old entries this todo asked to remove were replaced by the same apply.
- **What remains.** None.
- **Moved.** None.
