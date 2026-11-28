---
phase: "186"
slug: "deployed-smoke-entry"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-15"
audited: "2026-11-21"
---

# Phase 186 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source: `186-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 5.0.2 (harness unit tests); Playwright 1.63.0 (deployed smoke and local E2E) |
| **Config file** | `tests/vitest.config.ts` (include `tests/utils/**/*.test.ts`); `tests/playwright.deployed.config.ts` |
| **Quick run command** | `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"; node_modules/.bin/vitest run --config tests/vitest.config.ts deployed` |
| **Full suite command** | `yarn lint:check && yarn format:check && yarn test:unit`, then `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/186-close-<ts> --no-db-reset` |
| **Estimated runtime** | ~10 seconds (quick); full local E2E ~18 minutes |

---

## Sampling Rate

- **After every task commit:** quick run command, plus `node_modules/.bin/eslint tests/deployed-global-setup.ts tests/tests/deployed tests/tests/utils/deployedTarget.ts` and `yarn typecheck:tests`
- **After every plan wave:** `yarn test:unit` (stack up) and, once the specs exist, the hosted voter run
- **Before `/gsd-verify-work`:** lint, format and unit all exit 0; the SC4 diff is empty and the local `--list` count unchanged (`Total: 548 tests in 127 files`); one full `e2e-run.sh` run is green (a void run is repeated); after the operator checkpoint, the full deployed smoke run is green
- **Max feedback latency:** 30 seconds (unit); E2E per its own runtime

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command (abbreviated; full form in the plan) | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|--------------------------------------------------------|-------------|--------|
| 186-01-T1 (tracer) | 01 | 1 | SUPA-09 | gate end to end against a stub: ordered PASS/FAIL lines, identity read from tfvars only | unit + lint | `vitest run --config tests/vitest.config.ts deployedTarget`; eslint; `yarn typecheck:tests` | ✅ `deployedTarget.test.ts` | ✅ green (run 2026-11-21) |
| 186-01-T2 | 01 | 1 | SUPA-09 | refusal matrix, no input widens the ref, config-shape check, input reader | unit | same, plus `yarn test:unit:tests` | ✅ | ✅ green (run 2026-11-21) |
| 186-04-T1 (tracer) | 04 | 1 | SUPA-09 | grant SQL outcomes: exit 0 twice with `grants=1 terms=1`, exit 3 on unknown address / unset variable / other editor | integration (isolated instance) | driver script; evidence `GRANT_*` lines | ✅ `infra/scripts/grant-smoke-contestant.sql` | ✅ green (recorded: `evidence/186-04-grant-script.md` `GRANT_FIRST_EXIT=0`, `GRANT_SECOND_EXIT=0`, `GRANT_UNSET_EXIT=3`, `GRANT_UNKNOWN_EXIT=3`) |
| 186-04-T2 | 04 | 1 | SUPA-09 | Step 22 contestant items and removal; no address added | docs format + grep | `prettier --check` + anchor greps | ✅ staging Supabase README | ✅ green (prettier re-run 2026-11-21) |
| 186-02-T1 (tracer) | 02 | 2 | SUPA-09 | deployed entry + voter walk green on staging | e2e (hosted) | `yarn test:e2e:deployed …voter.smoke.ts`; `e2e-spec-verdict.mjs --passed voter.smoke.ts --no-flaky` | ✅ | manual (evidence) |
| 186-02-T2 | 02 | 2 | SUPA-09 | contestant spec fails by name without inputs; deployed list 2 tests, local list unchanged | e2e (hosted) + list | verdict `--failure-contains 'SMOKE INPUT MISSING'` | ✅ | manual (evidence: `evidence/186-02-entry.md` `CONTESTANT_NOINPUT_EXIT=1`) |
| 186-03-T1 (tracer) | 03 | 3 | SUPA-09 | ESLint lock fires on a planted value import, not on a type import | lint (seen red, then green) | eslint on the smoke files; root script check | ✅ `tests/eslint.config.mjs` | ✅ green (eslint exit 0 re-run 2026-11-21; red side recorded in `evidence/186-03-lock.md` `LOCK_PLANTED_VALUE_EXIT=1`, `LOCK_PLANTED_TYPE_EXIT=0`) |
| 186-03-T2 | 03 | 3 | SUPA-09 (PIPE-07 SC3) | token scan, single-project config shape, import closure reaches no admin client | unit | `vitest run … deployedSmokeGuards`; `assert-unit-test-coverage.mjs` | ✅ `deployedSmokeGuards.test.ts` | ✅ green (run 2026-11-21) |
| 186-05-T1 (tracer) | 05 | 4 | SUPA-09 | control 1: wrong SHA refused, non-zero exit | e2e control (hosted GETs) | evidence `CONTROL_SHA_EXIT` | — | manual (evidence: `evidence/186-05-controls.md`; re-run by the verifier on the five-check gate, exit 1) |
| 186-05-T2 | 05 | 4 | SUPA-09 | controls 2 and 3: wrong project id, not the dedicated ref | e2e control (local build vs hosted) | evidence `CONTROL_PROJECT_ID_EXIT=1`, `CONTROL_REF_EXIT=1` | — | manual (evidence); the same refusals are unit cases in `deployedTarget.test.ts`, green 2026-11-21 |
| 186-06-T1 (tracer) | 06 | 4 | SUPA-09 | tests/README § Deployed smoke run | docs format + list | `prettier --check` + anchors; deployed `--list` → 2 tests | ✅ | ✅ green (prettier re-run 2026-11-21; list recorded in `186-06-SUMMARY.md`) |
| 186-06-T2 | 06 | 4 | SUPA-09 | CLAUDE.md Testing line | docs format | `prettier --check` | ✅ | ✅ green (re-run 2026-11-21) |
| 186-07-T1 (tracer) | 07 | 5 | SUPA-09 | lint/format/unit; SC4 diff empty; local list unchanged | gates + git diff | evidence lines; `git diff --quiet a7a4222a8 -- <three local gate files>` | ✅ | ✅ green (recorded: `evidence/186-07-final-gates.md` `SC4_LOCAL_GATE_DIFF=empty`, `LOCAL_LIST=Total: 548 tests in 127 files`; see note on SC4 below) |
| 186-07-T2 | 07 | 5 | SUPA-09 | one full local E2E run green | E2E | `e2e-run.sh`; `e2e-spec-verdict.mjs <run> --no-flaky` | ✅ | ✅ green (recorded: run of record `tests/e2e-runs/187-close-20261115T032900Z`, 548 passed, verdict re-read by the verifier, exit 0) |
| 186-08-T1 (tracer) | 08 | 6 | SUPA-09 | readiness, read-only | hosted read | evidence lines; voter verdict | — | manual (evidence: `evidence/186-08-readiness.md`) |
| 186-08-T2 | 08 | 6 | SUPA-09 | operator approval and keychain address item | checkpoint:human-action | `attempt.sh bound 186-08-2` | — | manual (operator; binding re-read by the verifier, exit 0) |
| 186-08-T3 | 08 | 6 | SUPA-09 | the sitting and the full deployed smoke green | e2e (hosted) | verdict `--passed voter.smoke.ts --passed contestant.smoke.ts --no-flaky` | ✅ | manual (evidence: `evidence/186-08-green-run.md`, run dir `186-08-green-20261115T120003Z`, 2 passed, verdict re-run by the verifier exit 0) |

