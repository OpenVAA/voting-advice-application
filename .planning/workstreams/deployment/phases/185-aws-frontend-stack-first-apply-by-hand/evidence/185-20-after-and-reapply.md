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

## The re-apply (Step 17)

```
REAPPLY_UTC=2026-11-14T18:12Z
REAPPLY_PLAN_ONLY_CREATES=yes
REAPPLY_EXIT=0
REAPPLY_SECOND_PLAN_EXIT=0
REAPPLY_HEALTH_BUILD_MATCHES=yes
REAPPLY_VOTER_PAGE=yes
REAPPLY_LOG_RETENTION_DAYS=90
SUBSCRIPTION_AFTER_REAPPLY=PendingConfirmation
```

- **The same tag, the same root (item 1).**
  - `s17_account_read_exit=0` and `s17_account_match_exit=0`.
  - `s17_image_tag_length=40`, with the tag `712947a1bd44a735f66ee8f51610f4748d76cd30`, which is
    185-12's `SOURCE_COMMIT`.
  - `s17_head=c2340b1e5f3ff7ea2549841ce6099e88359986d2`. `git diff 82451b387 HEAD -- infra` is
    empty, so the root and its module are as they were at the destroy.
  - `s17_dirty_lines=0`, `s17_image_exit=0` and `s17_alert_email_set_exit=0`.
  - The state was empty before the plan: `terraform state list` exited 0 with no line.
- **One plan with only creates (item 2).** `s17_init_exit=0` (`-lockfile=readonly`),
  `s17_plan_exit=0`, `s17_plan_line=Plan: 40 to add, 0 to change, 0 to destroy.`,
  `s17_show_exit=0`, `s17_planned_create=40` and no other `s17_planned_` line, and
  `s17_outside_module=0`. That is the shape the item allows, and the same 40 that 185-19 destroyed.
- **One apply from nothing (item 3).** The saved plan was applied once, in the background under
  `caffeinate -i`, from 18:08:04Z. `s17_apply_exit=0`, `s17_apply_completed_utc=2026-11-14T18:12Z`,
  and `s17_apply_line=Apply complete! Resources: 40 added, 0 changed, 0 destroyed.`, with no
  `s17_error=` line. The plan file was removed (`s17_plan_file_removed=yes`). `pmset -g log` shows
  no sleep during the apply or the reads below. **This is the single from-nothing apply that
  185-13 could not show** (`FIRST_APPLY_EXIT=1`, completed by a one-create follow-up apply): one
  plan and one apply brought up the whole stack.
- **The second plan (item 4).** `s17_second_plan_exit=0`, with
  `No changes. Your infrastructure matches the configuration.` and no `s17_second_change=` line.
- **The site through the CDN (item 5), 18:13Z.**
  - `s17_health_http=200`, `s17_health_curl_exit=0` and `s17_health_build_matches_exit=0`, so
    `build` equals the tag. The response read `x-cache: Miss from cloudfront`.
  - `s17_questions_http=200` and
    `s17_questions_project_id=00000000-0000-0000-0000-000000000001`.
  - The literal item read `s17_defence_statement_seen=0` from the server's HTML. That is the
    runbook's defect, not the stack's: Step 7 item 4 says the statements are never in the server's
    HTML (`s7_questions_html_statements=0` is that item's expectation), and that they are read from
    a headless render. So the read of Step 7 item 4 was run as written, and it read:
    `s17_questions=200 https://staging.openvaa.org/questions`,
    `s17_questions_supabase_fetches=5`, `s17_questions_html_statements=0`,
    `s17_rendered=200 https://staging.openvaa.org/questions/__first__`, `s17_render_exit=0` and
    `s17_statement_seen=Public transport should be free of charge in cities.`, the first question's.
    That is the voter page of Step 7 again. Step 17 item 5 now runs the same render.
- **The log group and the subscription (item 6), 18:13:51Z.** `s17_log_group_read_exit=0` and
  `s17_log_retention_days=90`, the same as the first log group's. `s17_subscriptions_exit=0` and
  `s17_subscription=email pending`: the re-created topic's new subscription is waiting for the
  operator's confirmation.
