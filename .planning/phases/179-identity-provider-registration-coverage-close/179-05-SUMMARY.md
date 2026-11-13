---
phase: 179-identity-provider-registration-coverage-close
plan: 05
subsystem: testing
tags: [e2e, playwright, oidc, mock-issuer, bank-auth, harness, edge-functions, supabase]

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-02: probe row P8 (stop-start-needed, serve 2 s, restore 29 s); 179-04: one issuer for both identity-provider projects (MOCK_ISSUER / MOCK_AUDIENCE), the close run 179-04-close and its bank-auth pair"
provides:
  - "tests/scripts/e2e-run.sh step 5b: the identity provider's test environment generated outside the repository, the JWKS document on 8777, identity-callback served with a generated Edge file, the dev server given the provider environment and NODE_EXTRA_CA_CERTS=tests/tests/support/mock-oidc-cert.pem"
  - "the wrapper's trap restores the shared stack (yarn db:stop, yarn db:start), checks every function and ports 8777/9443, and writes restore.txt ending `restore: ok`; idp-env.txt and wrapper-exit in every run directory"
  - "exit status 9: the identity provider's environment could not be prepared, or the stack could not be restored; overrides 0 and 1, overridden by 8"
  - "e2e-evidence.mjs: wrapperExit and identityProvider in summary.json; wrapper-exit, idp-prepare and restore lines in provenance.txt"
  - "playwright.config.ts: bank-auth, data-setup-bank-auth-journey, bank-auth-journey, data-teardown-bank-auth-journey and the mock issuer's webServer declared unconditionally"
  - "scripts/assert-test-keys-scope.mjs (yarn assert:test-keys-scope, --self-test, --report) in lint:check; gate row test-keys-scope in 179-gates.sh"
  - "179-bankauth.sh marked retired: from here on a full 179-e2e.sh run is the green point for the round trip"
affects: [179-06, 179-13, 179-14, 179-15, 179-19, 179-23, 179-24]

actuals:
  tokens: 25187
  tasks: 3
  commits: 3
plan_head_before: 44c67595f4afc64969d70a10299e63ce3ac5656a
plan_head_after: 3944407a4f730aa1da000faf83876efd6e18bd54

tech-stack:
  added: []
  patterns:
    - "A wrapper that replaces a shared service for a run puts it back from its exit trap, with interrupts ignored for the restore, and records each check in the run directory"
    - "A guard's needles are derived from the committed source at run time; its fixture spells them as placeholders, so the fixture names no key"

key-files:
  created:
    - scripts/assert-test-keys-scope.mjs
    - scripts/fixtures/assert-test-keys-scope.input.txt
    - scripts/fixtures/assert-test-keys-scope.expected.violations
  modified:
    - tests/scripts/e2e-run.sh
    - tests/scripts/e2e-evidence.mjs
    - tests/playwright.config.ts
    - tests/tests/specs/contestant/contestant-bank-auth.spec.ts
    - tests/tests/support/mockOidcIssuer.ts
    - tests/tests/support/mockOidcIssuerEntry.ts
    - tests/global-setup.ts
    - tests/tests/specs/contestant/contestant-bank-auth-journey.spec.ts
    - tests/README.md
    - tests/IDURA-TEST-RUNBOOK.md
    - package.json
    - .env.example
    - .gitignore
    - apps/docs/src/routes/(content)/developers-guide/contestant-app/bank-authentication/+page.md
    - .planning/phases/179-identity-provider-registration-coverage-close/179-gates.sh
    - .planning/phases/179-identity-provider-registration-coverage-close/179-bankauth.sh

key-decisions:
  - "Restore mechanism: yarn db:stop then yarn db:start (P8 reads stop-start-needed); measured 5 s + 25 s in both runs of this plan"
  - "The restore runs once the function server was started (IDP_STARTED is set just before the serve); a refusal on a held port or a missing certificate exits 9 without restarting the stack it never touched"
  - "The generator is inline in the wrapper (tsx -e), not a sibling script: it writes edge.env, frontend.env (single-quoted exports, sourced only inside the dev server's subshell), expected-issuer and jwks/jwks with mode 0600 for the two env files; they are removed by name and rmdir, never recursively"
  - "The wrapper writes its own status to wrapper-exit so the evidence reader can name status 9; 179-e2e.sh keeps overwriting `exit` with the wrapper status as before"
  - "The bank-auth spec reads the anon key through the suite's supabaseAnonKey() and the service-role key inside beforeAll; nothing is read at module load"
  - "The test-keys guard skips tests/, .planning/ (the planning record names the issuer and key ids 47 times; it is not configuration), .yarn/ and its own files, as the no-candidate-app-names guard does"

