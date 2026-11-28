# 183-20 evidence: the budget alert at the test amount, and the raise to 100 USD

Outcome: no-mail
Operator ruling: accept-console-alert (2026-10-23). The operator accepted the alert handling on the evidence of the AWS Budgets console, which showed the alert as triggered, and overrode the plan's requirement that the mail be observed.
Budget in the account: 100 USD; tracked variable file: 100 USD; mismatch: no

Attempt: 20-1 20261022T084136Z.e3450fcff

This file was written whole from the attempt file above on 2026-10-25. It records only non-secret named lines and the operator's own words. There is no e-mail address, no resource id and nothing from a log. The alert address was typed in the operator's terminal as `TF_VAR_alert_email`, entered with a no-echo `read -rs` in the raise sitting, and appears nowhere.

## The two sittings

The attempt was raised at 2026-10-22T08:41Z (commit `e3450fcff268edc31a18265f129540201511080d`). It holds two replies. Each is stored under its own record line, and both name the same attempt:

1. **The read and the wait.** The lines were held by the orchestrator from 2026-10-22, about 08:50Z. The outcome and the ruling were given on 2026-10-23 after 14:04Z, once the two days the plan allows for the mail had passed. Stored on 2026-10-25 under `OPERATOR_REPLY=received attempt=20261022T084136Z.e3450fcff plan=20 task=1 head=dba67f5e762dbd07615c66f6d0f5139eff8cd306 outcome=no-mail ruling=accept-console-alert`.
2. **The raise, under the ruling.** Relayed on 2026-10-25 and stored under a record line of the same form. The operator did not give the time of this sitting.

`attempt.sh bound 20-1 OPERATOR_REPLY plan=20 task=1 outcome=no-mail ruling=accept-console-alert` exits 0. The same check with `outcome=fired` exits 1, as it should: no mail was seen.

## The spend read and the test amount

```
s0_account=471112560111
s1_limit=1.0
s1_actual=6.828
answer_test_amount=1.00
```

- **Read:** on 2026-10-22, about 08:50Z, in account `471112560111`, under the operator's profile for that account. The account check `s0_account` is an addition to the plan's lines, made first in both sittings.
- **Credits:** plan 183-14 recorded `Credits: no`. The budget excludes credits and refunds in any case.
- **Arithmetic:** the actual alert is set at 80 percent of the limit. 80 percent of 1.00 USD is 0.80 USD, which is below the computed spend of 6.828 USD. So the 1 USD budget could fire as it was, and no test apply was made: no `s2_test_apply_exit` line. The budget had been at 1 USD since the first apply of plan 183-16 on 2026-10-21. Its computed spend was already 6.475 USD then, past the threshold.
- **A limit below 1 USD:** not tried, so whether AWS accepts one is still unobserved.

## The mail

- **No mail from AWS Budgets reached the operator.** No `answer_mail_arrived_utc`, `answer_mail_subject` or `answer_mail_alert` line exists for this attempt. None is invented here. The status at the start of the wait was `answer_mail=not-yet`, a line the plan does not name.
- **The outcome:** more than two days passed after the spend was past 80 percent of the test amount with no mail, so by the plan's own words the outcome is `no-mail`.
- **The time between the apply and the mail:** not known, because no mail arrived.

The operator's words, verbatim:

- 2026-10-23: "The mail address was not confirmed, that's why the mail wasn't sent but the alerts were noted there. We can be satisfied with alert handling so let's not dwell on that further"
- Before that: the budget alerts "were correctly visible in the panel", meaning the AWS Budgets console.
- "the mail works now"

**The orchestrator's reading, recorded as such.** The operator overrides the plan's requirement that the mail be observed. The operator accepts the alert handling on the evidence of the console, where the alert was seen as triggered. The mail was not delivered because the recipient address had not been confirmed, and the operator says this is now fixed. It is stored as `answer_operator_ruling=accept-console-alert`.

**Not established.** The budget module mails the address directly and has no SNS topic, so AWS holds no subscription in this configuration that needs confirming. What "not confirmed" refers to was not stated. The most likely place is the receiving side of the address, but that is not confirmed and was not asked, at the operator's request. That mail now reaches the address was not observed by this plan.

## The raise to 100 USD, under the ruling

The plan raises the budget only for the outcome `fired`. It keeps the test amount on `no-mail` so that the alert can still fire when the checkpoint is raised again. The ruling ends that re-raise, so the raise was run with the plan's own commands. The operator gave the go-ahead by choosing that path: `answer_raise_under_ruling=yes`, a line the plan does not name.

```
s4_raise_plan_exit=0
s4_plan_line=Plan: 1 to add, 0 to change, 1 to destroy.
s4_plan_resource=  # module.budget.aws_budgets_budget.monthly will be replaced, as requested
s4_raise_apply_exit=0
answer_lock_branch=no
```

- **The plan:** with no `-var`, it replaced exactly one resource, the budget.
- **The apply:** it ran the usual way, applying the saved plan, because plan 183-16 saw the state lock (`answer_lock_seen=yes`). No lock read was made here.
- **Provenance:** the operator did not send `answer_attempt`, `answer_raise_under_ruling` or `answer_lock_branch` as lines; the orchestrator filled them in. The attempt id matches the checkpoint. The raise line comes from the operator choosing the raise path and running it. `answer_lock_branch=no` is inferred because the apply exited 0 with no lock error. The operator pasted `s0_account` separately, with the plan lines.

### Read-back after the raise

```
s5_budget=100.0,USD,COST,MONTHLY
s5_notification=ACTUAL,GREATER_THAN,80.0,None
s5_notification=FORECASTED,GREATER_THAN,100.0,None
s6_second_plan_exit=0
s7_logs_removed=yes
```

- **The budget:** a monthly cost budget of 100 USD on account `471112560111`.
- **The two notifications:** an actual alert above 80 and a forecast alert above 100, both `GREATER_THAN`.
- **The threshold type reads `None`, not the `PERCENTAGE` the plan expected.** The live API left the field out of `describe-notifications-for-budget`. `infra/modules/budget/main.tf` sets `threshold_type = "PERCENTAGE"` on both notifications. The second plan, with no `-var` and `-detailed-exitcode`, exited 0, so it showed no difference between the configuration and the account. This is recorded as a deviation from the expected read-back text, not as a failed check. **UNCONFIRMED:** that the API leaves the default type out of this call is the orchestrator's inference and was not verified by the operator.
- **Logs:** removed with step 7 of the raise sitting. The first sitting gave no `s7_logs_removed` line.
- **No address:** none appears in any line.

## What was seen and what was not

- **The actual alert was seen as triggered in the AWS Budgets console** at the 1 USD test amount. This is the operator's statement, made by 2026-10-23; the date of the view was not given. Its **mail was not seen**: none reached the operator within two days, and the operator gives the reason as an address that had not been confirmed. Delivery of a budget alert to the operator's mailbox is therefore **not observed**. Criterion 3 and INFRA-15 are accepted on the operator's ruling, not on a received mail.
- **The forecast alert is configured and was not seen.** AWS documents that a forecast alert is not triggered until about five weeks of usage data exist.
- **Not established by this plan:**
  - whether the alert is sent again in a later month;
  - how long a mail takes in general;
  - whether mail now reaches the address.

  At 100 USD against a computed spend of about 6.83 USD, the actual alert's threshold of 80 USD is far off, so no alert is expected this month.

## What the operator does about the budget meanwhile

Nothing. The budget stands at the tracked 100 USD, so plans and applies of the bootstrap root take no `-var budget_limit_usd` argument from now on. The account and the variable file agree (mismatch: no).
