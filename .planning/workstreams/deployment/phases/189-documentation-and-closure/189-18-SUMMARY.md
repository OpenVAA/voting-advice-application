---
phase: 189-documentation-and-closure
plan: "18"
subsystem: planning-records
status: complete
tags: [todos, closure, posthog, analytics, redirect-allowlist, api-limits, render, G-01, G-02, G-05, F-01]
requires:
  - 189-01 (Render template removed, CLAUDE.md § Deployment rewritten)
  - 189-02 (the frontend-URL pair removed, with its targeted E2E runs)
  - 189-03 (the orphan compose file and the development stage retired)
  - 189-05 (the 2026-11-20 probe run on the persistent project: api.max-rows, auth.redirects, db.anon-timeout PASS)
  - 189-08 and 189-12 (the hosted-settings reference page and the guide's hosted-project sections)
  - 189-11 (the guide without the bucket step)
provides:
  - "Five absorbed todos closed on the record in .planning/todos/completed/, each with created/completed/status keys and a ## Closed (phase 189), 2026-11-21 section"
  - "The log-sink comparison (G-02): CloudWatch 90-day log group as the server sink, PostHog Cloud EU for analytics, self-hosting an anti-feature, browser errors FUT-08"
  - "The redirect-allowlist todo's stale /api/auth/callback paragraph corrected to /auth/confirm and /*/auth/confirm, with a dated note (G-05)"
  - "One out-of-scope finding in deferred-items.md: the hosted-settings page has no row for the anon statement_timeout or db.anon-timeout"
affects:
  - DOCS-08 (all seven absorbed todos now have closure records: the caller-limit todo in 188, the hosted-auth todo in 189-17, these five here)
tech-stack:
  added: []
  patterns: ["a closure states what remains from a re-measurement, not from the plan's expectation; a gap found while closing is logged and cited under Moved"]
key-files:
  created:
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/189-18-SUMMARY.md
  modified:
    - .planning/todos/completed/2026-08-31-evaluate-self-hosted-posthog-log-sink.md (moved from pending/)
    - .planning/todos/completed/2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e.md (moved from pending/, frontmatter block added)
    - .planning/todos/completed/2026-09-02-deployment-guide-production-redirect-allowlist.md (moved from pending/, stale path corrected)
    - .planning/todos/completed/2026-09-18-document-supabase-api-limits-for-deployments.md (moved from pending/)
    - .planning/todos/completed/2026-10-02-deployment-config-gaps-found-by-docs-rewrite.md (moved from pending/)
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/deferred-items.md
key-decisions:
  - "G-02: the log-sink evaluation closes on the milestone's scoping: the server sink is the CloudWatch log group (90 days on staging), analytics is PostHog Cloud EU (188 truth 1), self-hosted PostHog is out of scope; only the browser half remains, as FUT-08"
  - "The API-limits todo closes with one thing remaining: the hosted-settings page documents max_rows/api.max-rows but has no row for the anon statement_timeout or db.anon-timeout; logged in deferred-items.md rather than edited, being outside this plan's files"
  - "The redirect-allowlist correction keeps the paragraph's sense and adds a dated note naming the replaced path, the one body edit G-05 allows"
  - "The closure dates are 2026-11-21, the local date the records were written"
metrics:
  duration: "about 12 min; ledger written after 013e711eb (2026-11-21 00:00 local), last task commit 2026-11-21 00:06:59 +0200"
  completed: 2026-11-21
estimate:
  tokens: 50000
  tasks: 3
actuals:
  tokens: 2800
  tasks: 3
  commits: 3
plan_head_before: 013e711ebc3596453c755d0bf5dbab1d3a268743
plan_head_after: 8a91f098a60d7d7aa507bf0a24e3835ba5e015f2
requirements-completed: [DOCS-08]
---

# Phase 189 Plan 18: The five remaining absorbed todos closed Summary

**Five absorbed todos are closed on the record and moved to `completed/`, each pointing at what this milestone built. With the caller-limit todo (phase 188) and the hosted-auth todo (189-17), all seven now have closure records, so DOCS-08 is met. One gap turned up while closing them: the hosted-settings page has no row for the anon `statement_timeout`. It is logged in `deferred-items.md`, and the API-limits closure names it under What remains.**

## What was done

**Task 1, commit `d54370773`: the log-sink and analytics todos.**
- `2026-08-31-evaluate-self-hosted-posthog-log-sink.md` gained `created: 2026-08-31`, `completed:` and `status:`. Its closure carries a four-row comparison, all from measured or decided sources:
  - The server sink is the `awslogs` driver to `/openvaa/<environment>/frontend`, kept 90 days on staging (`infra/modules/frontend-service/service.tf`, `terraform.tfvars` `log_retention_days = 90`).
  - Analytics goes to PostHog Cloud EU (`188-VERIFICATION.md` truth 1, RELAY-04).
  - Self-hosted PostHog, or PostHog as the log sink, is an anti-feature (`REQUIREMENTS.md` § Out of Scope).
  - Browser errors through the relay are FUT-08.
  - What remains: FUT-08.
- `2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e.md` had no frontmatter. It gained a block with `title:` (its heading), `created: 2026-06-01` (its Filed line), `completed:` and `status:`, and its heading and body are unchanged. The closure cites:
  - `analytics.trackEvents`, `false` by default (`dynamicSettings.ts`). `staticSettings.ts` no longer carries an analytics setting.
  - The three voter specs and where they run: `voter-prefs-tracking` behind `data-setup-perm-analytics-tracking`, and `analytics-consent-free`.
  - The 188 full run `188-close3-20261119T213204Z`, with 729 passed.
  - The `configuration/analytics` page.
  - What remains: none.

**Task 2, commit `405a6c994`: the redirect-allowlist and API-limits todos.**
- The redirect-allowlist todo gained `created:`, `completed:` and `status:`.
  - Its Update 2026-10-07 paragraph now names `/auth/confirm` and `/*/auth/confirm`, followed by "(corrected 2026-11-21, phase 189: the route is the confirm page; …)". This is the only line of an original body that was removed.
  - The closure cites `redirect_callback_paths` in `hosted-settings.json` and the `uri_allow_list` that `settings.tf` builds from it.
  - It cites staging's 2026-11-17 apply (Step 18 row of the Supabase README's Observations) and `auth.redirects` PASS on 2026-11-20 (`evidence/189-05-staging-reads.md`).
  - It also cites the phase-184 five-case read (`184-16`), the guide's § The sign-in link of an invitation and the hosted-settings rows.
