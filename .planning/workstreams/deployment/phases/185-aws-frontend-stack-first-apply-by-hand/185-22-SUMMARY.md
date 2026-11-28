---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "22"
subsystem: infra
status: complete
tags: [cost, cost-explorer, price-list, inventory, follow-up, infra-13]
requires:
  - phase: 185-13
    provides: the cost-allocation tags, active since 2026-11-13T08:23:36Z
  - phase: 185-20
    provides: REAPPLY_UTC=2026-11-14T18:12Z, the start of the stack the window measures
provides:
  - evidence/185-22-cost.md, the priced inventory, the window, the ruling and the follow-up
  - The runbook's Step 18 item 6 pricing log storage and the scaling alarms
  - A dated todo for phase 189 to take the measured monthly figure
affects: [189]
tech-stack:
  added: []
  patterns:
    - "An inventory figure is labelled an inventory and dated; a measured figure needs seven full UTC days of Root-tagged Cost Explorer data"
key-files:
  created:
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-22-cost.md
    - .planning/todos/pending/2026-11-14-measure-the-staging-aws-stack-monthly-cost.md
  modified:
    - infra/envs/staging/aws/README.md
key-decisions:
  - "COST_RULING=follow-up (operator, 2026-11-14): the phase closes on the priced inventory of 50.78 USD/month, recorded as an inventory; the measured figure moves to phase 189, readable from 2026-11-23 over the window starting 2026-11-15"
  - "Step 18's inventory also prices log storage and the two target-tracking alarms, which carry no Root tag"
requirements-completed: []
duration: about 35 min (2026-11-14 18:44Z to 19:20Z, with the ruling in between)
completed: 2026-11-14
estimate_ref:
  tokens: 18000
  tasks: 3
actuals:
  tokens: 3500
  tasks: 3
  commits: 3
plan_head_before: 05c707a6f7052e41a06f9b4015aa04ebf1af75c0
plan_head_after: d773973d901296d0f4c9fa4a53f9f1e998a98e26
---

# Phase 185 Plan 22: The stack's cost (runbook Step 18) Summary

```
COST_RULING=follow-up
COST_INVENTORY_USD_MONTH=50.78
COST_WINDOW_START=2026-11-15
COST_FULL_DAYS_AVAILABLE=0
COST_FOLLOW_UP=.planning/todos/pending/2026-11-14-measure-the-staging-aws-stack-monthly-cost.md
```

**The staging AWS stack prices at 50.78 USD a month from the eu-north-1 list prices. That figure is
an inventory, not a measurement. The operator ruled that the phase does not wait for seven full days
of Cost Explorer data, so the measured month is a dated follow-up for phase 189, readable from
2026-11-23.**

INFRA-13 is not marked complete. Its "monthly estimate measured on the applied stack" is the
follow-up's; what this plan delivers is the cost tags (active, confirmed again) and the inventory.

## The priced inventory

Each price was read with `aws pricing get-products --region us-east-1` (one product each, first
tier). Publication dates run 2026-10-19 to 2026-11-11, and the prices are the same as research A10's.

| Line                                    | USD/month |
| --------------------------------------- | --------- |
| Fargate ARM, 0.5 vCPU, 729.6 h          | 12.99     |
| Fargate ARM, 1 GB, 729.6 h              | 2.86      |
| Application Load Balancer hours         | 17.47     |
| 1 LCU, all month (upper bound)          | 5.54      |
| 3 public IPv4 addresses                 | 10.94     |
| Logs, 1 GB ingested and stored (bound)  | 0.57      |
| 2 target-tracking alarms                | 0.20      |
| CloudFront, 1 GB and 100 000 requests   | 0.21      |
| **Total**                               | **50.78** |

What was read against the assumptions:

- **Three public addresses, counted.** The VPC holds the task's interface and two of the load
  balancer's, which confirms research A11.
- **LCU.** About 0.001 LCU-hours were used in the re-apply hour. The 1-LCU line is about 5.5 USD
  over idle staging.
- **Logs.** 0.14 to 0.30 MB a day were written, on days full of observations.

## The window and Cost Explorer

- **The window.** It starts the UTC day after `REAPPLY_UTC=2026-11-14T18:12Z`. When it was read at
  18:45Z, `s18_window_days=-2` and `s18_seven_days_readable_from=2026-11-23`.
- **The tags.** `Project`, `Environment`, `Root` and `Election` are all `Active`, last updated
  2026-11-13T08:23:36Z, before the window.
- **The days before the window.** They are context and never counted. `Root=aws` reads 0.00 on
  both 2026-11-13 and 2026-11-14, as estimated figures, because of Cost Explorer's lag. There is
  no usage group yet for either day.
- **An untagged charge from outside the stack.** Account-wide, 2026-11-13 holds 0.04 USD for an
  Internet Monitor. It was created 2024-05-12 and watches another of the account's three CloudFront
  distributions, not this stack's. The follow-up names it so the account-wide reads can tell it
  apart.

## The ruling and the follow-up

- **The ruling.** Attempt `20261114T184916Z.86218573f` of key `185-22-2`, reply
  `answer_cost=follow-up`. `put` exited 0, and both `has` checks exited 0.
- **The todo.** It names:
  - the tags;
  - the window's first day (2026-11-15) and its first read date (2026-11-23);
  - the inventory figure;
  - Step 18's method (items 1 to 5 and 7);
  - that the window restarts if the stack is destroyed or re-applied before the read.
- **The runbook.** The statement "The price list holds one on-demand price, first tier, for each
  usage type Step 18 names" moves from "Not yet observed" to "Observations". Two dated rows record
  the inventory as an inventory and the measured figure as a follow-up. The two Cost Explorer
  statements (items 3 and 5) stay in "Not yet observed".

## Task Commits

1. **Task 1: the priced inventory, and Cost Explorer so far.** `67694d1b6`, with the Rule 2
   deviation in `86218573f`.
2. **Task 2: the ruling.** A checkpoint with no commit of its own. It was recorded in Task 3's
   commit.
3. **Task 3: the follow-up.** `d773973d9`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Step 18 item 6 priced log ingestion only, and no alarms**

- **Found during:** Task 1
- **Issue:** The plan prices CloudWatch Logs ingestion and storage, but the runbook's item 6 read
  ingestion only. The two target-tracking alarms are billed but carry no `Root` tag, so neither
  figure saw them.
- **Fix:** Item 6 now prices `EUN1-TimedStorage-ByteHrs` and `EUN1-CW:AlarmMonitorUsage` and adds
  both to the month. Run on the read prices, the amended awk gives the recorded 50.78. Without the
  two lines it gave 50.55.
- **Files modified:** `infra/envs/staging/aws/README.md`
- **Commit:** `86218573f`

**2. [Rule 3 - Blocking] The window had not begun, so items 3 and 5 were not run**

- **Found during:** Task 1
- **Issue:** On the re-apply's own date, the window's period would end before it starts.
- **Fix:** `COST_FULL_DAYS_AVAILABLE=0` was recorded from item 2's arithmetic, and items 3 and 5
  were handed to the follow-up. That is the runbook's own instruction for fewer than seven days.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: evidence/185-22-cost.md, the todo, and the runbook rows.
- FOUND: commits 67694d1b6, 86218573f and d773973d9, each an ancestor of HEAD.
- Verify exits:
  - Task 1's verify: 0.
  - Task 3's two verifies (follow-up branch, Prettier check): 0 and 0.
  - No `COST_MEASURED_` line is written.
