---
phase: 172-terms-of-use-per-user-and-project
plan: 05
subsystem: api
tags: [data-writer, svelte5, state-store, supabase, postgrest, project-scoping, terms-of-use, vitest]

requires:
  - phase: 172-terms-of-use-per-user-and-project
    provides: "Plan 03: BasicUserData.termsOfUseAccepted and acceptTermsOfUse on the writer and the context. Plan 04: the gate decided on user-level data, so nothing under routes/ calls the store's terms members or reads acceptance from the entity"
provides:
  - "LocalizedCandidateData and EditableEntityProps without a termsOfUseAccepted member"
  - "updateEntityProperties as an image-only call: the guard requires properties.image.file and throws 'An image file is required for updating entity properties'"
  - "SupabaseDataWriter._updateEntityProperties writing and reading back the image column alone; _getContestantUserData no longer maps the field from the RPC row"
  - "The contestant user-data store without a terms-of-use buffer, setter or reset; unsavedProperties is [] or ['image']"
  - "No file under apps/frontend names the retired candidate column"
affects: [172-06, 172-07, 172-08, 173, 175]

actuals:
  tokens: 10062
  tasks: 2
  commits: 2
plan_head_before: c3ebcbd30bf8ffc42dd43682398fa04ce55eab99
plan_head_after: 340428ea3ee450556fb107ac77634593ca76dba4

tech-stack:
  added: []
  patterns:
    - "A member that has lost its last caller is removed from the consumer (the store) first and from the type second, so every commit typechecks"
    - "A test is deleted when its subject is the removed member and re-pointed when it only used the member as its example"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/base/universalDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts

key-decisions:
  - "The plan was followed where the dispatch handover and the plan disagree: the handover lists the writer's read of the RPC column, the mock RPC row's field and the _setPassword comment as left for 172-07; the plan removes all three here, and 172-07 lists no frontend file. The typecheck forced none of them"
  - "Two store tests were deleted and four re-pointed; D-07 says five are deleted. The number was counted, not steered"
  - "The store tests are renumbered so the titles run 1 to 8 without a gap"
  - "Two writer cases were added: one pins the image-only write and read-back, one pins the guard and its message"

patterns-established:
  - "updateEntityProperties takes { target, properties: { image } } and nothing else; Phase 173 generalises from that shape"

requirements-completed: []

coverage:
  - id: D1
    description: "No frontend entity type carries a terms-of-use field: LocalizedCandidateData and EditableEntityProps do not declare termsOfUseAccepted; BasicUserData still does"
    requirement: TOU-01
    verification:
      - kind: other
        ref: "the plan's second automated check, run under bash as written (exit 0); yarn workspace @openvaa/frontend typecheck (exit 0, 0 errors, 0 warnings)"
        status: pass
    human_judgment: false
  - id: D2
    description: "updateEntityProperties is image-only: the guard throws 'An image file is required for updating entity properties' and reaches no table when no image file is given"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts#updateEntityProperties > refuses a call that carries no image file"
        status: pass
    human_judgment: false
  - id: D3
    description: "The Supabase writer uploads the file, updates the image column alone, reads back the image column alone and returns the image alone; with nothing to write it reads the stored image back and issues no update"
    verification:
      - kind: unit
        ref: "supabaseDataWriter.test.ts#updateEntityProperties > uploads the image file, writes the image column alone and returns the image alone; > reads the stored image back instead of fabricating a return value when nothing changed; > throws on PostgREST error"
        status: pass
      - kind: other
        ref: "negative control: with the read-back widened to 'image, name', the first case fails (vitest exit 1); the file was restored and is byte-identical"
        status: pass
    human_judgment: false
  - id: D4
    description: "The candidates image update and its no-write read-back still carry this adapter's project"
    verification:
      - kind: unit
        ref: "supabaseDataWriter.test.ts#project scoping > filters the candidates update by project as well as by id; > filters the no-write read-back by project as well as by id; > updateEntityProperties builds the image path from the configured project and reaches only candidates"
        status: pass
      - kind: other
        ref: "negative control: with the update issued through the bare client, 'filters the candidates update by project as well as by id' fails (vitest exit 1); restored. yarn assert:project-scoped-queries (exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The user-data store has no terms-of-use member; save() calls updateEntityProperties only when an image is edited and passes the image alone; unsavedProperties lists the image only"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts (8 cases; Test 2: an answers-only save writes no property; Test 3: the properties object holds the key 'image' and no other)"
        status: pass
      - kind: other
        ref: "git grep for setTermsOfUseAccepted, resetTermsOfUseAccepted and editedTermsOfUseAccepted outside .planning prints nothing (exit 1)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The unverified-answers exit still sits ahead of the property write and of both resets"
    verification:
      - kind: unit
        ref: "contestantUserDataState.svelte.test.ts#unverified answers read-back > Test 5; > Test 7; > Test 8"
        status: pass
      - kind: other
        ref: "negative control: with resetImage() placed ahead of the exit and a second key added to the properties object, Tests 3 and 5 fail (vitest exit 1); the file was restored and is byte-identical"
        status: pass
    human_judgment: false
  - id: D7
    description: "No file under apps/frontend names the retired candidate column"
    requirement: TOU-01
    verification:
      - kind: other
        ref: "git grep -n terms_of_use_accepted -- apps/frontend prints nothing (exit 1)"
        status: pass
    human_judgment: false
  - id: D8
    description: "The plan closes on its targeted gates on one tree: frontend typecheck, the frontend unit suite and frontend lint"
    verification:
      - kind: other
        ref: "the plan's first automated check as one command on the tree of 340428ea3 (exit 0): svelte-check 0 errors and 0 warnings; 137 files, 2170 tests; ESLint 0 errors and the one warning the baseline has"
        status: pass
    human_judgment: false
  - id: D9
    description: "The store's save() and the image-only writer work from a browser: the journey's portrait upload and its answer saves"
    verification: []
    human_judgment: true
    rationale: "By the plan's design no E2E run closes it. The full run that closes 172-06 (label 172-06-visibility) is the boundary proof; until it is green this behaviour is held by unit tests only."

