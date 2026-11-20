# 189-05 — sitting 1: the persistent project's probe, the `postgres` privilege and two DMARC reads (H-01 (1))

Measured 2026-11-20 on `feat/deployment-terraform-supabase`, HEAD `c03e1881e` before this plan.

## Task 1 — readiness, read-only

Nothing in this task ran against the hosted project, AWS or DNS. The GitHub reads were
`gh run list --workflow deploy.yml --status in_progress` and the same for `destroy.yml`; each
exited 0 and listed no run.

The 22 checks, in the order `infra/scripts/probe/checks.mjs` declares and the probe prints them:
`api.max-rows`, `auth.access-token-hook`, `auth.send-email-hook`, `auth.site-url`, `auth.redirects`,
`auth.signup-closed`, `auth.email-confirm`, `auth.smtp`, `auth.oauth-server`, `auth.other-settings`,
`api.schemas`, `functions.deployed`, `functions.verify-jwt`, `auth.public-settings`, `rows.read-whole`,
`functions.served`, `functions.identity-callback-unverified`, `storage.buckets`, `db.hook-functions`,
`db.anon-timeout`, `db.postgres-major`, `no-seed`.

The last probe row of the Supabase runbook's Observations on the persistent project is the one of
2026-11-14 (after the staging AWS root was destroyed: status 0, 22 `PASS`). The function-redeploy
row is the one of 2026-11-19 (deploy run on `deploy/staging`, commit `a7003b490`: the three
functions deployed `ACTIVE` with `verify_jwt` as configured), after that probe.

The sitting is one block, composed from the Supabase runbook's "The lines that begin each sitting
of this part" (with `R=staging`), Step 15 item 2 (the session pooler, its host typed at a prompt,
the password read without echo into `PGPASSWORD`), Step 23 items 1 and 2, the
`has_table_privilege('postgres', 'auth.users', 'UPDATE')` read and two `dig +short TXT` reads
reduced to their `p=` tag. It asks for the access token, the database password and the
publishable key, and unsets the service-role key. It is kept in the attempt file of `189-05-2`
only, not here.

PROBE_CHECKS_IN_TREE=22
LAST_PROBE_ROW_DATE=2026-11-14
FUNCTION_REDEPLOY_ROW_DATE=2026-11-19
NO_RUN_ACTIVE=yes
SITTING_COMMAND_READY=yes
