# Deno Edge Function Typecheck

Implementation blueprint for putting the four Supabase Edge Functions under
`apps/supabase/supabase/functions/` (`account-access`, `identity-callback`,
`invite-candidate`, `send-email`) under a typecheck, without Deno tooling
reaching the repo's vanilla TypeScript, and for replacing the byte-identical
module copies with one `functions/_shared/` directory. Distilled from spikes
037–040. Nothing here is applied to the codebase yet — see
*Status in the codebase* under Constraints.

## On `feat/entity-signup-multi-grant`

Measured 2026-11-12 on `feat/entity-signup-multi-grant` at HEAD `7c4aa88e5`,
the factual baseline of phase 180 (`180-CONTEXT.md` facts 3 to 13), in a
scratch copy of the three function directories with
`sources/040-toolchain-wiring/deno.json`, on the npm `deno` 2.9.6 and
cross-checked with 2.7.8. Everything after this section is the spike record as
written on `spike/deno-edge-typecheck` at `796e610a7`. Its counts describe a
four-function tree before phase 174 finished, and most of them do not hold
here: where this section and the record disagree, this section describes the
tree.

**This tree**

- Three functions, not four: `account-access` (9 non-test modules, 7 tests),
  `identity-callback` (12 / 13) and `send-email` (5 / 5), so 26 non-test
  modules and 25 tests. `invite-candidate` was deleted in phase 174.
  `deno check .` reports `Check` for exactly those 26.
- **No baseline type errors.** `deno check .` with the `040` config exits 0 on
  2.9.6 and on 2.7.8. The spike's five errors left with `invite-candidate` and
  with `identity-callback/candidateRecord.ts` and `entityGrant.ts`. A planted
  pair (a string assigned to a `number` in `send-email/index.ts`,
  `Deno.env.get(42)` in `identity-callback/index.ts`) gives `TS2322`,
  `TS2345`, `Found 2 errors.` and exit 1, so the check bites.
- `findExistingCandidate` and `CandidateLookupFilter` left with
  `candidateRecord.ts` in `4ecfe7778`: the reshape that § 4 item 4 asks for is
  moot (D-05).
- `envConfig.ts`: three byte-identical copies (`account-access/`,
  `identity-callback/`, `send-email/`), four importers in three functions (the
  three `index.ts` and `identity-callback/serverCredential.ts`), one test
  (`send-email/envConfig.test.ts`).
- `placeholderAddress.ts`: two copies (`identity-callback/`, `account-access/`)
  with the same code and different docblocks; `identity-callback`'s copy also
  exports `placeholderAddressFor`. Three consumers in two functions
  (`identity-callback/index.ts`, `account-access/index.ts`,
  `account-access/addressConfirmation.ts`), and a parity test,
  `identity-callback/placeholderAddress.test.ts`, that also reads the
  frontend's copy in
  `apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts`.
- `callerAuthority.ts`: one copy, one consumer (`send-email/index.ts`).
- `entityGrant.ts` does not exist.
- `send-email/jwtSegment.ts` has no importer but its own test.
- The byte-for-byte conformance test (§ 3, "What the patch does NOT do",
  item 2) was removed with `invite-candidate` in `287a2b97d`.
- The copy-drift check (Check 2 of `scripts/assert-edge-env-defaults.mjs`)
  lists `envConfig.ts` alone: `DUPLICATED_MODULES = ['envConfig.ts']`.
- Four source-reading tests pin module paths:
  `send-email/flowConformance.test.ts` (the `./callerAuthority.ts` import),
  `identity-callback/flowConformance.test.ts` (its own directory and
  `EXPORTS_HELD_FOR_PARITY`), `account-access/flowConformance.test.ts` (its
  own directory) and `identity-callback/placeholderAddress.test.ts` (both
  copies by URL).
- `identity-callback/index.ts` holds three admin-client parameters typed
  `supabaseAdmin: any` under `// deno-lint-ignore no-explicit-any`, with a
  `// reason:` that nothing type-checks the tree. Typed as `SupabaseClient`
  they check clean: the § 4 item 3 `rollbackInvite` fix, applied to the sites
  that still need it (D-04).
- `deno lint` (with the `no-import-prefix` exclusion) finds 4 problems, all
  `require-await`: `callerMayOnProject` and `callerMayOnEntity` in
  `send-email/callerAuthority.ts`, `issueSignInLink` and `issueRecoveryLink`
  in `account-access/linkIssue.ts`; `Checked 26 files`. `deno fmt --check`
  disagrees with Prettier on 26 of 27 files.

**Void on this branch**

- § 4 "Fix the 5 baseline type errors" and
  `sources/040-toolchain-wiring/type-fixes.patch`: there are no errors to fix,
  and the files the patch edits (`_shared/entityGrant.ts`,
  `identity-callback/candidateRecord.ts`, `invite-candidate/index.ts`) do not
  exist.
