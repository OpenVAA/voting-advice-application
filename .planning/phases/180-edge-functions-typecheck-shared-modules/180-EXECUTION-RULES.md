# Phase 180 — Execution rules (binding on every plan)

Every PLAN.md of this phase names this file in its `<context>`. A plan's own text wins where it is more specific.
**A hook line of the form `CONTEXT WARNING NN%` belongs to the orchestrator: ignore it.**

## Names

| Name | Value |
|---|---|
| `$P` | `.planning/phases/180-edge-functions-typecheck-shared-modules` |
| `$FN` | `apps/supabase/supabase/functions` |
| `$K` | `.claude/skills/spike-findings-voting-advice-application-gsd` |
| `$SPIKE` | `796e610a7` — the spike wrap-up on branch `spike/deno-edge-typecheck`, read with `git show` / `git checkout $SPIKE -- <path>` |
| `$R` | `tests/e2e-runs/180` (run directories; gitignored, never deleted) |
| `$U` | `tests/e2e-runs/180-unit` (logs, `.exit` and `.head` markers, stack records; gitignored) |
| `$BASE_RUN` | `tests/e2e-runs/179.2/179.2-final-4` — the last full run: 729 passed of 729, 129 projects, 0 failed, 0 flaky, 0 did not run; its `head` is `077114a7c`, which differs from the planning head outside `.planning/` only in `.claude/skills/database/SKILL.md` |
| `$X` | a scratch directory **outside** the repository: the executing session's scratchpad when it has one, otherwise `mktemp -d`. Never a path under this worktree |
| the planning commit | `git log --diff-filter=A -1 --format=%H -- $P/180-EXECUTION-RULES.md` (the commit that added this file) |
| the deltas | `$P/180-E2E-DELTAS.md` (created by plan 01) |
| the totals check | `$P/180-totals.mjs` (created by plan 01, contract below) |
| the run checks | `$P/180-run-checks.mjs` (created by plan 01, contract below) |
| the ledger | `$P/180-CONTROL-LEDGER.md` (created by plan 02) |
| the function projects | `$P/180-function-projects.md` (created by plan 02) |
| the bundle script / the probe | `$P/180-verify-bundles.sh`, `$P/180-lsp-probe.mjs` (created by plan 03; the spike's copies under `$K/sources/` stay verbatim) |
| the evidence branch | `ci-evidence/180-deno` |

The phase has no requirement id of its own; E2E-03 is its closing criterion, so every plan lists `requirements: [E2E-03]`. Its must-haves derive from the roadmap's five success criteria (1 and 3 as amended by D-02) and `180-CONTEXT.md` D-01 to D-29.

**Resolutions the orchestrator recorded before planning (binding):**
1. The `_shared/` move commit carries every prose fix the move makes false, including the six code-side surfaces `180-RESEARCH.md` § "Prose surfaces" adds to D-17's list. The seventh, `CLAUDE.md`'s Skill Routing entry ("three domains"), is made false by plan 01's new domain line, so plan 01 fixes it in the commit that adds the line. A last code commit of plan 02 carries only the new editor documentation (`deno.enablePaths`).
2. D-12: "Prettier formats this tree" is documented; `deno.json` gets no fifth key.
3. The edited `verify.sh` and `lsp-probe.mjs` live in `$P`; `$K/sources/` stays byte-identical to `$SPIKE`.
4. No dev-seed wiring spec is added (no locked decision asks for one).
5. When the closing todo `2026-10-07-174-nothing-type-checks-the-edge-functions.md` is closed, it records that D-07 overrules its suggestion of pinning the edge runtime's 2.1.4.

**Facts measured at planning (re-measure before relying on one):**
- `$FN` holds `account-access`, `identity-callback`, `send-email`; 26 non-test `.ts` modules and 25 `*.test.ts`; no `_shared/`, no tracked `deno.json`/`deno.jsonc`/`deno.lock`, nothing tracked under `.vscode/`.
- `deno` is not on `PATH` and this worktree has no `node_modules/.bin/deno` until plan 02 installs it.
- `scripts/assert-edge-env-defaults.mjs` prints `checks live: 3 of 3 (env-default; copy-drift; vitest-reachability)`.
- Two captured outputs the spike's `sources/` holds (`038-editor-blast-radius/results-deno-2.9.7-no-node_modules.txt`, `040-toolchain-wiring/lsp-probe-with-node_modules-deno-2.9.6.txt`) contain absolute paths under the operator's home directory. No tracked `.claude/` file contains one today. See § The CI evidence channel.
- `apps/frontend/src/lib/auth/passwordLogin.test.ts` contains "byte-identical copies" in a comment unrelated to this phase; every prose gate of this phase is scoped so that it never reads that file.

## Operator constraints (2026-11-12, binding: D-26 to D-29)

- **D-26 — the stack.** No phase-180 command may use the local Supabase stack until the operator says that the `-infra` plan 185-10 has returned. Each plan asks it in a `checkpoint:human-verify` placed before its first stack-using step; the checkpoint is never auto-approved, whatever `mode` or `auto_advance` says, and the standing "stack is always free" authorisation of 2026-10-20 does not answer it. Stack-using commands: `yarn test:unit` (root), `yarn db:*`, `yarn workspace @openvaa/supabase test:db`, any `tests/scripts/e2e-run.sh`, any `docker exec`/`docker inspect` of a `supabase_*_openvaa-local` container, `supabase start|stop|status`. Stack-free and allowed before the checkpoint: edits, `git` operations, `yarn install`/`add`, `yarn typecheck`, `deno` runs, `yarn lint:check`, `yarn format:check`, the stack-free unit suite below, every `yarn assert:*`, `yarn workspace @openvaa/docs validate:links`, and the standalone `edge-runtime` image runs of plan 03 (own container name and port).
- **D-27 — no hosted deploy.** No `supabase functions deploy`, `supabase link`, `supabase secrets`, `--project-ref` or any command that reaches the hosted staging project.
- **D-28 — no push without a go.** Nothing is pushed to GitHub except `ci-evidence/180-deno`, once, after the operator's explicit go given in plan 03's `checkpoint:decision` at that moment. A go is never inferred from an earlier answer.
- **D-29 — E2E.** Within the phase, targeted runs only (§ Targeted E2E); one full run in plan 03, judged against `$BASE_RUN` (729 of 729) with the summed deltas, under the CLAUDE.md E2E Hard Rule.

If the harness refuses a stack, Docker or push command, the executor stops and reports the refusal. A refusal is never worked around.

## The shell

- Begin every shell call that runs `yarn`, `npx` or `node` with `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`.
- Yarn 4 has no `-s` flag: never write `yarn -s`. Quiet a command by redirecting its output to a log.
- `git grep -c` prints `file:count`; when a count is compared, use `git grep -h -c` and sum, or count files with `git grep -l … | wc -l`.
- A status is read from the command itself, **never through a pipe**: `cmd > log 2>&1; echo $? > log.exit`, or `set -o pipefail` with the filter after the command. A commit follows its gate with `&&`.
- Long commands run in the shell tool's background mode as `( caffeinate -dimsu <command>; echo $? > <marker>.exit ) > <marker>.log 2>&1` and are polled with one short foreground command per poll (or the harness's wait-for-condition tool where a foreground sleep is refused) until the `.exit` marker exists. Long: `yarn lint:check`, `yarn format:check`, `yarn typecheck` (root), `yarn build`, `yarn test:unit`, the stack-free unit suite, `yarn db:*`, `test:db`, the bundle script, the probe, any E2E run, any CI poll. Ceilings: 30 minutes for an E2E run, 60 for a CI poll, 15 for anything else. A foreground long gate trips the executor's 600-second watchdog.
- Before an E2E run: `pmset -g batt` is read; no run on battery below 30 % (on AC, any charge). Before each of the two ~20-minute runs: `docker builder prune -af` (the disk-sink rule); on `ENOSPC`, the same, then report.
- An `<automated>` block is written byte for byte into `$U/<plan>-t<N>-verify.sh` and run with `bash` (backgrounded and polled when it holds a long command), its log, status and the head it ran on kept beside it.
- `.env` and `apps/supabase/supabase/functions/.env` are never read, listed, tested for, copied or mounted. The templates are `.env.example` and `$FN/.env.example`.
- Every gate's log and status is kept as `$U/<plan>-gate-<name>.{log,exit}` with the head in `$U/<plan>-gate-<name>.head`.

