-- 40-entity-type-list.test.sql: the entity type filter of a question and of a question category, and its passage through bulk_import
--
-- `entity_type` on `questions` and `question_categories` is a filter list: null or an empty array addresses every entity type, and any other value addresses the types it names. The data model compares a member with an entity type by equality, so a member that names no entity type matches nothing and the row silently disappears for every contestant. `validate_entity_type_list ()` refuses such a value, and `bulk_import` carries the key on these two tables and on no other.
--
-- A validation trigger fails in two silent ways: registered on the wrong verb or column it permits everything, and written too tightly it refuses what the seeds store. A file of refusals alone would pass against a trigger that refused every write, and a file of acceptances alone against no trigger at all. So every refused value has an accepted neighbour on the same table, by the same verb, under the same session:
--
--   accepted: SQL null, an empty array, a one-member array, an array of all four entity types.
--   refused: a JSON string, a JSON object, a JSON null, an array holding a number, an array holding a string that names no entity type.
--
-- The refusals are raised for the project admin, for the fixture owner and for the service role, because the rule is a property of the row and not of a role. Each names the table and what was found.
--
-- The import half asserts three things about one key: on the two question tables the list is stored and read back; an import holding an unknown member raises and stores nothing, the valid category beside it included; and on `nominations`, where `entity_type` is a generated column, the key is still skipped.
--
-- Depends on:
-- - 00-helpers.test.sql (set_test_user, create_test_data, test_id, test_user_id, test_user_grants, reset_role)
-- - 011-validation-functions.sql (validate_entity_type_list)
-- - 103-questions.sql (the two registrations)
-- - 501-bulk-operations.sql (bulk_import and its skip of managed columns)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (69);

SELECT
  create_test_data ();

-- `write_type_list` builds one write of `entity_type`: an INSERT of a new row, or an UPDATE of the fixture row of project A, on either question table. `p_value` is the text of a JSON value, or NULL for SQL null. It returns the statement and does not run it, so the same statement can be handed to `lives_ok` or to `throws_like`.
CREATE FUNCTION pg_temp.write_type_list (
  p_table text,
  p_verb text,
  p_value text,
  p_id uuid
) RETURNS text LANGUAGE plpgsql AS $fn$
DECLARE
  v_literal text := COALESCE(quote_literal(p_value) || '::jsonb', 'NULL');
BEGIN
  IF p_verb = 'update' THEN
    RETURN format('UPDATE public.%I SET entity_type = %s WHERE id = %L', p_table, v_literal, p_id);
  END IF;
  IF p_table = 'questions' THEN
    RETURN format(
      'INSERT INTO public.questions (id, project_id, type, category_id, name, entity_type) VALUES (%L, %L, ''text'', %L, ''{"en":"Typed question"}''::jsonb, %s)',
      p_id, test_id ('project_a'), test_id ('question_category_a'), v_literal
    );
  END IF;
  RETURN format(
    'INSERT INTO public.question_categories (id, project_id, name, entity_type) VALUES (%L, %L, ''{"en":"Typed category"}''::jsonb, %s)',
    p_id, test_id ('project_a'), v_literal
  );
END;
$fn$;

-- `stores` runs one write under the calling session and reads the stored value back: two assertions, the write and the read. It is not SECURITY DEFINER, so the write passes or fails under the caller's own row-level security.
CREATE FUNCTION pg_temp.stores (p_table text, p_verb text, p_value text) RETURNS SETOF text LANGUAGE plpgsql AS $fn$
DECLARE
  v_id uuid := CASE
    WHEN p_verb = 'insert' THEN gen_random_uuid()
    WHEN p_table = 'questions' THEN test_id ('question_a')
    ELSE test_id ('question_category_a')
  END;
  v_stored jsonb;
  v_label text := format('%s, by %s: %s', p_table, p_verb, COALESCE(p_value, 'SQL null'));
BEGIN
  RETURN NEXT lives_ok (
    pg_temp.write_type_list (p_table, p_verb, p_value, v_id),
    v_label || ' is accepted'
  );
  EXECUTE format('SELECT entity_type FROM public.%I WHERE id = %L', p_table, v_id) INTO v_stored;
  RETURN NEXT is (v_stored, p_value::jsonb, v_label || ' is what the row holds afterwards');
END;
$fn$;

