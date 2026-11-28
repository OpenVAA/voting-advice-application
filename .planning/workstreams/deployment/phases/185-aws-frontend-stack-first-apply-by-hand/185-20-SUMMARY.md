---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "20"
subsystem: infra
status: complete
tags: [terraform, re-apply, aws, supabase, conformance-probe, sns, runbook]
requires:
  - phase: 185-19
    provides: the AWS root destroyed, its state empty, and what lives outside it read after the destroy
provides:
  - The supabase plan and the conformance probe after the AWS teardown, both 0
  - The staging AWS stack applied again from nothing in one plan and one apply, serving the image's build
  - The re-created topic's subscription confirmed
  - evidence/185-20-after-and-reapply.md
affects: [185-21, 185-22]
tech-stack:
  added: []
  patterns:
    - "A probe's COULD NOT RUN on the catalog is a connection result, not a conformance finding: the direct host is IPv6-only from an IPv4-only network, and the session pooler is the path"
    - "A voter page's statements are read from a headless render, never from the server's HTML, which shows the located layout's loading state"
key-files:
  created:
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-20-after-and-reapply.md
  modified:
    - infra/envs/staging/aws/README.md
    - infra/envs/staging/supabase/README.md
key-decisions:
  - "Step 17 item 5 read a statement from the server's HTML, which by Step 7 item 4 never holds one; the item now runs Step 7 item 4's headless render, and the voter-page truth is met by that render"
  - "The probe's first sitting (status 2, COULD NOT RUN catalog, direct host from an IPv4-only network) and its second sitting over the session pooler (status 0, 22 PASS) are both recorded; PROBE_AFTER_DESTROY_EXIT=0 is the second"
requirements-completed: [SUPA-12, INFRA-10]
duration: about 1 h 30 min wall clock (2026-11-14 16:56Z to 18:25Z), most of it the operator's two sittings
completed: 2026-11-14
estimate_ref:
  tokens: 22000
  tasks: 3
actuals:
  tokens: 5600
  tasks: 3
  commits: 3
plan_head_before: 82451b38728bb5a83c83b87fcd3c9c5514e2770d
plan_head_after: 79455b91efa22edd147bf87dd2a8e7468693e37e
---

# Phase 185 Plan 20: The hosted project after the destroy, and the re-apply from nothing Summary

```
PROBE_AFTER_DESTROY_EXIT=0
REAPPLY_EXIT=0
```

**The destroy left the hosted project alone, and the stack came back from the repository in one
apply.**
- After the destroy, the `supabase` plan read `No changes`, and the conformance probe passed all 22
  checks.
- From the same tag, and the root as committed at the destroy, one saved plan held exactly 40
  creates. Its one apply exited 0 with `40 added` in about four minutes. This is the single apply
  from nothing that 185-13 could not show.
- A second plan was empty. `/api/health` answered 200 through CloudFront with the image's commit as
  `build`. The voter page rendered the first question.
- The log group keeps 90 days, and the new subscription was confirmed.

## Record lines

```
SUPABASE_PLAN_AFTER_EXIT=0
PROBE_AFTER_DESTROY_EXIT=0
PROBE_AFTER_DESTROY_PASS_LINES=22
REAPPLY_UTC=2026-11-14T18:12Z
REAPPLY_PLAN_ONLY_CREATES=yes
REAPPLY_EXIT=0
REAPPLY_SECOND_PLAN_EXIT=0
REAPPLY_HEALTH_BUILD_MATCHES=yes
REAPPLY_VOTER_PAGE=yes
REAPPLY_LOG_RETENTION_DAYS=90
SUBSCRIPTION_AFTER_REAPPLY=PendingConfirmation
SUBSCRIPTION_CONFIRMED_AFTER_REAPPLY=yes
```

## What was done

- **Task 1 (checkpoint, blocking-human):** attempt `20261114T165710Z.82451b387` of key `185-20-1`.
  - Before the checkpoint, the destroy was confirmed on record. The AWS state was read as empty,
    and Step 17 item 1 was preflighted.
  - The operator ran the read-only `supabase` plan and the probe in two sittings.
  - The reply was stored (`put` exit 0), the receipt line was appended, and `bound` exits 0.
  - Commit c2340b1e5.
- **Task 2 (tracer):** Step 17, items 1 to 6, with the account asserted before each AWS call.
  - The saved plan was checked against its shape:
    - `Plan: 40 to add, 0 to change, 0 to destroy.`
    - `s17_planned_create=40` and no other action.
    - `s17_outside_module=0`.
  - The plan was applied once, in the background under `caffeinate -i`, from 18:08:04Z to 18:12Z.
    It exited 0 with no error lines.
  - The `-detailed-exitcode` plan exited 0.
  - Health read 200 with a matching `build`. The questions page read 200 with the project id,
    and the headless render reached `/questions/__first__` with the first question's statement.
  - The log group read 90 days, and the subscription read `email pending`.
  - The tracer gate re-ran the Task 2 verify end to end, and it exited 0.
  - Commit 4aa202a84.
