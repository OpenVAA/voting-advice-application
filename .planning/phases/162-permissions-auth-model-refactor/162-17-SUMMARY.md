---
phase: 162-permissions-auth-model-refactor
plan: 17
subsystem: supabase-authz
status: complete
tags:
  [rls, permissions, criterion-2, criterion-6, criterion-7, D-27, D-36, D-37, evidence, documentation-sweep]

requires:
  - '162-01 … 162-16 — every plan of the phase; this one asserts the estate they produced'
  - 'public.user_can / public.grant_role_permissions (162-04) — the matrix, encoded once'
  - 'public.storage_path_can / storage_path_is_public (162-14) — the two storage mechanisms'
  - 'public.user_has_account_grant (162-09) — the grant-existence predicate'
  - 'grants_user_scope_target_role_key, grants_entity_scope_target_type_check (162-03)'
  - 'nominations_entity_parent_contest_key (162-12)'
  - 'apps/supabase/supabase/functions/*/entityGrant.ts (162-06) — the parameterised grant write'
provides:
  - 'apps/supabase/scripts/lint-schema.mjs check 9001 — the PERMANENT read/write non-collapse gate'
  - 'apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql (41) — section 3.3 as the policies enforce it, and D-36 eight-assembly guard'
  - 'apps/supabase/supabase/tests/database/26-uniqueness-keys.test.sql (31) — both keys by name, both directions'
  - 'apps/supabase/supabase/tests/database/27-parent-nomination-queue.test.sql (15) — section 11.5 measured, not quoted'
  - 'apps/supabase/supabase/tests/database/28-storage-table-parity.test.sql (21) — criterion 6 widened'
  - 'apps/supabase/supabase/functions/{invite-candidate,send-email,identity-callback}/flowConformance.test.ts (36) — criterion 7 standing gates'
  - '162-FLOW-CONFORMANCE.md — criterion 7 written check, 23 verdict rows, 2 findings + 1 closed'
  - '162-NEGATIVE-CONTROL-LEDGER.md — 85 rows, F4(a) register'
  - '.claude/skills/database/rls-policy-map.md — rewritten from the applied database'
affects:
  - 'the CI job for db:lint:sql (phase 163) now also runs check 9001'
  - 'ROADMAP criteria 2, 5, 6 and 7'

tech-stack:
  added: []
  patterns:
    - 'Reach is TRANSITIVE: a recursive closure over pg_proc.prosrc, because policy expressions name wrappers rather than user_can'
    - 'A census line printed on EVERY run and floored against a catalogue-derived count, so silence cannot mean an empty instrument'
    - 'Exemption lists as named constants carrying their ratified reason inline'
    - 'Control counts as PLAN − PASSED (D-37), from raw TAP read per file through psql'
    - 'Relative AND absolute guards over a repeated assembly, because a relative guard is blind to a uniform change'

key-files:
  created:
    - apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
    - apps/supabase/supabase/tests/database/26-uniqueness-keys.test.sql
    - apps/supabase/supabase/tests/database/27-parent-nomination-queue.test.sql
    - apps/supabase/supabase/tests/database/28-storage-table-parity.test.sql
    - apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
    - apps/supabase/supabase/functions/send-email/flowConformance.test.ts
    - apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts
    - .planning/phases/162-permissions-auth-model-refactor/162-FLOW-CONFORMANCE.md
    - .planning/phases/162-permissions-auth-model-refactor/162-NEGATIVE-CONTROL-LEDGER.md
  modified:
    - apps/supabase/scripts/lint-schema.mjs
    - .claude/skills/database/rls-policy-map.md
    - .claude/skills/database/SKILL.md
    - .claude/skills/database/schema-reference.md
    - .claude/skills/database/extension-patterns.md
    - .planning/phases/162-permissions-auth-model-refactor/162-PATTERNS.md

decisions:
  - 'Q1 = (A): the guard is re-expressed against the permission literal, because F2(a) names two functions neither of which exists'
  - 'accounts REMOVED from the collapse allow-list by measurement — its derived read set is empty'
  - 'storage_path_can ADDED to the ratified mechanism-helper list by measurement, with its reason'
  - 'The matrix vectors are measured at the arguments the policies pass, paired with a STRUCTURAL assertion that the policies pass them — because permissive policies OR, most policies name several members, and some conjoin row state'
  - 'The storage pairing grid runs on four FRESH un-nominated entities, because the fixture hierarchy makes the two layers disagree for a correct reason'
  - 'The D-36 eight-assembly guard is BOTH relative and absolute; the absolute half is what closes the live gap'

metrics:
  duration: one session
  completed: 2026-09-17

actuals:
  tokens: 64835
  tasks: 8
  commits: 9
  plan_head_before: d1bd80a8ba97e924f357aae82d74c66a0e075526
---

# Phase 162 Plan 17: Standing Conformance Guard, Flow-Conformance Record and the Documentation Sweep Summary

The phase's last plan: a permanent build gate that fails when read and write collapse back into one
predicate, four pgTAP files widening the estate across § 3.3's matrix, three standing flow gates,
criterion 7's written check with its findings named, an 85-row negative-control register, and the
documentation sweep eight consecutive plans deferred by name.

**Every figure below was measured on this machine. Where a figure this plan inherited disagreed with the
tree, the disagreement is reported rather than restated.**

---

## Task 2 — the ratified answers

