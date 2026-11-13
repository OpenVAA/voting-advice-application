---
created: 2026-10-11T00:00:00.000Z
title: Sentences of Phase 177's own planning records, and of the files an executor may not edit, that the phase made false — noted, not rewritten
area: Phase 177 / records
severity: minor
source: "177-21-INPUTS.md (every 'planning records: note, do not rewrite' item) and the § Sentences the work made false of the summaries of plans 177-02 to 177-20; filed by 177-21"
owner: the orchestrator, for CLAUDE.md, the roadmap, the state and the dispatch notes; nobody for the plans, the research and the UI contract, which stay as written
files:
  - CLAUDE.md
  - .planning/phases/177-define-nominations/177-UI-SPEC.md
  - .planning/phases/177-define-nominations/177-RESEARCH.md
  - .planning/phases/177-define-nominations/177-CONTEXT.md
  - .planning/ROADMAP.md
---

Older plans, their summaries, the research and the UI contract are records of what was known when they were written, and are not edited. This todo is where a reader of one of them finds what the tree does instead. The docs, the READMEs, the skills and the source comments were corrected by plan 177-21 and are not listed here.

## `CLAUDE.md` (the orchestrator's)

- It carries no count of policies or pgTAP assertions (searched). The skill listing an agent is shown is read from each skill's own description; the database skill's description said "107 RLS policies … a 1957-assertion pgTAP estate" and now says 108 and 2312.
- § *Context Destructuring Rule* lists the stable references as "`t`, `getRoute`, `darkMode`, `answers`, `userData`, the lifecycle functions". The contestant context's `setEntityNominations` and `getNominationParentOptions` are stable functions too. Not false; a candidate for one clause.
- § *Frontend (SvelteKit)*, Routing, names the Contestant App's protected routes and not the nomination editor's group. Not false.
- § *Backend (Supabase)* names the bulk import and delete RPCs and not the two nomination functions. Not false.

No sentence of `CLAUDE.md` was found to be false.

## `177-UI-SPEC.md`

- T-8 and the `Input` row of *Existing components reused unchanged*: `maxlength` "is passed as an attribute" — the prop type refuses it; the limits are passed through a spread.
- S2: the markup shows no `role="list"`; the note is described "while not editable" where the page reads the two locks; the six states have no row for data without facts; "Edit is a link named by its text" is on the tree an anchor with the role `button`.
- S4 and S5: Continue carrying stored constituencies is not built; the kept section's classes; the "no election here" sentence's markup has no role and *Focus and Announcements* no row for it; the `useSingleGroup` prefill rule preselects nothing in a picker over a group that does not hold the existing constituency.
- S6: Keep is `aria-describedby` the removed line; Cancel of the details step reads as an anchor and is a button.
- S7: the control's block has the pointer defect `EntitySelector` fixed with `pointer-events-none`, and `detail?.(value)` where the component gives the snippet the chosen option.
- S8: "The page computes its prospective state as the profile and the question page do" — it computes none; the label table has no row for a state that is not known nor for a next step that is the nomination task.
- S9 with research assumption A4: see `2026-10-11-177-small-rulings-and-loose-ends-the-plans-left-open.md` § 2.
- § *Axe Scan Entries*: "Eight new entries, sixteen scans" — thirteen and twenty-six; the "—" rows for J6, a card with a requested parent and the messages `changed` and `hasCandidates`; "`ElectionSelector` … changed only if …" — it changed; N-1, N-5 and N-6 as not established — measured.
- The Fixtures table's row for the main-action step names `contestantHomePage.fixture.ts`; it is built on `contestantEntityHomePage`.
- § *Locator Contract*: "those under the lock keep `'return'`, the others assert `'define'`" — the nominated candidate's `return` with nothing left stays too.

## `177-RESEARCH.md`

- § *Code Examples*: the `%ROWTYPE` sketch of the deferred function cannot be created in file 011, which is applied before the table exists; the function declares scalars.
- A3 and A4 as "still open because they need a browser"; N-1 as read and not run; N-5 and N-6 as open.
- RQ-3's status column was the documentation's; it is observed since plan 177-09.

## `177-CONTEXT.md`

- D-09: the parent-options gate is "holding `nomination.edit` on an entity in that project"; built is the caller's editor grant on the named entity.
- Facts 9 and 10 of its baseline describe the parent policy and the role matrix before plan 177-05.
- The sentence that a faction's editor "may create its organization's row" is not what the policy admits.

## The plans and their summaries

- `177-07-SUMMARY.md`: "naming only the columns that differ" of the write function — it also states `confirmed` wherever it writes the custom data (since 177-17); its pgTAP totals.
- `177-15-SUMMARY.md` and `177-17-SUMMARY.md`, *Known Stubs*: resolved by 177-16 to 177-18. `177-15`'s "A4 is false on this tree".
- `177-16-PLAN.md` ruling 3; `177-17-PLAN.md` step 5; `177-18-PLAN.md` ("seven E2E tests", `=7`, row 1 of the outcomes); `177-19-PLAN.md` (`files_modified`; the state table); `177-20-PLAN.md` (eight entries, sixteen scans, fourteen phone tests, thirty-two; ruling 1's "and no other").
- `177-18-SUMMARY.md`: "no note under the answers lock alone"; the lists for plan 177-20 in `177-18-` and `177-19-SUMMARY.md`.
- Each summary's pgTAP count, frontend unit count and test count of `perm-contestant-nominations` describes the tree at its own close: at the phase's close they are 44 files and 2312 tests, 4228 passed and 30 skipped, and 97.
- `177-21-PLAN.md`: "three commits" for Task 1 (five were made); `--expect-title-count "perm-contestant-nominations::axe accessibility scan=16"` (26); the determinism batch's command line as written (see `177-21-SUMMARY.md`).

## The roadmap, the state and the requirements

What should go into them is in `177-21-SUMMARY.md` § *What should go into the files I did not edit*; no sentence of them was edited by an executor.
