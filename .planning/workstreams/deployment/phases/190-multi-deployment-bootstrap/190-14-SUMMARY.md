---
phase: 190-multi-deployment-bootstrap
plan: "14"
subsystem: infra
tags: [github-actions, deploy, destroy, evidence-branch, operator-checkpoint]

requires:
  - phase: 190
    provides: "190-07 to 190-09 the resolver-driven deploy, destroy and infra-plan workflows; 190-11 staging on the map and tightened; 190-12 the downstream probe"
provides:
  - "the rewritten deploy.yml observed green on staging from deploy-evidence/190-final, every stage through the smoke and the re-read"
  - "infra-plan.yml's resolve job and wrong-subject proof green on the same push"
  - "the rewritten destroy.yml observed resolving staging, refusing the Supabase root and passing its guard, and destroying nothing with apply-destroy rejected"
  - "a wrong-confirm dispatch observed skipping both destroy jobs"
affects: [190-13]

actuals:
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "an evidence commit is the source tree without .planning/, on a fixed parent with a fixed identity and dates, so anyone can rebuild it byte for byte"

key-files:
  created:
    - .planning/workstreams/deployment/phases/190-multi-deployment-bootstrap/evidence/190-14-pipeline.md
  modified: []

key-decisions:
  - "190-14: the first evidence deploy (fd57d4339, run 45564561423) stopped at the migration push, because staging's database held the pre-restack migration history; it was not retried"
  - "190-14: after 189.1.1 rewrote the staging database and planning/deployment-190 was rebased onto it, EVIDENCE_COMMIT was rebuilt as b7a78427d (tree 7d9bb7189, parent 340a20070), its apps/supabase equal to the served deploy/staging 81b80140f"
  - "190-14: a rejected apply-destroy shows as job conclusion failure with no step run; the run's approvals list records approved then rejected for staging-destroy"

requirements-completed: [PIPE-13]

duration: Task 1 2026-11-24; Task 2 2026-11-25 (blocked) and 2026-11-27; Task 3 2026-11-27
completed: 2026-11-27
---

# Phase 190 Plan 14: The rewritten workflows on staging Summary

**From an evidence branch, the resolver-driven `deploy.yml` deployed staging green end to end (smoke and re-read included), and `infra-plan.yml` proved its wrong subject on the same push. The rewritten `destroy.yml` resolved staging, kept the Supabase root out of reach, passed its plan guard, and destroyed nothing, because `apply-destroy` was rejected. A dispatch with the wrong confirm text skipped both destroy jobs.**

## Evidence

All lines are verbatim in [evidence/190-14-pipeline.md](evidence/190-14-pipeline.md).

```
EVIDENCE_COMMIT=b7a78427de3c42817b04610155007f2e3d7f6c72
INFRA_PLAN_RUN=https://github.com/OpenVAA/voting-advice-application/actions/runs/45947196249 success
DEPLOY_RUN=https://github.com/OpenVAA/voting-advice-application/actions/runs/45947196363 success
DESTROY_RUN=https://github.com/OpenVAA/voting-advice-application/actions/runs/45954382752 plan-destroy=success apply-destroy=rejected
DISPATCH_RUN=https://github.com/OpenVAA/voting-advice-application/actions/runs/45958867533 resolve=success plan-destroy=skipped apply-destroy=skipped
```

| Acceptance criterion | Recorded | Verdict |
|---|---|---|
| Task 1: evidence commit with no `.planning/` path, equal to HEAD outside it; local resolution | `evidence_planning_paths=0`, `evidence_tree_equal_exit=0` (rebuild against 73560241e) | pass |
| Task 2: deploy green; `key=staging`; settings steps success; `smoke_exit=0`; served build after smoke = EVIDENCE_COMMIT | every step success; `push_exit=0`, `settings_exit=0`, `smoke_exit=0`, `served_build_after_smoke=b7a78427d…` | pass |
| Task 2: infra plan on the same push green | resolve, checks, wrong-subject (staging) success; plan skipped on push | pass |
| Task 3: plan-destroy success with `supabase_root_refused=yes` and `destroy_guard=pass`; apply-destroy rejected, no step run | as recorded; approvals: approved, then rejected | pass |
| Task 3: wrong-confirm dispatch skips both jobs; both evidence branches deleted | both skipped; `ls-remote` count 0 | pass |

## Deviations

- **Evidence commit rebuilt.** The first deploy of fd57d4339 stopped at the migration push, because staging's database held migrations 00005–00024 of the pre-restack history. Phase 189.1.1 then rebuilt the database, and the branch was rebased onto it, which brought migration 00005. The commit was rebuilt by the same recipe, with only the session line of its message changed.
- **Pushes made by the session.** With the operator's explicit go-ahead for each, the session pushed both evidence branches, ran the dispatch and deleted the branches. Every gate was approved or rejected by the operator in the GitHub UI.
- **Planning-branch tree.** After the evidence commit was built, `tests/README.md` changed on the branch (190-12: the verdict step's `--no-flaky` removed). So HEAD differs from EVIDENCE_COMMIT outside `.planning/` in that one documentation file.

## E2E

The deployed smoke ran green inside the deploy run. This plan touches no local E2E project, so its project deltas are 0 against `tests/e2e-runs/191-06-full` (742 passed).
