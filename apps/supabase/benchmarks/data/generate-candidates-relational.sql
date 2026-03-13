-- generate-candidates-relational.sql
--
-- Generate benchmark candidates with relational answers for the relational schema variant.
--
-- Usage: psql $DB_URL -v scale=1000 -f generate-candidates-relational.sql
--
-- The `scale` variable sets the number of candidates PER PROJECT.
-- Total candidates = scale * 5 (5 projects).
--
-- Prerequisites: Run generate-shared-data.sql first.
-- NOTE: This script requires the relational schema (answers table must exist).

BEGIN;

--------------------------------------------------------------------------------
-- Clean up prior benchmark candidates and answers
--------------------------------------------------------------------------------
DELETE FROM answers WHERE project_id IN (
  SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 5) AS n
);

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
ALTER TABLE answers DISABLE TRIGGER validate_answer_before_insert_or_update;
ALTER TABLE nominations DISABLE TRIGGER validate_nomination_before_insert_or_update;

--------------------------------------------------------------------------------
-- Generate candidates (scale per project)
-- Note: No answers column in relational schema (the column doesn't exist)
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
--------------------------------------------------------------------------------
INSERT INTO nominations (project_id, candidate_id, election_id, constituency_id)
SELECT
  c.project_id,
  c.id,
  -- Election for this project
  ('00000000-0000-0000-0004-' || lpad(
    ((SELECT row_number FROM (
      SELECT id, row_number() OVER (ORDER BY id) AS row_number FROM projects
      WHERE id IN (
        SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid
        FROM generate_series(1, 5) AS n
      )
    ) sub WHERE sub.id = c.project_id))::text, 12, '0'))::uuid,
  -- Random constituency within the project's 10 constituencies
  ('00000000-0000-0000-0002-' || lpad(
    (
      (SELECT row_number FROM (
        SELECT id, row_number() OVER (ORDER BY id) AS row_number FROM projects
        WHERE id IN (
          SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid
          FROM generate_series(1, 5) AS n
        )
      ) sub WHERE sub.id = c.project_id) - 1
    ) * 10 + (floor(random() * 10) + 1)::int
  )::text, 12, '0'))::uuid
FROM candidates c
WHERE c.project_id IN (
  SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid
  FROM generate_series(1, 5) AS n
);

--------------------------------------------------------------------------------
-- Generate relational answers (~85% completion rate)
-- One row per candidate-question pair with ~85% chance of being created.
-- Value: raw integer as jsonb (the trigger wraps it, so we store directly).
--------------------------------------------------------------------------------
INSERT INTO answers (project_id, entity_id, entity_type, question_id, value)
SELECT
  c.project_id,
  c.id,
  'candidate',
  q.id,
  to_jsonb((floor(random() * 5) + 1)::int)
FROM candidates c
CROSS JOIN questions q
WHERE q.project_id = c.project_id
  AND c.project_id IN (
    SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid
    FROM generate_series(1, 5) AS n
  )
  AND random() < 0.85;

--------------------------------------------------------------------------------
-- Re-enable triggers
--------------------------------------------------------------------------------
ALTER TABLE answers ENABLE TRIGGER validate_answer_before_insert_or_update;
ALTER TABLE nominations ENABLE TRIGGER validate_nomination_before_insert_or_update;

COMMIT;

-- Report summary
SELECT 'Relational candidate generation complete' AS status,
  (SELECT count(*) FROM candidates WHERE project_id IN (
    SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n
  )) AS total_candidates,
  (SELECT count(*) FROM nominations WHERE project_id IN (
    SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n
  ) AND candidate_id IS NOT NULL) AS total_nominations,
  (SELECT count(*) FROM answers WHERE project_id IN (
    SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n
  )) AS total_answers,
  (SELECT avg(answer_count) FROM (
    SELECT count(*) AS answer_count
    FROM answers
    WHERE project_id IN (
      SELECT ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid FROM generate_series(1, 5) AS n
    )
    GROUP BY entity_id
    LIMIT 100
  ) sub) AS avg_answers_per_candidate;
