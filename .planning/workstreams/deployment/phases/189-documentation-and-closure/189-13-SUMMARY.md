---
phase: 189-documentation-and-closure
plan: "13"
subsystem: docs
tags: [docs, operations, runbook, scaling, rollback, teardown, ses, admin-jobs, cost]
status: complete

requires:
  - phase: 189 (plan 189-04)
    provides: the `deployment/operations` page with its `# Operations` heading and intro, in the nav
provides:
  - "deployment/operations: Election-day scaling (with a Capacity subsection), Rollback, Teardown, SES: sandbox and production access, Admin jobs and more than one task, Cost"
affects: [189-14]

actuals:
  tokens: 4450
  tasks: 2
  commits: 2
plan_head_before: 18ff0e2f3c323df8bbe45864d16b816246c760e8
plan_head_after: dfb6a5e61c57978bdad2229d342d2a7abe35365b

tech-stack:
  added: []
  patterns:
    - "An operations summary per procedure: a bold When line, the command in a fenced block, the expected result, then staging's dated values and a GitHub link to the runbook step that measured them"

key-files:
  created: []
  modified:
    - apps/docs/src/routes/(content)/developers-guide/deployment/operations/+page.md

key-decisions:
  - "The capacity is linked to the AWS runbook's Observations row of 2026-11-19 and to infra/scripts/load-check/README.md, not to the 188-18 evidence file, because the page links to GitHub and .planning/ is not published"
  - "Election day: the page warns that no apply and no deploy (a push to deploy/staging applies the root too) may run between the raise and the lowering"
  - "Admin jobs: the workaround names that a rollout still runs two tasks briefly (deployment_maximum_percent = 200), so no deploy runs during a job either way"

metrics:
  duration: 7min
  completed: 2026-11-20
---

# Phase 189 Plan 13: Operations runbook summaries, first part, Summary

**The operations page now carries election-day scaling with the 2026-11-19 capacity stated as a lower bound of at least 40 voter journeys a minute under `trackEvents` false, rollback by the circuit breaker and roll-forward on `deploy/staging`, teardown by `destroy.yml` or by hand with the Supabase project's `prevent_destroy`, SES sandbox and production access, the in-memory Admin job limit at `task_ceiling = 2`, and the three cost figures as recorded with their read times.**

## Performance

- **Duration:** about 7 minutes
- **Started:** 2026-11-20T16:01:40Z
- **Completed:** 2026-11-20T16:08:35Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- `## Election-day scaling`: the `scheduled_floor_changes` entries, the plan with the running digest (`Plan: 2 to add, 0 to change, 0 to destroy.`), no apply or deploy inside the window, the removal (`Plan: 0 to add, 0 to change, 2 to destroy.`), staging's Step 12 results of 2026-11-13, and a `### Capacity` subsection: at least 40 voter journeys a minute on 2026-11-19, build `a7003b490`, one task at 44.86 % CPU and 20.46 % memory, stated as a lower bound and not a maximum (the step cap set from the hosted project's plan, no resource limited it), under `trackEvents` false.
- `## Rollback`: the circuit breaker as Step 10 observed it on 2026-11-13 (three failed tasks, steady 72 s later, 692 requests with no non-2xx, the alert mail), the roll-forward push to `deploy/staging` with its gated job's expected result, and the rollback on a failed smoke run as future work (FUT-10).
- `## Teardown`: `destroy.yml` by push or by dispatch with `confirm` = `destroy staging aws`, its two approvals and guard lines as run on 2026-11-18; the hand destroy of Step 16 (2026-11-14, 40 destroyed); the re-apply of Step 17; and the Supabase project imported with `prevent_destroy = true`, never destroyed by Terraform, the destroy workflow refused its state.
- `## SES: sandbox and production access`: the sandbox limits as AWS documents them, the `get-account` read, the `put-account-details` request, the sandbox mailbox, and staging's 2026-10-22 read showing production access already enabled, so the request is a fork's first step.
- `## Admin jobs and more than one task`: `jobStore.ts` keeps job state in two in-memory maps; polling reliable with one task, unreliable from two; staging's `task_floor = 1`, `task_ceiling = 2`; the workaround (one task serving, or `task_ceiling = 1` for the job's duration, the plan changing `max_capacity` alone); moving the store is future work (FUT-01).
- `## Cost`: 50.78 USD a month priced (2026-11-14, 18:46Z), 36.96 measured by the `Root=aws` tag and 44.26 with the untagged public IPv4 (both read 2026-11-18, 11:58Z, over 2026-11-15 and 2026-11-16), what each counts, what none includes, and the link to Step 18.

## Task Commits

1. **Task 1: Election-day scaling, rollback and teardown** - `205ba31b5` (docs)
2. **Task 2: SES, the Admin job limit and the cost** - `dfb6a5e61` (docs)

## Files Created/Modified

- `apps/docs/src/routes/(content)/developers-guide/deployment/operations/+page.md` - the six sections above, after a short paragraph on how each section is laid out; first line `# Operations` kept.

## Verification

- Task 1 automated verify: exit 0 (three headings, `lower bound`, `destroy.yml`, `prevent_destroy`, the Step 12 link, Prettier, `validate:links --check` with 0 findings). Acceptance `grep -c '40 voter journeys'` = 1.
- Task 2 automated verify: exit 0 (three headings, the three figures, `task_ceiling = 1`, `jobStore.ts`, none of the recorded-search words, Prettier, `validate:links --check` with 0 findings, `yarn workspace @openvaa/docs build` exit 0). Acceptance `grep -c 'Admin jobs and more than one task'` = 1.
- Every GitHub anchor on the page (15 distinct) was checked against the target runbook's headings with a GitHub-style slug; all resolve. The link checker checks GitHub paths, not their anchors, so this was a separate check.
- The supplementary C-02 pattern of 189-RESEARCH.md (`untried|not been (observed|seen|measured|tried)|not (yet )?(observed|measured)|unobserved|unmeasured`) plus the locked words: 0 hits on the page.
- No link points to a `Not yet observed` section, which plan C-01 work removes.
- E2E: no project affected; delta 0 (docs-only change).

## Decisions Made

- The capacity figure links to the AWS runbook's Observations (the 2026-11-19 row) and the load-check README, because the 188-18 evidence lives under `.planning/`, which the published docs do not link to.
- The election-day procedure adds that a push to `deploy/staging` is also an apply, so neither is made between the raise and the lowering.
- The Admin job workaround adds that a rollout runs two tasks briefly (`deployment_maximum_percent = 200` in `infra/modules/frontend-service/service.tf`), so no deploy runs during a job.

## Deviations from Plan

None - plan executed as written. Pinned values matched: `task_ceiling = 2` is at `infra/envs/staging/aws/terraform.tfvars:22`, and the cost and capacity figures match their evidence files exactly.

## Issues Encountered

- The page first said "40 journeys a minute", which failed Task 1's acceptance grep for `40 voter journeys`; the capacity sentence was reworded to "at least 40 voter journeys a minute with `trackEvents` false" before the commit.

## Known Stubs

None. The intro's mention of restoring the database and rotating secrets is filled by plan 189-14, as planned.

## Next Phase Readiness

- Plan 189-14 adds restore and secret rotation to the same page; DOCS-06 completes there and is not marked complete here.

## Self-Check: PASSED

- FOUND: apps/docs/src/routes/(content)/developers-guide/deployment/operations/+page.md
- FOUND: 205ba31b5
- FOUND: dfb6a5e61
