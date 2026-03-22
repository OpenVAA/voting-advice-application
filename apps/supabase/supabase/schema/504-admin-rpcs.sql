-- Admin RPC functions
--
-- Functions:
--   merge_custom_data() - shallow JSONB merge on questions.custom_data

--------------------------------------------------------------------------------
-- merge_custom_data: shallow JSONB merge on questions.custom_data
--
-- SECURITY INVOKER: the existing admin_update_questions RLS policy enforces
-- that only admins with can_access_project() can update questions.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.merge_custom_data(
  p_question_id uuid,
  p_patch       jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  p_updated_data jsonb;
BEGIN
  UPDATE public.questions
  SET custom_data = COALESCE(custom_data, '{}'::jsonb) || p_patch
  WHERE id = p_question_id
  RETURNING public.questions.custom_data INTO p_updated_data;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found or access denied: %', p_question_id;
  END IF;

  RETURN p_updated_data;
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_custom_data(uuid, jsonb) TO authenticated;
