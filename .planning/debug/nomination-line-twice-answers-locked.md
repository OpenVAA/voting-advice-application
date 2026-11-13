---
status: diagnosed
trigger: "Phase 176 plan 01, the fourth point of 176-D9-FINDING.md: on the answers-locked profile the console line `Error formatting nomination` is logged twice, about 2 ms apart, for ONE nomination. Why the nominations block is formatted twice under the answers lock is not established. Operator decision D9 (a): find the cause before the code that logs the line is deleted. Diagnosis only — no application or test change."
created: 2026-10-09T00:21:00Z
updated: 2026-10-09T00:40:00Z
goal: find_root_cause_only
symptoms_prefilled: true
---

## Current Focus

bug_class: Bohrbug (deterministic: two lines for one nomination in every full load of a profile while `access.answersLocked` is on — five loads in two E2E runs, and every run of the component test)
hypothesis: CONFIRMED in a component test of the real page, entity layout, contestant context, user-data store and data root — see Resolution. Not re-read in a browser with the throwaway change.
test: done. Six cases on unmodified application code; the same six with three throwaway variants of the store's answers-lock effect, each reverted.
next_action: none in this session (goal: find_root_cause_only). The orchestrator rules on the fourth point of `176-D9-FINDING.md`; the proposed wording and a todo's text are in Resolution.

reasoning_checkpoint:
  hypothesis: "The second line is a second formatting of the same `{#each}` item, not a second block or a remount. While answers are locked, the user-data store's answers-lock effect writes `draft.answers.set({})` and `#staged = {}` on every run, whether or not there is anything to clear. Its first run falls after the entity layout's effect (which called `userData.init`) and before the root layout's effect (which gives the data root its elections). Each write is a new object in a signal the store's `#current` reads, and `#current` returns a JSON clone, so `userData.current` and every nomination object in it is replaced by an equal copy; the profile's unkeyed `{#each}` sets its item signals and the `{@const … = parseNomination(nomination)}` derived recomputes while the data root still has no election."
  confirming_evidence:
    - "Unmodified code, one nomination: lock off 1 line and 2 formattings (threw, resolved); lock on 2 lines and 3 formattings (threw, threw, resolved). Two nominations: 2 and 4 lines."
    - "The recorded order under the lock: entity layout effect → store `init` → LINE 1 → the store's answers-lock effect writes → LINE 2 → root layout effect → resolved. With the lock off the lock effect's write is absent and so is LINE 2."
    - "Throwaway V1 (both writes made only when there is something to clear): lock on 1 line and 2 formattings, as with the lock off. Reverted: 2 lines again."
    - "Throwaway V2 (only the draft write guarded) and V3 (only the staged write guarded): still 2 lines each. Either write alone is enough."
    - "One page init, one card, and at LINE 2 the document already holds the card — the same DOM node as the settled card. LINE 2's stack is an `{#if}` update inside that card (`InputGroup.svelte:54`), not `create_item`."
    - "Elections in the data root before the page is created: lock off 1 formatting, lock on 2 formattings, 0 lines in both. The second formatting happens under the lock either way; it is a line only while the election is missing."
  falsification_test: "Any of: a lock-on mount with one line on unmodified code; a variant that guards both writes and still logs two; a second page init or a second card under the lock; in a browser, an entity with two nominations under the lock that logs three lines and not four. None of the first three was observed; the fourth was not run."
  fix_rationale: "Not applied (diagnosis only). Guarding both writes of the lock effect removes the spurious replacement of `userData.current` at its source; deleting the profile's block (Phase 176) removes the only consumer that logs, and leaves the replacement in place."
  blind_spots: "No browser run in this session, so the throwaway change was not seen to remove the second line in the application itself. The test mounts with `mount()`, not `hydrate()`; the root layout and the Contestant App layout are stand-ins (the root layout's data-root effect copied, the context initialised by the real `initContestantContext`), and the app context is a fake over the real data context. An entity with more than one nomination under the lock was never loaded in a browser (prediction: two lines for each). Whether a frame is painted between the lines and the resolved card was not measured in a browser; both lines and the resolving effect are inside one synchronous flush in the test."
  candidate_causes:
    - "code: the store's answers-lock effect writes unconditionally and so replaces `userData.current` (confirmed, as the second of two conditions)"
    - "code: the page formats a nomination before the data root holds its election (the known cause of the first line; confirmed as the other condition)"
    - "data: the answers-locked datasets hold other data — two elections, two rows, a parent (eliminated: one entity of one dataset logs 1 line with the lock off and 2 with it on; the component test toggles the lock alone)"
    - "environment: a dev-server or hydration artefact, a second render pass of the dev build (eliminated: reproduced in vitest with `mount()` and no server; the pass is the store's own effect)"
  and_gate: "yes, two conditions at once. (1) the page formats before the root layout's effect has given the data root its elections; (2) the store's lock effect replaces `userData.current` inside that window. Without (1) the second formatting logs nothing (measured: 2 formattings, 0 lines). Without (2) there is one line (measured: lock off, and V1)."

