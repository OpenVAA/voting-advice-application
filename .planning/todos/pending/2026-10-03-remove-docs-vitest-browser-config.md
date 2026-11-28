---
title: "The docs app has a Vitest browser project and `@vitest/browser-playwright` but no tests: remove the dead config"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source_plan: 13
priority: low
suggested_phase: any cleanup slot
keywords: [docs, vitest, browser-mode, vitest-browser-playwright, dead-config, cleanup]
re_check_trigger: "any time; or before the next Vitest major (it saves migrating dead config)"
---

# Dead Vitest browser config in `apps/docs`

## Measured 2026-10-03

- `apps/docs/vite.config.ts` declares `test.projects` with a `client` project (`browser.enabled: true`,
  `provider: playwright()` from `@vitest/browser-playwright`, chromium headless, `include:
  src/**/*.svelte.{test,spec}.{js,ts}`) and a `server` project.
- `find apps/docs -path '*/node_modules' -prune -o \( -name '*.test.*' -o -name '*.spec.*' \) -print` prints nothing:
  the docs app has no test files, and its `package.json` has no `test` script.
- `apps/docs/package.json` still declares `@vitest/browser-playwright: catalog:` and `vitest: catalog:`; Phase 169
  moved both through two majors (169-04) only to keep this config valid.

## What to do

1. Delete the `test:` block from `apps/docs/vite.config.ts` and import `defineConfig` from `vite` instead of
   `vitest/config`.
2. Remove `@vitest/browser-playwright` and `vitest` from `apps/docs/package.json` (`vitest` stays consumed by the other
   workspaces; `apps/docs` is the only declarer of `@vitest/browser-playwright` on 2026-10-03, so drop that catalog key
   from `.yarnrc.yml` too).
3. `yarn install`, then the docs `check`, `build`, `validate:links`, `check:research-quotes` and the root unit run.
