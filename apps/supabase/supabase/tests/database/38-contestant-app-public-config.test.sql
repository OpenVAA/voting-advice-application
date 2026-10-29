-- 38-contestant-app-public-config.test.sql: what contestant_app_public_config answers, to whom, and what it never returns
--
-- WHAT IS PINNED. The function is an anon-executable SECURITY DEFINER endpoint that reads public.app_settings past row-level security, so this file pins its whole surface: the two EXECUTE rights the frontend adapter depends on, the definer shape with an empty search_path, the five stored values, each returned as stored when its shape is one the frontend accepts, the exact key set at every level of its answer, the one all-null answer it gives when there is nothing to tell, that a value of a shape the frontend refuses is answered without its content, and that the table itself stays unreadable to anon while the function answers.
--
-- WHY EVERY ASSERTION BELOW IS NON-VACUOUS. The closed project B's row is written here with two more `access` gates, a `contestantApp.questions` member, an `analytics.platform` member and an unrelated root beside the five values, so each key-set assertion has something to leak and fails if the function copies a member it must not. The stored lists carry a repeat and are out of canonical order, so an answer equal to them proves the values are returned as stored and not normalised. The zero count of app_settings rows is measured on the same row the function has just answered from, so the row exists and only the policy hides it. The three all-null answers are compared with one literal after the function has returned non-null values for the same project, so the literal is not what every call returns.
--
-- Depends on: 00-helpers.test.sql (create_test_data, test_id, set_test_user, reset_role, test_seed_fixture_grants); schema/106-app-settings.sql (contestant_app_public_config and its explicit GRANT).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (24);

SELECT
  create_test_data ();

SELECT
  test_seed_fixture_grants ();

-- The closed project B declares all five values and, beside them, members the function must never return.
UPDATE app_settings
SET
  settings = '{
    "theme": "dark",
    "matching": {"organizationMatching": "impute"},
    "access": {"contestantApp": false, "voterApp": true, "underMaintenance": true, "answersLocked": true},
    "contestantApp": {
      "entityTypes": ["organization", "candidate", "candidate"],
      "registrationModes": {"candidate": ["code", "email", "code"], "organization": []},
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
    "contestantApp": {"entityTypes": ["candidate"], "registrationModes": {"candidate": ["email"]}},
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
      'public.contestant_app_public_config(uuid)',
      'EXECUTE'
    ),
    'anon can EXECUTE contestant_app_public_config'
  );

SELECT
  ok (
    has_function_privilege(
      'authenticated',
      'public.contestant_app_public_config(uuid)',
      'EXECUTE'
    ),
    'authenticated can EXECUTE contestant_app_public_config'
  );

SELECT
  is (
    (
      SELECT
        p.prosecdef
      FROM
        pg_proc p
      WHERE
        p.oid = 'public.contestant_app_public_config(uuid)'::regprocedure
    ),
    true,
    'contestant_app_public_config is SECURITY DEFINER'
  );

SELECT
  is (
    (
      SELECT
        p.proconfig
      FROM
        pg_proc p
      WHERE
        p.oid = 'public.contestant_app_public_config(uuid)'::regprocedure
    ),
    ARRAY['search_path=""'],
    'contestant_app_public_config runs with an empty search_path and no other setting'
  );

-- =====================================================================
-- Section 2: what anon is told about the closed project B
-- =====================================================================
SELECT
  set_test_user ('anon');

SELECT
  is (
    contestant_app_public_config (test_id ('project_b')) #> '{access,contestantApp}',
    'false'::jsonb,
    'anon reads the stored access.contestantApp of the closed project B'
  );

SELECT
  is (
    contestant_app_public_config (test_id ('project_b')) #> '{contestantApp,entityTypes}',
    '["organization", "candidate", "candidate"]'::jsonb,
    'anon reads the served entity types of the closed project B exactly as stored, repeat and order included'
  );

SELECT
  is (
    contestant_app_public_config (test_id ('project_b')) #> '{contestantApp,registrationModes}',
    '{"candidate": ["code", "email", "code"], "organization": []}'::jsonb,
    'anon reads the registration matrix of the closed project B exactly as stored, repeat and order included'
  );

SELECT
  is (
    contestant_app_public_config (test_id ('project_b')) #> '{access,answersLocked}',
    'true'::jsonb,
    'LOCK: anon reads the stored access.answersLocked of the closed project B, a stored true as true'
  );

SELECT
  is (
    contestant_app_public_config (test_id ('project_b')) #> '{analytics,trackEvents}',
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
        jsonb_object_keys(
          contestant_app_public_config (test_id ('project_b'))
        ) k
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
          contestant_app_public_config (test_id ('project_b')) -> 'access'
        ) k
    ),
    ARRAY['answersLocked', 'contestantApp'],
    'LOCK: the access member has exactly the keys answersLocked and contestantApp, so no other stored gate is reachable'
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
          contestant_app_public_config (test_id ('project_b')) -> 'contestantApp'
        ) k
    ),
    ARRAY['entityTypes', 'registrationModes'],
    'the contestantApp member has exactly the keys entityTypes and registrationModes, so the stored questions member is not reachable'
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
          contestant_app_public_config (test_id ('project_b')) -> 'analytics'
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
    contestant_app_public_config (test_id ('project_a')),
    '{"access": {"contestantApp": true, "answersLocked": null}, "analytics": {"trackEvents": false}, "contestantApp": {"entityTypes": ["candidate"], "registrationModes": {"candidate": ["email"]}}}'::jsonb,
    'anon reads the five values of the open project A, and they are A''s own and not B''s'
  );

