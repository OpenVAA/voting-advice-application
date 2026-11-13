# Phase 180: Edge Functions — Typecheck & Shared Modules - Context

**Gathered:** 2026-11-12
**Status:** Ready for planning (stack use waits on the operator's word that -infra plan 185-10 has returned, D-26)

<domain>
## Phase Boundary

The Supabase Edge Functions (`account-access`, `identity-callback`, `send-email`) come under a typecheck that fails
the build on a type error: a Deno pinned to an exact version, run by `yarn typecheck` (and so by `yarn lint:check`
and the CI type-check step). Deno tooling flags nothing outside `apps/supabase/supabase/functions/`, on the command
line or in an editor. Each module that more than one function uses exists once, under `functions/_shared/`.

The phase is an operator-directed refactor with no v2.16 requirement; E2E-03 is its closing criterion. It is built
from spikes 037–040 (branch `spike/deno-edge-typecheck`, wrap-up `796e610a7`), whose counts were taken on a
four-function tree before Phase 174 finished and mostly do not hold on this tree. The measured baseline in
`<code_context>` replaces them.

Sources, in order of precedence: this file, then `180-DISCUSSION-POINTS.md` (returned untouched on 2026-11-12, so
every decision is its ★ RECOMMENDED option as written), then the roadmap's Phase 180 entry as amended by D-02, then
the spike reference.

</domain>

<decisions>
## Implementation Decisions

Each decision is the ★ RECOMMENDED option of `180-DISCUSSION-POINTS.md`; the document's decision id is in brackets.

### Factual baseline
- **D-01 [0.1]:** All 24 facts of the document's § 0 table are accepted as the phase's factual baseline, and are
  restated in `<code_context>` below. The spike's counts (23 modules, 5 errors, 10 copies, `entityGrant.ts`, the
  byte-for-byte test) are not used.

### A. Scope and the criteria's own text
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

### B. Toolchain
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

### C. Shared modules
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

### D. Editor setting
- **D-18 [D1]:** Document only: an "Editor setup" passage in `apps/supabase/README.md` and the docs page
  `edge-functions/+page.md`, giving `deno.enablePaths`, the optional `deno.path`, "never set `deno.enable`", and
  "Prettier formats this tree". No `.vscode/` file is committed; this respects the `693ae80b5` ruling and leaves no
  shared editor state.
- **D-19 [D2]:** The criterion-2 proof re-runs the spike's LSP probe once, after the move: `lsp-probe.mjs` S8
  (recommended setup) and S9 (`deno.enable`) on 2.9.6, with its `FILES` array updated to this tree's files. Expected:
  vanilla 0 of 7 flagged under S8. It runs in a scratch copy, about 15 s per scenario.

### E. Verification
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

### F. CI
- **D-22 [F1]:** Criterion 5's CI run is `ci-evidence/180-deno`, pushed once after the last code commit (a
  source-only commit built by the standing method), and read at JOB level. `frontend-and-shared-module-validation`
  must be `success`, and its "Type-check all packages" log must show `@openvaa/supabase:typecheck` running
  `deno check .` with the `Check …` lines for the 26 modules (or the post-move count). This also observes the Linux
  `@deno/linux-x64-glibc` install and a cold Deno cache with registry downloads. Every other job is recorded as
  found; a red `secret-scan`, `dependency-audit` or `e2e-tests` is cited by its cause and not counted against this
  criterion, while the E2E part of criterion 5 is met by the local full run (D-24). The push needs the operator's go
  (D-28).

### G. Plan shape and E2E cost
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

### Operator constraints (2026-11-12)
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Decisions and roadmap
- `.planning/phases/180-edge-functions-typecheck-shared-modules/180-DISCUSSION-POINTS.md` — every decision's
  options, the measured baseline (§ 0) and how it was measured.
- `.planning/ROADMAP.md` § Phase 180 — goal and the five success criteria, 1 and 3 as amended on 2026-11-12 (D-02).
- `CLAUDE.md` § Testing, E2E Hard Rule and the 2026-11-09 targeted-run ruling (D-29); § Comment Hygiene (D-17).

