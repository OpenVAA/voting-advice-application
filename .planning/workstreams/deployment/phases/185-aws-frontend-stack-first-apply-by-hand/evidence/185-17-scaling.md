# 185-17: the floor raised ahead of time and lowered again (runbook Step 12)

Recorded 2026-11-13 (UTC), from 13:42. Run in the operator's administrator session
(`AWS_PROFILE=openvaa-admin`, the key variables unset, region `eu-north-1`); the account check read
`471112560111` before every Terraform and AWS call (`account_read_exit=0`, `account_match_exit=0`
each time). Every plan, plan JSON, apply log, poll file and task list stayed in a `umask 077`
directory outside the repository (`$L`), and is removed at the end of Task 2. No IP address is
written here. The pair was given on the command line of one apply only; the tracked
`terraform.tfvars` was not touched.

## Task 1: the pair applied and the count followed (Step 12, items 1 to 6)

The step ran twice. In the first run the workstation slept with its lid closed, from 13:49:50Z to
15:31:29Z, except for two DarkWakes of about a minute each. So that run's per-minute reads have
gaps of 8 minutes and then 92 minutes, and they are **not** the per-minute record. Like a void E2E
run, it is kept and not counted. Its AWS-side record, the scaling activities, the service events and
the stopped task's stream, has second resolution and was written by AWS whether the workstation was
awake or not. It is given below as a second observation of the same behaviour. The first pair was
then removed (Step 12, item 7, the shape the removal expects). The step was run again with new
times, under `caffeinate -i`, and that second run is the record. The record lines in the next block
are the second run's.

### Before (item 1, 13:42Z)

`s12_init_exit=0` (`-lockfile=readonly`), `s12_outputs_read_exit=0`, and the stack as 185-16 left
it:

```
s12_running_before=1
service=running 1, desired 1, task definition revision 5, deployments PRIMARY COMPLETED
scalable_target=1,2
scheduled_actions=0
plan_before_exit=0
```

### First run (13:42Z to 15:34Z): applied, observed by AWS, slept through by the workstation

- **Items 2 and 3, the plan and the apply.** The times were `s12_raise_utc=2026-11-13T13:48:00Z` and
  `s12_lower_utc=2026-11-13T13:58:00Z`. The plan gave `s12_plan_exit=0`,
  `s12_plan_line=Plan: 2 to add, 0 to change, 0 to destroy.` and `s12_show_exit=0`, and held exactly
  `create` of `module.frontend.aws_appautoscaling_scheduled_action.floor["raise"]` and
  `…floor["lower"]`. The plan JSON gave them the schedules `at(2026-11-13T13:48:00)` and
  `at(2026-11-13T13:58:00)`, the time zone `UTC`, and the bounds `2,2` and `1,2`.
  `s12_margin_exit=0` held with 307 seconds to spare. Then `s12_pair_apply_exit=0`, from 13:43:07Z
  to 13:43:11Z (`Apply complete! Resources: 2 added, 0 changed, 0 destroyed.`), and
  `s12_scheduled_actions=2`.
- **Item 4, the reads.** These are the eight reads the loop made, `<time>,<running>,<desired>,<floor>,<ceiling>`:

  ```
  s12_count=2026-11-13T13:43:29Z,1,1,1,2
  s12_count=2026-11-13T13:44:31Z,1,1,1,2
  s12_count=2026-11-13T13:45:33Z,1,1,1,2
  s12_count=2026-11-13T13:46:35Z,1,1,1,2
  s12_count=2026-11-13T13:47:38Z,1,1,1,2
  s12_count=2026-11-13T13:48:40Z,1,1,1,2
  s12_count=2026-11-13T13:49:42Z,1,2,2,2
  s12_count=2026-11-13T13:57:52Z,2,2,2,2
  ```

  The loop's next read would have been at about 13:58:52Z. The workstation slept before it, and on
  waking at 15:31:40Z the loop found its 30 minutes past and ended. `pmset -g log`, in UTC:
  `Clamshell Sleep` at 13:49:50Z for 423 s. Then DarkWake 13:56:53Z, Sleep 13:57:51Z, DarkWake
  13:58:38Z, Sleep 13:59:23Z for 4839 s, DarkWake 15:20:02Z, Sleep 15:20:47Z, and FullWake 15:31:29Z.
  The machine was on battery. The read at 13:57:52Z fell inside the first DarkWake.
