-- Seed data for OpenVAA local development
-- Runs after all migrations on first `supabase start` and on every `supabase db reset`
--
-- This seed creates the default account and project for single-tenant deployment.
-- Seed data runs as service_role which bypasses RLS, so deny-all policies
-- do not block these inserts.

--------------------------------------------------------------------------------
-- Storage cleanup configuration for pg_net triggers
-- These settings allow triggers to call the Supabase Storage API for automatic
-- file cleanup on entity delete and image column update.
--
-- Values below are the default Supabase local dev settings (not secrets --
-- they are identical for every local Supabase instance).
-- In production, update with actual Supabase URL and service role key.
--------------------------------------------------------------------------------
INSERT INTO storage_config (key, value)
VALUES
  ('supabase_url', 'http://kong:8000'),
  ('service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

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

--------------------------------------------------------------------------------
-- Test auth users for local development
-- Uses fixed UUIDs for idempotent seeding.
-- Passwords are all 'password123' (bcrypt-hashed).
--------------------------------------------------------------------------------

-- Test admin user (project_admin)
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  aud, role, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000000',
  'admin@openvaa.test',
  crypt('password123', gen_salt('bf')),
  now(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now(), '', '',
  '', '', '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- Test candidate user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  aud, role, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000000',
  'candidate@openvaa.test',
  crypt('password123', gen_salt('bf')),
  now(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now(), '', '',
  '', '', '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- Test candidate record linked to the candidate user
INSERT INTO candidates (
  id, project_id, first_name, last_name, auth_user_id
)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000001',
  'Test',
  'Candidate',
  '00000000-0000-0000-0000-000000000011'
)
ON CONFLICT (id) DO NOTHING;

-- Role assignments
INSERT INTO user_roles (id, user_id, role, scope_type, scope_id)
VALUES
  -- Admin user is project_admin for the default project
  (
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000010',
    'project_admin',
    'project',
    '00000000-0000-0000-0000-000000000001'
  ),
  -- Candidate user has candidate role scoped to their candidate record
  (
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000011',
    'candidate',
    'candidate',
    '00000000-0000-0000-0000-000000000020'
  )
ON CONFLICT (id) DO NOTHING;

--------------------------------------------------------------------------------
-- GoTrue auth.users NULL column fix
-- Supabase CLI local GoTrue has a bug where NULL varchar columns in auth.users
-- cause scan errors on listUsers. Fix any existing NULLs to empty strings.
--------------------------------------------------------------------------------
UPDATE auth.users SET
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '');

DO $$ BEGIN RAISE NOTICE 'OpenVAA seed data executed successfully'; END $$;
