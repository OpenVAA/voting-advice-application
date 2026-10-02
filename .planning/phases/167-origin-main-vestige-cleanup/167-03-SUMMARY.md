---
phase: 167-origin-main-vestige-cleanup
plan: 03
subsystem: deps
tags: [js-yaml, tsup, yarn-catalog, llm, packaging]

requires:
  - phase: 167-origin-main-vestige-cleanup
    provides: 167-02 commit ② (837b895c4) as the base for commit ③
provides:
  - commit ③ (879d0ccf0) declares js-yaml (dependency) and @types/js-yaml (devDependency) in @openvaa/llm via catalog:
  - packages/llm/dist/index.js imports js-yaml instead of inlining it
affects: [167-04, 169]

actuals:
  tokens: 255
  tasks: 2
  commits: 1
plan_head_before: 957ef0a612a4bf701628f49154bd813c78fd4a2e
plan_head_after: 879d0ccf025368960f4345b2aa60d0c43f4e45b6

tech-stack:
  added: []
  patterns:
    - "A package declares every runtime import in dependencies. tsup externalises exactly dependencies + peerDependencies, so the dist output shows whether a dependency is declared"

key-files:
  created: []
  modified:
    - packages/llm/package.json
    - yarn.lock

key-decisions:
  - "The lockfile assertion replaced the package-legitimacy checkpoint (orchestrator ruling 8). It passed: the yarn.lock diff is two added workspace dependency lines, with no version: or resolution: line"
  - "VEST-04 stays open. Its other clauses (unused declarations removed, eslint-plugin-svelte, lint-rule proofs, audit-baseline edit) belong to 167-04"

patterns-established:
  - "Dist inlined-to-external check: grep the built index.js for a symbol of the library (inlined) and for its `from \"<pkg>\"` import (external)"

requirements-completed: []

coverage:
  - id: D1
    description: "@openvaa/llm declares js-yaml in dependencies and @types/js-yaml in devDependencies, both as catalog:. jsonrepair is still present (its removal is commit ④)"
    requirement: VEST-04
    verification:
      - kind: other
        ref: "node -e \"const p=require('./packages/llm/package.json'); process.exit(p.dependencies['js-yaml']==='catalog:' && p.devDependencies['@types/js-yaml']==='catalog:' ? 0 : 1)\" -> exit 0; grep -c jsonrepair packages/llm/package.json -> 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "The built packages/llm/dist/index.js imports js-yaml instead of inlining it. Before: YAMLException count 26, external import count 0. After: 0 and 1"
    requirement: VEST-04
    verification:
      - kind: other
        ref: "yarn workspace @openvaa/llm build (exit 0 before and after); grep -c 'YAMLException' packages/llm/dist/index.js 26 -> 0; grep -cE \"from ['\\\"]js-yaml['\\\"]\" packages/llm/dist/index.js 0 -> 1 (line 482: import * as yaml from \"js-yaml\")"
        status: pass
    human_judgment: false
  - id: D3
    description: "A consumer workspace loads @openvaa/llm at runtime with the js-yaml import external"
    requirement: VEST-04
    verification:
      - kind: other
        ref: "cd packages/question-info && node --input-type=module -e \"const m = await import('@openvaa/llm'); console.log(Object.keys(m).length)\" -> exit 0, prints 18"
        status: pass
    human_judgment: false
  - id: D4
    description: "No package version enters the lockfile: the yarn.lock diff adds no resolution, and js-yaml still resolves to 4.3.2"
    requirement: VEST-04
    verification:
      - kind: other
        ref: "git diff -U0 HEAD -- yarn.lock (exit 0, non-empty: 2 added lines under @openvaa/llm@workspace); grep -E '^[-+]  (version|resolution):' on it -> exit 1, no output; root node_modules/js-yaml version 4.3.2"
        status: pass
    human_judgment: false
  - id: D5
    description: "llm typechecks and passes its unit tests, and the forced full build and the full unit suite are green"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/llm typecheck -> 0; yarn workspace @openvaa/llm test:unit -> 0 (2 files, 39 tests); TURBO_FORCE=true yarn build -> 0 (14/14 tasks, 0 cached); yarn test:unit -> 0 (25/25 tasks)"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-10-02
status: complete
---

# Phase 167 Plan 03: Declare js-yaml in @openvaa/llm Summary

**Commit ③ adds `js-yaml` and `@types/js-yaml` to `@openvaa/llm` as `catalog:` entries. This is the package that imports js-yaml. The built `dist/index.js` now has an external `import * as yaml from "js-yaml"` where it used to inline the library (26 `YAMLException` hits before, 0 after). The lockfile change is two workspace dependency lines and no new resolution.**

## Performance

- **Duration:** about 2 min
- **Started:** 2026-10-02T06:04:13Z
- **Completed:** 2026-10-02T06:06:26Z
- **Tasks:** 2 (one commit, per D-24 ③)
- **Files modified:** 2

