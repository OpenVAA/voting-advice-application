-- 45-registration-mode-matrix.test.sql: the truth table of the registration-mode rule
--
-- WHAT IS PINNED. One rule decides whether entities of a type may register with a mode, and it is written twice: in SQL as private.registration_mode_allowed_in, which the database asks before it honours an invitation, and in TypeScript as `isRegistrationModeAllowed` of @openvaa/app-shared, which the screens ask before they offer a mode. Each assertion below is one row of the rule's truth table: the stored settings, an entity type, a mode and the answer. packages/dev-seed/tests/registrationModeMatrixParity.test.ts reads the same rows from this file as text and asserts the TypeScript accessor against them, so the two readings cannot drift apart without one of the two suites failing.
--
-- WHY EVERY ASSERTION BELOW IS NON-VACUOUS. The rule has two halves, which types are served and which modes a served type's row lists, and every stored shape is asked for both entity types so that a half read wrongly changes at least one answer. A shape whose list of entity types is unusable still stores a row for each type, so only the default of that list decides between the two answers. A shape whose matrix is unusable serves both types, so only the matrix decides. The rows that are a string and an object each hold the text `email`, which a containment test without a check of the row's type would find. The unknown mode is stored in the row it is asked of.
--
-- THE FORM IS FIXED. Every assertion is one call with three literals, a literal boolean and a title beginning `MATRIX`, because the unit test finds the rows by that form. This file holds nothing else: its plan is the number of rows.
--
-- Depends on: schema/301-auth-functions.sql (the function). It reads no table and needs no fixture.
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (32);

-- =====================================================================
-- Nothing usable is stored
-- =====================================================================
SELECT
  is (
    private.registration_mode_allowed_in ('{}'::jsonb, 'candidate', 'email'),
    false,
    'MATRIX nothing stored: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in ('{}'::jsonb, 'organization', 'email'),
    false,
    'MATRIX nothing stored: an organization may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": null}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX a null root: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": null}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX a null root: an organization may not register with email'
  );

-- =====================================================================
-- The list of entity types: unusable lists read as candidates alone
-- =====================================================================
SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": "organization", "registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'candidate',
      'email'
    ),
    true,
    'MATRIX entity types stored as a string: candidates are served, and a candidate may register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": "organization", "registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX entity types stored as a string: the string is not read, and an organization may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": [], "registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'candidate',
      'email'
    ),
    true,
    'MATRIX an empty list of entity types: candidates are served, and a candidate may register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": [], "registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX an empty list of entity types: an organization may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["faction"], "registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'candidate',
      'email'
    ),
    true,
    'MATRIX a list holding only a type no Contestant App serves: candidates are served, and a candidate may register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["faction"], "registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX a list holding only a type no Contestant App serves: an organization may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "candidate"], "registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'candidate',
      'email'
    ),
    true,
    'MATRIX a list naming candidates twice: a candidate may register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "candidate"], "registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX a list naming candidates twice: an organization may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'candidate',
      'email'
    ),
    true,
    'MATRIX no list of entity types: candidates are served, and a candidate may register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX no list of entity types: an organization may not register with email'
  );

-- =====================================================================
-- A row for a type the project does not serve is not honoured
-- =====================================================================
SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate"], "registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'candidate',
      'email'
    ),
    true,
    'MATRIX candidates alone served: a candidate may register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate"], "registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX candidates alone served: the row of the unserved organizations is not honoured'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["organization"], "registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX organizations alone served: the row of the unserved candidates is not honoured'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["organization"], "registrationModes": {"candidate": ["email"], "organization": ["email"]}}}'::jsonb,
      'organization',
      'email'
    ),
    true,
    'MATRIX organizations alone served: an organization may register with email'
  );

-- =====================================================================
-- The matrix: an unusable matrix or row allows nothing
-- =====================================================================
SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"], "registrationModes": "email"}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX a matrix stored as a string: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"], "registrationModes": "email"}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX a matrix stored as a string: an organization may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"]}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX no matrix: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"]}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX no matrix: an organization may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"], "registrationModes": {"candidate": "email", "organization": {"email": true}}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX a row stored as a string: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"], "registrationModes": {"candidate": "email", "organization": {"email": true}}}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX a row stored as an object: an organization may not register with email'
  );

-- =====================================================================
-- Both types served, each with a row of its own
-- =====================================================================
SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"], "registrationModes": {"candidate": ["email", "code"], "organization": []}}}'::jsonb,
      'candidate',
      'email'
    ),
    true,
    'MATRIX email and code for candidates, nothing for organizations: a candidate may register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"], "registrationModes": {"candidate": ["email", "code"], "organization": []}}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX email and code for candidates, nothing for organizations: an organization may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"], "registrationModes": {"candidate": [], "organization": ["email", "code"]}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX nothing for candidates, email and code for organizations: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"], "registrationModes": {"candidate": [], "organization": ["email", "code"]}}}'::jsonb,
      'organization',
      'email'
    ),
    true,
    'MATRIX nothing for candidates, email and code for organizations: an organization may register with email'
  );

-- =====================================================================
-- The other modes
-- =====================================================================
SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"], "registrationModes": {"candidate": ["email", "code"], "organization": []}}}'::jsonb,
      'candidate',
      'code'
    ),
    true,
    'MATRIX email and code for candidates, nothing for organizations: a candidate may register with a code'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"], "registrationModes": {"candidate": ["email", "code"], "organization": []}}}'::jsonb,
      'candidate',
      'identity_provider'
    ),
    false,
    'MATRIX email and code for candidates, nothing for organizations: a candidate may not register with an identity provider'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"], "registrationModes": {"candidate": ["email", "code", "sms"], "organization": []}}}'::jsonb,
      'candidate',
      'sms'
    ),
    false,
    'MATRIX a stored mode that is no registration mode: a candidate may not register with it'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate", "organization"], "registrationModes": {"candidate": [], "organization": ["email", "code"]}}}'::jsonb,
      'organization',
      'code'
    ),
    true,
    'MATRIX nothing for candidates, email and code for organizations: an organization may register with a code'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
