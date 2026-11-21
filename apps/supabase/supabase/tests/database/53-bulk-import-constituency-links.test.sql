-- 53-bulk-import-constituency-links.test.sql: one bulk import links an election to its constituency groups and a group to its constituencies, before it writes nominations
--
-- An election item of bulk_import may carry `constituency_groups` and a constituency-group item `constituencies`, each a JSON array of references in the form resolve_external_ref reads. The keys name no column: the function takes them off the item before the upsert and writes the two join tables, election_constituency_groups and constituency_group_constituencies, after the `constituencies` collection and before `nominations`, in the same transaction. A nomination is judged against its election's constituencies when it is inserted, so the links have to exist by then.
--
-- The order is observed, not inferred: this file adds, inside its own transaction, a probe trigger on nominations that refuses a row whose constituency is not linked to its election at the moment of its insert. A link written after the nominations would leave every nomination of the payload refused.
--
-- The import is asserted as the service role, the seeder's role, and once as a project admin, under whose row-level security the join tables' own policies decide.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, test_user_id, test_user_grants, set_test_user, reset_role)
-- - 101-elections.sql (the two join tables)
-- - 302-rls.sql (the join tables' write policies)
-- - 501-bulk-operations.sql (bulk_import, _bulk_upsert_record, resolve_external_ref)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (17);

SELECT
  create_test_data ();

-- One payload: an election, a constituency group, a constituency and, optionally, an organization nominated at that constituency in that election. With p_with_links the election item names the group and the group item names the constituency, by external id.
CREATE FUNCTION bil_payload (
  p_prefix text,
  p_project_id uuid,
  p_with_links boolean,
  p_with_nomination boolean
) RETURNS jsonb LANGUAGE sql AS $$
  SELECT jsonb_build_object(
    'elections', jsonb_build_array(
      jsonb_build_object(
        'project_id', p_project_id,
        'external_id', p_prefix || '-el',
        'name', '{"en": "BIL election"}'::jsonb,
        'subtype', 'bil'
      ) || CASE WHEN p_with_links THEN jsonb_build_object(
        'constituency_groups', jsonb_build_array(jsonb_build_object('external_id', p_prefix || '-cg'))
      ) ELSE '{}'::jsonb END
    ),
    'constituency_groups', jsonb_build_array(
      jsonb_build_object(
        'project_id', p_project_id,
        'external_id', p_prefix || '-cg',
        'name', '{"en": "BIL group"}'::jsonb
      ) || CASE WHEN p_with_links THEN jsonb_build_object(
        'constituencies', jsonb_build_array(jsonb_build_object('external_id', p_prefix || '-co'))
      ) ELSE '{}'::jsonb END
    ),
    'constituencies', jsonb_build_array(
      jsonb_build_object(
        'project_id', p_project_id,
        'external_id', p_prefix || '-co',
        'name', '{"en": "BIL constituency"}'::jsonb
      )
    )
  ) || CASE WHEN p_with_nomination THEN jsonb_build_object(
    'organizations', jsonb_build_array(
      jsonb_build_object(
        'project_id', p_project_id,
        'external_id', p_prefix || '-org',
        'name', '{"en": "BIL party"}'::jsonb
      )
    ),
    'nominations', jsonb_build_array(
      jsonb_build_object(
        'project_id', p_project_id,
        'external_id', p_prefix || '-nom',
        'organization', jsonb_build_object('external_id', p_prefix || '-org'),
        'election', jsonb_build_object('external_id', p_prefix || '-el'),
        'constituency', jsonb_build_object('external_id', p_prefix || '-co')
      )
    )
  ) ELSE '{}'::jsonb END;
$$;

-- bulk_import, with a raise answered as its SQLSTATE and message. The raise still rolls back everything the import wrote, and each assertion that imports reports its own result instead of ending the file.
CREATE FUNCTION bil_import (p_data jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  RETURN public.bulk_import(p_data);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('raised', SQLSTATE, 'message', SQLERRM);
END;
$$;

-- The join rows that link the payload's election to its constituency through its group.
CREATE FUNCTION bil_link_rows (p_prefix text) RETURNS integer LANGUAGE sql AS $$
  SELECT (
    SELECT count(*)::integer
    FROM election_constituency_groups ecg
    JOIN elections e ON e.id = ecg.election_id
    JOIN constituency_groups cg ON cg.id = ecg.constituency_group_id
    WHERE e.external_id = p_prefix || '-el' AND cg.external_id = p_prefix || '-cg'
  ) + (
    SELECT count(*)::integer
    FROM constituency_group_constituencies cgc
    JOIN constituency_groups cg ON cg.id = cgc.constituency_group_id
    JOIN constituencies c ON c.id = cgc.constituency_id
    WHERE cg.external_id = p_prefix || '-cg' AND c.external_id = p_prefix || '-co'
  );
$$;

-- The probe: a nomination whose constituency is not linked to its election when the row is inserted is refused. Owner rights, so the caller's row-level security does not hide a link that exists.
CREATE FUNCTION bil_probe_link_precedes_nomination () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.election_constituency_groups ecg
    JOIN public.constituency_group_constituencies cgc ON cgc.constituency_group_id = ecg.constituency_group_id
    WHERE ecg.election_id = NEW.election_id AND cgc.constituency_id = NEW.constituency_id
  ) THEN
    RAISE EXCEPTION 'BIL probe: a nomination was inserted before its constituency was linked to its election';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bil_probe_link_precedes_nomination
BEFORE INSERT ON nominations FOR EACH ROW
EXECUTE FUNCTION bil_probe_link_precedes_nomination ();

GRANT
EXECUTE ON FUNCTION bil_payload (text, uuid, boolean, boolean) TO authenticated,
service_role;

GRANT
EXECUTE ON FUNCTION bil_import (jsonb) TO authenticated,
service_role;

-- The service role is the seeder's role.
SELECT
  set_config('request.jwt.claims', '', true);

SELECT
  set_config('role', 'service_role', true);

-- =====================================================================
-- Section 1: one import writes the links, and the nomination after them
-- =====================================================================
SELECT
  is (
    bil_import (
      bil_payload ('bil-1', test_id ('project_a'), true, true)
    ),
    '{
      "elections": {"created": 1, "updated": 0},
      "constituency_groups": {"created": 1, "updated": 0},
      "constituencies": {"created": 1, "updated": 0},
      "organizations": {"created": 1, "updated": 0},
      "nominations": {"created": 1, "updated": 0}
    }'::jsonb,
    'BIL: one import creates an election, its constituency group, the group''s constituency and a nomination there, and counts each collection as it counts one without link keys'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        election_constituency_groups ecg
        JOIN elections e ON e.id = ecg.election_id
        JOIN constituency_groups cg ON cg.id = ecg.constituency_group_id
      WHERE
        e.external_id = 'bil-1-el'
        AND cg.external_id = 'bil-1-cg'
    ),
    1,
    'BIL: the election item''s constituency_groups wrote one election_constituency_groups row'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        constituency_group_constituencies cgc
        JOIN constituency_groups cg ON cg.id = cgc.constituency_group_id
        JOIN constituencies c ON c.id = cgc.constituency_id
      WHERE
        cg.external_id = 'bil-1-cg'
        AND c.external_id = 'bil-1-co'
    ),
    1,
    'BIL: the constituency group item''s constituencies wrote one constituency_group_constituencies row'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        nominations n
        JOIN elections e ON e.id = n.election_id
        JOIN constituencies c ON c.id = n.constituency_id
      WHERE
        n.external_id = 'bil-1-nom'
        AND e.external_id = 'bil-1-el'
        AND c.external_id = 'bil-1-co'
    ),
    1,
    'BIL: the nomination at the linked constituency landed, the probe having found its links in place'
  );

