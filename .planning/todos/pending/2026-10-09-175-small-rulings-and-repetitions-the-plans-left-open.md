---
created: 2026-10-09T00:00:00.000Z
title: Small rulings and repetitions the plans of Phase 175 left open
area: Contestant app / cleanup
severity: trivial
source: Phase 175 (the "open for a ruling" lines and unfixed checklist items of 175-05, 175-09, 175-10, 175-11 and 175-12-SUMMARY.md); filed by 175-13
owner: the operator for the rulings (each stands as built until overruled); whoever next edits the file for the repetitions
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile/+page.svelte
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.type.ts
  - packages/dev-seed/src/cli/help.ts
  - packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts
  - tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts
  - tests/tests/fixtures/shared/pageGeometry.fixture.ts
---

## Rulings a plan asked for and built one way

Each is built, tested and green; none blocks anything. The list exists so that none lives only in a plan's summary.

| Plan | What was built | The alternative |
|---|---|---|
| 05 | `packages/dev-seed/src/cli/help.ts` names the permutation family in one line and not the new template | name `perm-organization-editing` literally: one line |
| 05 | `built-in-templates-contestant-app.test.ts` gained a fourth family for the one built-in that serves both entity types | a template that serves candidates only cannot hold an organization's editor |
| 09 | the profile's always-rendered alert region carries no margin of its own while empty; the margin is on the message inside it | the UI contract's sketch puts `mb-lg mt-md` on the region, which would add space above Save on every profile |
| 09 | `data-entity-type` is absent on the identity section for a selected entity that is not known | the contract lists two values; the descriptor's fallback renders a candidate's fields then |
| 10 | the dataset's last opinion question admits an open comment, so that an organization's comment is proven in a browser | a `holds:` test without a comment |
| 11 | `EntityDetails`' `excludeTabs` is typed `ReadonlyArray<…>` | the contract writes `Array<…>`, which refuses the descriptor's readonly list |

## Repetitions the checklist found and nobody removed

- **The `matchMedia` stub**: sixteen test files of the frontend name `matchMedia` at the phase's close (`git grep -c matchMedia -- 'apps/frontend/src/**/*.test.ts'`); plan 175-11 counted thirteen that repeat the stub. A shared test setup would hold it once.
- **The expression that adjusts one object's colour** is in two places; see `2026-10-09-175-election-colour-reaches-style-unparsed-and-the-colour-parser.md`.
- **Two "inside the viewport" measures.** `contestantTermsOfUsePage.expectCheckboxInsideViewport()` asserts the whole box inside the viewport with Playwright's own matcher; `pageGeometry.expectWithinViewportWidth()` asserts the horizontal edges alone, wherever the page is scrolled. They differ in what they hold, so neither replaces the other as written. The page-width measure itself is one since plan 175-13: the terms-of-use fixture calls the shared step.
- **The component test's context mock** in `Input.labelWrap.svelte.test.ts` is the block its four neighbours hold.

## Behaviours a plan noted and left as they are

Each was read or measured by the plan named and changed by none. No current caller or page reaches the first four.

- **A refused entry outlives a reset of `value` from outside** (plan 06). When a caller sets an `Input`'s `value` back while the hex field of the colour kind holds a refused text, the swatch and the picker follow and the field keeps the text and its error until the next commit or a remount. The `url` and `email` kinds behave the same way. The profile's Cancel does not remount the input.
- **A staged property is not compared again when the same entity is initialised with fresh data** (plan 07): a value staged before a reload stays staged even if the fresh saved value now equals it.
- **`setImage` has two image branches the public guard makes unreachable** (plan 07): an image of `null`, and an image with a `url` and no file.
- **The profile's save message is not cleared when the route's params change under a mounted page** (plan 09). No link of the app leads from one entity's profile to another's without leaving the route.
- **The two new parses of `parseJsonbColumn.ts` have no unit case of their own** (plan 07); five writer cases cover them.
- **On the sign-in pages of a closed project `access.nominationsLocked` reads the shipped `false`** (plan 08), as `access.answersLocked` does: the provider's public configuration honours three stored values and this is not one. The database enforces the stored value whatever the page reads.
- **The lock helper's answer for a `settings` value that is a JSON scalar is pinned by no pgTAP cell** (plan 02); the research measured it as unlocked.
- **The history holds fixes of itself**, named in the checklists of plans 02, 03, 05, 08 and 12 (a comment line, a diagram line, one type error in a test, fixture commits that change one another). They are for the stack reconstruction of `Skill("ship-review-stack")`, not for a commit on this branch.

## Measured and inferred

Measured: each row's built form is in the tree and green in the phase's closing gate set and full run. Inferred: nothing; the alternatives were not built.