### Spike (not on this branch; read with `git show`)
- `git show 796e610a7:.claude/skills/spike-findings-voting-advice-application-gsd/references/deno-edge-typecheck.md`
  — the implementation blueprint from spikes 037–040, on branch `spike/deno-edge-typecheck`. Its counts describe a
  four-function tree; D-01 and `<code_context>` supersede them.
- `git ls-tree -r 796e610a7 .claude/skills/spike-findings-voting-advice-application-gsd/sources/` — the `037…040`
  sources: 3 patches, 2 `deno.json`, `verify.sh` (D-20), `lsp-probe.mjs` (D-19), `run.sh`, captured outputs,
  `vscode-settings.example.json`.
- `git show 796e610a7:.planning/spikes/MANIFEST.md` § `deno-edge-typecheck` — the spike's requirements and the
  037–040 rows (the section exists on the spike branch only).

### Todos this phase closes (D-25)
- `.planning/todos/pending/2026-10-07-174-nothing-type-checks-the-edge-functions.md`
- `.planning/todos/pending/2026-10-07-174-send-email-jwtsegment-has-no-importer.md`

### Code and gates
- `apps/supabase/supabase/functions/` — `account-access/`, `identity-callback/`, `send-email/`.
- `apps/supabase/package.json` — gets the devDependency and the `typecheck` script (D-07, D-10).
- `package.json:60-61`, `turbo.json:18-21` — `lint:check` chains `yarn typecheck`; the turbo `typecheck` task.
- `.github/workflows/main.yaml:4-24,162-169` — CI triggers and the type-check step; `packages/dev-seed/tests/ciTypecheckGate.test.ts:35-60` pins the order.
- `scripts/assert-edge-env-defaults.mjs` — the copy-drift guard (D-16); `scripts/assert-edge-function-env.mjs:14` (D-17).
- `apps/supabase/supabase/config.toml:412-436` — edge runtime and per-function settings.
- `apps/supabase/supabase/migrations.manifest.json` — the migration count D-26 checks against.
- `tests/scripts/e2e-run.sh:974` — serves `identity-callback` through `supabase functions serve`.
- `apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts:10` — the frontend placeholder-domain copy (D-15).
- `apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md` — docs page (D-17, D-18).
- `.claude/skills/database/SKILL.md:908-925,1113-1117` — prose on the copies and `jwtSegment` (D-14, D-17).
- `.gitignore:85` and commit `693ae80b5` — why no `.vscode/` file is committed (D-18).

### Neighbouring todos annotated at close (D-06)
- `.planning/todos/pending/2026-09-03-deno-edge-functions-do-not-consume-supabase-types.md`
- `.planning/todos/pending/2026-10-03-deno-edge-imports-invisible-to-audit-deps.md`
- `.planning/todos/pending/2026-08-29-edge-function-non-null-env-assertions.md`
- `.planning/todos/pending/2026-08-22-edge-function-fourth-idtoken-verifier-copy.md`

</canonical_refs>

<code_context>
## Existing Code Insights

Measured on 2026-11-12 at HEAD `7c4aa88e5` (the § 0 table of the discussion document). The type-check figures come
from a scratch copy of the three function directories with the spike's `040-toolchain-wiring/deno.json`, run with
the spike worktree's npm `deno 2.9.6` (TypeScript 6.0.3) and cross-checked with `~/.deno/bin/deno 2.7.8`; nothing
was written into the repository.

### Baseline facts
1. The spike blueprint is reachable: branch `spike/deno-edge-typecheck` is checked out in the worktree
   `voting-advice-application-deno-spike` at `796e610a7`; nothing of it is on this branch (`git worktree list`;
   `git ls-tree -r 796e610a7 …/sources/`).
2. Function set: `account-access`, `identity-callback`, `send-email`; no `_shared/` (`ls apps/supabase/supabase/functions/`).
3. **26 non-test modules, 25 tests**: `account-access` 9 / 7, `identity-callback` 12 / 13, `send-email` 5 / 5.
   `deno check .` reports `Check` for exactly those 26.
4. **Zero baseline type errors**: `deno check .` exits 0 on 2.9.6 and 2.7.8. The spike's five errors left with
   `invite-candidate` (174-07) and with `candidateRecord.ts` / `entityGrant.ts` (deleted by 179.1-09, `4ecfe7778`).
   A planted pair (a `string` assigned to a `number` in `send-email/index.ts`, `Deno.env.get(42)` in
   `identity-callback/index.ts`) gives `TS2322`, `TS2345`, `Found 2 errors.`, exit 1.
