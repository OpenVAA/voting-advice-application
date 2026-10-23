# Deferred items: phase 183

## Local `init -backend=false` fails in a root the operator has initialised (found in 183-17, 2026-10-22)

- **What happens:** once the operator has run `terraform init` with the S3 backend in a root, the
  root's `.terraform/terraform.tfstate` records that backend. A later executor-side
  `terraform init -backend=false` in the same checkout then tries to reach the backend and fails
  without a credential (`No valid credential sources found`).
- **What 183-17 changed:** its own verify commands now give init and validate a throwaway
  `TF_DATA_DIR`.
- **Still to check:** plans 183-21, 183-23, 183-24, 183-25 and 183-27 also run
  `init -backend=false`. Any of them that runs against a root the operator has already initialised
  (`infra/bootstrap`, `infra/envs/staging/dns-mail`, or a later one) needs the same change.
- **Since 183-23 (2026-10-23):** the operator has initialised `infra/envs/staging/supabase` with its S3
  backend. 183-23's Task 3 ran init and validate there with a throwaway `TF_DATA_DIR`; its plan text
  was not changed for this. 183-25 and 183-27 still run `init -backend=false` in that root and need
  the same.
- **Since 183-25 (2026-10-23):** 183-25's verify commands run no init or validate, and no `.tf` file
  changed in it, so it needed no `TF_DATA_DIR`. 183-27 is the one plan left that needs it.

## SES production access was already granted; no request filed and no sandbox mailbox (found in 183-19, 2026-10-22)

- **What happened:** before step 2 of plan 183-19 filed anything, the operator read the account. It
  already had production access in `eu-north-1` (`s2a_production=true`, `s2a_max24h=50000.0`), as
  the 183-14 inventory had shown on 2026-10-21. By the operator's ruling (`answer_skip_steps_2_3=yes`),
  no production-access request was filed and no mailbox identity was created for the sandbox.
- **Wording to reconcile:** ROADMAP.md (the phase 183 row of the operator-preconditions table and
  phase 183's "Operator preconditions") and REQUIREMENTS.md (line 14) say SES production access is
  "requested". The precondition is met by the existing grant, not by a request. Reword these when
  the milestone documents are next edited. This plan does not edit them.
- **Plans that assume a verified operator mailbox:** none found. Plan 183-20's "mailbox" is the
  budget notification, which AWS Budgets sends and SES does not. Plan 183-28 checks that 183-19's
  operator commands appear in the runbook word for word, and the amended commands are there.
- **Phase 184:** the account sends outside the sandbox, so the first mail from the hosted function
  can go to any recipient, with no verified recipient needed. Whether the scoped send policy is
  accepted is still not observed. The fallback is the same statement on resource `*` with the
  From-address condition kept.

## The OAuth-server switches are no longer sent or compared; phase 184's probe reads them (found in 183-24, 2026-10-22)

- **What happened:** the first apply on the throwaway project failed. The hosted API refused the
  auth update with status 400: "Both OAUTH_SERVER_ENABLED and OAUTH_SERVER_AUTHORIZATION_PATH must
  be provided together when updating OAuth configuration". The update held both OAuth-server
  switches, `false`, and no authorization path.
- **What 183-24 changed:** in commit `55802a1bc`:
  - the module no longer sends `oauth_server_enabled` or `oauth_server_allow_dynamic_registration`;
  - the parity guard puts the two local keys back in "not compared".
- **What that leaves uncovered:** a plan no longer shows a change to the OAuth-server switches. The
  guard never read hosted values. So an OAuth server switched on in the dashboard would go unseen.
  The hosted default is `false`, as the import showed.
- **Phase 184:** the conformance probe (SUPA-07) reads `oauth_server_enabled` (and
  `oauth_server_allow_dynamic_registration`) from `/v1/projects/<ref>/config/auth`, fails by name
  unless both are `false`, and is seen failing once against the throwaway project. A read has no
  "together" constraint.

## Both hooks are accepted before their functions exist; the persistent root applies with them on (found in 183-24, 2026-10-23)

- **What was seen:** the hosted API accepted the access-token hook and the send-email hook on the
  throwaway project, which has neither `public.custom_access_token_hook` nor
  `public.send_email_hook`. The read-back serves both as on, each with its address.
- **What follows for 183-25:** the persistent root applies with `enable_access_token_hook = true` and
  `enable_send_email_hook = true`. No `hook off until` assignment is needed, and phase 184 does not
  have to switch either hook on.
- **What follows for phase 184:** from the persistent apply until the migrations are pushed, the
  project's hooks point at functions that do not exist yet. How the auth service behaves then, on a
  token or a mail, was not observed; no sign-in was made. Push the migrations before anyone signs in.
  The conformance probe (SUPA-07) can check that both functions exist, beside the hook switches it
  reads.