### Q1 = **(A)** — re-express the guard against the permission literal

F2(a)'s literal wording names `can_edit_project`, which was never built (the phase replaced the
split-predicate design with one `user_can` carrying a 23-member verb), and `can_access_project`, which
162-15 deleted. Both halves are unsatisfiable, so the guard implements F2(a)'s **actual requirement**
against what the phase built. **D-27 is the named precedent.**

| Collapse | A two-string comparison | Check 9001 |
|---|---|---|
| both policies re-predicated onto one byte-identical expression | RED | RED (control C3) |
| the write policy pointed at the read permission, where the read predicate carries a public disjunct so the strings still differ | **GREEN — misses it** | **RED** (control C1) |
| both predicates replaced by calls to a third wrapper reaching no permission literal | **GREEN — misses it** | **RED** (control C2) |

### Q2 — both allow-lists, ENTRY BY ENTRY, each with its reason

Four lists, 21 approved entries, one refused. All derived fresh from `collapse-baseline.txt`,
`permission-census.txt` and the transitive-reach census; none carried forward from the plan's
illustrative entries. Full text at `${TMPDIR}/162-17/allowlists.txt`; the guard's own three lists carry
the same reasons inline as source comments.

**LIST 1 — same-permission (collapse) exemptions. Derived: exactly ONE table intersects.**

| Entry | Verdict | Reason |
|---|---|---|
| `public.admin_jobs` on `project.edit_questions` | **APPROVED** | § 3.2 enumerates no separate admin-jobs READ member. S-4 was **ticked** by the operator selecting `project.edit_questions`, and 162-11 put all three `admin_jobs` policies on it. The job queue's read and its write are ONE capability, held by whoever administers the project's questions; the intersection is the matrix's construction, not a collapse. |
| `public.accounts` | **NOT APPROVED — REMOVED** | C-11 cited it as known-legitimate *"(§ 3.2 enumerates no separate read member — see S-3)"*. **That justification is withdrawn.** 162-09 gates `authenticated_select_accounts` on grant EXISTENCE via `user_has_account_grant(uuid)` while `admin_update_accounts` keeps `account.edit_settings`, so the derived read set for `accounts` is **empty** and the two no longer name the same thing. **It does NOT appear in the derived collapse baseline, so there is no finding against 162-09's implementation** — the code matches that plan's own recorded Q1. |

**LIST 2 — the permission members no policy enforces. Derived: 6 of 23.** Each reason names where the
member IS enforced, because a member enforced nowhere is a cell of the matrix that grants nothing.

| Member | Reason |
|---|---|
| `account.manage_admins` | **APPROVED** — grant ADMINISTRATION. `public.grants` carries no user-facing policy at all: its only two are `auth_admin_read_grants` (`TO supabase_auth_admin`) and `service_role_manage_grants` (`TO service_role`). Issuing or revoking a grant is not an RLS-gated operation in this phase; the member is read by `grant_role_permissions`. |
| `project.manage_editors` | **APPROVED** — the same. Editor administration writes `public.grants`, which no user-facing policy governs; `000-enums.sql:28` states the member exists to name that capability in the matrix. |
| `entity.invite_children` | **APPROVED** — the same, at entity scope. `000-enums.sql:28` names it in one breath with `project.manage_editors` as its entity-scope equivalent. |
| `entity.edit_immutable` | **APPROVED** — enforced by the TRIGGER `public.enforce_entity_immutability`, which compares OLD and NEW. A row-level policy predicate cannot see OLD, so the member is not expressible as a policy; 162-13 built and control-ran that trigger. |
| `entity.confirm` | **APPROVED** — the same trigger, plus `303-column-grants.sql`'s column grants, for the same OLD-versus-NEW reason. |
| `nomination.confirm` | **APPROVED** — enforced by the TRIGGER `public.enforce_nomination_confirmation`, which 162-12 built and asserted. |

**LIST 3 — named mechanism helpers a policy may reach instead of a permission literal. 5 approved.**

| Helper | Reason |
|---|---|
| `project_open_for_voters` | **APPROVED** — 162-08's project-level anon visibility helper, the single definition of that sub-rule, called directly from each entity SELECT assembly under D-36. |
| `entity_has_confirmed_nomination` | **APPROVED** — 162-08's nomination-level anon visibility helper, same arrangement. |
| `storage_path_is_public` | **APPROVED** — 162-14's storage visibility helper, D-27's named exception: anon carries no `grants` claim, which `user_can` denies by construction, so the public-read storage policy cannot route through the authority mechanism. |
| `storage_path_can` | **APPROVED — ADDED BY MEASUREMENT AT TASK 3.** 162-14's storage AUTHORITY helper, the eleven-segment mapping ratified at that plan's Task 2 Q2. **The measurement that forced the entry:** no storage policy names `user_can` in its own `pg_policies` expression — all fourteen call `storage_path_can`, which calls `user_can` internally — so without this entry the reaches-neither clause reddens thirteen CORRECT policies. Recorded as an entry-by-entry addition with its reason, exactly as C-11 requires, rather than as a silent widening after the guard's first red. |
| `user_has_account_grant` | **APPROVED** — D-30 / 162-09's grant-EXISTENCE predicate for the `accounts` read. It asks "is there ANY grant on this account or on a project it owns", which `user_can` cannot express because `user_can` takes a permission. |

