-- 38-get-public-app-settings.test.sql: what get_public_app_settings answers, to whom, and what it never returns
--
-- WHAT IS PINNED. The function is an anon-executable SECURITY DEFINER endpoint that reads public.app_settings past row-level security, so this file pins its whole surface: the two EXECUTE rights the frontend adapter depends on, the definer shape with an empty search_path, that no API role can execute the validity helper it asks, the four stored values, each returned as stored when its shape is one the frontend accepts, the exact key set at every level of its answer, the one all-null answer it gives when there is nothing to tell, that a value of a shape the frontend refuses is answered without its content, and that the table itself stays unreadable to anon while the function answers.
--
-- WHY EVERY ASSERTION BELOW IS NON-VACUOUS. The closed project B's row is written here with two more `access` gates, a `contestantApp.questions` member, an `analytics.platform` member and an unrelated root beside the four values, so each key-set assertion has something to leak and fails if the function copies a member it must not. The stored served entity types are out of canonical order and a list of modes carries a repeat, so an answer equal to them proves the values are returned as stored and not normalised. The zero count of app_settings rows is measured on the same row the function has just answered from, so the row exists and only the policy hides it. The three all-null answers are compared with one literal after the function has returned non-null values for the same project, so the literal is not what every call returns.
--
-- Depends on: 00-helpers.test.sql (create_test_data, test_id, set_test_user, reset_role, test_seed_fixture_grants); schema/106-app-settings.sql (get_public_app_settings, its explicit GRANT and private.contestant_app_served_entity_types_valid).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (30);

SELECT
  create_test_data ();

SELECT
  test_seed_fixture_grants ();

-- The closed project B declares all four values and, beside them, members the function must never return.
UPDATE app_settings
SET
  settings = '{
    "theme": "dark",
    "matching": {"organizationMatching": "impute"},
    "access": {"contestantApp": false, "voterApp": true, "underMaintenance": true, "contestantEditing": "locked"},
    "contestantApp": {
      "servedEntityTypes": {"organization": {"registrationModes": []}, "candidate": {"registrationModes": ["code", "email", "code"]}},
      "questions": {"hideHero": true}
    },
    "analytics": {"trackEvents": true, "platform": {"name": "legacy", "code": "x"}}
  }'::jsonb
WHERE
  project_id = test_id ('project_b');

-- The open project A declares different values, so an answer for A cannot be B's.
UPDATE app_settings
SET
  settings = '{
    "theme": "light",
    "access": {"contestantApp": true},
    "contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"]}}},
    "analytics": {"trackEvents": false}
  }'::jsonb
WHERE
  project_id = test_id ('project_a');

-- =====================================================================
-- Section 1: the EXECUTE rights and the definer shape
-- =====================================================================
-- The adapter calls the function over PostgREST when it reads zero app_settings rows of a closed project, as anon on the sign-in screen and as authenticated for a signed-in caller holding no grant there. A missing EXECUTE right would turn that branch into a permission error.
SELECT
  ok (
    has_function_privilege(
      'anon',
      'public.get_public_app_settings(uuid)',
      'EXECUTE'
    ),
    'anon can EXECUTE get_public_app_settings'
  );

SELECT
  ok (
    has_function_privilege(
      'authenticated',
      'public.get_public_app_settings(uuid)',
      'EXECUTE'
    ),
    'authenticated can EXECUTE get_public_app_settings'
  );

SELECT
  is (
    (
      SELECT
        p.prosecdef
      FROM
        pg_proc p
      WHERE
        p.oid = 'public.get_public_app_settings(uuid)'::regprocedure
    ),
    true,
    'get_public_app_settings is SECURITY DEFINER'
  );

SELECT
  is (
    (
      SELECT
        p.proconfig
      FROM
        pg_proc p
      WHERE
        p.oid = 'public.get_public_app_settings(uuid)'::regprocedure
    ),
    ARRAY['search_path=""'],
    'get_public_app_settings runs with an empty search_path and no other setting'
  );

