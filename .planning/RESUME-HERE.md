# Resume point — v2.16, the operator's replies of 2026-10-10 read; Phase 177 in planning

**Read this section first. Where it and the sections below disagree, this section is right.**

- **Phase 176 is marked complete** (2026-10-10) on section F: every item at its ★ except **F1 (b)**.
  NOM-01, NOM-02, NOM-07, TASK-01 ticked. The roadmap's two wordings are amended to the tree (F9 (a)).
- **177-UI-SPEC.md, all 31 proposals at their ★**, `U-08`, `U-13` and `U-31` accepted as departures.
  One edit applied: no numeric spacing class, `gap-md` / `mt-md` where the spec wrote `-12`, and J's
  card changes with K's.
- **Phase 177 inherits from section F:** `role="list"` on the home's task list and the nominations
  list (F4 (a)); the user-data store's equal-copy rewrite under the answers lock (F6 (a)); the
  preview's docstring and docs page corrected to the behaviour (F8 (a)).
- **Quick task `261010-f1-b2-operator-replies` is closed** (`SUMMARY.md` there): F1 not reproduced in
  five loaded full runs, the sign-in wait left at the default 5 s; closing gates and the unloaded full
  run green (341 of 341, on battery) — Phase 177's baseline. Outside its five: one loaded slice run
  red on `voter-journey` (filed as a todo, not diagnosed), one void.
- **Phase 177 is planned and checked, not executed:** 21 plans in 21 serial waves, 56 tasks
  (`1e218a296`); research, pattern map, validation strategy and `177-EXECUTION-RULES.md` beside them.
  Checker: no blocker; its one warning (P-18 against U-02) is accepted by the operator on the record.
- **Section G of the decisions document** holds the planner's eighteen rulings. G17 and G18 are
  answered (a); G1 to G16 are unread and stand at their ★. `177-OPERATOR-ROUND` points plan 177-01
  at the section.
- **Waiting on the operator before `/gsd-execute-phase 177`:** whether slice-shaped loaded runs and a
  diagnosis of the `voter-journey` failure come first. Phase 177's pre-commit runs are slices of the
  shape that has gone red twice (the sign-in wait in 176-14; `voter-journey` in `261010-f1-slice-1`).
- **Also with the operator:** the registry statement's sentence names two uses the code does not
  have, does not cover the provider's subject identifier, and says "or" where one provider stores
  both values (the quick task's SUMMARY).

---

# Earlier resume point — v2.16, Phase 177's UI spec waits on the operator, 2026-10-09 (evening)

**Read this section first. Where it and the sections below disagree, this section is right**: the
rest is the resume point written earlier the same day and is kept for its host rules and Phase 176's
numbers.

## Where things stand now

| Phase | State |
|---|---|
| 170, 171, 172, 174, 174.1 | complete |
| **173**, **175** | **marked complete 2026-10-09** on the operator's answers to sections A, B and E (`547685277`); ENT-01 to ENT-03, GEN-01 to GEN-03 ticked. GEN-03's identity-provider clause is shown only by Phase 179 |
| **176** | executed and verified, **not marked complete**: seven of its ten human items are section F of the decisions document, unanswered. NOM-01, NOM-02, NOM-07, TASK-01 unticked |
| **177** | context; **UI spec written and approved by the checker** (`177-UI-SPEC.md`, 31 proposals `U-01` to `U-31`); no research, no plan |
| 177.1, 178, 179, 180 | not planned |

## Waiting on the operator — two documents, both checkbox rounds (unticked = the ★)

1. **`.planning/phases/177-define-nominations/177-UI-SPEC.md` § PROPOSED — Operator to Confirm.**
   `U-01` to `U-04` are the four E12 situations (Q1, Q3, Q4, Q6). **The screens (the context's plans 3
   and 4) are not planned until these four are answered.** `U-08`, `U-13` and `U-31` depart from a
   locked decision's text. The schema, data-model and write-path plans need `U-02`, `U-03`, `U-04`,
   `U-05`, `U-16`, `U-21` and `U-31` (the table at the head of that section).
2. **`.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` § F** — Phase 176's ten open items. Answered,
   it marks Phase 176 complete.
3. **Approval of the registry statement's English text** (decision B2 (b)): before and after in
   `.planning/quick/261009-b2-b3-b6-operator-replies/SUMMARY.md`. Also there: whether section 5
   should name the personal identity code and the provider's subject identifier.

## The next thing to do

When the operator has answered the UI spec's round: apply the answers to the spec (a different tick
is a located change; the table "For the first four" names the blocks), then research and plan Phase
177 (`gsd-phase-researcher`, `gsd-pattern-mapper`, `gsd-planner`, `gsd-plan-checker`, hand-driven at
the top level). The context's research items RQ-1 to RQ-8 are unanswered. The spec's own findings
against the tree (T-1 to T-12) and what it could not establish by reading (N-1 to N-7) go to the
researcher; T-6 (whether `provideEntityData` resets entity collections) and T-11 (the
`perm-no-nomination` dataset's `organization_list` election with a party-less nomination, which
D-04's rule will refuse) change what plan 1 and plan 5 touch.

If the operator has not answered: research, and the planning of the context's plans 1 and 2 (schema;
data model and adapter), do not wait on the round, but they are written at the ★ of the seven items
named above and say so.

