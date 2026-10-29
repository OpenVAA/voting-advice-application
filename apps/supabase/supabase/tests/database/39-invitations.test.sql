-- 39-invitations.test.sql: public.invitations, create_invitations, claim_invitations and the service-side helpers, as behaviour
--
-- An invitation promises one grant to whoever proves control of its address or presents its code. This file asserts what the catalogue declares for the table, who may promise which grant, that a duplicate of an open row is refused with the first row unchanged while a claimed row admits a new invitation, how a code is generated, stored and compared, that seeding confirms a named entity when the call says so, who reads and deletes a row, and that seeding sends nothing and writes no grant. From Section 9 on it asserts the claim: that a user who proved an invitation's address, or the address bound to its code, ends up holding exactly the promised grants and nobody else holds anything new; that each row is claimed or skipped by itself; and that a promise outlives its seeder's authority but not its own deletion. From Section 16 on it asserts the helpers the service role calls: the three answers of the code check and that a used code stays used, who may be mailed a sign-in link, the limits and how a slot is given back, the completion witness, and that no API role can execute a helper or touch its tables. Section 22 asserts the registration-mode condition: that an open invitation of a candidate or an organization is honoured only while the project allows its mode for that type, in the code check, the link request and the claim, and that nothing else is judged. The last section asserts who may be sent a recovery mail and which: the recovery mail for a grant holder, the sign-in mail for an address that has only an open invitation, nothing for anyone else, on the slot a sign-in request takes and with nothing else written. Section 24 asserts that an account whose app metadata names an identity provider claims nothing, whatever its confirmed address, beside a control of the same shape that claims.
--
-- EVERY CASE OF THE AUTHORITY MAP IS ASSERTED TWICE, once through create_invitations and once as a direct INSERT into the table. The map is the INSERT policy's WITH CHECK, so the two paths must agree; a rule that lived only in the function would pass the first half and fail the second.
--
-- A REFUSAL NAMES ITS SQLSTATE AND ITS MESSAGE, because the three kinds of refusal here are different controls. `new row violates row-level security policy` is the authority map. `permission denied for table` is a column or table privilege, checked before any policy. A message naming a constraint is a rule that binds every role, the service role included.
--
-- THE IDENTITIES. The fixture provides the project admin, the account admin, the root admin and the entity editor; their grant rows are written by test_seed_fixture_grants. This file adds a project editor of project A and one of project B. Every session passes an empty array to set_test_user, so each claim is projected from public.grants and from nowhere else.
--
-- THE ENTITIES. Every entity of the fixture's project A is already confirmed, so the cases about confirmation use this file's own unconfirmed rows.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_seed_fixture_grants), 305-invitations.sql (the table, its trigger, privileges, policies and cleanup triggers), 506-invitation-rpcs.sql (create_invitations, claim_invitations, the six invitation_ helpers, recovery_link_request, the throttle, the witness, the registration-mode condition and the grant-holder test), 301-auth-functions.sql and 106-app-settings.sql (the two readers of the registration-mode matrix and the settings row they read), 102-entities.sql and 011-validation-functions.sql (the confirmation flag and its gate).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (338);

-- Create test fixture data
SELECT
  create_test_data ();

SELECT
  test_seed_fixture_grants ();

-- Both projects serve candidates and organizations and allow every registration mode for each, so an entity invitation of either type is honoured in every section but the last, which switches modes off and on.
UPDATE app_settings
SET
  settings = settings || jsonb_build_object(
    'contestantApp',
    COALESCE(settings -> 'contestantApp', '{}'::jsonb) || '{
      "entityTypes": ["candidate", "organization"],
      "registrationModes": {
        "candidate": ["identity_provider", "email", "code"],
        "organization": ["identity_provider", "email", "code"]
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
        t.tgname = 'cleanup_invitations_on_delete'
        AND NOT t.tgisinternal
    ),
    'alliances,candidates,factions,organizations',
    'the cleanup trigger sits on the four entity tables'
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

-- =====================================================================
-- Section 9: the claim's surface
-- =====================================================================
SELECT
  is (
    (
      SELECT
        string_agg(pg_get_function_identity_arguments(p.oid), ' | ')
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'claim_invitations'
    ),
    'p_project_id uuid',
    'claim_invitations has exactly one signature, and it takes a project and nothing else: no address, no user and no invitation'
  );

SELECT
  is (
    (
      SELECT
        p.prosecdef::text || ' ' || p.proconfig::text
      FROM
        pg_proc p
      WHERE
        p.oid = 'public.claim_invitations(uuid)'::regprocedure
    ),
    'true {"search_path=\"\""}',
    'claim_invitations is SECURITY DEFINER with an empty pinned search_path'
  );

SELECT
  is (
    ARRAY[
      has_function_privilege(
        'anon',
        'public.claim_invitations(uuid)',
        'EXECUTE'
      ),
      has_function_privilege(
        'authenticated',
        'public.claim_invitations(uuid)',
        'EXECUTE'
      ),
      has_function_privilege(
        'service_role',
        'public.claim_invitations(uuid)',
        'EXECUTE'
      )
    ],
    ARRAY[false, true, false],
    'claim_invitations is executable by authenticated, and by neither anon nor service_role'
  );

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    $$SELECT public.claim_invitations(test_id('project_a'))$$,
    '42501',
    'permission denied for function claim_invitations',
    'anon calling claim_invitations is refused'
  );

SELECT
  reset_role ();

SET
  LOCAL ROLE service_role;

SELECT
  throws_ok (
    $$SELECT public.claim_invitations(test_id('project_a'))$$,
    '42501',
    'permission denied for function claim_invitations',
    'the service role, which has no auth.uid() to answer for, is refused too'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Section 10: exactly the promised grants
-- =====================================================================
-- The entities and users of Sections 10 to 15. Every candidate and organization is named, and every user's address is confirmed unless a case says otherwise. Each user's `encrypted_password` is the empty string, except where a case needs a hash or a null.
INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '39390000-0000-4000-8000-00000003c001',
    test_id ('project_a'),
    'Claim',
    'One'
  ),
  (
    '39390000-0000-4000-8000-00000003c002',
    test_id ('project_a'),
    'Claim',
    'Two'
  ),
  (
    '39390000-0000-4000-8000-00000003c003',
    test_id ('project_a'),
    'Claim',
    'Three'
  ),
  (
    '39390000-0000-4000-8000-00000003c004',
    test_id ('project_a'),
    'Claim',
    'Four'
  ),
  (
    '39390000-0000-4000-8000-00000003c005',
    test_id ('project_a'),
    'Claim',
    'Five'
  ),
  (
    '39390000-0000-4000-8000-00000003c006',
    test_id ('project_a'),
    'Claim',
    'Six'
  ),
  (
    '39390000-0000-4000-8000-00000003c007',
    test_id ('project_a'),
    'Claim',
    'Seven'
  ),
  (
    '39390000-0000-4000-8000-00000003c008',
    test_id ('project_a'),
    'Claim',
    'Eight'
  ),
  (
    '39390000-0000-4000-8000-00000003c009',
    test_id ('project_a'),
    'Claim',
    'Nine'
  ),
  (
    '39390000-0000-4000-8000-00000003c010',
    test_id ('project_a'),
    'Claim',
    'Ten'
  ),
  (
    '39390000-0000-4000-8000-00000003c011',
    test_id ('project_a'),
    'Claim',
    'Eleven'
  ),
  (
    '39390000-0000-4000-8000-00000003c012',
    test_id ('project_a'),
    'Claim',
    'Twelve'
  );

INSERT INTO
  public.organizations (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000003a001',
    test_id ('project_a'),
    '{"en":"Claim Org One"}'::jsonb
  ),
  (
    '39390000-0000-4000-8000-00000003a002',
    test_id ('project_a'),
    '{"en":"Claim Org Two"}'::jsonb
  ),
  (
    '39390000-0000-4000-8000-00000003a003',
    test_id ('project_a'),
    '{"en":"Claim Org Three"}'::jsonb
  ),
  (
    '39390000-0000-4000-8000-00000003a004',
    test_id ('project_a'),
    '{"en":"Claim Org Four"}'::jsonb
  );

INSERT INTO
  public.factions (id, project_id, organization_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000003f001',
    test_id ('project_a'),
    test_id ('org_a'),
    '{"en":"Claim Faction"}'::jsonb
  );

INSERT INTO
  public.alliances (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000003d001',
    test_id ('project_a'),
    '{"en":"Claim Alliance"}'::jsonb
  );

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
    '39390000-0000-4000-8000-00000003e001',
    '00000000-0000-0000-0000-000000000000',
    'claim.cand@test.example',
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
    '39390000-0000-4000-8000-00000003e002',
    '00000000-0000-0000-0000-000000000000',
    'claim.org@test.example',
    '$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz0123456',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e003',
    '00000000-0000-0000-0000-000000000000',
    'claim.faction@test.example',
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
    '39390000-0000-4000-8000-00000003e004',
    '00000000-0000-0000-0000-000000000000',
    'claim.alliance@test.example',
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
    '39390000-0000-4000-8000-00000003e005',
    '00000000-0000-0000-0000-000000000000',
    'claim.pe@test.example',
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
    '39390000-0000-4000-8000-00000003e006',
    '00000000-0000-0000-0000-000000000000',
    'claim.pa@test.example',
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
    '39390000-0000-4000-8000-00000003e007',
    '00000000-0000-0000-0000-000000000000',
    'stranger@test.example',
    '$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz0123456',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e008',
    '00000000-0000-0000-0000-000000000000',
    'claim.unconfirmed@test.example',
    NULL,
    'authenticated',
    'authenticated',
    NULL,
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000003e009',
    '00000000-0000-0000-0000-000000000000',
    'stale.row@test.example',
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
    '39390000-0000-4000-8000-00000003e010',
    '00000000-0000-0000-0000-000000000000',
    'claim.expired@test.example',
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
    '39390000-0000-4000-8000-00000003e011',
    '00000000-0000-0000-0000-000000000000',
    'claim.otherproject@test.example',
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
    '39390000-0000-4000-8000-00000003e012',
    '00000000-0000-0000-0000-000000000000',
    'pend.first@test.example',
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
    '39390000-0000-4000-8000-00000003e013',
    '00000000-0000-0000-0000-000000000000',
    'pend.second@test.example',
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
    '39390000-0000-4000-8000-00000003e014',
    '00000000-0000-0000-0000-000000000000',
    'd19@test.example',
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
    '39390000-0000-4000-8000-00000003e015',
    '00000000-0000-0000-0000-000000000000',
    'd19.editor@test.example',
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
    '39390000-0000-4000-8000-00000003e016',
    '00000000-0000-0000-0000-000000000000',
    'd19.held@test.example',
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
    '39390000-0000-4000-8000-00000003e017',
    '00000000-0000-0000-0000-000000000000',
    'd19.moved@test.example',
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
    '39390000-0000-4000-8000-00000003e018',
    '00000000-0000-0000-0000-000000000000',
    'seeder.kept@test.example',
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
    '39390000-0000-4000-8000-00000003e019',
    '00000000-0000-0000-0000-000000000000',
    'seeder.gone@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

-- Grants held before any claim: two invitees already hold something, so "the grants held before" is not the empty set for every shape; one user edits the seventh candidate; one already holds the grant an invitation promises on the ninth.
INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    '39390000-0000-4000-8000-00000003e001',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000003c012',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e005',
    'project',
    NULL,
    test_id ('project_b'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e015',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000003c007',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e016',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000003c009',
    'editor'
  );

