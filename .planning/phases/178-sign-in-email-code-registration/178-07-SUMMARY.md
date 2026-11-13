---
phase: 178-sign-in-email-code-registration
plan: 07
subsystem: edge-functions
tags: [supabase, edge-functions, account-access, password-recovery, gotrue, mail, conformance-test, mutation, probe, e2e]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-06: public.recovery_link_request and renderRecoveryMail; plan 178-02: probe row P1 (held); plan 178-01: the gate, E2E and verdict drivers and the stack probe"
provides:
  - "The fourth operation of the account-access Edge Function: request-recovery, with RequestRecoveryRequest in contract.ts; answered with the accepted body before its work"
  - "issueRecoveryLink in linkIssue.ts, on the one pipeline issueSignInLink runs; LinkIssueDeps.recoveryEligibility and LinkIssueDeps.mintRecoveryToken; readRecoveryEligibility"
  - "LinkType ('magiclink' | 'recovery') and buildSignInLink({ …, type }) in signInLink.ts"
  - "issueRecoveryInBackground and the request-recovery branch of index.ts"
  - "flowConformance.test.ts restated for two operations, each property of the recovery branch seen red against a mutant"
  - "Row fn of 178-probe.mjs and the line FN: held in 178-PROBE-FINDINGS.md"
  - "The full run 178-07-close: 444 of 444 in 116 projects, the first over 178-06's schema and templates and over this function"
affects: [178-08, 178-10, 178-12, 178-13, 178-19, 178-20, 178-23, 178-24]

actuals:
  tokens: 28937
  tasks: 3
  commits: 3
plan_head_before: b65999c8dd061f82906aa3a780c1f9b4101c4026
plan_head_after: 503a24fd95a2409e8a143457283a2b76ed65d420

tech-stack:
  added: []
  patterns:
    - "Two requests that run one order share one private function from the first check to the witness, and differ in a closure that settles whom to mail and which mail"
    - "A source-level property of a handler's branch is stated once per branch by name (describe.each), so a red run says which branch broke; whole-file counts are a property of their own that names every branch"
    - "A restated guard is proved by mutants made from a copy kept outside the repository, with the held file's digest recorded before and compared after"
    - "A live probe reads the subjects it expects from the tree's own module, so a served function that lags the tree fails a step"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/functions/account-access/contract.ts
    - apps/supabase/supabase/functions/account-access/contract.test.ts
    - apps/supabase/supabase/functions/account-access/signInLink.ts
    - apps/supabase/supabase/functions/account-access/signInLink.test.ts
    - apps/supabase/supabase/functions/account-access/linkIssue.ts
    - apps/supabase/supabase/functions/account-access/linkIssue.test.ts
    - apps/supabase/supabase/functions/account-access/index.ts
    - apps/supabase/supabase/functions/account-access/flowConformance.test.ts
    - .planning/phases/178-sign-in-email-code-registration/178-probe.mjs
    - .planning/phases/178-sign-in-email-code-registration/178-PROBE-FINDINGS.md

key-decisions:
  - "Probe row P1 reads held, so the first branch of ruling 2 is built: the recovery arm mints with the type recovery through its own dependency, mintRecoveryToken"
  - "The two issuers share attempt and issue, private to linkIssue.ts; each passes a closure that asks its own eligibility question and answers a recipient or null"
  - "The reading of the database's answer is a pure exported function of linkIssue.ts, readRecoveryEligibility, called by the handler's dependency, so it is a unit case and not only a line of a file vitest cannot import"
  - "buildSignInLink throws for a type outside the two, as callbackUrl throws for a locale outside the seven"
  - "The stack was restarted as the plan lays out although the function's row read EQUAL before it: the edge runtime's per_worker policy had already reloaded the source"

patterns-established:
  - "A plan that adds a call to index.ts moves a count in flowConformance.test.ts: p_project_id 5, generateLink( 3, EdgeRuntime.waitUntil( 2, ACCEPTED_BODY 3, linkIssueDeps( 3"
  - "The probe's cleanup removes the invitations naming one of its addresses, the witnesses a row opened and the mails the catcher holds for the addresses it asked for"

requirements-completed: [FIX-01, REG-10]

