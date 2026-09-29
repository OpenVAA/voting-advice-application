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
| `/candidate/questions` empty-state intro | `candidate-questions-intro` | no candidate the scan can log in as is answerless. Of the **30** candidate declarations in `packages/dev-seed/src/templates/e2e/base.ts`, **29** carry `answersByExternalId`. The one that does not, `test-e2e-base-ca-aa-unregistered`, has no auth user (its declaration comment: "NO auth_user_id"; the candidate-journey invite flow creates it at runtime), so it cannot drive the logged-in `/candidate/questions` scan (corrected 2026-09-27; the earlier "every candidate carries answers" was wrong) |
| logout confirmation modal | — | `tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts:52-59`: the modal appears **only when answers are INCOMPLETE**; the scan identity `CA-AA-1` is complete |

Both are unknowns, not zeros.

## The single lever

**A registered candidate with no (or incomplete) answers.** Today no such candidate exists in
`e2e/base` (the one answerless candidate is unregistered, above), so this needs either:

1. a template change — a registered `e2e/base` candidate declared with no answers, which is
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
