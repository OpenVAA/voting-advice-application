---
phase: 189-documentation-and-closure
plan: "16"
subsystem: docs
tags: [docs, runbook, infra, dns-mail, supabase, mail-ses, authentication, observations, back-links, c-01, a-01]
status: complete

requires:
  - phase: 189 (plan 189-05)
    provides: the 2026-11-20 DMARC reads and the postgres UPDATE privilege read on auth.users
  - phase: 189 (plan 189-15)
    provides: the C-01 todo and the back-link pattern
  - phase: 189 (plan 189-17)
    provides: the pre-launch auth todo that holds the shared sign-in budget check
provides:
  - "infra/envs/staging/dns-mail/README.md: § Not yet observed deleted; two 2026-11-11 rows (S16 the SMTP send accepted, S17 DKIM, SPF and DMARC aligned) pointing to the Supabase runbook's mail rows; one 2026-11-20 row (S18 the staging DMARC record applied in place of the parent's); Step 6 and the overview made current"
  - "infra/envs/staging/supabase/README.md: the empty § Not yet observed deleted; the smtp sentence of § Settings and their guard made current"
  - "Four module comments (supabase main.tf, mail-ses main.tf twice, mail-ses smtp.tf) in the present tense, comment lines only"
  - "developers-guide/backend/authentication § Known residuals: the sign-in budget as a pre-launch check, the timing difference as a local measurement, the postgres privilege as read on staging 2026-11-20"
  - "33 `← guide:` back-links: 8 in the DNS-and-mail runbook, 25 in the Supabase runbook"
  - "C-01 todo extended with S14, S15 (the SES sandbox path) and S26 (the timing difference over a network)"
  - "Orchestrator-assigned: the email page's hook bullet says Terraform sets the hook; the hosted-settings page has a row for the anon role's statement_timeout"
affects: [189-20]

actuals:
  tokens: 15000
  tasks: 3
  commits: 5
plan_head_before: dc0f9fc7b27536f1bb1683aef446e8890dec31ad
plan_head_after: c5906f1b01340c2a5e9555fdc6f39648793bbf3d

tech-stack:
  added: []
  patterns:
    - "Observations rows that settle a statement from another runbook's record carry that record's date and a link to its Observations, placed in date order"

key-files:
  created:
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-16-c01-mail-supabase-modules.md
  modified:
    - infra/envs/staging/dns-mail/README.md
    - infra/envs/staging/supabase/README.md
    - infra/modules/supabase/main.tf
    - infra/modules/mail-ses/main.tf
    - infra/modules/mail-ses/smtp.tf
    - apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md
    - apps/docs/src/routes/(content)/developers-guide/backend/email/+page.md
    - apps/docs/src/routes/(content)/developers-guide/deployment/hosted-settings/+page.md
    - .planning/todos/pending/2026-11-20-189-unobserved-statements-about-the-deployed-stack.md
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/deferred-items.md

key-decisions:
  - "S18 settled by a new 2026-11-20 row that reads the 2026-11-11 mail (dmarc=pass under p=QUARANTINE, the zone's own policy) together with 189-05's read (the parent's p=none)"
  - "The new DNS-and-mail rows were kept within the Observations table's existing width, so Prettier left every existing dated row byte-identical"
  - "The rewritten module comment blocks are one sentence per line; infra/ is outside the comment-hygiene guard's scan roots, so the rule was applied by hand"
  - "DOCS-01 and DOCS-03 are not marked complete: 189-20 makes the recorded C-02 search and the deployer's reading their acceptance rests on"

patterns-established: []

requirements-completed: []

