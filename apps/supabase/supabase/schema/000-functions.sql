-- Enums, utility functions, and nomination validation
--
-- Enums:
--   question_type, entity_type, category_type
--
-- Functions:
--   update_updated_at()       - trigger for automatic updated_at timestamps
--   get_localized()           - extract locale string from JSONB with fallback
--   validate_answer_value()   - validate an answer value against question type
--   validate_nomination()     - enforce nomination hierarchy rules

--------------------------------------------------------------------------------
-- Enums
--------------------------------------------------------------------------------

CREATE TYPE question_type AS ENUM (
  'text', 'number', 'boolean', 'image', 'date', 'multipleText',
  'singleChoiceOrdinal', 'singleChoiceCategorical', 'multipleChoiceCategorical'
);

CREATE TYPE entity_type AS ENUM (
  'candidate', 'organization', 'faction', 'alliance'
);

CREATE TYPE category_type AS ENUM (
  'info', 'opinion', 'default'
);

--------------------------------------------------------------------------------
-- update_updated_at
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- get_localized: extract locale string from JSONB with fallback chain
--
-- Fallback order:
--   1. val->>locale          (requested locale)
--   2. val->>default_locale  (project default)
--   3. first available key   (any content is better than NULL)
--   4. NULL                  (val is NULL or empty)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_localized(
  val            jsonb,
  locale         text,
  default_locale text DEFAULT 'en'
)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  IF val IS NULL THEN
    RETURN NULL;
  END IF;

  IF val ? locale THEN
    RETURN val ->> locale;
  END IF;

  IF val ? default_locale THEN
    RETURN val ->> default_locale;
  END IF;

  RETURN (SELECT val ->> k FROM jsonb_object_keys(val) AS k LIMIT 1);
END;
$$;

