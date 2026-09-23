-- Question RPC functions
--
-- Functions:
--   get_questions() - return question categories and their questions in one round trip
--------------------------------------------------------------------------------
-- get_questions RPC: returns question categories and questions in a single round trip
--
-- The return is a single jsonb value of the shape { "categories": [...], "questions": [...] }. A jsonb return was chosen over a tabular one because the two result sets are heterogeneous, and because it adds no new tabular column and therefore no new nullability metadata for the generated types to misstate; the adapter validates the payload with zod regardless, so generated column typing buys nothing here.
--
-- p_project_id is REQUIRED and carries no DEFAULT, so a caller that omits it gets an undefined_function error rather than every project's questions. Migration 00006 introduced it by dropping the three-argument form and re-creating the four-argument one; see that file for why a defaulted project parameter would have reproduced the leak under a new name.
--
-- Filter semantics, on the three OPTIONAL axes and for both tables: NULL or empty means "applies to all", never "applies to none". A row is included when the parameter is NULL, when the row's column is NULL, when the column is an empty array, or when the column contains the parameter. Categories and questions are filtered independently, so a question narrower than its category is excluded on its own terms.
--
-- Note that question_categories.election_rounds and questions.election_rounds are JSONB arrays, unlike the scalar nominations.election_round that get_nominations filters; the two predicates are not interchangeable.
--
-- SECURITY INVOKER: the reads run with the caller's permissions, so the question_categories and questions RLS policies gate the caller rather than the function owner.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_questions (
  p_project_id uuid,
  p_election_id uuid DEFAULT NULL,
  p_constituency_id uuid DEFAULT NULL,
  p_election_round integer DEFAULT NULL
) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT jsonb_build_object(
    'categories',
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(qc) ORDER BY qc.sort_order NULLS LAST, qc.id)
        FROM public.question_categories qc
        -- The project predicate is an unconditional equality rather than the `IS NULL OR` shape the other three filters use, because there is no "every project" case: a caller without a project is a caller that should not be reading questions at all. It is stated FIRST so that a reader checking the leak is closed does not have to read past three defaulted filters to find it.
        WHERE qc.project_id = p_project_id
          AND (p_election_id IS NULL
               OR qc.election_ids IS NULL
               OR jsonb_array_length(qc.election_ids) = 0
               OR qc.election_ids @> to_jsonb(p_election_id::text))
          AND (p_constituency_id IS NULL
               OR qc.constituency_ids IS NULL
               OR jsonb_array_length(qc.constituency_ids) = 0
               OR qc.constituency_ids @> to_jsonb(p_constituency_id::text))
          AND (p_election_round IS NULL
               OR qc.election_rounds IS NULL
               OR jsonb_array_length(qc.election_rounds) = 0
               OR qc.election_rounds @> to_jsonb(p_election_round))
      ),
      '[]'::jsonb
    ),
    'questions',
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(q) ORDER BY q.sort_order NULLS LAST, q.id)
        FROM public.questions q
        WHERE q.project_id = p_project_id
          AND (p_election_id IS NULL
               OR q.election_ids IS NULL
               OR jsonb_array_length(q.election_ids) = 0
               OR q.election_ids @> to_jsonb(p_election_id::text))
          AND (p_constituency_id IS NULL
               OR q.constituency_ids IS NULL
               OR jsonb_array_length(q.constituency_ids) = 0
               OR q.constituency_ids @> to_jsonb(p_constituency_id::text))
          AND (p_election_round IS NULL
               OR q.election_rounds IS NULL
               OR jsonb_array_length(q.election_rounds) = 0
               OR q.election_rounds @> to_jsonb(p_election_round))
      ),
      '[]'::jsonb
    )
  );
$$;

GRANT
EXECUTE ON FUNCTION public.get_questions (uuid, uuid, uuid, integer) TO anon,
authenticated;
