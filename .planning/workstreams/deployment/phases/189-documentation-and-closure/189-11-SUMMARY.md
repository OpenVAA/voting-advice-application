---
phase: 189-documentation-and-closure
plan: "11"
subsystem: docs
tags: [docs, deployment, terraform, supabase, aws, opentofu, bootstrap]
status: complete

requires:
  - phase: 189 (plan 189-01)
    provides: the guide with its Render sections removed, and the note to repeat the service-role warning for the AWS task
  - phase: 189 (plan 189-04)
    provides: the deployment section with its Overview, Hosted Supabase settings and Operations pages in the nav
  - phase: 189 (plan 189-09)
    provides: the env page's Bootstrap and Identity provider sections the guide links, and the statement that bank authentication is not wired on the AWS path
provides:
  - "developers-guide/deployment: a three-part opening (frontend on AWS, hosted Supabase, deploy pipeline) and `## From an empty account to a tested instance` with eight stages in the repository's apply order"
  - "Each stage: the step, one bash block against a copy of an example root with placeholders, the expected result, and links to the staging runbook steps and Observations rows where it was measured (34 GitHub anchors, each checked against the target's headings)"
  - "The OpenTofu rule (ruling A6), the bootstrap script in place of the SQL-editor steps, no bucket step, seed.sql named local-only, the account-access gateway answer as the 2026-11-11 observation"
  - "The bank-authentication gap on the AWS path, with the pending todo 2026-11-20-189-bank-authentication-on-the-aws-task"
affects: [189-12, 189-20]

actuals:
  tokens: 8950
  tasks: 3
  commits: 3
plan_head_before: 1971bfeb3c0537adf9c73de8f99be7c3018ddc04
plan_head_after: 24a6b85ecf37bdc0fc905ed762c2f285ef3996c9

tech-stack:
  added: []
  patterns:
    - "A guide stage is one command block against a copied root plus a dated 'Observed on staging, <date>' sentence linking the runbook step and its Observations table"
    - "GitHub heading anchors are checked by a scratch slug script, because validate:links checks the path of a blob/main link and not its fragment"

key-files:
  created:
    - .planning/todos/pending/2026-11-20-189-bank-authentication-on-the-aws-task.md
  modified:
    - apps/docs/src/routes/(content)/developers-guide/deployment/+page.md

key-decisions:
  - "On a new account the account-level root's first plan needs the parameter store key alias/aws/ssm, which AWS creates with the first SecureString, because bootstrap now holds the execution role; the guide has the deployer put the PostHog parameter (a stand-in serves) before that plan, citing bootstrap Step 8's precondition, since staging added the role later"
  - "The deploy workflow, destroy workflow and deployed smoke run name infra/envs/staging/* and the GitHub environment staging; the guide states this as a fact a fork with other names must change, rather than renaming anything"
  - "The 2026-11-09/10 throwaway-project apply that stopped on a 500 from the API settings is cited in the Supabase stage, with the recovery the runbook recorded (a new plan of the remaining resources)"
  - "DOCS-01 and DOCS-03 are advanced, not marked complete: plan 189-12 rewrites the hosted-project sections, including the dashboard-names sentence that still carries a recorded-search word"

patterns-established:
  - "The guide prints placeholders only: <account-id>, <your-environment>, <your-domain>, <state-bucket>, <project-ref>; no staging account id, domain or ref"

requirements-completed: []

coverage:
  - id: D1
    description: "Eight stages in apply order, each with a command against an example-root copy and links to the bootstrap, DNS-and-mail, Supabase, AWS and infra runbooks and to the operations page"
    requirement: DOCS-01
    verification:
      - kind: other
        ref: "Task 1 automated verify: 8 stages, example-root command, five runbook link families, operations link, prettier, validate:links --check 0 findings"
        status: pass
    human_judgment: true
  - id: D2
    description: "OpenTofu rule, bootstrap.sql in place of SQL-editor steps, no bucket step, the dated gateway observation, no recorded-search word in the sections this plan owns"
    requirement: DOCS-03
    verification:
      - kind: other
        ref: "Task 2 automated verify, with the negative search scoped to the page above § Auth settings (see Deviations)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Bank authentication stated as not wired on the AWS path, with the todo; production-build section kept; docs build green"
    requirement: DOCS-01
    verification:
      - kind: other
        ref: "Task 3 automated verify: IDENTITY_CALLBACK_SERVER_SECRET, the kept heading, the todo, prettier, validate:links 0 findings, docs build exit 0"
        status: pass
    human_judgment: false

duration: 75min
completed: 2026-11-20
---

# Phase 189 Plan 11: The deployment guide on the Terraform path Summary

**The deployment guide now takes a deployer from an empty AWS account and a new Supabase project to a tested instance in eight stages, in the repository's apply order. Each stage gives one command block against a copy of an example root, written with placeholders, and links the staging runbook step and the Observations row where it was measured. The guide states the OpenTofu rule and uses `bootstrap.sql` in place of the SQL-editor steps. It states that bank authentication is not wired on the AWS path and points to a new pending todo for it.**

