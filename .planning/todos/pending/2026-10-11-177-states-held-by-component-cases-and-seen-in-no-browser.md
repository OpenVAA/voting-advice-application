---
created: 2026-10-11T00:00:00.000Z
title: States of the nomination editor and the nominations view that no browser test reaches, no scan covers or no width measurement holds
area: E2E / Contestant app
severity: minor
source: "Phase 177: the state table of 177-20-SUMMARY.md and the § Not done, or not observed sections of 177-15 to 177-20-SUMMARY.md, as the orchestrator collected them in 177-21-INPUTS.md; filed by 177-21"
owner: Phase 179, the coverage close, by operator decision F6 (a) for the same list of Phase 176; an item whose surface a plan edits sooner is that plan's
files:
  - tests/tests/specs/perm/contestant-nominations.spec.ts
  - tests/tests/specs/perm/perm-startfromcg.spec.ts
  - tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/page.svelte.test.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/+page.svelte
  - packages/dev-seed/src/templates/e2e/perm/perm-contestant-nominations.ts
---

The closing run of Phase 177 holds 97 tests in `perm-contestant-nominations`: thirteen states scanned in both themes, eleven tests at each of 320 and 390 px, and the behaviour tests. What follows is what that leaves.

## Held by a component case alone — in no browser

1. **The messages `tooManyPending` and `failed`** of a save that is not stored. No fixture step reaches either: each is a case of `details/page.svelte.test.ts` with the write as a spy. The two refusal codes behind `tooManyPending` and `hasCandidates` are asserted through the real API by the writer's integration test, which runs in no CI job.
2. **The constituency step's "kept" section**: an election in which the entity holds several nominations, shown as a section in a selector's place. No election of the dataset but one has several constituencies, and no seeded entity holds two nominations in it.
3. **The options error** of the details step: when the entities a nomination can stand under cannot be read, an error message stands in the cards' place and the page holds no main button. **Held by no test of any kind** (found by the phase's verification, 2026-10-11): the component tests stub the read with an empty list only, and no fixture step reaches the state; the code is present and wired by reading.
4. **Which of the two removal lines a card shows**, and **start-from-constituency mode for an entity that has nominations**: component cases only (plan 177-17).
5. **A save that is not stored whose re-read forwards to another step of the editor shows no message.** Read from the handler, not provoked: the page that would show the message is no longer the one shown. A candidate for the operator's list.
6. **The view's seventh state**: an empty list, no lock and no facts in the page data shows the heading and Return alone. Not reachable with a dataset of the suite: the load answers no facts only where a layout above shows an error view in the page's place.

## In no scan and no width measurement

From the state table of `177-20-SUMMARY.md` (*Every state of this phase's screens: scanned, and measured*):

7. The election step with an election checked, and under "start from the constituency" (the UI contract excludes both from a scan; the second is `perm-startfromcg`'s, which scans nothing).
8. The constituency step with several pickers under headings; with the kept section; as one picker over a group; with the "no election here" sentence.
9. The details step with a moved card, with a card whose parent is no longer listed, and with a group that lists no entity; "Other" with its name filled is measured and not scanned; a required group in error is measured and not scanned.
10. The details step while loading, while saving, and during the rebuild after `changed` (transient: no step holds the page in them).
11. The other entity type's cards beyond the two states scanned for each: a state of the details step is scanned under one entity type.
12. The main button reading "Return" is scanned and not measured on the details step.
13. The leave prompt: a browser confirm, outside the page (`2026-08-27-147-prevent-navigation-modal-unscanned.md`).

## Read from the code, not opened

14. **The elections address under "start from the constituency" with a constituency that holds no admissible election** is served with an empty list and the hint. The pages cannot produce that address.
15. **The shared `ConstituencySelector` for a voter with one election and `useSingleGroup`** passes the picked constituency on as it is; read, not tested.
16. **The voter's election page and the pre-registration election page with a long election name**: the wrapping fix is in the shared component; neither was opened with such a name.
17. **`mostSpecificConstituency`** of the shared ordering module picks the constituency whose group has the fewest members, which for a regions-and-municipalities election is the region and not "the leaf". The behaviour was kept from the voter's code and is pinned by a unit case; not observed in a browser.
18. **A frame between the load's rerun and the application context's settings effect** in which the nominations view could render `editable: false` with no note: the fact comes from the load and the reason from the context. Inferred; no test saw it.
19. **The server-rendered markup of the view's six states and of the two selection steps** unchanged by hydration: inferred, not captured.
20. **The page staying mounted through the rerun after a save** is observed for the entity layout only (`afterSave.svelte.test.ts`); the layouts above it are stood in for or left out there.

## Assertions that were never seen red

21. `stale:` and `closing:` (a save from an editor opened before a lock came on) were never seen red.
22. The assertions after the first read of each `nominations-view:` test; the `holds:` tests, by design; the changed tests of `perm-no-nomination.spec.ts` and `perm-organization-editing.spec.ts`.
23. In `focus:`, everything but the details step's heading; in `keys:`, everything after the first tab-stop expectation; in the test of the field limits, what follows the two field reads; in each phone test, the page-width steps after its first. The planted-defect runs of plan 177-20 (`tests/e2e-runs/177-e2e/177-20-planted-p1`, `-p2`) list what was seen red.
24. Each scan was seen red on a planted paragraph of its page, and twelve on a planted name inside their cards, **not on the part each is named for** (the note, the message region, the removed line).

## State steps and harness

25. **A killed run that left an application-written nomination under a seeded one makes the next run's first `e2e-perm-` clear fail**: such a row has no external id, the prefix delete does not remove it, and the foreign key on `parent_nomination_id` then refuses the delete of the seeded row. Read from the schema, not observed. Each spec that saves through the editor ends with a file-level `afterAll` that calls `clearWrittenNominations`, which a killed run does not reach. The lasting fix is in the shared clear.
26. **`177-20-planted-p1`**: on a tree with an element wider than the viewport planted on the details step, the press of the "Other" row timed out at both phone widths. Not diagnosed. The same press passes on the unplanted tree in every other run; it is recorded because a press that hangs on a page that scrolls sideways is how the election step's defect showed.
27. **`clearWrittenNominations` of the no-nomination dataset** has never run with a row to clear.
28. **No gate holds the generated route map current.** `generate:docs` regenerated four lines for the editor's directories in plan 177-20, three plans after they were added; `docs-links` passed before and after.

## Not established by this todo

Items 1 to 6 and 14 to 20 are as the plans' summaries state them and were not re-derived by 177-21. Whether a later plan of the phase came to exercise a state step listed as unused at 177-10's close was checked for the imports of the nominations spec alone: `setAnswers`, `setAnswersLocked`, `setNominationsLocked` and `addNomination` are all imported and used there; which options of `addNomination` (a symbol, `confirmed`) a test passes was not read.
