---
phase: 156-supabase-schema-corrections-naming-constraints-grants
plan: 05
subsystem: database
tags: [postgres, supabase, enum, rls, pgtap, jwt, security-definer, typescript]

requires:
  - phase: 156-04
    provides: 'the `party` -> `organization` rename completed through dev-seed and the frontend, and the `Enums<''user_role_type''>` type barrier at the JWT role-claim declaration this plan extends to scope'
  - phase: 156-02
    provides: '`public.user_role_type` already carrying `organization`, so the new scope enum could reuse the corrected vocabulary verbatim'
  - phase: 156-03
    provides: 'pgTAP fixtures speaking the renamed vocabulary, so the retyped column accepted every fixture row unchanged'
provides:
  - 'New enum `public.role_scope_type` (`candidate`, `organization`, `project`, `account`, `global`) in both SQL copies'
  - '`public.user_roles.scope_type` retyped from `text NOT NULL` to `role_scope_type NOT NULL`, its value-listing comment deleted'
  - 'New signature `public.has_role(public.user_role_type, public.role_scope_type, uuid)`, bound to by 9 RLS policies with no call-site change'
  - '`has_role` and `can_access_project` comparing enum identity (claim value cast UP), keeping SECURITY DEFINER + empty search_path'
  - 'Three catalogue-read pgTAP assertions (71-73); plan(70) -> plan(73); planned sum 269 -> 272; harness Files=11, Tests=280 PASS'
  - '`156-DISPOSITIONS.md` entry 7 — the up-cast choice, the `22P02` consequence and its measured exposure'
  - 'Regenerated `packages/supabase-types/src/database.ts` carrying `Enums<''role_scope_type''>` on the column and on `has_role`''s Args'
affects: [156-06, 156-07, 156-08, 156-09, 156-10, 157-adapter-boundary, 161-project-id-scoping, 162-permissions-refactor]

actuals:
  tokens: 5800
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - 'Claim-value-UP enum casting in RLS predicate functions: `(role_entry->>''role'')::public.user_role_type = p_check_role`, schema-qualified so an empty `search_path` still resolves'
    - 'Catalogue-read pgTAP shape assertions (`col_type_is` / `has_function` / `enum_has_labels`) as the thing that makes a `schema/`-only edit fail instead of passing silently'

key-files:
  created: []
  modified:
    - apps/supabase/supabase/schema/000-enums.sql
    - apps/supabase/supabase/schema/300-auth-tables.sql
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
    - packages/supabase-types/src/database.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - .planning/phases/156-supabase-schema-corrections-naming-constraints-grants/156-DISPOSITIONS.md

