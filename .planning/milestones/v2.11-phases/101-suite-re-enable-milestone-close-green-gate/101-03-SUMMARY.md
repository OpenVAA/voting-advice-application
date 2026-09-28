---
phase: 101-suite-re-enable-milestone-close-green-gate
plan: 03
subsystem: testing
tags: [playwright, e2e, vitest, determinism, milestone-close, svelte5, runes]

requires:
  - phase: 101
    provides: 101-01 (perm un-quarantine) + 101-02 (a11y false-positive resolved) — both must land before this gate
provides:
  - v2.11 milestone-close green gate PASSED — full E2E 84/0, full unit green, a11y-smoke 10/10, targeted 3x determinism
  - Several D-02 in-phase regression fixes (rune-migration misses + a test-fixture flake) surfaced by the gate
affects: [complete-milestone-v2.11]

tech-stack:
  added: []
  patterns:
    - "Run E2E suites SOLO (not concurrent with the unit/build) — concurrent CPU contention produces false timeout failures"
    - "imgproxy/storage 502 on db:reset container restart → recover with supabase stop && supabase start"

key-files:
  created: []
  modified: []

key-decisions:
  - "D-03 target met: `yarn test:e2e` = 84 passed / 0 skipped (v2.10's 82 + the 2 re-enabled perm-per-app-notifications tests). a11y-smoke (env-gated PLAYWRIGHT_A11Y=1) verified separately 10/10. Full `yarn test:unit` green (19 turbo tasks)."
  - "Determinism (D-01): targeted subset (perm-per-app-notifications + a11y-smoke, which pulls the journeys + perm chain) ran clean iters 1+2 (55 each) + a post-fix validation (55). The two failures were NON-CODE: an imgproxy-502 on the 3rd db:reset container restart (documented infra flake, recovered) and a test-fixture filter-expand race (fixed)."

patterns-established:
  - "expectQuestionAndAdvance + setSelection both settle on the rendered DOM (questionId-scoped options / first-option-visible) before reading counts — the v2.11 page-reuse + reactive-expand races demand explicit settles"

requirements-completed: [SUITE-01]

duration: ~multi-run gate (5 full/targeted E2E runs + unit + 3x determinism + recovery)
completed: 2026-06-07
---

# Phase 101 Plan 03: Milestone-close green gate Summary

**v2.11 milestone-close green gate PASSED — full E2E 84/0, full unit green, a11y-smoke 10/10, and a 3x targeted determinism pass — after fixing several rune-migration regressions and one test-fixture flake the gate surfaced.**

## Gate results
- **Full `yarn test:e2e`: 84 passed / 0 skipped** (D-03 target = v2.10's 82 + 2 re-enabled perm tests). Run solo (clean).
- **`yarn test:unit`: green** — 19 turbo tasks (dev-seed 450/450 incl. default-template NF-01 integration under 10s, frontend 709/709, app-shared 21, supabase 16).
- **a11y-smoke (`PLAYWRIGHT_A11Y=1`): 10 passed** (env-gated, excluded from the plain 84; verified separately).
- **Determinism (targeted subset, fresh DB each):** iter 1 = 55, iter 2 = 55, post-fix validation = 55 — all green.

## D-02 in-phase fixes surfaced by the gate (all committed)
1. `fix(101): make expectQuestionAndAdvance require known heading text` — journey helper stall.
2. `fix(101): scope expectQuestionAndAdvance option count to current question id` — `{#key question.type}` remount race answered a non-last option → polar-MAX voter corrupted → ranking flip.
3. `fix(101): unbreak EntityList — read locale rune handle via .current` — `fromStore(locale)` crash (`store.subscribe is not a function`) that broke the entire voter results render.
4. `fix(101): await drawer fly transition before axe scan` — a11y color-contrast false positive (mid-fly opacity).
5. `fix(101): queue candidate notification via onMount, not reactive $effect` — re-queue loop reset PasswordValidator's debounce → disabled submit button.
6. seed: `candidateApp: { show: false }` in the perm MINIMAL_BASE — `app_settings` deep-merge bled the candidate notification into downstream perms (modal blocked the candidate register flow).
7. `fix(101): settle entity-filter options before counting in setSelection` — filter-row reactive-expand race made the pick-multiple selection a silent no-op (intermittent 13-vs-12 card flake).

## Infra note (not a code failure)
- The 3rd determinism `db:reset` hit the documented intermittent **imgproxy/storage 502** on container restart (Portrait upload / listCandidatePortraitPaths). Recovered with `supabase stop && supabase start`; the retry then surfaced fix #7. Carried-forward infra item, not a regression.
- **Lesson:** run E2E suites SOLO — running a11y-smoke concurrently with the unit suite (which triggers a Turbo build) produced false timeout failures (18-22s on normally-2s tests) that vanished on a sequential re-run.

## Milestone-close handoff
Next: `/gsd-complete-milestone v2.11`. Known GSD gotchas to verify after close: complete-milestone leaves phase dirs unarchived (new-milestone `phases.clear` hard-deletes), and `state.complete-phase` can corrupt milestone frontmatter — verify STATE.md frontmatter + archive the phase dirs after close.

## Self-Check: PASSED
- 84/0 full E2E + full unit green + a11y 10/10 + clean targeted determinism (post-fix). No assertions softened; no gates weakened.
