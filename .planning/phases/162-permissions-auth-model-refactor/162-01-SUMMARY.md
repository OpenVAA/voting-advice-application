---
phase: 162-permissions-auth-model-refactor
plan: 01
subsystem: database
tags: [rls, permissions, grants, postgres, supabase, spec]

# Dependency graph
requires:
  - phase: 162 planning artefacts
    provides: "162-IMPLEMENTATION-BRIEF.md §§ 3.1-3.4 (canonical enum and matrix), 162-CONTEXT.md D-01…D-31, 162-CHECKPOINT-DECISIONS.md § S-1"
provides:
  - "162-SPEC.md — the phase's single normative reference, ten numbered sections"
  - "§ 4: the normative 23-member permission enumeration (the verb of user_can)"
  - "§ 5: the 23 x 7 role x permission matrix, all 161 cells stated"
  - "§ 6: K4's level-1 definition — ProjectEditor as ProjectAdmin minus three named permissions"
  - "§ 7: public read as a three-clause conjunction including the entity-confirmation conjunct"
  - "§ 2: the three PRESHIP-02 criterion amendments (1, 4, 6), each with its authority named"
  - "§ 8: five probed edges resolved or flagged; § 9: four phase-wide prohibitions"
affects: [162-02, 162-02b, 162-03, 162-04, 162-05, 162-06, 162-07, 162-07b, 162-08, 162-09, 162-10, 162-11, 162-12, 162-13, 162-14, 162-15, 162-16, 162-17]

# Actuals (#2632) — estimateTokens scale (chars/4 over the realized diff)
actuals:
  tokens: 7294
  tasks: 4
  commits: 3
plan_head_before: 6e98ce9f3d074c895fbd4027fceba7f2e4dacabf

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Structural content gates over prettier: every gate prints the population it counted before judging it (DR-4 — .prettierignore:37 makes prettier --check vacuous under .planning/)"
    - "Cross-check by disagreement: the § 4 list and the § 5 matrix first column are asserted identical in name and order, so a transcription slip surfaces as a gate failure rather than as a reader's oversight"

key-files:
  created:
    - .planning/phases/162-permissions-auth-model-refactor/162-SPEC.md
  modified: []

key-decisions:
  - "Role vocabulary is two levels — `admin` and `editor`, no `owner` (operator answer `two-roles`, 2026-09-16)"
  - "K4's single subtraction is widened to three: ProjectEditor is ProjectAdmin minus project.manage_editors, project.edit_project_settings and nomination.confirm — and § 5's matrix is proven to agree cell for cell"
  - "PRESHIP-02 keeps its blocking-ship status; criterion 4 loses only the suggest-for-approval branch"
  - "Criterion 6 is widened to all 15 storage policies, and the SPEC carries D-03's CORRECTED census (8 callers / 7 non-callers / 6 candidate_* / 10 call sites), not fact 3's slip of 7 candidate_*"
  - "Public read is an all-of rule, transitive through the nomination: open_for_voters AND nomination confirmed AND every linked entity confirmed"
  - "The concurrency guarantee is the UNIQUE NULLS NOT DISTINCT constraint, not a policy predicate; guard 3's NOT EXISTS stays a fast path"
  - "Deviation taken on DR-3: § 10 states the elections.election_type repurposing (D-16) rather than calling it unreconciled"

patterns-established:
  - "Reproduction-with-recorded-divergence: where the SPEC omits a line of a canonical table (brief § 3.1's 'this needs your ruling' sentence), the omission is stated in the SPEC next to the table rather than left silent"
  - "Authority-per-amendment: no criterion amendment is stated without its decision id, its date and its route (operator ruling / operator tick / ★ default plus ratification)"
  - "Flagged-unverified assumptions carry a named owner plan, so an assumption is a falsifiable claim rather than an implicit one"

requirements-completed: [PRESHIP-02]

