---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "14"
subsystem: infra
status: complete
tags: [aws, cloudfront, acm, ecs, alb, security-groups, tags, state-lock, runbook, read-only]
requires:
  - phase: 185-13
    provides: the running staging AWS stack, state at pipeline/staging/aws/terraform.tfstate
provides:
  - Steps 7 and 8 of the staging AWS runbook observed on the applied stack, with nothing changed
  - evidence/185-14-served-stack.md
  - Step 7, item 4 rewritten to render the questions page in Playwright's Chromium, because the statements are not in the server's HTML
  - twelve runbook rows moved from "Not yet observed" to dated Observations
affects: [185-15, 185-16, 185-19, 185-20]
tech-stack:
  added: []
  patterns:
    - "Content the located layout renders only after its data resolves in the browser is read from a headless-browser render (`node --input-type=module -e` with createRequire from the repository root), never from the server's HTML"
    - "Addresses are read into variables, used and unset; only their role (present/resolved) is printed"
key-files:
  created:
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-14-served-stack.md
  modified:
    - infra/envs/staging/aws/README.md
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/deferred-items.md
key-decisions:
  - "Step 7, item 4's statement check searched the server's HTML, which by design holds none of the statements (the located layout sets `ready` in an $effect); it now renders /questions in Playwright's Chromium, and the runbook's tool list names Node and that Chromium"
  - "FORM_POST_PUBLIC_ORIGIN is 405, not 403: /contestant/login has no form action, and SvelteKit's origin check precedes routing; a supplementary post to /contestant/login/email reached the action (400), recorded beside the runbook's item"
  - "The task's environment was also read by name against task-environment.json (16 names equal), for the must-have 'started with exactly the list's variables'"
requirements-completed: [INFRA-03, INFRA-04, INFRA-06, INFRA-08, INFRA-10, INFRA-11, INFRA-12, INFRA-13, INFRA-14, OBS-08]
duration: 11min
completed: 2026-11-13
estimate_ref:
  tokens: 26000
  tasks: 3
actuals:
  tokens: 17300
  tasks: 3
  commits: 3
plan_head_before: 544608c23c3cee867ca0fcf79eae9efb85451a2f
plan_head_after: d65c2c602ced6c4d74843da47d966136ee5ef867
---

# Phase 185 Plan 14: What the applied stack serves and how it is built Summary

```
IMMUTABLE_SECOND_HIT=yes
SSR_READS_SUPABASE=yes home=5 questions=5
LOCK_SECOND_PLAN=refused
```

The applied staging stack does what the runbook says, and nothing was changed to see it. Both
certificates are `ISSUED` with DNS validation, in `us-east-1` and `eu-north-1`. HTTP answers 301 to
HTTPS, and the chain verifies without `-k`. Voter pages carry the canonical project id and inline
five fetches of the hosted REST host, and a browser render shows the first smoke statement. A
foreign-origin form post is refused with 403. Pages are never served from the edge, but the
immutable asset is. Only the CloudFront prefix list reaches the load balancer, and only the load
balancer reaches the task. All 26 taggable resources carry the four default tags. Only the viewer
certificate and the distribution sit outside `eu-north-1`. The log group keeps 90 days. A second
plan started beside a first is refused on the state lock.

## What was done

All three tasks ran with `AWS_PROFILE=openvaa-admin` in `eu-north-1`, and the account was asserted
as 471112560111 before every AWS and Terraform call. Raw output stayed in a `umask 077` `$L` per
step, and that directory was removed at the end of the step.

- **Task 1 (tracer), Step 7 items 1 to 4.**
  - Both certificates read `ISSUED`, each with one `DNS:SUCCESS` validation.
  - The redirect reads `301 location=https://staging.openvaa.org/`, and `ssl_verify_result=0`.
  - `/` and `/questions` both answered 200. Each carries `data-project-id`
    `00000000-0000-0000-0000-000000000001` and inlines five fetches of `<PUBLIC_SUPABASE_URL>/rest/v1/`.
  - The server's HTML held none of the six statements (see deviation 1). A Playwright Chromium
    render of `/questions` followed the page to `/questions/__first__`, where it read
    `Public transport should be free of charge in cities.` under `1/6`.
  - The task definition's environment and secret names equal the 16 names of
    `task-environment.json`.
  - The tracer gate: the verify was re-run before Task 2 and exited 0.
- **Task 2, Step 7 items 5 to 7.**
  - Form post with the public origin: 405 on `/contestant/login`, and 400 from the action on
    `/contestant/login/email`. With `Origin: http://attacker.example`: 403 with the cross-site text
    on both.
  - The page `/` missed the edge twice with no `age` and no origin `cache-control`.
  - `/_app/immutable/entry/start._C5OoPLf.js`: `Miss`, then `Hit`, with
    `public,max-age=31536000,immutable`.
  - 11 error responses, each with `ErrorCachingMinTTL` 0.
  - Grace period 60, health check path `/api/health`, and one target `healthy`.
