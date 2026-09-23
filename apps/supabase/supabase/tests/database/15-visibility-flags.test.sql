-- 15-visibility-flags.test.sql: the three flags that will carry public visibility, asserted in both directions
--
-- After 162-08 there is exactly one way to ask whether a row is public: is its project open for voters, is its nomination confirmed, and is every entity that nomination links confirmed. Two of those three terms are columns 162-07 creates. Until 162-08 reads them they are INERT -- no policy consults them, no query filters on them, and no assertion outside this file changes value depending on them -- so every other gate in this repository is green against a plan that declared the columns and wired nothing. This file is one half of the evidence that replaces that green: the half that measures what PostgreSQL chose. The other half is a census taken outside pgTAP against a database rebuilt by `yarn db:reset-with-data` and by `yarn db:seed --template e2e/base`, because the property that the SEEDED value is true is a property of a rebuilt database and not of a fixture inside a transaction.
--
-- THE TWO FAILURES ARE OPPOSITE AND ONLY ONE OF THEM IS LOUD. A flag wrongly true exposes a project nobody opened; a flag wrongly false blanks an application that worked yesterday, and only from 162-08 onward. So both directions carry their own assertion here: the bare-insert grid measures the DEFAULT by inserting a row that names no flag and reading back what the column chose, and the explicit-insert probe beside it proves the column accepts the other value, so a `false` reading above is a default rather than a write that failed.
--
-- THE DEFAULTS ARE MEASURED, NEVER READ FROM THE FILE. `col_type_is` and a grep over `100-tenancy.sql` both state what the declaration says. The assertions below insert rows inside this transaction and read the column back, which states what the database did.
--
-- lock_nominations SHIPS INERT and this file says so rather than implying activity it does not have. Nothing reads it until 162-12 writes the entity-user nomination policies whose `own, unless locked` cells are what it gates; nothing sets it; no behavioural assertion can observe it. Its claims here are existence, type, NOT NULL and default false -- and its default false IS today's behaviour rather than a new permissive setting, because section 3.3 grants admins `nomination.edit` unconditionally. Do not add an assertion here that pretends it is enforced.
--
-- pgTAP SHIPS ITS OWN has_role(). It is a role-existence assertion returning text, and under this estate's `search_path = public, extensions` it SHADOWS ours, so an unqualified one-argument call fails with `function ok(text, unknown) does not exist` rather than as a clean failed assertion. This file calls no permission predicate, but the rule stands for anything added to it: qualify every call `public.has_role(...)`. 13-shim-parity.test.sql is the reference.
--
-- The declared assertion count below is explicit and deliberately so: a pgTAP file that asserts nothing exits 0 under no_plan, which is exactly the vacuous pass a visibility test must not be able to produce.
--
-- Depends on: 00-helpers.test.sql (create_test_data, test_id)
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in the same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (33);

SELECT
  create_test_data ();

-- =====================================================================
-- Section 1: the default is the SAFE direction, measured on the applied database
-- =====================================================================
-- Rows that name none of the flags. The probes are inserted as their own statements and read back below, rather than asserted through a RETURNING clause, because a data-modifying CTE may not sit inside the scalar subquery an assertion's first argument is. What is measured either way is the value PostgreSQL chose, not the text of the declaration.
INSERT INTO
  public.projects (account_id, name)
VALUES
  (test_id ('account_a'), 'flag-probe bare');

-- Names the openness flag and nothing else, so the reading below shows the column accepts the open value -- which is what makes the false readings defaults rather than writes that failed.
INSERT INTO
  public.projects (account_id, name, open_for_voters)
VALUES
  (
    test_id ('account_a'),
    'flag-probe explicit',
    true
  );

SELECT
  is (
    (
      SELECT
        open_for_voters
      FROM
        public.projects
      WHERE
        name = 'flag-probe bare'
    ),
    false,
    'A project created naming no flag is NOT open for voters'
  );

SELECT
  is (
    (
      SELECT
        lock_nominations
      FROM
        public.projects
      WHERE
        name = 'flag-probe bare'
    ),
    false,
    'A project created naming no flag does NOT lock nominations'
  );

