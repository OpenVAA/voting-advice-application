---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 12
subsystem: infra
tags: [terraform, aws, iam, runbook, bash, budgets, s3-backend]
status: complete

requires:
  - phase: 183-04
    provides: "the staging dns-mail root and its state key hand/staging/dns-mail/terraform.tfstate, named in the overview"
  - phase: 183-06
    provides: "infra/bootstrap (backend.tf alone, terraform.tfvars, example.tfvars, five outputs) that the runbook drives"
  - phase: 183-07
    provides: "the staging and example Supabase roots and the scratch root, named in the overview"
provides:
  - "infra/scripts/account-inventory.sh: read-only account inventory with --assert-no-inline-user-policies, --assert-managed-only <path-prefix>, --self-test (35 cases), -h/--help; exit 0/1/2"
  - "infra/README.md: purpose, ## Roots (eight roots, state keys, who applies, ever applied), ## Order (flow diagram), ## Prerequisites, ## Rules of every apply (seven rules with reasons), ## Guards, ## Example environment (both OIDC subject forms)"
  - "infra/bootstrap/README.md: the account-level root's runbook, Steps 1 to 7, every operator command of the checkpoint plans 183-14, 183-16 and 183-20 word for word, a Return: line per step, ## Not yet observed (13 rows), ## Observations (header only)"
affects: [183-14, 183-16, 183-17, 183-20, 183-28]

estimate:
  tokens: 55000
  tasks: 2
actuals:
  tokens: 19050    # chars/4 over the three files the two task commits added (76211 chars)
  tasks: 2
  commits: 2

plan_head_before: ebef5f4df484ed6037e466fecaa3d71737010520
plan_head_after: 507c928dc7de3471c2ed14d01aceb9c5d9acc58f

tech-stack:
  added: []
  patterns:
    - "Collect-then-judge operator script: collectors print one line per entity, an awk evaluator reads lines on stdin, so the judge and the line formatting are self-tested with no credentials"
    - "Public-paste output discipline: a failed AWS call prints its error code only (taken from 'An error occurred (<Code>)'), an IAM user outside /openvaa/ prints as user-<n>, the caller prints without its session name, any field holding '@' prints as 'redacted', and a scrub filter over every printed line is the second barrier"
    - "Runbook items carry the number that begins their named lines (item 4 prints s4_ lines), so commands transcribed word for word from a checkpoint keep their line names"

key-files:
  created:
    - infra/scripts/account-inventory.sh
    - infra/README.md
    - infra/bootstrap/README.md
  modified: []

key-decisions:
  - "User lines carry a path= field (the plan's fixed form had none): --assert-managed-only must select users under a path. A user outside /openvaa/ prints path=other, so its real path, which can hold a person's name, is never printed and it is never selected"
  - "The collectors print 'users examined=<n>' and 'roles examined=<n>' after each list, so the judge can tell a list read with zero entries (an account with no IAM user passes the user assertion) from no list at all (nothing examined, exit 1)"
  - "An inline-policy list that could not be read prints inline=error(<Code>) and counts as offending in both assert modes"
  - "Must-succeed calls of the full inventory are the caller identity, the user list and the role list; any other failure prints 'error <section> <code>' and the script goes on with exit 0 (a standalone account's AWSOrganizationsNotInUseException prints 'organisation member=no')"
  - "The runbook names no follow-up id: the answer lines whose names carry one (the applying identity, the alert address, the DMARC address) are described in prose, and the executor that raises the checkpoint gives their names"
  - "Steps 3 to 6 of the runbook are one sitting of the migration checkpoint; their items continue the checkpoint's numbering (Step 4 starts at item 6), and one Return: line at the end of Step 6 covers them"

requirements-completed: []  # INFRA-15 closes when 183-20 sees the alert fire; INFRA-17's account half closes on the operator's assert run in 183-14/183-17. This plan writes the tooling both rest on.

duration: 12min
completed: 2026-10-19
---

# Phase 183 Plan 12: Account inventory script and the bootstrap runbook Summary

**A read-only account inventory with two assert modes and a 35-case credential-free self-test that proves no address, session name or person's user name reaches its output; an `infra/` overview of all eight roots; and a seven-step bootstrap runbook that carries every operator command of the three checkpoint plans word for word, with each unobserved cloud behaviour listed under "Not yet observed".**

## Performance

- **Duration:** about 12 min (2026-10-19T05:53Z to 06:05Z)
- **Tasks:** 2
- **Files:** 3 created

## Accomplishments

