-- aggregation-relational.sql
--
-- Simulates: aggregate answer statistics per question (e.g., for charts/stats).
-- Simple GROUP BY on the relational answers table.
--
-- pgbench usage:
--   pgbench -h 127.0.0.1 -p 54322 -U postgres -c 1 -T 30 --log -f aggregation-relational.sql postgres

\set project_num random(1, 5)

SELECT question_id, count(*) AS answer_count,
  avg((value->>'value')::numeric) AS avg_value
FROM answers
WHERE project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
  AND entity_type = 'candidate'
GROUP BY question_id;
