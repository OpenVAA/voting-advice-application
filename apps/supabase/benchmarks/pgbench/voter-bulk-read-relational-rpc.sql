-- voter-bulk-read-relational-rpc.sql
--
-- Uses an RPC function to fetch candidates with answers.
-- The function encapsulates the correlated subquery, allowing PostgreSQL
-- to optimize the query plan as a whole.

\set project_num random(1, 5)
\set constituency_num random(1, 10)
\set constituency_offset :project_num * 10 - 10 + :constituency_num

SELECT * FROM get_candidates_with_answers(
  ('00000000-0000-0000-0002-' || lpad(:constituency_offset::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0001-' || lpad(:project_num::text, 12, '0'))::uuid
);
