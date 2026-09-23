---
phase: 156-supabase-schema-corrections-naming-constraints-grants
plan: 03
subsystem: supabase-pgtap
tags: [pgtap, fixtures, rename, rls, test-discovery, coverage-gap]
status: complete

requires:
  - phase: 156-02
    provides: "user_role_type's second label is 'organization' in both SQL copies and in the rebuilt catalogue — the valid label the fixture INSERT now coerces to"
  - phase: 156-01
    provides: "scripts/assert-schema-migration-parity.mjs as lint:check link 12"
provides:
  - "a green pgTAP suite: npx supabase test db exits 0 at Files=11, Tests=277 — WINDOWS 182's stated fix condition, met"
  - "05-organization-admin.test.sql, renamed from 05-party-admin.test.sql with the 05- ordering prefix and git rename history intact"
  - "the pgTAP fixture key organization_a, and a JWT claim payload carrying role/scope_type 'organization'"
  - "a MEASURED coverage gap for a later plan: the has_role('organization','organization',...) RLS disjunct has ZERO discriminating coverage in the suite (see § The finding)"
affects:
  - 156-04 (dev-seed + frontend — the remaining REVIEW-DB-01 clauses)
  - 156-07 (raises 09-column-restrictions.test.sql's plan count; that file's two lives_ok assertions are measured here as vacuous)
  - "any future plan that adds role-scope assertions — § The finding names the two masking disjuncts to defeat"

tech-stack:
  added: []
  patterns:
    - "split a rename into a pure git-mv commit plus a content commit when the combined similarity would fall under git's 50% rename-detection threshold; the combined form measured 49% and git recorded it as delete-plus-add"
    - "flip-test a fixture key AND the claim payload independently — a green suite proves neither is load-bearing unless each is separately broken and observed to go red"

key-files:
  created:
    - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
  modified:
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
  deleted:
    - apps/supabase/supabase/tests/database/05-party-admin.test.sql

key-decisions:
  - "E2E DECLINED, with a proof rather than an appeal to 156-02. The whole diff is 4 files under tests/database/; a repo-wide search over sql/ts/js/mjs/json/yaml/yml/toml across apps, packages, tests, .github and scripts found NO reference to those files outside that directory, and config.toml's db.seed.sql_paths is ['./seed.sql'] only. The pgTAP tree is reachable solely via `npx supabase test db`; no dev server, migration or seed loads it. It cannot reach the application."
  - "The rename was committed as two commits (pure git mv, then content). Committed as one, similarity measured 49% -- one point under git's 50% default -- and git log --follow / git blame did not cross it. Restructured while the branch was still local and unpushed; the resulting tree is byte-identical (tree 49fd82d3…) to the single-commit version it replaced."
  - "NO assertion added, despite finding a real coverage gap. The plan's prohibition makes the 269 planned-literal total the suite's only silent-skip detector, and an unplanned addition would destroy that signal. The gap is reported for the operator, not closed here."
  - "The scope_type column of the user_roles INSERT block was re-aligned (13 -> 16 chars), re-padding 7 rows that carry no renamed token, because 'organization', is 15 chars and overflowed the old column."

patterns-established:
  - "What caught 156-02's rename was Postgres's enum type check on an INSERT, not any assertion. Measured: with the claim payload reverted to the retired label, all 14 role-scope assertions still pass."

requirements-completed: []

metrics:
  duration: ~85 min
  completed: 2026-08-30

actuals:
  tokens: 6269
  tasks: 3
  commits: 3
---

# Phase 156 Plan 03: pgTAP Fixture Vocabulary Summary

**The pgTAP suite is green — `npx supabase test db` exits 0 at `Files=11, Tests=277`, from a clean `db:reset-with-data` — and the rename that made it red is closed by moving vocabulary, with not one assertion deleted, weakened or renumbered.**

---

## The question you asked me to answer plainly

> **Does `npx supabase test db` exit 0, and with how many assertions actually run?**

**Yes — exit 0. `Files=11, Tests=277`. Zero `not ok`, zero `Bad plan`, zero "planned N but ran 0".**

277 is the count of assertions **actually executed**, taken from the harness's own `Tests=` field, not from a `plan()` literal and not from the absence of failures.

**I pre-registered 277 before running it.** Your baseline said 275 at 156-01, and the plan's acceptance gate said 269. Both are right and they measure different things:

