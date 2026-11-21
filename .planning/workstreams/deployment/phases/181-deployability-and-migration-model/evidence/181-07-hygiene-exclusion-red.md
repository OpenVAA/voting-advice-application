SCRATCH_FROM_COMMIT=6251aaa61a7a85909517d88a08455c0aa040cbc3
SCRATCH_HAS_CODE_UNDER_TEST=yes
FAIL_CLOSED_EXIT=1
EXCLUDED_FILE_NOT_REPORTED_EXIT=0
SAME_LINE_IN_SCHEMA_REPORTED_EXIT=1

# Red controls: the frozen-migrations exclusion of `scripts/assert-comment-hygiene.mjs`

Each status below is the exit status of the command itself. The command wrote its output to a file, the shell took the status, and the file was printed afterwards. None was read through a pipe.

## What was run on

| Item | Value |
|------|-------|
| Date | 2026-10-12T18:03:28Z |
| Commit of the working tree | `6251aaa61a7a85909517d88a08455c0aa040cbc3`, with no tracked change before or after the run |
| Commit of the scratch checkout | the same commit; it is the commit that adds `FROZEN_MIGRATIONS_PREFIX` to the guard |
| Node | v24.21.0, first in `PATH` |
| Dependencies | none: the scratch checkout has no `node_modules`, and the guard imports Node built-ins and `scripts/lib/comment-spans.mjs` only |
| Database, Docker | not used |

## How each verdict line was reached

| Verdict | From |
|---------|------|
| `SCRATCH_FROM_COMMIT` | The sha given to `git worktree add`. The scratch checkout's own `HEAD` printed the same sha. |
| `SCRATCH_HAS_CODE_UNDER_TEST=yes` | Inside the scratch checkout the guard file holds `FROZEN_MIGRATIONS_PREFIX` on four lines, the migrations directory holds one `.sql` file, and the unchanged guard was run once and exited 0 with `applied migrations excluded by prefix: 1` in its summary line. |
| `FAIL_CLOSED_EXIT=1` | Control 1. With the value of the constant changed to `apps/supabase/supabase/no-such-directory/` in the scratch checkout, a prefix no tracked file starts with, the guard exits 1. Its one error line names that prefix. The baseline is then scanned again (1972 files, where the unchanged run scanned 1971) and is clean, so the status comes from the fail-closed check alone. |
| `EXCLUDED_FILE_NOT_REPORTED_EXIT=0` | Control 2. With the guard restored, line 2 of `scripts/fixtures/assert-comment-hygiene.input.sql` was appended to the scratch copy of `apps/supabase/supabase/migrations/00001_initial_schema.sql`. That line breaks rule 1; the fixture's expected file lists it. The guard exits 0 and names no file under the migrations directory. |
| `SAME_LINE_IN_SCHEMA_REPORTED_EXIT=1` | Control 3. The same line was appended to the scratch copy of `apps/supabase/supabase/schema/400-storage.sql`, with the edit of control 2 still in place. The guard exits 1 and reports `apps/supabase/supabase/schema/400-storage.sql:906`. It still names no file under the migrations directory. |

## A supplementary run, not one of the three controls

Between controls 2 and 3 the guard of the parent commit (`6251aaa61~1`, which holds no `FROZEN_MIGRATIONS_PREFIX`) was written into the scratch checkout under another name and run over the same tree. It exits 1 and reports `apps/supabase/supabase/migrations/00001_initial_schema.sql:7860`. So the appended line is a violation in that file, and the 0 of control 2 comes from the exclusion and not from the line or the file. The key is `PARENT_GUARD_REPORTS_SAME_EDIT_STATUS`; its name does not end in `_EXIT`, so the record holds the three control lines the plan names and no fourth. The copy was deleted before control 3.

## Notes on the record

