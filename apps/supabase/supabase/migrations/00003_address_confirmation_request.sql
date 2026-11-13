--------------------------------------------------------------------------------
-- address_confirmation_request: may one confirmation mail go to an address for a signed-in account
--
-- Answers true when both of two slots were taken, and false otherwise; a false answer means no mail.
-- - The caller's slot, `confirm:<user id>`: ten requests per user per fifteen minutes, whatever project a request names. The operation that sends this mail also tells its caller whether the address belongs to another account, so the caller's own count bounds how many addresses one account can ask about. It is taken first, and a refused take is counted, so a caller at its limit learns nothing more whatever addresses it sends.
-- - The address's slot, `confirm-address:<sha256 hex of the address>`: one per address per 60 seconds, whatever project a request names. address_confirmation_release gives it back when no mail was handed over. The address is trimmed and lower-cased before it is hashed.
--
-- NEITHER SLOT NAMES THE PROJECT. The mail is the same whatever the project, and the change of address it starts is the account's, not a project's; a slot keyed on the project a request names would give a caller a fresh budget for every project id it sends.
--
-- So the address's slot is not the `link:<project id>:...` slot the sign-in and recovery mails take, and a confirmation mail and a sign-in or recovery mail to one address are limited each on its own, at one a minute. They need no shared slot: a confirmation link is a change-of-address link, which neither stops an unopened sign-in or recovery link nor is stopped by one.
--
-- p_project_id is the project the request names. The answer is false, and nothing is written, unless the user's registered-entities record, `registered_entities` of auth.users.raw_app_meta_data, holds an entry for that project. Only the service role writes that record, when an identity provider registers the user in a project, so a request can name no project its account did not register in. The `account-access` function refuses such a request before it calls this function; the check here keeps the bound when a caller does not.
--
-- A null project, user or address, and a blank address, answer false and write nothing. The user id is the one the service role read from the caller's own token.
--
-- It writes nothing but the two throttle rows. It sends nothing and returns nothing about anyone. SECURITY DEFINER because only definer functions write the throttle table and because it reads auth.users; it trusts its arguments, so the service role alone may execute it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.address_confirmation_request (p_project_id uuid, p_user_id uuid, p_email text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
BEGIN
  IF p_project_id IS NULL OR p_user_id IS NULL OR v_email IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = p_user_id
      AND jsonb_typeof(u.raw_app_meta_data -> 'registered_entities' -> p_project_id::text) = 'object'
  ) THEN
    RETURN false;
  END IF;

  IF NOT private.invitation_throttle_take(
    'confirm:' || p_user_id::text,
    10,
    interval '15 minutes'
  ) THEN
    RETURN false;
  END IF;

  IF NOT private.invitation_throttle_take(
    'confirm-address:' || encode(sha256(convert_to(v_email, 'UTF8')), 'hex'),
    1,
    interval '60 seconds'
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.address_confirmation_request (uuid, uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.address_confirmation_request (uuid, uuid, text) TO service_role;

--------------------------------------------------------------------------------
-- address_confirmation_release: give back the address's slot of a confirmation that mailed nothing
--
-- For an address_confirmation_request that answered true and after which no mail was handed over: the address belonged to another account, or the link could not be issued or mailed. It deletes the address's `confirm-address:` slot, so the address can be asked for again at once. The caller's `confirm:` slot is never given back.
--
-- It does nothing for a null or blank address or for an address that holds no slot, and it writes nothing else. SECURITY DEFINER because only the definer functions write the throttle table; the service role alone may execute it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.address_confirmation_release (p_email text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
BEGIN
  IF v_email IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM private.invitation_throttle t
  WHERE t.key = 'confirm-address:' || encode(sha256(convert_to(v_email, 'UTF8')), 'hex');
END;
$$;

REVOKE
EXECUTE ON FUNCTION public.address_confirmation_release (text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.address_confirmation_release (text) TO service_role;
