---
phase: 151-ship-v0-2-akita-review-stack
plan: 04
subsystem: infra
tags: [measurement, gate-reach, d-18, axe, eslint, git-plumbing, slice-anatomy, hygiene, checklist]

requires:
  - phase: 151-01
    provides: build-rename-commit.sh, build-slice.sh, the merge-target/rename-commit pipeline, and the merge-tree exit-1 finding
  - phase: 151-02
    provides: the corrected hygiene pattern set and the "a pattern without a word boundary silently over-counts" lesson
  - phase: 151-03
    provides: 151-BASELINE.md — the gate baseline, the corrected `any` surface, and the -I trap
provides:
  - 151-MEASUREMENTS.md — 31 checklist rows with closed-vocabulary reach verdicts, the axe/raw-key complement, the re-measured slice anatomy, the rename inventory, the segment overlap, and 8 re-confirmed findings
  - the canonical 1–31 checklist numbering every later disposition cell must index against
  - the arithmetic that replaces 151-01's false "Phases 141–150" drift attribution
affects: [151-05, 151-06, 151-08, 151-17, 151-18, 151-DISPOSITION.md, D-05, D-09, D-10, D-15, D-18]

actuals:
  tokens: 20800
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "closed reach vocabulary (exhaustive/partial/none) so 'covered' cannot be written without committing to which"
    - "first-match-wins area classifier with a residual bucket: sum-equals-total proves no overlap, total-absorption proves no gap"
    - "measure a gate by reading its source at execution time, then name its complement in the same row"
    - "byte-level (hexdump) verification when a grep census disagrees with a visual read"

key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-MEASUREMENTS.md
  modified: []

key-decisions:
  - "The checklist has 31 items, not 30. Line 8 writes the `any` item as `- [U+00A0]U+00A0Avoid…`, which defeats every `^- \\[ \\] ` census AND makes the item an unclickable non-checkbox. Canonical numbering for the disposition matrix is 1–31, which is research's own General-block numbering; its total was the wrong part, not its table."
  - "Zero of 31 checklist items is exhaustively covered by an automated gate. 10 partial, 21 none. Any disposition cell filled with 'green CI' is wrong 21 times out of 31."
  - "`yarn db:lint:sql` is not sqlfluff. It is plpgsql_check plus a 174-line custom script implementing exactly two Splinter advisors (0013 RLS-disabled, 0001 unindexed-FK). Research and CLAUDE.md both overstate it. 2 of 9 Supabase items partial, 7 none."
  - "The +271 'drift' 151-01 blamed on Phases 141–150 is 249 (backend/** deletions retained because C1 ran without --drop-prefix) + 22 (this phase's own .planning growth). D=175 and M=404 are byte-identical to research; the product tree has not moved at all."
  - "D-15 exempts .agents/code-review-checklist.md from the HYGIENE SWEEP, not from checklist item 7. Its five stale docs/src/routes links and its U+00A0 checkbox are plain repo-documentation defects, not planning citations, and item 7 applies to them."
  - "assertAxeScan's 7 entries resolve to 5 distinct URLs, not 7 routes — entries 5/6/7 are three DOM states of /results. The complement is 31 of 36 route surfaces."

patterns-established:
  - "Pattern 8: a reach row is not complete until its complement is written in the same row; the verdict word is the index, the complement is the content"
  - "Pattern 9: when a favourable correction is found (pgTAP 11 files, not 56), record it as loudly as an unfavourable one — an unrecorded favourable correction is the same repudiation risk"
  - "Pattern 10: reconcile a disputed count by reproducing BOTH measurement methods rather than re-running one and asserting the other was drift"

requirements-completed: [criterion-1, criterion-2, criterion-6]

