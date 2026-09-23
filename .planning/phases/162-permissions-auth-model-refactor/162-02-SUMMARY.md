---
phase: 162-permissions-auth-model-refactor
plan: 02
subsystem: planning-documents
status: complete
tags: [documentation, requirements, roadmap, PRESHIP-02, criterion-amendments, storage-census, D-01, D-02, D-03, D-11b, D-16]

requires:
  - '162-01 — `162-SPEC.md` §§ 2 and 3; task 1''s precondition, satisfied: the SPEC exists and its grant table states a two-level vocabulary'
  - '162-03 … 162-17 — every plan of the phase; this one records what they built, so it ran last by construction'
  - 'apps/supabase/supabase/schema/400-storage.sql — the file the census is re-derived from, in the same invocation that asserts it'
  - 'apps/supabase/supabase/schema/000-enums.sql, 301-auth-functions.sql, 302-rls.sql — the tree the amended criteria are written against'
provides:
  - '.planning/REQUIREMENTS.md — the amended `PRESHIP-02` row, its status-table row and its rollup row'
  - '.planning/ROADMAP.md — § Phase 162 with a second dated correction note, six amended criteria, a D-16 scope note and disk-derived plan bookkeeping'
  - 'the storage census token, written byte-identically into both documents and gated against the tree'
affects:
  - 'every later reader of PRESHIP-02 — this is the text a reviewer checks a blocking-ship security refactor against'
  - '`/gsd-verify-work` and the ship gate: PRESHIP-02 stays blocking ship and stays unticked'

tech-stack:
  added: []
  patterns:
    - 'dated in-place correction, house style: the earlier note survives and the new one records what was done about it'
    - 'content anchors, never line anchors, for a file the phase rewrote (Phase 164 precedent, applied twice here)'
    - 'a census token whose figures the gate re-derives from the tree in the same invocation that reads the document'

key-files:
  created:
    - .planning/phases/162-permissions-auth-model-refactor/162-02-SUMMARY.md
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md

decisions:
  - 'The census is re-derived over `storage_path_can`, not over `can_access_project`: the plan''s instrument measured a function the phase deleted, and a census over it would read 15/0/0/15 — the exact opposite of what shipped.'
  - 'Criterion 2 is amended although the plan''s task 3 did not list it: it named `can_edit_project` (never built) and `can_access_project` (deleted by 162-15), and the operator''s dispatch named it as one of the three stale criteria.'
  - 'Plan rows are ticked exactly where a `162-XX-SUMMARY.md` is on disk. The plan said leave every row unticked, on the premise that no plan had executed; eighteen had.'
  - 'PRESHIP-02 keeps its blocking-ship status and its unticked checkbox. The amendment removes one branch of one criterion, never the status.'

metrics:
  duration: ~50 min
  completed: 2026-09-17

actuals:
  tokens: 10000
  tasks: 3
  commits: 4
  plan_head_before: f30dce31738a60e7f7471fb3effb7f44a6d085dc
---

# Phase 162 Plan 02: Requirement & Roadmap Correction Summary

`PRESHIP-02` and ROADMAP § Phase 162 now state what the phase built rather than what it predicted:
two role levels, one authority predicate, a conjunctive public-read rule, and a storage census
re-measured from the tree in the same invocation that checks it — with the requirement still
blocking ship and still unticked.

## What was done

| Task | Commit | Files |
|---|---|---|
| 1 — amend the `PRESHIP-02` row | `0eb56ab2c` | `.planning/REQUIREMENTS.md` |
| 2 — correct the two Phase 162 status rows | `d7a4142ce` | `.planning/REQUIREMENTS.md` |
| 3 — correct ROADMAP § Phase 162 and its phase-list bullet | `56bbcc2a1` | `.planning/ROADMAP.md` |

Task 1's precondition was checked before any edit: `162-SPEC.md` exists, and its § 3 grant table
(lines 129–141) names `admin` and `editor` and no third level, matching
`000-enums.sql:29` — `CREATE TYPE public.grant_role_type AS ENUM('admin', 'editor')`.

## The storage census, measured at execution time

Measured from `apps/supabase/supabase/schema/400-storage.sql` in this worktree on 2026-09-17, with
whole-line comments stripped (the figure being corrected was itself inflated by a header-comment
mention):

| Figure | Value | How derived |
|---|---|---|
| Storage policies | **15** | `CREATE POLICY` statements in the comment-stripped file |
| Routing through `storage_path_can` | **14** | policy bodies containing at least one call |
| Call sites of it inside policy bodies | **20** | summed per policy; two `SELECT` policies call it twice |
| Non-callers | **1** | `anon_select_public_assets`, routing through `storage_path_is_public` |
| `can_access_project` occurrences | **0** | the legacy predicate is gone from the file entirely |
| Inline `EXISTS` sub-selects | **0** | raw `EXISTS` count minus the two `IF NOT EXISTS` clauses |

