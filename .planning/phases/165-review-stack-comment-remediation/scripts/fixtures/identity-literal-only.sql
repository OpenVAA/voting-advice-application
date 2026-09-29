-- Returns the newest published election of a project.
CREATE OR REPLACE FUNCTION public.latest_election (p_project_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  -- One row only: the newest by creation time.
  SELECT id
  FROM public.elections
  WHERE project_id = p_project_id AND status = 'archived' -- drafts are never returned
  ORDER BY created_at DESC
  LIMIT 1;
$$;
