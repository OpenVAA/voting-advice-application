# Phase 180 — Consolidated Discussion Points

**Phase:** 180 — Edge Functions — Typecheck & Shared Modules
**Requirement:** none of v2.16's (an operator-directed refactor); E2E-03 is the closing criterion · **Depends on:** Phase 179 (no feature phase edits a function while its modules move) and Phase 174 (the function set `account-access`, `identity-callback`, `send-email`)
**Purpose:** Settle every open decision in one pass, so that `/gsd-plan-phase 180` and `/gsd-execute-phase 180` run without going back and forth area by area.

**How to read / fill:**

- Every decision lists its options as checkboxes. **Exactly one option per decision is marked `★ RECOMMENDED`.** Every other option states its cost or risk.
- **Leaving every box unchecked = the ★ option. Tick a different box to overrule; free text (**EDIT:**/**NOTE:**) beats every box.**
- **⚠ DECIDE** marks decisions that change the *shape* of the work rather than a detail. Read these first. There are **8**: A1, B1, B5, C1, C2, D1, F1, G1.

**Grounding (re-measured this session at HEAD `7c4aa88e5`, branch `feat/entity-signup-multi-grant`, 2026-11-12; line numbers are measured on this tree, not copied from the roadmap or the spike):**
`.planning/ROADMAP.md:3095-3120` (the phase entry) · the spike reference `git show 796e610a7:.claude/skills/spike-findings-voting-advice-application-gsd/references/deno-edge-typecheck.md` and its `sources/037…040` · `apps/supabase/supabase/functions/**` · `apps/supabase/package.json` · `turbo.json` · `package.json:52,60-61` · `.github/workflows/main.yaml` · `scripts/assert-edge-env-defaults.mjs` · `.gitignore:85` · `apps/supabase/supabase/config.toml:412-436` · the two todos `.planning/todos/pending/2026-10-07-174-*.md`.

**How the type-check baseline was measured:** I copied the three function directories (only the `.ts` files' directories, with no environment file) into the session scratchpad, put the spike's `040-toolchain-wiring/deno.json` beside them, and ran `deno check .` and `deno lint` there. Nothing was written into the repository. The binary is the spike worktree's npm-installed `deno 2.9.6` (TypeScript 6.0.3), the version the spike pins, at `voting-advice-application-deno-spike/node_modules/@deno/darwin-arm64/deno`. As a cross-check I also ran the user-global `~/.deno/bin/deno 2.7.8` (TypeScript 5.9.2). Neither is on `PATH`.

---

## 0. What is actually on the tree right now

Re-verified this session. **Facts 3, 4, 5, 6, 8 and 9 contradict or empty parts of the roadmap entry.**

| # | Claim (roadmap or spike) | On the tree now | Evidence |
|---|---|---|---|
| 1 | The spike blueprint is reachable on `spike/deno-edge-typecheck`, wrap-up `796e610a7` | **Reachable.** The branch is checked out in the worktree `voting-advice-application-deno-spike` at `796e610a7`. The reference and every `sources/037…040` file can be read with `git show` (3 patches, 2 `deno.json`, `verify.sh`, `lsp-probe.mjs`, `run.sh`, captured outputs, `vscode-settings.example.json`). Nothing of it is on this branch | `git worktree list`; `git ls-tree -r 796e610a7 .claude/skills/spike-findings-voting-advice-application-gsd/sources/` |
| 2 | Function set: three functions (`invite-candidate` gone in 174-07) | **Confirmed.** `account-access`, `identity-callback`, `send-email`; no `_shared/` | `ls apps/supabase/supabase/functions/` |
| 3 | Module counts: spike saw 23 non-test modules (4 functions) | **26 non-test modules, 25 tests**: `account-access` 9 modules / 7 tests, `identity-callback` 12 / 13, `send-email` 5 / 5. `deno check .` reports `Check` for exactly those 26 | the file listing; scratch `deno check` output |
| 4 | "Five baseline type errors", three in `identity-callback/index.ts` and two in `invite-candidate/index.ts`, "fixed, not suppressed" (criterion 1) | **ZERO baseline type errors.** `deno check .` exits 0 on 2.9.6 and on 2.7.8. The two `invite-candidate` errors left with that function (174-07). The three `identity-callback` errors left with `candidateRecord.ts` and `entityGrant.ts`, which 179.1-09 deleted. A planted pair (a `string` assigned to a `number` in `send-email/index.ts`, `Deno.env.get(42)` in `identity-callback/index.ts`) turns it red: `TS2322`, `TS2345`, `Found 2 errors.`, exit 1 | scratch run; `git show --stat 4ecfe7778` |
| 5 | `findExistingCandidate` / recursive `CandidateLookupFilter` needs reshaping | **Neither exists.** `candidateRecord.ts`, which held both, was deleted by 179.1-09 (`4ecfe7778`). `git grep` finds no `findExistingCandidate`, `CandidateLookupFilter` or `CandidateLookupClient` outside `.planning/` | `git grep -n -E "findExistingCandidate\|CandidateLookupFilter"` → only `.claude/skills/database/SKILL.md:1319` (prose: "gone") |
| 6 | Shared modules named by criterion 3: `envConfig.ts`, `callerAuthority.ts`, `entityGrant.ts` | **`envConfig.ts`: 3 byte-identical copies** (md5 `b8296bb7…` in all three), 4 importers in 3 functions (`account-access/index.ts:53`, `identity-callback/index.ts:41`, `identity-callback/serverCredential.ts:13`, `send-email/index.ts:5`), and one test, `send-email/envConfig.test.ts`. **`callerAuthority.ts`: 1 copy, 1 consumer** (`send-email/index.ts:3`). **`entityGrant.ts`: does not exist** (deleted by 179.1-09) | md5 listing; import grep |
| 7 | "whichever of the others still has more than one copy or more than one consumer" | **`placeholderAddress.ts`: 2 copies that are NOT byte-identical.** `identity-callback/placeholderAddress.ts` exports `PLACEHOLDER_EMAIL_DOMAIN`, `placeholderAddressFor` and `isPlaceholderAddress` (`:12,22,32`). `account-access/placeholderAddress.ts` exports `PLACEHOLDER_EMAIL_DOMAIN` and `isPlaceholderAddress` (`:12,20`) with the same code, and differs only in its docblock. Consumers: `identity-callback/index.ts:44`, `account-access/index.ts:55`, `account-access/addressConfirmation.ts:21`. A source-text parity test holds the two equal to a third, frontend copy: `identity-callback/placeholderAddress.test.ts:13-15`, with `apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts:10`. No other basename repeats across functions except `index.ts` and `flowConformance.test.ts`. Every other module has consumers only inside its own function | `diff` of the two copies; md5 listing |
| 8 | "The copy-drift check … removed" | **Exists:** `scripts/assert-edge-env-defaults.mjs` Check 2, with `DUPLICATED_MODULES = ['envConfig.ts']` (`:112`), the loop at `:265-290`, the docblock at `:22-26`, the summary line `checks live: 3 of 3 (env-default; copy-drift; vitest-reachability)` at `:322`, and the Check 1 message that names "`envConfig.ts` beside this file" at `:260`. The docblock's "NO OPT-OUT" paragraph names a constant `NOT_DUPLICATED` that the file never declares (`:46`) | file read |
| 9 | "… and the byte-for-byte conformance test, whose subject no longer exists, are removed" | **Already gone.** `it('shares ONE gate module with invite-candidate, byte for byte', …)` was deleted in 174-07 (`287a2b97d`). `send-email/flowConformance.test.ts` holds no such test. There is nothing left to remove | `git log -S "shares ONE gate module"` |
| 10 | Source-reading tests that pin a module path | `send-email/flowConformance.test.ts:105` pins `"import { callerMayOnProject } from './callerAuthority.ts';"`. `identity-callback/flowConformance.test.ts:98-108` reads every module in its own directory and holds `EXPORTS_HELD_FOR_PARITY = { 'placeholderAddress.ts': ['isPlaceholderAddress'] }`. `account-access/flowConformance.test.ts:30-32,247-251` reads its own directory and asserts more than 5 modules. `identity-callback/placeholderAddress.test.ts:13-15` reads both copies by URL | file reads |
| 11 | `jwtSegment.ts` is imported only by its own test | **Confirmed.** `send-email/jwtSegment.ts:20` (`decodeJwtSegment`, 27 lines); its only importer is `send-email/jwtSegment.test.ts:14` (111 lines, importing `'./jwtSegment'` with no extension). Prose references: `.claude/skills/database/SKILL.md:920` (§ 8) and `:1117`. The latter also still names `entityGrant.ts` as a single copy, which is stale | `git grep -n jwtSegment` |
| 12 | `any` typing in the functions | `identity-callback/index.ts:152-154,176-177,185-186`: three `supabaseAdmin: any` parameters under `// deno-lint-ignore no-explicit-any`. Their `// reason:` says "nothing type-checks this file (no `deno check` runs …)", which this phase makes false. In scratch, replacing them with `SupabaseClient` (imported as a type from the same `npm:@supabase/supabase-js@2.117.2`) type-checks clean, exit 0. `send-email/callerAuthority.ts:51` `callerMayOnEntity` is exported with no non-test consumer | file read; scratch experiment |
| 13 | `deno lint`: spike counted 5 findings (4 `require-await` and 1 `no-unused-vars` `siteUrl`) | **4 findings, all `require-await`**: `send-email/callerAuthority.ts:32,51` and `account-access/linkIssue.ts:210,231`. The `siteUrl` finding is gone. `Checked 26 files`. `deno fmt --check` reports 26 of 27 files unformatted: Deno's formatter disagrees with Prettier, as the spike found | scratch `deno lint`, `deno fmt --check` |
| 14 | No Deno config anywhere; `deno.enable` set nowhere | **Confirmed for tracked files:** no tracked `deno.json`, `deno.jsonc` or `deno.lock`, and no `deno.enable` outside `.planning/`. An untracked, ignored `.vscode/settings.json` sets `"deno.enablePaths": ["apps/supabase/supabase/functions"]` | `git ls-files \| grep deno`; `git check-ignore -v .vscode/settings.json` |
| 15 | Spike: "`.vscode/` is in the owner's global gitignore" | **And in the repository's own:** `.gitignore:85` `.vscode/*`. `693ae80b5` deliberately stopped tracking `.vscode/settings.json` and suggested a checked-in `.vscode/settings.example.json` if the hint was wanted back. Committing the live file needs a `.gitignore` negation as well as `git add -f` | `.gitignore:85`; `git show 693ae80b5` |
| 16 | `deno` on the host | **Not on `PATH`.** `~/.deno/bin/deno` is 2.7.8 (a global install, the route the spike warns against). The spike worktree has the npm 2.9.6. This worktree has no `node_modules/.bin/deno` | `which deno`; `--version` |
| 17 | Pin 2.9.6 against the runtime's embedded 2.1.4 | npm `deno` dist-tags today: `latest` **2.9.6** (published 2026-08-27, 77 days old, clears `.yarnrc.yml:3` `npmMinimalAgeGate: 7d`), `lts` 2.2.15. 2.1.4 is also on npm. The local CLI is `supabase` 2.118.0; its binary embeds `supabase/edge-runtime:v1.76.2`, the image the spike read as Deno 2.1.4 / TS 5.6.2 (that mapping is the spike's and was not re-measured: confirming it means running the image). `config.toml:424` `deno_version = 2` | `LC_ALL=C grep -a -oE "edge-runtime:v[0-9.]+"` on `node_modules/@supabase/cli-darwin-arm64/bin/supabase`; npm registry metadata |
| 18 | `yarn typecheck` picks up a workspace script with no turbo change | **Confirmed.** `package.json:61` `"typecheck": "turbo run typecheck"`; `turbo.json:18-21` (`dependsOn ^build`, inputs `$TURBO_DEFAULT$`). 13 workspaces declare `typecheck`; `@openvaa/supabase` does not (`apps/supabase/package.json:6-17`). `lint:check` chains `yarn typecheck` (`package.json:60`) | file reads |
| 19 | CI type-check step | `.github/workflows/main.yaml:162-163` "Type-check all packages (turbo run typecheck)" → `yarn typecheck`, ahead of `lint:check` (`:165-166`) and `test:unit` (`:168-169`), all in job `frontend-and-shared-module-validation`. `packages/dev-seed/tests/ciTypecheckGate.test.ts:35-60` pins that ordering and the root script | file reads |
| 20 | CI channel | `main.yaml:4-24`: `push` to `main` **or `ci-evidence/**`**, with `paths-ignore` `**.md`. Standing local branches `ci-evidence/163-gates`, `169-deps`, `179.1-e4` and others. The latest run, `40846531438` (179.1-e4, 2026-10-29), concluded `failure` at run level: `secret-scan`, `e2e-tests` and `dependency-audit` failed, and the other ten jobs, `frontend-and-shared-module-validation` among them, succeeded. A whole-run green has happened once (phase 169, run `37115289953`, 12/12) | `gh run view 40846531438 --json jobs`; `.planning/STATE.md:1422` |
| 21 | Spike: the function was "not served through the CLI's own serve path" | **Every E2E run serves `identity-callback` through it:** `tests/scripts/e2e-run.sh:974` `supabase functions serve identity-callback --no-verify-jwt --env-file …`. The other two are served by the stack's own edge runtime | file read |
| 22 | Deploy bundling | `supabase functions deploy` (CLI 2.118.0) bundles in Docker by default; `--use-api` bundles server-side and `--import-map` exists. `config.toml:431-436` configures only `identity-callback`'s `verify_jwt` | `npx --no-install supabase functions deploy --help` |
| 23 | Last full E2E run, the reference for deltas | `179.2-final-4`, **729 of 729** | `.planning/STATE.md:8,36` |
| 24 | Prose that describes the duplication | All three `envConfig.ts` copies `:6` ("DUPLICATED ON PURPOSE …"); `send-email/callerAuthority.ts:10` ("ONE COPY … a second function … holds a byte-identical copy, and `DUPLICATED_MODULES` … names the module"); `apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md:11`; `.claude/skills/database/SKILL.md:908-914,1113-1117`; `scripts/assert-edge-function-env.mjs:14` (names `functions/identity-callback/envConfig.ts`); `identityProviderAccount.ts:10` and both `placeholderAddress.ts:8` ("ONE DOMAIN, THREE COPIES … because no runtime can import another's module") | file reads |

### 0.1 — Is this table the phase's factual baseline?

- [ ] **(a) Accept all 24 facts; CONTEXT.md restates them** — ★ RECOMMENDED — otherwise a planner re-derives the spike's counts (23 modules, 5 errors, 10 copies, `entityGrant.ts`, the byte-for-byte test), and none of them holds on this tree.
- [ ] **(b) Accept, but a fact is wrong or incomplete.** Annotate it below and I re-verify it before planning. Costs one more round before planning.

---

## A. Scope and the criteria's own text

### A1 — ⚠ DECIDE — Do criteria 1 and 3 get amended in `ROADMAP.md` to match the tree?

Criterion 1 (`ROADMAP.md:3101`) requires "the tree's own baseline type errors are fixed, not suppressed", and there are none (fact 4). Criterion 3 (`:3103`) names `entityGrant.ts`, which does not exist, and `callerAuthority.ts`, which has one copy and one consumer (fact 6). It also requires removing a byte-for-byte test that 174-07 already deleted (fact 9). A verifier who reads the criteria literally either fails them as unmeetable or passes them vacuously.

- [ ] **(a) Amend both before planning** — ★ RECOMMENDED. Criterion 1 becomes "… turns it red, naming the error; the tree has no baseline type errors (measured 0 on 2.9.6), and the `any` parameters whose stated reason was the missing check are typed (A3)". Criterion 3 lists the modules C1 settles, with the measured copy and consumer counts, and drops the byte-for-byte clause, citing `287a2b97d`. Costs one `ROADMAP.md` edit, committed before the planners start (parallel-planner race).
- [ ] **(b) Leave the text; CONTEXT.md records the reading.** No roadmap churn. Risk: the verifier reads the roadmap, not CONTEXT, and three clauses read as unmet or vacuous at close.
- [ ] **(c) Keep the literal criterion 3: move `callerAuthority.ts` too, whatever C1 says.** Satisfies the words. Cost: `_shared/` then holds a module that one function uses (see C1).

### A2 — How does the spike's skill reference come over (the roadmap's "first step")?

The reference describes a four-function tree, five errors and ten copies, and its *Status in the codebase* section reports the spike branch. On this tree most of its counts are wrong (facts 3-9).

- [ ] **(a) Bring the reference and `sources/` over verbatim and add an "On `feat/entity-signup-multi-grant`" section** — ★ RECOMMENDED. That section restates facts 3-13 and marks which steps are void (the `type-fixes.patch`, the `entityGrant` and `jwtSegment` rows, the byte-for-byte removal) and which patches are history only. The `SKILL.md` index gains the domain line. The spike record stays intact, and the reader sees today's state beside it. The three patches stay as artefacts, not instructions.
- [ ] **(b) Rewrite the reference to describe only this tree.** Cleaner for the next reader. Cost: it loses the measured spike record (2.1.4 vs 2.9.x failure modes, LSP scenarios) unless that is copied carefully, and it becomes a second document to keep correct.
- [ ] **(c) Don't bring it over; cite it by commit.** Zero effort. Risk: `796e610a7` lives on a spike branch that may be pruned, and the skill index never learns the domain.

### A3 — What happens to the three `supabaseAdmin: any` parameters in `identity-callback/index.ts`?

Fact 12: three `any` parameters under `deno-lint-ignore`, each with a `// reason:` that this phase makes false. With `SupabaseClient` they type-check clean in scratch. They are the only real suppression left in the tree, so "fixed, not suppressed" reads on them.

- [ ] **(a) Type them as `SupabaseClient`, drop the three `deno-lint-ignore` lines and the stale `// reason:`** — ★ RECOMMENDED. This is the spike's `rollbackInvite` fix applied to the sites that still need it. It is measured green and has no runtime effect (types are erased).
- [ ] **(b) Keep `any` and reword the reason.** No source change. Risk: it leaves the one suppression a type-check phase should remove, and C-hygiene review flags the reason's new wording as historical.
- [ ] **(c) Type them with a narrow structural interface (`{ auth: { admin: { listUsers … } } }`).** Documents exactly what is used. Cost: a hand-kept interface that can drift from the library, the shape that produced the spike's TS2589.

### A4 — The `findExistingCandidate` / `CandidateLookupFilter` reshape

Fact 5: both are gone with `candidateRecord.ts` (179.1-09). The roadmap item was written from the spike's base.

- [ ] **(a) Close the item as moot, citing `4ecfe7778`; no work** — ★ RECOMMENDED.
- [ ] **(b) Search the remaining builders for a structurally recursive filter type, as a precaution.** Cost: a search for a defect class that `deno check` already reports as clean (fact 4).

### A5 — Neighbouring Edge Function todos: in or out?

Four pending todos touch the same tree: `2026-09-03-deno-edge-functions-do-not-consume-supabase-types.md`, `2026-10-03-deno-edge-imports-invisible-to-audit-deps.md`, `2026-08-29-edge-function-non-null-env-assertions.md` and `2026-08-22-edge-function-fourth-idtoken-verifier-copy.md`.

- [ ] **(a) Out of scope; at close, annotate each with what this phase changed for it** — ★ RECOMMENDED. For example, the supabase-types todo now has a checker that would see a `Database` generic. Keeps the phase a refactor.
- [ ] **(b) Take the supabase-types one in (parameterise `createClient<Database>`).** Its natural moment is right after a checker exists. Cost: an `npm:`/workspace bridge for `packages/supabase-types` into Deno, which the spike did not explore; it changes the phase's shape.

---

## B. Toolchain

### B1 — ⚠ DECIDE — The exact Deno pin

Fact 17. The checker and the runtime need not match: the spike saw identical `deno check` results on 2.1.4 and 2.9.7 over its tree, and different failure modes in the no-config and no-exclude cases. On this tree 2.9.6 and 2.7.8 agree (0 errors). 2.1.4 was not run here.

- [ ] **(a) `2.9.6`, exact, as a devDependency of `@openvaa/supabase`** — ★ RECOMMENDED. It is still npm `latest` today, 77 days old, past the age gate, and it is the version the spike measured with the npm shim, turbo, the LSP probe and `enableScripts: false`. Record in the skill reference that the runtime is `edge-runtime:v1.76.2` / Deno 2.1.4, and that equal results are an observation about this code.
- [ ] **(b) `2.1.4`, the runtime's embedded version.** The checker then matches the runtime. Cost: unmeasured through the npm shim (whether the 2.1.x npm package ships the per-platform binaries the shim needs is not checked). Its language server ignores the `exclude` for open files and flags the vitest tests. It is two minor versions older than the TypeScript the repo uses (5.6.2 vs 6.0.3).
- [ ] **(c) `2.2.15` (npm `lts`).** A middle ground. Cost: measured nowhere, by the spike or here.

### B2 — Where the config lives

Criterion 2 fixes `functions/deno.json`. The spike measured `apps/supabase/supabase/deno.json` as equivalent.

- [ ] **(a) `apps/supabase/supabase/functions/deno.json`, the spike's exact four keys (`lock: false`, `exclude: ["**/*.test.ts"]`, lint `no-import-prefix` off, no `imports`)** — ★ RECOMMENDED. This is what the criterion says. Criterion 4 measures whether the bundles are unaffected (E1).
- [ ] **(b) `apps/supabase/supabase/deno.json`, outside the directory the bundler reads.** Removes the bundle question by construction. Cost: it contradicts criterion 2's text, and is less discoverable.

### B3 — `"lock": false`, or a committed `functions/deno.lock`?

Every direct specifier is pinned exactly (2 `npm:` imports per `index.ts`), but transitive dependencies float, so a type a transitive package changes could turn the check red on an unchanged tree, in CI first.

- [ ] **(a) `"lock": false`, as the spike settled** — ★ RECOMMENDED. No new file and no lock churn. The deployed runtime does not read a lock either, so the checker sees what the runtime resolves.
- [ ] **(b) Commit a `deno.lock`.** A reproducible check. Cost: a lock that only the checker reads, which can drift from what deployment resolves. `yarn audit:deps` cannot read it (see the audit todo). A Renovate-style updater would need teaching.

### B4 — The script's form

- [ ] **(a) `"typecheck": "cd supabase/functions && deno check ."`** — ★ RECOMMENDED. The spike's form. Deno discovers its config from the CWD, so the `cd` is what makes it work, and it checks every non-test module, including ones no entry point imports (criterion 1's "every non-test module").
- [ ] **(b) `deno check --config supabase/functions/deno.json supabase/functions`.** No `cd`. Cost: config discovery is then explicit while relative excludes still resolve against the config; the spike did not measure this form.
- [ ] **(c) `deno check` over the three `index.ts` only.** Faster. Cost: a pure module that no entry point imports goes unchecked, against criterion 1.

