# Supabase Backend

> **Migrated to Supabase.** The Strapi backend was removed in v3.0. This page previously documented the Strapi-based backend introduction.

## Supabase Equivalent

The backend is now a Supabase CLI project containing the database schema, migrations, Edge Functions, and seed data. Run `supabase start` in `apps/supabase/` to launch all backend services locally.

## References

- Supabase project: `apps/supabase/`
- Schema and migrations: `apps/supabase/supabase/migrations/`
- Edge Functions: `apps/supabase/supabase/functions/`
- Configuration: `apps/supabase/supabase/config.toml`
- Database conventions: `.claude/skills/database/SKILL.md`
- Migration commit: Phase 30 of v3.0 Frontend Adapter milestone
