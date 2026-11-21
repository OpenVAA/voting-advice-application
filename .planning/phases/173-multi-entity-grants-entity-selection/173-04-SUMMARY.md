---
phase: 173-multi-entity-grants-entity-selection
plan: 04
subsystem: frontend-contestant-store
tags: [svelte5, runes, store, localstorage, drafts, multi-entity, untrack]

requires:
  - phase: 173-multi-entity-grants-entity-selection
    provides: "173-03: the store reading `entity` of either served type, save() targeting the loaded entity, reloadEntityData reading it untracked"
provides:
  - "removePersistedByPrefix(type, prefix) in the persisted-state module"
  - "EDITED_ANSWERS_KEY_STEM and editedAnswersKey({ type, id }): one draft key for each entity, contestantContext-userData-editedAnswers-<type>-<id>"
  - "The store's draft handle built on init and replaced, with the image edit dropped, when another entity is loaded"
  - "leaveEntity() on the store and its type; reset() sweeping every draft key on logout"
  - "The answers lock clearing the draft of whichever entity is loaded"
  - "save() and reloadEntityData() writing nothing into the store when another entity was loaded while the call was in flight"
  - "Stage 2 closed on four gate rows: 173-04-store, typecheck, lint, unit and check-frontend at 0 on tree 60902cbab"
affects: [173-05, 173-07, 173-08, 173-09, 173-12, 173-13]

estimate:
  tokens: 40000
actuals:
  tokens: 10476
  tasks: 3
  commits: 3
plan_head_before: b80f5badeb08cc4a0c34880e47fd8f9b16f6707a
plan_head_after: 811d93d118db9420491cc310b828d73f309f1fe3

tech-stack:
  added: []
  patterns:
    - "A persisted handle whose key is fixed at construction is re-keyed by replacing it, and held in $state.raw so that derived values follow the replacement"
    - "A store method that compares against state it then writes reads that state untracked"
    - "An effect that must rerun for another entity reads the entity's handle tracked and does its writes inside untrack"
    - "After an await, a store method asks whether the entity it started for is still the loaded one before it writes a result"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
    - apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
    - .planning/phases/173-multi-entity-grants-entity-selection/173-NAME-MAP.md

key-decisions:
  - "The logout sweep removes keys that start with the stem followed by a hyphen, the exact form the key builder produces, not keys that merely start with the stem"
  - "setAnswer throws when no entity is loaded; the reset methods do nothing to answers then"
  - "save() and reloadEntityData() check after each await that the entity they started for is still loaded, and write nothing into another entity's data, draft or image edit"
  - "No E2E run was made: the plan's criterion 'no E2E run directory is created for this plan' was kept over the handover's offer of a one-project slice"

patterns-established:
  - "Negative controls for store reactivity: each new guard was removed in turn and the case written for it was observed to fail"

requirements-completed: [ENT-02]

