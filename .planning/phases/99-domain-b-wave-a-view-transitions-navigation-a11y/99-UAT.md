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
reported: "Auto-run 2026-06-04 (after fix b801cfa6e): PLAYWRIGHT_A11Y=1 a11y-smoke = 7/8 spec tests GREEN. The located-fixture stall is RESOLVED — root cause was a test artifact (Playwright locator.isVisible({timeout}) is a non-waiting one-shot, exposed by Phase 95's post-hydration $dataRoot $effect populating the list a beat after navigation), NOT an app bug; elections page navigates correctly for real users (operator steer confirmed — seeding/props were not the culprit). Fix: polling waits in voter-journey.fixture.ts + a11y-smoke.spec.ts, plus a bonus app-side WCAG fix (AccordionSelect role=listbox + localized aria-label so option children satisfy axe aria-required-parent). The route-announcer (NAVA11Y-01) and focus-on-heading (NAVA11Y-02) blocks now PASS green. voter-journey re-run GREEN (no regression). REMAINING: the 8th test (voter-detail-drawer axe scan) fails on a SEPARATE, pre-existing color-contrast WCAG 2.1 AA violation in the entity-details drawer (#b1b1b1/#c5c5c5 muted-gray on white: candidate <h3> title, alliance/faction tag spans, match label, small-info/small-label) — this route was never axe-scanned before because the elections stall always blocked it. Distinct design/theme debt, NOT the elections-stall regression and NOT phase-99 code; needs theme remediation + visual-regression sign-off."
severity: minor

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

- truth: "The located a11y-smoke walk reaches /questions so the route-announcer (NAVA11Y-01) + focus-on-heading (NAVA11Y-02) blocks run green"
  status: resolved
  reason: "RESOLVED in b801cfa6e. Root cause: test artifact — Playwright locator.isVisible({timeout}) is a non-waiting one-shot, and Phase 95's post-hydration $dataRoot $effect mounts the elections list a beat after navigation, so the probe skipped the Continue click. Fixed with polling waits (voter-journey.fixture.ts + a11y-smoke.spec.ts) + a bonus app-side AccordionSelect role=listbox/aria-label WCAG fix. a11y-smoke now 7/8 green; the announcer + focus blocks pass; voter-journey green (no regression). NOT an app bug — elections navigates correctly for real users."
  severity: resolved
  test: 1
  artifacts: ["tests/tests/fixtures/voter/voter-journey.fixture.ts", "tests/tests/specs/a11y/a11y-smoke.spec.ts", "apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte"]
  missing: []

- truth: "The entity-details (voter-detail-drawer) route passes the axe color-contrast WCAG 2.1 AA gate"
  status: failed
  reason: "NEWLY SURFACED (b801cfa6e unblocked this route — it was never axe-scanned before because the elections stall always blocked it). The entity-details drawer has a pre-existing color-contrast violation: #b1b1b1/#c5c5c5 muted-gray on white across the candidate <h3> title, alliance/faction tag spans, the match label, and small-info/small-label labels. Distinct design/theme debt, NOT the elections-stall regression and NOT phase-99 code."
  severity: minor
  test: 1
  artifacts: ["apps/frontend (theme muted-gray tokens + entityDetails components)"]
  missing: []
  scope_note: "Needs theme/token remediation to meet 4.5:1 + visual-regression sign-off. Candidate for a dedicated debug/plan session or Phase 101 (Suite Re-enable + Milestone-Close Green Gate). Operator decision required — broad visual impact."