-- Project A stores no `access.answersLocked`. The member is still there, holding a JSON null.
SELECT
  is (
    contestant_app_public_config (test_id ('project_a')) #> '{access,answersLocked}',
    'null'::jsonb,
    'LOCK: a project that stores no access.answersLocked is answered a JSON null there, as for the other four values'
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
    contestant_app_public_config (test_id ('project_b')),
    '{"access": {"contestantApp": false, "answersLocked": true}, "analytics": {"trackEvents": true}, "contestantApp": {"entityTypes": ["organization", "candidate", "candidate"], "registrationModes": {"candidate": ["code", "email", "code"], "organization": []}}}'::jsonb,
    'a signed-in caller with no grants gets, for the closed project B, the answer anon gets'
  );

-- =====================================================================
-- Section 5: a value the stored-settings schema refuses is answered without its content
-- =====================================================================
-- Nothing validates the column on write, so a stored value may hold anything. The frontend's parse refuses a value of the wrong shape, an unknown entity type or registration mode, and a matrix row other than `candidate` and `organization`. Such a value is answered as the JSON string "invalid", which that parse refuses in the same way, and none of what is stored under it leaves the database. Every stored value below carries a marker beginning `leak-`, which no answer may hold.
SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{
    "access": {"contestantApp": {"leak-1": true}, "answersLocked": "leak-2"},
    "contestantApp": {
      "entityTypes": ["candidate", {"leak-3": "x"}],
      "registrationModes": {"candidate": ["email"], "alliance": ["leak-4"]}
    },
    "analytics": {"trackEvents": ["leak-5"]}
  }'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    contestant_app_public_config (test_id ('project_b')),
    '{"access": {"contestantApp": "invalid", "answersLocked": "invalid"}, "analytics": {"trackEvents": "invalid"}, "contestantApp": {"entityTypes": "invalid", "registrationModes": "invalid"}}'::jsonb,
    'a value of the wrong shape, a list holding an object and a matrix with a row other than the two are each answered "invalid", and nothing stored under them'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{"contestantApp": {"entityTypes": ["candidate", "leak-6"], "registrationModes": {"candidate": ["email", "leak-7"]}}}'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    contestant_app_public_config (test_id ('project_b')) -> 'contestantApp',
    '{"entityTypes": "invalid", "registrationModes": "invalid"}'::jsonb,
    'a list naming a string outside the vocabulary, and a matrix whose row does, are answered "invalid"'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{"contestantApp": {"entityTypes": [], "registrationModes": {"candidate": null, "organization": ["code"]}}}'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    contestant_app_public_config (test_id ('project_b')) -> 'contestantApp',
    '{"entityTypes": [], "registrationModes": "invalid"}'::jsonb,
    'an empty list is answered as stored, and a matrix whose row is a JSON null is answered "invalid"'
  );

SELECT
  reset_role ();

UPDATE app_settings
SET
  settings = '{"access": {"contestantApp": null}, "contestantApp": {"registrationModes": {"organization": ["code", "code"]}}}'::jsonb
WHERE
  project_id = test_id ('project_b');

SELECT
  set_test_user ('anon');

SELECT
  is (
    contestant_app_public_config (test_id ('project_b')),
    '{"access": {"contestantApp": null, "answersLocked": null}, "analytics": {"trackEvents": null}, "contestantApp": {"entityTypes": null, "registrationModes": {"organization": ["code", "code"]}}}'::jsonb,
    'a stored JSON null and a matrix holding one row of the vocabulary are answered as stored'
  );

-- =====================================================================
-- Section 6: one all-null answer when there is nothing to tell
-- =====================================================================
-- A project that declares none of the five values, a project with no settings row and an id that names no project answer the same object, so the function is no existence oracle.
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
    contestant_app_public_config (test_id ('project_b')),
    '{"access": {"contestantApp": null, "answersLocked": null}, "analytics": {"trackEvents": null}, "contestantApp": {"entityTypes": null, "registrationModes": null}}'::jsonb,
    'a project that declares none of the five values answers the all-null object'
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
    contestant_app_public_config (test_id ('project_b')),
    '{"access": {"contestantApp": null, "answersLocked": null}, "analytics": {"trackEvents": null}, "contestantApp": {"entityTypes": null, "registrationModes": null}}'::jsonb,
    'a project with no settings row answers the same all-null object'
  );

SELECT
  is (
    contestant_app_public_config ('0badc0de-0000-4000-8000-000000000038'::uuid),
    '{"access": {"contestantApp": null, "answersLocked": null}, "analytics": {"trackEvents": null}, "contestantApp": {"entityTypes": null, "registrationModes": null}}'::jsonb,
    'an id that names no project answers the same all-null object as a project with no settings row'
  );

SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
