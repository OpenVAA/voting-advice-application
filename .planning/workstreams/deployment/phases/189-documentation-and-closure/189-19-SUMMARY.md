---
phase: 189-documentation-and-closure
plan: "19"
subsystem: docs
tags: [docs, seed, skills, requirements, cost, re-target, closure]
status: complete

requires:
  - phase: 189 (plan 189-01)
    provides: the Render removal this fold-in follows
provides:
  - "seed.sql's storage-cleanup comment names infra/scripts/bootstrap.sql as the writer of a hosted project's rows"
  - "recommended-skills conflict 1 cites the database skill's frozen-migrations rule"
  - "INFRA-13 Complete in REQUIREMENTS.md on the measured cost; FUT-01 notes D1's supersession; 185-VERIFICATION dated note"
  - "dependency-audit todo, local-ports todo and the 187-VALIDATION deploy-dispatch row re-targeted to after the stream merges"
affects: [189-20]

actuals:
  tokens: 2600
  tasks: 3
  commits: 3
plan_head_before: 8aa107e563314b76e50d868b05bfccccc1bdcb2a
plan_head_after: e0115dda104df0289644f739bd5aad99036a670e

tech-stack:
  added: []
  patterns:
    - "A re-targeted planning item carries a dated 'Note, YYYY-MM-DD: re-targeted from phase N because ...' line beside the changed target"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/seed.sql
    - .claude/skills/recommended-skills/SKILL.md
    - .planning/workstreams/deployment/REQUIREMENTS.md
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-VERIFICATION.md
    - .planning/todos/pending/2026-11-15-dependency-audit-third-party-advisories.md
    - .planning/todos/pending/2026-11-17-local-supabase-ports-in-ephemeral-range.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/187-VALIDATION.md

key-decisions:
  - "INFRA-13 closed on the operator's short-window ruling of 2026-11-18: the row and the 185-VERIFICATION note say the 36.96 USD/month figure is a two-day measurement, so the closure does not read as a seven-day one"
  - "Conflict 1 names the next five-digit version rather than 00002, because 24 numbered migrations already exist"

metrics:
  duration: 9min
  completed: 2026-11-20
---

# Phase 189 Plan 19: Fold-ins aimed at phase 189 Summary

**The seed storage comment now points a hosted deployment at `infra/scripts/bootstrap.sql`, the recommended-skills conflict 1 cites the database skill's frozen-migrations rule, INFRA-13 is Complete on the measured 36.96 USD/month (44.26 with the untagged IPv4, read 2026-11-18), FUT-01 records that staging runs up to two tasks, and three items that need the merged default branch now target "after the stream merges".**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-11-20T16:10:54Z
- **Completed:** 2026-11-20
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- `seed.sql`: the comment line telling the reader to edit the values for production is replaced by one present-tense line naming `infra/scripts/bootstrap.sql`. Only that comment line changed; the plan's diff check against `3988f937c` found no non-comment line changed, and `yarn assert:comment-hygiene` reported 0 violations.
- `recommended-skills` conflict 1 quotes the database skill's heading "The migrations are frozen: a schema change is appended, never edited in", gives the three-part commit (the `schema/` edit, the next numbered migration, its manifest line) and the rename of a timestamp-named file, and says why both upstream commands conflict: each writes a timestamp-named file with no manifest line, which `yarn assert:schema-migration-parity` rejects, and `supabase db pull` derives the migration from a database's state instead of from the `schema/` edit. "The database skill wins." is kept.
- `REQUIREMENTS.md`: INFRA-13 ticked; its traceability row reads `Complete (measured 36.96 USD/month, 44.26 with untagged IPv4, read 2026-11-18 over a two-day window under the operator's short-window ruling; 185-22-cost.md; todo completed/2026-11-14-measure-the-staging-aws-stack-monthly-cost.md)`. FUT-01 carries a dated note (2026-11-20) that ruling D1's "staging runs one task" is superseded: staging runs up to two tasks (`task_floor = 1`, `task_ceiling = 2`), documented on the operations page under "Admin jobs and more than one task".
- `185-VERIFICATION.md`: a `note_2026_11_20` key on the INFRA-13 override says the deferred measurement now exists and cites `COST_MEASURED_USD_MONTH`, `COST_MEASURED_WITH_UNTAGGED_IPV4_USD_MONTH`, `COST_MEASURED_READ_UTC`, the two-day window and the completed todo. The frontmatter still parses as YAML.
- Both pending todos now read `target: after the stream merges`, each with a dated re-target line saying why. The `187-VALIDATION.md` row for the manual dispatch of `deploy.yml` names "after the stream merges" in its phase cell and has a dated note in its reason.

