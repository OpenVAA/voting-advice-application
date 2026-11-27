---
phase: 189-documentation-and-closure
plan: "14"
subsystem: docs
tags: [docs, operations, runbook, supabase, backups, restore, secret-rotation, ssm, cloudfront, ses, github-secrets]
status: complete

requires:
  - phase: 189 (plan 189-13)
    provides: the operations page's first six sections, after which Restore and Secret rotation sit
  - phase: 189 (plan 189-06)
    provides: Step 24 and staging's backups read of 2026-11-20 (E2_*)
  - phase: 189 (plan 189-07)
    provides: Step 19 and the origin header rotation of 2026-11-20 (R1_*)
provides:
  - "deployment/operations ## Restore: what Supabase keeps (read 2026-11-21, four pages cited), staging's Step 24 read, restoring in place (dashboard or PITR API, the project inaccessible meanwhile) and what follows it, restoring to a new project and the repository's order (Supabase root, functions, bootstrap.sql, Storage objects), then the frontend re-pointed"
  - "deployment/operations ## Secret rotation: ten procedures (the two parameters, the origin header secret as rehearsed, the SES SMTP key, the function secrets, the identity-callback server secret, the database password, the service-role and anon keys with the JWT secret, the access token, the seven GitHub secrets as a table)"
  - "evidence/189-14-rotation-sources.md: E02_DOCS_READ_AT, four E02_DOC, 42 E03_SOURCE_ file:line lines, five E03_DOC"
  - "Pending todo: Restore drill into the throwaway project"
affects: [189-20]

actuals:
  tokens: 11636
  tasks: 2
  commits: 2
plan_head_before: fa8d8376c27c04696df734711f49cd038d300373
plan_head_after: bb68f65d6b0ddd2e58c17c2733ed3951e47ae4b3

tech-stack:
  added: []
  patterns:
    - "A rotation procedure per secret: what it protects, where it lives, how it reaches its consumer, steps in order with the secret at a prompt, on stdin or in a umask-077 file, what breaks in between, and the check afterwards"

key-files:
  created:
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-14-rotation-sources.md
    - .planning/todos/pending/2026-11-20-189-restore-drill-into-the-throwaway-project.md
  modified:
    - apps/docs/src/routes/(content)/developers-guide/deployment/operations/+page.md

key-decisions:
  - "The origin header procedure states the 2026-11-20 observation as recorded: 5 403s through the CDN from 21:44:14Z to 21:44:19Z, closing 37 s before Apply complete, no 5xx, a converged plan, and the three direct load balancer requests as no answer (000, curl exit 28), never as 403; the listener rule's own 403 is attributed to Step 9"
  - "The legacy-key rotation is cited to Supabase's JWT signing keys page (read 2026-11-21): rotating the legacy JWT secret signs out active users at once and rotates anon and service_role together; the API keys page's deprecation of anon/service_role by the end of 2026 is cited for the future path (FUT-02)"
  - "Restore to a new project: bootstrap.sql runs before the copy takes any write, because the copied storage_config rows hold the source's address and service-role key and pg_net runs from the restore's completion (Supabase's clone-project page); the buckets are checked, since the migration that creates them is recorded as applied in the copy"
  - "IDENTITY_CALLBACK_SERVER_SECRET is set on the function with supabase secrets set --env-file from a umask-077 file, never NAME=value on the command line"
  - "DOCS-06 marked complete although 189-20 also lists it: the restore and rotation sections were its last open criteria, and 189-20 is the closing verification over all DOCS ids, as for DOCS-05, DOCS-07 and DOCS-08 before it"

patterns-established: []

requirements-completed: [DOCS-06]