-- One invitation of each admitted shape, each for a different user, so that no shape masks another; and the five of Section 11, none of which may be claimed.
DO $$
BEGIN
  PERFORM public.create_invitations(
    test_id('project_a'),
    '[
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c001","email":"claim.cand@test.example"},
      {"target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a001","email":"claim.org@test.example"},
      {"target_type":"faction","target_id":"39390000-0000-4000-8000-00000003f001","email":"claim.faction@test.example"},
      {"target_type":"alliance","target_id":"39390000-0000-4000-8000-00000003d001","email":"claim.alliance@test.example"},
      {"scope":"project","role":"editor","email":"claim.pe@test.example"},
      {"scope":"project","role":"admin","email":"claim.pa@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c002","email":"claim.nobody@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c003","email":"claim.unconfirmed@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c004","email":"claim.stale@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c005","email":"claim.expired@test.example","expires_at":"2000-01-01T00:00:00Z"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c006","email":"claim.otherproject@test.example"}
    ]'::jsonb,
    true
  );
END;
$$;

-- What public.grants holds before the first claim.
CREATE TEMPORARY TABLE t39_grants_before AS
SELECT
  g.user_id,
  g.scope::text AS scope,
  g.target_type::text AS target_type,
  g.target_id,
  g.role::text AS role
FROM
  public.grants g;

-- The six rows the six claims below must add, and nothing else.
CREATE TEMPORARY TABLE t39_grants_promised (user_id, scope, target_type, target_id, role) AS
VALUES
  (
    '39390000-0000-4000-8000-00000003e001'::uuid,
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000003c001'::uuid,
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e002'::uuid,
    'entity',
    'organization',
    '39390000-0000-4000-8000-00000003a001'::uuid,
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e003'::uuid,
    'entity',
    'faction',
    '39390000-0000-4000-8000-00000003f001'::uuid,
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e004'::uuid,
    'entity',
    'alliance',
    '39390000-0000-4000-8000-00000003d001'::uuid,
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e005'::uuid,
    'project',
    NULL,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000003e006'::uuid,
    'project',
    NULL,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'admin'
  );

-- A candidate's editor.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c001","role":"editor"}],"skipped":[],"password_set":false}'::jsonb,
    'the invited candidate editor''s claim returns the one promised specification and nothing else: no address, no code and no invitation id'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e001'$$,
    $$SELECT b.scope, b.target_type, b.target_id, b.role FROM t39_grants_before b WHERE b.user_id = '39390000-0000-4000-8000-00000003e001' UNION ALL SELECT p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p WHERE p.user_id = '39390000-0000-4000-8000-00000003e001'$$,
    'that user''s grants are the one held before plus exactly the promised candidate editor''s grant'
  );

-- An organization's editor.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e002',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a001","role":"editor"}],"skipped":[],"password_set":true}'::jsonb,
    'the invited organization editor''s claim returns the one promised specification and nothing else'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e002'$$,
    $$SELECT p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p WHERE p.user_id = '39390000-0000-4000-8000-00000003e002'$$,
    'that user, who held nothing, holds exactly the promised organization editor''s grant'
  );

-- A faction's editor.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e003',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"faction","target_id":"39390000-0000-4000-8000-00000003f001","role":"editor"}],"skipped":[],"password_set":false}'::jsonb,
    'the invited faction editor''s claim returns the one promised specification and nothing else'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e003'$$,
    $$SELECT p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p WHERE p.user_id = '39390000-0000-4000-8000-00000003e003'$$,
    'that user, who held nothing, holds exactly the promised faction editor''s grant'
  );

-- An alliance's editor.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e004',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"alliance","target_id":"39390000-0000-4000-8000-00000003d001","role":"editor"}],"skipped":[],"password_set":false}'::jsonb,
    'the invited alliance editor''s claim returns the one promised specification and nothing else'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e004'$$,
    $$SELECT p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p WHERE p.user_id = '39390000-0000-4000-8000-00000003e004'$$,
    'that user, who held nothing, holds exactly the promised alliance editor''s grant'
  );

-- A project editor.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e005',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"project","target_type":null,"target_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"editor"}],"skipped":[],"password_set":false}'::jsonb,
    'the invited project editor''s claim returns the one promised specification and nothing else'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e005'$$,
    $$SELECT b.scope, b.target_type, b.target_id, b.role FROM t39_grants_before b WHERE b.user_id = '39390000-0000-4000-8000-00000003e005' UNION ALL SELECT p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p WHERE p.user_id = '39390000-0000-4000-8000-00000003e005'$$,
    'that user''s grants are the one held before, on the other project, plus exactly the promised project editor''s grant'
  );

-- A project admin.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e006',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"project","target_type":null,"target_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"admin"}],"skipped":[],"password_set":false}'::jsonb,
    'the invited project admin''s claim returns the one promised specification and nothing else'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e006'$$,
    $$SELECT p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p WHERE p.user_id = '39390000-0000-4000-8000-00000003e006'$$,
    'that user, who held nothing, holds exactly the promised project admin''s grant'
  );

SELECT
  bag_eq (
    $$SELECT g.user_id, g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g$$,
    $$SELECT b.user_id, b.scope, b.target_type, b.target_id, b.role FROM t39_grants_before b UNION ALL SELECT p.user_id, p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p$$,
    'after the six claims public.grants holds the rows it held before plus the six promised rows, for every user and not only for the six'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations i
        JOIN auth.users u ON u.id = i.claimed_by
      WHERE
        i.project_id = test_id ('project_a')
        AND i.email LIKE 'claim.%'
        AND i.email = u.email
        AND i.claimed_at IS NOT NULL
    ),
    6,
    'each of the six invitations is stamped with its claimant and the time of the claim'
  );

-- =====================================================================
-- Section 11: nobody else
-- =====================================================================
-- A confirmed user with another address.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e007',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[],"password_set":true}'::jsonb,
    'a confirmed user whose address no invitation names claims nothing'
  );

-- The invited address on a user whose email_confirmed_at is null.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e008',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[],"password_set":false}'::jsonb,
    'the invited address on a user whose email_confirmed_at is null claims nothing'
  );

-- The invited address in the token's email claim, on a user whose row of auth.users holds another address.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e009',
    '[]'::jsonb
  );

DO $$
BEGIN
  PERFORM set_config(
    'request.jwt.claims',
    (current_setting('request.jwt.claims')::jsonb || '{"email":"claim.stale@test.example"}'::jsonb)::text,
    true
  );
END;
$$;

SELECT
  is (
    (
      SELECT
        (auth.jwt () ->> 'email') || ' ' || (public.claim_invitations (test_id ('project_a')))::text
    ),
    'claim.stale@test.example {"claimed": [], "skipped": [], "password_set": false}',
    'a token whose email claim carries the invited address claims nothing while the user''s row holds another address: the claim reads the table, never the token'
  );

-- An expired invitation, for its own confirmed address.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e010',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[],"password_set":false}'::jsonb,
    'an expired invitation is not claimed by the confirmed user it names'
  );

-- The same call a second time.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[],"password_set":false}'::jsonb,
    'a second call by a user who has claimed returns an empty list'
  );

-- The other project.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e011',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_b')),
    '{"claimed":[],"skipped":[],"password_set":false}'::jsonb,
    'a call for the other project claims nothing of an invitation that belongs to this one'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.user_id, g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g$$,
    $$SELECT b.user_id, b.scope, b.target_type, b.target_id, b.role FROM t39_grants_before b UNION ALL SELECT p.user_id, p.scope, p.target_type, p.target_id, p.role FROM t39_grants_promised p$$,
    'none of the six calls wrote a grant: public.grants holds what it held after Section 10'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations i
      WHERE
        i.project_id = test_id ('project_a')
        AND i.email IN (
          'claim.nobody@test.example',
          'claim.unconfirmed@test.example',
          'claim.stale@test.example',
          'claim.expired@test.example',
          'claim.otherproject@test.example'
        )
        AND i.claimed_at IS NULL
        AND i.claimed_by IS NULL
    ),
    5,
    'the five invitations nobody proved are still open'
  );

-- =====================================================================
-- Section 12: the pending address
-- =====================================================================
DO $$
BEGIN
  PERFORM set_config(
    't39.pend',
    public.create_invitations(test_id('project_a'), '[{"target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a002"}]'::jsonb, true)::text,
    true
  );
END;
$$;

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e012',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[],"password_set":false}'::jsonb,
    'a code row with no pending address is claimed by nobody'
  );

SELECT
  reset_role ();

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      ' Pend.First@Test.Example ',
      current_setting('t39.pend')::jsonb -> 0 ->> 'code'
    ),
    'pend.first@test.example',
    'a link request with the code binds the first address and answers with it, trimmed and lower-cased'
  );

SELECT
  reset_role ();

-- The rebinding interval has passed.
UPDATE public.invitations
SET
  pending_email_at = now() - interval '2 minutes'
WHERE
  id = (current_setting('t39.pend')::jsonb -> 0 ->> 'id')::uuid;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'pend.second@test.example',
      current_setting('t39.pend')::jsonb -> 0 ->> 'code'
    ),
    'pend.second@test.example',
    'a later link request with the same code replaces the pending address'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e012',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[],"password_set":false}'::jsonb,
    'the user whose address was bound earlier and since replaced claims nothing'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e013',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a002","role":"editor"}],"skipped":[],"password_set":false}'::jsonb,
    'the user whose confirmed address is the pending address claims the code row'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.pending_email IS NULL)::text || ' ' || (i.pending_email_at IS NULL)::text || ' ' || (i.claimed_at IS NOT NULL)::text || ' ' || i.claimed_by::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.pend')::jsonb -> 0 ->> 'id')::uuid
    ),
    'true true true 39390000-0000-4000-8000-00000003e013',
    'after the claim the row is stamped with its claimant and its pending address is cleared'
  );

-- =====================================================================
-- Section 13: each row by itself
-- =====================================================================
-- Three open rows for one address: a candidate another user already edits, a free candidate and an organization. One row for a grant its user already holds. One row whose candidate is then moved to the other project.
DO $$
BEGIN
  PERFORM public.create_invitations(
    test_id('project_a'),
    '[
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c007","email":"d19@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c008","email":"d19@test.example"},
      {"target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a003","email":"d19@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c009","email":"d19.held@test.example"},
      {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c010","email":"d19.moved@test.example"}
    ]'::jsonb,
    true
  );
END;
$$;

UPDATE public.candidates
SET
  project_id = test_id ('project_b')
WHERE
  id = '39390000-0000-4000-8000-00000003c010';

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e014',
    '[]'::jsonb
  );

