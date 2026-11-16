-- 29-authenticated-disjunct-order.test.sql: the five authenticated entity/nomination SELECT policies evaluate their disjuncts in a fixed order
--
-- This file asserts an evaluation order, not a boolean. PostgreSQL evaluates the arguments of an OR left to right and stops at the first TRUE, so two quals that admit the same rows can cost very different amounts. `authenticated_select_candidates`, `_organizations`, `_factions`, `_alliances` and `_nominations` each OR together project authority, the table's public assembly and entity authority, and the applied quals must read them in that order.
--
-- Project authority comes first so an admin exits on the first call, and the public assembly second so a publicly visible row never pays for the SECURITY DEFINER entity `user_can` calls. Entity authority comes last.
--
-- The order is asserted from `pg_policies.qual` on the applied database rather than by timing. A timing assertion would need a municipal-scale fixture and an idle host, and a test that fails because the machine is busy is a flaky test.
--
-- The population is derived, never named: every authenticated SELECT policy in `public` whose qual carries all three tokens `user_can('project'`, `project_open_for_voters(` and `user_can('entity'`. A sixth policy of the same shape is checked automatically, and the census pins the population to exactly the five tables, so a policy that drops out of the shape fails the census instead of silently leaving the check.
--
-- Depends on: nothing beyond pgTAP. It reads only the `pg_policies` catalogue and calls no create_test_data ().
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (7);

-- The three tokens are the deparsed spellings `pg_policies.qual` carries (no space before the parenthesis), and each occurs in exactly one top-level disjunct of each of the five quals.
CREATE TEMP VIEW d01_disjunct_order AS
SELECT
  tablename,
  policyname,
  position('user_can(''project''' IN qual) AS project_at,
  position('project_open_for_voters(' IN qual) AS public_at,
  position('user_can(''entity''' IN qual) AS entity_at,
  (
    position('user_can(''project''' IN qual) < position('project_open_for_voters(' IN qual)
    AND position('project_open_for_voters(' IN qual) < position('user_can(''entity''' IN qual)
  ) AS order_holds
FROM
  pg_policies
WHERE
  schemaname = 'public'
  AND cmd = 'SELECT'
  AND 'authenticated' = ANY (roles)
  AND position('user_can(''project''' IN qual) > 0
  AND position('project_open_for_voters(' IN qual) > 0
  AND position('user_can(''entity''' IN qual) > 0;

-- 1. The census: the derived population is exactly the five tables.
SELECT
  is (
    (
      SELECT
        string_agg(
          tablename,
          ','
          ORDER BY
            tablename
        )
      FROM
        d01_disjunct_order
    ),
    'alliances,candidates,factions,nominations,organizations',
    'census: the authenticated SELECT policies carrying project authority, the public assembly and entity authority are exactly those of the five entity/nomination tables -- derived from pg_policies, never named'
  );

-- 2. The aggregate, population pinned as `x/y` so a clean answer cannot come from an empty set.
SELECT
  is (
    (
      SELECT
        count(*) FILTER (
          WHERE
            order_holds
        )::text || '/' || count(*)::text
      FROM
        d01_disjunct_order
    ),
    '5/5',
    'every authenticated entity/nomination SELECT policy evaluates project authority, then the public assembly, then entity authority'
  );

-- 3-7. One line per table, so a red names the policy that moved.
SELECT
  ok (
    COALESCE(
      (
        SELECT
          order_holds
        FROM
          d01_disjunct_order
        WHERE
          tablename = 'alliances'
          AND policyname = 'authenticated_select_alliances'
      ),
      false
    ),
    'authenticated_select_alliances: project authority, then the public assembly, then entity authority'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          order_holds
        FROM
          d01_disjunct_order
        WHERE
          tablename = 'candidates'
          AND policyname = 'authenticated_select_candidates'
      ),
      false
    ),
    'authenticated_select_candidates: project authority, then the public assembly, then entity authority'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          order_holds
        FROM
          d01_disjunct_order
        WHERE
          tablename = 'factions'
          AND policyname = 'authenticated_select_factions'
      ),
      false
    ),
    'authenticated_select_factions: project authority, then the public assembly, then entity authority'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          order_holds
        FROM
          d01_disjunct_order
        WHERE
          tablename = 'nominations'
          AND policyname = 'authenticated_select_nominations'
      ),
      false
    ),
    'authenticated_select_nominations: project authority, then the public assembly, then entity authority'
  );

SELECT
  ok (
    COALESCE(
      (
        SELECT
          order_holds
        FROM
          d01_disjunct_order
        WHERE
          tablename = 'organizations'
          AND policyname = 'authenticated_select_organizations'
      ),
      false
    ),
    'authenticated_select_organizations: project authority, then the public assembly, then entity authority'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
