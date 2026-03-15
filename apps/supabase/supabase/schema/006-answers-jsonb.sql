-- JSONB answer storage (default)
--
-- Stores answers as a JSONB column on candidates and organizations:
-- Record<QuestionId, {value: ..., info?: ...}>
--
-- Features:
--   1. Smart validation trigger: validates only changed answer keys on UPDATE
--   2. Question delete cascade: removes orphaned answer keys when a question is deleted
--   3. Question type change protection: prevents type changes that would invalidate existing answers
--
-- Alternative: see schema/alternatives/answers-relational.sql
--
-- TODO: Add an RPC function for atomic single-answer upsert to prevent
--       client-side read-modify-write race conditions with concurrent jsonb_set().
--       E.g. upsert_candidate_answer(candidate_id uuid, question_id uuid, value jsonb)
--       that uses server-side jsonb_set with implicit row lock.

ALTER TABLE candidates ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;

--------------------------------------------------------------------------------
-- JSONB answer validation trigger function (smart: validates only changed keys)
--
-- On INSERT: validates all keys
-- On UPDATE: validates only new or modified keys (skips unchanged)
-- Short-circuits if answers column is unchanged or empty
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_answers_jsonb()
RETURNS TRIGGER AS $$
DECLARE
  question_id text;
  answer_value jsonb;
  question_record record;
  old_answers jsonb;
BEGIN
  -- Short-circuit: no change to answers column
  IF TG_OP = 'UPDATE' AND NEW.answers IS NOT DISTINCT FROM OLD.answers THEN
    RETURN NEW;
  END IF;

  -- Short-circuit: empty/null answers
  IF NEW.answers IS NULL OR NEW.answers = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- Get old answers for diffing (NULL on INSERT)
  old_answers := CASE WHEN TG_OP = 'UPDATE' THEN OLD.answers ELSE NULL END;

  FOR question_id, answer_value IN SELECT * FROM jsonb_each(NEW.answers)
  LOOP
    -- Skip unchanged answer keys (only validate new or modified)
    IF old_answers IS NOT NULL
       AND old_answers ? question_id
       AND old_answers -> question_id IS NOT DISTINCT FROM answer_value THEN
      CONTINUE;
    END IF;

    SELECT q.type, q.choices
    INTO question_record
    FROM questions q
    WHERE q.id = question_id::uuid
      AND q.project_id = NEW.project_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Question % not found in project', question_id;
    END IF;

    PERFORM validate_answer_value(
      answer_value,
      question_record.type,
      question_record.choices
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_answers_before_insert_or_update
  BEFORE INSERT OR UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION validate_answers_jsonb();

CREATE TRIGGER validate_answers_before_insert_or_update
  BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION validate_answers_jsonb();

--------------------------------------------------------------------------------
-- Question delete cascade: remove orphaned answer keys from JSONB
--
-- When a question is deleted, removes its answer key from all candidates
-- and organizations in the same project. Uses the JSONB `-` operator
-- which is a no-op if the key doesn't exist.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cascade_question_delete_to_jsonb_answers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE candidates
  SET answers = answers - OLD.id::text
  WHERE project_id = OLD.project_id
    AND answers ? OLD.id::text;

  UPDATE organizations
  SET answers = answers - OLD.id::text
  WHERE project_id = OLD.project_id
    AND answers ? OLD.id::text;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_question_delete_to_answers
  AFTER DELETE ON questions
  FOR EACH ROW EXECUTE FUNCTION cascade_question_delete_to_jsonb_answers();

--------------------------------------------------------------------------------
-- Question type/choices change protection
--
-- Prevents changing a question's type or choices if existing answers would
-- become invalid under the new type. Type changes are allowed if:
--   1. No answers exist for this question, or
--   2. All existing answers pass validation against the new type/choices
--
-- This mirrors the relational model's inherent constraint: you can't change
-- a column type if existing data doesn't conform.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_question_type_change()
RETURNS TRIGGER AS $$
DECLARE
  entity_record record;
  valid_choices jsonb;
BEGIN
  -- Only act on type or choices changes
  IF OLD.type IS NOT DISTINCT FROM NEW.type
     AND OLD.choices IS NOT DISTINCT FROM NEW.choices THEN
    RETURN NEW;
  END IF;

  -- Get effective choices for validation
  valid_choices := NEW.choices;

  -- Validate all existing candidate answers against the new type
  FOR entity_record IN
    SELECT c.id, c.answers -> OLD.id::text AS answer_value
    FROM candidates c
    WHERE c.project_id = NEW.project_id
      AND c.answers ? OLD.id::text
  LOOP
    BEGIN
      PERFORM validate_answer_value(entity_record.answer_value, NEW.type, valid_choices);
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Cannot change question % type/choices: existing answer for candidate % would be invalid: %',
        NEW.id, entity_record.id, SQLERRM;
    END;
  END LOOP;

  -- Validate all existing organization answers against the new type
  FOR entity_record IN
    SELECT o.id, o.answers -> OLD.id::text AS answer_value
    FROM organizations o
    WHERE o.project_id = NEW.project_id
      AND o.answers ? OLD.id::text
  LOOP
    BEGIN
      PERFORM validate_answer_value(entity_record.answer_value, NEW.type, valid_choices);
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Cannot change question % type/choices: existing answer for organization % would be invalid: %',
        NEW.id, entity_record.id, SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_question_type_change_trigger
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION validate_question_type_change();
