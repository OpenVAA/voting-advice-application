--------------------------------------------------------------------------------
-- claim_invitations RPC: turn the caller's open invitations into grants
--
-- WHAT IT TRUSTS. One thing: the caller's own confirmed address, read from the caller's row of auth.users, which is the row `auth.uid()` names. A user whose `email_confirmed_at` is null, or whose address is blank, claims nothing. An account whose app metadata names an identity provider claims nothing either, whatever its address: such an account was created by an identity provider, and its address is not what decides who the person is.
--
-- WHAT IT IGNORES. It takes no address, no user id and no invitation id, so it cannot be pointed at another person's invitation, and it never reads the token's `email` claim, which can be older than the row. p_project_id only chooses which of the caller's own invitations are looked at.
--
-- WHAT IT CANNOT KNOW. The database sees that an address is confirmed and not how it came to be. This function therefore depends on the auth service refusing public sign-up and requiring confirmation by mail: where a visitor can create an account for an address without opening a mail sent to it, that visitor can claim the address's invitations. Nothing here guards against that configuration.
--
-- WHAT IT MATCHES. The rows of p_project_id that are unclaimed and unexpired and whose `email` is the caller's address, plus the code rows whose pending address is. A code row with no pending address, or with another one, is claimed by nobody. A row whose registration mode is switched off (private.invitation_mode_allowed) is not matched either: it is neither claimed nor skipped, and it stays open.
--
-- WHAT IT WRITES. One row of public.grants per claimed invitation, copying the invitation's four columns, and on the invitation `claimed_by`, `claimed_at` and a cleared pending address. It confirms no entity and creates nothing else. Whether the invitation's creator still holds the authority to promise the grant is not asked: a row that exists is honoured, and a promise is withdrawn by deleting its row.
--
-- EACH ROW BY ITSELF. Rows are taken in the order they were created, and each is claimed or skipped on its own:
-- - an entity-scope row whose target is no longer an entity of the row's project is skipped with the reason `target_not_in_project` and stays open (no foreign key holds the target, so it is asked again here);
-- - a unique violation on `grants_user_scope_target_role_key` means the caller already holds exactly this grant: the row is marked claimed and no second grant is written;
-- - a unique violation on `idx_grants_one_candidate_editor` means another user edits that candidate: the row is skipped with the reason `candidate_has_editor` and stays open;
-- - any other violation is raised and undoes the call.
--
-- Returns `{"claimed": [...], "skipped": [...], "password_set": <boolean>}`. Each element holds `scope`, `target_type`, `target_id` and `role`, and a skipped one also `reason`. `password_set` is private.user_password_set for the caller and is present whatever was claimed. No address, code or invitation id is returned. A second call claims nothing.
--
-- A grant reaches a token only when one is issued, so a caller refreshes its session after a claim that returned a non-empty `claimed` and before it reads anything the grant opens.
--
-- SECURITY DEFINER because it reads auth.users, writes public.grants and updates public.invitations, none of which the caller can. It answers for `auth.uid()`, which neither `anon` nor the service role has, so `authenticated` alone holds EXECUTE.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_invitations (p_project_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_password_set boolean := false;
  v_email text;
  v_row public.invitations%ROWTYPE;
  v_spec jsonb;
  v_constraint text;
  v_skip_reason text;
  v_claimed jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NOT NULL THEN
    v_password_set := private.user_password_set(v_uid);

    SELECT lower(btrim(u.email)) INTO v_email
    FROM auth.users u
    WHERE u.id = v_uid
      AND u.email_confirmed_at IS NOT NULL
      AND u.raw_app_meta_data ->> 'identity_provider' IS NULL
      AND NULLIF(btrim(u.email), '') IS NOT NULL;
  END IF;

  IF v_email IS NULL OR p_project_id IS NULL THEN
    RETURN jsonb_build_object('claimed', v_claimed, 'skipped', v_skipped, 'password_set', v_password_set);
  END IF;

  FOR v_row IN
    SELECT i.*
    FROM public.invitations i
    WHERE i.project_id = p_project_id
      AND i.claimed_at IS NULL
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND (i.email = v_email OR (i.code_hash IS NOT NULL AND i.pending_email = v_email))
      AND private.invitation_mode_allowed(i)
    ORDER BY i.created_at, i.id
    FOR UPDATE
  LOOP
    v_spec := jsonb_build_object(
      'scope', v_row.scope,
      'target_type', v_row.target_type,
      'target_id', v_row.target_id,
      'role', v_row.role
    );
    v_skip_reason := NULL;

    IF v_row.scope = 'entity'
       AND private.entity_project_id(v_row.target_type, v_row.target_id) IS DISTINCT FROM v_row.project_id THEN
      v_skip_reason := 'target_not_in_project';
    ELSE
      BEGIN
        INSERT INTO public.grants (user_id, scope, target_type, target_id, role)
        VALUES (v_uid, v_row.scope, v_row.target_type, v_row.target_id, v_row.role);
      EXCEPTION
        WHEN unique_violation THEN
          GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
          IF v_constraint = 'grants_user_scope_target_role_key' THEN
            -- The caller already holds exactly this grant: the promise is fulfilled.
            NULL;
          ELSIF v_constraint = 'idx_grants_one_candidate_editor' THEN
            v_skip_reason := 'candidate_has_editor';
          ELSE
            RAISE;
          END IF;
      END;
    END IF;

    IF v_skip_reason IS NOT NULL THEN
      v_skipped := v_skipped || jsonb_build_array(v_spec || jsonb_build_object('reason', v_skip_reason));
    ELSE
      UPDATE public.invitations i
      SET claimed_by = v_uid, claimed_at = now(), pending_email = NULL, pending_email_at = NULL
      WHERE i.id = v_row.id;
      v_claimed := v_claimed || jsonb_build_array(v_spec);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('claimed', v_claimed, 'skipped', v_skipped, 'password_set', v_password_set);
END;
$$;
