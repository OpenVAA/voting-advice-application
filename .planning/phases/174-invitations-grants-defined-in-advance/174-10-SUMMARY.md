---
phase: 174-invitations-grants-defined-in-advance
plan: 10
subsystem: docs
tags: [docs, skills, todos, closing-gate, e2e, bank-auth, invitations, supabase, edge-functions]

requires:
  - phase: 174-invitations-grants-defined-in-advance
    provides: "plans 01 to 09: the table and seeding, the closed auth configuration, the claim and the service-role helpers, account-access, the contract spec, the removal of invite-candidate, the claim at every entry point, the specs on the mailed link"
provides:
  - "the developers' docs describing the invitation model end to end: the row, the code, the authority map, who may be mailed, the mail, the claim, the order session, claim, refresh, gates, the used code, the limits, what the model does not do"
  - "a section on the model's controls and on what it does not protect against, on the authentication page (the docs site has no security page)"
  - "the deployment obligations of a hosted project: two dashboard switches, the allowlist entry, SITE_URL and the SMTP variables, and that the function's refusal does not protect the claim"
  - "the database skill, its schema reference and its policy map describing the invitation model, with every count they state measured on 2026-10-07"
  - "twenty-two todos under .planning/todos/pending/ and dated updates to three older ones"
  - "174-NAME-MAP.md: the obligations to later phases, the operator's list, the closing gate"
  - "the closing gate on one tree, d6ad5ed92: fifteen gate rows, the integration report, three verdicts, the default E2E run and both bank-auth runs"
  - "the bank-auth driver and its runbook serving account-access with its SMTP variables"
affects: [175, 178, 179]

actuals:
  tokens: 62163
  tasks: 4
  commits: 7
plan_head_before: a680690a48e22201f37ded2a0d60a6069ead5a89
plan_head_after: 0eaa0ffb4c33afa99623df7d198819dab405d67f

tech-stack:
  added: []
  patterns:
    - "A count written into a skill carries the command that produced it and the date, in the skill's freshness record"
    - "A residual is stated by its mechanism: what is not enforced, where, and what an operator does about it"
    - "A file served with supabase functions serve --env-file is the function environment of every function, so a generated Edge file carries the variables of every function a run's chain reaches"
    - "A fix after any closing run means every closing run is made again under a new label, the green ones included"

key-files:
  created:
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-10-SUMMARY.md"
    - ".planning/todos/pending/2026-10-07-174-*.md (22 files)"
  modified:
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/deployment/+page.md"
    - "apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md"
    - "apps/docs/src/routes/(content)/publishers-guide/preparing/candidates-and-parties-data-be/+page.md"
    - "apps/supabase/README.md"
    - "tests/IDURA-TEST-RUNBOOK.md"
    - ".claude/skills/database/SKILL.md"
    - ".claude/skills/database/schema-reference.md"
    - ".claude/skills/database/rls-policy-map.md"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-NAME-MAP.md"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-bankauth.sh"
    - ".planning/todos/pending/2026-09-02-deployment-guide-production-redirect-allowlist.md"
    - ".planning/todos/pending/2026-10-03-edge-email-functions-have-no-e2e-coverage.md"
    - ".planning/todos/pending/2026-09-07-typecheck-lint-and-format-the-project-scoped-query-fixtures.md"

key-decisions:
  - "The controls and the residuals are on the authentication page: developers-guide/backend/security is a redirect stub to it, not a page"
  - "The red bank-auth journey was fixed at its cause in the driver and in the runbook the driver encodes, and every closing run was made again"
  - "CLAUDE.md, STATE.md, ROADMAP.md and REQUIREMENTS.md were not edited"

requirements-completed: [INV-01, INV-02, INV-03, INV-04, INV-05]

metrics:
  duration: 1h 35m
  completed: 2026-10-07
status: complete
---

# Phase 174 Plan 10: Docs, skills, hand-over and the closing gate Summary

**The invitation model is documented end to end with every accepted residual stated by its mechanism, the database skill states measured counts, twenty-two todos and the obligations record carry what later phases take over, and the gate set, the integration test, the default E2E suite and both bank-auth flows are green on one tree, `d6ad5ed92`, after one void run and one red run that was fixed at its cause.**

## Performance