-- The validity helper the function asks runs as its caller and is reached only through definer functions, so no API role holds EXECUTE on it.
SELECT
  is (
    (
      SELECT
        string_agg(
          r.rolname || ' ' || has_function_privilege(
            r.rolname,
            'private.contestant_app_served_entity_types_valid(jsonb)',
            'EXECUTE'
          )::text,
          ', '
          ORDER BY
            r.rolname
        )
      FROM
        pg_roles r
      WHERE
        r.rolname IN ('anon', 'authenticated', 'service_role')
    ),
    'anon false, authenticated false, service_role false',
    'no API role can EXECUTE private.contestant_app_served_entity_types_valid'
  );

-- The one parse of `access.contestantEditing` runs as its caller and is reached only through definer functions, so no API role holds EXECUTE on it.
SELECT
  is (
    (
      SELECT
        string_agg(
          r.rolname || ' ' || has_function_privilege(
            r.rolname,
            'private.contestant_editing_in(jsonb)',
            'EXECUTE'
          )::text,
          ', '
          ORDER BY
            r.rolname
        )
      FROM
        pg_roles r
      WHERE
        r.rolname IN ('anon', 'authenticated', 'service_role')
    ),
    'anon false, authenticated false, service_role false',
    'no API role can EXECUTE private.contestant_editing_in'
  );

-- It answers the stored word when it is one of the three, and NULL for every other value.
SELECT
  is (
    (
      SELECT
        string_agg(
          COALESCE(private.contestant_editing_in (v.settings), '-'),
          ' '
          ORDER BY
            v.n
        )
      FROM
        (
          VALUES
            (
              1,
              '{"access": {"contestantEditing": "open"}}'::jsonb
            ),
            (
              2,
              '{"access": {"contestantEditing": "nominationsLocked"}}'::jsonb
            ),
            (
              3,
              '{"access": {"contestantEditing": "locked"}}'::jsonb
            ),
            (
              4,
              '{"access": {"contestantEditing": "Locked"}}'::jsonb
            ),
            (
              5,
              '{"access": {"contestantEditing": true}}'::jsonb
            ),
            (
              6,
              '{"access": {"contestantEditing": null}}'::jsonb
            ),
            (7, '{"access": "locked"}'::jsonb),
            (8, '{}'::jsonb),
            (9, NULL::jsonb)
        ) AS v (n, settings)
    ),
    'open nominationsLocked locked - - - - - -',
    'private.contestant_editing_in answers the three words as stored and NULL for any other value'
  );

-- =====================================================================
-- Section 2: what anon is told about the closed project B
-- =====================================================================
SELECT
  set_test_user ('anon');

SELECT
  is (
    get_public_app_settings (test_id ('project_b')) #> '{access,contestantApp}',
    'false'::jsonb,
    'anon reads the stored access.contestantApp of the closed project B'
  );

SELECT
  is (
    get_public_app_settings (test_id ('project_b')) #> '{contestantApp,servedEntityTypes}',
    '{"organization": {"registrationModes": []}, "candidate": {"registrationModes": ["code", "email", "code"]}}'::jsonb,
    'anon reads the served entity types of the closed project B and their registration modes exactly as stored, repeat and order included'
  );

SELECT
  is (
    get_public_app_settings (test_id ('project_b')) #> '{access,contestantEditing}',
    '"locked"'::jsonb,
    'LOCK: anon reads the stored access.contestantEditing of the closed project B, a stored "locked" as "locked"'
  );

SELECT
  is (
    get_public_app_settings (test_id ('project_b')) #> '{analytics,trackEvents}',
    'true'::jsonb,
    'anon reads the stored analytics.trackEvents of the closed project B, a stored true as true'
  );

-- The row holds `theme`, `matching`, the `access` gates `voterApp` and `underMaintenance`, `contestantApp.questions` and `analytics.platform`; none of them is a key of the answer.
SELECT
  is (
    (
      SELECT
        array_agg(
          k
          ORDER BY
            k
        )
      FROM
        jsonb_object_keys(get_public_app_settings (test_id ('project_b'))) k
    ),
    ARRAY['access', 'analytics', 'contestantApp'],
    'the answer has exactly the top-level keys access, analytics and contestantApp, so no unrelated root is reachable'
  );

