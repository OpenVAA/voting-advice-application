-- Seed data for OpenVAA local development Runs after all migrations on first `supabase start` and on every `supabase db reset`
--
-- This seed creates the default account and project for single-tenant deployment.
-- Seed data runs as service_role which bypasses RLS, so deny-all policies do not block these inserts.
--------------------------------------------------------------------------------
-- Storage cleanup configuration for pg_net triggers These settings allow triggers to call the Supabase Storage API for automatic file cleanup on entity delete and image column update.
--
-- Values below are the default Supabase local dev settings (not secrets -- they are identical for every local Supabase instance).
-- In production, update with actual Supabase URL and service role key.
--------------------------------------------------------------------------------
INSERT INTO
  storage_config (key, value)
VALUES
  ('supabase_url', 'http://kong:8000'),
  (
    'service_role_key',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  )
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value;

-- Default account for single-tenant deployment
INSERT INTO
  accounts (id, name)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Default Account'
  )
ON CONFLICT (id) DO NOTHING;

-- Default project for single-tenant deployment
--
-- Created OPEN FOR VOTERS. The column defaults to the closed direction, which is the safe answer for a project nobody has spoken for; this project is the one a `yarn db:reset` stack serves, and every row in it is read anonymously today. Without the value here a reset local stack renders an empty voter application from 162-08 onward, with the cause three plans back. This is a seed-time value and not a migration-time backfill: no database has been published, so there are no deployed rows to transform (D-14, brief section 10.2).
--
-- `lock_nominations` is deliberately absent. It ships inert and takes its default; see the column comment in `schema/100-tenancy.sql`.
INSERT INTO
  projects (
    id,
    account_id,
    name,
    default_locale,
    open_for_voters
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Default Project',
    'en',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Default app_settings for the default project
INSERT INTO
  app_settings (project_id, settings)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '{}'::jsonb
  )
ON CONFLICT (project_id) DO NOTHING;

--------------------------------------------------------------------------------
-- Test auth users for local development Uses fixed UUIDs for idempotent seeding.
-- Passwords are all 'password123' (bcrypt-hashed).
--------------------------------------------------------------------------------
-- Test admin user (project_admin)
INSERT INTO
  auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    aud,
    role,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000000',
    'admin@openvaa.test',
    crypt ('password123', gen_salt ('bf')),
    now(),
    'authenticated',
    'authenticated',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- Test candidate user
INSERT INTO
  auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    aud,
    role,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000000',
    'candidate@openvaa.test',
    crypt ('password123', gen_salt ('bf')),
    now(),
    'authenticated',
    'authenticated',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- Test candidate record linked to the candidate user
--
-- Created CONFIRMED. This is the identity every local candidate-app session uses, and the confirmation column defaults to the unconfirmed direction; an unconfirmed seeded candidate disappears from the voter app the moment 162-08 makes the column a term of public read. Seed-time value, not a migration-time backfill, for the same reason as the project above.
INSERT INTO
  candidates (
    id,
    project_id,
    first_name,
    last_name,
    auth_user_id,
    confirmed
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    'Test',
    'Candidate',
    '00000000-0000-0000-0000-000000000011',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- The authority of a `yarn db:reset` stack, and the reason these two rows are here at all: from 162-06 the JWT carries `grants` and nothing else, so an identity with no grant row can do nothing. Without them a reset stack is an application whose seeded admin and seeded candidate are both locked out — D-19's requirement stated as two rows.
--
-- 162-15 WROTE THEM OUT. Until this commit they were produced by a transitional backfill function reading the retired role table; both are gone, and these are byte-for-byte the rows that function produced, asserted set-equal in both directions to the image captured from it before it was retired.
--
-- Idempotent by construction: arbitrated on grants_user_scope_target_role_key, so re-running the seed inserts nothing a second time. The named constraint is load-bearing — target_type is NULL on the project row, so an unnamed conflict target would match nothing and a second run would add a duplicate.
INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  -- The admin user, project-scoped on the default project
  (
    '00000000-0000-0000-0000-000000000010',
    'project',
    NULL,
    '00000000-0000-0000-0000-000000000001',
    'admin'
  ),
  -- The candidate user, entity-scoped on its own candidate record
  (
    '00000000-0000-0000-0000-000000000011',
    'entity',
    'candidate',
    '00000000-0000-0000-0000-000000000020',
    'editor'
  )
ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING;

--------------------------------------------------------------------------------
-- GoTrue auth.users NULL column fix Supabase CLI local GoTrue has a bug where NULL varchar columns in auth.users cause scan errors on listUsers. Fix any existing NULLs to empty strings.
--------------------------------------------------------------------------------
UPDATE auth.users
SET
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '');

DO $$ BEGIN RAISE NOTICE 'OpenVAA seed data executed successfully'; END $$;