coverage:
  - id: D1
    description: "Unsaved answers are persisted under a key that names the entity; an edit made for A is absent after B is loaded and present again when A is loaded, for a candidate and an organization, for two candidates, and for a candidate and an organization that share an id"
    requirement: ENT-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts — 'builds an entity key from the stem, the type and the id' and three rows of 'an edit made for A is absent for B and present again for A: %s'"
        status: pass
    human_judgment: false
  - id: D2
    description: "Loading another entity drops the in-memory image edit; loading the same entity again with fresh data keeps its draft and its image edit"
    requirement: ENT-02
    verification:
      - kind: unit
        ref: "contestantUserDataState.svelte.test.ts — 'an image edit made for A is gone after B is loaded, and does not come back with A' and \"loading A again with fresh data keeps A's draft and its image edit\""
        status: pass
    human_judgment: false
  - id: D3
    description: "leaveEntity() empties the store without touching the entity's persisted draft; reset() removes the draft of every entity and leaves keys outside the stem"
    requirement: ENT-02
    verification:
      - kind: unit
        ref: "contestantUserDataState.svelte.test.ts — \"leaveEntity() empties the store and leaves A's key as it was\" and \"reset() removes A's and B's keys and leaves a key outside the stem\""
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts — describe 'removePersistedByPrefix', four cases"
        status: pass
    human_judgment: false
  - id: D4
    description: "With answers locked, the draft of whichever entity is loaded is cleared, including a draft stored for that entity before the lock"
    verification:
      - kind: unit
        ref: "contestantUserDataState.svelte.test.ts — 'with answers locked, a draft stored for B beforehand is cleared when B is loaded'"
        status: pass
    human_judgment: false
  - id: D5
    description: "Two store instances holding two different entities never read each other's drafts; save() for A empties A's key and leaves B's"
    requirement: ENT-02
    verification:
      - kind: unit
        ref: "contestantUserDataState.svelte.test.ts — \"two store instances holding A and B do not read each other's edits\" and \"save() for A empties A's key and leaves B's\""
        status: pass
    human_judgment: false
  - id: D6
    description: "init called from an effect does not make that effect depend on the draft it replaces; a save or reload still in flight when another entity is loaded writes nothing into that entity's data, draft or image edit"
    verification:
      - kind: unit
        ref: "contestantUserDataState.svelte.test.ts — 'init called inside an effect does not rerun that effect when it swaps the draft', the two 'a save still in flight…' cases and 'a reload still in flight when B is loaded…'"
        status: pass
    human_judgment: false
  - id: D7
    description: "The fixed draft key is gone from the tree"
    verification:
      - kind: other
        ref: "git grep -n -F 'ContestantContext-contestantUserDataStore-editedAnswers' -- . ':!.planning': exit 1, no line"
        status: pass
    human_judgment: false
  - id: D8
    description: "The discard-on-navigation prompt of the profile and question editors is unchanged (ruling O-Q5)"
    verification:
      - kind: other
        ref: "git diff --stat 698c901ca..HEAD on the two editor pages prints nothing; no file under apps/frontend/src/routes changed in this plan"
        status: pass
    human_judgment: false
  - id: D9
    description: "Stage 2 closes on typecheck, lint, the unit suites and svelte-check, all green, on one tree"
    verification:
      - kind: other
        ref: "173-verdict.mjs gates 173-04-store --rows typecheck,lint,unit,check-frontend, exit 0, head 60902cbab tree-equal to HEAD outside .planning/"
        status: pass
    human_judgment: false
  - id: D10
    description: "PROH-173-09: nothing remembers which entity was last selected"
    verification:
      - kind: unit
        ref: "contestantUserDataState.svelte.test.ts — the 'absent for B, present again for A' rows assert that the storage holds the two draft keys and nothing else"
        status: pass
    human_judgment: true
    rationale: "Marked verification: judgment in the plan. The store writes draft keys only; this plan adds no cookie, setting or other key. The unit assertion covers the store, not the rest of the app."
  - id: D11
    description: "In a browser: a draft survives a reload under its entity's key, the save and logout paths behave as before, and the lock clears the draft"
    requirement: ENT-02
    verification: []
    human_judgment: true
    rationale: "No browser ran in this plan, by its design. The full E2E run that closes 173-05 exercises save, logout and the answers lock; no spec on the tree reloads in the middle of an edit or reads the unsaved state, so the reload path waits for the spec of 173-12."

duration: 16min
completed: 2026-10-06
status: complete
---

# Phase 173 Plan 04: Drafts Keyed by Entity Summary

**Each entity's unsaved answers now live under their own `localStorage` key, `contestantContext-userData-editedAnswers-<type>-<id>`; the store builds that key's handle when an entity is loaded and replaces it, dropping the image edit, when another is; `leaveEntity()` lets go of an entity without touching its draft and logout sweeps every draft key; and tree `60902cbab` is green on the four gate rows this plan closes on. No browser ran here: the full E2E run that closes 173-05 is the boundary proof.**

## Read First

