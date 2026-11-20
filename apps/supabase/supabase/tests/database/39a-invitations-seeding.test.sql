-- 39a-invitations-seeding.test.sql: public.invitations and create_invitations, as behaviour
--
-- An invitation promises one grant to whoever proves control of its address or presents its code. This file asserts what the catalogue declares for the table, who may promise which grant, that a duplicate of an open row is refused with the first row unchanged while a claimed row admits a new invitation, how a code is generated, stored and compared, that seeding confirms a named entity when the call says so, who reads and deletes a row, and that seeding sends nothing and writes no grant. The claim is asserted by 39b-invitations-claim.test.sql, the service-role helpers by 39c-invitations-service-helpers.test.sql, the registration-mode condition by 39d-invitations-registration-mode.test.sql, and the recovery mail and identity-provider accounts by 39e-invitations-recovery-identity-provider.test.sql.
--
-- EVERY CASE OF THE AUTHORITY MAP IS ASSERTED TWICE, once through create_invitations and once as a direct INSERT into the table. The map is the INSERT policy's WITH CHECK, so the two paths must agree; a rule that lived only in the function would pass the first half and fail the second.
--
-- A REFUSAL NAMES ITS SQLSTATE AND ITS MESSAGE, because the three kinds of refusal here are different controls. `new row violates row-level security policy` is the authority map. `permission denied for table` is a column or table privilege, checked before any policy. A message naming a constraint is a rule that binds every role, the service role included.
--
-- THE IDENTITIES. The fixture provides the project admin, the account admin, the root admin and the entity editor; their grant rows are written by test_seed_fixture_grants. This file adds a project editor of project A and one of project B. Every session passes an empty array to set_test_user, so each claim is projected from public.grants and from nowhere else.
--
-- THE ENTITIES. Every entity of the fixture's project A is already confirmed, so the cases about confirmation use this file's own unconfirmed rows.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_seed_fixture_grants), 305-invitations.sql (the table, its trigger, privileges and policies), 300-auth-tables.sql (cleanup_grants_on_delete, which also deletes an entity's invitations), 506-invitation-rpcs.sql (create_invitations), 102-entities.sql and 011-validation-functions.sql (the confirmation flag and its gate).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (125);

-- Create test fixture data
SELECT
  create_test_data ();

SELECT
  test_seed_fixture_grants ();

-- Both projects serve candidates and organizations and allow every registration mode for each, so an entity invitation of either type is honoured in every section of this file.
UPDATE app_settings
SET
  settings = settings || jsonb_build_object(
    'contestantApp',
    COALESCE(settings -> 'contestantApp', '{}'::jsonb) || '{
      "servedEntityTypes": {
        "candidate": {"registrationModes": ["identity_provider", "email", "code"]},
        "organization": {"registrationModes": ["identity_provider", "email", "code"]}
      }
    }'::jsonb
  )
WHERE
  project_id IN (test_id ('project_a'), test_id ('project_b'));

-- A project editor of project A and one of project B.
INSERT INTO
  auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    aud,
    role,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at
  )
VALUES
  (
    '39390000-0000-4000-8000-0000000000e1',
    '00000000-0000-0000-0000-000000000000',
    'project_editor_a@test.com',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-0000000000e2',
    '00000000-0000-0000-0000-000000000000',
    'project_editor_b@test.com',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    '39390000-0000-4000-8000-0000000000e1',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-0000000000e2',
    'project',
    NULL,
    test_id ('project_b'),
    'editor'
  );

-- Unconfirmed entities: named and nameless candidates and organizations in project A, and one candidate in project B.
INSERT INTO
  public.candidates (
    id,
    project_id,
    first_name,
    last_name,
    external_id
  )
VALUES
  (
    '39390000-0000-4000-8000-0000000000c1',
    test_id ('project_a'),
    'Nora',
    'Named',
    'inv-cand-named'
  ),
  (
    '39390000-0000-4000-8000-0000000000c2',
    test_id ('project_a'),
    '',
    '',
    'inv-cand-nameless'
  ),
  (
    '39390000-0000-4000-8000-0000000000c3',
    test_id ('project_a'),
    'Una',
    'Uninvited',
    'inv-cand-uninvited'
  ),
  (
    '39390000-0000-4000-8000-0000000000c4',
    test_id ('project_a'),
    'Dana',
    'Direct',
    'inv-cand-direct'
  ),
  (
    '39390000-0000-4000-8000-0000000000c5',
    test_id ('project_b'),
    'Bea',
    'Elsewhere',
    'inv-cand-only-b'
  ),
  (
    '39390000-0000-4000-8000-0000000000c6',
    test_id ('project_a'),
    'Mia',
    'Mailless',
    'inv-cand-mail'
  );

INSERT INTO
  public.organizations (id, project_id, name, external_id)
VALUES
  (
    '39390000-0000-4000-8000-0000000000a1',
    test_id ('project_a'),
    '{"en":"Named Org"}'::jsonb,
    'inv-org-named'
  ),
  (
    '39390000-0000-4000-8000-0000000000a2',
    test_id ('project_a'),
    '{"en":"   "}'::jsonb,
    'inv-org-nameless'
  ),
  (
    '39390000-0000-4000-8000-0000000000a3',
    test_id ('project_a'),
    '{"en":"Mail Org"}'::jsonb,
    'inv-org-mail'
  );

-- What public.grants holds before any invitation is seeded, for the last section.
DO $$
BEGIN
  PERFORM set_config(
    't39.grants_before',
    (SELECT count(*)::text || ' ' || md5(string_agg(g.id::text, ',' ORDER BY g.id)) FROM public.grants g),
    true
  );
END;
$$;

-- =====================================================================
-- Section 1: what the catalogue declares
-- =====================================================================
SELECT
  has_table (
    'public',
    'invitations',
    'invitations table exists'
  );

