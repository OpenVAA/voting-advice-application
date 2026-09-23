-- 31-storage-cleanup.test.sql: what the storage cleanup triggers ENQUEUE, measured on `net.http_request_queue`
--
-- THE ESTATE'S FIRST ASSERTIONS ON THE pg_net QUEUE, and why the queue and not the object. `net.http_*` INSERTs one row into `net.http_request_queue` inside the calling transaction, and the pg_net worker sends it only after COMMIT. Every pgTAP file ends in ROLLBACK, so no request asserted here is ever sent: this file proves what the triggers ASK Storage to do, exactly (method, URL, headers), and the committed-state Playwright spec `tests/tests/specs/storage/storage-cleanup.spec.ts` proves that Storage then does it. From `11f877913` (2026-08-17) until 162.1 the delete POSTed to a DELETE-only route and nothing checked either half, which is how every replaced photo stayed stored and public without a single red test (spike 029 F4).
--
-- EACH CASE MEASURES AGAINST ITS OWN BASELINE, never a global count. `q_base` records `max(id)` of the queue immediately before the action, and the assertions count only rows with a larger id. Rows another session committed earlier may be consumed by the worker at any moment, but rows enqueued inside this transaction are invisible to it until COMMIT, which never comes, so they cannot disappear mid-test.
--
-- THE PATH IS UNTRUSTED (162.1 D-20). A stored image path is written by the entity's own editor and ends up in a URL sent with the service-role key. The accepted shape is `<uuid>/<one of the ten cleanup tables>/<uuid>/<uuid>.<jpg|jpeg|png|webp|gif|avif>`, lowercase, and a trigger deletes only inside the row's own folder and only a path the new row no longer references. Every uuid below is a lowercase literal for that reason: an uppercase one is one of the refused shapes.
--
-- Depends on: 00-helpers.test.sql (create_test_data, test_id)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (47);

SELECT
  create_test_data ();

-- =====================================================================
-- A candidate of our own, so the fixture candidates stay untouched
-- =====================================================================
-- Its image starts at path A, a whitelisted object inside its own folder `<project_a>/candidates/<id>/`.
INSERT INTO
  public.candidates (id, project_id, first_name, last_name, image)
VALUES
  (
    '31310000-0000-4000-8000-000000000001',
    test_id ('project_a'),
    'Storage',
    'Cleanup',
    jsonb_build_object(
      'path',
      test_id ('project_a')::text || '/candidates/31310000-0000-4000-8000-000000000001/31310000-0000-4000-8000-0000000000a1.jpg'
    )
  );

-- One row per case: the queue's high-water mark captured immediately before that case's action.
CREATE TEMP TABLE q_base (label text PRIMARY KEY, id bigint NOT NULL);

-- =====================================================================
-- D-11: replacing an own-folder image enqueues ONE DELETE of the old object
-- =====================================================================
INSERT INTO
  q_base (label, id)
SELECT
  'replace',
  coalesce(max(id), 0)
FROM
  net.http_request_queue;

UPDATE public.candidates
SET
  image = jsonb_build_object(
    'path',
    test_id ('project_a')::text || '/candidates/31310000-0000-4000-8000-000000000001/31310000-0000-4000-8000-0000000000b1.jpg'
  )
WHERE
  id = '31310000-0000-4000-8000-000000000001';

SELECT
  is (
    (
      SELECT
        count(*)::int
      FROM
        net.http_request_queue q
      WHERE
        q.id > (
          SELECT
            id
          FROM
            q_base
          WHERE
            label = 'replace'
        )
        AND q.method::text = 'DELETE'
        AND q.url = (
          SELECT
            value
          FROM
            public.storage_config
          WHERE
            key = 'supabase_url'
        ) || '/storage/v1/object/public-assets/' || test_id ('project_a')::text || '/candidates/31310000-0000-4000-8000-000000000001/31310000-0000-4000-8000-0000000000a1.jpg'
    ),
    1,
    'D-11: replacing an own-folder image enqueues exactly one DELETE to <supabase_url>/storage/v1/object/public-assets/<old path>'
  );

SELECT
  is (
    (
      SELECT
        count(*)::int
      FROM
        net.http_request_queue q
      WHERE
        q.id > (
          SELECT
            id
          FROM
            q_base
          WHERE
            label = 'replace'
        )
        AND q.method::text <> 'DELETE'
    ),
    0,
    'D-11: replacing an image enqueues no non-DELETE request (the bulk-route POST is gone)'
  );

