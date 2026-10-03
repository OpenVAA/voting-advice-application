---
phase: 169-dependency-bump-to-latest-safe-versions
plan: 05
subsystem: build
tags: [vite, vite-8, rolldown, vite-plugin-svelte, sveltekit, adapter-node, svelte, dev-server, catalog, supply-chain]

requires:
  - phase: 169-04
    provides: "group-4 tree (Vitest 5.0.2 whose peer admits Vite 8, catalog vite ^7.3.6, Playwright 1.63.0 visual container), 12/12 gates, E2E 171/171"
provides:
  - "Inline serve-only plugin restartOnRootEnv (openvaa:restart-on-root-env) in apps/frontend/vite.restartOnRootEnv.ts with 6 unit cases; vite-plugin-restart removed; restart observed live on Vite 6.4.3 and on Vite 8.3.1, with a negative control"
  - "SvelteKit 2.70.3 (catalog), adapter-node 5.5.7, adapter-static 3.0.10 (already newest 3.x); the accepted Kit BODY_SIZE_LIMIT audit row left the findings"
  - "Catalog svelte floor ^5.57.1 (Kit 3's peer), resolution unchanged"
  - "Catalog vite ^8.3.1 and new catalog entry '@sveltejs/vite-plugin-svelte' ^7.3.1, consumed by both apps through catalog:; one vite (8.3.1) and one vite-plugin-svelte (7.3.1) in the workspace"
  - "Build-output diff before/after Vite 8 for both apps, the CSS-growth attribution experiment, a production-bundle smoke compared against the Vite 6 bundle, and the browser-floor operator follow-up"
  - "169-restart-probe.sh <label> (live dev-server restart probe) in the phase directory"
  - "Group-3 gate run 169-05-group3: 12/12 green; full E2E 171/171/0/0/0; visual gate green twice, no re-baseline"
affects: [169-06, 169-12, 169-13]

actuals:
  tokens: 14000   # chars/4 over the realized diff 55a6e23f0..HEAD excluding yarn.lock (16766 chars) + this plan's evidence diff (~27k + later additions) + this summary (~11k); ~23600 with the lockfile diff (38446 chars)
  tasks: 3
  commits: 6      # git rev-list --count 55a6e23f0..bf828a1da (the SUMMARY and state commits follow)
plan_head_before: 55a6e23f0285a5223d1ed1d1451f9217ed900d76
plan_head_after: bf828a1dad56e5bd426288e63e4bb7af61f2cc30

tech-stack:
  added: [vite 8.3.1, "@sveltejs/vite-plugin-svelte 7.3.1", "@sveltejs/kit 2.70.3", "@sveltejs/adapter-node 5.5.7", "rolldown 1.2.11 (transitive)", "@oxc-project/types 0.151.0 (transitive)", "@rollup/plugin-replace 6.0.3 (transitive)", "lightningcss 1.33.0 (transitive, Vite's)"]
  removed: [vite-plugin-restart, "@sveltejs/vite-plugin-svelte-inspector (folded into vite-plugin-svelte 7)"]
  patterns:
    - "A dev-only Vite plugin is proven by a unit test over a fake watcher plus a live probe with a negative control (the plugin entry disabled must make the probe fail)"
    - "A suspected bundler regression is checked by running the same smoke against the old bundle on a temporary checkout of only the dependency files, then restoring them with git checkout HEAD -- <files>"

key-files:
  created:
    - apps/frontend/vite.restartOnRootEnv.ts
    - apps/frontend/vite.restartOnRootEnv.test.ts
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-restart-probe.sh
  modified:
    - apps/frontend/vite.config.ts
    - apps/frontend/vitest.config.ts
    - apps/frontend/tsconfig.json
    - apps/frontend/package.json
    - apps/frontend/README.md
    - apps/docs/package.json
    - .yarnrc.yml
    - yarn.lock
    - security/audit-baseline.json
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-EVIDENCE.md

