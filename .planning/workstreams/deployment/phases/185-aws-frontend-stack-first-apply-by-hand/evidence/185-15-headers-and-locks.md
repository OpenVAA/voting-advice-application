# 185-15: the forwarded headers, the proxy depth and both origin locks (runbook Step 9)

Recorded 2026-11-13 (UTC), from 11:14. Run in the operator's administrator session
(`AWS_PROFILE=openvaa-admin`, the key variables unset, region `eu-north-1`); the account check read
`471112560111` before every Terraform and AWS call (`account_read_exit=0`, `account_match_exit=0`
each time). The workstation's address was read from `https://checkip.amazonaws.com` over IPv4 into a
variable in each command that needed it and was never printed; a 16-character hash of it, kept in
`$L`, showed it was the same address in every command (`ws_same_exit=0` each time). Every plan,
plan JSON, apply log and response body stayed in a `umask 077` directory outside the repository
(`$L`), was read by role, and was removed at the end. No IP address is written here except the
documentation-range spoof `203.0.113.99`.

## Task 1: diagnostics on, the header record and the depth verdict (items 1 to 4, 11:14 to 11:18)

```
XFF_ENTRIES_PLAIN=2
XFF_ENTRIES_SPOOFED=3
SPOOF_ENTRY_FIRST=yes
CLIENT_ADDRESS_IS_VIEWER_PLAIN=yes
CLIENT_ADDRESS_IS_VIEWER_SPOOFED=yes
VIEWER_ADDRESS_HEADER_IS_VIEWER=yes
AMZ_CF_ID=present
X_FORWARDED_PROTO=https
VIA=present
CLIENT_ADDRESS_ERROR=null
DEPTH_VERDICT=2-confirmed
ON_APPLY_EXIT=0
```

- **Item 1.** `terraform init -lockfile=readonly` exit 0, the outputs read (`s9_outputs_read_exit=0`),
  `s9_tfvars_xff_depth=2`, `dig` present, `s9_workstation_address_read=yes`, `TF_VAR_alert_email`
  checked with `test -n` only (exit 0).
- **Item 2, the plan and the apply.** The saved plan with
  `-var 'environment_overrides={DEPLOYMENT_DIAGNOSTICS="true"}'` and the workstation's `/32` in
  `debug_ingress_cidrs`: `s9_plan_exit=0`, `s9_plan_line=Plan: 3 to add, 1 to change, 1 to destroy.`,
  `s9_show_exit=0`, and exactly the four changes of the runbook's stop rule:

  ```
  s9_change=update module.frontend.aws_ecs_service.app
  s9_change=delete-create module.frontend.aws_ecs_task_definition.app
  s9_change=create module.frontend.aws_vpc_security_group_ingress_rule.load_balancer_debug[<address>]
  s9_change=create module.frontend.aws_vpc_security_group_ingress_rule.load_balancer_debug[<address>]
  ```

  Read from the plan JSON before applying: the container's environment differs by
  `DEPLOYMENT_DIAGNOSTICS=true` alone (the other differences are AWS's normalised empty lists and
  the `hostPort` the API fills in, not values the configuration sets), the service
  changes `task_definition` alone, and the two debug rules are `tcp` 443 and 80, each from a `/32`.
  The apply ran in the background from 11:15:33Z to 11:17:16Z: `s9_on_apply_exit=0`,
  `Apply complete! Resources: 3 added, 1 changed, 1 destroyed.`, the plan file removed.