## Task Commits

1. **Task 1: The seed comment and the skill's conflict 1, current** - `b78265ef6` (docs)
2. **Task 2: INFRA-13 complete, and D1's supersession noted** - `ea7a91eac` (docs)
3. **Task 3: Three items re-targeted to after the stream merges** - `e0115dda1` (docs)

## Verification

| Check | Result |
| ----- | ------ |
| Task 1 `<automated>` (seed names the script, no old line, only comment lines changed vs `3988f937c`, skill has no old heading and has "frozen", comment-hygiene) | exit 0; re-run after commit for the tracer gate, exit 0 |
| `grep -c 'frozen' .claude/skills/recommended-skills/SKILL.md` | 1 (expected >= 1) |
| `prettier --check` on the seed and the skill | exit 0 |
| Task 2 `<automated>` | exit 0 |
| `grep -c 'Pending (measured cost deferred' REQUIREMENTS.md` | 0 (expected 0) |
| Task 3 `<automated>` | exit 0 |
| `grep -c '^target: Phase 189'` on the dependency-audit todo | 0 (expected 0) |

E2E: none, as the plan states. The only code-tree change is one comment line of `seed.sql`; the phase's final plan resets the database and runs the full suite.

## Decisions Made

- The INFRA-13 row and the 185-VERIFICATION note both say the figure was read over a two-day window under the operator's short-window ruling. The evidence file records that Step 18 counts a window under seven days as no measurement and that the operator overruled it on 2026-11-18, so the closure states what was measured.
- Conflict 1 says "the next five-digit version, an underscore and a name" rather than giving `00002` as the example. `migrations/` already holds `00001` to `00024`.

## Deviations from Plan

### Wording adjustments (no rule trigger; recorded for the verifier)

**1. Seed comment says "two rows", not "row"**
- **Found during:** Task 1
- **Issue:** The plan's wording, "a hosted project's row is written by", is singular. The statement under the comment inserts two `storage_config` rows (`supabase_url`, `service_role_key`), and `bootstrap.sql` writes both.
- **Fix:** `-- A hosted project's two rows are written by \`infra/scripts/bootstrap.sql\`.` The truth's other requirements still hold: present tense, names the script, no SQL changed.
- **Commit:** `b78265ef6`

**2. INFRA-13 row adds the window**
- **Found during:** Task 2
- **Issue:** The plan's status text leaves out that the figure is a two-day measurement.
- **Fix:** Added "over a two-day window under the operator's short-window ruling" inside the parentheses. The verify prefix `Complete (measured 36.96` and every figure the plan named are still there.
- **Commit:** `ea7a91eac`

Otherwise the plan ran exactly as written.

## Requirements

DOCS-06 and DOCS-08 are listed in this plan's frontmatter, but this plan does not complete either one. DOCS-06 is the whole operations runbook and DOCS-08 is the closure record of all seven absorbed todos, and several other 189 plans contribute to both. So `requirements.mark-complete` was not run for them. INFRA-13, the requirement this plan does close, is marked Complete directly in REQUIREMENTS.md (Task 2).

## Known Stubs

None.

## Issues Encountered

None.

## Next Phase Readiness

Nothing aimed at phase 189 by these items points at it any longer. The three re-targeted items wait on the merge of the stream.

## Self-Check: PASSED

- FOUND: all seven modified files
- FOUND: b78265ef6, ea7a91eac, e0115dda1 (ancestors of HEAD)
