---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 04
subsystem: infra
tags: [supabase, migrations, db-push, drift-check, bash, vitest]
status: complete

requires: []
provides:
  - "infra/scripts/push-migrations.sh: SUPA-01's one command (--ref, --workdir, --manifest, --log-dir; named lines push_connection/push_pending/push_up_to_date/push_status/drift_status; exit 0/1/2/3/4/130)"
  - "infra/scripts/check-drift.sh: the --target linked guard (ref file, PGHOST/PGUSER tied to the ref, no 6543, no PGHOSTADDR/PGSERVICE, never apps/supabase)"
  - "packages/dev-seed/tests/pushMigrationsGate.test.ts: 12 cases"
  - "packages/dev-seed/tests/checkDriftLinkedGuard.test.ts: 13 cases"
affects: [184-09, 184-11, 184-13, 184-21]

actuals:
  tokens: 10100
  tasks: 2
  commits: 2
plan_head_before: 0d863207f43771d2338225401625de2738552228
plan_head_after: b92cae268edd00e40e490cbdf871b90a600b5b21

tech-stack:
  added: []
  patterns:
    - "Every refusal before any CLI call; the spec proves it by an empty --log-dir after each refused run"
    - "run_child <is-cli> <out> <err> cmd...: the redirections belong to the command, not the function, so the trap's message reaches the script's own stderr"
    - "Interrupt: a CLI child gets SIGTERM, 10 s grace, then SIGKILL; the drift-check child gets SIGTERM and is waited for (it removes its shadow database)"
    - "Guard specs run with a stand-in PATH of symlinked tools and no docker, so each refusal is shown to precede the Docker check"

key-files:
  created:
    - infra/scripts/push-migrations.sh
    - packages/dev-seed/tests/pushMigrationsGate.test.ts
    - packages/dev-seed/tests/checkDriftLinkedGuard.test.ts
  modified:
    - infra/scripts/check-drift.sh

key-decisions:
  - "The direct-host branch of the linked guard does not constrain PGUSER (the plan's rule); the pooler branch requires PGUSER ending in .<ref>"
  - "The linked guard also refuses PGHOSTADDR and PGSERVICE, and a pooler host that is not exactly <name>.pooler.supabase.com, because each can send psql past the PGHOST it checked"
  - "A dry run that neither says 'is up to date.' nor lists a migration is a refusal (exit 2), never a push"
  - "A failed dry run is exit 3 (the dry run or the push failed), with nothing pushed"

patterns-established:
  - "Named result lines on stdout (key=value), prompt on /dev/tty, raw CLI output in a 0700 log directory"

requirements-completed: []

coverage:
  - id: D1
    description: "push-migrations.sh refuses a missing/malformed ref, a missing --workdir, apps/supabase, no supabase/migrations, an unlinked or other-linked work directory, and an unset/empty SUPABASE_DB_PASSWORD, all with exit 2 before any CLI call"
    requirement: "SUPA-01"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/pushMigrationsGate.test.ts#push-migrations.sh refuses every wrong target before the CLI runs"
        status: pass
    human_judgment: false
  - id: D2
    description: "The wrapper's text dry-runs, skips the vault, answers in text, confirms on /dev/tty, never passes the seed or include-all flags, never links, and runs check-drift.sh --target linked"
    requirement: "SUPA-01"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/pushMigrationsGate.test.ts#push-migrations.sh calls the CLI as a push to a hosted project requires"
        status: pass
    human_judgment: false
  - id: D3
    description: "check-drift.sh --target linked refuses every connection that is not the linked project, before the tool and Docker checks; the linked project's direct and session-pooler connections pass; --target local is unchanged"
    requirement: "SUPA-01"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/checkDriftLinkedGuard.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "The happy path (dry run, up to date, typed confirmation, push, drift status mapping, interrupt) against a real hosted project"
    requirement: "SUPA-01"
    verification:
      - kind: other
        ref: "hosted runs in plans 184-11, 184-13 and 184-21"
        status: pending
    human_judgment: true

duration: 14min
completed: 2026-10-26
---

# Phase 184 Plan 04: Push wrapper and linked drift guard Summary

