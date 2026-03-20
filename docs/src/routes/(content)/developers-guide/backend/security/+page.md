# Security

> **Migrated to Supabase.** The Strapi backend was removed in v3.0. This page previously documented the Strapi-based security policies.

## Supabase Equivalent

Security is enforced through Row Level Security (RLS) policies defined in the database schema. Each table has policies controlling read, insert, update, and delete access based on user roles and ownership. See the RLS policy reference for a complete map of all policies.

## References

- Supabase project: `apps/supabase/`
- RLS policies: `apps/supabase/supabase/schema/`
- Policy reference: `.claude/skills/database/rules/rls-policy-map.md`
- Migration commit: Phase 30 of v3.0 Frontend Adapter milestone