- `infra/scripts/account-inventory.sh` (676 lines, mode 100755, bash 3.2 compatible because the operator's macOS ships it). With no argument it prints, in sections: the caller (`caller account=… principal=assumed-role/<role>|user|root|… expected-account=… match=yes|no`), organisation membership as `yes`/`no`, the account summary counts, every IAM user, group and non-service-linked role with inline policy names, the OIDC providers, the hosted zones, for `eu-north-1`, `eu-west-1`, `eu-central-1` and `us-east-1` the SES account state with suppression reasons, domain identities by name and address identities as a count, the budgets with limit and actual spend, the image repositories, and the buckets.
- 19 distinct AWS subcommands, all `get-`, `list-` or `describe-` (read with `grep -oE 'aws [a-z0-9-]+ [a-z0-9-]+' | sort -u`). No tracing line; the header says `set -x` must not be added.
- `--assert-no-inline-user-policies` and `--assert-managed-only <path-prefix>` collect only IAM, print offending lines on stdout and a one-line verdict on stderr.
- `infra/README.md` and `infra/bootstrap/README.md` written and formatted with Prettier. The bootstrap runbook's paste rule, sitting lines, the warning on `$L` and `tfplan`, the cleanup item of each step, the `-var budget_limit_usd` blockquote under the first apply and the migration-order blockquote are all in place.

## Task Commits

1. **Task 1: The read-only account inventory script** - `35ecb4deb` (feat)
2. **Task 2: The overview and the bootstrap runbook** - `507c928dc` (docs)

## Verification

- `bash -n infra/scripts/account-inventory.sh && bash infra/scripts/account-inventory.sh --self-test`: 35 cases, 0 failed, exit 0.
- `bash infra/scripts/account-inventory.sh --bogus`: exit 2. Also exit 2 for `--assert-managed-only` with no prefix, with a prefix not wrapped in `/`, and for `--self-test extra`; `--help` exit 0.
- Red controls of the self-test, on scratch copies: `redact` passing `@` through gives 2 FAIL lines and exit 1; printing a non-/openvaa/ user by name gives 4 FAIL lines and exit 1; a judge that never flags an inline policy gives 5 FAIL lines and exit 1.
- A credential-free run of every collector against a local stub of the CLI on `PATH` (no AWS call): full mode exit 0 with `error budgets AccessDeniedException`, `organisation member=no`, a person's user printed as `user-1`, `tags=[InvokedBy=SESConsole,Owner]` and no `@`; the user assert exit 1 naming `user-2 … inline=[AmazonSesSendingAccess]`; the managed assert exit 1 on an unreadable role inline list.
- Task 2 verify 1: Prettier clean on both files; counts `Not yet observed` 1, `Observations` 1, `migrate-state` 2, `detailed-exitcode` 2, `simulate-principal-policy` 10.
- Task 2 verify 2 (no status read through a pipe): exit 0. Red control (a piped `-detailed-exitcode` line appended to a copy): exit 1.
- Task 2 verify 3 (sync with plans 183-14, 183-16, 183-20): exit 0, no missing command. Red control (the `s8g2_decision` line removed from a copy): exit 1 naming that command.
- Acceptance: all six overview headings, all four staging state keys, the seven required runbook strings; no e-mail address in either file, no `.planning`, no follow-up or decision id, no phrase of the CLI's configuration push; 13 rows under "Not yet observed"; "Observations" holds its header and separator only.
- `node_modules/.bin/prettier --check infra`: clean. `node scripts/assert-no-candidate-app-names.mjs` and `node scripts/assert-no-inline-iam-policies.mjs` after the commits: exit 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] `path=` on user lines**
- **Found during:** Task 1
- **Issue:** The plan's fixed user line `user <name> inline=[…] attached=[…] groups=[…] tags=[…]` carries no path, so `--assert-managed-only <path-prefix>` could not tell which users lie under the path.
- **Fix:** User lines are `user <name> path=<path> inline=… attached=… groups=… tags=…`. A user outside `/openvaa/` prints `path=other`, so a path that may hold a person's name is never printed.
- **Files modified:** infra/scripts/account-inventory.sh
- **Commit:** 35ecb4deb

**2. [Rule 2 - Missing critical functionality] "examined" summary lines and a second scrub barrier**
- **Found during:** Task 1
- **Issue:** Without a marker that a list was read, the judge could not tell an account with no IAM user from a list that was never read; and the formatting alone was the only barrier against an address in the output.
- **Fix:** `users examined=<n>`, `roles examined=<n>` (and counts per section) after each list; a `scrub` filter over every printed line that turns a token holding `@` into `redacted` and cuts anything after an assumed role's name. Both are self-tested.
- **Files modified:** infra/scripts/account-inventory.sh
- **Commit:** 35ecb4deb

**3. [Rule 2 - Public file rule] Answer-line names that carry a follow-up id are not spelled in the runbook**
- **Found during:** Task 2
- **Issue:** Checkpoint 183-14 names three answer lines after their follow-up ids; the runbook may cite no follow-up id.
- **Fix:** Step 1 describes those questions in prose ("on the `answer_` line you were given for it"). No command is affected; the sync check passes.
- **Files modified:** infra/bootstrap/README.md
- **Commit:** 507c928dc

---

**Total deviations:** 3 auto-fixed (all Rule 2). **Impact:** the inventory's line form gained one field; plan 183-14's verification reads `inline=[…]` and the `user-<n>` labels, which are unchanged.

## Issues Encountered

None.

## Known Stubs

None. The empty "Observations" table is by design: plans 183-14, 183-16 and 183-20 append its rows.

## Next Phase Readiness

- Plan 183-14 can show its checkpoint: the script it runs passes its self-test, and `infra/bootstrap/README.md` has the "Before you start" and "Step 1" sections it cites.
- If a checkpoint plan of 183-14, 183-16 or 183-20 is revised, run Task 2's third verify command again and bring the runbook back in line before the operator acts.
- The runbooks of the dns-mail and Supabase roots are plan 183-28's; the overview already links to their `README.md` files, which do not exist yet.

## Self-Check: PASSED

- FOUND: infra/scripts/account-inventory.sh
- FOUND: infra/README.md
- FOUND: infra/bootstrap/README.md
- FOUND: 35ecb4deb
- FOUND: 507c928dc
