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
-- contestant_app_public_config: what may any visitor know about a project's Contestant app?
--
-- The entry screens of the Contestant app need five stored values before anyone has signed in: whether the app is accessible, whether answers are locked, which entity types it serves, which registration modes each type allows, and whether usage events are tracked, so that the sign-in screen follows the stored tracking setting rather than the shipped default. A project is normally closed for voters while its contestants register, and a caller who can read no settings row of a closed project (anon, or a signed-in caller holding no grant there) gets those five values from this function. SECURITY DEFINER is what lets it read past the row-level security of public.app_settings.
--
-- Returns one object with exactly five values, placed at their storage paths: `access.contestantApp`, `access.answersLocked`, `contestantApp.entityTypes`, `contestantApp.registrationModes` and `analytics.trackEvents`. Each is returned as stored, unvalidated, and null where unset; the caller validates them. It never returns the row, and no other member of `settings` is reachable through it.
--
-- It is no existence oracle: a project with no settings row, a project that declares none of the five values and an id that names no project all answer the same all-null object.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.contestant_app_public_config (p_project_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT jsonb_build_object(
    'access', jsonb_build_object(
      'contestantApp', v.settings #> '{access,contestantApp}',
      'answersLocked', v.settings #> '{access,answersLocked}'
    ),
    'analytics', jsonb_build_object('trackEvents', v.settings #> '{analytics,trackEvents}'),
    'contestantApp', jsonb_build_object(
      'entityTypes', v.settings #> '{contestantApp,entityTypes}',
      'registrationModes', v.settings #> '{contestantApp,registrationModes}'
    )
  )
  FROM (SELECT (SELECT s.settings FROM public.app_settings s WHERE s.project_id = p_project_id) AS settings) v;
$$;

-- The frontend adapter calls this function over PostgREST, as anon and as authenticated, when the caller can read no settings row of a closed project, so the grant is declared here rather than inherited from default privileges. 38-contestant-app-public-config.test.sql asserts both rights.
GRANT
EXECUTE ON FUNCTION public.contestant_app_public_config (uuid) TO anon,
authenticated;
