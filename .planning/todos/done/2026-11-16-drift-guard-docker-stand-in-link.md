---
created: 2026-11-16T09:30:00.000Z
title: Link the drift guard test's `docker` stand-in to an existing binary
area: testing
severity: minor
source: Phase 187 plan 187-26 (Task 2B and the operator's ruling `DRIFT_GUARD_RULING=push-now-fix-in-follow-up`, 2026-11-16)
target: before the deployment milestone's final evidence push
files:
  - packages/dev-seed/tests/checkDriftLinkedGuard.test.ts (the `binDir(true)` / `shim(dir, 'docker')` stand-in behind `BIN_WITH_DOCKER_SHIM`)
---

## Problem

Once, on 2026-11-15 under load, the case `check-drift.sh --target local is unchanged > still refuses a PGHOST
that is not a loopback address, with its own message` was killed at its 15 s `spawnSync` budget. Plan 187-26
Task 2B did not reproduce it (0 timeouts in 28 runs alone and under load) and found no Sleep, Wake or DarkWake
in the window, so `DRIFT_GUARD_CAUSE=unconfirmed`.

The lead: this is the only case that runs with `BIN_WITH_DOCKER_SHIM`, so it is the only one that executes a
file the test has just written. The first exec of a freshly written `#!/bin/sh` stand-in measured 130 to 160 ms
(macOS's exec assessment of a new file). The second exec measured 4 to 14 ms, and a symlink to `/usr/bin/true`
2 to 6 ms. Both traces that cross a second boundary cross it at `docker info`, the first exec of that stand-in.
The stall also coincided with the display turning off and with syspolicyd bursts. No trace shows the 15 s went
there.

## Solution

The operator ruled "push now, fix in a follow-up" (2026-11-16). Make the `docker` stand-in a link to an existing
binary that exits 0 on `docker info` (for example `/usr/bin/true`) instead of a freshly written executable. That
takes the first exec of a new file out of the case. Keep the 15 s budget as it is: the rule is never to widen it
without a cause a trace shows. Keep the case's assertions unchanged, and keep the `BIN_WITHOUT_DOCKER` cases
free of any `docker`.

Land it, with the dev-seed unit tests green, before the milestone's final `ci-evidence/**` push, so that push
carries it. Evidence: `.planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-26-ci-closure.md`
§ Task 2B and § Operator rulings on the open items (2026-11-16). Also listed in the phase's `deferred-items.md`.

## Resolution (plan 187-27, 2026-11-16)

Fixed in `ced5b42bb` (`fix(187-27): link the drift guard's docker stand-in to an existing binary`). A probe at
module load links `docker` to the first of `/usr/bin/true` and `/bin/true` that answers `docker info` with 0 under
that name; where none does, the stand-in is the written file as before.

- **Link target per host:** this macOS host `link:/usr/bin/true` (`/bin/true` absent); the CI runner's image
  (`ubuntu-24.04`, version `20261111.127.1`, Ubuntu 24.04.5 LTS; probed in `ubuntu:24.04`) `link:/usr/bin/true`;
  `ubuntu:26.04` `link:/usr/bin/true` (a GNU `true`, not a multicall binary); `node:24-alpine` `written` (no
  `/usr/bin/true`, and BusyBox's `/bin/true` exits 127 under the name `docker`).
- **Runs:** 10 alone, each 13 of 13, the local case 11 to 16 ms (it was 160 to 215 ms with the written file);
  18 file runs in 3 loaded sessions (`yarn test:unit` with a fresh private turbo cache and the Terraform loops),
  0 timeouts, the local case at most 68 ms. Every traced local child resolved `docker` to the link.
- **Unchanged:** the 15 s `spawnSync` budget, the case's two assertions, `BIN_WITHOUT_DOCKER`, and the `psql` and
  `pgrep` stand-ins.
- **Evidence:** `.planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-27-ci-closure.md` § Task 4.