## Symptoms

expected: a full load of a profile logs the line once for each nomination (the card is formatted once before the data root holds the election, and once more, resolved, afterwards).
actual: while `access.answersLocked` is on, a full load logs the line twice for one nomination, 2 to 3 ms apart, both naming one election id. The card resolves afterwards, as with the lock off.
errors: |
  [console.error] {"level":50,"time":1791504298104,"msg":"Error formatting nomination: Error: Child in collection elections with id ffce6a1f-513f-4ac6-968e-bee6cb0e8664 not found","severityText":"ERROR"}
  [console.error] {"level":50,"time":1791504298106,"msg":"Error formatting nomination: Error: Child in collection elections with id ffce6a1f-513f-4ac6-968e-bee6cb0e8664 not found","severityText":"ERROR"}
reproduction: `page.goto('/en/contestant/profile')` under a candidate's session while the project's `access.answersLocked` is on, the page held open past hydration (run `tests/e2e-runs/176-e2e/176-01-d9-reading`, probe 2; the committed scans `org-profile-answers-locked` in each theme).
started: at least since Phase 175's closing run (`tests/e2e-runs/175-e2e/175-13-final`), where the same two scans hold a 2 ms pair each.

## Eliminated

- hypothesis: "(a) Under the lock the page renders the block in a second place, or through a second component instance"
  evidence: read — `parseNomination` has one definition and one call, inside the one `{#each}`; the lock changes the `note` snippet, the `locked` props and the `primaryActions` snippet, none of which holds the block. Measured — one page init (`pageStyles.use` called once), one card after the flush, in both lock states.
  timestamp: 2026-10-09T00:24Z

- hypothesis: "(b) The lock makes the block be destroyed and created again during hydration, formatting once per creation"
  evidence: measured — at the second line the document already holds one card, and it is the same DOM node as the card after the flush. The first line's stack comes from `each.js` `create_item`; the second from `if.js` updating the `{#if title}` of the existing `InputGroup`. An item updated in place, not a block created twice.
  timestamp: 2026-10-09T00:24Z

- hypothesis: "(c) The function is called from two reactive computations, and under the lock both run before the elections arrive"
  evidence: read — one `{@const}`. Measured — both lines' stacks pass through the same derived (`+page.svelte:426:89`, `execute_derived`).
  timestamp: 2026-10-09T00:24Z

- hypothesis: "(d) The answers-locked datasets differ in data, not in the lock"
  evidence: `176-01-d9-reading.lines-by-test.txt` — under one describe ("as the unconfirmed organization's editor"), one dataset and one election id, the scan `org-profile-editable` holds 1 line and `org-profile-answers-locked` 2, 3 ms apart; the spec flips the lock with `setAnswersLocked(true)` between them. Component test — identical data, the lock alone toggled: 1 and 2.
  timestamp: 2026-10-09T00:24Z

- hypothesis: "(e) The line is logged once per render pass, and the lock adds a pass because the settings arrive in a separate effect flush"
  evidence: right that there is one more pass before the elections arrive, wrong about its cause. The settings do not arrive late: the app context folds them into its initial state from page data, and the answers-locked warning is in the server-rendered markup (visible 289 ms after the navigation began, the lines at 655 ms). The pass is the store's own answers-lock effect; with that effect's writes guarded the pass is gone while the lock stays on.
  timestamp: 2026-10-09T00:27Z

## Evidence

- timestamp: 2026-10-09T00:18Z
  checked: `git grep -n parseNomination` and the profile page's markup
  found: one definition, one call: `{@const { election, constituency, organization, electionSymbol, unconfirmed } = parseNomination(nomination)}` inside the one unkeyed `{#each nominations as nomination}`, where `nominations` is `$derived(userData.current?.nominations?.nominations ?? [])`. The block stands in no `{#if}` and no `{#key}` of the page.
  implication: two lines for one item need the one `{@const}` derived to be computed twice while the election is missing — by a change of the data root's version or of the item itself.