patterns-established:
  - "Every wrapper run directory carries idp-env.txt (issuer read back, readiness), restore.txt (each check, last line restore: ok/FAILED) and wrapper-exit"

requirements-completed: []

coverage:
  - id: D1
    description: "The wrapper prepares, serves and restores the identity provider's environment in every run, never disables certificate verification, and records the issuer and every restore check"
    requirement: "E2E-03"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/179-e2e/179-05-held (557/557; idp-env.txt prepare: ok; restore.txt restore: ok)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/179-e2e/179-05-close (557/557; restore.txt restore: ok; wrapper-exit 0)"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/179-unit/179-05-t1-verify.sh (exit 0, uncommitted and committed tree); bash tests/scripts/e2e-run.sh --self-test (5 cases)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The identity-provider projects are default-on: no opt-in flag in the config or the spec; the held full run and the committed close carry bank-auth (6) and the bank-auth-journey trio with the predecessor's totals otherwise"
    requirement: "E2E-03"
    verification:
      - kind: e2e
        ref: "179-verdict control 179-05-held --full --same-projects-as 179-04-close --except bank-auth=6 --except bank-auth-journey=1 --except data-setup-bank-auth-journey=+ --except data-teardown-bank-auth-journey=+ --green: PASS (128 projects)"
        status: pass
      - kind: e2e
        ref: "179-verdict e2e 179-05-close --same-projects-as 179-05-held --expect-project bank-auth --expect-project bank-auth-journey: PASS"
        status: pass
    human_judgment: false
  - id: D3
    description: "A check in lint:check fails on a tracked non-test file naming the committed test keys or the mock's issuer; self-tested; gate row"
    verification:
      - kind: other
        ref: "node scripts/assert-test-keys-scope.mjs (0 findings over 2972 tracked files) and --self-test (10 of 10); yarn lint:check exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "README and runbook describe the default-on run, the hand-started-server failure, NODE_EXTRA_CA_CERTS, the untracked functions file never read; the driver is marked retired"
    requirement: "E2E-01"
    verification:
      - kind: other
        ref: "tests/e2e-runs/179-unit/179-05-t3-verify-restated.sh (exit 0)"
        status: pass
    human_judgment: false

duration: about 50 min (21:39Z to about 22:30Z)
completed: 2026-10-21
status: complete
---

# Phase 179 Plan 05: The harness, second half Summary

**The identity-provider specs now run in every E2E run. Before the dev server starts, `tests/scripts/e2e-run.sh` generates the identity provider's test environment from the committed test keys into a temporary directory outside the repository. It serves the JWKS document on 8777 and `identity-callback` with a generated Edge file, and starts the dev server with the Idura provider pointed at the mock issuer and `NODE_EXTRA_CA_CERTS` set to the committed certificate. On every exit it restores the shared stack with `yarn db:stop` then `yarn db:start` and records each check in `restore.txt`; status 9 means preparation or restore failed. The four identity-provider projects and the mock's `webServer` are unconditional. `yarn assert:test-keys-scope` in `lint:check` keeps the test keys and the mock's issuer out of every tracked non-test file. The held full run and the committed close are both green at 557/557.**

## Performance

- **Duration:** about 50 min. Started 2026-10-21T21:39:11Z (host clock). The close run's restore ended at 22:22:09Z, and the final `lint:check` ran after that.
- **Tasks:** 3 of 3.
- **Commits:** 3 plan commits.
- **Files:** 3 created, 16 modified. Eight of the modified files are not on the plan's list; see Deviations.
- **Power:** on AC at 80 % for every long run. The operator's battery override was not used.

## Restore mechanism and its times

- P8 reads `stop-start-needed`, so the wrapper restores with `yarn db:stop` then `yarn db:start`. Each command's output goes through `withhold-stack-keys.mjs`, and each status is read from `PIPESTATUS[0]`.
- Measured in this plan's two runs:

| Run | Function serve ready | `yarn db:stop` | `yarn db:start` | Restore total | Checks |
|---|---|---|---|---|---|
| `179-05-held` | 2 s | exit 0, 5 s | exit 0, 25 s | 31 s | edge-runtime container running; OPTIONS `account-access` 200, `identity-callback` 200, `send-email` 200; ports 8777 and 9443 free; `restore: ok` |
| `179-05-close` | 2 s | exit 0, 5 s | exit 0, 25 s | 30 s | the same, `restore: ok` |

