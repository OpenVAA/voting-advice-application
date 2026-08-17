-- Question categories and questions
--
-- Includes validation trigger: choice-type questions must have valid choices array.

CREATE TABLE public.question_categories (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name            jsonb,
  short_name      jsonb,
  info            jsonb,
  color           jsonb,
  image           jsonb,
  sort_order      integer,
  subtype         text,
  custom_data     jsonb,
  is_generated    boolean       DEFAULT false,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  category_type   public.category_type DEFAULT 'opinion',
  election_ids    jsonb,
  election_rounds jsonb,
  constituency_ids jsonb,
  entity_type     jsonb
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.question_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.questions (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name            jsonb,
  short_name      jsonb,
  info            jsonb,
  color           jsonb,
  image           jsonb,
  sort_order      integer,
  subtype         text,
  custom_data     jsonb,
  is_generated    boolean       DEFAULT false,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  type            public.question_type NOT NULL,
  category_id     uuid          NOT NULL REFERENCES public.question_categories(id),
  choices         jsonb,
  settings        jsonb,
  election_ids    jsonb,
  election_rounds jsonb,
  constituency_ids jsonb,
  entity_type     jsonb,
  allow_open      boolean       DEFAULT true,
  required        boolean       DEFAULT true
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

--------------------------------------------------------------------------------
-- validate_question_choices: enforce valid choices for choice-type questions
--
-- For singleChoiceOrdinal, singleChoiceCategorical, multipleChoiceCategorical:
--   - choices must be a non-null JSON array
--   - choices must contain at least 2 elements
--   - each choice must be an object with an "id" key
--
-- Uses is_valid_choice_id helper from 011-validation-functions.sql.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_question_choices()
RETURNS TRIGGER AS $$
DECLARE
  p_choice JSONB;
  p_choice_count INTEGER;
BEGIN
  -- Only validate choice-type questions
  IF NEW.type NOT IN ('singleChoiceOrdinal', 'singleChoiceCategorical', 'multipleChoiceCategorical') THEN
    RETURN NEW;
  END IF;

  -- Choices must be present and non-null
  IF NEW.choices IS NULL OR NEW.choices = 'null'::jsonb THEN
    RAISE EXCEPTION 'Choice-type question must have a choices array (type: %)', NEW.type;
  END IF;

  -- Choices must be an array
  IF jsonb_typeof(NEW.choices) != 'array' THEN
    RAISE EXCEPTION 'Question choices must be a JSON array, got %', jsonb_typeof(NEW.choices);
  END IF;

  -- Must have at least 2 choices
  p_choice_count := jsonb_array_length(NEW.choices);
  IF p_choice_count < 2 THEN
    RAISE EXCEPTION 'Choice-type question must have at least 2 choices, got %', p_choice_count;
  END IF;

  -- Each choice must be an object with an "id" key
  FOR p_choice IN SELECT * FROM jsonb_array_elements(NEW.choices)
  LOOP
    IF jsonb_typeof(p_choice) != 'object' THEN
      RAISE EXCEPTION 'Each choice must be a JSON object';
    END IF;
    IF NOT (p_choice ? 'id') THEN
      RAISE EXCEPTION 'Each choice must have an "id" property';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_question_choices_before_insert_or_update
  BEFORE INSERT OR UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.validate_question_choices();