SELECT
  is (
    (
      SELECT
        c.relrowsecurity
      FROM
        pg_class c
      WHERE
        c.oid = 'public.invitations'::regclass
    ),
    true,
    'row-level security is enabled on invitations'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          p.policyname || ' ' || p.cmd || ' ' || p.roles::text,
          ' | '
          ORDER BY
            p.policyname
        )
      FROM
        pg_policies p
      WHERE
        p.schemaname = 'public'
        AND p.tablename = 'invitations'
    ),
    'admin_delete_invitations DELETE {authenticated} | admin_insert_invitations INSERT {authenticated} | admin_select_invitations SELECT {authenticated}',
    'exactly three policies, one per command, each for authenticated, and none for UPDATE'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          c.conname,
          ','
          ORDER BY
            c.conname
        )
      FROM
        pg_constraint c
      WHERE
        c.conrelid = 'public.invitations'::regclass
        AND c.contype = 'c'
    ),
    'invitations_binding_check,invitations_claimed_by_needs_claimed_at_check,invitations_code_hash_format_check,invitations_email_normalised_check,invitations_entity_scope_target_type_check,invitations_pending_email_check,invitations_project_target_check,invitations_role_confers_check,invitations_scope_check,invitations_target_id_scope_check',
    'the ten named CHECK constraints'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          c.conname || ' ' || c.confdeltype::text,
          ', '
          ORDER BY
            c.conname
        )
      FROM
        pg_constraint c
      WHERE
        c.conrelid = 'public.invitations'::regclass
        AND c.contype = 'f'
    ),
    'invitations_claimed_by_fkey n, invitations_created_by_fkey n, invitations_project_id_fkey c',
    'three foreign keys: both user columns go to null with their user, and a row goes with its project'
  );

SELECT
  is (
    (
      SELECT
        i.indexdef
      FROM
        pg_indexes i
      WHERE
        i.schemaname = 'public'
        AND i.indexname = 'invitations_email_target_key'
    ),
    'CREATE UNIQUE INDEX invitations_email_target_key ON public.invitations USING btree (project_id, email, scope, target_type, target_id) NULLS NOT DISTINCT WHERE ((email IS NOT NULL) AND (claimed_at IS NULL))',
    'REINV: invitations_email_target_key is unique over the project, the address and the target of the open rows, NULLS NOT DISTINCT, with the role outside the key'
  );

SELECT
  is (
    (
      SELECT
        i.indexdef
      FROM
        pg_indexes i
      WHERE
        i.schemaname = 'public'
        AND i.indexname = 'invitations_code_hash_key'
    ),
    'CREATE UNIQUE INDEX invitations_code_hash_key ON public.invitations USING btree (project_id, code_hash) WHERE (code_hash IS NOT NULL)',
    'invitations_code_hash_key is unique over the project and the code hash, with the target outside the key'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          t.tgrelid::regclass::text,
          ','
          ORDER BY
            t.tgrelid::regclass::text
        )
      FROM
        pg_trigger t
      WHERE
        t.tgfoid = 'public.cleanup_grants_on_delete()'::regprocedure
        AND NOT t.tgisinternal
        AND t.tgrelid IN (
          'public.candidates'::regclass,
          'public.organizations'::regclass,
          'public.factions'::regclass,
          'public.alliances'::regclass
        )
    ),
    'alliances,candidates,factions,organizations',
    'the cleanup trigger that deletes an entity''s grants and invitations sits on the four entity tables'
  );

SELECT
  is (
    has_table_privilege(
      'anon',
      'public.invitations',
      'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
    )
    OR has_any_column_privilege(
      'anon',
      'public.invitations',
      'SELECT, INSERT, UPDATE, REFERENCES'
    ),
    false,
    'anon holds no privilege on invitations, on the table or on any column'
  );

SELECT
  is (
    has_any_column_privilege('authenticated', 'public.invitations', 'UPDATE'),
    false,
    'authenticated holds no UPDATE on invitations, on the table or on any column'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          a.attname,
          ','
          ORDER BY
            a.attnum
        )
      FROM
        pg_attribute a
      WHERE
        a.attrelid = 'public.invitations'::regclass
        AND a.attnum > 0
        AND NOT a.attisdropped
        AND has_column_privilege('authenticated', a.attrelid, a.attnum, 'INSERT')
    ),
    'project_id,scope,target_type,target_id,role,email,expires_at',
    'authenticated may insert the promise, the address and the expiry and no other column: not code_hash, pending_email, created_by, claimed_by or claimed_at'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          a.attname,
          ','
          ORDER BY
            a.attnum
        )
      FROM
        pg_attribute a
      WHERE
        a.attrelid = 'public.invitations'::regclass
        AND a.attnum > 0
        AND NOT a.attisdropped
        AND has_column_privilege('authenticated', a.attrelid, a.attnum, 'SELECT')
    ),
    'id,project_id,scope,target_type,target_id,role,email,expires_at,created_by,created_at,claimed_by,claimed_at',
    'authenticated may select every column except code_hash, pending_email and pending_email_at'
  );

SELECT
  is (
    has_table_privilege('authenticated', 'public.invitations', 'DELETE'),
    true,
    'authenticated holds DELETE on invitations'
  );

SELECT
  is (
    (
      SELECT
        p.prosecdef
      FROM
        pg_proc p
      WHERE
        p.oid = 'public.create_invitations(uuid, jsonb, boolean)'::regprocedure
    ),
    false,
    'create_invitations is SECURITY INVOKER'
  );

SELECT
  is (
    ARRAY[
      has_function_privilege(
        'anon',
        'public.create_invitations(uuid, jsonb, boolean)',
        'EXECUTE'
      ),
      has_function_privilege(
        'authenticated',
        'public.create_invitations(uuid, jsonb, boolean)',
        'EXECUTE'
      ),
      has_function_privilege(
        'service_role',
        'public.create_invitations(uuid, jsonb, boolean)',
        'EXECUTE'
      )
    ],
    ARRAY[false, true, true],
    'create_invitations is executable by authenticated and service_role and not by anon'
  );