duration: 7min
completed: 2026-10-06
status: complete
---

# Phase 172 Plan 05: The Frontend Loses the Entity-Level Terms-of-Use Field Summary

**The contestant user-data store, the two entity-level writer types, the `updateEntityProperties` guard and the Supabase writer no longer carry a terms-of-use field: the store edits answers and the image only, `updateEntityProperties` requires an image file and writes and reads back the image column alone, and acceptance survives in the frontend only as the user-level `BasicUserData.termsOfUseAccepted`; the database column is untouched and the plan closed on the frontend typecheck, unit suite and lint.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-10-06T01:30:21Z
- **Completed:** 2026-10-06T01:37:00Z
- **Tasks:** 2 of 2
- **Files changed outside `.planning/`:** 7, exactly the plan's `files_modified`
- **Start revision:** `c3ebcbd30bf8ffc42dd43682398fa04ce55eab99`
- **The tree every closing check describes:** `340428ea3ee450556fb107ac77634593ca76dba4`, clean apart from the operator's untracked `CAND-APP-PLAN.md`

## What the Plan Asked to Have Recorded

| Item | Value |
|---|---|
| State-store tests deleted, against D-07's "five" | **Two.** `Test 5` (an explicit `null` is sent) and `Test 6` (an unedited value is not sent). Their subject was the tri-state value itself |
| State-store tests re-pointed to the image | **Four.** The properties-only save that must merge and keep `id` and the static fields (`Test 3`), the edit buffers surviving an unverified answers write (was `Test 7`), the resets after a clean save (was `Test 9`), a save that does not touch answers (was `Test 10`) |
| Why not five | D-07 counted every test that names the field. Four of those have another subject and still describe behaviour the store has. Deleting them would have dropped the only cases for the unverified-answers exit ahead of the property write and for the merge that keeps `id` |
| The file after the change | 8 tests (was 10), titled `Test 1` to `Test 8`. The four re-pointed ones are now `Test 3`, `Test 5`, `Test 7` and `Test 8`; the untouched nullish-read-back case moved from `Test 8` to `Test 6` |
| Readers of the entity-level field the typecheck found outside the listed files | **None.** `yarn workspace @openvaa/frontend typecheck` exited 0 after the store change, after the type change and on the final tree. Every remaining `termsOfUseAccepted` under `apps/frontend` is the user-level fact: `dataWriter.type.ts` (`BasicUserData`), `_getBasicUserData`, `gates.ts` and `gates.test.ts`, `layout.server.test.ts`, `termsOfUseLayout.svelte.test.ts`, and the acceptance cases of the writer test |
| The boundary proof | The full E2E run that closes 172-06, label `172-06-visibility`. No E2E run and no `172-gates.sh` run was made here |
| Where a failure in that run points back to | A failure in the journey's **portrait upload** or **answer saves** points at (1) the store's `save()` in `contestantUserDataState.svelte.ts` (Task 1: the `if (image)` branch, `properties: { image }`, the two resets), or (2) `_updateEntityProperties` in `supabaseDataWriter.ts` (Task 2, step 3: the image-only write, the `'image'` read-back, the returned `{ image }`), reached through the guard in `universalDataWriter.ts`. It does not point at 172-06's visibility change |

