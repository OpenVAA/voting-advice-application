---
phase: 167-origin-main-vestige-cleanup
plan: 04
subsystem: deps
tags: [eslint, eslint-plugin-svelte, flat-config, yarn, audit-baseline, dependency-hygiene]

requires:
  - phase: 167-origin-main-vestige-cleanup
    provides: 167-03 commit ③ (879d0ccf0) declared js-yaml in @openvaa/llm, so ④ can remove it from question-info and argument-condensation
provides:
  - commit ④ (ddcd396ef) chore[deps]. It switches the frontend ESLint config to an explicit eslint-plugin-svelte import (svelte.configs['flat/prettier']) and removes 21 unused manifest entries across five workspaces. It also hand-edits the audit baseline for the jest-dom removal
  - before/after proof that the D-12 switch changed no lint finding, and lint-red proofs (frontend, docs before and after) that the rules still fire
affects: [167-05, 167-06, 168, 169]

actuals:
  tokens: 12689
  tasks: 3
  commits: 1
plan_head_before: 9da97cb46709aa3ca63944835f1424e6844043db
plan_head_after: ddcd396efa0052848915a1725ab5e8ca1b285454

tech-stack:
  added: []
  patterns:
    - "Before/after ESLint equivalence: normalise `eslint -f json` output to sorted `relpath:line:col ruleId severity message` lines and diff them, plus `--print-config` diffs on representative .ts and .svelte files"
    - "Lint-red probe: a temporary file with an unsorted import pair and a `: any` must make lint exit 1 and name both rule ids. Exit 2 (config failed to load) never counts as red"

key-files:
  created: []
  modified:
    - apps/frontend/eslint.config.mjs
    - apps/frontend/package.json
    - apps/docs/package.json
    - packages/llm/package.json
    - packages/question-info/package.json
    - packages/argument-condensation/package.json
    - packages/argument-condensation/README.md
    - security/audit-baseline.json
    - yarn.lock

key-decisions:
  - "eslint-plugin-svelte comes off criterion 4's removal list. It is used, and since ④ it is imported by name in apps/frontend/eslint.config.mjs (D-12)"
  - "The frontend's @eslint/eslintrc and @eslint/js are removed in ④, not filed as D-12 residue. Nothing imports them after the FlatCompat block went, and the frontend lint-red check passed after the removal"
  - "@vitest/coverage-v8 is removed (D-17). Nothing references it, and its ^3.2.4 pin sits outside the catalog, so it would drift from Phase 169's vitest bump. Anyone who wants local coverage can run `vitest --coverage`, which names the missing provider"
  - "Only the lodash row 1115806 left the baseline. The other four 'no longer appear' ids (js-yaml 1123911, 1123912, 1138114, 1138115) were already stale before this phase and stay for Phase 169's reviewed update"
  - "VEST-04 is marked complete. Its last clauses (unused declarations removed, eslint-plugin-svelte explicit with unchanged output, rules proven to fire, baseline hand-edited in the jest-dom commit) land in ④. The js-yaml clause landed in ③"

patterns-established:
  - "A phantom (undeclared) import resolves whatever hoisting leaves at the root: removing docs' `globals` moved shared-config's `globals` import from 16.5.0 to 15.14.0. Record the root version before and after any removal that might feed such an import"

requirements-completed: [VEST-04]