-- =====================================================================
-- Section 2: the authority map, through the function and through the table
-- =====================================================================
-- ---------------------------------------------------------------------
-- A project editor: an entity editor's grant, and nothing above it
-- ---------------------------------------------------------------------
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  lives_ok (
    $$SELECT set_config('t39.named_cand', public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","external_id":"inv-cand-named","email":"  Invitee.One@Test.Example "}]', true)::text, true)$$,
    'a project editor promises an entity editor''s grant on a candidate of the project, by email, through create_invitations'
  );

SELECT
  is (
    current_setting('t39.named_cand')::jsonb -> 0 ->> 'email',
    'invitee.one@test.example',
    'the address is stored and returned trimmed and lower-cased'
  );

SELECT
  is (
    current_setting('t39.named_cand')::jsonb -> 0 ->> 'target_id',
    '39390000-0000-4000-8000-0000000000c1',
    'an external_id that exists in the project is resolved to its entity'
  );

SELECT
  is (
    current_setting('t39.named_cand')::jsonb -> 0 -> 'code',
    'null'::jsonb,
    'an email item returns no code'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email) VALUES (test_id('project_a'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c4', 'editor', 'direct.cand@test.example')$$,
    'a project editor promises the same shape on another candidate by a direct insert'
  );

SELECT
  lives_ok (
    $$SELECT set_config('t39.org_code', public.create_invitations(test_id('project_a'), '[{"target_type":"organization","external_id":"inv-org-named"}]', true)::text, true)$$,
    'a project editor promises an entity editor''s grant on an organization with no email, through create_invitations'
  );

SELECT
  matches (
    current_setting('t39.org_code')::jsonb -> 0 ->> 'code',
    '^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$',
    'the returned code is twelve Crockford base-32 symbols in three groups of four'
  );

SELECT
  is (
    current_setting('openvaa.generated_invitation_code', true),
    '',
    'create_invitations clears the transaction-local setting that carried the code'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role) VALUES (test_id('project_a'), 'entity', 'organization', '39390000-0000-4000-8000-0000000000a1', 'editor')$$,
    'a direct insert with no email writes a second code row for the same organization'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"scope":"project","role":"editor","email":"self@test.example"}]', true)$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'self-promotion: a project editor promising a project editor''s grant on their own project is refused through create_invitations'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"scope":"project","role":"admin","email":"self@test.example"}]', true)$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'self-promotion: a project editor promising a project admin''s grant on their own project is refused through create_invitations'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_id, role, email) VALUES (test_id('project_a'), 'project', test_id('project_a'), 'editor', 'self@test.example')$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'self-promotion: the same project editor''s promise is refused as a direct insert'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_id, role, email) VALUES (test_id('project_a'), 'project', test_id('project_a'), 'admin', 'self@test.example')$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'self-promotion: the same project admin''s promise is refused as a direct insert'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","target_id":"39390000-0000-4000-8000-0000000000c5","email":"cross@test.example"}]', true)$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'a project editor of project A naming a candidate of project B as the target is refused through create_invitations'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email) VALUES (test_id('project_a'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c5', 'editor', 'cross@test.example')$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'the same cross-project target is refused as a direct insert'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_b'), '[{"target_type":"candidate","target_id":"39390000-0000-4000-8000-0000000000c5","email":"cross@test.example"}]', true)$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'a project editor of project A seeding into project B is refused through create_invitations'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email) VALUES (test_id('project_b'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c5', 'editor', 'cross@test.example')$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'the same seeding into project B is refused as a direct insert'
  );

-- The item's shape. Each refusal names the item's index and never its address.
SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","external_id":"inv-cand-only-b","email":"shape@test.example"}]', true)$$,
    '22023',
    'create_invitations: p_invitations[0] names no candidate with that external_id in the project',
    'an external_id that exists only in the other project is not resolved'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","external_id":"inv-cand-uninvited","email":"first@test.example"},{"target_type":"candidate","external_id":"inv-cand-named","target_id":"39390000-0000-4000-8000-0000000000c1","email":"shape@test.example"}]', true)$$,
    '22023',
    'create_invitations: p_invitations[1] must name its entity by exactly one of target_id and external_id',
    'an item with both a target_id and an external_id is refused, naming its index'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","email":"shape@test.example"}]', true)$$,
    '22023',
    'create_invitations: p_invitations[0] must name its entity by exactly one of target_id and external_id',
    'an item with neither a target_id nor an external_id is refused'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"external_id":"inv-cand-named","email":"shape@test.example"}]', true)$$,
    '22023',
    'create_invitations: p_invitations[0] is an entity-scope item and needs a target_type',
    'an entity-scope item with no target_type is refused'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '{"target_type":"candidate"}', true)$$,
    '22023',
    'create_invitations: p_invitations must be a JSON array',
    'a batch that is not a JSON array is refused'
  );

-- ---------------------------------------------------------------------
-- A project admin: a project editor's grant, and not a peer's
-- ---------------------------------------------------------------------
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    public.create_invitations (
      test_id ('project_a'),
      '[{"scope":"project","role":"editor","email":"new.editor@test.example"}]',
      true
    ) -> 0 ->> 'target_id',
    test_id ('project_a')::text,
    'a project admin promises a project editor''s grant through create_invitations, and the target is the project'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_id, role, email) VALUES (test_id('project_a'), 'project', test_id('project_a'), 'editor', 'direct.editor@test.example')$$,
    'a project admin promises a project editor''s grant by a direct insert'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"scope":"project","role":"admin","email":"peer@test.example"}]', true)$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'a project admin promising a project admin''s grant is refused through create_invitations'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_id, role, email) VALUES (test_id('project_a'), 'project', test_id('project_a'), 'admin', 'peer@test.example')$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'a project admin promising a project admin''s grant is refused as a direct insert'
  );

-- ---------------------------------------------------------------------
-- An account admin: a project admin's grant
-- ---------------------------------------------------------------------
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('account_admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    public.create_invitations (
      test_id ('project_a'),
      '[{"scope":"project","role":"admin","email":"new.admin@test.example"}]',
      true
    ) -> 0 ->> 'role',
    'admin',
    'an account admin promises a project admin''s grant through create_invitations'
  );

