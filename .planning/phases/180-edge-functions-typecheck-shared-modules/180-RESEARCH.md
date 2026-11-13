# Phase 180: Edge Functions — Typecheck & Shared Modules - Research

**Researched:** 2026-11-12 (HEAD `03e6bca12`, branch `feat/entity-signup-multi-grant`)
**Domain:** Deno type-checking of Supabase Edge Functions inside a Yarn 4 / Turborepo monorepo; shared-module layout for Supabase deployment units
**Confidence:** HIGH (every load-bearing claim re-measured this session on a scratch copy of the post-move layout, or read from the file it describes)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Each decision is the ★ RECOMMENDED option of `180-DISCUSSION-POINTS.md`; the document's decision id is in brackets.

#### Factual baseline
- **D-01 [0.1]:** All 24 facts of the document's § 0 table are accepted as the phase's factual baseline, and are
  restated in `<code_context>` below. The spike's counts (23 modules, 5 errors, 10 copies, `entityGrant.ts`, the
  byte-for-byte test) are not used.

#### A. Scope and the criteria's own text
- **D-02 [A1]:** Roadmap criteria 1 and 3 are amended before planning. Criterion 1 becomes "… turns it red, naming
  the error; the tree has no baseline type errors (measured 0 on 2.9.6), and the `any` parameters whose stated
  reason was the missing check are typed (A3)". Criterion 3 lists the modules C1 settles, with the measured copy and
  consumer counts, and drops the byte-for-byte clause, citing `287a2b97d`. **Applied** in the same commit as this
  file, before any planner starts (parallel-planner race); plan 01's A1 item (D-23) is therefore already done and
  only checked.
- **D-03 [A2]:** The spike's skill reference and its `sources/` come over verbatim, with an added "On
  `feat/entity-signup-multi-grant`" section. That section restates facts 3-13 and marks which steps are void (the
  `type-fixes.patch`, the `entityGrant` and `jwtSegment` rows, the byte-for-byte removal) and which patches are
  history only. The `SKILL.md` index gains the domain line. The spike record stays intact, and the reader sees
  today's state beside it. The three patches stay as artefacts, not instructions.
- **D-04 [A3]:** The three `supabaseAdmin: any` parameters in `identity-callback/index.ts` are typed as
  `SupabaseClient`; the three `deno-lint-ignore` lines and the stale `// reason:` are dropped. This is the spike's
  `rollbackInvite` fix applied to the sites that still need it. It is measured green and has no runtime effect
  (types are erased).
- **D-05 [A4]:** The `findExistingCandidate` / `CandidateLookupFilter` reshape is closed as moot, citing
  `4ecfe7778`; no work.
- **D-06 [A5]:** The four neighbouring Edge Function todos are out of scope; at close, each is annotated with what
  this phase changed for it (for example, the supabase-types todo now has a checker that would see a `Database`
  generic). The phase stays a refactor.

#### B. Toolchain
- **D-07 [B1]:** Deno `2.9.6`, exact, as a devDependency of `@openvaa/supabase`. It is still npm `latest` today, 77
  days old, past the age gate, and it is the version the spike measured with the npm shim, turbo, the LSP probe and
  `enableScripts: false`. The skill reference records that the runtime is `edge-runtime:v1.76.2` / Deno 2.1.4, and
  that equal results are an observation about this code. — **Reversibility:** reversible — a version bump in one
  `package.json` and `yarn.lock`.
- **D-08 [B2]:** The config is `apps/supabase/supabase/functions/deno.json`, with the spike's exact four keys
  (`lock: false`, `exclude: ["**/*.test.ts"]`, lint `no-import-prefix` off, no `imports`). Criterion 4 measures
  whether the bundles are unaffected (D-20).
- **D-09 [B3]:** `"lock": false`, as the spike settled. No new file and no lock churn; the deployed runtime does not
  read a lock either, so the checker sees what the runtime resolves.
- **D-10 [B4]:** The script is `"typecheck": "cd supabase/functions && deno check ."` in `apps/supabase/package.json`.
  Deno discovers its config from the CWD, so the `cd` is what makes it work, and it checks every non-test module,
  including ones no entry point imports.
- **D-11 [B5]:** `deno lint` is not a gate. The 4 findings (all `require-await`) and the decision are recorded in the
  skill reference.
- **D-12 [B6]:** `deno fmt` is never wired. Either `"fmt": { "exclude": ["."] }` is set or "Prettier formats this
  tree" is documented next to `enablePaths` (documenting is enough, since D-18 chooses documentation). The `fmt`
  exclude is measured nowhere, so the plan checks that the editor still formats with Prettier.

#### C. Shared modules
- **D-13 [C1]:** `envConfig.ts` and `placeholderAddress.ts` move to `functions/_shared/` (with their tests);
  `callerAuthority.ts` stays in `send-email/`. This applies criterion 3's rule (more than one copy or consumer) as
  measured; `_shared/` keeps a single meaning, used by more than one function. `callerAuthority.ts:10`'s docblock is
  rewritten to point a future second consumer at `_shared/`. — **Reversibility:** costly — every importer, the
  source-reading conformance tests, the guard script and the docs move with it.
- **D-14 [C2]:** `send-email/jwtSegment.ts` and `send-email/jwtSegment.test.ts` are deleted;
  `.claude/skills/database/SKILL.md` § 8 (`:919-925`) is rewritten and `:1117` (which also names the deleted
  `entityGrant.ts`) is fixed. The base64url lesson in § 8 may stay as one sentence of guidance without a file
  reference.
- **D-15 [C3]:** `identity-callback`'s copy becomes `_shared/placeholderAddress.ts`, with a rewritten docblock ("ONE
  DOMAIN, TWO COPIES": this module and the frontend's). `account-access`'s copy is deleted. The three imports are
  repointed. The parity test holds two sources. The `EXPORTS_HELD_FOR_PARITY` entry is dropped, since `_shared/` is
  outside that test's directory scan and `account-access` now uses `isPlaceholderAddress` from the shared module.
  `identityProviderAccount.ts:10` is updated. `account-access` gains the unused 3-line `placeholderAddressFor` in its
  bundle.
- **D-16 [C4]:** Check 2 and `DUPLICATED_MODULES` are removed from `scripts/assert-edge-env-defaults.mjs`, and the
  docblock and summary are renumbered to "2 of 2 (env-default; vitest-reachability)". In the same edit the
  `NOT_DUPLICATED` sentence (`:46`, the jwtSegment todo's second item) is fixed and Check 1's message names
  `_shared/envConfig.ts` (`:260`). Checks 1 and 3 walk the tree recursively (`:134`), so `_shared/` is covered.
  Planted control: a `Deno.env.get('X') ?? 'y'` in `_shared/envConfig.ts` turns it red; the revert turns it green.
- **D-17 [C5]:** Every doc and prose surface the move touches is updated in the move's commit: the three
  `envConfig.ts:6` docblocks become one, describing `_shared/`; `callerAuthority.ts:10`; both
  `placeholderAddress.ts:8` (D-15); `identityProviderAccount.ts:10`; the docs page `edge-functions/+page.md:11,146`;
  `.claude/skills/database/SKILL.md:908-914,1113-1117`; and `scripts/assert-edge-function-env.mjs:14`. Every
  rewritten comment passes comment hygiene: it describes the code as it is, with no "previously duplicated".

#### D. Editor setting
- **D-18 [D1]:** Document only: an "Editor setup" passage in `apps/supabase/README.md` and the docs page
  `edge-functions/+page.md`, giving `deno.enablePaths`, the optional `deno.path`, "never set `deno.enable`", and
  "Prettier formats this tree". No `.vscode/` file is committed; this respects the `693ae80b5` ruling and leaves no
  shared editor state.
- **D-19 [D2]:** The criterion-2 proof re-runs the spike's LSP probe once, after the move: `lsp-probe.mjs` S8
  (recommended setup) and S9 (`deno.enable`) on 2.9.6, with its `FILES` array updated to this tree's files. Expected:
  vanilla 0 of 7 flagged under S8. It runs in a scratch copy, about 15 s per scenario.

#### E. Verification
- **D-20 [E1]:** The spike's `verify.sh` comes over, updated for the three functions, and runs two passes: config
  present and config moved aside. Pass/fail: (1) every bundle exits 0; (2) its unbundled file list holds exactly the
  `_shared/` modules its entry point imports (`account-access`: `envConfig`, `placeholderAddress`;
  `identity-callback`: `envConfig`, `placeholderAddress`; `send-email`: `envConfig`) and no `*.test.ts`; (3) `cmp`
  of each function's two eszips is byte-identical, or, if the eszip embeds a timestamp, the two unbundled trees are
  `diff -r` identical, with the reason recorded; (4) `OPTIONS` 200 per function. The output goes into the run record.
  The "answers on the restarted local stack" half is the E2E run (D-24). `verify.sh` runs the `edge-runtime` image
  standalone, with its own container name and port.
- **D-21 [E2]:** Criterion 1's planted-error control is three plants, each run with the exit code read directly
  (never through a pipe): a type error in `_shared/envConfig.ts`, one in an `index.ts`, and one in an excluded
  `*.test.ts`. Expected: red naming it, red naming it, green. Then under turbo, a cached run reports `FULL TURBO` and
  a plant is a cache miss that turns red. Each plant is reverted, and the revert is checked by `git diff --quiet`.

#### F. CI
- **D-22 [F1]:** Criterion 5's CI run is `ci-evidence/180-deno`, pushed once after the last code commit (a
  source-only commit built by the standing method), and read at JOB level. `frontend-and-shared-module-validation`
  must be `success`, and its "Type-check all packages" log must show `@openvaa/supabase:typecheck` running
  `deno check .` with the `Check …` lines for the 26 modules (or the post-move count). This also observes the Linux
  `@deno/linux-x64-glibc` install and a cold Deno cache with registry downloads. Every other job is recorded as
  found; a red `secret-scan`, `dependency-audit` or `e2e-tests` is cited by its cause and not counted against this
  criterion, while the E2E part of criterion 5 is met by the local full run (D-24). The push needs the operator's go
  (D-28).