**LIST 4 — policies that legitimately ask no authority question. 8 approved.**

| Policy | Reason |
|---|---|
| `public.constituency_group_constituencies.anon_select_…` | **APPROVED** — a pure join-table row whose visibility is DELEGATED to its parent `constituency_groups` row through an EXISTS. The parent's own policy makes the decision; re-asking it here would be a second copy of that rule. |
| `public.constituency_group_constituencies.authenticated_select_…` | **APPROVED** — the same delegation, at authenticated. |
| `public.election_constituency_groups.anon_select_…` | **APPROVED** — the same join-table delegation to `constituency_groups`. |
| `public.election_constituency_groups.authenticated_select_…` | **APPROVED** — the same delegation, at authenticated. |
| `public.feedback.anon_insert_feedback` | **APPROVED** — feedback submission is deliberately open to everyone; `WITH CHECK` is `true` by design and no authority question is asked on the write. The READ and DELETE sides DO ask one (`feedback.read` / `feedback.manage`) and are not exempt. |
| `public.feedback.authenticated_insert_feedback` | **APPROVED** — the same open-submission design, at authenticated. |
| `public.grants.auth_admin_read_grants` | **APPROVED** — granted `TO supabase_auth_admin` only: the Access Token Hook's own read of the table it projects. A system role, not a user; the user authority model cannot be asked of it. |
| `public.grants.service_role_manage_grants` | **APPROVED** — granted `TO service_role` only, which bypasses row-level security by definition. The Edge Functions write grants through it; gating it on a permission literal would be decoration. |

### Q3 — the three inherited gaps: **RECORD ONE, CLOSE TWO**

Each disposition verified against the owning plan's SUMMARY **before** anything was written.

| Gap | Disposition | Verified against |
|---|---|---|
| **Account read** | **CLOSED**, owned by **162-09** | `162-09-SUMMARY.md` lines 18, 33, 45, 102, 112–113, 312 — which record `user_has_account_grant(uuid)` as a named exception to the `user_can` routing rule and state in terms that *"the criterion-2 exemption for `accounts` is WITHDRAWN"*. Corroborated by the derived collapse baseline, in which `accounts` does not intersect. |
| **`admin_jobs`** | **RECORDED**, mapping `project.edit_questions`, owned by **162-11** | `162-11-SUMMARY.md` lines 18, 39, 82–95 (S-4, the one box the operator ticked). The mapping was not revisited. |
| **Bulk send** | **CLOSED**, owned by **162-06** — the gate **was** written | `162-06-SUMMARY.md` lines 28, 79, 185 **and** `send-email/index.ts:116-134` in the tree, where line 116 names `project.edit_entities` as the operator's ruling and lines 130–134 implement the holder shapes with the project arms comparing `g.target_id` to the request's project. Recorded in `162-FLOW-CONFORMANCE.md` as a **closed conformance item citing 162-06**, not as a GAP. |

**The enum was not widened.** `pg_enum` reports **23** members for `grant_permission`; there is no 24th.
S-3(A) stands and nothing here contradicts 162-03's ratified vocabulary.

---

## The guard's census triple, on a clean run

```
[9001] census: policies examined: 102, tables partitioned: 19, permission members: 23
       (row-level-security tables in public+storage: 29)
```

**Printed on every run**, clean or dirty, and floored against the 29 row-level-security tables the
catalogue reports — a floor derived from the estate rather than written as a literal, and scoped to
`public`+`storage` independently of the census's own schema filter so it cannot move with it.

⚠ **Finding against the orchestrator's brief:** it states *"`public` carries **102** policies"*. Derived:
`public` = **87**, `storage` = **15**, sum = **102**. The figure 102 is the public+storage TOTAL, not the
public count. Recorded, not adjusted.

---

## Every control, by label, with its count

All counted **`PLAN − PASSED`** per D-37, from raw TAP read per file through `psql` — never by counting
`not ok` lines, which reads zero both on a passing estate and on a variant that ABORTS. Every plant was
applied to the APPLIED DATABASE or to a scratch copy in `$TMPDIR`; **no planted violation reached a
tracked file**, and `git status --porcelain` is empty outside `.planning/` at every task boundary.

### The guard (`lint-schema.mjs` check 9001)

| Label | Exit | Outcome | String comparison, run alongside |
|---|---|---|---|
| **C0** | **0** | **GREEN** on an untouched `db:reset` estate; census 102 / 19 / 23 | — |
| **C1** | **1** | **RED**, naming it: *public.questions: read and write permission sets intersect on 'project.read_structure'* | **GREEN** — byte-identical to the untouched baseline (only the pre-existing ratified `admin_jobs` pair); **no new collapse found** |
| **C2** | **1** | **RED**, naming both: *public.elections: policy admin_update_elections [UPDATE] / authenticated_select_elections [SELECT] reaches neither a permission literal nor a named mechanism helper* | **GREEN** — byte-identical to the baseline, **no new collapse found** |
| **C3** | **1** | **RED** under the identical-predicate clause, naming both pairs, plus the intersection on `project.edit_structure` | GREEN → RED (this is the one case it also catches) |
| **C4** | **1** | **RED**, naming the unresolvable exemption: *user_has_account_grant: exemption resolves to no function in pg_proc* | — |
| **C5** | **1** | **RED on the floor**: *0 policies examined is at or below the 29 row-level-security tables in public+storage* | — |

