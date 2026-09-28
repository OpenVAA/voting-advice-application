# Phase 162 — Checkpoint Decisions

**Written:** 2026-09-16 · **Status:** ANSWERED and FOLDED IN 2026-09-16 · **Items:** 50 across 18 plans

Every blocking checkpoint in phase 162, collected so they can be answered in one pass instead of
eighteen interruptions during execution.

## How to answer this document

**The standing convention applies: an unticked box selects its `★ RECOMMENDED` option.** Tick a box
only to *overrule* the recommendation. A document returned with nothing ticked is a complete answer,
and it is the expected one — the recommendations are the planners' own, each derived from a
measurement recorded in its plan.

Where an item asks for a **value** rather than a choice (a cap number, a column name, a list), the
recommended value is given in `code`. Strike it through and write yours beside it to overrule.

Items are grouped by what the answer *touches*, not by plan number, because several plans ask the
same question from different sides. Each item names the plans it unblocks.

**§ 1 is different from the rest.** Those five answers change `162-SPEC.md`, which 162-01 writes as
the fixed reference all eighteen other plans check against. They ripple. The rest are local.

---

## § 1 — Structural: the vocabulary every other plan encodes

### S-1 · Two role levels or three? *(162-01 Task 1)*

Is PRESHIP-02 criterion 1 amended to two levels — `admin` and `editor`, no `owner`?

**Why it's asked:** the amendment rests on the unticked-box convention, while the position it
overrules is carried by two documents of higher standing — ROADMAP criterion 1 and the PRESHIP-02 row
both name three roles, and PRESHIP-02 is marked **blocking ship**. K4 is marked locked and derives
the level-1 definition from criterion 1's three-role sentence.

- [ ] **(A) Two levels — `admin` and `editor`** ★ RECOMMENDED — matches `162-USER-RIGHTS.md`'s eight
      user types exactly, which span these two only. Editor-management stays expressible as
      `project.manage_editors` and `entity.invite_children`, so a third role would carry nothing the
      matrix does not. An unused member of a security enum is untested surface.
- [ ] **(B) Three levels — criterion 1 and K4 stand verbatim** — no verifier has to reconcile a
      deviation. But `OrganizationEditor` would have to be an `owner` despite its name, and §§ 3.1
      and 3.3 (both canonical) must be re-derived rather than reproduced.

**Unblocks:** all 19. **If you overrule:** 162-01 halts and 162-03, 162-04 and 162-10 … 162-14 are
replanned — § 3.3 gains an eighth column and § 3.1 a new grant row. State which grant row `owner`
occupies and which permissions it carries that `admin` and `editor` do not.

### S-2 · Ratify the 23 permission members *(162-03 Task 2)*

Are the 23 names derived from § 3.2 the final membership of `public.grant_permission`?

**Why it's asked:** enum ordinals are persisted, a member cannot be removed or renamed without a
type rewrite, and from wave 4 these names are string literals inside every policy in the estate.
Adding is cheap; removing and renaming are not.

- [ ] **(A) Ratify the 23 as derived** ★ RECOMMENDED — `162-USER-RIGHTS.md` lists 20 atomic rights;
      the three additions each have an authority: `project.edit_project_settings` /
      `project.edit_app_settings` are § 11.1's split, `entity.confirm` is § 11.2,
      `nomination.create_parent` is § 11.5. Earlier drafts saying "20" and "22" were stale and are
      corrected; § 3.2's table is the authority.
- [ ] **(B) Amend — one or more names change first** — costs nothing now and a great deal after
      wave 4. An accepted change edits the brief and the SPEC first, then re-runs the derivation.

**Unblocks:** 162-03, and every policy plan after it.

### S-3 · The three matrix gaps — record or close? *(162-17 Q3, raised by 162-09, 162-11, D-25)*

Three tables need a permission § 3.2 does not enumerate. Found independently by three planners.

**Why it's asked:** § 3.2 is canonical and closed at 23. Widening a security vocabulary from the
phase's *final* plan means adding a member with no wave left to test it.

| Gap | Raised by | What it means |
|---|---|---|
| **Account read** | 162-09 | No account-read member distinct from `account.edit_settings`, so `accounts` SELECT and UPDATE must name the same literal — reproducing on that one table the read/write collapse criterion 2 exists to end. |
| **`admin_jobs`** | 162-11 | Governed by no member at all. All three policies currently gate on the single legacy predicate. |
| **Bulk send** | D-25 | `send-email` gates an authorisation decision on grant shapes no member describes. |

- [ ] **(A) Record all three as findings; do not widen the enum** ★ RECOMMENDED — each becomes a
      named entry in `162-SPEC.md` and `162-FLOW-CONFORMANCE.md` with brief § 6.1 as owner, and
      `accounts` is listed in 162-17's collapse allow-list *with its reason*.
- [ ] **(B) Add a 24th (and 25th) member now** — closes the gaps properly, but changes § 3.2 after
      S-2 ratifies it and after wave 4 has converted 80 policies against the 23.

**Unblocks:** 162-09, 162-11, 162-17. **Note:** this is the item I'd most expect you to overrule.
Two independent planners hitting the same wall is usually a sign the vocabulary is short, not that
the tables are odd.

**NOTE**: The permissions for these are:

- account read = any role on account or its projects
- bulk send = project.edit_entities

### S-4 · `admin_jobs` — which member governs it? *(162-11 Q1)*

Given S-3(A), `admin_jobs` must map onto an existing member.

**Why it's asked:** the table holds the initiating operator's address in `author`, plus the LLM
job's prompt, response and progress in `input`, `output`, `messages`.

- [x] **(a) All three policies take `project.edit_questions`** ★ RECOMMENDED — the jobs exist to edit
      questions and both features terminate in the question custom-data RPC. Holder set is Root,
      Account, ProjAdmin, ProjEditor and **✗ for all four entity columns** — one project editor wider
      than today. No entity user gains read of the operator's address or the LLM prompt.
