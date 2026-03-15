-- Relational answer storage (alternative to 006-answers-jsonb.sql)
--
-- Creates an `answers` table with one row per entity-question pair.
-- To use this instead of the JSONB approach:
--   1. Remove schema/006-answers-jsonb.sql
--   2. Copy this file to schema/006-answers-relational.sql
--   3. Run `supabase db diff` to generate the migration
--
-- Both approaches use the shared validate_answer_value() from 000-functions.sql.

--------------------------------------------------------------------------------
-- answers table (relational)
--
-- One row per entity-question pair. entity_id is polymorphic (references
-- candidates or organizations depending on entity_type).
--------------------------------------------------------------------------------
CREATE TABLE answers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES projects(id),
  entity_id    uuid        NOT NULL,
  entity_type  text        NOT NULL CHECK (entity_type IN ('candidate', 'organization')),
  question_id  uuid        NOT NULL REFERENCES questions(id),
  value        jsonb,
  open_answer  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, question_id)
);

COMMENT ON COLUMN answers.entity_id IS
  'Polymorphic FK: references candidates or organizations based on entity_type.';

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

--------------------------------------------------------------------------------
-- Relational answer validation trigger function
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_answer_relational()
RETURNS TRIGGER AS $$
DECLARE
  question_record record;
  answer_obj jsonb;
BEGIN
  -- On UPDATE, skip validation if value has not changed
  IF TG_OP = 'UPDATE' AND NEW.value IS NOT DISTINCT FROM OLD.value THEN
    RETURN NEW;
  END IF;

  -- NULL value is valid (unanswered)
  IF NEW.value IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up question within the same project
  SELECT q.type, q.choices
  INTO question_record
  FROM questions q
  WHERE q.id = NEW.question_id
    AND q.project_id = NEW.project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question % not found in project', NEW.question_id;
  END IF;

  -- Wrap the value into an answer object {value: ...} for validate_answer_value
  answer_obj := jsonb_build_object('value', NEW.value);

  -- Validate answer value against question type and effective choices
  PERFORM validate_answer_value(
    answer_obj,
    question_record.type,
    question_record.choices
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_answer_before_insert_or_update
  BEFORE INSERT OR UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION validate_answer_relational();

-- Additional indexes for the answers table (add to 009-indexes.sql if using this)
CREATE INDEX IF NOT EXISTS idx_answers_project_id ON answers (project_id);
CREATE INDEX IF NOT EXISTS idx_answers_entity_id ON answers (entity_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers (question_id);

-- RLS for the answers table (add to 010-rls.sql if using this)
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answers_deny_all" ON answers FOR ALL USING (false);
