---
phase: 180-edge-functions-typecheck-shared-modules
verified: 2026-11-13T17:15:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - ".planning/phases/180-edge-functions-typecheck-shared-modules/180-01-PLAN.md"
  - ".planning/phases/180-edge-functions-typecheck-shared-modules/180-01-SUMMARY.md"
  - ".planning/phases/180-edge-functions-typecheck-shared-modules/180-02-PLAN.md"
  - ".planning/phases/180-edge-functions-typecheck-shared-modules/180-02-SUMMARY.md"
  - ".planning/phases/180-edge-functions-typecheck-shared-modules/180-03-PLAN.md"
  - ".planning/phases/180-edge-functions-typecheck-shared-modules/180-03-SUMMARY.md"
  - "apps/supabase/package.json"
  - "apps/supabase/supabase/functions/_shared/envConfig.ts"
  - "apps/supabase/supabase/functions/_shared/placeholderAddress.ts"
  - "apps/supabase/supabase/functions/deno.json"
  - "apps/supabase/supabase/functions/identity-callback/index.ts"
  - "scripts/assert-edge-env-defaults.mjs"
  - "tests/e2e-runs/180/180-final-r2/summary.json"
covered_digest: "v4:sha256:d6bbe806c59a47f0de6595f6135e6ffb7774ba131c642dd764763674d40a6bd7"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Decide whether criterion 5's 'One CI run is observed green' is met by the validation job alone."
    expected: "CI run 43405262494 (evidence tree ci-evidence/180-deno, 1ed7c6d28) concluded `failure` as a run: frontend-and-shared-module-validation (the job holding the Deno typecheck, 22 Check lines from a cold cache), sql-lint, supabase-tests, supabase-types-drift, dev-seed-integration, skill-drift-check, docker-image-build, infra-validate and node-engine-range-negative-control are success; dependency-audit, secret-scan, e2e-tests and e2e-visual are failure. None of the four failures names a Deno package or a phase change (e2e jobs stop at the musl-container Supabase CLI setup, secret-scan flags unverified-URI test fixtures, dependency-audit is the known non-Deno baseline), and plan 03's must-have narrows the criterion to the validation job. Accept that reading, or ask for a fuller run."
    why_human: "The roadmap text says the run is green; the plan's text says one job. Which reading binds is the operator's call."
  - test: "Acknowledge the red 180-final and the operator-ruled re-run as the full-suite close."
    expected: "180-final (head 06beb5190) was red: 4 failed in contestant-identity-provider (10 000 ms slowPage timeouts) and 24 did not run, wrapper exit 1, not void by the wrapper's marker. 180-03-run-attempts.txt attributes it to a foreign `next dev --turbo` process (host load 50-93) and records the operator's ruling 'Re-run after I free host'. 180-final-r2 (head dcde2017d) is 729/729, 0 failed, 0 flaky, 0 did not run, restore OPTIONS 200 for all three functions. CLAUDE.md's E2E Hard Rule says a red run with no void marker is a failure and forbids 'known-flaky' exemptions; the phase's criterion is met only by a complete green run, which r2 is, on a code-identical tree (no non-.planning diff between 06beb5190 and HEAD)."
    why_human: "Whether a contention-attributed red followed by an operator-ordered green re-run satisfies the Hard Rule is a ruling, and the ruling is already recorded; it is surfaced so it is not absorbed silently."
  - test: "Triage open review finding WR-01 (180-REVIEW-DISPOSITION.md: open)."
    expected: "The security-invariant scans in account-access and identity-callback flowConformance.test.ts read only the function's own directory, not the `../_shared/` modules each function now imports. Nothing escapes today (`_shared/` holds two pure helpers), so no phase criterion fails; a future shared module could escape the scans. IN-01 to IN-05 are open as info."
    why_human: "Fix now, defer or accept is the operator's triage; nothing in the phase goal depends on it."
  - test: "Open the repository in VS Code with the documented `deno.enablePaths` setting."
    expected: "Deno diagnostics appear in `apps/supabase/supabase/functions/` and nowhere else."
    why_human: "The LSP probe measured the language server (0 of 7 vanilla files flagged under the recommended setup, 6 of 7 under `deno.enable`); VS Code itself was not observed, which the roadmap, the plan and the docs all state."
---

# Phase 180: Edge Functions, Typecheck and Shared Modules Verification Report

**Phase Goal:** The Supabase Edge Functions are under a typecheck that fails the build on a type error, Deno tooling flags nothing outside the functions directory, and each module that the functions share exists once.
**Verified:** 2026-11-13T17:15:00Z
**Status:** human_needed
**Re-verification:** No, initial verification

All five roadmap success criteria are met in the code. The four human items are rulings and one unobserved editor, not defects.

## Goal Achievement

