---
title: "The root-`.env` restart plugin ignores deletion (`unlink`) and does not debounce rename-saves"
created: 2026-10-03
source_phase: 169-dependency-bump-to-latest-safe-versions
source: 169-REVIEW.md IN-02; disposition 169-REVIEW-DISPOSITION.md
priority: low
suggested_phase: any frontend dev-tooling touch (a quick task is enough)
keywords: [vite, dev-server, restart, env, vite-plugin-restart, watcher, unlink, debounce]
re_check_trigger: "a report of a stale environment after deleting or rename-saving the root .env; or the next edit to apps/frontend/vite.restartOnRootEnv.ts"
---

# Dev-loop gaps in `apps/frontend/vite.restartOnRootEnv.ts`

Phase 169 replaced `vite-plugin-restart` with a small in-repo plugin that listens for `change` and `add` on the
repo-root `.env` and calls `server.restart()`. Two gaps, both dev-loop nuisances, neither a correctness or security
problem:

- **Deletion.** No `unlink` handler. After the root `.env` is deleted, the dev server keeps its old environment until
  someone restarts it by hand.
- **No debounce.** Editors that save by rename emit `unlink` + `add`. Vite 8's `_restartPromise` coalesces restarts
  that overlap, but two events that land either side of a finished restart cause two full restarts.
  `vite-plugin-restart` debounced these.

## What to do

1. Also listen for `unlink` (same path comparison; the plugin still never opens the file).
2. Wrap the handler in a trailing debounce of 100 to 300 ms.
3. Extend `apps/frontend/vite.restartOnRootEnv.test.ts` with an `unlink` case and a burst case (several events inside
   the window give one `restart()` call, using fake timers).
