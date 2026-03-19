-- Test helpers: generic JSONB deep-merge RPC for test infrastructure
--
-- jsonb_recursive_merge: recursively merges two JSONB objects. When both
-- sides are objects, keys are merged recursively. Otherwise, the patch
-- value wins.
--
-- merge_jsonb_column: generic RPC for deep-merging a partial JSONB payload
-- into any JSONB column of any table. Used by SupabaseAdminClient to update
-- app_settings.settings without replacing sibling keys.
--
-- SECURITY INVOKER: runs with caller's permissions so that RLS policies on
-- the target table are enforced.

--------------------------------------------------------------------------------
-- jsonb_recursive_merge: recursive deep merge of two JSONB values
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION jsonb_recursive_merge(base jsonb, patch jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN jsonb_typeof(base) = 'object' AND jsonb_typeof(patch) = 'object' THEN
      (SELECT jsonb_object_agg(
        COALESCE(k, pk),
        CASE
          WHEN k IS NOT NULL AND pk IS NOT NULL THEN jsonb_recursive_merge(base -> k, patch -> pk)
          WHEN pk IS NOT NULL THEN patch -> pk
          ELSE base -> k
        END
      )
      FROM (
        SELECT DISTINCT COALESCE(k, pk) AS key, k, pk
        FROM jsonb_object_keys(base) k
        FULL OUTER JOIN jsonb_object_keys(patch) pk ON k = pk
      ) keys)
    ELSE patch
  END;
$$;

--------------------------------------------------------------------------------
-- merge_jsonb_column: generic deep-merge into any table's JSONB column
--
-- Parameters:
--   p_table_name   - name of the target table
--   p_column_name  - name of the JSONB column to merge into
--   p_row_id       - UUID primary key of the row to update
--   p_partial_data - JSONB object to deep-merge into the existing value
--
-- SECURITY INVOKER: the caller's RLS policies apply to the UPDATE
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION merge_jsonb_column(
  p_table_name text,
  p_column_name text,
  p_row_id uuid,
  p_partial_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = jsonb_recursive_merge(%I, $1) WHERE id = $2',
    p_table_name, p_column_name, p_column_name
  ) USING p_partial_data, p_row_id;
END;
$$;

--------------------------------------------------------------------------------
-- Grants: service_role and authenticated can call these functions
--------------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION jsonb_recursive_merge(jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION merge_jsonb_column(text, text, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION merge_jsonb_column(text, text, uuid, jsonb) TO authenticated;
