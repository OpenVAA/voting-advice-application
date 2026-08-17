-- Migration 00003: Allow authenticated users to insert feedback
--
-- Background: The feedback popup is reachable from both the voter app (anon
-- role) and the candidate app (authenticated role). The original schema only
-- granted INSERT on public.feedback to the anon role, so authenticated
-- candidate sessions hit a "new row violates row-level security policy"
-- error when submitting feedback. The rate-limit trigger + CHECK constraint
-- already gate the insert regardless of role; the role split was an
-- oversight, not a security boundary.
--
-- Applies to schema files:
--   - apps/supabase/supabase/schema/302-rls.sql (feedback policies)

BEGIN;

CREATE POLICY "authenticated_insert_feedback" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (true);

COMMIT;
