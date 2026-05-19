-- Admin jobs: job result persistence for admin features
--
-- Stores results of admin operations (e.g., QuestionInfoGeneration, ArgumentGeneration).
-- Records are immutable -- no UPDATE policy. Admins can INSERT new results and
-- SELECT/DELETE existing ones for their project.

CREATE TABLE public.admin_jobs (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  job_id          text          NOT NULL,
  job_type        text          NOT NULL,
  election_id     uuid          REFERENCES public.elections(id) ON DELETE SET NULL,
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
  BEFORE UPDATE ON public.admin_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
