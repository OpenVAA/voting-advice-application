---
phase: 68
plan: 01
subsystem: dev-tooling
tags: [autoreload, vite-plugin-restart, concurrently, turborepo-watch, dev-workflow, README]
requirements_completed: [DEVTOOLS-01]
requires: []
provides:
  - DEVTOOLS-01-autoreload-stack
  - frontend-readme-dev-workflow
affects:
  - apps/frontend/vite.config.ts
  - apps/frontend/package.json
  - package.json
  - yarn.lock
  - apps/frontend/README.md
tech_stack_added:
  - vite-plugin-restart@2.0.0 (frontend devDep)
  - concurrently@9.2.1 (root devDep)
patterns_used:
  - 68-PATTERNS §apps/frontend/vite.config.ts (append plugin to chain)
  - 68-PATTERNS §package.json (root) (Option B with concurrently --kill-others-on-fail)
  - 68-PATTERNS §apps/frontend/README.md (sibling-app README skeleton, package-name H1)
  - 68-RESEARCH §Pattern 2 (vite-plugin-restart minimal config)
  - 68-RESEARCH §Code Examples Example A (composed dev script Option B)
  - 68-RESEARCH §Code Examples Example E (README skeleton)
key_files_created:
  - apps/frontend/README.md
key_files_modified:
  - apps/frontend/vite.config.ts (added ViteRestart import + plugin invocation; preserveSymlinks preserved; paraglide as any cast preserved)
  - apps/frontend/package.json (added vite-plugin-restart@^2.0.0 in devDependencies)
  - package.json (added _dev:concurrent helper, rewired dev script to compose supabase + watch:shared + frontend dev via concurrently --kill-others-on-fail; dev:start cold-clone path preserved; concurrently@^9.0.0 added in alphabetic position in devDependencies)
  - yarn.lock (Yarn 4 lockfile updated with both new deps)
decisions_made:
  - "Used Option B (concurrently with --kill-others-on-fail) over shell-ampersand (Option A) — RESEARCH-recommended for SIGINT propagation and prefixed/colored stdout in dev"
  - "Did not modify turbo.json — existing watch:shared script at root composes correctly without a Turborepo dev task (matches RESEARCH §Open Question 3 recommendation)"
  - "vite-plugin-restart appended at end of plugins array — order-insensitive (it only watches files, doesn't transform); does not interfere with sveltekit() / paraglide / tailwindcss"
metrics:
  duration_seconds: 137
  duration_human: 2m17s
  tasks_planned: 3
  tasks_completed: 3
  files_created: 1
  files_modified: 4
  commits: 1
  completed_at: 2026-05-08T11:10:08Z
---

# Phase 68 Plan 01: Frontend Autoreload + Dev Workflow README Summary

**One-liner:** Composed `concurrently` + Turborepo `watch:shared` + Vite HMR autoreload stack with `vite-plugin-restart@2.0.0` watching root `.env`, and documented the workflow in a NEW `apps/frontend/README.md` per ROADMAP SC-1.

## Objective Recap

Implement DEVTOOLS-01: frontend dev loop now autoreloads on `@openvaa/*` package source changes (via existing `yarn watch:shared` Turborepo task composed with Vite HMR over `dist/`) and on root `.env` edits (via `vite-plugin-restart`). Compose the package watcher and Vite dev server in the root `yarn dev` script using `concurrently` so a single command launches both. Document the workflow in a NEW `apps/frontend/README.md` per ROADMAP SC-1.

## Tasks Completed (3/3)

### Task 1 — Add `vite-plugin-restart` dependency + plugin invocation

- Installed `vite-plugin-restart@2.0.0` as a devDependency in `apps/frontend/package.json` via `yarn workspace @openvaa/frontend add -D vite-plugin-restart@^2.0.0`
- Edited `apps/frontend/vite.config.ts`:
  - Added `import ViteRestart from 'vite-plugin-restart';` (alphabetically positioned after `defineConfig`)
  - Appended `ViteRestart({ restart: ['../../.env'] })` as the LAST element of the `plugins` array, after `sveltekit()`
  - **Preserved** `resolve: { preserveSymlinks: true }` — load-bearing for HMR-from-`dist/` semantics
  - **Preserved** the existing `paraglideVitePlugin({...}) as any` cast and its inline `eslint-disable-next-line @typescript-eslint/no-explicit-any` comment
  - Did NOT add `as any` to the new `ViteRestart(...)` invocation — the plugin's v2.0.0 DTS has correct types