## The unit suites ("the full unit suite before every commit")

| Name | Command | Needs the stack |
|---|---|---|
| `UNIT_SUPA` | `yarn workspace @openvaa/supabase test:unit` | no |
| `UNIT_STACKFREE` | `yarn assert:unit-coverage && yarn turbo run test:unit --filter='!@openvaa/dev-seed' && yarn workspace @openvaa/dev-seed vitest run --exclude '**/*.integration.test.ts' && yarn test:unit:tests` | no |
| `UNIT_FULL` | `yarn test:unit` | **yes** |

`UNIT_STACKFREE` is the whole of `yarn test:unit` less the one file that reaches the stack: `packages/dev-seed/tests/integration/default-template.integration.test.ts` loads the root `.env` through `src/cli/seed.ts` and writes to whatever stack answers, so before the D-26 checkpoint it would write into the stack `-infra` holds. Its log must contain `@openvaa/supabase:test:unit` and `@openvaa/frontend:test:unit` and must not contain `@openvaa/dev-seed:test:unit` (a filter that selects nothing exits 0 too); if turbo reads the lone exclusion as selecting nothing, use `--filter='./apps/*' --filter='./packages/*' --filter='!@openvaa/dev-seed'` instead and say so in the SUMMARY.

**The rule:** before every commit that changes a file outside `.planning/`, the plan runs the full unit suite on the working tree it is about to commit: `UNIT_STACKFREE` before the plan's D-26 checkpoint, `UNIT_FULL` after it. The first command after a plan's stack check is `UNIT_FULL` on the then-current HEAD, so the one file `UNIT_STACKFREE` leaves out has run on every stack-free commit before anything else uses the stack. A commit that changes only `.planning/` files needs no unit run.

