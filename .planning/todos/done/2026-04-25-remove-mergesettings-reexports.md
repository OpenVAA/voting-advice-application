---
title: Remove re-exports such as mergeSettings from frontend
priority: medium
area: packages
created: 2026-04-25
promoted: 2026-04-29
resolves_phase: 72
context: Captured as a note (`.planning/notes/2026-04-25-remove-re-exports-like-mergesettings.md`) on 2026-04-25. v2.6 Phase 63 Plan 01 hoisted `mergeSettings` + `DeepPartial` from `apps/frontend/src/lib/utils/merge.ts` into `@openvaa/app-shared`, leaving `apps/frontend/src/lib/utils/merge.ts` as a re-export shim "to keep 3 existing $lib/utils/merge import sites stable". The shim is intentional short-term scaffolding; long-term consumers should import directly from `@openvaa/app-shared`.
---

# Remove re-exports such as mergeSettings from frontend

The frontend has accumulated re-export shims that hide the true
source-of-truth path. Most visibly: `apps/frontend/src/lib/utils/merge.ts`
re-exports `mergeSettings` from `@openvaa/app-shared` (added during
v2.6 Phase 63 Plan 01 to keep 3 existing import sites compiling).
Similar shims may exist for other utilities that have been hoisted
to packages.

The shim is intentionally short-term scaffolding — long-term, every
import site should reach into `@openvaa/app-shared` (or whichever
package owns the symbol) directly so:

- Refactor-impact is visible (`grep -r "@openvaa/app-shared/utils/merge"` finds all consumers).
- Single source of truth — the shim layer can drift without anyone noticing.
- IDE auto-import suggests the canonical path.

## What to do

- Inventory all re-export shims in `apps/frontend/src/lib/utils/`
  (anything that just `export *` or `export { … } from '@openvaa/*'`).
- For each: rewrite the import sites to point at the canonical package,
  delete the shim, run tests + typecheck.
- Apply the same rule going forward: never add a frontend
  re-export of a package symbol.

## Acceptance

- `grep -r "export .* from '@openvaa" apps/frontend/src/` returns zero shim-only files.
- Consumers import from `@openvaa/app-shared` (etc.) directly.
- Lint or codeowner rule prevents new re-export shims (optional, depending on tooling cost).

## Related

- `.planning/todos/pending/2026-04-25-normalise-app-shared-paradigm.md` — sibling cleanup; together these form the post-Phase 63 hoist hygiene work.
