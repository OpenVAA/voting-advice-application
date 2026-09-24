---
phase: 162-permissions-auth-model-refactor
plan: 15
subsystem: supabase-auth-model
status: complete
tags: [rls, grants, user_can, K1, D-04, B1a, shim-removal, pgtap, legacy-removal]

requires:
  - '162-03 public.grants and its repeated GRANT USAGE ON SCHEMA public TO supabase_auth_admin (T-162-03-05)'
  - '162-04 user_can(grant_scope_type, uuid, grant_permission) and test_grants_claim(uuid)'
  - '162-05 the two shims, the fallback-expiry biconditional, and test_grants_from_user_roles'
  - '162-06 the grants claim, the transitional backfill, and its expiry biconditional'
  - '162-07b .. 162-14 the 88 policy conversions that left both shims with zero callers'
provides:
  - 'EXACTLY ONE way to ask who may do what: user_can over public.grants. K1 shim window CLOSED'
  - 'public.user_roles, public.user_role_type, public.role_scope_type, public.has_role, public.can_access_project — all ABSENT from the applied database'
  - 'public.backfill_grants_from_user_roles — absent, with its three inherited call sites discharged'
  - 'test_user_grants(text) — the pgTAP fixture authority map, written down in exactly one place'
  - 'test_seed_identity_grants(text) / test_seed_fixture_grants() — the fixture authority writers'
  - "set_test_user's third parameter as a TWO-SOURCE AGREEMENT ASSERTION (was a tripwire)"
  - 'resolve_email_variables re-expressed over public.grants, output byte-identical'
  - '24-legacy-removal.test.sql — 21 catalogue-read assertions the absences now rest on'
affects:
  - '162-16 (the retired vocabulary is GONE before the visibility change begins — one model change, not two)'
  - '162-17 (the four .claude/skills/database/ documents are this plan''s whole deferral set)'
  - 'brief § 6.1 (resolve_email_variables serves 2 of the 4 entity kinds the grant map admits)'

actuals:
  tokens: 75807
  tasks: 6
  commits: 4
  plan_head_before: dd244d3b5269df92bf91410223550712371944ce

tech-stack:
  added: []
  patterns:
    - 'two-source agreement assertion: the fixture authority map and the table projection compared as SETS at every call site'
    - 'biconditional with both sides false REPLACED by unconditional absence assertions per side'
    - 'absence asserted at ANY signature over pg_proc, never pinned to one anticipated argument list'
    - 'red-set instrument: direct psql -f for raw TAP, plus PLAN-minus-PASSED per file to catch aborting variants (D-37)'

key-files:
  created:
    - apps/supabase/supabase/tests/database/24-legacy-removal.test.sql
  deleted:
    - apps/supabase/supabase/tests/database/13-shim-parity.test.sql
  modified:
    - apps/supabase/supabase/schema/000-enums.sql
    - apps/supabase/supabase/schema/300-auth-tables.sql
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/501-bulk-operations.sql
    - apps/supabase/supabase/schema/502-email-helpers.sql
    - apps/supabase/supabase/schema/504-admin-rpcs.sql
    - apps/supabase/supabase/seed.sql
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/tests/database/14-grants-migration.test.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts

decisions:
  - 'Q1 = approved — same call shape, same argument position; set_test_user keeps its three-argument list'
  - 'Q2 = A — retire both biconditionals, replaced by unconditional absence assertions per side'
  - 'Q3 = approved — same two entity kinds, same preference order; brief § 6.1 owns the gap'
---

# Phase 162 Plan 15: Retire the Second Authority Mechanism Summary

The role table, both of its enums, both K1 shims and 162-06's transitional backfill are gone
from the declarative schema and from the applied database; the pgTAP estate was moved onto a
replacement fixture helper and **measured** to still discriminate at least as sharply, in both
authority directions, per assertion.

---

## Task 2's three answers, by option letter

