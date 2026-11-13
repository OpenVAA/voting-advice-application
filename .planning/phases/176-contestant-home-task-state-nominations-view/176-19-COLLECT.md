# Plan 176-19 — what the phase left to collect, file or hand over

Assembled by the orchestrator. Part 1 is the orchestrator's own list, kept while plans 07 to 18 ran. Part 2 holds, verbatim, the sections of the summaries of plans 12 to 18 addressed to plan 19, to the phase's verification, and to Phases 177 and 179. Summaries 01 to 11 are not extracted here: read their sections for plan 19 and for later phases by heading. Where two entries disagree, the later plan wins. Every item here is either closed with a resolution, filed as a todo with an owner, or handed over in the summary — none is dropped.

## Part 1 — the orchestrator's list


- `39-invitations.test.sql` test 238 goes red on any database a full E2E run has touched: it counts
  `private.invitation_link_witness` whole and no teardown removes those rows. The gate driver resets
  first, so the gates are unaffected. File it.
- `inFreshContext` is duplicated word for word in the session setups of Phase 175's and Phase 176's
  datasets.
- The Danish nominations description says "parti eller valgkreds" where the English says election
  list or election symbol; French "candidature" beside "nomination", Swedish "Kontakta supporten"
  beside "Kontakta support": add to the native-review todo with the 120 constructed sentences of
  plan 04.
- Three docs pages still describe the removed no-nomination sign-out (`entity-selection`,
  `login-and-password-reset`, `pre-registration-and-invitation` under the contestant-app docs).
- Stale generated component pages (`ContactSupport`, the new `NotEditableNote`, and whatever plans
  12 to 17 touch); the components skill's counts; the database skill's counts (42 pgTAP files, 1957
  tests, the authenticated census at 9).
- Plan 10 once saw no first-level heading on the preview within 5 s after an in-app navigation; not
  investigated.
- No HTTP-level assertion of the gate's 307, and none of "no frame of the closed page painted".
- Plan 14 raised the sign-in helper's wait for the URL to leave the login page from the default 5 s
  to `TIMEOUTS.slowPage` (`2872bbf9e`) after the run `176-14-precommit` went red on it (1 failed, 181
  did not run) under a host load average near 30 from other sessions. **The diagnosis is
  unconfirmed**: one trace and timings, not reproduced, and the rerun was fast enough to pass without
  the change. The orchestrator accepted it as consistent with the helper's next wait. Record it so.
- Plan 13's red-test commit `d14fb74c5` fails `check` on its own (a test constant lacked
  `customData`; fixed in the next commit).
- Untested question from plan 14: WebKit drops list semantics for `list-style: none` lists without
  `role="list"` — would touch the home's `<ol>` and the nominations view's `<ul>`. For plan 18 to test.
- `contestant-home-task-badge` (`testIds.contestant.home.taskBadge`) is not in the UI spec's locator list.
- Todos closable: `2026-10-06-173-nomination-format-error-logged-in-every-run.md` (plan 13 deleted the
  logger; 0 lines in the closing run); `2026-05-31-display-nominating-org-in-candidate-profile-nominations.md`
  names the removed block.
- Plan 15: the home reads `task.count` to choose the answers-locked note's second sentence (accepted
  by the orchestrator as outside PROH-176-39's letter; the alternative is a task-state member); an
  entity with an empty name is greeted "Hello, !"; the greeting of a long party name at 320 px is not
  measured; which state the `cand-home` scan lands on is not established (plan 18).
