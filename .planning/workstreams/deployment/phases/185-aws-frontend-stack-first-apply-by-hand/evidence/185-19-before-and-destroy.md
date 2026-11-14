# 185-19: before the destroy, the destroy, and what survived (runbook Steps 15 and 16)

Recorded 2026-11-14 (UTC). The agent's commands ran in the operator's administrator session
(`AWS_PROFILE=openvaa-admin`, the key variables unset, region `eu-north-1`). The account check read
`471112560111` before every AWS call. Plans, state lists, answers and the saved destroy plan stayed in
a `umask 077` directory outside the repository (`$L`), removed at the end. The operator's part ran in
a terminal of their own, in attempt `20261114T090516Z.e46f956f9` of key `185-19-1`; the reply was
stored with `attempt.sh put` (exit 0) and bound to plan 185-19 task 1 (`bound` exit 0). No network
address, mail address, password, token or link is written here.

## Before the destroy

```
CLEANUP_COUNTS=0,0,0
SUPABASE_PLAN_BEFORE_EXIT=0
LOG_COPY_LINES=16
DNS_MAIL_PLAN_BEFORE_EXIT=0
ROOT_AWS_BEFORE=30,2
STATE_MANAGED_COUNT=40
DESTROY_PLAN_LINE=Plan: 0 to add, 0 to change, 40 to destroy.
DESTROY_PLAN_COUNT=40
DESTROY_PLAN_MATCHES_STATE=yes
```

### The operator's cleanup of the persistent project (Step 15 item 4)

- **The connection.** The direct connection answered (`s15_direct_exit=0`, `s15_connection=direct`).
  The SMTP pair was read from the `dns-mail` outputs without printing it
  (`s15_smtp_credentials_read=yes`), the account check read `471112560111`.
- **The deletes, one transaction as `postgres`.** `s15_cleanup_exit=0`:
  - `s15_invitee_users_deleted=1`: the invitee's auth user, keyed on its address and only because it
    held no grant beyond an entity's. Its grant went with it, by the cascade on `grants.user_id`.
  - `s15_invitation_rows_deleted=1`: invitation `af0f3920-a124-4528-88f3-3af53c5faa22`.
  - `s15_limit_check_rows_deleted=6`: the agent's tracer and the workstation's five rows of 185-18.
- **The read-back.** `s15_readback_exit=0`, `s15_invitee_users_after=0`, `s15_invitation_rows_after=0`,
  `s15_limit_check_rows_after=0`.
- **The phone's row, a seventh, deleted separately.** The runbook expected seven `limit-check` rows
  and the delete took six. Two diagnostic reads followed (`description ilike 'limit-check%'` 0,
  a `phone` match 0), then a listing of the last day's feedback, which held one row: the operator's
  own text `10.43 eet`, created 08:43:41Z, the minute 185-18 recorded for the phone's admitted
  insert. Step 13 item 4 had asked for `limit-check phone` and the time as the text, and the
  operator typed the time alone. A delete keyed on that description and on a creation time within
  the last day, with `RETURNING`, removed exactly 1 row (`s15d_phone_row_deleted=1`). All seven
  feedback rows 185-18 wrote are gone, and the row also confirms that the phone's insert of OBS-10
  was stored.

So `CLEANUP_COUNTS=0,0,0` reads the three `_after=` counts, with the phone's row gone too.

### The `supabase` root's plan (Step 15 item 5), read only

- **First run:** `s15_supabase_init_exit=0`, `s15_supabase_plan_exit=1`, with `Error: Client Error`
  on `supabase_project.this`: `Unable to read project, got status 401: {"message":"Invalid access
  token"}`. The token the operator gave was not valid; the plan read nothing.
- **Second run, with a new access token** and Blocks 1 to 4 run again: `s15_supabase_plan_exit=0`,
  `s15_supabase_plan_line=No changes. Your infrastructure matches the configuration.` The line was
  read with a grep of its own, because the pasted block had lost its `grep -m1` line.