- The `entityGrant.ts` rows of § 3 (no such file), the `jwtSegment.ts` rows
  (phase 180 deletes the module rather than moving it, D-14), and every
  `invite-candidate` row.
- The byte-for-byte test removal (§ 3, "What the patch does NOT do", item 2):
  already done in `287a2b97d`.
- Every four-function count: 23 and 17 modules, 5 errors, 10 copies, 21 files
  and 499 tests, the bundle table of § 3, the probe's fixed file list.

**History only, not instructions**

- `sources/039-shared-module/shared-module.patch` and
  `sources/040-toolchain-wiring/toolchain.patch` were cut against the spike
  branch's base and do not apply to this tree. Phase 180 re-derives each
  change from this reference's text, never from the patches.
  `type-fixes.patch` is history as well as void.

**What phase 180 does**

- `apps/supabase/supabase/functions/deno.json` with exactly the four keys of
  § 1, byte-identical to `sources/040-toolchain-wiring/deno.json`: no
  `imports`, `"lock": false`. `deno` `2.9.6`, exact, as a devDependency of
  `@openvaa/supabase`, run by
  `"typecheck": "cd supabase/functions && deno check ."` (D-07 to D-10).
- `functions/_shared/` holds `envConfig.ts` and `placeholderAddress.ts` with
  their tests. `callerAuthority.ts` stays in `send-email/`: it has one
  consumer, and `_shared/` keeps one meaning, used by more than one function
  (D-13). The kept `placeholderAddress.ts` is `identity-callback`'s, and the
  parity test reads it and the frontend's copy (D-15).
- `send-email/jwtSegment.ts` and its test are deleted, not moved (D-14).
- The copy-drift check (Check 2 and `DUPLICATED_MODULES`) leaves
  `scripts/assert-edge-env-defaults.mjs`, whose summary becomes
  `2 of 2 (env-default; vitest-reachability)` (D-16).
- The editor setting is documented, not committed (D-18): `deno.enablePaths`,
  the optional `deno.path`, never `deno.enable`, and "Prettier formats this
  tree", in `apps/supabase/README.md` and the docs site's edge-functions page.
  No `.vscode/` file is tracked.
- `deno lint` is not a gate; its 4 `require-await` findings above are the
  record of it (D-11). `deno fmt` is never wired (D-12).
- The deployed runtime is `supabase/edge-runtime:v1.76.2`, which embeds Deno
  2.1.4 (TypeScript 5.6.2, per the spike, not re-measured), while the checker
  is 2.9.6. That both accept this code is an observation about this code, not
  a guarantee (D-07).

**Running the scripts**

- `sources/037-deno-check-functions/run.sh`,
  `sources/039-shared-module/verify.sh` and
  `sources/038-editor-blast-radius/lsp-probe.mjs` locate the repository as
  `../../..` from their own directory and do not run from `sources/`. This
  branch has no `.planning/spikes/037…040`: the write-ups exist on
  `spike/deno-edge-typecheck` only
  (`git show 796e610a7:.planning/spikes/<spike>/README.md`), so the Origin
  section's advice to run the scripts from `.planning/spikes/` does not apply
  here.
- The phase's adapted copies are
  `.planning/phases/180-edge-functions-typecheck-shared-modules/180-verify-bundles.sh`
  (the three functions, two passes: the config present and moved aside) and
  `180-lsp-probe.mjs` (its file list updated to this tree), both written by
  plan 180-03, which also adds this tree's counts after the phase to this
  section. The copies under `sources/` stay as the spike left them.

### After phase 180

Measured 2026-11-13 on `feat/entity-signup-multi-grant` after phase 180's
code commits (the functions tree of `61149b276` and every later head).