## The stack

### The stack check (first stack use of every plan, after its D-26 checkpoint)

Run from this worktree's root, `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`, written to `$U/<plan>-stack-check.sh` and run with `bash`, each step's status read directly:

1. **Restart from this worktree** (D-26: a restart, not a reset): `set -o pipefail; yarn db:stop 2>&1 | node tests/scripts/withhold-stack-keys.mjs > $U/<plan>-stack-stop.log`, then the same with `yarn db:start` into `$U/<plan>-stack-start.log`. The keys never reach a log.
2. **(a) The schema is this tree's.** `docker exec -i supabase_db_openvaa-local psql -U postgres -d postgres -X -q -t -A -c "select count(*) from supabase_migrations.schema_migrations"` equals `node -e 'console.log(require("./apps/supabase/supabase/migrations.manifest.json").migrations.length)'` (22 at planning). When it does not: `yarn db:reset` (background, polled), then `yarn db:seed:default`, then compare again; a second mismatch stops the plan and is reported.
3. **(b) The functions are this tree's.** `docker inspect supabase_edge_runtime_openvaa-local --format '{{range .Mounts}}{{.Destination}}{{"\n"}}{{end}}'` has a line equal to `$PWD/apps/supabase/supabase/functions`. When it has not, the plan stops and reports.
4. **(c) The edge runtime is up** (D-24): `docker inspect -f '{{.State.Running}}' supabase_edge_runtime_openvaa-local` prints `true`.
5. **The record.** `$U/<plan>-stack.txt` holds `migrations_applied=<n>`, `migrations_manifest=<n>`, `functions_mount=<the matching destination>`, `edge_runtime_running=true` and `checked_at=<UTC time>`, written only when (a), (b) and (c) hold. A later re-check overwrites it.

Run the check again before a stack-dependent command whenever the stack may have been used from another worktree since the last check (after a pause, a resumed task or a host restart). `yarn db:reset` never runs while an E2E run is in flight (a `started` marker without an `ended` beside it under `tests/e2e-runs/`). Docker itself is never restarted.

The E2E wrapper restores the stack at its own end with `yarn db:stop` and `yarn db:start` from this worktree and records `OPTIONS <fn>: <code>` for every function directory with an `index.ts` in `<run>/restore.txt`; that is the observed "answers on the restarted local stack" of criterion 4.

