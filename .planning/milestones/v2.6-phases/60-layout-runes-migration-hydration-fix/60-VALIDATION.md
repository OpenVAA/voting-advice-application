---
phase: 60
slug: layout-runes-migration-hydration-fix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 60 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source of truth: 60-RESEARCH.md §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | @playwright/test 1.58.2 (E2E, primary gate) + Vitest 3.x (unit, secondary — NOTE: hydration bugs are only reachable via E2E per D-13; unit tests do NOT validate LAYOUT-02) |
| **Config file** | `tests/playwright.config.ts` (E2E, repo root); `apps/frontend/vite.config.ts` (Vitest) |
| **Quick run command** | `yarn playwright test -c ./tests/playwright.config.ts tests/tests/specs/candidate/candidate-registration.spec.ts tests/tests/specs/candidate/candidate-profile.spec.ts --workers=1` (targets the 2 direct blocked tests) |
| **Full suite command** | `yarn test:e2e` (runs `playwright test -c ./tests/playwright.config.ts ./tests`) — for deterministic capture the plan-level command appends `--workers=1 --reporter=json`, so use `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` from repo root |
| **Parity diff command** | `npx -y tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts <baseline.json> <post-change.json>` |
| **Svelte type+lint** | `yarn workspace @openvaa/frontend check` |
| **Estimated runtime** | ~90s (2 direct blocked tests) / ~15-20m (full suite, workers=1) |

**Playwright invocation idiom note (per B-2):** Playwright is a root devDependency (see root `package.json`). It has NO presence in `apps/frontend/package.json`. All Phase 60 plans invoke Playwright from the repo root using the explicit `-c ./tests/playwright.config.ts` flag. Do NOT use `yarn workspace @openvaa/frontend exec playwright` (will error "command not found") or bare `yarn playwright test` without `-c` (looks for a current-dir config that doesn't exist).

**Tests directory (per B-1):** Playwright specs live at `tests/tests/specs/...` (repo root). There is NO `apps/frontend/tests/` directory for E2E specs.

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend check` (Svelte type + lint — fast, <30s)
- **After every plan wave:** Run the 2 direct blocked tests: `yarn playwright test -c ./tests/playwright.config.ts tests/tests/specs/candidate/candidate-registration.spec.ts tests/tests/specs/candidate/candidate-profile.spec.ts --workers=1`
- **Before `/gsd-verify-work`:** Full suite green + parity diff `PARITY GATE: PASS` vs `3c57949c8` baseline
- **Max feedback latency:** ~90s for E2E direct tests; <30s for type/lint

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {filled by planner in PLAN.md tasks} | {plan} | {wave} | LAYOUT-01 / LAYOUT-02 / LAYOUT-03 / SC-4 | — (no threat model applies) | N/A | static / E2E | {command per research table} | ✅ / ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Verification map (from 60-RESEARCH.md §Validation Architecture → Phase Requirements → Test Map):**

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAYOUT-01 | Root layout uses `$props` / `$derived` / `{@render children}` — no `$:`, `export let`, or `<slot />` | Static (lint + grep) | `yarn workspace @openvaa/frontend check` + grep for banned patterns in `apps/frontend/src/routes/+layout.svelte` | ✅ tooling |
| LAYOUT-02 | Fresh candidate reaches dashboard after full page load; 2 blocked E2E tests pass | E2E | `yarn playwright test -c ./tests/playwright.config.ts tests/tests/specs/candidate/candidate-registration.spec.ts tests/tests/specs/candidate/candidate-profile.spec.ts --workers=1` | ✅ (currently failing — ARE the gate) |
| LAYOUT-03 (removal path) | Popup renders on full page load without `PopupRenderer` wrapper | E2E | `yarn playwright test -c ./tests/playwright.config.ts tests/tests/specs/voter/voter-popup-hydration.spec.ts --workers=1` (D-09, Wave 0 creates SKELETON; Plan 60-04 Task 1 finalizes and removes `test.skip`) | ❌ Wave 0 |
| LAYOUT-03 (retention path) | `PopupRenderer.svelte` contains rationale comment naming upstream Svelte 5 limitation | Static | `grep -nE 'upstream Svelte|Svelte 5 limitation' apps/frontend/src/lib/components/popupRenderer/PopupRenderer.svelte` | ❌ conditional on execution outcome |
| SC-4 (regression baseline) | No PASS_LOCKED test regresses; data-race pool does not grow | E2E + diff | `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json > post-change.json && npx -y tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts <baseline.json> post-change.json` | ✅ (script + baseline at SHA `3c57949c8` exist) |

---

## Wave 0 Requirements

- [ ] **D-09 setTimeout-triggered popup E2E test SKELETON.** File: `tests/tests/specs/voter/voter-popup-hydration.spec.ts` (new file — NOT under `apps/frontend/tests/`). Skeleton only in 60-01 Task 3 (describe shape + `test.skip` pointing to Plan 60-04 Task 1); full seeding helper + RED→GREEN transition lands in 60-04 Task 1 per W-2.
- [ ] **Identity smoke test for parity diff script.** Confirm `npx -y tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts <baseline.json> <baseline.json>` prints `PARITY GATE: PASS` — verifies the diff tool works before it's used as the phase gate.
- [ ] **Out-of-baseline synthetic test preflight (B-3 Option A).** Construct a synthetic post-change JSON that adds one test not in any embedded constant and confirm the diff script prints `PARITY GATE: PASS` (treats new tests as neutral/additive). If it prints FAIL, Plan 60-05 must apply B-3 Option B (re-embed `voter-popup-hydration.spec.ts` into `PASS_LOCKED_TESTS`).
- [ ] **Constant-count preflight (W-5).** Compare baseline JSON test-count to the sum of embedded PASS_LOCKED + DATA_RACE + CASCADE constant sizes. Record MATCH or DRIFT as an observable signal for Plan 60-05.
- [ ] **(Optional)** Lint rule or CI grep step enforcing SC-1 (no `export let` / `$:` / `<slot />` in `+layout.svelte`). Cheap regression insurance; not strictly required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Popup visibility on fresh full page load (manual smoke) | LAYOUT-03 | E2E covers the main case; manual confirms visual + timing feel matches v2.5 behaviour | 1) `yarn dev:reset-with-data` 2) Open fresh browser tab to `http://localhost:5173/en/results?test=popup-trigger` 3) Wait for setTimeout-triggered popup 4) Confirm popup visible |
| Fresh candidate registration full flow (manual smoke) | LAYOUT-02 | E2E exists but manual confirms subjective feel (loading → terms → dashboard transition) | 1) `yarn dev:reset` 2) Open Inbucket (http://localhost:54324) 3) Register new candidate via `/candidate/register` 4) Click email link 5) Confirm dashboard renders without stuck `<Loading />` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (D-09 popup E2E SKELETON; parity diff identity smoke; B-3 out-of-baseline synthetic; W-5 constant-count)
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s for direct-test gate; <30s for type/lint
- [ ] `nyquist_compliant: true` set in frontmatter once planner completes the per-task map

**Approval:** pending