coverage:
  - id: D1
    description: "The function has a fourth operation, request-recovery: a project, an address, an optional locale and an optional witness and nothing else; it gets no answer of its own"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "apps/supabase/supabase/functions/account-access/contract.test.ts — the operation in each of its four describes; 12 of them red over the committed module (tests/e2e-runs/178-unit/178-07-fn-red.log), green after"
        status: pass
    human_judgment: false
  - id: D2
    description: "A recovery request runs the link issue's order with the database's recovery question in the place of the eligibility step; a recovery answer mints a recovery token and creates no account; a sign-in answer does what a link request does; no answer mints and mails nothing; a failed mint or send gives the slot back; the witness is completed on every path"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "apps/supabase/supabase/functions/account-access/linkIssue.test.ts — the seven describes titled issueRecoveryLink and the one titled readRecoveryEligibility, among them 'never calls createPasswordlessUser, so a recovery request creates no account'; 58 red over a blank stand-in, green after"
        status: pass
    human_judgment: false
  - id: D3
    description: "The mailed recovery link is the callback of the validated locale on the configured origin with exactly token_hash and type=recovery; nothing of the request reaches it"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "apps/supabase/supabase/functions/account-access/signInLink.test.ts — 'builds the link for %s of the type %s with exactly the two query parameters', 'writes the recovery link as the sign-in link with the type recovery and no other difference'"
        status: pass
      - kind: other
        ref: "node 178-probe.mjs fn, steps fn.07, fn.18 and fn.19 — tests/e2e-runs/178-unit/178-07-fn.log, exit 0, FN: held"
        status: pass
    human_judgment: false
  - id: D4
    description: "Each of the two link operations returns the answer it built before the hand-off, with no await in its branch, and its background function is the only caller of its issuer"
    requirement: REG-10
    verification:
      - kind: unit
        ref: "apps/supabase/supabase/functions/account-access/flowConformance.test.ts — 'the uniform answer of request-link', 'the uniform answer of request-recovery', 'the two link operations together, request-link and request-recovery'; three mutants of the recovery branch each red in a property naming request-recovery (tests/e2e-runs/178-unit/178-07-mutant-{await,answer,issuer}.log)"
        status: pass
    human_judgment: false
  - id: D5
    description: "On the restarted local stack: a recovery mail and a verifying recovery link for a grant holder; the sign-in mail for an invited address; nothing for an unknown address; nothing for a second request inside the minute nor for a recovery request straight after a sign-in request; seven equal answers"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "node 178-probe.mjs fn — 20 steps, every one made and as assumed; tests/e2e-runs/178-unit/178-07-fn.log"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-07-precommit — the invitation contract spec, 15 of 15, on the uncommitted function; 178-verdict control … --green: PASS"
        status: pass
    human_judgment: false
  - id: D6
    description: "The running stack serves the function as the tree holds it, and the suite is green on the same tests as before"
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-gates/178-07-close — seven rows at 0, stack among them; 178-verdict gates: PASS"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-07-close — 444 of 444 in 116 projects; 178-verdict e2e --same-projects-as 178-05-close: PASS"
        status: pass
    human_judgment: false
  - id: D7
    description: "The operation's answer says nothing about the address by its timing"
    verification: []
    human_judgment: true
    rationale: "No test can assert a timing. The property rests on the branch returning before its work, pinned by source and proved against three mutants; the live row's seven answers came back in 4 to 12 ms on the loopback interface, which is an observation and not a measurement of timing."

duration: 36min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 07: The Recovery Operation of the Edge Function, Served and Shown by a Live Run — Summary

**The `account-access` function has a fourth operation, `request-recovery`, that is answered with the one accepted body before any work and then runs the sign-in link's own pipeline with the database's recovery question in the place of the eligibility step: a recovery token and the recovery mail for an account that holds a grant, the ordinary sign-in mail for an address with only an invitation, nothing for anyone else, no account created, one slot shared with link requests; shown by a live row against the restarted stack (`FN: held`), by three refused mutants of the handler's branch, and by a full run of 444 of 444.**

## Read this first

- **Everything is green and nothing was retried.** Three commits, three verify blocks at exit 0, seven gate rows at 0, one control run and one full run, each made once.
- **The function's row of the stack probe read EQUAL *before* the restart.** `config.toml` sets the edge runtime's policy to `per_worker`, which reloads a function's source when a file changes, so the running runtime already served `request-recovery` from the uncommitted working tree. The sentence "the function's source is read when the stack starts" (the execution rules, § *The database, the function and the stack*; the research's Pitfall 9; the dispatch's "the `stack` row is red by design … until the restart of 178-07") did not hold for a function's **source** on this host today. The restart was made all the same, exactly as the plan lays it out. Nothing here says whether the functions' environment or the auth configuration need one: neither was changed.
- **The restart touched this project's stack only.** `yarn db:stop` (exit 0) then `yarn db:start` (exit 0), 33 seconds in all, 2026-10-12T18:37:04Z to 18:37:37Z. The ten containers of the other project and the Redis container kept their uptimes; the lists before, between and after are kept.
- **`yarn db:start` prints the local stack's API keys**, and my poll of its log printed them into this session once. They are the Supabase CLI's fixed local demonstration keys, not a secret of this deployment; the kept log is redacted in place (seven fields). See *Issues Encountered*.
- **The restated conformance test was proved against the three mutants the plan names**, each red in a property whose title names `request-recovery`, with every property that names only `request-link` passing in the same run.
- **Task 1 has no commit of its own**, as the plan's `<uncommitted_changes>` lays out: the eight files of the function are one commit, made after the live row and the control were green.

## Performance

- **Duration:** about 36 min
- **Started:** 2026-10-12T18:24:53Z
- **Completed:** 2026-10-12T19:00Z
- **Tasks:** 3
- **Files modified:** 10 (none created)

## Task Commits

1. **Task 1: The contract, the link's type and the recovery issuer** — no commit of its own; held in the working tree and committed in `1e21146b6`
2. **Task 2: The handler's branch, the conformance test, the restart and the live row** — `1e21146b6` (feat, the eight files of the function), `078bcb9cd` (chore, the probe), `503a24fd9` (docs, the probe findings)
3. **Task 3: The gate rows and the full run** — evidence only; this summary's commit

