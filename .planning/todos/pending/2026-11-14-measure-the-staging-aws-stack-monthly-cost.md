---
title: Measure the staging AWS stack's monthly cost from Cost Explorer (INFRA-13's measured figure)
priority: medium
source: Phase 185 plan 185-22 (2026-11-14); the operator ruled `COST_RULING=follow-up` under D-23
target: Phase 189 (Documentation and Closure)
---

Phase 185 closed with the stack's cost as a **priced inventory**, not a measurement:
`COST_INVENTORY_USD_MONTH=50.78`, from the eu-north-1 list prices published 2026-10-19 to 2026-11-11, with
its usage assumptions (one 0.5 vCPU / 1 GB ARM task, one load balancer at one LCU, three public IPv4 addresses,
1 GB of logs, two target-tracking alarms, 1 GB and 100 000 requests through CloudFront). INFRA-13 asks for a
monthly estimate measured on the applied stack; that figure is this todo's.

**The tags.** `Project`, `Environment`, `Root` and `Election` are active cost-allocation tags (`LastUpdatedDate`
2026-11-13T08:23:36Z). The three roots share `Project` and `Environment` and differ by `Root`, so `Root` = `aws`
isolates `envs/staging/aws` from bootstrap and `dns-mail`.

**The window.** It begins on `COST_WINDOW_START=2026-11-15`, the UTC day after the re-apply
(`REAPPLY_UTC=2026-11-14T18:12Z`), and takes seven or more full UTC days. Cost Explorer lags about a day, so a
seven-day window (2026-11-15 to 2026-11-21) can be read on or after **2026-11-23**. The window holds only days
on which the stack ran whole and unchanged: if `envs/staging/aws` is destroyed or re-applied before the read,
the window starts again on the UTC day after that apply. The days before it (2026-11-13 and 2026-11-14) hold
the first stack, the destroyed interval and the re-apply's part-day, and never enter the mean.

**The window moved (2026-11-18, operator ruling `COST_WINDOW_RULING=literal`).** Plan 187-21 re-applied
`envs/staging/aws` through the pipeline twice on 2026-11-18, each time replacing the task definition: attempt 3
(run 44258126898, apply about 07:29Z, `:6` to `:7`) and attempt 4 (run 44270824581, `:7` to `:8`, rollout
completed 09:05:53Z). Plan 187-22's run 44276384977 applied with no changes and is not a re-apply. The operator
kept the rule as written, so it is not argued that a task-definition swap with the same task size leaves the
cost unchanged: the window now begins on `COST_WINDOW_START=2026-11-19`, after the last re-apply
(`REAPPLY_UTC=2026-11-18T09:05Z`). A seven-day window, 2026-11-19 to 2026-11-25, can be read on or after
**2026-11-27**. The 2026-11-15 start and the 2026-11-23 read date above are superseded. Plan 187-24's floor of
2026-11-23 stands, and its precondition (this read recorded first) moves its earliest day to 2026-11-27. Any
further destroy or re-apply of the root before the read moves the window again.

**The method.** `infra/envs/staging/aws/README.md` Step 18, items 1 to 5 and 7, as written:

- Item 3: `aws ce get-cost-and-usage --region us-east-1`, daily, `UnblendedCost`, filtered by `Root=aws`, over
  the window; the daily mean times 30.4 is the measured month.
- Item 5: the same window by service and usage type, once by the tag and once for the whole account with the
  `PublicIPv4` lines only, because an address's charge may carry no tag. Also outside the tag: the two
  target-tracking alarms (Application Auto Scaling owns them), and an Internet Monitor created 2024-05-12 that
  watches another of the account's CloudFront distributions and is not this stack's.

**Done when.** The measured figure, its window, its day count and its read date are recorded beside the
inventory, with the difference and its likely reasons (the inventory's LCU and log lines are upper bounds:
about 0.001 LCU-hours an hour and under 0.01 GB of logs a day were observed), and the runbook's "Not yet
observed" rows for Step 18 items 3 and 5 move to "Observations". Evidence:
`.planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-22-cost.md`.
