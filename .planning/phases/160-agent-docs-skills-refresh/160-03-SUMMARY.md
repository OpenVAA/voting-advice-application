---
phase: 160-agent-docs-skills-refresh
plan: 03
subsystem: docs
tags: [skills, extension-patterns, dev-seed, playwright, e2e, link-integrity]

requires:
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 01's `.claude/scripts/audit-skill-links.sh` and its per-file dangling baseline, against which every citation written here was measured"
  - phase: 160-agent-docs-skills-refresh
    provides: "Plan 02's diagnosis of the defective `awk '/## X/,/^## /'` idiom, which this plan's acceptance criteria reproduce six times"
  - phase: 152-comment-and-naming-hygiene
    provides: the planning-reference scan in `yarn lint:check` that every line written here satisfies
  - phase: 156-schema-rename
    provides: the post-rename `organizations` vocabulary the dev-seed step's `Pattern:` pointer uses
provides:
  - "`database/extension-patterns.md` § Adding a New Table ends with a dev-seed template CHECK naming `packages/dev-seed/src/templates/index.ts`, `default.ts`, `e2e/base.ts` and the README's template-shape reference"
  - "Both guides of `filters/extension-patterns.md` end with an E2E coverage step naming the real fixture, its twelve real helper methods and the real journey test"
  - "All four `extension-patterns.md` files end their `## Verification After Extension` list with the reflexive re-check note, identically phrased, each naming its own skill's listing files"
  - "A re-measured live incident for that note: `database/schema-reference.md` claims 17 tables / 18 SQL files against a live 20 tables / 25 files"
  - "`filters/extension-patterns.md` at 0 dangling citations (was 13 of 21) — a −13 delta against Plan 01's corpus baseline"
affects: [160-04, 160-05, 160-08]

actuals:
  tokens: 5514
  tasks: 3
  commits: 3
plan_head_before: 447f60af2bf3ad69baf153f60453927ef1b9d18d

tech-stack:
  added: []
  patterns:
    - "A procedure step that adds surface to an adjacent package is written as a CHECK with a named entry point and an honest in-scope/out-of-scope split, never as an unconditional sweep"
    - "Every helper method a doc names is re-derived from the file at authoring time and asserted by a token loop against that file"
    - "A normative note in the corpus carries a measurement re-derived at authoring time, and when the incident the plan names has since been repaired, a live one of the same class is measured and substituted"

key-files:
  created: []
  modified:
    - .claude/skills/database/extension-patterns.md
    - .claude/skills/filters/extension-patterns.md
    - .claude/skills/data/extension-patterns.md
    - .claude/skills/matching/extension-patterns.md

key-decisions:
  - "The re-check note's incident was SUBSTITUTED, not copied. The plan's must_have names 'schema filenames the database skill cites that no longer exist'; re-measured at execution time that class is ZERO — all 19 distinct three-digit `.sql` names the skill cites exist in `apps/supabase/supabase/schema/`, confirming Wave 1's finding. A live incident of the same class was measured instead: `database/schema-reference.md`'s own header claims 17 tables from 18 SQL files against a live 20 tables across 25 files."
  - "The E2E step was extended to the second filter guide (`Adding a Question-Type Filter Variant`) by this plan's judgement, not by the reviewer's instruction — the reviewer commented on the first guide only."
  - "`filters/extension-patterns.md`'s 13 inherited package-relative citations were repaired inside this plan, because Task 2's own acceptance criterion demands the auditor exit 0 for that file. The file's `All file paths … relative to packages/filters/src/` preamble was replaced with `All file paths are repo-relative.` accordingly."
  - "The verbatim source quote at `filters/extension-patterns.md` step 3 (`NB! When editing these, be sure to update /utils/typeGuard.ts as well.`) was deliberately left unrewritten — it quotes a comment in `filterTypes.ts` and rewriting it would falsify the quote."
  - "Six acceptance criteria specify a degenerate `awk` range; each was evaluated against the region it plainly intends with a substituted idiom, recorded criterion by criterion below. No file content was bent to satisfy the defective form, and no vacuous pass is reported as a pass."