coverage:
  - id: D1
    description: "Every checklist item's automated coverage is a measured fact with a closed-vocabulary verdict and a named complement where partial"
    requirement: criterion-1
    verification:
      - kind: automated_ui
        ref: "regex census over the record's own main table → 31 rows, contiguous 1..31, Counter({'none': 21, 'partial': 10}); 0 blank, 0 out-of-vocabulary; plan verify `awk '/^\\| *[0-9]+ \\|/{c++}'` → 51 ≥ 30"
        status: pass
    human_judgment: false
  - id: D2
    description: "assertAxeScan's route and theme reach is read out of the spec at execution time, with the unscanned complement enumerated"
    requirement: criterion-2
    verification:
      - kind: integration
        ref: "a11y-smoke.spec.ts:215-330 → 7 name: entries; :483-566 → 6 declaration sites = 14 tests; :163 → 4 WCAG tags; git ls-files route census → 36 total, 5 scanned, 31 unscanned (18 candidate / 5 admin / 8 voter)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Assumption A6 is answered with the config file and line range that answers it"
    requirement: criterion-2
    verification:
      - kind: integration
        ref: "packages/shared-config/eslint.config.mjs — one `ignores:` at :22-37, NO `files:` key in 189 lines, rule 'error' at :98-103 → no test-glob exemption; tests/eslint.config.mjs:78 downgrades to 'warn' inside the files:['**/*.ts'] block opened at :15; 4 workspaces have no lint script at all"
        status: pass
    human_judgment: false
  - id: D4
    description: "The slice anatomy is re-measured, gap-free and overlap-free, including the residual apps/frontend paths research does not name"
    requirement: criterion-6
    verification:
      - kind: integration
        ref: "14 first-match-wins areas sum to 4,252 == `git -c diff.renameLimit=20000 diff --name-only --no-renames d01e69c54 3808a75b8 | wc -l` → 0.00% divergence vs a 2% allowance; A10r=18 and A10s=7 enumerated file-by-file"
        status: pass
    human_judgment: false
  - id: D5
    description: "The rename inventory records both limits and the stderr warning, and the segment overlap is current"
    requirement: criterion-6
    verification:
      - kind: integration
        ref: "908 R default (stderr 172 bytes, 2 lines) vs 1,135 R at renameLimit=20000 (stderr 0 bytes); per-top-level breakdown 853+271+11 spurious; comm -12/-23/-13 → 459/3,139/442 against 3,598 and 901 — identical to research"
        status: pass
    human_judgment: false
  - id: D6
    description: "Six pre-seeded findings re-confirmed with status and evidence, and the stale-path target set matches its acceptance command"
    requirement: criterion-1
    verification:
      - kind: integration
        ref: "8 finding rows (6 pre-seeded + 2 new), all `holds`, each with a verifying command; § 3.1 has 13 rows == `git grep -l -F 'docs/src/routes' -- . ':(exclude).planning' | wc -l` → 13"
        status: pass
    human_judgment: false
  - id: D7
    description: "Nothing real was mutated — no branch, no remote, no PR, no source file, backup worktree untouched"
    requirement: criterion-6
    verification:
      - kind: integration
        ref: "git branch --list 'ship/*' → empty; git ls-remote --heads origin 'ship/*' → empty; git status --porcelain -- . ':(exclude).planning' → empty; backup worktree still detached at fe91f3099, clean; all three throwaway OIDs `git for-each-ref --contains` → 0"
        status: pass
    human_judgment: false

duration: 51min
completed: 2026-08-16
status: complete
---

# Phase 151 Plan 04: Execution-Time Re-Measurement Summary

**Every number this phase inherited was re-derived against `df81f5e65`, and four of them were
wrong: the checklist has 31 items rather than 30 (a no-break space on line 8 hides one from every
grep and makes it an unclickable checkbox), `db:lint:sql` is two Splinter checks rather than
sqlfluff, the pgTAP surface is 11 files rather than 56, and the "+271 files of Phase 141–150 drift"
is 249 files of measurement-method difference plus this phase's own planning output.**

## Performance

- **Duration:** 51 min
- **Started:** 2026-08-16T20:35:00Z
- **Completed:** 2026-08-16T21:26:00Z
- **Tasks:** 3 of 3
- **Files created:** 1 (`151-MEASUREMENTS.md`, 1,096 lines / 71,172 bytes)

## Accomplishments

- **D-18 is now enforceable.** All 31 checklist items carry a reach verdict from a closed vocabulary
  and every `partial` names its complement in the same row. The census: **0 exhaustive, 10 partial,
  21 none.** No item in this checklist is fully covered by an automated gate — so a disposition cell
  filled with "green CI" is wrong 21 times out of 31 and wrong *in part* the other 10.