coverage:
  - id: D1
    description: "DNS-and-mail and Supabase runbooks swept (S14 to S20, S28, S29), with back-links"
    requirement: DOCS-03
    verification:
      - kind: other
        ref: "Task 1 <verify>: exit 0 (sections absent, C01_S14..S29 lines present, back-link present, prettier --check, validate:links --check 0 findings, 125 inbound references); mutation #zone-mutant exit 1 naming the id; acceptance grep -ci 'later stage' = 0 and 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Four module comments rewritten in the present tense, comment lines only"
    requirement: DOCS-03
    verification:
      - kind: other
        ref: "Task 2 <verify>: exit 0 (supplementary search over infra/modules empty, C01_S21..S24, terraform fmt -check, yarn assert:comment-hygiene 0 violations); acceptance git diff 3988f937c over the three files has no changed non-comment line"
        status: pass
    human_judgment: false
  - id: D3
    description: "Authentication page's three hosted remarks (S25 to S27)"
    requirement: DOCS-03
    verification:
      - kind: other
        ref: "Task 3 <verify>: exit 0 (no searched phrase on the page, C01_S25..S27, prettier --check, validate:links --check 0 findings); acceptance grep -c pre-launch = 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "Back-links from the DNS-and-mail and Supabase runbooks to the guide pages"
    requirement: DOCS-01
    verification:
      - kind: other
        ref: "validate:links --check: inbound references 92 -> 125, 0 findings"
        status: pass
    human_judgment: false
---

# Phase 189 Plan 16: DNS-and-mail and Supabase runbooks, module comments and authentication residuals swept of unobserved statements Summary

**The DNS-and-mail and Supabase runbooks lost their "Not yet observed" sections. S16 to S18 are new dated rows settled by the 2026-11-11 mail rows and the 2026-11-20 DMARC read. Four Terraform comments now say what holds, and the authentication page states its three hosted remarks as a read (S27), a local measurement (S26) or a pre-launch check (S25). 33 back-links resolve, and the orchestrator's three gaps are closed.**

## Performance

- **Started:** 2026-11-21T07:48Z
- **Completed:** 2026-11-21T08:00Z
- **Tasks:** 3 of the plan, plus 2 orchestrator-assigned commits
- **Files modified:** 11 (3 runbook/docs pages of the plan, 2 orchestrator-assigned docs pages, 3 module files, the todo, the evidence file, deferred-items)

## Accomplishments