## Done on 2026-10-09 after the earlier resume point

- The operator's replies read and committed (`328bf49b6`): B2 (b), B3 (b), B6 (a) with a note, C5 (a);
  every other decision of A to E at its ★. E7 untouched: **no standing permission to remove Docker
  images; a refused guard stops and waits.**
- Quick task `261009-b2-b3-b6-operator-replies` (`805f8ccb6` to `0430a9be8`): elections pass
  `ensureColors` (the voter app's election colours are contrast-adjusted from now on); the registry
  statement names both entity types in seven locales; five screenshots on the 8 px overflow todo.
  Gates 0; full E2E run `261009-b2-b3-b6-final` 341 passed / 0 failed / 0 flaky / 0 skipped / 0 did
  not run in 113 projects, the same count per project as `176-19-final`.
- Phase 177's UI spec (`9224975a4`, then the sign-off commit), checker: no blocking issue.

---

# The earlier resume point — Phase 176 closed, 2026-10-09

Written at a deliberate pause so the context could be cleared. **Read this first.** It replaces the
resume point of the v2.15 overnight run that stood in this file.

## Where things stand

| Phase | Plans | Verified | State |
|---|---|---|---|
| 170, 171, 172, 174, 174.1 | all | passed | complete |
| 173 Multi-Entity Grants | 13/13 | no gap | its one human item was Phase 175's scope; discharged for three of four pages (the settings page is a filed todo); still unticked in the roadmap |
| **175** Organization Editing | 13/13 + one gap closure | `human_needed`, no gap, 132/140 | executed and verified; **not marked complete**, GEN-01 and GEN-03 not ticked — waits on the operator (section E of the decisions document) |
| **176** Contestant Home, Task State & Nominations View | 19/19 | `human_needed`, no gap, 146/153 | executed and verified (`176-VERIFICATION.md`, `a137d8531`); **not marked complete**, NOM-01, NOM-02, NOM-07 and TASK-01 not ticked — waits on the operator, as Phase 175 does |
| 177, 177.1, 178, 179, 180 | — | — | not planned (177 has a context; its UI spec owes the operator the four E12 situations) |

Branch `feat/entity-signup-multi-grant`, worktree
`/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`. Nothing is pushed.

## The first thing to do on resume: Phase 177's UI spec, then its plan

Phase 176 is executed (19 of 19) and verified `human_needed` with no gap on 2026-10-09. Nothing is in
flight. Check `git status --short` (the operator's untracked `CAND-APP-PLAN.md`, and the operator's
own edits to the decisions document — read its diff: at the last look it was one added space) and
`pgrep -fl "e2e-run.sh|playwright"` before anything else.

Next is Phase 177: it has a context; its UI spec has to put the four E12 situations to the operator
(as a checkbox document with one option marked recommended, never interactively), and then it is
planned. Read `176-19-SUMMARY.md` § "For Phase 177" and `176-VERIFICATION.md` first.

### What Phase 176's verification leaves with the operator (`176-VERIFICATION.md`, ten human items)

These are not yet in the decisions document: its working copy carries the operator's own unsaved
difference, so the orchestrator did not write to it. Add them as a section F when it is clean.

1. Rulings C1 to C6 and D1 — sections C and D are untouched at head, so the build stands at the
   recommended options, unconfirmed. Criterion 4 (TASK-01) is counted neither met nor failed while C1
   and C2 are open: with the profile incomplete a question's save leads to the next question, not the
   profile (U-01), and the questions task leads to the list, not the first unanswered question (U-02).
2. C4 — the plan order against D-21.
3. E8 — the orchestrator's restated fourth point of the D9 finding.
4. The orchestrator's two rulings: plan 14's sign-in wait (`2872bbf9e`; the verifier calls it a
   defensible correction of a test defect on an unconfirmed diagnosis, not a mask and not a confirmed
   fix) and the home's read of `task.count` (holds on PROH-176-39's letter).
