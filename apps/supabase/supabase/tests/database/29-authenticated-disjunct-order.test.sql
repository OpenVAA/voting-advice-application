-- 29-authenticated-disjunct-order.test.sql: the five authenticated entity/nomination SELECT policies evaluate their disjuncts in the measured order
--
-- THIS FILE HOLDS AN EVALUATION ORDER, NOT A BOOLEAN. PostgreSQL evaluates the arguments of an OR left to right and stops at the first TRUE, so two quals that admit exactly the same rows can cost very different amounts. `authenticated_select_candidates`, `_organizations`, `_factions`, `_alliances` and `_nominations` each OR together project authority, the table's public assembly and entity authority, and this file asserts that the applied quals read them in that order and in no other.
--
-- THE RULE IS 162.1 D-01, VARIANT B: project authority first, then the public assembly, then entity authority. Project authority first so an admin exits on the first call; the public assembly second so a publicly visible row never pays the SECURITY DEFINER entity `user_can` calls; entity authority last. Spike 028 measured it at municipal scale (36,056 candidates): a signed-in candidate's whole-municipal read went from 7.15 s to 4.65 s against the 8 s authenticated statement timeout, an admin's stayed at 1.30 s, and a caller with no grant went from 4.3-4.8 s to 3.8 s. The same spike proved the reorder row-identical (visible sets EXCEPT ALL in both directions and a 2,120-probe truth grid, 0 differences each).
--
-- WHY THIS MONITOR IS STRUCTURAL AND NOT A TIMING CELL. A timing assertion would need spike 026's 36k-candidate fixture and a host gated on load average, and a test that can go red because the machine is busy is a flaky test, which this project does not accept. So the order is asserted from `pg_policies.qual` on the applied database, and spike 028's measured numbers remain the recorded timing evidence. It was observed RED on the shipped order and on variant A (public first) before the reorder landed, and is GREEN only on variant B.
--
-- WHY THIS IS A NEW FILE. 162-17's guard perturbations G8A and G8B have recorded reds in 16-anon-visibility.test.sql and 25-matrix-conformance.test.sql that are identified by assertion NUMBER, so an assertion inserted into either file would move them. A new file moves nothing.
--
-- THE POPULATION IS DERIVED, NEVER NAMED. It is every authenticated SELECT policy in `public` whose qual carries all three tokens `user_can('project'`, `project_open_for_voters(` and `user_can('entity'`, so a sixth policy of the same shape is order-checked automatically, and the census pins that population to exactly the five tables so a policy that drops out of the shape reddens it instead of silently leaving the check.
--
-- Depends on: nothing beyond pgTAP -- it reads only the `pg_policies` catalogue, so it calls no create_test_data ().
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
    'every authenticated entity/nomination SELECT policy evaluates project authority, then the public assembly, then entity authority (162.1 D-01, variant B)'
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