SELECT
  lives_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_id, role, email) VALUES (test_id('project_a'), 'project', test_id('project_a'), 'admin', 'direct.admin@test.example')$$,
    'an account admin promises a project admin''s grant by a direct insert'
  );

-- ---------------------------------------------------------------------
-- A root admin: the shapes no caller may promise
-- ---------------------------------------------------------------------
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('super_admin'),
    '[]'::jsonb
  );

SELECT
  is (
    public.create_invitations (
      test_id ('project_a'),
      '[{"scope":"project","role":"admin","email":"root.made@test.example"}]',
      true
    ) -> 0 ->> 'role',
    'admin',
    'control: a root admin promises a project admin''s grant, so the refusals below are about the shape and not the caller'
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.create_invitations(test_id('project_a'), '[{"scope":"account","role":"admin","target_id":"%s","email":"shape@test.example"}]', true)$$,
      test_id ('account_a')
    ),
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'a root admin promising an account-scope grant is refused through create_invitations'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_id, role, email) VALUES (test_id('project_a'), 'account', test_id('account_a'), 'admin', 'shape@test.example')$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'a root admin promising an account-scope grant is refused as a direct insert'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"scope":"global","role":"admin","email":"shape@test.example"}]', true)$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'a root admin promising a global-scope grant is refused through create_invitations'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, role, email) VALUES (test_id('project_a'), 'global', 'admin', 'shape@test.example')$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'a root admin promising a global-scope grant is refused as a direct insert'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","external_id":"inv-cand-uninvited","role":"admin","email":"shape@test.example"}]', true)$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'a root admin promising an entity-scope admin grant, which confers nothing, is refused through create_invitations'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email) VALUES (test_id('project_a'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c3', 'admin', 'shape@test.example')$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'a root admin promising an entity-scope admin grant is refused as a direct insert'
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.create_invitations(test_id('project_a'), '[{"scope":"project","role":"editor","target_id":"%s","email":"shape@test.example"}]', true)$$,
      test_id ('project_b')
    ),
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'a root admin promising a project editor''s grant with another project as the target is refused through create_invitations'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_id, role, email) VALUES (test_id('project_a'), 'project', test_id('project_b'), 'editor', 'shape@test.example')$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'a root admin promising a project editor''s grant with another project as the target is refused as a direct insert'
  );

-- ---------------------------------------------------------------------
-- The same shapes with row-level security bypassed: the CHECK constraints bind every role
-- ---------------------------------------------------------------------
SELECT
  reset_role ();

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_id, role, email) VALUES (test_id('project_a'), 'account', test_id('account_a'), 'admin', 'shape@test.example')$$,
    '23514',
    'new row for relation "invitations" violates check constraint "invitations_scope_check"',
    'an account-scope promise inserted by the superuser role is refused by invitations_scope_check'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, role, email) VALUES (test_id('project_a'), 'global', 'admin', 'shape@test.example')$$,
    '23514',
    'new row for relation "invitations" violates check constraint "invitations_scope_check"',
    'a global-scope promise inserted by the superuser role is refused by invitations_scope_check'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email) VALUES (test_id('project_a'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c3', 'admin', 'shape@test.example')$$,
    '23514',
    'new row for relation "invitations" violates check constraint "invitations_role_confers_check"',
    'an entity-scope admin promise inserted by the superuser role is refused by invitations_role_confers_check'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_id, role, email) VALUES (test_id('project_a'), 'project', test_id('project_b'), 'editor', 'shape@test.example')$$,
    '23514',
    'new row for relation "invitations" violates check constraint "invitations_project_target_check"',
    'a project-scope promise naming another project, inserted by the superuser role, is refused by invitations_project_target_check'
  );

SET
  LOCAL ROLE service_role;

SELECT
  throws_ok (
    format(
      $$SELECT public.create_invitations(test_id('project_a'), '[{"scope":"account","role":"admin","target_id":"%s","email":"shape@test.example"}]', true)$$,
      test_id ('account_a')
    ),
    '23514',
    'new row for relation "invitations" violates check constraint "invitations_scope_check"',
    'the service role, which bypasses the policies, is refused an account-scope promise by invitations_scope_check'
  );

SELECT
  matches (
    public.create_invitations (
      test_id ('project_a'),
      jsonb_build_array(
        jsonb_build_object(
          'target_type',
          'candidate',
          'target_id',
          test_id ('candidate_a2')
        )
      ),
      true
    ) -> 0 ->> 'code',
    '^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$',
    'the service role seeds an entity editor''s promise and receives its code'
  );

SELECT
  reset_role ();

-- ---------------------------------------------------------------------
-- An entity editor and an anonymous caller: nothing
-- ---------------------------------------------------------------------
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","target_id":"%s","email":"own@test.example"}]', true)$$,
      test_id ('candidate_a')
    ),
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'an entity editor promising a grant on their own candidate is refused through create_invitations'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email) VALUES (test_id('project_a'), 'entity', 'candidate', test_id('candidate_a'), 'editor', 'own@test.example')$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'an entity editor promising a grant on their own candidate is refused as a direct insert'
  );

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[]', true)$$,
    '42501',
    'permission denied for function create_invitations',
    'anon cannot execute create_invitations'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email) VALUES (test_id('project_a'), 'entity', 'candidate', test_id('candidate_a'), 'editor', 'anon@test.example')$$,
    '42501',
    'permission denied for table invitations',
    'anon cannot insert into invitations'
  );

-- =====================================================================
-- Section 3: no rewrite
-- =====================================================================
-- A row's promise, address and expiry cannot be changed after the insert, by the admin who seeded it or by anyone.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(i.id)::integer
      FROM
        public.invitations i
      WHERE
        i.email = 'new.editor@test.example'
        AND i.created_by = test_user_id ('admin_a')
    ),
    1,
    'precondition: the project admin reads the row they seeded, recorded as created by them'
  );

