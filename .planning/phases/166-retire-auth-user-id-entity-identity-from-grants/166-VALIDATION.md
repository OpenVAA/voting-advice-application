---
phase: "166"
slug: "retire-auth-user-id-entity-identity-from-grants"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-01"
---

# Phase 166 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pgTAP via `supabase test db` (pg_prove); vitest (Edge Functions, dev-seed, frontend); Playwright 1.58.2 through `tests/scripts/e2e-run.sh` |
| **Config file** | `apps/supabase/vitest.config.ts` (`supabase/functions/**/*.test.ts`); `tests/playwright.config.ts`; pgTAP files under `apps/supabase/supabase/tests/database/` |
| **Quick run command** | `yarn workspace @openvaa/supabase test:unit` (Edge Function tasks) · `yarn db:reset && yarn workspace @openvaa/supabase test:db` (schema / pgTAP tasks) |
| **Full suite command** | `yarn lint:check && yarn format:check && yarn test:unit && yarn db:reset && yarn db:lint:sql && yarn workspace @openvaa/supabase test:db`, then `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name>` (each status read directly, never through a pipe) |
| **Estimated runtime** | quick: ~60-120 s each · pgTAP with reset: ~2-3 min · candidate E2E project: ~5-8 min · bank-auth: ~3 min per run · bank-auth-journey: ~11 min per run · full suite: ~11 min |

---

## Sampling Rate