The requirement → test map:

| Req / SC | Behavior | Test Type | Automated Command | File Exists | Status |
|----------|----------|-----------|-------------------|-------------|--------|
| SUPA-09 | ref check refuses every ref but the tfvars one; no input widens it; missing or unparsable env block fails closed | unit | `node_modules/.bin/vitest run --config tests/vitest.config.ts deployedTarget` | ✅ | ✅ green |
| SUPA-09 | project-id check: absent attribute, placeholder, other id all fail | unit | same | ✅ | ✅ green |
| SUPA-09 / PIPE-07 | SHA check: unset, short, upper-case, mismatched, non-200 health all fail; an exact match passes | unit | same | ✅ | ✅ green |
| SUPA-09 | gate refuses a set `SUPABASE_SERVICE_ROLE_KEY`; all checks are evaluated and printed even when the first fails | unit | same | ✅ | ✅ green |
| PIPE-07 (SC3) | no remote-seed switch in workflows or the smoke entry; one project, no dependencies, no setup/teardown; the value-import closure reaches no admin client | unit | `node_modules/.bin/vitest run --config tests/vitest.config.ts deployedSmokeGuards` | ✅ | ✅ green (also `grep -rnE 'DEV_SEED_ALLOW_REMOTE\|allow-remote\|allowRemote' .github <entry files>` exit 1, 2026-11-21) |
| SC3 | the ESLint rule fires on a planted value import, not on a type import | lint (seen failing) | `node_modules/.bin/eslint tests/tests/deployed` | procedure | ✅ green (red recorded in `186-03-lock.md`) |
| SC1 voter | gate PASS against staging; voter walk to results | e2e (hosted) | `yarn test:e2e:deployed tests/tests/deployed/voter.smoke.ts` + verdict | ✅ | manual (evidence) |
| SC1 contestant | sign-in, home tasks complete, sign-out | e2e (hosted) | full `yarn test:e2e:deployed` + verdict | ✅ | manual (evidence) |
| SC2 | wrong SHA, wrong project id, not the dedicated project → non-zero, each with its FAIL line | e2e (controls) | three runs, `echo "smoke_exit=$?"` each | procedure | manual (evidence); unit-backed |
| SC4 | local gate files byte-identical; `--list` unchanged; full local suite green | git + list + e2e | `git diff --exit-code a7a4222a8 -- tests/playwright.config.ts tests/global-setup.ts tests/tests/support/preflight.ts`; `--list` total; `e2e-run.sh` exit 0 | existing | ✅ green at phase close (recorded) |
| grant SQL | exit 0 on the first and second run with `grants=1 terms=1`; exit 3 on an unknown address, an unset variable, or a candidate with another editor | integration (isolated instance) | driver script, statuses read directly | ✅ | ✅ green (recorded) |

