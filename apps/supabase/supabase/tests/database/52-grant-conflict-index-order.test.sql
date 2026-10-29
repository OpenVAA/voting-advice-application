-- 52-grant-conflict-index-order.test.sql: an exact duplicate grant is told from a second candidate editor whichever unique index PostgreSQL probes first
--
-- public.grants carries two unique indexes that an exact duplicate of a candidate's editor grant violates at once: the table's own key, grants_user_scope_target_role_key, and the partial idx_grants_one_candidate_editor. PostgreSQL probes a table's unique indexes in the order of their OIDs and reports the first one that fails. On a freshly built database the table's key comes first, but nothing guarantees that: rebuilding the constraint gives its index a new, larger OID. This file rebuilds it, inside its own transaction, so that the partial index is probed first, and then asserts that the two writers of a grant still tell "this grant already exists" from "another user edits this candidate":
--
-- - the statement the identity-callback Edge Function sends through PostgREST, an insert with ON CONFLICT on the grant's key and DO NOTHING;
-- - claim_invitations, which marks an invitation claimed when its user already holds the promised grant, and skips it with `candidate_has_editor` when another user edits the candidate.
--
-- Depends on:
-- - 00-helpers.test.sql (create_test_data, test_id, set_test_user, reset_role)
-- - 300-auth-tables.sql (public.grants and its two unique indexes)
-- - 305-invitations.sql and 506-invitation-rpcs.sql (public.invitations, claim_invitations)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (9);

SELECT
  create_test_data ();

-- Project A allows the email mode for candidates, so its candidate invitations are matched by the claim.
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

-- Three users: one already edits the first candidate, one edits the second, and one is invited to the second.
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
    '52520000-0000-4000-8000-0000000000e1',
    '00000000-0000-0000-0000-000000000000',
    'order.held@test.example',
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
    '52520000-0000-4000-8000-0000000000e2',
    '00000000-0000-0000-0000-000000000000',
    'order.editor@test.example',
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
    '52520000-0000-4000-8000-0000000000e3',
    '00000000-0000-0000-0000-000000000000',
    'order.invited@test.example',
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
  public.candidates (id, project_id, first_name, last_name)
VALUES
  (
    '52520000-0000-4000-8000-0000000000c1',
    test_id ('project_a'),
    'Order',
    'One'
  ),
  (
    '52520000-0000-4000-8000-0000000000c2',
    test_id ('project_a'),
    'Order',
    'Two'
  );

INSERT INTO
  public.grants (user_id, scope, target_type, target_id, role)
VALUES
  (
    '52520000-0000-4000-8000-0000000000e1',
    'entity',
    'candidate',
    '52520000-0000-4000-8000-0000000000c1',
    'editor'
  ),
  (
    '52520000-0000-4000-8000-0000000000e2',
    'entity',
    'candidate',
    '52520000-0000-4000-8000-0000000000c2',
    'editor'
  );

-- An invitation for the grant its user already holds, and one for a candidate another user edits.
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
    test_id ('project_a'),
    'entity',
    'candidate',
    '52520000-0000-4000-8000-0000000000c1',
    'editor',
    'order.held@test.example'
  ),
  (
    test_id ('project_a'),
    'entity',
    'candidate',
    '52520000-0000-4000-8000-0000000000c2',
    'editor',
    'order.invited@test.example'
  );

-- =====================================================================
-- Section 1: the partial index is probed first
-- =====================================================================
ALTER TABLE public.grants
DROP CONSTRAINT grants_user_scope_target_role_key;

ALTER TABLE public.grants
ADD CONSTRAINT grants_user_scope_target_role_key UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role);

SELECT
  ok (
    (
      SELECT
        oid
      FROM
        pg_class
      WHERE
        relname = 'idx_grants_one_candidate_editor'
    ) < (
      SELECT
        oid
      FROM
        pg_class
      WHERE
        relname = 'grants_user_scope_target_role_key'
    ),
    'premise: after the rebuild the candidate-editor index has the smaller OID'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES ('52520000-0000-4000-8000-0000000000e1', 'entity', 'candidate', '52520000-0000-4000-8000-0000000000c1', 'editor')$$,
    '23505',
    'duplicate key value violates unique constraint "idx_grants_one_candidate_editor"',
    'premise: a plain insert of an exact duplicate grant is now refused naming the candidate-editor index'
  );

-- =====================================================================
-- Section 2: the Edge Function's insert
-- =====================================================================
SELECT
  lives_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES ('52520000-0000-4000-8000-0000000000e1', 'entity', 'candidate', '52520000-0000-4000-8000-0000000000c1', 'editor')
      ON CONFLICT (user_id, scope, target_type, target_id, role) DO NOTHING$$,
    'an insert with ON CONFLICT on the grant key does nothing for an exact duplicate'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
      VALUES ('52520000-0000-4000-8000-0000000000e3', 'entity', 'candidate', '52520000-0000-4000-8000-0000000000c1', 'editor')
      ON CONFLICT (user_id, scope, target_type, target_id, role) DO NOTHING$$,
    '23505',
    'duplicate key value violates unique constraint "idx_grants_one_candidate_editor"',
    'and still refuses a second user''s editor grant on the candidate'
  );

-- =====================================================================
-- Section 3: claim_invitations
-- =====================================================================
SELECT
  set_test_user (
    'authenticated',
    '52520000-0000-4000-8000-0000000000e1',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[{"scope":"entity","target_type":"candidate","target_id":"52520000-0000-4000-8000-0000000000c1","role":"editor"}],"skipped":[],"password_set":false}'::jsonb,
    'an invitation for a grant its user already holds is claimed'
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
        g.target_id = '52520000-0000-4000-8000-0000000000c1'
    ),
    1,
    'and the candidate still has one grant'
  );

SELECT
  is (
    (
      SELECT
        i.claimed_by
      FROM
        public.invitations i
      WHERE
        i.target_id = '52520000-0000-4000-8000-0000000000c1'
    ),
    '52520000-0000-4000-8000-0000000000e1'::uuid,
    'and the invitation is stamped with its claimant'
  );

SELECT
  set_test_user (
    'authenticated',
    '52520000-0000-4000-8000-0000000000e3',
    '[]'::jsonb
  );

SELECT
  is (
    public.claim_invitations (test_id ('project_a')),
    '{"claimed":[],"skipped":[{"scope":"entity","target_type":"candidate","target_id":"52520000-0000-4000-8000-0000000000c2","role":"editor","reason":"candidate_has_editor"}],"password_set":false}'::jsonb,
    'an invitation for a candidate another user edits is skipped with the reason candidate_has_editor'
  );

SELECT
  reset_role ();

SELECT
  is (
    (
      SELECT
        string_agg(g.user_id::text, ',')
      FROM
        public.grants g
      WHERE
        g.target_id = '52520000-0000-4000-8000-0000000000c2'
    ),
    '52520000-0000-4000-8000-0000000000e2',
    'and that candidate keeps its one editor'
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
