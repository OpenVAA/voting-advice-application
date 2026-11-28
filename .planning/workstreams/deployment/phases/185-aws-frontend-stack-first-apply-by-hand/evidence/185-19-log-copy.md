# 185-19: the evidence log lines, copied before the destroy (runbook Step 15 item 1)

Copied 2026-11-14 at about 09:45Z from the log group `/openvaa/staging/frontend` in `eu-north-1`, before
the destroy removed it. Run in the operator's administrator session (`AWS_PROFILE=openvaa-admin`, the
key variables unset); the account check read `471112560111` first. Each line is one log event, as
the log driver stores each line of a record separately: its filter, the task id that ends its stream
name, its time (UTC, to the second) and its message, trimmed. `filter-log-events` returned no
further page. The raw answers stayed in a `umask 077` directory outside the repository, removed at
the end.

- `startup`: the start-up refusal of the three tasks Step 10 started without `ORIGIN` (two events
  each: the throwing source line and the error).
- `stop`: the stop message of each task that stopped on its signal: two replaced by rollouts
  before Step 10 (11:17Z, 11:21Z), the old task Step 11 stopped (`93522381…`, 185-16) and the
  two tasks Step 12 scaled in (`62b7c25f…`, `2923e7ca…`, 185-17).
- `signal`: the `SIGTERM` field of the same records, one for each stop line.

```
LOG_COPY_LINES=16
s15_startup_read_exit=0
s15_startup_events=6
s15_stop_read_exit=0
s15_stop_events=5
s15_signal_read_exit=0
s15_signal_events=5
```

```
s15_log_line=startup 1e33e768c389472abd534a3c0ed375af 2026-11-13T11:30:01Z if (missing.length > 0) throw new Error(`Required environment variables are not set: ${missing.join(", ")}`);
s15_log_line=startup 1e33e768c389472abd534a3c0ed375af 2026-11-13T11:30:01Z Error: Required environment variables are not set: ORIGIN
s15_log_line=startup a0079fd7b7fa4cee91b10e77e18abbfe 2026-11-13T11:31:47Z if (missing.length > 0) throw new Error(`Required environment variables are not set: ${missing.join(", ")}`);
s15_log_line=startup a0079fd7b7fa4cee91b10e77e18abbfe 2026-11-13T11:31:47Z Error: Required environment variables are not set: ORIGIN
s15_log_line=startup 1eb9d31b8da645babe4cc91d86fb92cc 2026-11-13T11:33:29Z if (missing.length > 0) throw new Error(`Required environment variables are not set: ${missing.join(", ")}`);
s15_log_line=startup 1eb9d31b8da645babe4cc91d86fb92cc 2026-11-13T11:33:29Z Error: Required environment variables are not set: ORIGIN
s15_log_line=stop 2896720993c94775a62eb282150ba214 2026-11-13T11:17:37Z msg: 'The server is exiting after its stop.',
s15_log_line=stop 70cd3da715a74157b960fd212d8d1591 2026-11-13T11:21:59Z msg: 'The server is exiting after its stop.',
s15_log_line=stop 9352238188ab4696b6b13b7e5266d034 2026-11-13T13:36:22Z msg: 'The server is exiting after its stop.',
s15_log_line=stop 62b7c25f26714a13828b797d30c24923 2026-11-13T14:00:02Z msg: 'The server is exiting after its stop.',
s15_log_line=stop 2923e7caf54d4dbcb5f505d76587af28 2026-11-13T15:52:03Z msg: 'The server is exiting after its stop.',
s15_log_line=signal 2896720993c94775a62eb282150ba214 2026-11-13T11:17:37Z signal: 'SIGTERM',
s15_log_line=signal 70cd3da715a74157b960fd212d8d1591 2026-11-13T11:21:59Z signal: 'SIGTERM',
s15_log_line=signal 9352238188ab4696b6b13b7e5266d034 2026-11-13T13:36:22Z signal: 'SIGTERM',
s15_log_line=signal 62b7c25f26714a13828b797d30c24923 2026-11-13T14:00:02Z signal: 'SIGTERM',
s15_log_line=signal 2923e7caf54d4dbcb5f505d76587af28 2026-11-13T15:52:03Z signal: 'SIGTERM',
```
