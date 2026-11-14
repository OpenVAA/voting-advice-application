# 185-20: the hosted project after the destroy, and the re-apply (runbook Steps 16 item 7 and 17)

Recorded 2026-11-14 (UTC). The operator's part ran in a terminal of their own, in attempt
`20261114T165710Z.82451b387` of key `185-20-1`. The reply was stored with `attempt.sh put` (exit 0)
and bound to plan 185-20 task 1 (`bound` exit 0). The agent's commands ran in the operator's
administrator session (`AWS_PROFILE=openvaa-admin`, the key variables unset, region `eu-north-1`),
and the account check read `471112560111` before every AWS call. Plans, logs and answers stayed in a
`umask 077` directory outside the repository (`$L`), which was removed at the end. No network
address, host name of a connection, mail address, password, token or link is written here.

## The hosted project after the destroy (Step 16 item 7)

```
SUPABASE_PLAN_AFTER_EXIT=0
PROBE_AFTER_DESTROY_EXIT=0
PROBE_AFTER_DESTROY_PASS_LINES=22
```

- **The `supabase` root's plan, read only.** `s16_supabase_init_exit=0`,
  `s16_supabase_plan_after_exit=0`,
  `s16_supabase_plan_after_line=No changes. Your infrastructure matches the configuration.` The
  SMTP pair was read from the `dns-mail` outputs without printing it
  (`s16_dns_mail_init_exit=0`, `s16_smtp_credentials_read=yes`), and the operator's account check
  read `471112560111`. The plan was never applied.
- **The conformance probe, two sittings.**
  - **Sitting 1.** It ran without the session pooler block, although the direct connection had
    failed (`s15_direct_exit=2`): the operator's network is IPv4-only and the direct host is not
    reachable from it. The probe gave `s23_probe_exit=2` with
    `COULD NOT RUN catalog: psql exited 2 on the catalog query`. That is a connection failure,
    which the probe reports as "could not run", not a conformance finding. The `supabase` plan
    above was made in this sitting.
  - **Sitting 2.** It re-ran the sitting lines, the secrets, the direct attempt, the session
    pooler (`s15_pooler_exit=0`, so `s15_connection=pooler`), the probe and the last item. The
    probe gave `s23_probe_exit=0`, 22 `PASS` lines, no `FAIL` and no `COULD NOT RUN`:
    `api.max-rows`, `auth.access-token-hook`, `auth.send-email-hook`, `auth.site-url`,
    `auth.redirects`, `auth.signup-closed`, `auth.email-confirm`, `auth.smtp`, `auth.oauth-server`,
    `auth.other-settings`, `api.schemas`, `functions.deployed`, `functions.verify-jwt`,
    `auth.public-settings`, `rows.read-whole`, `functions.served`,
    `functions.identity-callback-unverified`, `storage.buckets`, `db.hook-functions`,
    `db.anon-timeout`, `db.postgres-major`, `no-seed`. The key-model note read
    `issued legacy/anon, legacy/service_role, publishable/default, secret/default; legacy keys enabled`,
    the same as on 2026-11-11.
  - Both sittings ended with `s16_operator_logs_removed=yes` and `s16_secrets_unset=yes`.
- **The connection line of the agent's block.** In both sittings the agent's Block 4 printed
  `s15_connection=direct`, because it named the host attempted rather than the connection made. The
  runbook's own Step 15 item 3 runs `psql` before it names the connection, so it is not affected. The
  coordinator recorded `pooler`, the connection the probe used.

So the destroy of `envs/staging/aws` left the persistent project, its data and its settings alone.

<!-- gsd:write-continue -->
