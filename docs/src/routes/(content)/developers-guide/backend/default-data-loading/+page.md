# Default Data Loading

> **Migrated to Supabase.** The Strapi backend was removed in v3.0. This page previously documented the Strapi-based default data loading mechanism.

## Supabase Equivalent

Default and development data is loaded via `apps/supabase/supabase/seed.sql`, which runs automatically during `supabase db reset`. For programmatic data imports, use the `bulk_import` RPC function.

## References

- Supabase project: `apps/supabase/`
- Seed data: `apps/supabase/supabase/seed.sql`
- Bulk import RPC: `apps/supabase/supabase/schema/`
- Migration commit: Phase 30 of v3.0 Frontend Adapter milestone