## Accomplishments

- The store lost `#editedTermsOfUseAccepted`, `setTermsOfUseAccepted`, `resetTermsOfUseAccepted`, its arm of the unsaved-properties list, its merge in `current` and its read in `save()`. `save()` calls `updateEntityProperties` only when an image is edited, with `properties: { image }`, and throws `Failed to update image` on an empty result.
- `LocalizedCandidateData` is `CandidateData & { answers? }`; `EditableEntityProps` is `{ image? }`.
- The guard is one line: no image file, no call.
- `_updateEntityProperties` has no write arm for the field, selects `'image'`, and returns `{ image }`. The no-write read-back branch is kept and its comment describes the image case.
- `_getContestantUserData` no longer maps the field from the RPC row. `_setPassword`'s comment no longer speaks of a terms-of-use UPDATE.
- Three negative controls showed the re-pointed and the new assertions go red when the code is wrong.

## Task Commits

1. **Task 1: the store** — `6fb286d0d` `refactor(172-05): take the terms-of-use members out of the contestant user-data store`
2. **Task 2: the types, the guard and the writer** — `340428ea3` `refactor(172-05): make updateEntityProperties image-only and take the terms-of-use field off the entity types`

`git rev-list --count c3ebcbd30..340428ea3` is 2. The commit that carries this file follows them.

## The Surface as Committed

```ts
// dataWriter.type.ts
export type LocalizedCandidateData = CandidateData & { answers?: LocalizedAnswers | null };
export type EditableEntityProps = { image?: ImageWithFile };
// BasicUserData.termsOfUseAccepted: string | null   (unchanged)

// universalDataWriter.ts
updateEntityProperties(opts: SetPropertiesOptions): DWReturnType<LocalizedCandidateData> {
  if (!opts.properties.image?.file) throw new Error('An image file is required for updating entity properties');
  return this._updateEntityProperties(opts);
}

// supabaseDataWriter.ts, _updateEntityProperties
const columns = 'image';
// no write:  scopedFrom('candidates').select(columns).eq('id', id).single()
// write:     scopedFrom('candidates').update(updateFields).eq('id', id).select(columns).single()
return { image: imageOf(parseImageColumn(data.image, …)) } as unknown as LocalizedCandidateData;

// contestantUserDataState.svelte.ts
#unsavedProperties = $derived<Array<keyof LocalizedCandidateData>>(this.#editedImage ? ['image'] : []);
```

- The store's public type has ten methods: `init`, `reset`, `resetUnsaved`, `reloadCandidateData`, `save`, `setAnswer`, `resetAnswer`, `resetAnswers`, `setImage`, `resetImage`.
- The writer interface's TSDoc for `updateEntityProperties` now says the image is the only editable property and that the call throws without an image file.
- `acceptTermsOfUse` on the writer and on the context, `_getBasicUserData`'s acceptance read, the gate list, the gate view and the `TermsOfUse` / `TermsOfUseForm` components are unchanged.

## Gate Results

Every exit status was read from the command itself or from a status file the command wrote, never through a pipe. No run directory under `tests/e2e-runs/` was created by this plan.