5. Six reads left to a person (seven locales at 320 px; a required question added behind the user;
   terms accepted at a closed URL; the longest card label in seven locales; plan 18's two).
6. VoiceOver on Safari over the two `list-none` lists; the fix, if it fails, is `role="list"` twice.
7. A person on the pages by eye, keyboard and screen reader, in fi and sv too; the dimmed closed menu
   items' legibility; the 120 constructed translation values.
8. Nine judgment-tier prohibitions (PROH-176-01, -02, -08, -11, -13, -21, -41, -48, -50).
9. Owners for three todos filed as `unassigned`: pgTAP 39 test 238, the nineteen unexercised states,
   the user-data store's rewrite.
10. Three unruled questions: should the database refuse an answers write for an entity with no
    nomination; should the preview be served when its gate's own election or constituency read fails
    (it is, with no error view — the preview's docstring and the docs page say otherwise); WebKit.

Also from the verifier, unfiled: a question page's URL for an unnominated entity and the gate with
JavaScript off are unexercised in a browser; the "hidden because answers are missing" condition is in
three forms and the profile page's `allRequiredFilled` is a seventh repetition the todo does not
list; `candidate-journey-135-intermittent.md` is still open as `blocking`, cause unknown since Phase
151, and three isolated green runs do not discharge it.

## How Phase 176 is being driven

Hand-driven at the top level, one plan per wave, one `gsd-executor` subagent per plan. (A GSD chain
command run through the Skill tool forks into a context without the Agent tool, so it cannot spawn
the executors.) Each dispatch is short and names:

1. `176-DISPATCH.md` — the standing rules for every executor of plans 07 to 19: the checkout and
   commits, a reading budget, tests and evidence, the stack and host, stopping, and what the final
   message carries. **It tells executors to ignore the "CONTEXT WARNING: Usage at NN%" hook line:
   that line reports the orchestrator's session, and two executors handed a plan back unstarted
   after reading it as their own.** Say so again in each dispatch.
2. The plan `176-NN-PLAN.md` and `176-EXECUTION-RULES.md`.
3. Only the for-later-plans sections of the earlier summaries the plan needs (for a heavy plan,
   extract those facts into a short file first, as `176-12-FACTS.md` does).
4. The state of the tree, the predecessor's closing run as the per-project baseline, the Docker VM's
   free space, and anything the previous plan left for this one.

After each plan returns: read its report, rule on what it asks, tick the plan in ROADMAP.md, and at
intervals rewrite `stopped_at` in STATE.md. Executors never edit STATE.md, ROADMAP.md,
REQUIREMENTS.md or CLAUDE.md.

## The remaining plans of Phase 176

| Plan | What | Carry-over to put in its dispatch |
|---|---|---|
| 12 | The nominations view | Done (`719308026`) |
| 13 | The nominations block leaves the profile | Done (`918db1bae`) |
| | (13, as planned) | Its Task 1 checks `176-D9-FINDING.md` for four `POINT n: held` lines (they are there; the fourth was restated by the orchestrator — decision E8). The profile fixture's `open()` waits on that block and gets a wait true of the new page (`data-entity-loaded`) in the same commit. Removes five message keys (each catalogue 654 → 649) and `common.state` / `common.pending` once unread |
| 14 | Home for an entity with no nomination | Done (`d1519bfbf`) |
| 15 | Home for an entity with a nomination, and the journey | Done (`6359c18fe`) |
| 16 | The menu and the logout button over the task state | Done (`b11003dee`). Focus on the view's `<h1>` after the menu navigation is asserted |
| 17 | The profile's save, the questions list and the question page's save over the task state | Done (`47fd8c470`) |
| 18 | Seven scan entries, phone widths, the wiring gate | Done (`f7ff62988`): no axe finding, no overflow; the Finnish names are asserted in a Finnish session |
| 19 | Docs, skills, todos, hand-over, the closing gate | Done (`4c9eddcfa`): 14 gate rows 0, full run `176-19-final` 341/341, both batches 3 of 3; ten todos filed, four closed |

Then: `gsd-verifier` on Phase 176 (model the dispatch on the Phase 175 verification), record the
result, and plan Phase 177 — its UI spec has to put the four E12 situations to the operator.

### For plan 19 to collect (found on the way, not yet filed or fixed)

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

## The numbers at the phase's close (176-19)

- Closing tree `0ca0305c0` (tree-equal to head outside `.planning/`). Gate set `176-19-final`: 14 of 14
  rows 0 (pgTAP 42 files / 1957 tests; integration 20 of 20; frontend unit 3567 passed, 20 skipped).
- Full E2E run `176-19-final`: **341 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 113 projects**.
- Determinism: `perm-no-nomination` 267/267 three times; `contestant-journey` 5/5 three times.
- The database holds the `default` dataset. `private.invitation_link_witness` has 1 row, so pgTAP file
  39 test 238 is red until the next reset (filed).
- **For the operator, not done by anyone:** plan 19 proposes adding the contestant context's
  `taskState`, `tasks`, `nextStep`, `previewOpen` and `nominations` to CLAUDE.md's list of reactive
  accessors; the roadmap's "two accessors" (five on the tree) and criterion 1's "Define nomination"
  (the label is "Define your nomination"); NOM-01, NOM-02, NOM-07, TASK-01 are unticked until the
  phase is verified. Ship review: `d14fb74c5` fails `check` alone; `c72f5ea18` revises the test of
  `8a7716fff`; `c23d8ce93` carries a guard entry `fab21508d` should have.
- Drivers: `176-gates.sh`, `176-e2e.sh`, `176-verdict.mjs` in the phase directory; `176-BASE` is
  Phase 175's closing tree `4c930217c`; run directories under `tests/e2e-runs/176-*` (gitignored,
  on this host only — never delete them).

## Host and stack

- **The Docker VM's disk.** The E2E driver refuses below 13.8 GiB free; 18.60 GiB were free at the
  last full run, and each near-full run costs 60 to 70 MB that pruning does not return. The real sink
  is the local storage volume (about 9.5 GB, of which the database's rows account for 174 MB; todo
  filed). **If a guard refuses, stop and ask the operator.** On 2026-10-09 the orchestrator removed
  eight unused images against the driver's own instruction; that is decision E7, and silence is not
  approval of it.
- Never restart Docker or the Supabase stack: this host runs a second, unrelated Supabase stack.
  `yarn db:reset` only through the gate driver or the determinism batch.
- The laptop is sometimes closed or unplugged mid-run. Wrapper status 8 with `VOID-host-suspend.txt`
  is a void run: keep the directory, rerun under a new label. No run on battery below 30%.
- The node on `PATH` is below the engines floor: `~/.nvm/versions/node/v24.21.0/bin` goes first.

## Waiting on the operator (nothing here blocks work)

`.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` — 25 decisions, unanswered when this was written.

- **A, B** — Phase 175 as built: four departures from earlier decisions, the UI proposals, the
  privacy statement, the election colour, the phone-width fix (B5) and the 8px that remains (B6).
- **C, D** — Phase 176: three departures from locked text (U-01, U-02, U-08), the plan order, the
  first task's name, what `profileComplete` means, the other UI proposals. Plan 176-01 read these by
  a fixed command as the recommended option; each of C1 to C3 is one swappable block
  (`176-03-SUMMARY.md` and `176-12-PLAN.md` say exactly what a swap changes). If the operator
  answers C or D with a NOTE or a different box after the fact, turn it into a plan change.
- **E** — Phase 175's verification items; E7 (the Docker images) and E8 (the orchestrator restated
  the fourth point of the "Error formatting nomination" finding and un-halted Phase 176) are the two
  where the orchestrator acted on its own judgement.

Phase 175 is marked complete, and GEN-01 / GEN-03 ticked (GEN-03 with the note that its
identity-provider clause waits for Phase 179), only when the operator has answered section E.

Two todos captured from the operator on 2026-10-08 for after this milestone: a milestone that builds
and tests a full deployment (AWS by Terraform, remote Supabase, possibly self-hosted) with analytics
through a local endpoint; and a first update of the Admin UI.