## Each task's verify command, with its real exit status

Each script is the plan's `<automated>` block byte for byte, written by `tests/e2e-runs/178-unit/178-05-extract-verify.mjs` and run with `bash`; its `.log`, `.exit` and `.head` are beside it.

| Task | Script | Tree it ran on | Exit |
|---|---|---|---|
| 1 | `178-07-t1-verify.sh` | `b65999c8d` with the six files of Task 1 uncommitted | **0** |
| 1, again | the same | `503a24fd9` | **0** |
| 2 | `178-07-t2-verify.sh` | `503a24fd9` | **0** |
| 3 | `178-07-t3-verify.sh` | `503a24fd9` | **0** |

None of the three blocks has a defect. One command of Task 2's **action** does not do what it says; see *Deviations* 1.

## Which branch of probe row P1, and the token it mints

`178-PROBE-FINDINGS.md` prints `P1: held`, so the first branch of ruling 2 is built. `LinkIssueDeps.mintRecoveryToken(address)` exists, and in `index.ts` it is `admin.auth.admin.generateLink({ type: 'recovery', email })`, returning `data.properties.hashed_token`. The link's `type` parameter is `recovery` too. For an address with no account the auth service answers an error to that call (404 `user_not_found`, row P1); the issuer treats it as any failed mint: the slot is given back, the witness reads `not-sent`, and nothing leaves the background work.

## What the two issuers share

Everything but the eligibility question. `linkIssue.ts` has two private functions:

- `attempt(request, deps, settle)` — the sign-up check, the locale and the callback, the redirect check, then `settle()`, then the token, the link, the mail, and the release on a failure;
- `issue(request, deps, settle)` — `attempt` inside the `try` whose `finally` completes the witness.

`settle` answers `{ address, mail, code }` or null. `issueSignInLink` passes a closure that asks `requestEligibility` and answers `{ address, mail: 'sign-in', code: request.code }`; `issueRecoveryLink` passes one that asks `recoveryEligibility` and answers `{ address, mail, code: null }`. Inside `attempt` the kind of mail picks three things: `mintRecoveryToken` alone, or `createPasswordlessUser` then `mintToken`; the link's type; the renderer. Both closures validate through one private `eligibility(address, mail)`: a non-empty string and one of the two words, or null.

`issueSignInLink` behaves as it did by its own cases: the cases that were in `linkIssue.test.ts` before pass without a changed expectation, and the invitation contract spec passed on the uncommitted function.

**Names the rules' table does not hold:** `readRecoveryEligibility(answer: unknown)` (reads the database's `{ email, mail }` into `{ address, mail }` or null), the types `MailKind` and `RecoveryEligibility`, and the constant `LINK_TYPES` from which `LinkType` is derived.

## The conformance properties as restated, by title

`describe.each` over the two operations gives each of these four titles twice, once with `request-link` and once with `request-recovery`:

- `the uniform answer of <operation> > returns after handing the work to EdgeRuntime.waitUntil, with no await in the <operation> branch`
- `… > builds the accepted answer before the hand-off of <operation> and returns that same value`
- `… > hands over the one background function of <operation>, which is the only caller of its issuer`
- `… > catches whatever the background function of <operation> meets, so the hand-off cannot reject`

Four of the two together, under `the two link operations together, request-link and request-recovery`:

- `are two branches of the handler, each found by its own condition`
- `hand work to the runtime twice in the whole handler, once each`
- `build the accepted answer twice in the whole handler, once each, beside its one import`
- `build the effects of an issue in their two background functions and nowhere else`

Under `the order of issue`, one restated and two added:

- `creates the user with the type invite, mints a sign-in token with the type magiclink and a recovery token with the type recovery` — three `generateLink` calls, their types in that order and no fourth
- `mints a recovery token without creating a user: the recovery arm of the issue holds no call of the account-creating dependency` — read from `linkIssue.ts`
- `asks the database which mail a recovery request earns, with the project and the address and nothing else`

One count moved in an existing property: `passes the request’s project to every database function that takes one` now finds five. The file's header says what it pins: four properties for each operation, four of the two together. 41 tests.

### The three mutants

Made by `tests/e2e-runs/178-unit/178-07-mutants.sh` from a copy of the held `index.ts` kept in the session's scratch directory, outside the repository; digest `3f2c5014…a35b` in `178-07-mutant-held.sha`, equal to the file's digest after the third mutant, before the control run, and in commit `1e21146b6`. The handler was not corrected afterwards, so the three were made once.

| Mutant | What the branch did | Exit | Properties that failed |
|---|---|---|---|
| `await` | awaited `issueRecoveryInBackground` in place of the hand-off | **1** | three of `the uniform answer of request-recovery` (returns after the hand-off; builds before the hand-off; hands over its one background function) and `hand work to the runtime twice …` |
| `answer` | returned `answer(ACCEPTED_BODY, 200)` built after the hand-off | **1** | `the uniform answer of request-recovery > builds the accepted answer before the hand-off of request-recovery and returns that same value` |
| `issuer` | handed `issueRecoveryLink(request, linkIssueDeps())` to the runtime itself | **1** | `the uniform answer of request-recovery > hands over the one background function of request-recovery, which is the only caller of its issuer` and `build the effects of an issue in their two background functions and nowhere else` |