SELECT
  ok (
    coalesce(
      (
        SELECT
          array_agg(
            k.key
            ORDER BY
              k.key
          ) = ARRAY['Authorization']
          AND q.headers ->> 'Authorization' = 'Bearer ' || (
            SELECT
              value
            FROM
              public.storage_config
            WHERE
              key = 'service_role_key'
          )
        FROM
          net.http_request_queue q
          CROSS JOIN LATERAL jsonb_object_keys(q.headers) AS k (key)
        WHERE
          q.id > (
            SELECT
              id
            FROM
              q_base
            WHERE
              label = 'replace'
          )
          AND q.method::text = 'DELETE'
        GROUP BY
          q.id,
          q.headers
      ),
      FALSE
    ),
    'D-11: the DELETE carries exactly one header, Authorization: Bearer <storage_config.service_role_key>'
  );

-- =====================================================================
-- NOT CALLABLE BY ANY API ROLE
-- =====================================================================
-- Written against pg_proc so a missing function fails an assertion instead of aborting the file. Once the delete works, EXECUTE for anon or authenticated would be a public `/rest/v1/rpc/delete_storage_object` that deletes any object with the service-role key.
SELECT
  ok (
    coalesce(
      (
        SELECT
          NOT has_function_privilege('anon', p.oid, 'EXECUTE')
        FROM
          pg_proc p
        WHERE
          p.oid = to_regprocedure('public.delete_storage_object(text, text)')
      ),
      FALSE
    ),
    'revoke: anon lacks EXECUTE on public.delete_storage_object (text, text)'
  );

SELECT
  ok (
    coalesce(
      (
        SELECT
          NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
        FROM
          pg_proc p
        WHERE
          p.oid = to_regprocedure('public.delete_storage_object(text, text)')
      ),
      FALSE
    ),
    'revoke: authenticated lacks EXECUTE on public.delete_storage_object (text, text)'
  );

SELECT
  ok (
    coalesce(
      (
        SELECT
          NOT has_function_privilege('anon', p.oid, 'EXECUTE')
        FROM
          pg_proc p
        WHERE
          p.oid = to_regprocedure('public.referenced_storage_paths(jsonb)')
      ),
      FALSE
    ),
    'revoke: anon lacks EXECUTE on public.referenced_storage_paths (jsonb)'
  );

SELECT
  ok (
    coalesce(
      (
        SELECT
          NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
        FROM
          pg_proc p
        WHERE
          p.oid = to_regprocedure('public.referenced_storage_paths(jsonb)')
      ),
      FALSE
    ),
    'revoke: authenticated lacks EXECUTE on public.referenced_storage_paths (jsonb)'
  );

-- =====================================================================
-- D-20 AT THE EDGES: what must enqueue NOTHING, and the two cases that must enqueue exactly what they name
-- =====================================================================
-- The helpers below are temporary (pg_temp, gone at ROLLBACK). `own_folder` is our candidate's folder; `q_mark` captures a case's baseline; `q_since` counts every request enqueued after it, whatever its method, so a refused path that still reached pg_net by any route counts.
CREATE FUNCTION pg_temp.own_folder () RETURNS text LANGUAGE sql AS $$
  SELECT public.test_id('project_a')::text || '/candidates/31310000-0000-4000-8000-000000000001/';
$$;

CREATE FUNCTION pg_temp.q_mark (p_label text) RETURNS void LANGUAGE sql AS $$
  INSERT INTO q_base (label, id) SELECT p_label, coalesce(max(id), 0) FROM net.http_request_queue;
$$;

CREATE FUNCTION pg_temp.q_since (p_label text) RETURNS integer LANGUAGE sql AS $$
  SELECT count(*)::int FROM net.http_request_queue q WHERE q.id > (SELECT b.id FROM q_base b WHERE b.label = p_label);
$$;

CREATE FUNCTION pg_temp.set_image (p_image jsonb) RETURNS void LANGUAGE sql AS $$
  UPDATE public.candidates SET image = p_image WHERE id = '31310000-0000-4000-8000-000000000001';
$$;