| Quantity | Value | What it is |
|---|---|---|
| Sum of `plan(N)` literals | **269** | The ten *planned* files. The plan's gate. |
| `00-helpers.test.sql` smoke assertions | **+8** | It declares `no_plan()`, so it contributes nothing to the literal sum but does run 8 assertions (`1..8`). |
| **Executed total** | **277** | What `Tests=` reports. |

The same arithmetic reconciles your 275: at 156-01 the literal sum was **267** (I measured it from history, not from the briefing), and 267 + 8 = 275. 156-02 then added 2 (`aa04b8df6`, the two `enum_has_labels` assertions), giving 269 + 8 = **277**. So the executed total rose by exactly the two assertions 156-02 stated it was adding, and by nothing else.

---

## Both halves of the gate, measured on this machine

I did not take the pre-fix red on report. I restored the 156-02 test tree (`git checkout 06caee596 -- tests/database/`, plus removing the renamed file so the file *set* was identical — verified by diffing the two file lists), ran the suite, then restored and verified the tree hash matched `HEAD` and `git status --porcelain` was empty.

| | Before (tree at `06caee596`) | After (tree at `774e300a3`) |
|---|---|---|
| exit code | **1** | **0** |
| harness line | `Files=11, Tests=1` | `Files=11, Tests=277` |
| result | `Result: FAIL` | `Result: PASS` |
| `invalid input value for enum user_role_type: "party"` | **11 occurrences** | 0 |
| files reporting `planned N but ran 0` | **10** | 0 |

**`Tests=1` is the number that matters in the "before" column.** The pre-fix suite executed exactly **one** assertion out of 277 — `ok 1 - pgTAP loaded successfully`, the only one that precedes `create_test_data()`. That is your "a gate that examines nothing" hazard in its literal form, and it is why the fix had to be measured by executed count rather than by exit code.

### The failing set matched 156-02's named list exactly

156-02 recorded: *"All 11 files fail. `Files=11, Tests=1`. All 11 fail with the identical error, at the identical origin."*

Measured independently: all 11 files, `Files=11, Tests=1`, 11 identical enum errors. **No surplus failure** — nothing outside the fixture fan-out, so nothing to diagnose as a regression from 156-02's rename.

---

## Final per-file `plan(N)` distribution

Byte-identical to the 156-02 baseline. I compared every literal against `git show 06caee596:<file>`, not against the plan's prose.

| File | `plan(N)` |
|---|---|
| `00-helpers.test.sql` | *(none — `no_plan()`, runs 8)* |
| `01-tenant-isolation.test.sql` | 26 |
| `02-candidate-self-edit.test.sql` | 15 |
| `03-anon-read.test.sql` | 59 |
| `04-admin-crud.test.sql` | 30 |
| `05-organization-admin.test.sql` | 14 |
| `06-storage-rls.test.sql` | 15 |
| `07-rpc-security.test.sql` | 9 |
| `08-triggers.test.sql` | 16 |
| `09-column-restrictions.test.sql` | 15 |
| `10-schema-migrations.test.sql` | 70 |
| **Sum** | **269** |

11 files, lexical order intact, `00-helpers.test.sql` still first and the renamed file still in the `05` slot.

All 14 `ok` lines of the renamed file were captured individually via `psql` (`ok 1 … ok 14`, `finish()` returning no diagnostic rows), not inferred from the harness's per-file `ok`.

---

## THE FINDING — a real, pre-existing coverage gap

**The `has_role('organization','organization',…)` disjunct — the RLS predicate this entire phase is renaming, and the reason the role-scope test file exists — has ZERO discriminating coverage in the pgTAP suite.**

I found this by flip-testing, and it falsifies half of the plan's own must-have truth. I am reporting it, not fixing it.

### How I found it

Two independent flip-tests, both piped straight to `psql` so the working tree was never touched:

| Flip | Mutation | Expected | **Measured** |
|---|---|---|---|
| **A** (T-156-12) | fixture key in `05` → a key `00-helpers` does not define | red | **red** — `not ok 4 … actually changed data`, 1 of 14 failed |
| **B** (T-156-11) | claim payload in `00-helpers` → `'role','party'`, `'scope_type','party'` | red | **GREEN — all 14 pass** |
| Control | unmodified | green | green, 0 `not ok` |

Flip B is the finding. I confirmed the mutation actually landed (lines 184–185 carrying `'party'`) before trusting the green.

### The mechanism, measured not inferred

Running as the simulated organization admin **with the claim carrying the retired label**:

