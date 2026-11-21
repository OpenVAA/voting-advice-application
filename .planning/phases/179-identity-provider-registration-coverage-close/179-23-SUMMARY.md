---
phase: 179-identity-provider-registration-coverage-close
plan: 23
subsystem: e2e-coverage-and-backlog
tags: [e2e-01, e2e-02, playwright, coverage-tags, todos, identity-provider, oidc]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-05 the identity-provider projects in every default run; 179-14..20 the @reg-idp scenarios; 179-21 the deletion of the legacy chain; 179-22 the docs note of the discards-email todo honoured"
  - phase: 178-sign-in-email-code-registration
    provides: "the email and code registration specs that now carry @reg-email, @reg-code and @org-registration"
  - phase: 177
    provides: "the nomination editor tests that carry @nomination-definition"
  - phase: 173
    provides: "contestant-entity-selection.spec.ts, now tagged @entity-selection"
provides:
  - "scripts/assert-e2e-coverage-tags.mjs (`yarn assert:e2e-coverage-tags`, `--input`, `--self-test`): the census of the default E2E run by Playwright's own JSON list; exit 1 naming each of the six tags with no test"
  - "Its fixture pair, and the gate row `coverage-tags` in 179-gates.sh (self-test, then the census)"
  - "@reg-email, @reg-code, @org-registration and @entity-selection on the covering tests of Phases 173 and 178"
  - "Eleven todos closed with their evidence; three re-anchored; six filed"
affects: [179-24, milestone-audit]

tech-stack:
  added: []
  patterns:
    - "A coverage claim read from Playwright's own list (`--list --reporter=json`, `PLAYWRIGHT_JSON_OUTPUT_FILE`), each test's `tags` the unit: a title tag and an options tag count alike, a word in a title or a comment does not"

key-files:
  created:
    - scripts/assert-e2e-coverage-tags.mjs
    - scripts/fixtures/assert-e2e-coverage-tags.list.json
    - scripts/fixtures/assert-e2e-coverage-tags.expected.violations
    - .planning/todos/pending/2026-10-21-179-identity-lookup-pages-every-auth-user.md
    - .planning/todos/pending/2026-10-21-179-account-linking-for-two-accounts-of-one-person.md
    - .planning/todos/pending/2026-10-21-179-identity-provider-sign-in-while-answers-locked.md
    - .planning/todos/pending/2026-10-21-179-observe-default-on-identity-provider-specs-in-ci.md
    - .planning/todos/pending/2026-10-22-179-auth-service-email-change-tells-taken-addresses-accepted.md
    - .planning/todos/pending/2026-10-22-179-mock-issuer-survives-a-void-run.md
  modified:
    - package.json
    - .planning/phases/179-identity-provider-registration-coverage-close/179-gates.sh
    - tests/tests/specs/contestant/contestant-email-registration.spec.ts
    - tests/tests/specs/contestant/contestant-code-registration.spec.ts
    - tests/tests/specs/contestant/contestant-entity-selection.spec.ts
    - .planning/todos/pending/2026-10-02-oidc-callback-does-not-verify-nonce.md
    - .planning/todos/pending/2026-10-07-174-identity-provider-registration-never-claims-an-invitation.md
    - .planning/todos/pending/2026-10-01-identity-callback-compensating-delete-failure.md
  moved:
    - "eleven todos from .planning/todos/pending/ to .planning/todos/done/ (listed below)"

key-decisions:
  - "The census runs Playwright itself with the selection of the root `test:e2e` script and has the JSON reporter write to a file of its own (`PLAYWRIGHT_JSON_OUTPUT_FILE`), because the config's dotenv line goes to stdout ahead of the JSON. A test tagged `@probe` is never counted, so `--input` of a list made without the filter still yields the default run's census"
  - "A list that cannot be produced or read is exit 2, not a pass: a Playwright failure, a listing error recorded in the JSON, unreadable JSON or a list with no test"
  - "Tags go in the options form the nominations spec uses (`{ tag: … }`), so no title and no test id changes: the lists before and after the tags hold the same 613 ids, titles and projects"
  - "`@entity-selection` is on each of the spec's eight tests, the one-entity and nothing-to-edit branches of the root's selection decision included, per the plan's 'each'"
  - "Two todos beyond the plan's four were filed at the orchestrator's direction: the operator-accepted email-change oracle, as an accepted residual with its revisit trigger, and the mock issuer left on 9443 after a void run"