| What | Command | Exit | Result |
|---|---|---|---|
| Frontend typecheck after the store change | `yarn workspace @openvaa/frontend typecheck` | 0 | 0 errors, 0 warnings |
| Task 1 verify chain | typecheck, `vitest run UserDataState`, the two greps, as one command | 0 | 8 of 8 in the store's file |
| Negative control 1 (store) | `resetImage()` ahead of the unverified exit and a second key in `properties` | **1** | Tests 3 and 5 failed, as intended; restored byte-identical; the file's 8 tests pass again (exit 0) |
| Prettier, ESLint on the store files | per file; `eslint src/lib/contexts/contestant` | 0, 0 | the one warning the baseline has (`contestantContext.svelte.test.ts`) |
| Frontend typecheck after the type and writer change | same | 0 | 0 errors, 0 warnings |
| Writer test file | `vitest run supabaseDataWriter` | 0 | 64 of 64 (was 63: one deleted, two added) |
| Negative controls 2 and 3 (writer) | the update through the bare client; the read-back widened to `'image, name'` | **1** | `filters the candidates update by project as well as by id` and the image-only case failed, as intended; restored byte-identical |
| **Task 2 verify chain, part 1, on the final tree** | typecheck, `test:unit`, `lint`, the column grep, as one command | **0** | svelte-check 0 errors and 0 warnings; **137 files, 2170 tests**; ESLint 0 errors and the one baseline warning; no `terms_of_use_accepted` under `apps/frontend` |
| **Task 2 verify chain, part 2** | the `awk` check, run under `bash` as written | **0** | neither entity-level type declares the member; `BasicUserData` does; no store file names the field |
| Root guards on the final tree | `yarn assert:comment-hygiene`, `assert:project-scoped-queries`, `assert:adapter-casts`, `assert:no-candidate-app-names`, `assert:no-session-in-loads` | 0, 0, 0, 0, 0 | |
| Prettier on the four writer files | per file | 0 | |

Counts against the baseline of `172-04-stage1`: frontend unit 2170 tests in 137 files (was 2171 in 137: the store file lost two, the writer file lost one and gained two). The census of the retired column is **41 files and 145 lines** (was 43 and 158): both writer files left it.

## What the Evidence Does and Does Not Show

- **Shown by unit tests:** the store sends the image and nothing else, writes no property when no image is edited, keeps both buffers on an unverified answers write and clears both after a clean save; the writer's guard, its image-only update and read-back, its error path and the project filter on both candidates accesses.
- **Shown by the typecheck:** no typed reader or writer of the entity-level field remains in the frontend.
- **Not shown in this plan:** any of it from a browser. The portrait upload and the answer saves of the contestant journey are the first real exercise, in 172-06's run.

## Decisions Made

None of the plan's decisions was decided differently. The calls the plan does not make are under `key-decisions`.

## Deviations from Plan

### A disagreement between the dispatch handover and the plan, resolved for the plan

- **What disagreed:** the dispatch handover says three frontend items are "left untouched for 172-07 (they go with the database column)": `_getContestantUserData`'s read of `entityRow.terms_of_use_accepted`, the `terms_of_use_accepted: null` of the writer test's `candidateRow(…)`, and `_setPassword`'s comment about a terms-of-use UPDATE; they are to be touched here only if the typecheck forces it. The plan removes all three in Task 2 (steps 3 and 4), makes "`git grep -n "terms_of_use_accepted" -- apps/frontend` prints nothing" an acceptance criterion and part of its first automated check, and states as a truth that no file under `apps/frontend` names the column. 172-07 lists no frontend file and asserts the same zero under `apps/frontend`; 172-RESEARCH's resolved Q-3 says the read "leaves ahead of the RPC column, which is safe".
- **What the typecheck forced:** nothing. The literal in `_getContestantUserData` ends in an `as` cast and the mock rows are untyped, so the tree compiles either way.
- **What was done:** the plan. All three items were removed or corrected, in files the plan lists. The handover's other items were left exactly as they are: the column, its grant, `permittedKeys`, `packages/supabase-types/src/column-map.ts` and every E2E helper that writes the column.
- **Why:** leaving them would have failed the plan's own automated check and left 172-07 a frontend edit its file list does not hold. Nothing reads the entity-level value since 172-04.
- **To undo, if the handover was meant:** restore one line in `_getContestantUserData` (`termsOfUseAccepted: entityRow.terms_of_use_accepted ?? null,`), the field in three mock rows of the writer test and one sentence of a comment. The column is still in the generated types, so the line compiles.

### Auto-fixed Issues

None. No bug, missing check or blocker was met.

### Small departures in form