E2E_DELTA=0 (a docs page and a todo only; no project affected)
GITHUB_ANCHORS=34 checked, 34 resolve (scratch slug check over the target files' headings, fenced blocks skipped)

## Performance

- **Duration:** about 75 min, including a session lost to a host sleep. The draft survived in the scratchpad, and no gate spanned the sleep: the final link check and docs build ran 21:45:39 to 21:45:47 UTC, after the 21:42 UTC wake.
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- The opening now names three parts. The frontend runs on AWS as an ECS service behind a load balancer and CloudFront, and Terraform writes all of it. The backend is a Supabase project created by hand, which the module imports and configures. The deploy pipeline has a gated job.
- `## From an empty account to a tested instance` opens with the stage list and the placeholder key. It names the prerequisites and the rules of every apply, then has one `###` per stage. The stages are: Fork and configure (static settings, copying `infra/envs/example/*` and `bootstrap/example.tfvars`); the account-level root (local state, then migration into the bucket); the zone and mail root (delegation at the parent zone, identity, SES production access); the Supabase project; the two parameters; the AWS root and its image; checking the instance; and the deploy pipeline. The Supabase stage covers the hand creation, the import plan and apply with the SMTP credentials from dns-mail, the migrations and functions from a linked work directory, the logging-settings read, `bootstrap.sql` and the first administrator. The check stage runs the probe of Step 23 and `yarn test:e2e:deployed` with `SMOKE_EXPECTED_SHA`. The pipeline stage covers the `deploy/staging` push, the environments with their secrets and variables, and the gated order.
- Every statement about deployed behaviour carries "Observed on staging, <date>" and links its runbook step or Observations table. The guide prints no account id, domain or project ref of staging.
- The `SUPABASE_SERVICE_ROLE_KEY` warning from the deleted Render section is repeated for the AWS task environment, which plan 01 asked for.
- The bank-authentication paragraph matches the env page. The todo lists the missing task variables, from `constants.ts` and § Identity provider, and the function secrets the module does not set, with the fix on both sides.

## Task Commits

1. **Task 1 (tracer): the whole path, stage by stage**: `4ab693e40` (docs)
2. **Task 2: the OpenTofu rule, the bootstrap script, the observed gateway**: `67acab829` (docs)
3. **Task 3: bank authentication on the AWS path, and the production-build section**: `24a6b85ec` (docs)

## Files Created/Modified

- `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md`: the opening and the path rewritten. § Auth settings, its subsection, § Feedback rate limit and § The per-caller limit are untouched (plan 189-12 owns them). § Testing a production build locally is unchanged, because it names nothing that was removed.
- `.planning/todos/pending/2026-11-20-189-bank-authentication-on-the-aws-task.md`: new.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

**1. [Rule 3 - Blocking] Task 2's whole-page negative search hits a sentence that plan 189-12 owns**
- **Found during:** Task 2
- **Issue:** `! grep -qiE 'unverified|…' "$P"` covers the whole page. The sentence "The names of the dashboard settings above are unverified against a hosted project's dashboard" is in § Auth settings of a hosted project, which the execution rules reserve for plan 189-12, and 189-12's own verify removes it (C-01 S2).
- **Fix:** I ran the same search on the page up to `## Auth settings of a hosted project`, which covers every section this plan owns, and it is clean. A search of the whole page finds that one line and nothing else. It closes when 189-12 runs.
- **Files modified:** none beyond the plan's
- **Commit:** `67acab829`

**2. [Rule 2 - Correctness] On a new account the account-level root's first plan needs the SSM key**
- **Found during:** Task 1
- **Issue:** `infra/bootstrap` now contains the `frontend_task_role` module. Its `data "aws_kms_alias" "ssm"` read fails until a SecureString has first used `alias/aws/ssm` (bootstrap Step 8 precondition). The plan's stage order puts the parameters after the Supabase project, so a fork following it literally would have its first bootstrap plan fail.
- **Fix:** The account-level stage tells the deployer to run `put ANALYTICS_POSTHOG_KEY` from § The two parameters before that plan. A stand-in value serves, and the anon key follows later. The guide cites Step 8's precondition for this. Staging never ran this order, and the guide does not say it did.
- **Commit:** `4ab693e40`

**Total deviations:** 2 (Rule 3, Rule 2). Neither goes beyond the plan's two files.

## Issues Encountered

- `validate:links --check` checks that a `blob/main/<path>` link names a tracked file but does not check its fragment. I checked the 34 runbook anchors with a scratch GitHub-slug script, and all 34 resolve.
- The session died once on a network error during a host sleep. The draft was in the scratchpad, so nothing was lost. No gate result from before the sleep is relied on: every check in this summary was run after the wake.

## Known Stubs

None. The angle-bracket values (`<account-id>`, `<your-domain>` and the rest) are placeholders for the deployer, which A-03 requires.

## Threat Flags

None. T-189-23: the guide says `seed.sql` creates two test users with a known password and is never run on a hosted database, and that `bootstrap.sql` writes the hosted rows. T-189-24: each deployed behaviour carries its date and its runbook step or Observations link. T-189-25: placeholders only; a scan for the staging account id, domain and project refs finds nothing. T-189-SC: no package was installed.

## Next Phase Readiness

- Plan 189-12 can rewrite the four hosted-project sections. The new Supabase stage already links `#auth-settings-of-a-hosted-project` and `/developers-guide/deployment/hosted-settings`.
- The phase's final C-02 search will find the dashboard-names line in § Auth settings until 189-12 removes it.

## Self-Check: PASSED

- FOUND: apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
- FOUND: .planning/todos/pending/2026-11-20-189-bank-authentication-on-the-aws-task.md
- FOUND: 4ab693e40, 67acab829, 24a6b85ec (ancestors of HEAD)