key-decisions:
  - "Vite target 8.3.1, not 8.3.2: 8.3.2 (2026-10-01T10:17Z) is inside the 7-day window and clears 2026-10-08T10:17Z (recorded in EVIDENCE § 3)."
  - "Kit 3 / adapter-node 6 / adapter-static 4 are held by the 30-day major rule (clear 2026-10-31); they belong to 169-12."
  - "The braces baseline rationale was edited by hand to drop vite-plugin-restart, which is no longer in the tree. Only the text changed, with no row added or removed and no --update-baseline. The plan's acceptance grep required it, and the remaining micromatch path (@changesets/cli) is named."
  - "vite-plugin-svelte 7 removed the inline hot option. The frontend unit config now passes compilerOptions.hmr, the replacement the plugin names."
  - "Vite 8's configLoader 'native' notice (extensionless relative imports in vite.config.ts) is recorded as a follow-up, neither fixed nor suppressed. The fix needs allowImportingTsExtensions in the tsconfig that type-checks the config, which is not a dependency-commit change."
  - "No build.rollupOptions / rolldownOptions / ssr override was added (PROH-169-11): no gate required one."

patterns-established:
  - "Vite 8 forwards browser console errors to the dev-server log when it detects a coding agent; E2E devserver.log line counts are not comparable across the Vite 7 → 8 boundary"

requirements-completed: [DEPS-05]

coverage:
  - id: D1
    description: "vite-plugin-restart replaced by restartOnRootEnv; unit-proven; restart observed live on Vite 6 and Vite 8"
    requirement: DEPS-05
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend vitest run vite.restartOnRootEnv.test.ts -> RED exit 1 at 8fe8e3455, GREEN 6 passed at f88e60568"
        status: pass
      - kind: other
        ref: "bash 169-restart-probe.sh 169-05-t1-restart -> 0 ('[vite] server restarted.' on 6.4.3); 169-05-t1-restart-negative (plugin entry disabled) -> 1; 169-05-t3-restart -> 0 on 8.3.1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Kit 2.70.3 with adapter-node 5.5.7 and adapter-static 3.0.10; Svelte floor ^5.57.1"
    requirement: DEPS-05
    verification:
      - kind: other
        ref: "yarn why @sveltejs/kit -> 2.70.3 only; adapter-node 5.5.7; adapter-static 3.0.10; both checks 0/0; TURBO_FORCE=true yarn build -> 0; audit:deps 0 new, Kit row 1116433 gone"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both apps on one Vite 8.3.1 and one vite-plugin-svelte 7.3.1 through the catalog"
    requirement: DEPS-05
    verification:
      - kind: other
        ref: "yarn why vite -> vite@npm:8.3.1 only (13 consumers); yarn why @sveltejs/vite-plugin-svelte -> 7.3.1 only; grep -c '\"vite\": \"catalog:\"' and '\"@sveltejs/vite-plugin-svelte\": \"catalog:\"' -> 1 in each app manifest"
        status: pass
    human_judgment: false
  - id: D4
    description: "Build-output diff recorded for both apps; browser-floor follow-up recorded; visual gate green"
    requirement: DEPS-05
    verification:
      - kind: other
        ref: "169-EVIDENCE.md § 6 (frontend 1097 -> 1073 files, -946 007 bytes; docs 278 -> 272) and § 7 (chrome111/edge111/firefox114/safari16.4/ios16.4)"
        status: pass
      - kind: e2e
        ref: "tests/scripts/visual-container.sh --run-dir tests/e2e-runs/169-05-visual and 169-05-visual-final -> exit 0, 7/0/0 each"
        status: pass
    human_judgment: true
  - id: D5
    description: "Group 3 ends with all twelve D-26 gates green and a full E2E run green"
    verification:
      - kind: other
        ref: "bash 169-gates.sh 169-05-group3 -> 12 rows of 0 at bf828a1da; lint normalised list identical to 169-04-group4 (diff exit 0)"
        status: pass
      - kind: e2e
        ref: "bash 169-e2e.sh 169-05-group3 -> total 171, passed 171, failed 0, flaky 0, didNotRun 0"
        status: pass
    human_judgment: false

duration: 45min
completed: 2026-10-03
status: complete
---

# Phase 169 Plan 05: Group 3 — the Build Stack Summary

**Both apps now build on Vite 8.3.1 (Rolldown) and vite-plugin-svelte 7.3.1 through two catalog entries, and the workspace resolves exactly one of each. SvelteKit is on 2.70.3 with adapter-node 5.5.7, so the accepted Kit DoS row left the audit. `vite-plugin-restart`, whose Vite peer stopped at 7, is gone. In its place a serve-only plugin that the repository owns restarts the dev server on root `.env` changes. That plugin is proven by 6 unit cases and observed live on both Vite 6 and Vite 8, with a negative control. Group 3 ended with 12/12 gates, a full E2E run of 171/171, and two green visual runs with no re-baseline.**

## Performance

