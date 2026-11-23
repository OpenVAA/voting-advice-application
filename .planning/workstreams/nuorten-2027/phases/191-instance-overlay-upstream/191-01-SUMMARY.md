---
phase: 191-instance-overlay-upstream
plan: 01
subsystem: app-shared settings / build
tags: [instance-overlay, static-settings, zod, tsup, esbuild-plugin, turborepo]
requires: []
provides:
  - StaticSettingsSchema (strict at every level) with compile-time parity against StaticSettings
  - resolveStaticSettings({ base, overlay, source }) => StaticSettings
  - instanceStaticSettings tsup/esbuild plugin (inert without instance/staticSettings.json)
  - optional StaticSettings.logo and six optional *-content colours per theme
  - packages/app-shared/turbo.json hashing $TURBO_ROOT$/instance/staticSettings.json
affects:
  - Plan 02 (theme transform and logo fallback consume colors.*-content and logo)
  - every consumer of @openvaa/app-shared dist (frontend SSR + client, llm, argument-condensation, dev-seed, docs)
tech-stack:
  added: []
  patterns:
    - esbuild onLoad module substitution registered only when the overlay file exists
    - zod strictObject schema plus a deep-required mutual-assignability type for schema/type parity
key-files:
  created:
    - packages/app-shared/src/settings/staticSettings.schema.ts
    - packages/app-shared/src/settings/staticSettings.schema.test.ts
    - packages/app-shared/src/settings/resolveStaticSettings.ts
    - packages/app-shared/src/settings/resolveStaticSettings.test.ts
    - packages/app-shared/tsup.config.test.ts
    - packages/app-shared/turbo.json
    - packages/app-shared/tsconfig.config.json
  modified:
    - packages/app-shared/src/settings/staticSettings.type.ts
    - packages/app-shared/tsup.config.ts
    - packages/app-shared/package.json
decisions:
  - "Schema/type parity compares both the plain types and their DeepRequired forms: mutual assignability alone treats { a?: X } and {} as equal, so a dropped optional key (logo) passed typecheck"
  - "StaticSettingsSchema and resolveStaticSettings stay out of the app-shared barrel, so dist/index.js is byte-identical without an overlay; only tsup.config.ts imports them"
  - "An overlay setting dataAdapter is rejected before the merge (the hosted-settings guards read it from staticSettings.ts)"
requirements: [SC-1, SC-3]
metrics:
  duration: ~15 min
  completed: 2026-11-23
  tasks: 2
  files: 10
---

# Phase 191 Plan 01: Instance static-settings overlay in app-shared's build Summary

`instance/staticSettings.json` is now merged over `staticSettings` with `mergeSettings` inside `@openvaa/app-shared`'s own tsup build and validated against a strict zod `StaticSettingsSchema`. An invalid overlay fails the build with the file and the offending path named. With no overlay the plugin registers nothing, and `dist/index.js` and `dist/index.js.map` stay byte-identical.

## Tasks

| Task | Name | Commits | Files |
| ---- | ---- | ------- | ----- |
| 1 | Optional type seams and StaticSettingsSchema with compile-time parity | f61992766 (RED), bfd66586c (GREEN) | staticSettings.type.ts, staticSettings.schema.ts, staticSettings.schema.test.ts |
| 2 | resolveStaticSettings, the tsup onLoad plugin and app-shared turbo inputs | 4a90e6359 (RED), 2b5331cfd (GREEN) | resolveStaticSettings.ts(+test), tsup.config.ts(+test), turbo.json, tsconfig.config.json, package.json |

## Verification evidence

- `yarn workspace @openvaa/app-shared test:unit`: 14 files, 227 tests passed. The schema file has 53 tests (at least 15 required), and resolver and plugin have 14 tests together.
- `typecheck` exits 0. It now runs `tsc --noEmit --composite false && tsc -p tsconfig.config.json`, which covers `tsup.config.ts` and `tsup.config.test.ts`.
  - **Parity probe, removed `logo`:** deleting the `logo` key from the schema makes typecheck exit 2 (`TS2344: Type 'false' does not satisfy the constraint 'true'`). The file was then restored.
  - **Parity probe, extra key:** adding an extra optional colour key to the schema also exits 2. Restored.
  - **Config probe:** a deliberate type error in `tsup.config.ts` (`name: 42`) makes `typecheck` exit 2. Restored.
- **Byte identity:** `cmp` of `dist/index.js` and `dist/index.js.map` against the baseline passes after every change.
  - The baseline was also proven equal to a build from the pre-plan `staticSettings.type.ts` with no schema file.
  - The committed dist on disk had been stale since Nov 21 because of earlier, unrelated source changes. So the baseline was a fresh build, not that file.
- **Live overlay checks:**
  - With `{"admin":{"email":"overlay@example.org"}}`, the build exits 0. The dist contains `overlay@example.org` once and `first.last@openvaa.org` zero times.
  - With `{"colours":{}}`, the build exits 1 with `instance/staticSettings.json does not produce valid StaticSettings: ✖ Unrecognized key: "colours"`.
  - After `rm` and a rebuild, both `cmp` checks pass again, and `git status --porcelain instance/` is empty.