-- =====================================================================
-- Section 2: a second identical import
-- =====================================================================
SELECT
  is (
    bil_import (
      bil_payload ('bil-1', test_id ('project_a'), true, true)
    ),
    '{
      "elections": {"created": 0, "updated": 1},
      "constituency_groups": {"created": 0, "updated": 1},
      "constituencies": {"created": 0, "updated": 1},
      "organizations": {"created": 0, "updated": 1},
      "nominations": {"created": 0, "updated": 1}
    }'::jsonb,
    'BIL: a second identical import raises nothing and answers every item updated'
  );

SELECT
  is (
    bil_link_rows ('bil-1'),
    2,
    'BIL: and writes no second join row'
  );

-- =====================================================================
-- Section 3: a payload without link keys, and what the keys write
-- =====================================================================
SELECT
  is (
    bil_import (
      bil_payload ('bil-plain', test_id ('project_a'), false, false)
    ),
    '{
      "elections": {"created": 1, "updated": 0},
      "constituency_groups": {"created": 1, "updated": 0},
      "constituencies": {"created": 1, "updated": 0}
    }'::jsonb,
    'BIL: a payload with no link keys answers the counts it answers without the link step'
  );

SELECT
  is (
    bil_link_rows ('bil-plain'),
    0,
    'BIL: and writes no join row'
  );

SELECT
  is (
    (
      SELECT
        to_jsonb(e) - 'id' - 'external_id' - 'created_at' - 'updated_at'
      FROM
        elections e
      WHERE
        e.external_id = 'bil-1-el'
    ),
    (
      SELECT
        to_jsonb(e) - 'id' - 'external_id' - 'created_at' - 'updated_at'
      FROM
        elections e
      WHERE
        e.external_id = 'bil-plain-el'
    ),
    'BIL: the link keys reach no column: an election imported with them is stored as the same election imported without them'
  );