1. **This plan made no E2E run, as it rules.** The handover offered a one-project slice of `contestant-journey` as an acceptable addition. The plan's acceptance criterion says no E2E run directory is created for this plan, and where the two disagree the plan is the contract, so no slice was made. Nothing here was judged untrustworthy without a browser; what only a browser can show is listed under "What 173-05's Full Run Must Show".
2. **The plan's premise about that run is partly wrong on this tree.** It says 173-05's run holds "a journey step that reloads in the middle of an edit, or reads the unsaved state of an answer or of the image, or logs out". Measured: `git grep -n -i -E "unsaved|preventNavigation|beforeunload" -- tests/tests` finds one line, a table row in the a11y spec's docblock, and no contestant spec calls `page.reload()`. The suite logs out (journey steps 7 and 22, `perm-localisation-positive` step 9), saves answers and an image, and runs under the answers lock (`perm-answers-locked`). It does not reload mid-edit and does not assert an unsaved state. **The reload path of a per-entity draft has unit evidence only until the spec of 173-12.**
3. **`ENT-02` is copied into `requirements-completed` because the template requires the plan's list; it is not complete.** This plan delivers its store half. Selection, switching and the routes are 173-07 to 173-10. The orchestrator owns `REQUIREMENTS.md`.
4. **Three behaviours were added beyond the plan's letter,** each a guard the plan's own truths need. They are under "Deviations from Plan".

## Performance

- **Duration:** about 16 min (start 11:42:36Z; the name-map commit at 11:56:37Z; this file after it)
- **Tasks:** 3 of 3
- **Files changed:** 6 (5 outside `.planning/`, none created)
- **Start revision:** `b80f5bade`. **The tree the gate rows describe:** `60902cbab`.

## Task Commits

1. **Task 1: the prefix removal** — `698c901ca` `feat(173-04): remove every persisted key that starts with a prefix, for the logout sweep of per-entity drafts`
2. **Task 2: the draft follows the entity** — `60902cbab` `feat(173-04): keep each entity's unsaved answers under that entity's own key, and sweep every such key on logout`
3. **Task 3: the close** — `811d93d11` `docs(173-04): record the green close of the store stage of multi-entity grants on four gate rows in the name map`

`git rev-list --count b80f5bade..811d93d11` is 3. The commit that carries this file follows them. `yarn workspace @openvaa/frontend typecheck` exited 0 on the tree of each source commit before it was made.

## Gate Results

Every exit status was read from the command itself or from a marker file, never through a pipe.

| What | Command | Exit | Result |
|---|---|---|---|
| Task 1 | `yarn workspace @openvaa/frontend vitest run persistedState`; the `prefix` grep; `… typecheck`; eslint and prettier on the two files | 0; 0; 0; 0, 0 | 19 tests in 1 file |
| Task 2 | `… vitest run contestantUserDataState contestantContext`; `… check`; the `leaveEntity` grep; the stem grep | 0; 0; 0; 0 | 30 tests in 2 files; 0 errors, 0 warnings |
| Task 2, old key | `git grep -n -F "ContestantContext-contestantUserDataStore-editedAnswers" -- . ':!.planning'` | 1 | no line |
| Task 2, prompt pages | `git diff --stat 698c901ca..HEAD -- <the two editor pages>` | 0 | prints nothing |
| Task 2, beside the plan | `… typecheck`; `… test:unit`; eslint on `src/lib/contexts/`; prettier on the same | 0; 0; 0; 0 | 2224 passed and 7 skipped in 139 files |
| **Gate rows** | `caffeinate -dimsu 173-gates.sh 173-04-store --rows typecheck,lint,unit,check-frontend` | **0** | **four rows, every status 0** |
| Gate verdict | `173-verdict.mjs gates 173-04-store --rows typecheck,lint,unit,check-frontend` | 0 | four expected, four recorded; not stale; no Sleep entry |
| The same, as the full set | `173-verdict.mjs gates 173-04-store` | 1 | as it must: a subset is never read as the full gate set |
| Plan verification | `… vitest run persistedState contestantUserDataState` on the final tree | 0 | 48 tests in 2 files |
| Closing searches | `173-verdict.mjs greps` | 1 | three literals without a hit; `userNoCandidate` (12 hits in 11 files) is 173-10's |

The four rows of `173-04-store`: typecheck 20 s, lint 43 s, unit 61 s (frontend 2224 passed and 7 skipped in 139 files; the other workspaces as at the close of 173-03), check-frontend 9 s (2658 files, 0 errors, 0 warnings).

**This is a subset and is judged as one.** It did not run `types-regen`, `types-clean`, `sql-lint`, `pgtap`, `build`, `format`, `docs-links` or `name-gate-self-test`, and it reset nothing. The last full measurement of those rows is `173-03-writer-r5`. No file this plan changed is read by a database row; the `build` and `format` rows are 173-05's to show (`prettier --check apps/frontend/src/lib/contexts/` was run by hand on the final tree and exits 0).

