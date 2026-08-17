-- candidate-full-save-relational.sql
--
-- Simulates: candidate saves all 50 answers at once (full form submit).
-- Uses a single multi-value INSERT...ON CONFLICT for all questions for one candidate.
--
-- pgbench usage:
--   pgbench -h 127.0.0.1 -p 54322 -U postgres -c 1 -T 30 --log -f candidate-full-save-relational.sql postgres

\set project_num random(1, 5)

WITH target AS (
  SELECT id FROM candidates
  WHERE project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
  ORDER BY id OFFSET floor(random() * 100) LIMIT 1
)
INSERT INTO answers (project_id, entity_id, entity_type, question_id, value)
SELECT
  ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid,
  target.id,
  'candidate',
  q.id,
  to_jsonb((floor(random() * 5) + 1)::int)
FROM questions q, target
WHERE q.project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
ON CONFLICT (entity_id, question_id)
DO UPDATE SET value = EXCLUDED.value;