-- =====================================================================
-- Section 4: refusals, each rolling the whole import back
-- =====================================================================
SELECT
  throws_ok (
    format(
      $$SELECT public.bulk_import(jsonb_build_object('elections', jsonb_build_array(jsonb_build_object(
        'project_id', %1$L, 'external_id', 'bil-rollback-el',
        'constituency_groups', jsonb_build_array(jsonb_build_object('external_id', 'bil-missing-cg'))))))$$,
      test_id ('project_a')
    ),
    'P0001',
    'External reference not found: external_id "bil-missing-cg" in table "constituency_groups"',
    'BIL: a link reference that names nothing raises as resolve_external_ref raises'
  );

SELECT
  is (
    (
      SELECT
        count(*)::integer
      FROM
        elections
      WHERE
        external_id = 'bil-rollback-el'
    ),
    0,
    'BIL: and the whole import rolled back, the election item with it'
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.bulk_import(jsonb_build_object('elections', jsonb_build_array(jsonb_build_object(
        'project_id', %1$L, 'external_id', 'bil-object-el',
        'constituency_groups', jsonb_build_object('external_id', 'bil-1-cg')))))$$,
      test_id ('project_a')
    ),
    'P0001',
    'Collection "elections" item bil-object-el: constituency_groups must be a JSON array of references',
    'BIL: an election''s constituency_groups that is not a JSON array is refused, naming the collection, the item and the key'
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.bulk_import(jsonb_build_object('constituency_groups', jsonb_build_array(jsonb_build_object(
        'project_id', %1$L, 'external_id', 'bil-string-cg', 'constituencies', 'bil-1-co'))))$$,
      test_id ('project_a')
    ),
    'P0001',
    'Collection "constituency_groups" item bil-string-cg: constituencies must be a JSON array of references',
    'BIL: a constituency group''s constituencies that is not a JSON array is refused, naming the collection, the item and the key'
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.bulk_import(jsonb_build_object('elections', jsonb_build_array(jsonb_build_object(
        'project_id', %1$L, 'external_id', 'bil-cross-el',
        'constituency_groups', jsonb_build_array(to_jsonb(%2$L::text))))))$$,
      test_id ('project_a'),
      test_id ('constituency_group_b')
    ),
    'P0001',
    'Collection "elections" item bil-cross-el: constituency_groups names a row that is not a constituency_groups row of the item''s project',
    'BIL: a link to another project''s constituency group, named by its uuid, is refused'
  );

-- =====================================================================
-- Section 5: a project admin's import
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('admin_a'),
    test_user_grants ('admin_a')
  );

-- The nomination names the fixture's organization by its uuid: the entity tables' column grants keep an authenticated caller from writing an entity through the import's upsert, whatever its links.
SELECT
  is (
    bil_import (
      bil_payload ('bil-admin', test_id ('project_a'), true, false) || jsonb_build_object(
        'nominations',
        jsonb_build_array(
          jsonb_build_object(
            'project_id',
            test_id ('project_a'),
            'external_id',
            'bil-admin-nom',
            'organization',
            to_jsonb(test_id ('org_a')::text),
            'election',
            jsonb_build_object('external_id', 'bil-admin-el'),
            'constituency',
            jsonb_build_object('external_id', 'bil-admin-co')
          )
        )
      )
    ),
    '{
      "elections": {"created": 1, "updated": 0},
      "constituency_groups": {"created": 1, "updated": 0},
      "constituencies": {"created": 1, "updated": 0},
      "nominations": {"created": 1, "updated": 0}
    }'::jsonb,
    'BIL: a project admin''s import writes the links under the join tables'' own policies, and the nomination after them'
  );

SELECT
  throws_ok (
    format(
      $$SELECT public.bulk_import(jsonb_build_object('elections', jsonb_build_array(jsonb_build_object(
        'project_id', %1$L, 'external_id', 'bil-admin-cross-el',
        'constituency_groups', jsonb_build_array(to_jsonb(%2$L::text))))))$$,
      test_id ('project_a'),
      test_id ('constituency_group_b')
    ),
    'P0001',
    'Collection "elections" item bil-admin-cross-el: constituency_groups names a row that is not a constituency_groups row of the item''s project',
    'BIL: a project admin''s link to another project''s constituency group is refused'
  );

SELECT
  reset_role ();

SELECT
  is (
    bil_link_rows ('bil-admin'),
    2,
    'BIL: the project admin''s import wrote both join rows'
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