In all three runs every property titled with `request-link` alone passed (37, 40 and 39 of 41 passed).

## Red before green

| Run | Tree | Result |
|---|---|---|
| `vitest run` on the three test files, the new cases over the committed `contract.ts` and `signInLink.ts` and over `linkIssue.ts` with two blank stand-ins — `178-07-fn-red.{log,exit,head}` | `b65999c8d` + tests + stand-ins | exit **1**: 86 failed of 299 (12 contract, 16 link builder, 58 issuer); every printed error an `AssertionError`, none a `TypeError`, an import failure or a timeout |
| the same after the three modules were written | `b65999c8d` + the six files | exit **0**: 299 of 299 |
| `yarn workspace @openvaa/supabase test:unit` at the close | `503a24fd9` | exit **0**: 18 files, 678 tests (534 before this plan) |

The stand-ins were `issueRecoveryLink` answering `not-sent` and `readRecoveryEligibility` answering null, appended to `linkIssue.ts` in the working tree and replaced when the module was written; without them the file fails on a call of `undefined`. A first red run had eight such `TypeError`s from indexing an empty list of calls; the cases were given `onlyCall` and `onlyMail`, which assert the length first, and the run was made again. The kept log is the second.

## The live row's steps, with their statuses

`node 178-probe.mjs fn`, started 2026-10-12T18:37:58Z, 21 seconds after the restart ended, on the tree that commit `1e21146b6` then held. **Exit 0; 20 steps, every one made, every observation as assumed; `FN: held`.** 3 password sign-ins and 1 link verification, as announced. The lines are in `178-PROBE-FINDINGS.md` § *Row FN* unchanged; in short:

| Steps | What | Read |
|---|---|---|
| fn.01 | the expected subjects read from `mailTemplates.ts` in the tree | made |
| fn.02–03 | the first grant holder: an account with a password, its invitation seeded and claimed on its own session; password set before | made; true |
| fn.04–05 | a recovery request for it | 200, the accepted body, 11 ms; the witness `sent` |
| fn.06–07 | its mail and link | one mail, the English recovery subject; one link, the English callback, exactly `token_hash` and `type=recovery`, no fragment |
| fn.08–10 | the token, the password, the account | verifies as `recovery` to a session; password fact and stored value unchanged; one user for the address |
| fn.11 | the same address again | the same answer, 4 ms; `not-sent`; still one mail |
| fn.12–13 | an address with an open invitation and no account | the same answer; `sent`; one mail with the sign-in subject, its link of the type `magiclink` |
| fn.14 | an address with neither | the same answer; `not-sent`; no mail; no user |
| fn.15–16 | the second grant holder: a link request, then at once a recovery request | `sent`, then `not-sent`; one mail, the sign-in mail |
| fn.17–19 | the third grant holder, with another site's `Origin` and `X-Forwarded-Host` and the locale `fi` | `sent`; the link's origin equals the first mail's and names the other site nowhere; the Finnish recovery subject and the Finnish callback |
| fn.20 | the answers | seven, equal in status and body; 4 to 12 ms |
| cleanup | | 4 users and 4 invitations removed, 0 left of either; 7 witnesses and 4 mails removed |

The cleanup line says "0 slot(s)": the trigger on a deleted invitation removes the `link:` keys of its address, so none was left for the probe's own statement. Read from the database after the run: 0 rows in `private.invitation_throttle`, 0 in `private.invitation_link_witness`, 0 invitations, 2 users, no grant without a user.

## The restart's two statuses, and the stack probe's rows

| | Command | What it touched | Exit |
|---|---|---|---|
| 1 | `yarn db:stop` (`supabase stop` in `apps/supabase`, project id `openvaa-local`) | the thirteen containers of `openvaa-local`; its answer names `"project_id_filter":"openvaa-local"` and `"backup":true` | **0** |
| 2 | `yarn db:start` (`supabase start` in the same directory) | the same thirteen, started again | **0** |

Run by `tests/e2e-runs/178-unit/178-07-restart.sh` in the background, after the in-flight check: 451 `started` markers, each with an `ended`; nothing on 5273; Docker VM 15.61 GiB free; no Playwright, wrapper or Supabase command in the process list; AC power. `docker ps` before, between and after is kept as `178-07-restart.containers-{before,stopped,after}`: between the two commands only `my-redis` and the ten `…_next-supabase-skimle2` containers ran, with the uptimes they had before; after, the same eleven with the same uptimes and the thirteen of `openvaa-local` at 11 to 24 seconds. Docker itself was not restarted. The Vite server of another repository on `[::1]:5173` was left alone.

`178-stack-probe.sh`, **before** the restart (exit 0) and **after** it (exit 0), read the same thirteen rows:

