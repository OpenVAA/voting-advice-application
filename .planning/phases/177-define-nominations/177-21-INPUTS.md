# Phase 177 — what the earlier plans left for plan 177-21

Kept by the orchestrator from the executors' reports. Each item is a sentence made false by the phase, or
a finding to file, that no earlier plan owned. Plan 177-21's executor reads this file whole and re-derives
every item on the tree before acting: the summaries named are the source.

## Sentences made false (docs and skills)

- `.claude/skills/database/SKILL.md` — the `election_type` default and "three nomination flows"; the pgTAP
  file and test counts; "107 RLS policies (92 in public…)" in five places; § 6's three policies that hold
  the lock; § 7's description of `validate_nomination`; § 8's trigger list; the private-helper list; the
  definer census ("nine names"); the nominations read's parent ("three keys"); no paragraph for
  `get_nomination_parent_options`. (177-02, 177-03, 177-04, 177-05, 177-06)
- `.claude/skills/database/schema-reference.md` — the `election_type` row; the new functions and the
  constraint trigger; the parent's keys; no row for `get_nomination_parent_options`. (177-02, 177-03, 177-06)
- `.claude/skills/database/rls-policy-map.md` — "107 policies: 92"; the lock paragraph's three policies;
  the `nominations` row lacks `entity_delete_nominations`; the `nomination.create_parent` matrix row shows
  "—" for the organization editor; `caller_nominated_in_contest` described with four arguments; no
  `nomination_id_in_contest`; the parent as a three-key allow-list; no row for pgTAP file 44. (177-04,
  177-05, 177-06)
- `apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md`, "Whom it binds" —
  "The three policies…" is four. (177-04)
- `apps/docs/…/developers-guide/backend/authentication/+page.md` — the role table's organization editor
  row lacks `nomination.create_parent`; the nominations read's parent keys; `get_nomination_parent_options`
  is not named. (177-05, 177-06)
- `177-RESEARCH.md` — the `%ROWTYPE` sketch of the deferred function does not apply on a fresh reset
  (177-03). `177-CONTEXT.md` D-09 says the parent-options gate is "holding `nomination.edit` on an entity
  in that project"; the gate built is the caller's editor grant on the named entity, so a project admin is
  refused (177-06). Planning records: note, do not rewrite.

## Findings to file as todos, unless a later plan of the phase closed them

- An entity editor's DELETE of a nomination reaches the definer trigger `cleanup_storage_on_delete`, which
  enqueues deletion of the objects in that nomination's folder; not exercised with an object present.
  (177-04)
- `get_nomination_parent_options`' `p_contests` has no length bound: each asked contest costs one
  definer-helper call per listed option. Not measured, no cap built. (177-06)
- `public.nomination_shape_rule` is callable over the API by `anon` and `authenticated`; it reads no table
  (the same exposure as `grant_role_permissions`). (177-03)
- The commit pair `a5f4229d9` / `d3981551e` of 177-03: the first holds a migration that does not apply to
  a fresh database. To squash when the branch ships.
- An alliance's editor holds `nomination.create_parent`, which no row type lets it use; and the faction
  pairing of the parent policy admits another organization's placeholder, not the faction's own
  organization's row (operator item G4; recorded at the end of the decisions document). (177-05)
- Roles no pgTAP fixture impersonates in the files this phase extended: faction and alliance editors,
  project editor, account and root admin. (177-03, 177-04, 177-05)

## Added after 177-07

- Sentences made false: the database skill's three files (pgTAP is 44 files and 2310 tests; no row for
  `set_entity_nominations` or pgTAP file 43); `104-nominations.sql`'s `custom_data` comment and rule 1 of
  `enforce_nomination_confirmation` speak of "a candidate", and an organization's nomination now carries
  the same key (source comments: correct them where they stand, under Comment Hygiene).
