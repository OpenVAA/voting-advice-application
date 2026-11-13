---
created: 2026-10-11T00:00:00.000Z
title: The eighteen planner's rulings of Phase 177 as built, the assumptions a run settled, three departures from the UI contract, and the loose ends no other todo holds
area: Phase 177 / records
severity: minor
source: "Phase 177: 177-EXECUTION-RULES.md (items P-01 to P-18); section G of .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md and the notes at its end; the summaries of plans 177-01 to 177-20; 177-21-INPUTS.md; filed by 177-21"
owner: the operator, for every item marked as a ruling; each other item names the surface whose next editor takes it
files:
  - .planning/phases/177-define-nominations/177-EXECUTION-RULES.md
  - .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.svelte
  - apps/frontend/src/lib/contestant/tasks/taskState.ts
  - apps/frontend/src/lib/routes/selectionOrder.ts
  - apps/frontend/src/routes/(voters)/
---

## 1. The eighteen items, as built

G1 to G16 of the decisions document have not been read by the operator; untouched, each stands at its recommended option, which is the option built. G17 and G18 were answered (a) on 2026-10-11. For each, the other option is a located change.

| Item | Built | The other option, and where it would land |
|---|---|---|
| P-01 (G1) one migration regeneration | one generated file, regenerated in every schema commit | one commit for the whole schema block |
| P-02 (G2) the order of the plans | the dataset and the fixtures before the screens | D-26's letter: the E2E work last |
| P-03 (G3) the cap of ten | per user, the caller's own organization's and alliance's rows included | stop counting rows of an entity the caller edits: one conjunct in two places. Its own todo: `2026-10-11-177-cap-of-ten-counts-an-editors-own-nominations.md` |
| P-04 (G4) a faction's editor and the paired guard | the pairing kept. **As built it admits another organization's placeholder, never the faction's own organization's row**, which the item's wording assumed | drop the pairing: `ARRAY['candidate','faction']` becomes `ARRAY['candidate']` in the policy |
| P-05 (G5) which of a party's nominations is linked | no parent first, then the oldest, then the lowest id | another `ORDER BY` in `private.nomination_id_in_contest` |
| P-06 (G6) a symbol longer than 50 characters at the function | refused, `22023`, naming the index | cut to 50: one expression |
| P-07 (G7) what the parent-options read is asked | the contests are an argument, `p_contests` | every contest of the project: the argument goes |
| P-08 (G8) two simultaneous placeholder inserts | accepted: the second save is refused whole and a retry succeeds | an exception block around the placeholder insert |
| P-09 (G9) the editor's loads | universal (`+layout.ts`, `+page.ts`) | server loads |
| P-10 (G10) `search_path` on the write function | pinned to `''`, every name schema-qualified | unpinned, as `upsert_answers` |
| P-11 (G11) how the fifth guard is paired | a fifth argument, an array of caller types | a second helper beside the first |
| P-12 (G12) rows the application writes have no external id | a state step clears them, children first, before each teardown's prefix delete, and each spec that saves through the editor ends with the same clear | the cascade alone |
| P-13 (G13) the frame of `perm-startfromcg.spec.ts` | the contestant describe takes its fixtures from a composition root of its own, in the same file | the file's `test` becomes the fixture-extended one |
| P-14 (G14) the generator's synthetic elections | the new default, `organization_list_and_independents` | `candidate_only` kept: one literal |
| P-15 (G15) the context accessor of the "rules written twice" todo | not built: the editor asks one pure label function; the todo stays open, annotated | a `taskStateWith` method on the context, the profile and the question page repointed |
| P-16 (G16) where the comparison table lives | `packages/data/README.md` | the developers' guide: the section moves |
| P-17 (G17, answered (a)) a save stored while the answers lock came on | the user ends on the nominations view. **Located difference from the plan's letter:** after a stored save the handler navigates on unless the address shown is outside the editor's steps, read from `page.route.id`; the plan's "is the details page still shown" stranded the user on the constituency step when the re-read forwarded there (seen red, then fixed, in plan 177-18) | on to the next task: `if (onEditorStep())` removed from one line |
| P-18 (G18, answered (a)) a save built on nominations an administrator changed | nothing is read again before the write | one re-read and one comparison. Its own todo: `2026-10-11-177-a-save-built-on-nominations-an-administrator-changed.md` |

## 2. Assumptions of the research, and what a run showed

Stated from the plans' summaries; none was re-run by 177-21.

