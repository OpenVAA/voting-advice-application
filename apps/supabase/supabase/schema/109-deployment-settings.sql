-- Deployment settings: per-deployment values, and the client address rule the per-caller limits share
--
-- `private.deployment_settings` holds what a deployment configures that migrations cannot know. `private.client_address_bucket` is the one rule by which the feedback rate limit (107-feedback.sql) and the account-access caller limit (506-invitation-rpcs.sql) bucket a client address.
CREATE SCHEMA IF NOT EXISTS private;

--------------------------------------------------------------------------------
-- Per-deployment settings that migrations cannot know
--
-- A single row: the `singleton` key admits only `true`. `behind_cloudflare` states that every request reaches the API through Cloudflare, which sets `cf-connecting-ip` itself to the connecting client. Its two readers are `check_feedback_rate_limit` in 107-feedback.sql, which trusts `cf-connecting-ip` only when it is true, and `access_caller_take` in 506-invitation-rpcs.sql, which keys the anonymous account-access operations' per-caller limit on the address the Edge Function read from `cf-connecting-ip` only when it is true. `access_caller_max` is that limit: the takes one caller is admitted per project per ten minutes, 30 unless the bootstrap script sets another positive number.
--
-- The migration ships `behind_cloudflare` false. Hosted Supabase is behind Cloudflare, so a hosted deployment needs it true. A self-hosted gateway qualifies only when its origin accepts connections from Cloudflare alone; otherwise a client can send its own `cf-connecting-ip`. A deployment's value is written by the bootstrap script `infra/scripts/bootstrap.sql`, and the local stack's by seed.sql.
--
-- Only the owner reads or writes it: the SECURITY DEFINER trigger `check_feedback_rate_limit` and the SECURITY DEFINER function `access_caller_take` read it, seed.sql writes the local stack's row, and the bootstrap script writes a deployment's. RLS is enabled with no policy and every API role's privileges are revoked.
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS private.deployment_settings (
  -- The primary key, which only `true` passes, so the table holds at most one row.
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  -- True when every request reaches the API through Cloudflare.
  behind_cloudflare boolean NOT NULL DEFAULT false,
  -- The takes of `access_caller_take` one caller is admitted per project per ten minutes.
  access_caller_max integer NOT NULL DEFAULT 30 CHECK (access_caller_max > 0)
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
-- The bucket of a client address: what counts as one client
--
-- Null for a NULL, blank or unparseable value. Otherwise the host of an IPv4 address, the IPv4 host of an IPv4-mapped IPv6 address (`::ffff:a.b.c.d`), and the /64 of any other IPv6 address, as `<network>/64`. A mask in the value never widens the bucket: an IPv4 address keeps its host and an IPv6 address its /64.
--
-- It is the one rule both per-caller limits key on: `private.feedback_client_ip` (107-feedback.sql) for a trusted `cf-connecting-ip`, and `access_caller_take` (506-invitation-rpcs.sql). It only parses; whether the address is trusted is each caller's to decide.
--
-- Its callers are a SECURITY INVOKER helper that only a definer trigger calls and a SECURITY DEFINER function, so EXECUTE is revoked from PUBLIC here, and from the API roles after the blanket `private` grant in 301-auth-functions.sql.
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
  PUBLIC;
