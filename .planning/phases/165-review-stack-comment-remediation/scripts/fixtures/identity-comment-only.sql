-- The newest published election in the project.
CREATE OR REPLACE FUNCTION public.latest_election (p_project_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  -- A single row, newest first.
  SELECT id
  FROM public.elections
  WHERE project_id = p_project_id AND status = 'published' -- a draft is never returned
  ORDER BY created_at DESC
  LIMIT 1;
$$;
