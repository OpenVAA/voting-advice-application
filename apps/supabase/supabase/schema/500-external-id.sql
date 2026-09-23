-- External ID uniqueness and immutability
--
-- The nullable external_id column itself is declared in the CREATE TABLE body of each content table that carries one: elections, constituency_groups and constituencies in 101-elections.sql; candidates, organizations, factions and alliances in 102-entities.sql; questions and question_categories in 103-questions.sql; nominations in 104-nominations.sql; app_settings in 106-app-settings.sql.
-- This file owns what enforces it: a composite unique index on (project_id, external_id) per table, giving uniqueness scoped per project, and an immutability trigger that prevents changing external_id once set (NULL -> value is allowed; value -> different value is blocked).
--
-- Used by bulk_import() for externalId-based upsert matching.
-- Depends on: 101-elections.sql, 102-entities.sql, 103-questions.sql,
--             104-nominations.sql, 106-app-settings.sql
--------------------------------------------------------------------------------
-- Composite unique indexes on (project_id, external_id)
--------------------------------------------------------------------------------
CREATE UNIQUE INDEX idx_elections_external_id ON public.elections (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_constituency_groups_external_id ON public.constituency_groups (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_constituencies_external_id ON public.constituencies (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_candidates_external_id ON public.candidates (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_organizations_external_id ON public.organizations (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_factions_external_id ON public.factions (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_alliances_external_id ON public.alliances (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_nominations_external_id ON public.nominations (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_questions_external_id ON public.questions (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_question_categories_external_id ON public.question_categories (project_id, external_id)
WHERE
  external_id IS NOT NULL;

CREATE UNIQUE INDEX idx_app_settings_external_id ON public.app_settings (project_id, external_id)
WHERE
  external_id IS NOT NULL;

--------------------------------------------------------------------------------
-- Immutability trigger: prevent changing external_id once set
--
-- NULL -> value: allowed (first assignment) value -> same value: allowed (no-op) value -> different value: blocked (raises exception) value -> NULL: blocked (raises exception)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_external_id_immutability () RETURNS TRIGGER AS $$
BEGIN
  IF OLD.external_id IS NOT NULL AND OLD.external_id IS DISTINCT FROM NEW.external_id THEN
    RAISE EXCEPTION 'external_id cannot be changed once set (current: %, attempted: %)',
      OLD.external_id, NEW.external_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.elections FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.constituency_groups FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.constituencies FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.factions FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.alliances FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.questions FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.question_categories FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();

CREATE TRIGGER enforce_external_id_immutability
BEFORE UPDATE ON public.app_settings FOR EACH ROW
EXECUTE FUNCTION public.enforce_external_id_immutability ();