-- A crafted OLD path, two steps: store the crafted path, re-baseline, then replace it with a fresh legitimate own-folder path. Only the second step is measured, so the only path that could be deleted is the crafted one.
CREATE FUNCTION pg_temp.replace_crafted (p_label text, p_crafted text) RETURNS integer LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_temp.set_image(jsonb_build_object('path', p_crafted));
  PERFORM pg_temp.q_mark(p_label);
  PERFORM pg_temp.set_image(jsonb_build_object('path', pg_temp.own_folder() || gen_random_uuid()::text || '.jpg'));
  RETURN pg_temp.q_since(p_label);
END;
$$;

-- D-20(a): shapes that START WITH the own folder, so confinement admits them and only the whitelist in delete_storage_object stands between them and a service-role URL.
SELECT
  is (
    pg_temp.replace_crafted (
      'dotdot',
      pg_temp.own_folder () || '../../../' || test_id ('project_b')::text || '/candidates/' || test_id ('candidate_b')::text || '/31310000-0000-4000-8000-0000000000c1.jpg'
    ),
    0,
    'D-20(a): an old path with a `..` segment inside the own folder enqueues nothing (pg_net would resolve it out of the folder)'
  );

SELECT
  is (
    pg_temp.replace_crafted (
      'query',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000c2.jpg?x=1'
    ),
    0,
    'D-20(a): an old path with a `?` query suffix enqueues nothing'
  );

SELECT
  is (
    pg_temp.replace_crafted (
      'fragment',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000c3.jpg#x'
    ),
    0,
    'D-20(a): an old path with a `#` fragment suffix enqueues nothing'
  );

SELECT
  is (
    pg_temp.replace_crafted (
      'percent',
      pg_temp.own_folder () || '%2e%2e/31310000-0000-4000-8000-0000000000c4.jpg'
    ),
    0,
    'D-20(a): an old path with a `%` escape (%2e%2e) enqueues nothing'
  );

SELECT
  is (
    pg_temp.replace_crafted (
      'backslash',
      pg_temp.own_folder () || '..\31310000-0000-4000-8000-0000000000c5.jpg'
    ),
    0,
    'D-20(a): an old path with a backslash enqueues nothing'
  );

SELECT
  is (
    pg_temp.replace_crafted (
      'space',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000c6 copy.jpg'
    ),
    0,
    'D-20(a): an old path with a space enqueues nothing'
  );

SELECT
  is (
    pg_temp.replace_crafted (
      'uppercase',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000C7.jpg'
    ),
    0,
    'D-20(a): an old path whose file uuid is uppercase enqueues nothing (canonical lowercase only)'
  );

SELECT
  is (
    pg_temp.replace_crafted (
      'trailing-slash',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000c8.jpg/'
    ),
    0,
    'D-20(a): an old path with a trailing slash enqueues nothing'
  );

SELECT
  is (
    pg_temp.replace_crafted (
      'seed-portrait',
      pg_temp.own_folder () || 'seed-portrait.jpg'
    ),
    0,
    'D-20(a): an old path with a non-uuid file name (seed-portrait.jpg) enqueues nothing'
  );

-- D-20(b): well-formed paths OUTSIDE the row's own folder. Each passes the whitelist, so only own-folder confinement in cleanup_old_image_file stops a candidate from deleting someone else's public photo.
SELECT
  is (
    pg_temp.replace_crafted (
      'other-project',
      test_id ('project_b')::text || '/candidates/31310000-0000-4000-8000-000000000001/31310000-0000-4000-8000-0000000000d1.jpg'
    ),
    0,
    'D-20(b): an old path in another project''s folder enqueues nothing'
  );

SELECT
  is (
    pg_temp.replace_crafted (
      'other-entity',
      test_id ('project_a')::text || '/candidates/' || test_id ('candidate_a')::text || '/31310000-0000-4000-8000-0000000000d2.jpg'
    ),
    0,
    'D-20(b): an old path in another entity''s folder (candidate_a) enqueues nothing'
  );

SELECT
  is (
    pg_temp.replace_crafted (
      'other-table',
      test_id ('project_a')::text || '/organizations/31310000-0000-4000-8000-000000000001/31310000-0000-4000-8000-0000000000d3.jpg'
    ),
    0,
    'D-20(b): an old path in another table''s folder (organizations) enqueues nothing'
  );

-- D-20(c): paths the NEW row still references are never deleted. X, Y, Z and W are legitimate own-folder objects.
SELECT
  pg_temp.set_image (
    jsonb_build_object(
      'path',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f1.jpg',
      'pathDark',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f2.png'
    )
  );