-- `refuses` runs one write under the calling session and asserts that it raises a message matching `p_pattern`.
CREATE FUNCTION pg_temp.refuses (
  p_table text,
  p_verb text,
  p_value text,
  p_pattern text,
  p_who text
) RETURNS text LANGUAGE plpgsql AS $fn$
BEGIN
  RETURN throws_like (
    pg_temp.write_type_list (
      p_table,
      p_verb,
      p_value,
      CASE
        WHEN p_verb = 'insert' THEN gen_random_uuid()
        WHEN p_table = 'questions' THEN test_id ('question_a')
        ELSE test_id ('question_category_a')
      END
    ),
    p_pattern,
    format('%s, by %s, as %s: %s is refused, naming the table and what was found', p_table, p_verb, p_who, p_value)
  );
END;
$fn$;

-- =====================================================================
-- Section 1: the accepted values, on both tables, by insert and by update
-- =====================================================================
-- The project admin is the API writer of both tables: neither has a column grant, so `project.edit_questions` admits the whole row.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  pg_temp.stores (t.tbl, v.verb, l.val)
FROM
  (
    VALUES
      (1, 'question_categories'),
      (2, 'questions')
  ) AS t (ord, tbl)
  CROSS JOIN (
    VALUES
      (1, 'insert'),
      (2, 'update')
  ) AS v (ord, verb)
  CROSS JOIN (
    VALUES
      (1, NULL),
      (2, '[]'),
      (3, '["organization"]'),
      (
        4,
        '["candidate", "organization", "faction", "alliance"]'
      )
  ) AS l (ord, val)
ORDER BY
  t.ord,
  v.ord,
  l.ord;

-- =====================================================================
-- Section 2: the refused values, on both tables, by insert and by update
-- =====================================================================
-- The last accepted update of section 1 left the four-member list on both fixture rows; section 3 reads it back after every refusal here.
SELECT
  pg_temp.refuses (
    t.tbl,
    v.verb,
    l.val,
    '%public.' || t.tbl || '.entity_type%' || l.found || '%',
    'the project admin'
  )
FROM
  (
    VALUES
      (1, 'question_categories'),
      (2, 'questions')
  ) AS t (ord, tbl)
  CROSS JOIN (
    VALUES
      (1, 'insert'),
      (2, 'update')
  ) AS v (ord, verb)
  CROSS JOIN (
    VALUES
      (1, '"organization"', 'got a JSON string'),
      (2, '{"organization": true}', 'got a JSON object'),
      (3, 'null', 'got a JSON null'),
      (4, '["organization", 7]', 'holds the member 7,'),
      (
        5,
        '["candidate", "candidates"]',
        'holds the member "candidates",'
      )
  ) AS l (ord, val, found)
ORDER BY
  t.ord,
  v.ord,
  l.ord;

-- =====================================================================
-- Section 3: the refusal is not a property of a role
-- =====================================================================
SELECT
  reset_role ();

SELECT
  pg_temp.refuses (
    t.tbl,
    v.verb,
    '["organisation"]',
    '%public.' || t.tbl || '.entity_type%holds the member "organisation",%',
    'the fixture owner'
  )
FROM
  (
    VALUES
      (1, 'question_categories'),
      (2, 'questions')
  ) AS t (ord, tbl)
  CROSS JOIN (
    VALUES
      (1, 'insert'),
      (2, 'update')
  ) AS v (ord, verb)
ORDER BY
  t.ord,
  v.ord;

SELECT
  set_config('request.jwt.claims', '', true);

SELECT
  set_config('role', 'service_role', true);

SELECT
  pg_temp.refuses (
    t.tbl,
    'update',
    '"candidate"',
    '%public.' || t.tbl || '.entity_type%got a JSON string%',
    'the service role'
  )
FROM
  (
    VALUES
      (1, 'question_categories'),
      (2, 'questions')
  ) AS t (ord, tbl)
ORDER BY
  t.ord;

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        entity_type
      FROM
        question_categories
      WHERE
        id = test_id ('question_category_a')
    ),
    '["candidate", "organization", "faction", "alliance"]'::jsonb,
    'question_categories: after every refused update the fixture row still holds the last accepted list'
  );

SELECT
  is (
    (
      SELECT
        entity_type
      FROM
        questions
      WHERE
        id = test_id ('question_a')
    ),
    '["candidate", "organization", "faction", "alliance"]'::jsonb,
    'questions: after every refused update the fixture row still holds the last accepted list'
  );

-- =====================================================================
-- Section 4: bulk_import carries the list on the two question tables
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  lives_ok (
    format(
      $$SELECT public.bulk_import(jsonb_build_object(
        'question_categories', jsonb_build_array(jsonb_build_object(
          'project_id', '%1$s', 'external_id', 'typed-category', 'name', '{"en":"Imported category"}'::jsonb,
          'entity_type', '["organization"]'::jsonb)),
        'questions', jsonb_build_array(jsonb_build_object(
          'project_id', '%1$s', 'external_id', 'typed-question', 'name', '{"en":"Imported question"}'::jsonb,
          'type', 'text', 'category', '{"external_id":"typed-category"}'::jsonb,
          'entity_type', '["organization", "alliance"]'::jsonb))))$$,
      test_id ('project_a')
    ),
    'bulk_import of a category and a question that each state a valid entity type list succeeds'
  );