- **After every task commit:** the task's own `<automated>` commands, always including the scoped hygiene scan `bash .planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-hygiene-scan.sh <files>`.
- **After every plan:** `yarn lint:check` and `yarn format:check`, the pgTAP suite after a reset, and at least one E2E project that exercises the plan's path (166-01: `candidate-a11y-scan`; 166-02: `bank-auth`, `candidate-journey`, `candidate-a11y-scan`; 166-03: `candidate-a11y-scan` on a post-drop reset; 166-04: every gate).
- **Before `/gsd-verify-work`:** 166-04's D-20 chain green, recorded in `166-04-gate-evidence/GATES.md`.
- **Max feedback latency:** ~120 s for unit and pgTAP; E2E runs are background-and-poll by rule (a foreground run trips the 600 s watchdog).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 166-01-01 | 01 | 1 | AUTHID-01 | T-166-01, T-166-02, T-166-03, T-166-05, T-166-06 | own entity from an editor grant row; admins and entity-admins resolve to nothing; ambiguity raises P0001 + HINT; helper private, definer, search_path pinned | pgTAP + E2E | `yarn db:reset && yarn workspace @openvaa/supabase test:db` · `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-01-tracer --project candidate-a11y-scan` | ❌ W0 (`36-entity-identity.test.sql` created here, red first: NC-1) | ⬜ pending |
| 166-01-02 | 01 | 1 | AUTHID-04 | T-166-04 | second user on a candidate refused by index name; exact duplicate names the table key; grant write succeeds only on that key | pgTAP + vitest | `yarn workspace @openvaa/supabase test:unit` · `yarn db:reset && yarn workspace @openvaa/supabase test:db` | ✅ extend (`entityGrant.test.ts` ×2, `36`), red first: NC-2, NC-3 | ⬜ pending |
| 166-01-03 | 01 | 1 | AUTHID-06, AUTHID-07 | T-166-07 | census observed red with the column present, held as TODO; writer comment truthful | pgTAP + svelte-check + lint | `yarn db:reset && yarn workspace @openvaa/supabase test:db` · `yarn workspace @openvaa/frontend check && yarn workspace @openvaa/frontend test:unit` · `yarn lint:check` | ✅ (36), red recorded: NC-4 | ⬜ pending |
| 166-02-01 | 02 | 2 | AUTHID-02 | T-166-08, T-166-09, T-166-10 | lookup by grant with the project filter inside; compensating delete on the create branch only; same candidate on a second login | vitest + E2E | `yarn workspace @openvaa/supabase test:unit` · `PLAYWRIGHT_BANK_AUTH=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-02-bank-auth --project bank-auth --no-db-reset` | ✅ extend, red first: NC-5; injected-fault red: NC-6 | ⬜ pending |
| 166-02-02 | 02 | 2 | AUTHID-03 | T-166-11 | a failed grant write still rolls back the invited user and the candidate; no link step | vitest (source text) | `yarn workspace @openvaa/supabase test:unit` | ✅ edit, red first: NC-7 | ⬜ pending |
| 166-02-03 | 02 | 2 | AUTHID-05, AUTHID-07 | T-166-12, T-166-13 | harness identity from grants; ids read before grants are deleted | typecheck + lint + E2E | `yarn lint:check` · `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-02-candidate-journey --project candidate-journey --no-db-reset` · `... --project candidate-a11y-scan --no-db-reset` | ✅ | ⬜ pending |
| 166-03-01 | 03 | 3 | AUTHID-05, AUTHID-06 | T-166-14, T-166-16, T-166-17 | column, indexes, seed value, keys and types gone in one commit; census green un-wrapped | pgTAP + typecheck + E2E | `yarn db:reset && yarn workspace @openvaa/supabase test:db` · `yarn lint:check` · `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-03-tracer --project candidate-a11y-scan` | ✅ (NC-4 closed green) | ⬜ pending |
| 166-03-02 | 03 | 3 | AUTHID-05, AUTHID-07 | T-166-15 | schema comments and policy guards name nothing that cannot exist; one census exemption | pgTAP + parity | `yarn db:reset && yarn workspace @openvaa/supabase test:db` · `yarn assert:schema-migration-parity` | ✅ | ⬜ pending |
| 166-03-03 | 03 | 3 | AUTHID-05, AUTHID-07 | — | the column's name survives only in the census | population check + full static/unit/pgTAP | `test "$(git grep -l auth_user_id -- apps packages tests)" = "apps/supabase/supabase/tests/database/36-entity-identity.test.sql"` · `yarn lint:check && yarn format:check` · `yarn test:unit` | ✅ | ⬜ pending |
| 166-04-01 | 04 | 4 | AUTHID-08 | T-166-19 | D-20 links 1-4 green on the final tree, statuses recorded | all | see 166-04 Task 1 | ✅ | ⬜ pending |
| 166-04-02 | 04 | 4 | AUTHID-08 | T-166-18 | bank-auth ×3 and bank-auth-journey ×3, no key or TLS bypass leaked | E2E | `PLAYWRIGHT_BANK_AUTH=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-04-bank-auth-<n> --project bank-auth --no-db-reset` (and `bank-auth-journey`) | ✅ | ⬜ pending |
| 166-04-03 | 04 | 4 | AUTHID-08, AUTHID-09 | T-166-20 | skill docs and todos true of the tree; full suite under the cardinal rule | doc greps + E2E | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-04-full` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/supabase/supabase/tests/database/36-entity-identity.test.sql` — created by 166-01 Task 1 before the RPC change (catalog and RPC-behaviour assertions, red first), extended in Task 2 (index names) and Task 3 (census, TODO-wrapped after the red run); unwrapped in 166-03.
- [ ] `entityGrant.test.ts` (both copies) — a 23505 naming `idx_grants_one_candidate_editor` must throw `ERR_GRANT_WRITE_FAILED` (166-01 Task 2).
- [ ] `candidateRecord.test.ts` — grant-then-candidate lookup cases and `deleteCandidate` with the project filter (166-02 Task 1).
- [ ] `candidate-bank-auth.spec.ts` — a second identity-callback POST returns the same `candidate_id` (166-02 Task 1; today no test reaches the existing-candidate branch).

*Existing infrastructure covers everything else; no framework install.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No comment in a touched file narrates history or addresses the reviewer | AUTHID-07 | Historical narrative can only be judged by reading; the scan catches reference forms and prints advisory cues | Read every touched file whole; resolve every "ADVISORY narrative cues" line the scan prints; the plan summaries list any cue left in place and why |
| `.claude/skills/database/*` describe the grant-only identity correctly | AUTHID-09 | Agent docs are exempt from code gates; correctness is a reading | Check each claim in the new "Which entity am I" entry against `301-auth-functions.sql`, `503-entity-rpcs.sql` and `300-auth-tables.sql`; `git grep -n auth_user_id -- .claude/skills` prints nothing |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 166s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** {pending / approved YYYY-MM-DD}