- The API-limits todo closes on four points:
  - `max_rows` 50000, checked by `api.max-rows`.
  - The anon `statement_timeout = '8s'` of `001-role-settings.sql`, checked by `db.anon-timeout`. That check is the verification query the todo asked for.
  - Both checks passed on 2026-11-20.
  - The `render.example.yaml` done-when item is void: the file was removed by the 2026-11-20 ruling (F-01, 189-01).

**Task 3, commit `8a91f098a`: the deployment-config gaps.** The closure re-measured each item on 2026-11-21 and closes them one bullet each:
- Item 1: the Render template was removed, not fixed (189-01). The root compose sets `PUBLIC_PROJECT_ID`, and so does `task-environment.json`. `CLAUDE.md` § Deployment was rewritten.
- Item 2: the frontend-URL pair was removed (189-02, with its three targeted run directories). `git grep` finds nothing.
- Item 3: the orphan compose file and the `development` stage were retired and the production image builds (189-03, with `evidence/189-03-orphan-compose.md`).
- Item 4: both buckets are inserted by `400-storage.sql`, and the guide's bucket step is gone (189-11).
- What remains: none.

The caller-limit todo, closed in 188, was not touched.

## Deviations from Plan

**1. [Rule 1 - accuracy] The anon timeout has no row on the hosted-settings page.**
- **Found during:** Task 2.
- **Issue:** The plan's read_first expected the page to carry "the `max_rows` row and the `db.anon-timeout` check". `grep -i 'statement.timeout\|anon-timeout'` over `apps/docs/src/routes/(content)/developers-guide/` finds nothing.
- **Fix:** The closure says this under What remains instead of claiming "both rows on the hosted-settings page". The finding is logged as a 189-18 row of `deferred-items.md`, and the closure cites that row under Moved. The page itself was not edited, because it is outside this plan's files.
- **Commit:** `405a6c994`.

**2. [Rule 1 - accuracy] The project names.**
- The plan names "the `perm-analytics-tracking` project". In `tests/playwright.config.ts` that is a setup and teardown pair, `data-setup-perm-analytics-tracking`. The specs themselves run in `voter-prefs-tracking`, and the consent-free spec runs in `analytics-consent-free`. The closure names them as the config has them.

**3. A guide-section citation was narrowed.** § Auth settings of a hosted project does not mention the allowlist, so the redirect closure cites only § The sign-in link of an invitation, which names `uri_allow_list` and `redirect_callback_paths`.

## Verification

- The `<automated>` blocks of Tasks 1, 2 and 3 each exited 0 (`VERIFY_OK`).
- Acceptance:
  - `grep -c '90'` on the log-sink record prints 1 (expected >= 1).
  - `grep -c '/\*/auth/confirm'` on the redirect record prints 2 (expected >= 1).
  - `grep -c '2026-11-20'` on the config-gaps record prints 1 (expected >= 1).
- Prohibition: `git diff --cached -M | grep -c '^-[^-]'` was 0 for Tasks 1 and 3. For Task 2 it was 1, the one stale paragraph G-05 names. Every rename was detected as `R0xx`.
- E2E: no project is affected. Only `.planning/` records changed (`E2E_DELTA=0`).
- Tracer gate (Task 1): `<verify>` was re-run end to end and passed.

## Known Stubs

None. The records cite existing paths only.

## Self-Check: PASSED

- FOUND: all five records in `.planning/todos/completed/`. None of the pending originals exists.
- FOUND commits: `d54370773`, `405a6c994`, `8a91f098a` (each is an ancestor of HEAD).