SELECT
  throws_ok (
    $$UPDATE public.invitations SET role = 'admin' WHERE email = 'new.editor@test.example'$$,
    '42501',
    'permission denied for table invitations',
    'a project admin cannot rewrite the role of a row they seeded'
  );

SELECT
  throws_ok (
    $$UPDATE public.invitations SET email = 'someone.else@test.example' WHERE email = 'new.editor@test.example'$$,
    '42501',
    'permission denied for table invitations',
    'a project admin cannot rewrite the address of a row they seeded'
  );

SELECT
  throws_ok (
    $$UPDATE public.invitations SET expires_at = now() + interval '10 years' WHERE email = 'new.editor@test.example'$$,
    '42501',
    'permission denied for table invitations',
    'a project admin cannot rewrite the expiry of a row they seeded'
  );

-- =====================================================================
-- Section 4: duplicates
-- =====================================================================
-- The first row is backdated, so "unchanged" is a statement about the row and not about the transaction's one clock reading.
SELECT
  reset_role ();

UPDATE public.invitations
SET
  created_at = '2001-01-01T00:00:00Z'
WHERE
  id = (
    current_setting('t39.named_cand')::jsonb -> 0 ->> 'id'
  )::uuid;

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","external_id":"inv-cand-named","email":"INVITEE.ONE@TEST.EXAMPLE"}]', true)$$,
    '23505',
    'duplicate key value violates unique constraint "invitations_email_target_key"',
    'the same address for the same target, typed in another letter case, is refused through create_invitations by invitations_email_target_key'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email) VALUES (test_id('project_a'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c1', 'editor', ' Invitee.One@test.example')$$,
    '23505',
    'duplicate key value violates unique constraint "invitations_email_target_key"',
    'the same duplicate is refused as a direct insert'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          i.id::text || ' ' || (
            i.created_at = '2001-01-01T00:00:00Z'::timestamptz
          )::text,
          ','
        )
      FROM
        public.invitations i
      WHERE
        i.email = 'invitee.one@test.example'
        AND i.target_id = '39390000-0000-4000-8000-0000000000c1'
    ),
    (
      current_setting('t39.named_cand')::jsonb -> 0 ->> 'id'
    ) || ' true',
    'after both refusals the first row is the only one for that address and target, with its id and created_at unchanged'
  );

SELECT
  is (
    public.create_invitations (
      test_id ('project_a'),
      '[{"target_type":"organization","external_id":"inv-org-named","email":"invitee.one@test.example"}]',
      true
    ) -> 0 ->> 'target_type',
    'organization',
    'the same address on another target is accepted: one person may be promised several grants'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","external_id":"inv-cand-nameless","email":"batch.first@test.example"},{"target_type":"candidate","external_id":"inv-cand-named","email":"invitee.one@test.example"}]', true)$$,
    '23505',
    'duplicate key value violates unique constraint "invitations_email_target_key"',
    'a batch of two whose second item is a duplicate raises'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations i
      WHERE
        i.email = 'batch.first@test.example'
    ),
    0,
    'the refused batch left no row: its first item was not written'
  );

-- At project scope the role is outside the key, and target_type is null on both rows.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('account_admin_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"scope":"project","role":"admin","email":"new.editor@test.example"}]', true)$$,
    '23505',
    'duplicate key value violates unique constraint "invitations_email_target_key"',
    'at project scope the same address with the other role is refused through create_invitations by the same index'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_id, role, email) VALUES (test_id('project_a'), 'project', test_id('project_a'), 'admin', 'new.editor@test.example')$$,
    '23505',
    'duplicate key value violates unique constraint "invitations_email_target_key"',
    'at project scope the same duplicate is refused as a direct insert'
  );

SELECT
  reset_role ();

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, code_hash) SELECT i.project_id, 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c3', 'editor', i.code_hash FROM public.invitations i WHERE i.id = (current_setting('t39.org_code')::jsonb -> 0 ->> 'id')::uuid$$,
    '23505',
    'duplicate key value violates unique constraint "invitations_code_hash_key"',
    'a second row carrying a code hash the project already holds, on another target, is refused by invitations_code_hash_key'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email, code_hash) VALUES (test_id('project_a'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c3', 'editor', 'both@test.example', repeat('b', 64))$$,
    '23514',
    'new row for relation "invitations" violates check constraint "invitations_binding_check"',
    'a row carrying both an address and a code hash is refused by invitations_binding_check'
  );

-- Only an open row counts: a claimed row, and the row of a claimant since deleted, admit a new invitation for their address and target. Each row these cases seed is deleted after its case, so the sections below see the rows they saw before.
UPDATE public.invitations
SET
  claimed_at = now(),
  claimed_by = test_user_id ('candidate_b')
WHERE
  id = (
    current_setting('t39.named_cand')::jsonb -> 0 ->> 'id'
  )::uuid;

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  lives_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","external_id":"inv-cand-named","email":"invitee.one@test.example"}]', true)$$,
    'REINV: a claimed row admits a second invitation for its address and target'
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","external_id":"inv-cand-named","email":"invitee.one@test.example"}]', true)$$,
    '23505',
    'duplicate key value violates unique constraint "invitations_email_target_key"',
    'REINV: two open invitations for one address and target still collide'
  );

SELECT
  reset_role ();

DELETE FROM public.invitations i
WHERE
  i.email = 'invitee.one@test.example'
  AND i.target_id = '39390000-0000-4000-8000-0000000000c1'
  AND i.claimed_at IS NULL;

-- A claimant who is deleted leaves the row claimed: claimed_by goes to null and claimed_at stays.
INSERT INTO
  auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    aud,
    role,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at
  )