### An interrupted or resumed task

Every task ends in its own commit(s), so the tree between tasks is a committed state. A fresh executor may take any task. On a resume it re-reads this file, its plan and the summaries of the plans before it; reads `git log --oneline <the planning commit>..HEAD` to see which task commits exist; reads the ledger and the deltas; and, if the plan's D-26 checkpoint has been answered, runs the stack check. A working tree with uncommitted changes outside `.planning/` means a task was interrupted: the executor compares them with that task's `<files>` and either continues from them or discards them with `git checkout -- <the task's files>` (and deletes the task's new files) and starts the task again. A planted control found in the tree (an uncommitted change to a function module no task's `<files>` lists as edited) is reverted with `git checkout -- <file>` and the control is made again.

## Commits

- Each commit names its paths: `git commit -m "…" -- <paths>`; a new file is `git add`ed by explicit path first, and every `git mv` / `git rm` lists both its source and its destination in the commit's paths. Never `git add -A`, `git add .`, `git commit -a` or `git stash`. `CAND-APP-PLAN.md` is never staged. The branch is `feat/entity-signup-multi-grant`; no branch is created or switched, except `ci-evidence/180-deno`, which is created without a checkout (§ The CI evidence channel).
- `yarn assert:comment-hygiene` runs on the working tree before every commit that adds or changes a comment under `apps/`, `packages/` or `tests/`. A comment changed under `scripts/` obeys the same rule by reading (the script does not scan `scripts/`).
- Every commit message ends with the attribution lines the executing session is given.
- The executor edits none of `.planning/STATE.md`, `.planning/ROADMAP.md`, `180-CONTEXT.md`, `180-RESEARCH.md`, `180-DISCUSSION-POINTS.md`, `180-DISCUSSION-LOG.md`, `180-VALIDATION.md`, this file and the PLAN files. `CLAUDE.md` is edited by plan 01 alone, in its Skill Routing entry for the spike-findings skill. `.claude/skills/database/SKILL.md` is edited by plan 02 alone. `$K/references/deno-edge-typecheck.md` is created by plan 01 and edited only in its "On `feat/entity-signup-multi-grant`" section, by plan 03.
- Plan 02's code commits, in order (the never-red rule of D-23: `yarn typecheck` is green at every one): (1) `deno.json`, the pin, the script, `yarn.lock`; (2) the typed admin-client parameters; (3) the `jwtSegment` deletion with the database skill's § 8; (4) the `_shared/` move, the guard edit, the test repointing and every prose surface the move makes false; (5) the editor documentation only. Putting the deletion before the move is the planner's use of D-23's commit-order discretion: the move commit then writes the database skill's dated note for the tree as it ends.

## Comments, docstrings and prose

A comment, docstring or test title under `apps/`, `packages/`, `tests/` or `scripts/` describes the code as it is, to someone reading it cold: no account of what it used to be, of what was moved or deleted or where from ("previously duplicated", "moved from", "now lives"), no decision, plan or requirement id (`D-15`, `C3`, `E2E-03`), no `.planning/` path, nothing addressed to a reviewer; only `see phase N` where a reference is needed. A moved file's docstring is reread whole and cleaned of every sentence about copies. `.claude/` and `.planning/` are exempt from the rule, but a skill's dated record is never rewritten to say something its date did not: a new dated note is added beside it instead.

## Code rules

