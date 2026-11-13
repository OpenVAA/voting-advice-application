# 185-16: a rollout that fails, its rollback, its alert, the restore and the stop signal (runbook Steps 10 and 11)

Recorded 2026-11-13 (UTC), from 11:26. Run in the operator's administrator session
(`AWS_PROFILE=openvaa-admin`, the key variables unset, region `eu-north-1`); the account check read
`471112560111` before every Terraform and AWS call (`account_read_exit=0`, `account_match_exit=0`
each time). The alert address reached Terraform as `TF_VAR_alert_email` from the operator's profile
and was checked with `test -n` only. Every plan, plan JSON, apply log, poll file and loop file stayed
in a `umask 077` directory outside the repository (`$L`), was read by role, and is removed at the end
of Task 3. The old task's private address was read into `$L` to match its target and was never
printed; no IP address is written here. Times AWS returned with a `+02:00` offset are given here in
UTC.

## Task 1: the failed rollout, its rollback and the viewer's count (Step 10, 11:26 to 11:41)

```
FAULT_APPLY_EXIT=1
ROLLBACK=yes
ROLLOUT_STATE_REASON=ECS deployment circuit breaker: tasks failed to start.
FAILED_TASKS=3
FAILED_TASK_EXIT=1
STARTUP_LINE_NAMES_ORIGIN=yes
OLD_TARGET_HEALTHY_THROUGHOUT=yes
RULE_TRIGGERED=1
SNS_DELIVERED=1
LOOP_FAULT=requests=692 non_2xx=0
```

- **Item 1, before the fault (11:26 to 11:27).** `s10_init_exit=0` (`-lockfile=readonly`),
  `s10_outputs_read_exit=0`, `s10_service_read_exit=0`, and the precondition met:

  ```
  s10_deployment_before=PRIMARY COMPLETED
  s10_running_before=1
  s10_old_revision=3
  ```

  The service's deployment configuration read `deploymentCircuitBreaker` `enable` true and
  `rollback` true, `minimumHealthyPercent` 100, `maximumPercent` 200, `ROLLING`. The one running
  task, the old task, was `9352238188ab4696b6b13b7e5266d034` (`s10_list_tasks_exit=0`,
  `s10_old_task_read_exit=0`).
- **Item 2, the loop.** `infra/scripts/request-loop.sh` against
  `https://staging.openvaa.org/api/health` with a stop file, started in the background; its first
  request was at 11:27:41Z, before the plan was made and over a minute before the apply.
- **Item 3, the plan.** `-var 'omit_environment=["ORIGIN"]'`, given on the command line only (the
  tracked `terraform.tfvars` was not touched): `s10_plan_exit=0`,
  `s10_plan_line=Plan: 1 to add, 1 to change, 1 to destroy.`, `s10_show_exit=0`, and exactly the
  stop rule's two changes:

  ```
  s10_change=update module.frontend.aws_ecs_service.app
  s10_change=delete-create module.frontend.aws_ecs_task_definition.app
  ```

  Read from the plan JSON before applying: the container's environment names differ by `ORIGIN`
  removed and nothing added; the other container differences are AWS's normalised empty lists, the
  `hostPort` the API fills in and the order of the log options (`mode` `non-blocking` before and
  after), not values the configuration sets; the service changes `task_definition` alone.
