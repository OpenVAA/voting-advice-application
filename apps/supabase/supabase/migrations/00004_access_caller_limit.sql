--------------------------------------------------------------------------------
-- The per-caller limit of the anonymous account-access operations, renamed, configurable and keyed by one shared address rule
--
-- WHAT IT CHANGES. Adds private.client_address_bucket, the one rule for which client a request address counts as: the host of an IPv4 address, the IPv4 host of an IPv4-mapped IPv6 address, and the /64 of any other IPv6 address. private.feedback_client_ip now keys a trusted `cf-connecting-ip` by that bucket, so an IPv6 client is one feedback bucket per /64. Adds `access_caller_max` to private.deployment_settings, 30 by default and positive. Adds public.access_caller_take, which reads its limit from that column and its caller from that bucket, with the privileges public.invitation_caller_take had: the service role alone. public.invitation_caller_take stays, as a wrapper that returns what public.access_caller_take returns, because the deployed account-access function calls it until the functions that call public.access_caller_take are deployed, and again after a rollback to earlier functions. A later migration drops it once every deployment runs the renamed functions.
--
-- WHAT IT LEAVES. Every other table, policy and function, the window of ten minutes, the `caller:` key form of private.access_throttle and its rows, and the `x-forwarded-for` fallback of private.feedback_client_ip, which still keys by host.
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.client_address_bucket (p_address text) RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET
  search_path = '' AS $$
DECLARE
  v_inet inet;
BEGIN
  IF NULLIF(btrim(p_address), '') IS NULL THEN
    RETURN NULL;
  END IF;

  BEGIN
    v_inet := btrim(p_address)::inet;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NULL;
  END;

  RETURN CASE
    WHEN family(v_inet) = 6 AND set_masklen(v_inet, 128) <<= '::ffff:0:0/96'::inet
      THEN host('0.0.0.0'::inet + (v_inet - '::ffff:0:0'::inet))
    WHEN family(v_inet) = 6 THEN network(set_masklen(v_inet, 64))::text
    ELSE host(v_inet)
  END;
END;
$$;

REVOKE
EXECUTE ON FUNCTION private.client_address_bucket (text)
FROM
  PUBLIC,
  anon,
  authenticated,
  service_role;

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
    p_candidate := private.client_address_bucket(p_headers ->> 'cf-connecting-ip');
    IF p_candidate IS NOT NULL THEN
      RETURN p_candidate;
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

ALTER TABLE private.deployment_settings
ADD COLUMN access_caller_max integer NOT NULL DEFAULT 30 CHECK (access_caller_max > 0);

CREATE OR REPLACE FUNCTION public.access_caller_take (p_project_id uuid, p_address text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_window constant interval := interval '10 minutes';
  v_trusted boolean;
  v_max integer;
  v_caller text;
  v_key text;
  v_admitted boolean;
  v_start timestamptz;
BEGIN
  SELECT s.behind_cloudflare, s.access_caller_max INTO v_trusted, v_max FROM private.deployment_settings s;

  -- A missing settings row reads as false, so the address is then not trusted.
  IF NOT COALESCE(v_trusted, false) THEN
    RETURN 0;
  END IF;

  v_caller := private.client_address_bucket(p_address);
  IF v_caller IS NULL THEN
    RETURN 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = p_project_id) THEN
    RETURN 0;
  END IF;

  v_key := 'caller:' || p_project_id::text || ':' || v_caller;
  v_admitted := private.access_throttle_take(v_key, v_max, v_window);

  DELETE FROM private.access_throttle t
  WHERE t.key IN (
    SELECT x.key
    FROM private.access_throttle x
    WHERE x.key LIKE 'caller:%'
      AND x.key <> v_key
      AND x.window_start + v_window <= now()
    FOR UPDATE SKIP LOCKED
  );

  IF v_admitted THEN
    RETURN 0;
  END IF;

  SELECT t.window_start INTO v_start FROM private.access_throttle t WHERE t.key = v_key;
  RETURN GREATEST(1, ceil(extract(epoch FROM (v_start + v_window - now())))::integer);
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.access_caller_take (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.access_caller_take (uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.invitation_caller_take (p_project_id uuid, p_address text) RETURNS integer LANGUAGE sql SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT public.access_caller_take(p_project_id, p_address);
$$;

REVOKE
EXECUTE ON FUNCTION public.invitation_caller_take (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.invitation_caller_take (uuid, text) TO service_role;