SELECT
  is (
    (
      SELECT
        jsonb_build_object(
          'claimed',
          (
            SELECT
              jsonb_agg(
                e
                ORDER BY
                  e ->> 'target_id'
              )
            FROM
              jsonb_array_elements(r.result -> 'claimed') AS e
          ),
          'skipped',
          r.result -> 'skipped'
        )
      FROM
        (
          SELECT
            public.claim_invitations (test_id ('project_a')) AS result
        ) AS r
    ),
    '{"claimed":[{"scope":"entity","target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a003","role":"editor"},{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c008","role":"editor"}],"skipped":[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c007","role":"editor","reason":"candidate_has_editor"}]}'::jsonb,
    'of three rows for one address two are claimed, and the candidate another user edits is skipped with the reason candidate_has_editor'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        i.claimed_at IS NULL
        AND i.claimed_by IS NULL
      FROM
        public.invitations i
      WHERE
        i.email = 'd19@test.example'
        AND i.target_id = '39390000-0000-4000-8000-00000003c007'
    ),
    true,
    'the skipped row stays open'
  );

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e014'$$,
    $$VALUES ('entity', 'candidate', '39390000-0000-4000-8000-00000003c008'::uuid, 'editor'), ('entity', 'organization', '39390000-0000-4000-8000-00000003a003'::uuid, 'editor')$$,
    'the caller holds the two claimed grants and not the skipped one'
  );

SELECT
  is (
    (
      SELECT
        string_agg(g.user_id::text, ',')
      FROM
        public.grants g
      WHERE
        g.target_id = '39390000-0000-4000-8000-00000003c007'
    ),
    '39390000-0000-4000-8000-00000003e015',
    'the candidate keeps its one editor'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e016',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c009","role":"editor"}],"skipped":[],"password_set":false}'::jsonb,
    'an invitation for a grant its user already holds on a candidate is returned as claimed, not skipped as a candidate another user edits'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.claimed_at IS NOT NULL)::text || ' ' || i.claimed_by::text
      FROM
        public.invitations i
      WHERE
        i.email = 'd19.held@test.example'
    ),
    'true 39390000-0000-4000-8000-00000003e016',
    'that row is marked claimed'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.grants g
      WHERE
        g.target_id = '39390000-0000-4000-8000-00000003c009'
    ),
    1,
    'and the candidate has one grant afterwards, not two'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e017',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c010","role":"editor","reason":"target_not_in_project"}],"password_set":false}'::jsonb,
    'an entity-scope row whose candidate was moved to the other project is skipped with the reason target_not_in_project'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.claimed_at IS NULL)::text || ' ' || (
          SELECT
            count(*)
          FROM
            public.grants g
          WHERE
            g.user_id = '39390000-0000-4000-8000-00000003e017'
        )::text
      FROM
        public.invitations i
      WHERE
        i.email = 'd19.moved@test.example'
    ),
    'true 0',
    'that row stays open and its user holds no grant'
  );

-- =====================================================================
-- Section 14: password_set
-- =====================================================================
-- Each of these three calls claims nothing, so the fact is in the result whatever was claimed.
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'password_set',
    'false'::jsonb,
    'password_set is false for a user whose encrypted_password is the empty string'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e002',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'password_set',
    'true'::jsonb,
    'password_set is true for a user whose encrypted_password holds a hash'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e008',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'password_set',
    'false'::jsonb,
    'password_set is false for a user whose encrypted_password is null'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Section 15: the seeder's authority is asked when the row is written, and not again
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  lives_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c011","email":"seeder.kept@test.example"}]', true)$$,
    'a project editor seeds an entity editor''s promise'
  );

SELECT
  reset_role ();

-- The seeder loses the grant the promise needed.
DELETE FROM public.grants
WHERE
  user_id = '39390000-0000-4000-8000-0000000000e1';

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  throws_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c012","email":"seeder.late@test.example"}]', true)$$,
    '42501',
    'new row violates row-level security policy for table "invitations"',
    'the demoted seeder can promise nothing more'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e018',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000003c011","role":"editor"}],"skipped":[],"password_set":false}'::jsonb,
    'the promise of a seeder who has since lost the authority to make it is still honoured'
  );

SELECT
  reset_role ();

SELECT
  bag_eq (
    $$SELECT g.scope::text, g.target_type::text, g.target_id, g.role::text FROM public.grants g WHERE g.user_id = '39390000-0000-4000-8000-00000003e018'$$,
    $$VALUES ('entity', 'candidate', '39390000-0000-4000-8000-00000003c011'::uuid, 'editor')$$,
    'and the invitee holds exactly the promised grant'
  );

-- A promise an admin deletes before it is claimed.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  lives_ok (
    $$SELECT public.create_invitations(test_id('project_a'), '[{"target_type":"organization","target_id":"39390000-0000-4000-8000-00000003a004","email":"seeder.gone@test.example"}]', true)$$,
    'a project admin seeds a second promise'
  );

WITH
  d AS (
    DELETE FROM public.invitations
    WHERE
      email = 'seeder.gone@test.example'
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
    1,
    'the project admin deletes that promise before it is claimed'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000003e019',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[],"password_set":false}'::jsonb,
    'the invitee of a deleted promise claims nothing: both lists are empty'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.grants g
      WHERE
        g.user_id = '39390000-0000-4000-8000-00000003e019'
    ),
    0,
    'and holds no grant'
  );

-- The project editor of project A holds their grant again for the sections that follow.
INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    '39390000-0000-4000-8000-0000000000e1',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  );

-- =====================================================================
-- Section 16: the used code
-- =====================================================================
-- The entities, users, grants and invitations of Sections 16 to 21. The helpers are the service role's, so every call of one below is made as that role; time is moved by the fixture role, which rewrites a window's start or a row's `pending_email_at`.
INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '39390000-0000-4000-8000-00000004c001',
    test_id ('project_a'),
    'Code',
    'One'
  ),
  (
    '39390000-0000-4000-8000-00000004c002',
    test_id ('project_a'),
    'Code',
    'Two'
  ),
  (
    '39390000-0000-4000-8000-00000004c003',
    test_id ('project_a'),
    'Code',
    'Three'
  ),
  (
    '39390000-0000-4000-8000-00000004c004',
    test_id ('project_a'),
    'Code',
    'Four'
  ),
  (
    '39390000-0000-4000-8000-00000004c005',
    test_id ('project_a'),
    'Code',
    'Five'
  ),
  (
    '39390000-0000-4000-8000-00000004c006',
    test_id ('project_a'),
    'Code',
    'Six'
  ),
  (
    '39390000-0000-4000-8000-00000004c007',
    test_id ('project_a'),
    'Code',
    'Seven'
  ),
  (
    '39390000-0000-4000-8000-00000004c008',
    test_id ('project_a'),
    'Code',
    'Eight'
  ),
  (
    '39390000-0000-4000-8000-00000004c009',
    test_id ('project_a'),
    'Code',
    'Nine'
  ),
  (
    '39390000-0000-4000-8000-00000004c0b1',
    test_id ('project_b'),
    'Code',
    'Elsewhere'
  );

INSERT INTO
  public.organizations (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000004a001',
    test_id ('project_a'),
    '{"en":"Code Org"}'::jsonb
  );

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
    '39390000-0000-4000-8000-00000004e001',
    '00000000-0000-0000-0000-000000000000',
    'code.claimant@test.example',
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
    '39390000-0000-4000-8000-00000004e002',
    '00000000-0000-0000-0000-000000000000',
    'code.other@test.example',
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
    '39390000-0000-4000-8000-00000004e003',
    '00000000-0000-0000-0000-000000000000',
    'mail.pgrant@test.example',
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
    '39390000-0000-4000-8000-00000004e004',
    '00000000-0000-0000-0000-000000000000',
    'mail.egrant@test.example',
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
    '39390000-0000-4000-8000-00000004e005',
    '00000000-0000-0000-0000-000000000000',
    'mail.unconfirmed@test.example',
    '',
    'authenticated',
    'authenticated',
    NULL,
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000004e006',
    '00000000-0000-0000-0000-000000000000',
    'mail.root@test.example',
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
    '39390000-0000-4000-8000-00000004e007',
    '00000000-0000-0000-0000-000000000000',
    'mail.account@test.example',
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
    '39390000-0000-4000-8000-00000004e008',
    '00000000-0000-0000-0000-000000000000',
    'mail.otherproject@test.example',
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
    '39390000-0000-4000-8000-00000004e009',
    '00000000-0000-0000-0000-000000000000',
    'code.keeper@test.example',
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
    '39390000-0000-4000-8000-00000004e010',
    '00000000-0000-0000-0000-000000000000',
    'code.ten@test.example',
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
    '39390000-0000-4000-8000-00000004e003',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000004e004',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000004c003',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000004e005',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000004c004',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000004e006',
    'global',
    NULL,
    NULL,
    'admin'
  ),
  (
    '39390000-0000-4000-8000-00000004e007',
    'account',
    NULL,
    test_id ('account_a'),
    'admin'
  ),
  (
    '39390000-0000-4000-8000-00000004e008',
    'project',
    NULL,
    test_id ('project_b'),
    'editor'
  );

-- The rows of project A, by their index in `t39.h`: 0 the code that is claimed and whose claimant is then deleted; 1 an expired code; 2 the code whose claimant asks for a link; 3 the code that is bound twice; 4 the code whose claimant is looked up ten times; 5 the code that is bound, released and bound again; 6 and 7 two email rows. `t39.hb` holds one code row of project B.
DO $$
BEGIN
  PERFORM set_config(
    't39.h',
    public.create_invitations(
      test_id('project_a'),
      '[
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c001"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c002","expires_at":"2000-01-01T00:00:00Z"},
        {"target_type":"organization","target_id":"39390000-0000-4000-8000-00000004a001"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c006"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c007"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c009"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c005","email":"mail.invited@test.example"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c008","email":"release.mail@test.example"}
      ]'::jsonb,
      true
    )::text,
    true
  );
  PERFORM set_config(
    't39.hb',
    public.create_invitations(
      test_id('project_b'),
      '[{"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c0b1"}]'::jsonb,
      true
    )::text,
    true
  );
END;
$$;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 0 ->> 'code'
    ),
    'valid',
    'an open code answers valid'
  );

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      lower(
        replace(
          current_setting('t39.h')::jsonb -> 0 ->> 'code',
          '-',
          ' '
        )
      )
    ),
    'valid',
    'the same code typed in lower case with spaces answers the same'
  );

SELECT
  is (
    public.invitation_code_status (test_id ('project_a'), 'ZZZZ-ZZZZ-ZZZZ'),
    'unknown',
    'a string that names no code answers unknown'
  );

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 1 ->> 'code'
    ),
    'unknown',
    'an expired unclaimed code answers unknown'
  );

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.hb')::jsonb -> 0 ->> 'code'
    ) || ' ' || public.invitation_code_status (
      test_id ('project_b'),
      current_setting('t39.hb')::jsonb -> 0 ->> 'code'
    ),
    'unknown valid',
    'the code of the other project answers unknown here and valid there'
  );

-- Three codes are bound, each to its own address, and claimed by the user who holds that address.
SELECT
  is (
    ARRAY[
      public.invitation_link_request (
        test_id ('project_a'),
        'code.claimant@test.example',
        current_setting('t39.h')::jsonb -> 0 ->> 'code'
      ),
      public.invitation_link_request (
        test_id ('project_a'),
        'code.keeper@test.example',
        current_setting('t39.h')::jsonb -> 2 ->> 'code'
      ),
      public.invitation_link_request (
        test_id ('project_a'),
        'code.ten@test.example',
        current_setting('t39.h')::jsonb -> 4 ->> 'code'
      )
    ],
    ARRAY[
      'code.claimant@test.example',
      'code.keeper@test.example',
      'code.ten@test.example'
    ],
    'three valid codes are each bound to an address, and each request answers with that address'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000004e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c001","role":"editor"}]'::jsonb,
    'the user who proved the bound address claims the first code'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000004e009',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"organization","target_id":"39390000-0000-4000-8000-00000004a001","role":"editor"}]'::jsonb,
    'the second code is claimed by its own user'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000004e010',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000004c007","role":"editor"}]'::jsonb,
    'the third code is claimed by its own user'
  );

