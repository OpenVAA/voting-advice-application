-- 56-identity-entity-find-or-create.test.sql: the entity an identity provider's user registers, found or created in one transaction
--
-- `identity_entity_find_or_create (p_user_id, p_project_id, p_entity_type, p_first_name, p_last_name)` answers for the one user it is given. It takes an advisory transaction lock keyed on the user, then reads the user's registered-entities record, `registered_entities` of auth.users.raw_app_meta_data, for the project and the type. With no record it creates the entity (a confirmed candidate with the given names, or a nameless unconfirmed organization), the user's editor grant on it and the record, and answers `created`. A record whose grant and row both exist answers `found` and writes nothing, so a second call makes no second entity; a record whose grant or row is gone answers `gone` and writes nothing. The service role alone may execute it, and a null argument, a type other than candidate and organization, a user id that names no user and a malformed record are refused with nothing written.
--
-- Every assertion's description begins with `IEF: `. The function is the service role's, so every call below is made as that role and its answer is kept in a transaction-local setting; the rows it wrote are read back by the fixture role.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, test_user_id, set_test_user, reset_role)
-- - 102-entities.sql (public.candidates, public.organizations)
-- - 300-auth-tables.sql (public.grants)
-- - 506-invitation-rpcs.sql (identity_entity_find_or_create)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (44);

SELECT
  create_test_data ();

-- Two users an identity provider created: neither has a registered-entities record yet. The first holds the metadata members the auth service writes for every account.
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
    'cccccccc-cccc-cccc-cccc-0000000056a1',
    '00000000-0000-0000-0000-000000000000',
    'identity_ief1@test.com',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    now(),
    now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000056a2',
    '00000000-0000-0000-0000-000000000000',
    'identity_ief2@test.com',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

-- =====================================================================
-- A first sign-in as a candidate: the candidate, its grant and the record
-- =====================================================================
SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$
      SELECT set_config(
        'ief.candidate',
        public.identity_entity_find_or_create(
          'cccccccc-cccc-cccc-cccc-0000000056a1',
          test_id('project_a'),
          'candidate',
          'Matti',
          'Virtanen'
        )::text,
        true
      )
    $$,
    'IEF: the service role finds or creates the candidate of a user with no record'
  );

SELECT
  reset_role ();

SELECT
  ok (
    NULLIF(current_setting('ief.candidate', true), '')::jsonb ->> 'result' = 'created'
    AND NULLIF(current_setting('ief.candidate', true), '')::jsonb ->> 'entity_id' IS NOT NULL,
    'IEF: a user with no record is answered created, with the id of the entity'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.candidates c
      WHERE
        c.id = (
          NULLIF(current_setting('ief.candidate', true), '')::jsonb ->> 'entity_id'
        )::uuid
        AND c.project_id = test_id ('project_a')
        AND c.first_name = 'Matti'
        AND c.last_name = 'Virtanen'
        AND c.confirmed
    ),
    1,
    'IEF: the created candidate is in the project, holds the given names and is confirmed'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.grants g
      WHERE
        g.user_id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
        AND g.scope = 'entity'
        AND g.target_type = 'candidate'
        AND g.target_id = (
          NULLIF(current_setting('ief.candidate', true), '')::jsonb ->> 'entity_id'
        )::uuid
        AND g.role = 'editor'
    ),
    1,
    'IEF: the user holds one editor grant on the created candidate'
  );

SELECT
  ok (
    (
      SELECT
        u.raw_app_meta_data -> 'registered_entities' -> test_id ('project_a')::text ->> 'candidate'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
    ) = NULLIF(current_setting('ief.candidate', true), '')::jsonb ->> 'entity_id',
    'IEF: the user''s registered-entities record names the created candidate for the project'
  );

SELECT
  ok (
    NULLIF(current_setting('ief.candidate', true), '')::jsonb -> 'registered_entities' = (
      SELECT
        u.raw_app_meta_data -> 'registered_entities'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
    ),
    'IEF: the answer carries the user''s whole registered-entities record as stored after the call'
  );

-- =====================================================================
-- A first sign-in as an organization: a nameless, unconfirmed organization, its grant and the record
-- =====================================================================
SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$
      SELECT set_config(
        'ief.organization',
        public.identity_entity_find_or_create(
          'cccccccc-cccc-cccc-cccc-0000000056a2',
          test_id('project_a'),
          'organization',
          'Liisa',
          'Laine'
        )::text,
        true
      )
    $$,
    'IEF: the service role finds or creates the organization of a user with no record'
  );

SELECT
  reset_role ();

