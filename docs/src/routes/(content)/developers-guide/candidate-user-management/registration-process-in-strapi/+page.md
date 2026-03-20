# Registration Process

> **Migrated to Supabase.** The Strapi backend was removed in v3.0. This page previously documented the Strapi-based candidate registration process.

## Supabase Equivalent

Candidate registration now uses the GoTrue invite flow. Admins send invitations via the `invite-candidate` Edge Function, which generates a magic link. When candidates click the link, a session is established server-side via `verifyOtp`. Password setting follows via the standard GoTrue password update flow.

## References

- Supabase project: `apps/supabase/`
- Invite Edge Function: `apps/supabase/supabase/functions/invite-candidate/`
- Phase 28 implementation details
- Migration commit: Phase 30 of v3.0 Frontend Adapter milestone