SELECT
  pg_temp.q_mark ('swap');

SELECT
  pg_temp.set_image (
    jsonb_build_object(
      'path',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f2.png',
      'pathDark',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f1.jpg'
    )
  );

SELECT
  is (
    pg_temp.q_since ('swap'),
    0,
    'D-20(c): a path/pathDark swap enqueues nothing (both objects are still referenced)'
  );

SELECT
  pg_temp.q_mark ('alt');

SELECT
  pg_temp.set_image (
    jsonb_build_object(
      'path',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f2.png',
      'pathDark',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f1.jpg',
      'alt',
      'Portrait'
    )
  );

SELECT
  is (
    pg_temp.q_since ('alt'),
    0,
    'D-20(c): an alt-only change enqueues nothing'
  );

SELECT
  pg_temp.q_mark ('two-delete');

SELECT
  pg_temp.set_image (
    jsonb_build_object(
      'path',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f3.webp'
    )
  );

SELECT
  is (
    pg_temp.q_since ('two-delete'),
    2,
    'D-20(c): a two-DELETE replacement ({path: X, pathDark: Y} -> {path: Z}) enqueues exactly two requests'
  );

SELECT
  is (
    (
      SELECT
        count(*)::int
      FROM
        net.http_request_queue q
      WHERE
        q.id > (
          SELECT
            b.id
          FROM
            q_base b
          WHERE
            b.label = 'two-delete'
        )
        AND q.method::text = 'DELETE'
        AND q.url IN (
          (
            SELECT
              value
            FROM
              public.storage_config
            WHERE
              key = 'supabase_url'
          ) || '/storage/v1/object/public-assets/' || pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f1.jpg',
          (
            SELECT
              value
            FROM
              public.storage_config
            WHERE
              key = 'supabase_url'
          ) || '/storage/v1/object/public-assets/' || pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f2.png'
        )
    ),
    2,
    'D-20(c): the two-DELETE replacement deletes exactly X and Y, one DELETE each'
  );

-- An image-type question in project A, so an answer may hold a stored photo in the shape validate_answers_jsonb accepts.
INSERT INTO
  public.questions (id, project_id, type, category_id, name)
VALUES
  (
    '31310000-0000-4000-8000-0000000000e1',
    test_id ('project_a'),
    'image',
    test_id ('question_category_a'),
    '{"en": "Photo"}'::jsonb
  );

SELECT
  pg_temp.q_mark ('into-answer');

UPDATE public.candidates
SET
  image = jsonb_build_object(
    'path',
    pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f4.gif'
  ),
  answers = jsonb_build_object(
    '31310000-0000-4000-8000-0000000000e1',
    jsonb_build_object(
      'value',
      jsonb_build_object(
        'path',
        pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f3.webp'
      )
    )
  )
WHERE
  id = '31310000-0000-4000-8000-000000000001';

SELECT
  is (
    pg_temp.q_since ('into-answer'),
    0,
    'D-20(c): a path moved into an answer (image Z -> W while an answer now holds Z) enqueues nothing'
  );

-- Direct calls as the owner: the whitelist lives in delete_storage_object itself, so it holds for any caller, not only for the triggers.
SELECT
  pg_temp.q_mark ('direct-crafted');

SELECT
  public.delete_storage_object (
    'public-assets',
    pg_temp.own_folder () || '../../../x.jpg'
  );

SELECT
  is (
    pg_temp.q_since ('direct-crafted'),
    0,
    'D-20(a): a direct owner call with a crafted `..` path enqueues nothing'
  );

SELECT
  pg_temp.q_mark ('direct-bucket');

SELECT
  public.delete_storage_object (
    'other-bucket',
    pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f5.jpg'
  );

SELECT
  is (
    pg_temp.q_since ('direct-bucket'),
    0,
    'D-20(a): a direct owner call on bucket other-bucket enqueues nothing, even with a whitelisted path'
  );

SELECT
  pg_temp.q_mark ('direct-private');

SELECT
  public.delete_storage_object (
    'private-assets',
    pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f6.avif'
  );

