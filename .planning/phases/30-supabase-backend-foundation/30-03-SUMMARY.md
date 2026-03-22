---
phase: 30
plan: 3
status: complete
started: 2026-03-22
completed: 2026-03-22
---

# Plan 30-03: Add Supabase dependencies to Yarn catalog — Summary

## What Was Built

Added `supabase` CLI and `@supabase/supabase-js` to the Yarn catalog for shared dependency management. Updated both workspace package.json files to use `catalog:` references.

## Key Files

### Modified
- `.yarnrc.yml` — Added `supabase: ^2.78.1` and `'@supabase/supabase-js': ^2.49.4` to catalog
- `apps/supabase/package.json` — Changed `"supabase": "^2.78.1"` to `"supabase": "catalog:"`
- `packages/supabase-types/package.json` — Changed supabase and prettier to `"catalog:"` references
- `yarn.lock` — Updated with resolved catalog versions

## Deviations

Also updated `prettier` in `packages/supabase-types/package.json` from pinned `"^3.4.2"` to `"catalog:"` since prettier was already in the catalog at `^3.7.4`. This follows the established pattern of using catalog references for all shared dependencies.

## Self-Check: PASSED
- Both catalog entries present in .yarnrc.yml
- Both workspace package.json files use catalog: references
- yarn install succeeds with updated lockfile