- **Item 5, the scaling activities** (`s12_activities_read_exit=0`), oldest first, in UTC:

  ```
  s12_activity=2026-11-13T13:48:42.609Z Successful Setting min capacity to 2 and max capacity to 2 | scheduled action name openvaa-staging-frontend-raise was triggered
  s12_activity=2026-11-13T13:48:42.903Z Successful Setting desired count to 2. | minimum capacity was set to 2
  s12_activity=2026-11-13T13:58:15.659Z Successful Setting min capacity to 1 and max capacity to 2 | scheduled action name openvaa-staging-frontend-lower was triggered
  s12_activity=2026-11-13T13:58:50.141Z Successful Setting desired count to 1. | monitor alarm TargetTracking-service/openvaa-staging/openvaa-staging-frontend-AlarmLow-<id> in state ALARM triggered policy openvaa-staging-frontend-cpu
  ```

  The service's events, in order: 13:48:44Z `has started 1 tasks: (task 62b7c25f26714a13828b797d30c24923).`;
  13:49:42Z registered 1 target; 13:49:51Z `has reached a steady state.`; 13:58:56Z
  `has stopped 1 running tasks: (task 62b7c25f26714a13828b797d30c24923).`; 13:59:05.728Z
  deregistered 1 target, and `has begun draining connections on 1 tasks.`; 13:59:05.810Z
  `has reached a steady state.` So the raise ran 42 seconds after its time and the lowering 15 seconds
  after its. Target tracking set the count to 1 35 seconds after the lowering, because its low alarm
  was already in `ALARM` at idle CPU. The desired count was 2 from 13:48:42Z to 13:58:50Z and never
  more: no activity set it higher, and the ceiling was 2 throughout.
- **Item 6, the task the scale-in stopped.** Of the two tasks seen running, the one gone afterwards
  was the raise's task, `62b7c25f26714a13828b797d30c24923` (`s12_tasks_stopped=1`). By the time it
  was read, at 15:32Z, `describe-tasks` returned it as a failure `MISSING`: the stopped task had aged
  out, so its stop reason and exit code are not on record for this run. Its own stream,
  `frontend/frontend/62b7c25f26714a13828b797d30c24923`, holds 111 events. It holds one of each kind
  (`s12_stop_message_read_exit=0`, `s12_stop_signal_read_exit=0`):

  ```
  s12_stop_message_events=1
  s12_stop_message_line=62b7c25f26714a13828b797d30c24923 2026-11-13T14:00:02Z msg: 'The server is exiting after its stop.',
  s12_stop_signal_events=1
  s12_stop_signal_line=62b7c25f26714a13828b797d30c24923 2026-11-13T14:00:02Z signal: 'SIGTERM',
  ```

  The stop record's last events, as the stream holds them:

  ```
  2026-11-13T14:00:02Z {
  2026-11-13T14:00:02Z   level: 40,
  2026-11-13T14:00:02Z   time: 1794578402299,
  2026-11-13T14:00:02Z   msg: 'The server is exiting after its stop.',
  2026-11-13T14:00:02Z   severityText: 'WARN',
  2026-11-13T14:00:02Z   attributes: {
  2026-11-13T14:00:02Z     reason: 'SIGTERM',
  2026-11-13T14:00:02Z     signal: 'SIGTERM',
  2026-11-13T14:00:02Z     inFlightAtSignal: 0,
  2026-11-13T14:00:02Z     drainMs: 1
  2026-11-13T14:00:02Z   }
  2026-11-13T14:00:02Z }
  ```

  The signal came 57 seconds after the deregistration began. The stream's first event is the
  server's `Listening on` line, which names a bind address and is not copied. Its other events
  before the stop are seven `Not found` server errors, all at 13:50:20Z, for scanner paths the
  application does not serve (`/robots.txt`, `/bot-connect.js` and five other `.js` paths). They
  came from outside requests, not from this step.