coverage:
  - id: D1
    description: "162-SPEC.md exists with ten top-level sections numbered 1 to 10 in order — the phase's single normative reference and K4's stated home for the level-1 definition"
    requirement: "PRESHIP-02"
    verification:
      - kind: other
        ref: "task-4 gate: node -e '…' → 'top-level sections: 1,2,3,4,5,6,7,8,9,10 | anchors found: 11 of 11'"
        status: pass
    human_judgment: false
  - id: D2
    description: "§ 3's grant model: 8 user-type rows, every role value drawn from the two-level vocabulary admin/editor"
    requirement: "PRESHIP-02"
    verification:
      - kind: other
        ref: "task-2 gate: 'grant rows: 8 | distinct roles: `admin` `editor`'"
        status: pass
    human_judgment: false
  - id: D3
    description: "§ 4's 23-member enum and § 5's 23-row x 7-column matrix (161 stated cells), identical in name and order, no unstated cell, no dropped verb"
    requirement: "PRESHIP-02"
    verification:
      - kind: other
        ref: "task-3 gate: 'enum members: 23 | matrix rows: 23 | total cells: 161'"
        status: pass
    human_judgment: false
  - id: D4
    description: "§ 6's level-1 definition proven to agree with § 5's matrix — the ProjAdmin-vs-ProjEditor delta computed from the table is exactly the three K4 names"
    requirement: "PRESHIP-02"
    verification:
      - kind: other
        ref: "task-3 gate: 'ProjAdmin-vs-ProjEditor differences: project.manage_editors, project.edit_project_settings, nomination.confirm'"
        status: pass
    human_judgment: false
  - id: D5
    description: "§ 8 carries all five probed edges with a stated resolution each; § 9 carries the four phase-wide prohibitions"
    requirement: "PRESHIP-02"
    verification:
      - kind: other
        ref: "task-4 gate: 'edge rows: 5 | prohibitions: 4'"
        status: pass
    human_judgment: false
  - id: D6
    description: "§ 2's three criterion amendments and § 7's public-read conjunction read as intended by a human — a normative document eighteen plans check themselves against"
    verification: []
    human_judgment: true
    rationale: "Structural gates prove counts, anchors and internal agreement; they cannot prove that the prose states the operator's intent. The SPEC is the reference criterion 7's flow check is performed against, so a human read is the only check on its meaning."

# Metrics
duration: 7min
completed: 2026-09-16
status: complete
---

# Phase 162 Plan 01: Write 162-SPEC.md Summary

**The phase's normative reference now exists: ten sections carrying a 23-member permission enum, a 161-cell role x permission matrix proven to agree with its own prose level-1 definition, public read as a three-clause conjunction, and the three PRESHIP-02 amendments each with its authority named.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-16T15:14:49Z
- **Completed:** 2026-09-16T15:21:30Z
- **Tasks:** 4 of 4
- **Files modified:** 1 created, 0 modified

## The role-vocabulary ratification (Task 1)

Recorded verbatim, as the plan's `<action>` requires:

- **Chosen option id:** `two-roles`
- **Date:** `2026-09-16`
- **Source:** `162-CHECKPOINT-DECISIONS.md § 1 item S-1 (unticked box = recommended option A)`

The `<ratified>` block was checked against the source document before it was acted on, per the task's
halt condition. `162-CHECKPOINT-DECISIONS.md` § S-1 carries **both boxes unticked** — `- [ ] (A)` and
`- [ ] (B)` — and no margin note, so the standing convention selects the ★ RECOMMENDED option **(A) Two
levels — `admin` and `editor`**. That agrees with the `<ratified>` block; there is no fold-in error and
the plan did not halt.

PRESHIP-02 criterion 1 is therefore amended to two role levels, and K4's single subtraction is widened
to DR-2's three. `162-02` carries the matching edits into `REQUIREMENTS.md` and `ROADMAP.md`.

## Gate output — the counts as evidence, not assertion

All four gates exited 0. Their printed populations:

**Task 1** (source tree untouched, SPEC not yet written):
```
source tree clean: 0 modified or untracked files under apps packages tests scripts .github; SPEC not yet written
```