SELECT
  reset_role ();

-- Every window opened so far has ended, so what follows starts with free slots.
UPDATE private.invitation_throttle
SET
  window_start = now() - interval '2 minutes';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 0 ->> 'code'
    ) || ' ' || public.invitation_code_status (
      test_id ('project_a'),
      lower(
        replace(
          current_setting('t39.h')::jsonb -> 0 ->> 'code',
          '-',
          ' '
        )
      )
    ),
    'used used',
    'after the claim the code answers used, however it is typed'
  );

SELECT
  reset_role ();

-- The claimant is deleted.
DELETE FROM auth.users
WHERE
  id = '39390000-0000-4000-8000-00000004e001';

SELECT
  is (
    (
      SELECT
        (i.claimed_by IS NULL)::text || ' ' || (i.claimed_at IS NOT NULL)::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.h')::jsonb -> 0 ->> 'id')::uuid
    ),
    'true true',
    'after the claimant is deleted the row reads claimed_by null and claimed_at set'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 0 ->> 'code'
    ),
    'used',
    'and the code still answers used: deleting the claimant does not reopen it'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'code.other@test.example',
      current_setting('t39.h')::jsonb -> 0 ->> 'code'
    ),
    NULL,
    'a link request with the used code and another address answers null'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.pending_email IS NULL)::text || ' ' || (i.pending_email_at IS NULL)::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.h')::jsonb -> 0 ->> 'id')::uuid
    ),
    'true true',
    'and binds nothing: the used row''s pending address is still null'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000004e002',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[],"password_set":false}'::jsonb,
    'the user with that other address claims nothing: a used code grants nothing a second time'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

WITH
  d AS (
    DELETE FROM public.invitations
    WHERE
      id = (current_setting('t39.h')::jsonb -> 0 ->> 'id')::uuid
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
    'a project admin''s DELETE of the used code''s row removes nothing'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (
          SELECT
            count(*)
          FROM
            public.invitations i
          WHERE
            i.id = (current_setting('t39.h')::jsonb -> 0 ->> 'id')::uuid
            AND i.claimed_at IS NOT NULL
        )::text || ' ' || (
          SELECT
            count(*)
          FROM
            public.grants g
          WHERE
            g.user_id = '39390000-0000-4000-8000-00000004e002'
        )::text
    ),
    '1 0',
    'the used row is still there, and the other user holds no grant'
  );

-- =====================================================================
-- Section 17: who may be mailed
-- =====================================================================
DO $$
BEGIN
  PERFORM set_config(
    't39.throttle_before',
    (SELECT count(*)::text FROM private.invitation_throttle),
    true
  );
END;
$$;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'nobody.at.all@test.example'
    ),
    NULL,
    'an address the project knows nothing of answers null'
  );

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mail.root@test.example'),
    NULL,
    'the confirmed address of a root admin who holds no grant in the project answers null'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mail.account@test.example'
    ),
    NULL,
    'the confirmed address of an admin of the project''s account, who holds no grant in the project, answers null'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mail.otherproject@test.example'
    ),
    NULL,
    'the confirmed address of an editor of the other project answers null'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mail.unconfirmed@test.example'
    ),
    NULL,
    'the address of a grant holder whose email_confirmed_at is null answers null'
  );

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), '   ') IS NULL
    AND public.invitation_link_request (test_id ('project_a')) IS NULL
    AND public.invitation_link_request (NULL, 'mail.invited@test.example') IS NULL,
    true,
    'a blank address, no address and no project each answer null'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'whoever@test.example',
      'ZZZZ-ZZZZ-ZZZZ'
    ) IS NULL
    AND public.invitation_link_request (
      test_id ('project_a'),
      'whoever@test.example',
      current_setting('t39.h')::jsonb -> 1 ->> 'code'
    ) IS NULL
    AND public.invitation_link_request (
      test_id ('project_a'),
      'whoever@test.example',
      current_setting('t39.hb')::jsonb -> 0 ->> 'code'
    ) IS NULL
    AND public.invitation_link_request (
      test_id ('project_a'),
      '  ',
      current_setting('t39.h')::jsonb -> 3 ->> 'code'
    ) IS NULL,
    true,
    'a code that names nothing, an expired code, the code of the other project, and a valid code with a blank address each answer null'
  );

SELECT
  is (
    public.invitation_code_claimant_email (test_id ('project_a'), 'ZZZZ-ZZZZ-ZZZZ') IS NULL
    AND public.invitation_code_claimant_email (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 3 ->> 'code'
    ) IS NULL
    AND public.invitation_code_claimant_email (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 0 ->> 'code'
    ) IS NULL,
    true,
    'the claimant look-up answers null for an unknown code, for an open code and for a used code whose claimant is gone'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::text
      FROM
        private.invitation_throttle
    ),
    current_setting('t39.throttle_before'),
    'none of those refusals wrote a throttle key: no slot is taken for an address no mail would go to, and nothing is counted for a code that names no claimant'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      '  Mail.Invited@Test.Example '
    ),
    'mail.invited@test.example',
    'an address with an open invitation in the project answers with the address, trimmed and lower-cased'
  );

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mail.pgrant@test.example'),
    'mail.pgrant@test.example',
    'the confirmed address of a user who holds a project-scope grant on the project answers with the address'
  );

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mail.egrant@test.example'),
    'mail.egrant@test.example',
    'the confirmed address of a user who holds an entity-scope grant on an entity of the project answers with the address'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'code.other@test.example',
      current_setting('t39.h')::jsonb -> 2 ->> 'code'
    ),
    'code.keeper@test.example',
    'a used code whose claimant exists answers with the claimant''s own address, whatever address was typed'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.pending_email IS NULL)::text || ' ' || (i.pending_email_at IS NULL)::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.h')::jsonb -> 2 ->> 'id')::uuid
    ),
    'true true',
    'and the typed address is bound to nothing: a used code cannot be bound to another address'
  );

UPDATE private.invitation_throttle
SET
  window_start = now() - interval '2 minutes'
WHERE
  key LIKE 'link:%';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      NULL,
      current_setting('t39.h')::jsonb -> 2 ->> 'code'
    ),
    'code.keeper@test.example',
    'a used code with no address answers with its claimant''s address'
  );

SELECT
  reset_role ();

DELETE FROM auth.users
WHERE
  id = '39390000-0000-4000-8000-00000004e009';

UPDATE private.invitation_throttle
SET
  window_start = now() - interval '2 minutes'
WHERE
  key LIKE 'link:%';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      NULL,
      current_setting('t39.h')::jsonb -> 2 ->> 'code'
    ),
    NULL,
    'and null once the claimant is deleted'
  );

-- =====================================================================
-- Section 18: the limits
-- =====================================================================
-- One mail per address per 60 seconds.
SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mail.pgrant@test.example'),
    'mail.pgrant@test.example',
    'a first request in a new window answers with the address'
  );

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mail.pgrant@test.example'),
    NULL,
    'a second request for the same address inside 60 seconds answers null'
  );

SELECT
  reset_role ();

UPDATE private.invitation_throttle
SET
  window_start = now() - interval '61 seconds'
WHERE
  key = 'link:' || test_id ('project_a')::text || ':' || encode(
    sha256(convert_to('mail.pgrant@test.example', 'UTF8')),
    'hex'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mail.pgrant@test.example'),
    'mail.pgrant@test.example',
    'a third request, once the window''s start is 61 seconds old, answers with the address again'
  );

-- One rebinding per code per 60 seconds.
SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'bind.one@test.example',
      current_setting('t39.h')::jsonb -> 3 ->> 'code'
    ),
    'bind.one@test.example',
    'a first binding of a code answers with the address'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'bind.two@test.example',
      current_setting('t39.h')::jsonb -> 3 ->> 'code'
    ),
    NULL,
    'a second binding of the same code inside 60 seconds answers null'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        i.pending_email || ' ' || (
          SELECT
            count(*)
          FROM
            private.invitation_throttle t
          WHERE
            t.key = 'link:' || test_id ('project_a')::text || ':' || encode(
              sha256(convert_to('bind.two@test.example', 'UTF8')),
              'hex'
            )
        )::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.h')::jsonb -> 3 ->> 'id')::uuid
    ),
    'bind.one@test.example 0',
    'the refused binding leaves the pending address unchanged and takes no slot for the second address'
  );

UPDATE public.invitations
SET
  pending_email_at = now() - interval '61 seconds'
WHERE
  id = (current_setting('t39.h')::jsonb -> 3 ->> 'id')::uuid;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'bind.two@test.example',
      current_setting('t39.h')::jsonb -> 3 ->> 'code'
    ),
    'bind.two@test.example',
    'once the binding is 61 seconds old the code is bound to the second address'
  );

-- Ten claimant look-ups per used code per fifteen minutes.
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        generate_series(1, 10) AS n
      WHERE
        public.invitation_code_claimant_email (
          test_id ('project_a'),
          current_setting('t39.h')::jsonb -> 4 ->> 'code'
        ) = 'code.ten@test.example'
    ),
    10,
    'ten claimant look-ups of a used code each answer with the claimant''s address'
  );

SELECT
  is (
    public.invitation_code_claimant_email (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 4 ->> 'code'
    ),
    NULL,
    'the eleventh answers null, as an unknown code does'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      NULL,
      current_setting('t39.h')::jsonb -> 4 ->> 'code'
    ),
    'code.ten@test.example',
    'a link request with that code is still answered with the claimant''s address: it reads the claimant without counting against the look-up budget'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        t.count::text || ' ' || (t.window_start < now())::text
      FROM
        private.invitation_throttle t
      WHERE
        t.key = 'link:' || test_id ('project_a')::text || ':' || encode(
          sha256(convert_to('code.ten@test.example', 'UTF8')),
          'hex'
        )
    ),
    '1 false',
    'and it is bounded by the claimant''s address slot instead, which it took afresh'
  );

UPDATE private.invitation_throttle
SET
  window_start = now() - interval '16 minutes'
WHERE
  key = 'code:' || test_id ('project_a')::text || ':' || (
    SELECT
      i.code_hash
    FROM
      public.invitations i
    WHERE
      i.id = (current_setting('t39.h')::jsonb -> 4 ->> 'id')::uuid
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_claimant_email (
      test_id ('project_a'),
      current_setting('t39.h')::jsonb -> 4 ->> 'code'
    ),
    'code.ten@test.example',
    'once the window''s start is sixteen minutes old the look-up answers again'
  );

-- =====================================================================
-- Section 19: the slot is given back
-- =====================================================================
SELECT
  is (
    ARRAY[
      public.invitation_link_request (
        test_id ('project_a'),
        'release.mail@test.example'
      ),
      public.invitation_link_request (
        test_id ('project_a'),
        'release.mail@test.example'
      )
    ],
    ARRAY['release.mail@test.example', NULL],
    'a request takes its address''s slot, and a second request finds it taken'
  );

SELECT
  lives_ok (
    $$SELECT public.invitation_link_release(test_id('project_a'), '  Release.Mail@Test.Example ')$$,
    'the slot is given back'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'release.mail@test.example'
    ),
    'release.mail@test.example',
    'the next request answers with the address again, with no time moved'
  );