**`infra/scripts/push-migrations.sh` refuses every wrong target before the Supabase CLI runs, then dry-runs, asks for the ref on the terminal, pushes with `--yes --skip-vault` and lets `check-drift.sh --target linked` decide its status. The drift check now ties PGHOST/PGUSER to the linked ref and refuses port 6543.**

## Performance

- **Duration:** about 14 min
- **Completed:** 2026-10-26
- **Tasks:** 2
- **Files:** 3 created, 1 modified

## The wrapper's interface (for the runbook, plan 184-09)

```
infra/scripts/push-migrations.sh --ref <ref> --workdir <dir> [--manifest <path>] [--log-dir <dir>] [-h|--help]
```

| Flag | Meaning |
|---|---|
| `--ref <ref>` | REQUIRED. 20 lower-case letters; must equal `<workdir>/supabase/.temp/project-ref` |
| `--workdir <dir>` | REQUIRED. The linked work directory (relative paths resolve against the repo root). Never `apps/supabase` |
| `--manifest <path>` | OPTIONAL. Passed to the drift check; checked to be a readable file before any CLI call |
| `--log-dir <dir>` | OPTIONAL. The CLI's raw output (`dry-run.stdout`, `dry-run.stderr`, `pending.txt`, `push.stdout`, `push.stderr`) and the drift check's `drift/` files. Created mode 0700. Default: a kept temporary directory, named on stderr |

No flag takes a database address. Environment: `SUPABASE_DB_PASSWORD` (required, non-empty) for the CLI; PG* variables (and `PGPASSWORD` or a password file) naming the linked project, for the drift check.

Named lines on stdout, in this order:

| Line | When |
|---|---|
| `push_connection=direct\|pooler\|unknown` | always, after the dry run (`Resolved DNS` → direct, `Using connection pooler` → pooler) |
| `push_pending=<5-digit version>` | one per migration the dry run lists |
| `push_up_to_date=yes\|no` | after a successful dry run |
| `push_status=<n>` | only when a push ran |
| `drift_status=<n>` | after the drift check; followed by the drift check's own report |

Prompt (on `/dev/tty` only): the pending versions, then `Type the project ref to push to it:`.

Exit codes:

| Code | Meaning |
|---|---|
| 0 | applied, or already up to date, and no drift |
| 1 | drift after the push |
| 2 | refused, nothing pushed: usage, wrong/unlinked target, no password, no CLI, no terminal, wrong typed answer, or a dry run that neither says up to date nor lists a migration |
| 3 | the dry run or the push failed (after a failed push, run again to see what the database lacks) |
| 4 | pushed or up to date, and the drift check could not run |
| 130 | interrupted; a CLI call still running 10 s after the signal is killed outright |

## Accomplishments

- The wrapper, in the anatomy of `check-drift.sh` (header, `set -euo pipefail`, `LC_ALL=C`, `fatal`, `resolve_path`, background-and-wait, redacted printing of CLI errors).
- The linked-target guard in `check-drift.sh`, placed after the work-directory check and before the CLI, tool and Docker checks. Header prerequisite 4 and the usage example are rewritten to match.
- Two specs (12 + 13 cases), both seen RED first: 12/12 failed on the missing script; 9/13 failed on the unchanged `check-drift.sh` (the 4 that passed are the PATH control, the two accepting controls and the unchanged local refusal).
- Offline smoke test of the happy path against a throwaway copy of the layout with a fake CLI and a fake drift check (not committed): up to date → exit 0; pending with no terminal → exit 2; pending with the right typed ref over a pseudo-terminal → push, `push_status=0`, drift → exit 0; wrong typed answer → exit 2 with no push files; failed dry run → exit 3; drift 1 → 1; drift 2 → 4; SIGINT+SIGTERM during a CLI child that ignores SIGTERM → exit 130 after about 12 s with no leftover process.

## Task Commits

1. **Task 1: The push wrapper and its refusals**: `13f6c4e13` (feat)
2. **Task 2: The drift check's linked-target guard**: `b92cae268` (feat)

## Files Created/Modified