- **`assertAxeScan` was measured, not carried forward.** 7 `AXE_ROUTES` entries → **5 distinct
  URLs** (entries 5/6/7 are three DOM states of `/results`) → **14 emitted tests** across 2 themes
  and 4 WCAG tags. The complement is **31 of 36 `+page.svelte` route surfaces**: all 18 candidate
  routes, all 5 admin routes, 8 of 13 voter routes — including `questions/[questionId]`, the route a
  voter spends most of the journey on.
- **C-8's premise checked and closed.** Phase 147 has **not executed** — no phase directory exists
  for 141–150 and `ROADMAP.md:720` reads `0/TBD — Not started`. D-18's snapshot survives, but now as
  a measured fact rather than an inherited one, with the re-measurement trigger written down.
- **A6 answered with configuration lines, not inference.** `packages/shared-config/eslint.config.mjs`
  has **no `files:` key at all** in 189 lines, so no test-glob exemption exists — but
  `tests/eslint.config.mjs:78` downgrades the rule to `warn`, and 4 workspaces have no `lint` script
  whatsoever. **Three mechanisms; 151-03 had found only the third.**
- **The slice anatomy is exact in both directions again, and the residual is named.** 14
  first-match-wins areas sum to **4,252 — the independently measured total, 0.00% divergence**
  against a 2% allowance. The two rows research never had are enumerated file by file: 18
  `apps/frontend/` paths outside `src/`+`messages/`, and 7 `apps/frontend/src/` paths outside
  `lib/routes/params`.
- **`hooks.server.ts` was found sitting in the residual bucket.** It is the SvelteKit server hook —
  Supabase session handling and locale resolution, i.e. the single most auth-relevant frontend file.
  In 151-01's candidate partition it rides in slice 10 beside `turbo.json` and `yarn.lock`, which
  would bury an OWASP-review surface in the least security-reviewed PR of the stack.
- **Pitfall 1 reproduced to the file.** 908 renames at git's default limit versus **1,135** at
  `diff.renameLimit=20000`, with the two-line/172-byte stderr warning present at default and
  **0 bytes** at 20000. The 227 undetected renames reappear as 227 extra `A` *and* 227 extra `D` —
  which is how a layout move becomes a mass rewrite in a reviewer's diff view.
- **Segment overlap re-measured to zero drift.** 3,598 prefix / 901 tail / **459 both** / 3,139
  prefix-only / 442 tail-only — every value identical to research. 459 is **51.0% of the tail**,
  which is the number plan 151-05's chronological-prefix decision actually turns on.
- **Six pre-seeded findings re-run, six `holds`, zero `resolved`** — plus two new ones (F-07 the
  NBSP checkbox, F-08 the tracked `tsbuildinfo`), each with a verifying command.

## Task Commits

1. **Task 1: Re-measure every cited automated gate's reach (D-18)** — `0e486f6bb` (docs)
2. **Task 2: Re-measure slice anatomy, segment overlap, rename inventory** — `0a60f3a5d` (docs)
3. **Task 3: Re-confirm pre-seeded findings and the stale-path target set** — `cfee9803a` (docs)

## Files Created/Modified

- `.planning/phases/151-ship-v0-2-akita-review-stack/151-MEASUREMENTS.md` — 66-key frontmatter plus
  four sections: § 0 the 31-item correction and canonical numbering; § 1 the 31-row reach table with
  five deep-dives (axe, Phase 147, A6, `db:lint:sql`, the conditional CI job); § 2 slice anatomy,
  drift decomposition, rename inventory, segment overlap; § 3 the eight findings, the 13-row
  stale-path catalog, the `.agents/` D-15-vs-item-7 ruling, and the TODO census. Closes with a
  "What this record does NOT establish" section and a self-check table.

## Decisions Made