SELECT
  is (
    (
      SELECT
        array_agg(
          k
          ORDER BY
            k
        )
      FROM
        jsonb_object_keys(
          get_public_app_settings (test_id ('project_b')) -> 'access'
        ) k
    ),
    ARRAY['contestantApp', 'contestantEditing'],
    'LOCK: the access member has exactly the keys contestantApp and contestantEditing, so no other stored gate is reachable'
  );

SELECT
  is (
    (
      SELECT
        array_agg(
          k
          ORDER BY
            k
        )
      FROM
        jsonb_object_keys(
          get_public_app_settings (test_id ('project_b')) -> 'contestantApp'
        ) k
    ),
    ARRAY['servedEntityTypes'],
    'the contestantApp member has exactly the key servedEntityTypes, so the stored questions member is not reachable'
  );

SELECT
  is (
    (
      SELECT
        array_agg(
          k
          ORDER BY
            k
        )
      FROM
        jsonb_object_keys(
          get_public_app_settings (test_id ('project_b')) -> 'analytics'
        ) k
    ),
    ARRAY['trackEvents'],
    'the analytics member has exactly the key trackEvents, so the stored platform member is not reachable'
  );

-- The policy on the table is not widened: the row the function has just answered from stays invisible to anon.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        app_settings
      WHERE
        project_id = test_id ('project_b')
    )::integer,
    0,
    'anon still reads no app_settings row of the closed project B while the function answers for it'
  );

-- =====================================================================
-- Section 3: the open project A
-- =====================================================================
SELECT
  is (
    get_public_app_settings (test_id ('project_a')),
    '{"access": {"contestantApp": true, "contestantEditing": null}, "analytics": {"trackEvents": false}, "contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"]}}}}'::jsonb,
    'anon reads the four values of the open project A, and they are A''s own and not B''s'
  );

-- Project A stores no `access.contestantEditing`. The member is still there, holding a JSON null.
SELECT
  is (
    get_public_app_settings (test_id ('project_a')) #> '{access,contestantEditing}',
    'null'::jsonb,
    'LOCK: a project that stores no access.contestantEditing is answered a JSON null there, as for the other three values'
  );

-- =====================================================================
-- Section 4: a signed-in caller with no grants
-- =====================================================================
-- Such a caller reads no app_settings row of the closed project B (30-closed-project.test.sql) and takes the same branch of the adapter as anon, so the answer has to be the one anon gets.
SELECT
  reset_role ();

SELECT
  set_test_user (
    'authenticated',
    'cccccccc-cccc-cccc-cccc-0000000000e1',
    '[]'::jsonb
  );

SELECT
  is (
    get_public_app_settings (test_id ('project_b')),
    '{"access": {"contestantApp": false, "contestantEditing": "locked"}, "analytics": {"trackEvents": true}, "contestantApp": {"servedEntityTypes": {"organization": {"registrationModes": []}, "candidate": {"registrationModes": ["code", "email", "code"]}}}}'::jsonb,
    'a signed-in caller with no grants gets, for the closed project B, the answer anon gets'
  );