**Task 2** (§ 3's grant model):
```
grant rows: 8 | distinct roles: `admin` `editor`
OK 8 grant rows / roles drawn only from admin and editor / 8 anchors present
```

**Task 3** (§§ 4-5, the enum and the matrix):
```
enum members: 23 | matrix rows: 23 | total cells: 161
ProjAdmin-vs-ProjEditor differences: project.manage_editors, project.edit_project_settings, nomination.confirm
OK 23 members / 23 rows / 161 cells / no unstated cell / no dropped verb / level-1 delta is exactly the three K4 names
```

**Task 4** (§§ 8-10, and the anchors from §§ 2-7 still present):
```
edge rows: 5 | prohibitions: 4 | top-level sections: 1,2,3,4,5,6,7,8,9,10 | anchors found: 11 of 11
OK 5 edge rows all resolved / 4 prohibitions / 10 sections in order / 11 anchors present
```

Gates 2 and 3 were **re-run against the completed ten-section document** after task 4's append, and
printed the same counts — so §§ 8-10 were appended rather than written over §§ 1-7, proven by
measurement and not only by the anchor list.

Blast radius confirmed: `git status --porcelain -- apps packages tests scripts .github` is empty at
every point in the run. No source file, schema file, migration or test was touched, so `yarn
lint:check`, `yarn test:unit` and the E2E suite are unaffected and were not run — prohibition 4 carries
the E2E Hard Rule to the plans that change behaviour.

## Accomplishments

- **`162-SPEC.md` exists** at `.planning/phases/162-permissions-auth-model-refactor/162-SPEC.md`, ten
  numbered sections, 389 lines / 29,176 bytes. It is the written matrix ROADMAP criterion 7's flow check
  is performed against, and K4's stated home for the level-1 definition.
- **§ 4 and § 5 are reproduced from the canonical brief, and their agreement is machine-proven** — 23
  enum members identical in name *and order* to the matrix's 23 first-column entries, 161 cells each one
  of `✓`, `—` or an `own`-qualified form. No cell is unstated; brief § 8.3's three formerly-open cells
  are reproduced resolved (D-09a).
- **§ 6's prose level-1 definition is proven against § 5's table rather than asserted.** The gate
  computes the ProjAdmin-vs-ProjEditor delta from the matrix itself and requires it to be exactly
  `project.manage_editors`, `project.edit_project_settings` and `nomination.confirm`, each granted to
  ProjAdmin and withheld from ProjEditor.
- **§ 7 states public read as an all-of rule including the entity-confirmation conjunct**, with the four
  consequences (invisible unconfirmed entity, the closed placeholder-publication hole, one way to ask
  whether a row is public after the `published` deletion, the `unconfirmed` → `confirmed` polarity flip)
  and the conditional, reader-dependent name freeze enforced by a trigger reading `OLD.confirmed`.
- **§ 2 states the three amendments with their authorities**, quoting the criterion-4 ruling verbatim and
  recording that PRESHIP-02 keeps its blocking-ship status.
- **§ 8 writes down all five probed edges**, three resolved against measured brief statements and two
  carried as explicitly flagged unverified assumptions with named owner plans.

## Task Commits

Each task was committed atomically. Task 1 produced a decision record rather than a file change, so its
output is this SUMMARY's ratification section and it has no commit of its own.

1. **Task 1: Ratify the criterion-1 role-vocabulary amendment** - no commit (decision recorded in this SUMMARY; gate verified the tree was untouched and the SPEC unwritten)
2. **Task 2: 162-SPEC.md §§ 1-3** - `b5fc7b2e0` (docs)
3. **Task 3: §§ 4-7 — the enum, the matrix, level-1, public read** - `3662f3464` (docs)
4. **Task 4: §§ 8-10 — edge coverage, prohibitions, citation protocol** - `f710e3183` (docs)

**Plan metadata:** see the final `docs(162-01): complete …` commit.

## Files Created/Modified

- `.planning/phases/162-permissions-auth-model-refactor/162-SPEC.md` — created. The phase's single
  normative reference. §§ 3, 4, 5 and 7 reproduce brief §§ 3.1-3.4; §§ 1, 2, 6, 8, 9 and 10 are
  authored and canonical here.

## Decisions Made

- **`two-roles`, 2026-09-16** — the role vocabulary is `admin` and `editor`. Recorded above with its
  source. Ratified rather than defaulted: the operator was shown that the overruled position is carried
  by ROADMAP criterion 1 and a blocking-ship requirement row, and that K4 is marked locked.
- **§ 2.3 carries the corrected storage census, not fact 3's figures.** D-03's own correction of
  2026-09-15 measures 8 callers / 7 non-callers, of which **6** are `candidate_*` and the seventh is
  `anon_select_public_assets`, with **10** real call sites (the 11th grep hit being the file's own
  header comment). The SPEC states this explicitly and says why: an acceptance criterion asserting "7
  `candidate_*` policies" would go red against a correct implementation. `162-14` and `162-17` must use
  the measured split.
- **§ 3 records its one divergence from a canonical table** rather than diverging silently: brief
  § 3.1's closing "this needs your ruling" sentence is omitted because § 2.1 discharges it, and the
  omission is stated next to the table.
- **`anon_select_public_assets` is flagged as a different problem from the six `candidate_*`
  policies** — an anon-read policy belonging with § 7's visibility rules, not an inline re-derivation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical content] § 10 states the `elections.election_type` repurposing instead of calling it unreconciled**

- **Found during:** Task 4 (§ 10, the citation protocol)
- **Issue:** The plan's task-4 `<action>` instructs § 10 to say that brief § 3.5 is not reproduced
  "because the nomination-shape setting carries an unreconciled operator note that 162-07 must
  resolve", and the plan's `<output>` block asks the SUMMARY to record that the contradiction "remains
  open". **Both statements are stale.** DR-3 in the same plan file carries a dated addendum — *"✅
  RESOLVED 2026-09-15, after this plan was written — the operator note wins"* — and `162-CONTEXT.md`
  D-16 has been **corrected in place** to match: `elections.election_type` is repurposed to carry the
  nomination shape, its `'general'` / `'local'` meaning deleted with its traces, and there is **no**
  `nomination_shape` column. Writing the stale sentence would have put a knowingly false claim into the
  document eighteen plans check themselves against — and would have left the SPEC silent on a visible
  change to an existing column's meaning, which the DR-3 addendum explicitly calls out as a deviation
  worth taking.
- **Fix:** § 10 now states brief § 3.5 is not reproduced *because it is a table of implementation homes
  that `162-07` owns*, and then states the one line of it that changes an existing column's meaning: the
  `election_type` repurposing, with D-16 named, the 2026-09-15 correction dated, the "no
  `nomination_shape` column" stated, and the verified premise (one production consumer, nothing reads
  the value it feeds) recorded. `162-07` is named as the plan carrying the change and the measured trace
  list.
