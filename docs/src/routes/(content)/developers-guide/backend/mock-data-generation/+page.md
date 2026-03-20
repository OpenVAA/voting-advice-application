# Mock Data Generation

> **Migrated to Supabase.** The Strapi backend was removed in v3.0. This page previously documented the Strapi-based mock data generation.

## Supabase Equivalent

Development and mock data is now managed through the seed file. Running `supabase db reset` applies all migrations and executes `seed.sql` automatically, populating the database with development data.

## References

- Supabase project: `apps/supabase/`
- Seed data: `apps/supabase/supabase/seed.sql`
- Migration commit: Phase 30 of v3.0 Frontend Adapter milestone