coverage:
  - id: D1
    description: "## Restore on the operations page: Supabase's documentation cited with its read date, staging's Step 24 read with its date and link, in-place and new-project restores, the repository's re-apply order; the drill filed as a pending todo"
    requirement: DOCS-06
    verification:
      - kind: other
        ref: "Task 1 <verify> (headings, backups citation, bootstrap.sql, E02_DOCS_READ_AT, todo present, prettier --check, validate:links --check 0 findings): exit 0; acceptance grep -c '^E02_DOC=https://supabase.com/' = 4"
        status: pass
    human_judgment: false
  - id: D2
    description: "## Secret rotation: ten ### procedures, the JWT-secret note, IDENTITY_CALLBACK_SERVER_SECRET, the Step 19 link, 42 E03_SOURCE_ lines, none of the recorded-search words"
    requirement: DOCS-06
    verification:
      - kind: other
        ref: "Task 2 <verify> (incl. yarn workspace @openvaa/docs build): exit 0; acceptance grep -c 'SUPABASE_ACCESS_TOKEN' = 7"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/docs test:unit (8 files, 41 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The procedures are correct as operating instructions (order, window, commands) for rotations other than the origin header secret, which were not rehearsed in this phase by design"
    requirement: DOCS-06
    verification: []
    human_judgment: true
    rationale: "Only the origin header rotation was carried out (E-03); the other procedures rest on the mechanism read in the tree and on Supabase's documentation, which an operator should read before the first real rotation"

duration: 8min
completed: 2026-11-21
---

# Phase 189 Plan 14: Restore and secret rotation Summary

**The operations page now says what Supabase keeps and how a restore behaves (four Supabase pages read and cited on 2026-11-21, staging's eight `COMPLETED` backups with PITR off from 2026-11-20), how to restore in place or to a new project and re-apply the Supabase root, the functions, `bootstrap.sql` and the Storage objects, and gives one rotation procedure per secret, the origin header one with its measured 5-second window of five 403s through CloudFront.**

## Performance

- **Duration:** about 8 minutes of wall clock between the recorded start and the last commit
- **Started:** 2026-11-21T07:31:16Z
- **Completed:** 2026-11-21T07:39:22Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `## Restore`: a Pro project's 7 daily backups, PITR as a paid add-on that stops daily backups, Storage objects outside the database backup, custom-role passwords not kept; staging's Step 24 read (2026-11-20, 13:55Z: PITR off, WAL-G on, 8 of 8 `COMPLETED`, no physical-backup range); the read command with the token on stdin; in place (dashboard, or the PITR `POST` with `database:write`, the project inaccessible meanwhile) and what follows (migrations pending again, bootstrap rows at their old values, Storage orphans, settings untouched); to a new project (Beta, what is and is not copied, `pg_net` running at once) and the order: Supabase root after `terraform state rm` of the old project, functions, `bootstrap.sql` before any write, buckets checked and objects copied, then the frontend re-pointed and the probe run.
- `## Secret rotation`: the two parameters (`put-parameter --overwrite` on stdin, then a deploy of a new commit or a forced new deployment, old and new tasks side by side); the origin header secret (Step 19's plan, stop rule, poll, and the 2026-11-20 results); the SES SMTP key (dns-mail `-replace`, then the Supabase root at once, mail failing in between); the seven function secrets (one apply, no redeploy per Supabase); `IDENTITY_CALLBACK_SERVER_SECRET` (both sides, outside Terraform, not on the AWS task today); the database password (dashboard, then `gh secret set --env staging`); the service-role and anon keys (only with the legacy JWT secret, everyone signed out, then the parameter, new tasks and `bootstrap.sql`; publishable and secret keys as FUT-02); the access token (new, GitHub secret, revoke old); a table of the seven GitHub secrets.
- `evidence/189-14-rotation-sources.md`: the pages read with their URLs and what each said, and 42 `E03_SOURCE_` lines from `grep -n` at run time.
- `.planning/todos/pending/2026-11-20-189-restore-drill-into-the-throwaway-project.md`: what a drill on the throwaway project would measure.

## Task Commits

1. **Task 1: Restore** - `200e88fdc` (docs)
2. **Task 2: Secret rotation** - `bb68f65d6` (docs)

## Files Created/Modified

- `apps/docs/src/routes/(content)/developers-guide/deployment/operations/+page.md` - `## Restore` and `## Secret rotation` between Teardown and SES.
- `.planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-14-rotation-sources.md` - sources.
- `.planning/todos/pending/2026-11-20-189-restore-drill-into-the-throwaway-project.md` - the deferred drill.

## Verification

- Task 1 `<verify>`: exit 0. Acceptance: 4 `E02_DOC=` lines.
- Task 2 `<verify>` (with the docs build): exit 0. Acceptance: `SUPABASE_ACCESS_TOKEN` appears 7 times on the page. `### ` count in the section: 10.
- `validate:links --check`: 0 findings in every class. Every GitHub anchor on the page (22 distinct) checked against the target file's headings with a GitHub-style slug: all resolve.
- `yarn workspace @openvaa/docs test:unit`: exit 0, 41 tests. `yarn lint:check`: exit 0 (run in the background, status read from its own exit file).
- The supplementary C-02 pattern (`untried|not been (observed|seen|measured|tried)|not (yet )?(observed|measured)|unobserved|unmeasured`) and the locked words: 0 hits on the page.
- No documented command takes a secret as an argument: values are read with `read -rs`, sent through `printf` (a builtin) on stdin or a `curl -K -` config, `gh secret set` prompts, and the callback secret goes through a umask-077 `--env-file`.
- E2E: no project affected; delta 0 (docs-only).

## Decisions Made

See `key-decisions` above. In short: the origin window and the direct requests stated exactly as 189-07 recorded them; the legacy-key claims cited to Supabase's signing-keys page rather than asserted; `bootstrap.sql` moved to "before any write" in the new-project order for the `pg_net` reason; DOCS-06 marked complete, following the precedent of DOCS-05, DOCS-07 and DOCS-08.

## Deviations from Plan

**1. [Rule 3 - Blocking] Supabase's pages fetched with `curl` instead of WebFetch**
- **Found during:** Task 1
- **Issue:** the WebFetch tool was not available to this executor.
- **Fix:** one `curl -sSL` GET per page (status 200 each), article text extracted locally; nothing sent but the page request, as the rule requires. Recorded in the evidence file.
- **Files modified:** evidence/189-14-rotation-sources.md
- **Committed in:** 200e88fdc

**2. [Rule 2 - Missing critical] Five more Supabase pages read and cited for the rotation section**
- **Found during:** Task 2
- **Issue:** the claims that the legacy keys rotate only with the JWT secret and sign everyone out, that functions read new secrets without a redeploy, and that a database password reset causes no downtime needed a cited source, not an assertion.
- **Fix:** read `guides/auth/signing-keys`, `guides/api/api-keys`, `guides/security/rotate-leaked-api-keys`, `guides/functions/secrets` and `guides/database/postgres/roles`, recorded as `E03_DOC=` lines with `E03_DOCS_READ_AT=2026-11-21T07:35Z`, and cited on the page.
- **Committed in:** bb68f65d6

**3. [Rule 2 - Missing critical] The restore-to-new-project order names `bootstrap.sql` before any write, and the bucket check**
- **Found during:** Task 1
- **Issue:** the copy carries the source's `storage_config` rows, and Supabase says `pg_net` runs once the restore completes, so a delete in the copy could reach the source project's Storage; the bucket migration is already recorded as applied in the copy.
- **Fix:** both are stated in steps 3 and 4 of the order; the drill todo lists them as things to measure (threat T-189-33).
- **Committed in:** 200e88fdc

---

**Total deviations:** 3 (1 blocking tool substitution, 2 correctness additions). No scope creep: no rotation other than the origin one was rehearsed, nothing was sent to AWS or Supabase but documentation page requests.

## Issues Encountered

None.

## Known Stubs

None.

## Next Phase Readiness

- The operations page now covers every DOCS-06 topic. 189-20's closing searches and full-suite run remain.

## Self-Check: PASSED

- FOUND: apps/docs/src/routes/(content)/developers-guide/deployment/operations/+page.md
- FOUND: .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-14-rotation-sources.md
- FOUND: .planning/todos/pending/2026-11-20-189-restore-drill-into-the-throwaway-project.md
- FOUND: 200e88fdc
- FOUND: bb68f65d6
