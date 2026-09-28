---
phase: 153-build-tooling-config-correctness
plan: 07
subsystem: build-tooling
tags:
  [documentation, import-path-policy, moduleResolution, eslint, catalog, workspace-protocol, REVIEW-CFG-07, D-B6, OQ-4]
status: complete
requires: []
provides:
  - '`packages/shared-config/README.md` — a `devDependencies` snippet that resolves and parses as JSON'
  - '`packages/supabase-types/src/index.ts` — extensionless relative specifiers, repo `.js` count 4 → 0'
  - '`packages/core/src/controller/controller.ts` — warning-free by rename, not by suppression'
  - '`2026-08-28-153-packages-readme-required-devdeps-omits-tsup.md` — both OQ-4 riders in one filing'
  - 'two further `.planning/todos/pending/` filings registering out-of-scope findings'
affects:
  - 'the 49 files that import `@openvaa/supabase-types` (all via the barrel; zero deep-path importers)'
  - "the `database` skill's drift audit — `packages/supabase-types/` is a declared target"
tech-stack:
  added: []
  patterns:
    - 'pre-edit exhaustiveness grep as a halt condition, re-measured at execute time rather than carried from research'
    - 'proving a specifier change cannot change resolution by enumerating the directory, not by asserting the config'
    - 'asserting eslint OUTPUT EMPTINESS, because `eslint` exits 0 on warnings and an `&&` chain therefore gates nothing'
key-files:
  created:
    - .planning/todos/pending/2026-08-28-153-packages-readme-required-devdeps-omits-tsup.md
    - .planning/todos/pending/2026-08-29-153-turbo-cache-replays-torn-declaration-emit.md
    - .planning/todos/pending/2026-08-29-153-extension-bearing-specifier-class-wider-than-js.md
  modified:
    - packages/shared-config/README.md
    - packages/supabase-types/src/index.ts
    - packages/core/src/controller/controller.ts
decisions:
  - 'README snippet uses `workspace:^` + three `catalog:` entries, verified against `packages/core/package.json` as it stands after 153-01 rather than against what 153-01 planned.'
  - '`vitest` added to the snippet as a fourth key, per `packages/README.md`''s required-devDeps sentence, even though that same sentence is the subject of the filed rider.'
  - 'Both `defineSubOperations` parameters prefixed, not just the trailing one — `args: ''after-used''` still flags the leading parameter if only the trailing one is renamed.'
  - 'Rider 2 (`packages/README.md`''s omission of `tsup`) filed, not taken. CONTEXT scopes criterion 7 to two named files.'
  - 'No E2E run. Derived independently on this diff — see § E2E decision. Not inherited from a sibling.'
  - 'The `lint:check` red encountered mid-run was diagnosed to a gitignored build artefact and registered as a finding, NOT fixed in the repo.'
metrics:
  duration: ~50 min
  completed: 2026-08-29
  commits: 4
actuals:
  tokens: 12000
  tasks: 3
  commits: 4
  note: 'chars/4 over the authored diff, measured not estimated. `a843966dd..7f535c91b` is 26 259 chars → 6 565, of which only 2 765 chars / 691 tokens is source — the rest is the three todo filings. This SUMMARY is 21 723 chars → 5 431. Total 47 982 chars → 11 996. Against the plan''s `estimate.tokens: 25000` that is an overestimate of ~2.1×, driven by the plan budgeting for three code changes when the code changes total 16 changed lines; the actual output is overwhelmingly documentation, and the figure would have been ~6 600 had the run not surfaced the two out-of-scope findings.'
---

# Phase 153 Plan 07: Documentation and Import-Convention Correctness (REVIEW-CFG-07, D-B6) Summary

Three small assertions made true — a README that advertises a specifier that can actually resolve, a barrel that follows the repo's own stated import policy, and a base-implementation method that no longer leaves a permanent lint warning — and, along the way, a false-RED `lint:check` traced to a torn build-cache artefact and two of 153-08's stated premises falsified.

## Commits

| Commit       | Message                                                                             |
| ------------ | ----------------------------------------------------------------------------------- |
| `e1f398792`  | `docs(153-07): make the shared-config README's devDependencies snippet resolvable`   |
| `d5327830b`  | `refactor(153-07): drop the .js specifiers from the supabase-types barrel`           |
| `fd10a83ef`  | `fix(153-07): prefix the unused defineSubOperations parameters, and file the OQ-4 riders` |
| `7f535c91b`  | `docs(153-07): register two out-of-scope findings from the 153-07 run`               |

