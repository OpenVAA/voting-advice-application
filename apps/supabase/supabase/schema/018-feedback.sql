-- Feedback table: anonymous voter feedback submissions
--
-- At least one of rating or description must be present (CHECK constraint).
-- No UPDATE policy — feedback is immutable after insert.
-- RLS policies are in 010-rls.sql.
-- Rate limiting trigger prevents spam (5 requests per 5 minutes per IP).

--------------------------------------------------------------------------------
-- Private schema for rate limiting (not exposed via PostgREST)
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.feedback_rate_limits (
  ip_address   text        PRIMARY KEY,
  count        integer     NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- Feedback table
--------------------------------------------------------------------------------
CREATE TABLE feedback (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rating      integer,
  description text,
  date        timestamptz NOT NULL DEFAULT now(),
  url         text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_rating_or_description CHECK (
    rating IS NOT NULL OR description IS NOT NULL
  )
);

--------------------------------------------------------------------------------
-- Rate limiting: 5 requests per 5-minute window per client IP
--
-- SECURITY DEFINER with explicit search_path: writes to private schema.
-- IP extracted from PostgREST request.headers (x-forwarded-for).
-- Advisory lock prevents race conditions on concurrent inserts from same IP.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_feedback_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  client_ip     text;
  current_count integer;
  window_secs   interval := interval '5 minutes';
  max_requests  integer  := 5;
BEGIN
  -- Extract first IP from x-forwarded-for header (handles proxy chains)
  client_ip := SPLIT_PART(
    COALESCE(
      (current_setting('request.headers', true)::json ->> 'x-forwarded-for'),
      'unknown'
    ) || ',',
    ',', 1
  );
  client_ip := TRIM(client_ip);

  -- Advisory lock to serialize concurrent inserts from the same IP
  PERFORM pg_advisory_xact_lock(hashtext('feedback_rate:' || client_ip));

  -- Upsert rate limit counter (reset window if expired)
  INSERT INTO private.feedback_rate_limits (ip_address, count, window_start)
  VALUES (client_ip, 1, now())
  ON CONFLICT (ip_address) DO UPDATE
    SET count = CASE
          WHEN private.feedback_rate_limits.window_start + window_secs <= now()
          THEN 1
          ELSE private.feedback_rate_limits.count + 1
        END,
        window_start = CASE
          WHEN private.feedback_rate_limits.window_start + window_secs <= now()
          THEN now()
          ELSE private.feedback_rate_limits.window_start
        END;

  SELECT count INTO current_count
  FROM private.feedback_rate_limits
  WHERE ip_address = client_ip;

  IF current_count > max_requests THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_feedback_rate_limit
  BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION check_feedback_rate_limit();
