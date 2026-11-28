# 185-02: the task-environment guard seen failing

- Date (UTC): 2026-11-12T13:21:26Z
- Commit: 641b685ec84afe72ed799a3137b1a7fcc7097017 (clean tree)
- Test file: `apps/frontend/src/lib/server/startup/taskEnvironment.test.ts`
- Command (each run): `yarn workspace @openvaa/frontend test:unit src/lib/server/startup/taskEnvironment.test.ts`, with `TASK_ENVIRONMENT_SPEC` set to a scratch copy for the two red runs and unset for the green run. Each status was read directly from `$?`, not through a pipe.

Scratch copies, written under a fresh `mktemp -d` directory in the session scratchpad from the committed `infra/modules/frontend-service/task-environment.json`:

- `no-origin.json`: the list with the `ORIGIN` entry removed.
- `service-role.json`: the list with `{ "name": "SUPABASE_SERVICE_ROLE_KEY", "source": "parameter", "required": false, "description": "..." }` appended.

## Statuses

red_missing_origin_exit=1
red_service_role_exit=1
green_exit=0

## Failing case and message, per red run

Run with `TASK_ENVIRONMENT_SPEC=<scratch>/no-origin.json`:

```
FAIL  src/lib/server/startup/taskEnvironment.test.ts > the task environment list in the repository > agrees with REQUIRED_ENV, ANALYTICS_ENV and .env.example
AssertionError: expected [ Array(1) ] to deeply equal []
+   "ORIGIN: is required by the start-up check but missing from the list",
Tests  1 failed | 16 passed (17)
```

Run with `TASK_ENVIRONMENT_SPEC=<scratch>/service-role.json`:

```
FAIL  src/lib/server/startup/taskEnvironment.test.ts > the task environment list in the repository > agrees with REQUIRED_ENV, ANALYTICS_ENV and .env.example
AssertionError: expected [ Array(1) ] to deeply equal []
+   "SUPABASE_SERVICE_ROLE_KEY: must not reach the task in any form",
Tests  1 failed | 16 passed (17)
```

Each red run reported exactly one problem, and it named the planted variable. The service-role copy produced no `.env.example` problem because the root `.env.example` lists `SUPABASE_SERVICE_ROLE_KEY` for local tooling, so the `SERVICE_ROLE` rule alone failed it.

Run with `TASK_ENVIRONMENT_SPEC` unset (the committed list):

```
Tests  17 passed (17)
```