--------------------------------------------------------------------------------
-- validate_answer_value: validate an answer against its question type
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_answer_value(
  answer_val jsonb,
  q_type question_type,
  valid_choices jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  answer_value jsonb;
  choice_ids jsonb;
BEGIN
  answer_value := answer_val -> 'value';

  IF answer_value IS NULL OR answer_value = 'null'::jsonb THEN
    RETURN;
  END IF;

  CASE q_type
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
      -- Validate StoredImage structure: {path, pathDark?, alt?, width?, height?, focalPoint?}
      IF NOT (answer_value ? 'path') THEN
        RAISE EXCEPTION 'StoredImage must have a "path" property';
      END IF;
      IF jsonb_typeof(answer_value -> 'path') != 'string' THEN
        RAISE EXCEPTION 'StoredImage "path" must be a string';
      END IF;
      IF answer_value ? 'pathDark' AND jsonb_typeof(answer_value -> 'pathDark') != 'string' THEN
        RAISE EXCEPTION 'StoredImage "pathDark" must be a string';
      END IF;
      IF answer_value ? 'alt' AND jsonb_typeof(answer_value -> 'alt') != 'string' THEN
        RAISE EXCEPTION 'StoredImage "alt" must be a string';
      END IF;
      IF answer_value ? 'width' AND jsonb_typeof(answer_value -> 'width') != 'number' THEN
        RAISE EXCEPTION 'StoredImage "width" must be a number';
      END IF;
      IF answer_value ? 'height' AND jsonb_typeof(answer_value -> 'height') != 'number' THEN
        RAISE EXCEPTION 'StoredImage "height" must be a number';
      END IF;
      IF answer_value ? 'focalPoint' THEN
        IF jsonb_typeof(answer_value -> 'focalPoint') != 'object' THEN
          RAISE EXCEPTION 'StoredImage "focalPoint" must be an object';
        END IF;
        IF NOT (answer_value -> 'focalPoint' ? 'x') OR NOT (answer_value -> 'focalPoint' ? 'y') THEN
          RAISE EXCEPTION 'StoredImage "focalPoint" must have "x" and "y" properties';
        END IF;
        IF jsonb_typeof(answer_value -> 'focalPoint' -> 'x') != 'number' THEN
          RAISE EXCEPTION 'StoredImage "focalPoint.x" must be a number';
        END IF;
        IF jsonb_typeof(answer_value -> 'focalPoint' -> 'y') != 'number' THEN
          RAISE EXCEPTION 'StoredImage "focalPoint.y" must be a number';
        END IF;
      END IF;
  END CASE;
END;
$$;

--------------------------------------------------------------------------------
-- validate_nomination: enforce hierarchy and election/constituency consistency
--
-- Hierarchy rules:
--   alliance    → no parent allowed
--   organization → parent must be alliance (or none for standalone)
--   faction     → parent MUST be organization
--   candidate   → parent must be organization or faction (or none for standalone)
--
-- Consistency rules:
--   If parent_nomination_id is set, election_id, constituency_id, and
--   election_round must match the parent nomination.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_nomination()
RETURNS TRIGGER AS $$
DECLARE
  parent_type entity_type;
  parent_election_id uuid;
  parent_constituency_id uuid;
  parent_election_round integer;
  child_type entity_type;
BEGIN
  -- Derive entity_type from the FK columns
  child_type := CASE
    WHEN NEW.candidate_id IS NOT NULL THEN 'candidate'::entity_type
    WHEN NEW.organization_id IS NOT NULL THEN 'organization'::entity_type
    WHEN NEW.faction_id IS NOT NULL THEN 'faction'::entity_type
    WHEN NEW.alliance_id IS NOT NULL THEN 'alliance'::entity_type
  END;

  IF NEW.parent_nomination_id IS NULL THEN
    -- Top-level: faction must have a parent
    IF child_type = 'faction' THEN
      RAISE EXCEPTION 'Faction nominations must have a parent organization nomination';
    END IF;
    RETURN NEW;
  END IF;

  -- Look up parent nomination
  SELECT
    CASE
      WHEN p.candidate_id IS NOT NULL THEN 'candidate'::entity_type
      WHEN p.organization_id IS NOT NULL THEN 'organization'::entity_type
      WHEN p.faction_id IS NOT NULL THEN 'faction'::entity_type
      WHEN p.alliance_id IS NOT NULL THEN 'alliance'::entity_type
    END,
    p.election_id,
    p.constituency_id,
    p.election_round
  INTO parent_type, parent_election_id, parent_constituency_id, parent_election_round
  FROM nominations p
  WHERE p.id = NEW.parent_nomination_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent nomination % not found', NEW.parent_nomination_id;
  END IF;

  -- Validate parent-child entity type combination
  CASE child_type
    WHEN 'alliance' THEN
      RAISE EXCEPTION 'Alliance nominations cannot have a parent';
    WHEN 'organization' THEN
      IF parent_type != 'alliance' THEN
        RAISE EXCEPTION 'Organization nomination parent must be an alliance nomination, got %', parent_type;
      END IF;
    WHEN 'faction' THEN
      IF parent_type != 'organization' THEN
        RAISE EXCEPTION 'Faction nomination parent must be an organization nomination, got %', parent_type;
      END IF;
    WHEN 'candidate' THEN
      IF parent_type NOT IN ('organization', 'faction') THEN
        RAISE EXCEPTION 'Candidate nomination parent must be an organization or faction nomination, got %', parent_type;
      END IF;
  END CASE;

  -- Validate election/constituency/round consistency with parent
  IF NEW.election_id != parent_election_id THEN
    RAISE EXCEPTION 'Nomination election_id must match parent (expected %, got %)',
      parent_election_id, NEW.election_id;
  END IF;

  IF NEW.constituency_id != parent_constituency_id THEN
    RAISE EXCEPTION 'Nomination constituency_id must match parent (expected %, got %)',
      parent_constituency_id, NEW.constituency_id;
  END IF;

  IF NEW.election_round IS DISTINCT FROM parent_election_round THEN
    RAISE EXCEPTION 'Nomination election_round must match parent (expected %, got %)',
      parent_election_round, NEW.election_round;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