### Every run directory of this plan

| Directory | Tree | Counts | Verdict |
|---|---|---|---|
| **`tests/e2e-runs/173-gates/173-04-store`** | `60902cbab` | four rows 0 | **green, judged as a subset** |

Window 14:53:22 to 14:55:35 local, on AC power at the start and the end, `sleep_entries_in_window: 0`. Beside it: `173-04-store.log` and `173-04-store.exit`. There is no directory of this plan under `tests/e2e-runs/173-e2e/`. Nothing under `tests/e2e-runs/` was deleted.

## The Final Names

| Role | Name |
|---|---|
| The prefix removal | `removePersistedByPrefix(type: StorageType, prefix: string): void`, exported from `persistedState.svelte.ts` |
| The stem constant | `EDITED_ANSWERS_KEY_STEM`, value `contestantContext-userData-editedAnswers`, exported from `contestantUserDataState.svelte.ts` |
| The key builder | `editedAnswersKey({ type, id })`, exported from the same file |
| The active draft | private `#draft`, `$state.raw<{ key, answers } \| undefined>` |
| Letting go of an entity | `leaveEntity()` |
| The stale-result check | private `#isLoaded(key)` |

Removed: the literal `ContestantContext-contestantUserDataStore-editedAnswers` and the field `#editedAnswersState`. The two exports are not in the context's barrel; a caller imports them from the store's module.

## What the Store Does Now

- **`init(data)`** builds the key from `data.entity`. If the active draft has another key, or there is none, it constructs the handle for that key and drops the image edit; otherwise it keeps both. It reads the active draft untracked, because it writes it.
- **`leaveEntity()`** drops the saved data, the image edit and the handle. It writes nothing to storage.
- **`reset()`** does that and then removes every key that starts with the stem and a hyphen.
- **`resetUnsaved()`** and **`save()`** clear the loaded entity's draft and image edit, as before.
- **`setAnswer`** throws `Cannot set an answer before user data is loaded` when no entity is loaded. Its two callers are input handlers of the two editor pages.
- **The lock effect** reads the active draft tracked and clears it, with the image edit, inside `untrack`.
- **A handle writes `{}` under its key when it is constructed,** so every entity that was opened leaves a key until logout. That is why the sweep is by prefix.
- **A browser that stored a draft under the old fixed key keeps that one key.** Nothing reads it or removes it; nothing is deployed.

## The Discard Prompt Is Unchanged

Neither editor page was touched, and no file under `apps/frontend/src/routes` changed. For a switch made from an editor with an unsaved edit, the page's own `PreventNavigation` still asks, and a confirmed navigation still calls `resetUnsaved()`, which now clears that entity's draft alone. A draft therefore outlives a page through a reload, a closed tab, or a switch made from a page that raises no prompt. The spec of 173-12 proves it through a reload.

## What 173-05's Full Run Must Show for This Plan

That run is this plan's boundary proof. For the store change it must show every project that signs a contestant in at its baseline count and green, in particular `contestant-journey`, `perm-answers-locked`, `perm-localisation-positive`, `contestant-a11y-scan` and `cold-entry-dataroot-contestant`.

**A failure of these kinds points back here, not at 173-05:**

| Symptom | Where it would come from |
|---|---|
| `Cannot set an answer before user data is loaded` in a trace's console | an input handler ran before the layout's effect loaded the store |
| An answer or image edit that does not appear in the editor until it is saved | the draft is not overlaid: `#current` or the unsaved derivations not following the handle |
| After a save, the editor's leave prompt still appearing, or the saved answer shown as edited | the saved entity's draft not cleared |
| Journey step 7 or 22, or `perm-localisation-positive` step 9, failing at or after logout; a second sign-in showing an earlier edit | `reset()`, `leaveEntity()` or the sweep |
| `perm-answers-locked` showing an editable or edited value, or `effect_update_depth_exceeded` in a console | the lock effect |
| A storm of `get_entity_user_data` requests, or a page that keeps reloading | an effect depending on what `init` or a reload writes (name map item 16) |
| The preview or home showing no entity after a save or a reload | `#isLoaded` refusing a result for the entity that is loaded |

A failure at the login form, in the role check or in the served-types filter is 173-05's own.