- **Files modified:** `.planning/phases/162-permissions-auth-model-refactor/162-SPEC.md` (§ 10)
- **Verification:** Task-4 gate re-run — 10 sections in order, 11 anchors present, exit 0. The added
  text introduces no `## ` heading and no hyphen bullet, so the section and prohibition counts are
  unchanged.
- **Committed in:** `f710e3183` (part of the task-4 commit)

---

**Total deviations:** 1 auto-fixed (1 × Rule 2).
**Impact on plan:** Contained to § 10's wording. No gate, acceptance criterion or must-have truth
changed; the deviation replaces a stale claim with the resolved fact the plan's own DR-3 addendum
instructed the executor to carry. No scope creep — the SPEC states one line of brief § 3.5 and still
does not reproduce the section.

## Issues Encountered

**DR-3's contradiction is CLOSED, not open.** The plan's `<output>` block asks this SUMMARY to record
that it "remains open and belongs to 162-07". It does not remain open: `162-CONTEXT.md` D-16 was
corrected in place on 2026-09-15 in favour of the operator's free-text note, and the DR-3 addendum
records the same. What belongs to `162-07` is now the **implementation** of the repurposing — the enum
column, the 14 dev-seed template updates, the one adapter read at
`supabaseDataProvider.ts:245`, the six adapter-test assertions that will fail and must be rewritten,
and the rest of D-16's measured trace list — **not a ruling.** `162-07`'s planner has no operator
question left to put.

## Open items this plan deliberately hands on

Two of § 8's five edges are **flagged unverified assumptions with named owners**, recorded as such in
the SPEC so a later plan can falsify them rather than inherit them silently:

- **ordering** — the declaration order of `grant_permission` is presentational only and no predicate may
  compare or sort members by ordinal. No source document confirms this. **`162-03` and `162-04` must
  honour it or contradict it deliberately.**
- **idempotency** — `user_can` is a pure read, and a `grants` row is identified by the full key so
  re-granting the same right is a no-op rather than a duplicate row. The brief specifies the key but
  never states the re-grant behaviour. **`162-03` must make it true or refute it.**

These are planned dispositions from the plan's `edge_probe_disposition` ledger, not defects discovered
in passing, and no stub, skipped test or unrun `<verify>` was left behind by this plan.

## User Setup Required

None — no external service configuration required. This plan's entire output is one Markdown document.

## Next Phase Readiness

`162-02` can proceed immediately: § 2 states the three amendments it must carry into
`.planning/REQUIREMENTS.md`'s PRESHIP-02 row and `.planning/ROADMAP.md` § Phase 162's criteria 1, 4 and
6, and § 2.3 hands it the corrected storage census rather than fact 3's slip. `162-03` has § 4's
normative 23-member enumeration in the order the DDL should declare it, plus § 8's two flagged
assumptions to close. `162-04` has § 5's 161 cells to compile into `user_can`. `162-17` has § 6's
definition to check the registration and nomination-confirmation flows against, which is criterion 7's
real ask.

## Self-Check: PASSED

- `FOUND: .planning/phases/162-permissions-auth-model-refactor/162-SPEC.md`
- `FOUND: .planning/phases/162-permissions-auth-model-refactor/162-01-SUMMARY.md`
- `FOUND: b5fc7b2e0` · `FOUND: 3662f3464` · `FOUND: f710e3183`