The 401 is the operator's credential, not drift: the second plan, with nothing else changed, is
empty. The plan was never applied. `s15_operator_logs_removed=yes`.

### The log copy (Step 15 item 1, 09:45Z)

Written to `185-19-log-copy.md` before the destroy: `s15_init_exit=0`, 6 start-up events (the three
tasks of Step 10, two lines each), 5 stop lines and 5 `SIGTERM` lines, every read exit 0,
`LOG_COPY_LINES=16`.

### The `dns-mail` plan (Step 15 item 2, 09:46Z), read only

`s15_dns_mail_init_exit=0`, `s15_dns_mail_plan_exit=0`,
`s15_dns_mail_plan_line=No changes. Your infrastructure matches the configuration.`

### Resources tagged `Root=aws` (Step 15 item 3, 09:46Z)

`s15_tagged_eu_north_1=30` and `s15_tagged_us_east_1=2`, both reads exit 0:

| Region | Service:type | Count |
| ------ | ------------ | ----- |
| eu-north-1 | acm:certificate | 1 |
| eu-north-1 | application-autoscaling:scalable-target | 1 |
| eu-north-1 | ec2:internet-gateway | 1 |
| eu-north-1 | ec2:network-interface | 1 |
| eu-north-1 | ec2:route-table | 1 |
| eu-north-1 | ec2:security-group | 2 |
| eu-north-1 | ec2:security-group-rule | 4 |
| eu-north-1 | ec2:subnet | 2 |
| eu-north-1 | ec2:vpc | 1 |
| eu-north-1 | ecs:cluster | 1 |
| eu-north-1 | ecs:service | 1 |
| eu-north-1 | ecs:task | 1 |
| eu-north-1 | ecs:task-definition | 5 |
| eu-north-1 | elasticloadbalancing:listener | 2 |
| eu-north-1 | elasticloadbalancing:listener-rule | 1 |
| eu-north-1 | elasticloadbalancing:loadbalancer | 1 |
| eu-north-1 | elasticloadbalancing:targetgroup | 1 |
| eu-north-1 | events:rule | 1 |
| eu-north-1 | logs:log-group | 1 |
| eu-north-1 | sns:openvaa-staging-frontend-deployments | 1 |
| us-east-1 | acm:certificate | 1 |
| us-east-1 | cloudfront:distribution | 1 |

The five task definitions are revision 5, `ACTIVE`, and revisions 1 to 4, which Terraform replaced
and which stay in the account as `INACTIVE` with their tags (`list-task-definitions` by status). The
network interface is the running task's: it carries the tags `aws:ecs:serviceName` and
`aws:ecs:clusterName` of the service.

### The state and the destroy plan (Step 16 items 1 and 2, about 09:50Z)

- `s16_alert_email_set_exit=0` (read with `test -n`, never printed), `s16_init_exit=0`.
- The image before: `openvaa-frontend:712947a1bd44a735f66ee8f51610f4748d76cd30`,
  `s16_image_before_exit=0`, digest
  `sha256:bab8fa75c6094a2cecab07282826bffa4d9746bf7ee56fc7231b8283ea937bea`, equal to plan 185-12's
  `IMAGE_DIGEST`.
- `s16_state_list_exit=0`: 46 addresses, of which 40 are managed resources (no `data.` address and
  no `.data.` step).
- `s16_destroy_plan_exit=0`, saved to `$L`, its line `Plan: 0 to add, 0 to change, 40 to destroy.`,
  `s16_destroy_plan_count=40`, `s16_destroy_plan_matches_state_exit=0`.
- The saved plan's shape, read with `terraform show -json` beside the runbook's check: 40 resource
  changes, every one `delete`, and their addresses equal to the 40 managed addresses of the state
  (`cmp` exit 0). None is a zone, a repository, a parameter or a role; the five Route 53 addresses are
  records this root wrote into the zone (the apex `A` and `AAAA`, the origin and the two certificate
  validations).

<!-- gsd:write-continue -->
