---
created: 2026-08-27T16:03:00.000Z
title: The PreventNavigation unsaved-changes modal is unscanned on both candidate routes that raise it
area: E2E / a11y
severity: minor
source: Phase 147 (147-SCOUT-INVENTORY.md § 6 "Reachable-but-not-scanned states"; filed by 147-05)
files:
  - tests/tests/specs/a11y/candidate-a11y.spec.ts
---

## The gap

The `PreventNavigation` unsaved-changes modal is raised on **two** of the seven scanned candidate
`(protected)` routes — the profile and the single-question pages — when the user attempts to
navigate away from a dirty form. Phase 147's 14 scans never rendered it: every scan `settle` reaches
its surface and stops, and none dirties a form or attempts a navigation.

Its accessibility state is an unknown, not a zero. Modals are also the state class where a11y
regressions concentrate (focus trap, `aria-modal`, restore-focus-on-dismiss), so a zero on the
underlying page says little about it.

## The lever

**An extra `settle` step**, and nothing more — no dataset change, no identity change, no ordering
change. The scan entry would: reach the route, edit one field, attempt a navigation, wait for the
modal, then scan with the modal open.

This is the cheapest of the six unscanned states to reach *mechanically*; the care needed is in
leaving the page in a state the following scan does not inherit.

## Solution

Add two scan entries (profile-dirty, question-dirty) in both themes, each with a `settle` that
dirties the form and triggers the guard. Assert the modal's own marker as the entry's content
anchor so a modal that fails to appear fails the scan by name rather than silently scanning the
page behind it — the same discipline `assertCandidateReach` applies to authentication.

## Note

Filed alone: actionable without reading any of the other unscanned-state todos.
