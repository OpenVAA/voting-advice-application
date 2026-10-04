---
phase: quick-260930-gjz
plan: 01
quick_id: 260930-gjz
status: complete
subsystem: build
tags: [turbo, cache, paraglide, frontend, docs, ci-gate]
requires: []
provides:
  - apps/frontend/turbo.json package configuration ($TURBO_DEFAULT$ inputs, generated Paraglide as output)
  - apps/docs/turbo.json package configuration ($TURBO_DEFAULT$ inputs)
  - standing turbo dry-run gate for the Vite apps' build cache key
affects: [ci frontend-and-shared-module-validation, ci dev-seed-integration, local turbo cache]
tech-stack:
  added: []
  patterns: [Turborepo package configurations extending the root ("extends": ["//"])]
key-files:
  created:
    - apps/frontend/turbo.json
    - apps/docs/turbo.json
    - packages/dev-seed/tests/turboBuildInputsGate.test.ts
  modified:
    - CLAUDE.md
decisions:
  - "Vite apps hash every git-tracked file ($TURBO_DEFAULT$) via package configs; root turbo.json build inputs stay src/**-based for tsup packages"
  - "Frontend negates src/lib/paraglide/** from build inputs and declares it a build output so builds do not self-invalidate and cache hits restore it"
metrics:
  completed: 2026-09-30
  tasks: 3
commits: 1
plan_head_before: d88096c06cfa74fa60c66cad3160076a1037b335
plan_head_after: 539ae3a28eae0575b425d34444874649ca7226b9
actuals:
  tokens: 1900
  tasks: 3
  commits: 1
---

# Quick 260930-gjz: Turbo build inputs for the Vite apps — Summary

The frontend and docs `build` tasks now hash every git-tracked file of their app through package-level `turbo.json` configs. The frontend also stops hashing its own generated Paraglide output and restores it on a cache hit. A standing dry-run gate in `packages/dev-seed` enforces all of this.

## Revalidation (Task 1) — PROCEED (both apps)

**(a) Version / syntax.** turbo **2.8.17** (`node_modules/turbo/package.json`). Neither `apps/frontend/turbo.json` nor `apps/docs/turbo.json` existed (empty `git ls-files`, and `ls` gave ENOENT). `TURBO_*` env vars were unset locally, and every probe stripped them anyway.

**(b) Input coverage at HEAD d88096c06** (`turbo run build --dry=json --filter=@openvaa/frontend --filter=@openvaa/docs`, exit 0):

| Task | Hash | Hashed inputs | Tracked files | Tracked but NOT hashed | Generated `src/lib/paraglide/` keys | Outputs |
|---|---|---|---|---|---|---|
| `@openvaa/frontend#build` | 580e5fd27eafc8b5 | 1209 | 1567 | **373** — top-level: `messages/`, `static/`, `svelte.config.js`, `vite.config.ts`, `project.inlang/`, `paraglide.options.ts`, `vite.projectIdEnv.ts`, `scripts/`, `tools/`, `tests/`, `Dockerfile`, `eslint.config.mjs`, dotfiles, … | **15** | `build/**`, `dist/**` |
| `@openvaa/docs#build` | 44f27450139bcccd | 227 | 281 | **54** — top-level: `static/`, `svelte.config.js`, `vite.config.ts`, `tailwind.config.mjs`, `scripts/`, `playwright.config.ts`, `eslint.config.js`, dotfiles, … | 0 | `build/**`, `dist/**` |

Both tasks resolved `dependsOn: ["^build"]`.

**(c) Self-reference, in isolation.** `apps/frontend/src/lib/paraglide/` was already present. The frontend dry-run hash was **580e5fd27eafc8b5** with the directory present and **c4a810fa8c41cdda** with it moved aside, then restored. The hashes differ, so the build's own output feeds its hash. That confirms the root cause of the CI double build, which was UNCONFIRMED at planning time.

**(d) CI.** The latest completed `main.yaml` run is 36535849705 (`ci-evidence/165-review-fixes-tree-7`, 2026-09-29, success).
- The log says **"Remote caching disabled"** 9 times and "enabled" 0 times.
- In job `frontend-and-shared-module-validation`:
  - During `yarn build`, `@openvaa/docs:build` **cache miss** 3b251a22d6637a7b and `@openvaa/frontend:build` **cache miss** 4efd410d92c62e76.
  - During `yarn test:unit`, `@openvaa/docs:build` **cache hit** 3b251a22d6637a7b, but `@openvaa/frontend:build` **cache miss again** 78f7b62ae38c174b (07:22:00 → 07:23:00, about 60 s rebuild).
- The steps that need generated Paraglide are `yarn typecheck`, `yarn lint:check`, `yarn test:unit` and `yarn workspace @openvaa/frontend check`. All of them run after `yarn build`, and none runs before the first build step.
- `dev-seed-integration` runs `yarn workspace @openvaa/frontend paraglide:compile` before `yarn workspace @openvaa/dev-seed test:unit`.

