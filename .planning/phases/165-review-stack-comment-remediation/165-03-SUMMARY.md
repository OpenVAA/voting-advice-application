---
phase: 165-review-stack-comment-remediation
plan: 03
subsystem: database
tags: [comment-hygiene, rls, postgres, supabase, schema-migration-parity]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments: hygiene-changed-files.sh, record-hygiene-read.sh, code-identity.mjs"
provides:
  - "302-rls.sql with a concise, reference-free comment layer that passes the per-file hygiene gate"
  - "Regenerated 00001_initial_schema.sql, byte-identical to the schema concatenation"
  - "hygiene-reads/165-03.tsv read record for 302-rls.sql"
affects: [165-21, 165-24, 165-25, 165-28]

actuals:
  tokens: 42277
  tasks: 3
  commits: 3
plan_head_before: 69029884633d0408b795701a294564fafa59cbd9
plan_head_after: 19712024f

tech-stack:
  added: []
  patterns:
    - "Multi-line comment blocks are rewritten by a line-range script that asserts every replaced line is a `--` comment, then proven with code-identity.mjs against the phase base"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-03.tsv
  modified:
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql

key-decisions:
  - "The `-- THE FOUR ENTITY TABLES` section header is kept verbatim, because later plans and this plan's own acceptance checks use it as a content anchor"
  - "The eight-assembly drift note now cites 25-matrix-conformance.test.sql, which holds the entity SELECT assemblies identical at the tip, instead of saying no guard exists"
  - "No hygiene-allow/165-03.tsv was created: the gate reported zero hits, so there was no false positive to allowlist"

patterns-established:
  - "Comments in schema files stay one paragraph per line with terminal punctuation, so assert:comment-hygiene Rule 2 passes; lists use `-- - ` bullets"

requirements-completed: [165-SC3]