coverage:
  - id: D1
    description: "apps/frontend/eslint.config.mjs imports eslint-plugin-svelte by name and spreads svelte.configs['flat/prettier']. The FlatCompat block, its two imports and the path/fileURLToPath/__dirname setup are gone. The lint findings are identical before and after"
    requirement: VEST-04
    verification:
      - kind: other
        ref: "grep counts on apps/frontend/eslint.config.mjs: import line 1, flat/prettier 1, FlatCompat|@eslint/eslintrc|compat.extends 0"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend lint -f json (before exit 0 / after exit 0 / after-removals exit 0); normalised findings diff before-vs-after and after-vs-after2 both exit 0; 849 files, 172 .svelte, 0 errors, 1 warning each"
        status: pass
      - kind: other
        ref: "eslint --print-config diffs: 4 .ts probes identical; OpenVAALogo.svelte differs only on line 2847 \"processor\": \"eslint-plugin-svelte@2.46.1\" vs \"svelte/svelte\""
        status: pass
      - kind: other
        ref: "TURBO_FORCE=true yarn lint:check before exit 0, after exit 0"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/_guards/eslint-*-guard.test.ts via yarn workspace @openvaa/frontend test:unit -> exit 0 (126 files, 2018 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "21 unused manifest entries removed across five workspaces, each confirmed to have no importer first by `git grep` exit 1. typedoc, typedoc-plugin-markdown, eslint-plugin-svelte, eslint-config-prettier and the root dotenv are kept. The yarn.lock diff adds no version, resolution or checksum line"
    requirement: VEST-04
    verification:
      - kind: other
        ref: "git grep -l -F '<dep>' -- <workspace> ':!<workspace>/package.json' -> exit 1 for all 21 entries"
        status: pass
      - kind: other
        ref: "Task 3 verify node script over apps/docs/package.json -> exit 0, empty list; root package.json still declares dotenv"
        status: pass
      - kind: other
        ref: "git diff -U0 -- yarn.lock | grep -E '^\\+  (resolution|version|checksum):' -> exit 1 after each of the three yarn install runs"
        status: pass
    human_judgment: false
  - id: D3
    description: "Lint rules still fire after the ESLint-dependency removals. The frontend probe and the docs probe config (before and after the docs removals) each exit 1 naming simple-import-sort/imports and @typescript-eslint/no-explicit-any. The clean runs exit 0"
    requirement: VEST-04
    verification:
      - kind: other
        ref: "frontend: yarn workspace @openvaa/frontend lint with apps/frontend/src/lib/zzLintRedProbe.ts -> exit 1 (1:1 simple-import-sort/imports, 4:17 @typescript-eslint/no-explicit-any); after deleting it -> exit 0"
        status: pass
      - kind: other
        ref: "docs: eslint -c .lint-red-probe.eslint.config.js navigation.ts -> 0 before / 0 after; zzLintRedProbe.ts -> 1 before / 1 after, both rule ids named each time"
        status: pass
    human_judgment: false
  - id: D4
    description: "security/audit-baseline.json lost exactly the lodash row 1115806 (GHSA-r5fr-rjxr-66jc, via @testing-library/jest-dom), after yarn audit:deps listed it under 'no longer appear'. The note now reads 'These 69 findings (63 high, 6 critical)'. --update-baseline was never run"
    requirement: VEST-04
    verification:
      - kind: other
        ref: "Task 2 verify node script -> prints 69 {\"high\":63,\"critical\":6} true, exit 0; yarn why lodash -> empty output; audit pre-edit Note line lists 1115806, post-edit log has 0 occurrences"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/auditBaselineShape.test.ts via yarn workspace @openvaa/dev-seed test:unit -> exit 0 (66 files, 897 tests)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every touched workspace builds and tests green, and so do the aggregate gates on the commit-④ tree"
    verification:
      - kind: unit
        ref: "llm / question-info / argument-condensation build and test:unit -> all exit 0 (39, 22, 30 tests)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/docs check -> 0 (611 files, 0 errors, 0 warnings); docs build -> 0; TURBO_FORCE=true yarn lint:check -> 0; yarn format:check -> 0; TURBO_FORCE=true yarn test:unit -> 0 (25/25, 0 cached); TURBO_FORCE=true yarn build -> 0 (14/14 incl. docs and frontend, 0 cached); TURBO_FORCE=true yarn typecheck -> 0 (23/23)"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-10-02
status: complete
---

# Phase 167 Plan 04: Unused-dependency removal and explicit eslint-plugin-svelte import Summary

**Commit ④ (`ddcd396ef`) makes three changes:**

- **ESLint config:** the frontend config now imports `eslint-plugin-svelte` by name and spreads `svelte.configs['flat/prettier']` in place of the `FlatCompat` extends. A normalised before/after findings diff came out empty.
- **Dependencies:** 21 declarations that nothing imports are gone from five workspaces.
- **Audit baseline:** the lodash row whose only path was `@testing-library/jest-dom` is deleted by hand, and the note now reads 69 findings (63 high, 6 critical).

Temporary lint-red probes confirmed that both guarded rules still fire in the frontend, and in docs before and after the removals.

## Performance

- **Duration:** about 11 min
- **Started:** 2026-10-02T06:09:01Z
- **Completed:** 2026-10-02T06:19:45Z
- **Tasks:** 3 (one code commit, per D-24 ④)
- **Files modified:** 9

## Accomplishments

### D-12: explicit import, proven equivalent

The edit to `apps/frontend/eslint.config.mjs`:
- deletes `node:path`, `node:url`, `@eslint/eslintrc`, `@eslint/js` and the `__filename` / `__dirname` / `compat` block;
- adds `import svelte from 'eslint-plugin-svelte';` between the `@typescript-eslint/parser` and `globals` imports;
- replaces `...compat.extends('plugin:svelte/prettier'),` with `...svelte.configs['flat/prettier'],` in the same position.

Before the edit, `grep -n -E "path\.|fileURLToPath|__dirname|__filename|compat\.|js\.configs"` matched only header lines 2, 10, 11, 13, 14, 15 and the line-188 extends. Nothing else changed in the file.

Every exit below was read directly. `S` is the session scratchpad.

| Check | Before | After the edit | After the 3 frontend removals |
|---|---|---|---|
| `yarn workspace @openvaa/frontend lint -f json -o $S/…` | exit 0 | exit 0 | exit 0 |
| Files / `.svelte` / errors / warnings | 849 / 172 / 0 / 1 | 849 / 172 / 0 / 1 | 849 / 172 / 0 / 1 |
| Normalised findings diff | — | **empty** (vs before) | **empty** (vs after) |
| `TURBO_FORCE=true yarn lint:check` | exit 0 | exit 0 | — |

The one finding is the same in every run: `src/lib/contexts/candidate/candidateContext.svelte.test.ts:19:9 unused-imports/no-unused-vars 1 'question' is assigned a value but never used.` The file count is 849 instead of RESEARCH's dry-run 854, because commit ② removed the cache-proxy files.

`--print-config` was run from `apps/frontend` (`../../node_modules/.bin/eslint --flag v10_config_lookup_from_file --print-config <file>`, each exit 0) and the results diffed:

| Probe | Diff |
|---|---|
| `src/lib/supabase/safeGetSession.ts` | identical |
| `src/routes/+layout.server.ts` | identical |
| `src/lib/contexts/app/appContext.svelte.ts` | identical |
| `src/lib/supabase/safeGetSession.test.ts` | identical |
| `src/lib/components/openVAALogo/OpenVAALogo.svelte` | one line only: `"processor": "eslint-plugin-svelte@2.46.1"` → `"processor": "svelte/svelte"`. This is the same processor object serialised two ways |

The frontend unit suite exited 0 (126 files, 2018 tests). It includes the four `src/lib/_guards/eslint-*-guard.test.ts` files, which build `new ESLint({ flags: ['v10_config_lookup_from_file'] })` against the real edited config.

### D-16: lint-red records

| Run | Exit | Rule ids named |
|---|---|---|
| Frontend, `yarn workspace @openvaa/frontend lint` with `apps/frontend/src/lib/zzLintRedProbe.ts` (after the frontend ESLint removals) | **1** | `1:1 simple-import-sort/imports`, `4:17 @typescript-eslint/no-explicit-any` |
| Frontend, same command after deleting the probe | 0 | — |
| Docs probe config, clean target `src/lib/utils/navigation.ts`, BEFORE docs removals | 0 | — |
| Docs probe config, `src/lib/utils/zzLintRedProbe.ts`, BEFORE docs removals | **1** | `1:1 simple-import-sort/imports`, `4:17 @typescript-eslint/no-explicit-any` |
| Docs probe config, clean target, AFTER docs removals + `yarn install` | 0 | — |
| Docs probe config, red probe, AFTER | **1** | both, same positions |

The docs probe config, `apps/docs/.lint-red-probe.eslint.config.js`, has the same three entries as `apps/docs/eslint.config.js`. The difference is that it loads `eslint-config-prettier` through `createRequire(import.meta.url)`. All three probe files were deleted after use and were never staged. A `git log --all` over the three paths returns 0 commits.

### Docs real-config failure (pre-existing, for Phase 168 D-15)

`../../node_modules/.bin/eslint src/lib/utils/navigation.ts` in `apps/docs` exits **2** both before and after. Both runs fail with the same first error line: `Error [ERR_INTERNAL_ASSERTION]: This is caused by either a bug in Node.js or incorrect usage of Node.js internals.` The result is unchanged and was not fixed.

The cause comes from RESEARCH's bisection: the static `eslint-config-prettier` import beside the static `@openvaa/shared-config/eslint` import, which itself `require`s the same CJS module through `compat.extends(…, 'prettier')`. This plan did not re-bisect it, so the cause is **UNCONFIRMED** here. The `createRequire` probe loading cleanly is consistent with it. Phase 168 D-15 should record it as confirmed or not.

### Manifest removals

Every entry was checked first: `git grep -l -F '<dep>' -- <workspace> ':!<workspace>/package.json'` exited 1 for each one. For argument-condensation's `js-yaml`, `README.md` was also excluded.

| Workspace | Removed | Decision |
|---|---|---|
| `apps/frontend` | `@eslint/eslintrc`, `@eslint/js`, `@typescript-eslint/eslint-plugin` | D-12 knock-on, D-05 |
| `apps/frontend` | `@testing-library/jest-dom` | D-19 |
| `apps/frontend` | `@vitest/coverage-v8` | D-17 |
| `packages/llm` | `jsonrepair` | D-18 |
| `packages/question-info` | `js-yaml`, `@types/js-yaml` | D-13 |
| `packages/argument-condensation` | `js-yaml`, `@types/js-yaml`, `dotenv` (and the README's `js-yaml` bullet) | D-05, D-18 |
| `apps/docs` | `@eslint/js`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-simple-import-sort`, `globals`, `typescript-eslint` | D-14 |
| `apps/docs` | `@eslint/compat`, `@tailwindcss/forms`, `rehype-autolink-headings`, `unist-util-visit`, `vitest-browser-svelte` | D-15 |

Kept on purpose:
- `eslint-plugin-svelte` in the frontend: it is **taken off criterion 4's removal list** because it is used, and now visibly so (D-12).
- `@typescript-eslint/parser`, `globals` and `svelte-eslint-parser` in the frontend.
- `typedoc`, `typedoc-plugin-markdown`, `eslint`, `eslint-config-prettier`, `eslint-plugin-svelte` and `@openvaa/shared-config` in docs (D-15, orchestrator ruling 2).
- The root `dotenv` (D-18).

The D-17 reason for removing `@vitest/coverage-v8`: nothing references it, and its `^3.2.4` pin sits outside the catalog, where it would drift from Phase 169's vitest bump. `vitest --coverage` names the missing provider for anyone who wants local coverage.

**Lockfile.** There were three `yarn install` runs, each exit 0. Each was followed by `git diff -U0 -- yarn.lock | grep -E '^\+  resolution:'`, and that grep exited 1 every time (nothing added). The stricter `^\+  (resolution|version|checksum):` check also exits 1. Commit ④'s `yarn.lock` change is 9 insertions and 654 deletions. The 9 added lines are all descriptor headers whose range lists got shorter, for example `"debug@npm:4, debug@npm:^4.1.1, …"` → `"debug@npm:4, debug@npm:^4.3.1, …"`. No package was installed or fetched.

### D-20: baseline hand-edit

1. `yarn why lodash` exited 0 with **empty output**, so no path to lodash remains.
2. `yarn audit:deps` before the edit exited 1, as expected (D-25). Its `Note:` line read: `5 accepted advisory(ies) no longer appear …: 1123911, 1123912, 1138114, 1138115, 1115806`.
   - `1115806` is lodash, GHSA-r5fr-rjxr-66jc, via `@testing-library/jest-dom@6.6.3`. It left with this commit's removal.
   - `1123911` and `1138115` are js-yaml (GHSA-52cp-r559-cp3m / GHSA-5p4m-2wfm-xmqj) via `@eslint/eslintrc@3.3.3, @openvaa/argument-condensation`. `1123912` and `1138114` are the same two GHSAs via `read-yaml-file@1.1.0`. All four were already stale before this phase: RESEARCH counted 66 of 70 rows seen. They **stay** for Phase 169's reviewed update.
3. Deleted the whole `"id": 1115806` object by hand.
4. The computed count was `69 {"high":63,"critical":6}`, and the note now opens "These 69 findings (63 high, 6 critical)". `recorded` and every other field are unchanged. `git diff` shows one removed object and one changed `note` line.
5. `yarn audit:deps` after the edit exited 1. `1115806` occurs 0 times in the log. The Note line now lists only the four js-yaml ids. Summary: `9 new advisory(ies) at high+, 65 accepted`.
   - The NEW set is the same 9 ids / 5 GHSAs as RESEARCH's snapshot:
     - brace-expansion 1240104, 1240105, 1240107 (GHSA-qhr7-859c-m2p7) and 1240108, 1240109, 1240111 (GHSA-6j4f-fj2g-mc7p);
     - devalue 1240870 (GHSA-j22f-vq7h-c4qm) and 1240872 (GHSA-mcm9-63f2-9j32);
     - undici 1240042 (GHSA-rfgv-xxqx-mfg5).
   - The formal D-25 same-moment comparison belongs to the gates plan.
6. `yarn workspace @openvaa/dev-seed test:unit` exited 0 (66 files, 897 tests), which includes `auditBaselineShape.test.ts`. `--update-baseline` was never run (PROH-167-06).

### `globals` root version

| | Version |
|---|---|
| Root `node_modules/globals`, before the docs removals | 16.5.0 |
| After `yarn install` | **15.14.0** |

The version **changed**, as RESEARCH Pitfall 6 anticipated. Removing docs' `"globals": "^16.5.0"` left no root-level consumer of 16.x, and docs' `eslint-plugin-svelte@3.13.1` still gets its `^16.0.0` copy nested. `packages/shared-config/eslint.config.mjs` imports `globals` without declaring it. Both shared-config and the frontend now resolve the root 15.14.0, which is the catalog's `^15.14.0`.

The effect on the frontend:
- The `--print-config` result for `safeGetSession.ts` and `OpenVAALogo.svelte` changes only in `languageOptions.globals`: 1193 → 1151 keys, 0 added, and everything else identical.
- The frontend lint findings are **still identical** to Task 1's AFTER set (normalised diff empty, 849 files, 0 errors, 1 warning). shared-config sets `no-undef: 'off'`.
- `TURBO_FORCE=true yarn lint:check` exits 0.

Declaring `globals` in `@openvaa/shared-config` is the todo that 167-06 files (orchestrator ruling 7).

## Task Commits

1. **Task 1: frontend ESLint slice (tracer).** Left uncommitted, as the plan requires. The tracer gate re-ran `<verify>` (automated-only, end-of-phase mode) and it passed: grep counts 1/1/0, lint exit 0, unit exit 0, empty status.
2. **Task 2: remaining package entries and baseline edit.** Uncommitted until Task 3.
3. **Task 3: docs entries, gates, and commit ④.** Commit `ddcd396ef` (chore): `chore[deps]: remove unused dependencies; import eslint-plugin-svelte explicitly`. It contains exactly the nine planned files. The pre-commit hooks ran.

**Plan metadata:** the docs commit that follows this SUMMARY.

## Gates on the commit-④ tree (exit codes read directly)

| Gate | Exit |
|---|---|
| `yarn workspace @openvaa/docs check` | 0 (611 files, 0 errors, 0 warnings) |
| `yarn workspace @openvaa/docs build` | 0 |
| `TURBO_FORCE=true yarn lint:check` | 0 |
| `yarn format:check` | 0 |
| `TURBO_FORCE=true yarn test:unit` | 0 (25/25, 0 cached) |
| `TURBO_FORCE=true yarn build` | 0 (14/14 incl. `@openvaa/docs` and `@openvaa/frontend`, 0 cached) |
| `TURBO_FORCE=true yarn typecheck` | 0 (23/23) |
| llm / question-info / argument-condensation `build` + `test:unit` | all 0 (39 / 22 / 30 tests) |
| `yarn workspace @openvaa/dev-seed test:unit` | 0 |
| `git status --porcelain` after the commit | only the untracked `261001-n8y/gate-evidence/` directory |

## Files Created/Modified

- `apps/frontend/eslint.config.mjs`: explicit `eslint-plugin-svelte` import with `svelte.configs['flat/prettier']`; the `FlatCompat` block is gone
- `apps/frontend/package.json`: five devDependencies removed
- `apps/docs/package.json`: eleven devDependencies removed
- `packages/llm/package.json`: `jsonrepair` removed
- `packages/question-info/package.json`: `js-yaml` and `@types/js-yaml` removed
- `packages/argument-condensation/package.json`: `js-yaml`, `@types/js-yaml` and `dotenv` removed
- `packages/argument-condensation/README.md`: the `js-yaml` dependency bullet removed
- `security/audit-baseline.json`: row 1115806 deleted; note count 70 (64 high) → 69 (63 high)
- `yarn.lock`: removals only

## Decisions Made

See `key-decisions` above. In short:
- `eslint-plugin-svelte` is kept and now imported by name.
- The frontend's `@eslint/eslintrc` and `@eslint/js` go in ④, so no D-12 residue todo is needed.
- `@vitest/coverage-v8` is removed for the D-17 reason.
- Only the lodash baseline row leaves.
- VEST-04 is complete.

Before marking VEST-04 complete, I ran a read-only scan of every workspace manifest. It lists each declared dependency that no file in its workspace mentions, outside `package.json`. Every hit is used:
- through a script binary: `typescript` (tsc), `tsx`, `eslint`, `prettier`, `svelte-check`;
- or through a config string: shared-config's `compat.extends(…, 'prettier')` loads `eslint-config-prettier`.

The one exception is `typedoc-plugin-markdown`, which D-15 keeps for Phase 168.

## Deviations from Plan

None. The plan executed as written.

A note, not a deviation: removing the last `dependencies` entry from `packages/argument-condensation/package.json` with a line-delete left a trailing comma. The JSON parse check caught it at once, and the comma was removed before `yarn install`. The committed file is valid JSON.

## Issues Encountered

- The root `globals` version shifted from 16.5.0 to 15.14.0 when docs' entry was removed. The section above covers it. It has no effect on findings, but it is a real change to the effective `languageOptions.globals` for every workspace that lints through `@openvaa/shared-config`. The fix is to declare `globals` in shared-config (167-06's todo).
- The real docs ESLint config still fails to load (exit 2, `ERR_INTERNAL_ASSERTION`), the same before and after. It is pre-existing and Phase 168 fixes it. The root cause is UNCONFIRMED by this plan; see above.

## User Setup Required

None.

## Next Phase Readiness

- 167-05 (commits ⑤ and ⑥) can start. The working tree is clean apart from the existing untracked `gate-evidence/` directory.
- For 167-06:
  - File the "declare `globals` in `@openvaa/shared-config`" todo. Its trigger is now observed: root `globals` is 15.14.0.
  - The four stale js-yaml baseline ids (1123911, 1123912, 1138114, 1138115) are Phase 169's.
  - The D-25 NEW set at this commit is the 9 ids / 5 GHSAs listed above.

---
*Phase: 167-origin-main-vestige-cleanup*
*Completed: 2026-10-02*

## Self-Check: PASSED

- Commit `ddcd396ef` exists on `fix/888-review-findings` with subject `chore[deps]: remove unused dependencies; import eslint-plugin-svelte explicitly`. Its file list is exactly the nine planned files.
- `git rev-list --count 9da97cb46..ddcd396ef` = 1.
- `apps/frontend/eslint.config.mjs` contains `import svelte from 'eslint-plugin-svelte'` and `svelte.configs['flat/prettier']`, and no `FlatCompat`.
- No probe file exists, and none appears in any commit.
