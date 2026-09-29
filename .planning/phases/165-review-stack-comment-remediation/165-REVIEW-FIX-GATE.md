# 165 Review-Fix Re-Gate Record

**Why:** the code-review fix pass (`165-REVIEW-FIX.md`: 38 findings fixed, 2 needing no change) landed
45 commits after the last green CI tree (`26b8e3fb2`, whose code tree is `311494c7f`'s). This record
re-runs every D-06 gate on the result, pushes it to PR #889 and records the CI run for its tree.

**Gated commit:** `ee550b0cf582b4ed715aca8b744abfc62767e1e5` on `ship/v2.15-13-review-fixes`
(`chore(165-36): re-record the tests/README.md read after 2b0fdffa3`). Every later commit changes
`.planning/` only.

Method as in `165-35-GATE.md`: every command ran on its own from the repo root, its exit status read
directly (`cmd > log 2>&1; echo "exit=$?"`), never through a pipe. `TURBO_FORCE=true` on build, lint
and unit, so every turbo task re-executed (`Cached: 0 cached`).

## Commits made by the re-gate

| Commit | What |
|---|---|
| `af954d5c2` | `docs(165)`: hygiene residue in the files the fix pass brought into the changed set (comment and Markdown lines only) |
| `070b83192` | `docs(165)`: regenerated component docs (`generate:docs`) |
| `56bbfa418` | `chore(165-36)`: 71 hygiene reads |
| `2b0fdffa3` | `fix(165)`: two `tests/README.md` lines restored verbatim for `e2eDocPreconditionGate` |
| `ee550b0cf` | `chore(165-36)`: the README read re-recorded |

## Step 1: hygiene reads and the branch-wide gate

**What needed reading.** `hygiene-changed-files.sh --base ship/v2.15-12-planning --check-reads`,
run in a detached worktree at `d947eac57` (the fix pass's tip), reported layers 1-5 at 0 and
**59 unread files**: every file the fix pass changed, apart from the two `.claude/` skill files
(exempt) and the deleted `tests/tests/utils/missingNominations.ts`. Of the 59:

- 5 are new files (`paraglide.options.ts`, `scripts/compile-paraglide.ts`,
  `organizationMatching.ts` and its test, `ci-write-local-keys.sh`). Each was read in full, as its
  whole content is in the fix-pass diff.
- 33 had a recorded read of their pre-fix blob (`26b8e3fb2`). They were read through the full
  fix-pass diff (`git diff 26b8e3fb2 HEAD`, 3,732 lines), which covers every line that changed since
  that read.
- 21 joined the changed set for the first time in the fix pass. They were read in full:
  `apps/frontend/package.json`, `tsconfig.json`, `vite.config.ts`, the About page, both
  `callerAuthority.ts` copies and the test, `tests/README.md`, `tests/playwright.config.ts`,
  `tests/scripts/e2e-run.sh`, the minimal results fixture, six setup files,
  `performance-budget.spec.ts` and three perm specs.

**Residue found by the read and fixed (`af954d5c2`).** The automated layers do not detect it:

- **Planning ids:**
  - `QUAL-1` in `vite.config.ts` (a phase-137 requirement id);
  - `EFLOW-10b`, `F3` (28 `// reason:` lines), `HIGH-2`, "Confirmed via Gate A 2026-05-26", and the `W1`/`W3`/`W5` and `A1`..`A12` labels in `playwright.config.ts`.
- **Change narrative:**
  - "is now declared", "the previous `/auth\.setup\.ts/`", "the iteration-2 wiring", "the review's own suggestion", "The former per-app maintenance pair was CONSOLIDATED", "Renamed in place from the former", "the first end-to-end coverage this application has ever had", "once passed", "a past sweep" (config);
  - "which is why the served-application gate ran on 5273" and "the previous `sed -n '2,Np'`" (`e2e-run.sh`);
  - "the prior ... conditional ... Replacing with" (`auth.setup.ts`);
  - "failed once here", "was rewritten to close" (`performance-budget.spec.ts`).
- **Stale line anchors, now content anchors:**
  - `auth.setup.ts:23-57` and `:66-98` (four perm setups);
  - `perm-question-video.ts:42`;
  - `+page.svelte:294`, `EntityOpinions.svelte:78` (twice) and `perm-answers-locked.spec.ts:67-76`;
  - `supabaseDataProvider.ts:384`;
  - `perm-per-app-notifications.spec.ts:18`.
- **A codemod-collapsed usage example** in `playwright.config.ts`: four commands had been run together on one comment line. They are now one sentence with inline commands. The repo's forced-line-break rule does not recognise `VAR=1 cmd` lines as a recipe, so a one-per-line list fails it.
- **Stale facts:**
  - `_probes` holds one probe (`defaultTemplateResults`), not "4 deferred perm-seeded probes" (config) or "five specs" (README);
  - `auth-setup` runs in the default run, not "opt-in `PLAYWRIGHT_VISUAL`" (README table);
  - the perm chain continues past `perm-disable-allow-open`, which the config's header marked "(END)";
  - the budget rule in `performance-budget.spec.ts` is below, not "three paragraphs above";
  - `CLAUDE.md` has no "Likert-only canonical chain" (README).

Every changed code line in `af954d5c2` is a comment line (`git diff -U0` over `*.ts`/`*.sh`
leaves no non-comment line), and `yarn typecheck:tests` exits 0.

**A consequence, caught by the unit gate.** Two README lines the commit reworded are allowlisted
verbatim by `packages/dev-seed/tests/e2eDocPreconditionGate.test.ts`. The first `test:unit` run
failed 4 of its 7 tests. Both lines were restored byte for byte (`2b0fdffa3`), as the A-WR-04 fix
did for the same constraint, and the test passes 7/7. The two lines keep a "now" wording; that is
logged in `deferred-items.md`.

**Component docs.** The generated component pages had not been regenerated since this phase changed
their source docstrings. `yarn workspace @openvaa/docs generate:docs` exits 0 and changes 12 pages
(`070b83192`):

- the fix pass's Alert `inert` note;
- the docstring edits of 165-31, 165-32 and 165-33: Expander, Input, InputGroup, NumberScaleInput, QuestionChoices, QuestionOpenAnswer, ScoreGauge, Video, EntityCard, EntityDetails and InfoItem.

Each source file is in the branch's changed set. `generate:component-docs` on its own fails with
`ERR_MODULE_NOT_FOUND`, because its script names a file that does not exist. That predates the phase
and is logged in `deferred-items.md`.

**Reads recorded.** `record-hygiene-read.sh 165-36` recorded 71 rows (the 59 files plus the 12
pages), and later the README again after `2b0fdffa3`. The recorder runs `--files` first, and it passed
each time.

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `git worktree add --detach <scratch>/hyg-wt ee550b0cf` | 0 | `git status --short` empty |
| 2 | `bash .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh --base ship/v2.15-12-planning --check-reads` (inside that worktree) | 0 | `285 file(s) in scope`; `total failing items: 0 (layer1=0 layer2=0 layer3=0 layer4=0 layer5=0 unread=0)`; `VERDICT: CLEAN` |
| 3 | `git worktree remove <scratch>/hyg-wt` | 0 | removed |

The same gate also ran at `56bbfa418` (CLEAN, 285 files) before the README restoration. The
maintainer's uncommitted `MainContent.svelte` and `.planning/milestone.lock` never reach the scratch
worktree, and were never staged, edited or recorded.

## Step 2: local gates

| # | Command | Exit | Summary line |
|---|---|---|---|
| 1 | `TURBO_FORCE=true yarn build` (at `56bbfa418`; later commits change only `tests/README.md` and `.planning/`) | 0 | `Tasks: 14 successful, 14 total` / `Cached: 0 cached, 14 total` |
| 2 | `TURBO_FORCE=true yarn lint:check` (at `ee550b0cf`) | 0 | turbo lint `11 successful` / `0 cached`; typecheck `23 successful` / `0 cached`; svelte-check `0 errors and 0 warnings` (docs, frontend); every `assert:*` guard `0 violation(s)` or `0 finding(s)`; comment-hygiene guard `0 violation(s)` over 1728 files |
| 3 | `yarn format:check` (at `ee550b0cf`) | 0 | `All matched files use Prettier code style!` twice (root, `apps/docs`); 0 `[warn]` |
| 4 | `TURBO_FORCE=true yarn test:unit` (at `2b0fdffa3`, code tree of `ee550b0cf`) | 0 | `Tasks: 25 successful, 25 total` / `Cached: 0 cached, 25 total`; unit-coverage guard `Total: 0 violation(s)` |

The first `test:unit` run, at `56bbfa418`, exited 1 on the `e2eDocPreconditionGate` failures
described above.

Unit suites, per package, all passed: supabase 15/195, core 3/8, matching 5/43, data 47/244,
filters 1/22, app-shared 9/92, llm 2/39, question-info 2/22, argument-condensation 6/30, dev-seed
61/799, frontend 110/1900. That is 261 files and 3394 tests; 165-35 had 259 and 3367.

The lint warnings are the same 18 as in 165-35, all predating the phase: dev-seed 15, frontend 1,
tests 2.

**Database.** `git diff 26b8e3fb2 HEAD -- apps/supabase/supabase/schema apps/supabase/supabase/migrations`
is 4 lines, all SQL `--` comments outside any function body: A-IN-01's two comments in
`107-feedback.sql` and their regenerated copy in `00001_initial_schema.sql`. Nothing reaches
`prosrc` or the catalog, so generated types cannot change, and no fresh reset is needed. The drift
check ran before pgTAP, against the database as it stood. `db:reset` was not run.

| # | Command | Exit | Summary line |
|---|---|---|---|
| 5 | read-only `pg_proc` count in `supabase_db_openvaa-local` | — | 12 pgTAP helpers in `public`, left by the fix pass's `test:db` runs |
| 6 | `yarn db:types` | 0 | — |
| 6b | `git diff --exit-code HEAD -- packages/supabase-types/src/database.ts` | **1** | 27 insertions, 0 deletions. The added entries are exactly the 12 helpers, as in 165-35 row 3b: `create_test_data`, `reset_role`, `set_test_grants`, `set_test_retired_claim`, `set_test_user`, `test_grants_claim`, `test_id`, `test_rls_digest`, `test_seed_fixture_grants`, `test_seed_identity_grants`, `test_user_grants`, `test_user_id` |
| 7 | `git checkout -- packages/supabase-types/src/database.ts` | 0 | helper-only drift discarded, never committed |
| 8 | `yarn db:lint:sql` | 0 | `No schema errors found`; lint-schema `Summary: 0 error(s), 3 warning(s)` (the three advisory FK-index warnings of 165-35); census `policies examined: 102` |
| 9 | `yarn workspace @openvaa/supabase test:db` | 0 | `Files=34, Tests=1261`, `Result: PASS`, 0 `not ok` lines |

Row 6b measures the pgTAP helpers, not the schema. No generated type was removed or changed, and
the fix pass changed no schema statement. 165-35's second pass proved the fresh-reset form on the
same schema text. pgTAP grew from 1254 to 1261 with the fix pass's A-WR-03 assertion (18, plan
60) and A-IN-02's six same-project collision assertions (33, plan 48).

| # | Command | Exit | Result |
|---|---|---|---|
| 10 | `bash .planning/phases/165-review-stack-comment-remediation/scripts/tip-proofs.sh` | 0 | 27 `PASS`, 0 `FAIL` |
| 11 | `bash .planning/phases/165-review-stack-comment-remediation/scripts/ledger-check.sh --final` | 0 | `78 inline rows (expected 78) — 50 fix / 25 split-artifact / 1 already-fixed / 1 deferred / 1 wont-fix`; appendix 12 rows; `VERDICT: PASSED` |

## Step 3: full E2E suite

| Field | Value |
|---|---|
| Command | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-review-fix --no-db-reset` |
| Window (UTC) | `2026-09-29T07:12:23Z` - `2026-09-29T07:17:31Z` (Playwright `165 passed (4.9m)`) |
| Wrapper exit | 0 (`exit` file and the process status) |
| Preflight | `preflight-failures` 0 / `preflight-successes` 1 |
| `head` (commit served) | `ee550b0cf582b4ed715aca8b744abfc62767e1e5`, the gated commit |
| Posture | `db_reset=false`, `package_watcher=true` (local default), `e2e_project_id=…0e2`, observed workers 6, retries 0 |
| `node .planning/phases/165-review-stack-comment-remediation/scripts/e2e-verdict.mjs tests/e2e-runs/165-review-fix` | exit 0: `exit=0 expected=165 unexpected=0 flaky=0 skipped=0`, `VERDICT: GREEN (expected 165 >= 165, 0 failed, 0 flaky, 0 did-not-run)` |

Nothing was listening on 5273 before or after the run. `worktree-status.txt` lists only the
maintainer's `MainContent.svelte` and `.planning/milestone.lock`. The suite took 4.9 minutes against
165-35's 11.3. The fix pass changed the walk's budgets and waits (C-WR-05 and its neighbours), but
the cause of the difference was not measured, and machine load differed between the two runs.

The local run uses the package watcher, the wrapper's default. The CI jobs pass `--no-watch`
(A-WR-04), which the fixer smoke-tested locally and which Step 5 observes in Actions.

## Step 4: push

| # | Check | Result |
|---|---|---|
| 1 | `git diff --quiet ee550b0cf HEAD -- . ':(exclude).planning'` | exit 0: HEAD was the gated commit |
| 2 | `git merge-base --is-ancestor origin/ship/v2.15-13-review-fixes HEAD` | fast-forward from `26b8e3fb2` |
| 3 | Pattern sweep over the added lines of `git diff ship/v2.15-12-planning...HEAD` and of every commit's patch in `ship/v2.15-12-planning..HEAD`: JWT-shaped tokens, `sb_secret_`/`sb_publishable_`, private-key blocks, `SUPABASE_(SERVICE_ROLE|ANON)_KEY=` with a literal value | 7 diff hits and 13 patch hits. Every one is either a `sed` expression of the key-writing step (`=.*` or `=$ANON_KEY`, with no literal value) or 165-36-PLAN's own description of the pattern. No secret |
| 4 | `trufflehog git file://<main repo> --since-commit ship/v2.15-12-planning --branch ship/v2.15-13-review-fixes --fail --no-update` | exit 0; `chunks 3527`, `verified_secrets 0`, `unverified_secrets 0`. The main repository's path is used because trufflehog cannot open this linked worktree (`.git` is a file); the two share refs and objects |
| 5 | `git push origin ship/v2.15-13-review-fixes` | `26b8e3fb2..ee550b0cf`, a normal push (no force) |

`MainContent.svelte`, `.planning/milestone.lock` and `.env` are in no pushed commit.

## Step 5: CI

**Evidence commit.** `main.yaml`'s `pull_request` trigger covers only PRs into `main`, so PR #889
gets no run. As in 165-36, `git commit-tree` put the PR head's tree
(`9fe29eceef1dff21f43cd5258295b9e86284c50e`, the tree of `ee550b0cf`) on `origin/main`, giving
`667ee159cbd4b4de8c164e8d9c23d163e33620e1`. Its tree was checked equal to the PR head's, and it
was pushed with a normal push to the new branch `ci-evidence/165-review-fixes-tree-7`.

**Run [36535849705](https://github.com/OpenVAA/voting-advice-application/actions/runs/36535849705):**
`push` event, attempt 1, `2026-09-29T07:18:26Z` - `07:35:24Z`, conclusion **success**. No re-run.

| Job | Result | Duration |
|---|---|---|
| `dependency-audit` | success | 56 s |
| `secret-scan` | success | 39 s |
| `dev-seed-integration` | success | 3 m 53 s |
| `node-engine-range-negative-control` | success | 18 s |
| `skill-drift-check` | success | 12 s |
| `frontend-and-shared-module-validation` | success | 6 m 14 s |
| `supabase-tests` | success | 2 m 35 s |
| `sql-lint` | success | 3 m 8 s |
| `supabase-types-drift` | success | 2 m 53 s |
| `e2e-tests` | success | 16 m 54 s |
| `e2e-visual` | success | 5 m 45 s |

**The full E2E suite in Actions.** The job log has `165 passed (11.9m)`, `playwright exit 0` and
`preflight failures 0, successes 1`. The uploaded run directory's `e2e-verdict.mjs` reads
`exit=0 expected=165 unexpected=0 flaky=0 skipped=0`, `VERDICT: GREEN`. `e2e-visual` passed 7 of 7.

**The fix-pass items that could only be checked in Actions:**

- **A-WR-04 (`--no-watch`).** Both E2E jobs ran `tests/scripts/e2e-run.sh ... --no-db-reset --no-watch`. Both uploaded `env-posture.txt` files record `package_watcher=false`, and the `e2e-tests` `devserver.log` has no `turbo`, `watch:shared` or `concurrently` line. The preflight passed in both jobs, on project `…0e2`. The log opens with esbuild's missing `.svelte-kit/tsconfig.json` warning, which also appears in both local watcher-mode runs (`165-close`, `165-review-fix`), so `--no-watch` did not introduce it.
- **A-IN-03 (`ci-write-local-keys.sh`).** The step "Write the local Supabase keys into .env" ran `tests/scripts/ci-write-local-keys.sh` in both E2E jobs and succeeded, with no `::error::`. The suites behind it authenticated against the runner's stack: the service-role readiness poll, the admin and candidate logins, and the seeding.
- **A-IN-05 (`paraglide:compile`).** `dev-seed-integration` ran `yarn workspace @openvaa/frontend paraglide:compile`, and it succeeded. The test that reads its output, `tests/projectScopingGate.test.ts`, passed its 121 tests.
- **A-IN-04 (the pin test).** `tests/rpcNullabilityGate.test.ts` passed its 9 tests in `dev-seed-integration`, including the two that require every `supabase/setup-cli` pin to equal the lockfile's `supabase` version. dev-seed passed 61 files and 799 tests, the local count.
- **A-IN-02 (key masking).** `dev-seed-integration` now emits `::add-mask::` for both keys before writing them to `$GITHUB_ENV`.
- **A-WR-01 (`forbidOnly`).** The CI run's `results.json` resolves `forbidOnly: true`, and a project timeout of 180000 ms (D-16), through the wrapper that unsets `CI`.

## Verdict

Every D-06 gate passes on the gated commit `ee550b0cf`, and every later commit changes `.planning/`
only:

- `TURBO_FORCE=true yarn build`, `lint:check` and `test:unit` (261 files, 3394 tests) and `yarn format:check` pass;
- `yarn db:lint:sql` passes;
- pgTAP passes with 34 files and 1261 tests;
- `db:types` shows only the 12-helper drift, and the fix pass changed no schema statement;
- the full local E2E suite is GREEN: 165, 0 failed, 0 flaky, 0 did-not-run;
- the branch-wide hygiene gate with `--check-reads` is CLEAN over 285 files;
- `tip-proofs.sh` and `ledger-check.sh --final` pass.

In CI, run 36535849705 on a tree identical to the PR head passed all 11 jobs on the first attempt,
including the full E2E suite (165/0/0/0) and the visual baselines (7/0/0/0).

## Step 6: records

- The PR #889 body now carries this run in its CI table, the new gate numbers and a fix-pass section. Its two closing attribution lines are unchanged.
- `165-36-SUMMARY.md`'s CI table has a row for run 36535849705.
- `STATE.md`'s last activity is updated.
- `deferred-items.md` logs four items:
  - the `timeout` comment item, closed;
  - the broken `generate:component-docs` script;
  - the two README lines the precondition gate holds verbatim;
  - the out-of-set probe header.

This record, those files, and the commit that carries them change `.planning/` only. They were
pushed with a normal push after the CI run above.
