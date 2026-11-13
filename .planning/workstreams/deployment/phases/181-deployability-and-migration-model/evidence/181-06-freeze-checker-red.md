FIXTURES_RED=seen
SCRATCH_FROM_COMMIT=c2691ac1d87b9af83d1c9e1d25a411c65c16644c
SCRATCH_HAS_CODE_UNDER_TEST=yes
SELF_TEST_CAN_FAIL_EXIT=1
RULE_WITHOUT_FIXTURE_EXIT=1
CHECKER_SEES_AN_EDIT=seen

# Red controls: the frozen-mode checker of `scripts/assert-schema-migration-parity.mjs`

Each status below is the exit status of the command itself, printed by the shell that ran it on the line after the command's output. None was read through a pipe.

## What was run on

| Item | Value |
|------|-------|
| Date | 2026-10-12T17:53:06Z |
| Commit of the working tree | `c2691ac1d87b9af83d1c9e1d25a411c65c16644c`, with no tracked change before or after the run |
| Commit of the scratch checkout | the same commit; it holds the guard with its self-test |
| Node | v24.21.0, first in `PATH` |
| Dependencies | none: the scratch checkout has no `node_modules`, and the guard imports Node built-ins only |
| Database, Docker | not used |

## How each verdict line was reached

| Verdict | From |
|---------|------|
| `FIXTURES_RED=seen` | Control 1. `--self-test` exits 0 and prints one line for each of the 16 fixture directories: the 15 seeded fixtures each show one finding, and `ok` shows none. The 10 finding kinds of the rule list all appear. |
| `SCRATCH_FROM_COMMIT` | The sha given to `git worktree add`. The scratch checkout's own `HEAD` printed the same sha. |
| `SCRATCH_HAS_CODE_UNDER_TEST=yes` | Inside the scratch checkout the guard file holds the self-test flag and `FROZEN_RULES`, and its fixture directory lists the same 16 names as the working tree's (`cmp` of the two listings). The unchanged scratch checkout was then run once and exited 0. |
| `SELF_TEST_CAN_FAIL_EXIT=1` | Control 2. With the `expected.violations` of `edited-file` emptied in the scratch checkout, the guard run with no argument exits 1 and prints the withheld-verdict line. The byte-parity result of that checkout is green (the run before it), so the status comes from the self-test alone. |
| `RULE_WITHOUT_FIXTURE_EXIT=1` | Control 3. With that file restored and the directory `version-gap` deleted in the scratch checkout, the guard run with no argument exits 1 and names the rule `version-contiguous`. |
| `CHECKER_SEES_AN_EDIT=seen` | Control 4. A copy of the working tree's `ok` fixture outside the repository gives no finding. After one byte (a space) is appended to its baseline file, the working tree's `checkFrozenMigrations` returns one finding, which begins `EDITED FROZEN MIGRATION`. |

## Notes on the record

- The controls were driven by one shell script that is not committed. It echoes each command on a line beginning `$` before running it. `<scratch>` stands for the scratch checkout and `<copy outside the repository>` (or `<copy>`) for the copied fixture; both were under the session's scratch directory, outside the repository.
- The echoed `git worktree add` line omits one flag: the command that ran was `git worktree add --quiet --detach <scratch> <sha>`.
- The real baseline was not edited by any control. The fixture edits were made in the scratch checkout and in the copy only, and the working tree had no tracked change after the run.
- The scratch checkout was removed with `git worktree remove --force`, and `git worktree list` no longer shows it.
- This is the second run of the script. The first, at 2026-10-12T17:52:16Z from commit `41c134015a0a2d5b576159493fc78c6221f8f67a`, gave the same four results. It is not the record because a display line of the script had a shell syntax error, and because the guard then printed two full stops at the end of a problem line; commit `c2691ac1d` corrects that, and the controls were run again from it.

## Raw output