SELECT
  is (
    ARRAY[
      public.invitation_link_request (
        test_id ('project_a'),
        'release.code@test.example',
        current_setting('t39.h')::jsonb -> 5 ->> 'code'
      ),
      public.invitation_link_request (
        test_id ('project_a'),
        'release.code@test.example',
        current_setting('t39.h')::jsonb -> 5 ->> 'code'
      )
    ],
    ARRAY['release.code@test.example', NULL],
    'a code is bound to an address, and the same binding asked again at once answers null'
  );

SELECT
  lives_ok (
    $$SELECT public.invitation_link_release(test_id('project_a'), 'release.code@test.example', current_setting('t39.h')::jsonb -> 5 ->> 'code')$$,
    'the binding''s slot and clock are given back'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        i.pending_email || ' ' || (i.pending_email_at IS NULL)::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.h')::jsonb -> 5 ->> 'id')::uuid
    ),
    'release.code@test.example true',
    'the release keeps the pending address and clears only the time it was bound'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'release.code@test.example',
      current_setting('t39.h')::jsonb -> 5 ->> 'code'
    ),
    'release.code@test.example',
    'the same code and address are bound again at once'
  );

SELECT
  reset_role ();

-- A release that has nothing to give back, and one that names a claimed row's code.
DO $$
BEGIN
  PERFORM set_config(
    't39.digest_before',
    (SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.key), '')) FROM private.invitation_throttle t)
      || ' ' || (SELECT md5(coalesce(string_agg(i::text, '|' ORDER BY i.id), '')) FROM public.invitations i),
    true
  );
END;
$$;

SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$SELECT public.invitation_link_release(test_id('project_a'), 'never.asked@test.example'), public.invitation_link_release(test_id('project_a'), 'never.asked@test.example', current_setting('t39.h')::jsonb -> 4 ->> 'code'), public.invitation_link_release(test_id('project_a'), NULL), public.invitation_link_release(NULL, 'never.asked@test.example')$$,
    'a release for an address that holds no slot raises nothing, with or without a claimed row''s code'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        md5(
          coalesce(
            string_agg(
              t::text,
              '|'
              ORDER BY
                t.key
            ),
            ''
          )
        )
      FROM
        private.invitation_throttle t
    ) || ' ' || (
      SELECT
        md5(
          coalesce(
            string_agg(
              i::text,
              '|'
              ORDER BY
                i.id
            ),
            ''
          )
        )
      FROM
        public.invitations i
    ),
    current_setting('t39.digest_before'),
    'and writes nothing: every throttle key and every invitation row, the claimed one included, is unchanged'
  );

-- =====================================================================
-- Section 20: the witness
-- =====================================================================
-- A record opened more than a day ago, which the next open removes.
INSERT INTO
  private.invitation_link_witness (id, opened_at)
VALUES
  (
    '39390000-0000-4000-8000-000000050001',
    now() - interval '2 days'
  );

SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$SELECT set_config('t39.witness', public.invitation_link_witness_open()::text, true)$$,
    'the service role opens a witness and receives its id'
  );

SELECT
  is (
    public.invitation_link_witness (current_setting('t39.witness')::uuid),
    NULL,
    'an open witness reads null'
  );

SELECT
  is (
    public.invitation_link_witness (current_setting('t39.witness')::uuid, 'sent'),
    'sent',
    'completing it with sent reads sent'
  );

SELECT
  is (
    public.invitation_link_witness (current_setting('t39.witness')::uuid, 'not-sent') || ' ' || public.invitation_link_witness (current_setting('t39.witness')::uuid),
    'sent sent',
    'a second completion with not-sent leaves it sent'
  );

SELECT
  set_config(
    't39.witness_2',
    public.invitation_link_witness_open ()::text,
    true
  );

SELECT
  is (
    public.invitation_link_witness (
      current_setting('t39.witness_2')::uuid,
      'not-sent'
    ),
    'not-sent',
    'another witness completed with not-sent reads not-sent'
  );

SELECT
  is (
    public.invitation_link_witness ('39390000-0000-4000-8000-000000050002', 'sent'),
    NULL,
    'completing an id that was never opened answers null'
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.invitation_link_witness('%s', 'maybe')$$,
      current_setting('t39.witness')
    ),
    '22023',
    'invitation_link_witness: p_outcome must be sent or not-sent',
    'an outcome other than the two words is refused'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        private.invitation_link_witness w
      WHERE
        w.id IN (
          '39390000-0000-4000-8000-000000050001',
          '39390000-0000-4000-8000-000000050002'
        )
    ),
    0,
    'the witness table holds no row for the id that was never opened, and the record opened two days ago is gone'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          w.outcome || ' ' || (w.completed_at IS NOT NULL)::text,
          ', '
          ORDER BY
            w.outcome
        )
      FROM
        private.invitation_link_witness w
      WHERE
        w.id IN (
          current_setting('t39.witness')::uuid,
          current_setting('t39.witness_2')::uuid
        )
    ),
    'not-sent true, sent true',
    'the table holds exactly the two records the service role opened, each completed once'
  );

-- =====================================================================
-- Section 21: exposure
-- =====================================================================
SELECT
  is (
    (
      SELECT
        string_agg(
          p.proname || ' ' || has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('service_role', p.oid, 'EXECUTE')::text,
          ', '
          ORDER BY
            p.proname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND (
          p.proname LIKE 'invitation\_%'
          OR p.proname = 'recovery_link_request'
        )
    ),
    'invitation_code_claimant_email false/false/true, invitation_code_status false/false/true, invitation_link_release false/false/true, invitation_link_request false/false/true, invitation_link_witness false/false/true, invitation_link_witness_open false/false/true, recovery_link_request false/false/true',
    'the seven helpers, each with one signature, are executable by service_role and by neither anon nor authenticated'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          p.proname || ' ' || has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text,
          ', '
          ORDER BY
            p.proname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'private'
        AND p.proname IN ('invitation_throttle_take', 'user_password_set')
    ),
    'invitation_throttle_take false/false, user_password_set false/false',
    'the throttle and the password fact are executable by neither anon nor authenticated'
  );

SELECT
  is (
    (
      SELECT
        count(*)::text || ' ' || bool_and(
          p.prosecdef
          AND p.proconfig::text = '{"search_path=\"\""}'
        )::text
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        (
          n.nspname = 'public'
          AND (
            p.proname LIKE 'invitation\_%'
            OR p.proname IN (
              'claim_invitations',
              'cleanup_invitation_throttle_on_delete',
              'recovery_link_request'
            )
          )
        )
        OR (
          n.nspname = 'private'
          AND p.proname IN ('invitation_throttle_take', 'user_password_set')
        )
    ),
    '11 true',
    'each of the eleven functions is SECURITY DEFINER with an empty pinned search_path'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          c.relname || ' ' || c.relrowsecurity::text || ' ' || (
            SELECT
              count(*)
            FROM
              (
                VALUES
                  ('anon'),
                  ('authenticated'),
                  ('service_role')
              ) AS r (rolname)
            WHERE
              has_table_privilege(
                r.rolname,
                c.oid,
                'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
              )
              OR has_any_column_privilege(
                r.rolname,
                c.oid,
                'SELECT, INSERT, UPDATE, REFERENCES'
              )
          )::text,
          ', '
          ORDER BY
            c.relname
        )
      FROM
        pg_class c
      WHERE
        c.oid IN (
          'private.invitation_throttle'::regclass,
          'private.invitation_link_witness'::regclass
        )
    ),
    'invitation_link_witness true 0, invitation_throttle true 0',
    'both private tables have row-level security enabled, and neither anon, authenticated nor service_role holds any privilege on either'
  );

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    'SELECT public.' || v.call,
    '42501',
    'permission denied for function ' || v.name,
    'anon calling ' || v.name || ' is refused'
  )
FROM
  (
    VALUES
      (
        1,
        'invitation_code_status',
        'invitation_code_status(NULL, NULL)'
      ),
      (
        2,
        'invitation_link_request',
        'invitation_link_request(NULL, NULL, NULL)'
      ),
      (
        3,
        'invitation_link_release',
        'invitation_link_release(NULL, NULL, NULL)'
      ),
      (
        4,
        'invitation_code_claimant_email',
        'invitation_code_claimant_email(NULL, NULL)'
      ),
      (
        5,
        'invitation_link_witness_open',
        'invitation_link_witness_open()'
      ),
      (
        6,
        'invitation_link_witness',
        'invitation_link_witness(NULL, NULL)'
      ),
      (
        7,
        'recovery_link_request',
        'recovery_link_request(NULL, NULL)'
      )
  ) AS v (
    ord,
    name,
    call
  )
ORDER BY
  v.ord;

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    'SELECT public.' || v.call,
    '42501',
    'permission denied for function ' || v.name,
    'a project admin calling ' || v.name || ' as authenticated is refused'
  )
FROM
  (
    VALUES
      (
        1,
        'invitation_code_status',
        'invitation_code_status(NULL, NULL)'
      ),
      (
        2,
        'invitation_link_request',
        'invitation_link_request(NULL, NULL, NULL)'
      ),
      (
        3,
        'invitation_link_release',
        'invitation_link_release(NULL, NULL, NULL)'
      ),
      (
        4,
        'invitation_code_claimant_email',
        'invitation_code_claimant_email(NULL, NULL)'
      ),
      (
        5,
        'invitation_link_witness_open',
        'invitation_link_witness_open()'
      ),
      (
        6,
        'invitation_link_witness',
        'invitation_link_witness(NULL, NULL)'
      ),
      (
        7,
        'recovery_link_request',
        'recovery_link_request(NULL, NULL)'
      )
  ) AS v (
    ord,
    name,
    call
  )
ORDER BY
  v.ord;

SELECT
  reset_role ();

-- Deleting an invitation deletes its throttle keys: the slot of an email row's address, the slot of a code row's pending address, and the look-up count of a used code. The used row is deleted with its candidate, since no API role can delete it directly.
SELECT
  is (
    (
      SELECT
        string_agg(
          split_part(t.key, ':', 1),
          ','
          ORDER BY
            t.key
        )
      FROM
        private.invitation_throttle t
      WHERE
        t.key IN (
          'link:' || test_id ('project_a')::text || ':' || encode(
            sha256(convert_to('release.mail@test.example', 'UTF8')),
            'hex'
          ),
          'link:' || test_id ('project_a')::text || ':' || encode(
            sha256(convert_to('bind.two@test.example', 'UTF8')),
            'hex'
          ),
          'code:' || test_id ('project_a')::text || ':' || (
            SELECT
              i.code_hash
            FROM
              public.invitations i
            WHERE
              i.id = (current_setting('t39.h')::jsonb -> 4 ->> 'id')::uuid
          )
        )
    ),
    'code,link,link',
    'before the deletes the three keys exist'
  );