- **DNS-and-mail runbook.**
  - S16: a 2026-11-11 row records that SES accepted the SMTP send under the scoped policy.
  - S17: a 2026-11-11 row records that the mail passed DKIM, SPF and DMARC, aligned. Both rows link to the Supabase runbook's Observations and sit after the last 2026-10-22 row.
  - S18: a 2026-11-20 row records that the staging DMARC record takes the parent's place. It sits after 189-05's read.
  - S19: Step 6 states what each of the four `dig` commands shows and cites the 2026-10-22 Step 6 row.
  - S29: the overview says the hosted `account-access` sends the mail, with its first mail recorded on 2026-11-11.
  - S14 and S15 (the sandbox path, which does not apply to staging's production account) moved to the todo. The section is deleted.
- **Supabase runbook.** The empty section is deleted (S20). § Settings and their guard now says Step 18 applies the SMTP settings when a root sets `smtp`, as staging does (S28).
- **Module comments (S21 to S24).**
  - `infra/modules/supabase/main.tf`: each settings resource writes only its own keys, and the first SMTP enablement is accepted.
  - `infra/modules/mail-ses/main.tf`: the default DKIM zone is the one SES assigns, and mail passes DMARC, aligned.
  - `infra/modules/mail-ses/smtp.tf`: SES authorises the send under the From-address condition.
  - Only comment lines changed, and none carries a date, a run id or a planning reference.
- **Authentication page.**
  - S25: the shared sign-in budget stays a pre-launch risk, now stated with the check to run before launch. The check is held by 189-17's todo.
  - S26: the timing figures are stated as a local measurement only, and the hosted half is in the C-01 todo.
  - S27: `postgres` may update `auth.users` on a hosted project, read `true` on staging on 2026-11-20.
- **Back-links.** 8 in the DNS-and-mail runbook (Steps 1, 5, 7, 8, 9 and Observations) and 25 in the Supabase runbook (Steps 8, 9 and 15 to 24, and Observations). Each is one `← guide:` line per citing section of the deployment, hosted-settings and operations pages, derived by script from the pages as they stand now.

## Task Commits

1. **Task 1 (tracer): DNS-and-mail and Supabase runbooks swept, back-links.** `b0c6ff960`. Tracer gate (auto mode): the verify was re-run end-to-end and exited 0, then the plan continued.
2. **Task 2: module comments.** `0be877e23`.
3. **Task 3: authentication page's three hosted remarks.** `5a942fc22`.
4. **Orchestrator item 2: email page hook bullet.** `7e03c4b91`.
5. **Orchestrator item 3: hosted-settings row for the anon `statement_timeout`.** `c5906f1b0`.

## Deviations from Plan

### Orchestrator-assigned (scope extension)

**1. `infra/modules/mail-ses/smtp.tf` send-condition comment (orchestrator item 1)**
- This is C-01 S24, which Task 2 already owns, so it was fixed in Task 2's commit `0be877e23` and needed no separate commit. An existing record settles it: the Supabase runbook's 2026-11-11 row on the delivered sign-in mail, plus the DNS-and-mail runbook's 2026-10-22 Step 3 item 9 row, which shows the SMTP user's single attached policy is this send policy. So it was disposed of as present tense rather than moved to the todo.
- The comment's fallback clause, about what to do if the first real send is refused, was dropped because the send was accepted.
- A traceability row was added to `deferred-items.md`, marked resolved with `0be877e23`.

**2. Email page hook bullet (orchestrator item 2, deferred row from 189-12)**
- The bullet now says a hosted project gets the hook from Terraform. The Supabase module writes `hook_send_email_enabled` and `hook_send_email_uri` while `enable_send_email_hook` is `true`. It still links `/developers-guide/deployment#auth-settings-of-a-hosted-project`, and `validate:links --check` found 0 problems.
- Commit `7e03c4b91`; the deferred row is marked resolved.

**3. Hosted-settings row for the anon `statement_timeout` (orchestrator item 3, deferred row from 189-18)**
- New row, shaped like the `max_rows` row: group `Database role`, `statement_timeout` of the role `anon`, `8s`, set by `001-role-settings.sql` of `apps/supabase/supabase/schema/` and applied with the migrations, class `not compared`, checked by `db.anon-timeout`.
- The intro sentence said every row is sent by the module. It now names this one exception. The `not compared` bullet now says why the guard does not compare the timeout.
- `infra/scripts/hosted-settings-reference.test.ts`, verbose reporter: 16 of 16 passed with no change to the test. As a mutation, citing `db.anon-timeouts` made it exit 1 with "defines no check of that name", and the change was reverted.
- Commit `c5906f1b0`; the deferred row is marked resolved.

### Auto-fixed Issues

**1. [Rule 1 - Ordering] New rows placed in date order, not appended after the last row**
- The two 2026-11-11 rows sit after the DNS-and-mail table's last 2026-10-22 row, and the 2026-11-20 S18 row after the existing 2026-11-20 row. This follows 189-15's precedent.
- The rows were kept within the table's existing cell width, so Prettier did not re-pad the table and no existing dated row changed.
- Commit `b0c6ff960`.

## Checks

| Check | Exit |
| ----- | ---- |
| Task 1 `<verify>` | 0 |
| Task 1 mutation (`#zone-mutant`) | 1, as expected |
| Task 1 acceptance (`later stage` count) | 0 and 0 |
| Task 2 `<verify>` (search empty, `terraform fmt -check`, `yarn assert:comment-hygiene` 0 violations over 2336 files) | 0 |
| Task 2 acceptance (diff against `3988f937c` has non-comment lines) | grep 1, so comment lines only |
| Task 3 `<verify>` | 0 |
| Task 3 acceptance (`pre-launch` count) | 1 |
| `validate:links --check` after each docs change | 0, 0 findings (inbound 125) |
| `hosted-settings-reference.test.ts`, verbose | 0, 16/16 |
| `prettier --check` on every changed markdown file | 0 |
| `yarn lint:check`, run in the background, status read from a file | 0 |

- **Supplementary search across `apps/docs` and `infra`**, excluding dated rows: the only remaining hits are the probe check's name `functions.identity-callback-unverified`, in the Supabase runbook, the probe scripts and their tests.
- **E2E:** no project affected; delta 0.

## Deferred Issues

None. The 189-08 row in `deferred-items.md` (the comment-hygiene violation in `generate-navigation-config.ts`) had already been fixed by `45b0f2fb2` (189-04), and that row is now marked that way. `yarn assert:comment-hygiene` reports 0 violations.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: evidence/189-16-c01-mail-supabase-modules.md, with lines C01_S14 to C01_S29
- FOUND: b0c6ff960, 0be877e23, 5a942fc22, 7e03c4b91 and c5906f1b0, all ancestors of HEAD