-- =====================================================================
-- Section 5: a value the stored-settings schema refuses is answered without its content
-- =====================================================================
-- Nothing validates the column on write, so a stored value may hold anything. The frontend's parse refuses a value of the wrong shape, and for the served entity types an empty object, a key other than `candidate` and `organization`, an entry other than an object holding `registrationModes` alone, and a list of modes that is not a list of registration modes; and it drops the whole `contestantApp` member, valid served entity types with it, when that member holds a key other than `questions` and `servedEntityTypes`. Such a value is answered as the JSON string "invalid", which that parse refuses in the same way, and none of what is stored under it leaves the database. Every stored value below carries a marker beginning `leak-`, which no answer may hold, except where the refused value is empty.
SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{
    "access": {"contestantApp": {"leak-1": true}, "contestantEditing": "leak-2"},
    "contestantApp": {
      "servedEntityTypes": {"candidate": {"registrationModes": ["email"]}, "alliance": {"registrationModes": ["leak-4"]}}
    },
    "analytics": {"trackEvents": ["leak-5"]}
  }'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    get_public_app_settings (test_id ('project_b')),
    '{"access": {"contestantApp": "invalid", "contestantEditing": "invalid"}, "analytics": {"trackEvents": "invalid"}, "contestantApp": {"servedEntityTypes": "invalid"}}'::jsonb,
    'a value of the wrong shape and served entity types with a key other than the two are each answered "invalid", and nothing stored under them'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email", "leak-7"]}}}}'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    get_public_app_settings (test_id ('project_b')) -> 'contestantApp',
    '{"servedEntityTypes": "invalid"}'::jsonb,
    'served entity types whose list of modes names a string outside the vocabulary are answered "invalid"'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{"contestantApp": {"servedEntityTypes": {}}}'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    get_public_app_settings (test_id ('project_b')) -> 'contestantApp',
    '{"servedEntityTypes": "invalid"}'::jsonb,
    'served entity types stored as an empty object serve no type and are answered "invalid"'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"]}, "organization": ["leak-8"]}}}'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    get_public_app_settings (test_id ('project_b')) -> 'contestantApp',
    '{"servedEntityTypes": "invalid"}'::jsonb,
    'served entity types with an entry that is not an object are answered "invalid"'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"], "leak-9": true}}}}'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    get_public_app_settings (test_id ('project_b')) -> 'contestantApp',
    '{"servedEntityTypes": "invalid"}'::jsonb,
    'served entity types with an entry holding a key beside registrationModes are answered "invalid"'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": "leak-10"}, "organization": {}}}}'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    get_public_app_settings (test_id ('project_b')) -> 'contestantApp',
    '{"servedEntityTypes": "invalid"}'::jsonb,
    'served entity types whose modes are not a list, or whose entry holds no modes, are answered "invalid"'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{"contestantApp": {"entityTypes": ["leak-11"], "servedEntityTypes": {"candidate": {"registrationModes": ["email"]}}}}'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    get_public_app_settings (test_id ('project_b')) -> 'contestantApp',
    '{"servedEntityTypes": "invalid"}'::jsonb,
    'valid served entity types beside a contestantApp member the schema does not know are answered "invalid"'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{"access": {"contestantApp": null}, "contestantApp": {"servedEntityTypes": {"organization": {"registrationModes": ["code", "code"]}}}}'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    get_public_app_settings (test_id ('project_b')),
    '{"access": {"contestantApp": null, "contestantEditing": null}, "analytics": {"trackEvents": null}, "contestantApp": {"servedEntityTypes": {"organization": {"registrationModes": ["code", "code"]}}}}'::jsonb,
    'a stored JSON null and served entity types holding one type of the vocabulary are answered as stored'
  );

-- =====================================================================
-- Section 6: one all-null answer when there is nothing to tell
-- =====================================================================
-- A project that declares none of the four values, a project with no settings row and an id that names no project answer the same object, so the function is no existence oracle.
SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{"theme": "dark"}'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    get_public_app_settings (test_id ('project_b')),
    '{"access": {"contestantApp": null, "contestantEditing": null}, "analytics": {"trackEvents": null}, "contestantApp": {"servedEntityTypes": null}}'::jsonb,
    'a project that declares none of the four values answers the all-null object'
  );

SELECT
  reset_role ();

DELETE FROM app_settings
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    get_public_app_settings (test_id ('project_b')),
    '{"access": {"contestantApp": null, "contestantEditing": null}, "analytics": {"trackEvents": null}, "contestantApp": {"servedEntityTypes": null}}'::jsonb,
    'a project with no settings row answers the same all-null object'
  );

SELECT
  is (
    get_public_app_settings ('0badc0de-0000-4000-8000-000000000038'::uuid),
    '{"access": {"contestantApp": null, "contestantEditing": null}, "analytics": {"trackEvents": null}, "contestantApp": {"servedEntityTypes": null}}'::jsonb,
    'an id that names no project answers the same all-null object as a project with no settings row'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