key-decisions:
  - 'The type is named `public.role_scope_type`, not `public.scope_type` — a type and a column sharing a name reads ambiguously in the `SET search_path = ''''` contexts where one must be written `public.X` and the other `ur.X`'
  - 'Members are exactly the column comment''s own five, with the renamed role term; Contract C2 forbids optimising for the vocabulary Phase 162 will introduce'
  - 'The CLAIM VALUE is cast UP to the enum, not the parameter down to text — the direction that makes the comparison enum identity rather than decoration on a signature. Recorded as DISPOSITIONS entry 7 with its `22P02` consequence'
  - 'The JWT scope claim in `supabaseDataWriter.ts` was narrowed to `Enums<''role_scope_type''>` as a rule-2 deviation, closing the scope half of the barrier 156-04 built for role'
  - 'The Deno edge functions were NOT changed — no type barrier is reachable there without structural work this plan does not own; filed as WINDOWS 185'

patterns-established:
  - 'A catalogue-read assertion is the only pgTAP shape that distinguishes a `schema/`-only edit from a replayed one — flip-tested here: `col_type_is` reported `have: role_scope_type / want: text`'
  - 'The pgTAP harness line `Tests=N` is the PLANNED count and is identical on a passing and a failing run — measured: the flip run also printed `Files=11, Tests=280`. Assert `Result: PASS` alongside it, never `Tests=` alone'

requirements-completed: [REVIEW-DB-02]

coverage:
  - id: D1
    description: '`public.user_roles.scope_type` is an enum column, so an illegal scope is rejected at INSERT rather than silently failing a predicate later'
    requirement: 'REVIEW-DB-02'
    verification:
      - kind: integration
        ref: 'apps/supabase/supabase/tests/database/10-schema-migrations.test.sql#72 col_type_is user_roles.scope_type role_scope_type'
        status: pass
      - kind: integration
        ref: 'psql: INSERT user_roles (…, scope_type => ''party'') raises SQLSTATE 22P02'
        status: pass
    human_judgment: false
  - id: D2
    description: '`has_role` takes its role and scope as enum types and compares enum-cast claim values, keeping SECURITY DEFINER with an empty search_path'
    requirement: 'REVIEW-DB-02'
    verification:
      - kind: integration
        ref: 'apps/supabase/supabase/tests/database/10-schema-migrations.test.sql#73 has_function has_role ARRAY[user_role_type, role_scope_type, uuid]'
        status: pass
      - kind: integration
        ref: "psql: pg_get_function_identity_arguments -> 'p_check_role user_role_type, p_check_scope_type role_scope_type, p_check_scope_id uuid'; prosecdef=t; proconfig={search_path=\"\"}"
        status: pass
    human_judgment: false
  - id: D3
    description: 'The no-scope-filter branch survives: a one-argument call still means "any matching role", and `scope_type` stays NOT NULL'
    requirement: 'REVIEW-DB-02'
    verification:
      - kind: integration
        ref: 'psql 10-branch probe: has_role(''organization'') = t with a scoped claim; wrong scope_id, wrong scope_type and non-matching role all f; super_admin short-circuits with and without a scope'
        status: pass
    human_judgment: false
  - id: D4
    description: 'Role and scope equality is enum identity — a claim carrying a label the enum does not have can never match, and its rejection raises rather than silently returning false'
    requirement: 'REVIEW-DB-02'
    verification:
      - kind: integration
        ref: 'psql: a stale {"role":"party","scope_type":"party"} claim raises SQLSTATE 22P02 inside has_role; recorded as 156-DISPOSITIONS.md entry 7'
        status: pass
    human_judgment: false
  - id: D5
    description: "The access-token hook's claim payload keeps its wire shape, so no consumer of the token changes"
    requirement: 'REVIEW-DB-02'
    verification:
      - kind: e2e
        ref: 'tests/e2e-runs/156-05-enum-scope-run01/results.json — expected 150, unexpected 0, flaky 0, skipped 0; preflight-successes 1, preflight-failures 0'
        status: pass
    human_judgment: false
  - id: D6
    description: 'The nine calling RLS policies are untouched and still gate correctly'
    requirement: 'REVIEW-DB-02'
    verification:
      - kind: integration
        ref: 'git: apps/supabase/supabase/schema/302-rls.sql byte-unchanged (blob 72d66f12 before and after); pgTAP Files=11, Tests=280, Result: PASS from apps/supabase'
        status: pass
    human_judgment: false

duration: ~55min
completed: 2026-08-30
status: complete
---

# Phase 156 Plan 05: Role identity as a type, not a convention — Summary

**`user_roles.scope_type` is now the enum `public.role_scope_type` and both RLS predicate functions compare enum identity instead of strings — an illegal scope is rejected at INSERT, a stale claim label raises `22P02` instead of looking like a legitimate denial, and the nine calling policies needed no change because rewrite-in-place builds the new signature before they bind to it.**

## Performance

- **Duration:** ~55 min (start approximate — first commit `768f99c23` at `2026-08-30T01:19:04+03:00`, E2E ended `01:40:56+03:00`)
- **Tasks:** 3 of 3
- **Files modified:** 8 (6 planned, 1 rule-2 deviation, 1 planning artifact)
- **Commits:** 4

## Accomplishments

- **Criterion 2 / REVIEW-DB-02 is met in both SQL copies.** A new enum, a retyped column with its now-redundant comment deleted, a new `has_role` signature, seven enum-cast comparisons across two `SECURITY DEFINER` predicates, and three catalogue-read pgTAP assertions.
- **The consequence was measured, not argued.** A stale `'party'` claim raises `22P02` inside `has_role`; an illegal scope raises `22P02` at INSERT. Both proven against the rebuilt database, and recorded as `156-DISPOSITIONS.md` entry 7 rather than left for a later reader.
- **The behavioural half was proven directly, because the pgTAP suite cannot prove it.** WINDOWS 183 records that the 14 role-scope assertions are blind. A 10-branch psql probe against the rebuilt predicates (no-scope-filter match, exact scope match, wrong `scope_id`, wrong `scope_type`, non-matching role, `super_admin` short-circuit with and without a scope, `can_access_project` own vs. other project) returned 10/10 as expected.
- **Every new assertion was flip-tested.** Mutating all three plus `05`'s plan literal produced four distinct reds naming their own counts — including `05-organization-admin.test.sql (Tests: 14 Failed: 0) … You planned 15 tests but ran 14`, which is the per-file distribution the plan asked for.
- **The scope half of the T-156-13 type barrier was closed one layer up** (rule-2 deviation), flip-tested in both directions, and the layer where it remains open was filed as WINDOWS 185 rather than quietly fixed or quietly ignored.

## Task Commits

1. **Task 1: Declare `public.role_scope_type` and retype the column, in both SQL copies** — `768f99c23` (feat)
2. **Task 2: Compare enums, not strings, in `has_role` and `can_access_project`** — `bbea50d3a` (feat)
3. **Task 3: Rebuild, pin the new shapes in pgTAP, and prove the role checks still gate** — `bc4b864a1` (test)
4. **Deviation (rule 2): narrow the JWT scope claim in the frontend** — `de1bb1748` (fix)

## Files Created/Modified

- `apps/supabase/supabase/schema/000-enums.sql` — the new `CREATE TYPE public.role_scope_type AS ENUM` block after `user_role_type`, plus its header-comment entry
- `apps/supabase/supabase/schema/300-auth-tables.sql` — `scope_type text` -> `scope_type role_scope_type`, trailing value-listing comment deleted, table block re-aligned one column wider
- `apps/supabase/supabase/schema/301-auth-functions.sql` — access-token hook casts `ur.scope_type::text`; `has_role`'s signature retyped; 4 role casts and 3 scope casts across both predicates; file-header signature line corrected
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — all eight twins of the above, in the same commits per D-E2
- `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql` — assertions 71-73, `plan(70)` -> `plan(73)`
- `packages/supabase-types/src/database.ts` — regenerated via `yarn db:types` (never hand-edited)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — JWT scope claim declared `Enums<'role_scope_type'>` (rule-2 deviation)
- `.planning/phases/156-.../156-DISPOSITIONS.md` — entry 7; the header count and index table moved from six entries to seven

## Decisions Made

**The enum's name and membership.** `public.role_scope_type`, members `'candidate', 'organization', 'project', 'account', 'global'` — the column comment's own vocabulary with the role term plan 02 renamed. Contract C2 was honoured literally: no member was added for a scope Phase 162 might want, because 162 replaces this model wholesale and guessing its answer would paint it into a corner it did not choose.

**The cast direction, which is the whole substance of the criterion.** `role_entry->>'role'` yields `text`; `text = user_role_type` is an operator that does not exist, so the rewrite had to pick a side. Casting the parameter DOWN to `text` compiles and requires no call-site change — and leaves the comparison a string comparison, making the enum decoration on a signature. Casting the CLAIM VALUE UP is what "uses enums in place of string comparison" means, and it is what was done. Full derivation, consequence and exposure in `156-DISPOSITIONS.md` entry 7.

**Not touching `permittedKeys.ts`.** The briefing's tripwire was checked rather than obeyed reflexively: this plan renames and drops no column, it retypes one, and `git grep -E 'user_roles|scope_type'` over `packages/dev-seed/src/template/permittedKeys.ts` returns zero hits. A type change does not alter a literal key array. Confirmed by `yarn typecheck` 22/22 green with the file untouched.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical functionality] The JWT scope claim was still declared `string` in the frontend**

- **Found during:** Task 3, while reading the regenerated types
- **Issue:** `supabaseDataWriter.ts:163` declared the decoded claim as `Array<{ role: Enums<'user_role_type'>; scope_type: string; scope_id: string }>`. 156-04 narrowed `role` at this exact declaration precisely because threat T-156-13 named `yarn typecheck` as its mitigation and that mitigation did not exist. The scope half of the same declaration was left raw, so this plan's own must-have — "role and **scope** equality is enum identity, not text comparison" — was closed in SQL and left open one layer up.
- **Fix:** `scope_type: Enums<'role_scope_type'>`
- **Files modified:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`
- **Verification (both halves, verbatim):** with `r.scope_type === 'party'` added to the role predicate —
  - **narrowed:** exit 1, `supabaseDataWriter.ts 171:86 "This comparison appears to be unintentional because the types '"candidate" | "organization" | "project" | "account" | "global"' and '"party"' have no overlap."`
  - **`string` (the pre-plan declaration), same literal:** exit 0, `COMPLETED 2093 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
  - after revert: exit 0, `2093 FILES 0 ERRORS 0 WARNINGS`, prettier clean
- **Honest caveat:** no code compares `scope_type` to a literal today, so this guards future edits rather than catching a live defect.
- **Committed in:** `de1bb1748`

**2. [Rule 1 — Bug] The file-header comment in `301-auth-functions.sql` stated the old signature**

- **Found during:** Task 2 — a site the plan never enumerated
- **Issue:** `301-auth-functions.sql:7` (and its `00001:1147` twin) documented `has_role(text, text, uuid)`. Changing the signature without it would leave the file's own header lying about the function directly beneath it.
- **Fix:** `has_role(user_role_type, role_scope_type, uuid)`, both copies
- **Committed in:** `bbea50d3a` (part of the task commit)

---

**Total deviations:** 2 auto-fixed (1 × rule 2, 1 × rule 1)
**Impact on plan:** No scope creep. One is the plan's own must-have applied one layer up; one is a documentation line inside a file the plan already owns.

## Falsified premises — every one measured

The briefing predicted the plan's coordinates and counts would be wrong. They were, in six places.

1. **`000-enums.sql`'s header comment is NOT a multi-line block.** `156-PATTERNS.md` quotes it verbatim as four aligned `--   <type>  - <what>` lines and the plan's action step 1 instructs "matching the existing … alignment". Measured: Phase 152's comment sweep **joined all four into a single line** (`000-enums.sql:4`, 187 chars). The instruction is unsatisfiable as written — a new aligned line beneath it would itself be a rule-2 forced-line-break violation of the live `assert:comment-hygiene` guard. The entry was appended to the joined line instead; `grep -c role_scope_type` still returns the required `2`.
2. **The `scope_type` column is at `300-auth-tables.sql:13`, not `:14`** — as PATTERNS, RESEARCH and CONTEXT § C2 all state. Same one-line shift, same cause.
3. **`301-auth-functions.sql` read_first ranges are all wrong.** Plan: hook at `25-40`, `has_role` at `45-100`, `can_access_project` at `100-140`. Measured: hook `9-41`, `has_role` `43-85`, `can_access_project` `87-131`.
4. **`156-RESEARCH.md`'s `has_role` call-site line list is entirely stale.** It records `:26, :27, :32, :36, :37, :41, :53, :54, :60, :61, :230, :242, :246, :279`. Measured: `:19, :20, :25, :29, :30, :34, :46, :47, :53, :54, :223, :235, :239, :266`. Only `:53` and `:54` coincide, and coincidentally. The **count** of 14 is right; every coordinate but two is not.
5. **A site the plan did not enumerate:** the `has_role(text, text, uuid)` signature in `301-auth-functions.sql`'s file header (and its `00001` twin). Fixed as deviation 2.
6. **Two acceptance criteria are written as single-line greps the file's idiom cannot satisfy.** `grep -c "col_type_is('public', 'user_roles', 'scope_type', 'role_scope_type'"` returns `0`, and `grep -c "ARRAY\['user_role_type','role_scope_type','uuid'\]"` returns `0`, because all 70 pre-existing assertions in the file put the arguments on a continuation line and space after commas. Reported rather than engineered around: the file's convention was followed and the adapted greps hold — `grep -c "'public', 'user_roles', 'scope_type', 'role_scope_type',"` = **1** and `grep -c "ARRAY\['user_role_type', 'role_scope_type', 'uuid'\]"` = **1**. The plan's own text anticipates this for the second one ("allowing for the file's spacing convention"); it does not for the first.

**Confirmed rather than falsified:** the plan's expectation that `@openvaa/dev-seed` writes no `user_roles` rows. `yarn db:reset-with-data` seeded 752 rows across 14 tables and `user_roles` is not among them, so the retype could not reach the seeder.

## Measurements

### Gates — both halves, verbatim

| Gate | Baseline at `7659ff5ba` | At `de1bb1748` |
|---|---|---|
| pgTAP (from `apps/supabase`) | `Files=11, Tests=277`, PASS | **`Files=11, Tests=280`, `Result: PASS`** |
| pgTAP planned-literal sum | 269 (`10-schema` at 70) | **272 (`10-schema` at 73)** |
| `yarn test:e2e` | 150/150, 0 skipped | **expected 150, unexpected 0, flaky 0, skipped 0** |
| `yarn lint:check` | exit 0, 12 links | **exit 0, 12 links** |
| `yarn build` | 14/14 | **14/14** (10 cached) |
| `yarn typecheck` | 22/22 | **22/22** |
| `yarn test:unit` | 25/25 | **25/25** (forced re-run of the 4 reachable workspaces: 0 cached / 16, all pass) |
| `yarn format:check` | clean | **clean, 7/7** |
| comment-hygiene | 1,584 / 0 | **1,584 / 0** |
| parity census | 24 -> 3279/3271, 4 hunks, 11 sig lines | **24 -> 3283/3275, 4 hunks, 11 signature lines; fixture byte-unchanged** |

`Tests=280` = 272 planned literals + 8 from `00-helpers.test.sql`'s `no_plan()`, exactly as `156-DISPOSITIONS.md` measurement correction 5 predicts.

### `lint:check` — all 12 links named and measured

`turbo run lint` · `eslint … tests` · `typecheck:tests` · `typecheck` · `assert:i18n-catalog-namespaces` · `assert:a11y-scan-wiring` · `assert:comment-hygiene` · `assert:edge-env-defaults` · `assert:declared-binaries` · `assert:node-engine` · `assert:env-pair-registry` · `assert:schema-migration-parity` = **12**.

Every guard printed a non-zero census: i18n 598 keys · a11y 0 violations · comment-hygiene 1,584 files / 2 of 2 rules live · edge-env 17 files / 3 of 3 checks · declared-binaries 16 workspaces, 20 invocations · node-engine v24.14.1 · env-pair 17 Deno + 751 frontend files, 4 pairs derived, 33 `.env.example` assignments · parity 24 schema files. Turbo reported **0 cached / 11** for `lint` and **0 cached / 22** for `typecheck` — no replay.

### Live proof against the rebuilt database

```
pg_get_function_identity_arguments(has_role)
  -> p_check_role user_role_type, p_check_scope_type role_scope_type, p_check_scope_id uuid
prosecdef = t   proconfig = {search_path=""}
role_scope_type -> candidate,organization,project,account,global
user_roles.scope_type -> USER-DEFINED / role_scope_type / NOT NULL
```

| Probe | Result |
|---|---|
| INSERT `user_roles(… scope_type => 'party')` | **raises `22P02`** (T-156-19) |
| `has_role('candidate')` under a stale `{"role":"party","scope_type":"party"}` claim | **raises `22P02`** (entry 7) |
| `has_role('organization')` with a scoped organization claim | `t` — no-scope-filter branch intact |
| `has_role('organization','organization',<matching id>)` | `t` |
| `has_role('organization','organization',<other id>)` | `f` |
| `has_role('organization','account',<matching id>)` | `f` |
| `has_role('candidate')` under an organization claim | `f` — a known non-matching label still denies silently |
| `has_role('super_admin')` / with a scope argument | `t` / `t` — short-circuit intact |
| `can_access_project(own)` / `can_access_project(other)` as project_admin | `t` / `f` |

10/10. This is the behavioural half of criterion 2, and it was run directly because — per WINDOWS 183 — the pgTAP role-scope assertions cannot supply it.

### Flip tests — every new assertion proven to examine something

One mutated run, four distinct reds:

```
05-organization-admin.test.sql (Wstat: 0 Tests: 14 Failed: 0)
  Parse errors: Bad plan.  You planned 15 tests but ran 14.
10-schema-migrations.test.sql  (Wstat: 0 Tests: 73 Failed: 3)
  Failed tests:  71-73
# Failed test 71: "role_scope_type carries exactly the five scope labels, in order (…)"
#         have: {candidate,organization,project,account,global}
#         want: {candidate,organization,project,account,party}
# Failed test 72: "user_roles.scope_type is role_scope_type, not text (…)"
#         have: role_scope_type
#         want: text
# Failed test 73: "has_role(user_role_type, role_scope_type, uuid) function exists (…)"
# Looks like you failed 3 tests of 73
Result: FAIL
```

Two things this establishes beyond the assertions themselves:

- **`05-organization-admin.test.sql` runs exactly 14 assertions** — the per-file distribution the plan asked for, obtained positively rather than inferred from an `ok`.
- **`Tests=280` is printed on the FAILING run too.** The harness total is the *planned* count and does not distinguish pass from fail. Anything asserting the pgTAP gate must read `Result: PASS` alongside `Files=N, Tests=M`, never the count alone. Filed as a pattern above; it compounds WINDOWS 184.

All four mutations reverted via `git checkout --` (safe: the work was already committed), and the suite re-confirmed at **`Files=11, Tests=280, Result: PASS`** afterwards.

### E2E — run against the diff, and why

Run because the diff touches `custom_access_token_hook`, whose claim payload is minted by real Supabase Auth on every token issue — a path pgTAP does not exercise, since the suite fabricates its claims. If the `::text` cast had altered the wire shape, every authenticated request would have failed at RLS with nothing in the SQL gates to show it.

Evidence directory `tests/e2e-runs/156-05-enum-scope-run01/`, produced by `tests/scripts/e2e-run.sh` (which owns its own `db:reset`, spawns and asserts sole ownership of its dev server, and writes a machine-readable verdict):

```
results.json stats: expected 150, unexpected 0, flaky 0, skipped 0, duration 623670 ms
preflight-successes 1   preflight-failures 0   exit 0
head de1bb174819d967fa236bf46ec48363ef19a97ca   dirty_files 0
observed_workers 6   observed_retries 0   frontend_port 5273
```

Counts taken from the report payload, not the console tail. Zero skipped, so no did-not-run test is being counted as a pass.

## Issues Encountered

**Two scans that examined nothing, both caught before they were believed.** `docker exec` without `-i` silently ran the SQL probe against no stdin and produced empty output; and `psql -q -f -` suppressed the TAP stream entirely. Both looked like clean runs. This is the milestone's dominant failure class and it fired twice in one session — the defence that worked both times was expecting a specific non-empty shape rather than accepting silence.

**Per-file pgTAP output is not obtainable outside the harness at this HEAD.** `pgtap` is created inside `00-helpers.test.sql`'s transaction and rolled back with it, so a standalone `psql` run of any single test file fails at `plan(14)` with `function plan(integer) does not exist`. The per-file distribution was obtained instead by the flip test above, which is stronger evidence anyway.

## Reported, not acted on

- **WINDOWS 185 filed** (`unmet-truth`, phase 156): the Deno edge functions carry the same JWT claim declared as raw `string` and compare it to bare literals live — `invite-candidate/index.ts:84,90` (`r.scope_type === 'project'`) and `send-email/index.ts:115` — outside all 22 workspaces of `yarn typecheck` and every link of `lint:check`. Closing it needs generated types wired into the Deno runtime plus a `typecheck` script for `apps/supabase`; structural work this plan does not own. **Operator judgement needed:** new plan, deferred item, or accept.
- **`.claude/skills/database/` drift is accumulating and was deliberately not touched**, consistent with plans 02 and 04. It already carries `'party'` in five places from 156-02, and this plan adds two more stale statements: `schema-reference.md:253` (`has_role(text, text?, uuid?)`) and `schema-reference.md:190` (`scope_type: text NOT NULL (values: 'candidate', 'party', …)`). `audit-skill-drift.sh` does not flag the database skill, so nothing will surface this automatically. Phase 160 territory under ruling D9.
- **WINDOWS 183 was relied on for what it says, and not fixed.** The 14 role-scope assertions were treated as non-evidence throughout; the psql probe above is what stands in for them.
- **A weakness in the plan's own task-2 `<verify>`:** `git diff --exit-code apps/supabase/supabase/schema/302-rls.sql` passes both when the file is untouched and when it was changed *and committed*. The blob sha was compared instead (`72d66f12…` before and after).

## Requirement: REVIEW-DB-02 — MET, with its reading stated

`.planning/REQUIREMENTS.md:122` words it as: *"the auth-table role prefixes use an enum **matching `user_role_type`**, and `301-auth-functions.sql` compares enums in place of strings."*

Both clauses measure clean. The first phrase carries a genuine ambiguity, and the reading taken is stated rather than assumed:

- **"matching `user_role_type`" is read as _in the manner of_ `user_role_type` — an enum rather than free strings — not _with identical members_.** A literal same-members reading is incoherent: `user_role_type` is `candidate | organization | project_admin | account_admin | super_admin`, and `project_admin` / `account_admin` / `super_admin` are role names, not scopes. Reusing it would make `scope_type` unable to express `project`, `account` or `global` at all, which every one of the 14 `has_role` call sites and all eight `create_test_data()` fixture rows depend on.
- This reading is what `156-CONTEXT.md` § O-1 and Contract C2 already assume: they pose the criterion's open sub-question as *"what enum, with what members, replaces `user_roles.scope_type text`?"* and note the comment's vocabulary is "neither `entity_type` nor the scope vocabulary Phase 162 will introduce". A same-members reading would leave nothing to decide.

**`.planning/REQUIREMENTS.md` needs `REVIEW-DB-02` moved to `[x]` at `:122` and to `Complete` in the traceability row at `:282`** — not edited here, following 156-04's precedent of reporting the reading and leaving the ledger edit to the operator.

## Next Phase Readiness

- Plan 06 can proceed. `has_role`'s new signature is live and bound to by all nine policies; nothing in the chain 06→10 is blocked by this plan.
- **Contract C2 is delivered to Phase 162** exactly as CONTEXT states it: 162 inherits an enum rather than a free-text column to migrate, and the enum makes no claim about 162's `global`/`account`/`project`/`entity` vocabulary.
- **`156-DISPOSITIONS.md` now carries seven entries** (six from the discussion + entry 7). Entries 1–5 remain owed by plan 10.
- **`.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` were not edited** — per the operator's instruction and 156-04's precedent. They need: STATE current plan 5 → 6 and phase 156 progress 5/10 with the four commits recorded; ROADMAP's 156 progress row 4/10 → 5/10; REQUIREMENTS `REVIEW-DB-02` → `[x]` / `Complete` (see the reading above).

---

_Phase: 156-supabase-schema-corrections-naming-constraints-grants_
_Completed: 2026-08-30_

## Self-Check: PASSED

All 10 named artifacts exist on disk (8 modified source/planning files, the SUMMARY, and the E2E evidence payload); all 4 commit hashes resolve in `git log`.