DO $$
BEGIN
  PERFORM set_config(
    't39.code_key',
    'code:' || test_id('project_a')::text || ':' || (SELECT i.code_hash FROM public.invitations i WHERE i.id = (current_setting('t39.h')::jsonb -> 4 ->> 'id')::uuid),
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

WITH
  d AS (
    DELETE FROM public.invitations
    WHERE
      id IN (
        (current_setting('t39.h')::jsonb -> 3 ->> 'id')::uuid,
        (current_setting('t39.h')::jsonb -> 7 ->> 'id')::uuid
      )
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
    'a project admin deletes the open email row and the open code row'
  );

SELECT
  lives_ok (
    $$DELETE FROM public.candidates WHERE id = '39390000-0000-4000-8000-00000004c007'$$,
    'and deletes the candidate whose used code''s row goes with it'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        private.invitation_throttle t
      WHERE
        t.key IN (
          'link:' || test_id ('project_a')::text || ':' || encode(
            sha256(convert_to('release.mail@test.example', 'UTF8')),
            'hex'
          ),
          'link:' || test_id ('project_a')::text || ':' || encode(
            sha256(convert_to('bind.two@test.example', 'UTF8')),
            'hex'
          ),
          current_setting('t39.code_key')
        )
    ),
    0,
    'deleting an invitation removes its link: and code: keys'
  );

SELECT
  is (
    (
      SELECT
        t.tgrelid::regclass::text || ' ' || t.tgtype::text
      FROM
        pg_trigger t
      WHERE
        t.tgname = 'cleanup_invitation_throttle'
        AND NOT t.tgisinternal
    ),
    'invitations 9',
    'the cleanup trigger is an AFTER DELETE row trigger on invitations'
  );

-- =====================================================================
-- Section 22: the registration-mode condition
-- =====================================================================
-- An open invitation of a candidate or an organization is honoured only while the project allows its mode for its target's type: `code` for a row bound to a code, `email` for a row bound to an address. A row that is not honoured is treated as absent, in the code check, the link request and the claim alike. Every refusal below is followed by the same call with the mode on again, so no refusal is one the call would have given anyway.
--
-- The rows of project A, by their index in `t39.m`: 0 the open candidate code; 1 the candidate code that is claimed while its mode is on; 2 an organization's email row; 3 a project-scope promise; 4 a faction's row; 5 an alliance's row. `t39.md` holds a candidate's code row and an organization's email row of project D, which has no settings row when they are seeded.
UPDATE private.invitation_throttle
SET
  window_start = now() - interval '2 minutes';

INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '39390000-0000-4000-8000-00000005c001',
    test_id ('project_a'),
    'Mode',
    'One'
  ),
  (
    '39390000-0000-4000-8000-00000005c002',
    test_id ('project_a'),
    'Mode',
    'Two'
  ),
  (
    '39390000-0000-4000-8000-00000005c003',
    test_id ('project_a'),
    'Mode',
    'Three'
  );

INSERT INTO
  public.organizations (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000005a001',
    test_id ('project_a'),
    '{"en":"Mode Org"}'::jsonb
  );

INSERT INTO
  public.factions (id, project_id, organization_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000005f001',
    test_id ('project_a'),
    test_id ('org_a'),
    '{"en":"Mode Faction"}'::jsonb
  );

INSERT INTO
  public.alliances (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000005d001',
    test_id ('project_a'),
    '{"en":"Mode Alliance"}'::jsonb
  );

INSERT INTO
  public.projects (id, account_id, name)
VALUES
  (
    '39390000-0000-4000-8000-0000000005f1',
    test_id ('account_a'),
    'Project D'
  );

INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '39390000-0000-4000-8000-00000005c0d1',
    '39390000-0000-4000-8000-0000000005f1',
    'Mode',
    'Elsewhere'
  );

INSERT INTO
  public.organizations (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000005a0d1',
    '39390000-0000-4000-8000-0000000005f1',
    '{"en":"Mode Org Elsewhere"}'::jsonb
  );

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
SELECT
  u.id::uuid,
  '00000000-0000-0000-0000-000000000000',
  u.email,
  '',
  'authenticated',
  'authenticated',
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
FROM
  (
    VALUES
      (
        '39390000-0000-4000-8000-00000005e001',
        'mode.code@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000005e002',
        'mode.claimed@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000005e003',
        'mode.org@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000005e004',
        'mode.holder@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000005e005',
        'mode.pscope@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000005e006',
        'mode.faction@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000005e007',
        'mode.alliance@test.example'
      )
  ) AS u (id, email);

-- The holder edits a candidate of project A, by a grant written directly.
INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    '39390000-0000-4000-8000-00000005e004',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000005c003',
    'editor'
  );

DO $$
BEGIN
  PERFORM set_config(
    't39.m',
    public.create_invitations(
      test_id('project_a'),
      '[
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000005c001"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000005c002"},
        {"target_type":"organization","target_id":"39390000-0000-4000-8000-00000005a001","email":"mode.org@test.example"},
        {"scope":"project","role":"editor","email":"mode.pscope@test.example"},
        {"target_type":"faction","target_id":"39390000-0000-4000-8000-00000005f001","email":"mode.faction@test.example"},
        {"target_type":"alliance","target_id":"39390000-0000-4000-8000-00000005d001","email":"mode.alliance@test.example"}
      ]'::jsonb,
      true
    )::text,
    true
  );
  PERFORM set_config(
    't39.md',
    public.create_invitations(
      '39390000-0000-4000-8000-0000000005f1',
      '[
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000005c0d1"},
        {"target_type":"organization","target_id":"39390000-0000-4000-8000-00000005a0d1","email":"mode.nomatrix@test.example"}
      ]'::jsonb,
      true
    )::text,
    true
  );
END;
$$;

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.invitations i
      WHERE
        i.project_id = '39390000-0000-4000-8000-0000000005f1'
        AND i.claimed_at IS NULL
    ),
    2,
    'MODE: seeding is not judged: create_invitations writes a candidate''s code row and an organization''s email row in a project that allows neither mode'
  );

-- With every mode on, the second code is bound and claimed.
SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mode.claimed@test.example',
      current_setting('t39.m')::jsonb -> 1 ->> 'code'
    ),
    'mode.claimed@test.example',
    'MODE: with every mode on, a candidate''s open code is bound to an address'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e002',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000005c002","role":"editor"}]'::jsonb,
    'MODE: and the user who holds that address claims it'
  );

SELECT
  reset_role ();

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.m')::jsonb -> 1 ->> 'code'
    ),
    'used',
    'MODE: the claimed code answers used while the code mode is on'
  );

SELECT
  reset_role ();

-- Every window opened so far has ended. No window is moved again before the code mode is back on, so a slot taken by a refused request would still be held then.
UPDATE private.invitation_throttle
SET
  window_start = now() - interval '2 minutes';

-- The code mode is switched off for candidates.
UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,registrationModes,candidate}',
    '["identity_provider", "email"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.m')::jsonb -> 0 ->> 'code'
    ),
    'unknown',
    'MODE: with the code mode off for candidates, an open candidate code answers unknown'
  );

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.m')::jsonb -> 1 ->> 'code'
    ),
    'used',
    'MODE: a claimed candidate code still answers used with the code mode off'
  );

SELECT
  is (
    ARRAY[
      public.invitation_code_status (
        test_id ('project_a'),
        current_setting('t39.m')::jsonb -> 0 ->> 'code'
      ),
      public.invitation_code_status (
        test_id ('project_a'),
        current_setting('t39.m')::jsonb -> 0 ->> 'code'
      ),
      public.invitation_code_status (
        test_id ('project_a'),
        current_setting('t39.m')::jsonb -> 1 ->> 'code'
      ),
      public.invitation_code_status (
        test_id ('project_a'),
        current_setting('t39.m')::jsonb -> 1 ->> 'code'
      )
    ],
    ARRAY['unknown', 'unknown', 'used', 'used'],
    'MODE: the same code checked twice gives the same answer both times, the open code and the claimed one alike'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mode.code@test.example',
      current_setting('t39.m')::jsonb -> 0 ->> 'code'
    ),
    NULL,
    'MODE: a link request with that open code and an address answers null'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.pending_email IS NULL)::text || ' ' || (i.pending_email_at IS NULL)::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.m')::jsonb -> 0 ->> 'id')::uuid
    ),
    'true true',
    'MODE: and binds nothing: the row''s pending address is still unset'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        private.invitation_throttle t
      WHERE
        t.key = 'link:' || test_id ('project_a')::text || ':' || encode(
          sha256(convert_to('mode.code@test.example', 'UTF8')),
          'hex'
        )
    ),
    0,
    'MODE: and writes no throttle key for the address'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mode.elsewhere@test.example',
      current_setting('t39.m')::jsonb -> 1 ->> 'code'
    ),
    'mode.claimed@test.example',
    'MODE: a link request with the claimed code still answers its claimant''s own address with the code mode off'
  );

SELECT
  reset_role ();

-- The code mode is switched on again.
UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,registrationModes,candidate}',
    '["identity_provider", "email", "code"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.m')::jsonb -> 0 ->> 'code'
    ) || ' ' || public.invitation_code_status (
      test_id ('project_a'),
      current_setting('t39.m')::jsonb -> 1 ->> 'code'
    ),
    'valid used',
    'MODE: with the code mode on again the same open code answers valid, and the claimed one used as before'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'mode.code@test.example',
      current_setting('t39.m')::jsonb -> 0 ->> 'code'
    ),
    'mode.code@test.example',
    'MODE: and a link request made in the same minute answers the address, so the refused request had left the slot free'
  );

SELECT
  reset_role ();

-- The code mode is switched off again, with the open code now bound to that address.
UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,registrationModes,candidate}',
    '["identity_provider", "email"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[],"password_set":false}'::jsonb,
    'MODE: with the code mode off, the user whose address is the open code row''s pending address claims nothing, and the row is neither claimed nor skipped'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.claimed_at IS NULL)::text || ' ' || COALESCE(i.pending_email, '') || ' ' || (
          SELECT
            count(*)
          FROM
            public.grants g
          WHERE
            g.user_id = '39390000-0000-4000-8000-00000005e001'
        )::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.m')::jsonb -> 0 ->> 'id')::uuid
    ),
    'true mode.code@test.example 0',
    'MODE: and the row is still open with its pending address kept, and the user holds no grant'
  );

UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,registrationModes,candidate}',
    '["identity_provider", "email", "code"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000005c001","role":"editor"}]'::jsonb,
    'MODE: with the code mode on again the same user claims the same row'
  );

SELECT
  reset_role ();

-- The email mode is switched off for organizations.
UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,registrationModes,organization}',
    '["identity_provider", "code"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mode.org@test.example'),
    NULL,
    'MODE: with the email mode off for organizations, the address of an open organization email invitation answers null'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        private.invitation_throttle t
      WHERE
        t.key = 'link:' || test_id ('project_a')::text || ':' || encode(
          sha256(convert_to('mode.org@test.example', 'UTF8')),
          'hex'
        )
    ),
    0,
    'MODE: and writes no throttle key for that address'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e003',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[],"password_set":false}'::jsonb,
    'MODE: and the user who holds that address claims nothing, the row neither claimed nor skipped'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (i.claimed_at IS NULL)::text || ' ' || (
          SELECT
            count(*)
          FROM
            public.grants g
          WHERE
            g.user_id = '39390000-0000-4000-8000-00000005e003'
        )::text
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.m')::jsonb -> 2 ->> 'id')::uuid
    ),
    'true 0',
    'MODE: and the organization''s row is still open, and the user holds no grant'
  );

-- The email mode is switched on again.
UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,registrationModes,organization}',
    '["identity_provider", "email", "code"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mode.org@test.example'),
    'mode.org@test.example',
    'MODE: with the email mode on again the same address is answered, in the same minute'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e003',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"organization","target_id":"39390000-0000-4000-8000-00000005a001","role":"editor"}]'::jsonb,
    'MODE: and its user claims the organization''s row'
  );

SELECT
  reset_role ();