- `deno check .`, run by `yarn typecheck` from `functions/`, checks 22
  non-test modules: `Check` for exactly those 22 from a cold cache (plan
  180-02's post-move count). Beside them are 24 `*.test.ts` files, excluded by
  `deno.json` and run by vitest.
- `functions/_shared/` holds four files: `envConfig.ts`,
  `envConfig.test.ts`, `placeholderAddress.ts`, `placeholderAddress.test.ts`.
  `account-access` and `identity-callback` import both modules, `send-email`
  imports `envConfig.ts` alone.
- `deno lint` from `functions/`
  (`yarn workspace @openvaa/supabase exec sh -c "cd supabase/functions && deno lint"`):
  `Checked 22 files`, `Found 4 problems`, all `require-await`, the same four
  as before the move (`callerMayOnProject`, `callerMayOnEntity`,
  `issueSignInLink`, `issueRecoveryLink`). Not a gate (D-11).
- Bundles, from `git archive` exports of the committed tree with
  `edge-runtime:v1.76.2` (`180-verify-bundles.sh`): every function bundles
  with exit 0 with `functions/deno.json` and without it, and each function's
  two eszips are `cmp`-identical. Each bundle holds exactly the `_shared/`
  modules its entry point imports (`account-access` and `identity-callback`:
  `envConfig.ts`, `placeholderAddress.ts`; `send-email`: `envConfig.ts`) and
  no test file. Each function served standalone answers `OPTIONS` with 200.
- The LSP probe (`180-lsp-probe.mjs`, Deno 2.9.6, on an export of the tree
  without `node_modules`): `S8-recommended` flags 0 of 7 vanilla files;
  `S9-functions-deno-json+enable-true` flags 6 of 7. So `deno.enablePaths`
  keeps Deno off the vanilla TypeScript and `deno.enable` does not.
- CI: run `43405262494` of `ci-evidence/180-deno` (this tree without
  `.planning/`, `.bg-shell/` and the two spike captured outputs that hold a
  home-directory path), job `frontend-and-shared-module-validation`
  concluded `success`. In its Type-check step the
  `@openvaa/supabase:typecheck` task prints 22 `Check` lines, one per non-test
  module, and 23 `Download https://registry.npmjs.org/` lines: a cold Deno
  cache. Under GitHub Actions turbo groups each task's output, so these lines
  sit inside the task's `##[group]` and carry no `@openvaa/supabase:typecheck:`
  prefix.
- The conformance tests' own-directory scans
  (`account-access/flowConformance.test.ts`,
  `identity-callback/flowConformance.test.ts`) do not reach `_shared/`, so
  the shared modules are outside their "no direct `createUser`", "one admin
  update" and "no unused export" scans. Acceptable while both shared modules
  are pure, with no client and no I/O.
- `nodemailer` ships no types, so its call sites are `any` to the checker,
  and under `"lock": false` the transitive npm dependencies of the inline
  `npm:` imports float: a transitive release can change a type result on an
  unchanged tree (D-09).
- D-12 is documented, not observed: the supabase README and the docs site's
  edge-functions page say Prettier formats this tree; no editor was run to
  see which formatter it picks, and the `fmt` exclude is not used
  (`deno.json` has no `fmt` key). The automated proxy is
  `yarn prettier --check apps/supabase/supabase/functions` (plan 180-02) and
  `yarn format:check`.
- The hosted staging project still runs bundles of the old layout, with the
  per-function copies, until its next deploy, which is the first with
  `_shared/`. Nothing was deployed in phase 180 (D-27).

## Requirements

From `.planning/spikes/MANIFEST.md` § `deno-edge-typecheck`:

- Deno must not cause the vanilla TS code in the repo to be flagged, in the
  editor or on the CLI. An earlier Deno installation did exactly that.
- Work happens on branch `spike/deno-edge-typecheck` in its own worktree off
  `feat/entity-signup-multi-grant`.

## How to Build It

The steps are ordered so that the tree is never left with a red
`yarn typecheck`: the script that makes turbo run the check (step 2) goes in
the same change as the type fixes (step 4), and the type fixes are written
against the `_shared/` layout (step 3).

Three patch files carry the code changes. They live in `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` and apply
with `git apply` from the repo root:

| Patch | Carries |
|---|---|
| `.claude/skills/spike-findings-voting-advice-application-gsd/sources/040-toolchain-wiring/toolchain.patch` | `apps/supabase/package.json` script + devDependency, and the matching `yarn.lock` entries |
| `.claude/skills/spike-findings-voting-advice-application-gsd/sources/039-shared-module/shared-module.patch` | the `_shared/` move, import rewrites, test repointing (23 files, +17 −454) |
| `.claude/skills/spike-findings-voting-advice-application-gsd/sources/040-toolchain-wiring/type-fixes.patch` | the 6 changed lines that clear the 5 baseline type errors. **Depends on the 039 patch** — it edits `_shared/entityGrant.ts` |

The proven order (040 README, "How to Run"):

```bash
git apply .planning/spikes/040-toolchain-wiring/toolchain.patch
cp .planning/spikes/040-toolchain-wiring/deno.json apps/supabase/supabase/functions/deno.json
yarn install
yarn workspace @openvaa/supabase typecheck                    # red: the 5 baseline errors
git apply .planning/spikes/039-shared-module/shared-module.patch
git apply .planning/spikes/040-toolchain-wiring/type-fixes.patch
yarn turbo run typecheck --filter=@openvaa/supabase           # green
```

The patches were cut against the spike branch's base. If the tree has moved,
re-derive each change from the descriptions below rather than forcing the
patch.

### 1. Add the scoped `deno.json`

Create `apps/supabase/supabase/functions/deno.json` with exactly this
(`.claude/skills/spike-findings-voting-advice-application-gsd/sources/040-toolchain-wiring/deno.json`; not part of any patch — it is copied
in):

```json
{
  "lock": false,
  "exclude": ["**/*.test.ts"],
  "lint": { "rules": { "exclude": ["no-import-prefix"] } }
}
```

What each key is for:

- **The file existing at all** takes Deno out of package.json mode. A
  `deno.json` nearer than any `package.json` makes `npm:` specifiers resolve
  from Deno's global cache; no `node_modules` is created. Even `{}` does this
  (037).
- **No `imports` key (import-map-free).** This is what makes a config in
  `functions/` safe for deployment: the edge-runtime bundler produced
  byte-identical eszips for all four functions with the file present and with
  it removed (039). Do not add an import map.
- **`"lock": false`** stops Deno writing `functions/deno.lock`. Every specifier
  in the tree is already an exact version, so a lock would add only transitive
  pinning (037).
- **`"exclude": ["**/*.test.ts"]`** keeps the vitest files out. Without it
  Deno 2.1.4 aborts on the bare `vitest` import and 2.9.7 reports 99 errors
  (037).
- **`lint.rules.exclude: ["no-import-prefix"]`** silences a rule that is new in
  Deno 2.9 and fires on every pinned inline `npm:` import (7 hits tree-wide)
  once a `deno.json` exists. The inline pinned specifiers are deliberate, and
  the repo's guard scripts and conformance tests read them from source (038).

The file is inert in editors on its own (see step 5), passes Prettier, and
leaves `assert-edge-env-defaults`, `assert-edge-function-env`,
`assert-comment-hygiene` and `assert-unit-test-coverage` passing (040).

An equivalent placement is `apps/supabase/supabase/deno.json` (found by upward
discovery, outside the directory the bundler reads). `functions/` was chosen
for discoverability.

### 2. Pin Deno and add the package script

In `apps/supabase/package.json` (`toolchain.patch`):

```json
"scripts": {
  "typecheck": "cd supabase/functions && deno check ."
},
"devDependencies": {
  "deno": "2.9.6"
}
```

- **The `cd` is load-bearing.** Deno discovers its config from the CWD, not
  from the file being checked. A yarn/turbo script runs in `apps/supabase`;
  without the `cd` (or `--config apps/supabase/supabase/functions/deno.json`)
  it silently behaves like the no-config case.
- **Exact version, no caret.** `2.9.6` was npm `latest` at spike time and
  clears the repo's `npmMinimalAgeGate: 7d`.
- **No `dependenciesMeta … built: true` entry is needed.** See Constraints.
- **No `turbo.json` change.** The existing `typecheck` task picks the script
  up. That means `yarn typecheck`, `yarn lint:check` (which chains
  `yarn typecheck`) and the CI step named "Type-check all packages (turbo run
  typecheck)" in `.github/workflows/main.yaml` all start running it — and all
  go red until step 4 lands.
