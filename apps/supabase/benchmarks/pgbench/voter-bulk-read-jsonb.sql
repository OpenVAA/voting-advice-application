-- voter-bulk-read-jsonb.sql
--
-- Simulates: voter loads all candidates in their constituency with JSONB answers.
-- Also used for concurrent-read tests with -c 100/500.
--
-- pgbench usage:
--   pgbench -h 127.0.0.1 -p 54322 -U postgres -c 1 -T 30 --log -f voter-bulk-read-jsonb.sql postgres

\set project_num random(1, 5)
\set constituency_num random(1, 10)
\set constituency_offset :project_num * 10 - 10 + :constituency_num

SELECT c.id, c.first_name, c.last_name, c.name, c.answers
FROM candidates c
INNER JOIN nominations n ON n.candidate_id = c.id
WHERE n.constituency_id = ('00000000-0000-0000-0002-' || lpad(:constituency_offset::text, 12, '0'))::uuid
  AND n.project_id = ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
  AND c.published = true;