**C1 and C2 are this plan's central evidence.** They are the two collapses F2(a)(b)'s simpler form would
have passed, and the string comparison was run beside each and recorded staying green.

### D-36's eight-assembly guard — **BOTH perturbations observed RED, with counts**

| Label | Perturbation | Estate exit | Reddened | Which |
|---|---|---|---|---|
| **G8A** | drop `project_open_for_voters` from **ONE** policy (`anon_select_factions`) | **1** | **4** of 1010 declared | **2 are this plan's new file** — assertion 34 (RELATIVE: the four anon assemblies are no longer identical) and assertion 38 (ABSOLUTE: not all eight call `project_open_for_voters`), and it NAMES the diverging policy. The other 2 are `16-anon-visibility.test.sql`'s, as D-36's revert recorded. |
| **G8B** | drop `confirmed` from **ALL FOUR** authenticated assemblies at once | **1** | **2** of 1010 declared | **BOTH are this plan's new file** — assertion 37 (ABSOLUTE: all eight name the `confirmed` column) and assertion 36 (RELATIVE: each authenticated assembly carries its own table's anon assembly verbatim). |

**G8B is the live gap, and it is closed.** D-36's executor measured that exact perturbation against the
**pre-162-17** estate at **exit 0, all 923 assertions green**, while the authenticated no-grant visible set
DOUBLED on every entity table. A guard comparing the eight only to each other reproduces that blind spot
exactly and would still pass it; the **absolute** half is what reddens. Both halves are derived from
`pg_policies` — the count of entity SELECT policies is asserted at exactly 8 — so a ninth policy cannot
appear un-guarded.

**Both were re-observed red after the Task-8 comment reflow**, so the counts describe the committed tree.

**D-21's normalised-identity assertion no longer covers the SELECT family under D-36.** That is an
accepted cost of the ruling, recorded in the file's own banner and here, not silently re-derived.

### The matrix grid

| Label | Plant | Reddened |
|---|---|---|
| **M1** | `user_can` answers **true** for every member | **28** of 41 (passed 13) — the deny half, in bulk |
| **M2** | `user_can` answers **false** for every member | **27** of 41 (passed 14) — the allow half, in bulk |
| **M3** | the grid's project **opened** for voters | **4** flipped of 41 (passed 37) — and all four are the disjunctive-read vectors. **This is the measurement proving the closed-project precondition load-bearing rather than decorative**: with the project open the public disjunct admits callers holding no authority at all. |

### The uniqueness keys and the queue

| Label | Plant | Reddened |
|---|---|---|
| **K1** | the nomination key replaced by a **plain `UNIQUE`** over the same columns | **7** of 31 — every REJECTION assertion falls, including all three NULL-parent cases and the shape assertion. The NULLS clause is what does the work, not the column list. |
| **K2** | the **parent column dropped** from the key, NULLS clause intact | **6** of 31 — **EXCLUSIVELY the ADMITTING assertions** plus the two shape assertions. **Not one rejection moved.** That is precisely the regression § 11.7 says a rejection-only suite would miss. |
| **K3** | the requested-parent key **renamed in the fixture row** | **3** of 15 — the presence assertion, the queue assertion and the candidate confirmation refusal. The queue keys off THE NAME. |

### Storage

| Label | Plant | Outcome |
|---|---|---|
| **S1** | `storage_path_can` accepts the verb argument and **DISCARDS** it | **RED, 1** of 21 — the PROJECT-scope read-but-not-write refusal, which is exactly the assertion written to catch a discarded verb. The eight pairing arrays stay green here and that is **recorded rather than smoothed over**: for the four un-nominated entities read and write coincide for every identity, so a verb-blind policy moves both halves of every pair together — which is why the separability identities exist beside the grid. |
| **S2** | `storage_path_can` asks **project** scope where **entity** scope belongs | **RED, 4** of 21 — the four ENTITY-EDITOR pairing arrays, named by identity |
| **S3** | **both halves of every pair** replaced by an authority-predicate call, run under the **same S2 divergence** | **GREEN, 0 reddened** — under the exact divergence the real form reddens 4 on. **This is the evidence for the two-call prohibition, and it is a measurement rather than an argument.** |

### The flow gates

| Label | Plant | Reddened |
|---|---|---|
| **F1** | the derived vocabulary reduced to ONE non-member, in a scratch copy | **5** of 36 — all three vocabulary-size assertions plus `send-email`'s two membership assertions. The membership checks are not vacuous under an empty vocabulary. |
| **F2** | one module's scratch source given `project.edit_everything`, not a member | **2** of 36, and both NAME the literal |

**F2 found a defect in the GATE rather than in the module.** The first attempt planted a literal
containing a digit and the gate did not see it: the literal regex accepted only `[a-z_]`. Widened to
`[a-z0-9_]` in all three gates and the control re-run before it was believed.

---

## The four pgTAP ordinals taken, and whether 24 was free

**24 was NOT free.** `apps/supabase/supabase/tests/database/24-legacy-removal.test.sql` exists — 162-15
created it under its own *"lowest free two-digit prefix"* rule in the same plan that deleted
`13-shim-parity.test.sql`, so the registry's rule and 162-15's disagreed exactly as this plan's flagged
assumption predicted.

**Ordinals taken: 25, 26, 27, 28** — the four lowest free prefixes **above the registry's maximum of 23**.
The free `13` was deliberately not taken: reusing a deleted file's ordinal is the collision the registry
was created to stop.

