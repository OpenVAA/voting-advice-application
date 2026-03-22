---
plan: 39-04
status: complete
started: 2026-03-22
completed: 2026-03-22
---

# Plan 39-04: Update Documentation Site Strapi References — Summary

## Result

All Strapi references in the docs site are now marked as legacy or replaced. Navigation config labels 3 items as "(Legacy)". 15 pages received legacy notices. Features page updated to reference Supabase Studio instead of Strapi Admin UI.

## What Changed

| Change | Count |
|--------|-------|
| Navigation items marked as Legacy | 3 |
| Pages with new legacy notice | 15 |
| About pages updated | 2 (features, roadmap) |
| Active Strapi-as-backend references remaining | 0 |

## Key Files

### Modified
- `apps/docs/src/lib/navigation.config.ts` — 3 nav items marked "(Legacy)"
- `apps/docs/src/routes/(content)/about/features/+page.md` — Supabase Studio, static data
- `apps/docs/src/routes/(content)/about/roadmap/+page.md` — Migration marked completed
- 15 docs pages — Legacy notice added

## Deviations

- `about/roadmap/+page.md` retains a historical Strapi mention ("migrated from Strapi to Supabase (completed)") — this is acceptable per CONTEXT.md decision D-15.
