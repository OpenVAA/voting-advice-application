-- 41-entity-color.test.sql: the stored colour of an organization, a candidate, a faction and an alliance
--
-- An entity's `color` is written by the entity's own editor through the API, and what is stored reaches a voter's browser inside an inline `style` attribute. `validate_entity_color ()` therefore holds the stored value to one shape for every writer: null, or an object whose only members are `normal` and `dark`, each null or `#` followed by exactly three or exactly six hexadecimal digits.
--
-- A validation trigger fails in two silent ways: registered on the wrong verb or column it permits everything, and written too tightly it refuses what the seeds store. A file of refusals alone would pass against a trigger that refused every write, and a file of acceptances alone against no trigger at all. So every refused value has an accepted neighbour on the same table, by the same verb, under the same session:
--
--   accepted: SQL null; an empty object; `normal` alone; three digits beside six, in either letter case; a JSON null member; the pair of six-digit colours every shipped seed stores.
--   refused: a JSON string, array or null in place of the object; a member that is a colour name, a number, an empty string, five hex digits, functional `rgb` notation, a hex colour followed by further CSS or by a line break; a `dark` that is no colour beside a `normal` that is one; a member under any other key.
--
-- The refusals are raised for the entity's own editor, for the fixture owner, for the service role and for bulk_import, because the rule is a property of the row and not of a role. Each names the table, the member and what was found.
--
-- `organizations` carries the whole grid. `candidates`, `factions` and `alliances` each carry one refusal and one acceptance, and the catalogue census at the end shows the four registrations are the same.
--
-- Depends on:
-- - 00-helpers.test.sql (set_test_user, create_test_data, test_id, test_user_id, test_user_grants, reset_role)
-- - 011-validation-functions.sql (validate_entity_color)
-- - 102-entities.sql (the four registrations)
-- - 303-column-grants.sql (`color` in the UPDATE grant of each entity table)
-- - 501-bulk-operations.sql (bulk_import)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (79);

SELECT
  create_test_data ();

-- `write_color` builds one write of `color`: an UPDATE of the fixture row of project A on any of the four entity tables, or an INSERT of a new organization. `p_value` is the text of a JSON value, or NULL for SQL null. It returns the statement and does not run it, so the same statement can be handed to `lives_ok` or to `throws_like`.
CREATE FUNCTION pg_temp.write_color (
  p_table text,
  p_verb text,
  p_value text,
  p_id uuid
) RETURNS text LANGUAGE plpgsql AS $fn$
DECLARE
  v_literal text := COALESCE(quote_literal(p_value) || '::jsonb', 'NULL');
BEGIN
  IF p_verb = 'update' THEN
    RETURN format('UPDATE public.%I SET color = %s WHERE id = %L', p_table, v_literal, p_id);
  END IF;
  RETURN format(
    'INSERT INTO public.organizations (id, project_id, name, color) VALUES (%L, %L, ''{"en":"Coloured organization"}''::jsonb, %s)',
    p_id, test_id ('project_a'), v_literal
  );
END;
$fn$;

-- The row a write addresses: a new id for an INSERT, the fixture row of project A for an UPDATE.
CREATE FUNCTION pg_temp.color_row (p_table text, p_verb text) RETURNS uuid LANGUAGE sql AS $fn$
  SELECT CASE
    WHEN p_verb = 'insert' THEN gen_random_uuid()
    WHEN p_table = 'organizations' THEN test_id ('org_a')
    WHEN p_table = 'candidates' THEN test_id ('candidate_a')
    WHEN p_table = 'factions' THEN test_id ('faction_a')
    ELSE test_id ('alliance_a')
  END;
$fn$;

-- `stores` runs one write under the calling session and reads the stored value back: two assertions, the write and the read. It is not SECURITY DEFINER, so the write passes or fails under the caller's own row-level security and column grants.
CREATE FUNCTION pg_temp.stores (
  p_table text,
  p_verb text,
  p_value text,
  p_who text
) RETURNS SETOF text LANGUAGE plpgsql AS $fn$
DECLARE
  v_id uuid := pg_temp.color_row (p_table, p_verb);
  v_stored jsonb;
  v_label text := format('%s, by %s, as %s: %s', p_table, p_verb, p_who, COALESCE(p_value, 'SQL null'));
BEGIN
  RETURN NEXT lives_ok (
    pg_temp.write_color (p_table, p_verb, p_value, v_id),
    v_label || ' is accepted'
  );
  EXECUTE format('SELECT color FROM public.%I WHERE id = %L', p_table, v_id) INTO v_stored;
  RETURN NEXT is (v_stored, p_value::jsonb, v_label || ' is what the row holds afterwards');
END;
$fn$;

-- `refuses` runs one write under the calling session and asserts that it raises a message naming the table's column and, after it, `p_found`.
CREATE FUNCTION pg_temp.refuses (
  p_table text,
  p_verb text,
  p_value text,
  p_found text,
  p_who text
) RETURNS text LANGUAGE plpgsql AS $fn$
BEGIN
  RETURN throws_like (
    pg_temp.write_color (p_table, p_verb, p_value, pg_temp.color_row (p_table, p_verb)),
    '%public.' || p_table || '.color%' || p_found || '%',
    format('%s, by %s, as %s: %s is refused, naming the table, the member and what was found', p_table, p_verb, p_who, p_value)
  );
