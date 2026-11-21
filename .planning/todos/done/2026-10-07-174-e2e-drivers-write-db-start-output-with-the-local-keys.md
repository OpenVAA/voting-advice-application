---
created: 2026-10-07T12:53:29.000Z
title: The E2E wrapper and the bank-auth driver write the whole output of yarn db:start, local keys included, into db-start.log under tests/e2e-runs/
area: tests / E2E harness / hygiene
severity: minor
source: Phase 174 (174-05-SUMMARY.md § One hygiene slip, corrected; 174-06-SUMMARY.md § Observations for the operator; filed by 174-10)
files:
  - tests/scripts/e2e-run.sh
  - .planning/phases/174-invitations-grants-defined-in-advance/174-bankauth.sh
---

## Problem

`yarn db:start` ends by printing the CLI's status object, which holds the local stack's keys. Two scripts redirect that whole output into an evidence file:

- `tests/scripts/e2e-run.sh`: `yarn db:start > "$RUN_DIR/db-start.log" 2>&1`, for every run that starts the stack.
- `174-bankauth.sh`: `yarn db:start > "$EV_DIR/$STEM.bankauth.db-start.log" 2>&1`, in its restore step. The copies of the driver in the directories of Phases 170, 171 and 172 name the same file (`git grep -l "db-start.log" -- .planning/phases`).

The files are under the gitignored `tests/e2e-runs/` and the keys are a local stack's, so nothing has left the host. But the phase's own rule is that no command redirects that output into a file or the transcript, the hygiene verdict does not scan `tests/scripts/`, and an evidence directory is exactly what gets attached to a report or uploaded as a CI artifact. On a stack started with non-default keys the same line would hold real secrets.

How it is known: a count of key-shaped lines in one such file was 1; no file was opened. That `174-bankauth.sh` does the same is read from the driver's code.

## Solution

- Filter the status object out before anything is written: keep the lines up to the first key-bearing one, or write only the exit status and the last non-secret lines.
- Do the same in the bank-auth driver, in the copy the next phase makes rather than in the finished phases' copies.
- Extend `174-verdict.mjs hygiene`'s successor to scan `tests/scripts/` for a redirect of `yarn db:start` or `supabase status`.
- Nothing under `tests/e2e-runs/` is deleted to fix this: the existing files stay as they are.

## Resolution

Closed 2026-10-08 by quick task `261008-g2-g4-g6-e2e-harness-fixes` (operator decision G2 (a)), commit `a80be44e1`. One part of § Solution is carried on in its own todo, named below.

**What changed.** `tests/scripts/e2e-run.sh` writes the output of `yarn db:start` into `db-start.log`, and of `yarn db:reset` into `db-reset.log`, through a new filter, `tests/scripts/withhold-stack-keys.mjs`. The reset log is not named in this todo; it had the same content, because that command starts the stack first (a count over one such file: 4 key-shaped lines). The filter replaces the status with a marker line and copies every other line unchanged:

1. a line that is a JSON object, which is how CLI 2.118.0 prints the status to a pipe;
2. each run of lines that begin with a box-drawing character, the tables older logs hold;
3. a line that begins with a label naming a key, a secret, a password or a token, for the `env`, `yaml`, `toml` and indented-JSON forms;
4. on any line left, a JSON web token, an `sb_`-prefixed key and the password of a URL.

The wrapper runs under `pipefail`, so the step fails when the start fails and when the filter does, and in neither case is anything unfiltered written (exercised on the construct alone, three cases).

**Readers checked before choosing the filter.** Nothing parses either log: `e2e-run.sh` names them in its exit-3 message, `determinism-batch.sh` lists `db-reset.log` in a sentence, and CI uploads the whole run directory as an artifact, which is the exposure. So the whole status is withheld and nothing of it is kept.

**The check that would fail on a key.** Counted with one pattern, written apart from the filter's own, and without printing a line: the closing run's `db-start.log` has 5 lines, 0 key-shaped, 1 marker; the same pattern counts 1 in `c6-heartbeat-close/db-start.log` and 4 in `167-gate/db-reset.log`, which the unfiltered wrapper wrote, and 0 in each after the filter (written to scratch). `tests/tests/utils/withholdStackKeys.test.ts` holds it from now on: it runs the filter over each form with keys made up at run time, and it fails on a script under `tests/scripts/` that writes the output of `yarn db:start`, `yarn db:reset`, `supabase start` or `supabase status` to a file without the filter. Removing the object rule, removing the table rule and restoring the wrapper's old redirect each turned it red. It runs in `yarn test:unit` (commit `0633e4023`).

**The third bullet of § Solution** asked for the hygiene verdict's successor to scan `tests/scripts/`. That scan is the test above, which runs on every `yarn test:unit` instead of once per phase.

**Not done, on this todo's own instruction.** The bank-auth driver. Its copies in the directories of Phases 170, 171, 172 and 174 are finished phases' records and were not edited; the next copy is to make the change. Filed: `2026-10-08-bank-auth-driver-copy-must-filter-the-db-start-output.md`. Until then a run of `174-bankauth.sh` still writes the status into `<stem>.bankauth.db-start.log`.

**Old logs.** Nothing under `tests/e2e-runs/` was edited or deleted. It holds 326 start and reset logs, the bank-auth driver's among them; 325 have at least one key-shaped line (counted with the pattern above, none opened), and the one that has none is the closing run's.

**Not verified.** A cold start, where the CLI pulls images and prints for minutes, was not run; the filter was run over a recorded reset log that holds such output. The `yarn db:reset` branch of the wrapper was not run (the closing run used `--no-db-reset`); its line differs from the tested one in the command and the file name. No stack with non-default keys was started.

**Found on the way, not changed.** CI's own `supabase start` steps (`.github/workflows/main.yaml`) print the same status into the Actions log. Those are the well-known local demo keys on a throwaway runner; it is the same output in a place this todo did not name.