The token, written byte-identically into the `PRESHIP-02` row and into ROADMAP criterion 6, and
asserted equal by task 3's gate:

> **Storage census, measured 2026-09-17:** 15 policies / 14 routing through `storage_path_can` / 20 call sites / 1 non-caller (the anon read, through `storage_path_is_public`) / 0 `can_access_project` / 0 inline `EXISTS` sub-selects.

This matches 162-17's independently derived partition (15 / 14 / 1 / 0) exactly.

## Gate output — recorded as evidence, re-run at the closing HEAD

### Task 1

```
PRESHIP-02 row chars: 6190 | role vocabulary: ["admin","editor"] | Amended markers: 1
measured 400-storage.sql: policies 15 | storage_path_can policies 14 | call sites 20 | non-callers 1 | can_access_project 0 | inline EXISTS 0
census token in requirement: [15,14,20,1,0,0]
OK 2 role levels / blocking ship kept / checkbox unticked / 1 Amended marker / census agrees with the tree in all 6 figures / stale anchors gone / source tree clean
EXIT=0
```

### Task 2

```
status row cells: 3 ["PRESHIP-02","Phase 162 — Permissions & Auth Model Refactor","Implemented — 19 plans across 7 waves; the box stays unticked and the tick is the operator’s, because the source marks it **blocking ship**"]
rollup row cells: 3 ["162 — Permissions & Auth Model Refactor","PRESHIP-02","1"]
PRESHIP-02 occurrences in file: 3 | deferral-phrase occurrences: 0
OK both rows intact at 3 cells / rollup requirement and count unchanged / 0 deferral phrases across 3 PRESHIP-02 occurrences / total row byte-identical to HEAD
EXIT=0
```

### Task 3 — run **before** the roadmap commit, so the HEAD comparison was not vacuous

```
Phase 162 section chars: 18335 | criteria: 7 | Corrected markers: ["2026-08-28","2026-09-17"] | role vocabulary: ["admin","editor"]
census roadmap: ["2026-09-17","15","14","20","1","0","0"] | census requirement: ["2026-09-17","15","14","20","1","0","0"] | tree: [15,14,20,1,0,0]
plans - stated: 19 | listed: 19 | on disk: 19 | SUMMARYs on disk: 18
ticked rows: 18 | unticked rows: ["162-02"]
phase headings - HEAD: 29 now: 29 | bullets without a section: []
OK 7 criteria / 2 dated notes in order / 2 role levels / census byte-identical across both documents and equal to the tree / plans 19=19=19, 18 ticked each with a SUMMARY on disk / 29 phase headings unchanged / source tree clean
EXIT=0
```

Blast radius: `git status --porcelain` is empty; every gate asserts nothing under `apps/`,
`packages/`, `tests/`, `scripts/` or `.github/` is modified or newly untracked. The roadmap diff
touches only line 293 (the phase-list bullet) and lines 1519–1560 (§ Phase 162); the 29 `### Phase`
headings are unchanged and every phase-list bullet still has a detail section.

## Plans bookkeeping — derived from disk, per DR-6

- `162-*-PLAN.md` files present: **19**. Rows previously listed: **10** (`162-01` … `162-08`).
- **Nine rows appended**, in plan-id order, each taking its objective from `162-PLAN-OUTLINE.md` and
  carrying the measured correction where the outline row is now stale: `162-09`, `162-10`, `162-11`,
  `162-12`, `162-13`, `162-14`, `162-15`, `162-16`, `162-17`.
- `**10 of 19 written so far**` → all 19 written, 18 executed. **18 rows ticked**, exactly those with
  a `162-XX-SUMMARY.md` on disk; the one unticked row is `162-02` itself.

## The criteria as they now read

Criterion 7 is untouched. Criteria 1, 2, 3, 4, 5 and 6 each carry a dated `⚠ **Amended 2026-09-17**`
note naming its authority:

1. **Two role levels, `admin` and `editor`** — an `admin` does anything to the object and its
   descendants; an `editor` has the rights the matrix grants it, editor management being a permission
   at project scope and its entity-scope equivalent rather than a role. *There is no third level:
   `grant_role_type` carries exactly these two members.* Authority: D-02, ratified at
   `162-CHECKPOINT-DECISIONS.md` § 1 item S-1 option (A). The matrix is not reproduced; `162-SPEC.md`
   §§ 3 and 5 are its home.
