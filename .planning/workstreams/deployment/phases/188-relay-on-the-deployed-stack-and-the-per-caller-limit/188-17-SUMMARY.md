---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "17"
subsystem: infra
tags: [terraform, wafv2, cloudfront, rate-limit, relay, staging, cost]
status: complete

requires:
  - phase: 188 (plan 03)
    provides: the nullable relay_rate_limit variable, aws_wafv2_web_acl.relay counted on it, web_acl_id = one(...) on the distribution
  - phase: 188 (plan 15)
    provides: staging restored to :20, a plan after it reading No changes.
provides:
  - "RELAY-09's WAF clause observed against real state: off by default changes nothing, a plan with it on shows one CLOUDFRONT web ACL and an in-place web_acl_id change, never applied"
  - "The rule's cost with its date (2026-11-19): 5.00 + 1.00 USD a month + 0.60 per million requests, about 6.00 USD a month at staging's 3888 requests in 30 days; the flat-rate Free plan as the alternative"
  - "The deploy role holds no wafv2 action"
  - "A dated Observations row in infra/envs/staging/aws/README.md"
affects: [188-19]

actuals:
  tokens: 6000
  tasks: 3
  commits: 3
plan_head_before: 8c7abc9cc477737ba823c178f8c81ecf31b211eb
plan_head_after: 71b2fa973845fc634de1658521b2b47293fdfc11

tech-stack:
  added: []
  patterns:
    - "A saved plan's script reads the plan JSON and keeps redacted Error: diagnostics before it removes anything, and counts plan files and plan JSONs left afterwards"

key-files:
  created:
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-17-waf-plan.md
  modified:
    - infra/envs/staging/aws/README.md

key-decisions:
  - "The distribution's changed key is read from the union of before and after keys plus after_unknown, because web_acl_id is unknown in after until the ACL exists"
  - "Prices were read from the AWS Price List API (awswaf, published 2026-09-14) and the two pricing pages by curl, because WebFetch was not available to the executor"

requirements-completed: []

coverage:
  - id: D1
    description: "With relay_rate_limit unset, a plan of the staging root reads No changes. against real state"
    requirement: RELAY-09
    verification:
      - kind: other
        ref: "evidence/188-17-waf-plan.md: UNSET_PLAN_EXIT=0, UNSET_PLAN_LINE=No changes., UNSET_CHANGES=none (attempt 20261119T155002Z.8a7a4188d)"
        status: pass
    human_judgment: false
  - id: D2
    description: "With the rule on, the plan shows one CLOUDFRONT web ACL (300 per 300 s per IP, scoped to /api/usage, 429) and the distribution updated in place by web_acl_id alone; nothing applied"
    requirement: RELAY-09
    verification:
      - kind: other
        ref: "ON_PLAN_LINE=Plan: 1 to add, 1 to change, 0 to destroy., ON_DISTRIBUTION_CHANGED=web_acl_id, ON_ACL_SCOPE=CLOUDFRONT, ON_RULE_SCOPE_DOWN=/api/usage, ON_RULE_RESPONSE=429, PLAN_FILES_REMOVED=yes, APPLIED=no, DISTRIBUTION_WEB_ACL_AFTER=none (attempt 20261119T161248Z.1e8f5cedf)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The cost recorded with its date, and the deploy role holds no wafv2 action"
    requirement: RELAY-09
    verification:
      - kind: other
        ref: "WAF_COST_READ_ON=2026-11-19, WAF_COST_ESTIMATE_USD_MONTH=6.00, CF_REQUESTS_30D=3888, FLAT_RATE_ALTERNATIVE=..., DEPLOY_ROLE_WAFV2_ACTIONS=0; Task 3 verify exit 0"
        status: pass
    human_judgment: false

duration: about 50 min of work across three executor sittings (15:48Z readiness, 16:06Z to 16:11Z sitting one, 16:38Z to 16:45Z sitting two), plus the waits for the operator
completed: 2026-11-19
---

# Phase 188 Plan 17: The WAF rate rule planned on, unchanged off, and costed Summary

**With `relay_rate_limit` unset, a plan of the staging root read `No changes.`, so the variable's default leaves the live distribution as it is and every hand apply of this phase was restored. With the rule on (300 requests per 300 s), the plan read `Plan: 1 to add, 1 to change, 0 to destroy.`:**
- **one web ACL `openvaa-staging-relay`**, in scope `CLOUDFRONT` through `us-east-1`, default action allow, one rate rule per source address, scoped to paths starting `/api/usage` after `NORMALIZE_PATH`, blocking with 429;
- **the distribution updated in place**, `web_acl_id` being the one changed argument.