patterns-established:
  - "Scoped-check step: `N. **Check whether X must …** \\`<entry point>\\`` + `Usually in scope:` / `Usually NOT in scope:` sub-bullets with re-derived counts + the corpus's `Pattern: follow existing …` pointer."
  - "Reflexive verification item: the final item of a `## Verification After Extension` list names the skill's own listing files and carries a dated, re-derived incident as its rationale."

requirements-completed: [REVIEW-DOC-02]

coverage:
  - id: D1
    description: "`database/extension-patterns.md` § Adding a New Table ends with a dev-seed check naming `packages/dev-seed/src/templates/index.ts` as the registry entry point and `packages/dev-seed/README.md` as the shape reference"
    requirement: REVIEW-DOC-02
    verification:
      - kind: other
        ref: "sed -n '/^## Adding a New Table/,/^## Adding RLS Policies/p' | grep -c 'packages/dev-seed/src/templates/index.ts' -> 2; grep -c 'packages/dev-seed/README.md' -> 1; grep -ci 'dev-seed' -> 6"
        status: pass
    human_judgment: false
  - id: D2
    description: "The dev-seed step is a scoped check, not a blanket instruction to update every template"
    requirement: REVIEW-DOC-02
    verification:
      - kind: other
        ref: "region grep -ci 'update all .*templates' -> 0; the step names default.ts + e2e/base.ts as in scope and the 28 perm fixtures as usually out of scope"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both filter-extension guides end with an E2E coverage step naming the real fixture, its real helper methods and the real journey test"
    requirement: REVIEW-DOC-02
    verification:
      - kind: other
        ref: "guide-1 region grep -ci e2e -> 3; guide-2 region -> 2; grep -c 'tests/tests/fixtures/voter/entityFilters.fixture.ts' -> 2; grep -c 'voter-journey.spec.ts' -> 4"
        status: pass
      - kind: other
        ref: "helper-token loop over both new steps: 13 method names extracted, 0 ABSENT against tests/tests/fixtures/voter/entityFilters.fixture.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "All four `## Verification After Extension` lists end with the re-check note, each naming its own skill's listing files"
    requirement: REVIEW-DOC-02
    verification:
      - kind: other
        ref: "presence loop -> no MISSING; final-numbered-item loop -> no NOT LAST; tail -3 self-reference loop -> no NO SELF-REFERENCE"
        status: pass
    human_judgment: false
  - id: D5
    description: "The note's rationale is a re-derived measurement whose numerals match a fresh derivation"
    requirement: REVIEW-DOC-02
    verification:
      - kind: other
        ref: "CREATE TABLE census -> 20; ls schema/*.sql -> 25; schema-reference.md:3 claims 17/18; documented-table census -> 17; comm of the two sets -> admin_jobs feedback feedback_rate_limits (3)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every backticked path citation added by this plan resolves, and no file's dangling count rose"
    verification:
      - kind: other
        ref: "audit-skill-links.sh per file: data 16/31 (was 16/26), database 12/29 (was 12/17), filters 0/24 (was 13/21), matching 7/16 (was 7/11) — 22 new citations, 0 new dangling"
        status: pass
      - kind: other
        ref: "yarn lint:check -> exit 0 (read directly, not through a pipe)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The three scope dispositions on the reviewer's 'all skills' — four extension-pattern skills in, `ship-review-stack` out, `components` via Plan 05"
    verification:
      - kind: other
        ref: "git diff --name-only names no path under .claude/skills/ship-review-stack/"
        status: pass
    human_judgment: true
    rationale: "Whether 'all skills' means the four with an extension-patterns.md is the membership question the deterministic edge probe returned `unclassified` on. The dispositions are recorded and reasoned, but per the plan's own flagged assumption a verifier must confirm the set with a human rather than treat it as silently satisfied."
  - id: D8
    description: "The substituted incident in the re-check note reads to a future author as a real cost rather than as boilerplate, and the dev-seed step's in-scope/out-of-scope split matches how a new table is actually seeded in practice"
    verification: []
    human_judgment: true
    rationale: "Whether a scoped instruction is followed rather than ignored — the exact failure the plan's prohibition names — is a reading judgement no grep can make. The 28-of-30-fixtures split is measured; its usefulness as guidance is not."

duration: 8 min
completed: 2026-09-13
status: complete
---

