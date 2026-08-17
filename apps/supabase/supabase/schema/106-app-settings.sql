-- App settings: per-project application settings stored as JSONB
--
-- One row per project, enforced by UNIQUE constraint on project_id.
-- The app layer is responsible for parsing/validating the settings structure.

CREATE TABLE public.app_settings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid        NOT NULL UNIQUE REFERENCES public.projects(id),
  settings   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- App customization: per-project customization settings stored as JSONB
ALTER TABLE public.app_settings ADD COLUMN customization jsonb DEFAULT '{}'::jsonb;
