---
phase: 180-edge-functions-typecheck-shared-modules
plan: 03
subsystem: backend
status: complete
tags: [deno, edge-functions, typecheck, shared-modules, supabase, ci-evidence, e2e]

requires:
  - phase: 180-02
    provides: "the Deno typecheck in `yarn typecheck`, `functions/deno.json`, `functions/_shared/`, the controls ledger, the function-projects record"
provides:
  - "`180-verify-bundles.sh`: the bundle, unbundle and standalone-serve pass of one functions export (container `p180-edge`, port 54992)"
  - "`180-lsp-probe.mjs`: the spike's LSP probe, rooted at `PROBE_ROOT`, with this tree's files"
  - "`ci-evidence/180-deno` (`1ed7c6d28`) and CI run `43405262494`, `frontend-and-shared-module-validation` success"
  - the two Edge Function todos closed, four neighbours annotated, the Phase 174 note, the spike reference's `### After phase 180`
  - "the phase's full E2E run of record `tests/e2e-runs/180/180-final-r2`, 729 of 729"
affects: [phase-180-verification, ship]

tech-stack:
  added: []
  patterns:
    - "Bundle and LSP measurements run on `git archive` exports under the session scratchpad, never on the working tree"
    - "Under GitHub Actions turbo groups each task's output in `##[group]` with no task prefix; `gh run view --log` renders ESC as a literal `^[`"

