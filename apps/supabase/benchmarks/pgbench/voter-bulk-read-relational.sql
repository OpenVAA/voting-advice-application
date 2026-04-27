-- voter-bulk-read-relational.sql
--
-- Simulates: voter loads all candidates in their constituency with answers
-- aggregated from the relational answers table into a JSONB shape.
-- Uses single-query JSON aggregation for fair comparison with JSONB variant.
--
-- pgbench usage:
--   pgbench -h 127.0.0.1 -p 54322 -U postgres -c 1 -T 30 --log -f voter-bulk-read-relational.sql postgres

\set project_num random(1, 5)
\set constituency_num random(1, 10)
\set constituency_offset :project_num * 10 - 10 + :constituency_num

SELECT c.id, c.first_name, c.last_name, c.name,
  COALESCE(
    (SELECT jsonb_object_agg(a.question_id::text, jsonb_build_object('value', a.value))
     FROM answers a
     WHERE a.entity_id = c.id AND a.entity_type = 'candidate'),
    '{}'::jsonb
  ) AS answers
FROM candidates c
INNER JOIN nominations n ON n.candidate_id = c.id
WHERE n.constituency_id = ('00000000-0000-0000-0002-' || lpad(:constituency_offset::text, 12, '0'))::uuid
  AND n.project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
  AND c.published = true;