- Verification: import statement, plugin invocation with the correct path, `preserveSymlinks` retention, and devDependency entry all confirmed by grep
- Acceptance criteria met (with one substituted check — see Deviations §1)

### Task 2 — Add `concurrently` to root + update root `dev` script

- Installed `concurrently@9.2.1` (satisfies `^9.0.0`) at the workspace root via `yarn add -D concurrently@^9.0.0` (Yarn 4 auto-targets the root workspace at root cwd; the legacy `-W` flag from the plan was not accepted by Yarn 4 — see Deviations §2)
- Edited root `package.json` `scripts` block:
  - **NEW** `_dev:concurrent` helper script: `concurrently -n watch,frontend -c blue,green --kill-others-on-fail "yarn watch:shared" "yarn workspace @openvaa/frontend dev"`
  - **REPLACED** `dev` script value: now `yarn supabase:start && yarn _dev:concurrent` (was `yarn supabase:start && yarn workspace @openvaa/frontend dev`)
  - **PRESERVED** `watch:shared` (already correct — `turbo watch build --filter='./packages/*'`)
  - **PRESERVED** `dev:start` (cold-clone escape hatch — still runs `yarn build && yarn supabase:start && yarn workspace @openvaa/frontend dev`)
  - All other scripts (`build`, `lint:check`, `test:unit`, `supabase:*`, `docs:*`, etc.) byte-identical to pre-edit state
- `concurrently` landed in alphabetic position in root `devDependencies` (between `cheerio` and `dotenv`) — Yarn 4 auto-sorted correctly
- Verification: full programmatic check via `node -e` confirmed all 9 invariants (dev script content, _dev:concurrent content, --kill-others-on-fail flag, watch:shared unchanged, dev:start unchanged, devDependencies entry, resolution)

### Task 3 — Create `apps/frontend/README.md` with Dev workflow section

- Created NEW file `apps/frontend/README.md` with the canonical content from the plan: H1 `# @openvaa/frontend`, `## Dev workflow` section explaining the three-process composition (Supabase + Turborepo watch + Vite dev), `### Autoreload behavior` documenting both the package-edit HMR path (via `preserveSymlinks: true`) and the `.env` restart path (via `vite-plugin-restart`), `### When autoreload misbehaves` pointing to `yarn dev:reset` and `yarn dev:start`, `### Path aliases` listing `$lib`, `$types`, `$voter`, `$candidate`, plus `## Build` and `## Tests` sections
- All Tasks 1–3 committed atomically as `3e6a55c6a` per the plan's instruction to land them as a single commit (Husky bypass via `git -c core.hooksPath=/dev/null` per project memory)
- Verification: file existence, H1, H2, mentions of `turbo watch build` / `vite-plugin-restart` / `preserveSymlinks: true` / all 4 path aliases, commit subject containing `68-01` — all confirmed

## Files Modified

| File                              | Change   | Notes                                                                                                  |
| --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `apps/frontend/vite.config.ts`    | modified | +2 lines (1 import, 3-line plugin invocation as one logical addition); `preserveSymlinks: true` retained |
| `apps/frontend/package.json`      | modified | +1 line (`"vite-plugin-restart": "^2.0.0"` in devDependencies)                                         |
| `package.json`                    | modified | +2 lines (`_dev:concurrent` helper; rewrote `dev`); +1 line (`"concurrently": "^9.0.0"` in devDependencies) |
| `yarn.lock`                       | modified | Yarn 4 lockfile updates for both new deps                                                              |
| `apps/frontend/README.md`         | created  | NEW — 41 lines documenting dev workflow per SC-1                                                       |

## Verification Evidence

### Automated (per plan's `<automated>` blocks)

