-- App settings: per-project application settings stored as JSONB
--
-- One row per project, enforced by UNIQUE constraint on project_id.
-- The app layer is responsible for parsing/validating the settings structure.
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects (id) ON DELETE CASCADE,
  -- `StoredSettings` from @openvaa/app-shared, the stored form of `DynamicSettings`; the Supabase data provider merges it over the shipped defaults.
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- `StoredCustomization` from @openvaa/app-shared: localized publisher copy, image paths, translation overrides and the contestant-app FAQ.
  customization jsonb DEFAULT '{}'::jsonb,
  -- The import key bulk_import matches rows by; unique per project and unchangeable once set (500-external-id.sql).
  external_id text
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.app_settings FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();

--------------------------------------------------------------------------------
-- contestant_app_served_entity_types_valid: is the stored `contestantApp.servedEntityTypes` one the Contestant App accepts?
--
-- `contestantApp.servedEntityTypes` declares both which entity types the Contestant App serves and which registration modes each allows: a type is served when it is a key of the object, and the key's value is `{"registrationModes": [...]}`. True when the member is absent or a JSON null, and when it is an object with at least one key, every key `candidate` or `organization`, every value an object whose only key is `registrationModes`, and every `registrationModes` a list of the strings `identity_provider`, `email` and `code`. False for every other value. False as well when `contestantApp` is an object holding a member other than `questions` and `servedEntityTypes`, such as a leftover `entityTypes`: the stored-settings schema of @openvaa/app-shared is strict at `contestantApp`, so the screens then drop the whole member, valid served entity types with it. What `questions` holds changes nothing, because the schema reads a refused `questions` as absent, and a `contestantApp` that is not an object stores no served entity types, so neither the screens nor the database allow any registration under it. It is that schema for `servedEntityTypes` and for the members beside it, so a value the screens refuse is one the database refuses too.
--
-- contestant_app_public_settings below answers "invalid" for the member when it is false, and private.registration_mode_allowed_in in 301-auth-functions.sql allows no registration at all.
--
-- It runs as its caller and reads no table. Both callers are definer functions, so no API role holds EXECUTE: the REVOKE here takes away the EXECUTE PostgreSQL gives PUBLIC on every new function, and 301-auth-functions.sql revokes what its grant on the `private` schema gives.
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.contestant_app_served_entity_types_valid (p_settings jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  -- CASE is nested wherever a JSON function needs a value of one type, so it never sees another.
  SELECT CASE
    WHEN CASE WHEN jsonb_typeof(c.root) = 'object' THEN c.root - 'questions' - 'servedEntityTypes' <> '{}'::jsonb ELSE false END THEN false
    WHEN c.served IS NULL OR jsonb_typeof(c.served) = 'null' THEN true
    WHEN jsonb_typeof(c.served) <> 'object' THEN false
    ELSE c.served <> '{}'::jsonb AND NOT EXISTS (
      SELECT 1 FROM jsonb_each(c.served) t
      WHERE t.key NOT IN ('candidate', 'organization')
        OR CASE
          WHEN jsonb_typeof(t.value) <> 'object' THEN true
          WHEN t.value - 'registrationModes' <> '{}'::jsonb THEN true
          WHEN jsonb_typeof(t.value -> 'registrationModes') IS DISTINCT FROM 'array' THEN true
          ELSE EXISTS (
            SELECT 1 FROM jsonb_array_elements(t.value -> 'registrationModes') m
            WHERE jsonb_typeof(m) <> 'string' OR (m #>> '{}') NOT IN ('identity_provider', 'email', 'code')
          )
        END
    )
  END
  FROM (SELECT p_settings -> 'contestantApp' AS root, p_settings #> '{contestantApp,servedEntityTypes}' AS served) c;
$$;

REVOKE
EXECUTE ON FUNCTION private.contestant_app_served_entity_types_valid (jsonb)
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- contestant_app_public_settings: what may any visitor know about a project's Contestant app?
--
-- The entry screens of the Contestant app need four stored values before anyone has signed in: whether the app is accessible, whether answers are locked, which entity types it serves with the registration modes each allows, and whether usage events are tracked, so that the sign-in screen follows the stored tracking setting rather than the shipped default. A project is normally closed for voters while its contestants register, and a caller who can read no settings row of a closed project (anon, or a signed-in caller holding no grant there) gets those four values from this function. SECURITY DEFINER is what lets it read past the row-level security of public.app_settings.
--
-- Returns one object with exactly four values, placed at their storage paths: `access.contestantApp`, `access.answersLocked`, `contestantApp.servedEntityTypes` and `analytics.trackEvents`. Null where unset. It never returns the row, and no other member of `settings` is reachable through it.
--
-- The caller validates the values: it removes repeats, puts each list in canonical order and refuses a value of another shape. So a value is returned as stored when its shape is one the caller can accept: a boolean or a JSON null for the two gates and the tracking switch, and for the served entity types a value private.contestant_app_served_entity_types_valid accepts, which it does not beside a `contestantApp` member the schema does not know, so that case is answered "invalid" just as the read of an open project's row drops the member. Any other value is answered as the JSON string "invalid", which the caller refuses as it would refuse the stored value, so nothing stored under it leaves the database. Nothing validates the column on write, so a stored value may hold anything.
--
-- It is no existence oracle: a project with no settings row, a project that declares none of the four values and an id that names no project all answer the same all-null object.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.contestant_app_public_settings (p_project_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  WITH
    stored AS (
      SELECT
        v.settings #> '{access,contestantApp}' AS contestant_app,
        v.settings #> '{access,answersLocked}' AS answers_locked,
        v.settings #> '{analytics,trackEvents}' AS track_events,
        v.settings #> '{contestantApp,servedEntityTypes}' AS served_entity_types,
        private.contestant_app_served_entity_types_valid(v.settings) AS served_entity_types_valid
      FROM (SELECT (SELECT s.settings FROM public.app_settings s WHERE s.project_id = p_project_id) AS settings) v
    )
  SELECT jsonb_build_object(
    'access', jsonb_build_object(
      'contestantApp', CASE WHEN a.contestant_app IS NULL OR jsonb_typeof(a.contestant_app) IN ('boolean', 'null') THEN a.contestant_app ELSE '"invalid"'::jsonb END,
      'answersLocked', CASE WHEN a.answers_locked IS NULL OR jsonb_typeof(a.answers_locked) IN ('boolean', 'null') THEN a.answers_locked ELSE '"invalid"'::jsonb END
    ),
    'analytics', jsonb_build_object(
      'trackEvents', CASE WHEN a.track_events IS NULL OR jsonb_typeof(a.track_events) IN ('boolean', 'null') THEN a.track_events ELSE '"invalid"'::jsonb END
    ),
    'contestantApp', jsonb_build_object(
      'servedEntityTypes', CASE WHEN a.served_entity_types_valid THEN a.served_entity_types ELSE '"invalid"'::jsonb END
    )
  )
  FROM stored a;
$$;

-- The frontend adapter calls this function over PostgREST, as anon and as authenticated, when the caller can read no settings row of a closed project, so the grant is declared here rather than inherited from default privileges. 38-contestant-app-public-settings.test.sql asserts both rights.
GRANT
EXECUTE ON FUNCTION public.contestant_app_public_settings (uuid) TO anon,
authenticated;