- `Skill("database")` is loaded before an Edge Function, a guard script that reads the functions tree or the database skill is edited.
- `$FN/deno.json` is byte-identical to `$K/sources/040-toolchain-wiring/deno.json`: the keys `lock` (`false`), `exclude` (`["**/*.test.ts"]`) and `lint` (rule `no-import-prefix` excluded), and nothing else (D-08, D-09, resolution 2). No `imports`, `fmt`, `nodeModulesDir`, `compilerOptions` or `lock` path is ever added; no `deno.lock`, no `$FN/node_modules`, no root `deno.json`, no tracked file under `.vscode/` and no tracked JSON file that sets `"deno.enable"` exists at any commit. The two `deno.json` files under `$K/sources/037-deno-check-functions/` and `$K/sources/040-toolchain-wiring/` are spike artefacts brought over verbatim (D-03): their directories hold no TypeScript, so they configure nothing; every config check of this phase leaves `$K/sources/` out and says so.
- `deno` is a devDependency of `@openvaa/supabase` at exactly `2.9.6` (D-07). No `dependenciesMeta` entry, and its `postinstall` is never run by hand: under `enableScripts: false` the shim links the platform binary on first use.
- The `SupabaseClient` type is imported only in the combined form on the existing supabase-js line of `identity-callback/index.ts`, `import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.117.2';`. A second import line from that specifier turns `apps/supabase/scripts/edgeFunctionPins.test.ts` red.
- Edge Function imports stay plain relative paths with `.ts` extensions (`../_shared/envConfig.ts`); a test keeps the extension style it has. `callerAuthority.ts` stays in `send-email/` (D-13).
- `deno fmt` is never run on the tree and `deno lint` is never wired as a gate (D-11, D-12); `deno lint` runs only to record its findings.
- Every bundle and probe measurement runs on a `git archive` export of a committed tree under `$X`, never on the working tree: the probe writes `$FN/deno.json` and refuses when one exists, and a mount of the working tree would carry the ignored `$FN/.env`.

## The controls ledger (`$P/180-CONTROL-LEDGER.md`, created by plan 02)

Every planted-error control (D-16, D-21, and the parity test's) gets one row: `| <id> | <file planted, what was planted, by concept> | <command> | <red: exit status and the first line naming the plant> | <revert: git diff --quiet status; green exit status> | confirmed |`. A control whose red was not observed says `pending` in its last cell and is never written as confirmed; plan 02 does not close while a row is `pending`. A plant is made with an edit, its command's status read directly, and it is reverted with `git checkout -- <file>`, after which `git diff --quiet -- <file>` exits 0. No plant is ever committed. The ledger is a `.planning/` file and needs no unit run before its commit.

## Targeted E2E (operator ruling 2026-11-09; D-23, D-24, D-29)

Within the phase no plan makes a full run except plan 03. Plan 01 changes no code and makes no run. Plan 02's browser proof is one targeted green run after its last code commit covering every function-driving project.

**The superset run, chosen explicitly.** D-23 names about 13 function-driving projects. The wrapper keeps only its last `--project`, so a run per project is 13 wrapper invocations. Measured in phase 179.2 (`started`/`ended` markers): `--project contestant-identity-provider` alone took 20.0 minutes (109 projects, it pulls the perm serial chain), `perm-localisation-positive` 6.8 minutes (58 projects), `invitation-contract` 0.9 and `invitation-landing` 1.2; the other nine are of that small kind, about 1 to 3 minutes each with the wrapper's start and its 30-second stack restore. Thirteen runs therefore cost about 50 minutes. `--project perm-closed-project` depends on every leaf of the suite but `_probes` (129 projects, the full run's set) and cost 20.8 and 21.1 minutes in 179.2. So plan 02 makes the single run `tests/scripts/e2e-run.sh --run-dir $R/180-02-targeted --no-db-reset --project perm-closed-project`, the 179.2 precedent. Phase E2E total: two ~21-minute runs (plan 02's targeted and plan 03's full), about 45 minutes with the wrapper, against about 70 for thirteen targeted runs plus the full run.

**The function-driving set, derived at run time** (plan 02, before its run), recorded in `$P/180-function-projects.md` with the commands and their output: (a) the call sites of the suite, `git grep -l -E "functions/v1/(account-access|identity-callback|send-email)|functions\.invoke\(" -- tests/tests`; (b) the files that import one of them, repeated to a fixed point (`git grep -l -F <basename without extension> -- tests/tests` per new file); (c) the browser-driven call sites in the application, `git grep -n -E "functions\.invoke\('(account-access|identity-callback|send-email)'" -- apps/frontend/src`, and the specs that drive their routes (the entry, registration, recovery and identity-provider specs); (d) every spec or setup file in (a) to (c) mapped to its project by the `projectName` its tests carry in `$BASE_RUN/results.json`. The record lists one project per line and compares itself with `180-RESEARCH.md` § Pattern 10's table of 13, naming the reason for every project in one and not the other. Because the superset run holds every project, the derivation decides what the record names, not what runs.

