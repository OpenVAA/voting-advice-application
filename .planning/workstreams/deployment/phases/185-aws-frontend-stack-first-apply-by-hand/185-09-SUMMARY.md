---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "09"
subsystem: infra
status: complete
tags: [runbook, terraform, aws, ecs, cloudfront, scaling, destroy, cost, supabase]
requires:
  - phase: 185-08
    provides: the runbook's frame, Steps 1 to 6 and the opening block every step repeats
  - phase: 185-05
    provides: infra/scripts/request-loop.sh
  - phase: 185-03
    provides: the stop record and the diagnostics route the steps read
provides:
  - infra/envs/staging/aws/README.md Steps 7 to 18, with named lines s7_ to s18_
  - the section "Election day"
  - 45 "Not yet observed" rows for Steps 7 to 18, research A1 to A3 among them
affects: [185-14, 185-15, 185-16, 185-17, 185-18, 185-19, 185-20, 185-22, 187]
tech-stack:
  added: []
  patterns:
    - "Every apply of Steps 9 to 12 and the destroy is made from a saved plan read against a stop rule, whose planned changes print as `<actions> <address>` with a debug rule's key masked as `[<address>]`"
    - "A secret or token reaches curl as a configuration on a file descriptor (`-K <(printf ...)`), never on a command line"
    - "A multi-line server record is searched for by its message line and its signal line separately, each in the task's own stream"
    - "Date arithmetic is done with jq (`fromdate`, `strftime`), so the steps run alike on macOS and Linux"
key-files:
  created: []
  modified:
    - infra/envs/staging/aws/README.md
    - .planning/WINDOWS.md
key-decisions:
  - "Step 16 applies a saved destroy plan whose count equals the managed resources of the state, rather than running terraform destroy, so the destroy is the plan that was counted"
  - "Election day converts the peak's local times to UTC, because the root passes no schedule_timezone to the module"
  - "The requests of Steps 9 and 13 go over IPv4 (curl -4), because the distribution also answers over IPv6 and the workstation's address is read over IPv4"
  - "Step 15 deletes the invitee by address only when the user holds no grant beyond an entity's"
patterns-established:
  - "Named lines s<step>_<field>=, statuses on the next line, the operator's items marked **The operator's:**"
requirements-completed: [INFRA-07, INFRA-09, INFRA-14, OBS-04, OBS-06, OBS-10, SUPA-12, INFRA-13]
duration: 35min
completed: 2026-11-12
actuals:
  tokens: 33700
  tasks: 2
  commits: 2
plan_head_before: 8035b0fb8a528a6a7491bfbd411b3a2d5d2bc2ef
plan_head_after: 1db698cd41bfe2ea429824f6234841791f1ff052
---

# Phase 185 Plan 09: The AWS Runbook, Steps 7 to 18 Summary

The AWS root's runbook now holds every step after the first apply. Steps 7 and 8 read the running stack. Steps 9 to 12 each change it for one observation and then change it back. Steps 13 and 14 cover the feedback limit and the invitation mail, Steps 15 to 17 the destroy and the re-apply, and Step 18 the cost. A section "Election day" follows Step 18. Each hosted plan from 185-14 on now has one or two runbook steps whose commands and expected named lines it can quote.

## Performance

- **Duration:** about 35 min
- **Completed:** 2026-11-12T18:32Z
- **Tasks:** 2 of 2
- **Files:** 1 modified (the runbook), plus the WINDOWS.md entry marked fixed

## Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 (tracer) | Steps 7 to 12 and "Election day" | 60e5e835e | infra/envs/staging/aws/README.md |
| 2 | Steps 13 to 18 and the "Not yet observed" rows | 1db698cd4 | infra/envs/staging/aws/README.md |

## What was built

The runbook grew from 953 to 3564 lines. Each step begins with the opening block of 185-08 unchanged, and its last item removes `$L`.