| Row | Before | After |
|---|---|---|
| container `GOTRUE_DISABLE_SIGNUP`, `GOTRUE_MAILER_AUTOCONFIRM` | true, false — OK | the same |
| settings `disable_signup`, `mailer_autoconfirm` | true, false — OK | the same |
| live `POST /signup`, `POST /otp` with `create_user` | 422 `signup_disabled` each — OK | the same |
| `GOTRUE_PASSWORD_MIN_LENGTH` / `minimum_password_length` | 6 / 6 — EQUAL | the same |
| `GOTRUE_HOOK_SEND_EMAIL_ENABLED` / `hook.send_email` | false / false — EQUAL | the same |
| **`account-access` `request-recovery` / `contract.ts`** | **`200 accepted` / `names it` — EQUAL** | **the same** |
| `SITE_URL`, `SMTP_HOST`, `SMTP_PORT` of the edge container | equal to the tracked template | the same |
| probe users | 0 found, 0 left — OK | the same |

## The control's verdict

`tests/e2e-runs/178-e2e/178-07-precommit`, the project `invitation-contract` with its setup, on head `b65999c8d` with the eight files of the function uncommitted (and the probe, under `.planning/`): **17 of 17 passed**, 15 of them in `invitation-contract`; preflight failures 0, successes 1. `178-verdict.mjs control 178-07-precommit --project invitation-contract --setup data-setup-base --dirty-only apps/supabase/supabase/functions/account-access/ --green`: **PASS**. A copy of each of the nine files as the run ran it is beside the run as `178-07-precommit.<file name>.kept`.

## The gate rows

**`tests/e2e-runs/178-gates/178-07-close`, head `503a24fd9`** — `178-verdict.mjs gates 178-07-close --rows typecheck,lint,unit,build,format,auth-config,stack`: **PASS**, seven expected and seven recorded, not stale, no Sleep entry in the window.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 21 |
| lint | 0 | 49 |
| unit | 0 | 78 |
| build | 0 | 17 |
| format | 0 | 22 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

**Beside the rows, on the eight files of the function, which `lint` and `typecheck` do not read:** `yarn eslint <the eight files>` exit **0**; `tsc --noEmit` exit **0** over all thirteen `.ts` files of `account-access` under an ad hoc configuration kept as `tests/e2e-runs/178-unit/178-07-adhoc-tsconfig.json` (strict, bundler resolution, `allowImportingTsExtensions`) with a shim kept beside it that maps the two `npm:` specifiers to the installed `@supabase/supabase-js` 2.117.2 and a minimal nodemailer and declares the `Deno` global; `yarn prettier --check` on the directory exit **0**; `yarn assert:comment-hygiene` exit **0** before the commit. `deno` is not installed on this host, so `deno check` was not run.

## The full run

**`tests/e2e-runs/178-e2e/178-07-close`, head `503a24fd9`** — 2026-10-12T18:45:00Z to 18:57:21Z, 12 min 21 s.