- [ ] **(b) SELECT takes `project.read_structure`; INSERT/DELETE take `project.edit_questions`** —
      **this discloses.** `project.read_structure` is ✓ in all four entity columns, so every
      candidate and organization editor would read the operator's address and the LLM prompt. It
      also reddens the existing `candidate_a cannot SELECT admin_jobs` assertion.
- [ ] **(c) All three take `project.edit_structure`** — identical holder set to (a), so
      behaviourally indistinguishable; differs only in meaning, and the meaning is worse.

**Unblocks:** 162-11. **If (b):** type "acknowledged" — an existing negative control is rewritten and
entity users gain read of the job records.

### S-5 · F2(a)'s guard cannot be written as worded *(162-17 Q1)*

F2(a) specifies a guard comparing `can_edit_project` against `can_access_project`. Neither exists at
the end of the phase: the first was never built, the second is deleted by 162-15.

- [ ] **(A) Re-express against the permission literal** ★ RECOMMENDED — implements F2(a)'s actual
      requirement ("fails if the two collapse back into one predicate") against what the phase built.
      Catches both collapses a string comparison passes, including the third-shared-predicate case.
      D-27 is the precedent: keep a ticked option's spirit when its literal wording is unreachable.
- [ ] **(B) Assert the two functions' absence, keep only the identical-predicate clause** — closest
      to the literal text that is satisfiable at all, but both collapses in the plan's table pass it.
      A gate whose green is uninformative.
- [ ] **(C) No guard; rely on 162-09's pgTAP assertions** — F2(a)(b) is exactly this and its own text
      rejects it: a plan-time assertion does not fail when a *future* refactor re-collapses them.

**Unblocks:** 162-17.

---

## § 2 — One-way preconditions

### O-1 · Has any database run migrations 00002–00008? *(162-02b Task 2)*

Does the 2026-09-15 no-published-database ruling still hold today?

**Why it's asked:** seven tracked migration files and a golden-signature fixture are about to be
deleted. The parity guard's own docblock calls deleting migration files *"the most history-destructive
act available"* and declines the fold on that ground, saying it was not the author's choice to make.
It is yours. Git retains the bytes; it does not retain the ability to roll a deployed database back
stage by stage.

- [ ] **(A) Proceed — the ruling holds** ★ RECOMMENDED — delivers § 8.8(a) and § 11.3 as ruled, and
      removes the guard's larger self-documented blind spot before the 97-policy rewrite.
- [ ] **(B) Halt — a database somewhere has run these** — name it. The phase is replanned around
      E1(a)'s numbered-migration sequence, which is a different shape, not a variation.

**Unblocks:** 162-02b and every schema plan. **Anything hedged is treated as halt.**

### O-2 · The claim retirement is irreversible within the phase *(162-06 Q1)*

From the commit that changes the hook, every issued token carries `grants` and no retired key, and
both `*_legacy_claim` functions plus both dispatch branches are deleted in that same commit.

**Why it's asked:** any consumer not converted in that plan fails closed. The measured consumer set
is **not** the documented one — `send-email` is an unrecorded authorisation gate (D-25), and
`adminJobsAuthorization.ts` does not exist.

- [ ] **(A) Approve the retirement; 162-05's obligation is discharged here** ★ RECOMMENDED
- [ ] **(B) Emit the retired key alongside the new one for the rest of the phase** — this is A2(c),
      it contradicts K1, and 162-06 stops rather than building a third mechanism.

**Unblocks:** 162-05, 162-06, 162-15.

### O-3 · Delete `300-auth-tables.sql` once both plans have emptied it? *(162-16 Q1)*

162-15 removes the role table, its index, its RLS quartet and its blanket REVOKE; 162-16 removes the
column-adding statements and the partial indexes. Neither alone empties the file; both together do.

- [ ] **(a) Delete the file** ★ RECOMMENDED — § 11.4's rule is that a schema file is where a concern
      is explained and enforced, and a file with no concern left is not one.
- [ ] **(b) Keep it with a header only** — the diff stays a content removal, but leaves a file in a
      declarative tree that declares nothing.
- [ ] **(c) Keep it and move something into it** — a file move inside a comment-sweep commit; reject
      unless Task 1 finds the `grants` table somewhere surprising.

**Unblocks:** 162-16. **If (a):** every `Depends on` header naming the file is corrected in the same
commit.

---

## § 3 — The authority predicate

### A-1 · `user_can`'s signature *(162-04 Q1)*

`public.user_can(p_scope grant_scope_type, p_target_id uuid, p_permission grant_permission)` and
`public.is_child_nominee(p_parent_type entity_type, p_parent_id uuid, p_child_id uuid)`.

**Why it's asked:** 97 policies will encode this argument list. Reordering afterwards is a 97-site
edit against a security predicate.

- [ ] **(A) Approved as stated** ★ RECOMMENDED — the asked object needs no type because identity is a
      uuid and the hierarchy resolves the type; the child-nominee parent *does* need one, because
      `nominations` stores four separate FK columns and the parent column has to be picked.
- [ ] **(B) Alternative** — write out the argument list in full.

**Unblocks:** 162-04 and every policy plan.

### A-2 · Which permission does `is_child_nominee` gate? *(162-04 Q2)*

**Why it's asked: the sources disagree and the disagreement is a fail-open risk.** § 3.3's legend
admits a cell where `own` extends to child nominees, but no printed cell is so noted; § 3.4's third
row and `162-USER-RIGHTS.md` both say the child hop grants basic data and **not answers**.

