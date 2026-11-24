-- 56-identity-entity-find-or-create.test.sql: the entity an identity provider's user registers, found or created in one transaction
--
-- `identity_entity_find_or_create (p_user_id, p_project_id, p_entity_type, p_first_name, p_last_name, p_identity_metadata)` answers for the one user it is given; every argument is required and none has a default. It locks the user's row of auth.users, then reads the user's row of private.identity_registrations for the project and the type. With no registration it creates the registration, the entity (a confirmed candidate with the given names, or a nameless unconfirmed organization) and the user's editor grant on it, and answers `created`. A registration whose grant and row both exist answers `found` and creates nothing, so a second call makes no second entity; a registration whose grant or row is gone answers `gone` and creates nothing. Every answer is `{"result", "entity_id"}` and carries nothing else. On every answer it also writes the identity metadata it is given into the user's app metadata under the same lock, setting each key given a string and removing each key given a null; an empty object writes nothing. An account already bound to another `identity_match_value`, one that differs only by case included, is refused before anything is written. The service role alone may execute it, and a null argument, a type other than candidate and organization, a user id that names no user, app metadata that is not an object and identity metadata that is not an object of strings and nulls are refused with nothing written.
--
-- Every assertion's description begins with `IEF: `. The function is the service role's, so every call below is made as that role and its answer is kept in a transaction-local setting; the rows it wrote are read back by the fixture role.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, test_user_id, set_test_user, reset_role)
-- - 102-entities.sql (public.candidates, public.organizations)
-- - 300-auth-tables.sql (public.grants)
-- - 506-invitation-rpcs.sql (identity_entity_find_or_create, private.identity_registrations)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (55);

SELECT
  create_test_data ();

-- A user's registrations, in the shape the function answers them.
CREATE FUNCTION t56_registrations (p_user_id uuid) RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_object_agg(x.project_id::text, x.entries), '{}'::jsonb)
  FROM (
    SELECT r.project_id, jsonb_object_agg(r.entity_type::text, r.entity_id::text) AS entries
    FROM private.identity_registrations r
    WHERE r.user_id = p_user_id
    GROUP BY r.project_id
  ) x;
$$;

-- Two users an identity provider created: neither has a registration yet. The first holds the metadata members the auth service writes for every account.
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
-- A first sign-in as a candidate: the candidate, its grant and the registration
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
          'Virtanen',
          '{}'::jsonb
        )::text,
        true
      )
    $$,
    'IEF: the service role finds or creates the candidate of a user with no registration'
  );

SELECT
  reset_role ();

SELECT
  ok (
    NULLIF(current_setting('ief.candidate', true), '')::jsonb ->> 'result' = 'created'
    AND NULLIF(current_setting('ief.candidate', true), '')::jsonb ->> 'entity_id' IS NOT NULL,
    'IEF: a user with no registration is answered created, with the id of the entity'
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
        t56_registrations (u.id) -> test_id ('project_a')::text ->> 'candidate'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
    ) = NULLIF(current_setting('ief.candidate', true), '')::jsonb ->> 'entity_id',
    'IEF: the user''s registrations name the created candidate for the project'
  );

SELECT
  ok (
    (
      SELECT
        array_agg(
          k
          ORDER BY
            k
        )
      FROM
        jsonb_object_keys(
          NULLIF(current_setting('ief.candidate', true), '')::jsonb
        ) k
    ) = ARRAY['entity_id', 'result'],
    'IEF: the answer carries the result and the entity id and nothing else'
  );

-- =====================================================================
-- A first sign-in as an organization: a nameless, unconfirmed organization, its grant and the registration
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
          'Laine',
          '{}'::jsonb
        )::text,
        true
      )
    $$,
    'IEF: the service role finds or creates the organization of a user with no registration'
  );

SELECT
  reset_role ();

SELECT
  ok (
    NULLIF(current_setting('ief.organization', true), '')::jsonb ->> 'result' = 'created'
    AND NULLIF(current_setting('ief.organization', true), '')::jsonb ->> 'entity_id' IS NOT NULL,
    'IEF: a user with no organization registration is answered created, with the id of the entity'
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
        t56_registrations (u.id) -> test_id ('project_a')::text ->> 'organization'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a2'
    ) = NULLIF(current_setting('ief.organization', true), '')::jsonb ->> 'entity_id',
    'IEF: the user''s registrations name the created organization for the project'
  );