END;
$fn$;

-- The accepted values, in the order every grid below writes them. The last one is the form every shipped seed stores, and it is what `org_a` holds when the refusals begin.
CREATE TEMP TABLE accepted_colors (ord integer, val text) ON
COMMIT
DROP;

INSERT INTO
  accepted_colors (ord, val)
VALUES
  (1, NULL),
  (2, '{}'),
  (3, '{"normal": "#1f4ea0"}'),
  (4, '{"normal": "#abc", "dark": "#A1B2C3"}'),
  (5, '{"normal": "#1f4ea0", "dark": null}'),
  (6, '{"normal": "#2546a8", "dark": "#6b8dd6"}');

-- The refused values, each with the text its refusal carries after the column's name.
CREATE TEMP TABLE refused_colors (ord integer, val text, found text) ON
COMMIT
DROP;

INSERT INTO
  refused_colors (ord, val, found)
VALUES
  (1, '"#ff0000"', 'got a JSON string'),
  (2, '["#ff0000"]', 'got a JSON array'),
  (3, 'null', 'got a JSON null'),
  (
    4,
    '{"normal": "red"}',
    'holds "red" as its member normal,'
  ),
  (
    5,
    '{"normal": "#ff0000; background: url(//evil.example/x)"}',
    'holds "#ff0000; background: url(%as its member normal,'
  ),
  (
    6,
    '{"normal": 16711680}',
    'holds 16711680 as its member normal,'
  ),
  (
    7,
    '{"normal": "#ff000"}',
    'holds "#ff000" as its member normal,'
  ),
  (
    8,
    '{"normal": "rgb(255, 0, 0)"}',
    'holds "rgb(255, 0, 0)" as its member normal,'
  ),
  (
    9,
    '{"normal": "#ff0000", "light": "#00ff00"}',
    'holds the member light,'
  ),
  (
    10,
    '{"normal": "#ff0000", "dark": "red"}',
    'holds "red" as its member dark,'
  ),
  (
    11,
    '{"normal": "#ff0000\n"}',
    'holds "#ff0000%as its member normal,'
  ),
  (
    12,
    '{"normal": ""}',
    'holds "" as its member normal,'
  );

GRANT
SELECT
  ON accepted_colors,
  refused_colors TO authenticated,
  service_role;

-- =====================================================================
-- Section 0: the fixture stores under the rule
-- =====================================================================
-- Counted over the fixture's two projects only: the database a run finds may hold seeded entities, and theirs are not this file's to count.
SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        (
          SELECT
            project_id,
            color
          FROM
            organizations
          UNION ALL
          SELECT
            project_id,
            color
          FROM
            candidates
          UNION ALL
          SELECT
            project_id,
            color
          FROM
            factions
          UNION ALL
          SELECT
            project_id,
            color
          FROM
            alliances
        ) AS c
      WHERE
        c.project_id IN (test_id ('project_a'), test_id ('project_b'))
        AND c.color IS NOT NULL
    ),
    0,
    'the shared fixture stores no colour on any entity, so every value read back below is one this file wrote'
  );

-- =====================================================================
-- Section 1: the accepted values on organizations
-- =====================================================================
-- The entity's own editor holds no INSERT on its table, so its half of the grid is the UPDATE of its own row. `org_a` is confirmed, and the colour is not among the columns confirmation freezes.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  pg_temp.stores (
    'organizations',
    'update',
    a.val,
    'the organization''s own editor'
  )
FROM
  accepted_colors a
ORDER BY
  a.ord;

SELECT
  reset_role ();

SELECT
  pg_temp.stores (
    'organizations',
    v.verb,
    a.val,
    'the fixture owner'
  )
FROM
  (
    VALUES
      (1, 'insert'),
      (2, 'update')
  ) AS v (ord, verb)
  CROSS JOIN accepted_colors a
ORDER BY
  v.ord,
  a.ord;

-- =====================================================================
-- Section 2: the refused values on organizations
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('organization_a'),
    test_user_grants ('organization_a')
  );

SELECT
  pg_temp.refuses (
    'organizations',
    'update',
    r.val,
    r.found,
    'the organization''s own editor'
  )
FROM
  refused_colors r
ORDER BY
  r.ord;

SELECT
  reset_role ();

SELECT
  pg_temp.refuses (
    'organizations',
    'insert',
    r.val,
    r.found,
    'the fixture owner'
  )
FROM
  refused_colors r
ORDER BY
  r.ord;

SELECT
  set_config('request.jwt.claims', '', true);

SELECT
  set_config('role', 'service_role', true);

SELECT
  pg_temp.refuses (
    'organizations',
    'update',
    r.val,
    r.found,
    'the service role'
  )
FROM
  refused_colors r
