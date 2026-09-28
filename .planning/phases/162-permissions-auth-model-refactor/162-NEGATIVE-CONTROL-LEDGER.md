# Phase 162 — Negative-Control Ledger: every guard this phase shipped, and which of them was observed failing

**Eighty-five rows, five instruments, one machine — and not one borrowed observation anywhere in the
register.** A row whose run did not execute keeps its placeholder cells and carries **no** outcome —
never a confirmed one — because a measurement that did not run counts as a failure, not a pass
(`CLAUDE.md` § E2E Hard Rule, generalised).

- **Phase:** 162 (permissions-auth-model-refactor)
- **Requirement:** **PRESHIP-02**
- **Opened by:** `162-17-PLAN.md` Task 1 (wave 6), **before this plan's first measurement**, on an
  untouched tree. The collected rows are entered here at opening; this plan's own rows are entered
  with placeholder cells and filled by the task that measures them.
- **Corpus:** exactly **85** rows — **65 collected** from the seventeen sibling SUMMARYs and from
  D-36's revert record, plus **20 measured in this plan** (`C0`…`C5`, `M1`…`M3`, `K1`…`K3`,
  `S1`…`S3`, `F1`, `F2`, `G8A`, `G8B`, `Z1`).
  **Schema choice, locked: the half-row schema** — one row per measured half, never a pair per row.
  144's ledger states the same choice at its own `§ Corpus` and 143's at its `:984-992`; the
  alternative (pair-per-row) would have compressed the 65 collected halves into fewer rows and made
  an UNRESOLVED half indistinguishable from a measured one, which is the single property this
  register exists to keep visible.
- **Instruments (five):** `psql` (raw TAP, per file), pgTAP through `supabase test db`,
  `node apps/supabase/scripts/lint-schema.mjs`, `vitest`, and the E2E wrapper
  `tests/scripts/e2e-run.sh`.
- **Baseline for collected halves:** none inherited, none inheritable. **The past participle of "to
  cite" is not a legal value in an outcome cell.** A collected row cites the sibling SUMMARY it came
  from AND the log path that SUMMARY recorded; a collected row whose cited log path does not resolve
  on this machine is carried as **UNRESOLVED** and carries **no outcome**.
- **Run date:** 2026-09-17.
- **HEAD at ledger creation:** `d1bd80a8ba97e924f357aae82d74c66a0e075526` — branch `integration/ship-12-squash`.
- **Machine:** developer Mac, host Node, runs issued from the worktree root
  `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd`. Darwin 25.5.0, local
  Supabase on 54321–54324, Postgres on 54322.
- **Resolved `$TMPDIR`:** `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T` — so every `${TMPDIR:-/tmp}/162-17/…` log reference
  below resolves to `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/…`. Recorded because **a log path that cannot be
  resolved later is not evidence.**

### Restoration blob hashes — the pre-change state of every file this plan edits

Taken with `git hash-object` at ledger creation, at HEAD `d1bd80a8ba97e924f357aae82d74c66a0e075526`, before any control existed.
Paths in this plan's `files_modified` that do not yet exist are created by it and have no pre-change
blob.

| Path | `git hash-object` at ledger creation |
|---|---|
| `apps/supabase/scripts/lint-schema.mjs` | `006691b44dfcc0baa390705df6fa35b95e27fce7` |
| `.claude/skills/database/rls-policy-map.md` | `82c1da7779d611ebf6b5508706c1972a3945c782` |
| `.claude/skills/database/SKILL.md` | `87b43819909afa009c3c5c2de8268affd596c168` |
| `.claude/skills/database/schema-reference.md` | `e870033ed23900b3b34dec34def56040e1771177` |
| `.claude/skills/database/extension-patterns.md` | `948a9faae20ce541289cd2428b389cdca2736f6f` |
| `.planning/phases/162-permissions-auth-model-refactor/162-PATTERNS.md` | `2fd49725651fb93318613d19c39db46fa865a941` |

**Created by this plan, no pre-change blob:** the four pgTAP files at ordinals 25–28, the three
`flowConformance.test.ts` gates, `162-FLOW-CONFORMANCE.md` and this file.