- **Duration:** about 1 h 35 min (12:36Z to 14:10Z), of which 26 min were a host suspended with its lid closed
- **Tasks:** 4 of 4
- **Commits:** 7 (`git rev-list --count a680690a4..HEAD` at the time of writing)
- **Files changed:** 39

## Task Commits

| Task | Commit | What |
| --- | --- | --- |
| 1 | `0fd05398f` | the five docs pages and `apps/supabase/README.md` |
| 1 (outside the file list) | `31e38d298` | two Publishers' Guide pages: creating an invitation sends nothing |
| 2 | `f46f8d38d` | the database skill and its two references |
| 3 | `0b393f144` | 21 todos, three updated todos, the obligations and the operator's list in the name map |
| 4 (fix) | `8e0c421f0` | the bank-auth runbook's Edge file and two sentences of the Edge Functions docs page |
| 4 (fix) | `d6ad5ed92` | the bank-auth driver's Edge files carry the three SMTP variables |
| 4 | `0eaa0ffb4` | the closing gate in the name map, one more todo |

## The residuals as the docs now state them

On `developers-guide/backend/authentication`, § *What this does not protect against*, each repeated where an operator reads it on the deployment page:

1. Anonymous code checks are unlimited; each costs one indexed look-up; a deployment that needs a bound puts a rate limit in front of the function.
2. Anyone who knows an eligible address can cause one sign-in mail to it per minute, indefinitely.
3. A new link makes the unopened one before it stop working (`403 otp_expired` on the local stack), so a third party can invalidate an unclicked link once a minute.
4. No limit uses the caller's identity; locally every caller looks alike; what a hosted gateway forwards is unmeasured.
5. A claim honours a promise whose creator has since lost the authority; an administrator withdraws it by deleting the unclaimed invitation.
6. `claim_invitations` has no guard on the auth service's sign-up setting; on a hosted project that allows public sign-up the claim is forgeable whatever `account-access` does. The dashboard switches are the control.
7. The auth service's own `POST /auth/v1/otp` tells a registered address from an unregistered one and mails its own link around the function's answer and limits.
8. An account created by `identity-callback` reads as having a password.

Stated as untested rather than as tested: both refusing branches of the function's deployment checks and the release of a slot after a failed send are held by unit tests with injected dependencies only; the names of the two dashboard switches are unverified against a hosted dashboard; whether a hosted gateway accepts a call with the anon key alone is unverified.

## Todos filed

New, all under `.planning/todos/pending/`, each named `2026-10-07-174-<slug>.md`:

`identity-provider-registration-never-claims-an-invitation` · `announcing-invitations-by-mail` · `auth-service-otp-endpoint-tells-registered-addresses` · `identity-provider-accounts-read-as-password-set` · `typed-address-of-an-identity-provider-user-must-stay-unconfirmed` · `no-per-caller-limit-on-the-anonymous-invitation-operations` · `a-later-sign-in-link-makes-the-earlier-one-stop-working` · `claim-invitations-has-no-in-database-guard-on-public-sign-up` · `first-time-invitee-with-no-contestant-grant-is-refused-after-setting-a-password` · `tocallbackurl-leaves-with-the-recovery-mail` · `admin-grants-admit-no-project-editor` · `native-speaker-review-sign-in-mail` · `hosted-project-auth-settings-allowlist-and-function-variables` · `safelistusers-reads-one-page-and-answers-a-failure-with-empty` · `e2e-drivers-write-db-start-output-with-the-local-keys` · `nothing-type-checks-the-edge-functions` · `allowlist-probe-reads-the-auth-container-environment-through-inspect` · `send-email-jwtsegment-has-no-importer` · `the-claim-and-refresh-pair-exists-twice` · `callback-keeps-signup-and-email-arms` · `seeding-an-invitation-makes-a-hidden-entity-public` · `account-access-log-does-not-name-an-unset-variable`

Updated with a dated note: `2026-09-02-deployment-guide-production-redirect-allowlist.md`, `2026-10-03-edge-email-functions-have-no-e2e-coverage.md`, `2026-09-07-typecheck-lint-and-format-the-project-scoped-query-fixtures.md`.

## Obligations recorded