- `idp-env.txt` in both runs holds:
  - `IDENTITY_PROVIDER_ISSUER=https://127.0.0.1:9443`, read back from `supabase_edge_runtime_openvaa-local` by that one name;
  - `identity_callback_options=200`;
  - `ready_after_s=2`;
  - `node_extra_ca_certs=tests/tests/support/mock-oidc-cert.pem`;
  - `prepare: ok`.

## The held run (uncommitted tree at 3bd73bfb3)

- **Run:** `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/179-e2e/179-05-held --no-db-reset`, then `e2e-evidence.mjs`.
- **Result:** wrapper exit 0, 557 total, 557 passed, 0 failed / flaky / skipped / did not run. Not void.
- **Per project:**
  - `bank-auth` 6/6;
  - `data-setup-bank-auth-journey` 1/1;
  - `bank-auth-journey` 1/1;
  - `data-teardown-bank-auth-journey` 1/1;
  - every other project at the 179-04-close total.
- **Verdict:** `179-verdict control 179-05-held --full --same-projects-as 179-04-close --except bank-auth=6 --except bank-auth-journey=1 --except data-setup-bank-auth-journey=+ --except data-teardown-bank-auth-journey=+ --dirty-only` (the eight held files) `--green` gave **PASS**, with 128 projects compared and 0 not as expected. It is kept as `tests/e2e-runs/179-e2e/_drivers/179-05-held.verdict.txt`.
  - The two counts were read at run time from `179-04-close-bank-auth/summary.json` (`byProject.bank-auth.total` = 6) and `179-04-close-bank-auth-journey/summary.json` (`byProject.bank-auth-journey.total` = 1).
- **Held copies:** a copy of each held file as the run ran it is kept as `tests/e2e-runs/179-e2e/179-05-held.<file>.kept`. Each was byte-identical to the committed file (`cmp`).

## The close (committed tree at 3944407a4)

- **Run:** `bash $P/179-e2e.sh 179-05-close`. Wrapper exit 0, 557/557, 128 projects. No Sleep entry in the run window.
- **Restore record:** `restore: ok`, and provenance shows `wrapper-exit: 0`.
- **Verdict:** `179-verdict e2e 179-05-close --same-projects-as 179-05-held --expect-project bank-auth --expect-project bank-auth-journey` gave **PASS**, with bank-auth 6/6, bank-auth-journey 1/1 and 128 projects equal to the held run. It is kept as `_drivers/179-05-close.verdict.txt`.
- **`yarn lint:check`:** exit 0 on the committed tree (`tests/e2e-runs/179-unit/179-05-lint-close.{log,exit,head}`). This includes the new guard: 5 needles, 2972 tracked files, 0 findings.

## The check's findings on the tree

- **Needles:** 5, derived at run time: the key ids `test-enc-1` and `test-sig-1`, two 24-character modulus prefixes, and `MOCK_ISSUER`.
- **Tree:** 2972 tracked files scanned outside `tests/`, `.planning/`, `.yarn/` and the guard's own files, with **0 findings**.
- **Self-test:** 10 of 10 findings on the fixture. The positive block covers the root and functions templates, `config.toml`, a workflow, `infra/`, a compose file and `render.example.yaml`. The negative block covers the test tree, the planning record, the vendored release, the guard's own source and a near-miss port.
- **Not run:** a planted tracked file was not tried, because it would need an index change. The matching logic is the one the self-test exercises.

## Verify blocks (`tests/e2e-runs/179-unit/179-05-t{1,2,3}-verify*.{sh,log,exit,head}`)

- **Task 1:** exit 0 on the uncommitted tree and again at 3944407a4.
- **Task 2:** exit 0 at 640eb5fa3.
- **Task 3:** the byte-for-byte block exits 1 at its last stage, `yarn -s lint:check`, which Yarn 4.18.1 refuses (the recurring deviation). The same chain with `yarn lint:check` (`-verify-restated.sh`) exits **0** at 3944407a4.

## Task Commits

