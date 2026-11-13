---
phase: "174"
slug: "invitations-grants-defined-in-advance"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-06"
---

# Phase 174 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Ten plans, ten serial waves,
> 47 tasks: 46 automated and one operator checkpoint (174-03 Task 3, which is passed without a pause when
> the running edge container already carries the tracked template's three values). Every automated task has
> a verify command with a stated failing direction. Security is the centre of this phase: every threat of
> the plans' threat models that is mitigated names the test that holds it.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frameworks** | pgTAP (`supabase test db`); Vitest (the Edge Functions under `apps/supabase`, the frontend, `packages/dev-seed`, the tests' own utilities); Playwright through `tests/scripts/e2e-run.sh`; live probes against the local stack |
| **Config files** | `apps/supabase/supabase/tests/database/*.test.sql`, the per-workspace Vitest configs, `tests/vitest.config.ts`, `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/supabase test:db` (after `yarn db:reset` and `yarn db:types`) · `yarn workspace @openvaa/supabase test:unit` · `yarn workspace @openvaa/frontend vitest run <file filter>` · `yarn vitest run --config tests/vitest.config.ts <filter>` |
| **Full suite command** | `bash .planning/phases/174-invitations-grants-defined-in-advance/174-gates.sh <label> [--rows <names>]` (fifteen gate rows by default, or a named subset) then `bash .planning/phases/174-invitations-grants-defined-in-advance/174-e2e.sh <label>` (one full default E2E run through `tests/scripts/e2e-run.sh --no-db-reset`); where the auth configuration is in play, `bash …/174-bankauth.sh <label-stem> after` (the two opt-in bank-auth projects, each alone, then the stack restored and probed) |
| **Verdict commands** | `node .planning/phases/174-invitations-grants-defined-in-advance/174-verdict.mjs gates <label> [--rows <names>]` · `… e2e <label> [--allow-slice] [--min-total-of <label2>] [--same-projects-as <label2> [--except <project>=<delta>]…] [--expect-project <name>]…` · `… greps [--only <positions>]` · `… exemptions` · `… hygiene` |
| **Live probes** | `bash …/174-stack-probe.sh <before\|after> [--only <auth\|edge>]` (the served auth settings, two live sign-up requests, and five container variables read by name, one `printenv <NAME>` call each) · `node …/174-mail-probe.mjs` (one mail through `send-email` into the catcher) · `node …/174-fn-probe.mjs` (the function's whole contract, each negative after its completion witness) · `bash .planning/phases/170-contestant-app-rename-symbols-routes/170-allowlist-probe.sh after` |
| **Estimated runtime** | targeted Vitest filter 10–60 s; pgTAP about 60 s after a reset of about 60–90 s; gate set about 8–12 min; full E2E about 6–9 min; the bank-auth driver about 25–40 min (all long runs are launched in the background and polled) |

The drivers, the verdict script and the stack probe are created by 174-01 Task 2; the mail probe by 174-03
Task 4; the function probe by 174-05 Task 7. None exists before its task.

**The order of the database rows is fixed:** regenerate the single migration from `schema/*.sql`, the parity
gate, `yarn db:reset`, `yarn db:types` on the freshly reset database and before pgTAP, then pgTAP, then
`yarn db:lint:sql`. Never `supabase db push`.

**How a run is compared with another.** `--same-projects-as` is the per-project comparison: every project has
exactly its total in the other run, except a project named in `--except`, which is that many tests above it
(an integer) or above it by any amount (`+`). `--expect-project` requires the project to be in the run with
every test passed.

**What no command of the phase does** (`174-verdict.mjs hygiene` checks each form in the phase's scripts,
in every `auto` action and in every verify command): open, read, write or script-process an untracked
environment file; print a container's whole environment; read a container log without a filter for the
function's own prefix. A container variable is read by name with `docker exec <container> printenv <NAME>`.

**How a negative about mail is asserted.** Never on elapsed time and never on another request's mail having
arrived: the function's background jobs do not finish in request order. The request carries a completion
witness the service role opened (`invitation_link_witness_open`); the test or probe waits until
`invitation_link_witness` reads `sent` or `not-sent`, and only then looks at the catcher and at the accounts.

---

## Sampling Rate

- **After every task commit:** the task's own `<automated>` command — pgTAP on a reset database, a targeted
  Vitest filter, a gate script, or a live probe. Each runs in the foreground in under about five minutes.
- **After every plan (every wave):** see the run schedule below.
- **Before `/gsd-verify-work`:** the closing gate of 174-10 Task 4 on one tree: the fifteen gate rows, the
  gated adapter-level integration test, the four closing searches, the exemption check, the hygiene check,
  the full default E2E run, both bank-auth runs, and the stack probe after the restore.
- **Max feedback latency:** about 300 seconds per task; about 25 minutes per plan close; about 70 minutes for
  the two plans that also run the bank-auth driver (174-03, 174-10).
- **Never:** a retry until green, a skipped test, a status read through a pipe, a foreground command over
  about eight minutes, a deletion under `tests/e2e-runs/`, a stack restart by any means but `yarn db:stop`
  and `yarn db:start`, a read of an untracked environment file, a listing of a container's environment.

### Run schedule

Six plans close on a full default E2E run. Four close on gate rows and their own targeted checks, with no E2E
run of their own, and name the next behavioural plan's full run as their boundary proof.

| Plan | Tasks | Gate rows at close | Full E2E at close | E2E comparison | Boundary proof for |
|------|-------|--------------------|-------------------|----------------|--------------------|
| 174-01 | 2 | thirteen (`BASE_ROWS`: all but `auth-config`, `stack`) and `hygiene` | yes (`174-01-baseline`) | — (the baseline) | — |
| 174-02 | 4 | `typecheck,lint,db-reset,types-regen,types-clean,pgtap,sql-lint,unit` | no | — | — |
| 174-03 | 7 (one a checkpoint) | fifteen and `hygiene` | yes, and both bank-auth projects | every project equal to the baseline; `auth-service-contract` = 2 | 174-02 |
| 174-04 | 5 | the eight of 174-02 plus `auth-config,stack` | no | — | — |
| 174-05 | 7 | `typecheck,lint,unit,format,name-gate-self-test,auth-config,stack`, `hygiene`, and the live function probe | no | — | — |
| 174-06 | 5 | fifteen | yes | every project equal to `174-03-close`; `invitation-contract` new | 174-04, 174-05 |
| 174-07 | 5 | fifteen and `hygiene` | no | — | — |
| 174-08 | 4 | fifteen, and the gated integration test | yes | every project equal to `174-06-close` | 174-07 |
| 174-09 | 4 | fifteen, the four searches, `hygiene` | yes | every project equal to `174-08-close`; `invitation-landing` new | — |
| 174-10 | 4 | fifteen, the integration test, the four searches, `hygiene` | yes, and both bank-auth projects | every project equal to `174-09-close` | — |

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 174-01-01 | 01 | 1 | INV-01, INV-03 | T-174-01 | every assumed fact is re-measured before a task acts on it | source assertion | the heading and row checks on `174-NAME-MAP.md` plus the PLAN/SUMMARY count equalities of Phases 172 and 173 | ❌ W0 | ⬜ pending |
| 174-01-02 | 01 | 1 | INV-01, INV-03 | T-174-02, T-174-03, T-174-04 | no verdict from a stale or partial run; a probe leaves no account; no key, environment or secret file printed | gates + E2E + hygiene | `174-verdict.mjs hygiene`, `… gates 174-01-baseline --rows <thirteen>` and `… e2e 174-01-baseline` | ❌ W0 | ⬜ pending |
| 174-02-01 | 02 | 2 | INV-01, INV-02 | T-174-05 to T-174-14 | the authority map is the `INSERT` policy; no rewrite; no chosen code hash; cross-project targets refused | schema workflow + pgTAP + SQL lint | parity, `yarn db:reset`, `yarn db:types` with no diff, `test:db`, `db:lint:sql`, the permission-enum gate | ❌ W0 | ⬜ pending |
| 174-02-02 | 02 | 2 | INV-01, INV-05 | T-174-15 | seeding runs as the caller, creates no user, sends nothing | schema workflow + pgTAP + SQL lint | parity, reset, types with no diff, `test:db`, `db:lint:sql`, `assert:rpc-nullability` | ❌ W0 | ⬜ pending |
| 174-02-03 | 02 | 2 | INV-01, INV-02, INV-05 | T-174-05 to T-174-13, T-174-15 | a project editor cannot seed their own promotion, through the function or the table; duplicates refused; seeding sends nothing | pgTAP | `yarn workspace @openvaa/supabase test:db` (the `*-invitations.test.sql` file) | ❌ W0 | ⬜ pending |
| 174-02-04 | 02 | 2 | INV-01, INV-02, INV-05 | T-174-14 | — | gates | `174-verdict.mjs gates 174-02-close --rows <eight>` | ✅ | ⬜ pending |
| 174-03-01 | 03 | 3 | INV-03 | T-174-17 to T-174-19, T-174-21 | the hole is recorded live; an edit that reopens sign-up fails lint | config + gate | the four `config.toml` table checks, the template greps, `assert-auth-signup-closed.mjs` and `--self-test`, `hygiene` | ❌ W0 | ⬜ pending |
| 174-03-02 | 03 | 3 | INV-03 | T-174-17, T-174-18, T-174-22, T-174-88 | public sign-up and OTP user creation answer `signup_disabled` on the running service; three edge variables read by name | live probe | `170-allowlist-probe.sh after`, `174-stack-probe.sh after --only auth`, the three-row check of the edge evidence | ❌ W0 | ⬜ pending |
| 174-03-03 | 03 | 3 | INV-03 | T-174-22 | no executor opens the untracked function environment; the operator sets three lines | checkpoint:human-action | passed without a pause on three `EQUAL` rows; otherwise the operator's `done`, re-read by Task 4 | — | ⬜ pending |
| 174-03-04 | 03 | 3 | INV-03 | T-174-22, T-174-23, T-174-88 | a mail from an Edge Function reaches the catcher; no secret printed | live probe | `170-allowlist-probe.sh after`, `174-stack-probe.sh after`, `174-mail-probe.mjs`, `hygiene` | ❌ W0 | ⬜ pending |
| 174-03-05 | 03 | 3 | INV-03 | T-174-17, T-174-18, T-174-20 | the suite observes the service refuse to create a user | E2E slice | `174-verdict.mjs e2e 174-03-contract-slice --allow-slice --expect-project auth-service-contract` | ❌ W0 | ⬜ pending |
| 174-03-06 | 03 | 3 | INV-03 | T-174-20 | the hosted obligation, and that the database has no guard of its own, are stated where an operator reads them | docs gate | `validate:links --check` and the content greps | ✅ | ⬜ pending |
| 174-03-07 | 03 | 3 | INV-03 | T-174-17 to T-174-23, T-174-88 | every consumer of the auth service is green under the closed configuration | gates + E2E ×3 + probes | `gates 174-03-close`, `e2e 174-03-close --same-projects-as 174-01-baseline --except auth-service-contract=2 …`, the two bank-auth verdicts, `hygiene`, both probes | ✅ | ⬜ pending |
| 174-04-01 | 04 | 4 | INV-03, INV-04 | T-174-28, T-174-30, T-174-31, T-174-35, T-174-83, T-174-84 | every helper is service-only; a slot can be given back; a witness cannot be opened or read by an API role | schema workflow + pgTAP + SQL lint | parity, reset, types with no diff, `test:db`, `db:lint:sql`, the census file unmodified | ✅ | ⬜ pending |
| 174-04-02 | 04 | 4 | INV-03 | T-174-25, T-174-34, T-174-85 | the claim takes no identity from its caller and is created only on a stack that refuses sign-up | schema workflow + pgTAP + probe | the stack probe, parity, reset, types with no diff, `test:db`, `db:lint:sql` | ✅ | ⬜ pending |
| 174-04-03 | 04 | 4 | INV-03 | T-174-25, T-174-26, T-174-32, T-174-33, T-174-16 | wrong account, unconfirmed address and stale claim refused; a demoted seeder's promise honoured, a deleted one not | pgTAP | `yarn workspace @openvaa/supabase test:db` | ✅ | ⬜ pending |
| 174-04-04 | 04 | 4 | INV-04 | T-174-27 to T-174-31, T-174-35, T-174-83, T-174-84 | replay, deleted claimant, brute force and mail abuse refused; the slot is free at once after a release | pgTAP | `yarn workspace @openvaa/supabase test:db` | ✅ | ⬜ pending |
| 174-04-05 | 04 | 4 | INV-03, INV-04 | T-174-34 | — | gates | `174-verdict.mjs gates 174-04-close --rows <ten>` | ✅ | ⬜ pending |
| 174-05-01 | 05 | 5 | INV-03 | T-174-46, T-174-91 | first restart: both probes; the probe function answers; no secret read | live + hygiene | both probes, the `OPTIONS` check, `hygiene` | ❌ W0 | ⬜ pending |
| 174-05-02 | 05 | 5 | INV-03 | T-174-46, T-174-86 | second restart: both probes; the probe function is gone from the tree and the runtime | live measurement | the absence checks, both probes, the 404 check, the evidence rows | ❌ W0 | ⬜ pending |
| 174-05-03 | 05 | 5 | INV-03, INV-04 | T-174-36 to T-174-39, T-174-43, T-174-87 | closed answer sets; origin from configuration only; fail-closed check with a lifetime of at most 60 s; fixed templates | unit | `yarn workspace @openvaa/supabase test:unit`, `assert:edge-env-defaults` | ❌ W0 | ⬜ pending |
| 174-05-04 | 05 | 5 | INV-03 | T-174-39 to T-174-42, T-174-89, T-174-90 | checks before eligibility; the slot given back on each failure; the witness completed once; nothing secret logged | unit | `yarn workspace @openvaa/supabase test:unit` (`linkIssue.test.ts`) | ❌ W0 | ⬜ pending |
| 174-05-05 | 05 | 5 | INV-03, INV-04 | T-174-37, T-174-44, T-174-45 | one invalid-credentials answer; per-request clients; project from the request | unit + gates | `test:unit`, `assert:edge-env-defaults`, `assert:edge-function-env`, the content greps | ❌ W0 | ⬜ pending |
| 174-05-06 | 05 | 5 | INV-03, INV-04 | T-174-36, T-174-38, T-174-42, T-174-44, T-174-45, T-174-46, T-174-87 | third restart: both probes; the probe function not served; answer before work; no unbounded cache | unit (source conformance) + gates + live | `test:unit`, the five gates, both probes, the two `OPTIONS` checks | ❌ W0 | ⬜ pending |
| 174-05-07 | 05 | 5 | INV-03, INV-04 | T-174-36 to T-174-41, T-174-90, T-174-91 | the whole contract on the real runtime, each negative after its witness | live probe + gates | `174-fn-probe.mjs`; `hygiene`; `gates 174-05-close --rows <seven>` | ❌ W0 | ⬜ pending |
| 174-06-01 | 06 | 6 | INV-01 | — | — | unit | `yarn workspace @openvaa/dev-seed test:unit`, `assert:project-scoped-queries` | ✅ | ⬜ pending |
| 174-06-02 | 06 | 6 | INV-03 | T-174-49, T-174-55 | a received link is asserted, then only its origin replaced | unit | `yarn vitest run --config tests/vitest.config.ts mailedLink`, `typecheck:tests` | ❌ W0 | ⬜ pending |
| 174-06-03 | 06 | 6 | INV-03 | T-174-54, T-174-92 | cleanup removes claimed rows; a test can wait on the end of a request's work | typecheck + source assertion | `typecheck:tests`, ESLint, the content greps | ✅ | ⬜ pending |
| 174-06-04 | 06 | 6 | INV-02 to INV-05 | T-174-48 to T-174-54, T-174-92 | no token but from a mail; every negative after its witness; wrong account, oracles, throttle and origin injection each a passing test | E2E slice ×2 | `e2e 174-06-contract-slice --allow-slice --expect-project invitation-contract` and the same for `…-again` | ❌ W0 | ⬜ pending |
| 174-06-05 | 06 | 6 | INV-02 to INV-05 | T-174-48 to T-174-54, T-174-92 | — | gates + E2E | `gates 174-06-close`; `e2e 174-06-close --same-projects-as 174-03-close --except invitation-contract=+ …` | ✅ | ⬜ pending |
| 174-07-01 | 07 | 7 | INV-01 | T-174-61 | the old client method is gone | unit + search | `check`, the adapter's Vitest, `greps --only 3` | ✅ | ⬜ pending |
| 174-07-02 | 07 | 7 | INV-01, INV-03 | T-174-56, T-174-57 | the service-role invite function answers 404; the gates name what exists | gates + live | the three gates, both unit suites, the `OPTIONS` checks, the mail probe, both probes | ✅ | ⬜ pending |
| 174-07-03 | 07 | 7 | INV-01 | T-174-57, T-174-59 | `send-email` unchanged; the three `envConfig.ts` copies identical | gates + unit | the two `cmp` checks, three gates, `test:unit`, comment hygiene | ✅ | ⬜ pending |
| 174-07-04 | 07 | 7 | INV-01 | T-174-60 | — | docs gate + search | `validate:links --check`, `audit-skill-links.sh database`, `greps --only 4` | ✅ | ⬜ pending |
| 174-07-05 | 07 | 7 | INV-01, INV-03 | T-174-58 | the name gate's self-test passes against unshifted expectations | gates | the name gate and its self-test, `exemptions`, `greps --only 1,3,4`, `gates 174-07-close`, `hygiene` | ✅ | ⬜ pending |
| 174-08-01 | 08 | 8 | INV-03, INV-04 | T-174-63, T-174-66 | the claim is called with the project and nothing else; no token leaves the writer | unit + gates | the adapter's Vitest, `assert:project-scoped-queries`, `assert:adapter-casts` | ✅ | ⬜ pending |
| 174-08-02 | 08 | 8 | INV-03 | T-174-62, T-174-64, T-174-67 | the gate reads the refreshed token; a first-time invitee is admitted; a failing claim locks nobody out | unit | `yarn workspace @openvaa/frontend vitest run src/lib/auth` | ✅ (extend) | ⬜ pending |
| 174-08-03 | 08 | 8 | INV-03, INV-04 | T-174-65, T-174-68 to T-174-70 | no open redirect; a failed claim drops the session; code sign-in's cookies land on the caller's response | unit + integration | the callback's Vitest; the gated integration report `174-08-integration.json` | ❌ W0 | ⬜ pending |
| 174-08-04 | 08 | 8 | INV-03, INV-04 | T-174-62, T-174-56 | — | gates + E2E | `gates 174-08-close`; `e2e 174-08-close --same-projects-as 174-06-close …` | ✅ | ⬜ pending |
| 174-09-01 | 09 | 9 | INV-03 | T-174-71, T-174-74, T-174-76 | the journey opens the mailed link, not a built one; the grant it holds is the claim's | E2E slice ×2 | `e2e 174-09-journey-slice --allow-slice --expect-project contestant-journey` and `…-again` | ✅ | ⬜ pending |
| 174-09-02 | 09 | 9 | INV-01, INV-03 | T-174-74 | no fixture invites through the auth service or writes the grant | unit + search | `typecheck:tests`, `greps --only 2` | ✅ | ⬜ pending |
| 174-09-03 | 09 | 9 | INV-03 | T-174-72, T-174-73, T-174-75 | an `invite` link is refused unverified; a claimed role is carried by the same request's session; a stranger gains nothing | unit + E2E slice | the callback's Vitest; `e2e 174-09-landing-slice --allow-slice --expect-project invitation-landing` | ❌ W0 | ⬜ pending |
| 174-09-04 | 09 | 9 | INV-01, INV-03 | T-174-71 to T-174-76 | the old path is gone rather than bypassed | gates + E2E + search | `greps`, `exemptions`, `hygiene`, `gates 174-09-close`, `e2e 174-09-close --same-projects-as 174-08-close --except invitation-landing=+ …` | ✅ | ⬜ pending |
| 174-10-01 | 10 | 10 | INV-01 to INV-05 | T-174-79, T-174-80 | the hosted obligations and every residual are stated by mechanism | docs gate | `validate:links --check`, the content greps, `greps` | ✅ | ⬜ pending |
| 174-10-02 | 10 | 10 | INV-01 to INV-05 | T-174-82 | — | skill audit | `audit-skill-links.sh database`, the content greps | ✅ | ⬜ pending |
| 174-10-03 | 10 | 10 | INV-01 to INV-05 | T-174-80 | every residual is a todo naming its phase or its owner | source assertion | the todo greps and the row counts on `174-NAME-MAP.md` | ✅ | ⬜ pending |
| 174-10-04 | 10 | 10 | INV-01 to INV-05 | T-174-77, T-174-78, T-174-81 | one tree; the stack closes in its closed-sign-up state; no secret read or printed | gates + integration + E2E ×3 + probes | `gates 174-10-final`, `greps`, `exemptions`, `hygiene`, `e2e 174-10-final --same-projects-as 174-09-close …`, the two bank-auth verdicts, the integration report, both probes | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Phase Requirements → Test Map

| Req ID | Behaviour | Test type | Where |
|--------|-----------|-----------|-------|
| INV-01 | each row of the authority map, allowed and refused, through the function and through a direct insert; no `UPDATE` | pgTAP | `39-invitations.test.sql`, section "INV-01, the authority map" (174-02 Task 3) |
| INV-01 | an admin-callable path seeds an invitation for a candidate and for an organization on the running stack | E2E | `invitation-contract.spec.ts` (174-06) |
| INV-02 | both duplicate rules; the first row unchanged; a batch writes nothing; a claimed row still blocks | pgTAP | section "INV-02, duplicates" (174-02 Task 3) |
| INV-02 | a duplicate is refused through the seeding call on the running stack | E2E | `invitation-contract.spec.ts` (174-06) |
| INV-03 | grants after the claim = before + promised; unconfirmed, stranger, stale token claim, expired, moved target claim nothing; second call a no-op | pgTAP | sections "INV-03, exactly the promised grants", "INV-03, nobody else", "D-19" (174-04 Task 3) |
| INV-03 | a demoted seeder's promise is honoured; a deleted promise grants nothing | pgTAP | section "the seeder's authority" (174-04 Task 3) |
| INV-03 | public sign-up and OTP user creation are refused by the running auth service | live probe + E2E | `174-stack-probe.sh after`; `public-signup-closed.spec.ts` (174-03) |
| INV-03 | session, claim, refresh, gate — in that order | unit | `sessionAdmission.test.ts`, the callback's `server.test.ts` (174-08) |
| INV-03 | registration through a seeded invitation, the link opened from the mail, exactly the promised grant held | E2E | `contestant-journey.spec.ts`, `perm-localisation-positive.spec.ts`, `invitation-contract.spec.ts`, `invitation-landing.spec.ts` (174-06, 174-09) |
| INV-04 | `used` after the claim and after the claimant is deleted; no second grant; a claimed row not deletable by an admin; the attempt limit | pgTAP | sections "INV-04, the used code", "the limits" (174-04 Task 4) |
| INV-04 | a used code answers `used`, grants nothing twice, and signs in with the right password only | E2E | `invitation-contract.spec.ts` (174-06) |
| INV-05 | a named candidate and a named organization confirmed at seeding; nameless not; a project-scope promise confirms nothing | pgTAP | section "INV-05" (174-02 Task 3) |
| INV-05 | the two dedicated rows read `confirmed = true` after seeding | E2E | `invitation-contract.spec.ts`, first test (174-06) |

## The threats the phase must cover, and the test that holds each

| Threat | Plan · Threat ID | Named test |
|--------|------------------|-----------|
| claiming another person's invitation (address forgery) | 174-03 · T-174-17, T-174-18 | `174-stack-probe.sh after`; E2E `public-signup-closed.spec.ts`; pgTAP "INV-03, nobody else" (unconfirmed address) |
| code enumeration and brute force | 174-02 · T-174-11; 174-04 · T-174-28 (mitigated), T-174-29 (accepted) | pgTAP "the code" (60 bits, distinctness); pgTAP "the limits" (ten look-ups per used code). Unknown codes: nothing beyond entropy is built — accepted, residual R-a |
| replay of a used code | 174-04 · T-174-27 | pgTAP "INV-04, the used code"; E2E "INV-04, nothing twice" |
| an invitation claimed into the wrong account | 174-04 · T-174-26; 174-06 · T-174-50; 174-09 · T-174-75 | pgTAP "INV-03, nobody else"; E2E contract "INV-03, nobody else"; E2E landing "a signed-in stranger gains nothing" |
| a project editor seeding their own promotion | 174-02 · T-174-05 | pgTAP "self-promotion" case, through the function and through a direct insert |
| planting a chosen `code_hash` by direct insert | 174-02 · T-174-07 | pgTAP "the code": a direct `INSERT` naming `code_hash` is refused with `42501` |
| the used-code answer and the link-request endpoint as account-existence oracles | 174-05 · T-174-36, T-174-37; 174-06 · T-174-51 | `contract.test.ts`; `flowConformance.test.ts` (ii); E2E deep-equal comparisons of whole answers |
| an unthrottled anonymous mail-sending endpoint | 174-04 · T-174-30; 174-05 · T-174-41; 174-06 · T-174-52 | pgTAP "the limits"; `linkIssue.test.ts` "a null eligibility sends nothing"; E2E "a second request inside the interval", asserted after its witness |
| a failed send locking the real user out for a minute | 174-04 · T-174-83; 174-05 · T-174-89 | pgTAP "the slot is given back"; `linkIssue.test.ts`, three failure cases, each "release exactly once" |
| open redirect or link-origin injection in the mailed link | 174-05 · T-174-38; 174-06 · T-174-53; 174-08 · T-174-65 | `signInLink.test.ts`; `flowConformance.test.ts` (v); E2E hostile-header test; callback `server.test.ts` (`next`) |
| the definer function trusting a caller-supplied identity | 174-04 · T-174-25; 174-08 · T-174-63 | pgTAP "the claim's surface" (one signature, `(uuid)`) and the stale-claim case; the adapter test of the claim's argument keys |
| a "no mail was sent" assertion that looked too early | 174-06 · T-174-92 | every negative follows `awaitLinkWitness`; the fixture holds no sentinel and no fixed wait |
| a secret file or a container's environment read or printed by an executor | 174-01 · T-174-04; 174-03 · T-174-22, T-174-88; 174-05 · T-174-91 | `174-verdict.mjs hygiene`, at the close of 174-01, 03, 05, 07, 09 and 10 |

## Accepted residuals (no test can close them; each is stated by mechanism in 174-01 and in the security docs)

| Residual | Threat ID | Where recorded |
|----------|-----------|----------------|
| unlimited anonymous code checks, each one indexed look-up | T-174-29, T-174-47 | 174-01 R-a; todo (174-10) |
| one sign-in mail per minute to any eligible address, indefinitely | T-174-30 (bounded, not removed) | 174-01 R-b; todo |
| a new link invalidates the unopened one before it | T-174-86 | 174-01 R-c; measured in 174-05 Task 2; todo for Phase 178 |
| the hosted caller topology is unmeasured | T-174-47 | 174-01 R-d; todo |
| a claim honours a promise whose seeder has since lost authority | T-174-16 | 174-01 R-e; pinned in pgTAP (174-04 Task 3) |
| no in-database guard on the auth service's sign-up setting | T-174-85 | 174-01 R-f; deployment and security docs (174-03, 174-10); todo |
| the auth service's own OTP endpoint as an account oracle | T-174-24 | 174-01 R-g; todo for Phase 178 |

---

## Wave 0 Requirements

Files and facts that must exist before the tasks that rely on them; each is created or measured by the task
named.

- [ ] `174-NAME-MAP.md` and the five drivers, the `hygiene` verdict among them — 174-01 Tasks 1 and 2
- [ ] `apps/supabase/supabase/tests/database/39-invitations.test.sql` — 174-02 Task 3 (INV-01, INV-02, INV-05), extended by 174-04 Tasks 3 and 4 (INV-03, INV-04, D-19, the release, the witness, exposure)
- [ ] a full pgTAP run on the real stack with the new schema, to see the storage files the research could not run (A11) — 174-02 Task 3
- [ ] the running auth service refusing public sign-up (A1) — 174-03 Task 2; the edge runtime's three variables equal to the tracked template, by the operator's hand if needed — 174-03 Tasks 2 to 4
- [ ] one request to a local function with only the anon key (A3), one background mail read from the catcher (A4), the error key that carries `email_exists` (A7), the redirect rule, the re-issue measurement — 174-05 Task 2
- [ ] the function's pure modules and their `.test.ts` files (A9) — 174-05 Tasks 3 and 4
- [ ] `tests/tests/utils/mailedLink.test.ts`, the witness helpers and the contract spec's fixture — 174-06 Tasks 2, 3 and 4
- [ ] one measurement that `auth.setSession` writes the cookies on a server-shaped client (A5) — 174-08 Task 3

---

## Manual-Only Verifications

All phase behaviours have automated verification.

One task is an operator action and not a verification: **174-03 Task 3**. No executor opens the functions'
untracked environment file. When the running edge container does not carry the tracked template's values for
`SITE_URL`, `SMTP_HOST` and `SMTP_PORT`, the operator sets those three lines; the next task restarts, reads
the three variables again by name and proves delivery with a mail. When the three already match, the
checkpoint is passed without a pause.

Two obligations are outside what any command in this repository can check, and are stated for the operator
rather than verified: a hosted project's dashboard switches (public sign-up off, email confirmation on) and
its redirect allowlist entry for the callback. The Edge Function refuses to issue links when the served
values are wrong, which is tested; that a given hosted project is set correctly is not, and
`claim_invitations` itself has no guard against a project that leaves sign-up on.

One review is filed as a todo and is not a gate: a native speaker's reading of the sign-in mail in `da`,
`et`, `fi`, `fr`, `lb` and `sv`.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (the one checkpoint task is verified by the task after it)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 300s per task
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
