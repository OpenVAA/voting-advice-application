-- voter-bulk-read-relational-cte.sql
--
-- Optimized relational read: CTE to find candidates, then LEFT JOIN + GROUP BY
-- to aggregate answers. Uses hash join instead of correlated subquery.

\set project_num random(1, 5)
\set constituency_num random(1, 10)
\set constituency_offset :project_num * 10 - 10 + :constituency_num

WITH cands AS (
  SELECT c.id, c.first_name, c.last_name, c.name
  FROM candidates c
  INNER JOIN nominations n ON n.candidate_id = c.id
  WHERE n.constituency_id = ('00000000-0000-0000-0002-' || lpad(:constituency_offset::text, 12, '0'))::uuid
    AND n.project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
    AND c.published = true
)
SELECT cands.id, cands.first_name, cands.last_name, cands.name,
  COALESCE(jsonb_object_agg(a.question_id::text, jsonb_build_object('value', a.value)) FILTER (WHERE a.question_id IS NOT NULL), '{}'::jsonb) AS answers
FROM cands
LEFT JOIN answers a ON a.entity_id = cands.id AND a.entity_type = 'candidate'
GROUP BY cands.id, cands.first_name, cands.last_name, cands.name;