SELECT
  is (
    (
      SELECT
        count(*)::int
      FROM
        net.http_request_queue q
      WHERE
        q.id > (
          SELECT
            b.id
          FROM
            q_base b
          WHERE
            b.label = 'direct-private'
        )
        AND q.method::text = 'DELETE'
        AND q.url = (
          SELECT
            value
          FROM
            public.storage_config
          WHERE
            key = 'supabase_url'
        ) || '/storage/v1/object/private-assets/' || pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f6.avif'
    ),
    1,
    'D-11: a direct owner call on private-assets with a whitelisted path enqueues exactly one DELETE to /storage/v1/object/private-assets/<path>'
  );

-- =====================================================================
-- D-12: deleting an entity deletes every object in its OWN folder, one DELETE per object
-- =====================================================================
-- Storage never expands a folder prefix, so the AFTER DELETE trigger must enumerate the folder from `storage.objects` and send one single-object DELETE per name. The objects below are INSERTed straight into `storage.objects` as the owner (INSERT is allowed; only DELETE is blocked by `storage.protect_delete`), so no blob exists and none is needed: this file asserts the enqueued request, never the disappearance.
--
-- `obj_url` is the exact URL a single-object DELETE of `p_path` in `p_bucket` is sent to; `q_url_count` counts the DELETEs enqueued after a case's baseline whose URL matches a LIKE pattern.
CREATE FUNCTION pg_temp.obj_url (p_bucket text, p_path text) RETURNS text LANGUAGE sql AS $$
  SELECT (SELECT value FROM public.storage_config WHERE key = 'supabase_url') || '/storage/v1/object/' || p_bucket || '/' || p_path;
$$;

CREATE FUNCTION pg_temp.q_url_count (p_label text, p_url_pattern text) RETURNS integer LANGUAGE sql AS $$
  SELECT count(*)::int FROM net.http_request_queue q
  WHERE q.id > (SELECT b.id FROM q_base b WHERE b.label = p_label) AND q.method::text = 'DELETE' AND q.url LIKE p_url_pattern;
$$;

-- Candidate F owns two whitelisted objects in public-assets, one in private-assets and a stray `notes.txt`; candidate_a's folder holds a whitelisted object that must survive F's delete. Candidate E owns no object at all.
INSERT INTO
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '31310000-0000-4000-8000-000000000002',
    test_id ('project_a'),
    'Folder',
    'Owner'
  ),
  (
    '31310000-0000-4000-8000-000000000003',
    test_id ('project_a'),
    'Empty',
    'Folder'
  );

INSERT INTO
  storage.objects (id, bucket_id, name)
VALUES
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/candidates/31310000-0000-4000-8000-000000000002/31310000-0000-4000-8000-0000000001a1.jpg'
  ),
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/candidates/31310000-0000-4000-8000-000000000002/31310000-0000-4000-8000-0000000001a2.png'
  ),
  (
    gen_random_uuid(),
    'private-assets',
    test_id ('project_a')::text || '/candidates/31310000-0000-4000-8000-000000000002/31310000-0000-4000-8000-0000000001a3.jpg'
  ),
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/candidates/31310000-0000-4000-8000-000000000002/notes.txt'
  ),
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/candidates/' || test_id ('candidate_a')::text || '/31310000-0000-4000-8000-0000000001a4.jpg'
  );

SELECT
  pg_temp.q_mark ('folder-delete');

DELETE FROM public.candidates
WHERE
  id = '31310000-0000-4000-8000-000000000002';

SELECT
  is (
    pg_temp.q_since ('folder-delete'),
    3,
    'D-12: deleting a candidate enqueues exactly three requests for its folder of two public objects, one private object and one stray name'
  );

SELECT
  is (
    (
      SELECT
        count(*)::int
      FROM
        net.http_request_queue q
      WHERE
        q.id > (
          SELECT
            b.id
          FROM
            q_base b
          WHERE
            b.label = 'folder-delete'
        )
        AND q.method::text = 'DELETE'
        AND q.url IN (
          pg_temp.obj_url (
            'public-assets',
            test_id ('project_a')::text || '/candidates/31310000-0000-4000-8000-000000000002/31310000-0000-4000-8000-0000000001a1.jpg'
          ),
          pg_temp.obj_url (
            'public-assets',
            test_id ('project_a')::text || '/candidates/31310000-0000-4000-8000-000000000002/31310000-0000-4000-8000-0000000001a2.png'
          ),
          pg_temp.obj_url (
            'private-assets',
            test_id ('project_a')::text || '/candidates/31310000-0000-4000-8000-000000000002/31310000-0000-4000-8000-0000000001a3.jpg'
          )
        )
    ),
    3,
    'D-12: the three requests are one DELETE each of the two public-assets objects and the private-assets object, at their exact single-object URLs'
  );

