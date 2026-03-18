-- App settings: per-project application settings stored as JSONB
--
-- One row per project, enforced by UNIQUE constraint on project_id.
-- The app layer is responsible for parsing/validating the settings structure.

CREATE TABLE app_settings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid        NOT NULL UNIQUE REFERENCES projects(id),
  settings   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- App customization: per-project customization settings stored as JSONB
-- Image references use the same {path, pathDark?, alt?, width?, height?} format
-- as image-type answer values. App layer handles parsing/validation.
-- Existing RLS policies (anon SELECT, admin INSERT/UPDATE/DELETE) cover this column automatically.
ALTER TABLE app_settings ADD COLUMN customization jsonb DEFAULT '{}'::jsonb;