### B5 — ⚠ DECIDE — Does `deno lint` become a gate?

Fact 13: 4 findings, all `require-await`, on functions that return a promise without awaiting. That is deliberate in an interface-shaped API: `callerMayOnProject` and `callerMayOnEntity` return the RPC's thenable, and `issueSignInLink` and `issueRecoveryLink` do the same. Repo ESLint does not reach this tree (`assert-edge-env-defaults.mjs:30-35`).

- [ ] **(a) Not a gate; record the 4 findings and the decision in the skill reference** — ★ RECOMMENDED. The phase's goal is the typecheck. A lint gate adds a second rule set, Deno's, which the repo's ESLint conventions never ratified, and fixing `require-await` means touching four signatures (or adding four ignores) for no defect.
- [ ] **(b) Gate it: wire `deno lint` into a `lint` script of `@openvaa/supabase` (turbo `lint` picks it up), with `require-await` fixed (drop `async`, return the promise) or excluded in `deno.json`.** Catches unused variables and the like going forward. Cost: four signature edits or a rule exclusion, and one more Deno rule set the editor surfaces, beside ESLint's.
- [ ] **(c) Gate it with `require-await` excluded in `deno.json`.** A gate with zero findings today. Cost: it is still a new gate surface, and the exclusion list starts to grow.