SELECT
  is (
    pg_temp.q_url_count ('folder-delete', '%/notes.txt'),
    0,
    'D-12 + D-20: a non-whitelisted name inside the deleted folder (notes.txt) enqueues nothing (a leak, never a destroy)'
  );

SELECT
  is (
    pg_temp.q_url_count (
      'folder-delete',
      '%/candidates/' || test_id ('candidate_a')::text || '/%'
    ),
    0,
    'D-12: an object in another candidate''s folder enqueues nothing when a candidate is deleted'
  );

-- A constituency group whose table name carries `_`, a LIKE wildcard: `constituencyXgroups` would match `constituency_groups` under LIKE. The lookalike object must not be enumerated.
INSERT INTO
  public.constituency_groups (id, project_id)
VALUES
  (
    '31310000-0000-4000-8000-000000000011',
    test_id ('project_a')
  );

INSERT INTO
  storage.objects (id, bucket_id, name)
VALUES
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/constituency_groups/31310000-0000-4000-8000-000000000011/31310000-0000-4000-8000-0000000001b1.jpg'
  ),
  (
    gen_random_uuid(),
    'public-assets',
    test_id ('project_a')::text || '/constituencyXgroups/31310000-0000-4000-8000-000000000011/31310000-0000-4000-8000-0000000001b2.jpg'
  );

SELECT
  pg_temp.q_mark ('group-delete');

DELETE FROM public.constituency_groups
WHERE
  id = '31310000-0000-4000-8000-000000000011';

SELECT
  is (
    pg_temp.q_since ('group-delete'),
    1,
    'D-12: deleting a constituency group enqueues exactly one request'
  );

SELECT
  is (
    (
      SELECT
        count(*)::int
      FROM
        net.http_request_queue q
      WHERE
        q.id > (
          SELECT
            b.id
          FROM
            q_base b
          WHERE
            b.label = 'group-delete'
        )
        AND q.method::text = 'DELETE'
        AND q.url = pg_temp.obj_url (
          'public-assets',
          test_id ('project_a')::text || '/constituency_groups/31310000-0000-4000-8000-000000000011/31310000-0000-4000-8000-0000000001b1.jpg'
        )
    ),
    1,
    'D-12: that one request is the DELETE of the object in the group''s real folder, not of the constituencyXgroups lookalike'
  );

-- The lookalike name is also outside the whitelist, so the count above cannot tell `starts_with` from LIKE on its own; this reads the enumeration itself.
SELECT
  ok (
    coalesce(
      (
        SELECT
          p.prosrc ~ 'starts_with\s*\(\s*(\w+\.)?name\s*,\s*path_prefix\s*\)'
          AND p.prosrc !~* '\mLIKE\M'
        FROM
          pg_proc p
        WHERE
          p.oid = to_regprocedure('public.cleanup_entity_storage_files()')
      ),
      FALSE
    ),
    'D-12: cleanup_entity_storage_files enumerates with starts_with (name, path_prefix) and uses no LIKE (`_` in constituency_groups and question_categories is a LIKE wildcard)'
  );

SELECT
  pg_temp.q_mark ('empty-delete');

DELETE FROM public.candidates
WHERE
  id = '31310000-0000-4000-8000-000000000003';

SELECT
  is (
    pg_temp.q_since ('empty-delete'),
    0,
    'D-12: deleting a candidate that owns no object enqueues nothing'
  );

-- =====================================================================
-- D-13: an answer photo the row stops referencing is deleted, on replace, on key removal and on the question-delete cascade strip
-- =====================================================================
-- Only `candidates` and `organizations` carry `answers`. An answer holds a photo when its `value` is an object with `path` (and optionally `pathDark`), the StoredImage shape `validate_image` accepts. The trigger detects that SHAPE and never joins `questions`, because `cascade_question_delete_to_jsonb_answers` strips the key after the question row is already gone.
--
-- `q_exact` counts the DELETEs enqueued after a case's baseline at exactly the single-object URL of `p_path` in `p_bucket`; `ans` is the answer object that stores a photo at `p_path`; `set_answers` writes our candidate's `answers`.
CREATE FUNCTION pg_temp.q_exact (p_label text, p_bucket text, p_path text) RETURNS integer LANGUAGE sql AS $$
  SELECT count(*)::int FROM net.http_request_queue q
  WHERE q.id > (SELECT b.id FROM q_base b WHERE b.label = p_label) AND q.method::text = 'DELETE' AND q.url = pg_temp.obj_url(p_bucket, p_path);