- **Totals:** 444 passed of 444; 0 failed, 0 flaky, 0 skipped, 0 did not run. Wrapper exit 0; not void; no Sleep, Wake or DarkWake entry in the window; AC power.
- **Against its predecessor `178-05-close`:** `178-verdict.mjs e2e 178-07-close --same-projects-as 178-05-close`: **PASS** — 116 projects compared, 0 not as expected; every project's total equals its predecessor's. This plan adds no test.
- **Docker VM free space before it:** 16.71 GiB (the driver's own reading, after its `docker builder prune -af`).
- **Axe findings and overflows:** none; no surface changed.
- The standing `TypeError: Cannot read properties of undefined (reading 'map')` of `Input.svelte` is once in the dev-server log, as in every full run.

This was the first full run over 178-06's schema and mail templates and over this plan's function. It found nothing of either.

## Decisions Made

- **P1 held → `mintRecoveryToken` with the type `recovery`.** Read, not chosen.
- **The shared part is two private functions and a closure**, not a flag: the issuers differ in one question, and a closure keeps the code that knows about a code out of the recovery path.
- **The answer's narrowing is in `linkIssue.ts`**, exported and unit-tested, and the dependency in `index.ts` calls it. The plan places the narrowing in `index.ts`; there it could be read by the conformance test only as text.
- **A link type outside the two throws.** The type is a TypeScript union, which a caller can cast around; the builder is the one place a link is made.
- **The restart was made although the probe showed it unnecessary for the source**: the plan's truth is "restarted after the change and before any verdict", the dispatch permits exactly that form, and a runtime started after the change leaves no question about what the live row ran against.
- Items PL-13, D-13, D-16 and D-18 were read by the operator on 2026-10-11 and stand at their recommended options; all are built so.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The mutant runs' command does not select the conformance test**
- **Found during:** Task 2, step 2
- **Issue:** the action gives `yarn workspace @openvaa/supabase test:unit -- flowConformance` as "the conformance test alone". Run on the unmutated tree it ran all 18 files (678 tests, exit 0): the `--` passes the word on as something vitest does not read as a filter. Without the `--`, the word matches three files, one in each function directory.
- **Fix:** the mutants were run with `yarn workspace @openvaa/supabase test:unit account-access/flowConformance` — one file, 41 tests.
- **Both statuses:** the plan's form, on the unmutated tree, exit 0 over the whole suite; the corrected form, exit 1 for each of the three mutants. The plan's form was not run on a mutant; it would have been red too, since the whole suite holds the same file. That is inferred.
- **Verification:** Task 2's verify reads the three logs and statuses and passed.

**2. [Rule 1 - Bug] Six arrow-function helpers in the two touched tests fail the lint rule the gate does not reach**
- **Found during:** Task 2, the ad hoc `eslint`
- **Issue:** `func-style` reported `count` and `npmImports` in `flowConformance.test.ts` and `record`, `failIf`, `steps` and `callsOf` in `linkIssue.test.ts`, all as they stood at this plan's base, beside one of my own and an import order of my own.
- **Fix:** each became a function declaration with the same body; mine were written so. No expectation changed.
- **Files modified:** the two test files
- **Committed in:** `1e21146b6`

### Other departures, none of them a fix

3. **No commit for Task 1 alone**, by the plan's `<uncommitted_changes>`; the dispatch's "commit each task atomically" gives way to it. Task 3 produces evidence and this file.
4. **The probe's grant holders sign in with their password to claim**, where the original's step 7 claims on a mailed link's session: three password sign-ins and one link verification, announced and counted. The claim itself is the same call.
5. **The probe's row has one step the plan does not list** (fn.19, the locale `fi` on the third grant holder's request), and reads its expected subjects from the tree's module instead of holding them as constants.
6. **The probe prints no address and no origin**, unlike the Phase 174 original whose lines name both; the rules of this phase forbid an address in kept evidence. An origin is compared and the result printed as a boolean.
7. **The probe's cleanup was widened** to the invitations, witnesses, slots and mails of its addresses; before, it deleted users and only counted invitations, which this row would have left behind and so failed the cleanup step.
8. **The red run was made over two blank stand-ins**, as plan 178-06's was.
9. **Tests beyond the plan's list.** Contract: a recovery request's `code`, `redirect_to`, `type` and `password` are not read; the module exports five fixed bodies and no sixth. Link builder: the two links differ in the type alone; seven values outside the set throw. Issuer: malformed answers of the eligibility dependency; the log never receives a locale a caller sent; `readRecoveryEligibility`.
10. **The reading named in the plan's `<context>` was kept short.** `178-PATTERNS.md` § *functions/account-access* and item 13, and `178-RESEARCH.md` § *Pattern 5*, § *Pitfall 6* and § *Pitfall 9*, were read **after** the work, as a check, and agree with it. `174-NAME-MAP.md`, § *Pitfall 7* and § *Don't Hand-Roll* were not read. Of `174-fn-probe.mjs` I read lines 76 to 475. `execute-plan.md` was not read; of the summary template, its frontmatter.
11. **`.planning/WINDOWS.md` was not written to.** No stub, no skipped test, no verify that was not run.

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug), 9 other departures
**Impact on plan:** none on scope. Deviation 1 is a command in the plan's action that later plans may copy.

## Issues Encountered

- **The local stack's keys were printed into this session once.** `supabase start` ends by printing the stack's addresses and keys as JSON, and my poll read the last lines of `178-07-db-start.log`. They are the CLI's fixed local demonstration keys (issuer `supabase-demo`), the same on every local stack, and nothing of a hosted project. The kept log was then redacted in place: seven fields read `<redacted>`. Nothing was deleted. A later plan that runs `yarn db:start` should not print that log's tail (*For later plans*).
- **The research's Pitfall 9 and the rules' sentence on the function's source did not hold as written**, as *Read this first* says. Not edited: both files are outside what an executor may change.
- Nothing else. No gate set or E2E run was in flight while a file of the tree was edited: every marker was waited for.

## The code-review checklist

| Item | Outcome |
|---|---|
| Solves the issue | the server half of FIX-01: the function issues a recovery link that carries a token hash and completes in any browser. The screens that ask it are plans 178-08 and 178-19 |
| OWASP top 10 | A01: the operation decides nothing itself; the database decides who is mailed, through a function only the service role can execute. A04: one answer built before the work for every address, pinned by source and by mutants; one slot per address across both operations, shown live in the order link then recovery. A07: no account is created by a recovery request, a unit case and a live step. A10/open redirect: the link is built from `SITE_URL`, the validated locale and the token by one builder; the request type holds no target; another site's headers reached nothing, live. A09: failures are logged by name and code through `describeFailure`; a case asserts no address, token hash, witness or caller's locale reaches the log |
| Code style guide | followed; `eslint` 0 on the eight files, which the gate does not read |
| No `any` | none added |
| No repeated code | the two issuers share `attempt` and `issue`; the parser's two link branches share `witnessOf`; both validations share `eligibility` |
| New entities documented | TSDoc on `RequestRecoveryRequest`, `LinkType`, `LINK_TYPES`, `MailKind`, `RecoveryEligibility`, `readRecoveryEligibility`, `issueRecoveryLink`, the two new dependencies, `issueRecoveryInBackground`; the three module headers say what the modules now hold |
| Repo documentation updated | **no — see "For later plans"**: the database skill, the docs pages and the README are not in this plan's files |
| Tracking events | not applicable: nothing a user can reach yet |
| Svelte component guidelines | not applicable |
| Errors handled and logged | every failure of the background work is an outcome and a log line of a fixed message with a name and a code; the handler's answer does not depend on it |
| Failing checks | none at the close |
| Dependents not unduly affected | `issueSignInLink`'s own cases unchanged and green; the invitation contract spec green on the uncommitted function; the full run equal to its predecessor in all 116 projects |
| WCAG, keyboard, screen reader | not applicable: nothing rendered changed |
| Developers' and Publishers' guides | as "Repo documentation updated" |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before the commit; every touched comment read; no id of a decision, plan, item or probe row in a comment or a title |
| Commit history | three commits, none a fix of another |
| Formatting separate | no formatting-only change |
| `[db]` tag | not applicable: no schema, migration or type file changed |
| Edge Functions: authority asked of the database | yes: `recovery_link_request`, as the service role, after the anonymous request is parsed. The function is anonymous by design and holds no rule of its own |
| Edge Functions: service role for privileged operations | yes, the one admin client of `linkIssueDeps` |
| Edge Functions: status codes | 200 with the accepted body for every well-formed request; 400 `bad-request` for a body with no address, a malformed address or a locale that is not a string |
| Supabase backend, Supabase adapter | not touched |

