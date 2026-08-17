---
phase: 64
slug: voter-results-reactivity-completion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 64 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Detailed Test Map and Wave 0 gaps are sourced from `64-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (E2E)** | Playwright `^1.58.2` |
| **Framework (unit)** | Vitest `^3.2.4` |
| **E2E config file** | `tests/playwright.config.ts` |
| **Unit config (frontend)** | `apps/frontend/vitest.config.ts` |
| **Quick run command (single E2E test)** | `yarn playwright test -c ./tests/playwright.config.ts --grep "<title fragment>" --workers=1 --reporter=line` |
| **Full suite command (D-07 canonical)** | `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` (output committed to `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json`) |
| **Unit test (Phase 64 surface)** | `yarn workspace @openvaa/frontend test:unit` |
| **Estimated full-suite runtime** | ~15-25 minutes |

---

## Sampling Rate

- **After every task commit (Plan 64-01/02 dev loop):** Run targeted unit tests + targeted Playwright grep (~60-90s combined)
- **After every plan wave:** `yarn lint:check && yarn test:unit && yarn workspace @openvaa/frontend build` (~4min with Turbo cache)
- **Before `/gsd-verify-work` (Plan 64-03 phase gate):** Full canonical capture must show 5/5 named voter-results tests `passed`. The 14-test imgproxy data-race pool is acceptable per CONTEXT D-09.
- **Max feedback latency:** 90 seconds for unit + targeted E2E loop; 25 minutes for the canonical capture.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 64-01-* | 01 | 1 | RESULTS-01/02 + D-14 + D-15 | — | N/A (voter UI public) | E2E + unit | `yarn playwright test --grep "filter toggle narrows\|filter state resets\|filter state survives" --workers=1 --reporter=line` | ✅ `voter-results.spec.ts:150,199,230` | ⬜ pending |
| 64-01-* (filterContext bridge unit) | 01 | 1 | bridge correctness | — | N/A | unit | `vitest run apps/frontend/src/lib/contexts/filter/` | ✅ `filterContext.svelte.test.ts` (7/7 currently green) | ⬜ pending |
| 64-01-* (filters package unit, IF D-01 mutations) | 01 | 1 | API contract | — | N/A | unit | `yarn workspace @openvaa/filters test:unit` | ✅ `packages/filters/tests/filter.test.ts` | ⬜ pending |
| 64-01-* (createSubscriber wrapper, IF Pattern 1 chosen) | 01 | 1 | reactivity bridge | — | N/A | unit | `vitest run apps/frontend/src/lib/contexts/filter/reactiveFilterGroup.svelte.test.ts` | ❌ Wave 0 (conditional) | ⬜ pending |
| 64-02-* (deeplink shapes 3+4) | 02 | 2 | RESULTS-03 (D-08 shape 3+4) | — | N/A | E2E | `yarn playwright test --grep "deeplink list.drawer\|deeplink edge case" --workers=1 --reporter=line` | ✅ `voter-results.spec.ts:267,288` | ⬜ pending |
| 64-02-* (fixture audit) | 02 | 2 | RESULTS-03 + fixture stability | — | N/A | E2E + manual | targeted Playwright run + DOM inspection | ✅ `voter.fixture.ts:52-90` | ⬜ pending |
| 64-03-* (canonical capture) | 03 | 3 | All RESULTS reqs | — | N/A | E2E full-suite | `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` | ✅ pre-existing config | ⬜ pending |
| 64-03-* (parity script regen) | 03 | 3 | parity-gate close (D-08 + D-09) | — | N/A | smoke | `yarn tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts <baseline> <post-fix>` exits 0 with PASS | ✅ existing script | ⬜ pending |
| 64-03-* (manual smoke 9-step) | 03 | 3 | UI-SPEC inheritance (D-10) | — | N/A | manual | walk 9 steps from `62-03-HUMAN-CHECKPOINT.md` | ✅ checklist exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

**Default path (research recommends keeping Option B version-counter bridge):** None — existing test infrastructure covers all phase requirements. Plan 64-01 modifies `voter-results.spec.ts` (D-11 skip-path removal); existing `filterContext.svelte.test.ts` already proves the bridge contract.

**Conditional path (only if Plan 64-01 adopts createSubscriber wrapper per RESEARCH §Pattern 1):**

- [ ] `apps/frontend/src/lib/contexts/filter/reactiveFilterGroup.svelte.ts` — wrapper class bridging FilterGroup.onChange to createSubscriber
- [ ] `apps/frontend/src/lib/contexts/filter/reactiveFilterGroup.svelte.test.ts` — mount + subscribe + unmount lifecycle assertions

**Conditional path (only if D-01 modifications add `getSnapshot()` or equivalent to `@openvaa/filters`):**

- [ ] Extend `packages/filters/tests/filter.test.ts` with snapshot-shape + immutability assertions

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark-mode contrast on filter-active warning button badge ≥ 4.5:1 | UI-SPEC inheritance (Phase 62 UI-SPEC §Color) + Phase 62 9-step smoke step 7 | DevTools color picker is the canonical inspector; not feasible to assert programmatically without browser-pixel sampling | Run `yarn dev:reset-with-data && yarn dev`, navigate voter to results, activate one filter, switch theme to dark via toggle, inspect badge with DevTools color picker, verify foreground/background contrast ratio ≥ 4.5:1 |
| 9-step manual smoke from `62-03-HUMAN-CHECKPOINT.md` (folded into Phase 64 per D-10) | Cross-phase verification gate | 9 user-perceivable behaviors most of which are auto-tested by E2E but need a single human pass for sign-off | Walk all 9 steps as documented in `.planning/phases/62-results-page-consolidation/62-03-HUMAN-CHECKPOINT.md` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies — to be confirmed at planning time
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify — Plan 64-03 task gate
- [ ] Wave 0 covers all MISSING references — default path needs none; conditional paths declare gaps explicitly
- [ ] No watch-mode flags — `--workers=1 --reporter=json` is canonical; no `vitest watch` in CI
- [ ] Feedback latency < 90s for unit/targeted E2E loop
- [ ] `nyquist_compliant: true` set in frontmatter — toggle when planning is finalized

**Approval:** pending