requirements-completed: [E2E-01, E2E-02]

estimate:
  tokens: 70000
actuals:
  tokens: 31000
  tasks: 3
  commits: 3
plan_head_before: 3e0377ea6708df8245f109419b5e4e8413545036
plan_head_after: df48d0981
metrics:
  duration: "about 39 min of host clock (13:02Z to 13:41Z, 2026-10-22), two full E2E runs included"
  completed: 2026-10-22
---

# Phase 179 Plan 23: The coverage proof and the todos Summary

**E2E-01 and E2E-02 are now a command. `yarn assert:e2e-coverage-tags` lists the default E2E run with Playwright's own JSON reporter and fails, naming the tag, when any of `@reg-idp`, `@reg-email`, `@reg-code`, `@org-registration`, `@entity-selection` and `@nomination-definition` has no test in it. Its self-test shows that it tells a missing tag from a present one, against a title that only spells the tag, a longer tag and a probe that carries it. The tags sit on the tests that cover each item. The census on the tree: 16, 2, 1, 2, 8 and 72 tests. The backlog now says what the phase closed (eleven todos, each with the commit or spec that closes it), what it leaves (the nonce, the X2 residual and the compensating delete, re-anchored to the code as it is), and what it found (six todos filed).**

## Task commits

| Task | Commit | What |
|---|---|---|
| 1 | bc3d13e0f | `chore(179-23)`: the census script, its two fixtures, `package.json` (`assert:e2e-coverage-tags`, not in `lint:check`) and the gate row `coverage-tags` |
| 2 | 4fbfcbdfc | `test(179-23)`: the tags on the three specs. One held set, committed after `179-23-held` was green |
| 3 | df48d0981 | `docs(179-23)`: eleven todos moved with their Resolution, three re-anchored, six filed |

## The census as built