- timestamp: 2026-10-09T00:19Z
  checked: `tests/e2e-runs/176-e2e/176-01-d9-reading.lines-by-test.txt`
  found: `org-profile-editable` 1 line, `org-profile-answers-locked` 2 lines 3 ms apart; same describe, same dataset, same election id `16a27d1a`.
  implication: one entity, one dataset, the lock alone differs.

- timestamp: 2026-10-09T00:20Z
  checked: `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts` and `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts`
  found: the store's constructor installs `$effect(() => { if (!this.#answersLocked()) return; const draft = this.#draft; untrack(() => { draft?.answers.set({}); this.#staged = {}; }); })`. `#current` is a `$derived.by` that reads `this.#draft?.answers.current` and `this.#staged` and returns `JSON.parse(JSON.stringify(…))`, nominations included. `#staged` is `$state.raw`, so `= {}` is always a changed value; `PersistedStateImpl.set` assigns a new object to a deep `$state`, a changed value too. `init()` sets `#draft` for a new entity, which the effect reads tracked.
  implication: the only code the lock switches on that writes into what `userData.current` is derived from. With the lock off it returns before it reads the draft or writes anything.

- timestamp: 2026-10-09T00:21Z
  checked: where each effect is created — `routes/+layout.svelte` (root: `provideElectionData`), `routes/contestant/+layout.svelte` (`initContestantContext()`, so the store's effect and the context's three), `routes/contestant/(protected)/[entityType]/[entityId]/+layout.svelte` (entity: `provideQuestionData`, `provideEntityData`, `userData.init`); installed `svelte` 5.57.1, `src/internal/client/reactivity/effects.js` `user_effect`, `context.js` `pop`, `batch.js` `flush_queued_effects` and `sources.js` `mark_reactions`
  found: the Contestant App layout is an ancestor of the entity layout and a descendant of the root layout; a component's top-level `$effect`s are held back (`user_effect` pushes them to the component context) and created when its own init ends (`pop`), after its children's, so on a first flush they run descendant-first: entity layout, then the Contestant App layout's (the store's lock effect first, then the context's), then the root layout's. `flush_queued_effects` updates the block effects a user effect dirtied before it runs the next user effect (`eager_block_effects`, filled in `mark_reactions` for every `BLOCK_EFFECT`).
  implication: the store's lock effect has its first run inside the window in which the nominations are listed and the data root has no election, and what it invalidates is rendered at once.

- timestamp: 2026-10-09T00:23Z
  checked: scratch vitest component test on unmodified application code (head `35f8df68a`): the real profile page inside the real entity layout, under the real `ContestantContextProvider` with its real user-data store, over the real data context and `DataRoot`; a stand-in for the root layout holding that layout's data-root effect, a stand-in for the Contestant App layout calling `initContestantContext()`; a fake app context forwarding `dataRoot` and `setDataRoot` from the real data context; the lock set before the mount. Recorded: every `log.error` holding the phrase, every call of `parseNomination` (by its `getElection` call), the entity layout's and the root layout's data-root writes, the store's `init` and the lock effect's `draft.answers.set`.
  found: |
    one nomination, lock off: 1 line, 2 formattings (threw, resolved)
    one nomination, lock on:  2 lines, 3 formattings (threw, threw, resolved)
    two nominations, lock off: 2 lines, 4 formattings
    two nominations, lock on:  4 lines, 6 formattings
    order under the lock: entity-layout effect → store init → FORMATTING 1 threw → LINE 1 [0 cards in the document] → store answers-lock effect writes → FORMATTING 2 threw → LINE 2 [1 card in the document] → root-layout effect → FORMATTING 3 resolved
    every case: 1 page init; 0 cards after mount(); one card for each nomination after the flush, titled with the election's name, the constituency's name in its field, state "confirmed"; the card seen at LINE 2 is the node that is there after the flush.
  implication: the doubling is reproduced deterministically without a browser or a database, by the lock alone, and it is one more formatting for each card, in place.