$$;

CREATE FUNCTION pg_temp.ans (p_path text) RETURNS jsonb LANGUAGE sql AS $$
  SELECT jsonb_build_object('value', jsonb_build_object('path', p_path));
$$;

CREATE FUNCTION pg_temp.set_answers (p_answers jsonb) RETURNS void LANGUAGE sql AS $$
  UPDATE public.candidates SET answers = p_answers WHERE id = '31310000-0000-4000-8000-000000000001';
$$;

-- A category and two image questions of our own: e2 carries the replace and removal cases, e3 is deleted to exercise the cascade strip.
INSERT INTO
  public.question_categories (id, project_id, name)
VALUES
  (
    '31310000-0000-4000-8000-000000000021',
    test_id ('project_a'),
    '{"en": "Photos"}'::jsonb
  );

INSERT INTO
  public.questions (id, project_id, type, category_id, name)
VALUES
  (
    '31310000-0000-4000-8000-0000000000e2',
    test_id ('project_a'),
    'image',
    '31310000-0000-4000-8000-000000000021',
    '{"en": "Photo two"}'::jsonb
  ),
  (
    '31310000-0000-4000-8000-0000000000e3',
    test_id ('project_a'),
    'image',
    '31310000-0000-4000-8000-000000000021',
    '{"en": "Photo three"}'::jsonb
  );

-- Our candidate's answers now hold e1 (f3.webp, from the moved-into-answer case above), e2 at 2a1 and e3 at 2c1, all in its own folder.
SELECT
  pg_temp.set_answers (
    jsonb_build_object(
      '31310000-0000-4000-8000-0000000000e1',
      pg_temp.ans (
        pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f3.webp'
      ),
      '31310000-0000-4000-8000-0000000000e2',
      pg_temp.ans (
        pg_temp.own_folder () || '31310000-0000-4000-8000-0000000002a1.jpg'
      ),
      '31310000-0000-4000-8000-0000000000e3',
      pg_temp.ans (
        pg_temp.own_folder () || '31310000-0000-4000-8000-0000000002c1.jpg'
      )
    )
  );

SELECT
  pg_temp.q_mark ('ans-replace');

UPDATE public.candidates
SET
  answers = jsonb_set(
    answers,
    ARRAY['31310000-0000-4000-8000-0000000000e2'],
    pg_temp.ans (
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000002a2.jpg'
    )
  )
WHERE
  id = '31310000-0000-4000-8000-000000000001';

SELECT
  is (
    pg_temp.q_exact (
      'ans-replace',
      'public-assets',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000002a1.jpg'
    ),
    1,
    'D-13: replacing a candidate''s answer photo X with Y enqueues one DELETE of X at its exact single-object URL'
  );

SELECT
  is (
    pg_temp.q_since ('ans-replace'),
    1,
    'D-13: the answer-photo replace enqueues nothing else'
  );

SELECT
  pg_temp.q_mark ('ans-remove');

UPDATE public.candidates
SET
  answers = answers - '31310000-0000-4000-8000-0000000000e2'
WHERE
  id = '31310000-0000-4000-8000-000000000001';

SELECT
  is (
    pg_temp.q_exact (
      'ans-remove',
      'public-assets',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000002a2.jpg'
    ),
    1,
    'D-13: removing the answer key enqueues one DELETE of the removed photo'
  );

SELECT
  is (
    pg_temp.q_since ('ans-remove'),
    1,
    'D-13: the answer-key removal enqueues nothing else'
  );

SELECT
  pg_temp.q_mark ('ans-cascade');

DELETE FROM public.questions
WHERE
  id = '31310000-0000-4000-8000-0000000000e3';

SELECT
  is (
    pg_temp.q_exact (
      'ans-cascade',
      'public-assets',
      pg_temp.own_folder () || '31310000-0000-4000-8000-0000000002c1.jpg'
    ),
    1,
    'D-13: deleting the image question, whose cascade strips the answer key after the question row is gone, enqueues one DELETE of the stripped photo'
  );