- `assert:declared-binaries` reports 0 violations with the binary declared in
  the workspace that runs it.

Run `yarn install` so `yarn.lock` gains the `deno@npm:2.9.6` entry and its six
optional `@deno/<platform>` entries.

### 3. Move the duplicated modules to `functions/_shared/`

`shared-module.patch` does this. What it contains:

- **`git mv` one copy of each module (and its test) into `_shared/`**, delete
  the other copies:

  | Module | Kept copy came from | Copies before |
  |---|---|---|
  | `envConfig.ts` (+ `envConfig.test.ts` from `invite-candidate/`) | `account-access/` | 4 |
  | `entityGrant.ts` + `entityGrant.test.ts` | `identity-callback/` | 2 (test also duplicated byte-for-byte) |
  | `callerAuthority.ts` + `callerAuthority.test.ts` | `invite-candidate/` | 2 |
  | `jwtSegment.ts` + `jwtSegment.test.ts` | `invite-candidate/` | 2 |

- **Rewrite 8 imports in the four `index.ts` files** from `./x.ts` to
  `../_shared/x.ts` — plain relative imports, no alias, no import map:

  ```ts
  import { callerMayOnProject } from '../_shared/callerAuthority.ts';
  import { writeEntityGrant } from '../_shared/entityGrant.ts';
  import { requireEnv } from '../_shared/envConfig.ts';
  ```

- **Repoint the source-reading tests.** In `identity-callback/` and
  `invite-candidate/flowConformance.test.ts`, the `GRANT_MODULE_SOURCE`
  `readFileSync` URL becomes `new URL('../_shared/entityGrant.ts', import.meta.url)`.
  In `invite-candidate/` and `send-email/flowConformance.test.ts`, the
  `toContain("import { callerMayOnProject } from './callerAuthority.ts';")`
  assertions take the `'../_shared/callerAuthority.ts'` specifier.
  `send-email/jwtSegment.test.ts` imports from `'../_shared/jwtSegment'`.

**What the patch does NOT do — the build must finish these** (039 Results):