## What was measured

### Task 1 — the README

| Claim | Verdict |
| --- | --- |
| `@openvaa/shared-config` is `"private": true` at version `0.1.0`, so the advertised range resolves to nothing and is on no registry | **CONFIRMED** — read from `packages/shared-config/package.json` |
| "all 14 real consumers use `workspace:^`" | **CONFIRMED, with the arithmetic shown.** The grep returns **15** lines; one is `packages/shared-config/package.json`'s own `"name"` field. 14 real declarations, every one of them `workspace:^`, zero exceptions |
| `tsup` should read `catalog:` "if that is what 153-01 landed" | **RE-READ, not assumed.** `.yarnrc.yml` carries `tsup: ^8.5.1` under `# New entries`; `packages/core/package.json` declares `"tsup": "catalog:"` |
| the reviewer cited `:15`, but the offending line is `:11` | **CONFIRMED** — `:15` was the closing fence |

**Gate, both halves flip-tested** (parameterised copy of the plan's own check, run against five inputs):

| Input | Result |
| --- | --- |
| the committed file | `snippet ok`, exit 0 |
| the pre-edit file from `HEAD` | `JSON.parse failed: Expected double-quoted property name … line 3 column 21`, exit 1 |
| `grep -c '1\.0\.0'` on the pre-edit file | `1` (post-edit: `0`) |
| valid JSON, specifier mutated to `^9.9.9` | `shared-config specifier wrong`, exit 1 |
| trailing comma reintroduced | `JSON.parse failed … line 6 column 1`, exit 1 |

The gate distinguishes all four failure modes it claims to. The new snippet has exactly four keys and no version string anywhere in the file, so the `1.0.0` grep cannot be tripped by the document that satisfies it.

### Task 2 — the barrel

- **Pre-edit exhaustiveness grep: exactly 4**, all four in `packages/supabase-types/src/index.ts`. The halt condition did not fire. **Post-edit: 0.**
- **Resolution safety proven by enumeration, not by assertion.** `packages/shared-config/tsconfig.base.json` sets `module: ESNext` (`:11`) and `moduleResolution: Bundler` (`:12`) — both read, both as cited. More decisively, `packages/supabase-types/src/` contains exactly three files (`column-map.ts`, `database.ts`, `index.ts`), so `./database` and `./database.js` have the **same and only** resolution target. There is no shadowing candidate — no `.d.ts`, no `index/` directory, no emitted `.js`. The change cannot have silently repointed anything.
- **Consumer exhaustiveness re-verified at execute time:** **49** distinct files import `@openvaa/supabase-types`; **zero** import an internal path (`grep '@openvaa/supabase-types/'` over `packages apps tests` and the repo root returns nothing). The four lines were the complete change surface. *Research's "20 importers" is low — the true figure is 49 — but the conclusion it supported (barrel-only, so the four lines are the whole surface) holds.*
- **Runtime-value consumers enumerated** — the barrel exports 5 runtime values alongside the types, and every consumer of them is already covered: `apps/frontend/.../mapRow.ts` (has `mapRow.test.ts`), `packages/dev-seed/src/template/{permittedKeys,collectionNames}.ts` (dev-seed's 599 tests, incl. `assertKnownRowProps.test.ts` which imports `PROPERTY_MAP` directly), and `tests/tests/utils/supabaseAdminClient.ts` (compiled by `typecheck:tests`).
- Diff is specifier-only: symbol lists, `export` / `export type` split and line order byte-identical. No `any`, no suppression.

### Task 3 — the controller

- **Baseline reproduced exactly:** `✖ 2 problems (0 errors, 2 warnings)` at `73:23` and `73:44`. The plan's citation of `:73` for `defineSubOperations`, and `:65` / `:81` for the sibling methods, is **accurate** against the file as it stands.
- **Both parameters prefixed.** Verified necessary, not just cautious: `packages/shared-config/eslint.config.mjs` configures `unused-imports/no-unused-vars` as `warn` with `args: 'after-used'` and `argsIgnorePattern: '^_'`, so renaming only the trailing parameter leaves the leading one flagged.
- **Diff is two lines** — the signature plus the stray blank line between docblock and signature that neither sibling method has. Docblock and no-op body untouched; no comment text changed, so no overlap with Phase 152's `packages/**` sweep. Zero `eslint-disable` in the file.
- **Flip-tested:** fixed file → **0 bytes** of eslint output; pre-edit file restored → **408 bytes** carrying the two warnings; fixed file restored. Both states measured in the same session.

## Falsified premises

Recorded because falsifying inherited claims is what this phase has been for.

### 1. The plan's own `npx eslint` verify is not a gate

The plan's Task 3 verify is `npx eslint … controller.ts && grep … && …`, and its acceptance criterion reads *"exits 0 **with no output**"*. **Measured: `eslint` exits 0 in both states.** The pre-edit file — the one carrying the two warnings the task exists to remove — exits **0**, because the rule severity is `warn` and neither the invocation nor `packages/core`'s `lint` script (`eslint --flag v10_config_lookup_from_file src/`) passes `--max-warnings`.

So the `&&`-chain as written would have passed against a completely untouched file. The criterion is only met by the output-emptiness half, which the automated command does not perform. **This plan gated on output bytes (0 vs 408), not on the exit code.** Anyone re-verifying Task 3 with the plan's literal command is measuring nothing.

This also means the 2 warnings were never failing `lint:check` — D-B6 is a hygiene fix, not the removal of a red.

### 2. Criterion 4's wording is wider than its check (criterion still met)

Must-have 4 says a scan for *"extension-bearing"* relative specifiers returns 0. Scoped to `.js` — which is what the policy it cites (`packages/README.md`'s "Import-path policy." bullet) states, and what that bullet's own verify grep uses — the result is exactly **4 → 0** and the criterion is met.

Read literally as *any* extension, the repo returns **9**: seven in `apps/supabase/supabase/functions/**`, where Deno makes the extension **mandatory and correct**, and two unclassified in `packages/argument-condensation/tests/`. Filed (`2026-08-29-153-extension-bearing-specifier-class-wider-than-js`) so 153-09 does not read the wording gap as an unmet criterion, and so nobody widens the scan without excluding the Deno sources — a naive widening would demand a change that breaks the edge functions.

### 3. Research's "20 importers" of the barrel

Measured **49** distinct importing files. The number is wrong; the claim it supported (all via the barrel, zero deep-path) is right, and was re-verified rather than carried.

## Deviations from plan

### `[Rule 3 — blocking issue, diagnosed and registered, NOT fixed in-repo]` `lint:check` exited 2 on a package this plan does not touch

Mid-Task-3, `yarn lint:check` exited **2**, failing at `@openvaa/dev-seed#typecheck` with ~120 `TS7031`/`TS7006` implicit-`any` errors — **every one of them inside `../matching/dist/index.js`**, the built JavaScript of a package outside this diff.

**Root cause, measured:** `packages/matching/dist` held **0 `*.d.ts` against 27 `*.d.ts.map`** (compare `packages/core/dist`: 19 and 19). With `allowJs: true` + `checkJs: true` in the base tsconfig, a missing `index.d.ts` makes a consumer's `tsc` fall through to the emitted `.js` and type-check unannotated JavaScript. The diagnostic names `packages/matching`, which points away from the actual defect.

**Independence proof.** `matching#build`'s declared `inputs` are `src/**`, `tsconfig.json`, `tsconfig.*.json`, `tsup.config.ts`, `package.json`; this plan's diff touches none of them and nothing under `packages/matching/`. `packages/matching/dist/` is gitignored (`packages/matching/.gitignore:2`). Regenerating that artefact (`rm -rf` + `yarn build --filter=@openvaa/matching --force` → 29 `.d.ts`) and re-running `lint:check` against the **identical working tree and identical diff** produced **exit 0**. Same tree in, opposite verdict out, with only a gitignored generated file differing.

**Nothing under version control was changed to achieve this**, no rule was weakened, and the underlying hazard was registered rather than fixed: `2026-08-29-153-turbo-cache-replays-torn-declaration-emit`. It is the **red** counterpart of the existing `2026-08-23-build-gate-cache-replay-is-not-a-measurement` todo, and the more expensive one — a false red invites the wrong repair (disabling `checkJs`, adding suppressions, or reverting an innocent change).

### `[scope addition]` two extra todos beyond the plan's single named artifact

The plan's `artifacts` names one todo. Two more were filed for the findings above, per D-N2 and this phase's practice. Both are pure registrations — no code, no config, no guard changed.

## E2E — declined, on this diff

Derived on this plan's own diff, not inherited from a sibling.

The diff is 16 changed lines across three files. One is a Markdown document that no build step, test or runtime path reads. One is a parameter rename on **unused** parameters of a **no-op** body — parameter names are not part of the JavaScript calling convention and are not used for TypeScript assignability here, so no behaviour can change. The third is a module-specifier change, which is the only entry with any runtime claim — and it was shown above to be resolution-**identical** by directory enumeration, not by argument: `./database.js` and `./database` have the same single target because `src/` contains exactly three files and no shadowing candidate.

A specifier that failed to resolve would be a **compile** failure, not a silent runtime divergence: these are static `export … from` statements, bundled at build time, with no dynamic or lazy path. Every runtime value the barrel exports has an already-green unit test on its consumer (enumerated above). `typecheck` 22/22, `build` 14/14, `test:unit` 25/25 and `svelte-check` 0/0 on both frontend and docs all exercise exactly that surface.

The phase-close full-suite run belongs to 153-09 per operator ruling D1.

## Gates

All against the final tree, all matching the operator's stated baselines exactly.

| Gate | Result | Baseline |
| --- | --- | --- |
| `yarn build` | **14/14** ✅ | 14/14 |
| `yarn typecheck` | **22/22** ✅ | — |
| `yarn test:unit` | **25/25** ✅ | 25/25 |
| ↳ dev-seed | **599 tests / 52 files** ✅ | 599/52 |
| ↳ frontend | **54 files / 816 tests** ✅ | 54/816 |
| `yarn lint:check` | **exit 0**, all 10 chain links ✅ | 22/22 |
| ↳ comment-hygiene | 1579 files scanned, **0** violations, 2 of 2 rules live | 1579/0 |
| ↳ edge-env-defaults | 17 files scanned, **0** violations, 3 of 3 checks live | 17/0 |
| ↳ declared-binaries | 16 workspaces, 20 invocations, **0** violations | 16/0 |
| ↳ i18n-catalog-namespaces | 598 keys, **0** violations | — |
| ↳ a11y-scan-wiring | **0** violations | — |
| ↳ node-engine | `v24.14.1` satisfies `>=22` — OK | — |
| `yarn format:check` | **clean** ✅ | clean |
| `npx eslint` on `controller.ts` | **0 bytes output** (was 408) ✅ | 2 warnings |
| `yarn db:lint:sql` | not run — pre-existing red by construction, never a regression | n/a |

## Requirement disposition

**REVIEW-CFG-07 — marked complete.** Both particulars its text names are measured-met:

1. *"`packages/shared-config/README.md` no longer advertises a `^1.0.0` that does not exist"* — `grep -c '1\.0\.0'` returns **0**; the replacement is `workspace:^`, the form all 14 real consumers declare.
2. *"`packages/supabase-types/src/index.ts` uses the TS-internal import convention (no `.js` specifiers) that `packages/README.md` states"* — repo-wide `.js` count **4 → 0**.

**⚠ One clause I am NOT claiming, and the operator should rule on it before 153-09 closes the phase.** The requirement's preamble is *"The repo's documentation and import conventions are true of the repo"*. That preamble is **still not fully true**: `packages/README.md`'s required-devDeps sentence names `@openvaa/shared-config`, `typescript` and `vitest` while the adjacent bullet states the canonical build script invokes `tsup` — and every one of the eight workspaces REVIEW-CFG-01 caught matches that sentence exactly, which is why the omission is plausibly its origin.

I read the colon in the requirement as introducing the enumeration that *defines* the preamble for this requirement, so I marked it complete on its two named particulars rather than holding a measured, finished change hostage to a third file the criterion does not name. **If you read the preamble as an independent clause, this row should be reverted to Pending** — the unmet clause is the preamble, and the reason is `packages/README.md`, filed at `2026-08-28-153-packages-readme-required-devdeps-omits-tsup` with its one-line fix. Research assumption **A5** (that the omission is oversight rather than deliberate) remains **unverified**; nothing was measured to distinguish the two.

**D-B6** — discharged. Warning-free by rename, no suppression, diff bounded to two lines.

## For 153-08 — two of your stated premises are falsified

Reported here rather than by editing `153-08-PLAN.md`, per instruction.

### A. There are **FOUR** live drifts today, not two — and two of them are outside your `files_modified`

`153-08-PLAN.md` states the script *"exits 1 on this tree today with DRIFT for `data` and `database`"*, its must-have requires `exit 0` at phase HEAD, and its `files_modified` lists `.claude/skills/{data,database,ship-review-stack}/SKILL.md`.

**Measured at `7f535c91b`:**

```
data        DRIFT  5 commits, 13 files
database    DRIFT  21 commits, 69 files   (apps/supabase/ 18c/66f + packages/supabase-types/ 3c/3f)
filters     DRIFT  2 commits, 1 file
matching    DRIFT  1 commit,  3 files
Checked: 5  Drifted: 4  Skipped: 3     TRUE_EXIT = 1
```

`filters` and `matching` drift on Phase **152**'s comment sweeps — `dce80642f` (*"unwrap 3,796 forced line breaks across packages/"*) and `87e02f40b` — both already on this branch and **nothing to do with 153-07**. All four skills share the same baseline commit `14afb2d80` (2026-08-17).

**Consequence:** resolving only `data` and `database` leaves the audit at **exit 1**, so 153-08's `exit 0` must-have is unreachable as scoped. It needs `filters` and `matching` too, or an explicit operator ruling narrowing the criterion. Note its own prohibition forbids reaching `exit 0` by emptying `targets:` or forcing the exit — so widening the file set is the only compliant route.

### B. "153-07's edit re-reddens `database`" is true but much weaker than stated

`database` was **already** DRIFT before this plan and would be DRIFT without it: `apps/supabase/` alone contributes **18 commits / 66 files** since the skill's baseline, and `packages/supabase-types/` was already dirty from `133e35f79` (153-06) and `7390fd983` (152-09) before my `d5327830b` made it three.

**The ordering constraint still stands** and is still load-bearing — 153-08's freshness commit must postdate `d5327830b` or `packages/supabase-types/` re-drifts immediately — but the *reason* is "must be last", not "153-07 turns it red". Do not budget a review of `packages/supabase-types/` as if my 4-line specifier change were the drift; the 69-file `apps/supabase/` surface is.

### C. Measurement hazard — the audit's exit code is masked by a pipe

`bash .claude/scripts/audit-skill-drift.sh | tail -30; echo $?` reports **0** — that is `tail`'s exit, not the script's. The true exit is **1**. Capture it as `script > /dev/null 2>&1; echo $?` or with `PIPESTATUS`. Given 153-08's central claim is about an exit code, this is worth guarding against.

## Findings registered (not fixed)

| Todo | Finding |
| --- | --- |
| `2026-08-28-153-packages-readme-required-devdeps-omits-tsup` | Both OQ-4 riders. Rider 2 (`packages/README.md` omits `tsup`) open, with its one-line fix and A5 flagged unverified; rider 1 (catalog entry) recorded as **answered by 153-01**, not deferred |
| `2026-08-29-153-turbo-cache-replays-torn-declaration-emit` | Turbo's build cache can replay a `dist/` with 0 `.d.ts` and 27 `.d.ts.map`, producing a false RED in a downstream workspace that names the wrong package |
| `2026-08-29-153-extension-bearing-specifier-class-wider-than-js` | 9 `.ts`-bearing relative specifiers survive; 7 are Deno and **must** keep their extensions |

## Known Stubs

None. No placeholder, empty literal, `TODO` or `FIXME` was introduced; no test was skipped; every `<verify>` in the plan was run, and where a plan-supplied check was found not to gate (the `eslint` `&&`-chain) a stricter check was substituted and both halves recorded.

## Threat Flags

None. The diff adds no network endpoint, auth path, file-access pattern or schema change. `T-153-26` (specifier tampering) is discharged by directory enumeration plus green `typecheck`/`build`/`test:unit`; `T-153-27` by the parseable-JSON assertion and the re-read of `packages/core/package.json`; `T-153-28` by the two-line diff bound and the zero-`eslint-disable` assertion; `T-153-29` by the filed rider; `T-153-30` was accepted at planning and is unchanged.

## Self-Check: PASSED

All three created files present; all three modified files carry the described changes; all four commit hashes resolve in `git log`.
