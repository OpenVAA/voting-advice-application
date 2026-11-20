# 189-07 — sitting 3: the origin header secret, rotated on staging (H-01 (3), E-03)

Measured 2026-11-20 on `feat/deployment-terraform-supabase`, HEAD `dc1659aa7` before this plan.

## Task 1 — Step 19 written

`infra/envs/staging/aws/README.md` gains "## Secret rotation" before "## Election day", holding
"### Step 19: The origin header secret, rotated", one line in the flow overview, and Step 19 in the
"Rules of this root" list of hand plans given the running digest. The step is written from the
module's mechanism, read in the tree on 2026-11-20:

- `random_password.origin_verify` (`infra/modules/frontend-service/origin.tf`, 48 letters and
  digits) is read by `aws_lb_listener_rule.from_cloudfront`'s `http_header` condition (same file)
  and by the distribution's origin `custom_header` (`edge.tf`, `wait_for_deployment = true`). The
  listener's default action is a fixed 403. Nothing orders the rule and the distribution, so the
  apply updates them in parallel and a window of 403s is expected while edges take the new value.
- The staging root instantiates `module "frontend"` (`infra/envs/staging/aws/main.tf`), so the
  replace address is `module.frontend.random_password.origin_verify`.
- `/api/health` is served with `cache-control: no-store` and the distribution's default behaviour
  uses `Managed-CachingDisabled`, so the poller's reads reach the origin and are not cache hits.

The step's items: the preamble with `s19`; `init -lockfile=readonly`; the running digest from
`infra/scripts/running-image-digest.sh`; the header value's shape and SHA-256 hash, held in a
variable and never printed; the active runs of `deploy.yml` and `destroy.yml` through `gh`; the
saved plan with `-var "image_digest=$DIGEST"` and
`-replace=module.frontend.random_password.origin_verify`; `terraform show -json` reduced to one
`s19_change=<address> <actions>` line per change and `s19_plan_summary=`; the stop rule computed in
the block as `s19_stop_rule=met|not-met`; a poller under `caffeinate -i`; the apply, guarded by the
stop rule, with `s19_apply_exit=` and `s19_apply_complete_at=`; the window read ten minutes after the
apply completed; a plan of the same digest with `-detailed-exitcode`
(`s19_after_plan_no_changes=`); the hash compared (`s19_value_changed=`); the health through the CDN;
Step 9's three origin requests; the recovery; and the removal of `$L`.

The stop rule allows the apply only when the account is `471112560111`, the plan and its JSON were
written, no deploy or destroy run is waiting or running, and the changes are exactly
`module.frontend.random_password.origin_verify` (`delete-create`),
`module.frontend.aws_lb_listener_rule.from_cloudfront` (`update`, or `delete-create`/`create-delete`)
and `module.frontend.aws_cloudfront_distribution.this` (`update`). Anything else prints
`s19_stop_rule=not-met`, and nothing is applied.

Checked offline only, with no AWS call and no Terraform run: the step's code blocks pass `bash -n`
and `zsh -n`. The stop rule was run on four sample plan JSONs. The expected three changes, and the
same with the rule `create-delete`, read `met`. An extra `update` of the ECS service, and the password
`create-delete`, read `not-met`. The window `awk` was run on three sample poller files. A run of 37
403s and one `000` gave first and last non-200 times, `s19_health_window_seconds=37`,
`s19_health_403=37`, `s19_health_other=1` and `s19_health_max_gap_seconds=12`. An all-200 run gave
`none`, `none`, `0` and `recovered=yes`. A 502 in the last minute gave `s19_health_5xx=1` and
`recovered=no`. The recovery allow-list accepted a distribution `update` and refused an ECS service
`update` under `/bin/bash` with `/usr/bin/grep`. The poller loop wrote one
`<UTC time> <epoch> <status>` line a second and ended on its stop file, and `caffeinate -w` exited
with it.

A deviation from the plan, carried to the sitting: Step 9's three direct requests to the origin are
answered by the listener only through Step 9's `/32` (`debug_ingress_cidrs`). The load balancer's
security group admits CloudFront's prefix list alone, and Step 9 recorded
`s9_direct_after_http=000` with curl exit 28 once the `/32` was removed. Opening the `/32` takes an
apply to open it and one to close it. That conflicts with H-01 (3)'s "one staging apply" and with
this plan's stop rule of exactly three changes. Step 19 therefore makes the three requests without
the `/32`, expecting `000` (curl exit 28) for each. The new value is shown in both resources by
`No changes.` in the plan after the apply, which refreshes the listener rule and the distribution
from AWS, and the two are shown to agree by `s19_cdn_health_after=200`. The listener's own 403 stays
Step 9's observation. The stop rule keeps `aws_lb_listener.https` untouched.

The whole block was also run end to end under `/bin/bash` against stub commands (`aws`,
`terraform`, `gh`, `curl`, `dig`, `caffeinate`, and a virtual clock for `date` and `sleep`), with no
network. Seven paths gave what the step expects. With the expected plan, it applied once, printed
`s19_value_changed=yes` and `s19_recovery=not-needed`, and removed `$L`. With an active pipeline run,
an extra planned change, or a wrong account, it applied nothing (the account case stopped after the
preamble). With a non-empty plan after the apply, the recovery applied a distribution-only plan,
refused one that also changed the ECS service, and printed `nothing-to-apply` for an empty one. No
48-character value appeared in any output. After this run, the stop rule also requires the running
digest to be non-empty, and the apply waits, for up to ten seconds, for a first poll of 200.

The sitting block is the runbook's lines in one subshell, with a trap that stops the poller and
removes `$L` on exit. It is kept in `tmp/189-07-2.sitting-block.sh` (ignored by Git) and goes into
the attempt file of `189-07-2` at Task 2, not here.

`gh run list` read on 2026-11-20 at about 16:25Z: the last five `deploy.yml` runs and the one
`destroy.yml` run are all `completed`, the latest a `deploy/staging` run created
2026-11-20T05:26:31Z. Both workflows trigger on push only (and `workflow_dispatch`), so none is
scheduled.

STEP19_WRITTEN=yes
NO_RUN_ACTIVE=yes
EXPECTED_CHANGES=password replaced; listener rule updated or replaced; distribution updated
SITTING_COMMAND_READY=yes