```text
Task 1:
  1: file exists                          [apps/frontend/vite.config.ts]
  2: import OK                            [grep "import ViteRestart from 'vite-plugin-restart'"]
  3: ViteRestart invocation OK            [grep -E "ViteRestart\\(\\{"]
  4: restart paths OK                     [grep -E "restart:.*\\['\\.\\./\\.\\./\\.env'\\]"]
  5: preserveSymlinks preserved           [grep "preserveSymlinks: true"]
  6: package.json devDep OK               [grep '"vite-plugin-restart"' apps/frontend/package.json]
  paraglide as any cast preserved         [grep ') as any,']

Task 2:
  OK (all 9 invariants from `node -e` script: dev contains _dev:concurrent; dev starts with `yarn supabase:start`;
      _dev:concurrent contains `concurrently`, `yarn watch:shared`, `yarn workspace @openvaa/frontend dev`,
      and `--kill-others-on-fail`; watch:shared unchanged; dev:start unchanged; devDependencies.concurrently exists)
  TASK 2 ALL CHECKS PASSED               [require.resolve('concurrently') exits 0]

Task 3:
  1: file exists                          [apps/frontend/README.md]
  2: H1 OK                                [grep '^# @openvaa/frontend$']
  3: H2 OK                                [grep '^## Dev workflow$']
  4: turbo watch ref OK                   [grep 'turbo watch build']
  5: plugin ref OK                        [grep 'vite-plugin-restart']
  6: preserveSymlinks ref OK              [grep 'preserveSymlinks: true']
  7: commit subject OK                    [git log -1 --format='%s' contained '68-01']

Cross-task post-verification (plan's <verification> block):
  vite-plugin-restart installed           [filesystem check]
  concurrently resolves                   [require.resolve]
  vite.config.ts updated                  [grep ViteRestart({]
  root dev script updated                 [grep _dev:concurrent]
  README created with Dev workflow section [grep ## Dev workflow]
  all 4 path aliases documented           [grep $lib, $types, $voter, $candidate]
```

### Manual smoke (next-step user actions per VALIDATION.md "Manual-Only Verifications")

The plan's `<execution_context>` explicitly forbids the executor from running `yarn dev` (it's a long-running blocking process). The following smoke tests are documented here as **next-step user actions** to confirm DEVTOOLS-01 satisfaction:

1. From repo root, run `yarn dev` and wait for: Supabase startup logs → `[watch] turbo watch...` color-prefixed output (blue) → `[frontend] vite ... ready in N ms` color-prefixed output (green).
2. **Package-source autoreload smoke:** With `yarn dev` foregrounded, edit (or `touch`) `packages/data/src/index.ts`. Expected: turbo logs a `data#build` rebuild within ~2s, then Vite logs an HMR update within ~3s of that. Total wall-clock target: < 5s save-to-update.
3. **`.env` restart smoke:** With `yarn dev` foregrounded, save (or `touch`) the repo-root `.env`. Expected: Vite logs `[restart] page reload .env` (or equivalent) followed by `server restarted` within ~2s.
4. **`--kill-others-on-fail` smoke:** Press `Ctrl-C` once; both `[watch]` and `[frontend]` processes should terminate together (not just Vite).

