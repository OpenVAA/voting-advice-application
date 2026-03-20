# Authentication

> **Migrated to Supabase.** The Strapi backend was removed in v3.0. This page previously documented the Strapi-based authentication system.

## Supabase Equivalent

Authentication is now handled by GoTrue (Supabase Auth). Candidate registration uses an invite flow via the `invite-candidate` Edge Function. Password reset and login are handled through GoTrue's built-in endpoints. The frontend Supabase adapter implements auth methods in `frontend/src/lib/api/adapters/supabase/`.

## References

- Supabase project: `apps/supabase/`
- Auth hooks and schema: `apps/supabase/supabase/schema/auth/`
- Frontend auth adapter: `frontend/src/lib/api/adapters/supabase/`
- Edge Functions: `apps/supabase/supabase/functions/`
- Migration commit: Phase 30 of v3.0 Frontend Adapter milestone
