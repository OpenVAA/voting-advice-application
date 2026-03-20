# Admin Tools

> **Migrated to Supabase.** The Strapi backend was removed in v3.0. This page previously documented the OpenVAA Admin Tools plugin for Strapi.

## Supabase Equivalent

Admin tool functionality is now provided by Edge Functions (`invite-candidate`, `send-email`) and database RPCs (`merge_custom_data`, `bulk_import`). The Admin App in the frontend directly calls these functions.

## References

- Supabase project: `apps/supabase/`
- Edge Functions: `apps/supabase/supabase/functions/`
- Database RPCs: `apps/supabase/supabase/schema/`
- Migration commit: Phase 30 of v3.0 Frontend Adapter milestone
