-- Seed data for OpenVAA local development
-- Runs after all migrations on first `supabase start` and on every `supabase db reset`
--
-- This seed creates the default account and project for single-tenant deployment.
-- Seed data runs as service_role which bypasses RLS, so deny-all policies
-- do not block these inserts.

-- Default account for single-tenant deployment
INSERT INTO accounts (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Account')
ON CONFLICT (id) DO NOTHING;

-- Default project for single-tenant deployment
INSERT INTO projects (id, account_id, name, default_locale)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Default Project',
  'en'
)
ON CONFLICT (id) DO NOTHING;

-- Default app_settings for the default project
INSERT INTO app_settings (project_id, settings)
VALUES ('00000000-0000-0000-0000-000000000001', '{}'::jsonb)
ON CONFLICT (project_id) DO NOTHING;

DO $$ BEGIN RAISE NOTICE 'OpenVAA seed data executed successfully'; END $$;