-- The matrix allows nothing, for either type.
UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,registrationModes}',
    '{"candidate": [], "organization": []}'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (test_id ('project_a'), 'mode.holder@test.example'),
    'mode.holder@test.example',
    'MODE: under a matrix that allows nothing, a user who holds a grant in the project is answered their own address'
  );

SELECT
  is (
    ARRAY[
      public.invitation_link_request (test_id ('project_a'), 'mode.pscope@test.example'),
      public.invitation_link_request (
        test_id ('project_a'),
        'mode.faction@test.example'
      ),
      public.invitation_link_request (
        test_id ('project_a'),
        'mode.alliance@test.example'
      )
    ],
    ARRAY[
      'mode.pscope@test.example',
      'mode.faction@test.example',
      'mode.alliance@test.example'
    ],
    'MODE: under that matrix the address of a project-scope promise, of a faction''s invitation and of an alliance''s invitation is each answered'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e005',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"project","target_type":null,"target_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"editor"}]'::jsonb,
    'MODE: under that matrix a project-scope promise is claimed'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e006',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"faction","target_id":"39390000-0000-4000-8000-00000005f001","role":"editor"}]'::jsonb,
    'MODE: and a faction''s invitation is claimed'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000005e007',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"alliance","target_id":"39390000-0000-4000-8000-00000005d001","role":"editor"}]'::jsonb,
    'MODE: and an alliance''s invitation is claimed'
  );

SELECT
  reset_role ();

-- Project D: no settings row, then a row that stores no matrix, then one that serves both types and allows both modes.
SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      '39390000-0000-4000-8000-0000000005f1',
      current_setting('t39.md')::jsonb -> 0 ->> 'code'
    ) || ' ' || COALESCE(
      public.invitation_link_request (
        '39390000-0000-4000-8000-0000000005f1',
        'mode.nomatrix@test.example'
      ),
      'null'
    ),
    'unknown null',
    'MODE: a project with no settings row honours neither a candidate''s open code nor an organization''s open email invitation'
  );

SELECT
  reset_role ();

INSERT INTO
  app_settings (project_id, settings)
VALUES
  (
    '39390000-0000-4000-8000-0000000005f1',
    '{"theme":"light"}'::jsonb
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      '39390000-0000-4000-8000-0000000005f1',
      current_setting('t39.md')::jsonb -> 0 ->> 'code'
    ) || ' ' || COALESCE(
      public.invitation_link_request (
        '39390000-0000-4000-8000-0000000005f1',
        'mode.nomatrix@test.example'
      ),
      'null'
    ),
    'unknown null',
    'MODE: nor does a project whose settings store no matrix'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{
    "contestantApp": {
      "entityTypes": ["candidate", "organization"],
      "registrationModes": {"candidate": ["code"], "organization": ["email"]}
    }
  }'::jsonb
WHERE
  project_id = '39390000-0000-4000-8000-0000000005f1';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_code_status (
      '39390000-0000-4000-8000-0000000005f1',
      current_setting('t39.md')::jsonb -> 0 ->> 'code'
    ) || ' ' || COALESCE(
      public.invitation_link_request (
        '39390000-0000-4000-8000-0000000005f1',
        'mode.nomatrix@test.example'
      ),
      'null'
    ),
    'valid mode.nomatrix@test.example',
    'MODE: and once its settings serve both types and allow the two modes, the same code answers valid and the same address is answered'
  );

SELECT
  reset_role ();

-- The three functions behind the condition, read from the catalogue by name.
SELECT
  is (
    (
      SELECT
        string_agg(
          p.proname || ' ' || p.pronargs::text || ' ' || p.provolatile::text || ' ' || p.prosecdef::text,
          ', '
          ORDER BY
            p.proname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'private'
        AND p.proname IN (
          'registration_mode_allowed_in',
          'registration_mode_allowed',
          'invitation_mode_allowed'
        )
    ),
    'invitation_mode_allowed 1 s false, registration_mode_allowed 3 s true, registration_mode_allowed_in 3 i false',
    'MODE: each of the three functions has one signature: the rule is immutable, the reader of a project''s settings is a stable definer function, and the condition is stable and runs as its caller'
  );

SELECT
  is (
    (
      SELECT
        count(*)::text || ' ' || bool_and(p.proconfig::text = '{"search_path=\"\""}')::text
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'private'
        AND p.proname IN (
          'registration_mode_allowed_in',
          'registration_mode_allowed',
          'invitation_mode_allowed'
        )
    ),
    '3 true',
    'MODE: each of the three runs with an empty search_path and no other setting'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          p.proname || ' ' || has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text,
          ', '
          ORDER BY
            p.proname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'private'
        AND p.proname IN (
          'registration_mode_allowed_in',
          'registration_mode_allowed',
          'invitation_mode_allowed'
        )
    ),
    'invitation_mode_allowed false/false, registration_mode_allowed false/false, registration_mode_allowed_in false/false',
    'MODE: none of the three is executable by anon or by authenticated'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname IN (
          'registration_mode_allowed_in',
          'registration_mode_allowed',
          'invitation_mode_allowed'
        )
    ),
    0,
    'MODE: none of the three is a public function, so PostgREST publishes none'
  );

-- =====================================================================
-- Section 23: who may be sent a recovery mail
-- =====================================================================
-- recovery_link_request answers which mail a recovery request for an address earns in a project: `recovery` for the confirmed address of a user who holds a grant there, `sign-in` for an address that has only an open invitation the project's registration modes allow, and null for everything else. An answered request takes the slot a sign-in request for the same address takes. Every refusal below has a request beside it that is answered, so no refusal is one the call would have given anyway.
--
-- The rows of project A, by their index in `t39.r`: 0 the open email invitation of an address that has no account; 1 an expired one; 2 the one a user claims; 3 the one whose address asks for both kinds of mail.
UPDATE private.invitation_throttle
SET
  window_start = now() - interval '2 minutes';

-- Project A serves both types with every mode on again.
UPDATE app_settings
SET
  settings = settings || jsonb_build_object(
    'contestantApp',
    COALESCE(settings -> 'contestantApp', '{}'::jsonb) || '{
      "entityTypes": ["candidate", "organization"],
      "registrationModes": {
        "candidate": ["identity_provider", "email", "code"],
        "organization": ["identity_provider", "email", "code"]
      }
    }'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
SELECT
  c.id::uuid,
  test_id ('project_a'),
  'Recovery',
  c.last_name
FROM
  (
    VALUES
      ('39390000-0000-4000-8000-00000006c001', 'One'),
      ('39390000-0000-4000-8000-00000006c002', 'Two'),
      ('39390000-0000-4000-8000-00000006c003', 'Three'),
      ('39390000-0000-4000-8000-00000006c004', 'Four'),
      ('39390000-0000-4000-8000-00000006c005', 'Five'),
      ('39390000-0000-4000-8000-00000006c006', 'Six'),
      ('39390000-0000-4000-8000-00000006c007', 'Seven')
  ) AS c (id, last_name);

-- Every user's address is confirmed and every user has a password, except where the address says otherwise.
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
SELECT
  u.id::uuid,
  '00000000-0000-0000-0000-000000000000',
  u.email,
  CASE
    WHEN u.email IN (
      'recover.nopassword@test.example',
      'recover.claimant@test.example'
    ) THEN ''
    ELSE '$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz0123456'
  END,
  'authenticated',
  'authenticated',
  CASE
    WHEN u.email = 'recover.unconfirmed@test.example' THEN NULL
    ELSE now()
  END,
  '{}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
FROM
  (
    VALUES
      (
        '39390000-0000-4000-8000-00000006e001',
        'recover.pgrant@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e002',
        'recover.egrant@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e003',
        'recover.nopassword@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e004',
        'recover.otherproject@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e005',
        'recover.unconfirmed@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e006',
        'recover.root@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e007',
        'recover.account@test.example'
      ),
      (
        '39390000-0000-4000-8000-00000006e008',
        'recover.claimant@test.example'
      )
  ) AS u (id, email);

INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    '39390000-0000-4000-8000-00000006e001',
    'project',
    NULL,
    test_id ('project_a'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000006e002',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000006c001',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000006e003',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000006c006',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000006e004',
    'project',
    NULL,
    test_id ('project_b'),
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000006e005',
    'entity',
    'candidate',
    '39390000-0000-4000-8000-00000006c005',
    'editor'
  ),
  (
    '39390000-0000-4000-8000-00000006e006',
    'global',
    NULL,
    NULL,
    'admin'
  ),
  (
    '39390000-0000-4000-8000-00000006e007',
    'account',
    NULL,
    test_id ('account_a'),
    'admin'
  );

DO $$
BEGIN
  PERFORM set_config(
    't39.r',
    public.create_invitations(
      test_id('project_a'),
      '[
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000006c002","email":"recover.invited@test.example"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000006c003","email":"recover.expired@test.example","expires_at":"2000-01-01T00:00:00Z"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000006c004","email":"recover.claimant@test.example"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000006c007","email":"recover.both@test.example"}
      ]'::jsonb,
      true
    )::text,
    true
  );
  -- The users, the grants and every column of every invitation, as they are before any request.
  PERFORM set_config(
    't39.recovery_before',
    (SELECT count(*)::text FROM auth.users) || ' ' || (SELECT count(*)::text FROM public.grants) || ' ' || (SELECT count(*)::text || ' ' || md5(string_agg(to_jsonb(i)::text, ',' ORDER BY i.id)) FROM public.invitations i),
    true
  );
  PERFORM set_config(
    't39.recovery_throttle_before',
    (SELECT count(*)::text FROM private.invitation_throttle),
    true
  );
END;
$$;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.nobody@test.example'
    ),
    NULL,
    'RECOVERY: an address the project knows nothing of answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.otherproject@test.example'
    ),
    NULL,
    'RECOVERY: the confirmed address of a user whose only grant is in the other project answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.unconfirmed@test.example'
    ),
    NULL,
    'RECOVERY: the address of a grant holder whose email_confirmed_at is null answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.root@test.example'
    ),
    NULL,
    'RECOVERY: the confirmed address of a root admin who holds no grant in the project answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.account@test.example'
    ),
    NULL,
    'RECOVERY: the confirmed address of an admin of the project''s account, who holds no grant in the project, answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.expired@test.example'
    ),
    NULL,
    'RECOVERY: an address whose only invitation has expired answers null'
  );