- Plan 16: the reason rule is written twice (the home's page and the menu); the 176-07 `<e2e_plan>`
  names a `logout:` title prefix where the tests are titled `holds:`; which state the
  `contestant-nav-menu` scan lands on is not established, and the reason line at 320 px is unmeasured
  (plan 18). The menu's list has explicit roles, so the WebKit question does not touch it.
- The host is shared: its load average passed 100 on 2026-10-09. Each dispatch since plan 15 tells
  the executor to wait for a 1-minute load at or below 20 before an E2E run or gate set.
- Plan 17, for Phase 177: the context exposes no `entityKnown`, combined `questionsReady` or
  `requiredNameMissing`, so the profile page and the question page each rebuild "the state with my
  draft" by inference, twice. An accessor for the task state's input would remove both. Also untested:
  an edit of an answered question with none unanswered and the profile incomplete; the profile's label
  under a missing required name; the list's buttons in a state that is not known.
- Plan 17 changed what a user meets: the save of the last unanswered question leads to the profile
  while it is incomplete and to the home otherwise (was the list), and a question's button reads
  "Save and Continue" whenever another question is unanswered. Docs pages may describe the old path.
- Filed already: the user-data store rewriting `current` under the answers lock
  (`todos/pending/2026-10-09-176-user-data-store-…`).

- Plan 18: the suite has no WebKit or Firefox project. The home's `<ol class="… list-none …" aria-label=…>` and the nominations view's `<ul class="… list-none …">` are styled `list-style: none` and carry no `role="list"`; WebKit is said to drop list semantics for such lists. Unverified on this host. File it as a todo for the operator's decision (adding the role trips Svelte's redundant-role warning, so it is a design choice, not a mechanical fix); do not change the markup.
- Plan 18: how axe classified the closed menu items for contrast (passed, incomplete or not applicable) is not recorded, since the gate attaches violations only; the state the `contestant-nav-menu` scan lands on is inferred, not asserted (`navMenu.expectReasonLine(null)` would pin it); no locale but English at phone width and no Finnish page scanned; a party name of one unbroken word is unmeasured; the summary of plan 18 lists seven reads left to a person.
- Plan 18 changed two files outside its list for the Finnish names: `tests/tests/utils/permNoNominationData.ts` and `packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts`. `buildRoute`'s `locale` parameter fills a segment no route id holds (found by plan 18's red run): check whether that parameter has any working caller, and file it if it is dead.
- The numbers to correct docs and skills against, at `176-18-close`: full E2E run 341 passed in 113 projects (`perm-no-nomination` 68, `contestant-a11y-scan` 24); a one-project run of `perm-no-nomination` 267 tests; frontend unit 3567 passed, 20 skipped, 193 files; each message catalogue 649 keys. Derive every count you write at run time; these are for comparison only.

## Part 2 — verbatim from the summaries of plans 12 to 18

### 176-12 — For Phase 177

- **Where the Edit action and the unlocked branch go.** The view has two bodies behind `viewState` and one `note` snippet behind `locked`. An editor's entry belongs in the listed body's card (per nomination) or in `primaryActions`, and an "add" in the empty body, each inside `{#if !locked}`; today the only `!locked` branch is the body's `ContactSupport`. `expectNoEditAction()` and the component case "holds no form control, no edit action…" assert today's absence and must change with it.
- **The condition the note follows.** `contestantCtx.nominationsLocked` alone — the setting `access.nominationsLocked`. What widens it is a second reason: one more member of the note's `reason` union and one more entry of its `REASON_MESSAGE`, and the condition in the `note` snippet.
- **How the button's label is decided.** By `nominationsViewTarget(taskState).continues`: `false` for an entity with no nomination, because the next step is the nomination itself and the user cannot act on it here. What makes the no-nomination button a Continue is the user being able to add a nomination on this page: then `nominationsViewTarget` stops returning home for `next.task === 'nomination'`, or the page offers the add action in place of the button.
- **The view reads the list of the entity's last load.** `contestantCtx.nominations` is page data, not the store: after a write the load must rerun (`invalidateAll`, or a navigation that reruns the entity layout's load) for the cards, the state attribute and the task state's has-a-nomination to follow.
- `custom_data` (the requested-party text) and `electionRound` reach the page in each `EntityNomination` and are not rendered.


### 176-13 — For plan 176-19

- **Docs mentions of what this plan removed: none found.** `git grep -n -e "common\.state" -e "common\.pending" -e "basicInfo\.nominations" -e "Error formatting nomination" -- apps/docs docs README.md tests/README.md` prints nothing, and no page under `apps/docs/src` describes a nominations section on the profile or names `contestant-profile-nominations`.
- **`.planning/todos/pending/2026-10-06-173-nomination-format-error-logged-in-every-run.md`** can be closed on this plan: the logger is deleted, and `176-13-close` holds the line 0 times against 47 in the phase's baseline. Its resolution text is in `176-01-SUMMARY.md` § *For plan 176-19*, to be read with the finding's restated fourth point.
- **`.planning/todos/pending/2026-05-31-display-nominating-org-in-candidate-profile-nominations.md`** names the block this plan removed. The nominations view shows the party a candidate is nominated under, and the journey now asserts it in a browser.
- **The store's defect the finding filed** (an equal copy of `userData.current` written on every run of the answers-lock effect) is untouched and has one visible symptom fewer.


### 176-13 — For Phase 177