- **Item 4, the apply and the 30-second reads.** The apply started at `s10_fault_apply_started_utc=2026-11-13T11:28:49Z`
  in the background. The reads, each `<time>,<status>:<rollout state>:<revision>:<failed tasks>,<old target>`:

  ```
  s10_poll=2026-11-13T11:29:29Z,PRIMARY:IN_PROGRESS:4:0 ACTIVE:COMPLETED:3:0,healthy
  s10_poll=2026-11-13T11:30:07Z,PRIMARY:IN_PROGRESS:4:0 ACTIVE:COMPLETED:3:0,healthy
  s10_poll=2026-11-13T11:30:48Z,PRIMARY:IN_PROGRESS:4:0 ACTIVE:COMPLETED:3:0,healthy
  s10_poll=2026-11-13T11:31:30Z,PRIMARY:IN_PROGRESS:4:1 ACTIVE:COMPLETED:3:0,healthy
  s10_poll=2026-11-13T11:32:23Z,PRIMARY:IN_PROGRESS:4:1 ACTIVE:COMPLETED:3:0,healthy
  s10_poll=2026-11-13T11:32:59Z,PRIMARY:IN_PROGRESS:4:2 ACTIVE:COMPLETED:3:0,healthy
  s10_poll=2026-11-13T11:33:40Z,PRIMARY:IN_PROGRESS:4:2 ACTIVE:COMPLETED:3:0,healthy
  s10_poll=2026-11-13T11:34:22Z,PRIMARY:IN_PROGRESS:4:2 ACTIVE:COMPLETED:3:0,healthy
  s10_poll=2026-11-13T11:35:04Z,PRIMARY:IN_PROGRESS:4:2 ACTIVE:COMPLETED:3:0,healthy
  s10_poll=2026-11-13T11:35:40Z,PRIMARY:IN_PROGRESS:4:3 ACTIVE:COMPLETED:3:0,healthy
  s10_poll=2026-11-13T11:36:12Z,PRIMARY:IN_PROGRESS:3:0 DRAINING:FAILED:4:3,healthy
  s10_poll=2026-11-13T11:36:44Z,PRIMARY:IN_PROGRESS:3:0 DRAINING:FAILED:4:3,healthy
  s10_poll=2026-11-13T11:37:16Z,PRIMARY:COMPLETED:3:0,healthy
  s10_poll_reads=13
  s10_rollout_state_reason=ECS deployment circuit breaker: tasks failed to start.
  s10_failed_revision=4
  s10_rollback=yes
  s10_old_target_not_healthy_reads=0
  s10_event=2026-11-13T11:35:51.697Z (service openvaa-staging-frontend) rolling back to deployment ecs-svc/2903866395985344103.
  ```

  The service's events around it, in order (the target group named in them is left out here):
  11:31:51Z registered 1 target and 11:32:01Z deregistered it and began draining 1 task (the second
  failed task); 11:32:44Z started task `1eb9d31b8da645babe4cc91d86fb92cc`; 11:33:36Z registered 1
  target; 11:34:16Z deregistered it and began draining; 11:35:15Z started task
  `d92eff99617f400bbba03ff1ed239859`; 11:35:51.696Z
  `(deployment ecs-svc/6794114764421463087) deployment failed: tasks failed to start.`; 11:35:51.697Z
  `rolling back to deployment ecs-svc/2903866395985344103.`; 11:35:52Z `stopped 1 pending tasks.`;
  11:37:03Z `(deployment ecs-svc/2903866395985344103) deployment completed.` and
  `has reached a steady state.` So the circuit breaker tripped at the third failed task, about seven
  minutes after the apply began, and the rollback was complete 72 seconds later; research A1's
  "within ~20 min" held with room. The old task's target read `healthy` in all 13 reads, and at
  11:41Z the target group held one target, the old task's, `healthy`. After the rollback the service
  reads one deployment, `PRIMARY:COMPLETED:3`, `runningCount` 1, and its one running task is still
  `9352238188ab4696b6b13b7e5266d034`.
