-- JSONB answer storage (default)
--
-- Stores answers as a JSONB column on candidates and organizations:
-- Record<QuestionId, {value: ..., info?: ...}>
--
-- Alternative: see schema/alternatives/answers-relational.sql

ALTER TABLE candidates ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN answers jsonb DEFAULT '{}'::jsonb;

--------------------------------------------------------------------------------
-- JSONB answer validation trigger function
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_answers_jsonb()
RETURNS TRIGGER AS $$
DECLARE
  question_id text;
  answer_value jsonb;
  question_record record;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.answers IS NOT DISTINCT FROM OLD.answers THEN
    RETURN NEW;
  END IF;

  IF NEW.answers IS NULL OR NEW.answers = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  FOR question_id, answer_value IN SELECT * FROM jsonb_each(NEW.answers)
  LOOP
    SELECT q.type, q.template_id, q.choices, qt.default_choices
    INTO question_record
    FROM questions q
    LEFT JOIN question_templates qt ON q.template_id = qt.id
    WHERE q.id = question_id::uuid
      AND q.project_id = NEW.project_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Question % not found in project', question_id;
    END IF;

    PERFORM validate_answer_value(
      answer_value,
      question_record.type,
      COALESCE(question_record.choices, question_record.default_choices)
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
