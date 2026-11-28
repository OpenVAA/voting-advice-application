# 184-25 evidence: the three repository gates on the phase's final tree

Recorded 2026-11-12 (UTC) by the plan executor from the orchestrator's logs in `tmp/184-gates/`. The orchestrator ran every gate and stack command itself, because a subagent's stack commands are refused in auto mode; the executor did not run any gate again.

- **Commit:** `dccdf490842d64b06be71569e97df112607e2014` (HEAD before and after every gate run; the tree was clean outside `.planning/` before and after, the one untracked entry being `.planning/workstreams/deployment/milestone.lock`)
- **Date:** 2026-11-12
- **Node:** v24.21.0 (`$HOME/.nvm/versions/node/v24.21.0/bin` first on `PATH`)
- **Turbo cache:** `TURBO_CACHE_DIR` set to a private `mktemp -d` directory for this attempt and removed afterwards
- **Status reading:** each status was written to a file by the command after the gate (`tmp/184-gates/status`, `tmp/184-gates/unit2.status`) and read from that file, never through a pipe

## Final lines

```
lint:check exit=0
format:check exit=0
test:unit exit=0
```

| Gate | Status | Run | Start (UTC) | End (UTC) | Log | Note |
| --- | --- | --- | --- | --- | --- | --- |
| `yarn lint:check` | `lint:check exit=0` | 1 | 2026-11-12T06:15:32Z (run 1 start) | within run 1 | `tmp/184-gates/lint.log` | It reached the last link: the parity guard printed `every classified key holds`, with 346 tracked files scanned for a second writer of hosted settings |
| `yarn format:check` | `format:check exit=0` | 1 | within run 1 | within run 1 | `tmp/184-gates/format.log` | `All matched files use Prettier code style!` (root and docs) |
| `yarn test:unit` | `test:unit exit=1` (red, superseded) | 1 | within run 1 | 2026-11-12T06:17:07Z (run 1 end) | `tmp/184-gates/unit.log` | turbo `Tasks: 22 successful, 24 total`, `Failed: @openvaa/dev-seed#test:unit`; see below |
| `yarn test:unit` | `test:unit exit=0` | 2 | 2026-11-12T06:18:17Z | 2026-11-12T06:19:52Z | `tmp/184-gates/unit2.log` | turbo `Tasks: 25 successful, 25 total`; then `test:unit:tests` and `test:unit:infra` |

`lint:check` and `format:check` are taken from run 1. Run 2 repeated only `test:unit`, on the same commit, with no file changed between the runs; only the shared database was reset.

## Run 1's red `test:unit` and its cause

The failing link was `@openvaa/dev-seed#test:unit`: `Test Files 1 failed | 79 passed (80)`, `Tests 2 failed | 1264 passed (1266)`. Both failures are in `packages/dev-seed/tests/integration/default-template.integration.test.ts`, which seeds the shared local stack:

1. `applies default template and meets the NF-01 operation budget + assertions`. First error line: `Error: bulkImport failed: Nomination constituency <uuid> is no constituency of its election <uuid>`
2. `the seeded dataset is readable by the ANON client — the voter app path (TMPL-03)`. First error line: `AssertionError: anon-visible candidate nominations: expected 0 to be greater than 0`. This follows from the first failure, because the import wrote no rows.

Cause, measured by the orchestrator: the shared local stack's database held migrations `00001` to `00010` from the `-gsd` worktree, whose `nomination_write_guards` check refuses the nomination shape this branch's dev-seed writes. This branch has one migration, `00001_initial_schema.sql`. No file this phase changed is involved: it is an environment schema mismatch, the case of the project note "schema-mismatch red = check migration count", and the same cause as attempt 1 of `184-09-code-gates.md`.

Fix: `yarn db:reset` from this worktree (exit 0, `tmp/184-gates/db-reset.log`), after which the database held only `00001`. The standing note that `-infra` resets the shared stack freely covers it; no `-gsd` process was using the stack.

## Run 2's `test:unit`, link by link

- turbo: `Tasks: 25 successful, 25 total`; every `test:unit` task ran as `cache bypass, force executing`
- `@openvaa/dev-seed#test:unit`, the link that failed in run 1: `Test Files 80 passed (80)`, `Tests 1266 passed (1266)`
- `@openvaa/frontend#test:unit`: `Test Files 259 passed | 1 skipped (260)`, `Tests 5948 passed | 31 skipped (5979)`; the skipped file is not one this phase touched
- `test:unit:tests`: `Test Files 10 passed (10)`, `Tests 189 passed (189)`
- `test:unit:infra`, the infra suite, which holds `infra/scripts/probe-hosted.test.ts`, the tests of the D-13 probe: `Test Files 1 passed (1)`, `Tests 96 passed (96)`

## D-24

No pending todo was folded into this phase (D-24): the five keyword matches of the todo scan are frontend or UI work, and none of `.planning/todos/pending/` was moved, closed or edited by this phase.

**Outcome:** all three gates exit 0 at `dccdf490842d64b06be71569e97df112607e2014`. Run 1's red `test:unit` came from the shared stack holding the `-gsd` worktree's schema, and it went away with the reset and no change to any file.