5. `findExistingCandidate` / `CandidateLookupFilter` do not exist (`git grep` finds only prose at
   `.claude/skills/database/SKILL.md:1319`).
6. `envConfig.ts`: 3 byte-identical copies (md5 `b8296bb7…`), 4 importers in 3 functions
   (`account-access/index.ts:53`, `identity-callback/index.ts:41`, `identity-callback/serverCredential.ts:13`,
   `send-email/index.ts:5`), one test `send-email/envConfig.test.ts`. `callerAuthority.ts`: 1 copy, 1 consumer
   (`send-email/index.ts:3`). `entityGrant.ts`: does not exist.
7. `placeholderAddress.ts`: 2 copies, not byte-identical. `identity-callback/placeholderAddress.ts` exports
   `PLACEHOLDER_EMAIL_DOMAIN`, `placeholderAddressFor`, `isPlaceholderAddress` (`:12,22,32`);
   `account-access/placeholderAddress.ts` exports `PLACEHOLDER_EMAIL_DOMAIN`, `isPlaceholderAddress` (`:12,20`), same
   code, different docblock. Consumers: `identity-callback/index.ts:44`, `account-access/index.ts:55`,
   `account-access/addressConfirmation.ts:21`. Parity test: `identity-callback/placeholderAddress.test.ts:13-15`,
   with `apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts:10`. No other basename repeats across
   functions except `index.ts` and `flowConformance.test.ts`.
8. The copy-drift check exists: `scripts/assert-edge-env-defaults.mjs` Check 2, `DUPLICATED_MODULES = ['envConfig.ts']`
   (`:112`), loop `:265-290`, docblock `:22-26`, summary `checks live: 3 of 3 (…)` at `:322`, Check 1 message naming
   "`envConfig.ts` beside this file" at `:260`; the "NO OPT-OUT" paragraph names an undeclared `NOT_DUPLICATED` (`:46`).
9. The byte-for-byte conformance test is already gone (deleted in 174-07, `287a2b97d`).
10. Source-reading tests that pin module paths: `send-email/flowConformance.test.ts:105` (pins the
    `./callerAuthority.ts` import); `identity-callback/flowConformance.test.ts:98-108` (own directory,
    `EXPORTS_HELD_FOR_PARITY`); `account-access/flowConformance.test.ts:30-32,247-251` (own directory, more than 5
    modules); `identity-callback/placeholderAddress.test.ts:13-15` (both copies by URL).
11. `send-email/jwtSegment.ts:20` (`decodeJwtSegment`) is imported only by `send-email/jwtSegment.test.ts:14`. Prose:
    `.claude/skills/database/SKILL.md:920` (§ 8) and `:1117` (which also names `entityGrant.ts`, stale).
12. `identity-callback/index.ts:152-154,176-177,185-186`: three `supabaseAdmin: any` under
    `// deno-lint-ignore no-explicit-any`, with a `// reason:` that this phase makes false; typed as `SupabaseClient`
    (type import from `npm:@supabase/supabase-js@2.117.2`) they check clean. `send-email/callerAuthority.ts:51`
    `callerMayOnEntity` has no non-test consumer.
13. `deno lint`: 4 findings, all `require-await` (`send-email/callerAuthority.ts:32,51`,
    `account-access/linkIssue.ts:210,231`); `Checked 26 files`. `deno fmt --check` flags 26 of 27 files (it disagrees
    with Prettier).
14. No tracked `deno.json`, `deno.jsonc` or `deno.lock`; no `deno.enable` outside `.planning/`. An untracked, ignored
    `.vscode/settings.json` sets `"deno.enablePaths": ["apps/supabase/supabase/functions"]`.
15. `.gitignore:85` ignores `.vscode/*`; `693ae80b5` untracked `.vscode/settings.json` on purpose.
16. `deno` is not on `PATH`; `~/.deno/bin/deno` is 2.7.8; this worktree has no `node_modules/.bin/deno`.
17. npm `deno`: `latest` 2.9.6 (published 2026-08-27, past `.yarnrc.yml:3` `npmMinimalAgeGate: 7d`), `lts` 2.2.15.
    The local `supabase` CLI 2.118.0 embeds `supabase/edge-runtime:v1.76.2` (Deno 2.1.4 / TS 5.6.2 per the spike,
    not re-measured). `config.toml:424` `deno_version = 2`.
