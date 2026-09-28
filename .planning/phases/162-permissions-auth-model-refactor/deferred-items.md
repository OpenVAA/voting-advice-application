
## From 162-04 (task 5, `yarn db:lint:sql`)

Two Splinter-derived advisor WARNINGs on the applied database. Both are
pre-existing and on join tables 162-04 does not touch — out of scope under the
executor scope boundary, recorded rather than fixed:

- `constituency_group_constituencies.constituency_id` — foreign key without an
  index (constraint `constituency_group_constituencies_constituency_id_fkey`).
- `election_constituency_groups.constituency_group_id` — foreign key without an
  index (constraint `election_constituency_groups_constituency_group_id_fkey`).

`yarn db:lint:sql` exits 0; the summary is `0 error(s), 2 warning(s)`.

## From 162-04 (task 6, documentation drift)

- `.claude/skills/database/` still states "97 RLS policies", "24 schema files" and "11 pgTAP files /
  264 assertions". After 162-04 the measured figures are **99 policies / 25 schema files / 13 pgTAP
  files / 446 assertions**. Not corrected in 162-04 because its scope gate asserts only the seven
  declared paths changed; belongs to 162-16/17's documentation close.

## From 162-04 (ledger)

- `.planning/WINDOWS.md` could not be appended to: `gsd-tools windows append` reports that the
  rendered table's header or separator row disagrees with the fenced JSON entries, with no data row
  differing. Pre-existing; 162-04 never touched the file. Repair the header before `/gsd-ship`,
  which reads that ledger. Never hand-edit the rendered table — edit the fenced JSON or let
  gsd-tools regenerate it.

## From 162-05 (task 6)

- The two `db:lint:sql` FK-without-index WARNINGs recorded above are **still open and still
  pre-existing**: `git diff --numstat` against 162-05's base SHA `55e92aeed` reports zero changed
  lines in `200-indexes.sql`. Re-confirmed, not re-filed.
- `.claude/skills/database/` documentation drift (recorded by 162-04) has moved again. After 162-05
  the measured figures are **99 policies / 25 schema files / 14 pgTAP files / 770 assertions**.
  162-05's scope gate asserts only its five declared paths changed, so the correction still belongs
  to 162-16/17's documentation close — but the number to correct it to has changed twice now, so
  that plan should re-derive it rather than copy either figure.

## From 162-06 (task 6)

- The two `db:lint:sql` FK-without-index WARNINGs are **still open and still pre-existing**: `yarn
  db:lint:sql` exits 0 with 0 errors and those same 2 warnings, and `git diff --name-only` against
  162-06's base SHA `535ffc838` lists no file under `apps/supabase/supabase/schema/` other than
  `300-auth-tables.sql` and `301-auth-functions.sql`. Re-confirmed, not re-filed.
- `.claude/skills/database/` documentation drift has moved a third time. After 162-06 the measured
  figures are **99 policies / 25 schema files / 15 pgTAP files / 602 assertions**. The assertion
  total went DOWN, because `13-shim-parity.test.sql` lost the 197-assertion differential and the
  18-cell legacy equality whose second authority model this plan deleted. 162-16/17 must re-derive
  rather than copy any of the three figures on record.
- `tests/tests/setup/admin/admin-auth.setup.ts` still describes the E2E admin identity in the
  retired vocabulary (a `user_roles` row projected into a `user_roles` claim). The file is outside
  this plan's declared file list and its scope gate asserts that list exactly, so the prose was not
  corrected here. Filed to `.planning/WINDOWS.md` as well, so it is visible at ship time.
- **Three of `entityGrant.ts`'s four entity-type branches have no caller** — only its own test. This
  is the accepted cost of A-10 option (A), ratified by the operator, and it closes when brief § 6.1
  adds the second call site. Recorded as a stated residual rather than a defect.

## From 162-07 (task 6)

