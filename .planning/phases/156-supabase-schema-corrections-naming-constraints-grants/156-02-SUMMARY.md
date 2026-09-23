---
phase: 156-supabase-schema-corrections-naming-constraints-grants
plan: 02
subsystem: supabase-schema
tags: [schema, migrations, enum, rls, pgtap, rename, generated-types]
status: complete

requires:
  - phase: 156-01
    provides: "scripts/assert-schema-migration-parity.mjs as lint:check link 12, with its reviewed golden signature — the gate that proves both SQL copies moved together"
provides:
  - "public.user_role_type reads 'candidate', 'organization', 'project_admin', 'account_admin', 'super_admin' in the live database rebuilt from migrations/ — five labels, no alias"
  - "RLS policy party_update_own_organizations renamed to organization_update_own_organizations; the four has_role() call sites moved with it"
  - "the pgTAP suite's first two enum_has_labels assertions, pinning user_role_type and entity_type side by side"
  - "packages/supabase-types/src/database.ts regenerated from the rebuilt database"
  - "a named target list for plan 03: the one fixture line the whole pgTAP fan-out traces to"
affects:
  - 156-03 (pgTAP fixtures — currently red by design, see § pgTAP)
  - 156-04 (dev-seed + frontend — carries the remaining REVIEW-DB-01 clauses)
  - 156-05 (scope_type enum — its files_modified overlap 300-auth-tables.sql and 301-auth-functions.sql, both edited here)

tech-stack:
  added: []
  patterns:
    - "enum_has_labels as a schema/-only-edit detector: it reads the label list out of the rebuilt catalogue, not out of a file, so a schema/ edit that never reaches a database fails instead of passing silently"
    - "flip-testing a new assertion against both the retired vocabulary and the right-labels-wrong-order case before trusting its green"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/schema/000-enums.sql
    - apps/supabase/supabase/schema/300-auth-tables.sql
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/schema/501-bulk-operations.sql
    - apps/supabase/supabase/schema/502-email-helpers.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
    - packages/supabase-types/src/database.ts

key-decisions:
  - "E2E RUN, not declined — 150/150, zero skipped. The tracer named this as the plan that should run the suite; my diff changes the live RLS predicate surface and the email-notification role predicate, neither of which any static check reaches."
  - "301-auth-functions.sql edited although the plan frontmatter omits it — the task action and acceptance criterion 180 both name it explicitly. Frontmatter/body discrepancy recorded as a deviation."
  - "The Depends-on repair was held to the three files the plan enumerates. 21 further stale citations across 7 other schema files are measured and reported, not fixed."
  - "REVIEW-DB-01 stays Pending. Its dev-seed clause is unmet by construction (86 word-boundary occurrences remain); this plan delivers only the SQL half."
  - "The parity fixture was NOT updated. A symmetric rename produces no new hunks, so a fixture edit here would have been a change made to quiet a gate rather than a reviewed consequence."

patterns-established:
  - "Symmetric two-copy edits leave the parity signature byte-identical: 4 hunks / 11 signature lines before and after. A fixture that needed updating would have been the signal that one copy moved and the other did not."

requirements-completed: []

metrics:
  duration: ~70 min
  completed: 2026-08-30

actuals:
  tokens: 62971
  tasks: 3
  commits: 3
---

# Phase 156 Plan 02: The role vocabulary rename (SQL half) Summary

**`public.user_role_type`'s second member is now `organization` in both hand-maintained SQL copies and in a rebuilt live database, along with the one database object whose name embedded the retired term — proved by a rebuilt catalogue, a flip-tested pgTAP assertion, a green parity gate and a full 150/150 E2E run.**

## Performance

- **Duration:** ~70 min (of which ~10.3 min was the E2E suite and ~2 min the two database rebuilds)
- **Tasks:** 3/3
- **Commits:** 3

## Commits

| Task | Commit | What |
|---|---|---|
| 1 | `164dca1c8` | enum member, `scope_type` comment, 4 `has_role` sites, the policy identifier, 2 section comments — 9 lines × 2 copies |
| 2 | `b19c9e56a` | the remaining 9 `party` sites + 8 stale `Depends-on` filename citations — 15 lines × 2 copies |
| 3 | `aa04b8df6` | 2 `enum_has_labels` assertions, `plan(68)` → `plan(70)`, regenerated types |

