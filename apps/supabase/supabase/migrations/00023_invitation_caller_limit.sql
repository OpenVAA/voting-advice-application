--------------------------------------------------------------------------------
-- A limit on the invitation operations per caller and project, keyed on the address Cloudflare names
--
-- WHAT IT CHANGES. Adds public.invitation_caller_take, which counts one invitation operation against the limit of the address it came from, thirty per project per ten minutes, under a `caller:` key of private.invitation_throttle, and which the service role alone may execute.
--
-- WHAT IT LEAVES. Every table, policy and other function, and the other key forms of private.invitation_throttle.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- invitation_caller_take: count one invitation operation against the caller's limit in a project
--
-- Returns 0 when the take is admitted, and otherwise the whole seconds until the caller's window ends, at least 1: thirty takes per caller per project per ten minutes. A refused take is counted, as every take of invitation_throttle_take is.
--
-- The caller is p_address, the address the Edge Function read from `cf-connecting-ip`, keyed as `caller:<project id>:<caller>`, where the caller is the host of an IPv4 address and the /64 of an IPv6 address, so a mask in the header cannot widen a key. The address is trusted only when `private.deployment_settings.behind_cloudflare` is true, because only behind Cloudflare is `cf-connecting-ip` the connecting client rather than a value the client chose. An untrusted, absent, blank or unparseable address, and an id that names no project, are admitted with no row written: such takes would otherwise all share one bucket, so one caller could spend everyone's slots, or fill the table with keys of its own making.
--
-- Each take first deletes every `caller:` row whose window has ended, so an address is held in clear only while its window runs.
--
-- SECURITY DEFINER because the throttle table is the owner's alone. It checks nothing about its caller, so only the service role may execute it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_caller_take (p_project_id uuid, p_address text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_max constant integer := 30;
  v_window constant interval := interval '10 minutes';
  v_inet inet;
  v_caller text;
  v_key text;
  v_start timestamptz;
BEGIN
  -- A missing settings row reads as false, so the address is then not trusted.
  IF NOT COALESCE((SELECT s.behind_cloudflare FROM private.deployment_settings s), false)
     OR NULLIF(btrim(p_address), '') IS NULL THEN
    RETURN 0;
  END IF;

  BEGIN
    v_inet := btrim(p_address)::inet;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN 0;
  END;

  v_caller := CASE family(v_inet)
    WHEN 6 THEN network(set_masklen(v_inet, 64))::text
    ELSE host(v_inet)
  END;

  IF NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = p_project_id) THEN
    RETURN 0;
  END IF;

  DELETE FROM private.invitation_throttle t
  WHERE t.key LIKE 'caller:%' AND t.window_start + v_window <= now();

  v_key := 'caller:' || p_project_id::text || ':' || v_caller;
  IF private.invitation_throttle_take(v_key, v_max, v_window) THEN
    RETURN 0;
  END IF;

  SELECT t.window_start INTO v_start FROM private.invitation_throttle t WHERE t.key = v_key;
  RETURN GREATEST(1, ceil(extract(epoch FROM (v_start + v_window - now())))::integer);
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.invitation_caller_take (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.invitation_caller_take (uuid, text) TO service_role;
