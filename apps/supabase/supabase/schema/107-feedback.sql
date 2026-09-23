-- Feedback table: anonymous voter feedback submissions
--
-- At least one of rating or description must be present (CHECK constraint).
-- No UPDATE policy -- feedback is immutable after insert.
-- RLS policies are in 302-rls.sql.
-- Rate limiting trigger prevents spam (5 requests per 5 minutes per IP).
--
-- `project_id` IS NULLABLE AND ITS FOREIGN KEY IS `ON DELETE SET NULL`, per the operator's NOTE under 162-CHECKPOINT-DECISIONS.md section 5 item P-4 (2026-09-16): feedback outlives the project it was submitted about. The nullability is not cosmetic and cannot be separated from the action -- `ON DELETE SET NULL` writing into a `NOT NULL` column makes the PROJECT delete raise rather than orphaning the row, so the two travel together.
--
-- THE CONSEQUENCE THE POLICIES OWN. Both surviving policies on this table (`admin_select_feedback`, `admin_delete_feedback` in 302-rls.sql) gate on `project_id`, and a NULL project id makes those predicates NULL, which is not `true`. An orphaned row would therefore be readable and deletable by NOBODY -- invisible, undeletable ballast -- which is not what retaining it is for. Each of those two predicates carries a second disjunct admitting the GLOBAL-SCOPE admin when `project_id IS NULL`, so an orphan stays reachable by exactly one identity. That disposition is 162-11's stated ASSUMPTION, recorded as such in 162-11-SUMMARY.md, not a ruling: the note asks for retention and does not settle who may then read it.
--------------------------------------------------------------------------------
-- Private schema for rate limiting (not exposed via PostgREST)
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.feedback_rate_limits (
  ip_address text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- Feedback table
--------------------------------------------------------------------------------
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  rating integer,
  description text,
  date timestamptz NOT NULL DEFAULT now(),
  url text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_rating_or_description CHECK (
    rating IS NOT NULL
    OR description IS NOT NULL
  )
);

--------------------------------------------------------------------------------
-- Rate limiting: 5 requests per 5-minute window per client IP
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_feedback_rate_limit () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  p_client_ip     text;
  p_current_count integer;
  p_window_secs   interval := interval '5 minutes';
  p_max_requests  integer  := 5;
BEGIN
  -- Extract first IP from x-forwarded-for header (handles proxy chains)
  p_client_ip := SPLIT_PART(
    COALESCE(
      (current_setting('request.headers', true)::json ->> 'x-forwarded-for'),
      'unknown'
    ) || ',',
    ',', 1
  );
  p_client_ip := TRIM(p_client_ip);

  -- Advisory lock to serialize concurrent inserts from the same IP
  PERFORM pg_advisory_xact_lock(hashtext('feedback_rate:' || p_client_ip));

  -- Upsert rate limit counter (reset window if expired)
  INSERT INTO private.feedback_rate_limits (ip_address, count, window_start)
  VALUES (p_client_ip, 1, now())
  ON CONFLICT (ip_address) DO UPDATE
    SET count = CASE
          WHEN private.feedback_rate_limits.window_start + p_window_secs <= now()
          THEN 1
          ELSE private.feedback_rate_limits.count + 1
        END,
        window_start = CASE
          WHEN private.feedback_rate_limits.window_start + p_window_secs <= now()
          THEN now()
          ELSE private.feedback_rate_limits.window_start
        END;

  SELECT count INTO p_current_count
  FROM private.feedback_rate_limits
  WHERE ip_address = p_client_ip;

  IF p_current_count > p_max_requests THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_feedback_rate_limit
BEFORE INSERT ON public.feedback FOR EACH ROW
EXECUTE FUNCTION public.check_feedback_rate_limit ();
