-- candidate-write-relational.sql
--
-- Simulates: candidate updates a single answer (upsert into answers table).
-- Tests relational single-row insert/update performance.
--
-- pgbench usage:
--   pgbench -h 127.0.0.1 -p 54322 -U postgres -c 1 -T 30 --log -f candidate-write-relational.sql postgres
--   pgbench -h 127.0.0.1 -p 54322 -U postgres -c 100 -j 4 -T 30 --log -f candidate-write-relational.sql postgres

\set project_num random(1, 5)
\set question_num random(1, 50)
\set answer_value random(1, 5)
\set question_offset :project_num * 50 - 50 + :question_num

INSERT INTO answers (project_id, entity_id, entity_type, question_id, value)
SELECT
  ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid,
  c.id,
  'candidate',
  ('00000000-0000-0000-0003-' || lpad(:question_offset::text, 12, '0'))::uuid,
  to_jsonb(:answer_value)
FROM candidates c
WHERE c.project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
ORDER BY c.id OFFSET floor(random() * 100) LIMIT 1
ON CONFLICT (entity_id, question_id)
DO UPDATE SET value = EXCLUDED.value;
