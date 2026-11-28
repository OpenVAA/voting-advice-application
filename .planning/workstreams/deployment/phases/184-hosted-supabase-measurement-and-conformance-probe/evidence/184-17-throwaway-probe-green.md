# 184-17: the probe's catalog role, and the first green probe run on a hosted project

Attempt: 184-17-2 20261111T100618Z.9027d2fdc
Attempt: 184-17-3 20261111T100822Z.9027d2fdc

CATALOG_ROLE=postgres

probe_exit=0 (`s23_probe_exit=0`), 22 PASS lines, 0 FAIL lines, 0 COULD NOT RUN lines

- **Project:** the throwaway `begckvkapaopoztbreqc` (`eu-west-1`), root `infra/envs/scratch/supabase`. No fault had been planted. Plans 184-15 and 184-16 left it bootstrapped, with the first administrator granted, the `smoke` dataset seeded, SMTP port `2587` served, and `account-access` at version 6 with `verify_jwt=false`.
- **Who ran the sitting:** the orchestrator, under the operator's authorisation of 2026-11-10, with the throwaway's credentials read from the operator's keychain. The executor held no credential and ran nothing against the hosted project.
- **When (UTC):** **2026-11-11**, from 10:07:05Z to 10:07:14Z.
- **How the record was written:** from the attempt files. `184-17-2` is stored under `OPERATOR_REPLY=received attempt=20261111T100618Z.9027d2fdc plan=184-17 task=2 head=9027d2fdcbfcd0d12c0223a7b876efada05d79e3`, and `bound` exits 0 on it. `184-17-3` is this record's own attempt.
- **What is kept out:** no key, token, password, address or IP. The log directory, which held the probe's raw output, was removed (`s2_logs_removed=yes`).

## 1. The catalog role (Task 1, ruled by the operator on 2026-11-11)

CATALOG_ROLE=postgres

The operator ruled `postgres` on 2026-11-11, via the orchestrator. This was the plan's recommended option. The ruling rested on plan 184-11's readings:

| Line                      | Value                                                                       |
| ------------------------- | --------------------------------------------------------------------------- |
| `s11_postgres_bypassrls`  | `t`                                                                         |
| `s11_login_role_http`     | `201` (role `cli_login_supabase_read_only_user`, `s11_readonly_query_exit=0`) |
| `s11_readonly_bypassrls`  | `f`                                                                         |
| `s11_readonly_count_exit` | `1` (`select count(*) from storage.buckets` failed; cause UNCONFIRMED)      |

Only `postgres` passes the probe's catalog preflight, which refuses a role that does not bypass row-level security. The CLI's read-only login role would have ended the run with `COULD NOT RUN catalog`.

`postgres` is not read-only, but the probe only issues reads (T-184-51). The catalog connection went through the session pooler (`aws-0-eu-west-1.pooler.supabase.com`, port 5432) as `postgres.<ref>`, with the database password. The probe's own target guard accepts that form.

## 2. The inputs (script 01)

- `s1_env_ready=yes`. The script was given the access token, the anon key and the database password. Every other credential was unset.
- `s1_anon_kind=publishable`: the anon key was the publishable key, as ruled on 2026-11-09.
- `s1_service_role_unset=yes`: the service-role key was not in the probe's environment.
- `s1_catalog_role=postgres`, `s1_node_major=24`, `s1_psql_found_exit=0`.

## 3. The run (runbook Step 23)

`node infra/scripts/probe-hosted.mjs --root infra/envs/scratch/supabase`

```
s23_probe_exit=0
s23_probe=PASS api.max-rows
s23_probe=PASS auth.access-token-hook
s23_probe=PASS auth.send-email-hook
s23_probe=PASS auth.site-url
s23_probe=PASS auth.redirects
s23_probe=PASS auth.signup-closed
s23_probe=PASS auth.email-confirm
s23_probe=PASS auth.smtp
s23_probe=PASS auth.oauth-server
s23_probe=PASS auth.other-settings
s23_probe=PASS api.schemas
s23_probe=PASS functions.deployed
s23_probe=PASS functions.verify-jwt
s23_probe=PASS auth.public-settings
s23_probe=PASS rows.read-whole
s23_probe=PASS functions.served
s23_probe=PASS functions.identity-callback-unverified
s23_probe=PASS storage.buckets
s23_probe=PASS db.hook-functions
s23_probe=PASS db.anon-timeout
s23_probe=PASS db.postgres-major
s23_probe=PASS no-seed
s23_probe=NOTE key-model: issued legacy/anon, legacy/service_role, publishable/default, secret/default; legacy keys enabled
```

- **Counts:** `s1_pass_lines=22`, `s1_fail_lines=0`, `s1_could_not_run_lines=0`.
- **The names:** the 22 PASS names are exactly the 22 `name:` entries of `infra/scripts/probe/checks.mjs`, in the same order (`diff` exit 0).
- **The note:** the key model agrees with the runbook's 2026-11-08/09 observation: the legacy keys are issued and enabled alongside one publishable and one secret key.

**The throwaway is green under the probe before any fault.** A red run after the break in plan 184-18 is measured against this one.

## 4. Why `no-seed` passed with the smoke dataset present

The question: the `smoke` dataset (prefix `smoke_`) was seeded in 184-15, yet `no-seed` passed. That is what the check is defined to do. It is a scope limit, stated here, and not a defect of the probe.

- **What it looks for.** `no-seed` runs `infra/scripts/check-seed.sql`. That script looks only for what `apps/supabase/supabase/seed.sql` (the local stack's seed) would leave on a database:
  - a row of `auth.users` in the `openvaa.test` domain, or with one of the seed's two fixed ids;
  - a `supabase_url` row of `public.storage_config` that is absent, not `https://`, or names a local host;
  - a `service_role_key` row holding the demo JWT (issuer `supabase-demo`).

  This is SUPA-06's "a check after deploy fails if a seed user or a local URL is present".
- **Why the smoke data does not trip it.** D-18 requires the dataset of the more-than-1000-rows read to create no auth user, "so that `no-seed` stays green". The `smoke` template's header says it "creates no auth user, no account and no storage-configuration row". 184-15's seed wrote content rows only (1001 nominations and their related rows).
- **The scope limit, stated plainly.** No check of the probe looks for rows written by dev-seed (any `smoke_` or `seed_` prefixed content), or for auth users outside the `openvaa.test` domain and the two fixed ids. A hosted project holding dev-seed content passes `no-seed` by design.
  - On the persistent project that is intended: D-18 seeds the smoke dataset there.
  - If a check that no dev-seed content is present is ever wanted, for example for production, it would be a new check. It is not a correction of `no-seed`.

## 5. Runbook

The runbook's "Observations" gained a 2026-11-11 row: the probe passed all 22 checks on the throwaway with `postgres` as its catalog role, and the scope of `no-seed` is stated beside it.
