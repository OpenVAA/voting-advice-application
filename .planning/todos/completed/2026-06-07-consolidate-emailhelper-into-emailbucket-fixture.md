---
created: 2026-06-07T06:30:00.000Z
resolved: 2026-06-07
status: completed
title: Confirm emailHelper→emailBucket internalisation green on live stack
area: testing
files:
  - tests/tests/fixtures/shared/emailBucket.fixture.ts
  - tests/tests/specs/candidate/candidate-journey.spec.ts
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts
---

## Problem

Item 6 of the e2e cleanup (report `260607-cd0-E2E-CLEANUP-REPORT.md`). The CODE
is DONE (commit `2764a79a9`): `toCallbackUrl` moved into
`emailBucket.fixture.ts`, both spec imports repointed, `utils/emailHelper.ts`
deleted (it was dead except `toCallbackUrl` — the fixture already owned its own
Mailpit plumbing; the "wraps emailHelper" docstring had been inaccurate).

Static gates passed: `tsc -p tests/tsconfig.json` 0, eslint 0,
`playwright --list` 84/72. The only thing NOT yet done is a **live-stack green
run** of the 2 affected specs (could not run here — no dev stack up).

## Solution

With the dev stack running (`yarn dev`) and a fresh DB, run the 2 specs:

```bash
# from repo root
yarn test:e2e --project=candidate-journey --reporter=list

yarn test:e2e --no-deps --project=data-setup-perm-localisation-positive --reporter=list
yarn test:e2e --no-deps --project=perm-localisation-positive --reporter=list
yarn test:e2e --no-deps --project=data-teardown-perm-localisation-positive --reporter=list
```

If both pass → **close this todo** (item 6 fully done). If a registration step
fails with "already registered", reset auth users first (`yarn db:reset`), per
the known perm-teardown auth-user leak.

## Resolution (2026-06-07)

**DONE.** User confirmed all tests pass on a live stack. The emailHelper→emailBucket
internalisation (commit `2764a79a9`) is verified green; `utils/emailHelper.ts` is
fully retired. Item 6 of report `260607-cd0-E2E-CLEANUP-REPORT.md` is complete —
the entire e2e cleanup follow-up (dead-code sweep, `.helper` rename, IDURA, and
emailHelper consolidation) is now closed.