⚠ **Correction recorded:** the plan's `files_modified` names `24-matrix-conformance`,
`25-uniqueness-keys`, `26-parent-nomination-queue`, `27-storage-table-parity`. The files shipped are
`25-`, `26-`, `27-`, `28-`.

---

## The enforcement census

**17 of 23 members are enforced by at least one policy. 6 are not**, and all six are on the ratified list
with a reason (LIST 2 above): `account.manage_admins`, `project.manage_editors`, `entity.invite_children`,
`entity.edit_immutable`, `entity.confirm`, `nomination.confirm`.

Asserted in `25-matrix-conformance.test.sql` as a **standing two-directional set equality**, derived in
the file rather than read from a record — so a member that quietly stops being enforced reddens, and so
does one that quietly starts.

---

## The storage partition, and whether it agrees with 162-14

| Figure | Derived | 162-14 / D-27 |
|---|---|---|
| total storage policies | **15** | 15 |
| reach the AUTHORITY mechanism | **14** | "the derived total MINUS ONE" = 14 |
| reach a VISIBILITY helper and not authority | **1** (`anon_select_public_assets`) | 1, that policy by name |
| reach NEITHER | **0** | 0 |

**AGREEMENT. There is no discrepancy to report** between the derived partition and 162-14's corrected
truth line. The visibility-only member is asserted **by name**, so a policy moving between mechanisms
reddens even while the totals hold.

⚠ **But the instrument had to be repaired to see it.** **No storage policy names `user_can` in its own
`pg_policies` expression** — all fourteen call `storage_path_can`, which calls `user_can` internally. A
direct text match returns **0 authority / 15 reaching-neither against a CORRECT implementation**, which is
the exact failure class D-03 names. The plan's own Task 6 verify block did precisely that and was repaired
in place: reach is computed as a recursive closure over `pg_proc.prosrc`, in the test file and in check
9001 alike.

---

## The three flow findings, with owners and re-derivation verdicts