- **Task 3 (checkpoint, blocking-human):** attempt `20261114T181502Z.4aa202a84` of key `185-20-3`.
  - The operator confirmed the subscription at 18:20Z. The reply was stored (`put` exit 0), the
    receipt line was appended, and `bound` exits 0.
  - The agent's read at 18:20:56Z gave `email confirmed`.
  - Four dated rows were added to the AWS runbook's Observations. Its four matching "Not yet
    observed" rows were removed, among them "One apply brings up the whole stack", and its opening
    sentence now names the re-apply.
  - One dated row was added to the supabase runbook's Observations. That runbook had no matching
    "Not yet observed" row.
  - Prettier is clean on both READMEs, and every `$L` was removed.
  - Commit 79455b91e.

## Commits

| Task | Commit | Message |
| ---- | ------ | ------- |
| 1 | c2340b1e5 | docs(185-20): record the supabase plan and the probe after the destroy |
| 2 | 4aa202a84 | docs(185-20): record the re-apply from nothing and read the voter page by its render |
| 3 | 79455b91e | docs(185-20): record the confirmed subscription and the observations of the destroy and re-apply |

## Verification

| Check | Exit |
| --- | --- |
| Task 1 verify (`DESTROY_EXIT=0` on record) | 0 |
| Task 2 verify (every record line and `REAPPLY_UTC=` in form) | 0 |
| Task 3 verify (`REAPPLY_EXIT=0`) and acceptance (`SUBSCRIPTION_CONFIRMED_AFTER_REAPPLY=yes`) | 0 |
| `prettier --check` on both READMEs | 0 |
| Evidence and diff grep for addresses, mailboxes, tokens, links with a query, pooler host | no match |
| `bound` for 185-20-1 and 185-20-3 | 0 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Step 17 item 5 read a statement where none can be**
- **Found during:** Task 2, item 5
- **Issue:** the item grepped the server's HTML of `/questions` for `Defence spending should be
  increased.` and expected a count above 0. It read 0. Step 7 item 4 says the statements are never
  in the server's HTML, which shows the located layout's loading state, and expects
  `s7_questions_html_statements=0`.
- **Fix:**
  - The voter-page truth was observed by Step 7 item 4's read, run as written. It gave
    `s17_rendered=200 .../questions/__first__` and `s17_render_exit=0`, with the first
    question's statement seen, and five inlined Supabase fetches.
  - Step 17 item 5 now runs the same Chromium render and expects
    `s17_first_statement_seen=` above 0.
  - "Before you start" now names Steps 7 and 17 as the pages rendered in a browser.
- **Files modified:** infra/envs/staging/aws/README.md
- **Commit:** 4aa202a84

### Operator-side events

**2. The probe ran in two sittings**
- **Sitting 1:**
  - Block 4b, the session pooler, was skipped although `s15_direct_exit=2`. From an IPv4-only
    network the direct host is not reachable.
  - The probe gave `s23_probe_exit=2` with `COULD NOT RUN catalog: psql exited 2 on the catalog
    query`. That is a connection result, not a conformance finding.
  - The `supabase` plan recorded here, exit 0 with `No changes`, is this sitting's.
- **Sitting 2:** it re-ran the probe over the pooler, with status 0 and 22 `PASS` lines. Both
  sittings are in the evidence. The pooler host is not recorded.
- The supabase runbook's new Observation row says that Step 15 item 2 is needed whenever item 1
  is not 0.

**3. The agent's checkpoint Block 4 named the host attempted, not the connection made**
- It printed `s15_connection=direct` in both sittings. The coordinator recorded `pooler`, the
  connection the probe used.
- The runbook's own Step 15 item 3 runs `psql` before it names the connection, so it was correct
  and is unchanged.
- Future checkpoint blocks must name the connection only after a successful `select 1`, and must
  state that the pooler block is required whenever the direct status is not 0.

### Must-have truths

- All four truths hold as worded. The voter page "of Step 7 again" is met by Step 7 item 4's
  render, per deviation 1.
- The accepted INACTIVE ECS residue of 185-19 no longer exists as such: the cluster and service of
  the same names are ACTIVE again under this apply.

## Known Stubs

None.

## Threat Flags

None. No new surface.
- T-185-46 held: the `supabase` plan was never applied, and the probe writes nothing.
- T-185-47 held: `build` equals 185-12's `SOURCE_COMMIT`.
- T-185-SC held: `init` ran with `-lockfile=readonly`.

## Next Phase Readiness

The stack is running from 18:12Z, which starts the cost window of Step 18 (185-21). The subscription
is confirmed, and the state is at `pipeline/staging/aws/terraform.tfstate`.

## Self-Check: PASSED

- FOUND: evidence/185-20-after-and-reapply.md, holding every record line
- FOUND: c2340b1e5, 4aa202a84, 79455b91e on HEAD
- FOUND: infra/envs/staging/aws/README.md and infra/envs/staging/supabase/README.md, both Prettier clean