2. **Read authority separated from write authority, asked of one predicate rather than two
   functions** — `user_can(grant_scope_type, uuid, grant_permission)` asked `project.read_structure`
   on the `projects` SELECT policy and `project.edit_project_settings` on its UPDATE twin. The
   criterion named `can_access_project` (deleted by 162-15) and `can_edit_project` (never built), so
   F2(a)'s guard is re-expressed against the permission literal and made permanent: **check 9001** in
   `apps/supabase/scripts/lint-schema.mjs`, run by `yarn db:lint:sql`. Authority: S-5 option (A).
3. **Unchanged in substance, narrower in blast radius** — `is_child_nominee` is direct-parent-only,
   not transitive (D-06 / D4(a)); it gates **`nomination.read`**, not `entity.read_answers` (162-04
   Q2 = (D)); and it takes **three** arguments, `(p_parent_type, p_parent_id, p_child_id)`, not the
   two the criterion named.
4. **The middle self-edit branch and its tests are removed**, on the operator's ruling of 2026-09-14
   quoted verbatim — *"Yes — record it as my amendment."* (D-01, brief § 10.1). The
   nomination-changes half is unaffected and the **blocking ship** mark is unchanged.
5. **One rule and only one**: a row is public when the project is open for voters AND its nomination
   is confirmed AND every entity that nomination links carries `confirmed = true` — transitive
   through the nomination. The published/unpublished model is **superseded**: ten per-row publication
   columns and their **five** partial indexes deleted by 162-16 (D-11, D-11b).
6. **The "already true" claim is withdrawn, not merely widened.** All fifteen storage policies route
   through one mechanism — fourteen through `storage_path_can` → `user_can` over an eleven-segment
   path mapping, the fifteenth (the anon read) through `storage_path_is_public`, because an anon
   caller carries no `grants` claim (D-27). The withdrawn claim rested on a grep total inflated by a
   header-comment mention and on ten line anchors of which none was correct; the census above
   replaces both, and no line anchor into `400-storage.sql` survives anywhere in either document.

Plus a **scope note, not a criterion**: `elections.election_type` is repurposed to carry the
nomination shape and its `'general'` / `'local'` meaning deleted (D-16, implemented by 162-07),
recorded because no criterion implies it.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — broken instrument] The census gate measured a function the phase deleted**

- **Found during:** Task 1, before the first edit.
- **Issue:** the plan's gate derives its six census figures from `can_access_project` occurrences in
  `400-storage.sql`. That predicate was deleted by 162-15 and appears **0** times in the file. The
  gate would have passed on a census reading *15 policies / 0 callers / 0 call sites / 15
  non-callers* — a true sentence about a dead function that reads as "no storage policy routes
  through the shared mechanism", the exact opposite of what shipped, written into a blocking-ship
  requirement. This is threat T-162-02-02 realised through the instrument rather than the prose.
- **Fix:** the derivation is re-pointed at `storage_path_can` (policies, call sites, non-callers),
  the fifth slot now records the legacy predicate's **absence** as a measured 0, and the sixth
  subtracts `IF NOT EXISTS` from the raw `EXISTS` count so that `CREATE EXTENSION IF NOT EXISTS`
  and `CREATE TABLE IF NOT EXISTS` are not counted as inline sub-selects. The token's shape and the
  same-invocation re-derivation contract are unchanged; only what it counts is.
- **Commit:** `0eb56ab2c`.

**2. [Rule 1 — measured figure wrong in my own first draft] The fourth census slot**

- **Found during:** Task 1's first gate run, which went **red**.
- **Issue:** the draft token said *1 routing through `storage_path_is_public`*. Measured, **two**
  policies call that function — the anon read and `authenticated_select_public_assets`, which
  legitimately asks both the authority and the visibility question. The gate caught it.
- **Fix:** the slot is defined as *non-callers of `storage_path_can`* (1, the anon read), and the
  two-caller fact is stated in the following sentence of the requirement row rather than folded into
  a figure it does not describe.
- **Commit:** `0eb56ab2c`.

**3. [Rule 2 — a stale criterion the plan did not list] Criterion 2**

- **Found during:** Task 3.
- **Issue:** the plan's task 3 enumerates amendments to criteria 1, 3, 4, 5 and 6 and leaves
  criterion 2 alone; task 1 goes further and instructs that criterion 2's finding be **preserved**
  with its `301-auth-functions.sql` and `302-rls.sql` line anchors. Both are falsified by the
  finished tree: the criterion names one function that was deleted and one that was never built, and
  the anchors point into files the phase rewrote. 162-17 reported it and explicitly did not close it.
- **Fix:** criterion 2 and the matching sentence in the `PRESHIP-02` row are amended per S-5(A) —
  the collapse finding is kept as the **baseline** record, and what shipped is stated with content
  anchors and the permanent guard named.
- **Commits:** `0eb56ab2c`, `56bbcc2a1`.

