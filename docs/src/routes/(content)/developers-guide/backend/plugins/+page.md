# Backend Extensions

> **Migrated to Supabase.** The Strapi backend was removed in v3.0. This page previously documented the Strapi plugins (email via AWS SES, upload via AWS S3, OpenVAA Admin Tools).

## Supabase Equivalent

Backend extensions are now implemented as Supabase Edge Functions in `apps/supabase/supabase/functions/` and database RPCs. Email is handled by GoTrue (auth emails) and Edge Functions (custom emails). File storage uses Supabase Storage.

## References

- Supabase project: `apps/supabase/`
- Edge Functions: `apps/supabase/supabase/functions/`
- Migration commit: Phase 30 of v3.0 Frontend Adapter milestone