## Observed, and inferred

- **Observed:** the red run and its 86 expectation failures; the unit suite at 678; the three mutants' failures by title; the live row's twenty steps; both readings of the stack probe; the restart's two statuses and the three container lists; the control; the seven gate rows; the full run and its comparison; the database's rows after the probe and after the full run.
- **Observed, and contrary to what the plans assume:** the edge runtime served the uncommitted function before the restart.
- **Inferred, not observed:** that the plan's own form of the mutant command would have been red on each mutant; that the operation's timing carries nothing about an address (D7 above); that a recovery link opened in a browser through the callback behaves as the direct verification did (plan 178-19); that the slot is given back on a live failed mint or send (unit cases only); the reverse order of the shared slot at the function (asserted at the database by plan 178-06); that a hosted edge runtime, which does not reload, behaves as the restarted local one.
- **Not verified by `deno`:** the function was type-checked with `tsc` under a shim; `deno check` is not available here.

## Not done, or not verified

- Nothing of the plan is undone.
- **Documentation was not updated** (below).
- **The stack probe's function row cannot tell a stale runtime from a fresh one on this configuration**, since the runtime reloads. It still tells whether the tree's contract is served.
- `check-frontend` and the database rows were not run: no frontend or schema file changed, and the plan's closing rows do not include them.

## The state the local stack is left in

Up, restarted once by this plan at 18:37Z, serving the function of head `503a24fd9`. The database was not reset by this plan. After the full run it holds 2 auth users, 0 invitations, 3 projects, 23 rows in `private.invitation_link_witness` and 4 in `private.invitation_throttle` — the full run's, none of the probe's; so pgTAP test 238 of file 39 is red on it until the next reset, the known finding. No user whose address begins `r178-probe-`. Nothing listens on the E2E port 5273 and no `started` without an `ended` is under `tests/e2e-runs/`. Docker VM free space: 16.62 GiB after the full run. Power: AC throughout, 100 %.

## For later plans