**Decision: PROCEED for both apps.** The remote-cache replay is latent: it is wired but disabled. The stale local-cache replay (edits to messages, static files or config leave the hash unchanged) and the per-run double frontend build in CI are both live.

## Task 2 — gate observed red at HEAD

The spec is `packages/dev-seed/tests/turboBuildInputsGate.test.ts`. Typecheck passed (`turbo run typecheck --filter=@openvaa/dev-seed`, exit 0). Before the package configs existed, the gate exited 1 with **5 failed | 5 passed (10)**. The failures were exactly the behaviours marked red at HEAD:

```
× @openvaa/frontend#build hashes every file git tracks in apps/frontend
    AssertionError: expected [ '.dockerignore', …(372) ] to deeply equal []   (lists messages/da/about.json, …)
× @openvaa/docs#build hashes every file git tracks in apps/docs
    AssertionError: expected [ '.gitignore', '.npmrc', …(52) ] to deeply equal []
× @openvaa/frontend#build hashes none of the Paraglide output it generates
    AssertionError: expected [ …(15) ] to deeply equal []
× @openvaa/frontend#build excludes the generated Paraglide directory from its inputs
    AssertionError: expected [ 'package.json', 'src/**', …(3) ] to include '!src/lib/paraglide/**'
× @openvaa/frontend#build restores the generated Paraglide directory on a cache hit
    AssertionError: expected [ 'build/**', 'dist/**' ] to deeply equal ArrayContaining{…}
```

The two dependsOn tests and the three anti-vacuity tests passed: each app's tracked set is non-empty and contains `svelte.config.js`, and the frontend's contains a `messages/` file.

## Task 3 — fix and end-to-end proof

After the fix, the dry run gives:
- **frontend** — hash 67336423a514168e. Tracked files not hashed: 0. Generated Paraglide keys: 0. Outputs are `build/**` and `src/lib/paraglide/**`. dependsOn `["^build"]` is inherited.
- **docs** — hash 45619734ee933ab6. Tracked files not hashed: 0. Outputs `build/**` and `dist/**` are inherited.

| Check | Result |
|---|---|
| (i) Gate on its own | exit 0, 10/10 passed (also re-run after the commit: 10/10) |
| (ii) Frontend config moved aside | exit 1, 4 failed (the four frontend red behaviours); restored → green |
| (ii) Docs config moved aside | exit 1, 1 failed (docs tracked-coverage); restored → green; `git status` showed only the 3 new files plus CLAUDE.md |
| (iii) Cache proof | `turbo run build --filter=@openvaa/frontend` exit 0 (cache miss 67336423a514168e, as expected after a config change). H1 = **67336423a514168e**. After `rm -rf src/lib/paraglide`, H2 = **67336423a514168e** (equal). The rebuild logged `@openvaa/frontend:build: cache hit, replaying logs 67336423a514168e` (11/11 cached), and `src/lib/paraglide/messages.js` exists again (603 files restored) |
| (iv) `yarn workspace @openvaa/frontend check` on the restored files | exit 0; 2811 files, 0 errors, 0 warnings |
| (v) `turbo run test:unit --filter=@openvaa/dev-seed` | exit 0; the gate runs under turbo (10 tests); dev-seed 62 files / 809 tests passed |
| typecheck dev-seed / prettier (4 files) / docs format:check / assert:comment-hygiene / assert:declared-binaries / eslint on spec / assert-unit-test-coverage | all exit 0 |
| Root `turbo.json` and `.github/` | unchanged (`git diff --quiet`, exit 0) |

Every gate's exit status was read directly, never through a pipe. No turbo invocation saw `TURBO_TOKEN`, `TURBO_TEAM` or `TURBO_API`.

## Out-of-scope observations (not acted on)

- The frontend `typecheck` task depends on `^build`, not on its own `build`. On a fresh clone it relies on generated Paraglide already being present, which CI provides by running `yarn build` first.
- `apps/frontend/project.inlang/settings.json` loads its inlang plugins from a CDN with floating major tags. The build therefore has an input that no hash can cover.
- Remote caching is wired (`TURBO_TOKEN`/`TURBO_TEAM` exported in two jobs) but disabled. Anyone who enables it should consider `remoteCache.signature` as the artifact-integrity control.

## Deviations from Plan

- **Sanctioned by the plan:** Task 2 and Task 3 went into one commit, because a red gate on its own would break `yarn test:unit`.
- **Anti-vacuity split:** the anti-vacuity checks (non-empty population, contains `svelte.config.js`) are separate `it` blocks per app. They are not folded into the coverage test, so they report green independently at HEAD, as the behaviour list requires.

## Commits

- 539ae3a28 — fix[build]: hash every tracked file of the Vite apps' turbo build tasks

## Self-Check: PASSED

- FOUND: apps/frontend/turbo.json, apps/docs/turbo.json, packages/dev-seed/tests/turboBuildInputsGate.test.ts, CLAUDE.md edit
- FOUND: commit 539ae3a28 (1 commit since plan_head_before d88096c06)
