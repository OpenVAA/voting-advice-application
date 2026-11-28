---
created: 2026-08-27T16:02:00.000Z
title: The candidate answersLocked warning is unscanned — it needs an app_settings scenario the scan family cannot take
area: E2E / a11y
severity: minor
source: Phase 147 (147-SCOUT-INVENTORY.md § 6 "Reachable-but-not-scanned states"; filed by 147-05)
files:
  - tests/tests/specs/a11y/candidate-a11y.spec.ts
  - tests/playwright.config.ts
---

## The gap

`candidate-answers-locked-warning` renders on **three** of the seven scanned candidate
`(protected)` routes when answers are locked. None of Phase 147's 14 scans saw it: the warning is
driven by an `app_settings` scenario, and the scans run against the default `e2e/base` settings.

Its accessibility state is an unknown, not a zero.

## Why its lever is different from the other unscanned states

This one is **not** an identity or dataset choice. `answersLocked` is an `app_settings` value, and
in this suite `app_settings` is owned by the `perm-*` chain, whose every setup performs an
**authoritative singleton REPLACE** (`tests/playwright.config.ts:496-518` records in detail how an
earlier project got that wrong twice).

That is why it cannot simply be added to `candidate-a11y-scan`. `147-ORDERING.md` placed the scan
project in Playwright **phase 3 of 80**, deliberately: phases 1–3 contain **no** `app_settings`
REPLACE and **no** `test-` pre-clear, so the two named ordering hazards are absent by construction.
Making the scan depend on a perm setup would move it into phase ≥ 4 and put it back inside both
hazards — the precise risk Phase 147 measured its way out of.

## Solution — two honest options

1. **Reuse the `perm-answers-locked` setup** and add the three locked-state scans as a *separate*
   project downstream of it, leaving `candidate-a11y-scan` in phase 3 untouched. Costs a project;
   keeps the ordering guarantee.
2. **Accept the gap** and record it as accepted rather than unknown.

Do not resolve it by adding a perm dependency to `candidate-a11y-scan`.

## Note

Filed alone. Its lever is shared with nothing else in the unscanned set, and choosing between the
two options above is a real decision, not bookkeeping.

## Update 2026-10-09 — scanned on one route, for one entity type (Phase 175 close)

Phase 175's spec `perm-organization-editing` owns its own settings row inside the permutation chain, which is the lever this todo says the scan family cannot take. Its scan entry `org-profile-answers-locked` sets `access.answersLocked` through the spec's state step, opens the **organization's profile**, proves the state by the reach marker `contestant-answers-locked-warning` and scans in both themes: 0 violations in the phase's closing full run. The entry sits in a `describe` whose `afterEach` unlocks the answers.

**Now scanned:** the warning on the profile route, as an organization's editor sees it, light and dark.

**Still not scanned:** the warning on the other two routes that render it, and on any route as a candidate's editor sees it. The same spec's dataset holds a candidate and the same state step, so each is one more scan entry there; none was added, because the phase's contract asked for the nine entries it has.

## Update 2026-10-09 — the warning is the note; scanned in a second use, not on three more routes (Phase 176 close)

The warning is now the component `NotEditableNote` (`apps/frontend/src/lib/contestant/components/notEditableNote/`), which four routes show while answers are locked — an entity's home, its profile, its questions list and the page of one question — under the same id, `contestant-answers-locked-warning`, and which the nominations view shows while nominations are locked, under `contestant-nominations-locked-note`. The component is scanned on both backgrounds by two entries of Phase 176's spec `perm-no-nomination`, both in its nominations-locked use (`no-nomination-nominations-locked` and `nominated-nominations-pending-locked`; zero violations in the closing run `tests/e2e-runs/176-e2e/176-19-final`), and in its answers-locked use on an organization's profile by Phase 175's entry, as the update above says. **Still not scanned:** the note in its answers-locked use on the home, on the questions list and on a question page, and on any route as a candidate's editor sees it. Each is one more scan entry in a spec that owns its settings row.

## Update 2026-10-11 — the note's third reason is scanned on the nominations view (Phase 177 close)

`NotEditableNote` has a third reason, `nominationsAnswersLocked`, shown on the nominations view while answers are locked and nominations are not. It is scanned in both themes by one entry of `contestant-nominations.spec.ts`, `nominations-answers-locked`, and measured at 320 and 390 px with its support button inside the note. The note's `answersLocked` use on the home, the questions list and a question page is still scanned on an organization's profile alone, as the two updates above say.