- The controls were driven by one shell script that is not committed. It echoes each command on a line beginning `$` before running it. `<scratch>` stands for the scratch checkout, which was under the session's scratch directory, outside the repository.
- The constant of control 1 was changed by a Node one-liner that replaces the whole declaration line and exits 3 unless that line is found exactly once. The line beginning `$` describes it in words; the two changed lines are printed from `git diff` under it.
- The real baseline and the real schema file were not edited by any control. Every edit was made in the scratch checkout, and the working tree had no tracked change after the run.
- Both files ended in a line feed before the append (last byte octal 012), so the appended text is a line of its own.
- The scratch checkout was removed with `git worktree remove --force`. `git worktree list` no longer shows it and its directory is gone.
- This is the only run of the script.
- The block below is the script's log copied byte for byte by the shell (`cmp` of the block and the log exits 0). The appended line holds a six-character escape, a backslash, the letter u and four hex digits, and the block shows it as those six characters.

## Raw output

```text
## environment
date 2026-10-12T18:03:28Z
node v24.21.0
HEAD=6251aaa61a7a85909517d88a08455c0aa040cbc3
tracked changes: []

## scratch checkout
$ git worktree add --quiet --detach <scratch> 6251aaa61a7a85909517d88a08455c0aa040cbc3
WORKTREE_ADD_EXIT=0
SCRATCH_FROM_COMMIT=6251aaa61a7a85909517d88a08455c0aa040cbc3
scratch HEAD=6251aaa61a7a85909517d88a08455c0aa040cbc3
scratch has node_modules: no
scratch guard lines holding FROZEN_MIGRATIONS_PREFIX: 4
scratch guard, the constant: const FROZEN_MIGRATIONS_PREFIX = 'apps/supabase/supabase/migrations/';
scratch .sql files under apps/supabase/supabase/migrations: 1 (00001_initial_schema.sql)

## scratch checkout, unchanged (green control of the scratch run)
$ (cd <scratch> && node scripts/assert-comment-hygiene.mjs)
Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1971; vendored files excluded by name: 2 (apps/frontend/static/fonts/inter.css, apps/docs/src/lib/layouts/prism-vs.css); applied migrations excluded by prefix: 1 (apps/supabase/supabase/migrations/); rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break). 0 violation(s).
SCRATCH_UNCHANGED_EXIT=0
SCRATCH_HAS_CODE_UNDER_TEST=yes

## control 1: FAIL_CLOSED
$ in <scratch>/scripts/assert-comment-hygiene.mjs, the value of FROZEN_MIGRATIONS_PREFIX is changed to 'apps/supabase/supabase/no-such-directory/'
CONSTANT_EDIT_EXIT=0
scratch tracked changes: [ M scripts/assert-comment-hygiene.mjs]
scratch diff of the guard, changed lines only:
-const FROZEN_MIGRATIONS_PREFIX = 'apps/supabase/supabase/migrations/';
+const FROZEN_MIGRATIONS_PREFIX = 'apps/supabase/supabase/no-such-directory/';
scratch files that start with the changed prefix: 0
$ (cd <scratch> && node scripts/assert-comment-hygiene.mjs)
[ERROR] scripts/assert-comment-hygiene.mjs: the frozen-migrations prefix 'apps/supabase/supabase/no-such-directory/' matches no tracked, scannable file under apps, packages, tests. An exclusion that excuses nothing is a hole nobody can see — correct the prefix, or delete the constant with its filter and its summary clause.
Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1972; vendored files excluded by name: 2 (apps/frontend/static/fonts/inter.css, apps/docs/src/lib/layouts/prism-vs.css); applied migrations excluded by prefix: 0 (apps/supabase/supabase/no-such-directory/); rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break). 1 violation(s).
FAIL_CLOSED_EXIT=1
output lines that name the changed prefix: 1

## control 2: EXCLUDED_FILE_NOT_REPORTED
$ git -C <scratch> checkout -- scripts/assert-comment-hygiene.mjs
scratch tracked changes after the restore: []
the line, line 2 of scripts/fixtures/assert-comment-hygiene.input.sql (reported there as a rule-1 violation):
  -- POSITIVE (rule 1): a literal escape \u2013 inside a SQL line comment.
expected findings of that fixture that name line 2: 1
last byte of the scratch baseline before the append (octal): 012
$ printf '%s\n' "<the line>" >> <scratch>/apps/supabase/supabase/migrations/00001_initial_schema.sql
scratch tracked changes: [ M apps/supabase/supabase/migrations/00001_initial_schema.sql]
last line of the scratch baseline: -- POSITIVE (rule 1): a literal escape \u2013 inside a SQL line comment.
$ (cd <scratch> && node scripts/assert-comment-hygiene.mjs)
Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1971; vendored files excluded by name: 2 (apps/frontend/static/fonts/inter.css, apps/docs/src/lib/layouts/prism-vs.css); applied migrations excluded by prefix: 1 (apps/supabase/supabase/migrations/); rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break). 0 violation(s).
EXCLUDED_FILE_NOT_REPORTED_EXIT=0
output lines that name a file under apps/supabase/supabase/migrations/ with a line number: 0

## supplementary: the guard of the parent commit over the same scratch tree
$ git show 6251aaa61a7a85909517d88a08455c0aa040cbc3~1:scripts/assert-comment-hygiene.mjs > <scratch>/scripts/parent-guard.mjs
parent guard lines holding FROZEN_MIGRATIONS_PREFIX: 0
$ (cd <scratch> && node scripts/parent-guard.mjs)
[ERROR] scripts/assert-comment-hygiene.mjs: apps/supabase/supabase/migrations/00001_initial_schema.sql:7860: rule 1 (D-A5) — the literal escape '\u2013' appears inside a comment. Write the character it encodes instead. Comment: "POSITIVE (rule 1): a literal escape \u2013 inside a SQL line comment."
Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1972; vendored files excluded by name: 2 (apps/frontend/static/fonts/inter.css, apps/docs/src/lib/layouts/prism-vs.css); rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break). 1 violation(s).
PARENT_GUARD_REPORTS_SAME_EDIT_STATUS=1
output lines that name a file under apps/supabase/supabase/migrations/ with a line number: 1

## control 3: SAME_LINE_IN_SCHEMA_REPORTED
last byte of the scratch apps/supabase/supabase/schema/400-storage.sql before the append (octal): 012
$ printf '%s\n' "<the line>" >> <scratch>/apps/supabase/supabase/schema/400-storage.sql
scratch tracked changes: [ M apps/supabase/supabase/migrations/00001_initial_schema.sql; M apps/supabase/supabase/schema/400-storage.sql;]
$ (cd <scratch> && node scripts/assert-comment-hygiene.mjs)
[ERROR] scripts/assert-comment-hygiene.mjs: apps/supabase/supabase/schema/400-storage.sql:906: rule 1 (D-A5) — the literal escape '\u2013' appears inside a comment. Write the character it encodes instead. Comment: "POSITIVE (rule 1): a literal escape \u2013 inside a SQL line comment."
Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 1971; vendored files excluded by name: 2 (apps/frontend/static/fonts/inter.css, apps/docs/src/lib/layouts/prism-vs.css); applied migrations excluded by prefix: 1 (apps/supabase/supabase/migrations/); rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break). 1 violation(s).
SAME_LINE_IN_SCHEMA_REPORTED_EXIT=1
output lines that name apps/supabase/supabase/schema/400-storage.sql with a line number: 1
output lines that name a file under apps/supabase/supabase/migrations/ with a line number: 0

## cleanup
$ git worktree remove --force <scratch>
WORKTREE_REMOVE_EXIT=0
worktrees whose path is the scratch directory: 0
scratch directory exists: no
tracked changes: []
HEAD=6251aaa61a7a85909517d88a08455c0aa040cbc3
```