SELECT
  is (
    public.recovery_link_request (NULL, 'recover.pgrant@test.example') IS NULL
    AND public.recovery_link_request (test_id ('project_a'), NULL) IS NULL
    AND public.recovery_link_request (test_id ('project_a'), '   ') IS NULL,
    true,
    'RECOVERY: no project, no address and a blank address each answer null'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::text
      FROM
        private.invitation_throttle
    ),
    current_setting('t39.recovery_throttle_before'),
    'RECOVERY: none of those refusals wrote a throttle key: no slot is taken for an address no mail would go to'
  );

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      '  Recover.PGrant@Test.Example '
    ),
    '{"email":"recover.pgrant@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: the confirmed address of a user who holds a project-scope grant on the project is answered recovery, in an object of exactly the keys email and mail, the address trimmed and lower-cased'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.egrant@test.example'
    ),
    '{"email":"recover.egrant@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: the confirmed address of a user who holds an entity-scope grant on an entity of the project is answered recovery'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.nopassword@test.example'
    ),
    '{"email":"recover.nopassword@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: a grant holder whose stored password is the empty string is answered recovery as well'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      ' Recover.Invited@Test.Example  '
    ),
    '{"email":"recover.invited@test.example","mail":"sign-in"}'::jsonb,
    'RECOVERY: an address that has no account and one open invitation in the project is answered sign-in, in an object of exactly the keys email and mail, the address trimmed and lower-cased'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_b'),
      'recover.otherproject@test.example'
    ),
    '{"email":"recover.otherproject@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: the editor of the other project is answered recovery there'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)::text
      FROM
        auth.users
    ) || ' ' || (
      SELECT
        count(*)::text
      FROM
        public.grants
    ) || ' ' || (
      SELECT
        count(*)::text || ' ' || md5(
          string_agg(
            to_jsonb(i)::text,
            ','
            ORDER BY
              i.id
          )
        )
      FROM
        public.invitations i
    ),
    current_setting('t39.recovery_before'),
    'RECOVERY: none of those requests, answered recovery, sign-in or null, created a user, wrote a grant or changed any column of any invitation'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        private.invitation_throttle t
      WHERE
        t.key IN (
          'link:' || test_id ('project_a')::text || ':' || encode(
            sha256(convert_to('recover.pgrant@test.example', 'UTF8')),
            'hex'
          ),
          'link:' || test_id ('project_a')::text || ':' || encode(
            sha256(
              convert_to('recover.invited@test.example', 'UTF8')
            ),
            'hex'
          )
        )
    ),
    2,
    'RECOVERY: a request answered recovery and one answered sign-in each hold the key a sign-in request for that address takes'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        private.invitation_throttle
    ),
    current_setting('t39.recovery_throttle_before')::integer + 10,
    'RECOVERY: the five answered requests wrote two throttle keys each, the address''s minute slot in the project and its day slot, and nothing else'
  );

-- One mail per address per project per 60 seconds, across both kinds of request.
SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.pgrant@test.example'
    ),
    NULL,
    'RECOVERY: a second request for the same address inside 60 seconds answers null'
  );

SELECT
  lives_ok (
    $$SELECT public.invitation_link_release(test_id('project_a'), 'recover.pgrant@test.example')$$,
    'RECOVERY: invitation_link_release gives the slot back'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.pgrant@test.example'
    ),
    '{"email":"recover.pgrant@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: and the next recovery request is answered again, with no time moved'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'recover.pgrant@test.example'
    ),
    NULL,
    'RECOVERY: a sign-in request for an address a recovery request was just answered for answers null'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'recover.invited@test.example'
    ),
    NULL,
    'RECOVERY: so does a sign-in request for an address a recovery request was just answered sign-in for'
  );

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'recover.both@test.example'
    ),
    'recover.both@test.example',
    'RECOVERY: a sign-in request for an invited address that has asked for nothing is answered'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.both@test.example'
    ),
    NULL,
    'RECOVERY: and a recovery request for it inside 60 seconds answers null: the two kinds of request share one slot'
  );

SELECT
  reset_role ();

UPDATE private.invitation_throttle
SET
  window_start = now() - interval '2 minutes';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    ARRAY[
      public.invitation_link_request (
        test_id ('project_a'),
        'recover.egrant@test.example'
      ),
      public.recovery_link_request (
        test_id ('project_a'),
        'recover.egrant@test.example'
      ) ->> 'mail'
    ],
    ARRAY['recover.egrant@test.example', NULL],
    'RECOVERY: for a grant holder too, a recovery request after an answered sign-in request answers null'
  );

SELECT
  reset_role ();

-- Every window opened so far has ended. No window is moved again before the email mode is back on, so a slot taken by a refused request would still be held then.
UPDATE private.invitation_throttle
SET
  window_start = now() - interval '2 minutes';

UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,registrationModes,candidate}',
    '["identity_provider", "code"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.invited@test.example'
    ),
    NULL,
    'RECOVERY: with the email mode off for candidates, an address that has only an open candidate invitation answers null'
  );

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.egrant@test.example'
    ),
    '{"email":"recover.egrant@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: a grant holder is answered recovery with that mode off'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = jsonb_set(
    settings,
    '{contestantApp,registrationModes,candidate}',
    '["identity_provider", "email", "code"]'::jsonb
  )
WHERE
  project_id = test_id ('project_a');

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.invited@test.example'
    ),
    '{"email":"recover.invited@test.example","mail":"sign-in"}'::jsonb,
    'RECOVERY: with the mode on again the same address is answered sign-in in the same minute: the refused request took no slot'
  );

-- An invitation earns the sign-in mail while it is open, the grant it becomes earns the recovery mail, and a claimed invitation by itself earns nothing.
SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.claimant@test.example'
    ),
    '{"email":"recover.claimant@test.example","mail":"sign-in"}'::jsonb,
    'RECOVERY: a confirmed account that holds no grant and has an open invitation in the project is answered sign-in'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000006e008',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) -> 'claimed',
    '[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000006c004","role":"editor"}]'::jsonb,
    'RECOVERY: that user claims the invitation'
  );

SELECT
  reset_role ();

UPDATE private.invitation_throttle
SET
  window_start = now() - interval '2 minutes';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.claimant@test.example'
    ),
    '{"email":"recover.claimant@test.example","mail":"recovery"}'::jsonb,
    'RECOVERY: and is answered recovery from then on'
  );

SELECT
  reset_role ();

DELETE FROM public.grants
WHERE
  user_id = '39390000-0000-4000-8000-00000006e008';

UPDATE private.invitation_throttle
SET
  window_start = now() - interval '2 minutes';

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.recovery_link_request (
      test_id ('project_a'),
      'recover.claimant@test.example'
    ),
    NULL,
    'RECOVERY: a claimed invitation earns nothing by itself: with the grant gone, the same address answers null'
  );

SELECT
  reset_role ();

-- The function and the grant-holder test it shares with invitation_link_request, read from the catalogue by name.
SELECT
  is (
    (
      SELECT
        string_agg(
          pg_get_function_identity_arguments(p.oid) || ' -> ' || p.prorettype::regtype::text || ' ' || p.prosecdef::text || ' ' || p.proconfig::text,
          ', '
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'recovery_link_request'
    ),
    'p_project_id uuid, p_email text -> jsonb true {"search_path=\"\""}',
    'RECOVERY: the function has one signature, which takes a project and an address and nothing else, answers jsonb, and is SECURITY DEFINER with an empty pinned search_path'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('service_role', p.oid, 'EXECUTE')::text,
          ', '
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'recovery_link_request'
    ),
    'false/false/true',
    'RECOVERY: service_role may execute it, and neither anon nor authenticated may'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          n.nspname || ' ' || pg_get_function_identity_arguments(p.oid) || ' ' || p.provolatile::text || ' ' || p.prosecdef::text || ' ' || p.proconfig::text || ' ' || has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text,
          ', '
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        p.proname = 'email_holds_grant_in_project'
    ),
    'private p_project_id uuid, p_email text s false {"search_path=\"\""} false/false',
    'RECOVERY: the grant-holder test is one function, in private, stable, running as its caller with an empty search_path, and executable by neither anon nor authenticated'
  );

-- =====================================================================
-- Section 24: an identity-provider account claims nothing
-- =====================================================================
-- An account whose app metadata names an identity provider was created by that provider, and its address does not decide who the person is, so the claim reads no address for it. Beside it is a control of the same shape with no `identity_provider` key, which claims its invitation.
--
-- The rows of project A: in `t39.idp`, 0 the email invitation of the identity-provider account and 1 the control's; in `t39.idp_code`, 0 a code invitation whose pending address the identity-provider account's address is bound to.
INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '39390000-0000-4000-8000-00000007c001',
    test_id ('project_a'),
    'Provider',
    'Account'
  ),
  (
    '39390000-0000-4000-8000-00000007c002',
    test_id ('project_a'),
    'Provider',
    'Control'
  );

INSERT INTO
  public.organizations (id, project_id, name)
VALUES
  (
    '39390000-0000-4000-8000-00000007a001',
    test_id ('project_a'),
    '{"en": "Provider Code Party"}'::jsonb
  );

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
    '39390000-0000-4000-8000-00000007e001',
    '00000000-0000-0000-0000-000000000000',
    'idp.account@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{"provider": "email", "providers": ["email"], "identity_provider": "idura-ftn"}'::jsonb,
    now(),
    now()
  ),
  (
    '39390000-0000-4000-8000-00000007e002',
    '00000000-0000-0000-0000-000000000000',
    'idp.control@test.example',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    now(),
    now()
  );

DO $$
BEGIN
  PERFORM set_config(
    't39.idp',
    public.create_invitations(
      test_id('project_a'),
      '[
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000007c001","email":"idp.account@test.example"},
        {"target_type":"candidate","target_id":"39390000-0000-4000-8000-00000007c002","email":"idp.control@test.example"}
      ]'::jsonb,
      true
    )::text,
    true
  );
  PERFORM set_config(
    't39.idp_code',
    public.create_invitations(
      test_id('project_a'),
      '[{"target_type":"organization","target_id":"39390000-0000-4000-8000-00000007a001"}]'::jsonb,
      true
    )::text,
    true
  );
END;
$$;

SET
  LOCAL ROLE service_role;

SELECT
  is (
    public.invitation_link_request (
      test_id ('project_a'),
      'idp.account@test.example',
      current_setting('t39.idp_code')::jsonb -> 0 ->> 'code'
    ),
    'idp.account@test.example',
    'IDP: the code invitation is bound to the identity-provider account''s address'
  );

SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000007e001',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) - 'password_set',
    '{"claimed":[],"skipped":[]}'::jsonb,
    'IDP: an account whose app metadata names an identity provider claims nothing and skips nothing, though its confirmed address is invited by email and bound to a code'
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
        i.id IN (
          (current_setting('t39.idp')::jsonb -> 0 ->> 'id')::uuid,
          (
            current_setting('t39.idp_code')::jsonb -> 0 ->> 'id'
          )::uuid
        )
        AND i.claimed_at IS NULL
        AND i.claimed_by IS NULL
    ),
    2,
    'IDP: both invitations of its address stay open'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.grants g
      WHERE
        g.user_id = '39390000-0000-4000-8000-00000007e001'
    ),
    0,
    'IDP: the identity-provider account holds no grant'
  );

SELECT
  set_test_user (
    'authenticated',
    '39390000-0000-4000-8000-00000007e002',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')) - 'password_set',
    '{"claimed":[{"scope":"entity","target_type":"candidate","target_id":"39390000-0000-4000-8000-00000007c002","role":"editor"}],"skipped":[]}'::jsonb,
    'IDP: the control, an account of the same shape with no identity_provider key in its app metadata, claims its invitation'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        (
          i.claimed_by = '39390000-0000-4000-8000-00000007e002'
        )::text || ' ' || (
          SELECT
            count(*)::text
          FROM
            public.grants g
          WHERE
            g.user_id = '39390000-0000-4000-8000-00000007e002'
            AND g.scope = 'entity'
            AND g.target_type = 'candidate'
            AND g.target_id = '39390000-0000-4000-8000-00000007c002'
            AND g.role = 'editor'
        )
      FROM
        public.invitations i
      WHERE
        i.id = (current_setting('t39.idp')::jsonb -> 1 ->> 'id')::uuid
    ),
    'true 1',
    'IDP: the control''s invitation is claimed by it and its grant is written'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