- **Item 3, the header record.** `/api/diagnostics` through the CDN over IPv4, at 11:17:38Z, once
  plainly and once with `X-Forwarded-For: 203.0.113.99`: `s9_plain_http=200`, `s9_spoofed_http=200`,
  both curl exit 0. By role:

  ```
  s9_plain_xff_entries=2
  s9_plain_entry_roles=viewer,edge
  s9_plain_viewer_depth=2
  s9_plain_client_address_is_viewer=yes
  s9_plain_client_address_error=null
  s9_plain_viewer_address_header_is_viewer=yes
  s9_plain_amz_cf_id=present
  s9_plain_x_forwarded_proto=https
  s9_plain_via=present
  s9_spoofed_xff_entries=3
  s9_spoofed_entry_roles=spoof,viewer,edge
  s9_spoofed_viewer_depth=2
  s9_spoofed_client_address_is_viewer=yes
  s9_spoofed_client_address_error=null
  s9_spoofed_viewer_address_header_is_viewer=yes
  s9_spoofed_amz_cf_id=present
  s9_spoofed_x_forwarded_proto=https
  s9_spoofed_via=present
  ```

  Beyond the runbook's lines, read by role from the same two bodies:
  - Both requests carried the same seven allow-listed headers:
    `cloudfront-viewer-address,host,via,x-amz-cf-id,x-forwarded-for,x-forwarded-port,x-forwarded-proto`.
    `forwarded` and `x-forwarded-host` did not reach the container.
  - `host` read `origin.staging.openvaa.org` (the origin's name, as the distribution sends it),
    `x-forwarded-port` read `443`, and the resolved `origin` read `https://staging.openvaa.org`, the
    `ORIGIN` value, not the host header.
  - The `edge` entry of each request lies inside the CloudFront origin-facing prefix list
    (`s9_plain_edge_in_cloudfront_prefix_list=yes`, `s9_spoofed_edge_in_cloudfront_prefix_list=yes`,
    checked against `get-managed-prefix-list-entries`, exit 0), so the entry the load balancer
    appended is the CloudFront edge's address. `via` names CloudFront in both
    (`s9_*_via_names_cloudfront=yes`).
  - `checkip.amazonaws.com`, asked over IPv4, named the address CloudFront saw the workstation by:
    the `viewer` entry, `cloudfront-viewer-address` and the resolved client address all equal it.
- **Item 4, the verdict.** `s9_depth_verdict=2-confirmed`: the depth the tracked tfvars set, 2,
  resolves the workstation's address with and without the client-sent entry, and the client-sent
  entry stays first, three from the right, where depth 2 never reads it. `XFF_DEPTH` stays `"2"`;
  the tfvars are not changed.
- **The tracer gate.** The Task 1 verify was re-run before Task 2 (auto mode off, `end-of-phase`
  human verification, an automated-only `<verify>`).

## Task 2: both locks refusing, and the load balancer's own redirect (item 5, 11:18 to 11:20)

```
LOCK2_NO_HEADER=403
LOCK2_WRONG_HEADER=403
LOCK2_RIGHT_HEADER=200
ALB_HTTP_REDIRECT=301 location=https://origin.staging.openvaa.org:443/
ALB_SG_RULES_DURING=3
```

- **The inputs.** `origin_verify_header_name` read `x-origin-verify`; `origin_verify_header_value`,
  the sensitive output, was read into a variable of the same command, handed to `curl` as a
  configuration on a file descriptor (`-K <(printf ...)`), so it was on no command line, and unset
  after its one use. The load balancer's name was resolved with `dig` into a variable and used with
  `curl --resolve origin.staging.openvaa.org:443:<it>`; `s9_lock_inputs_exit=0`. Neither value is
  printed or written anywhere.
- **The listener, at 11:18:53Z.** Each curl exit 0.
  - No `x-origin-verify` header: `s9_lock_no_header=403`.
  - `x-origin-verify: not-the-secret`: `s9_lock_wrong_header=403`.
  - The value CloudFront sends: `s9_lock_right_header=200`, the body `status` `ok` and `build`
    `712947a1bd44a735f66ee8f51610f4748d76cd30`, the image tag.
  - The 403 is the listener's own: a repeat of the request without the header answered with
    `server: awselb/2.0`, `content-type: text/plain; charset=utf-8` and an empty body, which is the
    default action's `fixed_response` (`403`, `text/plain`) in `infra/modules/frontend-service/origin.tf`,
    not a page of the application.
- **Port 80.** `http://origin.staging.openvaa.org/` through `--resolve ...:80:`:
  `s9_lb_http=301 location=https://origin.staging.openvaa.org:443/`.
- **The load balancer's group during the observation.** `describe-security-group-rules` exit 0:
  `s9_lb_sg_ingress_during=3`, by the role of their source `cloudfront-prefix-list` on 443 and
  `single-address` on 443 and on 80.
- **The service.** `describe-services` exit 0: task definition revision 2, one running task, one
  deployment, `COMPLETED`. The diagnostics body of Task 1 was therefore served by the new revision.

## Task 3: diagnostics off, the `/32` removed, the depth kept (item 6, 11:19 to 11:23)

```
RESTORE_APPLY_EXIT=0
DIAGNOSTICS_AFTER=404
ALB_SG_RULES_AFTER=1
LOCK1_DIRECT_AFTER=no-answer
PLAN_AFTER_EXIT=0
```

- **The depth.** `DEPTH_VERDICT=2-confirmed`, so `XFF_DEPTH` in `infra/envs/staging/aws/terraform.tfvars`
  was left at `"2"`; the file equals `HEAD` (`git diff --quiet` exit 0) and holds neither
  `environment_overrides` nor `debug_ingress_cidrs`, with `DEPLOYMENT_DIAGNOSTICS = "false"`.
- **The plan and the apply.** The saved plan with neither variable: `s9_off_plan_exit=0`,
  `s9_off_plan_line=Plan: 1 to add, 1 to change, 3 to destroy.`, `s9_off_show_exit=0`, and exactly the
  runbook's four changes:

  ```
  s9_off_change=update module.frontend.aws_ecs_service.app
  s9_off_change=delete-create module.frontend.aws_ecs_task_definition.app
  s9_off_change=delete module.frontend.aws_vpc_security_group_ingress_rule.load_balancer_debug[<address>]
  s9_off_change=delete module.frontend.aws_vpc_security_group_ingress_rule.load_balancer_debug[<address>]
  ```

  The container's environment differs by `DEPLOYMENT_DIAGNOSTICS=false` alone. The apply ran in the
  background from 11:19:55Z to 11:21:48Z: `s9_off_apply_exit=0`,
  `Apply complete! Resources: 1 added, 1 changed, 3 destroyed.`, the plan file removed.
- **The stack read back, at 11:22:09Z.**
  - `s9_diagnostics_after=404` through the CDN over IPv4 (curl exit 0); `/api/health` 200.
  - `s9_direct_after_http=000` with `s9_direct_after_curl_exit=28`: the direct request to the load
    balancer, without the `/32`, got no answer in 10 s.
  - `s9_lb_sg_ingress_after=1`, by role `cloudfront-prefix-list` on 443 (`describe-security-group-rules`
    exit 0).
  - The service runs task definition revision 3, whose `DEPLOYMENT_DIAGNOSTICS` is `false` and
    `XFF_DEPTH` is `2` (`describe-task-definition` exit 0).
  - `terraform plan -detailed-exitcode`: `s9_plan_after_exit=0`,
    `No changes. Your infrastructure matches the configuration.`
- **The rollout, settled.** At that first read the service still listed two deployments, the new one
  `IN_PROGRESS`: the apply returned once the new task was registered, before ECS reported the old
  deployment gone. The service's events, read at 11:22:57Z: the new target registered at 11:21:05Z,
  the old task stopped at 11:21:24Z and its target deregistered at 11:21:26Z, the deployment
  completed and the service steady at 11:22:38Z. The old target was therefore out of the target group
  before the 404 above was read. Five more requests to `/api/diagnostics` after the steady state all
  answered 404 (`s9_diagnostics_after_settled=5 404`), and the service reads one deployment,
  `COMPLETED`, one running task.
- **Item 7.** `WS`, `HV` and `LB_IP` were unset at the end of each command that held them; the plan
  file was removed after each apply; `$L` was removed at the end (`s9_logs_removed=yes`).

The stack is back in the shape of 185-14's reads, with task definition revision 3 in place of
revision 1: two task-definition revisions were registered by this plan, 2 (diagnostics on) and 3
(diagnostics off).