VALUES
  (
    '39390000-0000-4000-8000-00000006e001',
    '00000000-0000-0000-0000-000000000000',
    'reinv.deleted@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

INSERT INTO
  public.invitations (
    project_id,
    scope,
    target_type,
    target_id,
    role,
    email,
    claimed_at,
    claimed_by
  )
VALUES
  (
    test_id ('project_a'),
    'entity',
    'candidate',
    '39390000-0000-4000-8000-0000000000c1',
    'editor',
    'reinv.deleted@test.example',
    now(),
    '39390000-0000-4000-8000-00000006e001'
  );

DELETE FROM auth.users
WHERE
  id = '39390000-0000-4000-8000-00000006e001';

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  lives_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","external_id":"inv-cand-named","email":"reinv.deleted@test.example"}]', true)$$,
    'REINV: after the claimant is deleted, the address is invited again'
  );

SELECT
  reset_role ();

DELETE FROM public.invitations i
WHERE
  i.email = 'reinv.deleted@test.example';

-- A project editor whose invitation was claimed is promoted by a project admin invitation for the same address; the role is outside the key, so only the claim lets the second row in.
INSERT INTO
  public.invitations (
    project_id,
    scope,
    target_id,
    role,
    email,
    claimed_at,
    claimed_by
  )
VALUES
  (
    test_id ('project_a'),
    'project',
    test_id ('project_a'),
    'editor',
    'reinv.promoted@test.example',
    now(),
    test_user_id ('candidate_b')
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('account_admin_a'),
    '[]'::jsonb
  );

SELECT
  lives_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"scope":"project","role":"admin","email":"reinv.promoted@test.example"}]', true)$$,
    'REINV: a claimed project editor invitation admits a project admin invitation for the same address'
  );

SELECT
  reset_role ();

DELETE FROM public.invitations i
WHERE
  i.email = 'reinv.promoted@test.example';

-- =====================================================================
-- Section 5: the code
-- =====================================================================
SELECT
  reset_role ();

SELECT
  is (
    private.normalise_invitation_code ('abcd-efgh-0110'),
    'ABCDEFGH0110',
    'normalising upper-cases a code and drops its separators'
  );

SELECT
  is (
    private.normalise_invitation_code ('  abcd efgh oilo '),
    private.normalise_invitation_code ('ABCD-EFGH-0110'),
    'a code typed in lower case, with spaces for hyphens and O, I, L for 0, 1, 1, normalises to the same value'
  );

SELECT
  matches (
    (
      SELECT
        i.code_hash
      FROM
        public.invitations i
      WHERE
        i.id = (
          current_setting('t39.org_code')::jsonb -> 0 ->> 'id'
        )::uuid
    ),
    '^[0-9a-f]{64}$',
    'the stored code hash is 64 lower-case hex characters'
  );

SELECT
  is (
    (
      SELECT
        i.code_hash
      FROM
        public.invitations i
      WHERE
        i.id = (
          current_setting('t39.org_code')::jsonb -> 0 ->> 'id'
        )::uuid
    ),
    private.invitation_code_hash (
      current_setting('t39.org_code')::jsonb -> 0 ->> 'code'
    ),
    'the stored code hash is the hash of the code create_invitations returned'
  );

SELECT
  is (
    private.invitation_code_hash (
      lower(
        replace(
          current_setting('t39.org_code')::jsonb -> 0 ->> 'code',
          '-',
          ' '
        )
      )
    ),
    (
      SELECT
        i.code_hash
      FROM
        public.invitations i
      WHERE
        i.id = (
          current_setting('t39.org_code')::jsonb -> 0 ->> 'id'
        )::uuid
    ),
    'the returned code typed in lower case with spaces hashes to the stored value'
  );

SELECT
  is (
    (
      SELECT
        count(DISTINCT s.code) FILTER (
          WHERE
            s.code ~ '^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$'
        )::integer
      FROM
        (
          SELECT
            private.generate_invitation_code () AS code
          FROM
            generate_series(1, 100)
        ) s
    ),
    100,
    'one hundred generated codes are pairwise distinct and each is three groups of four Crockford symbols'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations i
      WHERE
        i.target_id = '39390000-0000-4000-8000-0000000000a1'
        AND i.email IS NULL
        AND i.code_hash ~ '^[0-9a-f]{64}$'
    ),
    2,
    'the organization holds two code rows, the direct insert''s among them: its hash was generated by the trigger'
  );

