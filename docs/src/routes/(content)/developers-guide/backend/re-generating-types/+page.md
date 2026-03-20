# Re-generating Types

> **Migrated to Supabase.** The Strapi backend was removed in v3.0. This page previously documented re-generating Strapi types.

## Supabase Equivalent

Run `yarn supabase:types` to generate TypeScript types from the running Supabase instance. The generated types are output to `packages/supabase-types/src/database.ts`.

## References

- Supabase project: `apps/supabase/`
- Generated types: `packages/supabase-types/src/database.ts`
- Migration commit: Phase 30 of v3.0 Frontend Adapter milestone
