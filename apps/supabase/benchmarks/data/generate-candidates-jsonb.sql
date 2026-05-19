-- generate-candidates-jsonb.sql
--
-- Generate benchmark candidates with JSONB answers for the JSONB schema variant.
--
-- Usage: psql $DB_URL -v scale=1000 -f generate-candidates-jsonb.sql
--
-- The `scale` variable sets the number of candidates PER PROJECT.
-- Total candidates = scale * 5 (5 projects).
--
-- Prerequisites: Run generate-shared-data.sql first.

BEGIN;

--------------------------------------------------------------------------------
-- Clean up prior benchmark candidates
--------------------------------------------------------------------------------
DELETE FROM nominations WHERE project_id IN (
  SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 5) AS n
) AND candidate_id IS NOT NULL;

DELETE FROM candidates WHERE project_id IN (
  SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 5) AS n
);

--------------------------------------------------------------------------------
-- Disable triggers for bulk insert performance
--------------------------------------------------------------------------------
ALTER TABLE candidates DISABLE TRIGGER validate_answers_before_insert_or_update;
ALTER TABLE nominations DISABLE TRIGGER validate_nomination_before_insert_or_update;

--------------------------------------------------------------------------------
-- Generate candidates (scale per project)
--------------------------------------------------------------------------------
INSERT INTO candidates (id, project_id, first_name, last_name, name, published)
SELECT
  gen_random_uuid(),
  ('00000000-0000-0000-0001-' || lpad(p_num::text, 12, '0'))::uuid,
  'Ehdokas',
  (p_num * :scale + c_idx)::text,
  jsonb_build_object(
    'fi', 'Ehdokas ' || c_idx || ' P' || p_num,
    'sv', 'Kandidat ' || c_idx || ' P' || p_num,
    'en', 'Candidate ' || c_idx || ' P' || p_num
  ),
  true
FROM generate_series(1, 5) AS p_num,
     generate_series(1, :scale) AS c_idx;

--------------------------------------------------------------------------------
-- Create nominations (link candidates to random constituencies within their project)
-- Extract project index (1-5) from the project UUID's last character
--------------------------------------------------------------------------------
INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id)
SELECT
  c.project_id,
  c.id,
  -- Election for this project (same index as project)
  ('00000000-0000-0000-0004-' || lpad(
    right(c.project_id::text, 1)::int::text, 12, '0'))::uuid,
  -- Random constituency within the project's 10 constituencies
  ('00000000-0000-0000-0002-' || lpad(
    ((right(c.project_id::text, 1)::int - 1) * 10 + (floor(random() * 10) + 1)::int)::text,
    12, '0'))::uuid
FROM candidates c
WHERE c.project_id IN (
  SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 5) AS n
);

--------------------------------------------------------------------------------
-- Generate JSONB answers (~85% completion rate)
-- Answer values: {value: 1-5} for singleChoiceOrdinal
--------------------------------------------------------------------------------
UPDATE candidates SET answers = (
  SELECT COALESCE(
    jsonb_object_agg(
      q.id::text,
      jsonb_build_object('value', (floor(random() * 5) + 1)::int)
    ),
    '{}'::jsonb
  )
  FROM questions q
  WHERE q.project_id = candidates.project_id
    AND random() < 0.85
)
WHERE project_id IN (
  SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 5) AS n
);

--------------------------------------------------------------------------------
-- Re-enable triggers
--------------------------------------------------------------------------------
ALTER TABLE candidates ENABLE TRIGGER validate_answers_before_insert_or_update;
ALTER TABLE nominations ENABLE TRIGGER validate_nomination_before_insert_or_update;

COMMIT;

-- Report summary
SELECT 'JSONB candidate generation complete' AS status,
  (SELECT count(*) FROM candidates WHERE project_id IN (
    SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n
  )) AS total_candidates,
  (SELECT count(*) FROM nominations WHERE project_id IN (
    SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n
  ) AND candidate_id IS NOT NULL) AS total_nominations,
  (SELECT avg(jsonb_object_keys_count) FROM (
    SELECT (SELECT count(*) FROM jsonb_object_keys(answers)) AS jsonb_object_keys_count
    FROM candidates
    WHERE project_id IN (
      SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n
    )
    LIMIT 100
  ) sub) AS avg_answers_per_candidate;