- To file: `p_nominations` of `set_entity_nominations` has no length bound. **`entity` is not held to the
  listed options** — a candidate that knows an unconfirmed organization's id in its project can link to
  it; the parent policy already admits the same direct insert (inferred, not asserted; put to the
  operator at the end of the decisions document). A move leaves the old contest's placeholder parent
  behind (for the cap's todo). Two saves in parallel are not tested (the backstop truth).
- Unasserted in pgTAP file 43, each marked inferred in 177-07's summary: `other` for an organization;
  `none` on a kept candidate row in an `organization_list` election; a project admin, project editor or
  the service role as caller; a placeholder created for a kept row under the lock; a move of a row whose
  custom data holds another key; a parent `entity_id` that names no entity or one of another project.
- **For 177-17 (the editor's prefill), observed:** `entity` compares by the nomination id that
  `private.nomination_id_in_contest` answers; if the named party holds several nominations at the
  contest and the row stands under another of them, `entity` repoints the row and unconfirms it. `keep`
  answers unchanged — an editor that has not changed a listed parent sends `keep`.

## Added after 177-08

- Sentences made false: `.claude/skills/database/schema-reference.md`, the `election_type` line of the
  column map ("the frontend adapter no longer maps this column onto any application property" — it maps
  to `ElectionData.nominationShape`); the data skill (`.claude/skills/data/`) does not know
  `nominationShape`, the new module or the README's comparison section.
- To file, from the comparison table's own "None" rows: the data package has no test of the `Nomination`
  constructor's "type and id together" refusal nor of `FactionNomination`'s "must have a parent" refusal;
  in pgTAP only the election half of "a child shares its parent's election, constituency and round" has
  an assertion that names it.

## Added after 177-09 and 177-10

- `tests/README.md`: the no-nomination link is said to sit "before `data-setup-perm-analytics-tracking`"
  (the new setup now stands there); "one of the two permutation datasets whose settings serve
  organizations" (three); the project tables have no row for the `perm-contestant-nominations` trio and
  there is no paragraph for the link; the `fixtures/contestant/` list lacks
  `perm-contestant-nominations.ts`. (177-10)
- The developers' guide and the skills do not mention `setEntityNominations`,
  `getNominationParentOptions`, the two named refusals or `EntityNominationParent.entityId`; item 5 of
  the writer's integration file header says a candidate reads the organization's "type and names" and
  it now also reads its id. (177-09)
- To file: a killed run that left an application-written nomination under a seeded one makes the next
  run's first `e2e-perm-` clear fail (read from the schema, not observed); the lasting fix is in the
  shared clear. (177-10)
- To file or note at ship: commits `527f271b6` to before `2ee846c45` of 177-09 do not pass `lint:check`
  on their own (inferred); `ae078b2d3` is a candidate for squashing into `ac90ca1ef`.
- State steps of the new dataset no test had run at 177-10's close: `setAnswers`, `setAnswersLocked`,
  `setNominationsLocked(true)`, `addNomination` with a parent, a symbol or confirmed. Check which the
  later plans' specs came to use.

## Added after 177-11

- `tests/README.md`, the paragraph on `tests/tests/fixtures/contestant/`: no nomination-editor fixture
  in the list; `contestantEntityHomePage.fixture.ts` now follows the main action;
  `contestantNominationsPage.fixture.ts` now has the Edit action and the support-button count.
- `177-UI-SPEC.md` (planning record: note, do not rewrite): the Fixtures-table row for the main-action
  step names `contestantHomePage.fixture.ts`, built on `contestantEntityHomePage`; S2's "Edit is a link
  named by its text" is on the tree an anchor with role button, as every `Button` with an `href` is —
  whether that is right for a navigation is a question about the component, to file.

## Added after 177-12

- `apps/docs/src/routes/(content)/developers-guide/contestant-app/home-and-tasks/+page.md`, § The note,
  and `apps/frontend/src/lib/contestant/components/README.md`, the `NotEditableNote` row: two reasons
  listed, there are three.
- The docblock of `scripts/assert-i18n-catalog-namespaces.mjs` gives 598 keys (161 / 121 / 316); it was
  704 (254 / 121 / 329) after 177-12 — re-derive at the close. Its floors still hold.
- **The native-reader todo:** 330 constructed values — the 55 new keys in each of da, et, fi, fr, lb and
  sv — none seen by a native reader. 177-12's summary holds the table of word choices per locale, the
  one translator's note followed only in part (et, `error.duplicateParent` against the legend), the two
  sentences bent away from the English so that nothing agrees with the parent's gender, the list of
  doubts for Luxembourgish, and the unchanged existing values a native reader may want to see.
- To note at ship: `90e054d92` fixes `4fe3d66a5` (lint and types of a test file) — a pair to squash.

## Added after 177-13

- `.claude/skills/components/context-reactivity.md` § 5: the "Canonical analog,
  `…/(voters)/elections/+page.svelte`" citation and its two-line excerpt no longer match (the derivation
  is a `$derived(…)` now) — re-anchor by content, not by line.
- `apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md`: the `$lib/routes` list
  names `impliedParams.ts` and not `selectionOrder.ts`.
- Comments in the voter's `elections/+page.svelte` (`handleSubmit`: "Prior implementation…", a spec's
  name and line) and `constituencies/+page.svelte` (the deferred target: "looping test 1", "in test 2")
  break Comment Hygiene; untouched by 177-13.