-- What a caller may not state, and may not read back.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, code_hash) VALUES (test_id('project_a'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c3', 'editor', repeat('a', 64))$$,
    '42501',
    'permission denied for table invitations',
    'a direct insert naming code_hash is refused: a caller cannot plant a code of their choosing'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email, claimed_at) VALUES (test_id('project_a'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c3', 'editor', 'state@test.example', now())$$,
    '42501',
    'permission denied for table invitations',
    'a direct insert naming claimed_at is refused'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email, claimed_by) VALUES (test_id('project_a'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c3', 'editor', 'state@test.example', '39390000-0000-4000-8000-0000000000e1')$$,
    '42501',
    'permission denied for table invitations',
    'a direct insert naming claimed_by is refused'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, pending_email) VALUES (test_id('project_a'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c3', 'editor', 'state@test.example')$$,
    '42501',
    'permission denied for table invitations',
    'a direct insert naming pending_email is refused'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role, email, created_by) VALUES (test_id('project_a'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c3', 'editor', 'state@test.example', test_user_id('admin_a'))$$,
    '42501',
    'permission denied for table invitations',
    'a direct insert naming created_by is refused: a caller cannot attribute a promise to someone else'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.invitations (project_id, scope, target_type, target_id, role) VALUES (test_id('project_a'), 'entity', 'candidate', '39390000-0000-4000-8000-0000000000c3', 'editor') RETURNING code_hash$$,
    '42501',
    'permission denied for table invitations',
    'a direct insert with no email cannot return its code hash, so its code is known to nobody'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    $$SELECT code_hash FROM public.invitations$$,
    '42501',
    'permission denied for table invitations',
    'a project admin cannot select code_hash'
  );

SELECT
  throws_ok (
    $$SELECT pending_email FROM public.invitations$$,
    '42501',
    'permission denied for table invitations',
    'a project admin cannot select pending_email'
  );

SELECT
  throws_ok (
    $$SELECT * FROM public.invitations$$,
    '42501',
    'permission denied for table invitations',
    'a project admin cannot select every column: a query names the columns it may read'
  );

-- =====================================================================
-- Section 6: seeding confirms a named entity when the call says so
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  is (
    jsonb_array_length(
      public.create_invitations (
        test_id ('project_a'),
        '[{"target_type":"candidate","external_id":"inv-cand-nameless","email":"nameless.cand@test.example"},{"target_type":"organization","external_id":"inv-org-nameless","email":"nameless.org@test.example"}]',
        true
      )
    ),
    2,
    'an invitation for a nameless candidate and one for a nameless organization are accepted'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        c.confirmed
      FROM
        public.candidates c
      WHERE
        c.id = '39390000-0000-4000-8000-0000000000c1'
    ),
    true,
    'a named candidate seeded by a call that confirms is confirmed from the moment it is seeded'
  );

SELECT
  is (
    (
      SELECT
        o.confirmed
      FROM
        public.organizations o
      WHERE
        o.id = '39390000-0000-4000-8000-0000000000a1'
    ),
    true,
    'a named organization seeded by a call that confirms is confirmed from the moment it is seeded'
  );

SELECT
  is (
    (
      SELECT
        c.confirmed
      FROM
        public.candidates c
      WHERE
        c.id = '39390000-0000-4000-8000-0000000000c2'
    ),
    false,
    'a candidate whose two names are empty stays unconfirmed'
  );

SELECT
  is (
    (
      SELECT
        o.confirmed
      FROM
        public.organizations o
      WHERE
        o.id = '39390000-0000-4000-8000-0000000000a2'
    ),
    false,
    'an organization whose name has no text stays unconfirmed'
  );

SELECT
  is (
    (
      SELECT
        c.confirmed
      FROM
        public.candidates c
      WHERE
        c.id = '39390000-0000-4000-8000-0000000000c3'
    ),
    false,
    'a named candidate nobody invited stays unconfirmed, the refused attempts above included'
  );

SELECT
  is (
    (
      SELECT
        c.confirmed
      FROM
        public.candidates c
      WHERE
        c.id = '39390000-0000-4000-8000-0000000000c4'
    ),
    false,
    'a direct insert confirms nothing: confirming is what create_invitations does'
  );

-- A project-scope promise names no entity.
DO $$
BEGIN
  PERFORM set_config(
    't39.confirmed_before',
    (
      SELECT md5(string_agg(e.id::text || e.confirmed::text, ',' ORDER BY e.id))
      FROM (
        SELECT id, confirmed FROM public.candidates
        UNION ALL SELECT id, confirmed FROM public.organizations
        UNION ALL SELECT id, confirmed FROM public.factions
        UNION ALL SELECT id, confirmed FROM public.alliances
      ) e
    ),
    true
  );
END;
$$;

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    public.create_invitations (
      test_id ('project_a'),
      '[{"scope":"project","role":"editor","email":"another.editor@test.example"}]',
      true
    ) -> 0 ->> 'scope',
    'project',
    'a project-scope promise is seeded'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        md5(
          string_agg(
            e.id::text || e.confirmed::text,
            ','
            ORDER BY
              e.id
          )
        )
      FROM
        (
          SELECT
            id,
            confirmed
          FROM
            public.candidates
          UNION ALL
          SELECT
            id,
            confirmed
          FROM
            public.organizations
          UNION ALL
          SELECT
            id,
            confirmed
          FROM
            public.factions
          UNION ALL
          SELECT
            id,
            confirmed
          FROM
            public.alliances
        ) e
    ),
    current_setting('t39.confirmed_before'),
    'the project-scope promise changed the confirmation flag of no entity'
  );

-- =====================================================================
-- Section 7: who reads a row, who deletes one, and what a row outlives
-- =====================================================================
-- One promise in project B, so that a reader of one project is measured against a row of the other.
INSERT INTO
  public.invitations (
    project_id,
    scope,
    target_type,
    target_id,
    role,
    email
  )
VALUES
  (
    test_id ('project_b'),
    'entity',
    'candidate',
    '39390000-0000-4000-8000-0000000000c5',
    'editor',
    'b.invitee@test.example'
  );

DO $$
BEGIN
  PERFORM set_config('t39.n_entity', (SELECT count(*)::text FROM public.invitations i WHERE i.project_id = test_id('project_a') AND i.scope = 'entity'), true);
  PERFORM set_config('t39.n_project_editor', (SELECT count(*)::text FROM public.invitations i WHERE i.project_id = test_id('project_a') AND i.scope = 'project' AND i.role = 'editor'), true);
  PERFORM set_config('t39.n_project_admin', (SELECT count(*)::text FROM public.invitations i WHERE i.project_id = test_id('project_a') AND i.scope = 'project' AND i.role = 'admin'), true);
END;
$$;

SELECT
  ok (
    current_setting('t39.n_entity')::integer > 0
    AND current_setting('t39.n_project_editor')::integer > 0
    AND current_setting('t39.n_project_admin')::integer > 0,
    'precondition: project A holds promises of all three shapes, so each reader below is measured against rows it must not see'
  );

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    $$SELECT id FROM public.invitations$$,
    '42501',
    'permission denied for table invitations',
    'anon cannot select from invitations'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(i.id)::integer
      FROM
        public.invitations i
    ),
    0,
    'an entity editor reads no invitation'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e2',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        string_agg(i.project_id::text, ',')
      FROM
        public.invitations i
    ),
    test_id ('project_b')::text,
    'a project editor of project B reads the one promise of project B and none of project A'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(i.id)::text || ' ' || string_agg(
          DISTINCT i.scope::text || '/' || i.role::text,
          ','
          ORDER BY
            i.scope::text || '/' || i.role::text
        )
      FROM
        public.invitations i
    ),
    current_setting('t39.n_entity') || ' entity/editor',
    'a project editor reads every entity promise of the project and no project-scope promise'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(i.id)::text || ' ' || string_agg(
          DISTINCT i.scope::text || '/' || i.role::text,
          ','
          ORDER BY
            i.scope::text || '/' || i.role::text
        )
      FROM
        public.invitations i
    ),
    (
      current_setting('t39.n_entity')::integer + current_setting('t39.n_project_editor')::integer
    )::text || ' entity/editor,project/editor',
    'a project admin reads the entity promises and the project-editor promises, and no project-admin promise'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('account_admin_a'),
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        count(i.id)::text || ' ' || string_agg(
          DISTINCT i.scope::text || '/' || i.role::text,
          ','
          ORDER BY
            i.scope::text || '/' || i.role::text
        )
      FROM
        public.invitations i
    ),
    (
      current_setting('t39.n_entity')::integer + current_setting('t39.n_project_editor')::integer + current_setting('t39.n_project_admin')::integer
    )::text || ' entity/editor,project/admin,project/editor',
    'an account admin reads every shape'
  );

