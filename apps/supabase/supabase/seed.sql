-- Seed data for OpenVAA local development
-- Runs after all migrations on first `supabase start` and on every `supabase db reset`
--
-- Phase 8: Placeholder validating the seed mechanism works.
-- Phase 9 will add substantive INSERT statements once schema tables exist.

DO $$
BEGIN
  RAISE NOTICE 'OpenVAA seed data executed successfully';
END $$;
