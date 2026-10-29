--------------------------------------------------------------------------------
-- Whether an open invitation of a project holds an address, asked by the service role
--
-- WHAT IT ADDS. public.address_holds_open_invitation, a stable SECURITY DEFINER function the service role alone may execute. It answers true when an invitation of the project that is not claimed and has not expired holds the address, trimmed and lower-cased, as its `email` or its `pending_email`.
--
-- WHAT IT LEAVES. Every table, policy and other function.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- address_holds_open_invitation: does an open invitation of a project hold an address
--
-- True when an invitation of p_project_id that is open holds the address, trimmed and lower-cased, as its `email` or as its `pending_email`, and false otherwise. Open is `claimed_at IS NULL` and not expired: no `expires_at`, or one still in the future. The registration-mode matrix is not asked: a promise waiting for its address is the address's whatever modes the project allows at the moment.
--
-- The stored `email` and `pending_email` are held trimmed and lower-cased by the table's CHECKs, so the argument is put in that form and compared with them as stored.
--
-- A null project, a null address and a blank address answer false.
--
-- WHO ASKS. The `confirm-address` operation of the `account-access` Edge Function, for an address a signed-in account an identity provider made has typed, after it has taken that account's and that address's slots through address_confirmation_request; a true answer is reported to the caller as the address being in use. The answer is therefore an invitation-existence answer, bounded by those two slots and given only to the holder of such an account's own token.
--
-- It writes nothing. SECURITY DEFINER because no API role can read `pending_email`, nor the invitations of a project it does not administer; it trusts its arguments, so the service role alone may execute it.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.address_holds_open_invitation (p_project_id uuid, p_email text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND (
        i.email = NULLIF(lower(btrim(p_email)), '')
        OR i.pending_email = NULLIF(lower(btrim(p_email)), '')
      )
  );
$$;

REVOKE
EXECUTE ON FUNCTION public.address_holds_open_invitation (uuid, text)
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT
EXECUTE ON FUNCTION public.address_holds_open_invitation (uuid, text) TO service_role;
