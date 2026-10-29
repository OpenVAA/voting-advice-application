--------------------------------------------------------------------------------
-- cleanup_invitation_throttle_on_delete: a deleted invitation leaves no throttle key
--
-- Deletes the `link:` keys of the row's address and of its pending address in the row's project, the row's `code-bind:` key and the `code:` key of its code. An invitation that is deleted and seeded again is therefore not answered with the wait its predecessor left behind. An address's `link-address:` key is not deleted: it counts the address's mails in every project, and no one row owns it.
--
-- SECURITY DEFINER because the deleting caller holds nothing on the throttle table. search_path is pinned as on every definer function here.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_invitation_throttle_on_delete () RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  -- A null address or code hash makes its key null, which matches no row.
  DELETE FROM private.invitation_throttle t
  WHERE t.key IN (
    'link:' || OLD.project_id::text || ':' || encode(sha256(convert_to(OLD.email, 'UTF8')), 'hex'),
    'link:' || OLD.project_id::text || ':' || encode(sha256(convert_to(OLD.pending_email, 'UTF8')), 'hex'),
    'code-bind:' || OLD.id::text,
    'code:' || OLD.project_id::text || ':' || OLD.code_hash
  );
  RETURN OLD;
END;
$$;

--------------------------------------------------------------------------------
-- invitation_link_request: may a sign-in mail go out, and to which address
--
-- Returns the address a sign-in mail may be sent to, or null for "do nothing". The caller sends exactly one mail to a non-null answer, or gives the answer back through invitation_link_release.
--
-- With a code (p_code is not null) the code alone decides:
-- - It names an open row and p_email is not blank: the address is the candidate, unless the row's pending address was bound less than 60 seconds ago, or the address is another than the row's pending one and the row has already been bound to five other addresses that day (its `code-bind:<invitation id>` key). Sending again to the address the row is bound to is not a new binding.
-- - It names a claimed row whose claimant still exists: the candidate is the claimant's own address, whatever p_email holds. The claimant is read without counting against the code's look-up budget, which bounds password attempts; the address's slots below bound these mails.
-- - It names nothing, an expired row, an open row whose registration mode is switched off (private.invitation_mode_allowed), or a claimed row whose claimant is gone: null.
--
-- AN OPEN CODE IS BOUND BEFORE THE ADDRESS IS ASKED ABOUT. The row's pending address is set to the candidate and its 60-second cooldown starts before the address's slots are taken, so what the row's holder can observe afterwards, the row and its cooldown, is the same whether the typed address's slot was free or not. Whether that slot is taken depends on whether the address is eligible without the code, so the holder of one code learns nothing about another address's invitations or grants by asking for it. A request refused by the address's slots has therefore bound the row and mails nothing; a request refused by the cooldown, the binding limit or anything before them has changed no row.
--
-- Without a code, p_email is the candidate when the project holds an open invitation for it whose registration mode is allowed, or when a user with that confirmed address holds a grant in the project (private.email_holds_grant_in_project): a project-scope grant on the project or an entity-scope grant on one of its entities. Holding a global or an account grant alone does not make an address eligible.
--
-- A candidate then takes its address's two slots, and the answer is null when either is taken:
-- - `link:<project id>:<sha256 hex>`, one per address per project per 60 seconds. recovery_link_request takes the same slot, so a recovery mail and a sign-in mail to one address are limited together.
-- - `link-address:<sha256 hex>`, twenty per address per day in every project together and for both kinds of mail. It bounds how often an anonymous caller can have one address mailed, and so how often a caller can stop that address's unopened link, because a later link of either kind stops an earlier one.
-- The minute slot is taken first, so a request inside the minute spends nothing of the day. No slot is taken for an address no mail would go to.
--
-- A switched-off mode is answered as an unknown code or an uninvited address is: null, before a slot is asked for and before anything is written. It changes nothing for a claimed code, whose claimant is still answered, or for a user who holds a grant in the project.
--
-- Eligibility follows the rows as they are: whether an invitation's creator still holds the authority to promise it is not asked.
--
-- SECURITY DEFINER because it reads auth.users and `code_hash` and writes the pending address, none of which an API role can.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_link_request (
  p_project_id uuid,
  p_email text DEFAULT NULL,
  p_code text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
  v_row public.invitations%ROWTYPE;
  v_candidate text;
  v_hash text;
BEGIN
  IF p_project_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_code IS NOT NULL THEN
    SELECT i.* INTO v_row
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.code_hash = private.invitation_code_hash(p_code)
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN NULL;
    ELSIF v_row.claimed_at IS NOT NULL THEN
      SELECT u.email INTO v_candidate
      FROM auth.users u
      WHERE u.id = v_row.claimed_by
        AND NULLIF(btrim(u.email), '') IS NOT NULL;
    ELSIF v_row.expires_at IS NOT NULL AND v_row.expires_at <= now() THEN
      RETURN NULL;
    ELSIF NOT private.invitation_mode_allowed(v_row) THEN
      RETURN NULL;
    ELSIF v_email IS NULL THEN
      RETURN NULL;
    ELSIF v_row.pending_email_at IS NOT NULL AND v_row.pending_email_at + interval '60 seconds' > now() THEN
      RETURN NULL;
    ELSE
      IF v_row.pending_email IS DISTINCT FROM v_email
        AND NOT private.invitation_throttle_take('code-bind:' || v_row.id::text, 5, interval '1 day') THEN
        RETURN NULL;
      END IF;

      UPDATE public.invitations i
      SET pending_email = v_email, pending_email_at = now()
      WHERE i.id = v_row.id;

      v_candidate := v_email;
    END IF;
  ELSIF v_email IS NOT NULL AND (
    EXISTS (
      SELECT 1
      FROM public.invitations i
      WHERE i.project_id = p_project_id
        AND i.email = v_email
        AND i.claimed_at IS NULL
        AND (i.expires_at IS NULL OR i.expires_at > now())
        AND private.invitation_mode_allowed(i)
    )
    OR private.email_holds_grant_in_project(p_project_id, v_email)
  ) THEN
    v_candidate := v_email;
  END IF;

  IF v_candidate IS NULL THEN
    RETURN NULL;
  END IF;

  v_hash := encode(sha256(convert_to(lower(btrim(v_candidate)), 'UTF8')), 'hex');

  IF NOT private.invitation_throttle_take('link:' || p_project_id::text || ':' || v_hash, 1, interval '60 seconds') THEN
    RETURN NULL;
  END IF;

  IF NOT private.invitation_throttle_take('link-address:' || v_hash, 20, interval '1 day') THEN
    RETURN NULL;
  END IF;

  RETURN v_candidate;
END;
$$;

--------------------------------------------------------------------------------
-- invitation_link_release: give back what a link request took
--
-- For a sign-in or a recovery request that was answered with an address to which no mail was then handed over. It deletes the address's minute slot in the project and, when there was one, gives one take of the address's day slot back; and when p_code names an open row whose pending address is that address, it clears the row's `pending_email_at`, so the same address, and the same binding of the same code, can be asked again at once.
--
-- It changes no claimed row and no other column, and it does nothing for an address that holds no minute slot. A binding counted against a code and a look-up counted against a used code are not given back.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invitation_link_release (
  p_project_id uuid,
  p_email text,
  p_code text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
  v_hash text;
BEGIN
  IF p_project_id IS NULL OR v_email IS NULL THEN
    RETURN;
  END IF;

  v_hash := encode(sha256(convert_to(v_email, 'UTF8')), 'hex');

  DELETE FROM private.invitation_throttle t
  WHERE t.key = 'link:' || p_project_id::text || ':' || v_hash;

  IF FOUND THEN
    UPDATE private.invitation_throttle t
    SET count = t.count - 1
    WHERE t.key = 'link-address:' || v_hash
      AND t.count > 0;
  END IF;

  IF p_code IS NOT NULL THEN
    UPDATE public.invitations i
    SET pending_email_at = NULL
    WHERE i.project_id = p_project_id
      AND i.code_hash = private.invitation_code_hash(p_code)
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND i.pending_email = v_email;
  END IF;
END;
$$;

--------------------------------------------------------------------------------
-- recovery_link_request: which mail, if any, a recovery request for an address earns
--
-- Returns `{"email": <the address, trimmed and lower-cased>, "mail": <one of two words>}`, or null for "do nothing". The caller sends exactly one mail of the named kind to a non-null answer, or gives the answer back through invitation_link_release.
--
-- - `recovery` when a user with that confirmed address holds a grant in p_project_id (private.email_holds_grant_in_project). Whether the user has a password is not asked: opening a recovery link stores none, and the page it leads to sets one.
-- - `sign-in` when no such user exists and the project holds an open, unexpired invitation for the address whose registration mode is allowed (private.invitation_mode_allowed). Such an address has no password to recover, so it is sent the mail a sign-in request would have earned it.
-- - null for everything else: an address the project knows nothing of, the holder of a global or an account grant alone, an unconfirmed address, an expired or a claimed invitation, a null project and a blank address.
--
-- A non-null candidate then takes the address's two slots, the ones invitation_link_request takes under the same keys, and the answer is null when either is taken: one per address per project per 60 seconds, and twenty per address per day in every project together. A later link of either kind stops an unopened earlier one of either kind, so the two requests are limited together. No slot is taken for an address no mail would go to.
--
-- It creates no account, changes no invitation row and binds no address: the slots are all it writes. It takes a project and an address and nothing else, and it returns no user id, grant, name or reason. Which of the three outcomes an address got is known only to whoever can execute it, which is the service role alone.
--
-- SECURITY DEFINER because it reads auth.users and the grants of accounts that are not the caller's.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recovery_link_request (p_project_id uuid, p_email text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_email text := NULLIF(lower(btrim(p_email)), '');
  v_mail text;
  v_hash text;
BEGIN
  IF p_project_id IS NULL OR v_email IS NULL THEN
    RETURN NULL;
  END IF;

  IF private.email_holds_grant_in_project(p_project_id, v_email) THEN
    v_mail := 'recovery';
  ELSIF EXISTS (
    SELECT 1
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.email = v_email
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND private.invitation_mode_allowed(i)
  ) THEN
    v_mail := 'sign-in';
  ELSE
    RETURN NULL;
  END IF;

  v_hash := encode(sha256(convert_to(v_email, 'UTF8')), 'hex');

  IF NOT private.invitation_throttle_take('link:' || p_project_id::text || ':' || v_hash, 1, interval '60 seconds') THEN
    RETURN NULL;
  END IF;

  IF NOT private.invitation_throttle_take('link-address:' || v_hash, 20, interval '1 day') THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object('email', v_email, 'mail', v_mail);
END;
$$;