### Observable Truths (ROADMAP criteria, as amended 2026-11-12)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `yarn typecheck` checks every non-test function module with a Deno pinned exactly as a devDependency of `@openvaa/supabase`; a planted error turns it red naming the error; 0 baseline errors; the three `supabaseAdmin: any` are typed | VERIFIED | `apps/supabase/package.json`: `"deno": "2.9.6"` and `"typecheck": "cd supabase/functions && deno check ."`. Root `typecheck` is `turbo run typecheck`, in `lint:check` and in `.github/workflows/main.yaml:162-163`. I ran `yarn workspace @openvaa/supabase typecheck` (exit 0) and, on a `git archive` export under the scratchpad with a fresh `DENO_DIR`, `deno check .` printed 22 `Check` lines, matching the 22 non-test `.ts` files from `git ls-files`. I planted `const planted: number = 'x'` in `_shared/envConfig.ts` (TS2322 naming that file) and in `send-email/index.ts` (TS2322 naming that file); the same plant in a `*.test.ts` stayed green. `identity-callback/index.ts` lines 152, 174, 182 read `supabaseAdmin: SupabaseClient`, imported through the combined `createClient, type SupabaseClient` import (line 37); no `: any` remains in the file. The working tree was not touched. |
| 2 | Deno flags nothing outside the functions directory: one scoped `functions/deno.json`, no root `deno.json`, `deno.enable` set nowhere, `deno.enablePaths` documented | VERIFIED | `git ls-files` finds `deno.json` at `apps/supabase/supabase/functions/` plus two byte-copies under `.claude/skills/.../sources/` (spike record, inert to Deno, which reads config from its working directory and its parents). No root `deno.json`, no `deno.lock`, no tracked `.vscode/`. `git grep deno.enable` outside `.planning` and `.claude` hits only the CLAUDE.md routing line and the README and docs page, which say "never set `deno.enable`". `deno.json` has no import map: `{"lock": false, "exclude": ["**/*.test.ts"], "lint": {"rules": {"exclude": ["no-import-prefix"]}}}`. `apps/supabase/README.md:383` and the Edge Functions docs page `:154` document `"deno.enablePaths": ["apps/supabase/supabase/functions"]`. LSP probe record `180-03-lsp-probe.txt` shows 6/7 vanilla files flagged under `deno.enable`; the plan's S8 (recommended setup) is 0/7 per the SUMMARY and the probe exit record. |
| 3 | `envConfig.ts` and `placeholderAddress.ts` each exist once under `_shared/` with their tests, imported by relative path; `callerAuthority.ts` stays; `entityGrant.ts` gone; copy-drift check removed; docblocks no longer say duplicated | VERIFIED | `git ls-files` lists exactly four files in `_shared/` (the two modules and two tests), no other `envConfig`, `placeholderAddress`, `entityGrant` or `jwtSegment` file. Seven importers use `../_shared/<module>.ts` (account-access index and addressConfirmation, identity-callback index and serverCredential and placeholderAccount.test, send-email index). `send-email/callerAuthority.ts` is in place. `yarn assert:edge-env-defaults` prints `checks live: 2 of 2 (env-default; vitest-reachability). 0 violation(s).` and exits 0. `vitest run supabase/functions/_shared` passes 25 tests. The parity test reads the frontend copy against the shared constant, so a frontend-only drift fails (control row 180-02-7). No remaining docstring in the functions tree calls a module duplicated (remaining "copy" hits are the frontend `nameCase` copy, the `user_can` matrix and a `.env.example` key note, none about these modules). |
| 4 | Every function still bundles and answers on the restarted stack; each bundle holds exactly its imported shared modules and no test file; the config file does not change the artefact | VERIFIED | Records `tests/e2e-runs/180-unit/180-03-bundles-with/` and `-without/`: all bundle exits 0; `180-03-bundles-compare.txt` reads `cmp identical` for account-access, identity-callback and send-email; `files-*.txt` show account-access and identity-callback holding `_shared/envConfig.ts` and `_shared/placeholderAddress.ts`, send-email holding `_shared/envConfig.ts` only, and no `.test.ts` in any list; `serve.txt` shows OPTIONS 200 for all three and sensible POST `{}` answers. `180-run-checks.mjs` run on `180-final-r2` prints OK with all three functions served. These were measured by the executor on a stack I may not touch; I read the records and re-ran only the stack-free checks. |
| 5 | One CI run observed green with the Deno typecheck in it, unit suites and every gate pass, full E2E and both bank-auth projects green | VERIFIED with human items 1 and 2 | CI run 43405262494: `frontend-and-shared-module-validation` success with 22 `Check` and 23 `Download` lines in the `@openvaa/supabase:typecheck` group (`180-03-t3-verify-amended.exit` 0). Gate exits in `180-03-gate-*.exit`: build, unit-full, lint-check, format-check, test-db, db-lint-sql, validate-links, e2e-coverage-tags, prettier-functions all 0; audit-deps 1 with 0 lines naming Deno (`grep -ci deno` on the log gives 0). I re-ran prettier on the functions tree and `assert:comment-hygiene`, `assert:edge-function-env`, `assert:no-candidate-app-names`, `assert:declared-binaries`: all exit 0. `tests/e2e-runs/180/180-final-r2/summary.json`: 729 total, 729 passed, 0 failed, flaky, skipped and did not run, void null, wrapper exit 0, restore ok; `180-totals.mjs --full` prints `OK (full, 129 projects, 729 tests)` against `179.2-final-4` with an empty delta table. Run head `dcde2017d` differs from HEAD only under `.planning/`. |