- **Two store tests deleted, not five.** See the table above. The plan already told the operator this would be counted, not fitted.
- **The store's tests were renumbered** so that the titles run without a gap. One untouched test changed its title for that reason only (`Test 8` to `Test 6`).
- **`Test 2` gained one assertion** (an answers-only save calls no property write). With `Test 6` deleted nothing else pinned that the store writes no property when no image is edited.
- **`Test 3` asserts the keys of the `properties` object** (`['image']`), which is the plan's acceptance criterion for the store put into a test.
- **A `makeImage()` helper** in the store's test file replaces the inline file literal, which five tests now need; `Test 4` uses it too and is otherwise unchanged.
- **Two writer cases beyond the plan's list:** `uploads the image file, writes the image column alone and returns the image alone` (the update payload, the `'image'` read-back and the returned value) and `refuses a call that carries no image file` (the guard's message, and that no table is reached). The deleted case was the only one that asserted an update payload and a returned value.
- **`filters the candidates update by project as well as by id` asserts that one update was issued,** and its read-back sibling asserts that none was. Once both cases pass an image, that is what tells the two chains apart.
- **The writer interface's TSDoc for `updateEntityProperties` was updated** to state the image-only contract and the throw. The plan names the guard and its message; the interface member's description said "any editable properties".
- **Two comments in the store's `save()` were reworded beyond removing the field's name:** the one above the two result variables said the property setter "returns the whole updated `LocalizedCandidateData`", which contradicted the comment eight lines below it; and the paragraph that counted "the three resets" lost its count and its ledger reference. The two paragraphs above it, which cite decision ids, were not changed and are as they were.
- **The class comment says "the public methods"** where it said "the 12 public methods".

### Beyond the plan's list

- **Three negative controls,** each a temporary edit of one file restored from a copy and compared byte for byte before going on.
- **Five root guards** on the final tree, listed in the table.

### Acceptance criteria that did not hold as written

None. Every criterion of both tasks holds as written. Each `<automated>` check was run as one command and exited 0; the second of Task 2 was run under `bash`, because its `for f in $S` relies on word splitting that this host's default shell does not do.

### Departures in procedure

- **`requirements-completed` is empty.** The plan's frontmatter names TOU-01. Its frontend half is done here; the column that the requirement is about leaves in 172-07.
- **The commits sit on `feat/entity-signup-multi-grant` in a linked worktree,** as the run's standing notes direct; the branch was checked before each commit.
- **`172-RESEARCH.md`, `172-PATTERNS.md`, `172-CONTEXT.md` and `173-CONTEXT.md` were read by the sections the plan and the dispatch name,** not whole. Summaries 01 and 02 were not read: nothing this plan touches uses the helpers they describe.
- **The verify chains ran in the background with a status file and were polled,** as the standing notes ask for long runs.

---

**Total deviations:** none auto-fixed; one handover-against-plan disagreement resolved for the plan; ten small departures in form; two additions beyond the plan.
**Impact on plan:** none on behaviour or scope. The disagreement is the item to read.

## Threat Model, Each Disposition

| Threat | Disposition | Where it stands |
|---|---|---|
| T-172-21 deleting the property-update tests wholesale would drop the proof that the candidates update carries the project filter | mitigate | the three `project scoping` cases for `updateEntityProperties` are kept and pass an image; `filters the candidates update by project as well as by id` asserts `['project_id', PROJECT_ID]` on a chain shown to be an update, and negative control 2 shows it fails when the update is unscoped; `yarn assert:project-scoped-queries` exits 0 |
| T-172-SC package installs | accept | no package was installed; `yarn.lock` and every `package.json` are unchanged |

No security-relevant surface was added. One was removed: a signed-in editor's browser can no longer ask the writer to set a candidate's acceptance time. The column grant that would still allow the raw request is 172-07's.

## Changes for the Operator's Eye

