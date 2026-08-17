-- install-smart-jsonb-trigger.sql
--
-- Replaces the default validate_answers_jsonb trigger with a smart version
-- that only validates CHANGED keys (like the relational trigger validates
-- only the changed row). This avoids re-validating all ~42 answers on every
-- single-answer update via jsonb_set.

CREATE OR REPLACE FUNCTION validate_answers_jsonb()
RETURNS TRIGGER AS $$
DECLARE
  question_id text;
  answer_value jsonb;
  question_record record;
  old_answers jsonb;
BEGIN
  -- Short-circuit: no change
  IF TG_OP = 'UPDATE' AND NEW.answers IS NOT DISTINCT FROM OLD.answers THEN
    RETURN NEW;
  END IF;

  -- Short-circuit: empty/null
  IF NEW.answers IS NULL OR NEW.answers = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- Get old answers for diffing (NULL on INSERT)
  old_answers := CASE WHEN TG_OP = 'UPDATE' THEN OLD.answers ELSE NULL END;

  FOR question_id, answer_value IN SELECT * FROM jsonb_each(NEW.answers)
  LOOP
    -- Skip unchanged answers (only validate new or modified keys)
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
