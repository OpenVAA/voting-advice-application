# Phase 176: Contestant Home, Task State & Nominations View - Research

**Researched:** 2026-10-08
**Domain:** SvelteKit 2 / Svelte 5 contestant app (one context, one store, server loads and a route-group gate), one Supabase RPC with pgTAP, and the Playwright E2E harness
**Confidence:** HIGH for what today's tree holds and for the load-rerun behaviour measured below; MEDIUM for everything that rests on Phase 175's plans, which are not executed and were being revised while this research ran
**Tree read at:** `d8fb3af7a` (2026-10-08). Outside `.planning/`, application source equals `c030a0d4f`, the tree Phase 175's research read (measured: `git diff --stat c030a0d4f HEAD -- apps packages tests scripts` is empty). The context's own read point is `f79393703`; 121 files under `apps`, `packages`, `tests` and `scripts` have changed since (measured: `git diff --stat f79393703 HEAD`), all of Phase 174's plans 03–10, Phase 174.1 and the quick tasks G2, G4 and G6.

**How claims are labelled.** *Measured* names how (a read-only query against the local database inside `BEGIN READ ONLY … ROLLBACK`; a run of a scratch SvelteKit app; a count by script over a kept run directory). *Read* means the file was opened in this session and the value is quoted. *Inferred* means it follows from what was read and was not run. *175-plan* means the fact is not on today's tree: it was read in a Phase 175 PLAN at `d8fb3af7a` and must be re-read from 175's SUMMARYs. Code is cited by path and a content anchor (a symbol or a quoted line), never a line number, at the orchestrator's instruction; every discrete value used below is quoted beside its claim. Frontend paths are relative to `apps/frontend/src/` unless they start with `apps/`; `schema/` and `tests/database/` are relative to `apps/supabase/supabase/`; `ENTITY/` abbreviates `routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/`.