SELECT
  ok (
    (
      SELECT
        array_agg(
          k
          ORDER BY
            k
        )
      FROM
        jsonb_object_keys(
          NULLIF(current_setting('ief.organization', true), '')::jsonb
        ) k
    ) = ARRAY['entity_id', 'result'],
    'IEF: the organization''s answer carries the result and the entity id and nothing else'
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
          'Virtanen',
          '{}'::jsonb
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
        t56_registrations (u.id)
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
    ) = jsonb_build_object(
      test_id ('project_a')::text,
      jsonb_build_object(
        'candidate',
        NULLIF(current_setting('ief.candidate', true), '')::jsonb ->> 'entity_id'
      )
    ),
    'IEF: and the stored registrations are the one the first call wrote'
  );

SELECT
  is (
    (
      SELECT
        u.raw_app_meta_data
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
    ),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    'IEF: calls with empty identity metadata leave the user''s app metadata as it was: the registration is not kept there'
  );

-- =====================================================================
-- The lock
-- =====================================================================
-- The calls for this user wrote nothing to its row of auth.users, so the row the fixture inserted is the one they locked: a row lock leaves the locking transaction in the row's xmax.
SELECT
  ok (
    (
      SELECT
        u.xmax::text <> '0'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
    ),
    'IEF: after a call, the user''s row of auth.users carries this transaction''s row lock'
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
          'identity-entity:' || 'cccccccc-cccc-cccc-cccc-0000000056a1'
        )::bigint
    ),
    'IEF: and the call takes no advisory lock keyed on the user'
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
          'Virtanen',
          '{}'::jsonb
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
        t56_registrations (u.id) -> test_id ('project_a')::text
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
    'IEF: it answers created, and the registrations hold the new organization beside the candidate, which is kept'
  );

-- =====================================================================
-- gone: a registration whose grant or row is gone creates nothing
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
          'Virtanen',
          '{}'::jsonb
        )::text,
        true
      )
    $$,
    'IEF: a call whose registered candidate has lost its grant lives'
  );

SELECT
  reset_role ();

SELECT
  ok (
    NULLIF(current_setting('ief.grant_gone', true), '')::jsonb ->> 'result' = 'gone'
    AND NULLIF(current_setting('ief.grant_gone', true), '')::jsonb -> 'entity_id' = 'null'::jsonb,
    'IEF: with the grant deleted and the registration kept, the call answers gone, with a null entity id'
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
        t56_registrations (u.id)
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a1'
    ) = jsonb_build_object(
      test_id ('project_a')::text,
      jsonb_build_object(
        'candidate',
        NULLIF(current_setting('ief.candidate', true), '')::jsonb ->> 'entity_id',
        'organization',
        NULLIF(current_setting('ief.second_type', true), '')::jsonb ->> 'entity_id'
      )
    ),
    'IEF: and leaves the stored registrations as they were'
  );

-- A user whose registration names an organization of project A that is no row, and who holds the editor grant on that id: the grant is kept and the row is gone. And a user whose stored app metadata is not an object.
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
    '{}'::jsonb,
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
    '["not", "an", "object"]'::jsonb,
    now(),
    now()
  );

INSERT INTO
  private.identity_registrations (user_id, project_id, entity_type, entity_id)
VALUES
  (
    'cccccccc-cccc-cccc-cccc-0000000056a3',
    test_id ('project_a'),
    'organization',
    '56560000-0000-4000-8000-0000000000f1'
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
          'Laine',
          '{}'::jsonb
        )::text,
        true
      )
    $$,
    'IEF: a call whose registered organization is no row of the project lives'
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
        t56_registrations (u.id) -> test_id ('project_a')::text ->> 'organization'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a3'
    ) = '56560000-0000-4000-8000-0000000000f1',
    'IEF: and leaves the stored registrations as they were'
  );

-- =====================================================================
-- The identity metadata: written by the call, under the lock, on every answer
-- =====================================================================
-- A user the auth service made, whose metadata holds its own two members and the two claim keys the identity metadata removes.
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
    'cccccccc-cccc-cccc-cccc-0000000056a6',
    '00000000-0000-0000-0000-000000000000',
    'identity_ief6@test.com',
    '',
    'authenticated',
    'authenticated',
    now(),
    '{}'::jsonb,
    '{"provider": "email", "providers": ["email"], "hetu": "removed-claim", "birthdate": "removed-claim"}'::jsonb,
    now(),
    now()
  );

SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$
      SELECT set_config(
        'ief.metadata_candidate',
        public.identity_entity_find_or_create(
          'cccccccc-cccc-cccc-cccc-0000000056a6',
          test_id('project_a'),
          'candidate',
          'Maija',
          'Mäkinen',
          '{"identity_provider": "idura-ftn", "identity_match_prop": "sub", "identity_match_value": "ief-match-6", "hetu": null, "birthdate": null}'::jsonb
        )::text,
        true
      )
    $$,
    'IEF: a first sign-in that hands the identity metadata to the call lives'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        u.raw_app_meta_data
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a6'
    ),
    '{"provider": "email", "providers": ["email"], "identity_provider": "idura-ftn", "identity_match_prop": "sub", "identity_match_value": "ief-match-6"}'::jsonb,
    'IEF: the call sets each identity key given a string, removes each given null, and keeps the members of the user''s metadata it is not given'
  );

SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$
      SELECT set_config(
        'ief.metadata_organization',
        public.identity_entity_find_or_create(
          'cccccccc-cccc-cccc-cccc-0000000056a6',
          test_id('project_a'),
          'organization',
          'Maija',
          'Mäkinen',
          '{"identity_provider": "idura-ftn", "identity_match_prop": "sub", "identity_match_value": "ief-match-6", "hetu": null, "birthdate": null}'::jsonb
        )::text,
        true
      )
    $$,
    'IEF: a first sign-in of the same user for another type, with the identity metadata, lives'
  );

SELECT
  reset_role ();

SELECT
  ok (
    NULLIF(
      current_setting('ief.metadata_organization', true),
      ''
    )::jsonb ->> 'result' = 'created'
    AND (
      SELECT
        u.raw_app_meta_data
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a6'
    ) = jsonb_build_object(
      'provider',
      'email',
      'providers',
      '["email"]'::jsonb,
      'identity_provider',
      'idura-ftn',
      'identity_match_prop',
      'sub',
      'identity_match_value',
      'ief-match-6'
    )
    AND t56_registrations ('cccccccc-cccc-cccc-cccc-0000000056a6') = jsonb_build_object(
      test_id ('project_a')::text,
      jsonb_build_object(
        'candidate',
        NULLIF(
          current_setting('ief.metadata_candidate', true),
          ''
        )::jsonb ->> 'entity_id',
        'organization',
        NULLIF(
          current_setting('ief.metadata_organization', true),
          ''
        )::jsonb ->> 'entity_id'
      )
    ),
    'IEF: the second pair''s call keeps the first pair''s registration and the identity keys: the user holds both registrations, and the metadata holds the identity keys and the auth service''s members and nothing else'
  );

SET
  LOCAL ROLE service_role;

SELECT
  lives_ok (
    $$
      SELECT set_config(
        'ief.metadata_found',
        public.identity_entity_find_or_create(
          'cccccccc-cccc-cccc-cccc-0000000056a6',
          test_id('project_a'),
          'candidate',
          'Maija',
          'Mäkinen',
          '{"identity_provider": "signicat-ftn", "identity_match_prop": "sub", "identity_match_value": "ief-match-6", "hetu": null, "birthdate": null}'::jsonb
        )::text,
        true
      )
    $$,
    'IEF: a later sign-in of the same user and type, with the identity metadata, lives'
  );

SELECT
  reset_role ();

SELECT
  ok (
    NULLIF(current_setting('ief.metadata_found', true), '')::jsonb ->> 'result' = 'found'
    AND (
      SELECT
        u.raw_app_meta_data ->> 'identity_provider'
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a6'
    ) = 'signicat-ftn'
    AND (
      SELECT
        t56_registrations (u.id)
      FROM
        auth.users u
      WHERE
        u.id = 'cccccccc-cccc-cccc-cccc-0000000056a6'
    ) = jsonb_build_object(
      test_id ('project_a')::text,
      jsonb_build_object(
        'candidate',
        NULLIF(
          current_setting('ief.metadata_candidate', true),
          ''
        )::jsonb ->> 'entity_id',
        'organization',
        NULLIF(
          current_setting('ief.metadata_organization', true),
          ''
        )::jsonb ->> 'entity_id'
      )
    ),
    'IEF: a call answered found writes the identity metadata too, and leaves the registrations as they were'
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
    'p_user_id uuid, p_project_id uuid, p_entity_type entity_type, p_first_name text, p_last_name text, p_identity_metadata jsonb -> jsonb true {"search_path=\"\""}',
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
        'Virtanen',
        '{}'::jsonb
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
        'Virtanen',
        '{}'::jsonb
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
    ) || '/' || (
      SELECT
        count(*)
      FROM
        private.identity_registrations
    )::text,
    true
  );

