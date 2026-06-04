---
status: testing
phase: 99-domain-b-wave-a-view-transitions-navigation-a11y
source: [99-VERIFICATION.md]
started: 2026-06-04T15:35:00Z
updated: 2026-06-04T15:35:00Z
---

## Current Test

number: 1
name: Live a11y-smoke gate (NAVA11Y-01/02/03) runs green
expected: |
  After resolving the pre-existing located-voter-journey fixture/seed blocker,
  `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke` exits 0 — all tests pass
  (6 original axe routes + the NAVA11Y-01 route-announcer block + the NAVA11Y-02
  focus-on-heading block). The announcer assertion now uses containment
  (`headingText.toContain(questionLabel)`), which holds under the `e2e/base` seed.
awaiting: user response

## Tests

### 1. Live a11y-smoke gate (NAVA11Y-01/02/03) runs green
expected: |
  Resolve the located-fixture/seed blocker (`voter-journey.fixture.ts:130` —
  ElectionSelector testid forwarding stalls on a multi-election seed; stabilize the
  testid forwarding or pin to a deterministic single-election seed), then run
  `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke`. It exits 0 with every test
  passing: the 3 pre-location axe routes, the 3 located axe routes, the route-announcer
  block (announcer is `aria-live="polite"`/`aria-atomic="true"`, non-empty, changes on
  navigation, never contains the DB slug, and the localized title appears within the
  visible heading), and the focus-on-heading block. The blocker is environmental and
  pre-existing — NOT caused by Phase 99 code.
result: issue
reported: "Auto-run 2026-06-04: PLAYWRIGHT_A11Y=1 a11y-smoke = 5 passed / 5 FAILED. The 3 pre-location axe routes (home/elections/constituencies) PASS. All 5 located tests (axe questions/results/voter-detail-drawer + route-announcer + focus-on-heading) FAIL at the shared fixture walkUntilQuestionsIntro (voter-journey.fixture.ts:130) — getByTestId('voter-questions-start') never visible; the walk stalls on the 'Select an election' page (both elections checked, Continue present). NOT phase-99 code: the announcer/focus assertions are never reached. Distinct from the voter-journey spec timing bug fixed in 302fcb19a — that spec walks elections with its own helpers and passes. Per operator: data seeding and component prop handling did NOT change this milestone, so the testid-forwarding theory is rejected (concatClass forwards data-testid); culprit is likely Phase 95 context reactivity (e.g. selectedElections destructure-trap / rune-state timing) or Phase 99 VT + navigation — under investigation."
severity: major

### 2. Visual VT cross-fades + reduced-motion (SC-1 / SC-2 / VT-03)
expected: |
  With `yarn dev` running, in a browser: on Q→Q navigation, results election-switch,
  results entity tabs, and entity-detail tabs, the named surfaces cross-fade
  element-stably (no perceived full-page redraw). With the OS "reduce motion" setting
  on — and equivalently with `?notr=1` appended — no view-transition animation runs
  (the `shouldAnimate` short-circuit), while navigation, focus reset, and route
  announcement still work.
result: [pending]

## Summary

total: 2
passed: 0
issues: 1
pending: 1
skipped: 0
blocked: 0

## Gaps

- truth: "The live a11y-smoke gate runs green (located + unlocated axe routes + route-announcer + focus-on-heading blocks all pass under PLAYWRIGHT_A11Y=1)"
  status: failed
  reason: "5 located a11y-smoke tests fail at the shared fixture walkUntilQuestionsIntro (voter-journey.fixture.ts:130) — the walk stalls on the 'Select an election' page; voter-questions-start never becomes visible. Unlocated axe routes (home/elections/constituencies) pass. Phase-99 announcer/focus code is correct (4/4 verified) but the gate cannot run because the located fixture cannot reach /questions."
  severity: major
  test: 1
  artifacts: ["tests/tests/fixtures/voter/voter-journey.fixture.ts"]
  missing: []
  scope_note: "Distinct from the voter-journey spec bug fixed in 302fcb19a. Per operator: seeding + prop handling unchanged this milestone → rule out testid-forwarding/seed; focus on Phase 95 context reactivity (selectedElections destructure-trap / rune timing) or Phase 99 VT+navigation."
