---
title: Normalise @openvaa/app-shared to match other packages' paradigm
priority: medium
area: packages
created: 2026-04-25
promoted: 2026-04-29
context: Captured as a note (`.planning/notes/2026-04-25-normalise-app-shared-paradigm.md`) on 2026-04-25. The hoist of `mergeSettings` + `DeepPartial` from `apps/frontend/src/lib/utils/merge.ts` into `@openvaa/app-shared` (v2.6 Phase 63 Plan 01) made this divergence more visible — the new utility's import paths and barrel surface look slightly different from how `@openvaa/core` / `@openvaa/data` / `@openvaa/matching` / `@openvaa/filters` are organized.
---

# Normalise @openvaa/app-shared to match other packages' paradigm

`@openvaa/app-shared` has accumulated paradigm drift compared to the
other publishable packages. Two visible signals:

- `.js` extensions in import paths inside `.ts` files (a TypeScript +
  ESM convention used elsewhere in the monorepo, but not consistently
  applied within app-shared).
- Different export-barrel structure (utils sub-barrel + nested exports
  vs flat exports in core/data/matching/filters).
- Mixed handling of CommonJS vs ESM build outputs (app-shared builds
  to both for backend consumption — see CLAUDE.md).

## What to do

- Compare directory layout, package.json scripts, exports field, build
  config, and import-path conventions across `@openvaa/core`,
  `@openvaa/data`, `@openvaa/matching`, `@openvaa/filters`,
  `@openvaa/app-shared`.
- Pick a canonical paradigm (likely the core/data/matching/filters
  shape since it's used by 4 packages) and bring app-shared in line.
- If app-shared's dual ESM+CommonJS build is intentionally divergent
  (it builds for both frontend and Supabase Edge Functions), document
  that explicitly so future readers know the divergence is required,
  not accidental.

## Acceptance

- One-line "this is how all packages look" reference in `CLAUDE.md`
  or a packages-level README.
- Per-package divergences (if any) are explicitly justified in the
  package's `package.json` or a top-of-file comment.
- `grep -r "from '\\..*\\.js'" packages/` returns either consistent
  hits across all packages or zero (whichever the canonical paradigm
  picks).

## Related

- `.planning/todos/pending/2026-04-25-remove-mergesettings-reexports.md` — same family of "post-Phase 63 hoist hygiene" work; the frontend re-export shim at `apps/frontend/src/lib/utils/merge.ts` should be removed once consumers stabilize on the package.
- `.planning/todos/pending/2026-04-27-cleanup-sloppy-typing-supabaseDataProvider.md` — same family of "tighten type-system contracts" work.
