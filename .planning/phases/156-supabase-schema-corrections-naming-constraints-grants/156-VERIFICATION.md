---
phase: 156-supabase-schema-corrections-naming-constraints-grants
verified: 2026-08-30T11:43:57Z
status: passed
score: 8/8 roadmap success criteria verified (all by direct measurement against the running database and repo tree, not by trusting SUMMARY.md)
behavior_unverified: 0
overrides_applied: 0
re_verification: false
---

# Phase 156: Supabase Schema Corrections — naming, constraints, grants — Verification Report

**Phase Goal:** The schema says what it means: the names are right, the constraints exist, and no
role can edit a column it has no business editing.
**Verified:** 2026-08-30T11:43:57Z
**HEAD verified:** `4ee3a149c` (`docs(156): code review — 0 critical, 10 warning, 8 info`) — a
docs-only commit; the code state is identical to `ac49880f8`, the commit the phase's own E2E run
(150/0/0/0) was executed against (`git diff ac49880f8..HEAD -- . ':!.planning'` = 0 files).
**Re-verification:** No — initial verification.

**Method.** Every one of the 8 roadmap success criteria below was checked by running a command or
SQL probe against the live local database (`yarn db:reset-with-data`, `npx supabase test db` from
`apps/supabase`, direct `psql` probes with `SET LOCAL role authenticated` +
`request.jwt.claims`, a planted-drift test of the parity guard) rather than by reading SUMMARY.md
claims. Where a SUMMARY.md number is quoted below it is because I independently reproduced it.