SELECT
  is (
    (
      SELECT
        entity_type
      FROM
        question_categories
      WHERE
        external_id = 'typed-category'
    ),
    '["organization"]'::jsonb,
    'bulk_import stored the list it was given on the question category'
  );

SELECT
  is (
    (
      SELECT
        entity_type
      FROM
        questions
      WHERE
        external_id = 'typed-question'
    ),
    '["organization", "alliance"]'::jsonb,
    'bulk_import stored the list it was given on the question'
  );

-- The category of this import is valid and is processed first; the question beside it holds an unknown member. Reading neither row afterwards shows the call wrote nothing, not merely that its last row was refused.
SELECT
  throws_like (
    format(
      $$SELECT public.bulk_import(jsonb_build_object(
        'question_categories', jsonb_build_array(jsonb_build_object(
          'project_id', '%1$s', 'external_id', 'mistyped-category', 'name', '{"en":"Imported category"}'::jsonb,
          'entity_type', '["organization"]'::jsonb)),
        'questions', jsonb_build_array(jsonb_build_object(
          'project_id', '%1$s', 'external_id', 'mistyped-question', 'name', '{"en":"Imported question"}'::jsonb,
          'type', 'text', 'category', '{"external_id":"mistyped-category"}'::jsonb,
          'entity_type', '["organization", "organisation"]'::jsonb))))$$,
      test_id ('project_a')
    ),
    '%public.questions.entity_type%holds the member "organisation",%',
    'bulk_import of a question whose list holds an unknown member raises, naming the table and the member'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        (
          SELECT
            external_id
          FROM
            question_categories
          UNION ALL
          SELECT
            external_id
          FROM
            questions
        ) AS r
      WHERE
        r.external_id IN ('mistyped-category', 'mistyped-question')
    ),
    0,
    'and that import stored neither its question nor the valid category imported before it'
  );

-- =====================================================================
-- Section 5: bulk_import still skips the key on nominations
-- =====================================================================
-- `nominations.entity_type` is generated from whichever entity column is set. The import states the wrong type on purpose: a skipped key leaves the generated value, and a carried key would raise, because a generated column takes no value.
SELECT
  lives_ok (
    format(
      $$SELECT public.bulk_import(jsonb_build_object(
        'nominations', jsonb_build_array(jsonb_build_object(
          'project_id', '%1$s', 'external_id', 'typed-nomination',
          'candidate', '%2$s', 'election', '%3$s', 'constituency', '%4$s', 'election_round', 1,
          'entity_type', 'organization'))))$$,
      test_id ('project_a'),
      test_id ('candidate_a2'),
      test_id ('election_a'),
      test_id ('constituency_a')
    ),
    'bulk_import of a nomination that states entity_type succeeds: the key is skipped'
  );

SELECT
  is (
    (
      SELECT
        entity_type::text
      FROM
        nominations
      WHERE
        external_id = 'typed-nomination'
    ),
    'candidate',
    'and the nomination holds the generated type of its entity column, not the type the import stated'
  );

-- =====================================================================
-- Section 6: the registrations and the function, read from the catalogue
-- =====================================================================
SELECT
  reset_role ();

-- A registration that omitted `INSERT`, or listed another column after `UPDATE OF`, would leave the cells above green for one verb and silent for the other on some later change. The definition text is compared so both are pinned, and the equality shows no third table carries the trigger.
SELECT
  is (
    (
      SELECT
        array_agg(
          c.relname::text
          ORDER BY
            c.relname
        )
      FROM
        pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_proc p ON p.oid = t.tgfoid
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'validate_entity_type_list'
        AND NOT t.tgisinternal
        AND pg_get_triggerdef(t.oid) LIKE '%BEFORE INSERT OR UPDATE OF entity_type ON public.' || c.relname || ' FOR EACH ROW%'
    ),
    ARRAY['question_categories', 'questions'],
    'validate_entity_type_list is registered BEFORE INSERT OR UPDATE OF entity_type, for each row, on the two question tables and on no other'
  );

SELECT
  is (
    (
      SELECT
        p.prosecdef::text || ' ' || COALESCE(p.proconfig::text, '(no setting)')
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname = 'validate_entity_type_list'
    ),
    'false {"search_path=\"\""}',
    'validate_entity_type_list runs with invoker rights and an empty search path'
  );

-- =====================================================================
-- Cleanup
-- =====================================================================
SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