## Accomplishments

### The rename, measured

**18 lines in `schema/`, 18 in `migrations/00001_initial_schema.sql` — the same 18 lines, twice.** Both counts reproduce the plan's figure exactly. After the two rename commits:

```
grep -ric party apps/supabase/supabase/schema/ apps/supabase/supabase/migrations/   →  0 for every file
```

Case-insensitively, as the plan required — the capitalised prose form (`-- Party admin self-update: …`) was in scope and is gone.

**The live database, read out of the catalogue rather than out of a file:**

| Probe | Result |
|---|---|
| `user_role_type` labels, in `enumsortorder` | `'candidate', 'organization', 'project_admin', 'account_admin', 'super_admin'` |
| label count | **5** — no sixth alias (D-E1 option (a)) |
| `pg_policies` on `public.organizations` | includes `organization_update_own_organizations`; no `party_*` |
| any policy / proc / relation `ILIKE '%party%'` | **zero rows** |

`yarn db:reset-with-data` exit 0, 752 rows seeded — identical to the tracer's baseline. Under D-E2's rewrite-in-place there is no forward migration to prove; the rebuild *is* the proof, and it replays a history that was never wrong.

### The one site a word-boundary grep cannot find

`CREATE POLICY "party_update_own_organizations"` — the sole database object whose **name** embedded the term. A `\bparty\b` grep does not match a token followed by an underscore, which is why the research's 17-line table omitted it. It is renamed, and the live `pg_policies` probe above is the evidence that the rename reached a database rather than only a file.

### The email helper's priority ladder — renamed, not reordered

`502-email-helpers.sql` carries an `ORDER BY CASE ur.role … END` ladder whose numeric arms decide which address a notification goes to when a user holds several roles. Only the literal moved:

```sql
    ORDER BY
      CASE ur.role
        WHEN 'candidate' THEN 1
        WHEN 'organization' THEN 2
      END
```

Ascending, `THEN 2` still on the second arm, one occurrence. T-156-09 mitigated as the threat register specified.

### The pgTAP suite's first enum-label assertions

The suite had **no** `enum_has_labels` and no `has_type` assertion anywhere. Two were added (69 `user_role_type`, 70 `entity_type`), `plan(68)` → `plan(70)`, planned suite total `267` → `269`.

They matter more than their size: every other check in this phase reads a file. These read the rebuilt catalogue, so a `schema/`-only edit — the exact drift `apps/supabase/README.md:26` says nothing verifies — becomes a failure instead of a silent green.

**Both were flip-tested** against the rebuilt catalogue, because an assertion nobody has seen fail is not evidence:

| Flip | Result |
|---|---|
| old vocabulary (`'party'` in slot 2) | `not ok 1` — `have: {candidate,organization,…}` / `want: {candidate,party,…}` |
| right labels, wrong order (`organization` first) | `not ok 2` — order is load-bearing, as intended |
| the shipped form, against the rebuilt catalogue | `ok 1`, `ok 2` |

The positive case had to be proved in an isolated `psql` transaction rather than through `supabase test db`, because `10-schema-migrations.test.sql` calls `create_test_data()` at line 18 and aborts before reaching assertion 69 — see below.

### The stale `Depends-on` headers

Three files carried header dependency lists naming SQL filenames that no longer exist anywhere in the tree; they predate a renumbering. Every replacement was verified to exist on disk **before** being written, by listing `apps/supabase/supabase/schema/` rather than trusting the plan's list:

| File | Cited (dead) | Written (verified present) |
|---|---|---|
| `300-auth-tables.sql` | `001-tenancy.sql`, `003-entities.sql` | `100-tenancy.sql`, `102-entities.sql` |
| `301-auth-functions.sql` | `011-auth-tables.sql`, `001-tenancy.sql` | `300-auth-tables.sql`, `100-tenancy.sql` |
| `303-column-grants.sql` | `003-entities.sql`, `006-answers-jsonb.sql`, `011-auth-tables.sql`, `010-rls.sql` | `102-entities.sql`, `105-answers.sql`, `300-auth-tables.sql`, `302-rls.sql` |