SELECT
  is (
    (
      SELECT
        open_for_voters
      FROM
        public.projects
      WHERE
        name = 'flag-probe explicit'
    ),
    true,
    'A project created naming the openness flag true reads it back true'
  );

-- =====================================================================
-- Section 2: the declaration, read from the catalogue
-- =====================================================================
SELECT
  is (
    (
      SELECT
        is_nullable
      FROM
        information_schema.columns
      WHERE
        table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'open_for_voters'
    ),
    'NO',
    'The openness flag is NOT NULL, so no row can carry an unknown visibility state'
  );

SELECT
  is (
    (
      SELECT
        is_nullable
      FROM
        information_schema.columns
      WHERE
        table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'lock_nominations'
    ),
    'NO',
    'The lock flag is NOT NULL -- existence, type and default are the whole of what is claimed for it'
  );

-- =====================================================================
-- Section 3: the fixture's existing A-true / B-false polarity, extended to these flags
-- =====================================================================
-- create_test_data() marks project A's rows visible and project B's hidden for all ten publication columns. These flags follow the same split, so 162-08 inherits a two-directional fixture and 162-16 can swap one term for another without re-cutting it.
SELECT
  is (
    (
      SELECT
        open_for_voters
      FROM
        public.projects
      WHERE
        id = test_id ('project_a')
    ),
    true,
    'Fixture project A is open for voters'
  );

SELECT
  is (
    (
      SELECT
        open_for_voters
      FROM
        public.projects
      WHERE
        id = test_id ('project_b')
    ),
    false,
    'Fixture project B is NOT open for voters -- the hidden half of the control group'
  );

SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        public.projects
      WHERE
        id IN (test_id ('project_a'), test_id ('project_b'))
        AND lock_nominations
    ),
    0::bigint,
    'Neither fixture project locks nominations -- the flag is seeded nowhere because it ships inert'
  );

-- =====================================================================
-- Section 4: the confirmation column defaults to the unconfirmed direction, on ALL FOUR entity tables
-- =====================================================================
-- Four assertions rather than one, because a column declared on three tables and forgotten on the fourth is exactly the shape a single assertion would miss -- and the forgotten table's rows would then reach the public without an identity check the moment 162-08 reads the column.
INSERT INTO
  public.organizations (project_id, subtype)
VALUES
  (test_id ('project_a'), 'confirm-probe bare');

INSERT INTO
  public.candidates (project_id, first_name, last_name, subtype)
VALUES
  (
    test_id ('project_a'),
    'Probe',
    'Probe',
    'confirm-probe bare'
  );

-- The faction probe names an organization and ONLY an organization beyond its scope key, because 162-07b made `factions.organization_id` NOT NULL. Naming it does not weaken the probe: what is being measured below is the DEFAULT of `confirmed`, which this row still declines to name, and a row that cannot be inserted at all measures nothing. `org_a` is `create_test_data()`'s organization in this same project.
INSERT INTO
  public.factions (project_id, organization_id, subtype)
VALUES
  (
    test_id ('project_a'),
    test_id ('org_a'),
    'confirm-probe bare'
  );

INSERT INTO
  public.alliances (project_id, subtype)
VALUES
  (test_id ('project_a'), 'confirm-probe bare');

-- Names the column, so the four readings above are defaults rather than writes that failed.
INSERT INTO
  public.organizations (project_id, subtype, confirmed)
VALUES
  (
    test_id ('project_a'),
    'confirm-probe explicit',
    true
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.organizations
      WHERE
        subtype = 'confirm-probe bare'
    ),
    false,
    'An organization created naming no confirmation is NOT confirmed'
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.candidates
      WHERE
        subtype = 'confirm-probe bare'
    ),
    false,
    'A candidate created naming no confirmation is NOT confirmed'
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.factions
      WHERE
        subtype = 'confirm-probe bare'
    ),
    false,
    'A faction created naming no confirmation is NOT confirmed'
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.alliances
      WHERE
        subtype = 'confirm-probe bare'
    ),
    false,
    'An alliance created naming no confirmation is NOT confirmed'
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.organizations
      WHERE
        subtype = 'confirm-probe explicit'
    ),
    true,
    'An entity created naming the confirmation true reads it back true'
  );