**Decisions discharged by this ledger:** **D-03** (the storage census, corrected), **D-12a** (the
requested-parent branch and its admin queue), **D-12c** (the nomination uniqueness key), **D-20**
(`invite-candidate` in scope, and its entity-type margin note), **D-22** (entity-type selection at the
identity entry point, deferred), **D-24** (`UNIQUE NULLS NOT DISTINCT` as a phase-wide rule), **D-25**
(the five-module claim-reader census), **D-27** (the two-mechanism storage partition), and
additionally **D-30** (the two matrix gaps closed by operator disposition), **D-36** (the reverted
composition and the eight-assembly guard it owes), **D-37** (count controls as `PLAN − PASSED`) and
**D-28** (the pgTAP ordinal registry).

---

## Measurement, never citation

Three properties of the **register** — not of the phase — are asserted at Task 8:

1. No row carries an outcome it did not measure.
2. Every `UNRESOLVED` collected row carries no outcome.
3. Every restoration hash taken at Task 1 either still matches, or is accompanied by the task that
   changed it.

**Why most collected rows are UNRESOLVED, stated plainly rather than smoothed over.** The sibling
SUMMARYs recorded their reddened counts in prose and in tables; with the single exception of the E2E
run directory, **none recorded a log path for the control run itself**. Under this register's own
rule that makes the row UNRESOLVED — the count is visible, the evidence is not re-openable on this
machine, and the outcome cell stays empty. That is the honest reading, and it is also a finding about
the phase's recording habit rather than about any one plan.

---

## Row register