- **Duration:** about 45 min (2026-10-03T12:43Z → 13:28Z)
- **Tasks:** 3, in plan order
- **Files modified:** 13 (`git diff --name-only 55a6e23f0..bf828a1da`), plus the evidence ledger and this summary

## Accomplishments

- **Restart plugin (Task 1, tracer):**
  - `8fe8e3455` wrote the test first: 6 cases, RED because the module did not exist.
  - `f88e60568` added `restartOnRootEnv(repoRoot)`. It adds the root `.env` to `server.watcher`, and on `change` or `add` of that exact resolved path it calls `server.restart()`. It never opens the file, and `apply: 'serve'` keeps it out of builds.
  - Live probe `169-restart-probe.sh`:
    - on Vite 6.4.3: `15.46.37 [vite] server restarted.`;
    - with the plugin entry commented out: exit 1, no restart within 60 s;
    - on Vite 8.3.1: `15.54.57 [vite] server restarted.`.
  - The tracer gate re-ran both `<verify>` commands green before any expansion.
- **Svelte floor, `830196b65`:** `^5.53.12` → `^5.57.1`. Only the descriptor line changed.
- **Kit 2.70.3, `a6495d823`:**
  - adapter-node 5.5.7; adapter-static 3.0.10 is already the newest 3.x.
  - The 2.55 → 2.70 changelog breaks only experimental remote functions, which the repository does not use.
  - Kit's TypeScript YN0060 cleared.
  - Audit: 6 accepted → 5, 0 new.
- **Vite 8.3.1 + vite-plugin-svelte 7.3.1, `bf828a1da`:**
  - Catalog `vite ^8.3.1` and new `'@sveltejs/vite-plugin-svelte' ^7.3.1`; both apps on `catalog:`.
  - The docs app's earlier nested Vite collapsed.
  - One fix at source: `hot` → `compilerOptions.hmr`.
  - The new lockfile names (Rolldown, its 15 platform bindings, Oxc types) passed the legitimacy check. Each SUS is `too-new` on a package with millions of weekly downloads, and none has an install script.
- **Measured bundler change (EVIDENCE § 6):**
  - Frontend build: 6.5 % smaller overall and 5.1 % less client JS. Server chunks are regrouped by Rolldown.
  - The main CSS grew by about 5 KB in both apps. A docs experiment showed that the size follows the CSS target, not the minifier; the exact cause is UNCONFIRMED. No pixel moved.
  - A production-bundle smoke through `vite preview` matched the Vite 6 bundle route for route.
- **Gates and E2E:** `169-05-group3` 12/12 zero; E2E `169-05-group3` 171/171/0/0/0; visual runs `169-05-visual` and `169-05-visual-final` both 7/0/0.

## Task Commits

1. **Task 1 (tracer): restart plugin.** `8fe8e3455` test(frontend) RED; `f88e60568` refactor(frontend) GREEN (plugin, config, manifest, lockfile, README, tsconfig file list, baseline rationale); `d43d27bc9` docs(169) probe + ledger.
2. **Task 2: Kit 2.70.** `830196b65` chore(deps) Svelte floor; `a6495d823` chore(deps) Kit + adapter-node.
3. **Task 3: Vite 8.** `bf828a1da` chore(deps) both apps on Vite 8.3.1 / vite-plugin-svelte 7.3.1. The gate run, E2E, visual runs and evidence go in with this SUMMARY.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `vite.restartOnRootEnv*.ts` missing from the frontend tsconfig `files` list**
- **Found during:** Task 1. `svelte-check` raised "not listed within the file list of project".
- **Fix:** added both files beside the `vite.projectIdEnv*.ts` entries.
- **Commit:** `f88e60568`

**2. [Rule 3 - Blocking] Two lint findings on the new and touched files**
- `func-style` on an arrow-function handler: now a function declaration.
- `simple-import-sort` on `vite.config.ts`: autofixed. This also sorts the existing `@inlang` and `@sveltejs` imports.
- **Commit:** `f88e60568`

**3. [Rule 2 - Correctness] Stale references to `vite-plugin-restart`**
- **Fix:**
  - `apps/frontend/README.md` now names `restartOnRootEnv`.
  - The `braces` baseline rationale now names only the `@changesets/cli` micromatch path. This is a text-only hand edit: no row was added or removed, there was no `--update-baseline`, and `auditBaselineShape.test.ts` still passes 14/14.
- **Why:** the plan's acceptance grep requires no reference outside `.planning` and `yarn.lock`.
- **Commit:** `f88e60568`