SELECT
  ok (
    NULLIF(current_setting('ief.organization', true), '')::jsonb ->> 'result' = 'created'
    AND NULLIF(current_setting('ief.organization', true), '')::jsonb ->> 'entity_id' IS NOT NULL,
    'IEF: a user with no organization record is answered created, with the id of the entity'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.organizations o
      WHERE
        o.id = (
          NULLIF(current_setting('ief.organization', true), '')::jsonb ->> 'entity_id'
        )::uuid
        AND o.project_id = test_id ('project_a')
        AND o.name IS NULL
        AND NOT o.confirmed
    ),
    1,
    'IEF: the created organization is in the project, has no name and is not confirmed'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.grants g
      WHERE
        g.user_id = 'cccccccc-cccc-cccc-cccc-0000000056a2'
        AND g.scope = 'entity'
        AND g.target_type = 'organization'
        AND g.target_id = (
          NULLIF(current_setting('ief.organization', true), '')::jsonb ->> 'entity_id'
        )::uuid
        AND g.role = 'editor'
    ),
    1,
    'IEF: the user holds one editor grant on the created organization'
  );

SELECT
  ok (
    (
      SELECT
        u.raw_app_meta_data -> 'registered_entities' -> test_id ('project_a')::text ->> 'organization'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a2'
    ) = NULLIF(current_setting('ief.organization', true), '')::jsonb ->> 'entity_id',
    'IEF: the user''s registered-entities record names the created organization for the project'
  );

SELECT
  ok (
    NULLIF(current_setting('ief.organization', true), '')::jsonb -> 'registered_entities' = (
      SELECT
        u.raw_app_meta_data -> 'registered_entities'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a2'
    ),
    'IEF: the organization''s answer carries the whole record as stored after the call'
  );

-- =====================================================================
-- A second call for the same user, project and type: found, and nothing written
-- =====================================================================
SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$
      SELECT set_config(
        'ief.candidate_again',
        public.identity_entity_find_or_create(
          'cccccccc-cccc-cccc-cccc-0000000056a1',
          test_id('project_a'),
          'candidate',
          'Matti',
          'Virtanen'
        )::text,
        true
      )
    $$,
    'IEF: a second call for the same user, project and type in the same transaction lives'
  );

SELECT
  reset_role ();

SELECT
  is (
    NULLIF(current_setting('ief.candidate_again', true), '')::jsonb ->> 'result',
    'found',
    'IEF: the second call answers found'
  );

SELECT
  ok (
    NULLIF(current_setting('ief.candidate_again', true), '')::jsonb ->> 'entity_id' = NULLIF(current_setting('ief.candidate', true), '')::jsonb ->> 'entity_id',
    'IEF: with the id of the entity the first call created'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.candidates c
      WHERE
        c.project_id = test_id ('project_a')
        AND c.first_name = 'Matti'
        AND c.last_name = 'Virtanen'
    ),
    1,
    'IEF: and no second candidate exists'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.grants g
      WHERE
        g.user_id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
    ),
    1,
    'IEF: and the user holds no second grant'
  );

SELECT
  ok (
    (
      SELECT
        u.raw_app_meta_data -> 'registered_entities'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
    ) = NULLIF(current_setting('ief.candidate', true), '')::jsonb -> 'registered_entities'
    AND NULLIF(current_setting('ief.candidate_again', true), '')::jsonb -> 'registered_entities' = NULLIF(current_setting('ief.candidate', true), '')::jsonb -> 'registered_entities',
    'IEF: and the record, stored and answered, is the one the first call wrote'
  );

SELECT
  is (
    (
      SELECT
        u.raw_app_meta_data - 'registered_entities'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
    ),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    'IEF: no member of the user''s app metadata but the record is changed'
  );

-- =====================================================================
-- The lock
-- =====================================================================
SELECT
  ok (
    EXISTS (
      SELECT
        1
      FROM
        pg_locks l
      WHERE
        l.locktype = 'advisory'
        AND l.pid = pg_backend_pid()
        AND l.granted
        AND l.objsubid = 1
        AND ((l.classid::bigint << 32) | l.objid::bigint) = hashtext (
          'identity-entity:' || 'cccccccc-cccc-cccc-cccc-0000000056a1'
        )::bigint
    ),
    'IEF: after a call, this backend holds the advisory lock keyed on hashtext of identity-entity: and the user id, until its transaction ends'
  );

SELECT
  ok (
    NOT EXISTS (
      SELECT
        1
      FROM
        pg_locks l
      WHERE
        l.locktype = 'advisory'
        AND l.pid = pg_backend_pid()
        AND l.objsubid = 1
        AND ((l.classid::bigint << 32) | l.objid::bigint) = hashtext (
          'identity-entity:' || 'cccccccc-cccc-cccc-cccc-0000000056a5'
        )::bigint
    ),
    'IEF: and holds no such lock for a user it was not called for'
  );

