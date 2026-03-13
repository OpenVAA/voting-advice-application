-- candidate-write-jsonb.sql
--
-- Simulates: candidate updates a single answer (read-modify-write via jsonb_set).
-- Tests JSONB partial update overhead including TOAST decompression/recompression.
--
-- pgbench usage:
--   pgbench -h 127.0.0.1 -p 54322 -U postgres -c 1 -T 30 --log -f candidate-write-jsonb.sql postgres
--   pgbench -h 127.0.0.1 -p 54322 -U postgres -c 100 -j 4 -T 30 --log -f candidate-write-jsonb.sql postgres

\set project_num random(1, 5)
\set question_num random(1, 50)
\set answer_value random(1, 5)
\set question_offset :project_num * 50 - 50 + :question_num

UPDATE candidates SET answers = jsonb_set(
  COALESCE(answers, '{}'::jsonb),
  ARRAY[('00000000-0000-0000-0003-' || lpad(:question_offset::text, 12, '0'))],
  jsonb_build_object('value', :answer_value)
)
WHERE id = (
  SELECT id FROM candidates
  WHERE project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
  ORDER BY id OFFSET floor(random() * 100) LIMIT 1
);
