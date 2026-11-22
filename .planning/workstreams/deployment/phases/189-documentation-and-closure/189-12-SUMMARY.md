---
phase: 189-documentation-and-closure
plan: "12"
subsystem: docs
status: complete
tags: [docs, deployment-guide, supabase, auth-settings, rate-limits]
requires:
  - 189-08 (the hosted-settings reference page the auth section points to)
  - 189-11 (the guide's empty-account-to-tested-instance path)
provides:
  - "The guide's four hosted-project sections on the Terraform path, with dated staging observations"
affects:
  - apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
tech-stack:
  added: []
  patterns: ["the guide explains, the reference page lists: each auth setting's reason stays in the guide, its row lives on /developers-guide/deployment/hosted-settings"]
key-files:
  created: []
  modified:
    - apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
key-decisions:
  - "The seven auth settings are listed by their Terraform keys, and the two sign-up switches are named by the dashboard labels the Supabase runbook observed on 2026-11-08/09"
  - "behind_cloudflare is documented as written by bootstrap.sql from BOOTSTRAP_BEHIND_CLOUDFLARE, with staging's value dated from the 2026-11-10 header row and the 2026-11-11 bootstrap rows"
  - "DOCS-01/02/03 are not marked complete by this plan: they span the phase, and this plan meets only its four sections of them"
metrics:
  duration: "about 5 min of edit time, 2026-11-20T21:49Z to 21:57Z"
  completed: 2026-11-20
estimate:
  tokens: 55000
  tasks: 2
actuals:
  tokens: 5424
  tasks: 2
  commits: 2
plan_head_before: 6b40ae62cbb480e214b7c0562aca1c52c694f224
plan_head_after: 0af9fbd3bcfa1b6fa647e13e484377aa8ed43549
---

# Phase 189 Plan 12: The guide's hosted-project sections on the Terraform path Summary

The deployment guide's § Auth settings of a hosted project now says the Supabase module's settings resource writes the auth settings as their only writer, lists the seven by Terraform key and points to the hosted-settings reference, and § The sign-in link of an invitation, § Feedback rate limit and Cloudflare and § The per-caller limit of account-access name where the repository sets each value (the settings resource, `function-secrets.tf`, `bootstrap.sql`), each with staging's dated observation.

## Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 (tracer) | The auth settings section, written by the module and checked by the probe | `6d86c5973` | `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md` |
| 2 | The sign-in link, the feedback limit and the per-caller limit, on the repository's settings with staging's values dated | `0af9fbd3b` | `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md` |

### Task 1

- The opening says `supabase_settings.this` writes each auth setting and is their only writer, that `hosted-settings.json` holds the shared values and `yarn assert:hosted-settings-parity` holds them equal to the local `config.toml`, and that a value is changed in `hosted-settings.json` and applied, not in the dashboard.
- The dashboard table is replaced by a list of the seven settings by key (`disable_signup`, `mailer_autoconfirm`, `password_min_length`, `mailer_otp_length`, `mailer_otp_exp`, `hook_send_email_enabled`/`hook_send_email_uri`, `mailer_secure_email_change_enabled`), followed by the link to `/developers-guide/deployment/hosted-settings`.
- The five reasons stay. The password-length and link-lifetime bullets now say the parity guard lets the hosted value be stricter, never weaker (the "hosted may be stricter" class). The hook bullet says the module's `hook_send_email_uri` points the hook at the function while `enable_send_email_hook` is `true`.
- The served-settings `curl` read stays. The conformance probe is now the full check, with the four check names that cover the seven settings (`auth.signup-closed`, `auth.email-confirm`, `auth.other-settings`, `auth.send-email-hook`, all four confirmed in `infra/scripts/probe/`) and the 2026-11-20 run, 22 of 22 passing, linked to Step 23 and Observations.
- The paragraph saying the dashboard names were not checked is deleted. The two switches are named "Allow new users to sign up" and "Confirm email" as the runbook's 2026-11-08/09 row records them.
- The paragraph on the database having no guard of its own is kept unchanged.
- Tracer gate: the task's `<verify>` was run again after the commit and exited 0, so the plan went on to Task 2.

### Task 2

- § The sign-in link of an invitation: the table's "Where" column now names where the repository sets each item: `disable_signup`/`mailer_autoconfirm` and `uri_allow_list` (built from `redirect_callback_paths`) written by the settings resource, and `SITE_URL` and the five `SMTP_*` names written by `function-secrets.tf`. The function's two refusals and their log lines are kept. The test-coverage sentence now says only what exists: unit tests of the function's modules, with injected answers. "Only the dashboard setting prevents that" now reads "Only `disable_signup` prevents that".
- § Feedback rate limit and Cloudflare: the SQL-editor `UPDATE` is replaced by `bootstrap.sql`, which requires `BOOTSTRAP_BEHIND_CLOUDFLARE`, refuses to run without it and writes it on every run (checked against the script's `\if :behind_cloudflare_missing` and `ON CONFLICT ... DO UPDATE`). The precondition and the reason hosted Supabase must set it are kept. Two dated rows are added: 2026-11-10, when Cloudflare refused a client-sent `cf-connecting-ip` with 403, and 2026-11-11, when both persistent bootstraps left `behind_cloudflare` true (184-22 `s20_behind_cloudflare` true/true). Both link Step 20 and Observations.
- § The per-caller limit of account-access: the mechanism and § What is stored are kept. A new paragraph records the 2026-11-19 row: one caller got 429 with `Retry-After` at its 31st `check-code` call, while a second caller inside that window got 200 until its own 31st call. It links the runbook's Observations.

## Verification

- Task 1 `<verify>`: exit 0, before and after the commit. The section holds the pointer (1 occurrence of `deployment/hosted-settings`) and `mailer_otp_length`, and has neither "set each by hand" nor "are unverified against". Prettier passes, and `validate:links --check` reports 0 findings.
- Task 2 `<verify>`: exit 0. All four headings are unchanged, `BOOTSTRAP_BEHIND_CLOUDFLARE` and `function-secrets.tf` are both named, and no SQL-editor update remains. The page has none of the recorded-search words (`unverified|not yet observed|untested|untried|not been (observed|measured)|was not measured`). Prettier passes, `validate:links --check` reports 0 findings, and `yarn workspace @openvaa/docs build` exits 0.
- Acceptance: `grep -c '2026-11-19'` on the guide prints 1 (pinned at HEAD 0, expected 1 or more).
- I checked the GitHub-link fragments against the runbook's headings by hand: `#observations`, `#step-20-the-bootstrap` and `#step-23-the-conformance-probe` all exist in `infra/envs/staging/supabase/README.md`. The same-page anchors `#checking-the-instance` and `#the-supabase-project` are covered by the link check.
- E2E: no project affected, delta 0. The plan changes only one docs page.

## Deviations from Plan

None. The plan ran as written.

Out-of-scope finding, recorded in `deferred-items.md`: `developers-guide/backend/email/+page.md` still says "A hosted project adopts the hook in its dashboard". It links to the section this plan rewrote, but it is not in this plan's files.

## Threat mitigations

- T-189-26: the section says the module writes `disable_signup` and that the probe's `auth.signup-closed` checks it. The database's lack of a guard of its own is still stated.
- T-189-27: `BOOTSTRAP_BEHIND_CLOUDFLARE=true` through `bootstrap.sql` is the documented way to set it, alongside the reason hosted Supabase must set it.
- T-189-SC: no package was installed.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md`
- FOUND: `6d86c5973` (ancestor of HEAD)
- FOUND: `0af9fbd3b` (ancestor of HEAD)