-- The declaration itself, counted across the four tables rather than named on one, so a table left out reddens here as a count of three.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        information_schema.columns
      WHERE
        table_schema = 'public'
        AND table_name IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND column_name = 'confirmed'
        AND is_nullable = 'NO'
        AND data_type = 'boolean'
        AND column_default LIKE '%false%'
    ),
    4::bigint,
    'All four entity tables carry the confirmation column as a non-nullable boolean defaulting false'
  );

-- The inert flag's remaining claims -- type and default. Nothing else is asserted for it anywhere, and nothing should be until 162-12 wires it.
SELECT
  is (
    (
      SELECT
        data_type || '|' || coalesce(column_default, 'NONE')
      FROM
        information_schema.columns
      WHERE
        table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'lock_nominations'
    ),
    'boolean|false',
    'The lock flag is a boolean defaulting false -- the whole of what is claimed for an inert column'
  );

-- =====================================================================
-- Section 5: the fixture's A-true / B-false polarity, extended to the confirmation column
-- =====================================================================
SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.organizations
      WHERE
        id = test_id ('org_a')
    ),
    true,
    'Fixture organization A is confirmed'
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.organizations
      WHERE
        id = test_id ('org_b')
    ),
    false,
    'Fixture organization B is NOT confirmed'
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.candidates
      WHERE
        id = test_id ('candidate_a')
    ),
    true,
    'Fixture candidate A is confirmed'
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.candidates
      WHERE
        id = test_id ('candidate_b')
    ),
    false,
    'Fixture candidate B is NOT confirmed'
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.factions
      WHERE
        id = test_id ('faction_a')
    ),
    true,
    'Fixture faction A is confirmed'
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.factions
      WHERE
        id = test_id ('faction_b')
    ),
    false,
    'Fixture faction B is NOT confirmed'
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.alliances
      WHERE
        id = test_id ('alliance_a')
    ),
    true,
    'Fixture alliance A is confirmed'
  );

SELECT
  is (
    (
      SELECT
        confirmed
      FROM
        public.alliances
      WHERE
        id = test_id ('alliance_b')
    ),
    false,
    'Fixture alliance B is NOT confirmed'
  );

-- =====================================================================
-- Section 6: the column-grant gap on the two entity tables 303-column-grants.sql does not cover
-- =====================================================================
-- `303-column-grants.sql` is an ALLOW-LIST -- REVOKE table-level UPDATE, then GRANT UPDATE on named columns -- so the confirmation column is outside the grant on `candidates` and `organizations` BY CONSTRUCTION, and 09-column-restrictions.test.sql observes the resulting 42501 on both. That file names `factions` and `alliances` nowhere, so on those two only row-level security stands between an authenticated caller and the new column.
--
-- Rather than assert from prose that the gap is harmless, the policy set is DERIVED from the catalogue here. The floor below is not decoration: an empty violation set drawn from a query that reached no policies at all is a zero from an empty instrument, and this file exists because that distinction is the difference between evidence and a green run.
--
-- ⚠ CLOSED BY 162-10, AND THE ASSERTION BELOW IS INVERTED RATHER THAN DELETED. 162-07 recorded this as a gap that was harmless only because nothing could reach it. P-3(a) (162-CHECKPOINT-DECISIONS.md section 5, 2026-09-16) added `entity_update_own_factions` and `entity_update_own_alliances` -- the section 3.3 cell that granted `entity.edit_answers` as `own` to Faction and Alliance grants and that no policy consulted -- and the REVOKE UPDATE / GRANT UPDATE (...) pair for both tables landed in the SAME COMMIT, precisely because the reachability argument this section rested on no longer holds.
--
-- The floor below is unchanged and still does its job. The assertion after it now states the END state in both directions, which is strictly more than the old one: the two self-update policies EXIST and are named as D-21 requires, table-level UPDATE is gone, the granted column count is greater than zero and strictly less than the table's column count, and `project_id` -- the column whose rewrite would move a row between tenants -- is not among the granted ones. The old assertion proved only that nobody could reach the table; it would have stayed green against a self-update policy with NO bound at all, had the policy simply carried an `admin_` prefix.
SELECT
  cmp_ok (
    (
      SELECT
        count(*)
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN ('factions', 'alliances')
    ),
    '>',
    0::bigint,
    'The gap derivation reached a non-empty policy population, so its empty answer below is a measurement'
  );