key-files:
  created:
    - .planning/phases/180-edge-functions-typecheck-shared-modules/180-verify-bundles.sh
    - .planning/phases/180-edge-functions-typecheck-shared-modules/180-lsp-probe.mjs
    - .planning/todos/done/2026-10-07-174-nothing-type-checks-the-edge-functions.md (moved from pending/)
    - .planning/todos/done/2026-10-07-174-send-email-jwtsegment-has-no-importer.md (moved from pending/)
  modified:
    - .claude/skills/spike-findings-voting-advice-application-gsd/references/deno-edge-typecheck.md
    - .planning/todos/pending/2026-09-03-deno-edge-functions-do-not-consume-supabase-types.md
    - .planning/todos/pending/2026-10-03-deno-edge-imports-invisible-to-audit-deps.md
    - .planning/todos/pending/2026-08-29-edge-function-non-null-env-assertions.md
    - .planning/todos/pending/2026-08-22-edge-function-fourth-idtoken-verifier-copy.md
    - .planning/phases/174-invitations-grants-defined-in-advance/174-VERIFICATION.md
    - .planning/phases/180-edge-functions-typecheck-shared-modules/180-03-PLAN.md (Task 3's automated check, operator ruling)

key-decisions:
  - "D-28: the operator chose push-without-home-paths (2026-11-13T09:55:37Z); the evidence tree leaves out the two spike captured outputs that hold a home-directory path"
  - "Task 3's CI check counts Check and Download lines inside turbo's `##[group]@openvaa/supabase:typecheck` block with ESC and literal `^[` escapes stripped (operator ruling, commit dcde2017d)"
  - "180-final was red under host contention by a foreign process; the operator freed the host, waived the AC condition, and 180-final-r2 is the run of record"

requirements-completed: [E2E-03]

duration: "~6 h 20 min wall clock (09:35Z to 15:55Z on 2026-11-13), across the D-28, D-26 and re-run waits; the r2 run 19.6 min"
completed: 2026-11-13

actuals:
  tokens: 11000
  tasks: 5
  commits: 4
plan_head_before: d767dd895afc53c62b004cd8b368757bc76296b3
plan_head_after: dcde2017db1f889d64b8cbcc2350b4fe9e650a25
---

# Phase 180 Plan 03: Bundle check, LSP probe, CI evidence, reconciliation and the full run Summary

The committed tree bundles byte-identically with and without `functions/deno.json`, each bundle holding exactly the `_shared/` modules its entry point imports. The documented editor setting keeps Deno off every vanilla file the probe opens (0/7, against 6/7 under `deno.enable`). One CI run of a source-only evidence tree has the validation job green, with 22 `Check` lines from a cold Deno cache. Every gate is green on one tree (`audit:deps` red only on non-Deno advisories). The full E2E suite is 729 of 729 against `179.2-final-4`.

## Commits

`commits: 4` is measured from the ledger (`git rev-list --count d767dd895..dcde2017d`). This SUMMARY's own commit follows it.

| SHA | Subject |
|---|---|
| `bc06a7d85` | docs(180-03): the phase's bundle check and LSP probe |
| `9302cc78a` | docs(180-03): close the two Edge Function todos, annotate their neighbours, note Phase 174 |
| `06beb5190` | docs(180-03): the Deno edge-typecheck reference records this tree after phase 180 |
| `dcde2017d` | docs(180-03): Task 3's CI check counts within turbo's supabase group (operator ruling) |

The evidence commit `1ed7c6d28` sits on `ci-evidence/180-deno`, parented on `origin/main` `340a20070`, and is not on this branch.

## Task 1: bundles and the LSP probe (D-20, D-19)

The functions were exported from HEAD `d767dd895` (the same functions tree as every later head) into `b-with` (with `deno.json`) and `b-without`. Docker could read the scratchpad path, so the Assumption A2 fallback was not needed. The two passes ran one after the other, not side by side (see Deviations).

**Bundles.** Records are in `tests/e2e-runs/180-unit/180-03-bundles-{with,without}/`.

| function | bundle exit (both passes) | `_shared/` in the bundle | test files | OPTIONS | POST `{}` | eszip SHA-256 (both passes) |
|---|---|---|---|---|---|---|
| account-access | 0 | `envConfig.ts`, `placeholderAddress.ts` | none | 200 | `{"error":"bad-request"}` [400] | `022bd420…` |
| identity-callback | 0 | `envConfig.ts`, `placeholderAddress.ts` | none | 200 | `{"result":"refused"}` [401] | `e30b69e8…` |
| send-email | 0 | `envConfig.ts` | none | 200 | `{"error":"templates must be a non-empty object with locale keys"}` [400] | `5d9f6480…` |

`180-03-bundles-compare.txt` reads `cmp identical` for all three, so `diff -r` was not needed. No `Missing required environment variable` line appeared.

**LSP probe.** Run with Deno 2.9.6 on a repository export without `.planning/` and without `node_modules`. Output is in `180-03-lsp-probe.txt`.

| scenario | vanilla flagged | function flagged | function test flagged |
|---|---|---|---|
| `S8-recommended` | **0/7** | 0/3 | 0/1 |
| `S9-functions-deno-json+enable-true` | **6/7** (all but `breakpoints.ts`) | 2/3 | 1/1 |

Task 1's verify exited 0 on `bc06a7d85`. After the push-without-home-paths rebuild it exits 1 at its `git diff --quiet HEAD ci-evidence/180-deno` step, as expected (see Deviations).

## Task 2: the D-28 decision

Recorded in `180-03-push-decision.txt` at 2026-11-13T09:55:37Z: `decision=push-without-home-paths`, in the operator's words "push-without-home-paths (Recommended)", selected in reply to the D-28 question.

The question carried:
- the as-built evidence `a9a14cb41` on `origin/main` `340a20070`, with 3462 paths;
- none of those paths under `.planning/`, `.bg-shell/` or `tests/e2e-runs/`;
- all nine checks `ok`;
- the home-path scan, which found exactly the two spike captures `sources/038-editor-blast-radius/results-deno-2.9.7-no-node_modules.txt` and `sources/040-toolchain-wiring/lsp-probe-with-node_modules-deno-2.9.6.txt`.

The as-built check record is kept as `180-03-evidence-checks-as-built.txt`.

## Task 3: the push, the CI run and the reconciliation

**The push.**
- The evidence was rebuilt without the two files as `1ed7c6d28043d167b868462185f9c42ab4c096df` (tree `e9ac56ad4`, 3460 paths).
- The checks were re-run with the two paths excluded from the diff (`180-03-evidence-checks-without-home-paths.sh`). Every check is `ok`, including `differs-from-head-in-exactly-the-excluded-paths` and `home-path-scan-empty`.
- It was pushed once with `git push --force-with-lease=ci-evidence/180-deno: origin ci-evidence/180-deno` (a new branch). `180-03-ls-remote.txt` reads `remote=1ed7c6d28043d167b868462185f9c42ab4c096df`.

**CI run `43405262494`** (`headSha` `1ed7c6d28`). The final job states, re-read into `180-03-ci-jobs-final.json`, are the same as first found:

| job | conclusion | cause |
|---|---|---|
| frontend-and-shared-module-validation | **success** | — |
| sql-lint, node-engine-range-negative-control, skill-drift-check, supabase-types-drift, dev-seed-integration, docker-image-build, infra-validate, supabase-tests | success | — |
| dependency-audit | failure | `yarn audit:deps`: the 16 high/critical advisories listed under the gates below; none names a Deno package |
| secret-scan | failure | trufflehog found 0 verified and 2 unverified URI results, both deliberate `user:secret@` test fixtures (`tests/tests/utils/mailedLink.test.ts:98`, `apps/supabase/supabase/functions/account-access/signInLink.test.ts:37`). Phase 180 changed neither file. |
| e2e-visual | failure | 2 screenshot diffs, Voter Results Desktop and Mobile, about 7.8k pixels each (ratio 0.01). Phase 180's only frontend change is one comment, so I infer phase 180 did not cause them. |
| e2e-tests | failure | Of 729: 186 passed, 5 failed and 538 did not run. The 5 are 10 000 ms `slowPage` timeouts, `auth-setup` among them, which accounts for most of the did-not-run tests. ECR image pulls were rate-limited and retried. I infer the cause is the slower CI runner; it was not diagnosed. |

**In the validation job's "Type-check all packages" step**, the `##[group]@openvaa/supabase:typecheck` block (`cache miss, executing`) holds:
- **22 `Check` lines**, one per non-test module of the evidence tree (22 counted with `git ls-tree`);
- **23 `Download https://registry.npmjs.org/` lines**, so the Deno cache was cold.

The install step has `##[warning]deno@npm:2.9.6 lists build scripts, but all build scripts have been disabled. (YN0004)`.

**Reconciliation** (commit `9302cc78a`):
- **The typecheck todo**, moved to `todos/done/`. Its resolution records:
  - `deno` 2.9.6 exact, and `yarn typecheck` running `deno check .` from `functions/`;
  - the cold counts, 26 before the move and 22 after;
  - ledger rows 180-02-1 to -5;
  - the CI run and its 22/23 lines;
  - that **D-07 overrules its suggestion of pinning the edge runtime's Deno 2.1.4**.
- **The decoder todo**, moved to `todos/done/`. Its resolution records:
  - the deletion in `be96905d7`;
  - the `NOT_DUPLICATED` sentence removed with the copy-drift check in `3fcd9ff36`;
  - `assert:edge-env-defaults` re-run, printing `checks live: 2 of 2` and exiting 0;
  - the vitest delta 27/1176 → 26/1170.
- **Dated "Phase 180 note"s in the four neighbouring todos.**
  - supabase-types: the functions are now type-checked, but no `createClient<Database>` exists yet.
  - audit: there is no import map, `"lock": false` and no Deno lockfile; the checker itself is in `yarn.lock`.
  - non-null assertions: 14 grep lines, of which 9 are in three `index.ts` files holding 14 assertions and 5 are in tests; `!` is not flagged by `deno check`.
  - verifier copy: `_shared/` exists, and no verifier moved.
- **174-VERIFICATION.md** has a dated "Phase 180 note": a type-checked `index.ts`, CI run `43405262494`, and still no live run on a misconfigured deployment. Its frontmatter is unchanged.

**Reference** (commit `06beb5190`). A `### After phase 180` subsection at the end of the branch section records:
- the 22 checked modules and the 24 tests beside them;
- `_shared/`'s four files;
- `deno lint`: `Checked 22 files`, `Found 4 problems`, all `require-await` (`180-03-deno-lint.log`);
- the bundle comparison and the probe's figures;
- the CI run and its grouped output;
- Pitfalls 6 and 8;
- D-12 as documented, "not observed", with no `fmt` key;
- the hosted project's pre-move bundles.

The file minus its branch section is byte-equal to `796e610a7`'s. The `UNIT_STACKFREE` run before the commit exited 0 (`180-03-c1-unit-stackfree`). Its log has supabase and frontend and no `@openvaa/dev-seed:test:unit`; dev-seed ran 79 files / 1254 tests and the tests workspace 13 / 224.

**Task 3's verify.**
- **As first written it exited 1** ("modules 22, Check lines 0, Download lines 0"), for two reasons:
  - Under GitHub Actions, turbo prints each task's output inside `##[group]` with no `@openvaa/supabase:typecheck: ` prefix (0 such lines in the log).
  - `gh run view --log` renders ESC as the two characters `^[` (0 ESC bytes, 1302 literal `^[[`).
- **Operator ruling, "Amend the check".** In `180-03-PLAN.md` and in `180-03-t3-verify.sh`, the check now counts `Check` and `Download` lines only inside that block of the Type-check step, with both escape forms stripped. The rest of the check is unchanged, including Check count = non-test module count and Download count > 0. This is commit `dcde2017d`.
- **The amended verify exits 0** (`180-03-t3-verify-amended.{log,exit,head}`).

## Task 4: the D-26 answer

"stack free", the operator's words, relayed. Recorded at 2026-11-13T11:03:42Z in `180-03-d26-answer.txt`, with the note that `-infra` will not use the stack until its plan 185-21 and will ask first. Task 4's verify exited 0 before any stack use (`180-03-stack.txt` did not exist then).

## Task 5: stack, gates and the full run

**Stack check** (`180-03-stack-check.sh`, a restart from this worktree; first at 11:04:32Z, again at 15:34:01Z before r2):
- db:stop 0 and db:start 0;
- `migrations_applied=22` = `migrations_manifest=22` both times, so no reset was needed;
- `functions_mount` is this worktree's functions directory;
- `edge_runtime_running=true`.

**Gates on head `06beb5190`** (`180-03-gates.head`). HEAD `dcde2017d` differs from it only in `.planning/` (`git diff --quiet` exit 0).

| gate | exit |
|---|---|
| `yarn build` (`build`) | 0 |
| `yarn test:unit` (`unit-full`; 26/26 tasks, `default-template.integration` included) | 0 |
| `yarn lint:check` (`lint-check`) | 0 |
| `yarn format:check` (`format-check`) | 0 |
| `yarn workspace @openvaa/supabase test:db` (`test-db`; 58 files, 2898 tests, PASS) | 0 |
| `yarn db:lint:sql` (`db-lint-sql`) | 0 |
| `yarn workspace @openvaa/docs validate:links` (`validate-links`) | 0 |
| `yarn assert:e2e-coverage-tags` (`e2e-coverage-tags`) | 0 |
| `yarn prettier --check apps/supabase/supabase/functions` (`prettier-functions`) | 0 |
| `yarn audit:deps` (`audit-deps`) | 1, none naming a Deno package |

**audit-deps findings** (0 lines naming `deno@` or `@deno/`):
- Critical: dompurify GHSA-cg2g-xh64-v4q7, shell-quote GHSA-pqg4-j6r4-53mv.
- High:
  - compression GHSA-vc2v-76pw-4v95
  - dompurify GHSA-mrv2-3pqr-j5jr
  - launch-editor and vite GHSA-587h-7wmj-h5pm
  - source-map-js GHSA-68fv-2mgg-jv7q
  - undici GHSA-xjj6-f33q-929c, GHSA-4w7w-5xrc-9h26, GHSA-2m5v-pch6-74hx, GHSA-qrxm-fqhp-jwvm (two ids each)
  - zod GHSA-mrhx-c7xc-m3w5

The accepted baseline (`security/audit-baseline.json`) holds 0 advisories.

`check:schema-equivalence` was not run: no schema or migration file changed in the phase (`git diff --quiet 32314f7d4 HEAD -- apps/supabase/supabase/schema apps/supabase/supabase/migrations` exit 0). `deno.json` has no `fmt` key.

**Every gate script, traced over the root `package.json` at run time:**
- `yarn lint:check` chains every root `assert:*` script except two:
  - `assert:unit-coverage` runs first inside `yarn test:unit`;
  - `assert:e2e-coverage-tags` is chained by no script and was run on its own above, exit 0.
- These are the same two as at planning.

**The full run: attempts.** Both are recorded in `180-03-run-attempts.txt`.

1. **`tests/e2e-runs/180/180-final`: red, not void.**
   - Started 11:07:07Z, ended 11:37:07Z, with 29.1 min of tests. Wrapper exit 1.
   - 701 passed, 4 failed, 24 did not run.
   - The 4 failures were all in `contestant-identity-provider` (38/42), all 10 000 ms `slowPage` waits. The 24 did-not-run tests were the dependent `data-setup-perm-closed-project` (1) and `perm-closed-project` (23).
   - Not void: the heartbeat's largest gap was 565 ms, and `pmset -g log` shows no sleep or wake in the window.
   - From about 11:26Z the host load rose to 50–93. The top process was another project's `next dev --turbo` server, at 77–233 % CPU. `contestant-identity-provider`'s test time was 4.37× that of `180-02-targeted`, while the other projects ran at 0.97–1.35×.
   - **Operator ruling:** "Re-run after I free host" and "don't mind me being on battery". The foreign process was stopped and the AC condition waived. The directory is kept.
2. **`tests/e2e-runs/180/180-final-r2`: green, the run of record** (`180-03-run-of-record.txt`).
   - Started 15:34:18Z, ended 15:53:56Z, with 18.9 min of tests. Wrapper exit 0, head `dcde2017d`.
   - On battery at 100 %, discharging, as waived.
   - Peak host load 27.4, no `next-server` in `host-state.log`, heartbeat's largest gap 136 ms.

**Judging r2:**

| step | result |
|---|---|
| `e2e-evidence.mjs` | exit 0: total 729, passed 729, failed 0, flaky 0, skipped 0, didNotRun 0 |
| 1. `180-totals.mjs --full` | exit 0, `OK (full, 129 projects, 729 tests)`: 729 of `179.2-final-4`'s 729 plus the summed deltas (none) |
| 2. `e2e-spec-verdict.mjs --no-flaky --passed contestant-bank-auth.spec.ts --passed contestant-identity-provider.spec.ts` | exit 0, `VERDICT OK: 729 tests` |
| 3–5. `180-run-checks.mjs --projects 180-function-projects.md` | exit 0: 129 projects checked. `restore.txt` has `OPTIONS account-access: 200`, `OPTIONS identity-callback: 200`, `OPTIONS send-email: 200`, `restore: ok`, and no `_shared` line. `idp-functions.log` serves exactly `account-access`, `identity-callback` and `send-email`, with 0 `import map` / `deno.json` lines. |
| 6. head check | `git diff --quiet dcde2017d HEAD -- . ':(exclude).planning'` exit 0 |
| Task 5 `<automated>` (`180-03-t5-verify.sh`) | exit 0 |

**The bank-auth projects (D-24, E2E-03):** `bank-auth` 12 of 12 passed, and `contestant-identity-provider` 42 of 42 passed, the same totals as in `179.2-final-4`.

**Deltas:** none. Title pins: `contestant-bank-auth.spec.ts` and `contestant-identity-provider.spec.ts`, both all passed.

**Restore, criterion 4's "answers on the restarted local stack":** `yarn db:stop` exit 0 after 5 s, `yarn db:start` exit 0 after 25 s, the edge runtime running, all three functions `OPTIONS 200`, and `restore: ok` at 15:53:56Z.

## Deviations from Plan

1. **The two bundle passes ran sequentially in one background job**, not each in its own background job. Both use container `p180-edge` on port 54992, so running them side by side would collide.
2. **The evidence commit message carries the Co-Authored-By trailer** after the subject the execution rules prescribe, because every commit message must end with the attribution lines. A first build without the trailer (`b43d39f88`) was replaced before any check ran.
3. **The evidence tree differs from HEAD in three paths.** It was built without the two home-path files, per the operator's D-28 decision. The spike reference `.md` was changed by `06beb5190` after the push, in the plan's own order; `paths-ignore: "**.md"` means that file cannot change a CI result. So Task 1's verify, re-run now, exits 1 at its full-tree diff step. That is the expected and recorded consequence; the committed check was not loosened.
4. **The plan's Task 3 `<automated>` check was amended by operator ruling** (`dcde2017d`), so that it counts within turbo's supabase group with both escape forms stripped. This is the one edit to a PLAN file. The execution rules otherwise forbid executor PLAN edits; the operator ruled it.
5. **The full run was made twice.** `180-final` was red under host contention by a foreign process, and the operator ruled a re-run after freeing the host and waived the AC/battery condition. `180-final-r2` is the run of record.

## Observed and inferred

**Observed:**
- every exit status, count and log line above;
- the bundles, the probe and the CI job states and lines;
- the stack records;
- both runs' counts, `restore.txt`, `idp-functions.log` and `host-state.log`.

**Inferred:**
- that 180-final's failures came from the foreign process's load. The load, the process and the per-project slowdown are observed; the causal link is not proven. r2 on the freed host is green on a tree equal outside `.planning/`.
- that the CI `e2e-tests` and `e2e-visual` reds are runner-speed and pre-existing visual drift rather than this phase.
- that `deno.enablePaths` behaves in VS Code as documented. D-12's editor half is documented, not observed; its automated proxy is observed.

## Known Stubs

None.

## Threat Flags

None. T-180-10: one push only, on the operator's go, of a source-only tree with no ignored, planning, shell-manifest or run paths and no home-directory path. T-180-11: `cmp`-identical bundles, with no test file in them. T-180-12: nothing deployed. T-180-13: exports only, so `functions/.env` was never read or mounted. T-180-14: the D-26 checkpoint came before every stack use.

## Self-Check: PASSED

- `180-verify-bundles.sh`, `180-lsp-probe.mjs` and both `todos/done/` files exist.
- All four plan commits are ancestors of HEAD.
- `ci-evidence/180-deno` is at `1ed7c6d28` locally and on the remote.
- `tests/e2e-runs/180/180-final-r2/summary.json` exists.
- The Task 2, 3 (amended), 4 and 5 verify blocks exit 0.
