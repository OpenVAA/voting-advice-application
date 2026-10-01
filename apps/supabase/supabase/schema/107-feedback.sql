-- Feedback table: anonymous voter feedback submissions
--
-- At least one of rating or description must be present (CHECK constraint).
-- No UPDATE policy -- feedback is immutable after insert.
-- RLS policies are in 302-rls.sql.
-- Rate limiting trigger prevents spam (5 requests per 5 minutes per IP).
--
-- `project_id` is nullable and its foreign key is ON DELETE SET NULL, so feedback outlives the project it is about. The two go together: SET NULL into a NOT NULL column would make the project delete fail.
--
-- The `enforce_feedback_project` trigger requires `project_id` at insert time. The API roles have no feedback UPDATE policy, so for them a NULL project arises only through ON DELETE SET NULL; the service role and the owner can still write one by UPDATE.
--
-- A null project_id makes the project-scoped predicates of `admin_select_feedback` and `admin_delete_feedback` (302-rls.sql) null, so each carries a second disjunct that admits a global-scope grant holder when `project_id IS NULL`. Only such a holder can read or delete an orphaned row.
--------------------------------------------------------------------------------
-- Private schema for rate limiting (not exposed via PostgREST)
--------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.feedback_rate_limits (
  -- The key `private.feedback_client_ip` derives from the request headers, or `unknown`.
  ip_address text PRIMARY KEY,
  -- Requests from the address in the current window.
  count integer NOT NULL DEFAULT 1,
  -- When the current window began; check_feedback_rate_limit starts a new one after five minutes.
  window_start timestamptz NOT NULL DEFAULT now()
);

--------------------------------------------------------------------------------
-- Per-deployment settings that migrations cannot know
--
-- A single row: the `singleton` key admits only `true`. `behind_cloudflare` states that every request reaches the API through Cloudflare, which sets `cf-connecting-ip` itself to the connecting client. Its only reader is `check_feedback_rate_limit`, which trusts `cf-connecting-ip` only when it is true.
--
-- The migration ships it false. Hosted Supabase is behind Cloudflare, so a hosted deployment sets it once in the SQL editor with `UPDATE private.deployment_settings SET behind_cloudflare = true;`. A self-hosted gateway qualifies only when its origin accepts connections from Cloudflare alone; otherwise a client can send its own `cf-connecting-ip`. The local stack sets it in seed.sql.
--
-- Only the owner reads or writes it: the SECURITY DEFINER trigger, the seed and an operator. RLS is enabled with no policy and every API role's privileges are revoked.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS private.deployment_settings (
  -- The primary key, which only `true` passes, so the table holds at most one row.
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  -- True when every request reaches the API through Cloudflare.
  behind_cloudflare boolean NOT NULL DEFAULT false
);

INSERT INTO
  private.deployment_settings
DEFAULT VALUES
ON CONFLICT DO NOTHING;

ALTER TABLE private.deployment_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.deployment_settings
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

--------------------------------------------------------------------------------
-- The client address the feedback rate limit is keyed on
--
-- With `p_trust_cf_connecting_ip` true, the key is `cf-connecting-ip` when it parses as an address, otherwise the last `x-forwarded-for` entry when that parses, otherwise `unknown`. With it false, `cf-connecting-ip` is not read and the key is the last `x-forwarded-for` entry or `unknown`. The value is normalised with `host()`. The flag has no default, so every caller decides.
--
-- `check_feedback_rate_limit` passes `private.deployment_settings.behind_cloudflare`. Behind Cloudflare, `cf-connecting-ip` is the connecting client and a client cannot choose it. Without Cloudflare in front, as on the local CLI stack or most self-hosted gateways, Kong forwards a client-sent `cf-connecting-ip` unchanged, so an untrusted deployment keys on the gateway-appended hop instead.
--
-- The gateway appends the last `x-forwarded-for` entry from the connection's peer; the earlier entries are written by the client and are never read, not even when the last entry is malformed. On hosted Supabase the last entry can be a platform-internal address shared by many voters, so a hosted deployment that leaves `behind_cloudflare` false collapses those voters into one bucket. That is why hosted deployments must set it.
--
-- Only the SECURITY DEFINER trigger `check_feedback_rate_limit` calls this function, so EXECUTE is revoked from PUBLIC here, and from the API roles after the blanket `private` grant in 301-auth-functions.sql.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.feedback_client_ip (p_headers json, p_trust_cf_connecting_ip boolean) RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  p_candidate text;
BEGIN
  IF p_headers IS NULL THEN
    RETURN 'unknown';
  END IF;

  IF p_trust_cf_connecting_ip THEN
    p_candidate := NULLIF(btrim(p_headers ->> 'cf-connecting-ip'), '');
    IF p_candidate IS NOT NULL THEN
      BEGIN
        RETURN host(p_candidate::inet);
      EXCEPTION
        WHEN invalid_text_representation THEN
          NULL;
      END;
    END IF;
  END IF;

  p_candidate := NULLIF(btrim(split_part(p_headers ->> 'x-forwarded-for', ',', -1)), '');
  IF p_candidate IS NOT NULL THEN
    BEGIN
      RETURN host(p_candidate::inet);
    EXCEPTION
      WHEN invalid_text_representation THEN
        NULL;
    END;
  END IF;

  RETURN 'unknown';
END;
$$;

REVOKE
EXECUTE ON FUNCTION private.feedback_client_ip (json, boolean)
FROM
  PUBLIC;

--------------------------------------------------------------------------------
-- Feedback table
--------------------------------------------------------------------------------
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  -- 1 to 5 in the feedback components; the database does not check the range.
  rating integer,
  description text,
  -- When the voter sent the feedback, as the client reports it; `created_at` is when the row was stored.
  date timestamptz NOT NULL DEFAULT now(),
  -- The page the feedback was sent from.
  url text,
  -- The client's user-agent string.
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
  p_client_ip         text;
  p_behind_cloudflare boolean;
  p_current_count     integer;
  p_window_secs       interval := interval '5 minutes';
  p_max_requests      integer  := 5;
BEGIN
  -- A missing settings row reads as false, so cf-connecting-ip is then not trusted.
  p_behind_cloudflare := COALESCE((SELECT behind_cloudflare FROM private.deployment_settings), false);
  p_client_ip := private.feedback_client_ip(current_setting('request.headers', true)::json, p_behind_cloudflare);

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

--------------------------------------------------------------------------------
-- A feedback row must name its project when inserted
--
-- The INSERT policies are `WITH CHECK (true)`, so this trigger is what refuses a NULL `project_id`, for every caller. It is INSERT-only because the foreign key's ON DELETE SET NULL is itself an UPDATE, which an UPDATE guard would refuse. A NULL project therefore still arises through ON DELETE SET NULL, and through an UPDATE by the service role or the owner; the API roles have no feedback UPDATE policy.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_feedback_project () RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  IF NEW.project_id IS NULL THEN
    RAISE EXCEPTION 'feedback.project_id must name a project'
      USING ERRCODE = 'not_null_violation',
            SCHEMA = 'public',
            TABLE = 'feedback',
            COLUMN = 'project_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_feedback_project
BEFORE INSERT ON public.feedback FOR EACH ROW
EXECUTE FUNCTION public.enforce_feedback_project ();
