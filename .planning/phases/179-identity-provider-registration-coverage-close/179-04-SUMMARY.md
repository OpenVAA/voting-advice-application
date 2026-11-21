---
phase: 179-identity-provider-registration-coverage-close
plan: 04
subsystem: testing
tags: [e2e, playwright, oidc, mock-issuer, bank-auth, harness, vitest]

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-01: the drivers (179-e2e.sh, 179-bankauth.sh, 179-verdict.mjs); 179-03: the close run 179-03-close and its bank-auth pair, the predecessor of this plan's close"
provides:
  - "mock OIDC issuer selector: cookie mock_oidc_scenario (MOCK_SCENARIO_COOKIE) carrying base64url JSON of { sub, givenName, familyName, outcome }; outcomes success, cancel, provider-error, token-error"
  - "single-use random codes for a selected authorization; the fixed code test-code still mints IDURA_CLAIMS"
  - "MOCK_ISSUER = https://127.0.0.1:9443 and MOCK_AUDIENCE = test-client-id exported from the mock module; every token it mints carries them"
  - "fixture identityProviderFlow.fixture.ts: mintIdentity(context, opts) -> sub with prefix e2e-idp-, placeholderAddressOf(sub)"
  - "mailedLink: MailedLinkType gains 'email_change'"
  - "DEFAULT_TOKEN_OPTS of buildTestIdToken = the mock's issuer and audience: one issuer for the suite"
  - "179-bankauth.sh: one Edge file, identity-callback served once for both projects, --held mode for runs of an uncommitted tree"
affects: [179-05, 179-06, 179-14, 179-15, 179-19]

actuals:
  tokens: 12810
  tasks: 3
  commits: 3
plan_head_before: caf6d6574e198329cce85174fcc26af46ae49453
plan_head_after: dd51b3bf158940726900eb55821c8b7a24be3ab4

tech-stack:
  added: []
  patterns:
    - "A test chooses the provider's identity and answer through a cookie of its own browser context; the mock turns it into a code good for one exchange"
    - "Two modules that import each other: the value read across the cycle is exposed through getters, so it is read when used, not while the modules load"

key-files:
  created:
    - tests/tests/utils/mockOidcIssuer.test.ts
    - tests/tests/fixtures/shared/identityProviderFlow.fixture.ts
  modified:
    - tests/tests/support/mockOidcIssuer.ts
    - tests/tests/utils/mailedLink.ts
    - tests/tests/utils/mailedLink.test.ts
    - tests/tests/utils/buildTestIdToken.ts
    - tests/tests/utils/buildTestIdToken.test.ts
    - tests/tests/specs/contestant/contestant-bank-auth.spec.ts
    - .planning/phases/179-identity-provider-registration-coverage-close/179-bankauth.sh

key-decisions:
  - "The mock's tokens carry the constants MOCK_ISSUER and MOCK_AUDIENCE and no longer read IDENTITY_PROVIDER_ISSUER / PUBLIC_IDENTITY_PROVIDER_CLIENT_ID from its process environment; the driver writes the same two constants into every environment, so the runs of today are unchanged"
  - "A code the mock never issued, or one already exchanged, is refused with 400 invalid_grant; before, the token endpoint ignored the code"
  - "The selector cookie is set Secure, HttpOnly, SameSite Lax on host 127.0.0.1 path /: it reaches the mock's https origin on the authorize navigation and not the application's http origin"
  - "The driver serves identity-callback once and runs both projects under it, instead of serving it once per project"
  - "DEFAULT_TOKEN_OPTS is an object of two getters, because mockOidcIssuer.ts imports buildTestIdToken.ts and buildTestIdToken.ts now imports mockOidcIssuer.ts"

patterns-established:
  - "identityProviderFlow fixture: steps that set the selector and name the minted identity, in the shape of invitationFlow.fixture.ts"

requirements-completed: []