Content-verified, not name-matched: `105-answers.sql` does `ALTER TABLE public.candidates ADD COLUMN answers jsonb` at its line 10; `300-auth-tables.sql`'s own title is "Auth tables: user_roles, auth_user_id columns, **published flags**"; `100-tenancy.sql` is "Multi-tenant foundation: accounts and projects". The acceptance-criterion regex over the three files returns zero matches.

## Gate results — both halves, verbatim

| Gate | Result |
|---|---|
| `yarn build` | exit 0 — **14 successful, 14 total; 0 cached, 14 total** (`TURBO_FORCE=true`) |
| `yarn lint:check` | exit 0 — **12 links**, counted from `package.json` (`.split('&&').length` → `12`), not from any inherited number |
| ↳ `turbo run lint` | 11 successful / 11 total, **0 cached** |
| ↳ `yarn typecheck` | 22 successful / 22 total, **0 cached** |
| ↳ `assert:i18n-catalog-namespaces` | 598 keys (161 / 121 / 316), 0 violations |
| ↳ `assert:a11y-scan-wiring` | 0 violations |
| ↳ `assert:comment-hygiene` | **1584 files**, 2 vendored excluded, **2 of 2 rules live**, 0 violations |
| ↳ `assert:edge-env-defaults` | 17 files, 3 of 3 checks live, 0 violations |
| ↳ `assert:declared-binaries` | 16 workspaces, 20 invocations, 0 violations |
| ↳ `assert:node-engine` | pass |
| ↳ `assert:env-pair-registry` | 17 Deno + 1342 frontend files; **4 pairs derived** (non-zero), 33 `.env.example` assignments, 0 violations |
| ↳ `assert:schema-migration-parity` | **24 schema files → 3279 lines; 00001 → 3271 lines; 4 hunks, 11 signature lines** — byte-identical to the pre-change census |
| `yarn test:unit` | exit 0 — **25 successful / 25 total, 0 cached**; dev-seed 603 tests / 53 files, frontend 816 tests / 54 files; coverage guard 11 workspaces executed, 0 violations |
| `yarn format:check` | exit 0 — "All matched files use Prettier code style!" |
| `yarn db:reset-with-data` | exit 0, 752 rows |
| `yarn test:e2e` | **150 passed (10.3m)**, exit 0 — see § E2E |
| `cd apps/supabase && npx supabase test db` | **exit 1 — red by design**, see § pgTAP |

Every census above is non-zero. The parity guard's census is the load-bearing one: it is identical before and after the rename, which is what a *symmetric* two-copy edit is supposed to look like. **The expected-signature fixture was not touched** — `git status` on it is empty. Had one copy moved without the other, the guard would have reported new hunks and the fixture would have been the thing that refused to agree.

## E2E — run, not declined

The tracer declined E2E with a mechanical argument and noted that "the `party` → `organization` rename is the plan that should run the suite". This is that plan's SQL half, and I ran it.

**Why it was worth running.** My diff is not a static-only change:

- Four `has_role()` call sites inside `SELECT` and `UPDATE` policies on `public.organizations` and `public.candidates` are RLS predicates. A policy comparing a retired literal **returns false rather than raising** — no grep and no type check sees that.
- `502-email-helpers.sql` is a `plpgsql` function whose body is not validated at migration time. Its `ur.role IN ('candidate', 'organization')` predicate is on the preregistration-invite email path, which the candidate journey specs exercise. Had the enum and the predicate gone out of step, the failure would have surfaced only at runtime.

**Procedure, per the standing E2E rules.** `yarn db:reset` first (exit 0). Port checked three ways before starting — `lsof -nP -iTCP:5173 -sTCP:LISTEN` (no listener), `docker ps | grep 5173` (0 matches), `pgrep -fl 'vite.js dev'` (none). One fresh dev server, then `yarn test:e2e` backgrounded and teed to a log. 156 GiB free before the run.

**Counts derived from the run's own per-test record, not the console tail:**