- **Predecessor label for the next full run: `178-07-close`** — 444 tests, 116 projects, head `503a24fd9`.
- **178-08 — the wire.** `POST /functions/v1/account-access` with `{ operation: 'request-recovery', project_id, email, locale?, witness? }`. Every well-formed body is answered 200 `{ "accepted": true }`. 400 `{ "error": "bad-request" }` for no `email`, an `email` under 3 or over 320 characters or without `@`, and a `locale` that is not a string. No other key is read: not `code`, not a target. The locale is passed on as sent and resolved against the seven where the mail is rendered; an unknown one mails English.
- **178-10, 178-12, 178-19 — the mail and the link.** The recovery mail's subject is `RECOVERY_MAIL_TEMPLATES[locale].subject` (`RECOVERY_LINK_EMAIL_SUBJECT` for English). Its one link is `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=recovery`. A recovery request for an address that has only an open invitation is sent the **sign-in** mail, with `type=magiclink`: a spec that asks recovery for an invited address without an account must expect that subject.
- **178-12, 178-19 — the witness and the slot work as for a link request.** `invitation_link_witness_open` and `invitation_link_witness` are unchanged, and a recovery request carries `witness` in the same key. A recovery request and a link request for one address share the one-mail-a-minute slot; `invitation_link_release(p_project_id, p_email)` with no code gives it back for both. Deleting an invitation removes the `link:` slots of its address by trigger.
- **Every plan that edits `index.ts` (178-20, if the hook or anything else lands there) — the conformance test pins counts**: `p_project_id` 5, `generateLink(` 3 with the types `invite`, `magiclink`, `recovery` in that order, `EdgeRuntime.waitUntil(` 2, `ACCEPTED_BODY` 3, `linkIssueDeps(` 3, `createClient(` 2. A third operation that answers before its work joins `LINK_OPERATIONS` in the test and gets the four per-operation properties for free.
- **Anything that builds a `LinkIssueDeps`** supplies `recoveryEligibility` and `mintRecoveryToken`; **anything that calls `buildSignInLink`** passes `type`.
- **A function's source is served without a restart on this host.** The edge runtime's policy in `config.toml` is `per_worker`, which reloads on a file change. The dispatch's sentence that the `stack` row is red between the commit that adds `'request-recovery'` and this plan's restart did not come true: the row was EQUAL before the restart. **178-20:** whether `[auth]` keys and the functions' environment need the restart was not tested here; assume they do, as the rules say, and read the stack probe before the restart to find out.
- **Do not print the tail of a `yarn db:start` log** (178-20, the bank-auth driver's restore in 178-24): its last lines are the stack's keys. Read the `.exit` marker and `docker ps` instead.
- **Running one test file of the functions:** `yarn workspace @openvaa/supabase test:unit account-access/flowConformance`. With `--` before the word nothing is filtered; without a directory the word `flowConformance` matches three files.
- **Running the probe's row `fn` again** needs no restart and leaves nothing behind; it makes 3 password sign-ins and 1 link verification. Rows `p5` and `p6` (178-20) keep their place in `ROWS`; `fn` is after `p7`. The cleanup now also deletes every invitation whose address begins `r178-probe-`.
- **178-23 — documentation this plan made out of date, none of it edited:**
  - `.claude/skills/database/SKILL.md`, Service Patterns § 1: `account-access` is described with three operations and one `magiclink` mint; it has four, and a `recovery` mint that creates no user. RLS and Auth Patterns § 10 already lacks the recovery request (plan 178-06's list).
  - `apps/docs` `developers-guide/backend/edge-functions` and `backend/authentication`: the function's operations, and how a password is recovered.
  - `apps/supabase/README.md` where it describes `account-access`.
  - `178-EXECUTION-RULES.md` § *The database, the function and the stack* and `178-RESEARCH.md` § *Pitfall 9* say a function's source is read when the stack starts; on the `per_worker` policy it is reloaded. Reported, not edited.
- **Read from the database after a full run: 3 projects**, where a reset database has 2. Not looked into; not this plan's.
- **Timing on this host today:** the unit suite of the functions under a second; the restart 33 s; the live row about 15 s; the control 10 s of tests; the seven gate rows 3 min 9 s; the full run 12 min 21 s.

## Prohibitions

| Id | Statement | Held | How |
|---|---|---|---|
| PROH-178-19 | the recovery operation never answers 404, 422 or any other status because the auth service did for an address it does not know | yes | the branch returns the answer it built before the hand-off and holds no `await`, pinned for `request-recovery` by name and proved against three mutants; `mintRecoveryToken`'s error is thrown inside the background work and caught by the issuer; live, an address with neither an account nor an invitation was answered as the others were |
| PROH-178-20 | no log line of the function holds an address, a token, a token hash, a link or a locale string a caller sent | yes | the issuer logs through `say` with a fixed message and `describeFailure`; the one new log call of `index.ts` is a fixed message with `describeFailure(error)`, under the conformance test's rule on every `log(` call; a case over thirteen paths of `issueRecoveryLink` finds none of the address, the two token hashes, the witness, `token_hash=` and a caller's locale in what the logger received |
| PROH-178-21 | `contract.ts`, `linkIssue.ts`, `signInLink.ts` and `mailTemplates.ts` gain no Deno import, no URL import and no reference to the Deno global | yes | Task 1's verify strips comments and searches the three it changed for `npm:`, `https:`, `jsr:` and `Deno.`; `mailTemplates.ts` is untouched; each header still says so and is true |

## Threat Flags

None. The plan's register covers what was built: one more operation on the one anonymous endpoint, one more admin call of the auth service inside the background work, one more mail text sent from the deployment's address. No endpoint, table, schema or file access was added.

## Known Stubs

None. The two stand-ins of the red run were never staged and are gone.

## Next Phase Readiness

Ready for plan 178-08. The Edge Function issues recovery links on the sign-in link's pipeline and slot, the local stack serves it, and the committed tree is green on seven gate rows and on a full run equal to its predecessor. Nothing calls the operation yet: the writer's method is 178-08's and the screens are 178-19's.

## Self-Check: PASSED

- Commits `1e21146b6`, `078bcb9cd` and `503a24fd9` are ancestors of HEAD; `git rev-list --count b65999c8d..HEAD` was 3 before this file's commit.
- Found on disk: the ten modified files; `tests/e2e-runs/178-gates/178-07-close/summary.tsv`; `tests/e2e-runs/178-e2e/178-07-precommit` and `178-07-close` with their `ended` markers; under `tests/e2e-runs/178-unit/` the red log with its status and head, the live row's log and status, the three mutant logs and statuses with the digest, and the three verify scripts with their logs and statuses.
- Each `must_haves.artifacts` string is in its file (`'request-recovery'` in `contract.ts`, `export async function issueRecoveryLink` in `linkIssue.ts`, `LinkType` in `signInLink.ts`) and each `key_links` pattern too (`issueRecoveryLink` and `recovery_link_request` in `index.ts`).
- `git status --short` before this file was written: `?? CAND-APP-PLAN.md` and nothing else.