coverage:
  - id: D1
    description: "The mock issuer answers per test: the selected identity once per code, cancel, provider error and a refused token exchange; without a selector the fixed identity; loopback only"
    requirement: "E2E-03"
    verification:
      - kind: unit
        ref: "tests/tests/utils/mockOidcIssuer.test.ts (13 cases)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The shared link helper accepts an email_change link as received and still refuses invite, signup and email"
    requirement: "E2E-01"
    verification:
      - kind: unit
        ref: "tests/tests/utils/mailedLink.test.ts#assertSignInLinkShape, asked for an address-confirmation link"
        status: pass
    human_judgment: false
  - id: D3
    description: "One issuer: both opt-in projects green under one served identity-callback environment, held and committed; the default suite unchanged"
    requirement: "E2E-03"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/179-e2e/179-04-held-bank-auth (8/8), 179-04-held-bank-auth-journey (475/475), control verdicts PASS"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/179-e2e/179-04-close (548/548), verdict PASS against 179-03-close"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/179-e2e/179-04-close-bank-auth (8/8), 179-04-close-bank-auth-journey (475/475), both exit 0"
        status: pass
    human_judgment: false

duration: about 47 min (20:47Z to 21:34Z)
completed: 2026-10-21
status: complete
---

# Phase 179 Plan 04: The harness, first half Summary

**The mock OIDC issuer now answers each test as that test chooses: a cookie of the test's own browser context selects the identity and one of four outcomes, and a selected authorization gets a random code that works for one exchange. The mailed-link helper accepts `email_change`. The suite has one identity-provider issuer: `DEFAULT_TOKEN_OPTS` carries the mock's issuer and audience, and the bank-auth driver serves both opt-in projects under one function environment. Both held runs, the full close (548/548, same totals as 179-03-close) and the committed bank-auth pair are green.**

## Performance

- **Duration:** about 47 min (started 2026-10-21T20:47:25Z, ended 2026-10-21T21:34Z)
- **Tasks:** 3 of 3
- **Commits:** 3 task commits
- **Files:** 2 created, 7 modified (one of them, `buildTestIdToken.test.ts`, not listed by the plan; see Deviations)
- **Power:** on AC at 80 % throughout. The operator's battery override was not used.

## Red runs (kept under `tests/e2e-runs/179-unit/`, `.log`, `.exit`, `.head`)

| Run | Head | Exit | What was red |
|---|---|---|---|
| `179-04-mock-red` | caf6d6574 | 1 | 12 of 13 cases. The new exports did not exist, and with port 0 the old handle reported port 0, so every request failed. The one case that passed was "listens on the loopback address alone": the old `url` was built from `BIND_HOST`, so that case could not fail before the change. It now reads the address from the bound socket. |
| `179-04-link-red` | a82ebefe0 | 1 | 4 of 40: the `email_change` acceptance case and the three "asked for email_change, refuses invite / signup / email" cases. The case "refuses to be asked for a type it does not name" passed, as it should: it guards behaviour that already held. |

## The mock's cases (`tests/tests/utils/mockOidcIssuer.test.ts`, 13, all pass)

- Without a selector:
  - it listens on 127.0.0.1, read from the bound socket
  - it redirects with `code=test-code` and the request object's `state`
  - `test-code` mints `IDURA_CLAIMS` with `MOCK_ISSUER` and `MOCK_AUDIENCE`
  - three malformed selectors are answered as no selector
- With a selector:
  - `success` gives a fresh code that mints the selected `sub`, `given_name`, `family_name`, issuer and audience, and the same code is refused with 400 `invalid_grant` the second time
  - two authorizations get two different codes
  - `cancel` redirects with `error=access_denied` and the state, and no code
  - `provider-error` redirects with `error=server_error` and the state, and no code
  - `token-error` gives a code that the token endpoint refuses with 400 `invalid_grant`
  - a code never issued is refused
- The encoding:
  - decode is the inverse of encode
  - an unknown outcome, a missing field, an overlong field, a non-string field, an empty `sub` and a non-base64url value each decode to null
  - `mockIdentityClaims` has the keys of `IDURA_CLAIMS`, with the selected subject and names

The issuer is started with `port: 0`, and every request trusts the committed certificate for its own connection only (`https.request` with `ca`).

## Held runs (Task 3, uncommitted tree at head 57710602b)

Made with `bash $P/179-bankauth.sh 179-04-held --held`, which served `identity-callback` once with the one Edge file. Then each project ran through `tests/scripts/e2e-run.sh --run-dir … --no-db-reset --project <project>` and `e2e-evidence.mjs`. The container's issuer was read back as `https://127.0.0.1:9443` for both projects. Restore and probe: OK, driver exit 0. A copy of each held file as the runs ran it is kept as `tests/e2e-runs/179-e2e/179-04-held.<file>.kept`, and each was byte-identical to the committed file (`cmp`).