| Check | Result |
|---|---|
| distinct `[N/150]` indices emitted | **150** |
| indices in `1..150` never emitted (a did-not-run would appear here) | **none** |
| ` skipped` / ` failed` / ` flaky` / `interrupted` / `did not run` / `✘` / `Error:` tokens anywhere in the log | **0 each** |
| `E2E PREFLIGHT OK` lines | **1**, naming this checkout; preflight-failure lines **0** |
| final summary | `150 passed (10.3m)` |
| process exit | **0** |

Matches the standing baseline exactly (150/150, zero skipped). The dev server was stopped afterwards (`pkill -f 'vite.js dev'`) and `:5173` confirmed released.

**Caveat, stated so nobody over-reads it.** The Playwright config uses the HTML reporter only, so there is no JSON payload on disk; the counts above are derived from the reporter's per-test emission plus the exit code, which is stronger than the summary line alone but is not a machine-readable report artefact. If a future plan needs one, the config needs a `json` reporter added.

## pgTAP — RED BY DESIGN, and this is the named target list for plan 03

`npx supabase test db` exits **1**. The plan predicted this and forbade patching the fixtures here. **The failure set is precisely the fixture fan-out and nothing else**, and it is narrower than "several files":

- **All 11 files fail.** `Files=11, Tests=1`.
- **All 11 fail with the identical error**, at the identical origin:

```
ERROR:  invalid input value for enum user_role_type: "party"
LINE 7:     (test_user_id('party_a'),         'party',         'part...
CONTEXT:  PL/pgSQL function create_test_data() line 26 at SQL statement
```

- **The single origin line is `apps/supabase/supabase/tests/database/00-helpers.test.sql:295`:**

```sql
    (test_user_id('party_a'),         'party',         'party',     test_id('org_a')),
```

Because every other file calls `create_test_data()` in its preamble, one line takes down eleven files. Per-file TAP verdicts: `00-helpers` "No plan found in TAP output"; the other ten "Bad plan. You planned N tests but ran 0" (26, 15, 59, 30, 14, 15, 9, 16, 15, **70**). The `70` independently confirms the harness read the bumped plan literal.

**No assertion was weakened, deleted or renumbered, and no fixture was patched, to make anything green.**

### What plan 03 has to move — measured now, not inherited

`apps/supabase/supabase/tests/database/`, at commit `aa04b8df6`:

| Measure | Command | Value |
|---|---|---|
| `\bparty\b` occurrences | `grep -rhoP '\bparty\b'` | **26** |
| `/party/i` occurrences | `grep -rhoi 'party'` | **88** |
| `'party'` quoted literals | `grep -rho "'party'"` | **14** |
| files carrying the term | `grep -ric party \| grep -v ':0$'` | **3** — `00-helpers.test.sql`, `05-party-admin.test.sql`, `09-column-restrictions.test.sql` |
| file named for the term | — | `05-party-admin.test.sql` |

The JWT-claim fixture sites are `00-helpers.test.sql:184-185` (`'role', 'party'` / `'scope_type', 'party'`) and `:295` (the `user_roles` INSERT above).

## Deviations from Plan

### 1. [Rule 3 — blocking / plan-internal inconsistency] `301-auth-functions.sql` edited although the frontmatter omits it

**Found during:** Task 2.
**Issue:** The plan's `files_modified` frontmatter does not list `apps/supabase/supabase/schema/301-auth-functions.sql`, but the task-2 action body names it explicitly ("`301-auth-functions.sql` and `300-auth-tables.sql` carry the same defect in their own headers") and acceptance criterion 180 greps it for zero stale names. The two cannot both be satisfied without editing it.
**Resolution:** Edited it — the action body and the acceptance criterion bind, and a frontmatter list is a manifest, not an instruction. Two lines changed, in both copies.
**Consequence for plan 05:** its `files_modified` also lists `301-auth-functions.sql` and `300-auth-tables.sql`; both now carry corrected headers.
**Commit:** `b19c9e56a`.

### 2. [Documented scope hold] 21 further stale `Depends-on` citations left in place

**Found during:** Task 2.
**Issue:** The plan says to correct "only the files this task already edits", then enumerates exactly three. Task 2 also edits `302-rls.sql` and `502-email-helpers.sql`, which carry the same defect. The two readings conflict.
**Resolution:** Followed the explicit enumeration and the acceptance criterion (three files), and did **not** widen. The plan's own sentence — "widening this task to chase it would be scope this plan did not agree to" — settles the tie.
**Measured residue, for whoever owns the comment sweep** (every cited name confirmed absent from `apps/supabase/supabase/schema/`):