- **Turbo:** the `--dry=json` `resolvedTaskDefinition.inputs` for app-shared's build is `["../../instance/staticSettings.json","package.json","src/**","tsconfig.*.json","tsconfig.json","tsup.config.ts"]`. Its hash changes from 5789b783747ed496 to ced88bfd4dba1b55 when the overlay file is added. `packages/dev-seed/tests/turboBuildInputsGate.test.ts` still passes (10/10).
- **Greps:**
  - `any` grep: 0 in both files.
  - `staticSettings.schema` in `src/index.ts`: 0.
  - `z.strictObject` count in the schema: 9.
  - `staticSettings.ts` is unchanged.
- **Repository gates:** `lint` (src plus the two root files), `prettier --check packages/app-shared`, `assert:declared-imports`, `assert:declared-binaries`, `assert:comment-hygiene` and `assert:unit-coverage` all exit 0.

## E2E (targeted run, per the 2026-11-09 ruling)

| Run dir | Project | Result | Listed | Executed | Delta vs last full run | Title pins |
| ------- | ------- | ------ | ------ | -------- | ---------------------- | ---------- |
| tests/e2e-runs/191-01-voter-journey | voter-journey | RED, 2 failed (environment, see below) | 4 | 4 | n/a | n/a |
| tests/e2e-runs/191-01-voter-journey-2 | voter-journey | GREEN, exit 0, 4 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, not void | 4 (2 voter-journey + setup/teardown) | 4 | 0 | unchanged |

- **Title pins:** they are in `tests/e2e-runs/191-01-voter-journey-2/titles.txt`. The two voter-journey titles are `voter journey › full voter journey end-to-end` and `number-scale boundary matching › all-min ranks POLAR_MIN above POLAR_MAX; a mid number answer shifts both scores monotonically without flipping the ordering`.
- **Last full-run record:** this is `.planning/workstreams/deployment/phases/189.1-…/evidence/189.1-10-closing-e2e.md` (E2E_TREE_SHA d5216b03, 729 passed).
  - That record has totals only, not per-project titles.
  - The same two `test(...)` titles are in `voter-journey.spec.ts` at d5216b03, so the delta is 0 and no title changed. This plan changes no spec or fixture.
- **Cause of the first, red run:** `TypeError: election.getMostSpecificConstituency is not a function` in the dev server log. The `@openvaa/data` dist on this box was stale: it was built on Nov 21, before the branch's later source changes.
  - `yarn build` fixed it. Afterwards app-shared's dist was still `cmp`-identical to the baseline.
  - This is not caused by this plan, whose output is byte-identical. The run dir is kept.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The parity type did not catch a dropped optional key**
- **Found during:** Task 1, in the acceptance probe "deleting `logo` makes typecheck fail".
- **Issue:** the plain `MutuallyAssignable<z.infer<...>, StaticSettings>` check treats `{}` and `{ logo?: X }` as mutually assignable, so typecheck still exited 0.
- **Fix:** `StaticSettingsSchemaParity` is now a tuple of two checks. One is the plain mutual assignability, which catches required versus optional. The other is the same check over a private `DeepRequired` of both types, which catches a missing or extra optional key at any depth.
- **Files modified:** `packages/app-shared/src/settings/staticSettings.schema.ts`
- **Commit:** bfd66586c

**2. [Rule 3 - Blocking] `tsconfig.config.json` also needs `"declarationMap": false`**
- **Issue:** the shared base sets `declarationMap: true`, which errors (TS5069) once `declaration` and `composite` are false.
- **Fix:** added `"declarationMap": false`. `types` is `["node"]` only, because the test imports from `vitest` explicitly. `@types/node` already resolves, so the package's dependencies are unchanged.
- **Commit:** 2b5331cfd

**3. [Rule 1 - Lint] `preserve-caught-error`**
- **Fix:** the invalid-JSON rethrow in `tsup.config.ts` now passes `{ cause: error }`.
- **Commit:** 2b5331cfd

**4. [Rule 3 - Environment] Stale package dists on the host made the first E2E run red**
- **Fix:** ran `yarn build` and reran under a new run dir. No code change.

## Known Stubs

None. The `logo` and `*-content` seams are absent from the shipped literal by design: Plan 02 consumes them.

## Threat model coverage

| Threat | Mitigation |
| ------ | ---------- |
| T-191-01 | Prototype pollution is blocked by `mergeSettings`' UNMERGED_KEYS and strictObject. A unit case checks that a JSON `__proto__` key leaves `Object.prototype` untouched. |
| T-191-02 | Each format has rejection cases: hex colours with six digits only, the font name charset with trim-equality, and asset URLs limited to a same-origin path or `https:`, with no `//`, `..`, whitespace, quotes, `<>`, `()` or backslash. |
| T-191-03 | A `dataAdapter` key is rejected before the merge. |
| T-191-05 | The overlay path is fixed in `tsup.config.ts`, with no env override. Tests inject paths through the factory only. |

## Self-Check: PASSED

- FOUND: every file listed under key-files.
- FOUND: commits f61992766, bfd66586c, 4a90e6359 and 2b5331cfd.