- **The first pair removed (item 7), 15:33Z.** `s12_off_plan_exit=0`,
  `s12_off_plan_line=Plan: 0 to add, 0 to change, 2 to destroy.` and `s12_off_show_exit=0`, with exactly
  `delete` of `…floor["lower"]` and `…floor["raise"]`. Then `s12_pair_remove_apply_exit=0`
  (15:33:52Z, `Resources: 0 added, 0 changed, 2 destroyed.`), `s12_scheduled_actions_after=0`,
  `s12_target_bounds_after=1,2` and `s12_plan_after_exit=0`. The stack was plain again before the
  second run.

### Second run (15:34Z to 15:53Z): the record

```
PAIR_APPLY_EXIT=0
RAISED_AT=2026-11-13T15:40:00Z
COUNT_TWO_AT=2026-11-13T15:41:35Z
LOWERED_AT=2026-11-13T15:50:48Z
COUNT_ONE_AT=2026-11-13T15:50:59Z
SCALE_IN_MINUTES=0
MAX_RUNNING_SEEN=2
BELOW_FLOOR_SEEN=no
SCALE_IN_STOP_LINE_SIGNAL=SIGTERM
```

- **Power.** The workstation ran on battery. `pmset -g log` holds no Sleep or DarkWake entry after
  the FullWake at 15:31:29Z. The loop ran under `caffeinate -i`, and its 16 reads are 62 to 68
  seconds apart (`max_gap_s=68`, `min_gap_s=62`), with an empty error file.
- **Items 2 and 3, the plan and the apply.** `s12_running_before=1`. The times were
  `s12_raise_utc=2026-11-13T15:40:00Z` and `s12_lower_utc=2026-11-13T15:50:00Z`. The plan gave
  `s12_plan_exit=0`, `s12_plan_line=Plan: 2 to add, 0 to change, 0 to destroy.` and `s12_show_exit=0`,
  and held exactly these two changes:

  ```
  s12_change=create module.frontend.aws_appautoscaling_scheduled_action.floor["lower"]
  s12_change=create module.frontend.aws_appautoscaling_scheduled_action.floor["raise"]
  ```

  The plan JSON gave `openvaa-staging-frontend-raise` `at(2026-11-13T15:40:00)` `UTC`, bounds `2,2`,
  and `openvaa-staging-frontend-lower` `at(2026-11-13T15:50:00)` `UTC`, bounds `1,2`.
  `s12_margin_exit=0` held. Then `s12_pair_apply_exit=0`, from 15:34:49Z to 15:34:55Z
  (`Apply complete! Resources: 2 added, 0 changed, 0 destroyed.`), and `s12_actions_read_exit=0`
  with `s12_scheduled_actions=2`.
- **Item 4, the reads**, `<time>,<running>,<desired>,<floor>,<ceiling>`, every minute from the
  apply until the count was back at 1 after the lowering:

  ```
  s12_count=2026-11-13T15:35:10Z,1,1,1,2
  s12_count=2026-11-13T15:36:18Z,1,1,1,2
  s12_count=2026-11-13T15:37:24Z,1,1,1,2
  s12_count=2026-11-13T15:38:27Z,1,1,1,2
  s12_count=2026-11-13T15:39:30Z,1,1,1,2
  s12_count=2026-11-13T15:40:33Z,1,2,2,2
  s12_count=2026-11-13T15:41:35Z,2,2,2,2
  s12_count=2026-11-13T15:42:37Z,2,2,2,2
  s12_count=2026-11-13T15:43:40Z,2,2,2,2
  s12_count=2026-11-13T15:44:43Z,2,2,2,2
  s12_count=2026-11-13T15:45:46Z,2,2,2,2
  s12_count=2026-11-13T15:46:48Z,2,2,2,2
  s12_count=2026-11-13T15:47:51Z,2,2,2,2
  s12_count=2026-11-13T15:48:53Z,2,2,2,2
  s12_count=2026-11-13T15:49:57Z,2,2,2,2
  s12_count=2026-11-13T15:50:59Z,1,1,1,2
  s12_max_running=2
  s12_max_desired=2
  s12_running_above_ceiling_reads=0
  s12_desired_below_floor_reads=0
  s12_count_two_utc=2026-11-13T15:41:35Z
  s12_count_one_utc=2026-11-13T15:50:59Z
  s12_scale_in_minutes=0
  ```

  The ceiling read 2 in every read, and neither count passed it. The floor in force was 1, then 2
  from the 15:40:33Z read to the 15:49:57Z read, then 1 again. The desired count never fell below it.
  One read had the running count below the floor: 15:40:33Z, with running 1 against the raised floor
  2, 33 seconds after the raise, while the second task was starting. It was running at the next read.
  The runbook judges the floor on the desired count for this reason, so `BELOW_FLOOR_SEEN=no` is
  read on the desired count, and this one starting lag is the only exception.
