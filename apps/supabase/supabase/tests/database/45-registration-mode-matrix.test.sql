-- 45-registration-mode-matrix.test.sql: the truth table of the registration-mode rule
--
-- WHAT IS PINNED. One rule decides whether entities of a type may register with a mode, and it is written three times: in SQL as private.registration_mode_allowed_in, which the database asks before it honours an invitation; in TypeScript as `isRegistrationModeAllowed` of @openvaa/app-shared, which the screens ask, over the settings the stored-settings schema has parsed, before they offer a mode; and in the identity-callback Edge Function, which cannot import the shared package. Each assertion below is one row of the rule's truth table: the stored settings, an entity type, a mode and the answer. packages/app-shared/src/settings/contestantAppSettings.matrix.test.ts and identity-callback/registrationMatrix.test.ts read the same rows from this file as text and assert the other two readings against them, so the three cannot drift apart without a suite failing.
--
-- WHY EVERY ASSERTION BELOW IS NON-VACUOUS. A type is served when it is a key of `contestantApp.servedEntityTypes`, and the four valid shapes that differ in their keys or their modes are each asked for both entity types, so that reading a type that is no key, or another type's modes, changes at least one answer. Every refused shape holds an entry for candidates whose modes contain `email`, which a reader that skipped the validity test would find; where the refused part is another type's entry, candidates are the type asked. The two rows with a refused sibling of the member answer true, so a reader that refused the whole root fails them, and the two rows with a `contestantApp` member the schema does not know answer false beside served types that allow candidates `email`, so a reader that read `servedEntityTypes` alone fails them.
--
-- THE FORM IS FIXED. Every assertion is one call with three literals, a literal boolean and a title beginning `MATRIX`, because the unit tests find the rows by that form. This file holds nothing else: its plan is the number of rows.
--
-- Depends on: schema/106-app-settings.sql and schema/301-auth-functions.sql (the functions). It reads no table and needs no fixture.
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (34);

-- =====================================================================
-- Nothing usable is stored: the shipped default serves candidates and allows no mode
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

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"questions": {"hideHero": true}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX no servedEntityTypes member: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": null}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX a null servedEntityTypes: a candidate may not register with email'
  );

-- =====================================================================
-- A type is served when it is a key, and only its own modes are read
-- =====================================================================
SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"]}}}}'::jsonb,
      'candidate',
      'email'
    ),
    true,
    'MATRIX candidates alone served: a candidate may register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"]}}}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX candidates alone served: organizations are no key, and an organization may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"organization": {"registrationModes": ["email"]}}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX organizations alone served: candidates are no key, and a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"organization": {"registrationModes": ["email"]}}}}'::jsonb,
      'organization',
      'email'
    ),
    true,
    'MATRIX organizations alone served: an organization may register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email", "code"]}, "organization": {"registrationModes": []}}}}'::jsonb,
      'candidate',
      'email'
    ),
    true,
    'MATRIX email and code for candidates, nothing for organizations: a candidate may register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email", "code"]}, "organization": {"registrationModes": []}}}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX email and code for candidates, nothing for organizations: an organization may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": []}, "organization": {"registrationModes": ["email", "code"]}}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX nothing for candidates, email and code for organizations: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": []}, "organization": {"registrationModes": ["email", "code"]}}}}'::jsonb,
      'organization',
      'email'
    ),
    true,
    'MATRIX nothing for candidates, email and code for organizations: an organization may register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email", "email"]}}}}'::jsonb,
      'candidate',
      'email'
    ),
    true,
    'MATRIX a list of modes naming email twice: a candidate may register with email'
  );

-- =====================================================================
-- The other modes
-- =====================================================================
SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email", "code"]}, "organization": {"registrationModes": []}}}}'::jsonb,
      'candidate',
      'code'
    ),
    true,
    'MATRIX email and code for candidates, nothing for organizations: a candidate may register with a code'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email", "code"]}, "organization": {"registrationModes": []}}}}'::jsonb,
      'candidate',
      'identity_provider'
    ),
    false,
    'MATRIX email and code for candidates, nothing for organizations: a candidate may not register with an identity provider'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": []}, "organization": {"registrationModes": ["email", "code"]}}}}'::jsonb,
      'organization',
      'code'
    ),
    true,
    'MATRIX nothing for candidates, email and code for organizations: an organization may register with a code'
  );

-- =====================================================================
-- A servedEntityTypes the screens refuse allows nothing, for any type
-- =====================================================================
SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": ["candidate"]}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX servedEntityTypes stored as a list: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX servedEntityTypes with no key: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"]}, "alliance": {"registrationModes": ["email"]}}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX a key that is no served type: a candidate whose own entry holds email may not register with it'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email", "sms"]}}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX a stored mode that is no registration mode: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email", "sms"]}}}}'::jsonb,
      'candidate',
      'sms'
    ),
    false,
    'MATRIX a stored mode that is no registration mode: a candidate may not register with it'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"]}, "organization": ["email"]}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX an entry stored as a list: a candidate whose own entry holds email may not register with it'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"]}, "organization": ["email"]}}}'::jsonb,
      'organization',
      'email'
    ),
    false,
    'MATRIX an entry stored as a list: an organization may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"]}, "organization": null}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX an entry stored as a null: a candidate whose own entry holds email may not register with it'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"], "hideHero": true}}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX an entry with a key beside registrationModes: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"]}, "organization": {}}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX an entry with no registrationModes: a candidate whose own entry holds email may not register with it'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": "email"}}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX modes stored as a string: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email", 1]}}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX modes holding a number: a candidate may not register with email'
  );

-- =====================================================================
-- A contestantApp member the screens do not know allows nothing, for any type
-- =====================================================================
SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"entityTypes": ["candidate"], "servedEntityTypes": {"candidate": {"registrationModes": ["email"]}}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX a leftover contestantApp.entityTypes beside valid served types: a candidate may not register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"hideHero": true, "servedEntityTypes": {"candidate": {"registrationModes": ["email"]}}}}'::jsonb,
      'candidate',
      'email'
    ),
    false,
    'MATRIX an unknown contestantApp member beside valid served types: a candidate may not register with email'
  );

-- =====================================================================
-- A refused questions member, and a refused root beside contestantApp, change nothing
-- =====================================================================
SELECT
  is (
    private.registration_mode_allowed_in (
      '{"contestantApp": {"questions": {"hideHero": "yes"}, "servedEntityTypes": {"candidate": {"registrationModes": ["email"]}}}}'::jsonb,
      'candidate',
      'email'
    ),
    true,
    'MATRIX a refused contestantApp.questions beside valid served types: a candidate may register with email'
  );

SELECT
  is (
    private.registration_mode_allowed_in (
      '{"access": {"contestantApp": "yes"}, "contestantApp": {"servedEntityTypes": {"candidate": {"registrationModes": ["email"]}}}}'::jsonb,
      'candidate',
      'email'
    ),
    true,
    'MATRIX a refused root beside a valid contestantApp: a candidate may register with email'
  );

SELECT
  *
FROM
  finish ();

ROLLBACK;