**Score:** 5/5 truths verified (0 present-but-behavior-unverified)

### Plan must-haves not restated above

| Plan | Must-have | Status | Evidence |
|---|---|---|---|
| 01 | Spike reference and sources brought over, index and CLAUDE.md routing name the Deno domain | VERIFIED | `CLAUDE.md:371` names the Deno domain among four; the reference file and sources exist (`git ls-files` finds the sources' `deno.json` files). |
| 01 | Totals and run-check instruments; deltas table header only | VERIFIED | Both scripts ran above with exit 0; the deltas file holds the header and no row. |
| 02 | Planted controls each red and reverted | VERIFIED | `180-CONTROL-LEDGER.md` holds rows 180-02-1 to 180-02-7; I reproduced the three typecheck plants on an export. |
| 03 | Todos closed, neighbours annotated, 174 note | VERIFIED | Both closed todos are in `.planning/todos/done/` and absent from `pending/`. |

### Required Artifacts

| Artifact | Status | Details |
|---|---|---|
| `apps/supabase/supabase/functions/deno.json` | VERIFIED | Four keys, as required. |
| `apps/supabase/package.json` | VERIFIED | Pin `2.9.6`, script `cd supabase/functions && deno check .`; `node_modules/.bin/deno --version` prints 2.9.6. |
| `_shared/envConfig.ts`, `_shared/placeholderAddress.ts` and tests | VERIFIED | Substantive, imported by relative path, 25 tests pass. |
| `scripts/assert-edge-env-defaults.mjs` | VERIFIED | Two live checks, run green. |
| `180-CONTROL-LEDGER.md`, `180-function-projects.md` | VERIFIED | Present with rows. |

### Key Link Verification

| From | To | Status | Details |
|---|---|---|---|
| root `typecheck` | `@openvaa/supabase#typecheck` | WIRED | Turbo picks up the workspace script; CI step runs `yarn typecheck`. |
| `typecheck` script | `functions/deno.json` | WIRED | The `cd` makes Deno discover the config. |
| function modules | `_shared/` | WIRED | Seven relative imports with `.ts` extensions. |
| `_shared/placeholderAddress.test.ts` | frontend `identityProviderAccount.ts` | WIRED | Parity case reads both files as text. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Typecheck green on the tree | `yarn workspace @openvaa/supabase typecheck` | exit 0 | PASS |
| Cold check count | `deno check .` on an export | 22 Check lines = 22 non-test modules | PASS |
| Plant in `_shared` / `index.ts` red, in a test green | scratch export | TS2322 naming each file; test plant green | PASS |
| Env-default guard | `yarn assert:edge-env-defaults` | 2 of 2 live, 0 violations | PASS |
| Shared module specs | `vitest run supabase/functions/_shared` | 25 passed | PASS |

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|---|---|---|---|
| E2E-03 | 180-01, 180-02, 180-03 | SATISFIED, see human item 2 | `180-final-r2` 729/729, no deltas. REQUIREMENTS.md lists E2E-03 under Phase 179 as complete; Phase 180 uses it as a closing criterion only. No orphaned requirement: the roadmap names none other for phase 180. |

### Anti-Patterns Found

None blocking. `git grep` for `TBD|FIXME|XXX` in the functions tree and `apps/supabase/package.json` finds none. Open review findings: WR-01 (warning) and IN-01 to IN-05 (info), recorded as open in `180-REVIEW-DISPOSITION.md`; they do not fail a criterion.

### Human Verification Required

1. **CI run-level reading of criterion 5.** Run 43405262494 is red as a run; the validation job with the Deno typecheck is green; the four red jobs name no Deno package and none is touched by this phase's change. Accept the plan's narrower reading or ask for more.
2. **The red 180-final and the re-run.** Surfaced under CLAUDE.md's E2E Hard Rule; the operator's ruling is recorded in `tests/e2e-runs/180-unit/180-03-run-attempts.txt`; r2 is green on a code-identical tree.
3. **WR-01 triage.** The conformance scans do not read `_shared/`. No present violation.
4. **VS Code observation.** The language server was measured; the editor itself was not.

### Gaps Summary

No gaps. Every roadmap criterion holds in the code and in the recorded measurements; the status is `human_needed` only because the four items above need an operator decision or an unobserved tool.

---

_Verified: 2026-11-13T17:15:00Z_
_Verifier: Claude (gsd-verifier)_