| | Answer | Where it reaches |
|---|---|---|
| **Q1** | **approved** — same call shape, same argument position | Encoded at every one of the **162 derived call sites**. `set_test_user`'s identity argument list measured unchanged at `p_role text, p_user_id uuid, p_user_grants jsonb`. The parameter's *name* changed, and PostgreSQL refuses to rename an input parameter through a replace, so the declaration is preceded by an explicit drop of the exact three-argument signature with a comment saying why — a test-estate file, not `schema/`. |
| **Q2** | **A** — retire both biconditionals, replaced by unconditional absence assertions per side | 162-05's replaced in `14-grants-migration.test.sql` § 9 and in `24-legacy-removal.test.sql` §§ 6–7; 162-06's replaced by `24-legacy-removal.test.sql` assertions 1 and 8. **162-06's was OBSERVED RED FIRST** (below). Strictly stronger: a both-false biconditional is satisfied by both sides returning together. |
| **Q3** | **approved** — the same two entity kinds, same preference order | `resolve_email_variables` re-pointed and not widened; output proven byte-identical. `502-email-helpers.sql` was an **unowned** dependency on the retired enum and table — named by no plan 162-01 … 162-14. Gap handed to brief § 6.1. |

---

## The instrument, and its red-first observation (D-32 / D-37)

The plan's own `run_estate()` extracts its red-set with `grep -h '^not ok'` from
`yarn workspace @openvaa/supabase test:db`. **That output never contains raw TAP** — the CLI runs
the suite under `prove` and emits only prove's summary. Both red-sets come back empty whatever the
suite does. Re-confirmed here.

**Adopted instead:** direct `psql -f` over each pgTAP file in alphabetical order, which *does* emit
raw TAP. The pgTAP-not-resident dead end does not apply: `00-helpers.test.sql` itself runs
`CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions` **outside its transaction and commits
it**, so running the files in order installs pgTAP before any file needs `plan()`.

A red-set member is `<file>: <description>` for every `^not ok`, **plus** a synthetic
`<file>: <FILE-DID-NOT-COMPLETE>` whenever `declared − ok − notok ≠ 0` — D-37's PLAN-minus-PASSED
control, applied per file. `no_plan()` files are exempt from the under-run half.

**Observed red, twice, before it was believed:**

