---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 20
subsystem: infra
tags: [aws, budgets, terraform, bootstrap, infra-15, operator-checkpoint, operator-ruling]
status: complete

requires:
  - phase: 183-16
    provides: "the budget openvaa-monthly at the 1 USD test amount, and the state lock seen (answer_lock_seen=yes)"
  - phase: 183-17
    provides: "the hosted zone, whose charge is part of the account's spend"
  - phase: 183-01
    provides: "tools/attempt.sh (attempt files, reply screen, bound checks)"
provides:
  - "the actual alert of the 1 USD budget seen as triggered in the AWS Budgets console (operator's statement, by 2026-10-23); no mail received"
  - "the budget openvaa-monthly replaced at its standing 100 USD with no -var, read back with both alerts; the second plan with no -var exited 0"
  - "evidence/183-20-budget-alert.md; runbook Step 7 observations and the console check for a mail that does not come"
affects: [183-27, 183-28, phase-183-verification]

estimate:
  tokens: 42000
  tasks: 2
actuals:
  tokens: 3073     # chars/4 over the realized diff (12292 chars), before this SUMMARY
  tasks: 2
  commits: 1       # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write

plan_head_before: dba67f5e762dbd07615c66f6d0f5139eff8cd306
plan_head_after: 3d08b6665c32e18e553290dac310ee3db27f2c05

tech-stack:
  added: []
  patterns:
    - "An outcome the plan does not reach can be carried by an operator ruling stored beside it (outcome=no-mail ruling=accept-console-alert), never by rewriting the outcome"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-20-budget-alert.md
  modified:
    - infra/bootstrap/README.md
    - .planning/WINDOWS.md

key-decisions:
  - "INFRA-15 is complete on the operator's ruling accept-console-alert (2026-10-23): the actual alert was seen as triggered in the AWS Budgets console, and no mail was received; mail delivery to the operator's mailbox is not observed"
  - "The budget was raised to 100 USD under the ruling with the plan's own steps 4 to 6, although the plan raises only on the outcome fired; the account and the tracked variable file now agree at 100 USD, so no plan of the bootstrap root takes -var budget_limit_usd any more"

requirements-completed: [INFRA-15]   # on the operator's ruling accept-console-alert; the mail was not observed (outcome no-mail)

duration: "the checkpoint spanned 2026-10-22T08:41Z to 2026-10-25 (the wait for the mail, the ruling on 2026-10-23, the raise sitting); executor work on 2026-10-25 about 07:45Z to 08:00Z"
completed: 2026-10-25
---

# Phase 183 Plan 20: Budget alert accepted on the operator's ruling, budget raised to 100 USD Summary

**INFRA-15 is complete on the operator's ruling, not on an observed mail.** The outcome is `no-mail`. The actual alert of the 1 USD budget was seen as triggered in the AWS Budgets console, but no mail reached the operator: the address had not been confirmed, in the operator's words. The operator ruled `accept-console-alert` on 2026-10-23. The budget `openvaa-monthly` was then replaced at its standing 100 USD with no `-var`, read back with both alerts, and a second plan with no `-var` exited 0.

- **Test amount:** 1.00 USD, unchanged from plan 183-16. Its 80 percent, 0.80 USD, lay below the computed spend of 6.828 USD read on 2026-10-22, so no test apply was needed.
- **Mail arrival:** none. The time between the apply and the mail is therefore unknown.
- **What would make this observed:** a budget mail received at the address. At 100 USD, with about 6.83 USD spent, none is expected this month.

## What was observed

Both replies are in attempt `20-1 20261022T084136Z.e3450fcff`, under record lines `outcome=no-mail ruling=accept-console-alert`. `bound 20-1 OPERATOR_REPLY plan=20 task=1 outcome=no-mail ruling=accept-console-alert` exits 0.

- **Account:** `s0_account=471112560111` in both sittings.
- **Spend read (2026-10-22, about 08:50Z):** `s1_limit=1.0`, `s1_actual=6.828`, `answer_test_amount=1.00`. Plan 183-14 recorded `Credits: no`.
- **Mail:** `answer_outcome=no-mail`, with no `answer_mail_*` line.
- **The operator's words, verbatim:**
  - 2026-10-23: "The mail address was not confirmed, that's why the mail wasn't sent but the alerts were noted there. We can be satisfied with alert handling so let's not dwell on that further"
  - Earlier: the alerts "were correctly visible in the panel".
  - "the mail works now"
- **Raise:**
  - `s4_raise_plan_exit=0`, with `s4_plan_line=Plan: 1 to add, 0 to change, 1 to destroy.` and a single `s4_plan_resource` naming `module.budget.aws_budgets_budget.monthly`.
  - `s4_raise_apply_exit=0`, applied the usual way (`answer_lock_branch=no`).
- **Read-back:**
  - `s5_budget=100.0,USD,COST,MONTHLY`
  - `s5_notification=ACTUAL,GREATER_THAN,80.0,None`
  - `s5_notification=FORECASTED,GREATER_THAN,100.0,None`
  - `s6_second_plan_exit=0`
  - `s7_logs_removed=yes`
- **Not seen:**
  - the forecast alert (AWS documents that it needs about five weeks of usage data);
  - a limit below 1 USD (not tried);
  - mail delivery to the mailbox.

## Tasks