**What was run.** Read-only `psql` against `127.0.0.1:54322`. A scratch SvelteKit app outside the repository (in the session's scratchpad), served on port 5391 by the repository's installed `vite` 8.3.1, `@sveltejs/kit` 2.70.3 and `svelte` 5.57.1, driven by the installed Playwright 1.63.0 Chromium; it touches no database and none of the application's files. **One side effect, undone:** the scratch app resolved packages through a symlink to the repository's `node_modules`, so Vite wrote `node_modules/.vite/deps`, `deps_ssr` and `_svelte_metadata.json` at the repository root (birth time 13:58:48, the probe's start; the directory's older `vitest` entry was untouched). The three were removed; `git status` shows nothing of it.

**What was not run, and why.** Phase 175 is executing in this checkout: no `yarn db:reset`, no seed or teardown, no `yarn dev`, no E2E, no workspace-wide gate, no write to the database, no file written to the tree but this one. The E2E project's rows of the last full run are gone from the database (measured: one election, `seed_election_default`), so nothing about the suite's datasets could be measured in the database; it is read from the templates.

**Phase 175's plans moved while this was written.** At `d8fb3af7a` there are twelve plans in ten waves. In the working tree, uncommitted, plans 01–10 and 12 are modified, 11 is deleted, 13 is added and the plans say "of 13" in eleven waves. The diff of the two plans this research leans on (the context plan and the questions plan) is renumbering and verify-command wording; the facts taken from them are unchanged as of this writing. Plan numbers below are those of `d8fb3af7a`.

<user_constraints>
## User Constraints (from CONTEXT.md)

`176-CONTEXT.md` stays the authority: each decision there carries reconciliation notes, planner constraints and an *If wrong* line that this section does not repeat. What follows is each decision's own locked sentence, verbatim.

### Locked Decisions

- **D-01 (176-0.1):** Accept all 19 facts of 176-0 as the baseline; restated under `<factual_baseline>` **with the corrections Phases 170, 172 and 173 made to facts 1, 4, 5, 7, 8, 10, 11, 12, 13, 15, 18 and 19, and the re-reading the lock's move gives fact 14**.
- **D-02 (176-A1):** **One derived state: an ordered `tasks` list — each entry `{ id, status: 'complete' | 'incomplete' | 'blocked', route, count? }` — plus a `nextStep` naming the task and the route to go to.**
- **D-03 (176-A2):** **Three tasks for both entity types — nomination, profile, opinion questions — in that order. Preview is a destination shown on home, never a task with a status. A task with nothing in it (an entity with no opinion questions) is omitted.** **The order is the canonical order of `nextStep` — basic info before the opinion questions — and it is an order of suggestion, not of access.** **What the preview needs (OD08-D2: "gate preview on both filled"):** a nomination, no unanswered required info question and no unanswered opinion question.
- **D-04 (176-A3):** **"Define nomination" is complete when the entity has at least one nomination, confirmed or not.**
- **D-05 (176-A4):** **Two accessors on the contestant context, `tasks` and `nextStep`, computed by a pure helper module that replaces `contestantHome.helpers.ts` and keeps a colocated unit test.**
- **D-06 (176-A5):** **`nextStep` is the first incomplete task. When that task is the questions, its route is the first unanswered question, keeping today's resume-at-first-unanswered behaviour. When the task just saved is still incomplete, or when everything is complete, Continue goes home; on home, with everything complete, the primary action is Preview.** **"Every Continue" is those four sites plus J's own** (OD08-D3 (a)). J's own button with no nomination leads to the entity's home and **is labelled Return (`common.return`), not Continue, because the user cannot add a nomination** (OD08-D4 (a) + NOTE).
- **D-07 (176-A6 ★, superseded by OD08-D2 — the operator's EDIT):** **The opinion questions are no longer gated on basic info: they do not depend on it. The profile and the questions both depend on a nomination, and on nothing else. The canonical order of the next step stays basic info first. The preview is gated on both being filled.** The operator's words: *"No longer gate opinion questions on basic info as they don't depend on it. Both do, however, depend on nominations. Still keep the canonical order for next step at basic info first, and gate preview on both filled."*
- **D-08 (176-B1):** **J is its own page inside the protected group, at `…/nominations`, with a route constant beside the profile's.**
- **D-09 (176-B2):** **One entity-scoped RPC returns the selected entity's own nominations with `confirmed`, `custom_data` and the parent's entity type and name resolved server-side; J renders from that raw data without feeding the data root.** **This RPC becomes the app's one nominations read** (OD08-D1 (a)). **The `Error formatting nomination` log line is diagnosed before the code that logs it is deleted** (OD08-D9 (a)).
- **D-10 (176-B3):** **Each card shows its state, "Pending confirmation" or "Confirmed", with one line explaining that a pending nomination is not yet visible to voters.**
- **D-11 (176-B4):** **J renders no Edit action in this phase. With nominations it shows the cards; with none it shows an empty state saying no nomination is defined yet, with the support link. Phase 177 adds Edit and the unlocked branch.**
- **D-12 (176-C1):** **A "not editable" note in the contestant component library (`lib/contestant/components/`) that takes a reason and embeds the support block. It replaces the four inline answers-locked warnings and is used on J.** **The note is not used on that section** [the profile's immutable section] (OD08-D6 (a)).
- **D-13 (176-D1):** **A route group inside the protected group holds the three pages — profile, questions, preview — and its server load redirects (307) when the task state's inputs say the page is closed: no nomination, for all three; and, for the preview alone, a required info question or an opinion question still unanswered (D-03, D-07). The questions are not closed on missing required info. The predicate is the same pure helper the context uses.**
- **D-14 (176-D2):** **A blocked URL sends the user to the entity's home.**
- **D-15 (176-D3):** **The blocked entries are shown, disabled, on home and in the navigation menu.**
- **D-16 (176-E1):** **When the entity has no nomination the entity-level load skips the question read and returns empty question data; the context then has no questions, and the task state marks the profile and the questions `blocked` on "no nomination", not on "no questions".**
- **D-17 (176-F1):** **An entity with no nomination while nominations are locked: the task stays incomplete, leads to J, and J shows the "not editable" note with the support link. The other pages stay closed.** **The note on J follows `nominationsLocked` alone in this phase** (OD08-D5 (a)).
- **D-18 (176-G1):** **A new perm-style template with its own dataset: a candidate user and an organization user with no nomination. The spec asserts home (first task incomplete, the rest blocked), J's empty state, the three URLs redirecting, then inserts a nomination through the admin client and asserts that the pages open and the task is complete.**
- **D-19 (176-G2; widened by OD08-D8 (a)):** **Four axe entries are added, each in both themes: J with nominations (lock off), J's empty state (no nomination, lock off), J in its "not editable" state (no nomination, lock on), and home in the no-nomination state. The existing home and profile entries stay.** **the spec flips the lock through the admin client between them**.
- **D-20 (176-G3):** **The savedAnswers-empty logout-modal todo is folded in narrowly: the logout button's "anything left?" test reads the task state; the todo is closed when the journey spec's final-logout step passes in the closing gate's three isolated runs. No separate investigation.**
- **D-21 (176-H1):** **Five plans in three waves.** The planner may split a plan that grows past one verifiable unit, but keeps the wave order and one migration regeneration.
- **D-22 (176-H2):** **Closing gate: unit, type, lint and production build; pgTAP and `yarn db:lint:sql`; one full E2E run through `tests/scripts/e2e-run.sh`; the new no-nomination spec and the candidate journey spec three times each in isolation.**

All eleven judgement calls (J1–J11) are ruled (OD08-B1, C5, D1–D11) and none is open. Two parts of what the context builds on them are marked there as the orchestrator's inference and not the operator's words: that "both filled" means no unanswered required info question and no unanswered opinion question, and that the remaining gates are server redirects.

### Claude's Discretion

- The helper module's name and location, the exact types of a task and of `nextStep`, and whether the home's copy is produced by the helper or by the page (D-05).
- The route group's name; the route key for J (expected `ContestantAppNominations`); new test ids following `tests/tests/utils/testIds.ts`. Existing ids keep their meaning: `contestant-home-profile`, `contestant-home-questions`, `contestant-home-preview`, `contestant-home-continue`, `contestant-home-status`, `contestant-nav-*`. `contestant-profile-nominations` is retired with the block.
- The RPC's name, whether it returns `jsonb` or a table, and its exact projection within D-09.
- The note component's name and props, within D-12; the wording of every new string and the message-key names; whether a card on J is built from `InputGroup` and locked `Input`s (as the profile block is) or from something else — the UI spec's.
- How a disabled task says why it is disabled (D-15).
- Whether `profileComplete` stays an accessor beside the task state (it drives the success message and the hero emoji today) or is derived from it.
- Removing the widened `page.params` annotation while in the context, if Phase 175 has not.

### Deferred Ideas (OUT OF SCOPE)

- J's Edit action, the unlocked branch, the editor K, and the questions following a changed nomination — Phase 177.
- A fourth task for the preview, completing on first visit — 176-A2 (b), not chosen.
- A general step machine — 176-A1 (c), not chosen.
- Loading the full nomination graph into the data root for J — 176-B2 (b), not chosen.
- Hiding blocked entries until they are reachable — 176-D3 (b), not chosen.
- Lifting the NOM-07 gate while nominations are locked — 176-F1 (b), not chosen.
- A generic note in the base component library — 176-C1 (c), not chosen.
- An Admin-app screen to confirm a nomination or to set the lock — out of scope for v2.16.
- The pending-address reminder on home — Phase 179.
- An entity-name cue on the answering pages — not built; the todo stays open (OD08-D10 (a)).
- A server or client gate that holds the opinion questions behind the profile's required info — 176-A6 ★ and both options of OD08-D2, superseded by the operator's EDIT.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NOM-01 | The home screen lists every task for the selected entity, starting with "Define nomination", which is incomplete while the entity has no nomination. An entity without nominations no longer causes an error (I). | One sign-out site makes "no nomination" an error today (read). Removing it needs three things together: the question read skipped (the provider throws on an empty filter), the context's rollup writing empty lists when no election is selected (P-3), and `profileComplete` no longer read as "done" for an entity with nothing loaded (P-4). |
| NOM-02 | The user can view the entity's nominations in a dedicated view, moved out of the profile. When they cannot be edited — nominations are locked — a reusable note directs the user to support (J). | RQ-2 measured: a child reads its parent on the public disjunct alone, so the parent's name needs definer rights. The RPC's shape, its gate and its pgTAP grid are under *The nominations RPC*. `ctx.nominationsLocked` is *175-plan*. |
| NOM-07 | The profile, questions and preview are reachable only once the entity has a nomination (L). | RQ-1 measured: a server-side gate is correct for all three pages, the preview included, on a navigation that follows a browser-side save — provided the preview's own rule sits in the preview's own server load. |
| TASK-01 | One derived state in the contestant context holds the entity's incomplete tasks and the next step, and every Continue button routes through it. | The five sites and what each does today are read (*The task state*). Two places where D-06's wording and the tree disagree (T-4, T-5) and one question the operator's EDIT opens (OQ-1) must be settled before the helper's table is written. |
| E2E-03 (closing criterion) | The full E2E suite is green at the close of every phase. | *Validation Architecture*: where each of the four axe states can live, the journey steps that change (five, not three), the dataset and the gate rows. |
</phase_requirements>

## Summary

**RQ-1 is answered yes, by measurement.** A server load under the entity can know the truth at the moment of a navigation that follows a browser-side save, without any invalidation, because of how SvelteKit answers a data request: a child server load's `await parent()` runs the parent server loads again on the server, in that request, whatever the client asked for. In the scratch app a save through a plain `fetch` followed at once by `goto('/e/preview')` produced one data request for the leaf alone (`x-sveltekit-invalidated=0001`), and on the server the entity-level load ran again and the preview's load saw the saved value. Two conditions make the gate correct. The preview's rule must sit in the preview's own `+page.server.ts`, not in the group's layout load: a layout load that reads only `parent` and two params does not run again on a navigation between two pages of the group (measured: zero server loads), so it would never evaluate "is the preview open" for a user arriving from the profile or a question. And the server must compute "unanswered" itself, from the parent's `questionData` and the entity's answers — the entity-level load does not carry elections or constituencies, so the choice is a server-side data root with two more reads, or a pure function over the raw rows with a parity test. Nothing here needs to go back to the operator as "cannot be done".

**Three things do need a ruling before the helper's table is written**, and none of them is about feasibility. (1) The operator's EDIT lets a user answer questions while basic info is missing; "every Continue leads to the next incomplete task, basic info first" then sends "Save and continue" on a question page to the profile after every answer, unless the questions flow is allowed to continue itself (OQ-1). (2) D-06 says the questions task's route is the first unanswered question and that this "reproduces what each Continue site does today"; today the home's main action and the profile's save go to the questions *list*, and the journey spec's steps 14 and 15 assert it (T-4). (3) D-06 says the journey spec "needs no behavioural change"; it asserts `disabled: ['opinions', 'preview']` in three steps, which the EDIT makes false (T-5).

**The tree disagrees with the context in twelve places** (T-1 to T-12). The ones that change a plan: the stored nominations type is the *voter-side* `DPDataType['nominations']`, which must not change — the contestant type stops pointing at it (T-1); three of the four axe states cannot be scanned in `contestant-a11y-scan`, which runs before any setting is flipped (T-2); the data root never forgets question data, so "the context then has no questions" is false for a user who switches from a nominated entity to one without (T-6); the questions layout holds a render condition beside the redirect, and deleting the redirect alone leaves the page on its loading view forever (T-7); and `profileComplete` is vacuously true for an entity with no questions loaded, so today's "ready" title, emoji and success message would greet the user with no nomination (P-4).

**D9.** The three log lines are the three full-page entries to the profile page in a default run — the axe scan's `cand-profile` in each theme, and the localisation spec's `page.goto('/en/contestant/profile')` — measured in two runs. The data is sound: each line names the one election of that candidate's one nomination, and the card resolves a moment later. The cause is the order of effects at hydration, not the data: the entity layout's effect fills the store before the root layout's effect gives the data root its elections, and Svelte updates the `{#each}` block in between. That mechanism was reproduced on the installed Svelte in a model of the three components, one line per cold entry and none on a client-side entry. **Status: identity and page confirmed; mechanism UNCONFIRMED in the application itself**, with one observation not explained by measurement (RQ-4). It matters for J either way: J must not resolve a name through a lookup that throws on first render.

**Primary recommendation:** keep the context's wave order but run the phase serially like 175 does, with the schema plan and the pure-helper plan as the only pair that may overlap; put the preview's rule in a leaf server load; return the election and constituency names from the RPC so that J needs no data root; settle OQ-1, T-4 and T-5 with the orchestrator before the task-state plan starts; and write the UI spec, which does not exist yet, before any screen plan.

## Disagreements between the context and the tree

Each row is a statement in `176-CONTEXT.md`, or in the orchestrator's brief, that the tree read today does not bear out, or bears out only in part.

| # | The source says | The tree says | Consequence for the plan |
|---|---|---|---|
| **T-1** | D-09: "The type of the stored nominations (`DPDataType['nominations']`, `ContestantUserData<TNominations>`) changes everywhere it is used." | **Read:** `lib/api/base/dataTypes.ts` — `nominations: { nominations: Array<AnyNominationVariantPublicData>; entities: Array<AnyEntityVariantData>; }` is the data **provider's** collection type, returned by `_getNominationData` in two adapters and consumed by `routes/(voters)/(located)/+layout.svelte`, `routes/(voters)/nominations/+layout.svelte` and `lib/admin/utils/loadElectionData.ts`. `lib/api/base/dataWriter.type.ts` only *refers* to it: `nominations: TNominations extends true ? DPDataType['nominations'] : undefined;`. | `DPDataType['nominations']` is not touched. `ContestantUserData<true>['nominations']` gets a type of its own (a flat list of the richer rows) and the reference is cut. The contestant-side consumers are listed under *The nominations RPC*. |
| **T-2** | D-19: "the spec is `tests/tests/specs/a11y/contestant-a11y.spec.ts` … the phase verdict's `--except contestant-a11y-scan=<n>` holds the scan count … and moves with the new entries." | **Read:** `scripts/assert-a11y-scan-wiring.mjs`, Check 3 — "`contestant-a11y-scan` is named in `data-setup-perm-1e1cg1co`'s `dependencies` array, so the candidate scan runs BEFORE the perm family's `app_settings` singleton REPLACE." That project runs on `e2e/base` under stored sessions its scans only read. The scan's own candidate has a nomination (read: `test-e2e-base-ca-aa-1` holds `test-e2e-base-nom-reg-n-ca-aa-1`); that no base identity lacks one is the context's fact 17, taken from planning documents and not re-derived. Flipping a project-wide setting there is what Check 3 exists to prevent. | Three of the four states — J's empty state, J's "not editable" state, home with no nomination — can only be scanned in the new spec's own project in the perm chain. J with nominations can live in either. See *Where the axe scans live*. Phase 175's research found the same for its own scans. |
| **T-3** | D-19, D-18, *Established patterns*: "A stored settings root replaces the shipped root whole"; the spec flips the lock "restating the whole `access` root each time". | **Read:** `lib/utils/settings.ts` — "Merge settings over other settings, member by member at every depth."; `packages/dev-seed/src/supabaseAdminClient.ts` `updateAppSettings` — "Uses the merge_jsonb_column RPC for recursive deep merge. Callers only need to send the settings they want to change." (Phase 175's research, T-1, found the same.) | The spec flips the lock with `updateAppSettings({ access: { nominationsLocked: true } })` and nothing else. Lists are still replaced whole, so the template states the complete `contestantApp.entityTypes` list. |
| **T-4** | D-06: "When that task is the questions, its route is the first unanswered question … It reproduces what each Continue site does today from one rule, so the candidate journey spec needs no behavioural change." | **Read:** two of the four sites go to the questions **list** today. `ENTITY/contestantHome.helpers.ts`: `href: resolveRoute('ContestantAppQuestions')`. `ENTITY/profile/+page.svelte` `submitRouting`: `submitRoute: getRoute.current('ContestantAppQuestions')`. Only the list's two buttons and the question page's save go to a question. `contestant-journey.spec.ts` step '14. profile: revisit + fill required + submit → questions overview' is followed by step 15's `expectIntroMessage()` and `clickStart()`, which need the list. | One route for "the questions task" cannot reproduce both. Either the state carries two targets for that task — its page (the list) and the first unanswered question — and each site takes the one it takes today, or home and the profile's save start skipping the questions' intro page, which is a behavioural change and breaks step 15. Recommended: the first. To settle with the orchestrator (OQ-2). |
| **T-5** | D-06: "the candidate journey spec needs no behavioural change"; D-18: the journey "asserts 'three tasks' in steps 6 and 11 and the nominations block on the profile in step 12 … those steps move to the new list and to J." | **Read:** the spec asserts the old gate three times — `expectTasks({ enabled: ['profile'], disabled: ['opinions', 'preview'] })` in step 6, in step 11, and at the end of step 13 under the comment "Post-submit lands on home (opinions still disabled because the required field is empty)". Its logged-in menu check (step '19.5. candidate nav-menu logged-in item set (differs from logged-out)') asserts `contestant-nav-home`, `-profile`, `-questions`, `-preview` and `-settings` one by one, each with its `href`. | Steps 6, 11 **and 13** change to `enabled: ['profile', 'opinions'], disabled: ['preview']`; step 12's nomination assertion moves to J; step 19.5 gains the nominations item. Five steps, in the plan that changes the surfaces. |
| **T-6** | D-16: "the entity-level load skips the question read and returns empty question data; the context then has no questions". | **Read:** `packages/data/src/root/dataRoot.ts` `provideData` begins `if (!data.length) return [];` and otherwise does `collObject.set(obj.id, obj)` — it adds, it never clears. And `packages/data/src/utils/filter.ts` `match` returns `true` for an empty **filter** whatever the target. So for a user who edits two entities, opens the nominated one and then the one without a nomination, the root still holds the first entity's categories and questions, and every question with no election filter applies to "no elections". | The skipped read does not empty the lists. The context's rollup effect must write empty lists when no election is selected (after 175 it already distinguishes that case to set `questionsReady`), and the task helper must not read question counts when there is no nomination. One unit case holds it. See P-3. |
| **T-7** | D-07: "*From the tree — what is removed:* `ENTITY/questions/+layout.svelte` holds the client redirect (`$effect(() => { if (ctx.unansweredRequiredInfoQuestions.length) goto(…'ContestantAppProfile') })`)". | **Read:** the same file also gates what it renders: `{#if ctx.unansweredRequiredInfoQuestions.length === 0 && ctx.opinionQuestions.length > 0}` … `{@render children?.()}`. *175-plan:* after Phase 175 the layout "renders the children once no required info is unanswered and `Loading` until then". | The render condition goes with the redirect. Deleting the effect alone leaves a user with missing required info on the loading view at every questions URL, with no error. The layout's component test that 175 writes ("required info unanswered: the loading view, and the redirect to the profile is requested") is rewritten, not extended. |
| **T-8** | D-09: "The gate is the caller's own authority over the entity named, asked through the matrix and not re-derived; an entity the caller does not edit returns nothing". | **Measured** (read-only, an organization editor's claim): `user_can ('entity', <child candidate>, 'nomination.read', 'candidate')` is `t`, through `user_can`'s "NAMED BRANCH 2, the child-nominee branch". *Read, not measured:* a holder of `nomination.read` at project scope passes too, through the project-scope branch. | The two sentences cannot both hold with the precedent's gate. `private.caller_entity_ids` — the gate of `get_entity_user_data` — satisfies the second; `user_can` satisfies the first. See *The nominations RPC* for the recommendation and what each costs. |
| **T-9** | D-12: `data-testid="contestant-answers-locked-warning"` "is read by `tests/tests/specs/perm/perm-answers-locked.spec.ts`, `contestant-a11y.spec.ts` and `tests/tests/utils/testIds.ts`". And D-19: "The existing home and profile entries stay." | **Read:** `contestant-a11y.spec.ts` names that id only in its table of unscanned surfaces. What it *does* read from the profile is the block this phase removes: the `cand-profile` entry has `postLoginTestId: testIds.contestant.profile.nominations`, under the comment "Marker: the immutable-nominations section". | The `cand-profile` entry stays but its reach marker changes in the plan that removes the block, or 2 of the project's scans fail on reach. |
| **T-10** | D-13's planner constraint: the gate's "inputs … [are] its parent's data"; RQ-1 asks "whether they can be computed from the entity-level load's `contestantUserData` and `questionData` without a data root". | **Read:** applicability needs only ids — `QuestionAndCategoryBase.appliesTo` calls `match` on `this.data.electionIds`, `electionRounds`, `entityType` and `constituencyIds` against the targets' ids. But `rollUpQuestionCategories` takes `elections: Array<Election>` and `constituencies: Array<Constituency>`, objects of a data root, and the entity-level load returns neither election nor constituency data (the root **universal** load does, and a data request runs no universal load on the server). | The server either builds a data root (two more reads on each navigation to the preview) or computes from the raw rows with a pure function and a parity test. See RQ-1 (b). |
| **T-11** | The orchestrator's brief: "The todo `…174.1-nominations-page-overflows-by-5px-at-320.md` concerns a surface this phase rebuilds." | **Read:** the todo's `files:` are `apps/frontend/src/routes/(voters)/nominations/+page.svelte` and `lib/dynamic-components/entityCard/EntityCard.svelte`; its page is the **voter** app's `/nominations`. | This phase does not rebuild that surface. What carries over is the lesson: a new page is checked at 320px by `scrollWidth` against `clientWidth` (an axe scan does not see a horizontal overflow), and a card built on `EntityCard`'s `minmax(8rem, 1fr)` grid, or on a DaisyUI `.label`, inherits a known overflow. |
| **T-12** | The context's header: Phase 174.1 "closes after one browser check"; `<expected_tree>`: "174, executing … 174.1, planned". | **Read:** `STATE.md` — "Phase 174.1 is complete (2026-10-08)"; both are on the tree. Phase 175 is **planned** (twelve plans at `d8fb3af7a`), not "captured as context and not planned". | The "as planned" facts of 175 can be read from PLAN files now, and from SUMMARYs once it runs. |

Smaller corrections, none changing a plan's shape:

- **The todo for D9 says "Not established: … whether it predates Phase 173".** *Measured:* the line is logged three times in `tests/e2e-runs/169-e2e/169-05-group3/devserver.log` and in every later full run sampled (169, 170, 171, 172, 174, the quick-task close). It predates Phase 170.
- **Fact 8** says the symbol's label is `common.electionSymbol.candidate` "for both types". True of the page; *read:* the catalogue already holds `common.electionSymbol.alliance`, `.candidate`, `.faction` and `.organization`.
- **`contestantApp.basicInfo.requiredInfo`** — "You must fill in the fields marked with this icon before you can answer other questions. …" — states the gate the EDIT withdrew. The context does not list it; Phase 175's UI spec leaves it "for Phase 176, which rewrites it" (*175-plan*). Seven locales.
- **D-15** says `ContestantNav` disables the questions entry and "home disables Preview on the same test". *Read:* the menu's preview item carries no `disabled` today, so the menu's preview entry *gains* a disabled state in this phase.
- **Fact 4**'s "three hard-coded buttons" still holds on today's tree; *175-plan:* after 175 the questions button is left out for a known zero, the explanation and the greeting come from the per-type descriptor, and `computeNextAction` "receives the explanation's key from its caller".

## The context's research questions, answered

### RQ-1 — what can a server load know at the moment of a navigation that follows a save?

**Everything the database holds at that moment, without any invalidation — if the load asks through `await parent()`. A server-side preview gate can be made correct. Measured.**

**(a) Freshness.** *Read, in the installed `@sveltejs/kit` 2.70.3:* `src/runtime/server/data/index.js` `render_data` builds one memoised function per node and hands each load a `parent` that runs `await functions[j]()` for every `j < i`; the response then answers `{ type: 'skip' }` for every node the client did not ask for (`if (!invalidated[i]) return … 'skip'`). So the parents *run* on the server and their fresh result reaches the child; it is only not sent back to the browser. *Read:* `src/runtime/client/client.js` marks a server node for rerun when `previous?.loader !== loader[1]` or `has_changed(…)`, and `has_changed` consults `uses.parent`, `uses.route`, `uses.url`, `uses.search_params`, `uses.params` and `uses.dependencies` and nothing else.

*Measured,* in a scratch app with the application's shape — an entity-level `+layout.server.js` that reads a JSON file standing in for the database, a group `(gated)/+layout.server.js` that awaits its parent and redirects with 307 on "no nomination", a `preview/+page.server.js` that awaits its parent and redirects on "not filled", and a `+server.js` endpoint standing in for the browser's direct write:

| Step | Data request sent by the browser | Server loads that ran | Outcome |
|---|---|---|---|
| A. Full load of a page inside the group | none (SSR) | entity, group | page rendered |
| B. Client navigation between two pages of the group | **none** | **none** | page rendered; the group's count unchanged |
| C. Client navigation to the preview, not filled | `…/preview/__data.json?x-sveltekit-invalidated=0001` | entity, group, preview | preview's load saw `filled=false`; the browser landed on the entity's home |
| D. Client navigation from home into the group | `…/profile/__data.json?x-sveltekit-invalidated=0010` | entity, group | page rendered |
| **E. Save through `fetch`, then `goto('/e/preview')` at once** | `…/preview/__data.json?x-sveltekit-invalidated=0001` | save, **entity (saw the saved value)**, group, preview | **preview's load saw `filled=true`; the preview opened.** The browser's own copy of the entity-level data was still the old one (run count 3 against the server's 6) |
| F1. Nomination removed behind the user, then a navigation inside the group | none | none | not noticed |
| F2. Nomination removed, then home → profile | `…0010` | entity, group | response `{"type":"redirect","location":"/e"}`; the browser stayed on home |
| G. No nomination, each of the three URLs typed | — | — | `307` then `200 /e`, for all three |
| I. Nomination added behind the user, then home → profile | `…0010` | entity (saw it), group | the profile opened; the browser's copy of the entity data stayed old |
| J. Preview typed: not filled / filled | — | — | `307` then `200 /e` / `200 /e/preview` |

**What follows for the design.**

1. **The preview's rule goes in the preview's own `+page.server.ts`.** A leaf load is a new loader on every navigation to that page, so it always runs (C, E). The group's layout load does not run again inside the group (B), so a rule held there is never asked for a user arriving from the profile, the questions list or a question — which is where the user is when the last answer is saved. The group load keeps "no nomination", which only has to be asked on entry (D, F2, G).
2. **No load is invalidated and no `depends` key is added.** The entity-level load keeps its statement "It takes `fetch`, `locals`, `params` and `parent` from the request event and nothing else", and its tracking test is untouched. The alternative considered and not recommended — the group load reading `route.id` so that it reruns on every page change — works by the same mechanism, costs the whole parent chain on every navigation inside the group, and contradicts the loads' own "no `route`" statement.
3. **The cost** is the parent chain on each entry to the group and each navigation to the preview: *read* in the two loads, that is `getBasicUserData`, `getUserEntities` and `getAppSettings` in the user-level load, then `getEntityUserData` with its nominations and `getQuestionData` in the entity-level load. Not measured in milliseconds on this stack.
4. **The application preloads nothing on hover or tap** (*read:* `apps/frontend/src/app.html` has no `data-sveltekit-preload-data` attribute, and no source file sets one), so a result computed before a save is never reused after it.
5. **`await save()` resolves after the write.** *Read:* `contestantUserDataState.svelte.ts` `save` awaits `dataWriter.updateAnswers(…)`, the `upsert_answers` RPC, before it returns; both pages `goto(…)` only after `result?.type === 'success'`.

**(b) The inputs the predicate needs, and whether the server can compute them.** "Has a nomination" is the length of the parent's `contestantUserData.nominations` list. "Unanswered" needs, for the entity's elections, constituencies and type: the required, unlocked info questions and the opinion questions that apply, each tested with `isEmptyValue(answers?.[id]?.value)`. The parent supplies `questionData` (`{ categories, questions }`), the nominations and `entity.answers`; it does not supply elections or constituencies as objects (T-10). Two ways, both importable by a server load:

| | S1 — a data root on the server | S2 — a pure function over the raw rows |
|---|---|---|
| How | the leaf load reads election and constituency data as well, builds a `DataRoot`, and calls the same `rollUpQuestionCategories` and the same "unanswered" functions the context calls | applies `match` (exported by `@openvaa/data`) to each category's and question's `electionIds`, `constituencyIds`, `electionRounds` and `entityType` against the nomination ids and the entity type |
| Same rule as the browser | by construction | by a parity test: one table of fixtures run through both |
| Extra reads per navigation to the preview | two | none |
| Precedent | `routes/(voters)/(located)/+layout.ts` builds a `DataRoot` in a load that also runs on the server | the tree's pure helpers with structural parameter types |

Recommended: **S1**, with the two "unanswered" filters lifted out of the context's `$derived.by` bodies into a rune-free module both sides import. If the planner prefers S2, the parity test is a must-have, because `appliesTo` and `getApplicableQuestions` then exist twice.

**(c) What the gate does when it cannot decide.** *Read:* the entity-level load "returns `{ questionData, contestantUserData }`, where `questionData` is the error itself when the question read fails", and the entity layout then renders `<ErrorMessage>` in place of every page. A gate that finds no usable `questionData` returns without redirecting, so the error view is shown at the URL asked for. While a user-level gate is pending the parent data holds a non-null `gate`; both new loads return `{}` then, as the entity-level load and the resolver do.

**(d) What stays stale, and is not the problem RQ-1 names.** The browser keeps the entity-level data of the entity's last load (E, I). After the user's *own* save the store has merged the saved answers, so the home screen and the server agree. They can disagree only when someone else changed the data in between — an admin adds a required question, or removes the nomination — and then the user clicks an entry the home screen shows open and lands back on home with nothing said. That is today's condition for every other piece of entity data; Phase 177's write is the first that must invalidate the entity-level load (NOM-08). Recorded as a residual, not solved here.

**(e) Focus.** *Read:* the protected layout's effect acts when `data.gate ?? null` differs from the view last rendered and no navigation is in flight (`untrack(() => navigating.to) !== null` returns early). A redirect by either new load happens inside a navigation and leaves `data.gate` as it was — the user-level load's result is `skip`, so the layout's `data` is not even replaced — so the effect requests nothing and the navigation's own focus reset runs. The one new path is a user who accepts the terms of use at a blocked URL: `invalidateAll()` reruns the loads, the group load redirects, and the client navigates to home. That is the "redirect to an entity page" outcome Phase 174.1 read in a browser, with one more hop; it is *inferred* to behave the same and is worth one component or E2E case (A5).

### RQ-2 — what can a child candidate read of its parent today?

**Nothing on its own authority. Measured.** Inside `BEGIN READ ONLY`, as `authenticated` with a claim holding one grant `{"scope":"entity","role":"editor","target_type":"candidate","target_id":<C>}`, for a candidate of the default project nominated under an organization's nomination:

| Question | Answer |
|---|---|
| `user_can ('entity', C, 'nomination.read', 'candidate')` — its own | `t` |
| `user_can ('entity', O, 'nomination.read', 'organization')` — the parent | **`f`** |
| `user_can ('entity', O, 'entity.read_answers', 'organization')` | **`f`** |
| `user_can ('project', P, 'project.read_entities')` | **`f`** |
| `user_can ('project', P, 'project.read_structure')` | `t` |
| `get_entity_basic_data ('organization', O) IS NULL` | **`t`** |
| rows of the parent's nomination and of the parent organization visible through the tables | 1 and 1 |
| the public disjunct for the parent's nomination (`project_open_for_voters` and `confirmed`) | `t` |

So the two rows were readable for one reason only: the project is open and everything in it is confirmed. *Read:* `authenticated_select_nominations` has exactly three disjuncts, and the first and third are the two `f` rows above; `authenticated_select_organizations` has the same shape with `entity.read_answers`. **A parent that is unconfirmed, or any parent in a project not yet open for voters — the normal state while contestants fill in their data — is invisible to its child**, nomination row and entity row alike, and through `get_entity_basic_data` too, whose hop runs the other way (measured as the organization's editor: `user_can ('entity', C, 'nomination.read', 'candidate')` is `t`).

**Which hop needs definer rights:** only the parent's. The entity's own nomination rows are readable on its own authority (row 1). Not measured: the refused case itself on a closed project or an unconfirmed parent, because the local database holds no such rows today and nothing may be written; the new pgTAP file is where it is pinned.

### RQ-3 — does the database admit the nomination the spec inserts with the service role?

**Yes, for both types, as the schema stands. Read at `d8fb3af7a`.**

- `schema/011-validation-functions.sql` `validate_nomination`: the election and the constituency must belong to the nomination's project ("does not belong to the nomination's project"); with no parent, only a faction is refused ("Faction nominations must have a parent organization nomination"). It reads no `election_type`. A parentless candidate row and a parentless organization row both pass.
- `enforce_nomination_entity_columns` returns at once when `current_user <> 'authenticated'`, so the service role may set `election_symbol` and `external_id`.
- `enforce_nomination_confirmation`'s rule 2 binds `current_user = 'authenticated'` alone, so the service role may insert the row confirmed or not; rule 1 refuses `confirmed` together with `custom_data ? 'requestedParentOrganization'`.
- `nominations.confirmed` is `boolean NOT NULL DEFAULT false`. *Read in Phase 175's research, not re-read:* dev-seed's admin client stamps `confirmed = true` on a nomination row that does not state it.

The spec's insert goes through `bulkImport`, which the E2E admin client inherits (`class SupabaseAdminClient extends DevSeedAdminClient`; `async bulkImport(data: Record<string, Array<unknown>>)`), with the row's `external_id` under the dataset's prefix and `confirmed: false` stated — so that J shows "Pending confirmation" first, and a second step can confirm it with the client's `update` and read "Confirmed". Phase 177 adds election-type rules to `validate_nomination`; the row is re-checked there, not here.

### RQ-4 — which identity and which page produce `Error formatting nomination`?

**The identity and the page are measured. The cause is established by reading and reproduced in a model; it is not yet observed in the application.**

**What is measured.** In `tests/e2e-runs/261008-quick-g2-g4-g6/` (head `c030a0d4f`, 220 of 220) and in `tests/e2e-runs/174-e2e/174-01-baseline/`, each of the three lines falls inside the same tests, by the log line's own `time` against each test's `startTime` and `duration` in `results.json`:

| Lines | Election id in the line | The tests running at that instant that open the profile page |
|---|---|---|
| two, about 110 to 180 ms apart | one id, the same in both | `contestant-a11y-scan` › `axe accessibility scan — cand-profile` and `… cand-profile (dark)`, which run side by side |
| one | another id | `perm-localisation-positive` › `localisation walk across en/fi/sv with voter-side cross-check`, whose step 5 is `await page.goto('/en/contestant/profile')` |

The lines are the **browser's** console (`[vite] (client) [console.error]`), forwarded by the dev server. The identities: the stored session of `test-e2e-base-ca-aa-1`, the base dataset's candidate, and the localisation dataset's candidate. Each has one nomination (read for the first: `test-e2e-base-nom-reg-n-ca-aa-1`, election `test-e2e-base-el-reg`, parent `test-e2e-base-nom-reg-n-or-aa`, symbol `'3'`). The journey spec, which reaches the profile by clicking from home, coincides with no line.

**What is read.** The one logger is `parseNomination`'s `catch` in `ENTITY/profile/+page.svelte`; its `try` calls `contestantCtx.dataRoot.getElection(nomination.electionId)`, and `DataRoot.getChild` throws "Child in collection elections with id … not found". Elections reach the data root from the **root** layout's `$effect` (`dr.provideElectionData(snapshot.electionData)`); the nominations reach the store from the **entity** layout's `$effect` (`untrack(() => userData.init(snapshot.userData))`). In `svelte` 5.57.1, `src/internal/client/reactivity/batch.js` `flush_queued_effects` runs each user effect and then, before the next one, updates the block effects it dirtied (`eager_block_effects`).

**What the model shows.** *Measured* in the scratch app — a root layout whose effect sets `elections`, a nested layout whose effect sets the nominations, and a page with `{#each noms as n}{@const r = parse(n)}` that logs when the election is missing: a full page load logs exactly **one** line and the row then renders resolved; entering the same page by client navigation logs **none**; a second full load logs one again. A nested layout's effect runs before its ancestor's, and the `{#each}` is updated in between.

**The cause, as it stands:** on a full page load the profile's nominations are rendered once before the data root holds any election, and again, correctly, a moment later. Nothing is wrong with the data, and no nomination is shown without its election once the page settles. **Status: UNCONFIRMED in the application.** Two things keep it there:

- the mechanism was run in a model of the three components, not in the application;
- one observation is unexplained by measurement: `perm-answers-locked` › `profile: contestant-answers-locked-warning visible + every visible input disabled` also opens the profile by `page.goto('/en/contestant/profile')` and coincides with no line. *Inferred:* the test asserts on server-rendered markup and ends 532 ms after it starts, before the dev-mode client has hydrated; the dev-server log holds no client line of any kind from that page.

**What confirms it — a first task, before the code is deleted, about ten minutes on the running stack:** open the profile by a full load under a candidate's session with the console recorded, wait for the page to settle, and read (1) exactly one line per nomination, (2) the card showing its constituency afterwards, (3) no line when the same page is entered from home by a click, and (4) one line from the answers-locked dataset's profile when the page is held open past hydration. The todo `2026-10-06-173-nomination-format-error-logged-in-every-run.md` closes with that reading. Its `files:` entry names `apps/frontend/src/lib/contestant`; the logger is the profile page (the context's own item 13).

**What J inherits if nothing is done.** J's cards resolve the same election names. Written as the profile block is, J logs the same line on every full load; written without the `try`, the throw happens inside a block update during hydration. Either the RPC returns the two names (recommended, below) or J waits for the data root to hold the election before it formats.

### RQ-5 — how does a signed-in contestant receive `access.*` in the browser?

**Through the root universal load, which every full page load and every sign-in reruns.** *Read this session:* `routes/+layout.ts` awaits `dataProvider.getAppSettings({ locale: lang })` and the contestant context derives `#answersLocked = $derived(!!this.#appSettings.access.answersLocked)`. The rest of the path — the readable row for an entity editor of a closed project, the form action's `invalidateAll`, the strict `access` object of the stored-settings schema — is Phase 175's research, RQ-3, and was not re-read. `ctx.nominationsLocked` and the schema key are *175-plan*.

**For this phase's spec:** the root load does not rerun on a client navigation, so after the spec flips the lock the next step is a full load (`page.goto`), and the assertion says so.

### RQ-6 — every reader of a route id that gains the group's segment

*Measured* by search over `apps/frontend/src`, `tests/tests`, `scripts` and `apps/docs/src`:

| Reader | What it does with a route id | Effect of the new segment |
|---|---|---|
| `lib/routes/route.ts` `ROUTE` | `ContestantAppProfile`, `ContestantAppQuestions`, `ContestantAppQuestion`, `ContestantAppPreview` are built from `CONTESTANT_ENTITY` | the four values gain the segment; `ContestantAppSettings`, `ContestantAppEntityHome` and the new nominations key do not |
| `lib/routes/buildRoute.ts` | `resolveRoute(routeId, params)` | none — SvelteKit drops group segments, so the URLs are unchanged |
| `lib/routes/route.ts` `isProtectedRoute` | `routeId.split('/').includes(PROTECTED_GROUP)` | none, as long as the new group is not named `(protected)` |
| `hooks.server.ts` `appGateHandle` | `resolveAppGate(routeId)`, `routeId === ROUTE[gate.loginRoute]`, `isProtectedRoute(routeId)` | none |
| `lib/routes/routeConsistency.test.ts` | C1: every page directory inside a protected group has a `ROUTE` entry; C2: every `ROUTE` value carrying the group names a directory that exists | **both bind this phase:** the nominations page needs its key (C1), and the four moved values must match the directories exactly (C2) |
| `lib/routes/route.test.ts` | one literal profile route id in an `isApiRoute` negative list | still a valid negative; update for truth |
| `tests/tests/utils/buildRoute.ts` `fillRouteId` | drops every segment that starts with `(` | none |
| `tests/tests/utils/contestantEntityUrl.ts` | patterns on URLs, and `dropEntitySegments` on `ROUTE[route]` | none; its test file holds two hand-written route ids |
| four fixture docstrings, one spec comment and one docs page | name the page files by path | paths in comments go stale for the three moved pages (comment hygiene) |
| the three `*.tracking.test.ts` files and `register/+layout.server.ts` | read `route.id` of other routes | none |

Nothing outside `route.ts` and the route tree has to change for the URLs to keep working.

## The nominations RPC (D-09, OD08-D1 (a))

**Today's read** (*read*, `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` `_getEntityUserData`): after `get_entity_user_data`, when `loadNominations` is set, `this.scopedFrom('nominations').select('election_id, constituency_id, election_round, election_symbol, parent_nomination_id, entity_type, id').eq(`${type}_id`, entityRow.id)`, mapped to `{ entityType, entityId, electionId, constituencyId, electionRound: n.election_round ?? 1, electionSymbol: n.election_symbol ?? '', id }` and returned as `{ nominations: nominationsList, entities: {} }`. The store's `reloadEntityData` reads with `loadNominations: false` and replaces the entity alone.

**Every contestant-side consumer of the stored nominations** (*measured* by search; T-1 for why the voter and admin users of the provider type are not among them):

| Consumer | What it reads |
|---|---|
| `lib/api/base/dataWriter.type.ts` `ContestantUserData<TNominations>` | the type; `GetEntityUserDataOptions.loadNominations` |
| `lib/api/base/universalDataWriter.ts` | the two `getEntityUserData` signatures |
| `supabaseDataWriter.ts` `_getEntityUserData` | builds it |
| `app.d.ts` | `contestantUserData?: ContestantUserData<true>` on the page data |
| `contestantUserDataState.svelte.ts` | `#savedData`, the JSON clone in `#current`, `init`, `current` |
| `contestantContext.svelte.ts` | two effects: `current.nominations.nominations.map((n) => dr.getElection(n.electionId))` and the same for `constituencyId` |
| `ENTITY/+layout.server.ts` | stage 4, `userData.nominations` |
| `ENTITY/+layout.svelte` | `ud.nominations.entities` handed to `dr.provideEntityData`, and `ud.nominations.nominations` |
| `ENTITY/profile/+page.svelte` | `userData.current?.nominations?.nominations`, removed with the block |
| tests | `supabaseDataWriter.test.ts` (the 'loads nominations when loadNominations=true' group), `supabaseDataWriter.integration.test.ts`, `contestantUserDataState.svelte.test.ts` (its fixture casts `[] as unknown as ContestantUserData<true>['nominations']`), `contestantContext.svelte.test.ts`, `ENTITY/layout.server.test.ts` |

`entities` is always `{}` today, so its member and the `provideEntityData(snapshot.entities)` call go with the type.

**What changes.** A new type in `dataWriter.type.ts` for one entity's nomination — id, election id, constituency id, round, symbol, `confirmed`, `customData`, the parent as `{ entityType, name, shortName }` or nothing, and the two names below — and `ContestantUserData<true>['nominations']` becomes a list of it. The store gains a getter for the saved list, so that the task state does not depend on `current`, which is re-cloned on every draft edit. The table select is deleted. The task state, the gate, the question scope and J read the one list.

**Return the election's and the constituency's names too.** D-09 leaves it to the planner. Both rows are in the caller's project and readable to it (`project.read_structure`, measured `t`). With them J needs no data root at all, which removes RQ-4's hazard from the new page and lets the server render the cards.

**Shape.** `RETURNS jsonb`, as `get_user_entities` and `get_entity_basic_data` do: `NULL` for a refusal, an array (possibly empty) otherwise, so "not yours" and "no nomination" are different answers. A `RETURNS TABLE` function cannot tell them apart and brings `yarn assert:rpc-nullability` with it (a disposition row per output column in `packages/supabase-types/RPC-NULLABILITY.md`). The adapter narrows the answer with a parse function of its own, as `parseUserEntities` does for the list — `scripts/assert-adapter-casts.mjs` fails a cast chain there.

**Security mode and gate — two sound shapes, one recommended.**

| | A — one `SECURITY DEFINER` function in `public` | B — a `SECURITY INVOKER` function plus a definer helper in `private` |
|---|---|---|
| Own rows | selected by the function, behind its explicit gate | selected under the caller's row-level security, filtered to the entity |
| Parent | joined in the same body, allow-listed | `private.<helper>(parent_nomination_id)` returns the allow-list |
| Precedent | `get_entity_basic_data` | `get_entity_user_data` with `private.caller_entity_ids` — "the grant lookup is the one definer call on the path" |
| Census | `07-rpc-security.test.sql` § 8c: the `authenticated` list gains one name | the file's `private` census gains one name |
| Refusal | `NULL` | zero rows, as for "no nomination" |

Recommended: **A**, which is what D-09 describes, with the gate `p_entity_id IN (SELECT private.caller_entity_ids (p_project_id, p_entity_type))` rather than `user_can (…, 'nomination.read', …)` (T-8). Reasons: it is the authority `get_entity_user_data` uses for the read this one accompanies, so the two cannot disagree about whose entity it is — the reason OD08-D1 gives for one read; an entity the caller does not edit returns `NULL`, to the letter of D-09; and a parent organization's editor cannot use it to learn the name of *another* party one of its candidates stands for. `user_can` reads the token and `caller_entity_ids` reads `public.grants`, so the table-based gate also answers correctly in the interval after a claim and before a token refresh. If the planner keeps `user_can`, the pgTAP cell "an entity the caller does not edit" has to be written as "an entity the caller holds no `nomination.read` on", and the parent's reach is stated.

**What it must not return:** `created_by`; anything of the parent beyond its entity type, `name` and `short_name`; any column of the parent's *nomination*; any other entity.

**pgTAP — a new file (`42-…` if 175's files 40 and 41 land as planned), cells in pairs:**

| Cell | Expected |
|---|---|
| a candidate's editor, own entity, a confirmed and an unconfirmed nomination | both rows, `confirmed` true and false, `custom_data` carried |
| the same, on a project closed for voters, parent organization unconfirmed | the parent resolved to its type and name — the row the tables refuse (assert the refusal through the tables in the same file, so the cell proves something) |
| an organization's editor, own entity, parent an alliance | the parent resolved |
| an entity with no nomination | `[]`, not `NULL` |
| a signed-in user asking for an entity it does not edit: another user's, one that does not exist, and its own id under the wrong type | `NULL` each, the three answers equal |
| a parent organization's editor asking for its child candidate | `NULL` under the recommended gate (the reach that `user_can` would grant) |
| a project admin | `NULL` under the recommended gate; states that the function is the editor's read |
| `anon` | `EXECUTE` revoked: `throws_ok` with `42501` |
| the keys of one returned element | exactly the allow-list; no `created_by` |
| the keys of `parent` | exactly `entity_type`, `name`, `short_name` |
| § 8c of file 07 | the census string with the new name |

`05-organization-admin.test.sql`'s TEST C already builds an unconfirmed candidate under an organization's nomination and is the fixture shape to copy. Then, in one commit with the schema: `yarn schema:regenerate`; and after a reset, `yarn db:types` **before** pgTAP runs on that database (pgTAP's first file leaves helpers in `public`).

**Gates this binds:** `assert:schema-migration-parity`; `assert:project-scoped-queries` (the writer loses a `scopedFrom('nominations')` call and gains an RPC call that passes `p_project_id` — whether the guard's registry of scoped RPCs must name the new function is read from the script at planning); `assert:adapter-casts`; `yarn db:lint:sql` (a definer function needs `SET search_path = ''`); and `25-matrix-conformance.test.sql` if the function calls `user_can` with a permission literal.

## The task state (D-02 to D-06, D-20)

**Where it lives.** A private `$derived.by` on `ContestantContextProvider`, beside `#profileComplete`, that reads its inputs inside its own scope and hands **values** to the pure helper; two prototype getters, `tasks` and `nextStep` (and whatever exposes "the preview is open"); the members declared on `ContestantContext`. Both are value-replacing — a fresh list and a fresh object on every recompute — so a `$derived(ctx.tasks)` read alias in a page is safe, and destructuring is not. The helper never receives the data root or the context: its inputs are numbers, booleans and ids taken from the context's push-based `$state` mirrors, which is what keeps it clear of the `dataRoot` alias prohibition (`contexts/tests/noDataRootDerivedAlias.test.ts` scans for the alias).

**Inputs, each with its source:**

| Input | Source | On today's tree? |
|---|---|---|
| the entity is loaded | `userData.savedEntityData !== undefined` | yes |
| it has a nomination | the store's saved nominations list, non-empty | the list yes; a getter for it is new |
| the question lists are loaded | `questionsReady` | *175-plan* — "true when the run had a loaded entity's type and at least one selected election, false otherwise" |
| unanswered required info, unanswered opinion, opinion total | the three lists' lengths | yes |
| the first unanswered opinion question's id | `unansweredOpinionQuestions[0]?.id` | yes |
| a required name is missing | the name clause of `profileComplete` | *175-plan* |

The helper returns route **descriptors** (a route key and params), not built URLs: it then imports nothing, the pages build with `getRoute.current(…)`, and a server load can import the same module.

**Order of the rules inside the helper** (D-03's "blocked comes before omitted", made concrete by what 175 leaves): not loaded → no list yet; loaded with no nomination → nomination `incomplete`, profile and questions `blocked`, preview closed, and **the question inputs are not read** (T-6; and `questionsReady` is false for good for such an entity, so it cannot be waited for); loaded with a nomination and `questionsReady` false → the questions task's status is not known yet; ready with no opinion question → the task is omitted and the preview's opinion half holds vacuously.

**The five sites, and what each does today** (*read*):

| Site | Today | Reads after this phase |
|---|---|---|
| Home `contestant-home-continue` | `computeNextAction().href`: preview when `profileComplete`; the questions **list** when `missingInfoCount === 0 && missingOpinionCount !== 0`; else the profile | `nextStep`; the list for the questions task (T-4) |
| Profile `profile-submit` | `submitRouting`, read after `await userData.save()`: the questions **list** when required info is filled, opinions are outstanding and answers are unlocked; else the entity home | `nextStep` **read after the save resolves** |
| Questions list `contestant-questions-start`, `contestant-questions-continue` | the first unanswered question | the questions task's first unanswered question |
| Question page `contestant-questions-save` | `submitRouting`: the next unanswered question; the entity home when it "was the last"; else the list | see OQ-1 |
| J's own | new | `nextStep` with nominations; the entity home, labelled `common.return`, without |

Not among them, and unchanged: `profile-cancel`, `profile-return`, `contestant-questions-cancel`, `contestant-questions-return`, `contestant-questions-home`, the questions layout's Return, the preview's `returnButtonCallback`, the settings page's two buttons, the terms-of-use Continue.

**Three things the helper's table has to state, which the context does not:**

1. **Labels are prospective; targets are read after the save.** *Read:* the profile's `submitLabel` comes from `allRequiredFilled`, computed over `userData.current` — the saved data **with the draft** — so the button says "Save and Continue" as soon as the draft fills the last required field. A `nextStep` derived from saved data alone would show "Save and Return" until the save, then go to the questions. The label needs the same rule evaluated on draft-inclusive inputs; the target is `ctx.nextStep` read after `await save()`. One helper, two sets of inputs, one table.
2. **`getNextQuestionId`'s -1 rule already is "the first unanswered question, read after the save".** *Read:* its doc — "`findIndex` returning -1 is the NORMAL state here … makes 'Save & continue' resume at the FIRST unanswered question". So the question page's target after a save equals the state's first unanswered question, and the landmine survives by construction. What the label needs before the save is "will a question be left", which today is `nextQuestionId` or `isLastUnanswered`.
3. **After the last question the page goes to the list or to home, and the suite accepts either.** *Read:* `getIsLastUnanswered` returns `unansweredOpinionQuestions.length === 1` inside a tracked `$derived.by`, so after the save it is false and the third branch (the list) is taken; the journey's step 19 says "the post-last question may redirect to overview or home; force the assertion at home". Under D-06 it goes home. A small behavioural clarification, not a regression; say so in the plan.

**`profileComplete`.** It drives the home title, the hero emoji and the "fully completed" message on two pages. It is `unansweredRequiredInfoQuestions.length === 0 && unansweredOpinionQuestions.length === 0` (plus 175's name clause), which is true for an entity with nothing loaded (P-4). Recommended: derive it from the task state — every task present is `complete` — and keep the accessor's name.

**The logout button (D-20).** *Read:* `triggerLogout` opens the modal when `userData.savedEntityData` is set, answers are unlocked and either unanswered list is non-empty, and the modal's two texts count info and opinion questions. Recommended rule, to be stated in the plan: the modal opens when the profile or the questions task is `incomplete` — something the user can do now — and not when the only thing left is `blocked` or the nomination. A user with no nomination logs out at once; the journey's step 7 (modal) and step 22 (no modal) keep their expectations.

**First paint.** The store is empty on the server and until the entity layout's effect runs, so the list's statuses are unknown in the server markup. *Inferred from the context's code, not observed in markup:* today the server renders the home with `profileComplete` true, because the lists are empty there and "nothing unanswered" is what it tests. The UI spec says what the three rows look like before the state is known; a state the user is in for good — no nomination — must not be drawn from an unknown one.

## The gate and the removed sign-out (D-13, D-14, D-16)

**What removing stage 4 touches** (*read*):

- `ENTITY/+layout.server.ts`: the branch `if (!electionId.length || !constituencyId.length) return await signOutToLogin(locals, lang, 'candidateNoNomination');`, and stage 5, which then must not call `getQuestionData({ electionId, … })` with an empty list — `convertFilterValue` throws "an empty filter array requests nothing and cannot be answered; pass `undefined` to omit the filter instead." The load returns `{ categories: [], questions: [] }` for such an entity. Its docblock's five stages are rewritten.
- `ENTITY/+layout.svelte`: accepts it — `isValidResult(data.questionData, { allowEmpty: true })` — and `!ud?.nominations` stays false for an empty list.
- `lib/contestant/utils/loginError.ts`: `CONTESTANT_LOGIN_ERROR` and `ContestantLoginError` hold `candidateNoNomination`, `loginFailed` and `nominationNoElection`; two go. `messages/<locale>/contestantApp.error.json` in seven locales and `lib/types/generated/translationKey.ts` follow. *175-plan:* 175 rewords both messages in place first, so the keys are still there to delete.
- Tests: `ENTITY/layout.server.test.ts` 'signs the user out with candidateNoNomination, and reads no questions' and its `NO_NOMINATION_ROUTE`; `lib/server/contestant/signOutToLogin.test.ts` `it.each([['loginFailed'], ['candidateNoNomination']] as const)`.
- `scripts/fixtures/assert-no-candidate-app-names.input.ts`: `const n21 = 'nominationNoElection' ?? 'candidateNoNomination';` — a fixture of names, re-read, not necessarily changed.
- Three docs pages state the sign-out (measured by search): `developers-guide/contestant-app/entity-selection`, `login-and-password-reset` and `pre-registration-and-invitation`.
- **175's hand-over** (*175-plan*): "An entity whose election cannot be resolved has no selected election, so `questionsReady` stays false and the questions URL would show the loading state." After this phase the entity with no nomination is that entity, permanently. It never reaches the questions URL (the group gate), but everything that waits for `questionsReady` — the menu item's and the home button's "rendered until known" rule, the task state — meets it. The task state must decide `blocked` from "no nomination" first and never wait.
- Nothing else makes a missing nomination an error (*measured* by search: `signOutToLogin` has four call sites, one of them this).

**The route tree.** `ENTITY/(<group>)/+layout.server.ts` with no `+layout.svelte` (measured to work in the scratch app); `profile/`, `questions/` and `preview/` moved under it by `git mv`, with the component tests 175 puts beside them; `ENTITY/(<group>)/preview/+page.server.ts` for the preview's rule; `ENTITY/nominations/+page.svelte` outside the group; `settings/` stays where it is. Each new load gets a `*.tracking.test.ts` on `loadTracking.testUtils.ts` and a server test, as its siblings have.

**The entity-less resolver.** *Read:* `params/contestantEntityPage.ts` `SINGLE_SEGMENT_PAGES` is `['profile', 'questions', 'preview', 'settings']` and the resolver's `SINGLE_SEGMENT_ROUTES` maps the same four. `nominations` joins both, with their tests' `SUB_PATHS`. A user with no nomination who opens `/contestant/profile` is redirected twice — to the profile under the entity, then home.

**What NOM-07 is and is not.** It is a rule about which pages open. *Read:* `entity_update_own_candidates` asks `user_can ('entity', id, 'entity.edit_answers', 'candidate'::public.entity_type)` in both clauses and nothing about nominations, and `upsert_answers` is `SECURITY INVOKER` over that policy; so an entity with no nomination can still write its answers through the API (*inferred* from the policy; no such write was made). No source asks the database to refuse that; it is stated here so that nobody reads the gate as a data control.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| An entity's own nominations with the parent's name | Database (one RPC, definer rights for the parent hop) | API adapter (`_getEntityUserData` parses and maps) | Row-level security refuses the parent to its child (RQ-2). |
| "Has a nomination" | Frontend server (the entity-level load and the group gate) | Browser (the store, for the task list) | One list, read once per entity load. |
| The page gate, all three pages | Frontend server (group layout load; preview leaf load) | — | A redirect before any page renders; measured correct after a browser-side save. |
| The task list and the next step | Browser (contestant context over a pure helper) | Frontend server (the same helper, for the preview's rule) | TASK-01 names the context; the helper is importable by both. |
| "Unanswered" for the gate | Frontend server | — | The server recomputes it from fresh rows; it trusts nothing the browser sends. |
| Skipping the question read | Frontend server (entity-level load) | Browser (the rollup writes empty lists with no election) | The read alone does not empty the data root (T-6). |
| The "not editable" note | Browser (contestant component library) | — | Presentation over `ContactSupport`. |
| "Nominations locked" | Database (enforced; *175-plan*) | Browser (`ctx.nominationsLocked`; *175-plan*) | This phase only reads it. |
| Disabled entries on home and in the menu | Browser | — | Read from the task state; `aria-disabled` and a stated reason. |

## Standard Stack

No package is added, removed or upgraded. Versions measured from `node_modules/*/package.json`:

| Library | Installed | Role in this phase |
|---|---|---|
| `@sveltejs/kit` | 2.70.3 | server loads, `redirect`, route groups, `parent()` |
| `svelte` | 5.57.1 | the context class, the pages, the note component |
| `vite` | 8.3.1 | dev server (the scratch measurement ran on it) |
| `@playwright/test` | 1.63.0 | E2E |
| PostgreSQL | 17.6 (Phase 175's research; the local stack answered read-only queries this session) | the RPC |

**Alternatives considered:** none; every mechanism has an in-tree instance.

**Installation:** none.

## Package Legitimacy Audit

Not applicable: the phase installs no external package. **Packages removed due to [SLOP] verdict:** none. **Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
 request for a page of an entity
        │
        ▼
 (protected) +layout.server.ts ── session? ── user ── gate? ──► { gate, user }  ──► gate view at the URL asked for
        │ gate null: entities
        ▼
 ENTITY/+layout.server.ts ── listed? ──► 307 app root
        │ get_entity_user_data ── get_entity_nominations (NEW: one read, parent resolved)
        │
        ├─ no nomination ──► questionData = { categories: [], questions: [] }      (the sign-out is gone)
        └─ nominations ───► get_questions(elections)
        │
        ▼ { questionData, contestantUserData }
   ┌────┴───────────────────────────────┬──────────────────────────────┐
   ▼                                    ▼                              ▼
 home (+page)                    nominations (J)              (group) +layout.server.ts   NEW
 settings                        outside the gate              await parent()  ── no nomination ──► 307 entity home
                                                                       │
                                               ┌───────────────────────┼─────────────────────────┐
                                               ▼                       ▼                         ▼
                                            profile                questions/…          preview +page.server.ts  NEW
                                                                                         await parent()  (parents run again on the server:
                                                                                          fresh nominations, answers, questions)
                                                                                         unanswered? ──► 307 entity home

 browser:  ENTITY/+layout.svelte ─► data root (questions) + store (entity, nominations)
           ContestantContext ─► rollup (empty with no election)  ─► counts ─┐
                                 store: saved nominations, answers ─────────┼─► pure helper ─► tasks, nextStep, preview open
           home · menu · profile save · questions list · question save · J · logout  ◄──────┘
           save(): browser ─► upsert_answers ─► store merges ─► goto(nextStep)   (no load is invalidated)
```

### Recommended Project Structure

```
apps/supabase/supabase/
├── schema/503-entity-rpcs.sql                 # + the nominations function; the file's header list
└── tests/database/                            # a new file; 07-rpc-security § 8c
apps/frontend/src/
├── lib/contestant/tasks/                      # the pure helper, its unit table, the shared "unanswered" filters (name is discretion)
├── lib/server/contestant/                     # the server-side inputs for the preview's rule
├── lib/contestant/components/<note>/          # the note, its .type.ts, its test
├── lib/routes/route.ts                        # four values moved, one key added
├── params/contestantEntityPage.ts             # + nominations
└── routes/contestant/(protected)/…/[entityId=uuid]/
    ├── nominations/+page.svelte               # J
    └── (<group>)/                             # +layout.server.ts; profile/, questions/, preview/ (+page.server.ts)
tests/tests/
├── setup/perm/<name>.setup.ts, .teardown.ts   # the new dataset's pair
├── fixtures/contestant/                       # nominations-page fixture; home, profile, nav fixtures changed
└── specs/perm/<name>.spec.ts                  # the spec and its scans
packages/dev-seed/src/templates/e2e/perm/      # the template, registered in BUILT_IN_TEMPLATES
```

### Pattern 1: a child server load that must see fresh data awaits its parent and adds no dependency
**What:** `const parentData = await parent(); if (parentData.gate !== null) return {};` then decide and `redirect(307, buildRoute({ route: 'ContestantAppEntityHome', … }))`. It takes `parent`, `params` and nothing of `url` or `route`.
**When to use:** the group's load and the preview's load.
**Why it is fresh:** RQ-1 (a).

### Pattern 2: a rule that must be asked on every arrival lives in the leaf
**What:** a `+page.server.ts` beside the page.
**When to use:** the preview's "both filled". A layout load is asked once per entry to its subtree.

### Pattern 3: one helper, called with already-read values
**What:** the context's `$derived.by` reads its accessors and passes numbers, booleans and ids; the server's load passes the same shape.
**When to use:** `tasks`, `nextStep`, "the preview is open", and the labels' prospective evaluation.
**Source:** the caller contract in today's `contestantHome.helpers.ts` — "the caller passes ALREADY-READ scalars".

### Pattern 4: a definer function answers `NULL`, never an error, for every refusal
**Source:** `get_entity_basic_data`'s header — "Returns NULL -- never raises -- when the caller lacks the permission, when the type is NULL, or when the named table holds no row with that id".

### Anti-Patterns to Avoid
- **The preview's rule in the group's layout load.** It is not asked on a navigation inside the group (RQ-1, step B).
- **`invalidateAll()` or a `depends` key after each save, to "refresh the gate".** Not needed; it re-sends the entity and its questions to the browser on every save and re-inits the store.
- **Resolving a name with `dataRoot.getElection(…)` in J's first render.** It throws before the root layout's effect has run (RQ-4).
- **Deciding "complete" from empty lists.** Empty is what "not loaded" and "no nomination" look like too (P-4).
- **Deleting the redirect effect and keeping the render condition** (T-7).
- **Changing `DPDataType['nominations']`** (T-1).
- **Appending the lock-dependent scans to `contestant-a11y-scan`** (T-2).
- **A `{#if type === 'organization'}` in a page.** *175-plan:* the difference is data in the per-type descriptor.
- **A `view-transition-name` on a new element, or a tracked `url` read in a new load.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| A support link | a new block | `ContactSupport` with `SUPPORT_ANCHOR` (`lib/contestant/components/contactSupport`) | It exists; "action: 'help' \| 'email'", default `'help'`. |
| Which entities are the caller's | a new grant query | `private.caller_entity_ids (p_project_id, p_entity_type)` | The gate of `get_entity_user_data`. |
| Applicability of a question | a second filter | `rollUpQuestionCategories` on a data root (S1), or `match` from `@openvaa/data` (S2) | T-10. |
| Emptiness of an answer | a truthiness test | `isEmptyValue` from `@openvaa/data` | A saved `false` is an answer. |
| A redirect target | a path string | `buildRoute({ route, locale, entityType, entityId })` | The app's one producer of route strings. |
| Proving a load reads no URL | ad-hoc assertions | `loadTracking.testUtils.ts` and a `*.tracking.test.ts` beside the load | The recording proxies have their own negative controls. |
| A user with an entity grant and a stored session | a bespoke setup | `registerAndStoreSession` with `entityGrants` | It refuses an identity with no entity and owns the rollback. |
| Seeding a dataset into the suite's project | direct inserts | `setupFromTemplate` and `runTeardownAsserted` | One project id; an asserted teardown. |
| Inserting a nomination from a spec | a new admin-client method | the inherited `bulkImport` | Refs by `external_id`; teardown by prefix. |
| Flipping a setting in a spec | a raw update | `updateAppSettings({ access: { nominationsLocked: … } })` | Deep merge (T-3); restore in a `finally`. |
| An axe scan | `new AxeBuilder(…)` in a spec | `assertAxeScan`; *175-plan:* `declareScans` from `tests/tests/utils/contestantAxeScan.ts` | The wiring gate forbids a second axe gate. |
| A phone-width check | a screenshot | *175-plan:* the steps of `tests/tests/fixtures/shared/pageGeometry.fixture.ts` | `scrollWidth` against `clientWidth`. |
| A phase gate runner | new scripting | copy the previous phase's `*-gates.sh`, `*-e2e.sh`, `*-verdict.mjs` (174's exist; 175's are *175-plan*) | Node selection, dirty-tree refusal, direct exit statuses, the power log. |

**Key insight:** the phase adds one read, one helper and two small loads; everything else is rewiring what is there. The risk is in what is read as "empty" (T-6, T-7, P-4) and in the two places where "what the site does today" was written down from memory (T-4, T-5).

## Runtime State Inventory

The phase moves three route directories and replaces one read, so the inventory applies.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. No table or column is added or renamed; the RPC reads existing rows. A browser's `localStorage` holds answer drafts under keys built from the entity's type and id (`contestantContext-userData-editedAnswers-<type>-<id>`), which no route id enters. | None. |
| Live service config | None — nothing is deployed (project ruling 2026-10-04) and no URL changes: a route group adds no path segment. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None. | None. |
| Build artifacts | `apps/supabase/supabase/migrations/00001_initial_schema.sql` (`yarn schema:regenerate` in the schema commit); `packages/supabase-types/src/database.ts` (`yarn db:types` after a reset, before pgTAP); `apps/frontend/.svelte-kit` generated `$types` for the moved routes (`svelte-kit sync`, which `check` runs); `lib/types/generated/translationKey.ts` and `lib/paraglide/**` (regenerated when the catalogues change); the `dist/` of any package a plan edits. | Regenerate; no manual state. |
| The applied local database | Holds the schema of whichever phase reset it last; a second, unrelated Supabase stack runs on this host (project memory). | `yarn db:reset` inside the gate only, never during an E2E run. |

**The canonical question — after every file is updated, what still holds the old shape?** The applied database until the gate's reset, and a running dev server's module graph for the moved routes (project memory: restart the dev server before trusting an E2E result after a large move).

## Common Pitfalls

### P-1: the preview's rule in the wrong load
**What goes wrong:** the group's load holds "both filled"; a user saves the last answer on a question page, clicks Preview, and the load does not run — the preview opens or stays closed on whatever the group decided at entry.
**How to avoid:** Pattern 2. **Warning sign:** a server test of the gate that only ever enters from home.

### P-2: a refusal that reads as "no nominations"
**What goes wrong:** the writer maps a `NULL` answer to an empty list, and an entity whose read was refused is shown as one with no nomination — home, the empty J, three closed pages.
**How to avoid:** `NULL` is "not found", the same outcome as `get_entity_user_data` returning no row (the load's `redirect(307, appRoot)`); `[]` is "no nomination". One writer unit case each.

### P-3: the data root remembers the last entity's questions
T-6. **How to avoid:** the rollup effect writes empty lists and blocks when no election is selected; the helper ignores question inputs without a nomination. **Warning sign:** a badge with a count on a disabled questions entry, for a user who edits two entities.

### P-4: "nothing unanswered" is not "complete"
**What goes wrong:** for an entity with no nomination every list is empty, so `profileComplete` is true: the home title reads `contestantApp.home.ready`, the hero shows the success emoji, the profile and questions pages would show `contestantApp.common.fullyCompleted`, and the logout button skips its modal for the right reason by accident.
**How to avoid:** derive `profileComplete` from the task state. A context unit case: no nomination → not complete.

### P-5: a render condition beside the redirect
T-7.

### P-6: the journey asserts the old gate in three steps, and the menu's items by id
T-5. **How to avoid:** the plan that changes the home and the menu changes the fixture and the five steps, and ends on a full run.

### P-7: the profile scan's reach marker is the block being removed
T-9.

### P-8: `provideData` is silent on empty input
*Read:* `if (!data.length) return [];`. Returning empty question data is safe; it also means nothing "resets" by providing less. Any code that relies on a provide call to clear something is wrong.

### P-9: J on a full page load
RQ-4. The names come from the RPC, or the page waits.

### P-10: a label computed from saved data
*The task state*, item 1. **Warning sign:** the profile's button says "Save and Return" with every required field filled in the draft.

### P-11: route ids and directories must move in one commit
*Read:* `routeConsistency.test.ts` C2 fails on a `ROUTE` value whose directory does not exist, and C1 on a page directory with no key. The `git mv` of the three directories, the four `ROUTE` values and the new key are one commit; `svelte-kit sync` before `check`.

### P-12: the resolver's two lists
`SINGLE_SEGMENT_PAGES` and `SINGLE_SEGMENT_ROUTES`, and the `SUB_PATHS` of both tests. The matcher's own doc says its accept-set "is exactly the entity sub-paths the app has".

### P-13: a new teardown's prefix is checked at config load
*Read in Phase 175's research; the prefixes re-read this session:* `tests/playwright.config.ts` refuses a `PREFIX` that is a prefix of another or prefixed by one. Existing ones include `e2e-perm-no-allowopen-`, `e2e-perm-notloc-`, `e2e-perm-notif-`, `e2e-perm-missnoms-`. `e2e-perm-no-nomination-` passes against all of them; 175's own new prefix is *175-plan* and is checked too.

### P-14: a disabled link has no `href`
*Read:* `NavItem.svelte` and `Button.svelte` — "On the `<a>` branch we set `aria-disabled="true"` and drop `href`". A spec that reads a disabled entry's `href` fails; and D-15 asks that the entry also say *why*, which neither component does today (an `aria-describedby` to a visible or screen-reader reason — the UI spec's).

### P-15: one working tree, several agents
`.planning/config.json` has `"parallelization": true` and `"use_worktrees": false`. Collision points here: the seven message catalogues; `yarn db:reset` against anything that reads the database; `yarn db:types` against a concurrent `svelte-check`; the `git mv` of three directories against any plan that edits a page in them; the shared git index (commit with explicit paths: `git commit -m "…" -- <paths>`).

### P-16: the agent shell's Node is below the engines floor
*Measured:* `node --version` is `v24.14.1`; `package.json` asks `">=24.15.0"`; `~/.nvm/versions/node/v24.21.0` is installed. The phase drivers select it; an ad-hoc `yarn` call puts it first on `PATH`.

### P-17: a scratch tool that resolves through the repository's `node_modules` writes there
This research did it once (see the header). A plan's executor that runs Vite from outside a workspace sets `cacheDir`.

## Code Examples

Proposals shaped on the tree's own instances, not copies of existing code. Names not quoted from the tree above are new and are discretion.

### The nominations function (shape A, the recommended gate)

```sql
-- Shape: get_entity_basic_data in schema/503-entity-rpcs.sql. The name and the projection are proposals.
CREATE OR REPLACE FUNCTION public.get_entity_nominations (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  IF p_project_id IS NULL OR p_entity_type IS NULL OR p_entity_id IS NULL
     OR p_entity_id NOT IN (SELECT private.caller_entity_ids (p_project_id, p_entity_type)) THEN
    RETURN NULL;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', n.id,
        'election_id', n.election_id, 'election_name', e.name,
        'constituency_id', n.constituency_id, 'constituency_name', c.name,
        'election_round', n.election_round,
        'election_symbol', n.election_symbol,
        'confirmed', n.confirmed,
        'custom_data', n.custom_data,
        'parent', CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object(
          'entity_type', p.entity_type,
          'name', COALESCE(po.name, pf.name, pa.name),
          'short_name', COALESCE(po.short_name, pf.short_name, pa.short_name)) END
      ) ORDER BY n.sort_order NULLS LAST, n.id)
    FROM public.nominations n
    JOIN public.elections e ON e.id = n.election_id
    JOIN public.constituencies c ON c.id = n.constituency_id
    LEFT JOIN public.nominations p ON p.id = n.parent_nomination_id
    LEFT JOIN public.organizations po ON po.id = p.organization_id
    LEFT JOIN public.factions pf ON pf.id = p.faction_id
    LEFT JOIN public.alliances pa ON pa.id = p.alliance_id
    WHERE n.project_id = p_project_id
      AND CASE p_entity_type
            WHEN 'candidate' THEN n.candidate_id
            WHEN 'organization' THEN n.organization_id
          END = p_entity_id
  ), '[]'::jsonb);
END;
$$;
-- REVOKE EXECUTE … FROM PUBLIC, anon; GRANT EXECUTE … TO authenticated; as the function above it in the file.
```

Every identifier in it is read from the schema this session: the column names of `schema/104-nominations.sql`, `name jsonb` and `short_name jsonb` on `elections` and `constituencies` (`schema/101-elections.sql`), `private.caller_entity_ids (p_project_id uuid, p_entity_type public.entity_type)`, and the parent hierarchy in the table's header ("candidate -> parent: organization or faction", "organization -> parent: alliance").

### The two loads

```ts
// ENTITY/(<group>)/+layout.server.ts — "no nomination" for the three pages. Takes `params` and `parent` only.
export async function load({ params, parent }) {
  const parentData = await parent();
  if (parentData.gate !== null) return {};
  const nominations = parentData.contestantUserData?.nominations;
  if (!nominations) return {}; // the entity layout renders its own error view
  if (nominations.length === 0)
    redirect(307, buildRoute({ route: 'ContestantAppEntityHome', locale: getLocale(), entityType: params.entityType, entityId: params.entityId }));
  return {};
}
```

```ts
// ENTITY/(<group>)/preview/+page.server.ts — "both filled", asked on every arrival.
export async function load({ fetch, locals, params, parent }) {
  const parentData = await parent(); // on a data request this runs the parent loads again, on the server
  if (parentData.gate !== null) return {};
  const inputs = await previewInputs({ fetch, locals, parentData }); // S1 or S2; `undefined` when question data is unusable
  if (inputs && !isPreviewOpen(inputs))
    redirect(307, buildRoute({ route: 'ContestantAppEntityHome', locale: getLocale(), entityType: params.entityType, entityId: params.entityId }));
  return {};
}
```

`'ContestantAppEntityHome'`, `entityType` and `entityId` are the route key and the two params of `lib/routes/route.ts` (`CONTESTANT_ENTITY`); `redirect(307, buildRoute({ … }))` is the entity-level load's own form.

### The helper's contract

```ts
export type TaskId = 'nomination' | 'profile' | 'questions';
export type TaskStatus = 'complete' | 'incomplete' | 'blocked';

export type TaskStateInput = {
  entityLoaded: boolean;
  hasNomination: boolean;
  /** False until the question lists were rolled up for a loaded entity with a selected election. */
  questionsReady: boolean;
  unansweredRequiredInfoCount: number;
  nameMissing: boolean;
  opinionCount: number;
  unansweredOpinionCount: number;
  firstUnansweredOpinionId: string | undefined;
};
```

The statuses are D-02's three, quoted from the context. The rest is a proposal; the table of cases is the plan's, after OQ-1 and OQ-2.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| A missing nomination signs the user out | A normal state: home, the task list, J | this phase | The first screen a freshly registered user sees from Phase 178 on. |
| Each Continue computes its own target | One helper, read by five sites | this phase | T-4 and OQ-1 decide what "one rule" yields per site. |
| A client `$effect` redirect out of the questions | A server redirect on "no nomination"; none on required info | this phase (OD08-D2) | The render condition goes with it (T-7). |
| The entity's nominations as a narrow table select under row-level security | One RPC with the parent resolved | this phase (OD08-D1 (a)) | The contestant type leaves the provider's (T-1). |
| Stored settings replace shipped ones by root key | Member-by-member merge at every depth | Phase 171 | T-3. |
| `candidateApp.*`, `candidate/` | `contestantApp.*`, `contestant/` | Phase 170 | Names in older todos are stale. |

**Deprecated/outdated:** `contestantApp.basicInfo.requiredInfo`'s sentence about the old gate; the todo's "not established: whether it predates Phase 173".

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The application's loads behave as the scratch app's did: same SvelteKit, same structure (a layout server load under a layout server load, a group with no layout component, a leaf server load). | RQ-1 | The gate's design changes. The gate's own E2E steps — save the last answer, click Preview — are the proof in the application; they are in the spec for that reason. |
| A2 | The mechanism behind `Error formatting nomination` in the application is the one reproduced in the model. | RQ-4 | The line has another cause, possibly in the data, and J inherits it unseen. The first task settles it before the logger is deleted. |
| A3 | `perm-answers-locked`'s profile test logs nothing because its page closes before hydration. | RQ-4 | A cold entry that really logs nothing would contradict A2. Step (4) of the first task settles it. |
| A4 | Everything marked *175-plan* lands as planned: `ctx.nominationsLocked`, `questionsReady` and its definition, the per-type descriptor, the questions layout's three states with the redirect kept, the menu and home rules, `contestantAxeScan.ts` and `declareScans`, `pageGeometry.fixture.ts`, pgTAP files 40 and 41, the `175-*` drivers, the reworded dead messages. | throughout | An anchor or a file number is wrong; each is re-read from 175's SUMMARYs before a plan fixes it. The plans were being revised during this research. |
| A5 | Accepting the terms of use at a blocked URL lands on home with focus on its heading. | RQ-1 (e) | A keyboard user is left on `<body>` in that one path; one component or E2E case decides. |
| A6 | A template with a candidate and an organization that have no nomination row passes the dev-seed pipeline. | Validation | The template needs a pipeline change. A dry run of the template in dev-seed's unit suite decides, in the dataset plan's first task. |
| A7 | A project admin and a parent's editor have no need of the new function. | The nominations RPC | If the Admin app is to show the same view later, the gate is widened then; today nothing calls it but the contestant writer. |
| A8 | A hosted Supabase project reads its own write at once (no read replica between the save and the next load). | RQ-1 | The preview could be refused once after the last save. Nothing is deployed; noted for the deployment milestone. |
| A9 | The two "unanswered" filters can be lifted out of the context into a rune-free module without changing what the context computes. | RQ-1 (b) | The server and the browser use different code after all; the parity test of S2 becomes necessary for S1 too. |

## Open Questions — resolved at planning (2026-10-08)

Every question below has a disposition; none stays open for the planner. The question texts are as the
research wrote them and are kept for the record; the disposition is the line that binds.

| # | Question | Disposition |
|---|---|---|
| 1 | **OQ-1** — what "Save and continue" does on a question page while basic info is missing | **Resolved.** A save inside the questions continues the questions while one is unanswered (UI contract U-01 ★, built at its recommended option on the orchestrator's ruling 1; shown to the operator on 2026-10-08 with no ruling given, and listed as item C1 of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`). Isolated as one branch of `questionSaveTarget` in plan 176-03, with its fallback stated there; the operator may still overrule. |
| 2 | **OQ-2** — the questions task's route for the home's main action and the profile's save (T-4) | **Resolved.** The questions list from outside the questions, the first unanswered question from inside them (U-02 ★, on ruling 1; no operator ruling given — item C2 of the same document). One assignment in `taskStateOf`, plan 176-03, with its fallback. |
| 3 | **OQ-3** — the "both filled" reading | **Resolved.** A nomination, no unanswered required info question, no unanswered opinion question; the name does not count (U-03 ★; OD08-D7 (a)). `previewOpenOf`, plan 176-03. |
| 4 | The RPC's gate (T-8) | **Resolved.** `private.caller_entity_ids` (orchestrator ruling 2). Plan 176-02. |
| 5 | S1 or S2 for the preview's inputs | **Resolved.** S1, a data root built in the preview's own server load; S2 with a mandatory parity test is the stated fallback. Plan 176-10, ruling 1. |
| 6 | Whether the lock helper, J and the note need anything from the server about `nominationsLocked` | **Resolved.** No: it is the browser-side accessor Phase 175 built, and no load branches on it. Plans 176-12 and 176-18 flip it with one key and follow with a full load. |
| 7 | No `176-UI-SPEC.md` exists | **Resolved.** The UI contract was written and approved on 2026-10-08; the screen plans (176-11 to 176-18) are written to it. |
| 8 | The E2E baseline | **Resolved by execution.** Plan 176-01 reads Phase 175's closing run from the tree into `176-BASE` and `176-BASELINE`; no number of the planning day is a target. |
| 9 | The time one navigation to the preview costs with the parent chain run again | **Resolved by execution.** Recorded, not gated, in plan 176-10 Task 3. |
| 10 | RQ-2's refused case on a closed project or an unconfirmed parent, through the tables | **Resolved by execution.** Pinned by the first cells of the function's pgTAP file, plan 176-02 Task 1. |
| 11 | Whether `assert:project-scoped-queries` wants the new function declared | **Resolved.** It does: the row `'requires p_project_id'` is added with the adapter's call, plan 176-05 Task 2 (pattern map, item 11). |

**The research's text of these questions, unchanged:**

**For the orchestrator, and possibly the operator, before the task-state plan is written:**

1. **OQ-1 — what "Save and continue" does on a question page while basic info is missing.**
   - What we know: the EDIT makes that state reachable for the first time. Criterion 4 says every Continue "leads to the entity's next incomplete task — basic info before the opinion questions". Taken to the letter, each saved answer sends the user to the profile. Today's rule on that page is "the next unanswered question", and D-06 says the -1 landmine "must survive".
   - What's unclear: which the operator meant. No source describes this state.
   - Recommendation: a Continue inside the questions continues the questions while one is unanswered; when none is left it leads to the first incomplete task in the canonical order — the profile if it is incomplete — and home when nothing is. The home screen's main action still names the profile first. This is a reading of the operator's EDIT and should be shown to them.
2. **OQ-2 — the questions task's route for the home's main action and the profile's save** (T-4). Recommendation: the questions list, as today; the first unanswered question for the two sites inside the questions.
3. **OQ-3 — the "both filled" reading** stays as the context marked it: inferred. Nothing found in the tree argues against it. One consequence to show the operator with it: an entity whose type is asked no opinion question has its preview open on the required info alone.

**For the planner:**

4. **The RPC's gate** (T-8): `private.caller_entity_ids` (recommended) or `user_can`. It decides two pgTAP cells.
5. **S1 or S2** for the preview's inputs (RQ-1 (b)).
6. **Whether the lock helper, J and the note need anything from the server about `nominationsLocked`.** As read: no — it is a browser-side accessor (*175-plan*), and no load branches on it in this phase.
7. **No `176-UI-SPEC.md` exists.** The roadmap gives the phase a UI hint. The home's rows and their first paint, J's cards and its three non-card states, the note, the disabled entries' stated reason, and every new string in seven locales wait on it. The data, state and route plans do not.
8. **The E2E baseline** is whatever Phase 175 closes on. Today's is 220 of 220 at `c030a0d4f`; 175 adds its own project.

**Not answerable from here, and what would answer it:**

9. The time one navigation to the preview costs with the parent chain run again — a timing of the data request on the running stack, in the gate plan.
10. RQ-2's refused case on a closed project or an unconfirmed parent, through the tables — the new pgTAP file's first cells.
11. Whether `assert:project-scoped-queries` wants the new function declared — read the script's registry at planning.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node at or above 24.15 | every `yarn` gate | ✓ under nvm; ✗ as the shell default | default `v24.14.1`; `v24.21.0` installed | the drivers' own Node selection (P-16) |
| Local Supabase (Postgres on `127.0.0.1:54322`) | pgTAP, `db:types`, `db:lint:sql`, the writer integration test, E2E | ✓ running; shared with Phase 175's execution | answered read-only queries; the applied schema still holds `projects.lock_nominations` | — |
| `psql` | read-only measurements | ✓ | `/usr/local/opt/postgresql@17/bin/psql` | — |
| Playwright browsers | E2E | ✓ | Chromium launched by `@playwright/test` 1.63.0 in this session | — |
| The graph (`graphify`) | discovery | ✗ | "graphify is not enabled" | reading the tree |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** the shell-default Node.

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json`, so the section applies.

### Test Framework

| Property | Value |
|----------|-------|
| Unit and component | vitest, one config per workspace; `yarn test:unit` = `yarn assert:unit-coverage && turbo run test:unit && yarn test:unit:tests` |
| Database | pgTAP through `yarn workspace @openvaa/supabase test:db`; 39 files today, 41 after 175 as planned |
| SQL lint | `yarn db:lint:sql` — the applied database |
| E2E | Playwright; one run through `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` |
| Quick run (one file) | `cd apps/frontend && yarn vitest run <path>` |
| Full suite | the phase's gate driver, then its E2E driver |

### Phase Requirements → Test Map

| Criterion / decision | Behaviour | Test type | Where | Exists? |
|---|---|---|---|---|
| C1, D-16 | an entity with no nomination loads: no sign-out, no question read, empty question data | vitest | `ENTITY/layout.server.test.ts` — the "entity with no nomination" case rewritten | edit |
| C1, D-16 | no dead error code is left | typecheck + vitest | `signOutToLogin.test.ts`; the `TranslationKey` type | edit |
| C1, T-6 | with a loaded entity and no selected election the context's lists are empty, even when the data root holds unscoped questions | vitest | `contestantContext.svelte.test.ts` | new case |
| C1, P-4 | `profileComplete` is false for an entity with no nomination | vitest | same | new case |
| C1, C4, D-02..D-06 | the helper's table: every status combination, `nextStep`, the preview's rule, the prospective labels | vitest | beside the helper | ❌ Wave 0 |
| C4, TASK-01 | `ctx.tasks` and `ctx.nextStep` follow the store and the lists | vitest | `contestantContext.svelte.test.ts` | new cases |
| C2, D-09 | the RPC's grid (see *The nominations RPC*) | pgTAP | a new file; file 07 § 8c | ❌ Wave 0 |
| C2, D-09 | the writer maps the RPC's answer; `NULL` is not `[]` | vitest | `supabaseDataWriter.test.ts` | edit |
| C2, D-09 | the same against the running stack, both entity types | integration | `supabaseDataWriter.integration.test.ts` with `CONTESTANT_WRITER_INTEGRATION_REQUIRED=1` | new case |
| C2, D-10..D-12, D-17 | J's four states; the note's reasons | vitest component | beside the page and the component | ❌ Wave 0 |
| C2, D-12 | the four former warnings render the note and keep `contestant-answers-locked-warning` | E2E | `perm-answers-locked` in the full run | exists |
| C3, D-13 | the group load: gate pending → nothing; no nomination → 307 to the entity's home; a nomination → nothing | vitest | a `layout.server.test.ts` beside it | ❌ Wave 0 |
| C3, D-13 | the preview's load: each half missing → 307; both filled → nothing; unusable question data → nothing | vitest | a `page.server.test.ts` beside it | ❌ Wave 0 |
| C3, D-13 | neither load reads `url` or `route` | vitest | two `*.tracking.test.ts` | ❌ Wave 0 |
| C3, RQ-1 (b) | the server's "unanswered" equals the context's, on one table of fixtures | vitest | beside the server helper | ❌ Wave 0 |
| C3, D-07, T-7 | the questions layout renders its children with required info missing and requests no redirect | vitest component | `questions/layout.svelte.test.ts` (*175-plan*) | rewrite |
| C3, D-08 | the resolver and its matcher admit `nominations` | vitest | `contestantEntityPage.test.ts`, the resolver's `page.server.test.ts` | edit |
| C3, RQ-6 | every route key names a directory, every page has a key | vitest | `routeConsistency.test.ts` | exists; goes red on a half-done move |
| C1, C3, D-18 | the no-nomination journey, both entity types | E2E | the new spec | ❌ new |
| C3, RQ-1 | the last answer saved in the browser, then Preview from home: it opens | E2E | the new spec | ❌ new |
| C4, T-5 | the journey with the new list, the open questions entry and J | E2E | `contestant-journey.spec.ts` steps 6, 11, 12, 13, 19.5 | edit |
| D-19 | four states, two themes | E2E | split below | ❌ new |
| D-20 | step 7 (modal) and step 22 (no modal) | E2E | the journey, three times in isolation | exists |
| standing rule | every new key in seven locales | lint | `yarn assert:i18n-catalog-namespaces`; the `TranslationKey` type | exists |
| standing rule | J and the rebuilt home fit 320px | E2E | the new spec, by page width | ❌ new |

### The dataset and the spec (D-18)

One hand-authored template in the perm chain, its own prefix, setup and teardown, after 175's link.

- **Settings:** `MINIMAL_BASE_APP_SETTINGS` (`packages/dev-seed/src/templates/e2e/perm/shared.ts`, where `entityTypes: ['candidate']`) with `contestantApp.entityTypes` stated whole as both types.
- **Rows:** one election, one constituency; a candidate and an organization with **no** nomination row (A6); an info category with one required question; an opinion category with two or three questions — few, because the spec fills them. Whether a question is addressed to one type only is not needed here.
- **Identities:** two single-entity users through `registerAndStoreSession` with `entityGrants`, each with its own storage-state file.
- **The spec, per entity type, serial:**
  1. no nomination: home shows the first task incomplete and the other two closed; the menu shows the entries, disabled; J shows its empty state and a Return that leads home; each of the three URLs lands on home; the logout button opens no modal. Scans: home, and J's empty state.
  2. the lock on (`updateAppSettings`, restored in a `finally`), then a full load: J shows the note. Scan: J's "not editable" state.
  3. a nomination inserted with `bulkImport`, `confirmed: false`, then **a full load**, said so in the assertion: the nomination task is complete; the profile and the questions open; the questions open **with the required info missing** and without a redirect; the preview does not; J shows the card as pending.
  4. the required info filled in the profile and saved; all opinion questions but one written through the admin client, then a full load; the last one answered in the browser; from home, Preview opens — RQ-1's case in the application.
  5. the nomination confirmed through the admin client: J reads "Confirmed" after a full load.
- The organization half needs 175's pages (*175-plan*).

### Where the axe scans live (D-19)

| State | Where | Why there |
|---|---|---|
| Home, no nomination | the new spec | only this dataset has such an entity |
| J, empty, lock off | the new spec | the same |
| J, "not editable", lock on | the new spec | a project-wide setting is flipped; the perm chain is serial |
| J with nominations | `contestant-a11y-scan`, under the base candidate's session | read-only there, and the base row is the richer card: a parent (`test-e2e-base-or-aa`) and a symbol (`'3'`) |

Consequences to write into the plan: the wiring gate's list of spec files that may not build their own axe gate gains the new spec (*175-plan* for the list's form); `contestant-a11y-scan` goes from 22 scans to 24 and the verdict's expected count moves by two; `cand-profile` gets a new reach marker (T-9); each new entry's marker is something only that state renders, so that a scan never passes against a spinner; a scan under the lock restores the setting before the next test reads it.

### Sampling Rate

- **Per task commit:** the touched file's own test; `yarn workspace @openvaa/frontend check` for a `.svelte` or route change.
- **Per schema commit:** `yarn schema:regenerate` and `yarn assert:schema-migration-parity`.
- **Per plan that changes a screen:** a full default E2E run through the wrapper, read as passed / failed / flaky / skipped / did not run — the cardinal rule binds every plan, not only the last.
- **Phase gate (D-22):** the gate rows green on the closing tree, the writer integration test after the reset, one full run, the new spec three times and the journey three times in isolation, the power state recorded for each (exit 8 and `VOID-host-suspend.txt` mean void), `yarn db:seed:default` restored after the last reset.

### Wave 0 Gaps

- [ ] The helper's unit table — after OQ-1 and OQ-2.
- [ ] The RPC's pgTAP file.
- [ ] Server tests and tracking tests for the two new loads; the parity table.
- [ ] Component tests for J and the note.
- [ ] `176-gates.sh`, `176-e2e.sh`, `176-verdict.mjs`, copied from the previous phase's.
- [ ] `176-UI-SPEC.md`.
- [ ] No framework install is needed.

## Proposed plans and waves

The context locks five plans in three waves and lets a plan be split. Phase 175's planner, with the same single checkout, ended on a strictly serial chain with a full E2E run at the end of each screen plan. The proposal keeps the context's order and splits along the same lines.

| Wave | Plan | Content | Why here |
|---|---|---|---|
| 1 | **176-01 Drivers and the D9 reading** | The three drivers; the in-application reading of RQ-4's four points, recorded; the todo's closing text. Needs the running stack and a dev server, so nothing else runs beside it. | D-09 asks for the cause before the code goes; it is cheap and blocks nothing if it is first. |
| 2 | **176-02 Schema** — serial inside itself | The function, its pgTAP file red first, § 8c, the regenerated migration; then `db:reset` → `db:types` → pgTAP → `db:lint:sql`; the database skill's lists. | One migration regeneration, after 175's. |
| 2 | **176-03 The pure helper** | The helper and its table, red first; the shared "unanswered" filters. Pure, in `apps/frontend`, no database, no generated type. | **The only pair that may overlap:** it shares no file with 176-02. Its checks stay at `vitest run <path>` and ESLint; `svelte-check` waits until 176-02's `db:types` has finished. If the planner prefers no overlap, it follows 176-02. Blocked on OQ-1 and OQ-2. |
| 3 | **176-04 The read and the load** | The contestant nominations type; the writer on the RPC, unit and integration cases; the store's getter; the context's two election effects; the entity-level load without stage 4 and with the skipped read; the two dead codes out of the map, the type and seven catalogues; the three docs sentences. | Needs 176-02's types. |
| 4 | **176-05 The context** | `tasks`, `nextStep`, the preview's accessor; the rollup's empty lists with no election; `profileComplete` from the task state; the skill's accessor list. | Needs 176-03 and 176-04. |
| 5 | **176-06 The routes and the gate** | The `git mv` of three directories with the four route values and the new key in one commit; the group's load; the preview's leaf load and the server-side inputs; the resolver's two lists; the questions layout without its redirect and its render condition; all their tests. Ends on a full run. | Needs 176-05's helper; touches the pages' directories, so nothing that edits a page runs beside it. |
| 6 | **176-07 The note** | The component over `ContactSupport`, its test; the four warnings replaced, the test id kept. Ends on a full run. | Needs the UI spec. |
| 7 | **176-08 J, the menu and the profile** | The page; the menu's item and its disabled entries; the nominations block and `parseNomination` out of the profile; the `cand-profile` marker; the strings. Ends on a full run. | Needs 176-04, 176-05, 176-07 and the UI spec. |
| 8 | **176-09 Home and every Continue** | The home from `tasks`; the five sites; the logout button; `contestantApp.basicInfo.requiredInfo`; the home fixture and the journey's five steps in the same plan. Ends on a full run. | The plan in which the journey's expectations change. |
| 9 | **176-10 The dataset, the spec and the scans** | The template and its registration; the setup and teardown pair; fixtures first; the spec; the scans in both places; the wiring gate; the phone-width checks. | Runs once against the finished surfaces. |
| 10 | **176-11 Close** | Docs and skills; todos closed and filed; the gate set; the full run and the six isolated runs. | A closing gate inside the spec plan makes that plan unverifiable as one unit. |

**What must be sequenced, in one line each:** the schema's function before `db:types`, and `db:types` before any frontend typecheck that names the function; the type before the load and the context; the helper before the context and the gate; the route move in one commit; the redirect and the render condition out together; the note before J; the journey's steps in the plan that changes what they assert; the dataset after every surface; one migration regeneration, after Phase 175's.

**What may be parallel across workspaces:** 176-02 (`apps/supabase`, `packages/supabase-types`) with 176-03 (`apps/frontend`, one directory, unit-level checks only). Nothing else: every other pair shares a page file, a catalogue, the context, or the database.

## Security Domain

`security_enforcement` is not set in `.planning/config.json`, so it applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | unchanged |
| V3 Session Management | no | unchanged; no load returns a session (`yarn assert:no-session-in-loads`) |
| V4 Access Control | yes | the RPC's gate and its allow-list; server redirects decided on server-read data |
| V5 Input Validation | yes | the route's `servedEntityType` and `uuid` matchers; the adapter's parse of the RPC's `jsonb` |
| V6 Cryptography | no | — |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Any signed-in user reads any entity's unconfirmed nominations through the definer function | Information disclosure | the gate before any read; `NULL` for every refusal; pgTAP's three "not yours" cells with equal answers |
| The function returns a parent's unpublished columns | Information disclosure | an allow-list projection, never `to_jsonb(row)`; the key-set assertion |
| A parent's editor learns another party's name through its child (the `user_can` gate) | Information disclosure | the recommended gate; or the reach stated and tested if `user_can` is kept |
| The function distinguishes "does not exist" from "not yours" | Information disclosure | `NULL` for both, asserted equal |
| `created_by` leaves through the new read | Information disclosure | not projected; the key-set assertion |
| `anon` executes the function | Elevation of privilege | `REVOKE … FROM PUBLIC, anon`; `throws_ok` |
| A gate decided on something the browser supplies | Tampering | both loads decide on rows the server read in that request; they take `parent` and `params` and no `url` |
| A blocked page renders before a client redirect | Information disclosure (of an empty editor, to its own user) | server redirects; no client `$effect` redirect is added |
| An open redirect through the gate | Tampering | targets built by `buildRoute` from a route key and the two matched params |
| A stored name of a parent rendered as markup | Tampering | rendered as text; `getLocalized` degrades a non-string to `null` (Phase 175's research) |
| An entity with no nomination writes answers through the API | accepted, by design | NOM-07 is a navigation rule; no source asks the database to refuse it (stated under *The gate*) |
| A stale browser shows Preview open after an admin's change | — | the server refuses; the residual of RQ-1 (d) |

## Sources

### Primary (HIGH confidence) — the tree at `d8fb3af7a`, opened in this session

- Frontend: `ENTITY/+layout.server.ts`, `+layout.svelte`, `+page.svelte`, `contestantHome.helpers.ts`, `profile/+page.svelte`, `questions/+layout.svelte`, `questions/+page.svelte`, `questions/[questionId]/+page.svelte`, `preview/+page.svelte`; `(protected)/+layout.server.ts`, `+layout.svelte`, `gateFocus.svelte.test.ts` (header), the resolver's `+page.server.ts`; `routes/+layout.ts`, `routes/+layout.svelte`, `routes/contestant/+layout.svelte`; `contestantContext.svelte.ts`, `contestantUserDataState.svelte.ts`; `supabaseDataWriter.ts` (`_getEntityUserData`, `_getUserEntities`); `dataWriter.type.ts`, `dataTypes.ts`; `route.ts`, `buildRoute.ts`, `contestantHomeRoute.ts`, `routeConsistency.test.ts` (header); `params/contestantEntityPage.ts`; `ContestantNav.svelte`, `LogoutButton.svelte`, `NavItem.svelte` and `Button.svelte` (their disabled branches); `loginError.ts`, `signOutToLogin.ts`; `convertFilterValue.ts`, `questionRollup.ts`, `isValidResult.ts`; `ContactSupport.type.ts`; `app.html`; `messages/en/*.json`.
- Packages: `packages/data` — `dataRoot.ts` (`provideData`, `provideQuestionData`, `getElection`), `filter.ts`, `questionAndCategoryBase.ts`; `packages/dev-seed` — `supabaseAdminClient.ts` (`updateAppSettings`), `templates/e2e/base.ts` (the scan candidate's rows), `templates/e2e/perm/shared.ts`.
- Schema: `104-nominations.sql`, `503-entity-rpcs.sql`, `301-auth-functions.sql` (`user_can`, `is_child_nominee`, `caller_entity_ids`), `302-rls.sql` (the two read policies quoted), `011-validation-functions.sql` (`validate_nomination`, `enforce_nomination_confirmation`, `enforce_nomination_entity_columns`), `101-elections.sql` (column names).
- Harness: `tests/playwright.config.ts` (project names, teardown prefixes), `contestant-a11y.spec.ts` (the entry table), `contestant-journey.spec.ts` (steps 6, 11–15, 19, 19.5), `perm-answers-locked.spec.ts`, `perm-localisation-positive.spec.ts`, `contestantHomePage.fixture.ts`, `testIds.ts`, `contestantEntityUrl.ts`, `buildRoute.ts`, the E2E admin client's method list, `scripts/assert-a11y-scan-wiring.mjs` (header), three gate scripts' headers.
- Installed sources: `@sveltejs/kit` 2.70.3 `runtime/server/data/index.js` and `runtime/client/client.js`; `svelte` 5.57.1 `internal/client/reactivity/batch.js`.
- Measurements: the scratch app's two driver runs; read-only queries (`user_can`, `get_entity_basic_data`, the tables, under two claims); `results.json` and `devserver.log` of two kept runs; counts of the log line over the kept runs of Phases 169 to 174.
- Planning: `176-CONTEXT.md` whole; `v2.16-OPERATOR-DECISIONS-2026-10-08.md` §§ B, D, G; `ROADMAP.md` §§ 174.1 to 179; `REQUIREMENTS.md`; `STATE.md` (frontmatter, Current Position); the two todos named in the brief and three more.
- Skills: `components/context-reactivity.md` whole; `database/SKILL.md` (the census and regeneration passages); `spike-findings…/references/results-redraw.md` (the two invariants).

### Secondary (MEDIUM confidence) — Phase 175's planning, not on the tree

- `175-RESEARCH.md` whole; `175-08-PLAN.md` and `175-10-PLAN.md` (must-haves and the tasks quoted); the frontmatter of all twelve plans; `175-11-PLAN.md` (must-haves); `175-UI-SPEC.md` (headings and its lines on Phase 176). Read at `d8fb3af7a`; revised in the working tree since.

### Tertiary (LOW confidence)

- None. No web source was used: every question is about this tree or about installed sources, so the research-plan seam had nothing to route.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — nothing is added.
- Architecture: HIGH for the load behaviour (measured in a model on the installed versions, with the application's own E2E step named as the proof) and for the schema; MEDIUM for the task state's table, which waits on two rulings.
- Pitfalls: HIGH — each is a quoted line or a measurement, except those resting on A2 to A6.
- Validation: HIGH for the harness mechanism and where the scans can live; MEDIUM for anything named after a Phase 175 file.

**Research date:** 2026-10-08
**Valid until:** Phase 175's close. Every *175-plan* fact is re-read from 175's SUMMARYs then; the facts about today's tree hold until the next commit under `apps/` or `packages/`, which will be 175's first.
