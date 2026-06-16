---
phase: 121
slug: e2e-specs-flow-coverage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-16
---

# Phase 121 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is an E2E test-coverage phase — **the Playwright specs ARE the validation instruments.**

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `@playwright/test` (repo-root `tests/`) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:e2e --project=<project> --no-deps` (single spec; run its setup project first if perm-seeded) |
| **Full suite command** | `yarn test:e2e` (must be green; "did not run" counts as a failure per the cardinal E2E rule) |
| **Estimated runtime** | full suite ~few minutes; single spec ~10–40s |
| **Determinism standard** | every new/edited spec must pass **3×**; whole-suite run is the trusted signal |

---

## Sampling Rate

- **After every task commit:** Run the specific edited/new spec via `yarn test:e2e --project=<name> --no-deps` (after its setup project) — quick signal.
- **After every plan wave:** Run `yarn test:e2e` (full suite) — the trusted signal per the E2E Hard Rule.
- **Before `/gsd-verify-work`:** Full suite green **3×** consecutively.
- **Max feedback latency:** ~40s single spec / few minutes full suite.

---

## Per-Task Verification Map

> Populated during planning/execution once task IDs exist. Requirement→behaviour map below
> is the authoritative coverage contract; each task maps to one row.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 121-XX-XX | XX | X | EFLOW-XX | — | N/A (test-only phase) | e2e | `yarn test:e2e --project=<name> --no-deps` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

### Requirement → Test Map (from RESEARCH §Validation Architecture)

| Req | Observable behaviour | Assertion(s) | Seed/project | Determinism rationale |
|-----|----------------------|--------------|--------------|------------------------|
| EFLOW-01 | filter select-all/none + text×filter intersection + reset restores | `entityFilters.selectAll()`→`isAllSelected()`; `selectNone()`→unchecked; text+dialog→`getEntityCards().toHaveCount(N)`; reset→full list | `voter-journey` (base) | deterministic seed counts; fixture guards reactive mount race |
| EFLOW-03 | 4-case voter-vs-entity comparison | RE-CONFIRM existing `entityDetails.expectQuestionDisplay` matrix (`voter-journey.spec.ts:938-999`) | `voter-journey` (base) | already-green; no change |
| EFLOW-04 | per-category subMatch correct values for one candidate | `subMatches scoreGauge` count == answered categories AND each gauge == expected score for pinned candidate (≈100% polar-max) | `voter-journey` (base) | fixed 'max' walk; candidate pinned by name regex |
| EFLOW-05 | skip/delete/back + answer-count→CTA | RE-CONFIRM existing skip/min-answers/delete→results-link-disabled | `voter-journey` (base) | already-green; no change |
| EFLOW-06 | in-flight state survives fi→en→fi | reach in-flight → `langSelector.switchTo('en'/'fi')` → selections+answers persist across switch-reload | `perm-localisation-positive` | full-reload switch + persisted-state read |
| EFLOW-07 | theme applied + persists; dark contrast clean | `theme.expectTheme('dark')` after `setColorScheme('dark')`+reload; axe 0 violations in dark | `voter-dark-mode` (NEW leaf); `a11y-smoke` ext | emulateMedia deterministic + survives reload |
| EFLOW-08 | prefs round-trip + tracking emit/suppress | `getTrackCalls().length>0` under consent; `===[]` under suppression; prefs fields re-read after reload | `perm-analytics-tracking` (NEW node) | stub captures synchronously; no network |
| EFLOW-09 | nav-menu differs by app/auth state | `navMenu.expectNavMenuItems([...])` logged-out vs logged-in (candidate); voter conditional items omitted on EPERM-02 perms | `candidate-journey` ext; EPERM-02 perms | exact item-set assertions; deterministic auth lifecycle |
| EFLOW-11 | interactive mobile walk + feedback + nav + filters | full `answeredVoterPage` walk under mobile project + `navMenu.openMobileNav()` + feedback + filters; D-03 sub-tests on video/interactive-info | `voter-journey-mobile` (NEW leaf); perm video/interactive-info ext | viewport-agnostic fixture; descriptor is project config |

---

## Wave 0 Requirements

- [ ] `tests/tests/specs/voter/voter-dark-mode.spec.ts` — EFLOW-07 (new leaf spec)
- [ ] `tests/tests/specs/voter/voter-prefs-tracking.spec.ts` — EFLOW-08 (new spec; perm-analytics-tracking host)
- [ ] `tests/tests/specs/voter/voter-journey-mobile.spec.ts` — EFLOW-11 (new mobile-descriptor leaf spec)
- [ ] `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts` + registry export + `tests/tests/setup/perm/perm-analytics-tracking.setup.ts`/`.teardown.ts` — D-01
- [ ] `tests/playwright.config.ts` — 3 leaf projects + 1 perm triad
- [ ] Framework install: **none needed** (Playwright + axe already present; all EFLOW-07/08/09/11 fixtures built + verified in Phase 119)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| (none) | — | All phase behaviours have automated E2E verification | — |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency acceptable (single spec ~40s)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