- **Item 5, the failed tasks and their start-up lines.** The runbook's `list-tasks --service-name …
  --desired-status STOPPED` exited 0 but listed **no** task, so the runbook's count would read 0
  (`s10_list_stopped_exit=0`, 0 ARNs). Listed for the whole cluster with `--desired-status STOPPED`
  (exit 0) it gave 6 tasks: the three failed tasks of revision 4, the pending task of revision 4 the
  rollback stopped, and the two older tasks the 185-15 applies replaced (revisions 1 and 2,
  `ServiceSchedulerInitiated`, exit 0). Described (`s10_describe_stopped_exit=0`, no failures), all
  of `group` `service:openvaa-staging-frontend`:

  ```
  s10_new_revision_stopped_tasks=4
  s10_failed_tasks=3
  s10_failed_task_reason=Essential container in task exited
  s10_failed_task_exit=1
  s10_failed_task_streams_with_line=3
  ```

  | Task | Started (UTC) | Stopped (UTC) | Stop code | Exit |
  | ---- | ------------- | ------------- | --------- | ---- |
  | `1e33e768c389472abd534a3c0ed375af` | 11:30:09 | 11:30:55 | `EssentialContainerExited` | 1 |
  | `a0079fd7b7fa4cee91b10e77e18abbfe` | 11:31:55 | 11:32:43 | `EssentialContainerExited` | 1 |
  | `1eb9d31b8da645babe4cc91d86fb92cc` | none | 11:35:07 | `EssentialContainerExited` | 1 |
  | `d92eff99617f400bbba03ff1ed239859` | none | 11:36:38 | `ServiceSchedulerInitiated` (`Scaling activity initiated by (deployment ecs-svc/6794114764421463087)`) | none |

  The fourth was still pending when the rollback stopped it and never ran, so it is not a failed
  task and has no stream; the count of failed tasks is the `EssentialContainerExited` three.
  The start-up line, from `filter-log-events` on the group since 11:27:26Z with the pattern
  `"Required environment variables are not set: ORIGIN"` (`s10_startup_read_exit=0`), copied with
  each line's stream (the task id) and time:

  ```
  s10_startup_line=1e33e768c389472abd534a3c0ed375af 2026-11-13T11:30:01Z Error: Required environment variables are not set: ORIGIN
  s10_startup_line=a0079fd7b7fa4cee91b10e77e18abbfe 2026-11-13T11:31:47Z Error: Required environment variables are not set: ORIGIN
  s10_startup_line=1eb9d31b8da645babe4cc91d86fb92cc 2026-11-13T11:33:29Z Error: Required environment variables are not set: ORIGIN
  ```

  The three streams are `frontend/frontend/<task id>` for exactly the three failed tasks. The whole
  of the first stream, 10 events, all at 11:30:01Z, with no address and no `@` in any of them, is the
  uncaught error of the start-up check, printed by Node one line per event:

  ```
  2026-11-13T11:30:01Z file:///opt/apps/frontend/build/server/chunks/entries/hooks.server.js-DLcvquzz.js:787
  2026-11-13T11:30:01Z 	if (missing.length > 0) throw new Error(`Required environment variables are not set: ${missing.join(", ")}`);
  2026-11-13T11:30:01Z 	                              ^
  2026-11-13T11:30:01Z Error: Required environment variables are not set: ORIGIN
  2026-11-13T11:30:01Z     at Object.init (file:///opt/apps/frontend/build/server/chunks/entries/hooks.server.js-DLcvquzz.js:787:32)
  2026-11-13T11:30:01Z     at file:///opt/apps/frontend/build/server/chunks/index.js-liZZomH3.js:3789:35
  2026-11-13T11:30:01Z     at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
  2026-11-13T11:30:01Z     at async Server.init (file:///opt/apps/frontend/build/server/chunks/index.js-liZZomH3.js:3771:3)
  2026-11-13T11:30:01Z     at async file:///opt/apps/frontend/build/server/chunks/handler-DfxBb-2c.js:1264:1
  2026-11-13T11:30:01Z Node.js v24.22.3
  ```

  The throw comes from `Server.init`, which the handler awaits before it listens, so the task exits
  before it listens and its error still reaches its own stream. Within the stream the events are in
  their timestamps' order. The line's time (11:30:01Z) is before the task's `startedAt` (11:30:09Z):
  ECS sets `startedAt` when the task reaches `RUNNING`, after the container has already started and
  exited. The third task never had a `startedAt` and its stream holds the line all the same. No line
  this item needed was missing, under the driver's `non-blocking` mode.
- **Item 6, the apply's status.** The apply ended at 11:36:10Z, after the rollback began:

  ```
  s10_fault_apply_exit=1
  s10_apply_error=Error: waiting for ECS Service (arn:aws:ecs:eu-north-1:471112560111:service/openvaa-staging/openvaa-staging-frontend) update: Service deployment rolled back because the circuit breaker threshold was exceeded.
  s10_plan_file_removed=yes
  ```

  Exit 1 is the expected status: the service never reached a steady state on revision 4. The state
  now names revision 4 (the task definition without `ORIGIN`) while the service runs revision 3;
  Step 11's plain apply puts them together.
- **Item 7, the alert's metrics**, period 300, `Sum`, from 11:27:26Z; read at 11:38:57Z and again at
  11:41:38Z, more than five minutes after the rollback, with the same values (each a single
  datapoint in the 11:30Z bucket):

  ```
  s10_TriggeredRules_read_exit=0
  s10_TriggeredRules=1
  s10_Invocations_read_exit=0
  s10_Invocations=1
  s10_NumberOfNotificationsDelivered_read_exit=0
  s10_NumberOfNotificationsDelivered=1
  s10_NumberOfNotificationsFailed_read_exit=0
  s10_NumberOfNotificationsFailed=0
  ```

  The rule fired once, for the one `SERVICE_DEPLOYMENT_FAILED` of the rollback, and the topic
  delivered one notification and failed none.
- **Item 8, the loop.** The stop file was created at 11:41:15Z, four minutes after the rollback was
  complete:

  ```
  s10_loop_exit=0
  s10_loop_requests=692 non_2xx=0 first_utc=2026-11-13T11:27:41Z last_utc=2026-11-13T11:41:15Z
  ```

  Every one of the 692 answers was 200, from before the fault's apply until after the rollback.