## Accomplishments

- `packages/llm/package.json` now declares `"js-yaml": "catalog:"` in `dependencies` (after `ai`) and `"@types/js-yaml": "catalog:"` in `devDependencies`. Both are in alphabetical position. Nothing else changed: `jsonrepair` stays until commit ④.
- The build output proves the fix. Exit codes and counts were read directly, not through a pipe:

  | Check on `packages/llm/dist/index.js` | Before | After |
  |---|---|---|
  | `grep -c 'YAMLException'` (inlined library) | 26 | 0 |
  | `grep -cE "from ['\"]js-yaml['\"]"` (external import) | 0 | 1 (line 482) |

- Runtime: `packages/question-info` imports `@openvaa/llm` and gets 18 exports, exit 0, with no `ERR_MODULE_NOT_FOUND`.
- Lockfile (PROH-167-05, orchestrator ruling 8): `yarn install` exit 0. The `yarn.lock` diff is exactly `+    "@types/js-yaml": "catalog:"` and `+    js-yaml: "catalog:"` under the `@openvaa/llm@workspace` entry. The `version:`/`resolution:` grep exits 1 with no output, and `js-yaml` still resolves to the locked 4.3.2. Nothing new was fetched.

## Task Commits

1. **Task 1: Declare js-yaml and prove it end to end (tracer).** Left uncommitted, as the plan requires. The tracer gate re-ran `<verify>`, which is automated-only under the end-of-phase mode, and it passed.
2. **Task 2: Dependent builds and tests, then commit ③.** Commit `879d0ccf0` (fix): `fix[deps]: declare js-yaml in @openvaa/llm, which imports it`. It contains exactly `packages/llm/package.json` and `yarn.lock`.

**Plan metadata:** see the docs commit that follows this SUMMARY.

## Gates (exit codes read directly)

| Gate | Exit |
|---|---|
| `yarn install` | 0 (warnings are the existing zod / playwright-core peer notices) |
| Lockfile `version:`/`resolution:` grep | 1 (no match, as required) |
| `yarn workspace @openvaa/llm build` (before / after) | 0 / 0 |
| Runtime import from `packages/question-info` | 0 |
| `yarn workspace @openvaa/llm typecheck` | 0 |
| `yarn workspace @openvaa/llm test:unit` | 0 (39/39) |
| `TURBO_FORCE=true yarn build` | 0 (14/14, 0 cached) |
| `yarn test:unit` | 0 (25/25 tasks) |
| `git status --porcelain -- yarn.lock packages` after the commit | empty |

## Files Created/Modified

- `packages/llm/package.json`: declares `js-yaml` and `@types/js-yaml`
- `yarn.lock`: the `@openvaa/llm@workspace` entry lists the two new dependency lines. No resolution changed.

## Decisions Made

- VEST-04 is **not** marked complete. The requirement also covers removing the declarations nothing uses, keeping `eslint-plugin-svelte`, proving the lint rules still fire, and editing the audit baseline. Those clauses are plan 167-04's (commit ④). This plan delivers only the "`@openvaa/llm` declares the `js-yaml` it imports" clause.

## Deviations from Plan

None. The plan executed exactly as written.

## Issues Encountered

- One plan premise is inaccurate. The plan's must-have says the full `yarn build` "bundles llm into the frontend SSR output". The frontend build does **not** bundle it. `apps/frontend/.svelte-kit/output/server/chunks/requireAdminAction.js` has `from "@openvaa/llm"` as an external import, and the server output contains neither `YAMLException` nor a `js-yaml` import. At runtime, the frontend server therefore loads `packages/llm/dist/index.js`, and that file's `js-yaml` import resolves from the hoisted root `node_modules/js-yaml` (4.3.2). This was observed on the built tree. The gate still holds: `yarn build` exits 0. Only the description of how llm reaches the frontend was wrong.

## User Setup Required

None.

## Next Phase Readiness

- Plan 167-04 (commit ④) can now remove `js-yaml` and `@types/js-yaml` from `packages/question-info` and `packages/argument-condensation`, and `jsonrepair` from `packages/llm`. Per RESEARCH Pattern 5, it should also edit the dependency bullet in `packages/argument-condensation/README.md`.
- The working tree is clean apart from the existing untracked `gate-evidence/` directory, which D-23 handles in a later plan.

---
*Phase: 167-origin-main-vestige-cleanup*
*Completed: 2026-10-02*

## Self-Check: PASSED

- Commit `879d0ccf0` exists on `fix/888-review-findings` with subject `fix[deps]: declare js-yaml in @openvaa/llm, which imports it`, and its file list is exactly `packages/llm/package.json` and `yarn.lock`.
- `packages/llm/package.json` contains `js-yaml` and `@types/js-yaml` as `catalog:`, and still contains `jsonrepair`.
- `git rev-list --count 957ef0a61..879d0ccf0` = 1.