**What that run cannot show:** a draft surviving a reload, a draft absent for another entity, and two tabs. No spec on the tree does any of the three; they are 173-12's.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] A save still in flight when another entity is loaded would write into that entity**
- **Found during:** Task 2, reading `save()` against the plan's truth that one entity's draft is never overlaid on, or saved to, another
- **Issue:** `save()` awaits the backend and then merges the answer, stores the image and clears the draft and image edit of whatever the store holds. Once `init` can load another entity, A's saved answers would be merged into B's saved data and B's draft and image edit cleared. After `leaveEntity()` the merge would throw, so a successful save would reject.
- **Fix:** `save()` takes the key at its start and asks `#isLoaded(key)` after each await. When the entity is no longer loaded it stores nothing and clears A's own stored draft through the handle it started with.
- **Files modified:** `contestantUserDataState.svelte.ts`, `contestantUserDataState.svelte.test.ts` (two cases)
- **Commit:** `60902cbab`

**2. [Rule 2 - Missing critical functionality] A reload still in flight when another entity is loaded would store A's data as B's**
- **Found during:** Task 2
- **Issue:** `reloadEntityData()` stores its result into the saved data unconditionally. With B loaded meanwhile, the store would hold A's entity under B's draft, and the next `save()` would send B's draft to A: threat T-173-15.
- **Fix:** the result is stored only when `#isLoaded(key)`; it is returned either way. The type's TSDoc says so.
- **Files modified:** `contestantUserDataState.svelte.ts`, `contestantUserDataState.type.ts`, the test file (one case)
- **Commit:** `60902cbab`

**3. [Rule 2 - Missing critical functionality] An answer set with no entity loaded had nowhere to go**
- **Found during:** Task 2
- **Issue:** the plan says the store reads as empty with no handle; it does not say what `setAnswer` does then. Dropping the answer silently would lose typing.
- **Fix:** `setAnswer` throws, as the store's other "before user data is loaded" paths do. `resetAnswer`, `resetAnswers` and `resetUnsaved` do nothing to answers.
- **Commit:** `60902cbab`

### Departures from the plan's letter

- **The sweep's prefix is the stem and a hyphen,** not the bare stem. It is every key the builder can produce and no key that only shares the stem's letters. The plan's case (A's and B's keys go, a key outside the stem stays) holds, and a second kept key, one that contains the stem later in its name, is asserted beside it.
- **`## After 173-04` was inserted before the name map's last list, not appended,** as the sections of 173-02 and 173-03 were, so that the list stays the file's last section. Items 19 and 20 were added to the list.
- **Task 2 added sixteen cases, not eight.** The eight of step 7 are there; the first is three rows (a candidate and an organization, two candidates, a candidate and an organization sharing an id). The others: the key's form, the empty store, `init` inside an effect, and the three in-flight cases.
- **The handover asked for a regression case that counts effect runs.** It is `init called inside an effect does not rerun that effect when it swaps the draft`.
- **The context file was not changed,** as step 8 allows: no member it reads was renamed.
- **Negative controls.** Seven guards were removed one at a time and the suite run: the untracked read in `init`, the tracked read in the lock effect, the two guards in `save()`, the guard in the reload, the image reset on a swap, and the sweep. Each run failed only in the case or cases written for that guard (one case each, two for each guard of `save()`), and the file was restored byte for byte before the commit.

### Departures in procedure

- **The commit-time worktree check of the executor's protocol was not applied,** as in 173-01 to 173-03: this checkout is a permanent linked worktree on `feat/entity-signup-multi-grant`, and the standing notes say to commit normally.
- **The broken-windows ledger was not appended to.** This plan leaves no stub, skipped test or unrun check.
- **Reading.** Read: the standing notes, the plan, `173-03-SUMMARY.md` in full, of the name map the names, facts, P-5, the baseline, the three "After" sections and the last section, the drivers' headers, of the research R-4.6, P-6 and P-7, of the context D-09, D-16 and D-17, of the UI contract "Unsaved edits on a switch", the spike-findings skill's `SKILL.md`, `context-reactivity.md`, the head of `STATE.md`, `config.json`, and the head of the summary template. Not opened: `PROJECT.md`, the components skill's `SKILL.md`, `persistent-rune-stores.md`, the workflow references, research P-17 and R-6.6 beyond their one-line statements.