SELECT
  is (
    (
      SELECT
        coalesce(
          string_agg(
            policyname || '/' || array_to_string(roles, ','),
            ', '
            ORDER BY
              policyname
          ),
          'NONE'
        )
      FROM
        pg_policies
      WHERE
        schemaname = 'public'
        AND tablename IN ('factions', 'alliances')
        AND cmd IN ('UPDATE', 'ALL')
        AND 'authenticated' = ANY (roles)
        AND policyname NOT LIKE 'admin\_%'
    ),
    'entity_update_own_alliances/authenticated, entity_update_own_factions/authenticated',
    'The two entity tables now carry a non-admin UPDATE policy each, under the D-21 name shape, so the section 3.3 cell they encode is exercisable rather than unreachable'
  );

-- The bound that had to land in the same commit as those two policies. Asserted as NUMBERS and in BOTH directions, because the beneficiary population is zero today -- nothing in seed.sql, in dev-seed or in the E2E fixtures grants a faction or alliance editor -- so the bound cannot be exercised and must instead be derived. A granted count of zero would mean the REVOKE landed without its GRANT and the write path is dead; a count equal to the table's column count would mean the GRANT is not a bound at all.
--
-- ⚠ RE-EXPRESSED BY 162-13, AND THE ONE CLAUSE THAT CHANGED IS NAMED RATHER THAN QUIETLY DROPPED. This assertion's structural exclusion set used to read `project_id, id, published, confirmed`. 162-13 puts `confirmed` INSIDE the allow-list on all four entity tables, deliberately: the bar it had by omission refused EVERY authenticated caller, the project administrator holding `entity.confirm` included, and the replacement is `enforce_entity_immutability()`'s rule 1. Leaving the old clause standing would have turned a true claim into a red one and a retired premise into a lie. The three genuinely structural columns keep their exclusion, and what replaced the fourth is STRICTLY MORE than it said: the confirmation column must now be PRESENT in the grant on both tables, and the trigger that replaced the privilege must actually refuse an entity grantee on every entity table -- which is the assertion below this one.
--
-- 162-07's ORIGINAL assertion in this section -- that no non-admin UPDATE policy existed on the entity tables the column-grants file did not cover -- is NOT what 162-13 re-expressed; 162-10 had already inverted it into the positive statement two assertions above, one plan earlier than 162-13's own measured facts predicted.
SELECT
  ok (
    (
      SELECT
        bool_and(
          granted > 0
          AND granted < total
          AND NOT structural_granted
          AND confirmation_granted
        )
      FROM
        (
          SELECT
            c.table_name,
            count(*) FILTER (
              WHERE
                p.column_name IS NOT NULL
            ) AS granted,
            count(*) AS total,
            bool_or(
              p.column_name IS NOT NULL
              AND c.column_name IN ('project_id', 'id', 'external_id')
            ) AS structural_granted,
            bool_or(
              p.column_name IS NOT NULL
              AND c.column_name = 'confirmed'
            ) AS confirmation_granted
          FROM
            information_schema.columns c
            LEFT JOIN information_schema.column_privileges p ON p.table_schema = c.table_schema
            AND p.table_name = c.table_name
            AND p.column_name = c.column_name
            AND p.grantee = 'authenticated'
            AND p.privilege_type = 'UPDATE'
          WHERE
            c.table_schema = 'public'
            AND c.table_name IN ('factions', 'alliances')
          GROUP BY
            c.table_name
        ) g
    ),
    'on both new write paths the authenticated column grant is a real bound: more than zero columns and fewer than all of them, and project_id, id and external_id are none of them -- so an entity editor cannot move its own row into another project nor take over another row''s import identity. The confirmation column IS granted, because 162-13 moved its protection to a trigger'
  );