1. **Drift guard Check 2.** `scripts/assert-edge-env-defaults.mjs` goes from 0
   to 3 violations after the move, all
   `expected at least two copies of '<module>' … found 1`, for `envConfig.ts`,
   `jwtSegment.ts` and `callerAuthority.ts`. Drop Check 2 (the section headed
   `// ── Check 2: the duplicated sibling modules`) and the
   `DUPLICATED_MODULES` list. Checks 1 and 3 still pass over the new layout.
   The guard's summary line (`checks live: 3 of 3 (env-default; copy-drift;
   vitest-reachability)`) needs to follow.
2. **The byte-for-byte conformance test.** Delete
   `it('shares ONE gate module with invite-candidate, byte for byte', …)` in
   `send-email/flowConformance.test.ts`. Its subject no longer exists; it is
   the single vitest failure left after the patch (487 passed / 1 failed).
3. **Docblocks.** The moved modules still open with a `DUPLICATED ON PURPOSE.
   Byte-identical copies of this file live in …` block (the renames are 100%
   similarity). Rewrite them — they are no longer true.
4. **`jwtSegment.ts` is dead code.** No bundle contains it; nothing but its own
   tests imports it. Decide whether it survives at all. The only other
   reference is prose in `.claude/skills/database/SKILL.md`.

To prove the move, apply the patch and run
`.claude/skills/spike-findings-voting-advice-application-gsd/sources/039-shared-module/verify.sh` (needs Docker; uses the edge-runtime
image standalone on its own container name and port, so a running local stack
is untouched). Expect every bundle to exit 0 and list `_shared/*.ts` beside the
function's own modules, every function to answer `OPTIONS` 200, and
`identity-callback` to answer `POST {}` with 500 and log
`Missing required environment variable: IDENTITY_PROVIDER_TYPE` — thrown from
inside `_shared/envConfig.ts`, which is the shared module executing.

Each bundle holds exactly the shared modules its entrypoint imports, and no
test file:

| Function | Shared modules in its bundle |
|---|---|
| `send-email` | `callerAuthority`, `envConfig` |
| `invite-candidate` | `callerAuthority`, `entityGrant`, `envConfig` |
| `identity-callback` | `entityGrant`, `envConfig` |
| `account-access` | `envConfig` |

### 4. Fix the 5 baseline type errors (6 changed lines, 4 files)

`type-fixes.patch`, applied on top of step 3. The baseline is captured in
`.claude/skills/spike-findings-voting-advice-application-gsd/sources/037-deno-check-functions/baseline-errors-deno-2.9.7.txt`.

1. `_shared/entityGrant.ts`, interface `GrantWriteClient` — `insert(...)`
   returns `PromiseLike<…>` instead of `Promise<…>`. Clears 2 errors (the
   `writeEntityGrant(supabaseAdmin, …)` calls in `identity-callback/index.ts`
   and `invite-candidate/index.ts`).
2. `identity-callback/candidateRecord.ts`, interface `CandidateCreateClient` —
   `single()` returns `PromiseLike<…>`. Clears 1 (the
   `createCandidate(supabaseAdmin, …)` call).
3. `invite-candidate/index.ts` — import the exported type and use it for the
   `rollbackInvite` parameter. Clears 1:

   ```ts
   import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.117.2';
   // …
   async function rollbackInvite(
     supabaseAdmin: SupabaseClient,
   ```

   (was `ReturnType<typeof createClient>`, which resolves to a different
   generic instantiation than the call site.)
4. `identity-callback/index.ts` — import `type CandidateLookupClient` from
   `./candidateRecord.ts` and cast at the `findExistingCandidate` call.
   Clears the TS2589:

   ```ts
   const existingCandidate = await findExistingCandidate(supabaseAdmin as unknown as CandidateLookupClient, { projectId, authUserId: userId });
   ```

**Item 4 is a placeholder, not the fix.** `CandidateLookupFilter` is a
recursive structural type that TypeScript cannot match against the real
postgrest builder. A real fix reshapes that interface. All five errors are
declaration mismatches, not behaviour: the code awaits these values, which
works on thenables.

After the fixes vitest is unchanged (487/488, the same obsolete test from
step 3).

Run `yarn format` over the touched files afterwards. The spike reports that
Prettier accepts `deno.json`; it does not report a format check on the patched
function files, and the two lines the patch adds to `identity-callback/index.ts`
are 123 and 144 characters long.

### 5. Editor setting

For a contributor who wants Deno diagnostics in the functions tree
(`.claude/skills/spike-findings-voting-advice-application-gsd/sources/040-toolchain-wiring/vscode-settings.example.json`):

```json
{
  "deno.enablePaths": ["apps/supabase/supabase/functions"],
  "deno.path": "node_modules/.bin/deno"
}
```

- `deno.enablePaths` is the measured half (038, scenario S8): vanilla files
  0/7 flagged, function test 0/1, `send-email/index.ts` 0 diagnostics.
- `deno.path` is the unmeasured half: the npm shim works as an LSP launcher
  when driven directly, but the VS Code extension accepting that relative path
  was not observed.
- Never set `deno.enable`.
- The repo commits no `.vscode/settings.json`, and `.vscode/` is in the owner's
  global gitignore, so today this setting is per-machine. Committing one
  (needs `git add -f` on a machine with that ignore) or documenting it is an
  open build decision. A contributor without the setting sees nothing change:
  the nested `deno.json` alone does not switch Deno on.

### 6. Verify

- `yarn workspace @openvaa/supabase typecheck` exits 0. Read the exit status
  directly, never through a pipe.
- Plant a type error in a function file → red, error named; restore. With
  turbo: a cached run reports `FULL TURBO`, and the planted error is a cache
  miss.
- Editor boundary: `DENO=node_modules/.bin/deno node
  .planning/spikes/038-editor-blast-radius/lsp-probe.mjs S8-recommended` and
  look for `vanilla flagged 0/7`. Two caveats before running it: each scenario
  refuses to run if the `deno.json` it wants to create already exists, so move
  the committed `functions/deno.json` aside first; and its fixed file list
  opens `invite-candidate/entityGrant.ts` and `send-email/jwtSegment.test.ts`,
  the first of which the `_shared/` move deletes — update the `FILES` array
  after step 3.
- Get one observed CI run through the repo's `ci-evidence/**` channel. No
  spike ran in CI.

## What to Avoid

- **A `deno.json` at the repo root.** Reproduces the earlier "everything is
  flagged" failure: with no editor settings at all, 6 of 7 vanilla files get
  Deno diagnostics (Deno 2.9.7, no `node_modules`; 5 of 7 on 2.9.6 with
  `node_modules` installed). It also breaks the functions themselves, because a
  root-scoped Deno inherits the root `package.json`.
- **`"deno.enable": true` without `enablePaths`.** Same blast radius (6/7,
  resp. 5/7), and the scoped `functions/deno.json` does not contain it (S9).
  With `enablePaths` also set the vanilla files are clean again (S10) —
  enablePaths wins — but there is no reason to set `enable` at all.
- **Relying on the nested `deno.json` for editor auto-detect.** A `deno.json`
  below the workspace root switches nothing on: 0 diagnostics everywhere,
  functions included (S3, S6). Auto-detection is root-only. The config decides
  *how* Deno runs; `enablePaths` decides *where*.
- **`enablePaths` without the scoped config** (S4 — the `-gsd` worktree's
  local setup at spike time). Vanilla stays clean, but the function tests are
  flagged with `Import "vitest" not a dependency`.
- **Running `deno check` from any other CWD** without `--config`. From the repo
  root it fails before checking anything: 2.1.4 cannot find
  `npm:nodemailer@10.0.11` in `node_modules`; 2.9.7 walks the Yarn workspace
  and dies in `apps/frontend/scripts/compile-paraglide.ts`.
- **`deno.json` beside `apps/supabase/package.json`.** Still package.json
  mode; same failures.
- **Per-function `deno.json` files.** They work only when run from inside each
  function directory — four configs, four invocations; `deno check .` from
  `functions/` does not find them.
- **`deno fmt`.** `deno fmt --check` reports 23 of 23 function files as
  unformatted; it disagrees with the repo's Prettier config on every file. A
  contributor whose editor formats with the Deno extension inside the enabled
  path would rewrite whole files.
- **Obeying `no-import-prefix`** by moving the `npm:` specifiers into an import
  map. That reintroduces the import map Supabase warns about for deployment and
  breaks the guards and tests that read the pinned specifiers from source.
- **An import-map alias (`@shared/…`) or a Yarn workspace package for the
  shared code.** Neither was built: the alias needs the import map at deploy
  plus a vitest alias; the package needs a build step and an `npm:` bridge.
- **A global Deno install (`brew`, `curl`) or `denoland/setup-deno` in CI
  only.** Unpinned or drifting between local and CI; the global install is the
  route that led to the earlier whole-repo flagging.
- **Unbundling an eszip into the mount root when checking for shared
  modules.** The eszip stores `../_shared/x.ts` relative to the entrypoint, so
  the files land one level above the mount and the bundle looks as if it
  dropped them. Unbundle one directory deeper (`verify.sh` does).
- **Wiring `deno lint` as a gate by default.** It has 5 findings after the
  `no-import-prefix` exclusion (`require-await` ×4 on `callerMayOnProject` /
  `callerMayOnEntity` across the two `callerAuthority.ts` copies,
  `no-unused-vars` ×1 on `siteUrl` in `identity-callback/index.ts`). It is not
  wired; whether to is a separate choice.
- **Expecting the tests to be typechecked.** They stay un-typechecked: vitest
  does not typecheck, and Deno cannot take them without an import map for
  `vitest` and sloppy-import resolution. Known gap, out of scope.

## Constraints

**Deno versions — which was used for what**

| Version | TypeScript | Role | Used in |
|---|---|---|---|
| 2.1.4 | 5.6.2 | What the edge runtime embeds (`edge-runtime:v1.76.2`, the local stack's image) | 037 CLI experiments; 038 parity check on S1/S3/S4 only; 039 `deno check` after the move |
| 2.9.7 | 6.0.3 (the repo's catalog version) | Upstream latest at spike time; a throwaway binary | 037 CLI experiments and the planted controls; 038 full 11-scenario probe; 039 `deno check` after the move |
| 2.9.6 | 6.0.3 | npm `latest` at spike time (40 days old); **the version pinned** | 040 only: install, script, timings, turbo, a 4-scenario probe rerun |

- 2.1.4 and 2.9.7 gave the same `deno check` *result* (23 modules, the same 5
  errors) in 037 and 039. Their *failure modes* differ (no-config and
  no-exclude cases above). 2.9.6 reproduced the same 5 errors in 040. No
  README records a direct 2.9.6-vs-2.1.4 or 2.9.6-vs-2.9.7 comparison beyond
  that; 040's sentence "both versions gave identical `deno check` results on
  every experiment" leans on 037's 2.9.7 runs.
- The checker (2.9.6) does not match the runtime (2.1.4). Identical results is
  an observation about this code, not a guarantee.
- 2.9.7 was not pinned because npm `latest` was 2.9.6; `lts` was 2.2.15.
- The 2.1.4 language server ignores the `deno.json` `exclude` for open files
  and flags the vitest tests (10 diagnostics on `jwtSegment.test.ts`); 2.9.7
  and 2.9.6 leave them alone. The CLI honours the exclude on both 2.1.4 and
  2.9.7. So the editor experience depends on the contributor's Deno version.
- `no-import-prefix` exists in 2.9, not in 2.1.4.

**Counts**

- 23 non-test modules checked before the `_shared/` move, 17 after (6 copies
  deleted). Every `index.ts` and every pure module is checked, including ones
  no entrypoint imports.
- 5 baseline type errors: 3 in `identity-callback/index.ts`, 2 in
  `invite-candidate/index.ts`. Same 5 before and after the move.
- Planted controls (2.9.7 only): a type error in a pure module → 6 errors; a
  mistyped `Deno.env.get(42)` in an `index.ts` → 6 (the `Deno` global is
  typed); a type error in an excluded `*.test.ts` → still 5.
- Duplicated modules: 10 files that are 4 modules (`envConfig.ts` ×4,
  `entityGrant.ts` ×2, `callerAuthority.ts` ×2, `jwtSegment.ts` ×2), each set
  byte-identical. (The 039 README says "nine"; its own breakdown and the tree
  give ten.)
- vitest in `apps/supabase`: baseline 21 files / 499 tests green. After the
  patch: 20 files / 488 tests, 487 passed, 1 failed (the byte-for-byte test).
  The 11-test drop is the deleted duplicate `entityGrant.test.ts`.
- `shared-module.patch`: 23 files, +17 −454. `type-fixes.patch`: 6 changed
  lines in 4 files.
- LSP probe: 7 vanilla files, 3 function files, 1 function test; 11 scenarios
  on 2.9.7 without `node_modules`; 4 scenarios (S1, S4, S8, S9) on 2.9.6 with
  `node_modules`. Under the recommended setup `identity-callback/index.ts`
  shows 5 diagnostics.
- Bundles: 8–10 MB eszips per function.

**Timings** (one macOS arm64 machine; no CI numbers exist)

- 037, raw binary: warm `deno check .` 0.2–0.3 s (Deno caches a successful
  graph's check result). npm cache for the three pinned packages: 21 MB.
- 040, npm-installed 2.9.6: cold with an empty Deno cache 3.1 s including 23
  registry downloads (16 MB cache); warm 0.9 s, and 0.9 s again after editing
  a source file. The shim adds about 50 ms over the raw binary.
- 040, turbo: first run 1.3 s; second `1 cached … FULL TURBO`, 20 ms.
- `yarn install` after adding the devDependency: 5 s.
- LSP probe: about 15 s per scenario.

**Yarn**

- `.yarnrc.yml` sets `enableScripts: false`. `yarn install` warns
  `deno@npm:2.9.6 lists build scripts, but all build scripts have been
  disabled`, and the binary works anyway: the `bin.cjs` shim falls back to the
  platform package (`node_modules/@deno/darwin-arm64/deno`). No allow-list
  entry in root `dependenciesMeta` is needed.
- Only the host platform's package is installed: 77 MB.
- The `deno` package depends only on its platform binaries.

**Deployment facts**

- `functions/deno.json` (no `imports`) leaves all four eszips byte-identical.
  Passing it as `--import-map` also bundles, with the warning
  `Specifying import_map through flags is no longer supported`.
- Supabase documents `_`-prefixed folders under `supabase/functions/` for
  shared code. A deployment unit is a bundle of the entrypoint's import graph,
  wherever those files sit.

**Not exercised / not observed**

- **No CI run.** Linux resolving `@deno/linux-x64-glibc` and the cold run's
  registry access (23 downloads) were not observed on a runner.
- **No hosted deploy.** Only the Docker bundler path is proven. The CLI's
  API-bundling path (`--use-api`, server-side bundling from uploaded sources)
  was not exercised.
- **Not served through `supabase functions serve`** — the image was run
  standalone so the running stack's container was not replaced.
- **The language server was measured, not VS Code.** The extension muting the
  built-in TypeScript service inside enabled paths and leaving it on elsewhere
  is documented behaviour the probe cannot see.
- **Excluded test files in the editor.** Under the recommended setup Deno says
  nothing about `*.test.ts`; whether VS Code's own TS service then picks them
  up, or they get diagnostics from neither, was not observed.
- **`deno.path` in VS Code** — not observed (see step 5).
- **The LSP probe was not rerun after the `_shared/` move**, and the 2.9.6
  rerun covers 4 of the 11 scenarios.
- **Planted controls ran on 2.9.7 only**, not 2.1.4 or the pinned 2.9.6
  (040 planted one error under turbo on 2.9.6).
- **`yarn audit:deps` was red on the spike branch** for reasons unrelated to
  Deno: 3 advisories against the 2026-10-03 baseline (`shell-quote` critical,
  `compression` and `source-map-js` high), none in Deno's dependency tree.

**Unresolved in the write-ups**

- The warm timings differ (0.2–0.3 s in 037, 0.9 s in 040) and so do the cache
  sizes (21 MB vs 16 MB). The READMEs do not say whether 040's figure is the
  yarn script, the shim or the bare binary, so the gap is not explained beyond
  version and launcher.
- 038 describes the 5 diagnostics on `identity-callback/index.ts` as "that
  file's real type errors … plus the lint findings". The sources account for 4
  (3 type errors + 1 `no-unused-vars`); the fifth is not itemised.

### Status in the codebase

Checked on branch `spike/deno-edge-typecheck` at `044c705eb`
(`docs(spike-040): VALIDATED …`), 2026-10-07:

- **Nothing is applied.** The four spike commits touch `.planning/` only. The
  changes exist solely as the three `.patch` files and the `deno.json` in the
  spike directories.
- `apps/supabase/supabase/functions/deno.json` does not exist.
- `apps/supabase/supabase/functions/_shared/` does not exist; all ten module
  copies are in place and byte-identical per module.
- `apps/supabase/package.json` has no `deno` devDependency and no `typecheck`
  script. `turbo.json` has the `typecheck` task.
- `scripts/assert-edge-env-defaults.mjs` still has
  `DUPLICATED_MODULES = ['envConfig.ts', 'jwtSegment.ts', 'callerAuthority.ts']`.
- The tracked tree was clean before this wrap-up. An ignored
  `node_modules/.bin/deno` is present in the worktree — residue of the 040
  install, not declared by any tracked `package.json`.

## Origin

Synthesized from spikes: 037, 038, 039, 040

The scripts (`run.sh`, `verify.sh`, `lsp-probe.mjs`) locate the repo as
`../../..` from their own directory. That resolves correctly from
`.planning/spikes/<spike>/` and not from the copies under `.claude/skills/spike-findings-voting-advice-application-gsd/sources/` — run them
from `.planning/spikes/`, or copy them back there first. The `.patch` files
apply from the repo root from either location.

Source files available in (code and captured output only — the write-ups are
`.planning/spikes/<spike>/README.md`, not copied here):

- `.claude/skills/spike-findings-voting-advice-application-gsd/sources/037-deno-check-functions/` — `deno.json`, `run.sh`,
  `baseline-errors-deno-2.9.7.txt`
- `.claude/skills/spike-findings-voting-advice-application-gsd/sources/038-editor-blast-radius/` — `lsp-probe.mjs`,
  `results-deno-2.9.7-no-node_modules.txt`
- `.claude/skills/spike-findings-voting-advice-application-gsd/sources/039-shared-module/` — `shared-module.patch`,
  `verify.sh`, `guard-and-test-fallout.txt`
- `.claude/skills/spike-findings-voting-advice-application-gsd/sources/040-toolchain-wiring/` — `deno.json`,
  `toolchain.patch`, `type-fixes.patch`, `vscode-settings.example.json`,
  `lsp-probe-with-node_modules-deno-2.9.6.txt`