- The profile holds nothing of the entity's nominations and links to nothing about them. An editor for nominations belongs on the nominations view (see `176-12-SUMMARY.md` § *For Phase 177*).
- `userData.current.nominations` is still filled by the entity layout and no page reads it: its readers are the contestant context's derivations of the entity's elections and constituencies. A write to a nomination has to reach both that list and the page data the view renders.


### 176-15 — For plan 176-19

- The docs hold nothing of the home's helper or of the fixture's removed step (searched).
- The `home:` prefix in `perm-no-nomination.spec.ts` now covers six tests: three of an entity with no nomination and three whose titles begin `home: with`.
- **Counts:** a one-project run of `perm-no-nomination` is 226 tests, 29 its own; the full run is 300 in 113 projects; the frontend unit suite is 3530 passed and 20 skipped; each message catalogue still holds 649 keys — every message the page reads was already there.


### 176-15 — For Phase 177

**What the nomination row's label and target are decided by.** Both come from `$lib/contestant/tasks/taskState.ts`, not from the page:

- **The label** — `taskLabelKey(task, answersLocked)`: for the nomination task, `contestantApp.home.nomination.view` ("View your nominations") when its status is `complete` and `contestantApp.home.nomination.enter` ("Define your nomination") otherwise. Neither the answers lock nor the nominations lock is read for it.
- **The status** — `taskStateOf`: `complete` when the entity has at least one nomination, confirmed or not (`hasNomination`, read from page data); `incomplete` otherwise. It is never blocked and never without a status once the entity is known.
- **The target** — the task's `route`, `{ route: 'ContestantAppNominations' }` in every state, which the page hands to `getRoute.current`.
- **The main action** names the nomination only while it is the first incomplete task; its label is the row's.

A phase that lets a user define a nomination changes what the view at that route offers; the row, its label keys and its target need no change for that. A label for "a nomination is defined and awaits confirmation" would be a new branch in `taskLabelKey`.


### 176-15 — For Phase 179

**The home as built, and the slots of its frame.** `MainContent` gives the page four places; the page fills them so:

| Slot of `MainContent` | What the home puts there | When |
|---|---|---|
| `note` — a wrapper with `role="note"`, above the hero and the title, centred, `text-secondary`, `max-w-xl` | `NotEditableNote reason="answersLocked"` with an optional second sentence and one Contact support button | only while answers are locked; the wrapper is rendered empty otherwise |
| `hero` | the success emoji in a `<figure role="presentation">` | only when every task is complete |
| the title | one `<h1 tabindex="-1">`: the greeting, or the ready title | always |
| the default content, a centred column of `max-w-xl` | in order: the explanation; the tip; the task list `<ol>`; the preview entry; the reason sentence | the explanation and the reason by state, as above |
| `primaryActions` | the main action, and the logout button under it | always |

There is no slot for a reminder about an unconfirmed address, and none was built. The `note` slot holds one thing, the lock note, and its wrapper is one `role="note"` region: a second note placed in it would share the region and precede the title in reading order. The places in the default content are, top to bottom, between the title and the explanation, between the explanation (or the tip) and the list, and under the reason sentence; the list, the preview entry and the reason sentence belong together, since the reason is the description of the entries above it. The title does not name the entity once every task is complete.


### 176-16 — For plan 176-19

- **Counts:** a one-project run of `perm-no-nomination` is 233 tests, 36 its own; the full run is 307 in 113 projects; the frontend unit suite is 3542 passed and 20 skipped in 192 files; no message was added, so each catalogue still holds 649 keys.
- **The `menu:` prefix** exists in `perm-no-nomination.spec.ts` with five tests, and the spec's header names it and says that a test that logs out signs in first. The two logout tests are `holds:` tests; nothing is titled `logout:`.
- **The reason rule is written twice**, in the home's page and in the menu (the checklist's "no repeated code" row). A shared function over the task state, given the sentence keys, would close it; no plan owns that.
- The docs hold nothing of the menu's ids or of the logout rule (searched `apps/docs/src` for `contestant-nav`, `logout modal` and `LogoutButton`).
- D-20's todo on the journey's two logout steps: step 7 held in control B, and both held in the pre-commit run and the full run. The todo closes on plan 176-19's three isolated runs of the journey.


### 176-17 — For Phase 177

**The form in which a new Continue reads the state.**