### B6 — `deno fmt`

Fact 13: `deno fmt --check` reports 26 of 27 files, because it disagrees with Prettier.

- [ ] **(a) Never wire it; set `"fmt": { "exclude": ["."] }` or document "Prettier formats this tree" next to `enablePaths`** — ★ RECOMMENDED. Documenting is enough if D1 chooses documentation. The `fmt` exclude is measured nowhere, so the plan checks the editor still formats with Prettier.
- [ ] **(b) Say nothing.** Cost: a contributor whose editor formats with Deno inside the enabled path rewrites whole files.

---

## C. Shared modules

### C1 — ⚠ DECIDE — Which modules move to `functions/_shared/`?

Measured per module (facts 6, 7, 11):

| Module | Copies | Consuming functions | Importers (non-test) | Test |
|---|---|---|---|---|
| `envConfig.ts` | 3, byte-identical | 3 | 4 | `send-email/envConfig.test.ts` |
| `placeholderAddress.ts` | 2, differ (`account-access`'s is a code subset) | 2 | 3 | `identity-callback/placeholderAddress.test.ts` (parity across 3 runtimes) |
| `callerAuthority.ts` | 1 | 1 (`send-email`) | 1 | `send-email/callerAuthority.test.ts` |
| `jwtSegment.ts` | 1 | 0 | 0 | `send-email/jwtSegment.test.ts` |
| every other module | 1 | 1 (own function) | — | — |

- [ ] **(a) `envConfig.ts` and `placeholderAddress.ts` move (with their tests); `callerAuthority.ts` stays in `send-email/`** — ★ RECOMMENDED. This applies criterion 3's own rule (more than one copy or consumer) as measured. `_shared/` keeps a single meaning: used by more than one function. `callerAuthority.ts:10`'s docblock is rewritten to point a future second consumer at `_shared/`.
- [ ] **(b) Those two plus `callerAuthority.ts`.** Matches criterion 3's literal list (A1 c). Cost: `_shared/` holds a module that one function uses, so membership no longer tells a reader anything; `send-email/flowConformance.test.ts:105` must be repointed.
- [ ] **(c) `envConfig.ts` only.** The smallest move. Cost: `placeholderAddress.ts` stays duplicated and hand-held by a parity test, which is exactly what `_shared/` exists to remove, and criterion 3's rule is unmet.

### C2 — ⚠ DECIDE — `jwtSegment.ts`: does it survive?

Fact 11: no importer; its second copy went with `invite-candidate`. The todo `2026-10-07-174-send-email-jwtsegment-has-no-importer.md` proposes deletion unless a function is about to decode a token itself. None is: `send-email` verifies through `auth.getUser()` and `user_can`, `identity-callback` uses `jose`.

- [ ] **(a) Delete `jwtSegment.ts` and `jwtSegment.test.ts`; rewrite `.claude/skills/database/SKILL.md` § 8 (`:919-925`) and fix `:1117` (which also names the deleted `entityGrant.ts`)** — ★ RECOMMENDED. Dead code ships in the deployment unit, and its test keeps a decoder green that nothing relies on. The base64url lesson in § 8 can stay as one sentence of guidance without a file reference.
- [ ] **(b) Keep it and move it to `_shared/` as a library helper.** Ready for a future decoder. Cost: a module with zero consumers in `_shared/` breaks C1's meaning, and it stays dead.
- [ ] **(c) Keep it where it is.** Zero effort. Cost: the todo stays open, against the roadmap's list of todos this phase closes.

### C3 — How `placeholderAddress.ts` merges (if C1 a or b)

The two copies agree in code; `identity-callback`'s adds `placeholderAddressFor`. The parity test reads both plus the frontend copy. `identity-callback/flowConformance.test.ts:106-108` exempts `isPlaceholderAddress` as "held for parity".

- [ ] **(a) Keep `identity-callback`'s copy as `_shared/placeholderAddress.ts`, with a rewritten docblock ("ONE DOMAIN, TWO COPIES": this module and the frontend's)** — ★ RECOMMENDED. Delete `account-access`'s copy. Repoint the three imports. The parity test holds two sources. Drop the `EXPORTS_HELD_FOR_PARITY` entry, since `_shared/` is outside that test's directory scan and `account-access` now uses `isPlaceholderAddress` from the shared module. Update `identityProviderAccount.ts:10`. `account-access` gains the unused 3-line `placeholderAddressFor` in its bundle.
- [ ] **(b) Split it: `_shared/placeholderAddress.ts` holds the domain and `isPlaceholderAddress`; `placeholderAddressFor` stays in `identity-callback/`.** Each bundle holds only what it uses. Cost: two modules for one domain concept, and the derivation sits apart from the domain it depends on.

