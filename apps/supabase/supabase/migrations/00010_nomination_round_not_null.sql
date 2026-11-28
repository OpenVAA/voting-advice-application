--------------------------------------------------------------------------------
-- A nomination's election round is never NULL: round 1 is the only representation of the default round
--
-- WHAT IT CHANGES. Sets `election_round` to 1 on every nomination that stores NULL, then makes public.nominations.election_round NOT NULL. A write that sends an explicit NULL for the column is now refused instead of storing a row that get_nominations' round filter would drop.
--
-- WHAT IT LEAVES. The column's DEFAULT 1, the nominations_election_round_check constraint, the unique key and every function, including those that compare `COALESCE(election_round, 1)`.
--------------------------------------------------------------------------------

UPDATE public.nominations
SET
  election_round = 1
WHERE
  election_round IS NULL;

ALTER TABLE public.nominations
ALTER COLUMN election_round
SET NOT NULL;