| Observation | Mutation | Measured |
|---|---|---|
| 1 — explicit failure | `01-tenant-isolation.test.sql`, `>= 1` → `>= 99999` | declared/ok/notok = 1082/1091/**1**; red-set size 1, naming `admin_b CAN see published elections from Project A (by design)` |
| 2 — **transaction abort** | `SELECT public.no_such_function_at_all_162_15();` injected mid-file | `01-tenant-isolation declared=26 ok=1 notok=0 missing=25`. **The `^not ok` count was ZERO** — exactly the silence that scored 162-12's control at 0 while it had broken 38 of 40. The instrument still reported the file. |

Both reverted, tree clean. Baseline on the untouched tree: 1092 assertions, 0 failed, red-set size 0.

**The instrument agrees with the project command.** `yarn workspace @openvaa/supabase test:db` at the
close reports `Files=24, Tests=978, Result: PASS`; the instrument reports 978.

---

## 162-06's expiry biconditional, observed red

An intermediate tree was built in which `public.user_roles` was gone and
`public.backfill_grants_from_user_roles` was not (`to_regclass → ABSENT`, `pg_proc → 1`). The
assertion's failing line, verbatim:

```
not ok 1 - backfill_grants_from_user_roles exists if and only if public.user_roles does — 162-15
must delete the function, the seed call and the fixture call in the commit that drops the table
```

**It had to be observed standalone, and that is itself a finding.** Run as part of its own file
against that tree, `14-grants-migration.test.sql` aborts at its **own line 130** with
`relation "public.user_roles" does not exist` — long before reaching assertion 50 — and emits
**no `not ok` at all**. D-37's silence, in the one place this plan was built to look. The
assertion was therefore extracted verbatim (predicate and description string unchanged) and run
against the same tree.

---

## The derived claim-helper population

| | Plan's M1 | Dispatch | **Derived** |
|---|---|---|---|
| call sites | 66 | — | **162** (158 literal-argument + 4 variable-argument) |
| files with calls / present | 9 of 12 | "all 12 of 12" | **17 of 24** |
| distinct fixture identities | 6 | — | **8** (`account_admin_a`, `admin_a`, `admin_b`, `candidate_a`, `candidate_a2`, `candidate_b`, `organization_a`, `super_admin`) |

M1 was stale by a wave and a half and the dispatch figure was wrong in a second way. **After:**
occurrences of the retired name across the estate = **0**; occurrences of the replacement = **167**
(≥ the derived 162, the difference being the declaration and its docblock). No call site was dropped
rather than converted.

---

## The backfill's derived call sites

162-06's SUMMARY says *"162-15 inherits **three** call sites, not two"*. Derived: **6 executable
invocations across 3 files**, of which the three outside `14-grants-migration.test.sql`'s own
assertion bodies are the three 162-06 meant.

| Site | Role | Disposition |
|---|---|---|
| `00-helpers.test.sql:234` | inside `set_test_user`, gated on a non-empty role array (162-06 deviation 1) | **removed** at Task 4; replaced by `test_seed_fixture_grants()` |
| `seed.sql:215` | D-19 authority for a `yarn db:reset` stack | **replaced** at Task 4 by the two grant rows it produced |
| `14-grants-migration.test.sql:130` | the fixture call driving the backfill-vs-oracle image comparison | **retired** at Task 5 with the mapping-oracle class |
| `14-grants-migration.test.sql:302` | a second call inserts zero (idempotency) | retired with subject |
| `14-grants-migration.test.sql:887` | two constructed `auth_user_id` owners | retired with subject |
| `14-grants-migration.test.sql:992` | a further call still inserts zero | retired with subject |

Plus 1 declaration, 1 generated copy and 11 name references — 19 reference sites in all, every one
gone or regenerated.

---

## The four reddened-set sizes and the two containment verdicts

Containment counts a pre-plan reddened description as **still caught** if either the same description
reddens after **or** its file is reported as not completing after — because both mutations abort whole
files, and an abort is a louder detection than one assertion failing, not a weaker one. *(Instrument
refinement, recorded as a deviation.)*

**Final verdict, taken after the deletion:**

| Mutation | Pre-plan | Post-plan | Verdict |
|---|---|---|---|
| **fail-open** (every fixture identity collapsed to global-admin authority) | **165** | **158** | **containment holds** |
| **fail-closed** (no fixture identity gets an authority row at all) | **18** | **17** | **containment holds** |

The only exceptions are **9 members, every one belonging to `13-shim-parity.test.sql`** — the file
this plan deletes, whose subject (`public.has_role`, `public.can_access_project`) is gone and whose
every class is dispositioned by name. **Containment holds for every assertion whose file survives
this plan.**

An interim measurement at Task 4 showed 4 further exceptions, all assertions *about the backfill*,
which was still present at that commit and still supplied `14-grants-migration` its authority from
the surviving role rows. The verdict was deferred to Task 5 and **all four are caught** there.

The fail-open direction is the dangerous one, and the strengthened third parameter is why it got
*stronger*: under the mutation the two-source agreement assertion **raises**, aborting two files
outright, where the pre-plan tripwire let them run and fail assertion by assertion.

---

## The policy count

| | Before | After | Delta |
|---|---|---|---|
| `public` + `storage` | **104** | **102** | **−2** |
| `public` only | 89 | **87** | −2 |

Zero policies added, zero expressions changed, every survivor byte-identical in name, command, `qual`
and `with_check`. The two removed, by name:

- `public/user_roles/auth_admin_read_user_roles`
- `public/user_roles/service_role_manage_user_roles`

B1(a)'s claim that the drop is what makes the policy count honest, discharged as a recorded pair of
numbers.

---

## The pgTAP estate

| | Before | After | Delta |
|---|---|---|---|
| files | 24 | **24** | 0 (`13-shim-parity` out, `24-legacy-removal` in) |
| assertions run | **1092** | **978** | **−114** |
| declared (`plan(N)` sum) | 1083 | 969 | −114 |

Every unit of the −114 tied by name to a dispositioned class:

| Movement | Count |
|---|---|
| `13-shim-parity.test.sql` deleted, 16 classes dispositioned | −105 |
| `14-grants-migration.test.sql` 50 → 18, 9 classes retired with their subject | −32 |
| `24-legacy-removal.test.sql` created | +21 |
| `07-rpc-security.test.sql` 31 → 33, the two branches the existing five never entered | +2 |
| `10-schema-migrations.test.sql` five blocks re-expressed as inverses | 0 |
| `03-anon-read.test.sql` § 4 re-expressed in place | 0 |
| **net** | **−114** |

The full class-by-class disposition record — subject, disposition, successor or reason — is in
`${TMPDIR}/162-15/dispositions.txt`. Every class citing a successor was discharged against a **live**
one: the file named, its declared `plan()` read from the tree, observed passing in the same run
(`03-anon-read` 59, `10-schema-migrations` 90, `12-user-can` 45, `14-grants-migration` 18,
`24-legacy-removal` 21).

**Kept and strengthened rather than retired:** the retired-claim-confers-nothing grid. Moved verbatim
into `24-legacy-removal.test.sql` § 7, where it is asserted in a world with **no table behind the
shape at all** — which is when it matters most, not least.

---

## The reproduced load failure

Removing the two enum declarations alone and nothing else, regenerating, and resetting:

```
Applying migration 00001_initial_schema.sql...
ERROR: type "user_role_type" does not exist (SQLSTATE 42704)
Hint: This type may be defined in a schema that's not in your search_path.
reset exit with the enums removed: 1
```

The object named is **`user_role_type`**, raised applying the concatenated schema, at the retired
table's own column declaration. An abort, not a red test — which is what makes the dependency census
a build-integrity control. Tree restored, reset green, `git status` empty over `apps packages scripts
tests`.

---

## The email helper, proven rather than argued

Full four-column output over **all 8 fixture identities × both fixture projects = 16 rows**, captured
before the rewrite through the retired path and after it, compared as whole files: **byte-identical**,
including the 3 rows carrying a resolved candidate name and the 3 carrying a resolved organization
name. Signature unchanged (`p_project_id uuid, p_user_ids uuid[], p_template_body text,
p_template_subject text`); both execute grants still `true,true`.

---

## The access-token hook's surviving grant (T-162-03-05)

`GRANT USAGE ON SCHEMA public TO supabase_auth_admin` was declared **once**, inside the block this
plan deletes. 162-03's repetition beside the grant map was **confirmed present before the original
was deleted** (an assertion in the deletion script, not an assumption), and asserted after, on the
applied database:

```
auth-admin schema USAGE / auth-admin read grants / authenticated read / anon read
= true,true,false,false
```

Committed as `24-legacy-removal.test.sql` § 4 so it is asserted on every run, not only in this one.

---

## The tracked-source reference set

| | Before | After |
|---|---|---|
| files naming a retired object | **52** | **20** |

Every one of the 20 carries an explicit disposition, and the set was measured **identical in both
directions** against that reviewed list.

**Deferred to 162-17 (4 — the whole deferral set):**

- `.claude/skills/database/SKILL.md` (19 hits)
- `.claude/skills/database/rls-policy-map.md` (30)
- `.claude/skills/database/extension-patterns.md` (9)
- `.claude/skills/database/schema-reference.md` (7)

**Retained (16), each with a recorded reason** — the confers-nothing assertions that must name the
retired claim *shape* to assert anything; the anti-regression `qual NOT LIKE '%shim%'` assertions
whose search pattern *is* the retired name; the re-expressed inverses whose descriptions name their
former subjects; the pgTAP-shadowing hazard notes, which are about pgTAP's own `has_role`; and one
security-history comment recording a fixed forged-token defect.

---

## The E2E triple

| | |
|---|---|
| **passed** | **155** |
| **failed** | **0** |
| **did not run** | **0** |
| flaky / skipped / retries | 0 / 0 / 0 |
| run directory | `tests/e2e-runs/162-15-wave6` |
| duration | **633 794 ms (634 s)** — inside the phase's 627–651 s baseline |
| posture | `load_at_start=15.51/12.67/10.29`, `cpu_count=14`, `containers_running=24`, `frontend_port=5273`, preflight failures 0 / successes 1 |

Green at a load average above the core count, and still inside the baseline band — so this run is not
an environment sample needing attribution.

## The gate chain

Each invoked on its own, its exit status read directly, never through a pipe.

| Gate | Result |
|---|---|
| `yarn typecheck` | **0** — 23/23 |
| `yarn lint:check` | **0** — after the repair below |
| `yarn test:unit` | **0** — 25/25 |
| `yarn workspace @openvaa/supabase test:db` | **0** — `Files=24, Tests=978, Result: PASS` |
| `yarn db:lint:sql` | **0** — 0 errors, 3 pre-existing FK-index warnings |

---

## The closing census beside the opening one

```
OPENING  policies=104 (public 89)  estate-files=24  assertions-run=1092
         relation=PRESENT  retired-types=2  retired-functions=present
         retired-helper-occurrences=171  vocabulary-files=52

CLOSING  relation=ABSENT  retired-types=0  retired-functions=0 (NONE at any signature)
         policies=102 (public 87, delta -2)  retired-helper-occurrences=0
         replacement-occurrences=167  estate-files=24  assertions-run=978
         vocabulary-files=20 (4 deferred + 16 retained, set-identical both directions)
         migrations/*.sql = 1, parity gate green
         packages/supabase-types/src/database.ts names none of the five (D-18)
```

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] The plan's red-set instrument cannot fail; replaced and proven**

- **Found during:** Task 1
- **Issue:** `run_estate()` greps `^not ok` from `supabase test db`, which emits only prove's summary. Both red-sets return empty whatever the suite does — flagged in the plan as D-32 and re-confirmed here.
- **Fix:** direct `psql -f` for raw TAP, plus a per-file `declared − ok − notok` control (D-37) so an aborting variant is reported rather than scoring zero. **Established by observing it red twice** — once on an explicit failure, once on a transaction abort that emitted no `^not ok` at all. Recorded in full above.

**2. [Rule 1 — Bug] The plan's prescribed control for the new organization-branch assertion reddens nothing**

- **Found during:** Task 3
- **Issue:** the plan calls for observing the assertion red against a variant whose candidate-before-organization preference order is **reversed**. Measured: that reversal reddens **nothing** — **zero identities** in the seed and **zero** in the fixture hold both a candidate-kind and an organization-kind entity grant, so the order arbitrates an empty population. A decorative guard (the D-34 class 162-12 found).
- **Fix:** substituted a control that probes what the assertion actually guards — the entity-kind filter narrowed from `('candidate','organization')` to `('candidate')`. Under it the new assertion is the **one** assertion in the file that reddens: 32 ok, 1 not ok. The false claim was removed from **both** source comments rather than left standing, and replaced with the measured fact.
- **Commit:** `0034dcce7`

**3. [Rule 3 — Blocking] `21-entity-organization.test.sql` reaches the email helper without `set_test_user`**

- **Found during:** Task 3
- **Issue:** it is the one caller in the estate that calls `resolve_email_variables` off `create_test_data()` alone, so no authority write fires for it and TEST C's positive half went red the moment the lookup was re-pointed. Named by no plan.
- **Fix:** the impersonation is performed and immediately undone, purely for its write.
- **Commit:** `0034dcce7`, then `0f0592d98`

**4. [Rule 3 — Blocking] `create_test_data()` cannot write the grant rows — 162-06's first deviation, re-measured**

- **Found during:** Task 4
- **Issue:** the plan's design is *"`create_test_data()` writes its grant rows from that helper"*. Re-measured rather than trusted: `12-user-can.test.sql` calls `create_test_data()` and then builds its **own** thirteen-row grant fixture with a plain `INSERT` carrying no `ON CONFLICT`, five rows byte-identical to this map's — so the write violates `grants_user_scope_target_role_key` and aborts that file — and three more of its identities would gain a **second** grant, silently redefining what they were chosen to represent.
- **Fix:** the write stays in `set_test_user` where 162-06 put it; only the mechanism changed. `12-user-can` passes an empty array at every call, so it never fires inside that transaction. That file is untouched.
- **Commit:** `0f0592d98`

**5. [Rule 1 — Bug] The fixture write must be whole-fixture, not per-identity**

- **Found during:** Task 4
- **Issue:** a per-identity write is tidier and wrong. The backfill it replaced wrote the grants of **every** identity holding a role row, so the first impersonation seeded all eight. `07-rpc-security.test.sql` impersonates `admin_a` and then asks about `organization_a`; that assertion went red because the identity being **read about** had never been impersonated.
- **Fix:** `test_seed_fixture_grants()` writes all eight; `test_seed_identity_grants(text)` serves the files that stage authority deliberately.
- **Commit:** `0f0592d98`

**6. [Rule 1 — Bug] The fixture write needs the postgres role**

- **Found during:** Task 4
- **Issue:** the backfill was `SECURITY DEFINER`, so it wrote `public.grants` from whatever role the session was in. A plain insert runs with invoker rights, `public.grants` REVOKEs ALL from `authenticated`, and **14 of 24 estate files** died with `permission denied for table grants` on the second and every later `set_test_user` call.
- **Fix:** the role is switched exactly as `reset_role()` does, for the write and nothing else — deliberately **not** by making a fixture function `SECURITY DEFINER`, which would let an `authenticated` session grant itself authority (the reasoning 162-05 recorded for the oracle, applied to its successor).
- **Commit:** `0f0592d98`

**7. [Rule 3 — Blocking] `23-nominations-write.test.sql` depends on 162-05's oracle, which reads the retired table**

- **Found during:** Task 5
- **Issue:** six call sites of `test_grants_from_user_roles`; the file aborted with `function test_grants_from_user_roles(uuid) does not exist`. Named by no plan — that file post-dates the planning census.
- **Fix:** converted to `test_seed_identity_grants('<name>')`, which reads the same one authority map.
- **Commit:** `92fd09280`

**8. [Rule 1 — Bug] A live, already-stale E2E assertion against the retired table**

- **Found during:** Task 5
- **Issue:** the plan's **M9 is wrong at source** — it records five non-`apps/supabase` references and three skill documents. Derived: **52 files** and **four** skill documents, including a live E2E-harness surface the plan names nowhere: `findData('user_roles', …)` in `candidate-bank-auth-journey.spec.ts` and `.from('user_roles').delete()` in `candidate-bank-auth.spec.ts`. The **first was already wrong**: `identity-callback` stopped writing that table at 162-06 and writes `public.grants` through `entityGrant.ts`, so the assertion had been false since then — unobserved because that journey runs only under `tests/IDURA-TEST-RUNBOOK.md`, not in the standard suite.
- **Fix:** both re-pointed at `public.grants`; the whole `tests/tests/**` prose surface swept.
- **Commit:** `92fd09280`

**9. [Rule 2 — Correctness] Stale present-tense prose asserting deleted mechanisms still exist**

- **Found during:** Task 5
- **Issue:** ten comment lines across five pgTAP files stated as present fact that a policy "is still gated on `can_access_project`", that "the backfill fires", that an identity "has role=organization, scope_type=organization". A comment saying a mechanism still exists is exactly how the next reader concludes it does.
- **Fix:** re-expressed against the mechanism that answers the question now, or moved into the past tense where it records history. Comments that are **live anti-regression patterns** or **security history** were retained and recorded as such in the census.
- **Commit:** `92fd09280`

**10. [Rule 3 — Blocking] `packages/supabase-types/src/database.ts` contaminated with pgTAP helpers**

- **Found during:** Task 5
- **Issue:** `db:types` was run after the estate, so the generated types carried `set_test_user`, `set_test_grants` and `set_test_retired_claim`. The base version carries none.
- **Fix:** regenerated in the correct order, `db:reset → db:types → test:db`. 42 lines removed.
- **Commit:** `92fd09280`

**11. [Rule 3 — Blocking] `yarn lint:check` was ALREADY RED at the base SHA**

- **Found during:** Task 6
- **Issue:** 10 comment-hygiene violations. **Five of them are in `tests/scripts/e2e-run.sh:205–209` and are byte-identical to the base SHA** — introduced by 162-14's own outlier-diagnosis commit `dd244d3b5`. The wave-5 close shipped with a red `lint:check`.
- **Fix:** five own violations repaired; the five pre-existing ones joined too, because the wave-6 gate this plan must pass cannot be observed at all while they stand. Zero-risk comment-line joins. **Recorded here rather than absorbed silently**, because the finding is about 162-14's gate and not about this plan's diff.
- **Commit:** the wave-6 close commit, `docs(162-15): close wave 6 …` — the only commit of this plan that cannot cite its own hash.

### Instrument refinement (recorded, not a bug in the tree)

**[Containment comparison] An aborted file is a detection, not a loss of coverage**

The plan compares sets of reddened description strings. Both mutations abort whole files, which emit
no `not ok` at all. Read literally, an abort would score as "every assertion in that file stopped
catching the mutation" — the same blindness D-37 describes, in a new spelling. Containment therefore
counts a pre-plan reddened description as still caught if **either** the same description reddens
**or** its file is reported as not completing. Strictly stronger, and it is what let the fail-open
verdict be read correctly: the strengthened third parameter *raises* under that mutation.

### Broken gates in the plan's own text (D-34)

| Gate | Defect | Repair |
|---|---|---|
| `run_estate()` red-set | cannot fail; raw TAP never reaches the grep | replaced, red-first-observed (deviation 1) |
| organization-branch control | reverses a preference order that arbitrates an empty population | replaced with the narrowing control (deviation 2) |
| drop-statement sweep | `grep -rnE 'DROP (TABLE\|TYPE\|FUNCTION\|POLICY)' schema/` — **measured 15 pre-existing `DROP POLICY IF EXISTS` lines at the base SHA**, so the gate was already failing before this plan touched anything | narrowed to drops **naming a retired object**: NONE |
| vocabulary sweep | demands the surviving set contain only `.claude/skills/` paths — unsatisfiable while the same plan demands every retirement carry a recorded reason and every confers-nothing assertion name the claim shape it is about | set identity against a reviewed census in which all 20 surviving files carry an explicit disposition; measured identical in both directions |
| `24-legacy-removal` assertion 15 | "the generated types name none of the five" — a pgTAP file cannot read a TypeScript file | expressed as a catalogue statement instead (no column anywhere is of a retired type); the types file is checked in the Task 6 shell gate |

### M-facts found false at source

| Fact | Plan said | Measured |
|---|---|---|
| **M1** | 66 call sites, 9 of 12 files, 6 identities | **162 call sites, 17 of 24 files, 8 identities** |
| **M2** | 393 declared assertions in eleven files | **1083 declared across 24 files** (the estate grew through waves 3–5) |
| **M8** | three comment references to the shims under `schema/` outside their own file | **seven**, all comments, executable count 0 |
| **M9** | five non-`apps/supabase` references, three skill documents | **52 files, four skill documents**, including two live E2E queries |

M3 (the email helper as an unowned dependency), M4, M5, M6, M7 and M10 were all confirmed true.

---

## Known Stubs

None.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or trust-boundary schema change: this
plan only removes, plus one lookup re-pointed with its output proven unchanged.

---

## Handoffs

**To 162-16 — discharged obligation.** The retired vocabulary is **gone before the visibility-model
change begins**, so that plan absorbs **one** model change and not two. `public.user_roles`,
`public.user_role_type`, `public.role_scope_type`, `public.has_role` and
`public.can_access_project` are absent from `pg_class`, `pg_type` and `pg_proc` at any signature on a
freshly reset database. No `published` column, partial index or policy term was touched.

**To 162-17 — the whole deferral set.** Four documents under `.claude/skills/database/` still describe
the retired vocabulary — `SKILL.md`, `rls-policy-map.md`, `extension-patterns.md`,
`schema-reference.md`. They are this plan's **entire** deferred set and are swept **once**, there, on
the churn reasoning 162-08, 162-10 and 162-14 each recorded. **The plan's M9 named three; there are
four.** 162-17 also inherits the 16 retained references, each of which has a recorded reason and
should be left alone.

**To brief § 6.1.** `public.resolve_email_variables` resolves **two** of the **four** entity kinds
the grant map admits — `candidate` and `organization`, not `faction` or `alliance` (Task 2 Q3 =
approved). The retired vocabulary had no member for either, so the retired body could never resolve
one; this is a **live limitation preserved, not a new one**. An organization-, faction- or
alliance-scoped user still receives a partly unresolved email. Closing it belongs to the phase that
builds organization, faction and alliance onboarding.

**To 162-14's own record — a finding, not a handoff.** `yarn lint:check` was red at commit
`dd244d3b5`, the tree 162-14 closed wave 5 on, through five comment-hygiene violations in
`tests/scripts/e2e-run.sh` that that commit introduced. Repaired here because the wave-6 gate is
unobservable otherwise.

---

## Code Review Checklist

Checked against this plan's diff (`dd244d3b5..HEAD`):

| Item | Result |
|---|---|
| Changes solve the stated problem | Yes — K1's shim window closed, all five objects absent from the catalogue |
| OWASP Top 10 | The one authority-relevant change is a **removal**; the surviving privilege posture is asserted as `true,true,false,false` on the applied database and committed as `24-legacy-removal.test.sql` § 4 |
| Code style guide | Prettier clean over every changed path; `lint:check` exits 0 |
| No `any` | **0** added `: any` in TypeScript |
| No repeated code | The fixture authority map lives in **exactly one** function; the two seeding entry points share it |
| New entities documented | `test_user_grants`, `test_seed_identity_grants`, `test_seed_fixture_grants` and `24-legacy-removal.test.sql` each carry a full docblock stating the measurement behind their shape |
| Repo docs updated | `apps/supabase/README.md` admin-gate description re-expressed against the `grants` claim |
| Tracking events | N/A — no user-facing function added |
| Svelte components | N/A — none touched |
| Errors handled and logged | The agreement assertion follows `validate_nomination()`'s D-23 message discipline: it names the identity, both arrays and the plan |
| Failing checks troubleshot | All five gates plus the full E2E suite green; the pre-existing `lint:check` failure diagnosed to its source commit and repaired |
| Shared dependencies unaffected | Nothing outside `apps/supabase/`, `packages/supabase-types/`, `scripts/` and `tests/` changed; **0** `package.json` dependency lines moved |
| WCAG A/AA, keyboard, screen reader | N/A — no UI surface touched; E2E a11y gates green |
| Developers'/Publishers' guides | No affected entry — the retired objects are not described there |
| Clean, linear commit history | 4 commits, linear, conventional prefixes, one per task boundary |
| **Supabase**: RLS on new tables | N/A — no table created |
| **Supabase**: `(SELECT auth.uid())` / `(SELECT auth.jwt())` | N/A — no policy created or edited; the policy set moved by exactly −2 removals |
| **Supabase**: new SECURITY DEFINER sets `search_path = ''` | N/A — **0** new SECURITY DEFINER functions (the one diff hit is a comment) |
| **Supabase**: pgTAP BEGIN/ROLLBACK + `create_test_data()` | `24-legacy-removal.test.sql` follows both |
| **Supabase**: correct assertion patterns | `hasnt_table` / `hasnt_type` / `is` over `pg_proc` for absence, `is_empty` for the grid, `throws_ok` with a pinned SQLSTATE where it was already pinned |
| **Edge Functions** | Not modified. `resolve_email_variables`'s four-argument signature and both execute grants asserted unchanged, so the `send-email` function that calls it by named argument is unaffected |

---

## Self-Check: PASSED