| Task | Name | Commit | Notes |
| ---- | ---- | ------ | ----- |
| 1 | The operator sets a test amount that can fire, confirms the mail or reports that none can come, and raises the budget to 100 USD | (checkpoint) | Two sittings in `20-1 20261022T084136Z.e3450fcff`. Task 1 verify exits 0. Outcome `no-mail`, raised under the ruling |
| 2 | Record the alert as seen, or as not seen with its reason | 3d08b6665 | Evidence file and runbook. Verify 3 exits 0. Verify 1 and five patterns of verify 2 fail by the ruling (below) |

## Deviations from Plan

### Operator override

**1. INFRA-15 and criterion 3 accepted without an observed mail (ruling `accept-console-alert`)**
- **Found during:** Task 1. No mail arrived within the two days the plan allows, so by the plan's own words the outcome is `no-mail`.
- **The plan says:** with `no-mail`, INFRA-15 stays open, the plan is returned as stopped, and the budget stays at the test amount.
- **The ruling:** the operator accepted the alert handling on the console's evidence and asked not to dwell on it further. The ruling was stored as `answer_operator_ruling=accept-console-alert`, together with the operator's words and the orchestrator's reading, labelled as such.
- **What is not claimed:** no mail fields were invented, and the mail is not marked as observed. Criterion 3's clause "the operator confirms that the notification reaches them" is met by the ruling, not by a received mail. The first must-have truth, read as written, is not met.
- **Unconfirmed:** the module mails the address directly, with no SNS topic, so what "not confirmed" refers to (most likely the receiving side) is not established. "The mail works now" is not observed.
- **Ledger:** WINDOWS entry 289 (`deviation`).

**2. The raise was run on the outcome `no-mail`**
- **The plan:** steps 4 to 6 are for `fired` only. The test amount is kept on `no-mail` so that the alert can still fire when the checkpoint is raised again.
- **Why it ran anyway:** the ruling ends that re-raise. A 1 USD budget would otherwise stay past its threshold, while every plan of the root carried `-var budget_limit_usd=1` against the tracked 100.
- **How:** the plan's exact commands, under the same attempt id. The two JMESPath queries were passed through shell variables holding the plan's strings, which changed only how the commands look.
- **What this breaks:** the acceptance criterion "no `s4_` line for a non-fired outcome".
- **Go-ahead:** `answer_raise_under_ruling=yes`, a line the plan does not name.

**3. Read-back threshold type `None` instead of `PERCENTAGE`**
- **What was seen:** both `s5_notification` lines end in `None`. The configuration sets `threshold_type = "PERCENTAGE"`, and the second plan with no `-var` exited 0, so there is no drift.
- **How it is recorded:** as a deviation from the expected read-back text, not as a failed check.
- **Unconfirmed:** that the API leaves the default type out of `describe-notifications-for-budget` is the orchestrator's inference, not verified by the operator.
- **Runbook:** Step 7 item 5 now says `None` was read there on 2026-10-25, and that it counts as the same result when item 6 exits 0.

### Verify results, stated rather than bent

- **Task 1 verify:** exit 0.
- **Task 2 verify 1** (`outcome=fired`): exit 1, by the ruling.
- **Task 2 verify 2:**
  - Missing: `answer_mail_arrived_utc`, `answer_mail_subject` and `answer_mail_alert` (no mail), and the two `PERCENTAGE` notification patterns (deviation 3).
  - Every other pattern and check passes: one resource, the 0.80 < 6.828 arithmetic, no test apply, the evidence's attempt line, the heading, `Budget in the account: 100 USD; ... mismatch: no`, and no address in the evidence file.
  - `Outcome: fired` is absent by design. The evidence reads `Outcome: no-mail` and `Operator ruling: accept-console-alert`.
- **Task 2 verify 3:** exit 0. The runbook is Prettier-clean, the forecast row is still under "Not yet observed", and the budget line is present.
- **Plan text:** not amended. The deviations are recorded here, in the evidence file and in WINDOWS.

### Recording notes

- **Relay:** the orchestrator relayed both replies. It filled in `answer_attempt`, `answer_raise_under_ruling` and `answer_lock_branch`, with provenance notes in the attempt file.
- **First sitting:** gave no `s7_logs_removed` line. The raise sitting's step 7 gave it.
- **Address:** none is in any reply, evidence or runbook. The runbook's only address-pattern hit is the pre-existing `sed` expression of Step 1, which removes session names.

## Deferred Issues

None new.

## Authentication Gates

None for the executor. Task 1 was operator-run by design. The executor held no credential, ran no credentialed command, and read no tfstate or tfplan.

## Known Stubs

None.

## Threat Flags

None. T-183-48 is mitigated differently from the plan. The plan finishes on `fired`; here it finishes on an operator ruling backed by the console's triggered-alert state, with the outcome kept as `no-mail` and recorded in WINDOWS. The raise replaced the budget, so its alert state is new.

## Self-Check: PASSED

- FOUND: evidence/183-20-budget-alert.md (names `Attempt: 20-1 20261022T084136Z.e3450fcff`; `Outcome: no-mail`; the budget line at 100/100, mismatch no; no address)
- FOUND: infra/bootstrap/README.md (Prettier clean; three dated Step 7 observations; forecast and mailbox rows still under "Not yet observed")
- FOUND: commit 3d08b6665
- FOUND: WINDOWS entry 289