If any of the above fails, see `apps/frontend/README.md` §"When autoreload misbehaves" for the recovery path (`yarn dev:reset` or `yarn dev:start`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `require.resolve('vite-plugin-restart')` substituted with ESM dynamic-import resolution check**

- **Found during:** Task 1 verification
- **Issue:** The plan's `<automated>` verify block calls `yarn workspace @openvaa/frontend exec node -e "require.resolve('vite-plugin-restart')"`. `vite-plugin-restart@2.0.0` is **ESM-only** (no `main`, only `exports`/`import` fields in its `package.json`), so CJS `require.resolve` throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. This is not a packaging mistake — the plugin is consumed by Vite, which is itself ESM.
- **Fix:** Substituted equivalent ESM check: `node --input-type=module -e "import('vite-plugin-restart').then(m => console.log('ESM resolve OK, default:', typeof m.default))"` returns `ESM resolve OK, default: function` — confirming Vite can load the plugin's default export.
- **Files modified:** None (verification-strategy substitution only — the package is correctly installed and `apps/frontend/package.json` lists it; the plan's intent of "package resolves at the frontend workspace level" is fully satisfied)
- **Commit:** N/A (no source change; pure verification adaptation)
- **Why this is Rule 3:** the literal command in the plan was blocking task completion, and the substitution is functionally equivalent (both ask "does the package resolve from this workspace's resolution scope"). Documented in the SUMMARY for plan-checker and verifier visibility.

**2. [Rule 3 - Blocking] `yarn add -D -W` flag rejected — Yarn 4 has removed `-W`**

- **Found during:** Task 2 install step
- **Issue:** Plan instructed `yarn add -D -W concurrently@^9.0.0`. Yarn 4.13 errors with `Unsupported option name ("-W")` — that flag was a Yarn 1 affordance and was removed in Yarn 2+. In Yarn 4, running `yarn add -D` from the repo root automatically targets the root workspace.
- **Fix:** Re-ran as `yarn add -D concurrently@^9.0.0` (no `-W`). Output confirmed `concurrently@npm:9.2.1` added to the root project; `package.json` shows `"concurrently": "^9.0.0"` correctly placed in root `devDependencies` between `cheerio` and `dotenv` (alphabetic order).
- **Files modified:** None (install-command syntax only — the resulting state matches the plan's intent exactly)
- **Commit:** N/A (no source change; pure command-syntax adaptation)
- **Note:** Both deviations are tooling-version mismatches between the plan text and the actual Yarn 4 / Node ESM environment. Suggest a root README note or planner-template fix to drop `-W` from future plan templates.

### Auth Gates

None.

### Architectural Changes

None — this plan was pure plumbing/composition.

## Known Stubs

None — Plan 68-01 introduces no UI rendering code, no hardcoded empty arrays, no placeholder text. All edits land production-grade tooling.

## Threat Flags

None — this plan touches only:
- Vite dev-server config (no production-bundle change)
- Root `package.json` scripts (no install-time / runtime risk surface)
- A new README documentation file

No new network endpoints, auth paths, file-access patterns, or trust-boundary schema changes.

## Self-Check: PASSED

Verified post-write (each item exists on disk and is committed in `3e6a55c6a`):

- [x] `apps/frontend/vite.config.ts` — modified (FOUND, contains `ViteRestart({ restart: ['../../.env'] })`)
- [x] `apps/frontend/package.json` — modified (FOUND, contains `"vite-plugin-restart": "^2.0.0"`)
- [x] `package.json` — modified (FOUND, contains `_dev:concurrent` script and `"concurrently": "^9.0.0"`)
- [x] `yarn.lock` — modified (FOUND, both new deps recorded)
- [x] `apps/frontend/README.md` — created (FOUND, contains `## Dev workflow`)
- [x] Commit `3e6a55c6a` — exists in git log on `feat-gsd-roadmap`

## Manual Next Steps (User Action)

These are documented for completeness because the executor cannot run `yarn dev` (per execution_context):

1. Run `yarn dev` from repo root and confirm three-color-prefixed output (Supabase boot → `[watch]` blue → `[frontend]` green).
2. Edit a `packages/*/src/` file and confirm Vite HMR fires within ~5s.
3. `touch .env` and confirm Vite `server restarted` fires within ~2s.
4. `Ctrl-C` and confirm both processes terminate.

Once confirmed, DEVTOOLS-01 is fully satisfied for the manual-smoke success criteria in VALIDATION.md.

## ROADMAP / Requirements Coverage

- **DEVTOOLS-01:** All three sub-criteria addressed:
  - Package source edits → Vite HMR (mechanism: `yarn watch:shared` rebuilds `dist/`, Vite's `preserveSymlinks: true` picks up via existing module graph)
  - `.env` edits → Vite full restart (mechanism: `vite-plugin-restart` watching `../../.env` from `apps/frontend/`)
  - Mechanism documented in `apps/frontend/README.md` per SC-1
- **ROADMAP SC-1 (Phase 68):** Met — `apps/frontend/README.md` `## Dev workflow` section explicitly names all three components of the autoreload stack and describes their interaction