-- =====================================================================
-- A second type beside the first
-- =====================================================================
SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$
      SELECT set_config(
        'ief.second_type',
        public.identity_entity_find_or_create(
          'cccccccc-cccc-cccc-cccc-0000000056a1',
          test_id('project_a'),
          'organization',
          'Matti',
          'Virtanen'
        )::text,
        true
      )
    $$,
    'IEF: a call for the same user and project and the other type lives'
  );

SELECT
  reset_role ();

SELECT
  ok (
    NULLIF(current_setting('ief.second_type', true), '')::jsonb ->> 'result' = 'created'
    AND (
      SELECT
        u.raw_app_meta_data -> 'registered_entities' -> test_id ('project_a')::text
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
    ) = jsonb_build_object(
      'candidate',
      NULLIF(current_setting('ief.candidate', true), '')::jsonb ->> 'entity_id',
      'organization',
      NULLIF(current_setting('ief.second_type', true), '')::jsonb ->> 'entity_id'
    ),
    'IEF: it answers created, and the record holds the new organization beside the candidate, which is kept'
  );

-- =====================================================================
-- gone: a record whose grant or row is gone creates nothing
-- =====================================================================
DELETE FROM public.grants g
WHERE
  g.user_id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
  AND g.target_type = 'candidate';

SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$
      SELECT set_config(
        'ief.grant_gone',
        public.identity_entity_find_or_create(
          'cccccccc-cccc-cccc-cccc-0000000056a1',
          test_id('project_a'),
          'candidate',
          'Matti',
          'Virtanen'
        )::text,
        true
      )
    $$,
    'IEF: a call whose recorded candidate has lost its grant lives'
  );

SELECT
  reset_role ();

SELECT
  ok (
    NULLIF(current_setting('ief.grant_gone', true), '')::jsonb ->> 'result' = 'gone'
    AND NULLIF(current_setting('ief.grant_gone', true), '')::jsonb -> 'entity_id' = 'null'::jsonb,
    'IEF: with the grant deleted and the record kept, the call answers gone, with a null entity id'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.candidates c
      WHERE
        c.project_id = test_id ('project_a')
        AND c.first_name = 'Matti'
        AND c.last_name = 'Virtanen'
    ),
    1,
    'IEF: and creates no candidate'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        public.grants g
      WHERE
        g.user_id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
        AND g.target_type = 'candidate'
    ),
    0,
    'IEF: and writes no grant'
  );

SELECT
  ok (
    (
      SELECT
        u.raw_app_meta_data -> 'registered_entities'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
    ) = NULLIF(current_setting('ief.second_type', true), '')::jsonb -> 'registered_entities'
    AND NULLIF(current_setting('ief.grant_gone', true), '')::jsonb -> 'registered_entities' = NULLIF(current_setting('ief.second_type', true), '')::jsonb -> 'registered_entities',
    'IEF: and leaves the record, stored and answered, as it was'
  );

-- A user whose record names an organization of project A that is no row, and who holds the editor grant on that id: the grant is kept and the row is gone.
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
    'cccccccc-cccc-cccc-cccc-0000000056a3',
    '00000000-0000-0000-0000-000000000000',
    'identity_ief3@test.com',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    jsonb_build_object(
      'registered_entities',
      jsonb_build_object(
        test_id ('project_a')::text,
        jsonb_build_object(
          'organization',
          '56560000-0000-4000-8000-0000000000f1'
        )
      )
    ),
    now(),
    now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-0000000056a4',
    '00000000-0000-0000-0000-000000000000',
    'identity_ief4@test.com',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    jsonb_build_object(
      'registered_entities',
      jsonb_build_object(
        test_id ('project_a')::text,
        jsonb_build_object('candidate', 'not an id')
      )
    ),
    now(),
    now()
  );

INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-0000000056a3',
    'entity',
    'organization',
    '56560000-0000-4000-8000-0000000000f1',
    'editor'
  );

SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$
      SELECT set_config(
        'ief.row_gone',
        public.identity_entity_find_or_create(
          'cccccccc-cccc-cccc-cccc-0000000056a3',
          test_id('project_a'),
          'organization',
          'Liisa',
          'Laine'
        )::text,
        true
      )
    $$,
    'IEF: a call whose recorded organization is no row of the project lives'
  );

SELECT
  reset_role ();

SELECT
  ok (
    NULLIF(current_setting('ief.row_gone', true), '')::jsonb ->> 'result' = 'gone'
    AND NULLIF(current_setting('ief.row_gone', true), '')::jsonb -> 'entity_id' = 'null'::jsonb,
    'IEF: with the row gone and the grant kept, the call answers gone, with a null entity id'
  );

