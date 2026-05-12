---
phase: 73
slug: determinism-baseline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
---

# Phase 73 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. See `73-RESEARCH.md` §"Validation Architecture" for the full architecture; this file is the executable contract.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 (e2e) + Vitest (unit) + ESLint (lint gate) |
| **Config file** | `tests/playwright.config.ts` + `tests/eslint.config.mjs` |
| **Quick run command** | `yarn workspace @openvaa/tests lint:check` (~5s) — primary feedback for DETERM-01 / DETERM-03 plans |
| **Full suite command** | `yarn dev:reset-with-data && yarn test:e2e --workers=1` (~20–30 min) |
| **Estimated runtime** | Quick: ~5s; Full e2e: ~20–30 min; 3-run determinism gate: ~60–90 min |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/tests lint:check 2>&1 | grep -E "playwright/" | awk '{print $NF}' | sort | uniq -c | sort -rn` (track per-rule warning count delta)
- **After every plan wave:** Run `yarn lint:check` (root) + `yarn test:unit` + spec-specific spot-check (`for i in {1..3}; do yarn test:e2e --grep "<spec>"; done`) on flake-prone specs touched by the wave
- **Before `/gsd-verify-work` (Plan 6):** Full 3-run cold-start determinism gate (D-09 + D-10 recipe). Vite-cache wipe MUST precede first run.
- **Max feedback latency:** ~5s for lint-only plans; ~3 min for per-spec e2e spot-check (spec runtime); ~60–90 min for the end-of-phase 3-run gate

---

## Per-Task Verification Map

> Plan 1 (inventory) materializes the binding 36-test list + per-spec failure-type clustering. The per-task map below is a SCAFFOLD — Plan 1's output drives the actual task IDs in Plans 2–5. Plan 6's tasks are fixed.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 73-01-01 | 01 | 1 | DETERM-01/02/03 | — | N/A (test-suite hardening) | inventory | `yarn lint:check` + `yarn test:e2e --workers=1 --reporter=json > tests/playwright-results/inventory-run-N.json` | ✅ | ⬜ pending |
| 73-01-02 | 01 | 1 | DETERM-02 | — | N/A | inventory | `node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` (after restore from `.planning/milestones/v2.6-phases/64-.../post-fix/`) | ❌ W0 (Plan 6 restores) | ⬜ pending |
| 73-02-01 | 02 | 2 | DETERM-03 | — | N/A | lint | `yarn workspace @openvaa/tests lint:check 2>&1 \| grep "no-networkidle" \| wc -l` returns 0 | ✅ | ⬜ pending |
| 73-02-02 | 02 | 2 | DETERM-03 | — | N/A | lint | `yarn workspace @openvaa/tests lint:check 2>&1 \| grep "no-raw-locators" \| wc -l` returns 0 | ✅ | ⬜ pending |
| 73-02-03 | 02 | 2 | DETERM-02 / DETERM-03 | — | N/A | spec spot | `for i in {1..3}; do yarn test:e2e --grep "<touched-spec>" --workers=1; done` produces identical pass/fail set | ✅ | ⬜ pending |
| 73-03..05 | 03..05 | 3 | DETERM-02 / DETERM-03 | — | N/A | per-spec | `yarn workspace @openvaa/tests lint:check` (file-scoped) + `for i in {1..3}; do yarn test:e2e --grep "<spec>" --workers=1; done` identical pass/fail set | ✅ | ⬜ pending |
| 73-0X-Z | 03..05 | 3 | DETERM-01 | — | N/A | targeted | `git grep -nE "test\\.skip\\(" tests/` only matches `candidate-bank-auth.spec.ts:199` (the legitimate skip with inline rationale + ESLint disable per CONTEXT D-07) | ✅ | ⬜ pending |
| 73-06-01 | 06 | 4 | DETERM-02 | — | N/A | tooling | `tests/scripts/diff-playwright-reports.ts` exists with PASS_LOCKED + DATA_RACE + CASCADE constants regenerated against post-Phase-73 baseline | ❌ W0 | ⬜ pending |
| 73-06-02 | 06 | 4 | DETERM-01/02/03 | — | N/A | full e2e | 3-run determinism gate per D-09: `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit && yarn dev:reset-with-data && yarn test:e2e --workers=1` then 2 re-runs without resetting; identical pass/fail set across all 3 | ✅ | ⬜ pending |
| 73-06-03 | 06 | 4 | DETERM-03 | — | N/A | lint gate | `yarn lint:check` exits 0 with 0 warnings across all workspaces; `tests/eslint.config.mjs` lint-gate strictness bumped per the hygiene-sweep todo's final step | ✅ | ⬜ pending |
| 73-06-04 | 06 | 4 | DETERM-01/02/03 | — | N/A | regression | `yarn build` + `yarn test:unit` + workspace `svelte-check` remain at or below v2.8-close baselines (svelte-check ≤ 159 errors); `yarn workspace @openvaa/frontend lint:check` 0/0 holds | ✅ | ⬜ pending |
| 73-06-05 | 06 | 4 | DETERM-01/02/03 | — | N/A | docs | `73-VERIFICATION.md` written with parity-script self-identity smoke output (`PARITY GATE: PASS`); per-test rationale for any post-73 DATA_RACE pool entries | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] **`tests/scripts/diff-playwright-reports.ts`** — restored from git blob `2832c4410:scripts/diff-playwright-reports.ts` (per CONTEXT D-08); contains PASS_LOCKED (66) + DATA_RACE (15) + CASCADE_BASELINE (21) constants and `flattenReport` / `categorizeStatus` / `diffReports` rules unchanged from P64 (D-08 acceptance gate). Plan 6 owns this restoration.
- [ ] **`.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs`** — copy from `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs`; adjust `reportPath` to point at the Plan 6 capture. Plan 6 owns.
- [ ] **`.planning/phases/73-determinism-baseline/post-fix/playwright-report.json`** — captured by Plan 6's first cold-start `--workers=1` run; the binding post-73 baseline (regenerates the parity-script constants).
- [ ] **`tests/playwright-results/inventory-run-{1,2,3}.json`** — Plan 1 captures 3 cold-start runs with `--reporter=json`; output drives the per-spec failure-type clustering in Plan 1's deliverable.
- [ ] **Plan 1 deliverable: `73-01-INVENTORY.md`** — markdown table of the 36-test pool with columns: spec file, test title, failure type (initial-fetch race / subscription-not-flushed / auth-cookie / hydration-timing / infrastructure / passes-now), recommended fix shape (test-level expect.poll / test-level waitFor / code-level — flag escalation if > 50 LOC), assigned plan (02 / 03 / 04 / 05).

*If none of the above are needed: "Existing infrastructure covers all phase requirements." — does NOT apply here. Wave 0 (Plan 1) is mandatory infrastructure setup before any per-spec work.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Per-test rationale for any post-73 DATA_RACE pool entries (D-02) | DETERM-02 | Each remaining race-pool entry needs a one-line justification (env-gated / infrastructure flake / deferred product bug) — operator-judged, not automatable | After Plan 6's parity-script regen: for each test in the regenerated DATA_RACE list, add a `// reason:` comment in `diff-playwright-reports.ts` per the v2.8 P71 D-04 anchor convention. Operator reviews and signs off in 73-VERIFICATION.md. |
| Imgproxy 502 spot-check (infrastructure flake exclusion) | DETERM-02 | Imgproxy intermittent crash is acknowledged infrastructure debt (PROJECT.md "Known infrastructure issue"); fix recipe is `supabase stop && supabase start` — not a code-level fix | If the 3-run gate surfaces an imgproxy 502 in any of the 14 IMGPROXY_TIED_TITLES, document in 73-VERIFICATION.md "Infrastructure Notes" and re-run with `supabase stop && supabase start` between runs. The pool is allowed to flake either direction per Phase 59 RESEARCH Pitfall 5; pool MUST NOT grow. |
| Bank-auth `test.skip(!createdUserId, …)` ESLint disable acceptance | DETERM-01 | The convention-setting decision (CONTEXT D-07) needs operator review of the inline rationale text quality | Operator reads `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:199` after the rewrite and confirms the `// reason:` text accurately describes the env-gated bank-auth precondition — no missing context, no overclaim. Sign off in the per-plan checkpoint. |

*If none: "All phase behaviors have automated verification." — does NOT apply. Three manual gates above.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (per per-task map above; Plan 1 + Plan 6 own the W0 entries)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (per-rule lint check is < 5s; per-spec spot-check is < 3 min; full gate at end of phase)
- [ ] Wave 0 covers all MISSING references (parity-script + regen-constants + 3-run inventory captures + INVENTORY.md)
- [ ] No watch-mode flags (`--workers=1` is the determinism convention; no `--watch` anywhere in the gate commands)
- [ ] Feedback latency < 5s for lint-only iterations; < 3 min for per-spec spot-check; full gate accepted at ~60–90 min as intentional end-of-phase cost
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