**Step 7, what the stack serves:**
- both certificates, as `ISSUED`, DNS-validated and in their region
- the 301 of `http://staging.openvaa.org/`
- the chain verified, with `ssl_verify_result` 0 and no `-k`
- the front page and `/questions`, each with its `data-project-id`, its count of `data-sveltekit-fetched` entries on the Supabase REST host, and the smoke statements it carries
- the form post of `check-proxy-topology.sh`: from the public origin it is not 403; from `http://attacker.example` it is 403 with the cross-site text
- the caching pattern: two page requests, each `Miss` or `RefreshHit` with no `age`; two requests for an `/_app/immutable/*` file taken from the page, the second a `Hit`; both `cache-control` values; the eleven error responses at TTL 0
- the target group's path, the grace period and the target's state

**Step 8, the network, the tags and the regions:**
- both groups' ingress rules, each printed by the role of its source
- the NAT gateways and the default route
- the task's public address present but not printed, and direct requests to it and to the load balancer timing out (curl 28, `000`)
- the four default tags on every `tags_all` resource of `show -json`, with the types that carry no tags listed by name
- the running task's `Root` tag
- every ARN outside `eu-north-1`
- the log retention and the task's stream
- the state object, and two plans started five seconds apart, the second refused on the lock

**Step 9, the header record and the origin locks:**
- `WS` is read from `checkip.amazonaws.com` and never printed (`echo "$WS"` occurs 0 times).
- Diagnostics are switched on with a `/32`, both given as `-var`.
- Each `x-forwarded-for` entry is printed by role (`spoof`, `viewer`, `edge`), with the viewer's depth and the client-address and header checks. The depth verdict follows.
- If the record differs from depth 2, the step changes `XFF_DEPTH` in the tfvars and is run again.
- Both locks are checked through `--resolve`: no header gives 403, a wrong header 403, the header from the sensitive output 200. Port 80 gives 301.
- Diagnostics are switched off again: a plan with neither variable, the diagnostics route back to 404, no answer from the load balancer, one ingress rule left, and a plan with `-detailed-exitcode` 0.

**Step 10, the failed rollout:**
- The precondition is checked: one `PRIMARY` `COMPLETED` deployment.
- `request-loop.sh` runs from before the fault apply.
- The apply with `-var 'omit_environment=["ORIGIN"]'` runs in the background, and its status is recorded whatever it is.
- The deployments and the old target's state are read every 30 s for up to 30 minutes, until the rollback completes. If no rollback comes, the step stops for a decision.
- The failed tasks are read: their stop reasons, their exit codes, and the `Required environment variables are not set: ORIGIN` line in each one's own stream.
- The step reads the rule's `TriggeredRules` and `Invocations` and the topic's `NumberOfNotificationsDelivered`.
- The loop's `non_2xx` is read, and the operator reports whether the alert mail arrived and when.

**Step 11, the restore:**
- The loop runs again during a plain apply, which must exit 0.
- The stopped task is read: `STOPPED`, its stop reason and `exitCode` 0.
- The stop record is searched for in that task's stream twice: once for the message line, once for the `signal: 'SIGTERM'` line. Each is matched on its own line, as the 185-03 deferred item requires.
- The step reads the loop's `non_2xx` and makes a plan with `-detailed-exitcode`.

**Step 12, the scheduled floor:**
- `at()` times six and sixteen minutes ahead, built with jq, and a two-minute margin check before the apply.
- The count is read every minute into a `utc,running,desired,min,max` record for up to 30 minutes after the lowering.
- The record gives the highest count seen, the floor judged on the desired count, the times at 2 and back at 1, and the scale-in minutes.
- The scaling activities are read, along with the scale-in's stopped task and its stop record.
- The pair is removed with `Plan: 0 to add, 0 to change, 2 to destroy.`, followed by the bounds `1,2` and a plan with exit 0.

**Election day:** the two entries are written in the tracked tfvars, in UTC, and applied once. No apply is made between the two actions. After the peak the entries are removed and that change is applied once.

**Step 13, the feedback limit:**
- The anon key is read from the page's inlined public environment, in both its JSON and its devalue form.
- The browser's insert is rebuilt with `jq`, carrying the project id, `limit-check <time>` and the page URL, and sent over IPv4 with `Origin`.
- One insert from the agent. Then the operator's block: up to seven inserts, stopping at the first refusal, which must be `400`/`P0001`. Then the phone's feedback, off Wi-Fi, marked `limit-check phone`. Then one more insert from the workstation, which must still be refused.