- [ ] **(D) `nomination.read`, any entity grant** ★ RECOMMENDED — satisfies § 3.4 and
      `162-USER-RIGHTS.md` simultaneously: *"read contents and related entities basic (not answers
      unless public) data"*. Gives the hop a real user without widening answer access.
- [ ] **(A) `entity.read_answers`, organization grants only** — a party manager reading their
      candidates' answers is coherent, but it contradicts § 3.4 and the operator's own wording, and
      it is the permissive reading.
- [ ] **(B) No child branch in `user_can` at all** — fail-closed; `is_child_nominee` still ships and
      is still used by 162-08, 162-12 and 162-17.

**Unblocks:** 162-04, 162-08, 162-12, 162-17. Costs one `IF` branch either way.

### A-3 · `user_can` encodes the matrix, not row state *(162-04 Q3)*

Row-state conjuncts — `lock_nominations`, `open_for_voters`, the confirmation flags — are conjuncts
of the *policies*, not members of the matrix.

- [ ] **(A) Approved** ★ RECOMMENDED — forced anyway: none of those columns exists until 162-07, so a
      lock conjunct inside the function cannot be written in wave 1 at all. § 3.3's `own, unless
      locked` cells read as `own` here, with `AND NOT locked` landing in 162-12's policy.
- [ ] **(B) State conjuncts belong inside `user_can`** — a different signature and a different wave;
      162-04 stops rather than guessing.

**Unblocks:** 162-04, 162-08, 162-12.

### A-4 · The transitional window *(162-05 Q1)*

Between 162-04 and 162-06 no real JWT carries a `grants` claim, so a shim reading only `user_can`
would deny every authenticated caller across all 80 policies.

- [ ] **(A) Exclusive dispatch on the claim's presence; legacy bodies moved verbatim; a pgTAP
      biconditional ties their existence to the hook** ★ RECOMMENDED — the fallback cannot outlive
      162-06. **Records the obligation 162-06 inherits:** delete both functions and both branches in
      the same commit as the hook change.
- [ ] **(B) Fold 162-06's backfill and hook change into 162-05** — re-cuts a wave boundary and
      produces one plan spanning the database, the frontend and an Edge Function.
- [ ] **(C) No shim needed — no real caller reaches the affected policies** — rejected by
      measurement, not argument: ~393 pgTAP assertions and 12 of 42 E2E spec files authenticate
      through the hook and read via the legacy predicate.

**Unblocks:** 162-05, 162-06.

### A-5 · `has_role`'s widening posture *(162-05 Q2)*

**Why it's asked:** § 3.3 is hierarchical — no permission is held by a lower column and denied to a
higher one — so **no single `user_can` call can express "at this level and no higher"**. This is
structural, not a shortcut. `can_access_project` *is* exactly expressible (it equals
`user_can('project', X, 'project.edit_project_settings')`, covering 76 of 78 call sites); `has_role`
is not.

- [ ] **(A) Accept the characterised widening, asserted as an exact set** ★ RECOMMENDED — 7 predicted
      cells of 45, derived by an independent oracle and asserted in both directions, so a new
      widening cell reddens and a disappeared one reddens too. Every deviating cell is proven
      absorbed by a row-set differential. The shims are demolished in 162-15, so it has an end date.
- [ ] **(B) Exact complement shims** — identical answers on every input, not merely every reachable
      one. Costs a second `user_can` call plus an entity-to-project lookup **per row** on the two
      hottest SELECT policies, and a double-negative in a security predicate.
- [ ] **(C) Leave `has_role` on the legacy claim entirely** — looks smallest, **produces an outage**:
      after 162-06 those 12 call sites answer `false` for everyone until waves 3–4, six of them on
      `accounts`.

**Unblocks:** 162-05 and waves 3–5. Available at any point in waves 2–5 at the stated cost.

### A-6 · The untranslatable call shape *(162-05 Q3)*

`has_role(R, NULL, NULL)` asks *does this caller hold role R anywhere*; `user_can` cannot ask without
a target.

- [ ] **(A) Raise a named exception** ★ RECOMMENDED — measured to have **zero executable call sites**,
      so the exception is unreachable from any policy, and 162-05 halts if that stops being true.
      Answering `false` would be a silent narrowing nothing catches.
- [ ] **(B) Deny instead** — record the reason.

**Unblocks:** 162-05.

### A-7 · The `test_user_roles()` replacement's call shape *(162-15 Q1)*

- [ ] **(A) Same call shape and argument position; `set_test_user` keeps its three-argument list**
      ★ RECOMMENDED — renames one token per site across **66 sites in 9 of 12 files**; the
      alternative drops a parameter and rewrites every call.
- [ ] **(B) Alternative** — describe it.

**Unblocks:** 162-15. Either way the parameter's name changes, so the declaration is preceded by an
explicit drop of the exact three-argument signature.

### A-8 · The two transitional biconditionals *(162-15 Q2)*

- [ ] **(A) Retire both, replaced by unconditional absence assertions per side** ★ RECOMMENDED —
      strictly stronger: two `hasnt_*` assertions catch either half resurrecting independently, where
      a biconditional passes when both return together. 162-06's is **observed red first** under
      either answer.
- [ ] **(B) Keep both verbatim, both sides permanently false** — nothing an operator installed is
      removed, but both become permanently vacuous: assertions that look like guards and guard
      nothing, in a plan whose whole subject is removing a mechanism that looked live and was not.

**Unblocks:** 162-15.

### A-9 · What do the two app-entry gates become? *(162-06 Q2)*

**Why it's asked: this decides who reaches the inside of two applications, and one reading is
fail-open.** The retired constants were role *names*; the new claim carries
`(scope, target_type, target_id, role)` and there are only two roles, so `admin` alone does not say
which door. A grant shape outside § 3.1's eight-row mapping — an entity-scope grant with role
`admin` — is admitted by the table's CHECKs and given the **empty** permission set by the matrix.

- [ ] **(A) Shape pairs: admin door = `{global, account, project}` × `admin`; candidate door =
      `entity` × `editor`** ★ RECOMMENDED — exactly § 3.1's eight rows, split where the matrix already
      splits. Every shape that opens a door carries a non-empty permission set, and every shape that
      carries none opens nothing. The entity-scope admin shape is denied **by construction** rather
      than by a comment. Both constants keep their `satisfies` clause, so a vocabulary change stays a
      compile error.
- [ ] **(B) Role only — any `admin` grant opens the admin door, any `editor` the candidate door** —
      **fail-open in one direction and wrong in the other.** An entity-scope admin grant would open
      the admin app for a principal the matrix gives nothing to; and a **project editor** — who holds
      seventeen permissions including every app-settings and question right — would be sent to the
      *candidate* app, because their role is `editor`.
- [ ] **(C) Permission-based — the gates ask for a permission literal** — most faithful to § 3.3, but
      the claim carries *grants*, not permissions, so the frontend would have to evaluate the matrix
      client-side: a second copy of § 3.3 outside the one function 162-04 built to hold it, and it
      would be the copy that drifts.

**Unblocks:** 162-06. `TEST_ADMIN_ROLE` in the E2E harness is typed off `ADMIN_ROLES`, so
`yarn typecheck:tests` is where a mismatch surfaces.

### A-10 · How far does the entity-type generalisation reach in wave 2? *(162-06 Q3)*

**Why it's asked:** D-21 says the generalisation *"should be applied as widely as possible"*, while
`162-CONTEXT.md` defers entity-type selection and the other three entity types' creation paths to
§ 6.1 **by name**. The line between those two instructions is written nowhere.

- [ ] **(A) The grant write is entity-type parameterised; entity creation stays candidate-only**
      ★ RECOMMENDED — delivers D-20 and D-21 without building § 6.1. The grant write moves into an
      extracted module taking `(entityType, entityId)`, with a hand-built fake asserting the written
      shape for each of the four types **and the throw on failure** — so D-20's abort is observable in
      `yarn test:unit` rather than inferred from source text. Adding organizations in § 6.1 becomes a
      second call site, not a control-flow change.
- [ ] **(B) Full generalisation now — selection and creation paths for all four types** — it is
      § 6.1's scope by name, needs an entity-type field in two request contracts, a per-type column
      map and a UI that offers the choice, none of which exists. Pulled into a blocking-ship security
      refactor it would be the largest untested surface in the phase.
- [ ] **(C) Leave the entity type hardcoded at the grant site** — smallest diff, but D-20 and D-21 are
      both undelivered and the required abort has no unit-testable home, because `index.ts` cannot be
      imported by vitest (it resolves remote Deno specifiers).

**Unblocks:** 162-06; 162-10, 162-12 and 162-14 inherit the posture through D-21.

**Accepted cost of (A):** the module accepts three entity types no caller passes yet, so three of its
four branches are exercised only by its test.

---

## § 4 — What the public sees

### V-7 · The three visibility helper signatures *(162-08 Q1)*

`project_open_for_voters(uuid)`, `entity_has_confirmed_nomination(entity_type, uuid, uuid)` and
`nomination_entities_confirmed(uuid)` — all boolean, all `STABLE SECURITY DEFINER SET search_path = ''`.

**Why it's asked: the obvious inline form does not work, and that is measured rather than argued.**
Two probes run in rolled-back transactions against the live database: an inline
`EXISTS … FROM public.projects` in an anon policy returned **0 rows for every caller** (because
`projects` has no anon policy), while the `SECURITY DEFINER` form returned the whole table; and the
entity/nomination pair written inline raised **`infinite recursion detected in policy for relation
"candidates"`**.

- [ ] **(A) Approved as stated** ★ RECOMMENDED — "reuse `is_child_nominee`'s path" is taken to mean
      same file, same four-FK matching idiom, same hardening, and **no policy anywhere holding a
      `nominations` sub-select** — not literal reuse, because that function answers *is X nominated
      under Y*, not *is X publicly nominated*, and 162-04 ratified its signature as fixed. The third
      argument exists because `nominations` carries its own `project_id` and nothing forces it to
      agree with its entity's — without it, an entity in an open project could be published by a
      nomination in a closed one.
- [ ] **(B) Alternative** — write out the signatures in full.

**Unblocks:** 162-08, 162-10, 162-14.

### V-1 · What "backfilled `true`" means *(162-07 Q3)*

**Why it's asked:** D2 carries a free-text operator note reading **"No backfills for any data"**, and
the standing convention is that free text beats a box. D2(a), D-15 and D-19 together require the
backfill this plan is built on.

- [ ] **(A) Creation-path values, not a migration** ★ RECOMMENDED — § 10.2 removes the migration-time
      backfill because no database has been published, and keeps the local seed-time one because a
      reset stack must not be blank. Four paths derived: `seed.sql`, `ensureProject`, `bulkImport`'s
      per-table default, `create_test_data()`.
- [ ] **(B) The note forbids the seed-time values too** — state what it was meant to forbid. 162-07
      stops rather than guessing; **guessing wrong here renders the voter app empty three plans on**.

**Unblocks:** 162-07, 162-08. Note `lock_nominations` must **not** be seeded — it ships inert.

### V-2 · How far does public transitivity reach? *(162-08 Q2)*

- [ ] **(A) One hop — the nomination's own linked entity** ★ RECOMMENDED — the CHECK guarantees
      exactly one entity FK per row, so *"every entity that nomination links"* is one entity.
      Transitivity still happens **per row**: an unconfirmed party's own nomination fails its own
      policy and is invisible. Keeps a recursive CTE out of the hottest read path.
- [ ] **(B) The parent chain too** — stricter, but hides confirmed candidates because of a state that
      is not theirs, which is the "too strict, blank list" failure.

**Unblocks:** 162-08, 162-12, 162-17.

### V-3 · What does "linked entity confirmed" mean? *(162-08 Q3)*

§ 11.2's clause says *readable*; its gloss says `confirmed`. `candidates` has a second readability
conjunct (terms of use) the gloss does not mention.

- [ ] **(A) Fully anon-readable, terms of use included** ★ RECOMMENDED — makes the nomination policy
      and the entity policy agree exactly. Closes the residual where a nomination names a candidate
      the caller cannot read — which `get_nominations` compensates for *at the application layer*,
      itself a parallel implementation.
- [ ] **(B) `confirmed` alone** — the literal gloss, one column, but leaves the two disagreeing on
      one table and leaves the application-layer filter load-bearing.

**Unblocks:** 162-08, 162-16.

### V-4 · Do `app_settings` and the join tables come inside the gate? *(162-08 Q4)*

- [ ] **(A) All three inside the gate** ★ RECOMMENDED — § 3.4 lists settings first among the
      structure an anon reader may see. **Consequence nothing in the tree can catch: a closed project
      returns the anon caller no settings row at all**, so the voter app must render that state, and
      every seeded project is open.
- [ ] **(B) `app_settings` stays ungated** — a second visibility mechanism, recorded as such.

**Unblocks:** 162-08, 162-11.

### V-5 · Do the structure SELECTs keep a public disjunct? *(162-09 Q3)*

- [ ] **(A) Keep it, re-expressed against 162-08's helper** ★ RECOMMENDED — criterion 5 says a public
      project is readable by **anyone**; the existing predicate implements it and an existing
      assertion calls it `by design`. Otherwise an authenticated caller sees strictly *less* than an
      anon one — including a freshly-identified user between the identity callback and their grant.
- [ ] **(B) A single authority call, no public disjunct** — the tightest reading of § 3.4's table,
      but reddens an existing assertion and breaks sign-up, which reads structure before any grant.

**Unblocks:** 162-09, 162-10, 162-11.

### V-6 · Where is the public-visibility rule composed? *(162-10 Q1)*

- [ ] **(A) One function, called by four anon + four authenticated policies + 162-08's helper**
      ★ RECOMMENDED — "is this entity publicly visible" exists in exactly one expression. The only
      option under which D-21's normalised-identity assertion covers the SELECT family. 162-08's grid
      re-runs unchanged as the neutrality proof, and a deliberately broken variant reddens it.
- [ ] **(B) One function, authenticated policies only** — touches nothing 162-08 proved, but ends the
      phase with two spellings of one rule that drift independently.
- [ ] **(C) Inline in the four authenticated policies** — eight copies; the option the phase's own
      goal sentence rules against.

**Unblocks:** 162-10, 162-14, 162-17. **Cost of (A):** one primary-key read per row on the hottest
query, gated at Task 5 against a recorded before-timing.

---

## § 5 — Who may do what

### P-1 · The two account-tier population changes *(162-09 Q2)*

- [ ] **(A) Take both as the matrix states them** ★ RECOMMENDED — `admin_update_accounts` **widens**
      (account admin gains edit of their own account row); `admin_delete_projects` **narrows** (a
      project admin can no longer delete their project). Each gets a paired assertion naming who
      gained and who lost.
- [ ] **(B) Keep both populations exactly as today** — behaviour-neutral, but contradicts two matrix
      cells, both re-opened in 162-17 against converted policies.

**Unblocks:** 162-09. Neither change is covered by an existing assertion today.

### P-2 · The two join tables *(162-09 Q4)*

- [ ] **(A) Leave the ungated form; delegate to the parent's policy** ★ RECOMMENDED — **consequence:**
      these tables are read only as PostgREST embedded resources, so a denial returns an **empty
      array rather than an error** — observable as missing constituency groups and nowhere else.
- [ ] **(B) Alternative** — state what the two SELECT policies should carry.

**Unblocks:** 162-09.

### P-3 · Do `factions` and `alliances` gain a self-update policy? *(162-10 Q2)*

§ 3.3 grants `entity.edit_answers` as `own` to Faction and Alliance grants; no UPDATE policy on
either table admits a non-admin.

- [ ] **(a) Add `entity_update_own_*` with a `REVOKE`/`GRANT UPDATE (…)` pair in the same commit**
      ★ RECOMMENDED — makes the four tables one shape, which D-21's structural claim needs and 162-14
      inherits. Delivers a matrix cell otherwise unexercisable.
- [ ] **(b) Leave them; record the cells as unexercisable** — fail-closed and smaller; nothing grants
      a faction or alliance editor today. Two tables keep a different shape and the phase ships a
      permission no policy consults.

**Unblocks:** 162-10. Under (a) the plan writes 20 policies and edits `303-column-grants.sql`; under
(b), 18 and it does not.

### P-4 · The two `feedback` INSERT policies *(162-11 Q2)*

Submitting feedback is in no member of § 3.2, so there is no verb to gate them with.

- [ ] **(a) Leave both ungated; record the unbounded project id with a disposition** ★ RECOMMENDED —
      inventing a verb contradicts § 3.2 being canonical. Content is never publicly readable (the
      read policy is gated) and volume is bounded by the per-IP rate-limit trigger.
- [ ] **(b) Gate the authenticated INSERT on the project being open for voters** — **stops candidates
      submitting feedback from the candidate app of a project not open to voters**, which no test
      catches because every seeded project is open.
- [ ] **(c) Gate both on the project existing** — nearly free and nearly worthless.

**Unblocks:** 162-11.

**NOTE**: Check that feedback has on delete set null for project_id instead of delete.

### P-5 · The column-grants reduction *(162-13 Q3)*

The confirmation column **enters** every UPDATE allow-list, retiring a privilege bar that existed by
omission — a bar that also blocked the project administrator holding `entity.confirm` (reproduced as
a live `42501`).

- [ ] **(A) Approve the reduction and the two added blocks** ★ RECOMMENDED — the replacement is
      trigger rule 1, `entity.confirm`-gated, proven by observed refusals. All four entity tables gain
      a block, closing 162-07's recorded gap. **The name columns stay in every allow-list** —
      removing them would freeze a name on an *unconfirmed* entity.
- [ ] **(B) Keep the column out of the allow-list; administrators confirm via service-role only** —
      a different design: the trigger's first rule becomes unreachable for the authenticated role.
      162-13 stops rather than building both.

**Unblocks:** 162-13.

### P-6 · Which callers do the immutability rules bind? *(162-13 Q2)*

- [ ] **(A) The effective `authenticated` role only** ★ RECOMMENDED — **reproduced:** an unscoped rule
      refuses a *service-role* caller, because `user_can` reads the grant set from the JWT and a
      service-role token carries none. Every re-seed, bulk import and pgTAP fixture write would be
      refused. Same scope 162-12 ratified one plan earlier.
- [ ] **(B) Alternative** — describe where the line falls.

**Unblocks:** 162-13. **Accepted cost:** a service-role path can rename a confirmed entity, the same
latitude it has everywhere else in this schema.

---

## § 6 — Nominations

### N-1 · The cap, and the column that makes it enforceable *(162-12 Q1)*

- [ ] **(A) An originator column defaulting to the calling user, absent from the insert grant, cap of
      `10`** ★ RECOMMENDED — § 8.9 asks for two things the schema cannot do: a cap needs a subject,
      and the admin queue § 8.9 asks for has nothing to show without the column. One column answers
      both. The default supplies the value and the grant list makes it unforgeable.
- [ ] **(B) No column; cap by proxy on the caller's own nominations** — caps the wrong thing (a
      candidate can originate parents they never nominate under) and leaves § 8.9's second half
      unbuilt with nothing recording that it did.

**Cap value:** `10` — one parent per contest is the honest need. Overrule by writing a number here:
______ . **Unblocks:** 162-12.

### N-2 · `parent_nomination_id`'s delete action *(162-12 Q2)*

- [ ] **(A) Refuse at end of statement** ★ RECOMMENDED — **measured:** `bulk_delete` removes a
      collection with one `DELETE … WHERE project_id = $1 AND external_id LIKE $2` per table, so an
      immediately-refusing action breaks every teardown while an end-of-statement check does not.
- [ ] **(B) Refuse immediately** — names the offending row, but breaks every teardown. Measured
      directly.
- [ ] **(C) Leave the current cascade** — the option § 11.5 explicitly forbids: rejecting one
      candidate-created placeholder silently deletes every nomination beneath it, including
      candidates who joined later and had nothing to do with creating it.

**Unblocks:** 162-12. A wrong answer here is discovered as **missing data**, not a red test.

### N-3 · Guard 5's enforceable reading *(162-12 Q3)*

- [ ] **(A) The second clause only — the caller already holds a nomination at that contest**
      ★ RECOMMENDED — a row-level check sees only the row being inserted, so the same-transaction
      clause is inexpressible; insertion order makes it moot anyway, since the candidate needs the
      parent's identifier first. The flow becomes: own nomination with no parent → the parent →
      repoint. The existing hierarchy trigger already admits a parentless candidate nomination, so
      this is legal today and costs no schema change.
- [ ] **(B) Alternative** — describe it. § 6.2's interface inherits this answer.

**Unblocks:** 162-12.

### N-4 · Two deliberate non-renames *(162-12 Q4)*

- [ ] **(A) Both approved** ★ RECOMMENDED — the RPC parameter meaning *include the ones that are not
      confirmed* keeps its name (it is an option, not a state flag; its meaning stays true after the
      column flips, and renaming touches a shape Phase 164 audited plus six adapter assertions). The
      same-named JSONB key in the shared package is a typed data shape rather than the column.
- [ ] **(B) One should move** — name it. Doing it later means a second pass over files 162-12 closes.

**Unblocks:** 162-12.

---

## § 7 — Storage

### T-1 · How is the A4 note's word "bucket" read? *(162-14 Q1 — decides how large the plan is)*

- [ ] **(A) Two buckets, the entity type carried by the path segment** ★ RECOMMENDED — the brief's own
      gloss in § 5, and `162-PATTERNS.md` reaches it independently: the folder convention already
      carries the type. Costs nothing outside `400-storage.sql` and still delivers the coverage the
      note asks for — every entity type gains the write access only one has today.
- [ ] **(B) One public bucket per entity type, literally** — **measured cost:** the two bucket names
      live in `config.toml`, not `schema/`, and `public-assets` is baked into the adapter's URL
      builder, the stored-image schema, the candidate upload path, dev-seed's portrait upload and
      teardown, and 20+ unit-test expectations. A frontend and seed migration with no permissions
      content. **If (B), 162-14 halts and the layout change is roadmapped separately.**

**Unblocks:** 162-14.

### T-2 · The path-segment-to-permission mapping *(162-14 Q2)*

- [ ] **(A) The full mapping — all eleven segments** ★ RECOMMENDED — each resolves to the permission
      its own table policy asks, which is the literal content of the note. Creates the project-scope
      read-but-not-write identity K2's amendment needs. One `CASE`, fall-through denies.
- [ ] **(B) Four entity segments mapped; the other seven collapse to one project-structure
      permission** — a question asset and an election asset would ask the same permission while their
      tables ask different ones: the collapse this phase exists to end, reintroduced one wave before
      it closes.

**Unblocks:** 162-14. **Note:** the vocabulary is eleven values, not the four the note names.

### T-3 · The path-consistency conjunct *(162-14 Q3)*

- [ ] **(A) Under project scope, the entity in segment `[3]` must belong to the project in segment
      `[1]`** ★ RECOMMENDED — closes a gap that exists today: an admin of one project can write into
      a path claiming their project and carrying another project's entity id. One comparison on a
      lookup that already runs.
- [ ] **(B) No conjunct; preserve today's behaviour** — ships a known path-forgery gap through a plan
      whose subject is storage authority. If chosen, recorded as a named finding.

**Unblocks:** 162-14.

### T-4 · The policy shape and count *(162-14 Q4)*

- [ ] **(A) Fifteen in, fifteen out; predicates replaced in place, twelve renamed** ★ RECOMMENDED —
      keeps the census figure ROADMAP criterion 6, `162-SPEC.md`, the outline and 162-17 all cite
      stable, so an acceptance criterion written against "15" does not redden against a correct
      implementation — **exactly the defect D-03 was corrected to avoid.**
- [ ] **(B) Collapse the paired scope policies into one per bucket and verb** — nine instead of
      fifteen, purer, but changes a count four documents cite in the same phase that already had to
      correct a policy count. If chosen, 162-17's inherited figure is corrected explicitly.

**Unblocks:** 162-14, 162-17.

---

## § 8 — Scope boundaries and cleanup

### C-1 · The repurposed `election_type`'s type *(162-07 Q1)*

- [ ] **(A) A new enum named for the concept, three members, `NOT NULL` with the party-list default**
      ★ RECOMMENDED — the retired values become **unrepresentable** rather than merely unused, and
      `NOT NULL` + default means no creation path has to be taught the column.
- [ ] **(B) Alternative** — write out the type name, nullability and default in full.

**Unblocks:** 162-07.

### C-2 · Does the application property keep being fed from it? *(162-07 Q2)*

**Why it's asked: the failure is silent and is a change of meaning, not a break.** Nothing goes red
either way. Nothing in the frontend reads the property today.

- [ ] **(A) Remove the term; leave the property fed by its own column** ★ RECOMMENDED — D-16's own
      recommendation in its own words. The property then means one thing from one column.
- [ ] **(B) Remove the term and expose the shape as a new property** — scope `162-CONTEXT.md` closes.
- [ ] **(C) Leave the mapping alone** — the fail-open option D-16 names as the thing to avoid: the
      property silently starts carrying nomination shapes with nothing recording that it did.

**Unblocks:** 162-07, 162-17.

### C-3 · The live `candidates` SELECT disjunct *(162-07b Q1)*

Brief fact 38 undercounted: `302-rls.sql` carries a **live `USING` disjunct**, not just a comment, so
the schema will not apply while it reads a dropped column.

- [ ] **(A) Remove now; 162-10 restores the reach through nominations** ★ RECOMMENDED — fail-closed,
      so nothing becomes visible that is not visible today. **Measured:** the two assertions that
      appear to test this reach pass through the policy's *published* term instead, so the reach
      carries no live assertion.
- [ ] **(B) Re-express against the nomination hierarchy now** — not behaviour-preserving anyway (a
      member who was never nominated stops being visible, and the fixture contains exactly that row),
      and needs a helper 162-10 then deletes.

**Unblocks:** 162-07b, 162-10. **Under (A):** a two-plan window where an organization user cannot see
an unconfirmed candidate of its own organization.

### C-4 · The one live UI read *(162-07b Q2)*

The branch renders only when the candidate's organization exists **and differs** from the
nomination's parent — a guard whose whole purpose is to surface a disagreement this plan eliminates.
After the change it can never be true.

- [ ] **(A) Delete the branch and its orphan translation key in both catalogue trees** ★ RECOMMENDED
- [ ] **(B) Delete the branch, keep the key** — leaves seven locales carrying a key nothing renders;
      named as residue in the SUMMARY.
- [ ] **(C) Leave the component alone** — ships a component reading a field the adapter no longer
      supplies, with nothing saying so.

**Unblocks:** 162-07b.

### C-5 · The reclassified seed reference *(162-07b Q3)*

- [ ] **(A) Move the `organization` key from the relationship map into the collection's non-column
      list** ★ RECOMMENDED — **forcing evidence:** the latent answer emitter reads that key in memory
      before any write, an unresolved lookup falls back to **random emission silently**, and
      `pipeline.ts` installs the emitter for every template. Deleting the key degrades every seeded
      dataset's matching data with nothing reporting it.
- [ ] **(B) Let the clustering go with the column** — a different answer for the demo data; 162-07b
      stops rather than guessing.

**Unblocks:** 162-07b.

### C-6 · The two D-21 policy renames *(162-10 Q3)*

- [ ] **(A) Approved** ★ RECOMMENDED — `candidate_update_own` → `entity_update_own_candidates`;
      `organization_update_own_organizations` → `entity_update_own_organizations`. No pgTAP assertion
      reads a policy name. **Deliberately not renamed:** the `admin_*` prefix, which now means "the
      project-scope actor" — renaming it is a phase-wide convention change.
- [ ] **(B) Alternative** — write out the names.

**Unblocks:** 162-10.

### C-7 · Which columns does the freeze protect? *(162-13 Q1)*

- [ ] **(A) Five columns — the single name on three tables, two personal-name columns on the fourth;
      the abbreviated display name stays editable** ★ RECOMMENDED — matches § 1.6's wording and the
      two sign-up methods that assert an identity by pairing a name with a channel. Neither asserts
      an abbreviation.
- [ ] **(B) Widen to include the abbreviated display name** — reverses a grant that exists today on a
      field no source document calls identity.
- [ ] **(C) Narrow to the single name column only** — exempts the very table the identity-provider
      sign-up creates, so the freeze would not bind the population § 11.2 is about.

**Unblocks:** 162-13, 162-17.

### C-8 · The email helper's entity population *(162-15 Q3)*

- [ ] **(A) Keep the same two entity kinds, same preference order** ★ RECOMMENDED — output unchanged
      for every identity, proven by a before/after capture. Brief § 6.1 owns the gap.
- [ ] **(B) Accept all four kinds the grant map admits** — changes what a live email renders, in a
      plan whose gate is a removal and whose E2E suite does not send email.

**Unblocks:** 162-15. **Context:** `502-email-helpers.sql` was an *unowned* dependency on the retired
enum and table — no plan 162-01 … 162-14 named it.

### C-9 · The pgTAP description strings *(162-16 Q2)*

Fixture inserts and query predicates stop working when the column goes. **Description strings are
labels and run green for ever against a column that does not exist.**

- [ ] **(a) Rename every one, after a citation sweep** ★ RECOMMENDED — leaves the corpus a future
      author copies from free of sentences asserting a deleted mechanism is real. The sweep leaves
      unchanged any string another document cites by name (`nominations_election_round_check` is the
      precedent).
- [ ] **(b) Leave them** — smallest diff; leaves the corpus describing a deleted mechanism.
- [ ] **(c) Rename only the actively misleading ones** — a judgement with no rule behind it, so the
      next author cannot tell which were considered and kept.

**Unblocks:** 162-16.

### C-10 · Where does the document sweep stop? *(162-16 Q3)*

- [ ] **(a) Sweep the prescriptive files and the column facts; defer the policy inventory with its
      count** ★ RECOMMENDED — three documents do not *describe* the mechanism, they **instruct** a
      future author to build it — two numbered recipe steps, a common-columns rule, and the same rule
      in the checklist `CLAUDE.md` binds every plan to. The policy inventory is swept once by the
      phase-closing plan rather than for the eighth time here.
- [ ] **(b) Sweep nothing outside `apps/` and `packages/`** — leaves a recipe telling the next author
      to add the column back.
- [ ] **(c) Sweep every document including the policy inventory** — its eighth partial rewrite, inside
      a commit whose gate is a visibility fingerprint.

**Replacement subject** for the three re-pointed column-grant assertions: must come from the
un-granted UPDATE set and **must not** be the confirmation column (162-13 moved that *into* the
allow-list, so an assertion re-pointed at it would observe a success where its description says a
refusal). **Unblocks:** 162-16.

### C-11 · The guard's two allow-lists *(162-17 Q2)*

- [ ] **(A) Approve both derived lists, entry by entry with a reason each** ★ RECOMMENDED — one
      legitimate member of each is already known: `accounts` (§ 3.2 enumerates no separate read
      member — see S-3) and any member the estate has no object for. **An entry approved without a
      reason is not approved** — the exemption list is a security surface.
- [ ] **(B) Name entries that should redden instead.**

**Unblocks:** 162-17.

---

## Answering

Return this file with boxes ticked only where you overrule, and values written in where you want
something other than the `code` default. Unticked throughout is a complete answer.

Once returned, each ruling is folded into the plan that asked — its `checkpoint:decision` task
becomes a ratified decision with the answer recorded — and the cross-cutting ones are added to
`162-CONTEXT.md` as D-entries. Execution then runs the 19 plans in dependency order without halting.

## DECISIONS ANSWERED — folded in 2026-09-16

Returned by the operator with **one box ticked** (S-4(a), itself the ★ RECOMMENDED option) and **three
NOTEs**. Every other item takes its recommendation under the standing unticked-box convention.

**Where each answer now lives.** Each plan's `checkpoint:decision` task became `type="auto"` carrying a
`<ratified>` block naming its source item here; each plan's `autonomous` frontmatter flipped to `true`.
**Zero blocking checkpoints remain in phase 162**, so the 19 plans run in dependency order without halting
— which is what the "Answering" section above promised would follow from a returned document.

| Section | Items | Plans amended |
|---|---|---|
| § 1 Structural | S-1 … S-5 | 162-01, 162-03, 162-09, 162-11, 162-17 |
| § 2 One-way preconditions | O-1 … O-3 | 162-02b, 162-06, 162-16 |
| § 3 Authority predicate | A-1 … A-10 | 162-04, 162-05, 162-06, 162-15 |
| § 4 What the public sees | V-1 … V-7 | 162-07, 162-08, 162-09, 162-10 |
| § 5 Who may do what | P-1 … P-6 | 162-09, 162-10, 162-11, 162-13 |
| § 6 Nominations | N-1 … N-4 | 162-12 |
| § 7 Storage | T-1 … T-4 | 162-14 |
| § 8 Scope & cleanup | C-1 … C-11 | 162-07, 162-07b, 162-10, 162-13, 162-15, 162-16, 162-17 |

**The three NOTEs did more than confirm recommendations, and are recorded as `162-CONTEXT.md` D-entries:**

1. **S-3's NOTE** (*account read = any role on account or its projects; bulk send = `project.edit_entities`*)
   **closes two of the three matrix gaps by disposition instead of recording them**, without widening the
   23-member enum. → **D-30**. It adds work to 162-09 (the `accounts` SELECT needs its own grant-existence
   predicate, not a `user_can` call) and changes 162-17's Q3 from *record all three* to *record one, close
   two*, removing `accounts` from C-11's allow-list.
2. **S-4's tick** confirms `project.edit_questions` for `admin_jobs` — the recommended option, so no change.
3. **P-4's NOTE** (*check that feedback has on delete set null for project_id*) is **new scope**: measured
   at fold-in, the column is `NOT NULL … ON DELETE CASCADE`, so the change needs a nullability drop as well.
   → **D-31**, discharged by **162-11 Task 2b**, added for it.