**4. [Rule 2 — a false premise in the plan's own prohibition] Plan-row checkboxes**

- **Found during:** Task 3.
- **Issue:** the plan instructs *"leave every appended checkbox unticked — no plan in this phase has
  executed"*. Eighteen had, each with a `162-XX-SUMMARY.md` on disk. Obeying the letter would have
  recorded eighteen executed plans as not executed.
- **Fix:** a row is ticked **exactly when its SUMMARY is on disk** — a measured biconditional the
  gate now asserts in both directions, with `162-02`'s own row the single unticked exception, since
  its SUMMARY is this file and did not exist when the roadmap was committed. The requirement
  checkbox is untouched; the spirit of the prohibition (*a checkbox flipped before its gate has run
  is a claim about a tree nobody measured*) is preserved by deriving the ticks from evidence.
- **Commit:** `56bbcc2a1`.

**5. [Rule 2 — the plan's `can_access_project`-era prose] Criterion 6 and the 162-02 plan row**

- **Issue:** the plan's DR-2/DR-3 census (8 of 15 callers, 6 `candidate_*`, 10 call sites, 12 inline
  `EXISTS`) and the roadmap's own `162-02` plan row carried those figures as **targets**. They
  describe the pre-phase tree.
- **Fix:** they are recorded as the **baseline** census inside criterion 6's amendment note — which
  is where they belong, since they are the evidence that the withdrawn claim was never true — and
  the `162-02` plan row now says so in as many words.
- **Commit:** `56bbcc2a1`.

### Deliberate non-edits

- **`162-SPEC.md` was not edited**, per DR-3. It is 162-01's artefact. Its § 2.3 carries the
  pre-phase census (8 / 7 / 6 / 10 / 12) as the amendment's justification, which remains a true
  statement about the baseline; the post-phase census lives in the two documents this plan owns.
- **The ROADMAP Progress table row for Phase 162 was not touched.** The plan scopes this edit to
  § Phase 162 and its phase-list bullet, and the concurrency mitigation depends on that scope.
  Whoever closes the phase owns that row.
- **`STATE.md` was not updated**, per the dispatch.
- **`yarn lint:check`, `yarn test:unit` and the E2E suite were not run**, per DR-4's reasoning: this
  plan touches two Markdown files under `.planning/`, which no lint rule, unit test or spec reads,
  and the blast-radius assertion in every gate is what proves that rather than assuming it.
  `npx prettier --check` is excluded because `.prettierignore` excludes `.planning/` wholesale, so it
  matches zero files and exits 0 — a gate that cannot fail.

## Findings addressed to 162-14 and 162-17 (DR-3, and its resolution)

DR-3 asked this plan to record that `162-CONTEXT.md` D-03 and the `162-PLAN-OUTLINE.md` row for
162-14 both say *"the 7 `candidate_*` policies"*, when seven was the **non-caller** total and the
family was **six**. Measured at the phase's close, the discrepancy is **moot and is recorded as
such**: there are now **zero** policies named `candidate_*` in `400-storage.sql`. The fifteen
policies are the `entity_*` / `project_*` pairs plus two authenticated reads and the anon read, so
an acceptance criterion asserting "7 `candidate_*` policies" would have gone red against the shipped
tree for a second, larger reason. Both documents keep their pre-phase wording and neither was edited
from here; criterion 6 in the ROADMAP now carries the correct baseline split (8 callers, 7
non-callers, **6** of them `candidate_*`) so the mislabel cannot propagate forward.

Two further measurement notes, both recorded rather than acted on:

- **The pgTAP estate is 1077 declared assertions across 28 files; 1086 is the runner's count**,
  the difference being `00-helpers`' nine smoke tests. Both figures are true of different
  instruments, and the correction note says which is which.
- **The policy census moved 97 → 102**, counted as `CREATE POLICY` statements in
  `apps/supabase/supabase/schema/` (85 table + 15 storage + 2 auth-tables). The requirement's
  original "97 today" is kept as the labelled baseline rather than deleted.

## Known Stubs

None. This plan writes no code and leaves no placeholder; both documents are complete as amended.

## Threat Flags

None. The two edited files are prose about roles, policies and column names; no environment value,
key or connection string is introduced, and no source file is touched.

## Self-Check: PASSED

- `.planning/REQUIREMENTS.md` — FOUND, amended row present at 6190 characters.
- `.planning/ROADMAP.md` — FOUND, § Phase 162 present at 18335 characters with 7 criteria and 2
  dated correction notes.
- `.planning/phases/162-permissions-auth-model-refactor/162-02-SUMMARY.md` — FOUND.
- Commits `0eb56ab2c`, `d7a4142ce`, `56bbcc2a1` — all three FOUND in `git log`.
- All three gates re-run at the closing HEAD: **EXIT=0**, output recorded above.
- `PRESHIP-02` is still `- [ ]`, still states `blocking ship`. **Not ticked by this plan.**
