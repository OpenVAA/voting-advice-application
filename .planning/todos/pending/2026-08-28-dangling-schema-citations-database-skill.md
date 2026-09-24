---
created: '2026-09-13T00:00:00.000Z'
title: The database skill's schema reference announces a completeness it does not have
area: docs
files:
  - .claude/skills/database/schema-reference.md
  - .claude/skills/database/SKILL.md
  - apps/supabase/supabase/schema/
resolves_phase: null
related_phase: 160
---

## Problem

**The premise this todo was planned on is false, and that is recorded first so the next reader does
not go looking for a defect that no longer exists.** Phase 160's research measured 15 distinct
retired schema filenames cited in 51 places across four files of the `database` skill, after the
schema was renumbered from a three-digit `0NN-` scheme to a banded one. Re-measured at
`e8052177c` on 2026-09-13:

```bash
grep -rhoE '[0-9]{3}[a-z0-9_-]*\.sql' .claude/skills/database/ | sort -u
ls apps/supabase/supabase/schema/*.sql
```

**19 distinct three-digit `.sql` names are cited; all 19 exist** in
`apps/supabase/supabase/schema/`. Phase 156's rename landed and the citations were repaired by hand
before this phase reached them. **There is no retired-to-live mapping to carry, because the retired
set is empty.** That is the good news and also the reason this class needs a guard rather than
another sweep: it was repaired only because a human went looking.

What *is* live is the same defect one level up — a listing that asserts its own completeness.

### 1. `.claude/skills/database/schema-reference.md:3` claims 17 tables from 18 files; there are 20 from 25

The line reads:

> Complete column listing for all 17 tables in the OpenVAA Supabase schema. Source:
> `apps/supabase/supabase/schema/` (18 SQL files).

Measured at `e8052177c`:

```bash
# live tables
grep -rhiE 'CREATE TABLE' apps/supabase/supabase/schema/*.sql | wc -l      # -> 20
ls apps/supabase/supabase/schema/*.sql | wc -l                             # -> 25
# tables the reference documents (its own `**name** (file.sql)` row form)
grep -oE '^\*\*[a-z_]+\*\* \(' .claude/skills/database/schema-reference.md | sort -u | wc -l   # -> 17
```

The `sort -u` in the third command is load-bearing, not tidiness: without it the count is **18**,
because `.claude/skills/database/schema-reference.md:239` opens an index row with the same
`**user_roles** (300-auth-tables.sql)` prefix as the table heading at `:185`. A census that reports
18 has counted an index line as a table.

**Three tables have no entry at all:**

| Table                  | Declared in                                     | Note                    |
| ---------------------- | ----------------------------------------------- | ----------------------- |
| `feedback`             | `apps/supabase/supabase/schema/107-feedback.sql` | public schema           |
| `feedback_rate_limits` | `apps/supabase/supabase/schema/107-feedback.sql` | `private` schema        |
| `admin_jobs`           | `apps/supabase/supabase/schema/108-admin-jobs.sql` | public schema         |

No documented table is absent from the live schema, so the listing is incomplete rather than wrong —
which is the worse failure mode of the two. The word **"Complete"** is the defect: a reader who
needs `admin_jobs` reads a sentence promising that every table is present, finds no entry, and
concludes the table does not exist. A listing with no completeness claim would have cost that reader
one `ls`.

The file-count half (`18 SQL files` against a live 25) is stale in the same way and from the same
cause — the banded renumbering split files that the sentence was written before.

### 2. One package-relative citation in the skill file

`.claude/skills/database/SKILL.md:31` cites `migrations/00001_initial_schema.sql`. The file exists,
at `apps/supabase/supabase/migrations/00001_initial_schema.sql`, but the citation as written
resolves for no reader and no tool — it is the corpus's package-relative habit, the residue
`.claude/scripts/audit-skill-links.sh` reports and deliberately does not forgive.

## Solution

1. Author the three missing table entries in `.claude/skills/database/schema-reference.md`, in the
   file's existing `**name** (file.sql)` + column-bullet form, reading the columns from
   `apps/supabase/supabase/schema/107-feedback.sql` and `108-admin-jobs.sql`.
2. Re-derive both numerals in the header sentence with the census commands above, and keep the word
   "Complete" only if the census supports it.
3. Make `.claude/skills/database/SKILL.md:31`'s citation repo-relative, and confirm with
   `bash .claude/scripts/audit-skill-links.sh database`.

## Why this is filed rather than fixed

`.claude/skills/database/schema-reference.md` and `.claude/skills/database/SKILL.md` are outside the
`files_modified` surface of every plan in Phase 160 — the phase touches
`.claude/skills/database/extension-patterns.md` only. Authoring three table column listings from the
schema is real work, not a one-line correction, and doing it inside a plan that does not own the
file would land it unreviewed against that plan's own criteria.

## Owner

`resolves_phase: null`. Phase 156, the schema phase, is the owner the original filing named — but
156 completed on 2026-08-30, and so have the other candidates in this milestone. There is no
scheduled slot left to name, and naming a completed phase would make this read as work that is
coming when it is not. It belongs to whoever next owns the `database` skill.

## Related

Phase 160 plan 03 recorded this same incident as the live rationale for the "re-check the skill
afterwards" note it added to all four `extension-patterns.md` files: a skill contains listings, and
a listing goes stale silently. This todo is that note's first outstanding instance.