---

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth (roadmap wording) | Status | Evidence |
|---|---|---|---|
| 1 | `party`→`organization` renamed throughout enums/schema/migrations/dev-seed; `db:reset-with-data` works end to end | ✓ VERIFIED | `yarn db:reset-with-data` ran green in 83.3s wall clock (752 rows seeded, 327 candidates / 8 organizations / 377 nominations). `grep -rin party apps/supabase/supabase/{schema,migrations}` = 0 hits. `grep -rin party packages/dev-seed/src` (excluding `templates/e2e/`) returns only legitimate seeded domain content ("Coastal Party" org display name, a generator name suffix, a portraits LICENSE mentioning "deploying party") — no code identifiers. `enum_range(NULL::user_role_type)` = `{candidate,organization,project_admin,account_admin,super_admin}` (5 labels, no alias). Parity guard (`scripts/assert-schema-migration-parity.mjs`) is wired as link 12/12 of `yarn lint:check` and passes; I planted a one-sided edit (appended a comment to `schema/000-enums.sql` only) and confirmed the guard goes **red** (exit 1, correct diagnostic), then reverted and confirmed **green** (exit 0) — the "demonstrated to FAIL" must-have from plan 01 is independently reproduced. |
| 2 | Auth-table role prefixes use an enum matching `user_role_type`; `301-auth-functions.sql` uses enums, not string comparison | ✓ VERIFIED | `\df public.has_role` shows one signature: `(user_role_type, role_scope_type DEFAULT NULL, uuid DEFAULT NULL)` — no `text`-typed overload exists. `301-auth-functions.sql` casts claim values up: `(role_entry->>'role')::public.user_role_type = p_check_role` and `(role_entry->>'scope_type')::public.role_scope_type = p_check_scope_type` throughout `has_role` and `can_access_project`. `role_scope_type` enum exists: `{candidate,organization,project,account,global}`. |
| 3 | `104-nominations.sql` carries the missing `>= 1` constraint, proven by a rejected insert | ✓ VERIFIED | Live insert of `election_round = 0` inside a rolled-back transaction: `ERROR: new row for relation "nominations" violates check constraint "nominations_election_round_check"`. `\d public.nominations` shows both `nominations_check` (the pre-existing entity-FK check) and `nominations_election_round_check` (`CHECK (election_round >= 1)`) as two independent constraints — plan 06's prohibition against conflating them is respected. |
| 4 | Image validation extracted into `is_image` utility with its own pgTAP coverage | ✓ VERIFIED | `public.is_image(jsonb) RETURNS boolean` and `public.validate_image(jsonb) RETURNS void` both exist as independently callable functions (`\df` confirms). `08-triggers.test.sql` references `is_image`/`validate_image` 33 times (one assertion per preserved error message plus predicate/signature checks). Full pgTAP suite green (below). |
| 5 | `303-column-grants.sql` no longer grants `authenticated` UPDATE on `sort_order`/`created_at`/`updated_at`; a PostgREST-shaped tamper is observed to fail | ✓ VERIFIED | `303-column-grants.sql` GRANT lists are 10 columns (candidates) / 8 columns (organizations), none of the three audit/ordering columns. `information_schema.column_privileges` confirms zero UPDATE grants to `authenticated` on those 3×2 combinations. **I independently ran all six live tamper attempts** (not the pgTAP suite's — my own, via `SET LOCAL role authenticated` + `SET LOCAL request.jwt.claims`, the same mechanism PostgREST uses per-request): `sort_order`/`created_at`/`updated_at` on both `candidates` and `organizations` all raised `SQLSTATE 42501` ("permission denied for table ..."). See note below on WR-01. |
| 6 | `503-entity-rpcs.sql:147` covers all answer-bearing entities; `504-admin-rpcs.sql:12` renamed or generalised, choice recorded | ✓ VERIFIED | `upsert_answers` writes `public.candidates` first, falls through to `public.organizations` only on no-match (the two answer-bearing tables — factions/alliances have no `answers` column, confirmed). `public.merge_question_custom_data` exists at `504-admin-rpcs.sql:11`; `merge_custom_data` (old name) has zero definitions in the catalogue — the one source-tree hit for the string is a deliberate `hasnt_function` negative assertion (`10-schema-migrations.test.sql:648`), not a leftover. Both adapter call sites (`supabaseAdminWriter.ts`, `supabaseDataWriter.ts`) use the new name. `156-DISPOSITIONS.md` Entry 6 records the rename-vs-generalise choice in full. See note below on WR-05. |
| 7 | `102-entities.sql:27` name/short_name conflict resolved: candidates lose the conflicting field, `short_name` stays as generated-initials override | ✓ VERIFIED | `102-entities.sql`: `candidates` has no `name` column (only `short_name`, `first_name`, `last_name`); `organizations` retains both `name` and `short_name`. Confirmed live via `\d public.candidates` / `\d public.organizations` after `db:reset-with-data`. `get_candidate_user_data` (`503-entity-rpcs.sql:114`) returns `NULL::jsonb` for `name` on the candidate branch, `o.name` on the organization branch — 15-column `RETURNS TABLE` unchanged. `get_nominations`'s `entity_name` COALESCE (`503-entity-rpcs.sql:60` and the `00002` migration twin at `:82`) drops the candidate term: `COALESCE(o.name, f.name, a.name)`. |
| 8 | Remaining record items dispositioned, not silently dropped (benchmarks→README+archive, lint-schema.mjs, config.toml ports, id-JSONB linkage, feedback IP) | ✓ VERIFIED | `156-DISPOSITIONS.md` carries exactly 6 numbered entries (benchmarks, lint-schema.mjs, ports, id-JSONB linkage, feedback IP, RPC choice) plus 3 lettered records — none absent, none duplicated. All 4 required `.planning/todos/pending/2026-08-28-*.md` files exist with proper frontmatter (`lint-schema-as-pgtap`, `id-jsonb-foreign-key-linkage`, `feedback-ip-salted-hash`, `fold-migrations-for-byte-parity`). `apps/supabase/benchmarks/` is removed; the archival SHA `714d1e1885b091af95b86d2b497b3e2bff76f031` was verified live with `git show 714d1e1885...:apps/supabase/benchmarks/README.md` — it returns the original file. `apps/supabase/README.md` documents all **10** `config.toml` ports (I independently counted 10 active `port =` / `*_port =` assignments in `config.toml`, matching the README's claim of ten, correcting the phase's own planning documents which said nine) and `config.toml:5` carries the pointer comment to the README. |

**Score:** 8/8 roadmap success criteria VERIFIED, all by direct measurement.

### Requirements Coverage

| Requirement | Source Plan(s) | Status | Evidence |
|---|---|---|---|
| REVIEW-DB-01 | 01, 02, 03, 04, 10 | ✓ SATISFIED | Criterion 1 above |
| REVIEW-DB-02 | 05, 10 | ✓ SATISFIED | Criterion 2 above |
| REVIEW-DB-03 | 06, 10 | ✓ SATISFIED | Criterion 3 above |
| REVIEW-DB-04 | 06, 10 | ✓ SATISFIED | Criterion 4 above |
| REVIEW-DB-05 | 07, 10 | ✓ SATISFIED | Criterion 5 above |
| REVIEW-DB-06 | 01, 08, 10 | ✓ SATISFIED | Criterion 6 above |
| REVIEW-DB-07 | 01, 10 | ✓ SATISFIED | Criterion 7 above |
| REVIEW-DB-08 | 09, 10 | ✓ SATISFIED | Criterion 8 above |

No orphaned requirements — `.planning/REQUIREMENTS.md` maps exactly REVIEW-DB-01..08 to Phase 156,
and every ID is claimed by at least one plan's `requirements:` frontmatter.

### Full Local Gate Chain (plan 10's must-have — re-run by the verifier, not read from SUMMARY.md)

| Gate | Command | Result |
|---|---|---|
| DB rebuild | `yarn db:reset-with-data` | Green, 83.3s wall clock, 752 rows |
| pgTAP (run from `apps/supabase`, per project measurement rules) | `npx supabase test db` | `Files=11, Tests=317, Result: PASS`, `not ok` count = 0 (conjunction confirmed, not read off `Tests=` alone) |
| Parity guard | `node scripts/assert-schema-migration-parity.mjs` | Exit 0; flip-tested red/green (see criterion 1) |
| `yarn lint:check` | full 12-link chain incl. `assert:schema-migration-parity` | Green — 22/22 turbo tasks successful |
| `yarn test:unit` | frontend + dev-seed workspaces | Green — frontend 54 files/816 tests, dev-seed 53 files/603 tests, 25/25 turbo tasks |
| `yarn db:lint:sql` | schema advisors | Exits 1 on 4 pre-existing plpgsql advisories (`is_localized_string`, `_bulk_upsert_record`, `resolve_email_variables` ×2) — per the measurement rules, this is **pre-existing** (WINDOWS 17/115/125), not scored against this phase. Confirmed the four warnings are exactly those four, unchanged. |
| E2E (Playwright) | not re-run | `git diff ac49880f8..HEAD -- . ':!.planning'` = 0 files — the tree tested at 150/0/0/0 is byte-identical to current HEAD outside `.planning/`. Re-running was correctly skipped per the measurement rules. |

### Data-Flow / Direct-Measurement Notes (beyond what SUMMARY.md claims)

- Criterion 5's denial proof was reproduced **independently of the pgTAP suite**: six live `SET LOCAL
  role authenticated` + `request.jwt.claims` UPDATE attempts (3 columns × 2 tables), each raising
  `SQLSTATE 42501`.
- Criterion 3's rejection was reproduced independently with a raw rolled-back INSERT.
- Criterion 1's parity guard was flip-tested (planted drift → red; reverted → green) rather than
  trusted from its own "matches" output.
- Criterion 8's archival SHA was flip-tested with a live `git show`, not assumed reachable.

---

## Known Issues — 156-REVIEW.md findings, unresolved at this HEAD (not blocking, but flagged)

`156-REVIEW.md` (produced this session, same HEAD, `status: issues`, 0 critical / 10 warning / 8
info) is part of this phase's own deliverables. **None of its findings have been fixed as of
`4ee3a149c`** — the commit that added the review is docs-only. None of the 10 warnings or 8 info
items causes any of the 8 roadmap success criteria above to fail (each criterion was independently
re-measured and holds), so this section does not change the `passed` status. It is included because
an adversarial verification must not let a fresh, un-triaged "issues" status quietly disappear
between phases — two of the ten warnings bear directly on criteria this report just marked VERIFIED,
and this report is transparent about the distinction the task asked for.

### WR-01 — the `updated_at` trigger-control pgTAP assertion is vacuous (bears on criterion 5)

`09-column-restrictions.test.sql:280` backdates `updated_at` to `'epoch'` **before** the permitted
UPDATE that is supposed to make the trigger's write observable — but that backdating UPDATE itself
fires `set_updated_at`, so the backdate never lands. **I reproduced this live**: a direct
`UPDATE candidates SET updated_at = 'epoch'::timestamptz` inside a transaction shows
`updated_at` is `now()` immediately afterward, not `'epoch'`. The assertion at `:298-301`
(`updated_at > 'epoch'`) is therefore true regardless of anything the test does.

**Per the task's framing, this is judged separately from criterion 5's core claim**, and I did:
criterion 5's actual roadmap wording ("no longer grants ... a PostgREST-shaped attempt ... is
observed to fail") is about the **revoke and its denial proof**, which I reproduced live and is
sound (above). The **trigger-still-fires control** is a *plan-07 must-have add-on*
(`REVIEW-DB-05 / empty`), not the roadmap criterion itself, and — separately from the vacuous pgTAP
assertion — **I independently confirmed the underlying property is true**: with the trigger
disabled, backdated, re-enabled, then a permitted self-edit made as `authenticated` with no
privilege on `updated_at`, the column still advanced to `now()`. So the truth this must-have states
holds; what's broken is the *suite's own proof of it*, which is a real regression-coverage hole
(if a future change breaks the trigger-vs-grants interaction, `09-column-restrictions.test.sql`
will not catch it) — recommend fixing per REVIEW.md's suggested `ALTER TABLE ... DISABLE/ENABLE
TRIGGER` fix before this file is touched again.

### WR-05 — the widened `upsert_answers` organization branch is unreachable from the frontend (bears on criteria 6)

`supabaseDataWriter.ts:258` hard-rejects every entity type but `Candidate` before `upsert_answers`
is ever called, so the new organization branch (added by plan 08) has no production consumer today.
Roadmap criterion 6 is worded at the RPC/SQL level ("`503-entity-rpcs.sql:147` covers all entities
carrying answers") and is satisfied there — the SQL genuinely writes both tables. But
`156-DISPOSITIONS.md` Entry 6's stated rationale for the rename-vs-generalise asymmetry
("`upsert_answers` generalises because a second real consumer exists — organizations answer
questions in this product") asserts a fact the current tree contradicts: that consumer does not
exist in code yet. This doesn't fail criterion 6, but the disposition record should be corrected to
say the consumer is *planned* rather than *existing*, or the frontend guard should be lifted, before
Phase 157 (which touches this exact adapter boundary) reads Entry 6 as settled fact.

### Other open findings (WR-02, WR-03, WR-04, WR-06, WR-07, WR-08, WR-09, WR-10, IN-01..IN-08)

Read in full in `156-REVIEW.md`. None were re-litigated as new gaps here because none affects a
roadmap success criterion; summarized for traceability: a stale "nothing verifies parity" claim
still in `apps/supabase/README.md:23` (WR-02, directly contradicted by criterion-1's own shipped
gate); a missing `hasnt_function` proof that no `has_role(text,text,uuid)` overload survives
(WR-03 — I confirmed live via `\df` that only the enum-typed overload currently exists, so this is
a missing regression guard, not a live defect); `upsert_answers`'s candidates-first/no-double-write
invariant is documented but not mechanically enforced (WR-04); the repo's own `.claude/skills/database/`
docs still teach the retired `party` vocabulary in a security-relevant direction (WR-06 — a real
CLAUDE.md checklist item, "documentation is updated where changes touch it", left unmet); a stale
`Depends on:` header sweep that stopped short of 4 files (WR-08); `is_image`'s broad `WHEN others`
catch and its lack of a production caller (WR-09); the parity guard's own header not yet
documenting its `00002`/`00003` blind spot (WR-10); plus 8 lower-severity info items.

**Recommendation to the developer (escalation, not a blocker):** file `156-REVIEW.md`'s open items
as a short follow-up plan or as `.planning/todos/pending/` entries before Phase 157 begins, since
157 touches the exact adapter files WR-05 and IN-04 concern and 158+ will keep compounding on top of
the `.claude/skills/database/` docs WR-06 flags as already wrong.

---

## Already-on-the-Ledger (not re-scored, per task instructions)

WINDOWS 183 (has_role organization/organization RLS disjunct has zero discriminating pgTAP
coverage), 184/186 (pgTAP-from-root NOTESTS / `Tests=` is the planned count, not proof of a run —
mitigated in this report by running pgTAP from `apps/supabase` and asserting the PASS+Files+Tests+`not
ok`=0 conjunction), 185 (Deno JWT claims typed as raw `string`), 187 (merge precedence proven by
measurement only), 188 (RPC rename invalidated `157-12-PLAN.md` / `161-04-PLAN.md` grep criteria),
190 (`db:lint:sql` never reaches `lint:schema` via the documented command — reproduced above, exits
1 on 4 pre-existing advisories).

---

## Anti-Pattern Scan

No `TBD`/`FIXME`/`XXX` debt markers in any file touched by this phase
(`git diff 0dce31a1bb2762caef072b8c1b5624563be3b5d8..HEAD -- . ':!.planning'` file set scanned).
Two pre-existing `TODO` comments were found in touched files
(`supabaseAdminWriter.ts:14`, `supabaseDataWriter.ts:365`) — both confirmed present at the phase's
diff base already, not introduced by this phase. No empty-implementation or hardcoded-empty-data
stub patterns found in the SQL or TypeScript files this phase modifies; every artifact traced above
resolves to real schema objects and real grant/constraint definitions in the live database.

## Human Verification Required

None. Every roadmap success criterion was directly, independently measured against the running
database or repository tree in this session — no item required visual, real-time, or otherwise
non-programmatic judgment.

---

_Verified: 2026-08-30T11:43:57Z_
_Verifier: Claude (gsd-verifier)_