- **`set -e` is INERT in the GSD Bash harness.** It runs zsh 5.9 through `eval`, where `ERR_EXIT` does not
  abort on a failing simple command — measured directly (`set -e; false; echo REACHED` prints `REACHED`).
  D-34's phase measurement counts `<automated>` blocks "without `set -e`" as the risk population; in this
  harness the blocks *with* it are equally unguarded. **Every remaining plan in 162 must use explicit
  `|| { echo …; exit 1; }`.** Two zsh expansion traps fall out of the same root and appear verbatim in the
  unexecuted plans: `"$BASE:path"` applies zsh's `:a` modifier (use `"${BASE}:path"`), and `"$VAR[^class]"`
  is read as an array subscript (use `"${VAR}[^class]"`).
- The two `db:lint:sql` FK-without-index WARNINGs are **still open and still pre-existing**, for the third
  consecutive plan: `yarn db:lint:sql` exits 0 with 0 errors and the same 2 warnings, on
  `constituency_group_constituencies.constituency_id` and `election_constituency_groups.constituency_group_id`.
  Neither table is touched by 162-07. Re-confirmed, not re-filed.
- **`public.factions` is empty after every built-in template.** No template in the repository creates a
  faction row, so any later plan that floors a four-entity-table census above zero will halt against a
  correct tree. 162-08's anon-policy work in particular will have **no faction row to observe**, in either
  direction, on a locally rebuilt database. Whether that is a gap worth closing with a seeded faction is a
  decision this plan did not have the scope to take.
- **`.claude/skills/database/` documentation drift moves again.** After 162-07 the measured figures are
  **99 policies / 25 schema files / 16 pgTAP files / 634 assertions**. 162-16/17 must re-derive rather than
  copy. The `election_type` lines in `schema-reference.md` were corrected by this plan.
- **The column-grant gap on `factions` and `alliances` is now a standing assertion, not just a note.**
  15-visibility-flags.test.sql derives the non-admin UPDATE policy set on those two tables from
  `pg_policies` and asserts it empty over a floored population, so the gap reddens if it ever opens.
  162-13 still owns closing it structurally.
- **`packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts` was edited despite its BYTE-FROZEN
  header**, because the retired value it carried would have made it unseedable against the new enum. The
  `election_type` key was removed rather than re-valued. Recorded here so a future reader of that header
  finds the reason rather than an unexplained diff.
- **`test_user_roles()` DOES NOT EXIST, and four documents still instruct a future author to call it.**
  Found by 162-16 while re-deriving the surviving `user_roles` population; **out of 162-16's class and left
  unfixed** (its Q3 file set is scoped to the retired publication column, not to 162-15's rename). 162-15
  renamed the helper to `test_user_grants()`; `00-helpers.test.sql` defines thirteen helpers and
  `test_user_roles` is not among them. Stale call sites, all prescriptive:
  `.claude/skills/database/extension-patterns.md:139,145,175,179` (its "Adding pgTAP Tests" guide tells the
  reader to write `set_test_user('authenticated', test_user_id('admin_a'), test_user_roles('admin_a'))`,
  which raises "function does not exist") and `.claude/skills/database/SKILL.md:310,311,315`. This is the
  same trace class M13 and T-162-16-05 name — a document no test reads, teaching the next agent a retired
  mechanism — with a different subject, so it needs the same treatment from the plan that owns the
  `user_roles` document sweep.
- **The `user_roles` document residue measured at 162-16 close: 16 files name the term, 14 of them
  pre-existing.** Classified in `162-16-SUMMARY.md`. The genuinely stale ones are all in
  `.claude/skills/database/`: `SKILL.md` (the JWT-claims section and the helper-function section),
  `rls-policy-map.md` (a table row, two footnotes and a two-policy block for a table that no longer exists)
  and `schema-reference.md` (a table entry, an index entry and the access-token-hook description). The other
  twelve are deliberate: live absence assertions, the retired-shaped-token negative controls in two frontend
  tests, two historical docstrings, and 162-16's own header comment recording that
  `300-auth-tables.sql`'s filename is older than its subject.
- **`.claude/skills/database/rls-policy-map.md` carries 12 occurrences of the retired publication column**,
  deliberately unswept by 162-16 under ratified C-10 (`q3-prescriptive-only`). Handed to the phase-closing
  plan as a figure. Its stated policy total (97) is also stale: the measured estate is **102** policies in
  schemas `public` and `storage`.
