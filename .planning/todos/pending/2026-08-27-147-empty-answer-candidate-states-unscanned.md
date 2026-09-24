---
created: 2026-08-27T16:01:00.000Z
title: Two candidate states behind the same lever are unscanned — the questions empty-state intro and the logout confirmation modal
area: E2E / a11y
severity: minor
source: Phase 147 (147-SCOUT-INVENTORY.md § 6 "Reachable-but-not-scanned states"; filed by 147-05)
files:
  - apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte
  - tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts
  - tests/tests/specs/a11y/candidate-a11y.spec.ts
  - packages/dev-seed/src/templates/e2e/base.ts
---

## The gap

Phase 147 scanned the seven candidate `(protected)` **routes**; it did not scan every reachable
**state** of them. Two of the unscanned states share **one** lever, which is why they are filed
together:

| state | marker | why the scan never reached it |
|---|---|---|
| `/candidate/questions` empty-state intro | `candidate-questions-intro` | every `e2e/base` candidate carries answers — measured: `grep 'answersByExternalId: {}'` over the template returns **0 hits across 31 candidate declarations** |
| logout confirmation modal | — | `tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts:52-59`: the modal appears **only when answers are INCOMPLETE**; the scan identity `CA-AA-1` is complete |

Both are unknowns, not zeros.

## The single lever

**A candidate with no (or incomplete) answers.** Today no such candidate exists in `e2e/base`, so
this needs either:

1. a template change — an `e2e/base` candidate declared with `answersByExternalId: {}`, which is
   additive and would make both states reachable by identity choice alone; or
2. a runtime answer wipe before the scan, which keeps the template untouched but adds a
   setup step the scan family does not currently have.

Option 1 is the cheaper one and matches how the ToU-gate state is already handled (a purpose-built
base candidate — see the sibling todo for that state, which needs **no** dataset change precisely
because that candidate already exists).

## Solution

Add the answerless candidate to `e2e/base`, then add scan entries for both states in both themes.
Do them together: one dataset change unlocks both, and splitting them would pay the template cost
twice.

## Caution

`e2e/base` is the canonical dataset for the whole suite. Adding a candidate changes counts that
other specs assert. Any addition has to be reconciled against the existing count assertions before
it lands — this is why it was not smuggled into Phase 147.