**The checklist has 31 items and one of them is not a checkbox.** `hexdump` on
`.agents/code-review-checklist.md:8` shows `2d 20 5b c2 a0 5d c2 a0` — the `any` item is written
`- [<U+00A0>]<U+00A0>Avoid…`, with no-break spaces both inside and after the brackets. Two
consequences: `grep -c '^- \[ \] '` returns **30** against `grep -c '^- \['`'s **31**, which is
exactly how research recorded "30 items" for a file whose own inventory table has 31 rows; and
`- [<NBSP>]` is not a valid GFM task-list marker, so **the item cannot be ticked in a PR review** —
the single item this phase spends the most measurement effort on. Canonical numbering is fixed at
**1–31**, which reproduces research's General-block numbering exactly (its `any` row is 4, WCAG 13,
guides 15, history 16). Research's table was right; its total was the wrong part.

**Zero gates are exhaustive, and that is the headline.** The temptation in a phase like this is to
record the strong gates and let the weak ones blur. The closed vocabulary makes blurring impossible:
`none` had to be written 21 times, including for items — `safeGetSession()` over `getSession()`,
`SECURITY DEFINER` + `search_path = ''`, `TO anon`/`TO authenticated` — that are trivially greppable
and where a gate would be cheap. Recording that they are *ungated* is worth more to plan 151-06 than
recording that they are *provable*.

**`yarn db:lint:sql` is not sqlfluff, and `CLAUDE.md` says it is.** Measured, it is
`supabase db lint --schema public --fail-on warning` (plpgsql_check — PL/pgSQL bodies only) plus a
174-line `lint-schema.mjs` implementing **exactly two** Splinter advisors: 0013 RLS-disabled (ERROR)
and 0001 unindexed-FK (WARNING). `find` for any `.sqlfluff*` config returns empty. Of the 9
Supabase-Backend items, **2 are partially covered and 7 are not covered at all** — and the two that
are, are covered only in half: 0013 checks that RLS is *on*, not that the 5-policy pattern exists;
0001 checks *FK* columns, not `project_id`. Recorded against `CLAUDE.md` as well as research,
because the same sentence appears in both.

**The +271 was arithmetic, not drift.** 151-01 attributed it to "Phases 141–150 advanced
`feat-gsd-roadmap`". Reproducing *both* measurement methods rather than re-running one settles it:
research built its rename commit with `--drop-prefix backend/`; 151-01 built its without (D-09 Q4
moved the Strapi removal to slice 01b). Those 249 `backend/**` paths are absent from research's
`C1 → target` diff and present in 151-01's. `249 + 22` (this phase's own `.planning` output) `= 271`
exactly, and today's `249 + 34 = 283`. The independent confirmations: `D = 175` and `M = 404` are
**byte-identical** to research, the code-only surface is 1,721 against research's ~1,723, no phase
directory exists for 141–150, and `origin/main` has never moved. 151-01's *conclusion* ("nothing was
hard-coded, so nothing broke") stands untouched; only its cause is corrected.

**D-15 exempts `.agents/` from the sweep, not from the checklist.** Two different questions, settled
separately in the record. D-15's exemption answers *"does the D-14/D-16 codemod rewrite this file's
planning citations"* — no, and its citations stay intact. Item 7 asks *"are this file's four links
to a tree that moved three milestones ago still broken"* — yes, and those are not planning
citations, they are plain broken relative links to `docs/src/routes/…`, a path that does not exist
on disk. The checklist is repo documentation and its own item 7 applies to it. It carries two
independent item-7 defects (F-04's five stale links, F-07's NBSP) and neither is in D-15's scope.

**F-01 is invisible to the slice partition, and that had to be caught here.**
`apps/frontend/jest.config.json` does not appear in the `C1 → TARGET` diff at all: the blob is
identical at both ends, so C1's rule re-paths `frontend/jest.config.json` into place and no later
slice's diff contains it. A reviewer of any slice will never see it. Whichever plan dispositions
item 5 must reach it deliberately — the partition will not deliver it. This is the first instance
found of a *finding* that the partition structurally hides, as distinct from a *path* the partition
might drop, which the catch-all tripwire already covers.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 – Bug] The record's own verdict census was wrong on first write**

- **Found during:** Task 1 self-check.
- **Issue:** Frontmatter and prose both claimed `partial: 9 / none: 22`. A regex census over the
  table the record had just written returned `partial: 10 / none: 21` — item 16 had been
  hand-counted into the wrong bucket.
