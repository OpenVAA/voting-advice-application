--------------------------------------------------------------------------------
-- Storage visibility answered by the tables' own row-level security
--
-- WHAT IT CHANGES. Re-issues public.storage_path_is_public as SECURITY INVOKER. For a path naming a row, it asks whether the calling role can read a row with that id in that project of the table the type segment names, so the table's own SELECT policies decide, and it no longer restates the anon visibility rule table by table. The project-level path still asks public.project_open_for_voters. An unrecognised type segment and any raised error still deny.
--
-- WHAT IT LEAVES. The function's signature and privileges, the anon and authenticated read policies of storage.objects that call it, public.storage_path_can, and every table, policy and other function.
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.storage_path_is_public (p_project text, p_type text, p_id text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  v_project_id uuid;
  v_entity_id uuid;
  v_row_visible boolean;
BEGIN
  IF p_type IS NULL THEN
    RETURN false;
  END IF;

  v_project_id := p_project::uuid;

  IF p_type = 'project' THEN
    RETURN public.project_open_for_voters(v_project_id);
  END IF;

  IF p_type NOT IN (
    'elections',
    'constituencies',
    'constituency_groups',
    'questions',
    'question_categories',
    'nominations',
    'candidates',
    'organizations',
    'factions',
    'alliances'
  ) THEN
    RETURN false;
  END IF;

  v_entity_id := p_id::uuid;

  EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE id = $1 AND project_id = $2)', p_type)
  INTO v_row_visible
  USING v_entity_id, v_project_id;

  RETURN COALESCE(v_row_visible, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