- **Item 5, the scaling activities** (`s12_activities_read_exit=0`), oldest first, in UTC, each with
  its end:

  ```
  s12_activity=2026-11-13T15:40:00.438Z end 15:40:00.456Z Successful Setting min capacity to 2 and max capacity to 2 | scheduled action name openvaa-staging-frontend-raise was triggered
  s12_activity=2026-11-13T15:40:00.771Z end 15:41:40.360Z Successful Setting desired count to 2. | minimum capacity was set to 2
  s12_activity=2026-11-13T15:50:48.410Z end 15:50:48.433Z Successful Setting min capacity to 1 and max capacity to 2 | scheduled action name openvaa-staging-frontend-lower was triggered
  s12_activity=2026-11-13T15:50:50.155Z end 15:51:21.215Z Successful Setting desired count to 1. | monitor alarm TargetTracking-service/openvaa-staging/openvaa-staging-frontend-AlarmLow-<id> in state ALARM triggered policy openvaa-staging-frontend-cpu
  ```

  The service's events, in order: 15:40:08Z `has started 1 tasks: (task 2923e7caf54d4dbcb5f505d76587af28).`;
  15:41:03Z registered 1 target; 15:41:13Z `has reached a steady state.`; 15:50:57Z
  `has stopped 1 running tasks: (task 2923e7caf54d4dbcb5f505d76587af28).`; 15:51:07.370Z deregistered 1
  target, and `has begun draining connections on 1 tasks.`; 15:51:07.451Z `has reached a steady state.`

  The raise ran on its minute, 0.4 seconds after its time, though the first run's raise ran 42
  seconds after its time. The lowering ran 48 seconds after its time. Target tracking set the count
  to 1 two seconds after the lowering, and the task was stopping 7 seconds after that. That is
  `SCALE_IN_MINUTES=0` from the lowering's time to the first read at 1. The scale-in did not wait:
  the policy's low alarm (`AlarmLow`, `LessThanThreshold` 54, 15 periods of 60 seconds) has read
  `ALARM` since 10:03:49Z. Its history for the day holds one state update,
  `Alarm updated from INSUFFICIENT_DATA to ALARM`, so it was in `ALARM` through both runs, because
  the stack is idle. Target tracking acts on it again while it stays in `ALARM`, so the count came
  down as soon as the floor did. Research A3's "~15–20 min at idle" is not what happens on this stack. Both runs measured
  under a minute (35 seconds in the first, 2 seconds in the second, from the lowering to the desired
  count of 1).