- **A3** (one `tick()` after `invalidateAll()` is enough): observed, the handler landed on the next task. Removing the `await tick()` left every component case green, so the tick is not what makes it hold (177-18).
- **A4** (the page stays mounted through the rerun after a save): did not hold while the tracer's guard turned away an entity with a nomination (177-15); holds since 177-17, observed for the entity layout by `afterSave.svelte.test.ts`, with the layouts above it stood in for.
- **A11** (the walk across contests that RQ-8 describes is possible): not run.
- **N-1** (`ElectionSelector`'s label cannot wrap): measured, and worse than read: the checkboxes were out of reach. Fixed (177-20).
- **N-5** (a long party name inside its card): measured at 320 and 390 px, shown whole. A name with no place to break at was tried on the nominations view, not in an option row.
- **N-6** (axe and the hidden card): measured; axe evaluates contrast inside it.
- **T-6 / N-3** (`provideEntityData` resets nothing): verified by the research's own run; the docstrings that said otherwise were corrected by 177-21.
- **RQ-3** (how a refusal reaches the client): observed by the writer's integration test (177-09).
- **Hydration on the two selection steps**: settled; the server renders `<Loading />` in the selector's place, so the selector's presence is the marker (177-15).
- **`EntitySelector`'s pointer fix**: observed in Chromium (177-15).

The other rows of the assumptions table of `177-RESEARCH.md` were not read against the summaries by this plan.

## 3. Three departures from the UI contract, as built and recorded for the operator

1. **The election step's Continue carries no stored constituency in the address** (177-17). A flat list cannot say which constituency belongs to which election when two elections share constituencies; the constituency step's load selects the stored one for each election itself.
2. **"Keep this nomination" is described by the removed line for a screen reader** (`aria-describedby`), which the contract's markup does not have (177-17).
3. **The constituency step's "no election here" sentence carries `role="status"`** (177-16), which the contract's markup does not have. The election step's hint has the same shape and no role; one ruling for both is the operator's.

Smaller ones, each said in its plan's summary: the details step's Cancel is a `<button>` with a handler, not an anchor (177-18); the two field limits reach `Input` through a spread because its prop type refuses `maxlength` (177-15); the main button's label is asked of a function and no prospective state is computed (177-18); the nominations view's lists state `role="list"` (177-19); thirteen scan entries where the contract lists eight, and `ElectionSelector` changed (177-20).

## 4. Loose ends no other todo holds

1. **The voter's three selection loads merge the settings without the build-time settings**, where the application context and the editor's loads merge all three (`mergeInitialAppSettings(staticSettings, dynamicSettings, …)`). Found in 177-15, not fixed, not shown to matter.
2. **The voter's election and constituency pages answer three hand-typed addresses differently since the shared module** (177-13): an empty or unknown `constituencyId` under "start from the constituency", an empty `electionId`, and an unknown `electionId`, which no longer throws in the load. The "before" is read from the removed code. The application produces none of these addresses. Accepted by the orchestrator; the operator may want the old answers kept to the letter.
3. **Each of those two voter page loads now reads the address on both of its paths** (177-13). No layout load changed and the `(located)` load is byte-equal to the base.
4. **`nominationsEditable` is optional in `TaskStateInput`** (177-19): left out it reads as not editable. Accepted by the orchestrator; put to the operator. Making it required touches the profile page and the question page.
5. **The parent-options gate differs from the context's sentence** (D-09 says "holding `nomination.edit` on an entity in that project"; built is the caller's editor grant on the named entity, so a project admin is refused). As the plan stated it; the planning record was not rewritten.
6. **The editor's fixture names its step paths as constants** although route keys for the three steps now exist (177-15). No sentence is false; a rename of a path would not be caught by the route builder there.
7. **The exception message of the confirmation trigger's first rule** and items of the write path: `2026-10-11-177-nomination-write-path-checks-the-database-does-not-make.md`.
8. **The four stubs plan 177-15 named** (the tracer's guard condition, the fixed label, the single `failed` message, Continue disabled with no sentence) were resolved by plans 177-16 to 177-18 and were never appended to the WINDOWS ledger. `gsd_run windows append` was not run by any plan of the phase; at the close no stub of the phase stands.
9. **The admin side.** The confirmation queue keys on `requestedParentOrganization`; it now also holds organizations that typed an alliance, and placeholder alliance nominations created by organizations. The Admin App has no page for either (backlog).

## Not established

This todo is a record assembled from the plans' summaries and the orchestrator's list. Section 1's "built" column was checked against the tree by plan 177-21 while it wrote the docs, for every item but P-01, P-02 and P-08, which are about the order of the work and about two calls at once; those three are as the summaries state them.