| Run | Counts | Verdict |
|---|---|---|
| `179-04-held-bank-auth` | 8 total, 8 passed (`bank-auth` 6 of 6) | `179-verdict control … --project bank-auth --setup data-setup-base --dirty-only` (the three test files) `--green`: **PASS** |
| `179-04-held-bank-auth-journey` | 475 total, 475 passed (`bank-auth-journey` 1 of 1) | `… --project bank-auth-journey --setup data-setup-bank-auth-journey … --green`: **PASS** |

The verdicts are kept as `tests/e2e-runs/179-e2e/_drivers/179-04-held-<project>.verdict.txt`.

## The close, on the committed tree (head dd51b3bf1)

- **Full run `179-04-close`:**
  - 548 total, 548 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 124 projects.
  - Not void, no Sleep entry in the window.
  - `179-verdict e2e 179-04-close --same-projects-as 179-03-close`: **PASS**, 124 projects compared, 0 not as expected. The plan adds no E2E test, so no `--except` was used.
- **Bank-auth pair `179-04-close`:** `179-04-close-bank-auth` 8/8, exit 0; `179-04-close-bank-auth-journey` 475/475, exit 0. Driver exit 0. Restore and probe: OK, the stack probe exited 0, and every stack container was Up afterwards. Both projects ran under one served function with the issuer `https://127.0.0.1:9443` (`_drivers/179-04-close.bankauth.edge-env.txt`).

## Verify blocks

Each `<automated>` block was taken byte for byte into `tests/e2e-runs/179-unit/179-04-t{1,2,3}-verify.sh`, and run with `bash` (log, exit and head kept beside it).

- **Task 1** exits 1, at the `yarn -s` stage, which Yarn 4.18.1 refuses (`Unsupported option name ("-s")`). This is the recurring deviation. The same chain with `yarn -s` restated as `yarn` (`-verify-restated.sh`) exits **0** at a82ebefe0.
- **Task 2:** the same. The byte-for-byte block exits 1 at `yarn -s`, and the restated chain exits **0** at 57710602b.
- **Task 3** holds no `yarn -s`. It exits **0** at dd51b3bf1, after the close.

## Task Commits

1. **a82ebefe0** `test(179-04)`: the mock issuer mints an identity and an outcome per test (Task 1)
2. **57710602b** `test(179-04)`: the link helper opens an address-confirmation link as received (Task 2)
3. **dd51b3bf1** `test(179-04)`: one issuer for both identity-provider projects (Task 3, the one commit that changes a committed spec, made after both held runs were green)

## What this plan's commits do to committed specs

- Tasks 1 and 2 are additive. A run without the selector sees the authorize redirect it always saw. No committed spec calls the new fixture, and the helper's two existing types behave as before.
- One behaviour of the mock is narrower: it now refuses a code it did not issue. The only caller, the application's server in the journey, sends the `test-code` it received.
- Task 3 changes the token the opt-in `bank-auth` spec builds: its issuer changes from the synthetic one to the mock's. That change was committed together with the driver that serves the matching environment, after both held runs were green.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `buildTestIdToken.test.ts` changed with Task 3 (a file the plan does not list)**
- **Found during:** Task 3
- **Issue:** its case "defaults iss/aud to the back-compat test values" asserted the synthetic issuer `https://test-idp.example.com`, so re-pointing `DEFAULT_TOKEN_OPTS` would turn `yarn test:unit` red.
- **Fix:** the case now asserts `MOCK_ISSUER` and `MOCK_AUDIENCE`, imported from the mock module. The file was part of the held set and of the Task 3 commit, and both control verdicts carry a third `--dirty-only tests/tests/utils/buildTestIdToken.test.ts`.
- **Commit:** dd51b3bf1

**2. [Rule 3 - Blocking] An import cycle between the mock and the token builder**
- **Found during:** Task 3
- **Issue:** `mockOidcIssuer.ts` imports `buildTestIdToken`, and the plan has `buildTestIdToken.ts` import the issuer from the mock module. A plain `{ issuer: MOCK_ISSUER }` would be read before the mock module's constant exists whenever the mock module is loaded first, as `mockOidcIssuerEntry.ts` loads it.
- **Fix:** `DEFAULT_TOKEN_OPTS` is an object of two getters. **Observed:** both load orders under `tsx`; the entry point started on a spare port and answered its JWKS route with 200; the held journey run.
- **Commit:** dd51b3bf1