- **How it reads.** It runs `@playwright/test`'s CLI with `test -c ./tests/playwright.config.ts ./tests --grep-invert @probe --list --reporter=json`, the selection `yarn test:e2e` makes. The JSON reporter writes to a temporary file through `PLAYWRIGHT_JSON_OUTPUT_FILE`, which is removed on every exit. Listing loads the config, so the orphan-probe, soft-assertion and teardown-prefix guards run too, but it starts no browser, no server and no `globalSetup`. One run on this host takes about 1 s.
- **The unit.** Each spec's `tags` in the JSON, compared without the `@`. A test counts once per project it runs in. A spec tagged `probe` is skipped.
- **Output.** One line per tag on stdout: `<tag>: <n> test(s)`, or `<tag>: no test in the default run`. A summary line goes to stderr.
- **Exit codes.** 0 when every tag has a test, or when the self-test passes. 1 naming each tag with no test, or on a self-test difference. 2 on a usage error, or when the list cannot be produced or read.
- **What it cannot see** (stated in its header): whether a tagged test covers its item, which a review decides, and whether the run passed.
- **Not in `lint:check`** (the plan's ruling 2): it is the gate row `coverage-tags` of the closing set, which runs the self-test and then the census.

### Seen failing and passing

| Check | Result |
|---|---|
| The verify block before the script existed (`179-unit/179-23-t1-verify-red.*`) | exit 1 |
| `--self-test` on the fixture (lacks `@reg-code` alone) | exit 0: 1 finding, 1 expected |
| Mutant: a tag counts when the title spells it (`179-unit/179-23-t1-control-title-text.*`) | self-test **FAILED**: 0 findings for 1 expected |
| Mutant: no `@probe` filter (`…-control-no-probe-filter.*`) | self-test **FAILED**: 0 findings for 1 expected |
| Mutant: a tag that begins with the name counts (`…-control-prefix-match.*`) | self-test **FAILED**: 0 findings for 1 expected |
| `--no-such-flag`, `--input` with no file, `--input` of a missing file, `--input` of a list with the dotenv line ahead of the JSON | exit 2 each |
| The census on the tree before Task 2's tags | exit **1**: `@reg-email`, `@reg-code` and `@entity-selection` named with no test |
| The census on the tree after the tags (held, then committed) | exit **0** |

### The census on the committed tree (613 tests in the default run)

| Tag | Tests | Where |
|---|---|---|
| `@reg-idp` | 16 | every scenario of `contestant-identity-provider.spec.ts` (tagged by 179-14..20) |
| `@reg-email` | 2 | `contestant-email-registration.spec.ts`: the tracer (sign-in screen → mailed link → set password → home) and `register: an invited candidate registers by email through the mode selector` |
| `@reg-code` | 1 | `contestant-code-registration.spec.ts` › `register: an invited organization registers with a code` |
| `@org-registration` | 2 | that test, and the identity-provider spec's `a party is chosen, identified, named in the default locale and given an address, and waits unconfirmed for an administrator` |
| `@entity-selection` | 8 | each test of `contestant-entity-selection.spec.ts` |
| `@nomination-definition` | 72 | the nomination editor's tests in `perm/contestant-nominations.spec.ts` and `perm/perm-startfromcg.spec.ts` (Phase 177; untouched) |

**Each tag on a test that covers its item (PROH-179-32, judged by reading).**

- The two `@reg-email` tests each open the mailed link as received and end on the home, with the grant the claim wrote.
- The `@reg-code` / `@org-registration` test types a code, gives an address, opens the mailed link, sets a password and lands on the organization's home with its grant.
- The `@entity-selection` tests drive the selection screen. They cover listing, choosing, switching, the unsaved-edit prompt and refusals, and the root's two other answers: one entity (straight to its home, no switch item) and none (the nothing-to-edit view).

**Ids unchanged.** A list made before the tags and one made after hold the same 613 ids, titles and projects (compared in a scratch script). The tags are in the options, never in a title.

## Runs

| Run | Tree | Result |
|---|---|---|
| `tests/e2e-runs/179-e2e/179-23-held` | Task 2's three specs uncommitted on bc3d13e0f | **613/613**, wrapper exit 0, `restore: ok`, not void. `179-verdict control 179-23-held --full --same-projects-as 179-21-close --dirty-only tests/tests/specs/ --green`: **PASS**, 128 projects compared, 0 not as expected (`_drivers/179-23-held.verdict.log`). Held copies `179-23-held.<path>.kept`, each `cmp`-identical to what 4fbfcbdfc committed |
| `tests/e2e-runs/179-gates/179-23 --rows coverage-tags` | committed df48d0981 | row `coverage-tags` 0 (1 s): the self-test passed, census 6 of 6. `179-verdict gates 179-23 --rows coverage-tags`: **PASS**, not stale, no Sleep entry in the window |
| `tests/e2e-runs/179-e2e/179-23-close` (`bash 179-e2e.sh 179-23-close`) | committed df48d0981 | **613/613**, driver and wrapper exit 0, `restore: ok`, `sleep_entries_in_window: 0`, on AC. `179-verdict e2e 179-23-close --same-projects-as 179-23-held`: **PASS**, 128 projects compared, 0 not as expected (`_drivers/179-23-close.verdict.log`) |

Totals: 179-21-close 613 → 179-23-held 613 → 179-23-close 613. Every project count is unchanged: the plan adds no test, and a tag in the options changes no test's id.

## The todos

### Closed: moved to `done/`, each with a `## Resolution` naming the commit or spec

| Todo | Closed by |
|---|---|
| `2026-09-21-surface-bank-identification-failure-to-the-user.md` | 179-06: `00b06cc34` (the error screen, nine closed codes, three classes), `52b84a51b` (failures land on it); the cancel, error and mode-off scenarios of `contestant-identity-provider.spec.ts` |
| `2026-09-21-preregister-route-discards-email-and-nominations.md` | 179-14's tracer `388c76328` (the address given after the round trip, mailed and proved by its link) and 179-21's deletion `c5d7da8fe`. Nominations are defined in the editor (Phase 177). Its docs note was honoured by 179-22 (`8f2e00bed`) |
| `2026-06-03-full-bank-authentication-flow-e2e-spec.md` | 179-14's scenario 1 (`388c76328`) over the mock issuer (`dd51b3bf1`), default-on (`640eb5fa3`); the cancel and failure paths in `52b84a51b` |
| `2026-09-02-close-bank-auth-oidc-round-trip-window.md` | 179-05's default-on commit `640eb5fa3`; every full run since exercises the round trip (latest at this close: `179-21-close`, 613/613) |
| `2026-08-22-identity-callback-verifyjwt-fails-open-on-aud-iss.md` | evidence: `requireVerifyClaimBinding` in `identity-callback/verifyConfig.ts` throws `ERR_AUDIENCE_UNCONFIGURED` and `ERR_ISSUER_UNCONFIGURED`, called on every verification; `verifyConfig.test.ts`, `envReadSites.test.ts`, `flowConformance.test.ts` (D-16). The fourth-verifier todo stays pending, untouched |
| `2026-08-22-preregister-layout-server-has-no-unit-test.md` | its file deleted in `c5d7da8fe` (179-21) |
| `2026-10-06-173-identity-callback-lookup-throws-for-two-candidate-grants.md` | `a6f25b415` (179-09, `resolveOwnEntity` over the `registered_entities` record) wired in `0b6ab0cec` (179-13); scenario `an identity whose account an administrator gave a second candidate …` (`d12a1b657`, 179-20) |
| `2026-10-07-174-identity-provider-accounts-read-as-password-set.md` | 179-13's invite recipe (`0b6ab0cec`), measured beforehand by probe row P5 (held); the tracer ends on the set-password view once the address is proved |
| `2026-10-07-174-typed-address-of-an-identity-provider-user-must-stay-unconfirmed.md` | 179-10's `confirm-address` operation (`7973f63c3`) and the conformance assertions of `identity-callback/flowConformance.test.ts` (179-13) and `account-access/flowConformance.test.ts` (179-10); J3 (`b6776abe1`) |
| `2026-08-22-bank-auth-journey-setup-header-contradicts-config.md` | the journey deleted in `388c76328` (179-14) |
| `2026-10-08-bank-auth-driver-copy-must-filter-the-db-start-output.md` | `179-bankauth.sh` in `cc2b2e51a` (179-01): both `db:stop` and `db:start` through `withhold-stack-keys.mjs`, status from `PIPESTATUS[0]`; also the wrapper's `yarn _dev:concurrent` (`9cb7478d7`) |

### Re-anchored, kept open

- **`2026-10-02-oidc-callback-does-not-verify-nonce.md`** (D-17). It gains the sentence the plan asks for: the callback now turns a verified token directly into a session, so the nonce is the remaining replay control for Idura. Its anchors now point at the callback as it is: the cleanup comment's new text, and the authorize line. The fix's place is named: between `getIdTokenClaims` and `register(…)`, with the error screen's `invalid_token`. The callback's unit cases are named. One fact found on the way: the mock issuer mints no `nonce` claim, so the fix must also make the mock echo the nonce, or every identity-provider scenario fails.
- **`2026-10-07-174-identity-provider-registration-never-claims-an-invitation.md`**. This is the X2 todo, Phase 174's, and it is confirmed present. J3 (`b6776abe1`, migration `00002`) makes the "never" mechanical. It stays open as the X2 residual. Its anchors moved from the deleted route to the OIDC callback and `resolveOwnEntity`, and it points at the account-linking todo.
- **`2026-10-01-identity-callback-compensating-delete-failure.md`** (D-10). The organization branch repeats the pattern, and the record write now shares the `try`. The new log line, the organization detection query and one wider residual are stated. That residual is a grant that committed, a record write that failed and a delete that failed; it is read from the code, not run.
- **Not touched:** `2026-08-22-edge-function-fourth-idtoken-verifier-copy.md` and `getidtokenclaims-negative-tests.md`.

### Filed

| Todo | Source |
|---|---|
| `2026-10-21-179-identity-lookup-pages-every-auth-user.md` | D-22: `findUser` pages `listUsers` 1000 at a time on each sign-in; J4 narrowed the trigger to the frontend server |
| `2026-10-21-179-account-linking-for-two-accounts-of-one-person.md` | D-07, 179-B2 option (c) |
| `2026-10-21-179-identity-provider-sign-in-while-answers-locked.md` | U-13's residual (179-18): a user in state *none* or *pending* has no way in while answers are locked |
| `2026-10-21-179-observe-default-on-identity-provider-specs-in-ci.md` | PL-16 |
| `2026-10-22-179-auth-service-email-change-tells-taken-addresses-accepted.md` | the operator's decision of 2026-10-22, filed as an **accepted residual** (`status: accepted-residual`), to revisit if Supabase adds a before-user-updated hook or an email-change switch |
| `2026-10-22-179-mock-issuer-survives-a-void-run.md` | the 179-16 harness row: after a void run the mock issuer keeps 127.0.0.1:9443 |

**Not filed, because the phase built them** (the plan's ruling 3): the Signicat verifier (PL-06: made on the server, in an httpOnly cookie), and the identity claims in the token (`hetu` and `birthdate` no longer reach `app_metadata`). **Not found in `pending/`**: `2026-08-28-preregister-election-constituency-selection-harmonisation.md` and `2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md` (measured with `ls`, as the research found). Nothing was filed twice: the native-speaker review todo of 179-06 stays as it is.

## Verify blocks (`tests/e2e-runs/179-unit/179-23-t{1,2,3}-verify.{sh,log,exit,head}`)

Each script is taken byte for byte from the plan's `<automated>` block.

- **Task 1:** exit 1 before the script existed (`-red`), exit **0** with the files staged, before commit bc3d13e0f.
- **Task 2:** exit **0** at 4fbfcbdfc.
- **Task 3:** exit **0** at df48d0981, after the gate row and the close: the eleven todos are tracked under `done/` with `179` in each, none is left in `pending/`, the nonce todo holds the sentence, the four filed todos are tracked, and both verdicts pass.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] The JSON reporter's stdout is not pure JSON.** The config's dotenv line, `◇ injected env (N) from .env …`, is printed on stdout ahead of the reporter's JSON, so stdout cannot be parsed. The script has the reporter write to a file of its own through `PLAYWRIGHT_JSON_OUTPUT_FILE` instead. A first draft resolved `@playwright/test/cli.js`, which the package's `exports` map does not expose; it resolves `@playwright/test/cli`. Both were found on the tree before the commit.

**2. [Orchestrator direction] Two todos beyond the plan's four.** These are the accepted oracle residual and the 9443 harness gap. The operator's input asked for both if the plan files todos for what the phase leaves open, and harness todos.

**3. The gate row ran in the foreground.** The `coverage-tags` row lasts about 1 s, and the driver was started in the foreground with a 5-minute timeout. That departs from the rules' "no gate-set run in the foreground", which is about the watchdog. No harm resulted; it is recorded.

### Files touched that the plan did not list

- `.planning/todos/pending/2026-10-22-179-auth-service-email-change-tells-taken-addresses-accepted.md`
- `.planning/todos/pending/2026-10-22-179-mock-issuer-survives-a-void-run.md`

## Carried items (`179-CARRIED-ITEMS.md` rows a todo could carry)

| Row | Outcome |
|---|---|
| 179-10 → operator: the email-existence oracle | **Filed as an accepted residual**, not an open defect |
| 179-16: the mock issuer on 9443 after a void run | **Filed** |
| 179-18: the U-13 residual | **Filed** |
| 179-05 / 179-16 / 179-17 verifier notes; code-review rows: the anonymous settings read repeated four times, `UUID_PATTERN` in four copies, the callback's own type resolution, the service-role client built before the token check | Not filed. The plan's todo task names only its four; they stay for the verifier and code review |
| 179-19 / 179-20: the hydration race in `contestantIdentityProviderGate.logOut()` | Left for 179-24, as the row says |
| The CLAUDE.md sentences, the stack key in `devserver.log`, the oracle decision | Already settled at the operator's request; not re-filed as open |

## Items to report rather than edit

- **`.planning/WINDOWS.md` rows 217, 220, 221 and 222.** The round-trip todo asked that they be retired together on green. The evidence is now on record (default-on since `640eb5fa3`; 613/613 runs). The ledger is not on this plan's list, so they are left open for the ledger's owner. Row 218 is separate.
- **The research's two "update" dispositions that the plan did not take:**
  - `2026-08-28-edge-runtime-secrets-local-wiring.md`: J5 removed `PUBLIC_PROJECT_ID` from `identity-callback`, and the wrapper's serve sidesteps `[edge_runtime.secrets]`.
  - `2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md`: the J4 line for `IDENTITY_CALLBACK_SERVER_SECRET`, which is the operator action of the 179-15 row.
  
  Neither is on the plan's list, and neither was edited.
- **Stale code comments.** `apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.server.ts` and `…/question-info/+layout.server.ts` still list "the bank-auth `id_token`" cookie among the `httpOnly` cookies their filter protects. That cookie was removed in 179-21 (`COOKIE.idToken`). It is a comment-only fix, for 179-24.
- **`apps/frontend/src/lib/api/utils/auth/providers/types.ts`** still says the Idura nonce is "verified against the id_token `nonce` claim". That is false, and the nonce todo names it.
- **CLAUDE.md:** no sentence was made false by this plan. It names no individual gate script.

## Statements observed and inferred

- **Observed:** every run, verdict, census and control result above. The 613 identical ids before and after the tags. Each todo's evidence was read on the tree at this head: the files, the functions, the test files, the commits named, and the deletions in `c5d7da8fe` and `388c76328`. The mock issuer has no `nonce` in `tests/tests/support/` (`git grep -i nonce` finds nothing there).
- **Inferred, not run:**
  - the compensating-delete todo's wider residual;
  - the lookup todo's cost, read from the page size and the stop rule;
  - the answers-lock todo's "no way in", read from the authorize endpoint's refusal and the three sign-in routes;
  - the CI todo's environment, as before.

## Known Stubs

None.

## Threat Flags

None. The plan adds a repository script, test tags and planning records. No endpoint, auth path or schema surface.

## Self-Check: PASSED

- The script, both fixtures and the six filed todos exist and are tracked.
- The eleven closed todos are under `done/`, and none is left under `pending/`.
- bc3d13e0f, 4fbfcbdfc and df48d0981 are ancestors of HEAD. `git rev-list --count 3e0377ea6..HEAD` = 3 before this summary's commit.
- `179-23-held` and `179-23-close` both hold 613/613, with verdicts PASS. The `179-gates/179-23` verdict is PASS. The verify blocks of all three tasks exit 0 as written.
- `git status --short` showed only this summary and the operator's `CAND-APP-PLAN.md` before the summary's commit.
- STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT, RESEARCH, PATTERNS, UI-SPEC, CLAUDE.md and `179-CARRIED-ITEMS.md` were not touched.