- `infra/scripts/push-migrations.sh`: SUPA-01's one command.
- `infra/scripts/check-drift.sh`: the `--target linked` guard; header prerequisite 4 and the usage line.
- `packages/dev-seed/tests/pushMigrationsGate.test.ts`: the wrapper's refusals and command-line shape.
- `packages/dev-seed/tests/checkDriftLinkedGuard.test.ts`: the linked guard's refusals, two accepting controls, the unchanged local refusal.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A spec case reached the CLI during the first GREEN run**
- **Found during:** Task 1
- **Issue:** the "unset `SUPABASE_DB_PASSWORD`" case passed `undefined` to a parameter with a default value, so the case ran with the placeholder password, passed every refusal and started `supabase db push --linked --dry-run` against the made-up ref `abcdefghijklmnopqrst`. No access token exists on this host (`~/.supabase/profile` is absent; the CLI's log said so), the password was a placeholder, and the CLI ran a dry run only. It hung; the binary ignored SIGTERM, and it was ended with SIGKILL. Nothing was pushed, and no credential was involved.
- **Fix:** the parameter now takes `null` for "unset", and every case runs with `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` set to a closed local port, `SUPABASE_ACCESS_TOKEN` removed and a 15 s spawn timeout, so a case that wrongly reaches the CLI fails fast.
- **Files modified:** `packages/dev-seed/tests/pushMigrationsGate.test.ts`
- **Commit:** `13f6c4e13`

**2. [Rule 1 - Bug] The interrupt trap would wait forever on a CLI that ignores SIGTERM**
- **Found during:** Task 1 (the stray call above)
- **Issue:** the `check-drift.sh` pattern sends SIGTERM and then waits with no bound. The CLI binary was observed ignoring SIGTERM while it waited on the network (cause UNCONFIRMED), so the wrapper, and the test runner above it, stayed blocked.
- **Fix:** a CLI child gets SIGTERM, up to 10 s, then SIGKILL; the drift-check child still gets SIGTERM and an unbounded wait, because it removes its shadow database before exiting. The child's redirections moved into `run_child`, so the trap's "interrupted" message reaches the wrapper's stderr instead of the dry-run log.
- **Files modified:** `infra/scripts/push-migrations.sh`
- **Commit:** `13f6c4e13`

**3. [Rule 2 - Missing critical] Further linked-guard refusals**
- **Found during:** Task 2
- **Issue:** `PGHOSTADDR` and a `PGSERVICE` service file can each send psql to another address than the PGHOST the guard checked, and a comma-separated PGHOST could end in `.pooler.supabase.com` while naming another host first.
- **Fix:** `--target linked` refuses `PGHOSTADDR`, `PGSERVICE`, an unset PGHOST, and a pooler host that is not exactly `<name>.pooler.supabase.com`. Each has a spec case.
- **Files modified:** `infra/scripts/check-drift.sh`, `packages/dev-seed/tests/checkDriftLinkedGuard.test.ts`
- **Commit:** `b92cae268`

**4. [Rule 2 - Missing critical] Wrapper refusals beyond the plan's list**
- **Found during:** Task 1
- **Issue:** a `--manifest` that is not readable would only be found by the drift check, after the push; and a dry run whose output matches neither "up to date" nor a migration list (for example, a changed wording) would otherwise go on to a push with nothing confirmed.
- **Fix:** both are exit 2 before any push. A missing CLI, drift check or `pgrep` is also exit 2 before the CLI runs. The log directory is created with umask 077, because the debug log names the database's address.
- **Commit:** `13f6c4e13`

## Known Stubs

None.

## Deferred to orchestrator (stack busy)

None. Neither plan gate needs the stack or the full unit suite; both specs and `node scripts/assert-hosted-settings-parity.mjs` ran here. `packages/dev-seed/tests/deploymentChecksWiring.test.ts` also still passes.

## Assumptions to confirm in the hosted runs (184-11, 184-13, 184-21)

- The dry run's up-to-date text holds `is up to date.` (RESEARCH A2; only that fragment is matched).
- The dry run lists each pending migration on a line of its own, holding only the file name and at most a bullet (colour codes are removed before matching). If the wording differs, the wrapper refuses with exit 2 instead of pushing.
- `--debug` writes `Resolved DNS` or `Using connection pooler` to the dry run's output; otherwise `push_connection=unknown`.

## Threat Flags

None. No new surface beyond the plan's threat model (T-184-12 to T-184-15 are mitigated as planned).

## Self-Check: PASSED