#### G. Plan shape and E2E cost
- **D-23 [G1]:** Three plans, one of them with code.
  - **01:** bring the skill reference and sources over (D-03), and the A1 roadmap amendment (D-02, already committed
    with this file, so only checked). Docs only, no E2E.
  - **02:** all code, in one plan, with commits ordered so that `yarn typecheck` never goes red: `deno.json` + pin +
    script + `yarn.lock`; the A3 typing; the `_shared/` move, the guard edit and test repointing (D-13 to D-16);
    deleting `jwtSegment` (D-14); the prose (D-17). Then the E2 controls, the full unit suite and every gate script,
    and one targeted green run per function-driving project after the last code commit, with test-count deltas
    recorded against `179.2-final-4` (729).
  - **03:** the E1 bundle verification, the D2 probe, the F1 CI run, the one full-suite run judged against 729 plus
    the summed deltas (expected: 0, since no E2E test is added or removed), and the reconciliation (D-25).

  The function-driving projects (about 13; derive the exact set by `git grep` at run time over the setup, fixture and
  spec files that call `account-access`, `identity-callback` or `send-email`, not from the document's list) get one
  targeted pass.
- **D-24 [G2]:** The targeted and full runs are green under the standing rules (a red or "did not run" test blocks;
  a void run is re-run under a new `--run-dir`), with both bank-auth projects (`bank-auth`,
  `contestant-identity-provider`) named explicitly in the full run's record (E2E-03). The wrapper restarts the stack
  at its end, so the shared modules are served fresh; check that `edge_runtime` is Up before the run. D-26 adds an
  explicit `db:stop && db:start` at each plan's first stack use.
- **D-25 [G3]:** Full reconciliation at close. Close `2026-10-07-174-nothing-type-checks-the-edge-functions.md` and
  `2026-10-07-174-send-email-jwtsegment-has-no-importer.md`, each with its measured outcome. Annotate the four A5
  todos (D-06). Record in Phase 174's verification that its one behaviour-unverified truth now has a type-checked
  `index.ts`, though still no live misconfigured-deployment run. Update the skill reference's "On this branch"
  section with the post-phase counts (modules checked, `_shared/` contents, lint findings, CI run id).

#### Operator constraints (2026-11-12)
- **D-26:** No phase-180 work may use the local Supabase stack until the operator says the -infra plan 185-10 has
  returned. After that, the first stack use of each plan runs `yarn db:stop && yarn db:start` from this worktree, not
  just a reset, then checks the migration count against the manifest
  (`apps/supabase/supabase/migrations.manifest.json`) and that the edge runtime mounts this worktree's functions.
- **D-27:** No deploy of Edge Functions to the hosted staging project during this phase.
- **D-28:** Any push to GitHub (the `ci-evidence/180-deno` branch of D-22) only after the operator's explicit go,
  asked at that point.
- **D-29:** Within the phase, E2E runs are targeted; one full run at the end, judged against `179.2-final-4` (729 of
  729) with summed deltas, under the CLAUDE.md E2E Hard Rule.

### Claude's Discretion
- D-12: whether the `fmt` exclude is set or the "Prettier formats this tree" line alone is used, provided the plan
  checks that the editor still formats with Prettier.
- D-20: whether criterion 4's comparison is `cmp` of the eszips or `diff -r` of the unbundled trees, decided by
  whether the eszip embeds a timestamp, with the reason recorded.
- The commit order inside plan 02, within D-23's rule that `yarn typecheck` never goes red.

### Deferred Ideas (OUT OF SCOPE)
- `deno lint` as a gate (D-11) and `deno fmt` wiring (D-12): not adopted.
- Parameterising `createClient<Database>` with `packages/supabase-types` (the A5 supabase-types todo): out of scope,
  annotated at close.
- A live run of a served function on a misconfigured deployment (Phase 174's behaviour-unverified truth), and any
  hosted deploy (D-27).

#### Reviewed Todos (not folded)
- `2026-09-03-deno-edge-functions-do-not-consume-supabase-types.md`: out of scope (D-06); it now has a checker that
  would see a `Database` generic.
- `2026-10-03-deno-edge-imports-invisible-to-audit-deps.md`: out of scope (D-06).
- `2026-08-29-edge-function-non-null-env-assertions.md`: out of scope (D-06).
- `2026-08-22-edge-function-fourth-idtoken-verifier-copy.md`: out of scope (D-06).
</user_constraints>

<phase_requirements>
## Phase Requirements

The phase has no v2.16 requirement id (an operator-directed refactor); E2E-03 is its closing criterion. The five
roadmap success criteria (1 and 3 as amended by D-02) play the role of requirements.

| ID | Description | Research Support |
|----|-------------|------------------|
| SC-1 | `yarn typecheck` (and so `yarn lint:check` and the CI type-check step) checks every non-test module with Deno 2.9.6 pinned as a devDependency of `@openvaa/supabase`; a planted error turns it red, naming it; 0 baseline errors; the three `supabaseAdmin: any` typed | § Pattern 1 (pin), § Pattern 2 (script, turbo, CI wiring), § Pattern 4 (A3 typing), § Code Examples (plants); scratch run: post-move `deno check .` exits 0 with 22 `Check` lines; the three plants behave as D-21 expects |
| SC-2 | The only Deno config is `functions/deno.json` (no import map); no root `deno.json`; `deno.enable` set nowhere; `deno.enablePaths` documented | § Pattern 1 (`deno.json`), § Pattern 7 (editor docs), § LSP probe; scratch probe on the post-move tree: S8 vanilla 0/7, S9 vanilla 6/7 |
| SC-3 | `envConfig.ts` and `placeholderAddress.ts` exist once under `functions/_shared/`, imported by relative path, each with its test; `callerAuthority.ts` stays; copy-drift check removed; docblocks no longer claim duplication | § Pattern 3 (exact move and rewrite map), § Pattern 5 (guard edit), § Pattern 6 (jwtSegment), § Prose surfaces (D-17 list plus 7 surfaces it misses) |
| SC-4 | Every function bundles and answers on the restarted stack; each bundle holds exactly its `_shared/` imports and no test; bundles unaffected by the config | § Pattern 8 (bundle verification, two passes on scratch exports), wrapper `restore.txt` OPTIONS lines for "answers on the restarted stack" |
| SC-5 / E2E-03 | One CI run observed green with the Deno typecheck in it; unit suites and every gate script pass; full E2E and both bank-auth projects green at close | § Pattern 9 (CI evidence channel), § Pattern 10 (E2E blast radius), § Validation Architecture |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **E2E Hard Rule:** a failing or "did not run" E2E test blocks every task; no flaky exemptions; a void run (wrapper exit 8, `VOID-host-suspend.txt`) is re-run under a new `--run-dir`, never diagnosed. Within a phase, targeted runs only (one `tests/scripts/e2e-run.sh … --project <p>` run per project, since the wrapper keeps only its last `--project`); one full run at the phase end, judged with summed deltas (operator ruling 2026-11-09; D-29).
- **Preflight:** every E2E run's global setup asserts the served app is this checkout and serves the seeded project; no flag skips it. Use the wrapper, which starts its own dev server.
- **Comment hygiene (apps/, packages/, tests/):** no historical narrative ("previously duplicated", "moved from"), no planning references beyond `see phase N`, nothing addressed to a reviewer, concise. `yarn assert:comment-hygiene` gates the reference forms; narrative is caught only by reading. `scripts/` is outside its scan roots (`SCAN_ROOTS = ['apps', 'packages', 'tests']`, `scripts/assert-comment-hygiene.mjs:195`) but the rule still applies by convention; `.claude/` and `.planning/` are exempt.
- **TypeScript strictly:** avoid `any` (D-04 removes the three remaining).
- **Never commit sensitive data:** `apps/supabase/supabase/functions/.env` exists in this worktree and is ignored (`.gitignore:3` `.env`); never read, list or mount it into evidence.
- **Code review checklist** (`.agents/code-review-checklist.md`) applies to every code change.
- **Skills:** `Skill("database")` before editing an Edge Function or the database skill.
- **Docs:** CLAUDE.md "Fixing module not found → yarn build"; `yarn format:check` runs Prettier over the whole repo plus `@openvaa/docs format:check`.
- **Memory-derived standing rules that the 179.2 EXECUTION-RULES encode** (use the same file shape for 180): PATH prefix `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`; read a gate's status from the command itself, never through a pipe; long gates (`yarn lint:check`, `yarn test:unit`, E2E) run backgrounded with `caffeinate` and an `.exit` marker, polled; never `git add -A`, never `git stash`, never stage `CAND-APP-PLAN.md`; each commit names its paths.

## Summary

The spike's blueprint holds on this tree with smaller numbers. On a scratch copy of the post-move layout (both
`envConfig.ts` copies collapsed, `placeholderAddress.ts` merged, `jwtSegment` deleted, the three `any` typed, the
spike's four-key `functions/deno.json`, the real root and `apps/supabase` `package.json` files above it), Deno 2.9.6
`deno check .` from `functions/` exits 0 and prints 22 `Check` lines (`_shared/` 2, `account-access` 7,
`identity-callback` 10, `send-email` 3), downloading 23 npm tarballs (20 MB) on a cold cache in about one second.
It creates no `deno.lock` and no `node_modules`. The three D-21 plants behave as expected. The same check run from
`apps/supabase` without the `cd` fails on `Could not resolve "vitest"`. That confirms the `cd` is load-bearing.
The LSP probe, re-pointed at this tree, gives S8 vanilla 0/7 and S9 vanilla 6/7.

The toolchain needs no new mechanism. Yarn 4 here uses `nodeLinker: node-modules` with `enableScripts: false`. The npm
`deno` package's `postinstall` (`node ./install.cjs`) therefore never runs. Its `bin.cjs` shim finds the platform
package `@deno/<platform>` on first use and hard-links the binary into `node_modules/deno/deno`, as the spike
worktree shows. The lockfile gains `deno@npm:2.9.6` and six conditional `@deno/*` entries without checksums. The
existing `@esbuild/*` and `@supabase/cli-*` entries have the same shape, and CI already installs those immutably on
Linux. Turbo's existing `typecheck` task picks the script up. Remote caching is disabled in CI (`• Remote caching
disabled` in run `40846531438`), so the CI step always executes `deno check` cold and prints its `Check` lines.

Two findings change the plan's detail. First, the CI-evidence and E2E observations are already well instrumented.
The wrapper's restore step probes `OPTIONS` on every function directory that has an `index.ts` (so not `_shared/`)
and records `OPTIONS <fn>: <code>` in `restore.txt`. That is the observed "answers on the restarted local stack" for
all three functions, `send-email` included, which no Playwright project drives. The CLI's `functions serve` serves
*all* functions ("Legacy Function names. All Functions are served."), and its log names the runtime as
`supabase-edge-runtime-1.76.2 (compatible with Deno v2.1.4)`. Second, D-17's prose list misses seven surfaces, and
`apps/supabase/scripts/edgeFunctionPins.test.ts` constrains how the `SupabaseClient` type may be imported. Both are
listed below.

**Primary recommendation:** Build plan 02 in five commits, in this order. (1) `deno.json`, the pin, the script and the
lockfile. (2) The A3 typing, using the combined `import { createClient, type SupabaseClient } from 'npm:…'` form.
(3) The `_shared/` move, the guard edit, the test repointing and all the prose. (4) The `jwtSegment` deletion with the
skill's § 8. (5) Any remaining docs (README editor setup). Run every bundle and LSP measurement on `git archive`
exports in the scratchpad, never on the working tree.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Type-checking the functions | Build tooling (turbo task in `@openvaa/supabase`) | CI job `frontend-and-shared-module-validation` | A workspace script picked up by the root `turbo run typecheck`; CI runs the same command |
| Deno binary provisioning | Package manager (Yarn devDependency) | — | Pinned per workspace, the same route the `supabase` CLI already uses (platform packages under conditions) |
| Shared runtime code (`requireEnv`, placeholder domain) | Edge runtime (API / Backend) | — | Bundled into each function's eszip from its import graph; `_`-prefixed folders are the documented shared-code location |
| Copy-drift and env-default guarding | Repo gate scripts (`scripts/*.mjs`, `lint:check`) | — | Source-shape checks over the functions tree |
| Bundle content proof | Docker (standalone `edge-runtime` image) | — | The deploy bundler runs in that image; independent of the shared stack |
| Function liveness on a restarted stack | Local Supabase stack (edge runtime container) | E2E wrapper | The wrapper's restore step probes every function; Playwright projects drive two of the three |
| Editor scoping | Contributor's editor (documentation) | — | D-18: documented only, nothing committed |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `deno` (npm) | `2.9.6` exact | Type checker for the functions (`deno check`) | The compiler that agrees with the runtime about `npm:` resolution; D-07 locks it. npm dist-tags today: `"latest": "2.9.6"`, `"lts": "2.2.15"` [VERIFIED: npm registry, `npm view deno dist-tags`] |
| `@deno/<platform>` (npm, optional, installed by condition) | `2.9.6` | The per-platform binary the shim launches | Pulled by `deno`'s `optionalDependencies`; on CI only `@deno/linux-x64-glibc` (unpacked 95,601,292 bytes, `"libc": ["glibc"]`) [VERIFIED: npm registry] |
| Supabase edge runtime | `v1.76.2` (Deno 2.1.4) | What serves and bundles the functions | The local stack's image; the CLI prints `Using supabase-edge-runtime-1.76.2 (compatible with Deno v2.1.4)` [VERIFIED: `tests/e2e-runs/179.2/179.2-final-4/idp-functions.log`, line 8] |
| Supabase CLI | `2.118.0` | Serve, deploy (Docker bundling by default) | Catalog pin `supabase: ^2.118.0` [VERIFIED: `.yarnrc.yml:47`]; `node_modules/.bin/supabase --version` prints `2.118.0` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Turborepo | `2.11.4` | Runs the new `typecheck` script with the other 13 | No `turbo.json` change [VERIFIED: `node_modules/turbo/package.json`] |
| vitest | catalog `^5.0.2` | The functions' unit tests (unchanged runner) | `apps/supabase/vitest.config.ts` includes `supabase/functions/**/*.test.ts`, so `_shared/*.test.ts` is collected with no config change [VERIFIED: file read] |

### Alternatives Considered
Not researched: D-07 to D-10 are locked.

**Installation (plan 02, network needed once):**
```bash
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"
yarn workspace @openvaa/supabase add -D -E deno@2.9.6
# equivalent: hand-edit apps/supabase/package.json devDependencies to "deno": "2.9.6", then `yarn install`
```
Expected install output includes a warning that `deno@npm:2.9.6 lists build scripts, but all build scripts have been
disabled` (spike 040, `[CITED: spike reference § Constraints, Yarn]`). Do NOT add `dependenciesMeta.deno.built`.

**Version verification:** `npm view deno dist-tags` → `latest 2.9.6`; `npm view deno scripts` → `"postinstall": "node ./install.cjs"`; published 2026-08-27T17:36:36.711Z (legitimacy seam), clearing `.yarnrc.yml:3` `npmMinimalAgeGate: 7d`.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `deno` | npm | 77 days (2026-08-27) | 466,613/wk | github.com/denoland/deno | [OK] | Approved (postinstall `node ./install.cjs`, local only: hard-links the platform binary into the package folder; it never runs here because `enableScripts: false`) |
| `@deno/linux-x64-glibc` | npm | 77 days | 424,611/wk | github.com/denoland/deno | [OK] | Approved (no postinstall) |
| `@deno/darwin-arm64` | npm | 77 days | 17,069/wk | github.com/denoland/deno | [OK] | Approved (no postinstall) |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

The postinstall was read in full (`voting-advice-application-deno-spike/node_modules/deno/install.cjs` and
`install_api.cjs`). It resolves `@deno/<os>-<arch>[-glibc]` with `require.resolve`, hard-links or copies its binary
next to `bin.cjs`, and makes no network call. The other four `@deno/*` packages (`darwin-x64`, `linux-arm64-glibc`,
`win32-arm64`, `win32-x64`) come from the same release and are never installed on the two platforms in use.

## Architecture Patterns

### System Architecture Diagram

```
 developer / CI
      │  yarn typecheck  (also: yarn lint:check → … && yarn typecheck && …; CI step "Type-check all packages")
      ▼
 turbo run typecheck ──► 14 workspaces' typecheck tasks (dependsOn ^build)
      │                         │
      │                         └─► @openvaa/supabase:typecheck
      │                                 │ yarn run typecheck (Yarn shell; PATH carries node_modules/.bin/deno)
      │                                 ▼
      │                        cd supabase/functions && deno check .
      │                                 │ config discovery from CWD → functions/deno.json
      │                                 │   exclude **/*.test.ts · lock:false · no imports
      │                                 ▼
      │                 module graph: every non-test .ts under functions/ (22 after the move)
      │                                 │ npm: specifiers → registry.npmjs.org → DENO_DIR cache
      │                                 ▼
      │                 exit 0 / exit 1 + "TS2322 [ERROR] … at file://…/_shared/envConfig.ts:L:C"
      ▼
 deploy / serve path (unchanged by the config)
   functions/<fn>/index.ts ──imports──► ../_shared/envConfig.ts, ../_shared/placeholderAddress.ts
          │
          ├─► edge-runtime bundle (Docker, v1.76.2) ──► <fn>.eszip  (entry graph only; no tests)
          └─► supabase start / functions serve ──► edge runtime container mounts functions/
                                                     (_shared/ has no index.ts → not served, not probed)
```

### Recommended Project Structure (after the phase)
```
apps/supabase/
├── package.json                 # + "typecheck": "cd supabase/functions && deno check ." ; + devDependency "deno": "2.9.6"
└── supabase/functions/
    ├── deno.json                # the spike's four keys, nothing else
    ├── _shared/                 # modules used by more than one function
    │   ├── envConfig.ts         # requireEnv (4 importers in 3 functions)
    │   ├── envConfig.test.ts
    │   ├── placeholderAddress.ts        # PLACEHOLDER_EMAIL_DOMAIN, placeholderAddressFor, isPlaceholderAddress
    │   └── placeholderAddress.test.ts   # parity: this module + the frontend copy
    ├── account-access/          # 7 modules (was 9)
    ├── identity-callback/       # 10 modules (was 12)
    └── send-email/              # 3 modules (was 5): callerAuthority.ts stays here
```

### Pattern 1: The pin and the config

**What:** `deno.json` exactly as the spike's `040-toolchain-wiring/deno.json`; `deno` exact in `apps/supabase/package.json`.

```json
{
  "lock": false,
  "exclude": ["**/*.test.ts"],
  "lint": { "rules": { "exclude": ["no-import-prefix"] } }
}
```
[VERIFIED: `git show 796e610a7:…/sources/040-toolchain-wiring/deno.json`; this exact file passes `prettier --config prettier.config.mjs --check` this session]

- Yarn 4 linker is `nodeLinker: node-modules` [VERIFIED: `.yarnrc.yml:1`]: no PnP, so `deno` hoists to the root
  `node_modules/deno/` and `node_modules/.bin/deno -> ../deno/bin.cjs` (observed in the spike worktree).
  `apps/supabase/node_modules/` exists and is empty today.
- `enableScripts: false` [VERIFIED: `.yarnrc.yml:7`]. The postinstall does not run. The shim's fallback
  (`require("./install_api.cjs").runInstall()` when `node_modules/deno/deno` is absent) finds the platform package
  and hard-links the binary on first invocation. The spike worktree shows the resulting 80,915,104-byte
  `node_modules/deno/deno` with link count 2.
- **Lockfile shape:** six `@deno/*` entries with `conditions:` and no `checksum:` (spike `toolchain.patch`). The existing
  conditional packages have the same shape. Quoted from `yarn.lock:871-876`:
  `"@esbuild/linux-x64@npm:0.27.7":` / `conditions: os=linux & cpu=x64` / `languageName: node` / `linkType: hard`,
  with no checksum line. CI's `yarn install --frozen-lockfile` (deprecated alias of `--immutable`, per the CI log's
  `YN0050`) accepts that shape today.
- **Docker image build (`node:24-alpine`, musl):** `@deno/linux-*-glibc` fails its `libc=glibc` condition, so it is
  skipped; `deno` itself installs with no binary, and nothing in the image runs it. The image's
  `yarn install --immutable` needs only the committed lockfile [ASSUMED: Yarn skips glibc-conditioned packages on
  musl. The analogous `@supabase/cli-linux-x64-musl` entry, `conditions: os=linux & cpu=x64 & libc=musl`
  (`yarn.lock:2292-2297`), shows Yarn evaluating libc conditions; the `docker-image-build` job of the CI run
  confirms it].
- **Offline/CI:** a cold `DENO_DIR` needs registry.npmjs.org (23 downloads, 20 MB on disk). A warm cache needs no
  network: a re-check after editing a file downloaded 0 [VERIFIED: scratch run]. `--cached-only` did NOT stop npm
  downloads on a cold cache in 2.9.6 (it downloaded anyway, exit 0), so it is no offline guarantee
  [VERIFIED: scratch run].

### Pattern 2: Wiring into `yarn typecheck`, `lint:check` and CI

- Root `package.json:61` `"typecheck": "turbo run typecheck"`; `:60` `lint:check` chains `&& yarn typecheck &&`.
  [VERIFIED: `grep -n`]
- `turbo.json:18-22`, verbatim: `"typecheck": { "dependsOn": ["^build"], "outputs": [], "inputs": ["$TURBO_DEFAULT$", "tsconfig.json", "tsconfig.*.json"] }` [VERIFIED: file read]. `@openvaa/supabase` has no workspace dependencies, so `^build` is empty. `$TURBO_DEFAULT$` hashes git-tracked files plus untracked files that are not ignored, so the ignored `functions/.env` is outside the hash. There is no `apps/supabase/turbo.json`.
- **Turbo strict env mode** (the default in Turbo 2) still passes HOME and PATH through [CITED: turborepo.dev/docs/reference/configuration, "built-in set of global passthrough variables … HOME, PATH, APPDATA, SHELL, PWD"], so Deno's default `DENO_DIR` under `$HOME` works. No `passThroughEnv` is needed (the spike's 040 turbo run confirms).
- CI: `.github/workflows/main.yaml:162-163` `- name: "Type-check all packages (turbo run typecheck)"` / `run: yarn typecheck`, before `:165` ESLint, in job `frontend-and-shared-module-validation` [VERIFIED: file read]. `packages/dev-seed/tests/ciTypecheckGate.test.ts` pins only the root scripts and the step order, so it needs no edit.
- **CI has no remote turbo cache:** the 40846531438 validation log prints `• Remote caching disabled`, and its typecheck step ran `23 successful, 23 total … 10 cached` with `Running typecheck in 15 packages` (`@openvaa/supabase` was in scope with no task). After the phase the supabase task always executes in CI: it is a cache miss on its first run, and there is never a remote hit [VERIFIED: `gh run view 40846531438 --job 123355279014 --log`, saved to the scratchpad].
- `assert:declared-binaries` checks only `SCRIPT_SCOPE = ['build']` (its docblock), so a `typecheck` script invoking `deno` is out of its scope. The binary is declared anyway.
- **Warm runs print nothing.** A second `deno check .` over an unchanged graph prints 0 lines and exits 0, because Deno caches the check result [VERIFIED: scratch]. Never judge "it checked N modules" from a local warm run: use a fresh `DENO_DIR` or a changed file.

### Pattern 3: The `_shared/` move, exactly

File operations (keep history with `git mv`; every copy of `envConfig.ts` is byte-identical, md5 `b8296bb710d8b7ce217fd891fb2a3a84` ×3 [VERIFIED: `md5 -q */envConfig.ts`]):

```bash
F=apps/supabase/supabase/functions
mkdir -p $F/_shared
git mv $F/send-email/envConfig.ts            $F/_shared/envConfig.ts
git mv $F/send-email/envConfig.test.ts       $F/_shared/envConfig.test.ts
git rm $F/account-access/envConfig.ts $F/identity-callback/envConfig.ts
git mv $F/identity-callback/placeholderAddress.ts      $F/_shared/placeholderAddress.ts
git mv $F/identity-callback/placeholderAddress.test.ts $F/_shared/placeholderAddress.test.ts
git rm $F/account-access/placeholderAddress.ts
```

Import rewrites. The table holds every importer, found by `grep -rn` this session; the non-test ones match fact 6/7,
plus one test importer the facts do not list:

| File:line (today) | Today | After |
|---|---|---|
| `account-access/index.ts:53` | `import { requireEnv } from './envConfig.ts';` | `… from '../_shared/envConfig.ts';` |
| `account-access/index.ts:55` | `import { isPlaceholderAddress } from './placeholderAddress.ts';` | `… from '../_shared/placeholderAddress.ts';` |
| `account-access/addressConfirmation.ts:21` | `import { isPlaceholderAddress } from './placeholderAddress.ts';` | `… from '../_shared/placeholderAddress.ts';` |
| `identity-callback/index.ts:41` | `import { requireEnv } from './envConfig.ts';` | `… from '../_shared/envConfig.ts';` |
| `identity-callback/index.ts:44` | `import { placeholderAddressFor } from './placeholderAddress.ts';` | `… from '../_shared/placeholderAddress.ts';` |
| `identity-callback/serverCredential.ts:13` | `import { requireEnv } from './envConfig.ts';` | `… from '../_shared/envConfig.ts';` |
| `send-email/index.ts:5` | `import { requireEnv } from './envConfig.ts';` | `… from '../_shared/envConfig.ts';` |
| **`identity-callback/placeholderAccount.test.ts:7`** (not in the facts) | `import { placeholderAddressFor } from './placeholderAddress.ts';` | `… from '../_shared/placeholderAddress.ts';` |
| `_shared/envConfig.test.ts:10` (moved) | `import { requireEnv } from './envConfig';` | unchanged (vitest resolves the extensionless form; Deno never reads tests) |

[VERIFIED: `grep -rn --include='*.ts' -E "(envConfig|placeholderAddress|jwtSegment|callerAuthority)(\.ts)?['\"]"` over the functions tree, this session]

Test repointing:
- **`_shared/placeholderAddress.test.ts`:** remove `import * as accountAccess from '../account-access/placeholderAddress.ts';` (`:9`). Cut `COPIES` (`:12-19`) to two entries, `'_shared/placeholderAddress.ts': new URL('./placeholderAddress.ts', import.meta.url)` and the frontend entry. The frontend URL `'../../../../frontend/src/lib/contestant/utils/identityProviderAccount.ts'` resolves the same from `_shared/` as from `identity-callback/` (same depth), so it stays byte-for-byte. Delete the two cases that read `accountAccess` (`it.each(CASES)('answers %j as account-access does', …)` and `it('is the domain account-access exports', …)`). Rewrite the docblock (`:1-5`, "the three runtimes"). The `send-email` and `identity-callback` modules no longer hold copies, so "two runtimes" is accurate.
- **`identity-callback/flowConformance.test.ts:102-110`:** drop the `'placeholderAddress.ts': ['isPlaceholderAddress']` entry (D-15). With it gone the roster is empty, so removing the whole `EXPORTS_HELD_FOR_PARITY` constant, its docblock and the `.filter(…)` at `:116` is the clean form, and an empty roster with a docblock about a module that is not there fails hygiene by reading. `EXPORTED_VALUES.length` stays > 10: 28 exported values today, 24 after (counted with `grep -c -E "^export (async )?(function|const|let|class)\s+"` per module).
- **`send-email/flowConformance.test.ts:105`** pins `"import { callerMayOnProject } from './callerAuthority.ts';"`, which does not change (`callerAuthority.ts` stays).
- **`account-access/flowConformance.test.ts:30-32,247-251`:** reads its own directory, `sources.length > 5`. That holds, with 7 modules after the move.
- **`apps/supabase/scripts/edgeFunctionPins.test.ts`:** iterates directories with an `index.ts`; `_shared/` has none, so it is skipped [VERIFIED: file read].

Predicted vitest delta for `@openvaa/supabase` (an estimate. Record the real numbers from `yarn workspace @openvaa/supabase test:unit` before and after): −1 file (`jwtSegment.test.ts`). Tests: −6 (`jwtSegment.test.ts`), −17 (`placeholderAddress.test.ts`: 15 account-access `it.each` cases, 1 export case, 1 `COPIES` row), −3 (identity-callback `EXPORTED_VALUES`: `requireEnv`, `PLACEHOLDER_EMAIL_DOMAIN`, `placeholderAddressFor`). That is about −26. No E2E test changes.

### Pattern 4: The A3 typing (D-04), in the form the pins test accepts

```ts
// identity-callback/index.ts:37 — ONE import line, the combined form
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.117.2';
// :151-154, :175-177, :184-186 — each becomes
  supabaseAdmin: SupabaseClient,
```
Delete the `// reason:` line (`:152`) and the three `// deno-lint-ignore no-explicit-any` lines (`:153,176,185`).

**Why the combined form is required, not a style choice:** `edgeFunctionPins.test.ts:12` collects pins with
`NPM_PIN = /from 'npm:((?:@[^/@']+\/)?[^@']+)@([^']+)'/g` [VERIFIED: file read], and its first case expects
`identity-callback` exactly once in the supabase-js pin list. A separate `import type { SupabaseClient } from
'npm:@supabase/supabase-js@2.117.2';` line adds a second match, and `pin supabase-js in every function` goes red.

Measured on the scratch copy: exit 0 and Prettier-clean with the repo's `prettier.config.mjs` [VERIFIED: scratch].

### Pattern 5: The guard edit (D-16), by content anchor

In `scripts/assert-edge-env-defaults.mjs` (line numbers as read this session; anchor on the text):
- `:18` "THREE checks" becomes two; remove the Check 2 paragraph `:22-26`; renumber the "Check 3" paragraph `:27` to Check 2.
- `:33-37` "WHY THIS TREE NEEDS A GUARD OF ITS OWN" says "this guard is the only automated check that reaches `apps/supabase/supabase/functions` at all". After the phase `deno check` reaches the tree too, so rewrite the sentence (not in D-17's list).
- `:44-49` NO OPT-OUT: "`NOT_DUPLICATED` and the `*.test.ts` rule in check 2". After the edit the one remaining exclusion is the `*.test.ts` skip of the vitest-reachability check (`if (rel.endsWith('.test.ts')) continue;`, today `:294`).
- `:67` "0 - all three checks clean" becomes "both checks".
- Delete `:100-112` (`// ── Check 2` block and `const DUPLICATED_MODULES = ['envConfig.ts'];`) and `:265-289` (the loop). Rename `// ── Check 3` (`:114`) and `// --- Check 3:` (`:291`).
- `:259-260`, Check 1 message: "see `requireEnv` in the `envConfig.ts` beside this file" becomes "in `_shared/envConfig.ts`".
- `:322`, `checks live: 3 of 3 (env-default; copy-drift; vitest-reachability)` becomes `checks live: 2 of 2 (env-default; vitest-reachability)`.
- `path` stays imported (still used by `path.relative`/`resolve`/`join`).

[VERIFIED: `scripts/assert-edge-env-defaults.mjs` read in full this session]

**Planted control (D-16):** `Deno.env.get('X') ?? 'y'` placed in code in `_shared/envConfig.ts` produces TWO
violations, because `_shared/envConfig.ts` has a test beside it. Check 1 reports the defaulting operator, and the
renumbered vitest-reachability check reports the Deno global. The expected red therefore names both. The revert
gives green, and `git diff --quiet -- apps/supabase/supabase/functions/_shared/envConfig.ts` exits 0.

The guard's wiring test `packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts` asserts only that the guard is in the
chain, that the file exists (`'EDGE-FUNCTION ENVIRONMENT-DEFAULT GUARD'`) and that the classifier exists. Its
docblock `:8` repeats "this guard is the ONLY automated check that reaches `apps/supabase/supabase/functions` at
all", which goes stale with this phase (not in D-17's list).

### Pattern 6: The `jwtSegment` deletion (D-14), with every reference

`git grep -n -E "jwtSegment|decodeJwtSegment" -- ':!.planning'` outside the two files themselves answers exactly:
`.claude/skills/database/SKILL.md:919` (§ 8 heading text `decodeJwtSegment()`), `:920` (the path) and `:1117`
[VERIFIED: this session]. No script, test, docs page or fixture names it. `scripts/assert-edge-env-defaults.mjs` no
longer lists it (`DUPLICATED_MODULES = ['envConfig.ts']`). So the deletion is `git rm` of the two files plus the
skill § 8 rewrite and the `:1117` fix, with −6 vitest tests. The spike reference keeps its `jwtSegment` rows verbatim
(D-03), and its "On this branch" section marks them void.

### Prose surfaces: D-17's list, plus seven it misses

D-17's list (all confirmed present): the three `envConfig.ts:6`; `send-email/callerAuthority.ts:10`; both
`placeholderAddress.ts:8`; `apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts:10`;
`apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md:11,146`;
`.claude/skills/database/SKILL.md:908-914,1113-1117`; `scripts/assert-edge-function-env.mjs:14`.

**Also stale after the move (found by `git grep -n -E "envConfig|placeholderAddress|jwtSegment|DUPLICATED_MODULES|_shared"` and by reading):**
1. `.claude/skills/database/SKILL.md:705-715` (§ 1, `send-email`): "a second function that needs the gate holds a byte-identical copy and the module joins `DUPLICATED_MODULES` in `scripts/assert-edge-env-defaults.mjs`". After the phase, `DUPLICATED_MODULES` does not exist, and the rule becomes "moves to `_shared/`", the same rewrite as `callerAuthority.ts:10`.
2. `.claude/skills/database/SKILL.md:1143`: the dated measurement row `| Edge Function directories, and copies of `envConfig.ts` | 3 and 3, byte-identical | …`. It is a dated record, but D-25 gives the skill current counts, so add a dated row or note rather than rewriting history.
3. `apps/supabase/supabase/functions/send-email/templateVars.ts:6`: "Not duplicated: unlike `envConfig.ts` in this directory, …". After the phase `envConfig.ts` is not in this directory.
4. `scripts/assert-edge-env-defaults.mjs:33-37` and `packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts:8`: "the ONLY automated check that reaches the functions tree" (see Pattern 5).
5. `apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts:103-107`: the `EXPORTS_HELD_FOR_PARITY` docblock ("a copy that `placeholderAddress.test.ts` holds equal to `account-access`'s and the frontend's").
6. `_shared/placeholderAddress.test.ts:1-5` docblock ("the one domain the three runtimes … agree on").
7. `CLAUDE.md` § Skill Routing says the spike-findings skill has "three domains". Plan 01's new domain line makes that stale, so a fourth bullet is needed there (CLAUDE.md is agent-facing and exempt from hygiene, but is the router).

Leave alone: `scripts/fixtures/assert-no-candidate-app-names.input.ts:109` (`import n12 from '../account-access/envConfig.ts';` is synthetic input for the name guard, not an import) and `.claude/skills/database/SKILL.md:1327` (a historical provenance row).

### Pattern 7: Editor setup documentation (D-18, D-12)

Content for `apps/supabase/README.md` (e.g., a new "Editor setup" subsection under "Edge Functions") and the docs
page:
- `"deno.enablePaths": ["apps/supabase/supabase/functions"]`, the measured half (S8 vanilla 0/7, re-measured this session on the post-move tree).
- Optional `"deno.path"`. Candidates are `node_modules/.bin/deno` (a symlink to the Node shim `../deno/bin.cjs`) and `node_modules/deno/deno` (the real binary, present after the first `deno` run). Whether the VS Code extension accepts a relative path was not observed [ASSUMED].
- Never set `deno.enable` (S9: 6/7 vanilla files flagged, re-measured this session).
- "Prettier formats this tree": `deno fmt --check` disagrees with Prettier on 26 of 27 files (fact 13).

**Recommendation for D-12 (discretion): document only, no `fmt` key.** D-08 locks "the spike's exact four keys",
and a fifth (`fmt`) would break that. The editor-formats-with-Prettier check can only be manual, because no editor
was observed. The README line should name the VS Code setting that decides it, `"[typescript]": {
"editor.defaultFormatter": "esbenp.prettier-vscode" }` [ASSUMED: VS Code picks the formatter by
`editor.defaultFormatter`, so the Deno extension's formatter wins only when it is the default].

### Pattern 8: Bundle verification (D-20) on scratch exports

**How Supabase bundles locally:** `supabase functions deploy` (2.118.0) "Bundle[s] functions … using Docker" by
default (`--use-api` bundles server-side) [VERIFIED: `supabase functions deploy --help`]. There is no
`--dry-run`, and no local bundle or list subcommand: the CLI's `functions` subcommands are `list delete download
deploy new`, plus the hidden `serve`. `download` needs a hosted project, which D-27 excludes. The local bundling
path is the edge-runtime image's own `bundle` / `unbundle` subcommands, as in the spike's `verify.sh`:

```bash
docker run --rm -v "$FUNCTIONS:/home/deno/functions:ro" -v "$OUT/eszip:/out" -w /home/deno/functions \
  --entrypoint edge-runtime "$IMG" bundle --entrypoint "/home/deno/functions/$fn/index.ts" --output "/out/$fn.eszip"
docker run --rm -v "$OUT/eszip:/in:ro" -v "$OUT/unbundled:/out" --entrypoint edge-runtime "$IMG" \
  unbundle --eszip "/in/$fn.eszip" --output "/out/$fn/fn"     # one level deeper: ../_shared lands beside fn/
```
[VERIFIED: `git show 796e610a7:…/sources/039-shared-module/verify.sh`]. The image `public.ecr.aws/supabase/edge-runtime:v1.76.2` is present locally (`docker image ls`), so no pull is needed.

**Recommended `verify.sh` adaptation:**
- `FNS="account-access identity-callback send-email"`.
- `FUNCTIONS` from an argument or env var, not `$HERE/../../..`. The spike's path assumes `.planning/spikes/<spike>/`, which does not exist on this branch.
- A new container name and port (e.g. `p180-edge`, `54992`).
- Write it to the phase directory (`$P/180-verify-bundles.sh`), not the repo tree.
- **Both passes on exports, never on the working tree:** `git archive HEAD apps/supabase/supabase/functions | tar -x -C $SCRATCH/with` and the same into `$SCRATCH/without`, then `rm $SCRATCH/without/…/functions/deno.json`. This keeps the committed `deno.json` in place, proves the committed tree, and keeps the ignored `functions/.env` (secrets) out of every container mount. Docker Desktop shares `/private` by default, which holds the scratchpad [ASSUMED].
- **Pass/fail per function:**
  - bundle exit 0;
  - `find unbundled/$fn -type f` lists `_shared/<expected>.ts` for exactly the D-20 set and no `*.test.ts`;
  - `cmp with/eszip/$fn.eszip without/eszip/$fn.eszip` exits 0;
  - `OPTIONS` answers 200.
- **D-20 discretion, `cmp` or `diff -r`:** use `cmp`. The spike found the eszips "byte-identical for all four functions with the file present and with it removed" (039), which two separate bundling runs could not produce if the eszip embedded a timestamp [CITED: spike reference § 1 and § Deployment facts]. Fall back to `diff -r` of the unbundled trees only if `cmp` differs, and record why.
- Spike expectation to re-check: `identity-callback` answers `POST {}` with 500 and logs `Missing required environment variable: IDENTITY_PROVIDER_TYPE`, thrown from `_shared/envConfig.ts`, which is direct evidence that the shared module executes.

**Stack or no stack, per command:**

| Command | Needs the running stack? | Needs Docker? |
|---|---|---|
| `yarn workspace @openvaa/supabase typecheck`, `yarn typecheck`, `yarn turbo run typecheck --filter=@openvaa/supabase` | no | no |
| `yarn workspace @openvaa/supabase test:unit` | no (pure modules) | no |
| `yarn assert:edge-env-defaults`, `yarn assert:edge-function-env`, `yarn assert:comment-hygiene`, `yarn lint:check`, `yarn format:check` | no | no |
| `yarn test:unit` (root, all workspaces) | **yes**: dev-seed integration tests read `SUPABASE_URL` from the root `.env` and go red with `fetch failed` when the stack is down (standing memory note) | yes (via stack) |
| `verify.sh` bundle + `OPTIONS` passes (standalone image, own name/port) | no | **yes** |
| `lsp-probe.mjs` S8/S9 on a scratch export | no | no |
| `tests/scripts/e2e-run.sh …` (targeted and full) | **yes** (D-26 gates it) | yes |
| Reading `restore.txt` `OPTIONS <fn>:` lines of a run | produced by the run's stack restart | — |
| `git ls-files` / `git grep` structural checks | no | no |

"Answers on the restarted local stack" is observed per function by the wrapper's restore step:
`function_names()` (`tests/scripts/e2e-run.sh:793-799`) lists directories with an `index.ts`, so `_shared/` is
excluded, and each is probed with `function_options_status` (`:778-782`, `curl … -X OPTIONS
"$SUPABASE_URL/functions/v1/$1"`), recorded as `OPTIONS <fn>: <code>` in `$RUN_DIR/restore.txt`. The last full run's
record reads `OPTIONS account-access: 200`, `OPTIONS identity-callback: 200`, `OPTIONS send-email: 200`, `restore: ok`
[VERIFIED: `tests/e2e-runs/179.2/179.2-final-4/restore.txt`]. Cite these lines in plan 03's record for criterion 4.

### Pattern 9: The CI-evidence channel (D-22, D-28)

The standing method, as executed in `179.1-CI-E4.md` and recorded in the memory note `project_ci_evidence_channel`:
```bash
cd ~/Desktop/OpenVAA/voting-advice-application-gsd
git fetch origin main                       # record origin/main's sha (it was 340a20070 for 179.1-e4)
export GIT_INDEX_FILE="$SCRATCH/ev180.index"; rm -f "$GIT_INDEX_FILE"
git read-tree HEAD
git rm -r --cached --quiet .planning .bg-shell
TREE=$(git write-tree)
COMMIT=$(git commit-tree "$TREE" -p origin/main -m "ci: evidence tree for the Deno typecheck (180)")
git branch -f ci-evidence/180-deno "$COMMIT"; unset GIT_INDEX_FILE
```
This touches neither the working tree nor the real index nor the current branch. Checks before asking for the push
(all from 179.1-CI-E4):
- 0 paths under `.planning/`, `.bg-shell/` and `tests/e2e-runs/`;
- `CAND-APP-PLAN.md` absent (it is untracked, so `read-tree HEAD` never sees it);
- `git check-ignore --no-index --stdin` over every path gives 0;
- `git diff --quiet HEAD ci-evidence/180-deno -- . ':(exclude).planning' ':(exclude).bg-shell'` exits 0;
- `git rev-list --count ci-evidence/180-deno ^origin/main` is 1;
- `main.yaml` in the commit names `"ci-evidence/**"`;
- at least one changed non-`.md` path (`paths-ignore: "**.md"`).

The push, only on the operator's go (D-28):
`git push --force-with-lease=ci-evidence/180-deno: origin ci-evidence/180-deno` (the empty expected value refuses to
overwrite an existing remote branch). Then read at job level:
`gh run view <id> --job <validation-job-id> --log > $SCRATCH/ci-180.log`, grepped and never printed whole. What to find:
- `@openvaa/supabase:typecheck` lines, with 22 `Check …` lines after the move (not 26);
- `Download https://registry.npmjs.org/…` lines (the cold cache);
- in the install step, the `deno` build-script warning, and `@deno/linux-x64-glibc` linked.

Every other job is recorded as found. At 179.1-e4 the red jobs were `secret-scan`, `e2e-tests` and `dependency-audit`.

### Pattern 10: E2E blast radius (D-23 derivation, D-24)

Derive at run time. The commands below give the set as of HEAD.

Callers in the frontend that run on each function's behalf:
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:545-553`: `#accountAccess(…)` → `functions.invoke('account-access', …)` for `check-code`, `request-link`, `request-recovery`, `confirm-address`, `code-sign-in`.
- `apps/frontend/src/routes/api/oidc/callback/+server.ts:187`: `functions.invoke('identity-callback', …)`.
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:132`: `functions.invoke('send-email', …)`. **Nothing in `apps/frontend/src` calls `sendEmail(`**, so no Playwright project drives `send-email` [VERIFIED: `git grep`]. Its only live observations are `verify.sh`'s `OPTIONS` and the wrapper's `restore.txt` probe.

Test-side helpers that call a function: `tests/tests/utils/accountAccessClient.ts` (`${SUPABASE_URL}/functions/v1/account-access`), `utils/supabaseAdminClient.ts` (`inviteByEmail` → `requestLink`), `fixtures/shared/invitationFlow.fixture.ts`, `fixtures/shared/identityProviderFlow.fixture.ts`, `fixtures/shared/emailBucket.fixture.ts`, `utils/mailedLink.ts`, `support/mockOidcIssuer.ts` and `utils/buildTestIdToken.ts`. Their importers map to these projects (by each project's `testMatch` in `tests/playwright.config.ts`):

| Project | Function(s) driven | Through |
|---|---|---|
| `bank-auth` | identity-callback | `contestant-bank-auth.spec.ts` (direct call with the server secret; mock OIDC issuer) |
| `contestant-identity-provider` | identity-callback, account-access (`confirm-address`) | `identityProviderFlow.fixture`, browser flow, mailed confirmation |
| `invitation-contract` | account-access | `accountAccessClient` direct |
| `invitation-landing` | account-access | `fixtures/contestant/invitation-landing.ts` → `invitationFlow` |
| `contestant-email-registration` | account-access | `fixtures/contestant/contestant-registration.ts`, `mailedLink` |
| `contestant-code-registration` | account-access | same |
| `contestant-password-recovery` | account-access | same |
| `admin-account-flows` | account-access | `fixtures/admin/admin-account-flows.ts` → `invitationFlow` |
| `contestant-entry-scan` | account-access | `invitationFlow` seeding, entry screens calling `check-code` |
| `contestant-entry-phone` | account-access | `invitationFlow`; depends on `data-setup-passwordless-session` |
| `contestant-a11y-scan` | account-access | `invitationFlow`; depends on `data-setup-passwordless-session` |
| `contestant-journey` | account-access | `inviteByEmail`, `mailedLink` |
| `perm-localisation-positive` | account-access | `inviteByEmail` via `fixtures/contestant/perm-l10n.ts` |

That is 13 projects, matching the discussion document's list. `visual-regression` imports
`fixtures/contestant/contestant-journey` but is opt-in (`PLAYWRIGHT_VISUAL`) and outside the default run: excluded.

**Cost note (not a contradiction):** each targeted run is one wrapper invocation, which restarts the stack at its end
(about 30 s), and `--project` pulls dependencies. `perm-localisation-positive` depends on `perm-missing-nominations`
in the perm serial chain, so its run pulls most of the suite (179.2's rules measured `--project admin-access` at 108
of 129 projects). Thirteen runs therefore cost more wall-clock than one full run. D-23 accepts this. The planner
should budget for it, run the 13 projects sequentially, and keep each run's directory.

**Wrapper serve path:** `tests/scripts/e2e-run.sh:974` `exec npx --no-install supabase functions serve identity-callback --no-verify-jwt --env-file "$IDP_DIR/edge.env"`. In CLI 2.118.0 the name argument is "Legacy Function names. All Functions are served." [VERIFIED: `supabase functions serve --help`]. The serve log lists all three (`- http://127.0.0.1:54321/functions/v1/account-access`, `…/identity-callback`, `…/send-email`) [VERIFIED: 179.2-final-4 `idp-functions.log`]. After the move, check in each run's `idp-functions.log` that the list still holds exactly three and that no `functions/v1/_shared` line appears. Also check that no new `import map` / `deno.json` warning appears (0 such lines at 179.2-final-4).

### Anti-Patterns to Avoid
- **Running `verify.sh` or the LSP probe against the working tree.** The probe creates `functions/deno.json` and refuses if it exists (the file is committed after plan 02). `verify.sh` would mount the ignored `.env`. Use `git archive` exports.
- **A separate `import type … from 'npm:@supabase/supabase-js@…'` line** (breaks `edgeFunctionPins.test.ts`).
- **Adding keys to `deno.json`** (`fmt`, `imports`, `nodeModulesDir`, `compilerOptions`): D-08 locks four.
- **Judging the typecheck by a warm local run's output:** it prints nothing.
- **`git add -A` / `git stash`** (standing rule); `CAND-APP-PLAN.md` never staged.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Getting a Deno binary on every machine and CI | curl/brew installer, `denoland/setup-deno` in CI only | npm `deno` devDependency + its `bin.cjs` shim | Pinned by `yarn.lock`, same on host and CI; a global install was the cause of the earlier repo-wide flagging |
| Sharing code across functions | Yarn workspace package, import-map alias, copy + drift guard | `functions/_shared/` with relative imports | Supabase documents `_`-prefixed shared folders [CITED: supabase.com/docs/guides/functions/development-tips: "store any shared code in a folder prefixed with an underscore (`_`)"]; bundles follow the import graph |
| Listing what a bundle contains | eszip parser | `edge-runtime unbundle` one level deep | The image's own tool; the spike measured it |
| Typing the admin client | a hand structural interface | `SupabaseClient` from the same pinned specifier | The spike's TS2589 came from a hand interface |
| Proving a CI run without a PR | cherry-pick / `/gsd-pr-branch` | temp-index source-only commit on `ci-evidence/**` | Leaves `.planning/` and the working tree untouched |

**Key insight:** every mechanism this phase needs already exists in the repository or in the runtime image.
Deviations from the spike's file contents are worse than deviations in the counts.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None. No database row, storage object or seed names a function module path (`git grep` over `apps/supabase/supabase/{schema,migrations,seed.sql}` and `packages/dev-seed` finds no `envConfig`/`placeholderAddress`). | none |
| Live service config | The hosted staging project holds functions deployed from the old layout. D-27 forbids a deploy in this phase, so its bundles stay pre-move until a later deploy, which bundles `_shared/` automatically. `config.toml:431-436` has only `[functions.identity-callback] verify_jwt = false`, with no per-function `import_map` to repoint. | none in this phase; note at close that the next deploy is the first hosted one with `_shared/` |
| OS-registered state | None (no launchd/pm2/systemd entry names a function). | none |
| Secrets/env vars | No variable is renamed. `apps/supabase/supabase/functions/.env` (ignored) and `.env.example` stay as they are; `assert:edge-function-env` derives the required names from `requireEnv('NAME'` call sites, which stay in the `index.ts` files. | none (D-17 fixes the docblock path at `:14` only) |
| Build artifacts / installed packages | `node_modules/deno/deno` appears on the first `deno` run (shim hard-link). Turbo's local `.turbo` cache keys change by themselves. The local edge-runtime container under `per_worker` may hold workers of the old layout until restarted: D-24 and D-26 restart it. `~/.deno/bin/deno` 2.7.8 stays a separate global binary (not on `PATH`). | restart the stack before the first E2E run of each plan (D-26) |

## Common Pitfalls

### Pitfall 1: The `cd` and config discovery
**What goes wrong:** `deno check supabase/functions` from `apps/supabase` finds no `deno.json`, applies no `exclude`, and dies with `error: Could not resolve "vitest", but found it in a package.json` [VERIFIED: scratch, exit 1].
**How to avoid:** keep the script exactly `cd supabase/functions && deno check .` (D-10).

### Pitfall 2: Turbo or Deno caches hiding the evidence
**What goes wrong:** a warm `deno check .` prints nothing, and a turbo replay prints the cached log. Either can look like "no modules checked" or "checked" without running.
**How to avoid:** for counts, use a fresh `DENO_DIR` (`DENO_DIR=$SCRATCH/denodir yarn workspace @openvaa/supabase typecheck`). For D-21's turbo half, run `yarn turbo run typecheck --filter=@openvaa/supabase` twice (expect `FULL TURBO` the second time), then plant (cache miss, red), then revert (back to the cached hash). Read every exit status directly.

### Pitfall 3: The supabase-js pin test
See Pattern 4. **Warning sign:** `pin supabase-js in every function` red with `identity-callback` listed twice.

### Pitfall 4: The guard's planted control fires twice
See Pattern 5. Expect two violations (Check 1 plus vitest-reachability), not one.

### Pitfall 5: A test importer outside the facts
`identity-callback/placeholderAccount.test.ts:7` imports `./placeholderAddress.ts`. Miss it and vitest goes red at the move commit.

### Pitfall 6: Source-scan coverage narrows
**What goes wrong:** `account-access/flowConformance.test.ts` and `identity-callback/flowConformance.test.ts` scan only their own directory, so `_shared/` modules are outside their "no direct `createUser`", "one admin update" and "no unused export" scans.
**How to avoid:** acceptable today, since both shared modules are pure, with no client and no I/O. Say so in the skill reference's "On this branch" section. Extending the scans to `../_shared/` is not in any decision.

### Pitfall 7: Checker and runtime versions differ
The checker is 2.9.6 (TS 6.0.3); the runtime is Deno 2.1.4 (TS 5.6.2 per the spike). Equal results are an observation about this code (D-07). A construct that is new in TS 6 or Deno 2.9 could pass the check and fail at runtime. The E2E runs and `verify.sh`'s `OPTIONS` pass are the runtime-side checks.

### Pitfall 8: Untyped and floating npm dependencies
`nodemailer@10.0.11` ships no types, and Deno 2.9.6 downloaded no `@types/nodemailer` [VERIFIED: the 23 cold downloads list `nodemailer` but no `@types/…`], so its call sites are `any` to the checker. With `lock: false` the transitive dependencies (`@opentelemetry/api`, `tslib`, `iceberg-js`, …) float, and a transitive release could change a type result on an unchanged tree, CI first. Both are accepted by D-09. Record them in the skill reference.

### Pitfall 9: Specifier resolution without an import map
`npm:` specifiers resolve from the registry into `DENO_DIR` because `functions/deno.json` is nearer than any `package.json` (no `node_modules` created, verified this session with both ancestor `package.json` files in place). `jsr:` specifiers would resolve from jsr.io the same way. There are none today (only `npm:` in the three `index.ts`). Never "fix" Deno 2.9's `no-import-prefix` by adding an `imports` map (D-08). The bundler and the guards read the inline pinned specifiers.

### Pitfall 10: Lint findings drift
`deno lint` on the post-move scratch tree: `Checked 22 files`, `Found 4 problems`, all `require-await` (`callerMayOnEntity`, `callerMayOnProject`, `issueRecoveryLink`, `issueSignInLink`) [VERIFIED: scratch]. The count matches fact 13. Record "22 files" (not 26) in the skill reference.

## Code Examples

### The three D-21 plants (measured on the scratch copy, Deno 2.9.6)
```bash
# from apps/supabase/supabase/functions, deno.json present
echo "export const planted: number = 'not a number';" >> _shared/envConfig.ts
deno check .; echo $?    # 1 — "TS2322 [ERROR]: Type 'string' is not assignable to type 'number'." … "at file://…/_shared/envConfig.ts:34:14"
# revert; then
echo "const plantedIdx: number = 'x';" >> send-email/index.ts
deno check .; echo $?    # 1 — TS2322 naming send-email/index.ts
# revert; then
echo "const plantedT: number = 'x';" >> send-email/callerAuthority.test.ts
deno check .; echo $?    # 0 — the test file is excluded
```
In the repository, run each as `yarn workspace @openvaa/supabase typecheck` with `; echo $?` read directly (no
pipe), then `git checkout -- <file>` and `git diff --quiet -- <file>`.

### The LSP probe on the post-move tree (D-19), as run this session
```bash
S=$SCRATCH/repo
git archive HEAD -- . ':(exclude).planning' | tar -x -C "$S"     # after plan 02: the committed tree
rm "$S/apps/supabase/supabase/functions/deno.json"              # the probe creates it itself
mkdir -p "$S/.planning/spikes/038"                               # ROOT = ../../.. from the script
git show 796e610a7:.claude/skills/spike-findings-voting-advice-application-gsd/sources/038-editor-blast-radius/lsp-probe.mjs > "$S/.planning/spikes/038/lsp-probe.mjs"
# FILES: replace `${FN}/invite-candidate/entityGrant.ts` → `${FN}/_shared/envConfig.ts`,
#        `${FN}/send-email/jwtSegment.test.ts` → `${FN}/send-email/callerAuthority.test.ts`
cd "$S/.planning/spikes/038" && DENO=<path to node_modules/@deno/darwin-arm64/deno> node lsp-probe.mjs S8-recommended S9-functions-deno-json+enable-true
```
This session's result: `S8-recommended … vanilla flagged 0/7 | function flagged 0/3 | function test flagged 0/1`;
`S9-functions-deno-json+enable-true … vanilla flagged 6/7 | function flagged 2/3 | function test flagged 1/1`
[VERIFIED: scratch, `lsp-probe-postmove.txt`].

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Byte-identical copies per function + copy-drift guard | `_`-prefixed shared folder, relative imports | Supabase docs (current) | Removes Check 2 and the copies |
| Import maps (`import_map.json`) | Per-function `deno.json` (CLI ≥ v1.215.0) or inline pinned `npm:` specifiers | Supabase changelog #30291 [CITED: supabase.com/changelog/30291] | This repo keeps inline pins; the top-level `functions/deno.json` is not a per-function config, and the CLI's documented lookups are `functions/<fn>/deno.json` and `functions/import_map.json` [ASSUMED from search snippets; the E2E serve log is the observation] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Yarn skips `@deno/linux-*-glibc` on Alpine (musl), so the Docker image build stays green | Pattern 1 | `docker-image-build` CI job red; seen in the F1 run |
| A2 | Docker Desktop shares `/private` (scratchpad) into containers by default | Pattern 8 | `verify.sh` mounts an empty directory; fix by exporting under `$HOME` instead |
| A3 | The VS Code Deno extension accepts a relative `deno.path` | Pattern 7 | The doc line misleads; it is marked optional and unobserved |
| A4 | VS Code's `editor.defaultFormatter` decides Prettier vs Deno formatting in enabled paths | Pattern 7 | A contributor's editor rewrites files with `deno fmt`; manual check only |
| A5 | The Supabase CLI does not read a top-level `functions/deno.json` as an import map when serving or deploying | State of the Art | A new warning or a resolution change in `idp-functions.log`; checked in every E2E run's serve log |
| A6 | The predicted vitest delta (about −26 tests, −1 file) | Pattern 3 | Only bookkeeping; record the measured numbers |

## Open Questions

1. **Should the new wiring get a standing assertion?** The repo's pattern (`ciTypecheckGate.test.ts`, `edgeEnvDefaultsGate.test.ts`) asserts gate wiring in `packages/dev-seed/tests`.
   - What we know: nothing would fail if someone deleted the `typecheck` script or loosened `"deno": "2.9.6"` to a caret. `yarn typecheck` would stay green.
   - What's unclear: no decision asks for it.
   - Recommendation: offer it to the operator as an optional plan 02 task: a spec asserting `scripts.typecheck === 'cd supabase/functions && deno check .'`, `devDependencies.deno` matching `/^\d+\.\d+\.\d+$/`, and that `functions/deno.json` has exactly the four keys. Do not add it unasked.
2. **Where `verify.sh` and the updated `lsp-probe.mjs` live.** D-03 brings the spike's `sources/` over verbatim, so the edited copies must not overwrite them. Recommendation: put the edited copies in the phase directory (`$P/180-verify-bundles.sh`, `$P/180-lsp-probe.mjs`), parameterised by path, and reference them from the skill's "On this branch" section.
3. **D-17's commit placement vs D-23's list.** D-17 says the prose goes "in the move's commit". D-23 lists "the prose (D-17)" as a separate item. Recommendation: the move commit carries every surface the move makes false. The `jwtSegment` commit carries § 8 and `:1117`. A last commit carries only new docs (README and docs page editor setup, D-18). Discretion over commit order allows this.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | all scripts | ✓ | v24.21.0 (nvm) | — |
| Yarn | install, scripts | ✓ | 4.18.1 (`yarnPath`) | — |
| npm registry (network) | `yarn install` of `deno` (once); cold `deno check` | ✓ (registry queries answered this session) | — | none for the first install |
| `deno` in this worktree | the new script | ✗ (not yet installed; plan 02 installs it) | — | spike worktree's 2.9.6 binary for scratch measurements only |
| Docker | `verify.sh`, the stack | ✓ | 29.7.2 | — |
| `public.ecr.aws/supabase/edge-runtime:v1.76.2` | `verify.sh` | ✓ (local image, in use) | v1.76.2 | — |
| Supabase CLI | serve, help | ✓ | 2.118.0 | — |
| `gh` | reading the CI run | ✓ | 2.103.3 | — |
| Local Supabase stack | E2E, root `test:unit` | **gated (D-26)**: held by -infra until the operator says 185-10 has returned | — | none; plans 02 and 03 checkpoint on it |
| `core.hooksPath` | commits | `/dev/null` (worktree-local override) | — | — |

**Missing dependencies with no fallback:** the stack (D-26). Every stack-dependent task waits for the operator's word.
**Missing with fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Deno 2.9.6 `deno check` (new); vitest catalog `^5.0.2` (`apps/supabase`, `packages/dev-seed`); Node gate scripts; Playwright via `tests/scripts/e2e-run.sh`; Docker `edge-runtime` v1.76.2 for bundles |
| Config file | `apps/supabase/supabase/functions/deno.json` (new); `apps/supabase/vitest.config.ts` (unchanged) |
| Quick run command | `yarn workspace @openvaa/supabase typecheck; echo $?` then `yarn workspace @openvaa/supabase test:unit; echo $?` then `yarn assert:edge-env-defaults; echo $?` (no stack, about 10 s warm) |
| Full suite command | `yarn lint:check` + `yarn format:check` + `yarn test:unit` (stack) + `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/180/<label> --no-db-reset` (stack, ~18 min) |

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Automated Command | Exists? |
|-----|----------|-----------|-------------------|---------|
| SC-1 | the check runs and is green | gate | `yarn workspace @openvaa/supabase typecheck; echo $?` → 0 | after plan 02 commit 1 |
| SC-1 | it reaches `yarn typecheck` / `lint:check` | gate | `yarn turbo run typecheck --filter=@openvaa/supabase --dry=json` lists `@openvaa/supabase#typecheck`; `yarn lint:check` exit 0 | ✅ wiring exists |
| SC-1 | plants: `_shared` red, `index.ts` red, test green | control | the three plants (Code Examples), exits read directly; `git diff --quiet` after each revert | manual-run, scripted |
| SC-1 | turbo cache: `FULL TURBO` then cache miss red | control | `yarn turbo run typecheck --filter=@openvaa/supabase` ×2, plant, run, revert | scripted |
| SC-1 | no `any` left | static | `git grep -n -E "supabaseAdmin: any\|no-explicit-any" -- apps/supabase/supabase/functions` → no output (exit 1) | ✅ |
| SC-1 | counts | evidence | fresh `DENO_DIR`: `grep -c '^Check'` of the output = 22 | scratch-measured |
| SC-2 | one config, scoped, no import map | static | `git ls-files \| grep -E '(^\|/)deno\.jsonc?$'` = exactly `apps/supabase/supabase/functions/deno.json`; `node -e` keys of it = `lock,exclude,lint`; `git ls-files deno.json deno.jsonc` empty | ✅ |
| SC-2 | `deno.enable` set nowhere | static | `git grep -n -E '"deno\.enable"[[:space:]]*:' -- ':!.planning'` → no output (the docs mention `deno.enable` in prose only; the regex matches a JSON key) | ✅ |
| SC-2 | editor boundary | probe | LSP probe S8 → `vanilla flagged 0/7`; S9 → `6/7` (contrast) | scratch-measured |
| SC-2 | documented | static | `git grep -n "deno.enablePaths" -- apps/supabase/README.md "apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md"` → 2+ lines | ❌ until plan 02 |
| SC-3 | one copy each | static | `find apps/supabase/supabase/functions -name envConfig.ts` → 1 line (`_shared/`); same for `placeholderAddress.ts`; `ls _shared` → the 4 files | ✅ after move |
| SC-3 | relative imports | static | `git grep -n "from '\.\./_shared/" -- apps/supabase/supabase/functions` → 8 lines (7 non-test + `placeholderAccount.test.ts`); `git grep -n -E "from '\./(envConfig\|placeholderAddress)" -- apps/supabase/supabase/functions ':!**/_shared/**'` → none | ✅ |
| SC-3 | guard without Check 2 | gate + control | `yarn assert:edge-env-defaults` prints `checks live: 2 of 2 (env-default; vitest-reachability)`, exit 0; plant → exit 1 with 2 violations; revert → 0 | ✅ |
| SC-3 | prose clean | static | `git grep -n -i -E "DUPLICATED ON PURPOSE\|byte-identical cop\|THREE COPIES\|DUPLICATED_MODULES\|NOT_DUPLICATED" -- apps packages scripts .claude/skills/database` → none; `yarn assert:comment-hygiene` exit 0 | ✅ |
| SC-3 | jwtSegment gone | static | `git grep -n -E "jwtSegment\|decodeJwtSegment" -- ':!.planning' ':!.claude/skills/spike-findings-voting-advice-application-gsd'` → none | ✅ |
| SC-3 | unit suites | unit | `yarn workspace @openvaa/supabase test:unit` green; delta recorded | ✅ |
| SC-4 | bundles, contents, config-independence, OPTIONS | Docker | `$P/180-verify-bundles.sh <with-export> <without-export>`: per function bundle exit 0, `_shared` set exact, no test, `cmp` 0, `OPTIONS 200` | ❌ Wave 0 (plan 03 writes it) |
| SC-4 | answers on the restarted stack | E2E record | each run's `restore.txt`: three `OPTIONS <fn>: 2xx/4xx` lines + `restore: ok`; `idp-functions.log` lists 3 functions, no `_shared` | ✅ wrapper |
| SC-5 | CI | CI | job `frontend-and-shared-module-validation` `success`; log grep as in Pattern 9 | ❌ needs D-28 go |
| SC-5 | gates | gate | `yarn lint:check`, `yarn format:check`, `yarn test:unit`, `yarn audit:deps` recorded | ✅ |
| E2E-03 | 13 targeted + 1 full | E2E | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/180/<label> --no-db-reset --project <p>` ×13; full run judged against `tests/e2e-runs/179.2/179.2-final-4` (`{"total":729,"passed":729,"failed":0,"flaky":0,"skipped":0,"didNotRun":0}`) with summed deltas (expected 0) | ✅ wrapper, `e2e-evidence.mjs`, `e2e-spec-verdict.mjs` |

In the table above, `\|` is markdown's escape for the table cell. In a shell command, write `|` (the ERE alternation).

### Sampling Rate
- **Per task commit:** the quick command (typecheck, supabase vitest, edge guard) plus `yarn assert:comment-hygiene` when a comment changed. All of these are stack-free and run in under 30 s.
- **Per plan close:** `yarn lint:check` and `yarn format:check` (backgrounded, polled). Root `yarn test:unit` and the targeted E2E runs come after the D-26 stack check.
- **Phase gate:** the full E2E run (plan 03), the CI job, `verify.sh` and the LSP probe, all green before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `$P/180-EXECUTION-RULES.md`, modelled on `179.2-EXECUTION-RULES.md`. It must carry D-26's gate in place of 179.2's "stack is free" paragraph, the stack check (stop/start, migration count vs manifest, edge-runtime mount), the targeted-run list rule, and the deltas file.
- [ ] `$P/180-E2E-DELTAS.md`: header only (expected no rows).
- [ ] `$P/180-verify-bundles.sh` (from the spike's `verify.sh`, parameterised) and `$P/180-lsp-probe.mjs` (from `lsp-probe.mjs`, `FILES` updated): written by plan 03 (or plan 01 with the sources).
- [ ] No new test framework or config is needed.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no change | `identity-callback`'s server-secret and JWKS checks are untouched; the A3 typing is type-only (erased) |
| V3 Session Management | no | — |
| V4 Access Control | no change | `send-email`'s `callerAuthority.ts` stays where it is, imported as before (pinned by `send-email/flowConformance.test.ts:105`) |
| V5 Input Validation | no change | — |
| V6 Cryptography | no | — |
| V10 Malicious code / V14.2 Dependencies | **yes** | Exact pin, age gate (`npmMinimalAgeGate: 7d`), `enableScripts: false`, lockfile immutability in CI, legitimacy check OK for `deno` and both platform packages |
| V14 Configuration | yes | No secrets in `deno.json`; the ignored `functions/.env` is kept out of every scratch export and container mount; the CI evidence tree has 0 ignored paths (`git check-ignore --no-index`) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Supply-chain substitution of the checker binary | Tampering | Exact version + lockfile checksum for `deno`; platform packages from the same release; no postinstall execution |
| A dev-only tool reaching the deployed artefact | Tampering | D-20 `cmp` of eszips with and without `deno.json`; bundles contain the entry graph only |
| Publishing internal planning material to the public repo | Information disclosure | Source-only evidence commit without `.planning/`/`.bg-shell/`; push only on the operator's go (D-28) |
| A shared module gaining an environment default unnoticed | Tampering / misconfiguration | `assert:edge-env-defaults` Check 1 walks `_shared/` (recursive `readdirSync`, `:134`), with the planted control |
| Dead code shipped in a deployment unit | — | `jwtSegment.ts` deleted (D-14) |

## Sources

### Primary (HIGH confidence; read or run this session)
- `180-CONTEXT.md`, `180-DISCUSSION-POINTS.md`, `180-DISCUSSION-LOG.md`; `ROADMAP.md` § Phase 180 via `roadmap.get-phase 180`
- `git show 796e610a7:…/references/deno-edge-typecheck.md`, and the sources `040-toolchain-wiring/{deno.json,toolchain.patch,vscode-settings.example.json}`, `039-shared-module/verify.sh`, `037-deno-check-functions/run.sh`, `038-editor-blast-radius/lsp-probe.mjs`
- Repo files: `.yarnrc.yml`, `package.json`, `apps/supabase/package.json`, `turbo.json`, `.github/workflows/main.yaml`, `packages/dev-seed/tests/{ciTypecheckGate,edgeEnvDefaultsGate}.test.ts`, `scripts/assert-edge-env-defaults.mjs`, `scripts/assert-edge-function-env.mjs`, `apps/supabase/scripts/edgeFunctionPins.test.ts`, the function sources and tests, `tests/scripts/e2e-run.sh`, `tests/playwright.config.ts`, `.claude/skills/database/SKILL.md`, the docs page, `apps/supabase/README.md`, `apps/frontend/Dockerfile`, `yarn.lock`
- Scratch measurements with the spike worktree's npm `deno 2.9.6` (TypeScript 6.0.3): post-move `deno check`, plants, `deno lint`, no-`cd` failure, `--cached-only`, LSP probe S8/S9
- `tests/e2e-runs/179.2/179.2-final-4/{restore.txt,idp-functions.log,summary.json}`
- `gh run view 40846531438 --job 123355279014 --log`: turbo remote cache disabled, typecheck step shape
- `.planning/phases/179.1-…/179.1-CI-E4.md`, `.planning/phases/179.2-…/179.2-EXECUTION-RULES.md`
- npm registry (`npm view`) and the `package-legitimacy check` seam

### Secondary (MEDIUM)
- Supabase CLI 2.118.0 `--help` for `functions`, `functions deploy`, `functions serve`, `functions download`

### Tertiary (LOW; web, marked where used)
- turborepo.dev docs (strict env mode passthrough of HOME/PATH)
- supabase.com/docs/guides/functions/development-tips (underscore-prefixed shared folders)
- supabase.com/changelog/30291 and the dependencies guide (per-function `deno.json`, import-map fallback), from search snippets

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. The pin, registry state, lockfile shape and install behaviour are read from files and the registry, and the spike install is observed.
- Architecture: HIGH. The post-move layout was type-checked, linted and LSP-probed on a scratch copy. The import map is from a full grep.
- Pitfalls: HIGH for the pins test, the guard double-fire, the test importer and the warm-cache silence (each reproduced or read). MEDIUM for CLI serve/deploy config handling (observed only through E2E logs).
- Bundle verification: MEDIUM. The method and image are confirmed, but no bundle was built this session (Docker containers were not started under the stack constraint).

**Research date:** 2026-11-12
**Valid until:** 2026-12-12 (stable toolchain; re-check `npm view deno dist-tags` and the edge-runtime image if the Supabase CLI catalog pin moves)
