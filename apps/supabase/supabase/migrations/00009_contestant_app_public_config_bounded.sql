--------------------------------------------------------------------------------
-- contestant_app_public_config: what may any visitor know about a project's Contestant app?
--
-- The entry screens of the Contestant app need five stored values before anyone has signed in: whether the app is accessible, whether answers are locked, which entity types it serves, which registration modes each type allows, and whether usage events are tracked, so that the sign-in screen follows the stored tracking setting rather than the shipped default. A project is normally closed for voters while its contestants register, and a caller who can read no settings row of a closed project (anon, or a signed-in caller holding no grant there) gets those five values from this function. SECURITY DEFINER is what lets it read past the row-level security of public.app_settings.
--
-- Returns one object with exactly five values, placed at their storage paths: `access.contestantApp`, `access.answersLocked`, `contestantApp.entityTypes`, `contestantApp.registrationModes` and `analytics.trackEvents`. Null where unset. It never returns the row, and no other member of `settings` is reachable through it.
--
-- The caller validates the values: it removes repeats, puts each list in canonical order and refuses a value of another shape. So a value is returned as stored when its shape is one the caller can accept: a boolean or a JSON null for the two gates and the tracking switch; for the entity types, a JSON null or a list of the strings `candidate` and `organization`; for the matrix, a JSON null or an object whose members are rows named `candidate` or `organization`, each a list of the strings `identity_provider`, `email` and `code`. Any other value is answered as the JSON string "invalid", which the caller refuses as it would refuse the stored value, so nothing stored under it leaves the database. Nothing validates the column on write, so a stored value may hold anything.
--
-- It is no existence oracle: a project with no settings row, a project that declares none of the five values and an id that names no project all answer the same all-null object.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.contestant_app_public_config (p_project_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  -- CASE is nested wherever a JSON function needs a value of one type, so it never sees another.
  WITH
    stored AS (
      SELECT
        v.settings #> '{access,contestantApp}' AS contestant_app,
        v.settings #> '{access,answersLocked}' AS answers_locked,
        v.settings #> '{analytics,trackEvents}' AS track_events,
        v.settings #> '{contestantApp,entityTypes}' AS entity_types,
        v.settings #> '{contestantApp,registrationModes}' AS registration_modes
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
      'entityTypes', CASE
        WHEN a.entity_types IS NULL OR jsonb_typeof(a.entity_types) = 'null' THEN a.entity_types
        WHEN jsonb_typeof(a.entity_types) = 'array' THEN CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(a.entity_types) t
            WHERE jsonb_typeof(t) <> 'string' OR (t #>> '{}') NOT IN ('candidate', 'organization')
          ) THEN a.entity_types
          ELSE '"invalid"'::jsonb
        END
        ELSE '"invalid"'::jsonb
      END,
      'registrationModes', CASE
        WHEN a.registration_modes IS NULL OR jsonb_typeof(a.registration_modes) = 'null' THEN a.registration_modes
        WHEN jsonb_typeof(a.registration_modes) = 'object' THEN CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM jsonb_each(a.registration_modes) r
            WHERE r.key NOT IN ('candidate', 'organization')
              OR CASE
                WHEN jsonb_typeof(r.value) = 'array' THEN EXISTS (
                  SELECT 1 FROM jsonb_array_elements(r.value) m
                  WHERE jsonb_typeof(m) <> 'string' OR (m #>> '{}') NOT IN ('identity_provider', 'email', 'code')
                )
                ELSE true
              END
          ) THEN a.registration_modes
          ELSE '"invalid"'::jsonb
        END
        ELSE '"invalid"'::jsonb
      END
    )
  )
  FROM stored a;
$$;