**3. [Rule 3 - Blocking] `yarn -s` refused by Yarn 4.18.1 (recurring)**
- The verify blocks of Tasks 1 and 2 were also run with the stage restated, as described above.

**4. [Rule 2 - Correctness] The mock's `url` reads the bound socket**
- **Issue:** without this, the unit test could not start the issuer on an ephemeral port, and the loopback case could not observe the bind.
- **Fix:** `url` now reports the address and port from `server.address()` once listening. `mockOidcIssuerEntry.ts` prints the same URL as before.
- **Commit:** a82ebefe0

**5. [Rule 1 - Lint] A vitest `afterAll` tripped `playwright/no-duplicate-hooks` (a warning)**
- **Fix:** the issuer is stopped by the teardown function that `beforeAll` returns.
- **Commit:** a82ebefe0

**6. Type cast in the new link-helper case**
- After the red run, the type cast of one new case moved from the array to the call (`outside as MailedLinkType`) so that `yarn typecheck:tests` passes. The case's assertion did not change.
- **Commit:** 57710602b

## Statements observed and inferred

- **Observed:** every count, exit status and verdict above; the issuer read back from the container; the byte identity of the held copies; both module load orders.
- **Inferred:**
  - The selector cookie reaches the mock on the authorize navigation (a cross-site top-level GET, so a Lax cookie is sent). No spec exercises it yet; the first scenario that does is 179-06 onwards.
  - The cookie does not reach the application, which is served on `http://localhost`: it is Secure and its host is 127.0.0.1.

## Items to report rather than edit

- `tests/IDURA-TEST-RUNBOOK.md`, in the full-browser journey's environment table and the "iss/aud alignment" note, says the mock issuer reads `IDENTITY_PROVIDER_ISSUER` / `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` from its own environment when it mints a token. It now stamps `MOCK_ISSUER` / `MOCK_AUDIENCE`. The values the runbook tells you to set are the same, so the procedure still works, but the sentence is false. The runbook's Step E-1 still reads `DEFAULT_TOKEN_OPTS`, which now yields the mock's issuer, so its generated Edge file stays consistent. Settle in 179-05, which rewrites the opt-in procedure.
- `tests/tests/support/mockOidcIssuerEntry.ts` and the `webServer` comment in `tests/playwright.config.ts` still call the issuer "PLAYWRIGHT_BANK_AUTH-gated", and the entry's header names `EFLOW-10b`. Neither file is this plan's. 179-05 removes the gate.
- `179-CONTEXT.md` D-19 and `179-RESEARCH.md` Pitfall 11 (and § at line 352) state that `bank-auth` uses `https://test-idp.example.com` and that the two projects cannot share a run. Both are now historical. Not edited: these files are on the executor's no-edit list.
- `179-bankauth.sh` evidence names changed: the function server's log is now `<stem>.bankauth.functions.log`, one per stem, no longer one per project.

## Known Stubs

None. The fixture's steps are complete; no committed spec calls them yet, by design (179-06 onwards).

## Threat surface

No surface beyond the plan's threat model:
- T-179-041 (cross-test identity): mitigated by per-context cookies and random single-use codes, with unit cases.
- T-179-042 (bind): the bind is unchanged at `BIND_HOST = '127.0.0.1'`, and the bound address is now asserted.
- T-179-043 is carried to 179-05 as planned.

`.agents/code-review-checklist.md` was not walked: the plan adds no application code, only test harness and a phase driver.

## Self-Check: PASSED

- Files: `tests/tests/utils/mockOidcIssuer.test.ts` and `tests/tests/fixtures/shared/identityProviderFlow.fixture.ts` exist.
- Commits a82ebefe0, 57710602b and dd51b3bf1 are ancestors of HEAD; `git rev-list --count` from the ledger gives 3.
- Run directories: `179-04-held-bank-auth`, `179-04-held-bank-auth-journey`, `179-04-close`, `179-04-close-bank-auth` and `179-04-close-bank-auth-journey` exist under `tests/e2e-runs/179-e2e/`.