- *A button that saves nothing* (the home, the list, the nominations view): one derived value, `const target = $derived(theFunction(contestantCtx.taskState))`, and `href={getRoute.current(target.route)}`.
- *A button that saves first* (the profile, a question, the editor to come): two reads of one function.
  - **Label:** a `$derived.by` that returns `theFunction(taskStateOf({...}))` with the inputs the draft changes counted as saved; `continues` picks between the "continue" and the "return" pair of messages. While `contestantCtx.taskState.known` is false, ask the saved state itself and build nothing.
  - **Target:** in the submit handler, after the save has returned success, `goto(getRoute.current(theFunction(contestantCtx.taskState, facts).route))`. Any fact the save itself changes is copied into a plain local **before** `await userData.save()`. A save that fails reads nothing.
- **The functions the five buttons call:** `homeAction`, `profileSaveTarget`, `questionsResumeRoute`, `questionSaveTarget`, `nominationsViewTarget`, all in `$lib/contestant/tasks`.
- **A gap to close before a third saving button is written.** The context does not expose `entityKnown`, the combined `questionsReady` or `requiredNameMissing`, so each saving page infers them (above). An accessor that hands out the state's input — or a context method `taskStateWith(overrides)` — would remove the inference and the block the two pages now repeat. No plan of this phase owns it.
- An editor that defines a nomination completes the nomination task at once (`hasNomination` counts an unconfirmed one), so its "after the save" state has the profile as the next step.


### 176-17 — For plan 176-19

- **Counts:** a one-project run of `perm-no-nomination` is 238 tests, 41 its own; the full run is 312 in 113 projects; the frontend unit suite is 3567 passed and 20 skipped in 193 files; no message was added, so each catalogue still holds 649 keys.
- **The `continue:` prefix** exists in `perm-no-nomination.spec.ts` with two tests, and the spec's header names it and says which three `holds:` tests are about where a save leads.
- **The journey's step 19 no longer loads the home**: it asserts the URL after the last save and reads the task list from the application's own state. Step 12 still opens the nominations view by URL and loads the home again.
- **Two rules are still written twice:** the reason rule (home and menu, plan 16's note) and the prospective state (profile and question page, this plan).
- The docs hold nothing of where a save leads.


### 176-18 — For plan 176-19

**The reads the UI contract leaves to a person, for the todo it files:**

1. **Row labels, reason sentences, the note and the empty sentence in the six other locales at 320 px**, on the home, in the menu and on the nominations view: no clipping and no overlap. This plan measured English alone.
2. **Card labels in seven locales at 320 px**: the longest, "Numéro du·de la candidat·e", wraps above its value.
3. **The greeting with a long party name** is now measured in English at 320 and 390 px. What is left to a person is the same greeting in the other locales, and a name made of one unbroken word, which this plan did not try.
4. **Focus after accepting the terms of use at a closed URL** (on the home's `<h1>`, not on `<body>`).
5. **An entry the browser shows open and the server has closed**, after an administrator's change: the user lands on the home with nothing said.
6. **List semantics on WebKit with VoiceOver**: whether the home's `<ol>` and the nominations view's `<ul>`, both `list-style: none` and neither with `role="list"`, are announced as lists. The suite has no WebKit project.
7. **How a closed menu item's contrast is classified by axe** (`!text-neutral/20` on `bg-base-100`): passed, incomplete or not applicable. The gate shows only that it is not a violation.

**Facts for the final run:**

- The baseline is `176-18-close`: 341 tests, 113 projects; `perm-no-nomination` 68, `contestant-a11y-scan` 24.
- `contestant-nav-menu`'s reach does not assert its state. One line would pin it (`navMenu.expectReasonLine(null)` after the menu opens); it was left because the plan names only `cand-home`'s reach.
- The scans run at 1280 × 720. The phone tests measure widths and run no axe scan.


### 176-18 — For the phase's verification

- **Each scan entry, its marker and its state** are in *The seven entries* above; each scan's `reach-proof-<entry>.json`, `raw-i18n-keys-<entry>.json` and `axe-violations-<entry>.json` are attached to its test in `tests/e2e-runs/176-e2e/176-18-close/results.json`.
- **Each width measured**: 320 × 568 and 390 × 844, seven tests at each, in *The phone-width tests* above.
- **The lock**: every reach and test that turns it on is followed by a full load; the scan describe restores it in an `afterEach`, the two phone tests in a `finally`.
- **Counts pinned by the verdict**: `contestant-a11y-scan` = its plan-17 total + 2; 12 titles holding `axe accessibility scan` in `perm-no-nomination`.

