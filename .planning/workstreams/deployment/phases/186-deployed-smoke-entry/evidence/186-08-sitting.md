# 186-08 sitting: the hosted smoke contestant

Date: 2026-11-15 (UTC). Attempt `186-08-2` = `20261115T113054Z.6f59bc0c6`; `attempt.sh bound 186-08-2 OPERATOR_REPLY plan=186-08 task=2` and `attempt.sh has 186-08-2 '^answer_sitting=approve$'` both exited 0 before the first hosted request. Approval: the operator's reply at the Task 2 checkpoint, under the standing staging authorisation they ticked at 186 D-02; the operator stored the address in the keychain item `openvaa-staging-smoke-contestant` themselves (Step 22 item 5).

Run by the orchestrator at top level from this workstation; no subagent held a credential. The service-role key and the database password were read from the operator's keychain (service `openvaa-184-staging`, accounts `service_role_key` and `db_password`) into exported variables, never echoed; the anon key from the `PUBLIC_SUPABASE_ANON_KEY` field of the env block served at `https://staging.openvaa.org/`. Prelude: `R=staging`, `REF` from `infra/envs/staging/supabase/terraform.tfvars`, `$L` a `mktemp -d` under `$TMPDIR`. Step 15 used the direct connection. Items 3, 4 and 6 to 13 of Step 22's contestant part ran in order from one script that stopped at the first missing expected line.

**A first attempt stopped at item 4 with nothing hosted written** (11:59:05Z). The script's guard required item 4's output to be exactly its two expected lines and captured stderr as well; `security delete-generic-password` writes `password has been deleted.` to stderr, which the runbook leaves on the terminal. Re-checked by hand on a throwaway item: `security -i` prints nothing on stdout or stderr when fed the add command, and the item read back equal. The guard was narrowed to stdout (stderr to `$L`) and the sitting was made again from its first line. The throwaway item was confirmed absent (exit 44) before the rerun.

The record lines of the sitting, as printed (11:59:37Z to 11:59:42Z):

```
SITTING_REF=cofbsatfrdysyphajsky
time_utc=2026-11-15T11:59:37Z begin
s15_direct_exit=0
s15_connection=direct
s22c_ref=ok
s22c_keychain_method=ok
s22c_keychain_check_removed=yes
s22c_address_read=yes
s22c_users_before=0
s22c_users_exit=0
s22c_password_length=43
time_utc=2026-11-15T11:59:39Z item8 create user
s22c_create_http=200
s22c_grant_exit=0
s22c_candidate=smoke_cand_0000
s22c_grants=1
s22c_terms=1
s22c_signin_http=200
s22c_claim_grants=[{"role":"editor","scope":"entity","target_id":"346191c2-42bc-4d6e-8dc9-9ff1a41299aa","target_type":"candidate"}]
s22c_logout_http=204
s22c_keychain_stored=yes
s22c_check_seed_exit=0
s22_logs_removed=yes
time_utc=2026-11-15T11:59:42Z end
```

The claim names printed (`aal, amr, app_metadata, aud, email, exp, grants, iat, is_anonymous, iss, phone, role, session_id, sub, user_metadata`) are the names only; no claim value but `grants` was printed. `s22c_claim_grants=` holds one object, `"scope":"entity"` and `"role":"editor"` on a candidate target, as item 10 requires. The three `secret_*_read=yes` lines the script printed (each value non-empty, none printed) are left out above.
