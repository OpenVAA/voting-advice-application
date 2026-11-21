-- 51-bulk-import-key-quoting.test.sql: a key of an imported item is a column name and nothing else
--
-- bulk_import hands each item to _bulk_upsert_record, which builds one INSERT ... ON CONFLICT DO UPDATE statement from the item's keys and values and runs it. A value is quoted as a literal. A key is the name of a column in both the column list and the SET list, so it must be quoted as an identifier there: a key that is not one has to name a column that does not exist and fail, never become part of the statement's text.
--
-- The hostile key below closes the column list, supplies a VALUES list of its own and comments out the rest of the statement. Spliced into the statement it inserts a row the item never described; quoted, it is the name of a column no table has, and the import fails with SQLSTATE 42703 and writes nothing. The plain import beside it shows that quoting leaves an ordinary key working, in the insert and in the update an import of the same external id makes.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, reset_role)
-- - 501-bulk-operations.sql (bulk_import, _bulk_upsert_record)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (6);

SELECT
  create_test_data ();

-- The service role is the seeder's role: it passes row-level security and the column grants, so the statement's own text is all that decides what is written.
SELECT
  set_config('request.jwt.claims', '', true);

SELECT
  set_config('role', 'service_role', true);

-- =====================================================================
-- Section 1: a hostile key is a column name that does not exist
-- =====================================================================
SELECT
  throws_ok (
    format(
      $$SELECT public.bulk_import(jsonb_build_object('elections', jsonb_build_array(jsonb_build_object(
        'project_id', %1$L, 'external_id', 'quoting-hostile', %2$L, 'x'))))$$,
      test_id ('project_a'),
      format(
        'subtype) VALUES (%L::uuid, %L, %L) RETURNING true AS inserted --',
        test_id ('project_a'),
        'quoting-injected',
        'injected'
      )
    ),
    '42703',
    NULL,
    'bulk_import of an item whose key closes the column list fails as an unknown column'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        elections
      WHERE
        external_id IN ('quoting-injected', 'quoting-hostile')
    ),
    0,
    'and it wrote neither the row its key described nor the item itself'
  );

-- =====================================================================
-- Section 2: an ordinary key still names its column
-- =====================================================================
SELECT
  is (
    public.bulk_import (
      jsonb_build_object(
        'elections',
        jsonb_build_array(
          jsonb_build_object(
            'project_id',
            test_id ('project_a'),
            'external_id',
            'quoting-plain',
            'subtype',
            'first',
            'sort_order',
            7
          )
        )
      )
    ),
    '{"elections": {"created": 1, "updated": 0}}'::jsonb,
    'bulk_import of an item with ordinary keys creates its row'
  );

SELECT
  is (
    public.bulk_import (
      jsonb_build_object(
        'elections',
        jsonb_build_array(
          jsonb_build_object(
            'project_id',
            test_id ('project_a'),
            'external_id',
            'quoting-plain',
            'subtype',
            'second',
            'sort_order',
            8
          )
        )
      )
    ),
    '{"elections": {"created": 0, "updated": 1}}'::jsonb,
    'an import of the same external id updates that row'
  );

SELECT
  is (
    (
      SELECT
        subtype
      FROM
        elections
      WHERE
        external_id = 'quoting-plain'
    ),
    'second',
    'the update wrote the text column the key names'
  );

SELECT
  is (
    (
      SELECT
        sort_order
      FROM
        elections
      WHERE
        external_id = 'quoting-plain'
    ),
    8,
    'and the number column the key names'
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