| Probe | Value |
|---|---|
| `has_role('organization','organization', org_a)` | **`f`** |
| `organizations.auth_user_id = auth.uid()` | **`t`** |
| `org_a.published` | **`t`** |
| published candidates in `org_a` | **2 of 2** |

The fixture sets `organizations.auth_user_id = test_user_id('organization_a')`, so the **ownership disjunct** satisfies both `authenticated_select_organizations` and `organization_update_own_organizations` on its own; `published = true` covers the SELECT policies independently. Every one of the 14 assertions is satisfied without `has_role` ever mattering.

### `09-column-restrictions.test.sql` is blind to *both*

Flipped the same two ways: **neither** mutation makes it fail. Breaking the fixture key to an undefined key leaves it fully green. The reason is assertion shape, not disjuncts:

- **Section 3** — four `throws_ok(…, '42501')`. Column-level GRANT denial fires at the *privilege* layer for the `authenticated` database role, before any row matching. Identity-independent; passes with a NULL `auth.uid()`.
- **Section 4** — two `lives_ok(…)`. These assert only *"no error was raised"*. An `UPDATE` that matches **zero** rows raises no error. Unlike `05`'s `ok 3`/`ok 4` pair, there is **no read-back assertion** confirming the update took effect, so a totally unauthorised session passes both.

### Consequences you should weigh

1. **The plan's must-have truth #3 is half false.** *"The JWT-claim fixture builds a claim payload carrying the new role and scope labels"* — **true, verified**. *"…so the role-simulated assertions exercise the renamed vocabulary rather than a stale one"* — **false, measured**. They do not.
2. **What caught 156-02's rename was Postgres's enum type check on the `user_roles` INSERT — a type error — not any assertion.** Had 156-03 put the *wrong* label in the claim payload while keeping the INSERT valid, the suite would have gone green and said nothing. The red you saw was the type system doing the test suite's job.
3. **Threat T-156-11's mitigation does not hold as written.** The claim payload is correct, but the suite cannot detect it being wrong.
4. **It is pre-existing, not introduced here.** The masking fixture line (`organizations.auth_user_id`) dates to `11f877913`, the original Supabase commit. The identical masking existed pre-rename with `has_role('party','party',…)`.

### Why I did not fix it — this needs your judgement