**Neither plan was applied, and no plan file or plan JSON is left. The distribution's `WebACLId` is still empty. The deploy role holds no `wafv2` action. Read on 2026-11-19, the rule costs 5.00 USD a month for the web ACL, 1.00 for the rule and 0.60 per million requests, and every request to the distribution is inspected. At staging's 3888 requests in 30 days that is about 6.00 USD a month. CloudFront's flat-rate Free plan is the alternative, not adopted.**

## Results

| Stage | Result |
| ----- | ------ |
| Readiness | Build `a7003b490…` on `:20`, no run active, no override in the tfvars, `relay_rate_limit` unset, the distribution `E3V7BYRXOVAFII` with an empty `WebACLId`, 0 CloudFront web ACLs |
| Unset plan (attempt `…8a7a4188d`) | Exit 0, `No changes. Your infrastructure matches the configuration.` |
| On plan (attempt `…1e8f5cedf`) | Exit 0, `Plan: 1 to add, 1 to change, 0 to destroy.`: `create module.frontend.aws_wafv2_web_acl.relay[0]` and `update module.frontend.aws_cloudfront_distribution.this`. The changed key is `web_acl_id` alone and the plan has no `replace_paths` |
| Rule arguments | `CLOUDFRONT`, `aws.us_east_1`, allow by default, `relay-rate`, block 429, limit 300, window 300, `IP`, `uri_path` `STARTS_WITH` `/api/usage`, `NORMALIZE_PATH` |
| After | 0 `.tfplan` files and 0 plan JSONs left. `WebACLId` empty and 0 web ACLs, read at 16:11:08Z and at 16:39:30Z. Nothing applied |
| Deploy role | 11 attached policies, no inline policy, 0 `wafv2:` actions, no `*` action and no `NotAction` |
| Cost | 5.00 + 1.00 USD a month + 0.60 per million requests, every request inspected. 3888 requests in 30 days gives about 6.00 USD a month. Read 2026-11-19 |

## Task Commits

1. **Task 1: Readiness:** `8a7a4188d` (docs)
2. **Task 2: Operator approval:** no commit. Attempts `20261119T155002Z.8a7a4188d` and then `20261119T161248Z.1e8f5cedf`, bound by the orchestrator. `bound` and `has '^answer_sitting=approve$'` were re-checked here for each, all exit 0.
3. **Task 3, sitting one (stopped):** `1e8f5cedf` (docs)
4. **Task 3, complete:** `71b2fa973` (docs)

## Deviations from Plan

### Process deviations

**1. [Process] A failed rule-on plan, its cause unread**
- **Found during:** Task 3, sitting one (attempt `20261119T155002Z.8a7a4188d`)
- **What happened:** The first plan with the rule on exited 1 after about 114 s. My script removed `$L`, the log with it, before reading the diagnostics, so the cause is not known.
  - `show -json` of the saved, errored plan exited 0 with no change lines.
  - A stale lock is ruled out, because each later plan took the lock.
- **Handling:** I stopped and reported it.

**2. [Process] One extra plan, beyond the two approved**
- **What happened:** To read that error, I made one identical rule-on plan, with 0 runs active. It exited 0 in 14 s with the expected `Plan:` line. Its file was also removed before its JSON was read. The failure did not recur, which is consistent with a transient read failure, but that is unconfirmed.
- **Fix:** The operator approved one further rule-on plan under a new attempt. Before it ran, the script was changed to:
  - keep the redacted `Error:` diagnostics on any failure;
  - read the plan JSON before removing anything;
  - count the plan files and JSONs left afterwards.
- **Result:** That plan is the `ON_*` record.

**Total:** four plans, one unset and three rule-on. None was applied, none is left, and no plan output was shared.

**3. [Rule 3 - Blocking] Pricing pages read without WebFetch**
- The executor had no WebFetch tool. I read the WAF and CloudFront pricing pages with `curl` (HTTP 200 each) and took the prices from the AWS Price List API (`awswaf`, publication date 2026-09-14).
- The Free plan's request allowance was not in the text extracted, so the research's figure of 1M requests a month is not re-confirmed.

## Known Stubs

None.

## Next Phase Readiness

- RELAY-09's WAF clause has its observation: off by default it changes nothing, planned on it shows the rule, and its cost is recorded with the date. The requirement stays open for the phase verifier, as the dispatch requires.
- Staging is unchanged: `:20`, `a7003b490`, no web ACL, `trackEvents` still `false`.
- The orchestrator removed earlier plans' leftover plan JSONs (188-13 to 188-15) from the scratchpad. This plan left none.

## Self-Check: PASSED

- FOUND: evidence/188-17-waf-plan.md, infra/envs/staging/aws/README.md
- FOUND: 8a7a4188d, 1e8f5cedf, 71b2fa973 (ancestors of HEAD)
- Task 1 verify exit 0, Task 2 verify exit 0, Task 3 verify exit 0, `bound 188-17-2 OPERATOR_REPLY plan=188-17 task=2` exit 0