18. `package.json:61` `"typecheck": "turbo run typecheck"`; `turbo.json:18-21`; 13 workspaces declare `typecheck`,
    `@openvaa/supabase` does not (`apps/supabase/package.json:6-17`); `lint:check` chains it (`package.json:60`).
19. CI: `.github/workflows/main.yaml:162-163` "Type-check all packages", before `lint:check` (`:165-166`) and
    `test:unit` (`:168-169`), in job `frontend-and-shared-module-validation`; pinned by
    `packages/dev-seed/tests/ciTypecheckGate.test.ts:35-60`.
20. CI triggers on `main` and `ci-evidence/**` with `paths-ignore: **.md` (`main.yaml:4-24`). Last run `40846531438`
    (179.1-e4): run-level `failure` (`secret-scan`, `e2e-tests`, `dependency-audit`), the other ten jobs, including
    `frontend-and-shared-module-validation`, `success`.
21. Every E2E run serves `identity-callback` through the CLI: `tests/scripts/e2e-run.sh:974`
    `supabase functions serve identity-callback --no-verify-jwt --env-file …`; the other two are served by the
    stack's edge runtime.
22. `supabase functions deploy` (2.118.0) bundles in Docker by default; `--use-api` and `--import-map` exist.
    `config.toml:431-436` configures only `identity-callback`'s `verify_jwt`.
23. Last full E2E run: `179.2-final-4`, 729 of 729 (`.planning/STATE.md:8,36`).
24. Prose describing the duplication: all three `envConfig.ts:6`; `send-email/callerAuthority.ts:10`;
    `apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md:11`;
    `.claude/skills/database/SKILL.md:908-914,1113-1117`; `scripts/assert-edge-function-env.mjs:14`;
    `identityProviderAccount.ts:10` and both `placeholderAddress.ts:8`.

### Reusable Assets
- The spike's `040-toolchain-wiring/deno.json` (D-08), `verify.sh` (D-20) and `lsp-probe.mjs` (D-19).
- The turbo `typecheck` task, which picks up a new workspace script with no pipeline change.
- `assert-edge-env-defaults.mjs` Checks 1 and 3, which already walk the functions tree recursively.

### Established Patterns
- Edge Function imports are plain relative paths with `.ts` extensions and exact `npm:` specifiers; `_shared/` uses
  the same, with no alias and no workspace package.
- CI evidence through a source-only `ci-evidence/**` commit parented on `origin/main`.
- Gate exit codes are read directly, never through a pipe.

### Integration Points
- The source-reading conformance and parity tests (fact 10) must be repointed in the same commits as the move.
- The edge runtime serves the functions from this worktree's mount; D-26 checks that mount at each plan's first
  stack use.

</code_context>

<specifics>
## Specific Ideas

- The operator returned the discussion document untouched on 2026-11-12: every ★ option as written, no ticks, no
  EDIT or NOTE.
- The operator's four constraints of 2026-11-12 are D-26 to D-29.

</specifics>

<deferred>
## Deferred Ideas

- `deno lint` as a gate (D-11) and `deno fmt` wiring (D-12): not adopted.
- Parameterising `createClient<Database>` with `packages/supabase-types` (the A5 supabase-types todo): out of scope,
  annotated at close.
- A live run of a served function on a misconfigured deployment (Phase 174's behaviour-unverified truth), and any
  hosted deploy (D-27).

### Reviewed Todos (not folded)
- `2026-09-03-deno-edge-functions-do-not-consume-supabase-types.md`: out of scope (D-06); it now has a checker that
  would see a `Database` generic.
- `2026-10-03-deno-edge-imports-invisible-to-audit-deps.md`: out of scope (D-06).
- `2026-08-29-edge-function-non-null-env-assertions.md`: out of scope (D-06).
- `2026-08-22-edge-function-fourth-idtoken-verifier-copy.md`: out of scope (D-06).

</deferred>

---

*Phase: 180-edge-functions-typecheck-shared-modules*
*Context gathered: 2026-11-12*
