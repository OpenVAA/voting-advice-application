-- Admin jobs: job result persistence for admin features
--
-- Stores the results of admin feature runs (QuestionInfoGeneration, ArgumentCondensation).
-- Records are immutable -- no UPDATE policy. Admins can INSERT new results and SELECT/DELETE existing ones for their project.
CREATE TABLE public.admin_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  -- The id of the job in the frontend's admin job store; SupabaseAdminWriter.insertJobResult writes the whole row when the job ends.
  job_id text NOT NULL,
  -- The admin feature that ran, an `AdminFeature` value: `ArgumentCondensation` or `QuestionInfoGeneration`.
  job_type text NOT NULL,
  -- The election the run was scoped to; set to null when the election is deleted.
  election_id uuid REFERENCES public.elections (id) ON DELETE SET NULL,
  -- The email address of the admin who ran the job.
  author text NOT NULL,
  -- How the job ended; `aborted` means the admin stopped it.
  end_status text NOT NULL CHECK (end_status IN ('completed', 'failed', 'aborted')),
  start_time timestamptz,
  end_time timestamptz,
  -- The run's input parameters, recorded verbatim.
  input jsonb,
  -- The results the job accumulated, up to the point it ended.
  output jsonb,
  -- JSON array of the job's `JobMessage` entries, its info, warning and error messages.
  messages jsonb,
  -- The feature's own summary of the run, such as `{ questionsProcessed: n }`.
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.admin_jobs FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at ();