- To file: `mostSpecificConstituency` picks the constituency whose group has the fewest members, which
  for a regions-and-municipalities election is the region and not "the leaf" (behaviour kept and pinned;
  not observed in a browser); the rule "a throwing lookup counts as held" is written twice
  (`electionsHeldIn`, `getImpliedElectionIds`); two listing rules stay on the voter's pages and the
  contestant's pages write them again unless the module gains two functions.

## Added after 177-14

- `.claude/skills/components/SKILL.md`: convention 1's "104 files calling `$props()` and 104 co-located
  `*.type.ts`" (105 and 105 after 177-14); convention 3's "61 files in the three directories" (62); its
  "68 across all of `apps/frontend/src`" was not re-measured. Re-derive all three at the close.
- `177-UI-SPEC.md` S7 (planning record: note, do not rewrite): the control's block has the pointer
  defect `EntitySelector` fixed with `pointer-events-none`, and `detail?.(value)` where the component
  gives the snippet the chosen option.
- To file unless a later plan observed it: the selector's keyboard model, focus after a pointer choice,
  the row's fill and long names in the card were seen in no browser at 177-14's close; the group's
  accessible name holds the "Required" sentence while the mark is shown.
- To note at ship: `acb08e520` fixes `350c5c822` (a test helper's type; committed with the type check
  red), and `10ebe6b04` fixes `2e2e5306d` (the pointer defect) — pairs to squash.

## Added after 177-15

- 177-15's summary lists its own stale sentences: `177-UI-SPEC.md` T-8 and the `Input` row (`maxlength`
  is refused by the prop type and passed through a spread), and S9 / A4; the "resets the root's entity
  collections" docstring and `DataRoot`'s "Existing data will be reset" lines (`provideEntityData` is an
  upsert by id — RESEARCH T-6); the fixture's step-path constants; **no developers' guide page for the
  editor exists**.
- To file: the voter's three selection loads merge the settings without the build-time settings, where
  the application context and the editor's loads merge all three (found, not fixed).
- Check at the close which of these a later plan exercised in a browser; at 177-15's close only a
  candidate's path had been: a party's side, "Other" and its error, the card with no group, the failed
  options read, a failed save, the saving state, the limits of 50 and 100 as attributes, and
  start-from-constituency mode were unit cases only.
- The four stubs 177-15's summary names were not appended to the WINDOWS ledger.

## Added after 177-16

- `tests/playwright.config.ts`: `// Variant 4: perm-startfromcg (2 tests)` — six, and its setup stores a
  session.
- `ConstituencySelector.svelte`'s docstring on `useSingleGroup`: handed one election, it implies
  nothing (older than the phase; also serves a voter).
- Planning records (note, do not rewrite): `177-16-PLAN.md` ruling 3 and Task 1's criterion (one red
  and nine green in one run); `177-UI-SPEC.md` S5 (the sentence's markup has no role, *Focus and
  Announcements* has no row for it; the `useSingleGroup` prefill rule); `177-15-SUMMARY.md` Known Stubs
  row 4 (resolved).
