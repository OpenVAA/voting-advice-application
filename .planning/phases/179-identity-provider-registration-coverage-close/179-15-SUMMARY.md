---
phase: 179-identity-provider-registration-coverage-close
plan: 15
subsystem: identity-callback
tags: [edge-function, identity-provider, server-credential, e2e, harness, security]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-09 serverCredential.ts (SERVER_CREDENTIAL_HEADER, presentsServerCredential); 179-13 the function on the new contract with the legacy body still answered; 179-14 the SvelteKit callback as the function's only caller"
provides:
  - "identity-callback refuses every caller without the x-identity-callback-secret header (401 refused) before anything else is read; a wrong secret is refused; an unset secret is `configuration`"
  - "identity-callback's request requires a uuid project_id; the function reads no PUBLIC_PROJECT_ID and answers no session.action_link"
  - "$lib/server/constants.IDENTITY_CALLBACK_SERVER_SECRET; the callback sends the header and answers configuration_error without invoking when the value is empty"
  - "tests/scripts/e2e-run.sh generates one secret per run for the Edge file, the dev server and Playwright (playwright.env)"
  - "contestant-bank-auth.spec.ts calls the function as the server does and holds two refusal cases (bank-auth 9 -> 11, suite 572 -> 574)"
  - "gate row fn-closed in 179-gates.sh; the identity-callback refusal row in 179-stack-probe.sh"
  - "disposition 'identity-callback': 'requires a project term' in scripts/assert-project-scoped-queries.mjs"
affects: [179-16, 179-19, 179-21, 179-22, 179-23, 179-24]

tech-stack:
  added: []
  patterns:
    - "A per-run shared secret generated inside the wrapper's Node generator (crypto.randomBytes), written only into 0600 files in a temporary directory outside the repository and sourced into each process tree that needs it"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/functions/identity-callback/requestContract.ts
    - apps/supabase/supabase/functions/identity-callback/requestContract.test.ts
    - apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts
    - apps/supabase/supabase/functions/identity-callback/envReadSites.test.ts
    - apps/supabase/supabase/functions/identity-callback/registrationMatrix.test.ts
    - apps/supabase/supabase/functions/.env.example
    - apps/supabase/supabase/config.toml
    - scripts/assert-project-scoped-queries.mjs
    - scripts/fixtures/project-scoped-queries/clean.fixture.ts
    - scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts
    - packages/dev-seed/tests/projectScopingGate.test.ts
    - apps/frontend/src/lib/server/constants.ts
    - apps/frontend/src/routes/api/oidc/callback/+server.ts
    - apps/frontend/src/routes/api/contestant/preregister/+server.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
    - .env.example
    - tests/scripts/e2e-run.sh
    - tests/tests/specs/contestant/contestant-bank-auth.spec.ts
    - tests/README.md
    - tests/IDURA-TEST-RUNBOOK.md
    - .planning/phases/179-identity-provider-registration-coverage-close/179-gates.sh
    - .planning/phases/179-identity-provider-registration-coverage-close/179-stack-probe.sh
    - .planning/todos/pending/2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md
    - .planning/todos/pending/2026-08-28-edge-runtime-secrets-local-wiring.md

key-decisions:
  - "The `[edge_runtime.secrets] PUBLIC_PROJECT_ID` entry is KEPT, its comment rewritten to name send-email: PL-14's removal rested on 'no function reads it', and send-email still reads it through requireEnv (PL-14's recorded other option)"
  - "The function reads the secret with a literal requireEnv('IDENTITY_CALLBACK_SERVER_SECRET', Deno.env.get(...)) after the missing-header refusal, so assert:edge-function-env derives the name; neither side trims the value"
  - "The callback writes the header name once, inline in the invoke, and the function's conformance suite reads that line from the callback's source and compares it with SERVER_CREDENTIAL_HEADER"
  - "The callback checks the secret after the project resolves and before the settings read, so an unconfigured server makes no request at all"
  - "Playwright gets the secret from its own file (playwright.env) holding that one variable, not the dev server's identity-provider environment"
  - "The legacy preregister route names the project in its invoke (constants.PUBLIC_PROJECT_ID) so the project-scoping guard holds; it sends no secret and is refused by the function, as the plan intends until 179-21 deletes it"

requirements-completed: []

actuals:
  tokens: 28716
  tasks: 3
  commits: 2
