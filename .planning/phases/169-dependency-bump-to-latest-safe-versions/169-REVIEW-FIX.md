---
phase: 169-dependency-bump-to-latest-safe-versions
step: review-fix
batch: review-fix-D
findings_fixed: [IN-02, IN-03, IN-09]
findings_no_change: [WR-04, IN-07]
findings_left_as_recorded: [IN-01, IN-04, IN-05, IN-06, IN-08]
base: 2fb65aab2
gates: tests/e2e-runs/179-gates/review-fix-D
e2e_close: tests/e2e-runs/179-e2e/review-fix-D-r2
status: complete
---

# Phase 169 review fix

Fixed in review-fix batch D, with phases 166, 167 and 168. WR-01 to WR-03 were fixed when the review was recorded (see `169-REVIEW-DISPOSITION.md`). This batch takes the three low todos, confirms the nodemailer pin and re-assesses IN-07 under the standing ruling that nothing is deployed. IN-01, IN-05 and IN-06 stay accepted, IN-04 stays tracked in the LLM migration todo and IN-08 stays a CI observation, as recorded.

| Finding | Disposition | Commits |
| --- | --- | --- |
| WR-04 | no change needed: both functions pin 10.0.11; todo already closed | none |
| IN-02 | fixed; todo closed | c8dd43bbd (red), bd018dc0c (fix) |
| IN-03 | fixed; todo closed | 9dafee0e7 (red), 910c4ac0b (fix) |
| IN-07 | no change needed: nothing is deployed | none |
| IN-09 | fixed; todo closed | 8598b3540 (test with a planted-drift control) |

## WR-04: nodemailer 10.0.11 in both mailing functions

Both Edge Functions that send mail import `npm:nodemailer@10.0.11`: `account-access/index.ts` (the function added after the review) and `send-email/index.ts`. The todo `2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md` is already in `.planning/todos/done/` with its resolution of 2026-10-04 for `send-email`; a note recording that `account-access` carries the same pin was appended to it. In the restructured history the `send-email` pin is part of `0e9b07d9e`. The parity test of IN-09 now holds the two literals equal, so one can no longer move without the other.

## IN-02: the restart plugin follows a deletion and debounces

**Red** (c8dd43bbd): two cases on fake timers in `vite.restartOnRootEnv.test.ts`. A deletion of the root `.env` gave no restart, and the `unlink`, `add`, `change` burst of a save by rename gave two: **exit 1**, 2 of 8 failed. Log `tests/e2e-runs/179-unit/review-fix-D-169-in02-red.log`.

**Fix** (bd018dc0c): the plugin listens for `unlink` as well, and restarts `RESTART_DEBOUNCE_MS` (200 ms) after the last event on the file. It still compares paths only and never opens the file. Every case runs on fake timers and advances past the window before asserting; the "any other file" case gained an `unlink` of another file. **Green:** 8 passed. Log `review-fix-D-169-in02-green.log`.

## IN-03: no install-script allowance for the supabase CLI

**Red** (9dafee0e7): `apps/supabase/scripts/installScriptAllowList.test.ts` reads the root manifest's `dependenciesMeta` and asserts that each package allowed to build declares a `preinstall`, `install` or `postinstall` script in its installed manifest. The supabase workspace's vitest now also runs `scripts/**/*.test.ts`. **Exit 1**: `supabase` 2.118.0 declares none (`esbuild` and `unrs-resolver` each declare a `postinstall`). Log `review-fix-D-169-in03-red.log`.

**Fix** (910c4ac0b): the `supabase` entry is removed from the root `dependenciesMeta`, and `yarn install` drops it from the lockfile's workspace entry. The CLI ships through its optional `@supabase/cli-*` packages and still runs: `yarn workspace @openvaa/supabase exec supabase --version` gives 2.118.0, and the stack restart of this batch's close started it. **Green:** the test passes.

## IN-07: no hosted database to drift

Re-assessed under the operator ruling of 2026-10-04 (`.planning/PROJECT.md`: "Nothing is deployed"). The finding's risk was a hosted database that had applied `00001` with `is_valid_choice_id` as `IMMUTABLE`. There is none: the hosted-Postgres todo it was tracked in (`2026-10-03-upgrade-hosted-postgres-to-17.md`) is closed with that ruling, and any project created later applies `00001`, which declares the function `STABLE` (line 201), as `schema/011-validation-functions.sql` does (line 58). No forward migration is needed.

## IN-09: the Edge pins are held to each other and to the installed version

`apps/supabase/scripts/edgeFunctionPins.test.ts` reads the `npm:` pins of every function entry point and asserts that supabase-js is pinned in each function, that each package is pinned at one version across the functions (supabase-js, jose, nodemailer) and that a package this workspace installs (supabase-js, jose) is pinned at the installed version. The tree was already consistent, so the test is green on it; its proof is a **planted-drift control**: with `send-email` changed to supabase-js 2.117.3 and nodemailer 10.0.12, **exit 1**, 2 of 3 failed, and the file was restored with `git checkout --`. Logs `review-fix-D-169-in09-planted-drift.log` and `review-fix-D-169-in09-green.log` (4 passed with the IN-03 test). The jose case in `identity-callback/verifyConfig.test.ts` stays as it is.

## Todos closed

Moved from `.planning/todos/pending/` to `.planning/todos/done/`, each with a Resolution section:

- `2026-10-03-vite-restart-plugin-unlink-and-debounce.md` (IN-02)
- `2026-10-03-drop-supabase-from-dependenciesmeta-built.md` (IN-03)
- `2026-10-03-supabase-js-edge-pin-parity-test.md` (IN-09)

## Gates and E2E close

See `167-REVIEW-FIX.md` § Gates and E2E close of batch D.