- **Task 3, Step 8.**
  - Each group holds one ingress rule, by role: `load-balancer-sg` on 3000 and
    `cloudfront-prefix-list` on 443. The CloudFront rule's description is the one from the 185-13
    fix.
  - No NAT gateway. One default route, to the internet gateway.
  - The task has a public address. Direct requests from the workstation to it and to the load
    balancer each ended with curl 28 and HTTP `000`.
  - 40 managed resources, 26 taggable, 0 untagged. The task carries `Root=aws`.
  - 30 ARNs. Only `aws_acm_certificate.viewer` (`us-east-1`) and `aws_cloudfront_distribution.this`
    (global) are outside the home region.
  - Retention is 90 days, and the running task has one stream.
  - The state is `AES256`, versioned, and the bucket's versioning reads `Enabled`.
  - The lock: the second plan exited 1 with `Error acquiring the state lock`. The first exited 0
    with no changes.
  - Twelve "Not yet observed" rows moved to dated Observations, and the runbook is Prettier-clean.

## Verification

| Check                                                                                         | Exit                      |
| --------------------------------------------------------------------------------------------- | ------------------------- |
| Task 1 verify (seven record lines)                                                            | 0                         |
| Task 2 verify (form posts, caching, health)                                                   | 0                         |
| Task 3 verify 1 (record lines, and no IPv4 outside the VPC and documentation ranges)          | 0                         |
| Task 3 verify 2: `prettier --check infra/envs/staging/aws/README.md`                          | 0                         |
| All three verifies re-run on the final tree                                                   | 0                         |
| No AWS change: the lock test's first plan reads `No changes`, the same as 185-13's no-change plan | 0                         |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Step 7, item 4 searched the server's HTML for statements it never holds**
- **Found during:** Task 1
- **Issue:** `grep -F -f statements s7-questions.html` printed nothing (`s7_questions_html_statements=0`).
  `(voters)/(located)/+layout.svelte` sets `ready` in an `$effect` once the streamed question and
  nomination data resolve. Effects do not run on the server, so the server's render of `/questions`
  is the loading state. The questions' fetches are made after the server's render, so they are not
  inlined either. As written, the item could never succeed.
- **Fix:** The item now also counts the statements in the server's HTML, expecting 0. It then
  renders `$U/questions` in Playwright's Chromium (`@playwright/test`, already a dependency, so
  nothing was installed) and searches the rendered text. It waits for `1/6`, the first question's
  counter. "Before you start" names Node and that Chromium. The evidence was produced by the
  item's new form.
- **Files modified:** infra/envs/staging/aws/README.md
- **Commit:** 8d024c714

### Scope notes

**2. [Beyond the runbook item] A post to the sign-in action itself**
- `/contestant/login` holds two links and no form action, so the post with the public origin is a
  405. That still shows the origin check passed, because SvelteKit checks before routing, but it
  does not show an action being reached.
- The same two posts were made to `/contestant/login/email`. The public origin got 400, the
  action's `fail`. The foreign origin got 403 with the cross-site text.
- This was one failed password sign-in against hosted Auth, for an address that does not exist,
  and nothing was written.
- The runbook item and `infra/local/check-proxy-topology.sh` still post to `/contestant/login`.
  That is logged in `deferred-items.md`, not changed.

**3. [Beyond the runbook item] The task's environment read by name**
- The must-have truth says the task was "started with exactly the list's variables". Step 7 has no
  item for it.
- `describe-task-definition` was read by name only. Its 16 environment and secret names equal
  `task-environment.json`'s (`cmp` exit 0), and the two secrets are the list's two `parameter`
  entries.

### Plan assumptions, as flagged

- **INFRA-11:** only the workstation's direct requests were tried. No request was made from another
  AWS account.
- **INFRA-14:** no error page was provoked. `ErrorCachingMinTTL` 0 was read from the configuration.

## Known Stubs

None.

## Threat Flags

None. T-185-31: no IP address is in the evidence, the runbook or this summary, and the IPv4 scan of
the evidence exits 0. T-185-32: `terraform show -json` stayed in `$L`, and only counts, addresses
and types were printed. T-185-SC: no package was installed.

## Self-Check: PASSED

- FOUND: evidence/185-14-served-stack.md with every record line of Tasks 1 to 3, including `IMMUTABLE_SECOND_HIT=yes`
- FOUND: commits 8d024c714, e157300c0, d65c2c602 on HEAD
- FOUND: twelve dated Step 7 and Step 8 rows in the runbook's Observations, and none of their twelve "Checked by" rows left in "Not yet observed"
- No STATE.md or ROADMAP.md edit