**Judging a targeted or full run.** After `node tests/scripts/e2e-evidence.mjs <run>`:
1. `node $P/180-totals.mjs <run> --slice` (targeted) or `--full` (plan 03) exits 0;
2. `node tests/scripts/e2e-spec-verdict.mjs <run> --no-flaky --passed contestant-bank-auth.spec.ts --passed contestant-identity-provider.spec.ts` exits 0 (both bank-auth projects, D-24);
3. to 5. `node $P/180-run-checks.mjs <run> --projects $P/180-function-projects.md` exits 0: every project the record lists is in `<run>/summary.json` with `total` > 0 and `passed` equal to `total`; `<run>/restore.txt` has `restore: ok` and, for every directory `$FN/*/` that holds an `index.ts`, a line `OPTIONS <fn>: 200`, and no line naming `_shared`; `<run>/idp-functions.log` serves exactly those functions, none starting `_`, and has no line matching `import map|deno\.json` (0 such lines in `$BASE_RUN`);
6. `git diff --quiet "$(cat <run>/head)" HEAD -- . ':(exclude).planning'` exits 0 (the run is of the committed tree).

The judged run's directory is written to `$U/<plan>-run-of-record.txt`; every earlier attempt of the same label is listed in the SUMMARY with its outcome (void, or red and then fixed).

A run that exits 8 with `VOID-host-suspend.txt` is void: kept, never diagnosed, made again as `<label>-r2` (then `-r3`). A red run without the marker is a failure; with no other cause, `pmset -g log` is read before the tree is blamed. A did-not-run test is a failure. Nothing is retried until green on an unchanged tree; no test is skipped, annotated or retried to pass. A red run stops the plan: the cause is diagnosed and fixed in a commit made under these rules (`UNIT_FULL` first), and the run is made again on the fixed tree.

**Not run:** `visual-regression` (opt-in, outside the default suite; no markup changes) and `_probes`.

**The deltas.** No E2E test is added, removed or renamed in this phase, so `$P/180-E2E-DELTAS.md` is expected to keep its header only. A plan that does change a project's count appends `| 180-NN | <project> | ±N | <titles> |`. Each plan's SUMMARY states its deltas (or "none") and its title pins (the two bank-auth spec files).

## The totals check (`$P/180-totals.mjs`, created by plan 01)

`node $P/180-totals.mjs <run-dir> --slice|--full [--baseline <dir>] [--deltas <file>]`, defaults `--baseline tests/e2e-runs/179.2/179.2-final-4` and `--deltas $P/180-E2E-DELTAS.md`. It is `$P/../179.2-admin-app-account-flows-landing-set-password-recovery/179.2-totals.mjs` with only these changes: its name in messages and usage, the two defaults, and the delta-row pattern, which matches `^\|\s*180-(?:\d+|RF)\s*\|\s*<project>\s*\|\s*[+-]?\d+\s*\|`. Exit 0 only when the run is not void, its wrapper exit is 0, its total is above 0 and every test passed; every project of the run has the baseline's total for it plus its summed delta; with `--full`, every project of the baseline and of the deltas table is in the run. Every mismatch is printed on its own line; any other outcome exits 1; an unreadable or unparsable file exits 2. It writes nothing.

## The run checks (`$P/180-run-checks.mjs`, created by plan 01)

`node $P/180-run-checks.mjs <run-dir> [--projects <record>]`. The function set is every directory directly under `apps/supabase/supabase/functions/` whose `index.ts` is tracked (`git ls-files`, run at the repository root), no name starting with `_`. Checks: (restore) `<run-dir>/restore.txt` has a line `restore: ok`, a line `OPTIONS <fn>: 200` for each function, and no line containing `_shared`; (serve) the names in the lines of `<run-dir>/idp-functions.log` that end in ` - http…/functions/v1/<name>` equal the function set, and no line matches `/import map|deno\.json/i`; (projects, with `--projects`) every line `project: <name>` of the record names a project of `<run-dir>/summary.json` whose `total` is above 0 and whose `passed` equals `total`, and a record without such a line is a mismatch. Every mismatch is printed on its own line, then one summary line; exit 0 when there is none, 1 otherwise, 2 when a file cannot be read or parsed. It writes nothing.