SET
  LOCAL ROLE service_role;

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create(NULL, test_id('project_a'), 'candidate', 'Matti', 'Virtanen', '{}'::jsonb)
    $$,
    '22023',
    'identity_entity_find_or_create: every argument is required',
    'IEF: a null user id is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a5', NULL, 'candidate', 'Matti', 'Virtanen', '{}'::jsonb)
    $$,
    '22023',
    'identity_entity_find_or_create: every argument is required',
    'IEF: a null project is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a5', test_id('project_a'), NULL, 'Matti', 'Virtanen', '{}'::jsonb)
    $$,
    '22023',
    'identity_entity_find_or_create: every argument is required',
    'IEF: a null entity type is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a5', test_id('project_a'), 'candidate', 'Matti', NULL, '{}'::jsonb)
    $$,
    '22023',
    'identity_entity_find_or_create: every argument is required',
    'IEF: a null name is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a1', test_id('project_a'), 'faction', 'Matti', 'Virtanen', '{}'::jsonb)
    $$,
    '22023',
    'identity_entity_find_or_create: the entity type must be candidate or organization',
    'IEF: the type faction is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a5', test_id('project_a'), 'candidate', 'Matti', 'Virtanen', '{}'::jsonb)
    $$,
    '22023',
    'identity_entity_find_or_create: p_user_id names no user',
    'IEF: a user id that names no user is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a4', test_id('project_a'), 'organization', 'Liisa', 'Laine', '{}'::jsonb)
    $$,
    '22000',
    'identity_entity_find_or_create: the account''s app metadata is malformed',
    'IEF: a user whose stored app metadata is not an object is refused, and the metadata is not overwritten'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a6', test_id('project_b'), 'candidate', 'Maija', 'Mäkinen', '{"identity_provider": "idura-ftn", "identity_match_prop": "sub", "identity_match_value": "IEF-Match-6", "hetu": null, "birthdate": null}'::jsonb)
    $$,
    '42501',
    'identity_entity_find_or_create: the account is bound to another identity',
    'IEF: a second identity whose match value differs from the account''s stored one only by case is refused, before its metadata is written or an entity resolved'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a1', test_id('project_a'), 'candidate', 'Matti', 'Virtanen', NULL)
    $$,
    '22023',
    'identity_entity_find_or_create: every argument is required',
    'IEF: a null identity metadata is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a1', test_id('project_b'), 'candidate', 'Matti', 'Virtanen', '{"registered_entities": {}}'::jsonb)
    $$,
    '22023',
    'identity_entity_find_or_create: p_identity_metadata must be an object of strings and nulls',
    'IEF: identity metadata holding an object, such as a record of registrations, is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a1', test_id('project_b'), 'candidate', 'Matti', 'Virtanen', '["identity_provider"]'::jsonb)
    $$,
    '22023',
    'identity_entity_find_or_create: p_identity_metadata must be an object of strings and nulls',
    'IEF: identity metadata that is not an object is refused'
  );

SELECT
  throws_ok (
    $$
      SELECT public.identity_entity_find_or_create('cccccccc-cccc-cccc-cccc-0000000056a1', test_id('project_b'), 'candidate', 'Matti', 'Virtanen', '{"identity_provider": {"nested": true}}'::jsonb)
    $$,
    '22023',
    'identity_entity_find_or_create: p_identity_metadata must be an object of strings and nulls',
    'IEF: identity metadata holding a value that is neither a string nor a null is refused'
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
    ) || '/' || (
      SELECT
        count(*)
      FROM
        private.identity_registrations
    )::text,
    current_setting('ief.writes_before', true),
    'IEF: the refused calls wrote no entity, no grant, no registration and no user''s metadata'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