**4. [Rule 1 - Bug] vite-plugin-svelte 7 removed the inline `hot` option**
- **What happened:** `apps/frontend/vitest.config.ts` logged `invalid plugin option 'hot'`.
- **Fix:** replaced with `compilerOptions: { hmr: !process.env.VITEST }`.
- **Commit:** `bf828a1da`

**5. [Added verification] Restart negative control and a production-bundle smoke**
- Neither was in the plan.
- **Negative control:** proves that Vite alone does not restart on the root `.env`.
- **Production smoke:** the E2E suite and the visual gate both drive a dev server, so nothing in the plan exercised the Rolldown production bundle beyond `yarn build` (threat T-169-15).
- **How the smoke ran:** the same smoke ran on the Vite 6 bundle through a temporary checkout of only the five dependency files. They were restored with `git checkout HEAD -- <files>` and `yarn install`, and the frontend was rebuilt. Both bundles return identical statuses and the same six `DataProvider … reason: 'empty'` server records. Why those records appear in the preview setup is UNCONFIRMED.
- **Two temporary docs-config experiments for the CSS attribution:** each was restored with `git checkout -- apps/docs/vite.config.ts`.

**6. [Harness] The secret-read guard blocked `node --env-file=../../.env build`**
- The production smoke used `vite preview` instead. The preview loads the root `.env` through SvelteKit's own loader, so no secret value entered the session.

---

**Total deviations:** 4 auto-fixes (2 blocking, 1 correctness, 1 migration bug) and 2 harness or verification additions.
**Impact on plan:** every must-have truth holds. No test was skipped or weakened, no snapshot was re-baselined, no bundler override was added, and the warning was not suppressed.

## Issues Encountered

- The first Vite 8 dev start took 26.6 s (`Forced re-optimization of dependencies`). Later starts took about 0.5 s.
- Vite 8 forwards browser console errors to the dev log when it detects a coding agent (`server.forwardConsole`). The E2E `devserver.log` therefore shows 7 client `DataProvider … reason: "error"` lines that 169-04's log could not. Most likely they are newly visible rather than new; which tests emit them is UNCONFIRMED.
- The repo's `grep` is `ugrep`. It rejected a long regex over Vite's dist, so `/usr/bin/grep` was used to read Vite's default build target.

## User Setup Required

None.

## Known Stubs

None.

## Next Phase Readiness

- **169-06 (group 5, Supabase CLI + PG17):**
  - Nothing from this plan blocks it.
  - The local Supabase stack `openvaa-local` is running and seeded with e2e/base, because the production smoke re-seeded it.
  - No dev server, preview or Playwright process from this plan is left running; ports 5173, 5199, 5273 and 3999 are free.
- **169-12 (Kit 3):**
  - Kit 3's peers are already in place under Kit 2.70.3: Vite 8.3.1 (≥ 8.0.12), vite-plugin-svelte 7, TypeScript 6 and Svelte ^5.57.1.
  - Kit 3, adapter-node 6 and adapter-static 4 clear the 30-day rule on 2026-10-31.
  - Consider fixing the `configLoader: 'native'` notice in the same plan (EVIDENCE § 7).
- **Holds recorded (EVIDENCE § 3):** `vite` 8.3.2 clears 2026-10-08T10:17Z; Kit 3 family clears 2026-10-31.
- **Operator (EVIDENCE § 7):**
  - Confirm the raised browser floor (Vite 8 default target `chrome111` / `edge111` / `firefox114` / `safari16.4` / `ios16.4`) or set `build.target`.
  - The stray `stash@{0}` from 169-04 is resolved: the orchestrator dropped it after verifying it.
- **DEPS-05 is complete;** no later plan owns part of it.

## Self-Check: PASSED

- Files exist: `apps/frontend/vite.restartOnRootEnv.ts`, `apps/frontend/vite.restartOnRootEnv.test.ts`, `169-restart-probe.sh`, `169-05-SUMMARY.md`.
- Commits in `git log`: `8fe8e3455`, `f88e60568`, `d43d27bc9`, `830196b65`, `a6495d823`, `bf828a1da`.
- `tests/e2e-runs/169-gates/169-05-group3/summary.tsv`: 12 rows, all 0.
- `tests/e2e-runs/169-e2e/169-05-group3/summary.json`: failed, flaky and didNotRun all 0.

---
*Phase: 169-dependency-bump-to-latest-safe-versions*
*Completed: 2026-10-03*
