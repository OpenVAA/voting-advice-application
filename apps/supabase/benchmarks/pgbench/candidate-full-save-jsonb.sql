-- candidate-full-save-jsonb.sql
--
-- Simulates: candidate saves all 50 answers at once (full form submit).
-- Replaces entire JSONB answers document with a new one built from all questions.
--
-- pgbench usage:
--   pgbench -h 127.0.0.1 -p 54322 -U postgres -c 1 -T 30 --log -f candidate-full-save-jsonb.sql postgres

\set project_num random(1, 5)

UPDATE candidates SET answers = (
  SELECT jsonb_object_agg(
    q.id::text,
    jsonb_build_object('value', (floor(random() * 5) + 1)::int)
  )
  FROM questions q
  WHERE q.project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
)
WHERE id = (
  SELECT id FROM candidates
  WHERE project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
  ORDER BY id OFFSET floor(random() * 100) LIMIT 1
);
