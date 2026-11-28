---
created: 2026-10-09T00:00:00.000Z
title: Five things Phase 176 left written twice — the reason rule, the prospective task state, a session helper, a parse error path and a catalogue reader
area: Contestant app / cleanup
severity: minor
source: Phase 176 (the code review checklist's "no repeated code" row in 176-04, 176-05, 176-07, 176-16 and 176-17-SUMMARY.md; the whole-phase review of 176-19); filed by 176-19
owner: Phase 177 for item 2, which it meets when it writes a third saving button; whoever next edits the file for the others
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/[questionId]/+page.svelte
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
  - tests/tests/setup/perm/perm-no-nomination.setup.ts
  - tests/tests/setup/perm/perm-organization-editing.setup.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.ts
  - apps/frontend/src/lib/contestant/utils/entityDescriptor.test.ts
---

## Finding

Each of these is built, tested and green. None was extracted because each extraction touched a file outside the plan that found it. The whole-phase review of plan 176-19 found them again and fixed none: an extraction changes application files that the closing gate had not yet seen, and no plan owns one.

1. **The reason rule, in the home and in the menu.** Which sentence says why an entry is closed — the entity has no nomination (`descriptor.closedReasonNoNomination`), or the preview is not open yet (`contestantApp.common.closedReason.preview`, or `.previewNoQuestions` for an entity with no questions task), and none while the state is not known — is decided once in the home's page and once in `ContestantNav.svelte`. A function of `$lib/contestant/tasks` over the task state that returns the reason and its message key would hold it once. The sentence is shown in two places by design; the rule need not be.

2. **The prospective task state, in the profile page and in the question page.** Each saving page builds "the state as it will be once my draft is saved" for its button's label by calling `taskStateOf` with inputs it infers, because the context exposes the state and not the state's input: there is no `entityKnown`, no combined `questionsReady` and no `requiredNameMissing` on the context. An accessor that hands out the `TaskStateInput`, or a context method `taskStateWith(overrides)`, removes both the inference and the block the two pages repeat. **Close this before a third saving button is written** — the nomination editor of Phase 177 is one.

3. **`inFreshContext`**, word for word in the session setups of the two datasets (`perm-no-nomination.setup.ts`, `perm-organization-editing.setup.ts`). It belongs in a shared setup utility.

4. **`issue.path.join('.') || '(root)'`** stands in three parse modules of the Supabase adapter (`userEntities`, `invitationAccess`, `entityNominations`), as the phase's pattern map prescribed.

5. **A catalogue reader in a test.** `entityDescriptor.test.ts` reads one message key from the catalogue files, which `translations.test.ts` does for whole files. No shared test utility exists for either.

## Solution

One small change each, with the unit tests that already hold the behaviour: items 1 and 2 are covered by `taskState.test.ts`, the two pages' component tests, the menu's component test and `perm-no-nomination`; a change to either needs a full E2E run, because both are browser-observable.

## Update 2026-10-11 — item 2: the editor adds no third copy; the accessor is not built; four more repetitions found (Phase 177 close)

**Item 2.** The nomination editor's main button does not build a prospective task state: it asks one pure function, `nominationsSaveAction(state, draft)` of `$lib/contestant/tasks`, with `contestantCtx.taskState` as it stands and with what its draft would write. It is no third copy of the block. The context accessor this item proposes was **not** built (item P-15 of `177-EXECUTION-RULES.md`, operator item G15, untouched and so at its recommended option), and the profile page and the question page still repeat the block. A related loose end from plan 177-19: `nominationsEditable` is optional in `TaskStateInput` so that those two pages need not write the condition out; left out it reads as not editable. Making it required gives each page a third asker of the predicate, or a value the context exposes.

**Found by Phase 177 and added to this list, none repaired:**

6. **"A throwing lookup counts as held"** is written twice in `apps/frontend/src/lib/routes/`: in `electionsHeldIn` of `selectionOrder.ts` and in `getImpliedElectionIds` of `impliedParams.ts` (plan 177-13).
7. **Two listing rules of the selection** stay on the Voter App's pages, and the Contestant App's steps write them again; the shared ordering module would need two more functions to hold them (plan 177-13).
8. **`fixtures/contestant/perm-startfromcg.ts`** repeats two private helpers and `setElectionType` of the nominations dataset's composition root `fixtures/contestant/perm-contestant-nominations.ts` (plan 177-16).
9. **`inFreshContext`** (item 3) now has a third user to check: the session setup of `perm-contestant-nominations`. Not read by this plan.