coverage:
  - id: D1
    description: "302-rls.sql passes the per-changed-file hygiene gate with no allowlist rows"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh --files apps/supabase/supabase/schema/302-rls.sql (exit 0, VERDICT: CLEAN, layers 1-5 all 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No SQL character changed across the whole plan, in the schema file or the regenerated migration"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "node .planning/phases/165-review-stack-comment-remediation/scripts/code-identity.mjs ship/v2.15-12-planning HEAD apps/supabase/supabase/schema/302-rls.sql apps/supabase/supabase/migrations/00001_initial_schema.sql (exit 0, 2 compared, 0 changed code)"
        status: pass
      - kind: other
        ref: "yarn assert:schema-migration-parity (exit 0, 26 schema files -> 5941 lines, generated copy is current)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The read of 302-rls.sql is recorded against its current blob"
    requirement: "165-SC3"
    verification:
      - kind: other
        ref: "record-hygiene-read.sh 165-03 apps/supabase/supabase/schema/302-rls.sql (exit 0); row blob 79ed9db294cad13cd89da65d902ac322eba9b8d5 equals git hash-object"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rewritten comments are accurate descriptions of what each policy admits and why"
    verification: []
    human_judgment: true
    rationale: "Accuracy of prose against policy semantics is a reading judgment; the instruments prove only that no code changed and no hygiene pattern remains"

duration: 12min
completed: 2026-09-27
status: complete
---

# Phase 165 Plan 03: RLS Comment Hygiene Summary

**The comment layer of `302-rls.sql` is rewritten to state what each policy admits and why, with no planning references, rulings or measurement anecdotes. It drops from 80,297 to 53,165 bytes, the file passes the five-layer hygiene gate with zero hits, and `code-identity.mjs` proves that not one SQL character changed.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-09-27T17:29:40Z
- **Completed:** 2026-09-27T17:41:03Z
- **Tasks:** 3 of 3
- **Files modified:** 3 (2 source, 1 read record)

## PLAN_BASE and measurements

- **PLAN_BASE** (`git rev-parse HEAD` at plan start): `69029884633d0408b795701a294564fafa59cbd9`. The identity proofs compare against `ship/v2.15-12-planning`, which is exact for these two files: no earlier phase-165 commit touched them.
- **Comment lines, `grep -c '^\s*--'`:** 235 at PLAN_BASE, 194 at HEAD. The POSIX form `grep -cE '^[[:space:]]*--'` gives the same numbers. The count falls less than the bytes do because the header's two collapsed lists now take one line per item.
- **File size:** 80,297 bytes at PLAN_BASE, 53,165 at HEAD.
- **Gate at PLAN_BASE:** `hygiene-changed-files.sh --report-only` found 127 failing items (layer1=46 layer2=70 layer3=11). After Task 1: 112, with none above the entity anchor. After Task 2: 59, with none above `-- question_categories (project_id)`. After Task 3: 0.

## Identity-proof outputs (read directly, not through a pipe)

| Command | Exit | Output |
|---|---|---|
| `node .../code-identity.mjs ship/v2.15-12-planning WORKTREE <302-rls.sql> <00001_initial_schema.sql>`, after each task | 0 | `code-identical` x2, `2 compared, 0 changed code` |
| `node .../code-identity.mjs ship/v2.15-12-planning HEAD <same two files>`, whole plan | 0 | `2 compared, 0 changed code` |
| `yarn assert:schema-migration-parity` | 0 | `26 schema file(s) -> 5941 line(s); ... generated copy is current` |
| `bash .../hygiene-changed-files.sh --files apps/supabase/supabase/schema/302-rls.sql` | 0 | `total failing items: 0 ... VERDICT: CLEAN` |
| `yarn prettier --check apps/supabase/supabase/schema/302-rls.sql` | 0 | `All matched files use Prettier code style!` |
| `bash .../tip-proofs.sh` | 0 | all proofs PASS |
| `git log --format=%h <PLAN_BASE>..HEAD -- apps/supabase/supabase/schema apps/supabase/supabase/migrations` | — | exactly `19712024f`, `411fa7934`, `4fa444751` |

## Accomplishments

- **Header:** the `Uses helper functions` list is now one `-- - ` bullet per helper (`user_can`, `project_open_for_voters`, `private.entity_has_confirmed_nomination`), plus one sentence on how the public-visibility conjunction is assembled. The collapsed `Policy rules:` line is now six separate `-- - ` rules.
- **Project-structure sections:** each policy states its permission and whom it admits. Kept: the security reasoning the plan required, including why the account insert is asked at global scope (a caller-chosen id with no foreign key on `grants.target_id`), why join-table reads delegate to the parent's policy while writes go through SECURITY DEFINER helpers, and why a wrong embed denial is silent.
- **Entity tables:** the shared shape is stated once. That block names the four permissions, cites the test that asserts the shape (`18-entity-policies.test.sql`), and gives the reason parent-to-child reach goes through `public.get_entity_basic_data`: a SELECT policy returns every column, answers included. The four disjunct-order comments keep the ordering constraint and `29-authenticated-disjunct-order.test.sql`, without the timing figures. The candidates section header is split, with the answers note on its own line.
- **Content, nominations, settings, feedback, jobs:** the `nominations` header loses its retired-term tail. The parent-nomination guards are one bullet each (five guards, the cap, project agreement). The feedback insert policies and their comments are unchanged, and the collapsed `No UPDATE policy ... No anon SELECT policy ...` line is now two lines.

## Task Commits

1. **Task 1 (tracer): header and project-structure sections**: `4fa444751` (docs). Tracer gate: verify re-run at HEAD (parity 0, identity 0), then expanded.
2. **Task 2: the four entity-table sections**: `411fa7934` (docs)
3. **Task 3: content, nomination, settings, feedback and job sections, whole-file gate, read record**: `19712024f` (docs)

Every commit carries the `Hygiene: D-04` trailer and stages explicit paths only.

## Files Created/Modified

- `apps/supabase/supabase/schema/302-rls.sql`: comments only. The comment-blanked code skeleton is identical to the phase base.
- `apps/supabase/supabase/migrations/00001_initial_schema.sql`: regenerated by `yarn schema:regenerate`. Not recorded as read: it still concatenates schema files that later plans clean, and plan 165-21 records it.
- `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-03.tsv`: one row, `302-rls.sql` at blob `79ed9db294cad13cd89da65d902ac322eba9b8d5`.

## Allowlist rows

None. The gate reported zero hits, so `hygiene-allow/165-03.tsv` was not created.

## Decisions Made

See `key-decisions` in the frontmatter. One correction came from reading the tip rather than the old comment: the entity block said nothing held the eight SELECT assemblies identical, but `25-matrix-conformance.test.sql` ("the eight-assembly guard") does that at the tip, so the rewrite cites it. Two claims were also checked against the tests before being restated. Cell 5 of `22-content-policies.test.sql` is a grantee of another project being denied a closed project's row. The SELECT family in `18-entity-policies.test.sql` is normalised for candidates' terms-of-use conjuncts as well.

## Deviations from Plan

None. The plan was executed as written.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 165-25 edits `302-rls.sql` for type-aware `user_can` calls. It must keep the file clean: re-run `hygiene-changed-files.sh --files apps/supabase/supabase/schema/302-rls.sql` and re-record the read, because any edit voids blob `79ed9db2...`.
- Plan 165-21 still owes the read record for the regenerated migration.
- Per the wave-safety note, no `db:reset`, pgTAP, build or E2E was run. Plan 165-24 resets and re-tests the applied database.

## Self-Check: PASSED

- `apps/supabase/supabase/schema/302-rls.sql`, `apps/supabase/supabase/migrations/00001_initial_schema.sql` and `.planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-03.tsv` exist.
- Commits `4fa444751`, `411fa7934` and `19712024f` are in `git log`.
- `git status --short` lists only the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`, and neither was staged.