# Phase 160 Plan 03: Extension-Pattern Completion Summary

**Three missing procedure steps landed across four skills — a scoped dev-seed template check on the new-table guide, an E2E coverage step on both filter guides naming the fixture's twelve real helper methods, and a reflexive re-check note closing every `## Verification After Extension` list, carrying a live re-measured incident after the one the plan named was found already repaired.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-13T17:04:09Z
- **Completed:** 2026-09-13T17:11:57Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- **REVIEW-DOC-02's three missing steps are present**, each naming concrete files rather than issuing a generic instruction.
- **The re-check note's cost is re-measured, not inherited.** The plan's incident (retired schema filenames in the `database` skill) was measured at execution time and found **already repaired**. A live incident of the same class was measured and substituted — recorded in full below.
- **Every helper method the E2E step names was re-derived from the fixture** and asserted by a token loop: 13 names, 0 absent.
- **`filters/extension-patterns.md` went from 13 dangling citations to 0**, a −13 delta against Plan 01's corpus baseline (whole corpus now 327 of 704, down from 350 of 672 at Plan 01 and 340 after Plan 02).
- **Six defective acceptance criteria were evaluated on their merits**, with the substituted idiom and result recorded per criterion.

## Task Commits

1. **Task 1: dev-seed template check on the new-table procedure** — `cd2e6dccb` (docs)
2. **Task 2: E2E coverage step on both filter-extension guides** — `0d1957286` (docs)
3. **Task 3: reflexive re-check note in all four verification lists** — `2ed84d299` (docs)

`commits: 3` is MEASURED: `git rev-list --count 447f60af2..HEAD` → 3 (the SUMMARY commit follows this file).

## The defective `awk` idiom — per-criterion disposition

Six acceptance criteria in `160-03-PLAN.md` (Task 1, five criteria; Task 2, one) extract a region with

```
awk '/## Adding a New Table/,/^## /' .claude/skills/database/extension-patterns.md
```

In `awk` a range expression tests the END pattern against the same record the START pattern matched, and `## Adding a New Table` itself matches `^## `. **The range is therefore one line long — the heading — always.** Demonstrated at execution time: that command piped to `wc -l` returns `1`.

Consequence: the four `returns at least 1` criteria are **unsatisfiable** as written, and the `grep -ci 'update all .*templates' returns 0` criterion passes **vacuously** — it greps a single heading line that could never contain the phrase. A vacuous pass is not evidence and is not reported as one here.

Substituted idiom, used for all six: `sed -n '/^## <start>/,/^## <next heading>/p'`, whose end pattern cannot match the start line.