- **Fix:** Corrected both, and replaced the hand-count with a **re-derivation from the table itself**
  embedded in the record, plus the explicit `partial` row list (3, 4, 9, 11, 12, 13, 14, 16, 18, 22)
  so the claim is checkable rather than assertable.
- **Verification:** `Counter` over the last column → `{none: 21, partial: 10}`; 31 rows, contiguous.
- **Committed in:** `0e486f6bb`.
- **Worth naming:** this is the phase's own failure mode reproduced *inside the file that exists to
  prevent it* — a summary statistic asserted rather than derived. It survived exactly one self-check.

**2. [Rule 3 – Blocking] Section headings broke their own `<verify>` greps**

- **Found during:** Task 2 verification.
- **Issue:** Written as `## 2. Slice anatomy (re-measured)`, which does not *contain* the literal
  `## Slice anatomy (re-measured)` the plan's `grep -q` requires. Same trap awaited Task 3's
  `## Pre-seeded findings (re-confirmed)`.
- **Fix:** Headings match their acceptance literal exactly; the section number moved to an italic
  sub-line. Task 3's heading was written correct from the start as a result.
- **Verification:** both `grep -q` invocations pass.
- **Committed in:** `0a60f3a5d`.
- **Note for later plans:** this is the same shape as 151-01's `run: dry-run-tracer` count trap —
  an acceptance criterion that greps a literal is a constraint on prose, and decorating a heading
  breaks it silently.

### Documented interpretations (not changes)

**3. The record has 31 rows where the criterion says "exactly 30"**

Task 1's acceptance criterion says *"a table with exactly 30 rows, one per checklist item"*, and its
two machine checks say `>= 30` and `at least 30`. The checklist has **31** items (§ 0). The record
carries **31** rows — one per item, which is the criterion's actual intent — and both machine checks
pass. The "30" is the inherited miscount this plan exists to correct; satisfying it literally would
have meant dropping a real checklist item from the disposition index.

**4. Task 2's areas are a *measurement* partition, not a proposed review partition**

The plan asks the anatomy to "cover at minimum each area named in § Slice Anatomy, plus the residual
areas that table does not name". The 14 areas are chosen to be **disjoint and total** so the counts
are trustworthy (sum-equals-total proves no overlap; a residual bucket that absorbs everything
proves no gap). They are explicitly *not* a slice recommendation — the record says so in "What this
record does NOT establish". Plan 151-05 chooses the review partition; § 2.1a exists so it does that
with `hooks.server.ts` and the two dead codemods in view rather than absorbed into a config slice.

**5. Task 2's >10% divergence note fires for no code area**

The plan asks for a one-line cause note wherever a re-measured value differs from research by more
than 10%. Every code area is within 0 files except `apps/docs`(+1) and root-config(−2); only
`.planning`/`.claude` (+35) and the two never-before-named residual rows exceed the threshold, and
both have their cause recorded in § 2.2. The instruction's suggested cause — "which of Phases
141–150 touched that area" — is unusable, because none of those phases exist; § 2.2 supplies the
real cause instead, per the execution brief's carry-forward item 4.

---

**Total deviations:** 2 auto-fixed (Rules 1 and 3), 3 documented interpretations.
**Impact on plan:** None on scope. No architectural change, no package installed, no source file
touched.

## Issues Encountered