plan_head_before: 4f717b82d5e05abbb943518a8ce8888c23177e39
plan_head_after: a1eb8378389bacd8979a6c22659952f2bb3169ed

metrics:
  duration: "about 45 min of host clock (05:59Z to about 06:45Z, 2026-10-22), two full E2E runs included"
  completed: 2026-10-22
---

# Phase 179 Plan 15: identity-callback closed to server callers, with a strict contract Summary

**`identity-callback` now answers the frontend server alone. A request without the `x-identity-callback-secret` header gets `401 {"result":"refused"}` before the function reads its body, its configuration or the token, and a request with another secret gets the same answer. The secret is read through a literal `requireEnv('IDENTITY_CALLBACK_SERVER_SECRET', …)`, so an unset value is `configuration` (500), never an open door. The request must name its project as a uuid; the function reads no `PUBLIC_PROJECT_ID` and no longer answers `session.action_link`. The SvelteKit callback sends the secret from `$lib/server/constants` and answers `configuration_error` without invoking when it is empty. The E2E wrapper generates one secret per run for the edge runtime, the dev server and Playwright, and the direct-call spec calls the function as the server does and asserts both refusals. A gate row and a stack-probe row show the served function refusing an anonymous call. Held run and close: 574/574.**

## Task commits

| Task | Commit | What |
|---|---|---|
| 1 + 2 | f54c68c8e | `feat(179-15)`: the function, the contract, the callback, the constants, both templates, the wrapper, the spec, the disposition and the guard's fixtures — one held set, committed after `179-15-held` was green |
| 3 | a1eb83783 | `docs(179-15)`: the README and the runbook, the gate row `fn-closed`, the stack-probe row, the two todos |

## What was built

### The function (`identity-callback/index.ts`)

After the method checks, inside the outer try:

1. `req.headers.get(SERVER_CREDENTIAL_HEADER)`; missing or empty → `respond(refused)`.
2. `requireEnv('IDENTITY_CALLBACK_SERVER_SECRET', Deno.env.get('IDENTITY_CALLBACK_SERVER_SECRET'))`; unset → throws `ERR_ENV_UNCONFIGURED` → the catch answers `configuration`.
3. `presentsServerCredential(presented, secret)` (179-09's constant-time compare); false → `respond(refused)`.
4. Then the provider type, the body, `parseIdentityCallbackRequest`, `const projectId = request.projectId;` and the rest as 179-13 left it.

`respond(result, token?)` builds the body with `resultBody` alone: `{ result, token }` on success, `{ result }` otherwise. The header comment states why the function answers the server alone (a stolen or replayed ID token presented directly gets nothing; an anonymous caller makes the function do no work). The CORS headers do not list the credential header.

### The contract (`requestContract.ts`)

`projectId` is a `string`. A body with an absent, null or non-uuid `project_id` parses to null (`bad_request`).

### The callback (`routes/api/oidc/callback/+server.ts`)

After the data provider resolves the project, `constants.IDENTITY_CALLBACK_SERVER_SECRET` is read; empty → `configuration_error`, nothing invoked, nobody signed in. The invoke carries `headers: { 'x-identity-callback-secret': serverSecret }`.

### The wrapper (`tests/scripts/e2e-run.sh`)

The inline generator makes `randomBytes(32).toString("hex")` and writes it as `IDENTITY_CALLBACK_SERVER_SECRET` into `edge.env`, `frontend.env` and a new `playwright.env` (mode 0600, in the temporary directory outside the repository). The Playwright subshell sources `playwright.env`. The file joins the preparation's existence check and the cleanup's by-name removal. The secret is never printed, never on a command line and never in the run directory. `PUBLIC_PROJECT_ID` stays in the Edge file: `send-email` reads it.

### The spec (`contestant-bank-auth.spec.ts`)

- `callFunction(body, credential = secret)` sends the anon key and the header; the secret is read in `beforeAll` from the environment, with a throw naming the variable.
- Test 1 asserts the success body's keys are exactly `result`, `token`; test 3 asserts the same in place of `session.action_link`.
- The invalid-token test names the project (the strict contract would otherwise answer `bad_request`).
- **New:** a call without the header and a call with another secret, each with a valid token for a third identity on the open project, answer `401 {"result":"refused"}` and no account exists for the identity.

### The probes

- `179-gates.sh` row `fn-closed` (in `ALL_ROWS` and `DB_ROWS`): an anonymous POST with the anon key and a well-formed body must answer status 401 with result `refused`. The key goes to curl on standard input; only the status and the result word are printed.
- `179-stack-probe.sh` row 13: the same request; EQUAL when it answers `401 refused` and `index.ts` calls `presentsServerCredential(`.

## Runs

| Run | Tree | Result | Verdict |
|---|---|---|---|
| `179-unit/179-15-t1-red` (`.log`, `.junit.xml`, `.json`, `.classifier`, `.head`) | the contract, conformance and read-site cases against HEAD 4f717b82d's function | exit 1, 14 failed (all expectation failures) | `gsd-tools check tdd-red-evidence`: **RED_EVIDENCE_OK** (`target_test_failed`, target `identity-callback flow conformance > the caller > is refused at once without the header, before the configured secret is read`) |
| `179-unit/179-15-t2-red` | the callback cases against HEAD's callback | exit 1, 3 of 64 failed | **RED_EVIDENCE_OK** (target `… > answers an unset server secret as configuration_error, invoking nothing and signing nobody in`; assertion: redirect location mismatch) |
| `179-unit/179-15-supabase-unit`, `179-15-frontend-unit`, `179-15-devseed-scoping`, `179-15-lint` | held set | all exit 0 (`lint:check` includes `assert:edge-function-env`, `assert:project-scoped-queries` with its self-test, `assert:test-keys-scope`) | — |
| `179-e2e/179-15-held` | held set at 4f717b82d | **574/574**, wrapper exit 0, `restore: ok`, `prepare: ok`, no void marker | plan's form **FAIL** at the path form only (three held files outside its `--dirty-only` list; see Deviation 3); restated `--same-projects-as 179-14-close-r2 … --dirty-only scripts/ --dirty-only packages/dev-seed/tests/projectScopingGate.test.ts`: **PASS**, 128 projects, `bank-auth` 9 → 11 (`9+2 = 11 holds`), every other project equal (`_drivers/179-15-held.verdict-{plan,restated}.log`) |
| `179-gates/179-15-fn` | committed a1eb83783 | `fn-closed` 0 (`status 401, result refused`), `stack` 0 (row 13 `401 refused / checks it EQUAL`) | `179-verdict gates 179-15-fn --rows fn-closed,stack`: **PASS** |
| `179-e2e/179-15-close` | committed a1eb83783 | **574/574**, driver and wrapper exit 0, `restore: ok`, `sleep_entries_in_window: 0`, AC power | `179-verdict e2e 179-15-close --same-projects-as 179-15-held`: **PASS**, 128 projects |

Held copies: the 19 held files are kept as `tests/e2e-runs/179-e2e/179-15-held.<path with / as __>.kept`, each byte-identical (`cmp`) to what f54c68c8e committed.

**The secret in the evidence (observed):** no file under `179-15-held/` or `179-15-close/` names `IDENTITY_CALLBACK_SERVER_SECRET`. One 64-hex string occurs in each run's `devserver.log` (line 3), inside the `supabase status` JSON that root `yarn dev` prints at start; the same line holds one in `179-14-close-r2/devserver.log` before this plan. It is the stack's own key material (179-05's carried item: kept evidence holds the local stack's keys), not this plan's secret, which no status output contains.

## Verify blocks (`tests/e2e-runs/179-unit/179-15-t{1,2,3}-verify*.{sh,log,exit,head}`)

- **Task 1** as written: exit 1, at `{ grep -q -F "PUBLIC_PROJECT_ID" config.toml; test $? -eq 1; }` (Deviation 1). Restated with that stage replaced by `grep -q -F "# send-email requires this variable and refuses to run without it." config.toml`: exit **0** before the commit and again at a1eb83783 (`-restated-final`).
- **Task 2** as written: exit 1 at the first `yarn -s` (Yarn 4.18.1: `Unsupported option name ("-s")`, captured in `179-15-yarn-s.log`). Restated (`yarn` for `yarn -s`; the held verdict as restated above): exit **0** at f54c68c8e.
- **Task 3** as written: exit **0** at a1eb83783.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Premise false] `config.toml` keeps `[edge_runtime.secrets] PUBLIC_PROJECT_ID`.**
- **Found during:** Task 1. PL-14 removes the entry "when no function reads it". `send-email/index.ts` reads `requireEnv('PUBLIC_PROJECT_ID', …)` and refuses a request whose `project_id` differs; removing the entry would take the only configured route for that variable away from `send-email` in the default local runtime.
- **Fix:** PL-14's recorded other option — kept, comment rewritten to name `send-email`; the `[functions.identity-callback]` comment now says the function refuses callers without the server's secret. The functions template's project block names `send-email` and `account-access` only. Task 1's acceptance line "config.toml holds no PUBLIC_PROJECT_ID" is not met; its verify is restated as above.