**Step 14, the invitation:**
- The registration modes come from `contestant_app_public_config` and a smoke candidate's id from an anonymous read.
- The administrator signs in through the Admin App's form. The step prints the status, the location path, `cache-control`, `x-cache` and the cookie names only.
- The step takes the access token, then calls `create_invitations` with `p_confirm_entity` false and the second mailbox read with `read -r`.
- The operator requests the link on `/contestant/login/email`, checks the link's origin and path, and follows it.

**Step 15, before the destroy:**
- The log lines are copied once more: the start-up refusals, the stop messages and the signal lines.
- The agent plans `dns-mail` read-only.
- The step counts `Root=aws` resources by type in both regions.
- The operator deletes, in one transaction as `postgres`, the invitee, the invitation by id and the `limit-check` feedback rows, with each count read back. The operator's `supabase` plan must exit 0.

**Step 16, the destroy:**
- `STATE_MANAGED_COUNT` is taken from `state list`, leaving out the data sources.
- A saved `plan -destroy` must read `0 to add, 0 to change, N to destroy`, with N equal to that count. Its apply runs in the background.
- The first sweep classifies what is left, then the `INACTIVE` revisions are listed and removed with `delete-task-definitions`.
- The sweep repeats every 10 minutes in both regions until both read 0.
- What must survive is read: the image digest, the two parameters, the zone, the role, the `dns-mail` plan, and the operator's `supabase` plan and conformance probe.

**Step 17, the re-apply:**
- The step checks the same tag, the image in the registry and a clean root and module.
- One plan and one apply follow, with Step 5's stop rule, and `s17_apply_completed_utc` is recorded.
- Then a second plan with exit 0, the health build match, the voter page, the 90-day retention, and the new subscription, pending until the operator confirms it.

**Step 18, the cost:**
- The tags must be active.
- The window starts the day after the re-apply and ends exclusive at yesterday. It goes on only with 7 or more days, and gives the readable-from date as the re-apply plus 9.
- The daily cost by `Root=aws`, its sum, mean and ×30.4.
- The days from the first apply to the window, listed and never summed.
- Usage by service and type, and the account's public IPv4 lines.
- A priced inventory from the price list, with publication dates and the stated assumptions. The awk computing it gives 50.58 on sample prices that match research A10.

**Not yet observed:** 45 rows, each naming its step and item. They include research A1 (the circuit breaker on a task that exits at start), A2 (the Tagging API and `INACTIVE` task definitions) and A3 (the time scale-in takes).

**Also changed:**
- "What the operator gives" lists the needs of Steps 10, 13, 14 and 17.
- The Flow overview sentence describes Steps 7 to 18.
- The rule on command-line variables gains the election-day exception.

## Verification

| Gate | Result |
| ---- | ------ |
| Task 1 verify (13 strings, `prettier --check`) | exit 0, and again after the commit as the tracer gate |
| Task 1 acceptance: `checkip.amazonaws.com` count, `echo "$WS"` count | 2, 0 |
| Task 2 verify (15 strings, Prettier, no planning reference) | exit 0 |
| Task 2 acceptance: e-mail-shaped strings in the runbook | 0 |
| Command lines in `bash`/`hcl` blocks longer than 80 characters | 0 |
| Every jq, awk and sed program of Steps 7 to 18, run on sample inputs | expected output from each; the inventory awk was run under `LC_ALL=C`, as the steps export it |
| `yarn workspace @openvaa/frontend test:unit -- taskEnvironment` | exit 0 (the filter ran the whole frontend suite: 5980 passed, 31 skipped) |
| `yarn test:unit:infra` | exit 0, 102 passed |

Nothing ran against AWS or the hosted project. No plan or apply was made.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Truth] Election day reads its times in UTC**
- **Found during:** Task 1
- **Issue:** the plan asks for the entries "with the peak's times and the election's timezone". The module has `schedule_timezone`, but the staging root does not declare or pass it, so every schedule is read in UTC. This plan may change only the runbook.
- **Fix:** the section says to convert the peak's local times to UTC. Step 12 says the same.
- **Commit:** 60e5e835e

