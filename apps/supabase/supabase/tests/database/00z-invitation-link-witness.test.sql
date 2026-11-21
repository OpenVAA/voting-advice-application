-- 00z-invitation-link-witness.test.sql: installs the test-only completion witness of a link request and the test-only listing of identity registrations
--
-- No migration installs `private.invitation_link_witness`, its two functions or `public.test_identity_registrations`: they are test instruments, kept in ../fixtures/invitation-link-witness.psql. Its name sorts after 00-helpers.test.sql, which creates pgTAP, and before every file that reads the witness, in byte order and in a locale order alike. It applies that fixture outside a transaction, so every later file finds the witness, as the E2E harness's database does. pg_prove runs a file through psql, so the include resolves next to this file in the mounted supabase/tests directory. Prettier cannot parse the psql include, so this file is listed in .prettierignore.
\ir ../fixtures/invitation-link-witness.psql

SET
  search_path = public,
  extensions;

DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (4);

SELECT
  has_table (
    'private',
    'invitation_link_witness',
    'the fixture installs the witness table'
  );

SELECT
  is (
    (
      SELECT
        string_agg(
          p.proname || ' ' || has_function_privilege('anon', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text || '/' || has_function_privilege('service_role', p.oid, 'EXECUTE')::text,
          ', '
          ORDER BY
            p.proname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.proname LIKE 'invitation\_link\_witness%'
    ),
    'invitation_link_witness false/false/true, invitation_link_witness_open false/false/true',
    'the fixture installs the two witness functions, executable by service_role alone'
  );

SELECT
  has_function (
    'public',
    'test_identity_registrations',
    ARRAY['uuid[]'],
    'the fixture installs the listing of identity registrations'
  );

SELECT
  is (
    has_function_privilege('anon', 'public.test_identity_registrations(uuid[])', 'EXECUTE')::text || '/' || has_function_privilege('authenticated', 'public.test_identity_registrations(uuid[])', 'EXECUTE')::text || '/' || has_function_privilege('service_role', 'public.test_identity_registrations(uuid[])', 'EXECUTE')::text,
    'false/false/true',
    'the listing of identity registrations is executable by service_role alone, not by anon'
  );

SELECT
  *
FROM
  finish ();