## Deferred Issues

- **A save still in flight at logout leaves one empty key.** `reset()` sweeps, and the save's completion then writes `{}` under that entity's key. The key holds no answer; its name holds the entity's type and id. Not changed here.
- **The image members' TSDoc in the store's type file still says "the `Candidate`'s image"** (pre-existing; Phase 175's).
- **`+layout.svelte`'s comment calls `userData.init` "a synchronous `savedData = data` assignment".** It is still synchronous and now also swaps the draft. The file is outside this plan's list and was not edited.
- **`contestantContext.svelte.test.ts` has an unused variable** reported as a lint warning (pre-existing, carried from 173-03).
- Carried and unchanged: the items listed in `173-03-SUMMARY.md`.

## Known Stubs

None. `leaveEntity()` has no caller yet by the plan's ruling 4; 173-07 adds the first.

## Threat Model, Each Disposition

| Threat | Disposition | Where it stands |
|---|---|---|
| T-173-15 entity A's unsaved answers overlaid on entity B and saved to it | mitigate | the key carries type and id; the handle is replaced on `init` for another entity; the three "absent for B, present again for A" rows, one of them for a shared id; "two store instances…"; the in-flight save and reload cases |
| T-173-16 a signed-out user's drafts readable by the next user of the browser | mitigate | `reset()` removes every key under the stem; asserted over two entities' keys with two kept keys beside them. One empty key can be written after the sweep by a save in flight at logout (Deferred Issues) |
| T-173-17 the prefix removal clearing unrelated storage | mitigate | an empty prefix throws and removes nothing; a key that contains the prefix later in its name is kept; both asserted in the module's suite and the second again in the store's |
| T-173-SC package installs | accept | no package was installed |

No new security-relevant surface beyond the plan's threat model.

## What the Next Plan and Later Phases Must Know

- **Read `173-NAME-MAP.md` first:** `## After 173-04` and the last section, which now has twenty items; item 19 is this plan's.
- **Compare against** gates `173-03-writer` and E2E `173-03-writer` for the full sets (180 tests, 100 projects; pgTAP 38 files, 1447 tests). The frontend unit count is now 2224 passed and 7 skipped in 139 files.
- **173-05:** its full run is this plan's boundary proof; see the table above for which failures point here. Its gate set is the first full one since this plan, so its `build` and `format` rows are also the first to see these five files.
- **173-07:** call `leaveEntity()` from the entity-level layout's teardown. Until then the store behaves between pages as before. With the store empty off an entity, the Help and Privacy pages' `userData.current ? … : …` test reads "signed out" for a signed-in user (research P-6).
- **173-08 and 173-09:** a page that awaits `save()` or `reloadEntityData()` across a switch gets a result for the entity it asked about, while the store may already hold another. The preview's effect already depends on the loaded entity's type and id.
- **173-12:** the draft key of an entity is `contestantContext-userData-editedAnswers-<type>-<id>`, stored as `{ version, data }`. The reload proof of per-entity drafts is this spec's; nothing earlier provides it.
- **173-13:** the closing search for the fixed draft key is empty now.

**Host state:** the stack was not touched: no reset, no restart, no Edge Function served. The gate rows run here read no database. Nothing listens on 5173 or 5273 and no dev server of this plan ran. The host is on AC power. `CAND-APP-PLAN.md` is untracked and untouched. `.planning/STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `PROJECT.md` are unchanged.

## Self-Check: PASSED

- The five source files, the name map, this summary, the gate run's `summary.tsv` and its `.exit` marker exist; the run's `head` names `60902cbab`.
- Commits `698c901ca`, `60902cbab` and `811d93d11` are ancestors of HEAD; `git rev-list --count b80f5bade..811d93d11` is 3.
- The plan's verification items hold on the final tree: `vitest run persistedState contestantUserDataState` exit 0 (48 tests); the old-key grep prints nothing and exits 1; `173-verdict.mjs gates 173-04-store --rows typecheck,lint,unit,check-frontend` exit 0, re-taken after the name-map commit.
- `.planning/STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `PROJECT.md` are unchanged since the start revision (`git diff --quiet` exit 0). Nothing listens on 5173 or 5273. No directory of this plan exists under `tests/e2e-runs/173-e2e/`.