**A no-break space defeated a `grep` census and nearly propagated.** The visual read of the
checklist says 16 general items; `awk '/^- \[ \] /'` says 15. Rather than trust either, `hexdump`
settled it. This is the **fourth** under-specified-pattern defect in this phase (C-5's `D-NN` word
boundary, `as any`'s missing left boundary, `git grep -I`, now U+00A0) and the first where the defect
is in the *data* rather than the *pattern*. General lesson recorded for plan 151-06: when a grep
census disagrees with a visual read, the bytes decide.

**`merge-tree` exits 1 on success, again.** Same `CONFLICT (file location)` notification for
`youthvotes-logo.png` that 151-01 documented; `merge-ort` had already placed the file at
`apps/docs/static/images/`. Handled by inspecting the tree, not the status. Third confirmation of
C-4.

## Threat Flags

None. This plan created one `.md` file and read the tree; it introduced no network endpoint, auth
path, file-access pattern, or schema change. Threat **T-151-04-04** (Tampering, disposition `accept`)
is discharged by the working-tree cleanliness check in § Safety Posture.

**T-151-04-03 routing confirmed:** the two `filterContext.svelte.ts:131,136` runtime warning strings
are recorded as finding **F-05** against checklist items 3 and 10, and routed to plan 151-08's
judgement-driven residue pass rather than the D-14/D-16 codemod, because a codemod reaching into
string literals would be rewriting behaviour rather than comments.

## Safety Posture

| Constraint | Evidence |
|---|---|
| No push to any remote | `git ls-remote --heads origin 'ship/*'` empty; no `git push`, no `gh` invocation |
| No PR opened | none |
| No force-push / reset / branch deletion | none run; `feat-gsd-roadmap` only ever advanced by this plan's three commits |
| No `git clean` / `git stash` | none run |
| Backup worktree untouched | still detached at `fe91f3099`, `git status --porcelain` empty; 8 worktrees, unchanged |
| No source file modified | `git status --porcelain -- . ':(exclude).planning'` empty |
| Throwaway objects unreferenced | `git for-each-ref --contains` → 0 for `3808a75b8`, `d01e69c54`, `d65ca1a95`; scratch indexes deleted |
| `origin/main` unchanged | `ac30f132a` — same as research, 151-01 and 151-03 |

## Known Stubs

None. Every row of `151-MEASUREMENTS.md` carries a producing command; there is no placeholder,
no TBD, and no section reserved for a later plan.

## What This Does NOT Prove

- **Nothing is dispositioned.** Every row is a *reach* measurement or a *finding*. No checklist item
  is marked met, unmet, or waived by this plan — that is 151-06's work.
- **The gates were not re-run.** `lint:check` / `format:check` / `test:unit` results remain the
  151-03 baseline's. This plan measured what those gates *reach*, not what they currently *return*.
- **No slice boundary was chosen.** § 2.1's areas are disjoint-and-total for counting purposes only.
- **Item-level *conformance* is unmeasured.** Knowing `safeGetSession()` is ungated says nothing
  about whether the 24 adapter files actually use it.

## Self-Check: PASSED

File verified present on disk:

- FOUND: `.planning/phases/151-ship-v0-2-akita-review-stack/151-MEASUREMENTS.md` (1,096 lines, 71,172 bytes)

Commits verified in `git log`:

- FOUND: `0e486f6bb` — docs(151-04): measure every cited gate's reach against the execution-time tree
- FOUND: `0a60f3a5d` — docs(151-04): re-measure slice anatomy, rename inventory, and segment overlap
- FOUND: `cfee9803a` — docs(151-04): re-confirm the pre-seeded findings and the stale-path target set

Plan `<verify>` blocks, all three re-run at completion:

- Task 1 — `awk '/^\| *[0-9]+ \|/{c++} END{print c+0}'` → **51** ≥ 30 → **pass**
- Task 2 — `grep -q '## Slice anatomy (re-measured)'` **and** `grep -q 'diff.renameLimit=20000'` → **pass**
- Task 3 — `grep -q '## Pre-seeded findings (re-confirmed)'` → **pass**

Additional acceptance checks:

- `grep -c 'exhaustive\|partial\|none'` → **62** ≥ 30 → pass
- main table: **31** rows, contiguous 1–31, `{none: 21, partial: 10}`, 0 blank → pass
- area rows sum **4,252** vs measured total **4,252** → 0.00% divergence (2% allowed) → pass
- stale-path table **13** rows vs `git grep -l -F 'docs/src/routes' -- . ':(exclude).planning' | wc -l` → **13** → pass
- frontmatter parses under `yaml.safe_load` → **66** keys → pass

Estimate calibration: the plan estimated 45,000 tokens (confidence `low`); the realized artifact is
71,172 chars + 3 commit messages ≈ **20,800 estimateTokens** — a 2.2× overestimate. The estimate
priced discovering the measurements; three quarters of the cost turned out to be *reading gate
source and reconciling two prior records*, which is cheaper per token than producing new analysis but
produced four corrections. Recorded unrounded.