Closing it means **adding** assertions (e.g. a second organization whose `auth_user_id` is NULL and which is `published = false`, reachable *only* via `has_role`; and read-back assertions after `09`'s two `lives_ok`). That raises the total above 269.

The plan's prohibition is explicit that the 269 total is *"the only detector this project has for a test file that stopped being discovered"* and that a total moving *"for any reason other than a deliberate, stated addition destroys that signal."* An unplanned addition here would have been me quietly moving the very number the plan uses to catch me. **Banked for you.** Recorded in `.planning/WINDOWS.md` as a new `unmet-truth` entry so it survives to the ship gate; I did **not** touch entry 182.

---

## What changed

| # | Commit | What |
|---|---|---|
| 1 | `420749575` | `00-helpers.test.sql` — the fixture layer |
| 2 | `de8d05bfa` | pure `git mv`, zero content change |
| 3 | `774e300a3` | in-file vocabulary of `05` and `09` |

`4 files changed, 231 insertions(+), 231 deletions(-)`.

### Measured site counts — the plan's numbers were stale throughout

Per your standing finding that `156-PATTERNS.md`'s line map is stale, I navigated by symbol and counted rather than trusting the plan.

| File | Plan said | **Measured** |
|---|---|---|
| `00-helpers.test.sql` | 8 lines, **five** key sites | 8 lines / 11 occurrences, **SIX** key sites |
| `05-…-admin.test.sql` | 44 | **47 lines / 65 occurrences** |
| `09-column-restrictions.test.sql` | 4 | **12 lines** (4 fixture-key + 8 description/prose) |

**The sixth key site the plan did not enumerate** is the `organizations` INSERT row, `auth_user_id = test_user_id('party_a')`. It is the same line that turns out to mask the whole `has_role` disjunct — had I renamed only the plan's five, `test_user_id` would have returned NULL there and `05`'s `ok 4` would have failed.

Every plan line number I checked was wrong: legend `:42`→**30**, `test_user_id` arm `:89`→**77**, claim arm `:194`→**182**, auth row `:291`→**274**, roles row `:312`→**295**, org row →**325**.

### Header rewrite

`05`'s header cited **`010-rls.sql`**, a file that no longer exists — corrected to `302-rls.sql`. The four `has_role` signatures are now quoted verbatim from the policy bodies and the policy names are cited. The old header also **omitted the `can_access_project` disjunct** from both SELECT predicates; it is now stated. The house `Depends on: 00-helpers.test.sql` line is preserved. D-N1 respected: source files only, no phase numbers, planning paths or decision ids.

### Nothing referenced the old filename

Repo-wide search outside `.git`/`.planning`: **zero** hits. No CI workflow, README or config. The `.planning/` hits are historical records of the pre-rename state and correctly remain.

---

## Deviations

**1. [Rule 1] Acceptance criterion in Task 1 is self-contradictory; verified by intent instead.**
The criterion expects `'organization',` + **9 spaces** + `'organization'`. That is exactly the artefact of a naive substitution with **no** re-alignment — but the same task's action text instructs *"re-align the affected row's columns."* The two cannot both hold: `'organization',` is 15 chars, and 15 + 9 = 24, whereas the block's role column is measured at width **17**.
*Flip-tested:* a hand-built line padded to 24 does match the literal, confirming the criterion encodes an arbitrary width. I followed the action text (minimal consistent re-alignment: role column stays 17, scope column widens 13 → 16) and verified the criterion's stated **intent** — *"both the role and the scope literal moved on the same row"* — with an anchored equivalent that returns 1.

**2. [Rule 3] The rename was committed twice.** Combined rename-plus-content measured **49%** similarity, one point under git's 50% default, so git recorded delete-plus-add and `--follow` did not cross it. Split into a pure `git mv` (100%) plus content. Proof it changed nothing: the final tree is `49fd82d3ad07ef8810ab232333981a1ce77ad0c8`, **byte-identical** to the single commit it replaced. `git log --follow` now reaches back through `575de28f0` to `11f877913`. Done while the branch was local and unpushed (no upstream configured).

**3. [Rule 2] Seven un-renamed rows re-padded.** `'organization',` (15) overflows the `scope_type` column's width of 13, so the column widened to 16 and the other 7 role rows plus the `organizations` NULL row re-padded. 16 changed lines in `00-helpers.test.sql`: 8 carrying the retired label, 8 alignment-only.

**4. Worktree HEAD assertion not applied as written.** This checkout is itself a linked worktree of the main repo (pre-existing `-gsd` setup, `core.hooksPath=/dev/null`), on your directed `integration/ship-12-squash`. The executor's per-commit guard expects an `agent-*` branch and would have blocked every commit. The deny-list half passes — the branch is not `main`/`master`/`develop`/`trunk`/`release/*`.

---

## Gates

| Gate | Result |
|---|---|
| `npx supabase test db` | **exit 0 — `Files=11, Tests=277`, `Result: PASS`** |
| `yarn db:reset-with-data` | exit 0, **752 rows** (baseline) |
| `yarn assert:schema-migration-parity` | **exit 0**; census 24 schema files → 3279/3271 lines, 4 hunks, 11 signature lines — matches baseline exactly |
| `yarn lint:check` | **exit 0 at 12 links**, asserted by name and counted (`LINK COUNT: 12`) |
| `yarn lint:check` **forced** | **exit 0 at `0 cached, 11 total` and `0 cached, 22 total`** — a real green, not a cache replay |
| `npx prettier --check .` | exit 0 |
| comment-hygiene | 1584 files scanned, 0 violations (baseline) |
| `test:e2e` | **declined with proof** — see key-decisions |

Exit codes captured directly, never through a pipe (this shell is zsh; `${PIPESTATUS[0]}` returned empty and was discarded).

**The parity fixture was not touched** — still at `cee2084b6`, unmodified vs `HEAD`. A tests-only diff produces no parity hunks, so an edit would have been a change made to quiet a gate.

`git status --porcelain`: **0 entries**. Working tree and index both match `HEAD`.

---

## For you

- **WINDOWS 182** — its stated fix condition (*"becomes fixed when 156-03 lands and `npx supabase test db` exits 0"*) is met: exit 0, 277 assertions executed. **I did not mark it fixed**, as instructed.
- **`.planning/STATE.md`** — untouched, as instructed. It needs: current plan 3 → 4, phase 156 progress 3/10.
- **Unresolved, needs your judgement:** whether the `has_role` coverage gap becomes a new plan in 156, a deferred item, or a decision to accept. I have not chosen for you.
- The database is left freshly reset with seed data (752 rows) and the suite green against it. No dev server was started; `:5173` untouched.