| # | Criterion (Task) | Idiom substituted | Result |
|---|---|---|---|
| 1 | region `grep -ci 'dev-seed'` ≥ 1 (T1) | `sed -n '/^## Adding a New Table/,/^## Adding RLS Policies/p'` | **6** — PASS on merits |
| 2 | region `grep -c 'packages/dev-seed/src/templates/index.ts'` ≥ 1 (T1) | same | **2** — PASS on merits |
| 3 | region `grep -c 'packages/dev-seed/README.md'` ≥ 1 (T1) | same | **1** — PASS on merits |
| 4 | region `grep -c 'Pattern: follow existing'` greater than before (T1) | same, run against `git show HEAD:<file>` for the before value | **5 → 6** — PASS on merits |
| 5 | region `grep -ci 'update all .*templates'` = 0 (T1) | same | **0** over the real 79-line region — PASS on merits (the plan's form would have passed over 1 line: a **false green**, not reported as a pass) |
| 6 | guide-2 `awk '/## Adding a Question-Type Filter Variant/,0'` `grep -ci 'e2e'` ≥ 1 (T2) | **none needed** — `,0` never matches, so the range runs to EOF and the idiom is sound | **2** — PASS as written |

Task 2's guide-1 criterion (`awk '/## Adding a New Filter Type/,/## Adding a Question-Type Filter Variant/'`) is also sound — its end pattern cannot match its start line — and returned **3** (61-line region). Both were additionally re-run with the plan's literal wording and agree with the `sed` form.

**No file content was changed to accommodate any defective idiom.**

## The re-check note's incident — RE-MEASURED, and substituted

The plan's `must_haves.truths` requires the note to cite *"the count of schema filenames the `database` skill names that no longer exist, and the number of places they are cited."* Re-derived at execution time:

```
grep -rhoE '[0-9]{3}-[A-Za-z0-9_-]+\.sql' .claude/skills/database/ | sort -u   # 19 distinct names
ls apps/supabase/supabase/schema/                                             # 25 files
```

**Every one of the 19 distinct names exists on disk. The count of dangling schema filenames is 0, cited in 0 places.** This confirms Wave 1's finding (160-01-SUMMARY, deviation 2): the renumbering class was repaired upstream. The 12 citations the link auditor still reports for that file are `schema/302-rls.sql`-style **package-relative** paths missing their `apps/supabase/supabase/` prefix — a citation-style defect, not a name that no longer exists — and are explicitly out of this plan's scope, filed by Plan 04.

Shipping `0 filenames in 0 places` inside a note whose whole point is "re-check your listings" would have been self-defeating. A **live incident of the same class** was measured and used instead:

| Measurement | Command | Result |
|---|---|---|
| What the skill claims | `sed -n '3p' .claude/skills/database/schema-reference.md` | "Complete column listing for all **17 tables** … Source: `apps/supabase/supabase/schema/` (**18 SQL files**)." |
| Tables the listing documents | bold-heading census over `## Table Reference` | **17** |
| Tables the schema declares | `CREATE TABLE` census over `apps/supabase/supabase/schema/*.sql` | **20** |
| SQL files in that directory | `ls apps/supabase/supabase/schema/*.sql \| wc -l` | **25** |
| Tables absent from the listing | `comm` of the two sets | **3**: `admin_jobs`, `feedback`, `feedback_rate_limits` |

The note as shipped (identical in all four files, verified: `tail -1` across the four yields **1** unique line):

> The cost is measured, not asserted. Re-derived 2026-09-13: `.claude/skills/database/schema-reference.md` opens by calling itself a complete column listing for 17 tables drawn from 18 SQL files, while `apps/supabase/supabase/schema/` declares 20 tables across 25 files -- three tables (feedback, feedback_rate_limits, admin_jobs) absent from a listing that announces itself complete. Nothing caught it, because nothing re-checked the skill after the schema grew.

**Every numeral in the note matches the fresh re-derivation above.** Those three tables are **not fixed here** — `database/schema-reference.md` is not in this plan's `files_modified`, and the fix is Plan 04's todo territory alongside the package-relative citation class. **Plan 04 should file it**: `.claude/skills/database/schema-reference.md:3` (stale header counts) plus the three missing table blocks under `### Infrastructure` / a new `### Feedback` section.

## The three scope dispositions on "all skills"

| Skill | Disposition | Reason |
|---|---|---|
| `data`, `database`, `filters`, `matching` | **Included here** | The four skills that have an `extension-patterns.md`, each with a uniform `## Verification After Extension` list. Each copy names its own skill's listing files. |
| `ship-review-stack` | **Excluded** | No `extension-patterns.md`, and `BOUNDARIES.md` states that process skills own no source directory. The reviewer's rationale ("bc they contain listings") does not apply to a procedure that enumerates no source. Asserted mechanically: `git diff --name-only 447f60af2..HEAD` names no path under `.claude/skills/ship-review-stack/`. |
| `components` | **Included, via Plan 05** | It will carry a component listing (D-I3's whole subject), so the rationale applies a fortiori — but Plan 05 rewrites the file anyway, and writing the note here would be written twice. |

## The E2E step in the second filter guide — this plan's judgement

RESEARCH § 2b left it open; the plan recorded the decision and required it be attributed. **Recording it: the reviewer commented on `## Adding a New Filter Type` only (`PRE-SHIP-REVIEW-TRIAGE.md:355`). The step was added to `## Adding a Question-Type Filter Variant` by this plan's judgement**, because a question-type variant is reached by the same voter through the same results-view dialog and needs the same proof, and because leaving one guide complete and the other not is exactly the drift this phase exists to remove.

The second copy is tailored, not duplicated: it says a variant on an existing base usually needs **no** fixture change, names the seed-data precondition (`packages/dev-seed/src/templates/e2e/base.ts` — the question type must exist in the seeded template or the assertion is vacuous), and points at the `EFLOW-01` test step rather than the Party/pick-multiple one.

## Routing shape (the one-level rule)

**No table-of-contents or second index was introduced.** Every pointer added by this plan names a concrete file:

- dev-seed step → `packages/dev-seed/src/templates/index.ts`, `default.ts`, `e2e/base.ts`, `e2e/perm/`, `src/template/types.ts`, and `README.md` at a **named heading** ("Template shape reference") rather than at the README's top.
- E2E steps → `tests/tests/fixtures/voter/entityFilters.fixture.ts`, `tests/tests/specs/voter/voter-journey.spec.ts` (by test name, not line number), `apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte`.
- re-check note → each skill's own `.md` files by full path.

`templates/index.ts` is named as an entry point, but it is the **registry itself** — the source file an author must edit to register a template — not an overview whose only job is to point onward. No flattening was needed.

## Files Created/Modified

- `.claude/skills/database/extension-patterns.md` — step 14 added to `Adding a New Table` (+6 lines); re-check item 7 added to the verification list (+2).
- `.claude/skills/filters/extension-patterns.md` — step 7 added to both guides (+12); re-check item 7 added (+2); 13 package-relative citations rewritten repo-relative and the header preamble replaced (33 lines rewritten).
- `.claude/skills/data/extension-patterns.md` — re-check item 9 added (+2).
- `.claude/skills/matching/extension-patterns.md` — re-check item 8 added (+2).

Measured surface, all re-derived at execution time and written into the dev-seed step: **30** registered built-ins in `BUILT_IN_TEMPLATES`, **40** `.ts` files under `packages/dev-seed/src/templates/`, **28** per-permutation fixtures (27 `perm-*` + `show-feedback-survey`), agreeing with `packages/dev-seed/README.md`'s own "28 of the 30 built-ins".

## Decisions Made

See `key-decisions` in the frontmatter. The load-bearing one is the first: the plan handed this executor a stale incident, and shipping it would have put a false assertion inside the very note that tells authors their listings go stale.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The incident the plan requires the note to cite is no longer live**

- **Found during:** Task 3
- **Issue:** `must_haves.truths` requires the note to cite the count of schema filenames the `database` skill names that no longer exist and the number of places they are cited. Re-measured at execution time both counts are **0** — all 19 distinct three-digit `.sql` names the skill cites exist. The plan's figures are planning-time readings taken before the upstream repair Wave 1 recorded.
- **Fix:** A live incident of the same class was measured and substituted (`schema-reference.md`'s 17/18 header against a live 20/25), with all numerals re-derived and recorded above. The plan's `<upstream_dependency>` block explicitly instructs "re-derive every path and count against the working tree at execution time", so this is the instructed behaviour rather than a departure from intent.
- **Files modified:** all four `extension-patterns.md`
- **Verification:** `grep -rhoE '[0-9]{3}-[A-Za-z0-9_-]+\.sql' .claude/skills/database/ | sort -u` → 19 names, all present in `apps/supabase/supabase/schema/`; the substituted numerals re-derived and matched (table above)
- **Committed in:** `2ed84d299`

**2. [Rule 3 - Blocking] Thirteen inherited dangling citations blocked Task 2's own exit-0 gate**

- **Found during:** Task 2
- **Issue:** Task 2's last acceptance criterion requires `audit-skill-links.sh .claude/skills/filters/extension-patterns.md` to exit 0. The file arrived at `Dangling: 13 of 21` — the corpus-wide package-relative habit Plan 01 baselined. Nothing this plan wrote could clear that gate without repairing them.
- **Fix:** All 13 re-anchored at the repo root under `packages/filters/src/` (and `packages/filters/tests/filter.test.ts`), each target confirmed on disk; three bare filenames (`choiceQuestionFilter.ts`, `textQuestionFilter.ts`, `numberQuestionFilter.ts`) made full for consistency; the header preamble "All file paths in steps are relative to `packages/filters/src/`" replaced with "All file paths are repo-relative." so the document does not contradict itself.
- **Files modified:** `.claude/skills/filters/extension-patterns.md`
- **Verification:** `bash .claude/scripts/audit-skill-links.sh .claude/skills/filters/extension-patterns.md` → `Checked: 24  Dangling: 0`, exit 0
- **Committed in:** `0d1957286`

**3. [Rule 1 - Bug] Six acceptance criteria specify a degenerate `awk` range**

- **Found during:** Task 1 (running the criteria)
- **Issue:** Identical to Plan 02's deviation 3, in a different file. `awk '/## X/,/^## /'` collapses to the heading line. Four criteria become unsatisfiable and one passes vacuously.
- **Fix:** Each criterion evaluated against the region it plainly intends using `sed -n '/^## <start>/,/^## <next>/p'`, with the substituted idiom and result recorded per criterion in the table above. No file content was bent to the defective form.
- **Files modified:** none (a verification-instrument correction)
- **Verification:** `awk '/## Adding a New Table/,/^## /' … | wc -l` → `1`, demonstrating the collapse; the `sed` form returns the 79-line region used throughout
- **Committed in:** n/a — recorded here

**4. [Rule 2 - Missing Critical] The verbatim source quote in filters step 3 would have been falsified by the repo-relative sweep**

- **Found during:** Task 2
- **Issue:** Step 3 quotes a comment from `filterTypes.ts`: "NB! When editing these, be sure to update `/utils/typeGuard.ts` as well." A blanket rewrite of `utils/typeGuard*.ts` tokens would have silently edited a quotation, making the skill misreport what the source says.
- **Fix:** The rewrite pattern was written to leave the leading-slash form untouched. The quote is byte-identical to before; the auditor skips it as an absolute path.
- **Files modified:** `.claude/skills/filters/extension-patterns.md`
- **Verification:** `grep -c 'be sure to update `/utils/typeGuard.ts` as well'` → 1, unchanged across the commit
- **Committed in:** `0d1957286`

---

**Total deviations:** 4 (2 × Rule 1 bug — one in content, one in a verification instrument; 1 × Rule 2 missing-critical; 1 × Rule 3 blocking).
**Impact on plan:** No scope creep — every edit landed in a file named in `files_modified`. Deviation 1 is the one to read closely: it changes what the shipped note says relative to the plan's literal `must_haves.truths` clause, in the direction the plan's own `<upstream_dependency>` block mandates. **Plan 04's reconciliation appendix should record** that REVIEW-DOC-02's "measured incident" clause is now discharged by the `schema-reference.md` 17/18-vs-20/25 finding rather than by the retired-schema-filename one, and that the retired-filename class is measured at 0.

## Issues Encountered

- **RESEARCH § 2a's template inventory itemises 37 of the 40 `.ts` files.** Its table lists `default.ts` (1), `defaults/*` (4), `e2e/base.ts` (1), `e2e/perm/*` (30) and `index.ts` (1) = 37, while stating a total of 40. The three unlisted files are `packages/dev-seed/src/templates/_helpers/` (`buildMinimal.ts`, `buildMinimal.test.ts`, `index.ts`). The shipped step cites the total (40) and the registry count (30) rather than the itemisation, so no wrong number was carried.
- **`e2e/perm/` holds 30 files but only 28 are registered templates** — `shared.ts` is a shared helper and `notLocated2e2cgShape.ts` a shape module. The step says "the 28 per-permutation E2E fixtures under `packages/dev-seed/src/templates/e2e/perm/`", which agrees with `packages/dev-seed/README.md`'s own "28 of the 30 built-ins" and with a key census of `BUILT_IN_TEMPLATES`.

## Verification

| Check | Result |
|---|---|
| `bash .claude/scripts/audit-skill-links.sh .claude/skills/database/extension-patterns.md` | `Checked: 29  Dangling: 12` — baseline 12, **unchanged**; 7 new citations, all resolving |
| `bash .claude/scripts/audit-skill-links.sh .claude/skills/filters/extension-patterns.md` | `Checked: 24  Dangling: 0`, **exit 0** — was 13 of 21 |
| `bash .claude/scripts/audit-skill-links.sh .claude/skills/data/extension-patterns.md` | `Checked: 31  Dangling: 16` — baseline 16, **unchanged** |
| `bash .claude/scripts/audit-skill-links.sh .claude/skills/matching/extension-patterns.md` | `Checked: 16  Dangling: 7` — baseline 7, **unchanged** |
| `bash .claude/scripts/audit-skill-links.sh` (whole corpus) | `Checked: 704  Dangling: 327  Skipped: 194` — 350 at Plan 01, 340 after Plan 02, **327** now |
| `yarn lint:check` | **exit 0**, read directly from `$?` on the command itself, not through a pipe. 23/23 tasks; all in-tree guards at 0 violations including the Phase 152 comment-hygiene scan |
| `npx prettier --check` on all four files | clean |
| Every Task 1–3 acceptance criterion | PASS on merits (outputs above; six evaluated with a substituted idiom, tabulated) |
| Fixture helper-token loop | 13 names extracted from the two new steps, **0 ABSENT** |
| Note phrasing identical across four files | `tail -1` across the four → **1** unique line |
| Prohibition: no ROADMAP/STATE/REQUIREMENTS write | `git diff --name-only 447f60af2..HEAD` → CLEAN |

**Not run: the E2E suite and unit tests.** `git diff 447f60af2..HEAD --stat` is four Markdown files under `.claude/skills/`; no application, test, config or package source was touched, so no test outcome can differ. Recorded rather than silently skipped.

**Not claimed: CI verification.** `.github/workflows/main.yaml` carries `paths-ignore: "**.md"`, so a Markdown-only change never triggers it. A green `audit-skill-drift.sh` is likewise not evidence — this phase's own commits reset its per-skill baseline, and it was RED for `database`, `filters` and `matching` before these commits for reasons this plan does not resolve. The evidence for this plan is the local runs above.

## Known Stubs

None. The three steps are complete and each names files that exist.

## Deferred Issues

- **`database/schema-reference.md`'s header is stale** (17 tables / 18 SQL files vs a live 20 / 25) and three tables — `admin_jobs`, `feedback`, `feedback_rate_limits` — are absent from a listing that calls itself complete. Out of this plan's `files_modified`; measured here and cited by the note. **Plan 04 should file it** with the anchor `.claude/skills/database/schema-reference.md:3`.
- **The package-relative citation class** persists in `data/extension-patterns.md` (16), `database/extension-patterns.md` (12) and `matching/extension-patterns.md` (7). Owned by no REVIEW-DOC id; Plan 01 flagged it for Plan 04's todo.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change. T-160-01's mitigation is discharged by Task 3's note; T-160-08's by the three recorded dispositions above; T-160-05's condition is honoured — no criterion here is marked verified on a drift-guard run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **REVIEW-DOC-02 is satisfied.** All three missing steps are present and each is greppable by its own phrase.
- **Plan 04 inherits two filings**: the stale `schema-reference.md` header plus its three missing tables, and (already flagged by Plan 01) the corpus-wide package-relative citation class. Its `<probe_reconciliation>` appendix also needs the amendment named above — REVIEW-DOC-02's measured-incident clause is discharged by a substituted incident, and the retired-schema-filename count is measured at 0.
- **Plan 05 owns the `components` copy of the re-check note.** The shipped wording is reproducible verbatim from any of the four files (`tail -2`); only the skill's own file list changes.
- **Plan 08 measures −13 dangling from this plan**, all in the `filters` skill (21 → 8 for the skill; the `extension-patterns.md` file itself 13 → 0). Corpus stands at 327 of 704.
- **No blockers.** `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and `.planning/STATE.md` are unmodified by this plan, per CONTEXT.md § 0.1(c).

---

_Phase: 160-agent-docs-skills-refresh_
_Completed: 2026-09-13_

## Self-Check: PASSED

- `key-files.modified` present on disk: all four `extension-patterns.md` FOUND.
- All three task commits resolve in `git log --oneline --all`: `cd2e6dccb`, `0d1957286`, `2ed84d299`.
- `commits: 3` MEASURED via `git rev-list --count 447f60af2bf3ad69baf153f60453927ef1b9d18d..HEAD`, not narrated.
- Prohibition honoured: `git diff --name-only 447f60af2..HEAD` matches no `ROADMAP` / `REQUIREMENTS` / `STATE` path, and no path under `.claude/skills/ship-review-stack/`.