- **Two of D-07's five store tests were deleted and four were kept, re-pointed.** This is the plan's first listed deviation from CONTEXT.md, now with its number.
- **The handover disagreement above.**
- **The local database was not reset and no gate set or E2E run was made.** The stack was not stopped or restarted, and no dev server was started; nothing listens on 5173 or 5273.
- **`CAND-APP-PLAN.md` was not edited, moved, staged or committed.** `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged.

## Deferred Issues

None fixed, all outside this plan. None was added to `deferred-items.md`; they are for the plans named:

1. **`_updateEntityProperties` has two arms the public guard no longer reaches:** `image === null` (clear the image) and `image.url` without a file (keep as it is). Before this plan a call carrying a terms value could reach them. They are left because the plan says to reduce the method to its image half, not to reshape that half. Phase 173 generalises this method (173-D1) and decides whether clearing an image is a supported call.
2. **`EditableEntityProps.image` is optional although the guard requires it.** Making it required is a type change on the published option type; it belongs with the same generalisation.
3. **The section comment above the setters in `dataWriter.type.ts` says the property setter "returns the whole updated `LocalizedCandidateData`".** The Supabase writer returns the image only and says so at its cast. The comment was not touched.
4. **Comments in files this plan edited that cite decision ids** ("decision B3", "decision E1" and others, in the store and in its test) are unchanged on every line this plan did not rewrite. `yarn assert:comment-hygiene` does not flag them.
5. **Still naming the entity-level field or the column, in files other plans own:** `packages/supabase-types/src/column-map.ts` (172-07); the docblock of `tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts` and a comment in `voter-journey.spec.ts` that says `termsOfUseAccepted=false` (172-08, with the comments 172-04 listed).
6. **`svelte-check` reports 2065 files when run by hand and 2655 in the gate set,** 0 errors both times; as plan 03 recorded, not investigated.
7. `172-VALIDATION.md` was not touched; its rows for this plan are answered in this file.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification of this plan that was not run. No todo was filed.

## Issues Encountered

None in the product code. Two shell slips on this host, neither affecting a result: a list of paths held in one variable was passed unsplit to Prettier and ESLint (exit 2, "no files matching"), and was rerun as an array.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## What the Next Plan and Later Phases Must Know

**Plan 172-06**

- **Your full run is this plan's boundary proof.** It is the first run in which the journey's portrait upload and answer saves go through the changed `save()` and the image-only writer. A failure there points at the store's `save()` or at `_updateEntityProperties`, not at the visibility change. A failure that says `An image file is required for updating entity properties` means a caller reached the guard without a file.
- Compare against: gates and E2E `172-04-stage1` (nine rows at 0; 177 / 177). Frontend unit is now **2170 tests in 137 files**; the other workspaces are unchanged (dev-seed 997 in 67, supabase 206 in 15, app-shared 141 in 10; pgTAP 38 files, 1392 tests). The census of the retired column is **41 files and 145 lines**.

**Plan 172-07**

- **No file under `apps/frontend` names `terms_of_use_accepted`.** The writer does not read the column from the RPC row and does not write or select it on `candidates`, so regenerating the types after the drop changes no frontend file.
- `candidateRow(…)` and the two other mock RPC rows in the writer test no longer carry the field.
- Untouched and yours: the column, its grant, the RPC's return column, `permittedKeys`, `column-map.ts`, `database.overrides.ts`, `RPC-NULLABILITY.md`, and the E2E helpers that write the column.

**Plan 172-08**

- The stale comments of 172-04's deferred item 3 stand, with the two under deferred item 5 above.

**Phase 173**

- **`updateEntityProperties` is image-only,** as `173-CONTEXT.md` expects: `SetPropertiesOptions` is `{ target, properties: { image?: ImageWithFile } }`, the guard requires `image.file`, and `_updateEntityProperties` still destructures `target: { id }` only and writes `candidates`.
- The method's declared return type is `LocalizedCandidateData` and its value is `{ image }`, bridged by a named cast; the store merges it into the stored candidate. Deferred items 1 to 3 are the loose ends around it.
- The store's `save()` still builds its target as `{ type: ENTITY_TYPE.Candidate, id }`.

**Phase 175**

- The entity's staged-properties list starts from `image` alone on the frontend: `unsavedProperties` is `[]` or `['image']`, typed `Array<keyof LocalizedCandidateData>`.

**Host state:** unchanged by this plan. The stack is up as plan 04 left it; nothing listens on 5173 or 5273; the database was not reset or written.

## Self-Check: PASSED

- The seven files under `key-files.modified` and this file exist, and `git diff --name-only c3ebcbd30..340428ea3` lists exactly those seven.
- The two commits (`6fb286d0d`, `340428ea3`) are ancestors of HEAD; `git rev-list --count c3ebcbd30..HEAD` was 2 when this file was written.
- The plan's verification items were run on the tree of `340428ea3`: the frontend typecheck, unit suite and lint as one command (exit 0), the column grep under `apps/frontend` (no line, exit 1), and the check that neither entity-level type declares the field and no store file names it (exit 0).
- Every acceptance criterion of both tasks was checked by command.
- No stub pattern is in the added lines. `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