`174-NAME-MAP.md` § *Obligations to later phases*: one row for each of O-1 to O-13, then rows for Phase 178 (the wire contract, four writer methods, `invitationCodeLogin` with no caller, `witness`, the slot release, the re-issue measurement, no purpose parameter, the matrix not consulted, no `next` in the mailed link, a failed refresh), Phase 175 (the schema last regenerated at `de0cc2808`, the INV-05 fallback, and **the open decision on `whileHiddenFromVoters`**), Phase 179, the operator of a hosted project, and the orchestrator (Phase 173's token-refresh todo is discharged except for one of its four asks).

## Skill counts, each with its command

| Statement | Value | Command |
| --- | --- | --- |
| tables in the applied `public` / `private` schemas | 21 / 4 | `select table_schema, count(*) from information_schema.tables where table_schema in ('public','private') and table_type = 'BASE TABLE' group by 1` |
| `CREATE TABLE` statements in the schema files | 25 | `git grep -h "^CREATE TABLE" -- apps/supabase/supabase/schema \| wc -l` |
| policies in `public` / `storage` | 92 / 15 (107) | `select schemaname, count(*) from pg_policies where schemaname in ('public','storage') group by 1`; the linter's census line |
| schema files / migration files | 29 / 1 | `git ls-files <dir> \| wc -l` |
| pgTAP files / assertions | 39 / 1706 (1697 planned in 38 files, 9 under `no_plan()` in `00-helpers`) | `git ls-files`; the `Files=39, Tests=1706` line of the gate's pgTAP row; the sum of `plan (N)` |
| definer functions of `public` executable by `anon` / `authenticated` | 6 / 8 | the two lists in § 8c of `07-rpc-security.test.sql` |
| Edge Function directories / copies of `envConfig.ts` | 3 / 3, byte-identical | `ls`; `cmp` of each pair (both exit 0) |
| `SAME_PERMISSION_ALLOW` / `REACHES_NEITHER_ALLOW` / `MECHANISM_HELPERS` | 3 / 10 / 5 | read from `apps/supabase/scripts/lint-schema.mjs` |
| `m17_unenforced_ratified` | 4 | read from `25-matrix-conformance.test.sql` |
| enum types in the applied `public` schema | 8 | `pg_enum` grouped by type (the skill's "4 enums" heading was not corrected) |

`bash .claude/scripts/audit-skill-links.sh database`: **exit 1, 30 dangling before and 30 after** (`Checked: 158` then `166`), the same 30 tokens by a line diff of the two outputs. Two tokens this plan's first draft added (a backticked `auth.users`, twice) were removed. The whole corpus: 222 dangling before and after. `bash .claude/scripts/audit-skill-routing.sh`: exit 1 before and after with the same two findings. **Task 2's verify term on this audit is a pre-existing red, not introduced here, and is not reported as passed.**

## Closing evidence, on `d6ad5ed92`

- **Gate set `174-10-final-r2`:** exit 0. `typecheck 0`, `lint 0`, `db-reset 0`, `types-regen 0`, `types-clean 0`, `pgtap 0`, `sql-lint 0`, `unit 0`, `check-frontend 0`, `build 0`, `format 0`, `docs-links 0`, `name-gate-self-test 0`, `auth-config 0`, `stack 0`. pgTAP 39 files / 1706 tests; units: frontend 2617 passed / 11 skipped in 163 files (1 skipped), supabase functions 18 / 462, dev-seed 68 / 1030, app-shared 10 / 141, data 47 / 244.
- **Integration `174-10-integration-r2.json`:** 11 of 11; the invitation group 4 of 4; none skipped.
- **`greps`, `exemptions`, `hygiene`:** each exit 0.
- **Default E2E `174-10-final-r3`:** total 218, passed 218, failed 0, flaky 0, skipped 0, did not run 0; 106 projects. Against `174-09-close`: "106 compared, 0 not as expected"; `invitation-contract` 15/15, `invitation-landing` 3/3, `auth-service-contract` 2/2, `contestant-journey` 1/1.
- **Bank-auth `174-10-r2`:** driver exit 0. `174-10-r2-bank-auth` 8 of 8 (`bank-auth` 6/6); `174-10-r2-bank-auth-journey` 152 of 152 in 90 projects (`bank-auth-journey` 1/1).
- **Probes after the restore, and once more by hand after re-seeding:** `170-allowlist-probe.sh after` exit 0; `174-stack-probe.sh after` exit 0.
- **`sleep_entries_in_window`:** 0 in each of the four closing runs. **Void marker:** in none of them.
- Every run records head `d6ad5ed92`, tree-equal to HEAD outside `.planning/`.

## The void run and the red run

**`174-10-final` is VOID.** The host's lid was closed with the charger unplugged 40 seconds into the run: wrapper exit 8, `VOID-host-suspend.txt` with a gap of 244,909 ms, `sleep_entries_in_window: 1` ("Clamshell Sleep"). The host cycled between sleep and dark wake for 26 minutes; a background watcher waited for the lid to open, and the run was made again as `174-10-final-r2` (218 of 218). Nothing was diagnosed from the void run and its directory is kept.

**`174-10-bank-auth-journey` was RED: total 152, passed 69, failed 1, did not run 82.** No void marker.

- **Failed test:** `contestant-journey`, step 3: `inviteByEmail: the link request finished without handing a mail over`.
- **Cause:** the bank-auth driver serves the functions with a generated environment file, which replaces the function environment of every function. The file held no SMTP variable. Since 174-09 the journey registers through `account-access`, which then logged `account-access: a link could not be issued or mailed; its slot is given back {"name":"Error","code":"ERR_ENV_UNCONFIGURED"}` in the second the test failed. Bank-auth had not run since 174-03.
- **Read directly:** the test's error, the function's log line, the driver's seven generated lines. **Inferred:** that the unset variable is `SMTP_HOST` (the log gives the code, not the name). **Confirmed by the re-run, not in isolation:** with the three SMTP lines as the driver's only change the same slice is 152 of 152.
- **Fix:** `d6ad5ed92` (the driver reads the three lines from the tracked template) and `8e0c421f0` (the runbook the driver encodes, and two sentences of the Edge Functions docs page). The second changes the tree outside `.planning/`, so all four closing runs were made again; the green gate set `174-10-final`, the green `174-10-final-r2` and the green `174-10-bank-auth` are superseded, not evidence.

## Decisions Made

- **The security section is on the authentication page.** See Deviation 1.
- **The Publishers' Guide was corrected in a commit of its own**, as instructed.
- **A doomed run was not started.** While the lid was closed a run could only have been void again; the plan waited for the host instead of spending labels.
- **Skill statements outside this phase's categories were left**, and named in the freshness record as unchecked.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's security page does not exist**
- **Found during:** Task 1
- **Issue:** `developers-guide/backend/security/+page.md` is in the plan's file list and its verify greps it. The route is a redirect stub (`+page.ts`, `redirect(308, '/developers-guide/backend/authentication')`), one of 26 the docs tooling tracks.
- **Fix:** the controls and "What this does not protect against" are on the authentication page, where the stub sends a reader. No stub was removed and no navigation entry added.
- **Consequence:** two terms of Task 1's verify (`grep -q "account-access"` and `grep -q -i "public sign-up"` on the missing file) cannot pass as written. The same two searches on the authentication page exit 0. Every other term exits 0.
- **Commit:** `0fd05398f`

**2. [Rule 1 - Bug] The bank-auth driver's Edge files lacked the variables `account-access` reads**
- **Found during:** Task 4, the first bank-auth run
- **Fix and evidence:** above. **Files:** `174-bankauth.sh`, `tests/IDURA-TEST-RUNBOOK.md` (outside the plan's file list), the Edge Functions docs page. **Commits:** `8e0c421f0`, `d6ad5ed92`

**3. [Rule 1 - Bug] Two Publishers' Guide sentences said candidates are sent an invitation email**
- Corrected in `31e38d298`; neither page is in the plan's file list. The first page also said candidates "can be sent reminders to sign up": `send-email` reaches only users who hold a grant, so that sentence went too.

**4. [Rule 1 - Bug] Skill statements that were false and not counts**
- Reviewing § 13 ("applied to both … nothing checks that they agree") and two Key Source Locations entries ("read-only mirror", "3 files") contradicted the skill's own Backend Overview and the parity gate. Corrected in `f46f8d38d`.

### Verify commands that could not pass as written

- **Task 1:** the two terms on the missing security page (Deviation 1).
- **Task 2:** `audit-skill-links.sh database` exits 1, as before the plan (above).
- **Task 4:** the labels. The plan's verify names `174-10-bank-auth`, `174-10-bank-auth-journey` and `174-10-integration.json`; after the fix the evidence is `174-10-r2-bank-auth`, `174-10-r2-bank-auth-journey` and `174-10-integration-r2.json`. The verdicts on the plan's own bank-auth labels exit 1 (stale, and the journey red); on the new labels they exit 0. `gates 174-10-final` and `e2e 174-10-final` resolve to the newest re-run by the verdict's own rule and exit 0.

### Additions and differences

- **Docs beyond the plan's list of points:** the eligibility table of the link request (the grant-holder arm was undocumented), the callback's arms on the login page, the `witness` field, and the README's command line for pgTAP left as it was with its stale file count removed.
- **Twenty-two todos** where the plan lists eleven: the operator's dispatch added eleven items, and the red run one.
- **One host wait.** A background loop polled the lid and the power source until the host was awake.
- **The bank-auth scratch directory** was placed under the session scratchpad through `BANKAUTH_SCRATCH_BASE`.
- **No state file was edited** and nothing was appended to `.planning/WINDOWS.md`: the plan leaves no stub, skipped test or unrun verify.

**Total deviations:** 4 auto-fixed, three verify terms or labels that could not pass as written, the differences listed.

## Issues Encountered

- **One void run**, the host's lid closed on battery during `174-10-final`.
- **One red run**, `174-10-bank-auth-journey`, fixed at its cause.
- Two tool calls that polled a marker overran their limit while the host slept and were moved to the background; nothing was lost.

## `CLAUDE.md`, and the two record sentences

**No sentence of `CLAUDE.md` was found false** at this plan's start (`a680690a4`); the operator's `78a9ff95b` had already replaced the two that 174-07 reported. It does not say that a change to `config.toml`, to the functions' environment file or to a function's source needs `yarn db:stop` and `yarn db:start`; a line that can be pasted is in the name map, § *For the operator* (a). It was not edited.

**INV-02 and roadmap criterion 2 carry no unresolved marker** at this head; both are quoted in the name map, § *For the operator* (b). `REQUIREMENTS.md` still shows INV-01 to INV-05 unchecked and "Pending"; `ROADMAP.md` and `STATE.md` are the orchestrator's to update.

**The rulings of `174-01-PLAN.md`**, each with one line on what happened: name map, § *For the operator* (c), items 1 to 25.

## Which requirements the phase's evidence supports

All five, on the local stack, each shown in the database (pgTAP `39-invitations.test.sql`) and on the running stack (E2E): INV-01 Section 2 and the contract spec's seeding (the refusals in pgTAP only); INV-02 Section 4 and the contract spec's duplicate test; INV-03 Sections 10 to 13, the contract spec, the journey's step 5.5, `invitation-landing` and `auth-service-contract`; INV-04 Section 16, the contract spec's two used-code tests and the integration report; INV-05 Section 6 and the contract spec's first test. INV-03 rests on public sign-up being closed, which the repository holds for the local stack and an operator holds for a hosted one.

## Known Stubs

None.

## Threat Flags

None. The plan adds no endpoint, auth path or schema. Two observations from the red run, both filed: a served `account-access` with an unset SMTP variable creates the user before it fails, and the auth service appears to admit a redirect on its own site URL's host name whatever the port (inferred).

## User Setup Required

None on this host. A hosted project: the todo `2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md`.

## Next Phase Readiness

- The stack is up with public sign-up closed and serves three functions; the database holds the `default` dataset; no dev server is running; nothing listens on 5173, 5273, 8777 or 9443.
- Phase 175 regenerates the migration after this phase and decides whether an invited entity is confirmed for every type.
- Phase 178 builds screens on the contract in the name map and takes the todos that name it.

## Self-Check: PASSED

Checked after writing: the nine modified docs and skill files, the name map with its three new sections, the 22 new todo files and the seven commits `0fd05398f`, `31e38d298`, `f46f8d38d`, `0b393f144`, `8e0c421f0`, `d6ad5ed92`, `0eaa0ffb4` all exist.