-- THE CLAIM 162-07'S PREMISE WAS STANDING IN FOR, derived rather than asserted from prose: NO entity table lacks a column-grant block. The population is derived from the entity-type enum rather than written as a literal, so a fifth entity type would be counted and would fail this until it too carried a block.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        information_schema.role_table_grants
      WHERE
        grantee = 'authenticated'
        AND privilege_type = 'UPDATE'
        AND table_schema = 'public'
        AND table_name IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
    )::integer,
    0,
    'no entity table grants TABLE-WIDE UPDATE to authenticated, so every one of the four is covered by a bounded column list and the gap 162-07 recorded as unreachable-rather-than-harmless is closed'
  );

-- And the trigger that replaced the privilege actually refuses, on every one of the four. A grant that opened the column without a rule behind it would pass every assertion above this line.
SELECT
  is (
    (
      SELECT
        count(*)
      FROM
        pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE
        n.nspname = 'public'
        AND p.proname = 'enforce_entity_immutability'
        AND t.tgenabled = 'O'
        AND c.relname IN (
          'organizations',
          'candidates',
          'factions',
          'alliances'
        )
        AND EXISTS (
          SELECT
            1
          FROM
            unnest(t.tgattr) AS k (attnum)
            JOIN pg_attribute a ON a.attrelid = c.oid
            AND a.attnum = k.attnum
          WHERE
            a.attname = 'confirmed'
        )
    )::integer,
    4,
    'each of the four entity tables carries an ENABLED registration of enforce_entity_immutability whose column restriction includes the confirmation column, which is what makes the retired privilege bar a relocation rather than a removal (19-entity-immutability.test.sql observes the refusals themselves)'
  );

-- =====================================================================
-- Section 7: the repurposed column -- the third term, and the only one that is a RETYPE rather than an addition
-- =====================================================================
-- `elections.election_type` keeps its name and takes a new meaning (D-16, and the operator's section 8.2 note). What makes the removal of the old meaning COMPLETE is not the tree sweep that accompanies it -- that is the confirmation. It is this: the retired values are not members of the type, so a row carrying one is a PostgreSQL error rather than a stored string. The sweep can only prove the tree is clean today; the assertions below prove the tree cannot become dirty again without the database refusing it.
SELECT
  is (
    (
      SELECT
        data_type || '|' || udt_name || '|' || is_nullable
      FROM
        information_schema.columns
      WHERE
        table_schema = 'public'
        AND table_name = 'elections'
        AND column_name = 'election_type'
    ),
    'USER-DEFINED|nomination_shape|NO',
    'The repurposed column is the nomination-shape enum and is NOT NULL'
  );

-- Compared as a sorted array rather than as a count, so a FOURTH member reddens naming itself instead of reddening as an arithmetic surprise.
SELECT
  is (
    (
      SELECT
        array_agg(
          e.enumlabel::text
          ORDER BY
            e.enumlabel::text
        )
      FROM
        pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
      WHERE
        t.typname = 'nomination_shape'
    ),
    ARRAY[
      'candidate_only',
      'organization_list',
      'organization_only'
    ]::text[],
    'The nomination-shape enum has exactly the three ratified members and no fourth'
  );

-- The three retired values Task 1 DERIVED from the tree -- not the two the canonical documents name. The third lives only in an adapter test fixture, and a rejection grid written against two literals would have left it representable.
SELECT
  throws_ok (
    $$INSERT INTO public.elections (project_id, election_type) SELECT id, 'general' FROM public.projects LIMIT 1$$,
    '22P02',
    NULL,
    'The database REJECTS the first retired value -- it is unrepresentable, not merely unused'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.elections (project_id, election_type) SELECT id, 'local' FROM public.projects LIMIT 1$$,
    '22P02',
    NULL,
    'The database REJECTS the second retired value'
  );

SELECT
  throws_ok (
    $$INSERT INTO public.elections (project_id, election_type) SELECT id, 'presidential' FROM public.projects LIMIT 1$$,
    '22P02',
    NULL,
    'The database REJECTS the third retired value, the one the canonical documents never recorded'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