- timestamp: 2026-10-09T00:23Z
  checked: the stacks of the two lines under the lock
  found: LINE 1 — `flush_queued_effects (batch.js:1163)` → the `{#each}` block's update → `create_item` → the item's template reads the `{@const}` derived → `parseNomination (+page.svelte:203)`. LINE 2 — `flush_queued_effects (batch.js:1163)` → `if.js:63` updating `InputGroup.svelte:54` (`{#if title}`) → the page's `title` getter → the same `{@const}` derived (`+page.svelte:426:89`) → `parseNomination`. `batch.js:1163` is the `update_effect(e)` of the eager block-effect loop. Both are inside one `flushSync → Batch.flush`.
  implication: both lines come from block effects updated eagerly between user effects, in one synchronous flush; the second is an update of the existing card.

- timestamp: 2026-10-09T00:24Z
  checked: throwaway V1 in the store's lock effect — `if (draft && Object.keys(draft.answers.current).length > 0) draft.answers.set({}); if (Object.keys(this.#staged).length > 0) this.#staged = {};` — the same test
  found: lock on, one nomination: 1 line, 2 formattings; two nominations: 2 lines, 4 formattings; the lock effect's write no longer in the recorded order. The lock-off cases unchanged. After `git checkout --` of the store: 2 and 4 lines again.
  implication: the second line is caused by the lock effect's writes and by nothing else the lock turns on.

- timestamp: 2026-10-09T00:26Z
  checked: the data root given its elections before the page is created (the stand-in root provides at init, the analogue of a page entered by a client navigation), unmodified code
  found: lock off: 0 lines, 1 formatting (resolved). Lock on: 0 lines, 2 formattings (resolved, resolved).
  implication: the lock effect's replacement of `userData.current` happens whenever it runs for a newly loaded entity; it is logged only while the election is missing. Two conditions, both needed for the second line.

- timestamp: 2026-10-09T00:27Z
  checked: throwaway V2 (only the draft write guarded) and V3 (only the staged write guarded), each reverted
  found: both still log 2 lines for one nomination and 4 for two under the lock.
  implication: either write alone replaces `userData.current`; a fix guards both.

- timestamp: 2026-10-09T00:30Z
  checked: every reader of `userData.current` in `apps/frontend/src` (`git grep`), and plans `176-06`, `176-11`, `176-12`
  found: readers in block position — the profile's `{#each nominations}` (unkeyed, updated in place), two `{@const answer = userData.current?.entity.answers?.[question.id]}` inside each blocks keyed by question id, the question page's `{@const answer}`, and two `{#if userData.current}` on the registration pages (truthiness unchanged). None is keyed on an object of `userData.current`, and no `{#key}` reads it. The context's `savedEntityData`, the unanswered lists and `profileComplete` derive from `#savedData`, which the lock effect does not write. The planned view reads `contestantCtx.nominations`, a `$derived` over `page.data.contestantUserData?.nominations` (plan 176-06, step 4), and nothing from the data root; `NotEditableNote` is rendered under `contestantCtx.answersLocked`, a boolean of the app settings.
  implication: the replacement remounts nothing anywhere and reaches neither the planned view nor the note.

## Resolution

root_cause: |
  Two conditions, both needed for the second line.
  1. (the cause of the first line, as `176-D9-FINDING.md` has it) On a full load the profile's `{#each}` formats each nomination before the root layout's effect has given the data root its elections: effects run descendant-first, the entity layout's effect fills the user-data store, and Svelte updates the block before the next effect runs.
  2. (new) The user-data store's answers-lock effect (`contestantUserDataState.svelte.ts`, the `$effect` in the constructor) writes `draft.answers.set({})` and `#staged = {}` on every run while answers are locked, whether or not the draft or the staged properties hold anything. Its first run for a loaded entity falls after the entity layout's effect and before the root layout's. Each write puts a new object into a signal `#current` reads; `#current` is a JSON clone; so `userData.current`, its nominations array and every nomination object are replaced by equal copies. The page's unkeyed `{#each}` sets its item signals and the `{@const … = parseNomination(nomination)}` derived recomputes — still without an election — and logs again.
  The second line is therefore the first line's cause reached a second time, by a small defect of its own in the store. It is one more formatting of each card in place: no second block, no second page, no remount.