**2. [Rule 3 - Blocking] The project-scoping guard's fixtures and the legacy route.**
- With `identity-callback` dispositioned `requires a project term`, the guard reported three invocations without a project term: `clean.fixture.ts` (`deploymentScopedInvocation`), the two in `outside-boundary.clean.fixture.ts`, and `routes/api/contestant/preregister/+server.ts`.
- **Fix:** the fixtures' methods carry `project_id` and are renamed `snakeCaseProjectTermInvocation`, `projectTermInvocation`, `optionalChainedProjectTermInvocation`; the guard's self-test matches its committed expectation (counts unchanged). `packages/dev-seed/tests/projectScopingGate.test.ts`' docblock names the renamed method (its "moved the counts" measurement was not re-run for the new shape: inferred to hold, since the method is still a counted site). The legacy route's invoke names `constants.PUBLIC_PROJECT_ID`; it sends no secret, so the function refuses it (the plan's "refused from here on"; 179-21 deletes it). Its 7 unit tests pass unchanged.

**3. [Rule 3 - Blocking] The held verdict's paths and baseline.** The plan's form names `--same-projects-as 179-14-close` (voided by sleep) and `--dirty-only` paths that miss Deviation 2's three files. Both forms kept; the restated one uses `179-14-close-r2` and adds `scripts/` and `packages/dev-seed/tests/projectScopingGate.test.ts`.

**4. [Rule 3 - Blocking] `registrationMatrix.test.ts`** (not listed) parsed a body without a project; its case now names one. The faction refusal it pins is unchanged.

**5. [Rule 3 - Recurring] `yarn -s`** is refused by Yarn 4.18.1; both forms of the Task 2 block are kept.

### Spec body changes the plan foresaw only in part

The plan foresaw the two refusal cases and the header. Three further edits of existing test bodies follow from the strict contract: test 1's expected keys lose `session`; test 3's `session.action_link` assertions become "the body is exactly `result`, `token`"; the not-a-JWT test names the project. All three are in the held run.

### Documentation beyond the plan's list

`.env.example`'s identity-provider preface said `identity-callback` requires seven variables and answers `{"error":"Internal server error"}`; it now says six (the secret among them) and `{"result":"configuration"}`.

**Files touched that the plan did not list:** `apps/supabase/supabase/functions/identity-callback/registrationMatrix.test.ts`, `scripts/fixtures/project-scoped-queries/clean.fixture.ts`, `scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts`, `packages/dev-seed/tests/projectScopingGate.test.ts`, `apps/frontend/src/routes/api/contestant/preregister/+server.ts`.

## Carried items

1. **(179-09) `IDENTITY_CALLBACK_SERVER_SECRET` required by `assert:edge-function-env`** — settled: the literal `requireEnv` in `index.ts`; the guard derives 11 names, the secret among them, and the functions template declares it with a placeholder value only (`<shared-server-secret>`); `assert:edge-function-env` exit 0.
2. **(179-13) The runbook's "Expected" paragraph** — settled: it says `hetu` and `birthdate` are absent from `app_metadata` (and removed from an older account), the success body is exactly `result` and `token`, and the two refusals.
3. **(179-14) `bank-auth-journey` in `tests/README.md` and the runbook** — settled in both: the project table row, the environment paragraph and the "Full-browser journey" section (spec, chain, run command, chain note) now describe `contestant-identity-provider`; `git grep bank-auth-journey` finds nothing in either file. Left for **179-22**: the runbook's flow overview, Step 6 and "Key files" still describe the `/contestant/preregister` chain (179-22 rewrites every remaining mention of that chain).

## Code review checklist (`.agents/code-review-checklist.md`)

- **Solves the issue:** J4 and J5 as the plan states (REG-04/REG-06 advanced; `requirements-completed` empty as the plan says).
- **OWASP:** T-179-151 (refusal before anything is read; E2E refusal cases; live gate and probe rows), T-179-152 (no `listUsers` paging for an anonymous call: the refusal precedes the body), T-179-153 (unset secret → `configuration`; missing header refused before the read), T-179-154 / PROH-179-24 (generated per run inside Node, 0600 files outside the repository, never printed; templates hold names and placeholders only; no service-role key handed to the frontend), T-179-155 (179-09's constant-time compare), T-179-156 (project required and uuid-validated).
- **`any`:** none added.
- **Repetition:** the header name is written twice (the function's constant and the callback's literal); the function's conformance case holds them equal.
- **Documentation:** TSDoc and the function's header; both templates; README, runbook, todos.
- **Tracking, Svelte, WCAG, keyboard:** no UI change.
- **Errors:** the callback logs only the closed code; the function answers one closed result, nothing interpolated.
- **Shared dependencies:** `send-email` keeps its `PUBLIC_PROJECT_ID` (Deviation 1); the full suite is green twice at 574.
- **Edge Functions section:** the function acts for no signed-in caller; its first gate is now the server credential, before any service-role client exists.
- **Comment hygiene:** `assert:comment-hygiene` 0 before both commits; no ids or history in touched comments.
- **Commits:** two, linear; no `[db]` change.

## User setup (operator)

`IDENTITY_CALLBACK_SERVER_SECRET`: one random value of at least 32 bytes per deployment (e.g. `openssl rand -hex 32`), set as a function secret of `identity-callback` and as a private environment variable of the frontend service, the same value on both. Locally: the root `.env` and `apps/supabase/supabase/functions/.env` carry the same value (only needed to use bank sign-in on a hand-started stack; E2E runs generate their own). Until the operator sets it locally, a hand-started stack's bank sign-in ends on `configuration_error`.

## CLAUDE.md sentences made false (not edited)

- § Development Environment, *Project scoping*: "The `identity-callback` Edge Function reads the same variable under the same name; the local edge runtime resolves it from the **process environment** rather than from the root `.env`, so export it in the shell that starts the stack when you need that function locally." Proposed: "The `send-email` Edge Function reads the same variable under the same name; the local edge runtime resolves it from the **process environment** rather than from the root `.env`, so export it in the shell that starts the stack when you need that function locally. `identity-callback` reads no project from its environment: the request names it."
- § Backend, *Auth* (not false, incomplete): "completed by the `identity-callback` Edge Function" could add "which answers the frontend server alone, proven by the shared `IDENTITY_CALLBACK_SERVER_SECRET`".

## Items to report rather than edit

- **Database `SKILL.md`** § Service Patterns 1 and § 7 (identity-callback's required variables: now the five provider variables and `IDENTITY_CALLBACK_SERVER_SECRET`; no `PUBLIC_PROJECT_ID`, no `SITE_URL`; the server credential). 179-22 lists `SKILL.md`.
- **`apps/docs/.../configuration/environmental-variables/+page.md`** lists the identity-provider variables and not `IDENTITY_CALLBACK_SERVER_SECRET`; listed by no later plan I found (179-22 or 179-23). The bank-authentication guide and the edge-functions page (179-22) need the variable too.
- **`apps/supabase/README.md`** identity-callback bullet (same gap as 179-10/179-13).
- **Kept evidence holds the local stack's key material** in `devserver.log` (179-05's carried item, unchanged by this plan).
- **Task 2's restated verify** was run at f54c68c8e, not re-run at a1eb83783 (the later commit changes only docs and planning files).

## Statements observed and inferred

- **Observed:** every run, count and verdict above; both red runs and their classifications; the refusal of an anonymous call by the served function (held and close spec cases, gate row, probe row); the absence of the variable name from both run directories; the guard's self-test counts.
- **Inferred:** that the 64-hex string in `devserver.log` is the stack's status output and not the secret (it sits inside the `supabase status` JSON and occurs there before this plan); that the renamed fixture method still moves the guard's counts when deleted; that a hosted gateway forwards the custom header (not observed; recorded in the hosted-checklist todo).

## Known Stubs

None.

## Threat Flags

None beyond the plan's register.

## Self-Check: PASSED

- Commits f54c68c8e and a1eb83783 are ancestors of HEAD; `git rev-list --count 4f717b82d..HEAD` = 2 before this summary's commit.
- `tests/e2e-runs/179-e2e/179-15-held/results.json` and `179-15-close/restore.txt` (`restore: ok`) exist; `tests/e2e-runs/179-gates/179-15-fn/summary.tsv` holds both rows at 0.
- `git grep bank-auth-journey -- tests/README.md tests/IDURA-TEST-RUNBOOK.md` finds nothing.
- STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT, RESEARCH, PATTERNS, UI-SPEC and CLAUDE.md were not touched.