1. **3bd73bfb3** `chore(179-05)`: a check that no non-test configuration names the committed test keys. This is Task 2's check script, its fixtures, the `package.json` lines and the gate row. It was committed after `yarn lint:check` exited 0, and it changes no spec.
2. **640eb5fa3** `test(179-05)`: the identity-provider specs are default-on; the wrapper serves the function and restores the stack. These are Tasks 1 and 2, the held set, committed after `179-05-held` was green. **This is the one commit that adds two projects to the default run.**
3. **3944407a4** `docs(179-05)`: the identity-provider specs run in every E2E run (Task 3).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] Three more test-tree files in the held set**
- **Found during:** Task 2.
- **Issue:** after this plan, three comments were false or told a reader to disable certificate verification:
  - `tests/tests/support/mockOidcIssuerEntry.ts` called the issuer "PLAYWRIGHT_BANK_AUTH-gated" and named `EFLOW-10b`. This was a carried item marked "settle in 179-05".
  - `tests/global-setup.ts` said the mock spawns "when `PLAYWRIGHT_BANK_AUTH` is set".
  - The run block of `contestant-bank-auth-journey.spec.ts` sourced an environment with `NODE_TLS_REJECT_UNAUTHORIZED=0` and set the opt-in flag.
- **Fix:** comment-only rewrites. All three were part of the held set and the held verdict (extra `--dirty-only` paths).
- **Commit:** 640eb5fa3

**2. [Rule 2 - Correctness] Three sentences outside the test tree**
- **Found during:** Task 3.
- **Issue:** each said the bank-auth projects are opt-in or throw at module load:
  - `.env.example`, among the requirers of `SUPABASE_SERVICE_ROLE_KEY`;
  - `.gitignore`, in the certificate's comment, which also carried `EFLOW-10b` and a threat id;
  - the developers' guide page `contestant-app/bank-authentication/+page.md`.
- **Fix:** one sentence each, committed with the docs.
- **Commit:** 3944407a4

**3. [Rule 3 - Blocking] Comment-hygiene rule 2 tripped twice**
- **Found during:** the first `lint:check`.
- **Issue:** a header list item named `5b.` is not a list marker the guard recognises, and the spec had a command line on its own docblock line.
- **Fix:** step 5b was folded into item 5's sentence, and the command was moved into a sentence. The second `lint:check` exited 0.

**4. [Rule 3 - Blocking] `yarn -s` refused by Yarn 4.18.1 (recurring)**
- Task 3's verify block was also run with the stage restated (`yarn lint:check`). It exits 0.

**5. Carried item settled: the runbook's iss/aud note**
- The 179-04 carried row about `IDURA-TEST-RUNBOOK.md` is settled. The environment table and the alignment note now say that the mock stamps `MOCK_ISSUER` / `MOCK_AUDIENCE` and reads no environment for them.

---

**Total deviations:** 4 auto-fixed (2 correctness, 2 blocking), plus 1 carried item settled. **Impact:** comment and documentation only, beyond the plan's files. No behaviour outside the plan changed.

## Statements observed and inferred

- **Observed:**
  - every count, exit status, verdict, restore time and check above;
  - the issuer read back from the container;
  - the byte identity of the held copies;
  - the generator's output: names, sizes and modes, the two JWK arrays parsing as one key each, and the JWKS document holding no `d` field;
  - no key material in the kept run evidence of `179-05-held` (`idp-functions.log`, `idp-jwks-server.log`, both restore logs, `idp-env.txt`, `restore.txt`, `wrapper.log`): no private-JWK field, no modulus prefix, no PEM block;
  - no `e2e-run-idp.*` directory left in `$TMPDIR` after the run.
- **Inferred:**
  - That `host.docker.internal` resolves on the CI runner (Linux). The Supabase CLI is understood to add the host-gateway alias to its containers, but CI was not observed (item PL-16).
  - That the CI E2E job, which runs this wrapper with `--no-watch`, gets the same environment by construction. `.github/workflows/main.yaml` names neither the opt-in flag nor any bank-auth variable, so it was left as it is.

## Items to report rather than edit

- **CLAUDE.md sentences this plan made false or incomplete** (not edited):
  - § *Testing*, the comment above the wrapper:
    - Today: "The wrapper starts Supabase AND the dev server itself, on the project the suite seeds, and writes every artifact of the run into --run-dir."
    - Proposed: "The wrapper starts Supabase, serves `identity-callback` with the identity provider's test environment, starts the dev server itself on the project the suite seeds with that environment, restores the shared stack at its end (exit 9 if it cannot), and writes every artifact of the run into --run-dir."
  - § *Testing*, the comment above `yarn test:e2e`:
    - Today: "The same specs against a server you started yourself. That server MUST be scoped to the project the suite seeds, or the preflight aborts the run and names both ids."
    - Proposed: "The same specs against a server you started yourself. That server MUST be scoped to the project the suite seeds, or the preflight aborts the run and names both ids; without the identity provider's test environment, which only the wrapper prepares, the `bank-auth` and `bank-auth-journey` projects fail."
  - § *Common Workflows*, **Running tests**:
    - Today: "The wrapper starts Supabase and one fresh dev server with `PUBLIC_PROJECT_ID` set to the project the suite seeds; …"
    - Proposed: "The wrapper starts Supabase, serves `identity-callback` with the identity provider's test environment, and starts one fresh dev server with `PUBLIC_PROJECT_ID` set to the project the suite seeds and that environment; at its end it restarts the shared stack (`yarn db:stop`, `yarn db:start`, about 30 s) to put the default edge runtime back; …"