**SC4 note.** At HEAD `6c7fe7801` the SC4 diff is no longer empty: `tests/playwright.config.ts` and `tests/global-setup.ts` were changed after this phase by the CI fixes `2934f0c67`, `dfe9cae8b` and `cecf649d8` (untraced first attempts, 4 workers under GitHub Actions) and by the stack's restructuring commits. SC4 is a criterion on the tree phase 186 closed on (`SC4_LOCAL_GATE_DIFF=empty` in `186-07-final-gates.md`, re-proven by the verifier against `54e79823b`), not a standing invariant, so this is not a gap of phase 186.

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/tests/utils/deployedTarget.ts` + `deployedTarget.test.ts`
- [x] `tests/tests/utils/deployedSmokeGuards.test.ts`
- [x] `tests/playwright.deployed.config.ts`, `tests/deployed-global-setup.ts`, root script `test:e2e:deployed`
- [x] `tests/tests/deployed/voter.smoke.ts`, `contestant.smoke.ts`
- [x] `infra/scripts/grant-smoke-contestant.sql` + isolated-instance driver

No framework install: vitest and Playwright are present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Evidence |
|----------|-------------|------------|----------|
| One-time hosted contestant creation (user, grant, terms, readback, keychain) | SUPA-09 / SC1 | A write to the persistent hosted project with the operator's keychain credentials; operator-approved checkpoint (CONTEXT D-02) | `evidence/186-08-sitting.md` (`s22c_grant_exit=0`, `grants=1`, `terms=1`); approval key `186-08-2` |
| The deployed smoke run green on staging (voter and contestant) | SUPA-09 / SC1 | Runs against the hosted URL and project; not part of the local gate | `evidence/186-08-green-run.md`; VERIFICATION truth 1 (verdict re-run, exit 0, 2 passed) |
| The three negative controls seen red | SUPA-09 / SC2 | Need the served staging build; controls 2 and 3 need a local production build pointed at it | `evidence/186-05-controls.md`; VERIFICATION truth 2 (control 1 re-run on the five-check gate, exit 1); the refusals themselves are unit cases, green |
| Contestant spec fails by name without inputs | SUPA-09 | Runs through the deployed entry against staging | `evidence/186-02-entry.md` `CONTESTANT_NOINPUT_EXIT=1` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** reconciled 2026-11-21 against `186-VERIFICATION.md` (status passed) and the evidence files

---

## Validation Audit 2026-11-21

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 (none needed) |
| Escalated | 0 |

Reconcile mode: no test or source file written, no auditor spawned. Run on HEAD `6c7fe7801`, each status read directly, not through a pipe:
- `node_modules/.bin/vitest run --config tests/vitest.config.ts deployed`: exit 0, 2 files, 134 passed
- `eslint tests/deployed tests/utils/deployedTarget.ts deployed-global-setup.ts playwright.deployed.config.ts` (from `tests/`): exit 0
- remote-seed switch `grep -rnE` over `.github` and the entry files: exit 1 (none)
- `prettier --check tests/README.md CLAUDE.md infra/envs/staging/supabase/README.md`: exit 0
- `git diff --quiet a7a4222a8 HEAD -- <three local gate files>`: exit 1, explained by later commits (SC4 note above)

Rows marked manual (evidence) are hosted-only (the staging URL and the persistent Supabase project) and were not re-run; the deployed smoke and E2E were not run in this audit, by instruction.