fix: not applied (goal: find_root_cause_only). Direction for a todo — make the lock effect write only when there is something to clear (both writes; either alone keeps the doubling), with a store-level test that `current` keeps its identity after `init` while answers are locked and nothing is staged or drafted. Deleting the profile's block (plan 176-13) removes the log line and leaves the replacement.
verification: |
  Component test of the real components on head `35f8df68a`: nine vitest runs in all, every one exit 0 (the test asserts the number of cards; the counts below are its recorded readings).
  - unmodified (five runs, the last with all six cases): 1 / 2 lines (lock off / on, one nomination), 2 / 4 (two nominations), 0 / 0 with the elections first.
  - V1, both writes guarded (two runs): 1 / 1, 2 / 2, 0 / 0 — the doubling is gone.
  - reverted (one of the five unmodified runs, made after V1): 1 / 2, 2 / 4 — it is back.
  - V2 and V3, one write guarded each (one run each): 1 / 2, 2 / 4 — still doubled.
  Not verified: the same in a browser. No E2E run was made in this session; the browser evidence is plan 176-01's run and Phase 175's closing run, which the mechanism accounts for in count (two for one nomination), spacing (2 to 3 ms, one flush), election id (one) and card (one, resolved).
files_changed: []

## What the reading says for Phase 176

- **The user sees nothing wrong beyond the console.** Measured in the component test: one card for each nomination in both lock states, the same DOM node from its creation, resolved to the election's and the constituency's names and "confirmed". The unresolved state and both lines are inside one synchronous flush that ends with the resolved card, so no frame shows a card without its names (inferred for the browser from the 2 to 3 ms spacing and from the one flush seen in the test's stacks; not measured there). No doubled card, no wrong name, no doubled network read; read in the code and not measured: one more `localStorage` write of an empty draft for each entity load under the lock.
- **The planned nominations view (plan 176-12) inherits neither condition.** It formats nothing against the data root, so condition 1 cannot reach it; its list is `contestantCtx.nominations`, derived from page data and not from `userData.current`, so condition 2 does not reach it either. It is in the server-rendered markup, and nothing in the mechanism remounts or re-creates a subtree, so a page with no loading state has nothing to lose. One thing to hold to when plan 176-06 is built: "the store holds the entity the URL names" should be read from `userData.savedEntityData`, as the context's other derivations are, and not from `userData.current` — a read of `current` would make the task state recompute once more under the lock, to the same value.
- **`NotEditableNote` (plan 176-11) is not reached.** It is rendered under `contestantCtx.answersLocked`, and its second sentence under the unanswered lists, all of which derive from the app settings and from `#savedData`.
- **A defect outside the block survives its deletion**, a small one: while answers are locked, every load of an entity replaces `userData.current` by an equal copy once, so every block and prop that reads it is updated once more (the profile's answers and image, the question page's answer). Nothing is remounted and nothing is lost — every field is locked in that state — but it is wasted work and it is what turned one log line into two. It deserves a todo of its own, not a place in Phase 176.
- **The fourth point, worded so that it is true:** "The answers-locked dataset's profile, held open past hydration, logs the line: one line for each formatting of a nomination's card that happens before the data root holds its election. With the answers lock off a card is formatted once in that window, and with it on twice — two lines for the profile's one nomination — because the user-data store's answers-lock effect runs between the entity layout's effect and the root layout's and replaces `userData.current` by an equal copy. The card resolves afterwards."

## Evidence kept on this host (gitignored)

`tests/e2e-runs/176-unit/176-d9-second-line/`: the three scratch files (`d9Scratch.svelte.test.ts`, `D9ScratchRoot.svelte`, `D9ScratchContestant.svelte`), the readings of the four runs (`readings-unmodified.txt`, `readings-V1-both-writes-guarded.txt`, `readings-V2-only-the-draft-write-guarded.txt`, `readings-V3-only-the-staged-write-guarded.txt`), the V1 change as a diff, and `head`. To run it again: copy the three scratch files beside the profile page (`apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile/`), then `cd apps/frontend && D9_OUT=<a file> yarn vitest run "<the test's path>"`; remove the three files afterwards. The test asserts only the number of cards and writes its readings to `D9_OUT`; it is not a regression test and was not committed.

## Found on the way, out of scope

- `#current` returns a new JSON clone on every recomputation, so any staged edit or drafted answer replaces every object under `userData.current`, the nominations included: with the lock off, each committed edit of a profile field formats every nomination again. Silent once the elections are there, and gone for the nominations when the block is deleted; the store's shape stays.
- The `{#each nominations as nomination}` of the profile is unkeyed. It does not matter here (the items are updated in place either way), and the block is being deleted.