```text
## environment
node v24.21.0
HEAD=c2691ac1d87b9af83d1c9e1d25a411c65c16644c
tracked changes: []

## control 1: FIXTURES_RED
$ node scripts/assert-schema-migration-parity.mjs --self-test
Schema-migration parity guard — the frozen-mode checker over scripts/fixtures/schema-migration-freeze:
  bad-baseline-commit: MALFORMED MANIFEST: manifest.json gives baseline.commit as "0123abc", which is not 40 lower-case hex characters.
  bad-name: BAD NAME: 20261012120000_add_note.sql is not five digits, an underscore, a name of lower-case letters, digits and underscores, and .sql; rename it to the next number, 00002_<name>.sql.
  baseline-not-first: BASELINE NOT FIRST: 00001_other.sql is the first entry of the manifest, and baseline.file is 00001_initial_schema.sql.
  baseline-without-table: EMPTY BASELINE: 00001_initial_schema.sql holds no line beginning `CREATE TABLE public.`.
  duplicate-version: DUPLICATE VERSION: 00002_b.sql has version 00002, which 00002_a.sql already has.
  edited-file: EDITED FROZEN MIGRATION: 00002_add_note.sql has sha256 b6222246466c4d60071a4a180b991a547822f8468677ecf9d0d30dda2f1f8522, and the manifest records 3753236d4331068b7ee8fb1209dcb2e0117a9397a742c09d1837a7005ef3f2e6.
  empty-baseline: EMPTY BASELINE: 00001_initial_schema.sql is zero bytes long.
  empty-migrations: MALFORMED MANIFEST: manifest.json does not give migrations as a non-empty array of objects with a string file and a string sha256.
  malformed-manifest: MALFORMED MANIFEST: manifest.json is not valid JSON.
  missing-baseline-member: MALFORMED MANIFEST: manifest.json has no string value for baseline.name.
  missing-file: MISSING MIGRATION: 00002_add_note.sql is listed in the manifest and is not a readable file in the migrations directory.
  missing-manifest: MALFORMED MANIFEST: manifest.json cannot be read (ENOENT).
  non-increasing-version: NON-INCREASING VERSION: 00002_b.sql has version 00002, lower than 00003_a.sql before it.
  ok: no finding
  unlisted-file: UNLISTED MIGRATION: 00002_add_note.sql is in the migrations directory and has no entry in the manifest; a new migration needs its line there.
  version-gap: VERSION GAP: 00003_add_note.sql has version 00003, and no entry has version 00002.
Schema-migration parity guard — frozen-mode self-test: 16 fixture(s) checked, each produced its committed findings; 15 rule(s), each with its fixture.
FIXTURES_RED_EXIT=0

## scratch checkout
$ git worktree add --detach <scratch> c2691ac1d87b9af83d1c9e1d25a411c65c16644c
WORKTREE_ADD_EXIT=0
SCRATCH_FROM_COMMIT=c2691ac1d87b9af83d1c9e1d25a411c65c16644c
scratch HEAD=c2691ac1d87b9af83d1c9e1d25a411c65c16644c
scratch has node_modules: no
scratch guard lines holding the self-test flag: 2
scratch guard lines holding FROZEN_RULES: 7
fixture names equal in the working tree and the scratch checkout: yes (16 names)
SCRATCH_HAS_CODE_UNDER_TEST=yes

## scratch checkout, unchanged (green control of the scratch run)
$ (cd <scratch> && node scripts/assert-schema-migration-parity.mjs)
Schema-migration parity guard (phase 156: REVIEW-DB-07) — census: 29 schema file(s) -> 7859 line(s); 00001_initial_schema.sql -> 7859 line(s); apps/supabase/supabase/migrations holds 1 .sql file(s); generated copy is current.
Schema-migration parity guard — frozen-mode self-test: 16 fixture(s) checked, each produced its committed findings; 15 rule(s), each with its fixture.
SCRATCH_UNCHANGED_EXIT=0

## control 2: SELF_TEST_CAN_FAIL
$ : > <scratch>/scripts/fixtures/schema-migration-freeze/edited-file/expected.violations
scratch tracked changes: [ M scripts/fixtures/schema-migration-freeze/edited-file/expected.violations]
$ (cd <scratch> && node scripts/assert-schema-migration-parity.mjs)
Schema-migration parity guard: self-test: edited-file: expected.violations holds 0 line(s), and a seeded fixture commits exactly one.
Schema-migration parity guard: self-test: edited-file: produced but not expected: EDITED FROZEN MIGRATION: 00002_add_note.sql has sha256 b6222246466c4d60071a4a180b991a547822f8468677ecf9d0d30dda2f1f8522, and the manifest records 3753236d4331068b7ee8fb1209dcb2e0117a9397a742c09d1837a7005ef3f2e6.
Schema-migration parity guard: the frozen-mode self-test did not match its committed fixtures under scripts/fixtures/schema-migration-freeze (printed above). A checker that has not been seen to fire has not been shown to check anything, so the verdict on apps/supabase/supabase/migrations is withheld.
SELF_TEST_CAN_FAIL_EXIT=1

## control 3: RULE_WITHOUT_FIXTURE
$ git -C <scratch> checkout -- scripts/fixtures/schema-migration-freeze/edited-file/expected.violations
scratch tracked changes after the restore: []
$ rm -r <scratch>/scripts/fixtures/schema-migration-freeze/version-gap
$ (cd <scratch> && node scripts/assert-schema-migration-parity.mjs)
Schema-migration parity guard: self-test: rule 'version-contiguous' names the fixture 'version-gap', and scripts/fixtures/schema-migration-freeze holds no such directory.
Schema-migration parity guard: the frozen-mode self-test did not match its committed fixtures under scripts/fixtures/schema-migration-freeze (printed above). A checker that has not been seen to fire has not been shown to check anything, so the verdict on apps/supabase/supabase/migrations is withheld.
RULE_WITHOUT_FIXTURE_EXIT=1

## control 4: CHECKER_SEES_AN_EDIT
$ cp -R <working tree>/scripts/fixtures/schema-migration-freeze/ok <copy outside the repository>
copy is inside the repository: no
$ checkFrozenMigrations over the copy, before the edit
[]
COPY_BEFORE_EDIT_EXIT=0
$ printf ' ' >> <copy>/migrations/00001_initial_schema.sql
$ checkFrozenMigrations over the copy, after the edit
EDITED FROZEN MIGRATION: 00001_initial_schema.sql has sha256 861469acc4f2c9c24b6fb71a7df41385b5e7b8535c7af396cdc5ca3ed7a3cf42, and the manifest records 801f6c998bcd49980dcf31067b2b18fd6775fdd2771ba28533bc5a56d9ce1b91.
CHECKER_SEES_AN_EDIT_EXIT=0
working tree fixture unchanged: []

## cleanup
$ git worktree remove --force <scratch>
WORKTREE_REMOVE_EXIT=0
worktrees whose path holds scratch-checkout: 0
tracked changes: []
HEAD=c2691ac1d87b9af83d1c9e1d25a411c65c16644c
```