- **Still-stale comments in four test files.** They name `PLAYWRIGHT_BANK_AUTH` inside comments that are already historical narrative, and rewriting them means bringing each whole comment in line, which is outside this plan's files:
  - `tests/tests/setup/contestant/bank-auth-journey.setup.ts` lines 4 and 9. Line 4 says "Opt-in (PLAYWRIGHT_BANK_AUTH-gated)", which is now false.
  - `tests/tests/setup/contestant/bank-auth-journey.teardown.ts` line 32. It also says the setup "depends only on `data-setup-base`", which was already false.
  - `tests/tests/setup/shared/base.setup.ts` line 15.
  - Settle in 179-14 (the journey's setup is touched there) or at 179-24.
- **`.planning/phases/179-…/179-e2e.sh`:** its header step (e) still says that the caller's environment passes `PLAYWRIGHT_BANK_AUTH` and the identity-provider variables through to the dev server. This is harmless but stale, and the file is not this plan's.
- **Pre-existing exposure of local keys, out of scope:** `devserver.log` in every wrapper run directory, including runs before this plan (`179-04-close` has it too), holds the local stack's secret key. Root `yarn dev` runs `yarn db:start` itself, and that output reaches `devserver.log` without the `withhold-stack-keys.mjs` filter that the wrapper applies to its own `db-start.log`. Run directories are gitignored, but the README says they get attached to reports and uploaded from CI. The fix would be to filter the dev server's output, or to spawn the frontend without root `yarn dev`'s `db:start`. It belongs to a harness plan.
- **The shared stack now restarts once per wrapper run.** The `-infra` worktree shares this stack, so its edge runtime and auth service restart at the end of every run made from this checkout. Its default edge runtime comes back with the developer's untracked functions environment, as before.
- **`data-setup-admin-auth` and `data-setup-bank-auth-journey` share the edge `['voter-prefs-tracking']`,** and so share a scheduling phase in a full run. That is a first in a default run. The admin setup writes no `app_settings` and the admin spec reads none, and both runs were green. The config's sentence "this setup's authoritative `app_settings` REPLACE cannot overlap any other project's" still holds, because the admin setup does not replace. Recorded for the verifier.
- **Carried rows marked "settle in 179-05":**
  - the runbook iss/aud note is settled (Deviation 5);
  - the `mockOidcIssuerEntry.ts` and `playwright.config.ts` webServer "PLAYWRIGHT_BANK_AUTH-gated" wording is settled (Deviation 1, and the config rewrite).

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model:
- **T-179-051:** `assert:test-keys-scope` is in `lint:check`, self-tested, and has a gate row.
- **T-179-052:** `NODE_EXTRA_CA_CERTS` with the committed certificate only. No certificate-verification bypass is named in the wrapper, the config, the specs or the docs (verified by the plan's greps).
- **T-179-053:** the restore runs from the trap with interrupts ignored, and is checked per function; failure gives status 9 and is recorded in `restore.txt`.
- **T-179-054:** the generated files live in an `mktemp -d` directory outside the repository (checked), with mode 0600 env files. They are removed by name on every exit. The issuer is the only value recorded.
- The JWKS server binds every interface on 8777 for the life of a run, so that the edge runtime reaches it through `host.docker.internal`. It serves only the committed test **public** key.

`.agents/code-review-checklist.md` was not walked: the plan adds no application code, only harness, a lint guard and docs.

## Self-Check: PASSED

- Files: `scripts/assert-test-keys-scope.mjs` and its two fixtures exist.
- Run directories `tests/e2e-runs/179-e2e/179-05-held` and `tests/e2e-runs/179-e2e/179-05-close` exist, each holding `results.json`, `summary.json`, `idp-env.txt` and `restore.txt` ending `restore: ok`.
- Commits 3bd73bfb3, 640eb5fa3 and 3944407a4 are ancestors of HEAD. `git rev-list --count 44c67595f..HEAD` gives 3.
- STATE.md and ROADMAP.md were not touched.
