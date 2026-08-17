-- voter-bulk-read-relational-lateral.sql
--
-- Optimized relational read: LATERAL JOIN for answer aggregation.
-- PostgreSQL can optimize the lateral subquery per-row more efficiently
-- than a correlated subquery in SELECT.

\set project_num random(1, 5)
\set constituency_num random(1, 10)
\set constituency_offset :project_num * 10 - 10 + :constituency_num

SELECT c.id, c.first_name, c.last_name, c.name,
  COALESCE(agg.answers, '{}'::jsonb) AS answers
FROM candidates c
INNER JOIN nominations n ON n.candidate_id = c.id
LEFT JOIN LATERAL (
  SELECT jsonb_object_agg(a.question_id::text, jsonb_build_object('value', a.value)) AS answers
  FROM answers a
  WHERE a.entity_id = c.id AND a.entity_type = 'candidate'
) agg ON true
WHERE n.constituency_id = ('00000000-0000-0000-0002-' || lpad(:constituency_offset::text, 12, '0'))::uuid
  AND n.project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
  AND c.published = true;
