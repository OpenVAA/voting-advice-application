---
created: 2026-10-08T07:50:00.000Z
title: The next copy of the bank-auth driver must write the output of yarn db:start through the key filter
area: tests / E2E harness / hygiene
severity: minor
source: quick task 261008-g2-g4-g6-e2e-harness-fixes (operator decision G2 (a)); carried on from 2026-10-07-174-e2e-drivers-write-db-start-output-with-the-local-keys.md, now in done/
files:
  - .planning/phases/174-invitations-grants-defined-in-advance/174-bankauth.sh
  - tests/scripts/withhold-stack-keys.mjs
---

## Problem

`174-bankauth.sh` restores the default edge runtime with `yarn db:stop` and `yarn db:start`, and writes the second command's whole output into `<stem>.bankauth.db-start.log` under `tests/e2e-runs/`:

```bash
yarn db:start > "$EV_DIR/$STEM.bankauth.db-start.log" 2>&1
s=$?
```

That output ends with the stack's status, which holds the local keys. The E2E wrapper stopped writing it on 2026-10-08 (commit `a80be44e1`); the driver was left as it is, because the todo that named the defect asked for the change in the copy the next phase makes and not in the finished phases' copies (170, 171, 172 and 174 name the same file).

Nothing checks the driver: `tests/tests/utils/withholdStackKeys.test.ts` reads `tests/scripts/*.sh` only, and the drivers live under `.planning/phases/`.

## Solution

In the next phase's copy of the driver, and in no finished one:

```bash
yarn db:start 2>&1 | node tests/scripts/withhold-stack-keys.mjs > "$EV_DIR/$STEM.bankauth.db-start.log"
s=${PIPESTATUS[0]}
```

The driver does not set `pipefail`, so the status has to be read from `PIPESTATUS`; `$?` would be the filter's. Then count key-shaped lines in the file that run writes, without opening it. The pattern used on 2026-10-08:

```
eyJ[A-Za-z0-9_-]{8,}\.|sb_(publishable|secret)_|://[^/:@[:space:]]+:[^/@<[:space:]]+@|(KEY|SECRET)[A-Z_]*["']?[[:space:]]*[:=]|(Secret|Access Key|Publishable)[[:space:]]*│
```

Count the `db-stop` log the same way: that `yarn db:stop` prints no status was not checked.

## Resolution

**Closed 2026-10-22 by Phase 179** (plan 179-01; moved by 179-23).

Phase 179's copy of the driver, `.planning/phases/179-identity-provider-registration-coverage-close/179-bankauth.sh` (`cc2b2e51a`, `chore(179-01)`), writes the output of both `yarn db:stop` and `yarn db:start` through `node tests/scripts/withhold-stack-keys.mjs` and reads each status from `PIPESTATUS[0]`. No finished phase's copy was changed. From 179-05 on, the E2E wrapper serves the identity-provider projects itself and spawns `yarn _dev:concurrent`, so the stack status is not printed into a run's `devserver.log` either (`9cb7478d7`, with `withholdStackKeys.test.ts` failing on any harness script that spawns root `yarn dev`).