WHERE
  r.ord IN (1, 5)
ORDER BY
  r.ord;

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        color
      FROM
        organizations
      WHERE
        id = test_id ('org_a')
    ),
    '{"normal": "#2546a8", "dark": "#6b8dd6"}'::jsonb,
    'organizations: after every refused update the fixture row still holds the last accepted colour'
  );

-- =====================================================================
-- Section 3: candidates, factions and alliances carry the same rule
-- =====================================================================
-- A candidate's colour is written by the candidate's own editor.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  pg_temp.refuses (
    'candidates',
    'update',
    r.val,
    r.found,
    'the candidate''s own editor'
  )
FROM
  refused_colors r
WHERE
  r.ord = 5;

SELECT
  pg_temp.stores (
    'candidates',
    'update',
    a.val,
    'the candidate''s own editor'
  )
FROM
  accepted_colors a
WHERE
  a.ord = 6;

-- The fixture gives no faction or alliance an editor of its own; the project admin writes both.
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

SELECT
  pg_temp.refuses (
    t.tbl,
    'update',
    r.val,
    r.found,
    'the project admin'
  )
FROM
  (
    VALUES
      (1, 'factions'),
      (2, 'alliances')
  ) AS t (ord, tbl)
  CROSS JOIN refused_colors r
WHERE
  r.ord = 5
ORDER BY
  t.ord;

SELECT
  pg_temp.stores (t.tbl, 'update', a.val, 'the project admin')
FROM
  (
    VALUES
      (1, 'factions'),
      (2, 'alliances')
  ) AS t (ord, tbl)
  CROSS JOIN accepted_colors a
WHERE
  a.ord = 6
ORDER BY
  t.ord;

-- =====================================================================
-- Section 4: bulk_import is bound like every other writer
-- =====================================================================
-- The service role is the seeder's role: it passes row-level security and the column grants, and nothing but the trigger stands between an import and the column.
SELECT
  set_config('request.jwt.claims', '', true);

SELECT
  set_config('role', 'service_role', true);

SELECT
  lives_ok (
    format(
      $$SELECT public.bulk_import(jsonb_build_object(
        'organizations', jsonb_build_array(jsonb_build_object(
          'project_id', '%1$s', 'external_id', 'coloured-organization', 'name', '{"en":"Imported organization"}'::jsonb,
          'color', '{"normal": "#2546a8", "dark": "#6b8dd6"}'::jsonb))))$$,
      test_id ('project_a')
    ),
    'bulk_import of an organization with a pair of hex colours succeeds'
  );

SELECT
  is (
    (
      SELECT
        color
      FROM
        organizations
      WHERE
        external_id = 'coloured-organization'
    ),
    '{"normal": "#2546a8", "dark": "#6b8dd6"}'::jsonb,
    'bulk_import stored the colour it was given'
  );

-- The first organization of this import is valid; the second carries CSS after its colour. Reading neither row afterwards shows the call wrote nothing, not merely that its last row was refused.
SELECT
  throws_like (
    format(
      $$SELECT public.bulk_import(jsonb_build_object(
        'organizations', jsonb_build_array(
          jsonb_build_object(
            'project_id', '%1$s', 'external_id', 'miscoloured-organization-1', 'name', '{"en":"Imported organization"}'::jsonb,
            'color', '{"normal": "#2546a8"}'::jsonb),
          jsonb_build_object(
            'project_id', '%1$s', 'external_id', 'miscoloured-organization-2', 'name', '{"en":"Imported organization"}'::jsonb,
            'color', '{"normal": "#ff0000; background: url(//evil.example/x)"}'::jsonb))))$$,
      test_id ('project_a')
    ),
    '%public.organizations.color%holds "#ff0000; background: url(%as its member normal,%',
    'bulk_import of an organization whose colour carries further CSS raises, naming the table and the member'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        organizations
      WHERE
        external_id LIKE 'miscoloured-organization-%'
    ),
    0,
    'and that import stored neither its organization nor the valid one imported before it'
  );

-- =====================================================================
-- Section 5: the registrations and the function, read from the catalogue
-- =====================================================================
SELECT
  reset_role ();

-- A registration that omitted `INSERT`, or listed another column after `UPDATE OF`, would leave one verb unguarded on that table while the organization grid above stayed green. The definition text is compared so both are pinned on all four tables, and the equality shows no fifth table carries the trigger.
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
        AND p.proname = 'validate_entity_color'
        AND NOT t.tgisinternal
        AND pg_get_triggerdef(t.oid) LIKE '%BEFORE INSERT OR UPDATE OF color ON public.' || c.relname || ' FOR EACH ROW%'
    ),
    ARRAY[
      'alliances',
      'candidates',
      'factions',
      'organizations'
    ],
    'validate_entity_color is registered BEFORE INSERT OR UPDATE OF color, for each row, on the four entity tables and on no other'
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
        AND p.proname = 'validate_entity_color'
    ),
    'false {"search_path=\"\""}',
    'validate_entity_color runs with invoker rights and an empty search path'
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