## The CI evidence channel (plan 03; D-22, D-28)

**Build** (no checkout, no change to the working tree, the real index or the current branch): `git fetch origin main`; record `origin/main`'s SHA; `export GIT_INDEX_FILE="$X/ev180.index"; rm -f "$GIT_INDEX_FILE"; git read-tree HEAD; git rm -r --cached --quiet .planning .bg-shell; TREE=$(git write-tree); COMMIT=$(git commit-tree "$TREE" -p origin/main -m "ci: evidence tree for the Deno typecheck of the Edge Functions (phase 180)"); git branch -f ci-evidence/180-deno "$COMMIT"; unset GIT_INDEX_FILE`.

**Checks before the decision**, each recorded in `$U/180-03-evidence-checks.txt`: no path under `.planning/`, `.bg-shell/` or `tests/e2e-runs/` in the tree; `CAND-APP-PLAN.md` absent; `git check-ignore --no-index --stdin` over every path of the tree answers nothing; `git diff --quiet HEAD ci-evidence/180-deno -- . ':(exclude).planning' ':(exclude).bg-shell'` exits 0; `git rev-list --count ci-evidence/180-deno ^origin/main` is 1; the tree's `.github/workflows/main.yaml` names `"ci-evidence/**"`; at least one changed path against `origin/main` does not end in `.md`; and the **home-path scan**: `git grep -l -E '/Users/[^/]+/' ci-evidence/180-deno --` lists the tracked files that would publish an absolute home-directory path (the two spike captured outputs are expected). The scan's list goes into the decision.

**The decision** is plan 03's `checkpoint:decision`, asked at that moment, never auto-approved. Its options: push the tree as built; push a tree that leaves out the files the home-path scan listed (the tree then differs from HEAD in exactly those paths, and the diff check is re-run with them excluded and the exclusion recorded); or hold the push (criterion 5's CI half then stays open and is reported).

**The push**, only on a go: `git push --force-with-lease=ci-evidence/180-deno: origin ci-evidence/180-deno` (the empty expected value refuses to overwrite a remote branch that already exists). Then, polled in the background: `gh run list --branch ci-evidence/180-deno --limit 5 --json databaseId,headSha,status,conclusion,event` to find the run whose `headSha` is the pushed commit; `gh run view <id> --json jobs` until the job `frontend-and-shared-module-validation` has a conclusion; `gh run view <id> --job <job id> --log > $U/180-03-ci-validation.log`, grepped and never printed whole.

**What criterion 5 needs, read at job level:** `frontend-and-shared-module-validation` concluded `success`; its log has `@openvaa/supabase:typecheck` lines; the number of its `@openvaa/supabase:typecheck` lines that carry `Check ` equals the number of non-test `.ts` files under `$FN` in the evidence tree (22 expected); and it has `Download https://registry.npmjs.org/` lines in the same task (the cold Deno cache). The install step's line naming `deno@npm:2.9.6` and its build scripts is recorded when found. Every other job is recorded as found (name, status, conclusion); a red `secret-scan`, `dependency-audit` or `e2e-tests` is cited by its cause and not counted against the criterion. A red validation job is a stop: diagnosed, any fix made as a code commit under plan 02's rules (unit suite, gates), then a new evidence commit and a new decision.

## Prohibitions (every plan)

- No stack use before the plan's D-26 checkpoint is answered; no hosted deploy (D-27); no push but the one evidence push, on a go (D-28).
- No E2E test is added, removed, skipped, annotated or retried to pass; a did-not-run test is a failure; a void run is made again, never judged.
- No `deno.lock`, root `deno.json`, `.vscode/` file, `"deno.enable"` setting, `imports` map or fifth `deno.json` key; no `deno fmt`; no `deno lint` gate.
- No edit of `$K/sources/`; the spike reference changes only in its "On `feat/entity-signup-multi-grant`" section.
- No new spec or test that pins the new wiring (resolution 4).