| Row | Source / instrument | Control | Command | HEAD | Exit | Outcome | Log path | Resolves |
|---|---|---|---|---|---|---|---|---|
| X01 | 162-02b-SUMMARY.md | ordinal-census changed tables | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X02 | 162-02b-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-02b` | RESOLVES |
| X03 | 162-03-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-03` | RESOLVES |
| X04 | 162-04-SUMMARY.md | E2E phase gate 155/0/0 | (collected — see source SUMMARY) | (as recorded by the source) | — | passed=155 failed=0 dnr=0 | `tests/e2e-runs/162-04-wave1` | RESOLVES |
| X05 | 162-05-SUMMARY.md | Task 3 can_access_project probe -> project.edit_app_settings | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X06 | 162-05-SUMMARY.md | Task 3 can_access_project probe -> project.read_structure | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X07 | 162-05-SUMMARY.md | Task 4 has_role returning false unconditionally | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X08 | 162-05-SUMMARY.md | Task 4 has_role returning true unconditionally | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X09 | 162-05-SUMMARY.md | Task 5 organization-branch mistranslation | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X10 | 162-05-SUMMARY.md | Task 5 can_access_project mistranslation | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X11 | 162-05-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-05-wave2` | RESOLVES |
| X12 | 162-06-SUMMARY.md | Task 3 hook emitting BOTH claim keys | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X13 | 162-06-SUMMARY.md | Task 3 role-only reader (option B, fail-open) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X14 | 162-06-SUMMARY.md | Task 3 reader accepting any grant regardless of shape | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X15 | 162-06-SUMMARY.md | Task 4 target_type mistranslation vs 14-grants-migration | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X16 | 162-06-SUMMARY.md | Task 4 same plant vs 13-shim-parity | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X17 | 162-06-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-06-wave2` | RESOLVES |
| X18 | 162-07-SUMMARY.md | Task 3 project flags, no creation path wired | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X19 | 162-07-SUMMARY.md | Task 4 four entity columns, no creation path wired | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X20 | 162-07-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-07-wave3` | RESOLVES |
| X21 | 162-07b-SUMMARY.md | Tracer allow half | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X22 | 162-07b-SUMMARY.md | Tracer deny half | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X23 | 162-07b-SUMMARY.md | Task 4 Test A / B / C negative half | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X24 | 162-07b-SUMMARY.md | Task 4 Test C positive half | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X25 | 162-07b-SUMMARY.md | Task 5 RES-7 standing guard | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X26 | 162-07b-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-07b-wave3` | RESOLVES |
| X27 | 162-08-SUMMARY.md | inline-subselects variant (VOID RUN: file ABORTS, 0 not-ok lines, 14 did-not-run) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X28 | 162-08-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-08-anon-visibility` | RESOLVES |
| X29 | 162-09-SUMMARY.md | write-verb substitution (every converted write answers the read permission) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X30 | 162-09-SUMMARY.md | pre-change predicates restored on three account/project policies | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X31 | 162-09-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-09-policies` | RESOLVES |
| X32 | 162-10-SUMMARY.md | unpublished candidate, no nomination (the control) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X33 | 162-10-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-10-entity-policies` | RESOLVES |
| X34 | 162-11-SUMMARY.md | Task 2b pre-change ON DELETE CASCADE | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X35 | 162-11-SUMMARY.md | app_settings UPDATE = true / false | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X36 | 162-11-SUMMARY.md | project.edit_app_settings -> project.edit_project_settings | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X37 | 162-11-SUMMARY.md | read predicates: authority only / disjunct only | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X38 | 162-11-SUMMARY.md | all thirteen write expressions = true / false | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X39 | 162-11-SUMMARY.md | feedback.read <-> feedback.manage exchanged | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X40 | 162-11-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-11-content-policies` | RESOLVES |
| X41 | 162-12-SUMMARY.md | creation path unwired (the plan's red-first control) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X42 | 162-12-SUMMARY.md | read predicate replaced by true | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X43 | 162-12-SUMMARY.md | project-agreement conjunct masking guard 1 (D-37 discovery: scored 0, broke 38 of 40) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X44 | 162-12-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-12-wave4` | RESOLVES |
| X45 | 162-13-SUMMARY.md | absolute-freeze variant (OLD.confirmed guard removed) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X46 | 162-13-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-13-entity-immutability` | RESOLVES |
| X47 | 162-14-SUMMARY.md | scope-variant (tracer) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X48 | 162-14-SUMMARY.md | deny-all-variant (tracer) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X49 | 162-14-SUMMARY.md | visibility-true-variant (anon grid) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X50 | 162-14-SUMMARY.md | visibility-false-variant (anon grid) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X51 | 162-14-SUMMARY.md | verb-ignoring-variant (paired grid) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X52 | 162-14-SUMMARY.md | wrong-scope-variant (paired grid) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X53 | 162-14-SUMMARY.md | deny-all-variant (paired grid) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X54 | 162-14-SUMMARY.md | E2E phase gate (wave 5) | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-14-wave5` | RESOLVES |
| X55 | 162-14-SUMMARY.md | E2E re-run 02 (outlier diagnosis) | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-14-wave5-run02` | RESOLVES |
| X56 | 162-14-SUMMARY.md | E2E recheck a11y / perm | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-14-recheck-a11y` | RESOLVES |
| X57 | 162-15-SUMMARY.md | instrument red-first control 1 (explicit failure, 01-tenant-isolation) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X58 | 162-15-SUMMARY.md | fail-open (every fixture identity collapsed to global-admin authority) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X59 | 162-15-SUMMARY.md | fail-closed (no fixture identity gets an authority row) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X60 | 162-15-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-15-wave6` | RESOLVES |
| X61 | 162-16-SUMMARY.md | measured absences (seed.sql occurrences, adapter selects) | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X62 | 162-16-SUMMARY.md | D1 identity instrument repaired before it was believed | (collected — see source SUMMARY) | (as recorded by the source) | — | — no outcome (UNRESOLVED) — | `(no log path recorded)` | UNRESOLVED |
| X63 | 162-16-SUMMARY.md | E2E phase gate | (collected — see source SUMMARY) | (as recorded by the source) | — | (recorded in SUMMARY) | `tests/e2e-runs/162-16-published-removal` | RESOLVES |
| X64 | D-36 revert (162-CONTEXT.md) | single-policy drop of open_for_voters (anon_select_factions) | (collected — see source SUMMARY) | (as recorded by the source) | — | estate exit 1, names it | `tests/e2e-runs/d36-revert-01` | RESOLVES |
| X65 | D-36 revert (162-CONTEXT.md) | drop confirmed from all four authenticated assemblies | (collected — see source SUMMARY) | (as recorded by the source) | — | estate PASSES exit 0, all 923 green — THE LIVE GAP | `tests/e2e-runs/d36-revert-01` | RESOLVES |
| C0 | `lint-schema.mjs` (this plan) | apparatus: untouched `yarn db:reset` estate | `node apps/supabase/scripts/lint-schema.mjs` on a `yarn db:reset` estate | `0eb38cf33` | 0 | **GREEN** — census printed: policies examined **102**, tables partitioned **19**, permission members **23** (floor source: 29 row-level-security tables) | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/guard-c0.log` | RESOLVES |
| C1 | `lint-schema.mjs` (this plan) | intersecting collapse: a write policy repointed at the read permission on a table whose read predicate carries a public disjunct; **string comparison** run alongside | `psql -f controls/C1.sql` (ALTER POLICY admin_update_questions -> project.read_structure) then the guard | `0eb38cf33` | 1 | **RED**, naming it: *public.questions: read and write permission sets intersect on 'project.read_structure'*. **String comparison: GREEN** — its verdict is byte-identical to the untouched baseline (only the pre-existing ratified admin_jobs pair), so it found **no new collapse**. This is the measurement F2(a)(b)'s simpler form would have passed. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/guard-C1.log` | RESOLVES |
| C2 | `lint-schema.mjs` (this plan) | third-shared-predicate collapse: both predicates routed through a wrapper reaching no permission literal; **string comparison** run alongside | `psql -f controls/C2.sql` (a wrapper calling user_can internally; both elections policies repointed at it with different arguments) then the guard | `0eb38cf33` | 1 | **RED**, naming both: *public.elections: policy admin_update_elections [UPDATE] / authenticated_select_elections [SELECT] reaches neither a permission literal nor a named mechanism helper*. **String comparison: GREEN** — verdict byte-identical to the untouched baseline, **no new collapse found**. The third-shared-predicate collapse, caught. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/guard-C2.log` | RESOLVES |
| C3 | `lint-schema.mjs` (this plan) | identical-predicate collapse: a read and a write policy given the same `qual` | `psql -f controls/C3.sql` (authenticated_select_elections given a write predicate) then the guard | `0eb38cf33` | 1 | **RED** under the identical-predicate clause, naming both pairs (authenticated_select_elections = admin_update_elections, and = admin_delete_elections) and additionally the intersection on project.edit_structure. The one case the string comparison also catches — and it did. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/guard-C3.log` | RESOLVES |
| C4 | `lint-schema.mjs` (this plan) | broken exemption: a visibility helper on the exemption list renamed in the database | `psql -f controls/C4.sql` (ALTER FUNCTION user_has_account_grant RENAME) then the guard | `0eb38cf33` | 1 | **RED**, naming the unresolvable exemption: *user_has_account_grant: exemption resolves to no function in pg_proc* — plus the consequential *public.accounts ... reaches neither*. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/guard-C4.log` | RESOLVES |
| C5 | `lint-schema.mjs` (this plan) | empty instrument: the census restricted to a schema holding no policies | `node controls/lint-schema-C5.mjs` — a scratch copy whose AUTHORITY_SCHEMAS names a schema holding no policies; no tracked file touched | `0eb38cf33` | 1 | **RED on the floor**: *0 policies examined is at or below the 29 row-level-security tables in public+storage*. The empty instrument cannot return a clean verdict. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/guard-C5.log` | RESOLVES |
| G8A | pgTAP (this plan) | D-36 eight-assembly guard, **relative** half: drop `project_open_for_voters` from ONE policy (`anon_select_factions`) | `psql -f controls/G8A.sql` (drop project_open_for_voters from anon_select_factions ALONE) then the whole estate | `298d949af` | 1 | **RED. Estate exit 1, reddened: 4** of 1010 declared. **2 of the 4 are this plan's new file** — assertion 34 (RELATIVE: the four anon assemblies are no longer identical) and assertion 38 (ABSOLUTE: not all eight call project_open_for_voters) — and it NAMES the divergence. The other 2 are 16-anon-visibility's, as D-36's revert recorded. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/G8A.log` | RESOLVES |
| G8B | pgTAP (this plan) | D-36 eight-assembly guard, **absolute** half: drop `confirmed` from ALL FOUR authenticated assemblies at once — the perturbation the pre-162-17 estate passed at exit 0 with all 923 green | `psql -f controls/G8B.sql` (drop `confirmed` from ALL FOUR authenticated assemblies at once) then the whole estate | `298d949af` | 1 | **RED — AND THIS IS THE LIVE GAP CLOSED. Estate exit 1, reddened: 2** of 1010 declared, and **both are this plan's new file**: assertion 37 (ABSOLUTE: all eight name the `confirmed` column) and assertion 36 (RELATIVE: each authenticated assembly carries its own table's anon assembly verbatim). D-36's executor measured this exact perturbation against the PRE-162-17 estate at **exit 0, all 923 assertions green**, while the authenticated no-grant visible set DOUBLED on every entity table. A guard comparing the eight only to each other would still pass it; the absolute half is what reddens. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/G8B.log` | RESOLVES |
| M1 | pgTAP (this plan) | matrix grid over-permissive: the matrix function answers true for every member | `psql -f controls/M1.sql` (user_can answers true for every member) then `psql -f 25-matrix-conformance.test.sql` | `298d949af` | 1 | **RED, reddened: 28** of 41 declared (passed 13). Counted as PLAN − PASSED per D-37, never by counting not-ok lines. It reddens the deny half in bulk. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/M1.log` | RESOLVES |
| M2 | pgTAP (this plan) | matrix grid over-strict: the matrix function answers false for every member | `psql -f controls/M2.sql` (user_can answers false for every member) then the grid file | `298d949af` | 1 | **RED, reddened: 27** of 41 declared (passed 14), PLAN − PASSED. It reddens the allow half in bulk. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/M2.log` | RESOLVES |
| M3 | pgTAP (this plan) | the closed-project precondition's own control: the grid's project opened for voters | `psql -f controls/M3-file.sql` — a scratch copy of the grid file whose precondition OPENS the project; no tracked file touched | `298d949af` | 1 | **RED, flipped: 4** of 41 declared (passed 37), PLAN − PASSED. All four are the disjunctive-read vectors: with the project open the public disjunct admits callers holding no authority at all, and the four entity visibility vectors change. This is the measurement proving the closed-project precondition load-bearing rather than decorative. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/M3.log` | RESOLVES |
| K1 | pgTAP (this plan) | the nomination key replaced by a plain `UNIQUE` over the same columns | `psql -f controls/K1.sql` (the nomination key replaced by a PLAIN UNIQUE over the same columns) then `psql -f 26-uniqueness-keys.test.sql` | `1f6bdfe02` | 1 | **RED, reddened: 7** of 31 declared (passed 24), PLAN − PASSED. Every REJECTION assertion falls, including all three NULL-parent cases and the shape assertion. This is the measurement showing the NULLS clause is what does the work rather than the column list. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/K1.log` | RESOLVES |
| K2 | pgTAP (this plan) | the parent column dropped from the nomination key | `psql -f controls/K2.sql` (the parent column dropped from the key, NULLS clause intact) then the keys file | `1f6bdfe02` | 1 | **RED, reddened: 6** of 31 declared (passed 25), PLAN − PASSED, and the six are EXCLUSIVELY the ADMITTING assertions plus the two shape assertions — not one rejection moved. That is exactly the regression section 11.7 says a rejection-only suite would miss. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/K2.log` | RESOLVES |
| K3 | pgTAP (this plan) | the requested-parent key renamed in the fixture row | `psql -f controls/K3-file.sql` — a scratch copy of the queue file whose FIXTURE ROW carries a renamed requested-parent key while every query still asks for the original; no tracked file touched | `1f6bdfe02` | 1 | **RED, reddened: 3** of 15 declared (passed 12), PLAN − PASSED: the presence assertion, the queue assertion and the candidate confirmation refusal. The queue is shown to key off THE NAME and not off some other property of the row. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/K3.log` | RESOLVES |
| S1 | pgTAP (this plan) | storage policies that ignore the verb argument and ask the read permission for writes | `psql -f controls/S1.sql` (storage_path_can accepts the verb argument and DISCARDS it -- every call asks the READ permission) then `psql -f 28-storage-table-parity.test.sql` | `2755d9877` | 1 | **RED, reddened: 1** of 21 declared (passed 20), PLAN − PASSED: the PROJECT-scope read-but-not-write refusal. That single assertion is exactly the one written to catch a discarded verb, and it did. The eight pairing arrays stay green here and that is recorded rather than smoothed over: for the four un-nominated entities the read and write permissions coincide for every identity, so a verb-blind policy moves both halves of every pair together — which is precisely why the separability identities exist beside the grid. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/S1.log` | RESOLVES |
| S2 | pgTAP (this plan) | storage policies asking project scope where entity scope belongs | `psql -f controls/S2.sql` (storage_path_can asks PROJECT scope where ENTITY scope belongs) then the parity file | `2755d9877` | 1 | **RED, reddened: 4** of 21 declared (passed 17), PLAN − PASSED, and the four are the four ENTITY-EDITOR pairing arrays (Candidate, OrganizationEditor, FactionEditor, AllianceEditor) — the cross-entity half, named by identity. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/S2.log` | RESOLVES |
| S3 | pgTAP (this plan) | the tautological form: both halves of every pair replaced by an authority-predicate call, run under the S1 divergence | `psql -f controls/S3-file.sql` — a scratch copy in which BOTH halves of every pair are an authority-predicate call — run under the SAME S2 divergence; no tracked file touched | `2755d9877` | 0 | **GREEN, reddened: 0** of 21 declared, under the exact divergence the REAL form reddens 4 on. This is the evidence for the two-call prohibition, and it is a MEASUREMENT rather than an argument: a pair whose two halves call one function asserts that the function equals itself and cannot detect storage and tables disagreeing. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/S3.log` | RESOLVES |
| F1 | vitest (this plan) | each flow gate's derived permission vocabulary replaced by an empty set in a scratch copy | `vitest run --root apps/supabase/.m17-controls` — a scratch copy of the three gates whose derived vocabulary is reduced to ONE non-member; the tree was removed afterwards and git status verified clean | `64d2995c1` | 1 | **RED, reddened: 5** of 36 (passed 31), PLAN − PASSED: all three vocabulary-size assertions plus send-email's two membership assertions. The membership checks are NOT vacuous under an empty vocabulary. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/f1.log` | RESOLVES |
| F2 | vitest (this plan) | one module's scratch source given a permission literal that is not a member | `vitest run --root apps/supabase/.m17-controls` — send-email's scratch source given the literal project.edit_everything, which is not a member | `64d2995c1` | 1 | **RED, reddened: 2** of 36 (passed 34), PLAN − PASSED, and both NAME the literal. Widened the gates' own literal regex to accept digits while measuring this — the first attempt used a literal containing a digit and the gate did not see it, which is a defect this control found in the gate rather than in the module. | `/private/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/162-17/f2.log` | RESOLVES |
| Z1 | E2E wrapper (this plan) | the phase-closing full-suite run (not a control; the cardinal gate) | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/162-17-phase-close --no-db-reset` | TBD | TBD | TBD — placeholder, not measured | `tests/e2e-runs/162-17-phase-close` | RESOLVES |

## Completeness

| | |
|---|---|
| declared row count: | **85** |
| collected halves (sibling SUMMARYs + D-36's revert record) | 65 |
| halves measured in this plan | 20 |
| `UNRESOLVED` collected rows (carry no outcome) | 45 |
| `RESOLVES` rows | 40 |

The declared row count is **derived from the collected corpus plus this plan's own control set**, not
chosen. It is reconciled against the row register's table at Task 8; a disagreement is the single
defect this section exists to catch, and it is the one 143 and 144 each spent a record correction on.

---

## Task 2 — the ratified answers, by letter, and both allow-lists entry by entry

Answered 2026-09-16 by the operator in `162-CHECKPOINT-DECISIONS.md` § 1 items **S-5** and **S-3**
(with its NOTE) and § 8 item **C-11**, and folded in under D-29. Reproduced here because the guard's
exemption lists are a **security surface** and an entry approved without a written reason is not
approved.

**Q1 = (A)** — re-express the guard against the **permission literal**. F2(a)'s literal wording names
`can_edit_project`, which was never built (the phase replaced the split-predicate design with one
`user_can` carrying a 23-member verb), and `can_access_project`, which 162-15 deleted. Both halves of
its wording are therefore unsatisfiable, so the guard implements F2(a)'s **actual requirement** —
"fails if the two collapse back into one predicate" — against what the phase built. **D-27 is the
named precedent**: keep a ticked option's spirit when its literal wording is unreachable. Not (B),
whose green is uninformative because both collapses in the plan's own three-collapse table pass it;
not (C), which is F2(a)(b) and which its own text rejects.

| Collapse | A two-string comparison | This guard |
|---|---|---|
| both policies re-predicated onto one byte-identical expression | RED — catches it | RED |
| the write policy pointed at the read permission, on a table whose read predicate carries a public disjunct so the strings still differ | **GREEN — misses it** | RED, on set intersection |
| both predicates replaced by calls to a third wrapper reaching no permission literal, with different arguments | **GREEN — misses it** | RED, on the reaches-neither clause |

**Q2 = allow-lists approved, entry by entry.** Four lists, all **derived fresh** from
`collapse-baseline.txt`, `permission-census.txt` and the transitive-reach census — none carried
forward from the plan's illustrative entries. The full text with one reason per entry is at
`${TMPDIR}/162-17/allowlists.txt` and is reproduced in `162-17-SUMMARY.md`. Summary:

| List | Entries | Notable |
|---|---|---|
| 1 — same-permission (collapse) | **1 approved**: `public.admin_jobs` on `project.edit_questions` | `public.accounts` **NOT approved and removed** — its derived read set is empty |
| 2 — unenforced permissions | **6 approved** of 23 | each reason names where the member IS enforced (grant administration, or a trigger) |
| 3 — named mechanism helpers | **4 approved** | `project_open_for_voters`, `entity_has_confirmed_nomination`, `storage_path_is_public`, `user_has_account_grant` |
| 4 — reaches-neither policy exemptions | **8 approved** | 4 join-table delegations, 2 open feedback writes, 2 non-user-role policies on `public.grants` |

**Q3 = S-3 AMENDED — record ONE, close TWO.** Each disposition verified against the owning plan's
SUMMARY **before** it was written.

| Gap | Disposition | Verified against |
|---|---|---|
| account read | **CLOSED**, owned by 162-09 (`user_has_account_grant`) | `162-09-SUMMARY.md` lines 18, 33, 45, 102, 112–113, 312 — and by the derived collapse baseline, in which `accounts` does not intersect |
| `admin_jobs` | **RECORDED**, mapping `project.edit_questions`, owned by 162-11 | `162-11-SUMMARY.md` lines 18, 39, 82–95 (S-4, the one box the operator ticked) |
| bulk send | **CLOSED**, owned by 162-06 — the gate **was** written | `162-06-SUMMARY.md` lines 28, 79, 185 **and** `send-email/index.ts:116-134` in the tree |

**The enum was not widened.** S-3(A) stands: `pg_enum` reports **23** members for `grant_permission`
and there is no 24th. Nothing above contradicts 162-03's ratified vocabulary.

## Restoration-hash reconciliation, at close

Every hash taken at Task 1 either still matches, or is accompanied by the task that changed it.

| File | At ledger creation | At close | Changed by |
|---|---|---|---|
| `apps/supabase/scripts/lint-schema.mjs` | `006691b44dfcc0baa390705df6fa35b95e27fce7` | `45a17d20626e84649034d31b6bf99c2c336ed4c5` | Task 3 — check 9001 appended |
| `.claude/skills/database/rls-policy-map.md` | `82c1da7779d611ebf6b5508706c1972a3945c782` | `91142f1e513f0d0d323470b0e82f54111758055a` | Task 8 — the documentation sweep |
| `.claude/skills/database/SKILL.md` | `87b43819909afa009c3c5c2de8268affd596c168` | `d1bff4e923acacd97233e702915cb909e72b3080` | Task 8 — the documentation sweep |
| `.claude/skills/database/schema-reference.md` | `e870033ed23900b3b34dec34def56040e1771177` | `1b9963e7a0067bf1dc065b4c9f7ecd2b56b7b988` | Task 8 — the documentation sweep |
| `.claude/skills/database/extension-patterns.md` | `948a9faae20ce541289cd2428b389cdca2736f6f` | `7c0b9a3287ab34c0388d7a4ded8021b2ff858053` | Task 8 — the documentation sweep |
| `.planning/phases/162-permissions-auth-model-refactor/162-PATTERNS.md` | `2fd49725651fb93318613d19c39db46fa865a941` | `0c9f2ae5e5f2eaaf69a9fcfcf2a7980a6e412ae0` | Task 8 — § No Analog Found brought into agreement |

---

## Closing — what this register discharges, and what it deliberately does not claim

**Decisions discharged.** Each has at least one row above whose outcome was measured on this machine:

- **D-03** — the storage census, corrected. Rows `S1`–`S3`, plus `28-storage-table-parity.test.sql`'s own
  partition assertions: 15 total, 14 authority, 1 visibility-only, 0 neither.
- **D-12a** — the requested-parent branch and its admin queue. Row `K3`.
- **D-12c** — the nomination uniqueness key. Rows `K1` and `K2`; `K2`'s six are EXCLUSIVELY the
  ADMITTING assertions, which is § 11.7's own stated reason for asserting both directions.
- **D-20** — `invite-candidate` in scope, and its entity-type margin note. Rows `F1` and `F2`, plus the
  by-import assertions in `invite-candidate/flowConformance.test.ts`.
- **D-22** — entity-type selection at the identity entry point, DEFERRED and PINNED.
  `162-FLOW-CONFORMANCE.md` finding F-1, with a standing assertion that reddens when the gap closes.
- **D-24** — `UNIQUE NULLS NOT DISTINCT` as a phase-wide rule. Row `K1`, which reddens every rejection
  assertion when the clause is dropped while the column list is kept.
- **D-25** — the five-module claim-reader census. `162-FLOW-CONFORMANCE.md`'s census table and the
  `send-email` gate, which exists only because the brief's four would have omitted it.
- **D-27** — the two-mechanism storage partition. The derived 14 / 1 / 0 AGREES with it and with 162-14's
  corrected truth line; there is no discrepancy to report.
- **D-28** — the pgTAP ordinal registry. 24 was OCCUPIED; 25–28 were taken, above the registry maximum,
  with the correction recorded rather than a sibling's file overwritten.
- **D-30** — the two matrix gaps closed by operator disposition. `162-FLOW-CONFORMANCE.md` finding F-3
  (bulk send, CLOSED by 162-06), and the withdrawal of `accounts` from the collapse allow-list.
- **D-36** — the reverted composition and the eight-assembly guard it owes. Rows `G8A` and `G8B`. **`G8B`
  is the one that matters:** D-36's executor measured that exact perturbation against the pre-162-17
  estate at exit 0 with all 923 assertions green, and it now reddens 2.
- **D-37** — count controls as `PLAN − PASSED`. Every count in this register is taken that way, from raw
  TAP read per file through `psql`, never by counting `not ok` lines.

**The criterion each control belongs to:**

| Control | ROADMAP criterion |
|---|---|
| `C0`–`C5` | **2** — read separated from write, with a test that fails on re-collapse |
| `G8A`, `G8B` | **5** — read grants behave as documented (the eight visibility assemblies) |
| `M1`–`M3` | **1** and **4** — the matrix as the policies enforce it, and each settings branch |
| `K1`–`K3` | **1** — the `grants` table's keys; and §§ 11.5 / 11.7's two-directional obligations |
| `S1`–`S3` | **6** — the storage paired assertion |
| `F1`, `F2` | **7** — the two flows checked against the matrix |
| `Z1` | the phase gate |

**What this register does NOT claim.** Forty-five of its eighty-five rows are `UNRESOLVED`. Their counts
are visible and their sources are cited, but no log path for the control run itself was recorded by the
sibling that measured it, so the evidence is not re-openable on this machine and the outcome cell stays
empty. That is the honest reading of this phase's recording habit, and it is a finding about the habit
rather than about any one plan: **every sibling recorded its E2E run directory and none recorded a log
path for a planted control.** A future phase that wants collected halves to carry outcomes must require
the log path at the moment the control is run, not at the moment the register is opened.
