--------------------------------------------------------------------------------
-- invitations_email_target_key: one open promise per address and target
--
-- WHAT IT ADMITS. A new invitation for an address and a target whose earlier invitation is claimed, whatever the role of either. A row whose claimant has since been deleted is still claimed (`claimed_by` goes to null, `claimed_at` stays), so it admits one too. A claimed project editor invitation therefore admits a project admin invitation for the same address, and an address whose grant was removed can be invited again.
--
-- WHAT IT STILL REFUSES. Two open rows for one address and target in one project, whatever the role, with the same error as before: the index keeps its name, so the violation still names `invitations_email_target_key`. NULLS NOT DISTINCT because target_type is null on a project-scope row.
--
-- WHAT IT LEAVES ALONE. `invitations_code_hash_key`, which covers every row, claimed or not, so a used code is never issued again. A claim of a re-invited address that still holds the grant writes no second grant: `claim_invitations` writes with `ON CONFLICT` on the grant's own key.
--------------------------------------------------------------------------------
DROP INDEX public.invitations_email_target_key;

CREATE UNIQUE INDEX invitations_email_target_key ON public.invitations (project_id, email, scope, target_type, target_id) NULLS NOT DISTINCT
WHERE
  email IS NOT NULL
  AND claimed_at IS NULL;