| File | Line | Dead citation |
|---|---|---|
| `200-indexes.sql` | 36 | `003-entities.sql` |
| `302-rls.sql` | 4 | `012-auth-hooks.sql` |
| `302-rls.sql` | 274 | `013-auth-rls.sql` |
| `400-storage.sql` | 4 | `002-elections.sql`, `003-entities.sql`, `004-questions.sql`, `005-nominations.sql`, `011-auth-tables.sql`, `012-auth-hooks.sql` |
| `500-external-id.sql` | 7 | `002-elections.sql`, `003-entities.sql`, `004-questions.sql` |
| `500-external-id.sql` | 8 | `005-nominations.sql`, `007-app-settings.sql` |
| `501-bulk-operations.sql` | 9 | `015-external-id.sql` |
| `501-bulk-operations.sql` | 10 | `010-rls.sql` |
| `502-email-helpers.sql` | 3 | `003-entities.sql` |
| `502-email-helpers.sql` | 4 | `000-functions.sql`, `002-elections.sql`, `005-nominations.sql`, `011-auth-tables.sql` |

21 dead citations across 7 files. Each also exists in its `migrations/00001_initial_schema.sql` twin.

### 3. [Premise correction] `permittedKeys.ts` needed no hand edit — and the reason matters

`156-DISPOSITIONS.md` measurement-correction 3 warns that `packages/dev-seed/src/template/permittedKeys.ts` is a hand-written literal key array, and names "the `party` → `organization` rename (criterion 1)" as one of the next two edits that will hit it.

**It did not.** `yarn typecheck` passed 22/22 at `0 cached` with no edit to that file. The stated mechanism is column-shaped: the array holds **column names**, and this plan renames an **enum label**, which never appears there. The warning stands for criterion 5 (the grants narrowing, plan 05, which does drop columns) but is a false alarm for criterion 1. Recorded so plan 04 does not go looking for an edit that is not needed.

### 4. [Premise correction] Regenerating the types could not break `typecheck`, and the reason is a weakness worth naming

The narrowed `user_role_type` union in `packages/supabase-types/src/database.ts` does **not** flow to either frontend comparison site. Both declare the claim payload as raw `string`:

- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:163` — `const userRoles: Array<{ role: string; scope_type: string; scope_id: string }>`
- `apps/frontend/src/routes/candidate/login/+page.server.ts:37` — `const userRoles: Array<{ role: string }>`

So `r.role === 'party'` survives `tsc` untouched. **This is why the generated types could be regenerated in this plan without breaking the chain — and equally why they gave no warning.** After this plan those two disjuncts are unreachable (no row can carry the retired label) but still present; plan 04 removes them. Had either site been typed against `Database['public']['Enums']['user_role_type']`, `tsc` would have flagged both under TS2367 and the rename would have been self-announcing. Worth a follow-up in the phase that owns the adapter boundary.

### 5. [Measurement correction] The blast-radius figures in `156-CONTEXT.md` § D-E1 do not reproduce

Recorded because plans 03 and 04 size their waves from that table. Measured at commit `aa04b8df6`, occurrence counts (`grep -rho…`), with the SQL trees now at zero by construction:

| Tree | CONTEXT § D-E1 `\bparty\b` | Measured now `\bparty\b` | Measured `/party/i` | Measured `'party'` |
|---|---:|---:|---:|---:|
| `packages/dev-seed/src` | 84 | **86** | 202 | **0** ✅ reproduces |
| `apps/frontend/src` | 40 (re-measured) | **47** | 75 | **5** ✅ reproduces |
| `apps/supabase/.../tests/database` | 56 (§ D-E1 prose) | **26** | 88 | **14** (§ D-E1 says 8) |

The identifier-level counts — the ones that determine whether a change is a code change — **reproduce exactly** for dev-seed (0) and frontend (5). The prose counts do not, and the pgTAP quoted-literal count is 14 rather than the 8 recorded. I did not establish the cause; part of it is line-count-vs-occurrence-count confusion, part may be Phase 152/155 edits landing after the CONTEXT was measured. **Treat the table above as the current figure and CONTEXT § D-E1's prose columns as stale.**

## Requirements

`REVIEW-DB-01` is left **Pending**, and this is deliberate. Its wording requires that "enums, schema, **migrations** and **dev-seed templates** carry no `party`".

| Clause | Status |
|---|---|
| enums carry no `party` | ✅ met — `000-enums.sql`, 5 labels |
| schema carries no `party` | ✅ met — 0, case-insensitively |
| migrations carry no `party` | ✅ met — 0, case-insensitively |
| **dev-seed templates carry no `party`** | ❌ **unmet** — 86 `\bparty\b` occurrences across 22 files remain; plan 04 owns this |
| `yarn db:reset-with-data` observed working end to end | ✅ met — exit 0, 752 rows |

Four of five clauses met; the requirement is not. Per the phase's standing rule, it stays Pending with the unmet clause named rather than being force-marked. `.planning/REQUIREMENTS.md` is unchanged by this plan.

## Threat model dispositions

| Threat | Disposition | Evidence produced here |
|---|---|---|
| T-156-06 (EoP — the RLS surface) | mitigated | All six RLS sites moved in one commit; matched line count 7 (schema) / 7 of 9 (00001); live `pg_policies` probe; 150/150 E2E |
| T-156-07 (stale JWT with retired label) | accepted | `db:reset` was run twice, invalidating every session. No deployed database replays this history. Recorded, not dismissed, per CONTEXT § O-4 |
| T-156-08 (two-copy tampering) | mitigated | `assert:schema-migration-parity` exit 0, census unchanged at 4 hunks / 11 signature lines, fixture untouched |
| T-156-09 (email priority ladder) | mitigated | Ladder arms unchanged in order and value; only the literal moved; verified by `sed -n '/ORDER BY/,/END/p'` |
| T-156-SC (package installs) | accepted | Zero packages installed |

## Known Stubs

None.

## Open item for the operator — NOT resolved here

**The pgTAP suite is red on this branch until plan 03 lands.** This is the plan's designed intermediate state and the plan forbade fixing it here, but it means that if the overnight run stops after plan 02, `npx supabase test db` exits 1 on `integration/ship-12-squash`. Every other gate is green, including E2E.

I did **not** append this to `.planning/WINDOWS.md`. The reasoning, offered for review rather than as a settled call: it is a same-phase intermediate state with a named owner one plan away, and closing a ledger entry requires `gsd-tools windows fixed <id>`, which has no dry-run and mutates on probe. Recording it here — in the document plan 03 reads as its target list — seemed the lower-risk placement for an unattended run. If the ledger entry is wanted, it is one `windows append --kind unrun-verify` away.

## Notes for the next plan (156-03)

1. Your whole target is **one line**: `00-helpers.test.sql:295`, plus the JWT-claim fixture at `:184-185`. Everything else in the fan-out is downstream of it.
2. `05-party-admin.test.sql` → `05-organization-admin.test.sql`: keep the `05-` prefix so it still runs after `00-helpers.test.sql`.
3. Your post-plan-02 baseline for the per-file `plan(N)` literals is **269** total, with `10-schema-migrations.test.sql` at **70**. Do not renumber to reach a green.
4. `enum_has_labels` works and is flip-tested; `10-schema-migrations.test.sql` assertions 69 and 70 will start reporting as soon as `create_test_data()` stops raising.
5. The database is currently in post-E2E-teardown state (`yarn db:reset` was run, then the Playwright setup projects seeded and tore down their own templates). Run `yarn db:reset` before trusting any fixture state.

## Self-Check: PASSED

- `apps/supabase/supabase/schema/000-enums.sql` — FOUND
- `apps/supabase/supabase/schema/302-rls.sql` — FOUND
- `apps/supabase/supabase/schema/502-email-helpers.sql` — FOUND
- `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql` — FOUND
- `packages/supabase-types/src/database.ts` — FOUND
- commit `164dca1c8` — FOUND
- commit `b19c9e56a` — FOUND
- commit `aa04b8df6` — FOUND
