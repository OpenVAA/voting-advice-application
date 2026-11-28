---
phase: "184"
slug: "hosted-supabase-measurement-and-conformance-probe"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-26"
audited: "2026-11-21"
---

# Phase 184 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (root `catalog:` version), new non-workspace suite under `infra/` |
| **Config file** | `infra/vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `yarn vitest run --config infra/vitest.config.ts` |
| **Full suite command** | `yarn test:unit` (with `test:unit:infra` chained in) and `yarn lint:check` |
| **Estimated runtime** | ~10 s quick; full unit suite several minutes (needs the shared local stack running) |

---

## Sampling Rate

- **After every task commit:** the quick Vitest command and `yarn assert:hosted-settings-parity`. Read the exit status directly, never through a pipe.
- **After every plan wave:** `yarn lint:check` and `yarn test:unit`.
- **Before `/gsd-verify-work`:** the full unit suite and `lint:check` green, plus a full E2E run (`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`), because `config.toml` and dev-seed change. Also the probe's recorded red and green runs.
- **Max feedback latency:** 30 s for the quick command

---

## Per-Task Verification Map

Built from the 25 PLANs and SUMMARYs at the audit of 2026-11-21. Commands carry the `export PATH=…node v24.21.0…` prefix of their plans, left out here.

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 184-01-T1 | 01 | 1 | SUPA-07, SUPA-03 | The probe runs `api.max-rows` end to end: pass, fail and could-not-run | unit + CLI refusal | `node_modules/.bin/vitest run --config infra/vitest.config.ts` · probe with no `--root` and with a bogus flag exits 2 | ✅ `probe-hosted.test.ts` | ✅ green |
| 184-01-T2 | 01 | 1 | SUPA-07 | The infra suite runs from `yarn test:unit` | guard | `node scripts/assert-unit-test-coverage.mjs` · `yarn test:unit:infra` | ✅ | ✅ green |
| 184-02-T1 | 02 | 2 | SUPA-07, SUPA-02, OBS-01 | Auth checks pass a conforming fixture and fail a broken one by name | unit (TDD) | `node_modules/.bin/vitest run --config infra/vitest.config.ts` | ✅ | ✅ green |
| 184-02-T2 | 02 | 2 | SUPA-07, SUPA-03, SUPA-05 | API and function checks; batched-break fixture | unit (TDD) | `node_modules/.bin/vitest run --config infra/vitest.config.ts` | ✅ | ✅ green |
| 184-03-T1 | 03 | 3 | SUPA-04 | Bucket source decided (Management API) | decision + grep | `grep -c "functions.verify-jwt" infra/scripts/probe/checks.mjs` | ✅ | ✅ green (recorded) |
| 184-03-T2 | 03 | 3 | SUPA-07, SUPA-04 | Public source, its checks, the bucket check | unit (TDD) | `node_modules/.bin/vitest run --config infra/vitest.config.ts` | ✅ | ✅ green |
| 184-03-T3 | 03 | 3 | SUPA-07, SUPA-06, OBS-07 | Catalog source, seed check, anon timeout, full batched break | unit (TDD) | `node_modules/.bin/vitest run --config infra/vitest.config.ts` · `CHECKS` name census | ✅ | ✅ green |
| 184-04-T1 | 04 | 1 | SUPA-01 | Push wrapper refuses a wrong ref and a dirty input | unit | `yarn workspace @openvaa/dev-seed test:unit tests/pushMigrationsGate.test.ts` · `bash -n` | ✅ | ✅ green |
| 184-04-T2 | 04 | 1 | SUPA-01 | Linked drift check refuses port 6543 and another host | unit | `… test:unit tests/checkDriftLinkedGuard.test.ts` · `bash -n` | ✅ | ✅ green |
| 184-05-T1 | 05 | 1 | SUPA-05, SUPA-11 | Parity guard classifies every `[functions.*]` key | guard self-test | `node scripts/assert-hosted-settings-parity.mjs --self-test` and gate mode | ✅ | ✅ green |
| 184-05-T2 | 05 | 1 | SUPA-05 | An unclassified function key fails the spec and the gate | unit + red control | `… test:unit tests/hostedSettingsParityGate.test.ts` · copied `config.toml` with a new function exits 1 | ✅ | ✅ green |
| 184-06-T1 | 06 | 1 | SUPA-05 | Function secrets in the module; types kept | smoke | module validate · `bash infra/scripts/check-settings-types.sh` · parity guard | ✅ | ✅ green |
| 184-06-T2 | 06 | 1 | SUPA-05 | Staging and example roots wired | smoke + guard | root `init -backend=false -lockfile=readonly` + `validate` · both guards | ✅ | ✅ green |
| 184-07-T1 | 07 | 2 | SUPA-05 | Project id decided (canonical) | decision + grep | `grep -c 'variable "public_project_id"'` | ✅ | ✅ green (recorded) |
| 184-07-T2 | 07 | 2 | SUPA-07, SUPA-14 | Scratch root rehearses the staging root | smoke | scratch root validate · parity guard · tfvars `awk` | ✅ | ✅ green |
| 184-07-T3 | 07 | 2 | SUPA-07 | Fault file only in the scratch root | smoke | `fmt -check` + validate · `grep -rl fault_set infra/envs` | ✅ | ✅ green |
| 184-08-T1 | 08 | 3 | OBS-07, SUPA-06 | Voters opened by the bootstrap | decision + grep | `grep -c BOOTSTRAP_OPEN_FOR_VOTERS infra/scripts/bootstrap.sql` | ✅ | ✅ green |
| 184-08-T2 | 08 | 3 | OBS-07, SUPA-06 | `smoke` template: ≥1001 anon-readable rows, no auth user | unit | `… test:unit tests/templates/smoke.test.ts tests/assertKnownRowProps.builtins.test.ts tests/nominationShapeCensus.builtins.test.ts` · typecheck · comment hygiene | ✅ | ✅ green |
| 184-09-T1 | 09 | 4 | SUPA-02, SUPA-06 | Grant script idempotent; unknown address and unset variable exit 3 | isolated local instance | `apps/supabase/scripts/isolated-instance.sh` runs recorded in `evidence/184-09-grant-script.md` | ✅ | ✅ green (recorded; needs the local stack) |
| 184-09-T2 | 09 | 4 | SUPA-01, SUPA-05 | Runbook Steps 14 to 23 present; no planning reference or address | docs check | heading loop and negated greps over `infra/envs/staging/supabase/README.md` | ✅ | ✅ green (recorded) |
| 184-09-T3 | 09 | 4 | all code | Three repository gates on the code tree | full gates | `lint:check`, `format:check`, `test:unit` at `8319f4540` (`evidence/184-09-code-gates.md`) | ✅ | ✅ green (recorded) |
| 184-10-T1–T3 | 10 | 5 | SUPA-13, OBS-01, SUPA-02 | Throwaway read before change; key model; scratch plan reviewed `ok` | operator sitting + record check | `attempt.sh bound 184-10-*`; `evidence/184-10-throwaway-reads*.md` | — | manual (evidence) |
| 184-11-T1–T2 | 11 | 6 | SUPA-01, SUPA-02, SUPA-04, SUPA-05 | Scratch apply, link, push, read back | operator sitting + record check | `attempt.sh bound 184-11-*`; evidence of 184-11 | — | manual (evidence) |
| 184-11-T3 | 11 | 6 | SUPA-01 | Drift schema set unchanged (clean diff empty) | unit | `bash -n infra/scripts/check-drift.sh` · `… test:unit tests/checkDriftLinkedGuard.test.ts` | ✅ | ✅ green |
| 184-12-T1–T2 | 12 | 7 | OBS-03, SUPA-05, SUPA-13 | Function call shapes per key; `D12_LEGACY_ANON=works` | operator sitting + record check | `attempt.sh bound 184-12-*`; `prettier --check` of the runbook | — | manual (evidence) |
| 184-13-T1–T3 | 13 | 8 | SUPA-01, OBS-07 | Header echo; drift red with planted DDL, green after; second push up to date | operator sitting + record check | `attempt.sh bound 184-13-*`; evidence of 184-13 | — | manual (evidence) |
| 184-14-T1 | 14 | 8 | OBS-03, SUPA-13 | Key model decision | decision | `D12_LEGACY_ANON=` line in evidence | — | manual (evidence) |
| 184-14-T2 | 14 | 8 | OBS-03 | `account-access` `verify_jwt = false`, classified by the guard | unit (TDD) + guard | parity guard and `--self-test` · `… test:unit tests/deploymentTemplates.test.ts tests/hostedSettingsParityGate.test.ts` · `yarn assert:comment-hygiene` | ✅ | ✅ green |
| 184-15-T1–T3 | 15 | 9 | SUPA-06, SUPA-02, OBS-07 | Logging gate; bootstrap twice equal; grant; smoke dataset on the throwaway | operator sitting + record check | `attempt.sh bound 184-15-*`; `evidence/184-15-throwaway-boo*.md` | — | manual (evidence) |
| 184-16-T1–T3 | 16 | 10 | SUPA-14, OBS-05, OBS-02 | Mail on 2587 with DKIM/SPF/DMARC pass; redirect cases; slot release | operator mailbox + record check | `attempt.sh bound 184-16-*`; `evidence/184-16-throwaway-mai*.md` | — | manual (evidence) |
| 184-17-T1–T3 | 17 | 11 | SUPA-07 | Probe green on the throwaway (22 PASS) | operator sitting + record check | `attempt.sh bound 184-17-*`; `evidence/184-17-throwaway-pro*.md` | — | manual (evidence) |
| 184-18-T1–T3 | 18 | 12 | SUPA-07, OBS-05 | Every check fails by name after the batched break; both refusals | operator sitting + record check | `attempt.sh bound 184-18-*`; `git diff --quiet` after the revert; `evidence/184-18-throwaway-bre*.md` | — | manual (evidence) |
| 184-19-T1–T2 | 19 | 13 | SUPA-07 | Green again after the revert; drift check | operator sitting + record check | `attempt.sh bound 184-19-*`; `evidence/184-19-throwaway-rev*.md` | — | manual (evidence) |
| 184-20-T1 | 20 | 14 | SUPA-14, SUPA-03 | Measured port and project id in the staging root | smoke | `terraform fmt -check` + staging root validate · tfvars comparison | ✅ | ✅ green |
| 184-20-T2–T3 | 20 | 14 | SUPA-02, SUPA-03, SUPA-13, SUPA-14 | Persistent project read before change; plan reviewed | operator sitting + record check | `attempt.sh bound 184-20-*`; `Attempt: 184-20-3` in evidence | — | manual (evidence) |
| 184-21-T1–T3 | 21 | 15 | SUPA-01, SUPA-02, SUPA-04, SUPA-05 | Persistent apply, push (second run up to date), deploy | operator sitting (one-way) + record check | `attempt.sh bound 184-21-*`; `evidence/184-21-persistent-ap*.md` | — | manual (evidence) |
| 184-22-T1–T3 | 22 | 16 | SUPA-06, SUPA-02, OBS-07 | Persistent bootstrap twice, first administrator, smoke dataset | operator sitting + record check | `attempt.sh bound 184-22-*`; `evidence/184-22-persistent-bo*.md` | — | manual (evidence) |
| 184-23-T1–T2 | 23 | 17 | SUPA-07, SUPA-13, OBS-01 | Probe green on the persistent project; 39 auth + 3 API settings served as declared | operator sitting + record check | `attempt.sh bound 184-23-*`; `evidence/184-23-persistent-pr*.md` | — | manual (evidence) |
| 184-23-T3 | 23 | 17 | SUPA-13 | FUT-02 todo carries the observed key model | docs check | `grep -q "^## Observed key m"` on the todo | ✅ | ✅ green (recorded) |
| 184-24-T1–T2 | 24 | 18 | SUPA-07 | Throwaway deleted; local state removed | operator sitting | `SCRATCH_SCOPE=` line; Management API 404 recorded | — | manual (evidence) |
| 184-24-T3 | 24 | 18 | SUPA-07 | Tracked texts true after the deletion | smoke + guard | `terraform fmt -check -recursive infra` · parity guard | ✅ | ✅ green |
| 184-25-T1 | 25 | 19 | SUPA-05, SUPA-07, OBS-07 | Three repository gates on the final tree | full gates | `evidence/184-25-final-gates.md` (lint, format, unit exit 0; infra 96/96) | ✅ | ✅ green (recorded) |
| 184-25-T2 | 25 | 19 | all | Closing full E2E | E2E | `tests/scripts/e2e-run.sh` · `e2e-spec-verdict.mjs --no-flaky` on `tests/e2e-runs/184-25-20261112T062610Z`: 548/548 | ✅ | ✅ green (recorded) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · manual (evidence): hosted or operator-only, backed by the named lines in `evidence/184-NN-*.md`*

---

## Wave 0 Requirements

- [x] `infra/vitest.config.ts` and `infra/scripts/probe-hosted.test.ts` — the SUPA-07 comparisons
- [x] Root script `test:unit:infra`, chained in `test:unit`, with an entry in `NON_WORKSPACE_SUITES` (`scripts/assert-unit-test-coverage.mjs`)
- [x] Synthetic fixtures per source (no captured bodies, no secrets)
- [x] A dev-seed test for the new template

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Key model issued, legacy key state, retirement date | SUPA-13 | Dashboard and Management API read with the operator's token | Operator reads; evidence row with date |
| DKIM/SPF/DMARC pass on a mail from `account-access` | SUPA-14 | Header read from the operator's mailbox | Operator pastes `Authentication-Results` into evidence |
| Dashboard names of the two switches | OBS-01 | Dashboard UI | Operator records the names |
| Redirect allowlist behaviour, `/auth/v1/verify` admitted/refused | OBS-02 | Needs real sign-in links | Recorded calls with dates |
| Gateway with anon key and no user token | OBS-03 | Hosted gateway behaviour | Recorded call shapes |
| `account-access` refusing branches, slot released after a failed send | OBS-05 | Needs a deliberately failing send | Recorded calls with dates |
| Signed-in token carries the hook's claims | SUPA-02 | Needs a password sign-in | Decode locally, record claim names only |
| Push, bootstrap, function deploy and probe runs on the throwaway and the persistent project | SUPA-01, SUPA-04, SUPA-05, SUPA-06, SUPA-07, OBS-07 | Credentials the agent never holds; one-way writes | Plans 184-10 to 184-24, bound attempt files; covered by 184-VERIFICATION.md truths 1 to 5 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (operator tasks verify the bound attempt and its named lines)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (each operator sitting ends in a record-check verify)
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** reconciled by validate-phase audit, 2026-11-21

---

## Validation Audit 2026-11-21

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 (none needed) |
| Escalated | 0 |
| Rows green | 28 |
| Rows manual (evidence) | 15 |

Reconcile mode: no test or source file was written, and no auditor was spawned. Re-run now on HEAD `6c7fe7801`, each status read from a file, all exit 0:
- `node_modules/.bin/vitest run --config infra/vitest.config.ts infra/scripts/probe-hosted.test.ts`: 1 file, 98 tests passed
- `node scripts/assert-unit-test-coverage.mjs`: 0 violations, 2 non-workspace suites named
- `bash -n` of `infra/scripts/push-migrations.sh` and `infra/scripts/check-drift.sh`
- `yarn vitest run` in `packages/dev-seed`: `pushMigrationsGate`, `checkDriftLinkedGuard`, `templates/smoke`, `assertKnownRowProps.builtins`, `nominationShapeCensus.builtins`, 5 files, 40 tests; `deploymentTemplates`, 20 tests; `hostedSettingsParityGate` (with the phase-183 audit run)
- parity guard and its 98-case self-test; `check-settings-types.sh`; `terraform fmt -check -recursive infra`; validate of the staging, example and scratch Supabase roots (shared with the phase-183 audit run)
- `yarn assert:comment-hygiene`; `grep -c BOOTSTRAP_OPEN_FOR_VOTERS infra/scripts/bootstrap.sql` = 2

Not run: the probe CLI itself (it calls the hosted project), the grant script on an isolated instance (needs the local stack), and the E2E. They rest on `evidence/184-09-grant-script.md`, `evidence/184-25-final-gates.md` and the 548/548 run `tests/e2e-runs/184-25-20261112T062610Z`. The manual rows rest on 184-VERIFICATION.md (status passed, 14/14 requirements). Recorded limits, not validation gaps: OBS-02's single-segment pattern cannot be told apart on a module that builds every entry from one origin; the probe has no check of the `storage.objects` policies (the drift check covers it after a deploy); `push_connection` reads `unknown` on CLI 2.118.0.
