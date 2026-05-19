-- aggregation-jsonb.sql
--
-- Simulates: aggregate answer statistics per question (e.g., for charts/stats).
-- Requires JSONB key extraction via jsonb_each.
--
-- pgbench usage:
--   pgbench -h 127.0.0.1 -p 54322 -U postgres -c 1 -T 30 --log -f aggregation-jsonb.sql postgres

\set project_num random(1, 5)

SELECT key AS question_id, count(*) AS answer_count,
  avg((value->>'value')::numeric) AS avg_value
FROM candidates c,
  jsonb_each(c.answers) AS kv(key, value)
WHERE c.project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
  AND c.published = true
GROUP BY key;