**2. [Rule 2 - Correctness] Every apply comes from a saved, read plan, and the destroy too**
- **Found during:** Tasks 1 and 2
- **Issue:** the root's own rule is that only a saved plan, read against its stop rule, is applied. The plan's wording says "an apply with -var" and "`terraform destroy`".
- **Fix:**
  - Steps 9 to 12 each save a plan, print its summary line and its changes, and quote a stop rule with the exact count and addresses.
  - Step 16 applies the saved `plan -destroy` whose count it compared with the state. This is what `terraform destroy` does after its prompt, and it is the plan 185-19 counts.
- **Commits:** 60e5e835e, 1db698cd4

**3. [Rule 2 - Correctness] IPv4 only where an address is compared or bucketed**
- **Found during:** Task 1
- **Issue:** the distribution has an AAAA record. A workstation with IPv6 would reach CloudFront over IPv6, so the viewer entry would never equal the IPv4 address `checkip` returns.
- **Fix:** Step 9's diagnostics requests use `curl -4`. Step 13's inserts use it too, so all of them come from one address.
- **Commits:** 60e5e835e, 1db698cd4

**4. [Rule 2 - Security] No secret on a command line**
- **Found during:** Tasks 1 and 2
- **Fix:**
  - The origin header's value, the anon key and the administrator's token reach `curl` through `-K <(printf ...)`.
  - The administrator's address and password reach `curl` through `jq` on standard input, from the environment.
  - The invitee's address reaches `psql` through `\getenv`.
- **Commits:** 60e5e835e, 1db698cd4

**5. [Rule 2 - Correctness] The cleanup cannot delete the wrong user, and removes the phone's row**
- **Found during:** Task 2
- **Fix:**
  - Step 15 deletes the user by address only when it holds no grant beyond an entity's, so a mistyped administrator address deletes nothing and the counts show it.
  - Step 13 asks for the phone's feedback text to begin `limit-check`, so the same cleanup removes that row.
- **Commit:** 1db698cd4

**6. [Rule 2 - Correctness] The election-day exception in the rules**
- **Found during:** Task 1
- **Issue:** "Rules of this root" says `scheduled_floor_changes` is given on the command line only. Election day writes it in the tfvars, so the two would contradict each other.
- **Fix:** the rule names that one exception and why.
- **Commit:** 60e5e835e

**7. [Rule 2 - Correctness] Step 12 judges the floor on the desired count**
- **Issue:** the running count lags the raised floor while a task starts. Judged on the running count, "below the floor" would read true for a minute every time.
- **Fix:** the floor is judged on the desired count, and the record says why.
- **Commit:** 60e5e835e

### Additions

- Step 10 reads the old target's health at every poll and counts the reads that were not `healthy`, for 185-16's `OLD_TARGET_HEALTHY_THROUGHOUT`.
- Step 16 lists `ACTIVE` revisions as well as `INACTIVE` ones (expected 0 after the destroy).
- Step 17 records `s17_apply_completed_utc`, the `REAPPLY_UTC` that 185-20 records and 185-22 uses.

## Prohibition

**"MUST NOT give a step that changes the hosted Supabase project except the cleanup":**
- Steps 13 and 14 write to the project only as the observations themselves: the feedback inserts, and one invitation with the user its link creates.
- Step 15 removes exactly those, each count read back as 0.
- No other step writes there. The `supabase` plans of Steps 15 and 16 are read-only and say so.

## Known Stubs

None. The flow overview now describes Steps 7 to 18. The WINDOWS.md entry 291 ("Steps 7 to 18 are not written yet") is marked `fixed` with `gsd_run windows fixed 291`.

## Threat Flags

None.
- **T-185-21:** mitigated by Step 15.
- **T-185-SC:** no package was installed, and every `init` in the new steps uses `-lockfile=readonly`.

## Self-Check: PASSED

- FOUND: infra/envs/staging/aws/README.md (headings `### Step 7:` to `### Step 18:`, `## Election day`)
- FOUND: .planning/WINDOWS.md row 291 `fixed`
- FOUND commits: 60e5e835e, 1db698cd4 (each an ancestor of HEAD)
