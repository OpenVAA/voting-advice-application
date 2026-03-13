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

--------------------------------------------------------------------------------
-- Test auth users for local development
-- Uses fixed UUIDs for idempotent seeding.
-- Passwords are all 'password123' (bcrypt-hashed).
--------------------------------------------------------------------------------

-- Test admin user (project_admin)
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  aud, role, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
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
  now(), now(), '', ''
)
ON CONFLICT (id) DO NOTHING;

-- Test candidate user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  aud, role, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
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
  now(), now(), '', ''
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

DO $$ BEGIN RAISE NOTICE 'OpenVAA seed data executed successfully'; END $$;
