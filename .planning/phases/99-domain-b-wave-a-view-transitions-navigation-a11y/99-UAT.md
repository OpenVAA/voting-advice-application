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
result: [pending]

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
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
