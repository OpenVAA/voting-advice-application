-- Migration: JSONB answer storage alternative
-- Phase 9 Plan 02 Task 1
--
-- This migration adds an `answers` JSONB column to candidates and organizations,
-- storing answers as Record<QuestionId, Answer> where Answer is {value: ..., info?: ...}.
--
-- It also creates the shared validate_answer_value() function used by both
-- the JSONB and relational answer storage alternatives.
--
-- For Phase 11 load testing: this migration and 20260312200005 (relational)
-- are alternatives -- only one should be applied at a time. Both produce
-- identical validation behavior so load tests isolate the storage format.

--------------------------------------------------------------------------------
-- Shared validation function (used by both JSONB and relational triggers)
--
-- Validates an individual answer value against the question type and choices.
-- answer_val is the full answer object {value: ..., info?: ...}.
-- question_type is the QuestionType enum string.
-- valid_choices is the JSONB array of Choice objects (with 'id' keys).
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
-- Add answers JSONB column to candidates and organizations
--------------------------------------------------------------------------------
ALTER TABLE candidates ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;

--------------------------------------------------------------------------------
-- JSONB answer validation trigger function
--
-- Iterates over all entries in the answers JSONB object, validates each answer
-- against its question type and template. Ensures the question belongs to the
-- same project as the entity.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_answers_jsonb()
RETURNS TRIGGER AS $$
DECLARE
  question_id text;
  answer_value jsonb;
  question_record record;
BEGIN
  -- On UPDATE, skip validation if answers column has not changed
  IF TG_OP = 'UPDATE' AND NEW.answers IS NOT DISTINCT FROM OLD.answers THEN
    RETURN NEW;
  END IF;

  -- Skip if answers is empty or null
  IF NEW.answers IS NULL OR NEW.answers = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  FOR question_id, answer_value IN SELECT * FROM jsonb_each(NEW.answers)
  LOOP
    -- Look up the question and its template within the same project
    SELECT q.type, q.template_id, q.choices,
           qt.default_choices
    INTO question_record
    FROM questions q
    LEFT JOIN question_templates qt ON q.template_id = qt.id
    WHERE q.id = question_id::uuid
      AND q.project_id = NEW.project_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Question % not found in project', question_id;
    END IF;

    -- Validate answer value against question type and effective choices
    PERFORM validate_answer_value(
      answer_value,
      question_record.type,
      COALESCE(question_record.choices, question_record.default_choices)
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- Apply JSONB answer validation triggers
--------------------------------------------------------------------------------
CREATE TRIGGER validate_answers_before_insert_or_update
  BEFORE INSERT OR UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION validate_answers_jsonb();

CREATE TRIGGER validate_answers_before_insert_or_update
  BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION validate_answers_jsonb();
