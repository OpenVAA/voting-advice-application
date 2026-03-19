-- Admin jobs: job result persistence for admin features
--
-- Stores results of admin operations (e.g., QuestionInfoGeneration, ArgumentGeneration).
-- Records are immutable -- no UPDATE policy. Admins can INSERT new results and
-- SELECT/DELETE existing ones for their project.
--
-- merge_custom_data: RPC for shallow JSONB merge on questions.custom_data.
-- SECURITY INVOKER: the existing admin_update_questions RLS policy enforces access.

--------------------------------------------------------------------------------
-- admin_jobs table
--------------------------------------------------------------------------------
CREATE TABLE admin_jobs (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  job_id          text          NOT NULL,
  job_type        text          NOT NULL,
  election_id     uuid          REFERENCES elections(id) ON DELETE SET NULL,
  author          text          NOT NULL,
  end_status      text          NOT NULL CHECK (end_status IN ('completed', 'failed', 'aborted')),
  start_time      timestamptz,
  end_time        timestamptz,
  input           jsonb,
  output          jsonb,
  messages        jsonb,
  metadata        jsonb,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON admin_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

--------------------------------------------------------------------------------
-- Indexes
--------------------------------------------------------------------------------
CREATE INDEX idx_admin_jobs_project_id ON admin_jobs (project_id);
CREATE INDEX idx_admin_jobs_election_id ON admin_jobs (election_id);
CREATE INDEX idx_admin_jobs_job_type ON admin_jobs (job_type);

--------------------------------------------------------------------------------
-- RLS: admin-only (no anon access, no UPDATE -- records are immutable)
--------------------------------------------------------------------------------
ALTER TABLE admin_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_admin_jobs" ON admin_jobs
  FOR SELECT TO authenticated
  USING ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_insert_admin_jobs" ON admin_jobs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_admin_jobs" ON admin_jobs
  FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

--------------------------------------------------------------------------------
-- merge_custom_data: shallow JSONB merge on questions.custom_data
--
-- SECURITY INVOKER: runs with caller's permissions, so the existing
-- admin_update_questions RLS policy enforces that only admins with
-- can_access_project() can update questions in their project.
--
-- The || operator performs a shallow top-level merge, which is correct
-- for this use case (callers provide complete replacement values for
-- their respective keys like 'arguments', 'terms', 'video').
--
-- Parameters:
--   question_id  - UUID of the question to update
--   patch        - JSONB object to merge into custom_data
--
-- Returns: the updated custom_data JSONB
--
-- Error: raises exception if question not found or RLS blocks the UPDATE
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION merge_custom_data(
  question_id uuid,
  patch       jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  updated_data jsonb;
BEGIN
  UPDATE questions
  SET custom_data = COALESCE(custom_data, '{}'::jsonb) || patch
  WHERE id = question_id
  RETURNING questions.custom_data INTO updated_data;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found or access denied: %', question_id;
  END IF;

  RETURN updated_data;
END;
$$;

GRANT EXECUTE ON FUNCTION merge_custom_data(uuid, jsonb) TO authenticated;