| # | Finding | Verdict on re-derivation | Owner |
|---|---|---|---|
| **F-1** | entity-type SELECTION is absent at the identity entry point | **OPEN** → recorded **DEFERRED** | brief **§ 6.1** (D-22, and 162-06's own exclusion) |
| **F-2** | the invite's redirect names a route the tree does not carry | **OPEN** → recorded **GAP** | a **standalone defect** — no plan in phase 162 owns it |
| **F-3** | bulk send gated on grant shapes § 3.2 enumerates no member for | **CLOSED** → recorded as a **closed conformance item** | **162-06**, which wrote the gate |

**Two findings, not the three the plan predicted**, and the third is recorded as closed rather than
deleted — which is what makes this a census rather than a confirmation.

- **F-1, measured:** `identity-callback/index.ts:313` passes `entityType: 'candidate'` at exactly one call
  site; `:310`'s own comment says the type "is named HERE and nowhere else in this function". No selection
  parameter, request field or branch exists. **Pinned in the gate**: the identity-callback flow gate
  asserts exactly ONE entity type on the whole path, so closing the gap reddens the assertion and says
  the DEFERRED row has expired.
- **F-2, measured:** `invite-candidate/index.ts:139` builds `${siteUrl}/candidate/complete-registration`;
  `find apps/frontend/src/routes -ipath "*complete-registration*"` returns nothing and the string occurs
  in exactly one file in the tree — that line. M7 / fact 18 is still true at this HEAD.
- **F-3, measured:** `send-email/index.ts:116` names `project.edit_entities` as the operator's ruling and
  `:130-134` implement the holder shapes with the project arms comparing `g.target_id`.
- **Residual carried, not closed:** `send-email`'s ACCOUNT-scope arm accepts an account admin without
  resolving which account contains the named project (162-06-SUMMARY.md:418, already filed to
  `.planning/WINDOWS.md`). Re-derived here and still present.

---

## The ledger

| | |
|---|---|
| declared row count | **85** |
| collected halves (17 sibling SUMMARYs + D-36's revert record) | 65 |
| halves measured in this plan | 20 |
| **`UNRESOLVED`** rows (carrying **no** outcome) | **45** |
| `RESOLVES` rows | 40 |
| rows carrying an outcome without an exit code, a command and a resolved log path | **0** |
| `UNRESOLVED` rows carrying an outcome | **0** |

**Why 45 are UNRESOLVED, stated plainly.** The sibling SUMMARYs recorded their reddened counts in prose
and tables; with the single exception of the E2E run directory, **none recorded a log path for the control
run itself**. Under this register's own rule that makes the row UNRESOLVED — the count is visible, the
evidence is not re-openable on this machine, the outcome cell stays empty. That is a finding about the
phase's **recording habit** rather than about any one plan, and the ledger says so in its own closing.

---

## pgTAP assertion totals

| | Before | After |
|---|---|---|
| declared `plan()` total across `tests/database/` | **969** | **1077** |
| `supabase test db` reported tests (incl. `00-helpers`' 9 smoke tests) | **978** | **1086** |
| files | **24** | **28** |

Per-file, for the four new ones: `25-matrix-conformance` **41**, `26-uniqueness-keys` **31**,
`27-parent-nomination-queue` **15**, `28-storage-table-parity` **21**. **Zero inherited pgTAP files were
modified.**

---

## The per-criterion coverage map

| Criterion | Asserted by | What this plan added |
|---|---|---|
| **1** — the `grants` table, scopes, roles, rights | 162-03 (table, enums, three named constraints); 162-04 (`user_can`'s eight answer vectors); 162-06 (backfill image, claim projection); 162-15 (fixture grant-set image) | Both `grants` constraints **by name** and in both directions — 162-03's recorded seam — plus the matrix asserted **through policies** |
| **2** — read separated from write, with a test that fails on re-collapse | 162-04 (the two strings unequal); 162-09 (four ways, on its seven tables) | **The PERMANENT structural guard over the WHOLE estate**, proven against the two collapses a string comparison passes |
| **3** — `is_child_nominee` the single mechanism | 162-04; 162-08; 162-12 (⚠ **MOVED**: 162-12 measured ONE wrapper call site where 162-08 predicted three) | Guard clause 3 generalises "no policy re-derives a hop" to a permanent gate over every policy |
| **4** — per-project settings, each branch exercised | 162-07 / 162-07b (the flags); 162-11 (the § 11.1 split, 2 reddened); 162-12 (the nomination lock) | Those three members' rows asserted for all nine identities at once |
| **5** — read grants behave as documented | 162-08 (the anon half); 162-09, 162-10, 162-11 (the authenticated half) | The grid's read rows consolidated, the four disjunctive-read vectors, and the eight-assembly guard |
| **6** — the storage paired assertion | 162-14 (the per-verb grid, control-run three ways) | **WIDENED** to every § 3.1 identity × 2 verbs × 4 entity types = 128 cells; the partition stated D-27-correctly and derived TRANSITIVELY |
| **7** — level-1 defined; the two flows checked | 162-01 (SPEC § 6); 162-06 (the implementation) | **The check itself** (⚠ **MOVED**: two findings, not three — bulk send is CLOSED on re-derivation) |

---

## The E2E triple

| | |
|---|---|
| **passed** | **155** |
| **failed** | **0** |
| **did-not-run** | **0** |
| duration | 10.8 m (~648 s) |
| exit | 0 |
| run directory | **`tests/e2e-runs/162-17-phase-close`** |
| preflight | 1 success, 0 failures |
| `env-posture.txt` | `load_at_start=9.73/12.27/9.68`, `cpu_count=14`, `containers_running=24`, `observed_workers=6`, `observed_retries=0`, `observed_flaky=0`, `observed_skipped=0` |

648 s sits inside the 627–651 s baseline band recorded by `162-14-E2E-OUTLIER-DIAGNOSIS.md`. Disk headroom
measured **64 GiB** before the run and again before the gate chain.

## The full gate chain

| Gate | Exit |
|---|---|
| `yarn typecheck` | **0** |
| `yarn lint:check` | **0** (comment-hygiene guard: **0 violations**) |
| `yarn typecheck:tests` | **0** |
| `yarn test:unit` | **0** (25 tasks) |
| `yarn workspace @openvaa/supabase test:db` | **0** — 28 files, 1086 tests, `Result: PASS` |
| `yarn db:lint:sql` | **0** — `No schema errors found`; 9001 census printed; 0 errors, 3 pre-existing warnings |
| `tests/scripts/e2e-run.sh` | **0** |

## Scope, against the recorded base SHA `d1bd80a8b`

| | |
|---|---|
| declarative schema files changed | **0** |
| `migrations/*.sql` | **1** file, **unchanged** |
| inherited pgTAP files modified | **0** |
| `package.json` dependency/devDependency lines moved | **0** |
| files changed outside `files_modified` + `.planning/` | **0** |
| `prettier --check` on this plan's SQL and TypeScript under `apps/supabase/` | **pass** |
| `.prettierignore` names `.planning/` and `.claude/` | **both asserted from the file** — so no evidence here rests on a formatter pass over a path the formatter skips |

---

## Deviations from Plan

### 1. [Rule 1 — Bug] The plan's ordinal is unusable: 24 is occupied

- **Found during:** Task 1.
- **Issue:** D-28's registry says the next free ordinal is 24; the tree carries
  `24-legacy-removal.test.sql`, created by 162-15.
- **Fix:** took 25–28, the four lowest free prefixes **above the registry maximum**, per the plan's own
  fallback rule. The free `13` was not taken.
- **Files:** the four new pgTAP files. **Commit:** `4c63a96c9`.

### 2. [Rule 1 — Bug] Task 6's verify block measured storage reach with a DIRECT text match

- **Found during:** Task 1, confirmed at Task 6.
- **Issue:** the plan's block greps storage policy expressions for `user_can`. No storage policy names it:
  all fourteen call `storage_path_can`. Against a CORRECT implementation the block reports
  **authority = 0, reaches-neither = 15** and fails — the exact class D-03 names.
- **Fix:** reach computed as a recursive closure over `pg_proc.prosrc`, in the test file and in check 9001.
  `storage_path_can` added to the ratified helper list with its reason (LIST 3).
- **Commits:** `298d949af`, `64d2995c1`.

### 3. [Rule 1 — Bug] Task 4's "one representative operation per member" is not satisfiable on this estate

- **Found during:** Task 4, by measurement.
- **Issue:** three properties of the estate make it unsatisfiable, each measured rather than argued:
  (1) **permissive policies are OR-ed** — `nominations` carries three INSERT policies, so a real insert
  measures the disjunction and never the one policy a derivation named; (2) **most policies name several
  members** — `authenticated_select_alliances` names `project.read_entities`, `entity.read_answers` AND
  `nomination.read`, and one outcome cannot answer for three rows whose § 3.3 cells differ; (3) **some
  policies conjoin row state** — `entity_insert_parent_nominations` adds six conjuncts beyond the
  permission.
- **Fix:** the 23 vectors are measured as `user_can` answers **through each identity's real session
  claim**, at exactly the `(scope, target)` arguments the representative policy passes — paired with a
  **structural** assertion, derived from `pg_policies`, that the policies pass those arguments. The
  composition carries the criterion and neither half is a function compared with itself. Four
  **disjunctive-read** vectors were added as the strongest policy-level statement available for the three
  members that occur only inside the entity SELECT disjunction. The derivation rule was refined to prefer a
  **discriminating** policy (naming exactly one member) and then the **narrowest scope**, both with their
  reasons recorded in the file. All 23 vectors match § 3.3 exactly.
- **Commit:** `1f6bdfe02`.

### 4. [Rule 1 — Bug] Task 6's pairing grid cannot agree on the fixture's own entities

- **Found during:** Task 6, observed as a red.
- **Issue:** `create_test_data()` nominates `candidate_a` and `faction_a` UNDER `org_a`'s nomination, so
  the organization editor reaches both through `is_child_nominee`. The table SELECT policy is a
  disjunction over three members while the storage policy asks exactly one, so the layers disagree for a
  reason correct on both sides and unrelated to criterion 6.
- **Fix:** the grid runs on **four fresh, un-nominated entities** created inside the transaction, which
  removes the third disjunct from both sides. The reason is written into the file's own banner.
- **Commit:** `64d2995c1`.

### 5. [Rule 1 — Bug] The separability refusals were written as `throws_ok` on an UPDATE

- **Found during:** Task 6.
- **Issue:** an UPDATE filtered to zero rows by row-level security raises **no error**, so the refusal
  never threw. Rewritten as INSERTs, whose `WITH CHECK` violation raises `42501` — 162-14's own form.
- **Commit:** `64d2995c1`.

### 6. [Rule 3 — Blocking] The counting instrument read `1..41` as `141`

- **Found during:** Task 4.
- **Issue:** `grep -oE '^1\.\.[0-9]+' | tr -dc '0-9'` strips the dots and yields `141` from `1..41`, so
  every control's `PLAN − PASSED` was inflated by 100.
- **Fix:** `sed 's/^1\.\.//'`. Every recorded count was recomputed afterwards.

### 7. [Rule 1 — Bug] This plan's own Task-3 commit violated the house comment-hygiene rule

- **Found during:** Task 8, by the gate chain — which is the gate chain working.
- **Issue:** `lint:check`'s comment-hygiene guard (D-A4, phase 152) reported **264** forced-line-break
  violations across the files this plan added. An automated reflow then wrongly joined comments inside the
  two **pre-existing** SQL queries in `lint-schema.mjs`, which the plan prohibits.
- **Fix:** `lint-schema.mjs` restored to its base SHA and check 9001 re-applied onto the pristine file; the
  remaining blocks reflowed by hand into the house single-line style. **The diff against the base SHA now
  carries ZERO removed lines — purely additive.** Controls **C1** and **G8B** were re-observed red
  afterwards, so the recorded counts describe the committed tree.
- **Commit:** `dd4fc0eeb`.

### 8. [Rule 2 — Missing critical functionality] The gate's literal regex did not accept digits

- **Found during:** Task 7, by control **F2**.
- **Issue:** the flow gates' permission-literal regex accepted only `[a-z_]`, so an out-of-enum literal
  containing a digit was invisible to the membership assertion.
- **Fix:** widened to `[a-z0-9_]` in all three gates, and F2 re-run before being believed.
- **Commit:** `85ae062aa`.

### 9. [Rule 2] `storage_path_can` added to a ratified allow-list

Recorded above under Q2 LIST 3. Added **by measurement, with a written reason**, exactly as C-11 requires
— not silently after the guard's first red.

---

## Phase-level findings — recorded, NONE closed here

This plan is prohibited from editing `ROADMAP.md`, `REQUIREMENTS.md`, `162-SPEC.md`,
`162-IMPLEMENTATION-BRIEF.md`, `162-PLAN-OUTLINE.md` or any sibling plan. Each finding names its exact
surface.

### 1. ROADMAP criterion 5's residual wording survives — **162-02 did NOT discharge it**

**Exact surface:** `.planning/ROADMAP.md`, § *Phase 162* → *Success Criteria* → item 5:

> *"Read grants behave as documented: a **published** project is readable by anyone; an **unpublished**
> project's non-entities are readable by any grantee, and its entities by the grantees themselves and
> their parents."*

`published` is the retired per-row publication vocabulary. 162-16 deleted the last of the ten flags that
answered that question, and the project-level flag is `open_for_voters`. **The criterion still names a
mechanism the phase removed.** 162-02's plan entry says it corrects "this entry and the PRESHIP-02 row
against the measured facts", and it did correct the storage census in its own bullet — but criterion 5's
text is unchanged at this HEAD. **Reported, not corrected.**

**Two further residual wordings in the same block, same class:**

- **Criterion 1** names roles *"`admin` / `owner` / `editor`"* — three. The phase shipped **two**
  (`grant_role_type` = `admin`, `editor`), per D-02 and `000-enums.sql:28`.
- **Criterion 2** names `can_edit_project`, which was never built, and `can_access_project`, which 162-15
  deleted. This is precisely what Q1 = (A) re-expresses.

### 2. The account-read enum gap (162-09) — **CLOSED**, and recorded as closed

Recorded above under Q3. `accounts` is out of the collapse allow-list; `user_has_account_grant` is a
ratified named exception on LIST 3.

### 3. The `admin_jobs` mapping and policy-naming inconsistency (162-11) — **RECORDED**

The mapping is `project.edit_questions` on all three `admin_jobs` policies (S-4, ticked). The
**consequence** is that `admin_jobs` is the one table in the whole estate whose read-permission set and
write-permission set intersect, and it is the only entry on check 9001's LIST 1. `admin_select_admin_jobs`
and `admin_delete_admin_jobs` additionally carry **byte-identical predicates**, which is the second clause
of check 9001; the same-permission exemption covers both, so the guard stays green. Not revisited.

### 4. The bulk-send gate with no matrix member (D-25) — **CLOSED**, recorded citing 162-06

Recorded above under Q3 and in `162-FLOW-CONFORMANCE.md` finding F-3. **The operator's ruling did not have
to make an unwritten gate real: the gate is written.**

### 5. The general nomination-to-entity project constraint 162-12 recorded as still open and nobody's

Carried forward unchanged. This plan asserts the `nominations` key and the parent-hierarchy rules by name
and in both directions, and adds nothing to that constraint's ownership.

### 6. Any discrepancy between 162-14's recorded storage figure and the derived partition — **NONE**

Derived 15 / 14 / 1 / 0; recorded 15 and "the derived total minus one, the single exception being
`anon_select_public_assets`". **They agree.** The instrument that measures it had to be repaired
(deviation 2), but the figures did not move.

### 7. The orchestrator brief's "102 policies in `public`"

Derived: `public` = 87, `storage` = 15, total = 102. The figure is the public+storage TOTAL. Recorded, not
adjusted.

### 8. **The PRESHIP-02 checkbox is NOT ticked by this plan, and no plan checkbox is flipped**

162-02 recorded the reason in its own prohibitions and it holds here: **a checkbox flipped before its gate
has run is a claim about a tree nobody measured**, and this plan's gate is the one that runs last. The
gate is now green — the tick is the operator's to make, on a record they can read.

### 9. A recording-habit finding about the phase as a whole

**Every one of the seventeen sibling SUMMARYs recorded its E2E run directory; not one recorded a log path
for a planted control.** That is why 45 of the register's 85 rows are UNRESOLVED. A future phase that wants
collected halves to carry outcomes must require the log path at the moment the control is run, not at the
moment the register is opened.

---

## Known Stubs

None. No stub, placeholder, hardcoded empty value or unwired data source was introduced. Every count in
this document was measured; no assertion in the four new pgTAP files or the three flow gates is
unexercised, and every one of the eighteen controls was observed in the direction it was written for.

## Threat Flags

None. This plan creates no network endpoint, no auth path, no file-access pattern and no schema change:
its whole output is one build-gate check, four test files, three test files and four documents.
`apps/supabase/supabase/schema/` is untouched, `migrations/` holds one unchanged file, and **0**
`package.json` dependency lines moved — the flow gates derive their vocabulary by reading the declarative
schema as text precisely so no workspace dependency is added from an evidence plan.

## Code Review Checklist

Checked against this plan's whole diff (`.agents/code-review-checklist.md`):

- **`any` avoided**: 0 occurrences of `: any` or `@ts-ignore` in the three new TypeScript files; the one
  `@ts-expect-error` is documented in place (it exercises the runtime half of the entity-type vocabulary).
- **No repeated code**: the three flow gates share a shape, not an implementation — each lives beside its
  own module per M5, and the duplication of `derivePermissionVocabulary` is the same deliberate per-function
  duplication `entityGrant.ts` and `jwtSegment.ts` already carry, for the same stated reason (Supabase
  treats each function directory as its own deployment unit).
- **Everything documented**: every new file carries a header stating what it asserts and why, and every
  exemption entry carries its reason inline.
- **Repo documentation updated**: that is Task 8's whole subject.
- **pgTAP transaction boundary**: all four new files are `BEGIN` … `create_test_data()` … `ROLLBACK`.
- **pgTAP assertion patterns**: `throws_ok`/`throws_like` for expected errors, `lives_ok` + `is` for silent
  row-level-security denial, `ok`/`is`/`is_empty`/`cmp_ok` for positives.
- **RLS items**: not applicable — this plan creates no table and no policy.
- **Edge Function items**: not applicable — this plan changes no Edge Function module; it adds gates that
  assert the admin-verification and grant-write properties the checklist names.
- **Failing checks troubleshot**: deviations 6, 7 and 8 are exactly that, each repaired at source.
- **Accessibility / keyboard / screen-reader**: not applicable — no user-facing surface changes. The E2E
  suite, which carries the axe gate, is green at 155/0/0.
- **Commit history clean and linear**: eight commits, one per task, conventional prefixes.

## Self-Check: PASSED

All nine created files exist on disk; all six modified files exist and differ from the base SHA; all eight
commit hashes resolve in `git log`.