SELECT
  is (
    (
      SELECT
        string_agg(g.target_id::text, ',')
      FROM
        public.grants g
      WHERE
        g.user_id = 'cccccccc-cccc-cccc-cccc-0000000056a3'
    ),
    '56560000-0000-4000-8000-0000000000f1',
    'IEF: and creates nothing: the user holds the one grant it held, on no row'
  );

SELECT
  ok (
    (
      SELECT
        u.raw_app_meta_data -> 'registered_entities' -> test_id ('project_a')::text ->> 'organization'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a3'
    ) = '56560000-0000-4000-8000-0000000000f1'
    AND NULLIF(current_setting('ief.row_gone', true), '')::jsonb -> 'registered_entities' -> test_id ('project_a')::text ->> 'organization' = '56560000-0000-4000-8000-0000000000f1',
    'IEF: and leaves the record, stored and answered, as it was'
  );

-- =====================================================================
-- Privileges
-- =====================================================================
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
        AND p.proname = 'identity_entity_find_or_create'
    ),
    'p_user_id uuid, p_project_id uuid, p_entity_type entity_type, p_first_name text, p_last_name text -> jsonb true {"search_path=\"\""}',
    'IEF: the function has one signature, answers jsonb, and is SECURITY DEFINER with an empty pinned search_path'
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
        AND p.proname = 'identity_entity_find_or_create'
    ),
    'false/false/true',
    'IEF: service_role may execute it, and neither anon nor authenticated may'
  );

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create(
        'cccccccc-cccc-cccc-cccc-0000000056a5',
        test_id('project_a'),
        'candidate',
        'Matti',
        'Virtanen'
      )
    $$,
    '42501',
    NULL,
    'IEF: an authenticated caller is refused execution'
  );

SELECT
  set_test_user ('anon');

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create(
        'cccccccc-cccc-cccc-cccc-0000000056a5',
        test_id('project_a'),
        'candidate',
        'Matti',
        'Virtanen'
      )
    $$,
    '42501',
    NULL,
    'IEF: an anonymous caller is refused execution'
  );

SELECT
  reset_role ();

-- =====================================================================
-- Refusals: nothing is written
-- =====================================================================
SELECT
  set_config(
    'ief.writes_before',
    (
      SELECT
        count(*)
      FROM
        public.candidates
    )::text || '/' || (
      SELECT
        count(*)
      FROM
        public.organizations
    )::text || '/' || (
      SELECT
        count(*)
      FROM
        public.grants
    )::text || '/' || (
      SELECT
        md5(
          string_agg(
            u.id::text || ':' || COALESCE(u.raw_app_meta_data::text, ''),
            ','
            ORDER BY
              u.id
          )
        )
      FROM
        auth.users u
    ),
    true
  );

SET
  LOCAL ROLE service_role;

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create(NULL, test_id('project_a'), 'candidate', 'Matti', 'Virtanen')
    $$,
    '22023',
    'identity_entity_find_or_create: every argument is required',
    'IEF: a null user id is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a5', NULL, 'candidate', 'Matti', 'Virtanen')
    $$,
    '22023',
    'identity_entity_find_or_create: every argument is required',
    'IEF: a null project is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a5', test_id('project_a'), NULL, 'Matti', 'Virtanen')
    $$,
    '22023',
    'identity_entity_find_or_create: every argument is required',
    'IEF: a null entity type is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a5', test_id('project_a'), 'candidate', 'Matti', NULL)
    $$,
    '22023',
    'identity_entity_find_or_create: every argument is required',
    'IEF: a null name is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a1', test_id('project_a'), 'faction', 'Matti', 'Virtanen')
    $$,
    '22023',
    'identity_entity_find_or_create: the entity type must be candidate or organization',
    'IEF: the type faction is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a5', test_id('project_a'), 'candidate', 'Matti', 'Virtanen')
    $$,
    '22023',
    'identity_entity_find_or_create: p_user_id names no user',
    'IEF: a user id that names no user is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a4', test_id('project_a'), 'organization', 'Liisa', 'Laine')
    $$,
    '22000',
    'identity_entity_find_or_create: the registered-entities record is malformed',
    'IEF: a user whose record holds an entry that is not an id is refused, and the record is not overwritten'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        public.candidates
    )::text || '/' || (
      SELECT
        count(*)
      FROM
        public.organizations
    )::text || '/' || (
      SELECT
        count(*)
      FROM
        public.grants
    )::text || '/' || (
      SELECT
        md5(
          string_agg(
            u.id::text || ':' || COALESCE(u.raw_app_meta_data::text, ''),
            ','
            ORDER BY
              u.id
          )
        )
      FROM
        auth.users u
    ),
    current_setting('ief.writes_before', true),
    'IEF: the refused calls wrote no entity, no grant and no user''s metadata'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