- To file: what a screen reader announces for the constituency step's sentence was not observed, and
  the election step's hint has the same shape with no role — one ruling for both (also put to the
  operator); the elections address under the mode with a constituency holding no admissible election is
  served with an empty list and the hint (read, not opened; the UI cannot produce it); the shared
  selector's single-election behaviour for a voter was read, not tested; `fixtures/contestant/
  perm-startfromcg.ts` repeats two private helpers and `setElectionType` from the nominations root.

## Added after 177-17

- `.claude/skills/database/SKILL.md` and `177-07-SUMMARY.md`: pgTAP totals (2312), and "naming only the
  columns that differ" of the write function (it also states `confirmed` beside the custom data).
- `tests/playwright.config.ts`: any comment counting the tests of `perm-contestant-nominations` (24).
- Planning records (note, do not rewrite): `177-UI-SPEC.md` S4 and `177-17-PLAN.md` step 5 (Continue
  carrying stored constituencies — not built; a flat list cannot say which constituency belongs to
  which election), S6 (Keep is `aria-describedby` the removed line), S5 (the kept section's classes);
  `177-15-SUMMARY.md` (the guard's stub row; "A4 is false on this tree").
- To file: whether the two rules of `enforce_nomination_confirmation` should swap, so that a direct
  `UPDATE` adding a requested name to a confirmed row unconfirms it and is not refused (nothing in the
  application does that); 177-07's pgTAP only gave a name to rows already unconfirmed.
- In no browser at 177-17's close: the kept section; start-from-constituency mode for an entity with
  nominations; which of the two removal lines a card shows (component test only). Not observed: what a
  screen reader announces on Remove / Keep; the page staying mounted through the rerun after a save
  (177-18's component test is to pin it).

## Added after 177-18

- `apps/docs/…/contestant-app/home-and-tasks/+page.md`: "A button that saves asks twice … with a state
  built by `taskStateOf`" is not so for the editor; name `nominationsSaveAction` and
  `nominationsSaveTarget`.
- Close `.planning/todos/pending/2026-10-09-176-user-data-store-rewrites-current-on-every-run-of-the-answers-lock-effect.md`
  (fixed by `77ec7ba38`).
- Planning records (note, do not rewrite): `177-18-PLAN.md` ("seven E2E tests", `=7`, row 1 of the
  outcomes); `177-UI-SPEC.md` S8 ("The page computes its prospective state…"; the label table lacks
  rows for an unknown state and for a next step that is the nomination task) and S6 (Cancel as an
  anchor); `177-RESEARCH.md` A3 and A4 (closed; removing `await tick()` left every case green, so the
  tick is not what makes A3 hold); `177-15-` and `177-17-SUMMARY.md` (the two stubs resolved).
- To file: a save that is not stored whose re-read forwards to another editor step shows no message
  (read, not provoked); `tooManyPending` and `failed` are held by component cases alone; `stale:` and
  `closing:` were never seen red; A4 is observed for the entity layout only; the P-18 residue.
- Frontend unit count wherever stated: 4181 passed, 30 skipped.

## Added after 177-19

- `apps/docs/…/contestant-app/home-and-tasks/+page.md`: the task table's nomination row;
  `nominationsViewTarget(state)` (it also returns an `action`); "Nothing in the view can be edited";
  "With none it … offers a way to contact support"; the note's reasons listed as two and only "While
  `access.nominationsLocked` is on".
- `apps/docs/…/pre-registration-and-invitation/+page.md`: "The app has no page on which a user adds a
  nomination."
- `apps/docs/…/configuration/app-settings/+page.md`, the nominations lock: silent on the editor being
  closed and on the answers lock doing the same.
- Close todo `2026-10-09-176-list-semantics-…` (the two roles are in; its claim that the role trips
  `a11y_no_redundant_roles` did not hold). The unexercised-states todo: item 4 exercised by `holds:
  with no nomination under either lock…`, item 9 in part, item 11 not met.
- Planning records (note, do not rewrite): `177-19-PLAN.md` (`files_modified` lacks three files; the
  state table has no row for data without facts); `177-UI-SPEC.md` S2 (no `role="list"`; the note
  "while not editable"); `177-18-SUMMARY.md` ("no note under the answers lock alone").
- To file: the assertions after the first read of each `nominations-view:` test were never red in a
  browser; server-rendered states unchanged by hydration inferred; a possible frame between the load's
  rerun and the settings effect with `editable: false` and no note (inferred); a party under an
  alliance on the view; the view's seventh state (no lock, no facts, no sentence — unreachable).
- `generate:docs`, `validate:links`, the skill audits and `gsd_run windows append` have not been run
  since the editor was linked.
- Frontend unit count wherever stated: 4228 passed, 30 skipped.

## Added after 177-20

- `ElectionSelector.svelte` docstring, first sentence ("Display constituency selection inputs for
  elections" — it displays elections), and the generated page that repeats it.
- `.claude/skills/components/SKILL.md` convention 6 names one wrapping label where there are three.
- Todo `2026-10-07-174.1-daisyui-label-nowrap-…`: the selector's row has one user fewer.
- Planning records (note, do not rewrite): `177-20-PLAN.md` (eight entries, sixteen scans, fourteen
  phone tests, thirty-two; `files_modified`; ruling 1's "and no other"); `177-UI-SPEC.md` (eight new
  entries; the "—" rows for J6, the requested parent, `changed` and `hasCandidates`; "`ElectionSelector`
  … changed only if …"; N-1, N-5, N-6 as not established); `177-RESEARCH.md` N-5, N-6; the lists for
  177-20 in `177-18-` and `177-19-SUMMARY.md`.
- To file, as one todo on states of the phase's screens in no scan or measurement: copy the state table
  of `177-20-SUMMARY.md` (messages `tooManyPending` and `failed` have no fixture step; several pickers,
  the kept section and start-from-constituency states; moved card, unlisted parent, empty group).
- To file: the voter's election page and the pre-registration page with a long election name were not
  opened (the fix is in the shared component; inferred); a keyboard walk by a person, a screen reader,
  WebKit and the six other locales at 320 px were not observed; the visual baselines are to be read
  from CI evidence; no gate holds the route map current; in `177-20-planted-p1` the limits test timed
  out on the press of the "Other" row at both widths on a planted tree and was not diagnosed (the same
  press passes on the unplanted tree in every other run); the assertions 177-20 lists as not seen red.
