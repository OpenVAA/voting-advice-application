-- voter-bulk-read-relational-two-query.sql
--
-- Two-query approach: fetch candidates first, then batch-fetch answers separately.
-- This avoids the aggregation overhead entirely — the frontend would join them.
-- Both queries run in a single pgbench transaction for fair timing.

\set project_num random(1, 5)
\set constituency_num random(1, 10)
\set constituency_offset :project_num * 10 - 10 + :constituency_num

BEGIN;

-- Query 1: Get candidates
SELECT c.id, c.first_name, c.last_name, c.name
FROM candidates c
INNER JOIN nominations n ON n.candidate_id = c.id
WHERE n.constituency_id = ('00000000-0000-0000-0002-' || lpad(:constituency_offset::text, 12, '0'))::uuid
  AND n.project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
  AND c.published = true;

-- Query 2: Batch-fetch all answers for candidates in this constituency
SELECT a.entity_id, a.question_id, a.value
FROM answers a
WHERE a.entity_id IN (
  SELECT c.id
  FROM candidates c
  INNER JOIN nominations n ON n.candidate_id = c.id
  WHERE n.constituency_id = ('00000000-0000-0000-0002-' || lpad(:constituency_offset::text, 12, '0'))::uuid
    AND n.project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
    AND c.published = true
)
AND a.entity_type = 'candidate';

END;
