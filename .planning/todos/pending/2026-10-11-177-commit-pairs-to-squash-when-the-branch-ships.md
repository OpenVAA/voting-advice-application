---
created: 2026-10-11T00:00:00.000Z
title: Commits of Phase 177 that fix an earlier commit of the phase, or do not pass a gate on their own — to squash when the branch ships
area: Repository / ship
severity: minor
source: Phase 177 plans 177-03, 177-09, 177-12, 177-14 (their summaries), as the orchestrator collected them in 177-21-INPUTS.md; the code review checklist's item on fixes of itself; filed by 177-21
owner: whoever restructures the branch for review (`Skill("ship-review-stack")`); see also 2026-08-20-process-all-akita-ship-stack-review-findings.md
files:
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - .claude/skills/ship-review-stack/SKILL.md
---

The checklist asks that a pull request holds no fixes of itself. These pairs of the phase's history are such fixes, each recorded by the plan that made it. None changes the tree at the phase's close; they matter when the branch is cut into review commits, and for anyone who bisects.

| Commit | What is wrong with it alone | Fixed by |
|---|---|---|
| `a5f4229d9` (177-03) | holds a migration that does **not apply** to a fresh database | `d3981551e` |
| `527f271b6` up to, not including, `2ee846c45` (177-09) | do not pass `yarn lint:check` on their own (inferred by that plan, not run commit by commit) | `2ee846c45` |
| `ac90ca1ef` (177-09) | — | `ae078b2d3` is a candidate for squashing into it |
| `4fe3d66a5` (177-12) | lint and types of a test file | `90e054d92` |
| `350c5c822` (177-14) | a test helper's type; committed with the type check red | `acb08e520` |
| `2e2e5306d` (177-14) | `EntitySelector`'s pointer defect: a press on a party's row did not choose it | `10ebe6b04` |
| `b1f981564` (179 CR-01) | changes a migration, the manifest and `schema/506-invitation-rpcs.sql` but is titled `fix(179-review):`, without the `[db]` tag the review checklist asks for | not fixed in history: retitle it `fix[db](179-review):` when the branch is split into pull requests (review item E3 of Phase 179.1) |

Also to know at ship time:

- **Red-first commits by design.** Each new pgTAP assertion of plans 177-02 to 177-07 and 177-17 was committed red and alone before the schema that turns it green, and several unit and component test files likewise. A red-first commit against a member that does not exist cannot type-check alone. These are the phase's method, not fixes of itself, and the ship procedure's commit taxonomy decides what becomes of them.
- **Plan 177-21's own commits** are five documentation commits: `8f0ca98bc`, `ba89d7b1e`, `d44b3844c`, `50e930916` (`[db]`: two SQL comments and the regenerated migration) and `f71107820`. The skills commit is followed by two comment-only commits under its targets, so `.claude/scripts/audit-skill-drift.sh` reports one commit of drift for each of the three skills; nothing in those two commits bears on a skill.

Each hash above is an ancestor of `HEAD` at the phase's close (checked with `git merge-base --is-ancestor`). Not established: what each commit does alone is as the plans' summaries state it; no commit was built or linted on its own by this plan.