### C4 — The copy-drift guard after the move

`assert-edge-env-defaults.mjs` Check 2 (fact 8) has no subject once `envConfig.ts` has one copy: with the list unchanged it turns red ("expected at least two copies … found 1").

- [ ] **(a) Remove Check 2 and `DUPLICATED_MODULES`, and renumber the docblock and summary to "2 of 2 (env-default; vitest-reachability)"** — ★ RECOMMENDED. In the same edit, fix the `NOT_DUPLICATED` sentence (`:46`, the jwtSegment todo's second item) and make Check 1's message name `_shared/envConfig.ts` (`:260`). Checks 1 and 3 walk the tree recursively (`:134`), so `_shared/` is covered. Planted control: put a `Deno.env.get('X') ?? 'y'` in `_shared/envConfig.ts` → red; revert → green.
- [ ] **(b) Replace Check 2 with an inverse check: no basename outside `index.ts` and `*.test.ts` appears in more than one function directory.** Keeps the class closed: a future copy is caught. Cost: a new check with its own red-then-green control. A legitimate same-named but different module (for example two `contract.ts`) would then need an exemption roster, which the guard forbids by construction.

### C5 — Doc and prose surfaces the move touches (fact 24)

- [ ] **(a) Update all of them in the move's commit** — ★ RECOMMENDED. The three `envConfig.ts:6` docblocks become one, describing `_shared/`. Also: `callerAuthority.ts:10`, both `placeholderAddress.ts:8` (C3), `identityProviderAccount.ts:10`, the docs page `edge-functions/+page.md:11,146`, `.claude/skills/database/SKILL.md:908-914,1113-1117`, and `assert-edge-function-env.mjs:14`. Every rewritten comment passes comment hygiene: it describes the code as it is, with no "previously duplicated".
- [ ] **(b) Code docblocks only; docs and the skill in a follow-up.** A smaller diff. Cost: the docs page tells operators the copies exist, and the skill tells agents to "edit all three or none", both wrong from the commit on.

---

## D. Editor setting

### D1 — ⚠ DECIDE — `.vscode/settings.json` committed, or the setting only documented?

Fact 15: the repository's own `.gitignore:85` ignores `.vscode/*`, and `693ae80b5` untracked the live file on purpose. The spike measured `enablePaths` as the half that works (vanilla 0 of 7 flagged). `deno.path: node_modules/.bin/deno` was not observed in VS Code. Without the setting, nothing changes for a contributor.

- [ ] **(a) Document only: an "Editor setup" passage in `apps/supabase/README.md` and the docs page `edge-functions/+page.md`, giving `deno.enablePaths`, the optional `deno.path`, "never set `deno.enable`", and "Prettier formats this tree"** — ★ RECOMMENDED. Criterion 2 asks only that the setting be documented. This respects the `693ae80b5` ruling and leaves no shared editor state.
- [ ] **(b) Commit a template, `.vscode/settings.example.json`, plus a `.gitignore` negation for that one file, and document copying it.** The route `693ae80b5`'s own message proposed. Cost: a `.gitignore` edit and a file a contributor must still copy by hand, with the same unobserved `deno.path` inside it.
- [ ] **(c) Commit the live `.vscode/settings.json` (negation + `git add -f`).** Zero setup for VS Code users. Cost: it reverses `693ae80b5`, and it overwrites contributors' personal settings, such as the title-bar colours in the local file today.

### D2 — Does the criterion-2 proof include re-running the spike's LSP probe?

- [ ] **(a) Yes, once, after the move: `lsp-probe.mjs` S8 (recommended setup) and S9 (`deno.enable`) on 2.9.6, with its `FILES` array updated to this tree's files** — ★ RECOMMENDED. Expect vanilla 0 of 7 under S8. The probe was never rerun after a `_shared/` move (spike gap). It runs in a scratch copy, about 15 s per scenario.
- [ ] **(b) No; criterion 2's CLI half (no root `deno.json`, no `deno.enable`) is checked by `git ls-files` and `git grep`.** Cheaper. Cost: the "in an editor" half of criterion 2 rests on spike measurements of a different tree.

---

## E. Verification

### E1 — How criterion 4 (bundle contents, with and without the config) is measured

The spike's `verify.sh` bundles each function with the `edge-runtime` image standalone (its own container name and port, so the stack is untouched), unbundles one directory deep, lists the files, then serves each function and calls `OPTIONS` and `POST {}`. It does not toggle the config. Fact 17: the image is `v1.76.2`.

- [ ] **(a) Bring `verify.sh` over, updated for the three functions, with two passes: config present and config moved aside** — ★ RECOMMENDED. Pass/fail: (1) every bundle exits 0; (2) its unbundled file list holds exactly the `_shared/` modules its entry point imports (`account-access`: `envConfig`, `placeholderAddress`; `identity-callback`: `envConfig`, `placeholderAddress`; `send-email`: `envConfig`) and no `*.test.ts`; (3) `cmp` of each function's two eszips is byte-identical, or, if the eszip embeds a timestamp, the two unbundled trees are `diff -r` identical, with the reason recorded; (4) `OPTIONS` 200 per function. The output goes into the run record. The "answers on the restarted local stack" half is the E2E run (G2), which restarts the stack and serves `identity-callback` through `supabase functions serve` (fact 21).
- [ ] **(b) The E2E run only.** No Docker script. Cost: E2E proves the functions answer, not what the bundles hold or that the config leaves them unchanged, so two of criterion 4's three clauses go unmeasured.
- [ ] **(c) A bundle via `supabase functions deploy --dry-run`-style CLI output instead of the bare image.** Exercises the CLI path. Cost: the CLI has no dry-run bundle that lists contents, and a real deploy needs a hosted project (out of scope).

### E2 — The planted-error control for criterion 1

- [ ] **(a) Three plants, each run with the exit code read directly (never through a pipe): a type error in `_shared/envConfig.ts`, one in an `index.ts`, and one in an excluded `*.test.ts`** — ★ RECOMMENDED. Expected: red naming it, red naming it, green. Then under turbo, a cached run reports `FULL TURBO` and a plant is a cache miss that turns red. Each plant is reverted, and the revert is checked by `git diff --quiet`.
- [ ] **(b) One plant in an `index.ts`.** The criterion's minimum. Cost: it does not prove that `_shared/` is checked from `functions/`, or that tests are excluded.

---

## F. CI

### F1 — ⚠ DECIDE — How criterion 5's CI run is observed

CI runs on `main` and `ci-evidence/**` only (fact 20). The standing method is a source-only commit, HEAD's tree minus `.planning/` and `.bg-shell/`, parented on `origin/main` and built with a temporary `GIT_INDEX_FILE` in the scratchpad, never checked out, then pushed to a `ci-evidence/<name>` branch. It must touch a non-`.md` path, or `paths-ignore` produces no run. The repository is public, so the push is the operator's to authorise. On the last run, three jobs were red for reasons unrelated to Deno.

- [ ] **(a) `ci-evidence/180-deno`, pushed once after the last code commit; criterion 5 is read at JOB level** — ★ RECOMMENDED. `frontend-and-shared-module-validation` must be `success`, and its "Type-check all packages" log must show `@openvaa/supabase:typecheck` running `deno check .` with the `Check …` lines for the 26 modules (or the post-move count). This also observes the Linux `@deno/linux-x64-glibc` install and a cold Deno cache with registry downloads, neither of which has been observed. Every other job is recorded as found. A red `secret-scan`, `dependency-audit` or `e2e-tests` is cited by its cause and not counted against this criterion, while the E2E part of criterion 5 is met by the local full run (G2). The push needs the operator's go.
- [ ] **(b) Require the whole run green (all jobs).** The strongest reading. Cost: it ties this phase to three unrelated reds (`secret-scan`, `dependency-audit`, the CI `e2e-tests` a11y-scan timeout), possibly for several pushes.
- [ ] **(c) A second, red-control push with a planted type error, showing the CI step itself turns red.** Proves the gate bites in CI. Cost: a second push and run. The local control (E2) and turbo already show the same script turning red.

---

## G. Plan shape and E2E cost

### G1 — ⚠ DECIDE — Plan shape

Under the 2026-11-09 ruling, plans inside the phase make targeted runs only, and the final plan makes the one full run. About 13 Playwright projects drive a function, through the setup, fixture and spec files that call `account-access`, `identity-callback` or `send-email` (`identityProviderFlow`, `invitationFlow`, `emailBucket`, `accountAccessClient`, `mailedLink`). Among them: `bank-auth`, `contestant-identity-provider`, `invitation-contract`, `invitation-landing`, `contestant-email-registration`, `contestant-code-registration`, `contestant-password-recovery`, `admin-account-flows`, `contestant-entry-scan`, `contestant-entry-phone`, `contestant-a11y-scan`, the contestant-journey project and a perm-localisation project. Derive the exact set by `git grep` at run time, not from this list. Every plan whose source change touches the functions owes a targeted run of all of them.

- [ ] **(a) Three plans, one of them with code** — ★ RECOMMENDED.
  - **01:** bring the skill reference and sources over (A2), and amend the ROADMAP criteria (A1). Docs only, no E2E.
  - **02:** all code, in one plan, with commits ordered so that `yarn typecheck` never goes red: `deno.json` + pin + script + `yarn.lock`; the A3 typing; the `_shared/` move, the guard edit and test repointing (C1-C4); deleting `jwtSegment` (C2); the prose (C5). Then the E2 controls, the full unit suite and every gate script, and **one targeted green run per function-driving project** after the last code commit, with test-count deltas recorded against `179.2-final-4` (729).
  - **03:** the E1 bundle verification, the D2 probe, the F1 CI run, the **one full-suite run** judged against 729 plus the summed deltas (expected: 0, since no E2E test is added or removed), and the reconciliation (G3).
  The function-driving projects get one targeted pass.
- [ ] **(b) Two code plans (toolchain + typing, then the move).** Smaller review units. Cost: two targeted passes over about 13 projects, which costs more wall-clock than the full suite (each wrapper run restarts the stack).
- [ ] **(c) Make plan 02 the final plan too (two plans).** One fewer handoff. Cost: the bundle and CI evidence then sit inside the code plan, so a red CI or bundle result means re-opening a plan that carries all the code.

### G2 — What the targeted and full runs must show for the Edge Functions

- [ ] **(a) Green under the standing rules (a red or "did not run" test blocks; a void run is re-run under a new `--run-dir`), with both bank-auth projects (`bank-auth`, `contestant-identity-provider`) named explicitly in the full run's record (E2E-03)** — ★ RECOMMENDED. The wrapper restarts the stack at its end, so the shared modules are served fresh; check that `edge_runtime` is Up before the run.
- [ ] **(b) Add an explicit pre-run `db:stop`/`db:start` so the edge runtime loads `_shared/` before the first targeted run.** Belt and braces. Cost: about 30 s of stack time per run; the `per_worker` hot reload already serves new files from the mount.

### G3 — Reconciliation at close

- [ ] **(a) Full** — ★ RECOMMENDED. Close `2026-10-07-174-nothing-type-checks-the-edge-functions.md` and `2026-10-07-174-send-email-jwtsegment-has-no-importer.md`, each with its measured outcome. Annotate the four A5 todos. Record in Phase 174's verification that its one behaviour-unverified truth now has a type-checked `index.ts`, though still no live misconfigured-deployment run. Update the skill reference's "On this branch" section with the post-phase counts (modules checked, `_shared/` contents, lint findings, CI run id).
- [ ] **(b) Close the two todos only.** Cost: the A5 todos keep claiming that "nothing type-checks", and the skill reference keeps the pre-phase counts.

---

## Fill status

| Section | Decisions | ⚠ DECIDE |
|---|---|---|
| 0. Factual baseline | 1 | 0 |
| A. Scope and criteria text | 5 | 1 (A1) |
| B. Toolchain | 6 | 2 (B1, B5) |
| C. Shared modules | 5 | 2 (C1, C2) |
| D. Editor setting | 2 | 1 (D1) |
| E. Verification | 2 | 0 |
| F. CI | 1 | 1 (F1) |
| G. Plan shape and E2E | 3 | 1 (G1) |
| **Total** | **25** | **8** |

**An untouched document means: every `★ RECOMMENDED` option, as written.** Tick a different box under any decision to overrule it, or add `**EDIT:**` / `**NOTE:**` free text; free text beats every box.
