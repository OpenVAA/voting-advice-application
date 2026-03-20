# Customized Behaviour

> **Migrated to Supabase.** The Strapi backend was removed in v3.0. This page previously documented the Strapi-based backend customizations.

## Supabase Equivalent

Custom backend behaviour is now implemented through Row Level Security (RLS) policies and database triggers in the schema files, and through Edge Functions for server-side logic like email sending and candidate invitations.

## References

- Supabase project: `apps/supabase/`
- RLS policies and triggers: `apps/supabase/supabase/schema/`
- Edge Functions: `apps/supabase/supabase/functions/`
- Migration commit: Phase 30 of v3.0 Frontend Adapter milestone