SELECT
  is (
    pg_temp.q_since ('ans-cascade'),
    1,
    'D-13: the question-delete cascade enqueues nothing else (the question''s own folder is empty)'
  );

SELECT
  pg_temp.q_mark ('ans-unchanged');

UPDATE public.candidates
SET
  first_name = 'Unchanged answers'
WHERE
  id = '31310000-0000-4000-8000-000000000001';

SELECT
  is (
    pg_temp.q_since ('ans-unchanged'),
    0,
    'D-13: an UPDATE of another column that leaves answers unchanged enqueues nothing'
  );

-- The answer photo f3.webp moves into NEW `image` as the answer is removed, and the old image f4.gif stays referenced as pathDark: nothing is unreferenced.
SELECT
  pg_temp.q_mark ('ans-into-image');

UPDATE public.candidates
SET
  image = jsonb_build_object(
    'path',
    pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f3.webp',
    'pathDark',
    pg_temp.own_folder () || '31310000-0000-4000-8000-0000000000f4.gif'
  ),
  answers = answers - '31310000-0000-4000-8000-0000000000e1'
WHERE
  id = '31310000-0000-4000-8000-000000000001';

SELECT
  is (
    pg_temp.q_since ('ans-into-image'),
    0,
    'D-13: an old answer photo that NEW image now holds enqueues nothing'
  );

-- A foreign-folder OLD answer path, two steps as for the image: store it, re-baseline, replace it with an own-folder path.
SELECT
  pg_temp.set_answers (
    jsonb_build_object(
      '31310000-0000-4000-8000-0000000000e2',
      pg_temp.ans (
        test_id ('project_a')::text || '/candidates/' || test_id ('candidate_a')::text || '/31310000-0000-4000-8000-0000000002d1.jpg'
      )
    )
  );

SELECT
  pg_temp.q_mark ('ans-foreign');

SELECT
  pg_temp.set_answers (
    jsonb_build_object(
      '31310000-0000-4000-8000-0000000000e2',
      pg_temp.ans (
        pg_temp.own_folder () || '31310000-0000-4000-8000-0000000002d2.jpg'
      )
    )
  );

SELECT
  is (
    pg_temp.q_since ('ans-foreign'),
    0,
    'D-13 + D-20(b): an old answer path in another entity''s folder (candidate_a) enqueues nothing'
  );

-- An organization behaves as a candidate: its own folder is `<project>/organizations/<id>/`.
INSERT INTO
  public.organizations (id, project_id, answers)
VALUES
  (
    '31310000-0000-4000-8000-000000000031',
    test_id ('project_a'),
    jsonb_build_object(
      '31310000-0000-4000-8000-0000000000e2',
      pg_temp.ans (
        test_id ('project_a')::text || '/organizations/31310000-0000-4000-8000-000000000031/31310000-0000-4000-8000-0000000002e1.jpg'
      )
    )
  );

SELECT
  pg_temp.q_mark ('ans-org');

UPDATE public.organizations
SET
  answers = jsonb_build_object(
    '31310000-0000-4000-8000-0000000000e2',
    pg_temp.ans (
      test_id ('project_a')::text || '/organizations/31310000-0000-4000-8000-000000000031/31310000-0000-4000-8000-0000000002e2.jpg'
    )
  )
WHERE
  id = '31310000-0000-4000-8000-000000000031';

SELECT
  is (
    pg_temp.q_exact (
      'ans-org',
      'public-assets',
      test_id ('project_a')::text || '/organizations/31310000-0000-4000-8000-000000000031/31310000-0000-4000-8000-0000000002e1.jpg'
    ),
    1,
    'D-13: replacing an organization''s answer photo enqueues one DELETE under <project>/organizations/<id>/'
  );

SELECT
  is (
    pg_temp.q_since ('ans-org'),
    1,
    'D-13: the organization answer-photo replace enqueues nothing else'
  );

SELECT
  ok (
    coalesce(
      (
        SELECT
          p.prosrc !~* 'questions'
        FROM
          pg_proc p
        WHERE
          p.oid = to_regprocedure('public.cleanup_old_answer_files()')
      ),
      FALSE
    ),
    'D-13: cleanup_old_answer_files exists and never reads questions (detection is by value shape)'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