- **Item 6, the task the scale-in stopped.** Of the tasks seen running, the one gone afterwards is the
  raise's task, `2923e7caf54d4dbcb5f505d76587af28` (`s12_tasks_stopped=1`). The scale-in kept the
  older task, `fc5c04833f5d4cb5bddd2cc383a53d39`. It was read until `STOPPED`, five reads 15
  seconds apart, before its exit code was taken (`s12_gone_task_read_exit=0`):

  ```
  s12_stopped_task_reason=Scaling activity initiated by (deployment ecs-svc/1526414372866454056)
  s12_stopped_task_exit=0
  stopCode=ServiceSchedulerInitiated started=2026-11-13T15:41:10Z stopping=2026-11-13T15:50:57Z stopped=2026-11-13T15:52:37Z revision=5
  ```

  Its own stream, `frontend/frontend/2923e7caf54d4dbcb5f505d76587af28`, holds 13 events: the
  server's `Listening on` line (a bind address, not copied) and the stop record. One of each kind
  (`s12_stop_message_read_exit=0`, `s12_stop_signal_read_exit=0`):

  ```
  s12_stop_message_events=1
  s12_stop_message_line=2923e7caf54d4dbcb5f505d76587af28 2026-11-13T15:52:03Z msg: 'The server is exiting after its stop.',
  s12_stop_signal_events=1
  s12_stop_signal_line=2923e7caf54d4dbcb5f505d76587af28 2026-11-13T15:52:03Z signal: 'SIGTERM',
  ```

  The stop record, as the stream holds it:

  ```
  2026-11-13T15:52:03Z {
  2026-11-13T15:52:03Z   level: 40,
  2026-11-13T15:52:03Z   time: 1794585123067,
  2026-11-13T15:52:03Z   msg: 'The server is exiting after its stop.',
  2026-11-13T15:52:03Z   severityText: 'WARN',
  2026-11-13T15:52:03Z   attributes: {
  2026-11-13T15:52:03Z     reason: 'SIGTERM',
  2026-11-13T15:52:03Z     signal: 'SIGTERM',
  2026-11-13T15:52:03Z     inFlightAtSignal: 0,
  2026-11-13T15:52:03Z     drainMs: 0
  2026-11-13T15:52:03Z   }
  2026-11-13T15:52:03Z }
  ```

  This is the second record of the stop signal, after 185-16's Step 11, and the first from a
  scale-in. The signal came 56 seconds after the deregistration began, with nothing in flight, and
  the task stopped with exit 0 34 seconds after the signal.

## Task 2: the pair removed, and the record (Step 12, items 7 and 8)

```
PAIR_REMOVE_APPLY_EXIT=0
SCHEDULED_ACTIONS_AFTER=0
TARGET_BOUNDS_AFTER=1,2
PLAN_AFTER_EXIT=0
```

- **Item 7, the plan without the variable (15:54Z).** The lowering had run and the count was back at
  1, so the plan held no change of the scalable target. It gave `s12_off_plan_exit=0`,
  `s12_off_plan_line=Plan: 0 to add, 0 to change, 2 to destroy.` and `s12_off_show_exit=0`, with
  exactly these two changes:

  ```
  s12_off_change=delete module.frontend.aws_appautoscaling_scheduled_action.floor["lower"]
  s12_off_change=delete module.frontend.aws_appautoscaling_scheduled_action.floor["raise"]
  ```

- **The apply and the read-back.** `s12_pair_remove_apply_exit=0`, from 15:54:46Z to 15:54:50Z
  (`Apply complete! Resources: 0 added, 0 changed, 2 destroyed.`), and `s12_plan_file_removed=yes`.
  Then:

  ```
  s12_actions_after_read_exit=0
  s12_scheduled_actions_after=0
  s12_target_after_read_exit=0
  s12_target_bounds_after=1,2
  s12_plan_after_exit=0
  ```

  The plan after it read `No changes. Your infrastructure matches the configuration.` The
  `ecs` namespace as a whole lists no scheduled action in `eu-north-1`
  (`namespace_actions_read_exit=0`, 0). The service runs one task, desired 1, on revision 5.
  No apply was made between the raise and the lowering in either run. The only applies were the two
  pairs and the two removals, each made outside a raise-to-lower window.
- **The tracked tfvars.** `scheduled_floor_changes` does not appear in
  `infra/envs/staging/aws/terraform.tfvars` (count 0). The pair was given only as a command-line
  `-var`, and the file is unchanged.
- **The runbook.** Three Step 12 rows moved from "Not yet observed" to five dated Observations rows,
  research A3's scale-in among them. Step 12's introduction no longer says the scale-in is slow, and
  it now tells the operator to keep the workstation awake and to run item 6 at once. Item 4's loop
  runs under `caffeinate -i`, killed when the loop ends. `prettier --check` is clean.
- **Item 8.** `$L`, with every plan, plan JSON, apply log, count file and task list of both runs, was
  removed (`s12_logs_removed=yes`).