-- Deleting: an unclaimed row under the insert map, a claimed row never.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

WITH
  d AS (
    DELETE FROM public.invitations
    WHERE
      target_id = '39390000-0000-4000-8000-0000000000a1'
      AND email IS NULL
    RETURNING
      id
  )
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        d
    ),
    2,
    'a project editor deletes the two unclaimed code promises on the organization'
  );

WITH
  d AS (
    DELETE FROM public.invitations
    WHERE
      scope = 'project'
    RETURNING
      id
  )
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        d
    ),
    0,
    'a project editor deletes no project-scope promise'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('account_admin_a'),
    '[]'::jsonb
  );

WITH
  d AS (
    DELETE FROM public.invitations
    WHERE
      id = (
        current_setting('t39.named_cand')::jsonb -> 0 ->> 'id'
      )::uuid
    RETURNING
      id
  )
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        d
    ),
    0,
    'a DELETE of a claimed row by an account admin, who may promise every shape, removes nothing'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations i
      WHERE
        i.id = (
          current_setting('t39.named_cand')::jsonb -> 0 ->> 'id'
        )::uuid
        AND i.claimed_at IS NOT NULL
    ),
    1,
    'the claimed row is still there'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations i
      WHERE
        i.scope = 'project'
        AND i.project_id = test_id ('project_a')
    ),
    current_setting('t39.n_project_editor')::integer + current_setting('t39.n_project_admin')::integer,
    'every project-scope promise is still there'
  );

SELECT
  is (
    (
      SELECT
        o.confirmed
      FROM
        public.organizations o
      WHERE
        o.id = '39390000-0000-4000-8000-0000000000a1'
    ),
    true,
    'deleting an invitation leaves its entity confirmed'
  );

-- A row does not outlive its entity or its project. The candidate's promise is the claimed one, which no API role can delete directly.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  lives_ok (
    $$DELETE FROM public.candidates WHERE id = '39390000-0000-4000-8000-0000000000c1'$$,
    'a project admin deletes the candidate whose invitation is claimed'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (
          SELECT
            count(*)::integer
          FROM
            public.candidates c
          WHERE
            c.id = '39390000-0000-4000-8000-0000000000c1'
        )::text || ' ' || (
          SELECT
            count(*)::integer
          FROM
            public.invitations i
          WHERE
            i.target_id = '39390000-0000-4000-8000-0000000000c1'
        )::text
    ),
    '0 0',
    'deleting a candidate removes the invitation that targets it, claimed or not'
  );

INSERT INTO
  public.projects (id, account_id, name)
VALUES
  (
    '39390000-0000-4000-8000-0000000000f1',
    test_id ('account_a'),
    'Project C'
  );

INSERT INTO
  public.invitations (project_id, scope, target_id, role, email)
VALUES
  (
    '39390000-0000-4000-8000-0000000000f1',
    'project',
    '39390000-0000-4000-8000-0000000000f1',
    'editor',
    'project.c@test.example'
  );

DELETE FROM public.projects
WHERE
  id = '39390000-0000-4000-8000-0000000000f1';

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations i
      WHERE
        i.project_id = '39390000-0000-4000-8000-0000000000f1'
    ),
    0,
    'deleting a project removes its invitations'
  );

-- =====================================================================
-- Section 8: seeding sends nothing, creates no user and writes no grant
-- =====================================================================
-- pg_net enqueues a request inside the calling transaction, so a request seeding asked for would be a row of net.http_request_queue with an id above the baseline. The two targets are unconfirmed and named, so the call also runs the confirming UPDATE on both entity tables.
DO $$
BEGIN
  PERFORM set_config('t39.queue_before', (SELECT coalesce(max(q.id), 0)::text FROM net.http_request_queue q), true);
END;
$$;

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          (item ->> 'email' IS NOT NULL)::text || '/' || (item ->> 'code' IS NOT NULL)::text,
          ','
          ORDER BY
            ordinality
        )
      FROM
        jsonb_array_elements(
          public.create_invitations (
            test_id ('project_a'),
            '[{"target_type":"candidate","external_id":"inv-cand-mail","email":"nobody.yet@test.example"},{"target_type":"organization","external_id":"inv-org-mail"}]',
            true
          )
        ) WITH ORDINALITY AS t (item, ordinality)
    ),
    'true/false,false/true',
    'one call seeds an email row and a code row'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        net.http_request_queue q
      WHERE
        q.id > current_setting('t39.queue_before')::bigint
    ),
    0,
    'the call enqueued no request on net.http_request_queue: seeding sends nothing'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        auth.users u
      WHERE
        lower(u.email) = 'nobody.yet@test.example'
    ),
    0,
    'auth.users holds no row for the invited address: seeding creates no user'
  );

SELECT
  is (
    (
      SELECT
        count(*)::text || ' ' || md5(
          string_agg(
            g.id::text,
            ','
            ORDER BY
              g.id
          )
        )
      FROM
        public.grants g
    ),
    current_setting('t39.grants_before'),
    'public.grants holds exactly the rows it held before the first invitation: seeding writes no grant'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
