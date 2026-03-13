-- Migration: Relational answer storage alternative
-- Phase 9 Plan 02 Task 1
--
-- This migration creates an `answers` table with one row per entity-question pair.
-- It is an alternative to the JSONB answer storage (20260312200004).
--
-- For Phase 11 load testing: this migration and 20260312200004 (JSONB) are
-- alternatives. Both produce identical validation behavior via the shared
-- validate_answer_value() function, so load tests isolate the storage format.
--
-- The validate_answer_value function is defined with CREATE OR REPLACE here to
-- make this migration self-contained (works even if 00004 is not applied).

--------------------------------------------------------------------------------
-- Shared validation function (CREATE OR REPLACE for self-containment)
-- Identical to the version in 20260312200004_create_answers_jsonb.sql
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_answer_value(
  answer_val jsonb,
  question_type text,
  valid_choices jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  answer_value jsonb;
  choice_ids jsonb;
BEGIN
  -- Extract the 'value' key from the answer (answers are {value: ..., info?: ...})
  answer_value := answer_val -> 'value';

  -- NULL/missing value is always valid (represents unanswered)
  IF answer_value IS NULL OR answer_value = 'null'::jsonb THEN
    RETURN;
  END IF;

  CASE question_type
    WHEN 'text' THEN
      IF jsonb_typeof(answer_value) != 'string' THEN
        RAISE EXCEPTION 'Answer for text question must be a string';
      END IF;
    WHEN 'number' THEN
      IF jsonb_typeof(answer_value) != 'number' THEN
        RAISE EXCEPTION 'Answer for number question must be a number';
      END IF;
    WHEN 'boolean' THEN
      IF jsonb_typeof(answer_value) != 'boolean' THEN
        RAISE EXCEPTION 'Answer for boolean question must be a boolean';
      END IF;
    WHEN 'date' THEN
      IF jsonb_typeof(answer_value) != 'string' THEN
        RAISE EXCEPTION 'Answer for date question must be a date string';
      END IF;
    WHEN 'singleChoiceOrdinal', 'singleChoiceCategorical' THEN
      IF jsonb_typeof(answer_value) != 'string' AND jsonb_typeof(answer_value) != 'number' THEN
        RAISE EXCEPTION 'Answer for choice question must be a choice ID (string or number)';
      END IF;
      IF valid_choices IS NOT NULL THEN
        SELECT jsonb_agg(c -> 'id') INTO choice_ids FROM jsonb_array_elements(valid_choices) AS c;
        IF choice_ids IS NOT NULL AND NOT choice_ids @> jsonb_build_array(answer_value) THEN
          RAISE EXCEPTION 'Answer choice ID not in valid choices';
        END IF;
      END IF;
    WHEN 'multipleChoiceCategorical' THEN
      IF jsonb_typeof(answer_value) != 'array' THEN
        RAISE EXCEPTION 'Answer for multiple choice question must be an array';
      END IF;
    WHEN 'multipleText' THEN
      IF jsonb_typeof(answer_value) != 'array' THEN
        RAISE EXCEPTION 'Answer for multipleText question must be an array';
      END IF;
    WHEN 'image' THEN
      IF jsonb_typeof(answer_value) != 'object' THEN
        RAISE EXCEPTION 'Answer for image question must be an object';
      END IF;
    ELSE
      RAISE EXCEPTION 'Unknown question type: %', question_type;
  END CASE;
END;
$$;

--------------------------------------------------------------------------------
-- answers table (relational alternative)
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
--
-- Validates the answer value against the question type and template choices.
-- Ensures the question belongs to the same project as the answer.
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

  -- Look up question and its template within the same project
  SELECT q.type, q.choices, qt.default_choices
  INTO question_record
  FROM questions q
  LEFT JOIN question_templates qt ON q.template_id = qt.id
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
    COALESCE(question_record.choices, question_record.default_choices)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- Apply relational answer validation trigger
--------------------------------------------------------------------------------
CREATE TRIGGER validate_answer_before_insert_or_update
  BEFORE INSERT OR UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION validate_answer_relational();
