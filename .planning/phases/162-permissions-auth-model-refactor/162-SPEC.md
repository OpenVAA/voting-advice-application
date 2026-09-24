# Phase 162 — SPEC: the permissions and auth model

## 1. Status, authority and how to cite this SPEC

This document is the **normative reference for phase 162**. It is the home
`.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` K4 named for the definition of "level-1 permissions
short of full" (§ 6 below), and it is the **written matrix** that ROADMAP § Phase 162 criterion 7 asks
the candidate-registration and nomination-confirmation flows to be checked against. All eighteen other
plans in this phase check themselves against the sections here rather than re-deriving them.

**What is canonical and what is reproduced.** §§ 3, 4, 5 and 7 are *reproductions* of
`162-IMPLEMENTATION-BRIEF.md` §§ 3.1, 3.2, 3.3 and 3.4, which remain the canonical statements. Where
this SPEC and the brief disagree, **the brief wins and this SPEC is corrected** — a reproduction never
acquires authority over its source by being newer. §§ 1, 2, 6, 8, 9 and 10 are authored here and are
canonical here.

**The locked decision record** is `162-CONTEXT.md` D-01 … D-23 (extended in place by D-24 … D-31). An
amendment stated in § 2 without a named authority is a defect, not a shortcut: every amendment below
carries its decision id, its date and the route by which it was decided.

**The measurement baseline.** The facts the brief states — the 97 policies, the 15 storage policies,
the column and constraint findings — were measured in the worktree `voting-advice-application-gsd`, on
branch `integration/ship-12-squash`, at HEAD `440a7780f`, on 2026-09-14 and 2026-09-15. A later reader
who finds a fact wrong should check that baseline before concluding the SPEC was wrong when written.

**The requirement.** This phase satisfies `PRESHIP-02`, which `PRE-SHIP-REFACTORING.md` marks
**blocking ship**. The three amendments in § 2 change what some of its criteria require; **none of them
changes that status.**

**How to cite.** By section number — "SPEC § 5", "SPEC § 6". § 10 lists which plan implements each
section.

## 2. Amendments to PRESHIP-02

Three of the seven ROADMAP § Phase 162 success criteria are amended: criterion 1, criterion 4 and
criterion 6. Each amendment below names its authority, so a verifier reading a criterion literally can
tell a deliberate deviation from a missed obligation. **`162-02` carries the matching edits into
`.planning/REQUIREMENTS.md` and `.planning/ROADMAP.md`**, so the source documents and this SPEC do not
disagree; until that plan runs, the requirement text still names the unamended form.

### 2.1 Criterion 1 is amended — two role levels, not three (D-02)

**As it stands today**, criterion 1 requires roles `admin` / `owner` / `editor` "carrying the documented
rights — admin does anything to the object and its descendants, owner manages editors, editor has owner
rights minus editor management". The PRESHIP-02 row in `.planning/REQUIREMENTS.md` carries the same
three-role sentence.

**The amendment: the role vocabulary is `admin` and `editor`. There is no third level.** Three reasons,
from brief § 8.1(a):

1. The eight user types in `162-USER-RIGHTS.md` span `admin` and `editor` only — no user type occupies a
   third level.
2. Editor-management is already a permission: `project.manage_editors` at project scope and
   `entity.invite_children` at entity scope. A third role would carry nothing § 5's matrix does not.
3. An unused member of a security enum is untested surface, which this milestone's standard rejects.

**Authority.** Resolved by the standing convention that an unticked box selects its ★ RECOMMENDED
option — recorded in brief § 11.9 as ruling 8.1, route "★ default" — and then **ratified by the
operator on 2026-09-16**, in `162-CHECKPOINT-DECISIONS.md` § 1 item S-1, option **(A) Two levels —
`admin` and `editor`**. The ratification was asked for because the position being overruled is carried
by two documents of higher standing: ROADMAP criterion 1 and a blocking-ship requirement row, with K4
marked *locked*.

**This also widens K4's level-1 definition**, which derives level-1 from criterion 1's three-role
sentence. See § 6, where the widening is stated with both authorities named.

### 2.2 Criterion 4 is amended — no suggested-changes store (D-01)

**Operator ruling, 2026-09-14:** *"Yes — record it as my amendment."*

**What it settles.** There is **no `change_suggestions` table and no suggestion verb among the 23
members of § 4**. A user who wants a change they cannot make messages an admin — `162-USER-RIGHTS.md`'s
wording, carried unchanged. The removed verb is named here, in prose, and nowhere else in this SPEC:
listing it among § 4's members is exactly the drift this section exists to prevent.

**What is not affected.** PRESHIP-02 **keeps its blocking-ship status**; it loses only the
*suggest for approval* branch of criterion 4 and the tests of that branch. The other half of criterion
4 — the per-project settings governing nomination changes, including parent-entity and child-entity
approval routing and invite-by-email — stands unchanged and is implemented in this phase.

**Authority.** The operator, directly, on 2026-09-14; recorded in brief § 10.1 and carried as
`162-CONTEXT.md` D-01. Not by inference and not by a planner's reading.

### 2.3 Criterion 6 is widened — all fifteen storage policies (D-03)

**As it stands today**, criterion 6 asserts that the "one mechanism, not a parallel implementation" half
of the requirement **is already true**, because `400-storage.sql` calls `can_access_project` at 11 sites
and storage therefore follows table access by construction. `.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md`
K2 rests on the same premise.

**The brief's fact 3 falsifies that premise.** Not every storage policy routes through the helper: the
`candidate_*` family inlines its own re-derivation of the access rule, which is a parallel
implementation in exactly the sense criterion 6 forbids.

**The amendment: all 15 storage policies route through `user_can`**, the `candidate_*` ones included,
together with the 12 inline `EXISTS` re-derivations. **Authority:** the operator's A4(a) tick.

**The census is corrected, and the corrected figures are the ones to assert against.** D-03's original
wording — and fact 3 with it — said "the 7 `candidate_*` policies"; **seven is the non-caller count, not
the `candidate_*` count.** Measured from `400-storage.sql`: 15 storage policies; **8** route through
`can_access_project` (`authenticated_select_{public,private}_assets` plus the six `admin_*`); **7** do
not; of those 7, **6** are `candidate_*` (insert/update/delete × public/private) and the seventh is
`anon_select_public_assets`, which is an anon-read policy belonging with § 7's visibility rules rather
than a re-derivation. There are **10** real `can_access_project` call sites — the 11th grep hit is the
file's own `Depends on:` header comment — and **12** inline `EXISTS` sub-selects. An acceptance
criterion asserting "7 `candidate_*` policies" would go red against a correct implementation.

**K2's operator amendment stands and is restated here**, because it shapes what "asserted" means: the
paired assertion is **per-verb**. The `verb` argument of `user_can(scope, uuid, verb)` must be honoured
by storage policies rather than discarded, so storage can grant read while denying write on the same
object; and the assertion is a **read denial observed denied at the storage level and a write denial
observed denied at the storage level, as two separate observations**. A single undifferentiated access
assertion does not satisfy criterion 6. **`162-14`** converts the policies; **`162-17`** delivers the
paired per-verb assertion.

## 3. The grant model — user types to grant rows

`grants` is keyed **`(user_id, scope, target_type, target_id, role)`** and **replaces `user_roles`
outright** (D-04): `user_roles`, `user_role_type` and `role_scope_type` are absent from the declarative
schema by the end of this phase. There is **one `entity` scope with a `target_type` discriminator**,
not four entity scopes, tied by a CHECK requiring `target_type IS NOT NULL` exactly when
`scope = 'entity'` (D-05). `user_can` **reads the grant set from the JWT** and does table lookups only
for hierarchy, and `is_child_nominee` is **direct-parent-only** (D-06).

The eight user types map onto grant rows as follows (brief § 3.1, reproduced):

| User type | `scope` | `target_type` | `target_id` | `role` |
|---|---|---|---|---|
| RootAdmin | `global` | — | NULL | `admin` |
| AccountAdmin | `account` | — | account id | `admin` |
| ProjectAdmin | `project` | — | project id | `admin` |
| ProjectEditor | `project` | — | project id | `editor` |
| Candidate | `entity` | `candidate` | candidate id | `editor` |
| OrganizationEditor | `entity` | `organization` | organization id | `editor` |
| FactionEditor | `entity` | `faction` | faction id | `editor` |
| AllianceEditor | `entity` | `alliance` | alliance id | `editor` |

**One divergence from the canonical table, recorded rather than silent.** Brief § 3.1 closes with the
line *"Two role levels, not three. See § 8.1 — this needs your ruling, because criterion 1 and K1 say
three."* That sentence is **omitted here because § 2.1 discharges it**: the ruling was given and the
vocabulary is fixed at `admin` and `editor`. Nothing else in the table is changed — the same five
columns, the same eight rows, the same cell values, including the em dash for an absent `target_type`
and `NULL` for RootAdmin's `target_id`.

## 4. The permission enum — 23 members

This is the **`verb` argument of `user_can(scope, uuid, verb)`**. It has **23 members**, and the
canonical source is `162-IMPLEMENTATION-BRIEF.md` § 3.2: the 20 atomic rights of
`162-USER-RIGHTS.md` § "Grants, atomic rights", with `project.edit_settings` **split in two** per brief
§ 11.1 (D-09), and `entity.confirm` (brief § 11.2, D-10) and `nomination.create_parent` (brief § 11.5,
D-12) **added**. The enum is created as DDL in `162-03`.

| Group | Permission | Source line |
|---|---|---|
| Feedback | `feedback.read` · `feedback.manage` | "Feedback — read / manage" |
| Account | `account.edit_settings` · `account.manage_projects` · `account.manage_admins` | "edit settings / create, delete projects / manage admins" |
| Project | `project.manage_editors` · **`project.edit_project_settings`** · **`project.edit_app_settings`** · `project.edit_structure` · `project.edit_questions` · `project.read_structure` · `project.edit_entities` · `project.edit_nominations` · `project.read_entities` | "manage editors / edit settings / edit elections, constituency groups and constituencies / edit questions and categories / read settings, elections … / edit entities / edit nominations / read entities and nominations" |
| Entity | `entity.edit_answers` · `entity.read_answers` · `entity.edit_immutable` · `entity.invite_children` · **`entity.confirm`** | "edit answers / read answers / edit immutable data / invite children" — **`entity.confirm` added per § 11.2** |
| Nomination | `nomination.edit` · `nomination.read` · `nomination.confirm` · **`nomination.create_parent`** | "edit contents / read contents and related entities basic data / confirm" — **`nomination.create_parent` added per § 11.5** |

**The normative enumeration.** The 23 members, in the order § 5's matrix rows use. This list and § 5's
first column are asserted identical in name **and** in order; a transcription slip in either shows up as
their disagreement rather than as a reader's oversight.

- `feedback.read` — read the project's feedback queue
- `feedback.manage` — triage, answer and close feedback items
- `account.edit_settings` — edit the account's own settings
- `account.manage_projects` — create and delete projects within the account
- `account.manage_admins` — grant and revoke account-level admin
- `project.manage_editors` — grant and revoke project-level editor
- `project.edit_project_settings` — write the `projects` flags RLS itself reads (`open_for_voters`, `lock_nominations`) — **new, § 11.1's split (D-09)**
- `project.edit_app_settings` — write `app_settings.settings` and `customization`: theme, copy, the auth-method matrix — **new, § 11.1's split (D-09)**
- `project.edit_structure` — edit elections, constituency groups and constituencies
- `project.edit_questions` — edit questions and question categories
- `project.read_structure` — read settings, elections, constituencies, questions and categories
- `project.edit_entities` — edit any entity in the project
- `project.edit_nominations` — edit any nomination in the project
- `project.read_entities` — read the project's entities and nominations
- `entity.edit_answers` — write the entity's answers
- `entity.read_answers` — read the entity's answers
- `entity.edit_immutable` — write the entity's protected data, including a confirmed entity's names (§ 7)
- `entity.invite_children` — invite child entities under this entity
- `entity.confirm` — set or clear an entity's `confirmed` flag — **new, § 11.2 (D-10)**
- `nomination.edit` — edit the nomination's contents
- `nomination.read` — read the nomination and its linked entities' basic data
- `nomination.confirm` — confirm a nomination
- `nomination.create_parent` — insert the unconfirmed organization nomination a child nominee needs as its parent — **new, § 11.5 (D-12)**

**The verb criterion 4 dropped is not in this list.** § 2.2 names it once, in prose; it appears nowhere
in § 4 or § 5. A member added back here would be a widening of the security enum with no authority
behind it.

## 5. The role × permission matrix

**Legend.** `✓` = granted · `—` = not granted · `own` = only for the granted target and, where noted,
its `is_child_nominee` children.

**No cell is left unstated.** The three cells brief § 8.3 raised as open were resolved by the operator
**directly in this table on 2026-09-15** — `feedback.read` **✓**, `feedback.manage` **✓**, project
settings **—** (D-09a) — and are reproduced resolved. An unstated cell is otherwise resolved
permissively by whichever implementer reaches it first, which is the widening this table exists to
prevent.

| Permission | Root | Account | ProjAdmin | ProjEditor | Candidate | OrgEditor | Faction/Alliance |
|---|---|---|---|---|---|---|---|
| `feedback.read` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `feedback.manage` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `account.edit_settings` | ✓ | ✓ | — | — | — | — | — |
| `account.manage_projects` | ✓ | ✓ | — | — | — | — | — |
| `account.manage_admins` | ✓ | ✓ | — | — | — | — | — |
| `project.manage_editors` | ✓ | ✓ | ✓ | — | — | — | — |
| `project.edit_project_settings` | ✓ | ✓ | ✓ | — | — | — | — |
| `project.edit_app_settings` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `project.edit_structure` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `project.edit_questions` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `project.read_structure` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `project.edit_entities` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `project.edit_nominations` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `project.read_entities` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `entity.edit_answers` | ✓ | ✓ | ✓ | ✓ | own | own | own |
| `entity.read_answers` | ✓ | ✓ | ✓ | ✓ | own | own | own |
| `entity.edit_immutable` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `entity.invite_children` | ✓ | ✓ | ✓ | ✓ | — | own (org→cand) | — |
| `entity.confirm` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `nomination.edit` | ✓ | ✓ | ✓ | ✓ | own, unless locked | own, unless locked | own, unless locked |
| `nomination.read` | ✓ | ✓ | ✓ | ✓ | own | own | own |
| `nomination.confirm` | ✓ | ✓ | ✓ | — | — | — | — |
| `nomination.create_parent` | ✓ | ✓ | ✓ | ✓ | own, unless locked | — | own, unless locked |

**`ProjectEditor` is K4's "level-1 permissions short of full"** — it is exactly `ProjectAdmin` minus
`manage_editors`, minus `project.edit_project_settings` (§ 11.1), and minus `nomination.confirm`, which
USER-RIGHTS restricts to admins. K4 is therefore satisfied by this row rather than by a separate
definition.

**The editor keeps the app's face, the admin keeps the project's shape.** § 11.1's split is what makes
that sentence true rather than approximate: an editor may retheme and re-word the running application
(`app_settings`) without being able to change who may read it or when it opens (`projects`).

## 6. Level-1 permissions short of full — ProjectEditor (K4)

`.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` **K4** ruled that "level-1 permissions short of full"
is **defined in the phase SPEC**, and then the flows are checked against it. **This section is that
definition.**

**`ProjectEditor` is `ProjectAdmin` minus exactly three permissions** — `project.manage_editors`,
`project.edit_project_settings` and `nomination.confirm` — **and identical to `ProjectAdmin` in every
other cell of § 5.**

Each subtraction has its own authority:

| Subtraction | Authority |
|---|---|
| `project.manage_editors` | K4 itself — "editor minus editor-management". This is the subtraction K4 names |
| `project.edit_project_settings` | Added by brief § 11.1's settings split (D-09), on the line "does a policy read this?" — these are the flags RLS itself reads, so writing them changes who may read the project |
| `nomination.confirm` | `162-USER-RIGHTS.md` restricts confirmation to admins |

**This widens K4's single subtraction to three, deliberately.** K4 derived level-1 from criterion 1's
sentence "editor has owner rights minus editor management", which named one subtraction because the
settings permission had not yet been split and the confirmation restriction had not yet been read off
`162-USER-RIGHTS.md`. Both authorities are named above so a later reader does not have to reconcile two
definitions by guessing which is newer.

**§ 5's matrix is the authority; this prose is checked against it, not the other way round.** If the
delta between § 5's ProjAdmin and ProjEditor columns is ever other than these three names, the matrix is
right and this section is wrong.

**`162-17` is the plan that checks the candidate-registration and nomination-confirmation flows against
this definition** — which is criterion 7's real ask, and the half that needs a definition to check
against.

## 7. Public read

**A nomination is public only when the project is open for voters AND the nomination is confirmed AND
every entity that nomination links carries `confirmed = true`.** An entity is public only through such a
nomination; answers only through such a nomination. Public read is an **all-of** rule and it is
**transitive through the nomination** (D-11).

| Reader | May read |
|---|---|
| `anon` | Project structure (settings, elections, constituency groups, constituencies, questions, categories) **when the project is open for voters**; a nomination and its linked entities **only when the project is open for voters AND the nomination is confirmed AND every entity that nomination links carries `confirmed = true`**; answers **only through such a nomination** |
| Any authenticated user **with any grant in the project** | All project structure, always — "any auth user can always read their project" |
| Entity grantee | Own entity's answers and own nominations; via `is_child_nominee`, a related entity's **basic data only** (not answers unless public) |

**Four consequences.**

1. **A confirmed nomination of an unconfirmed entity is invisible, and so is that entity** (D-11). The
   conjunct is not a refinement of the nomination's own confirmation; it is a second, independent gate.
2. **It closes a real hole.** Without the entity conjunct an admin could seed a candidate with a
   placeholder name, confirm the nomination, and the placeholder would be public. Under this rule the
   entity must be vouched for *as an identity* before anything about it is published.
3. **After this phase there is exactly one way to ask whether a row is public**, because the 10 per-row
   `published` columns are **deleted inside this phase** (D-11b, operator tick § 8.4(b), delivered by
   `162-16`). `open_for_voters` plus the two confirmation states carry the whole visibility story —
   which is what criterion 2 asks for.
4. **`nominations.unconfirmed` is flipped to `nominations.confirmed`** (D-11c, delivered by `162-12`).
   The existing column defaults `false` meaning *confirmed* while `entities.confirmed` defaults `false`
   meaning *unconfirmed*; two adjacent booleans reading in opposite directions is a defect waiting to
   happen, and this phase is rewriting every reader anyway.

**The name freeze is conditional, and it is conditional on the reader as well as on the flag.**
Protected name columns are **writable while the entity is unconfirmed and frozen once it is confirmed —
frozen for the entity user, still editable by a holder of `entity.edit_immutable`** (an admin or project
editor). This is brief § 8.7(a) / D-11a. Otherwise `entity.edit_immutable` would be a permission nobody
can exercise, and an operator could not fix a typo in a confirmed surname without unconfirming the
entity. **It is enforced by a trigger reading `OLD.confirmed`, not by a `WITH CHECK`** — fact 27
measures that `303-column-grants.sql` is a single global REVOKE/GRANT pair, so a column grant cannot
express a rule conditional on a row's state.

**Implemented by** `162-07` (the columns), `162-08` (the anon SELECT policies), `162-13` (the name-freeze
trigger) and `162-16` (the `published` deletion).

## 8. Edge Coverage

The deterministic edge probe returned **five applicable categories** against PRESHIP-02. **None was
auto-dismissed.** Each row below is either resolved against a measured statement in
`162-IMPLEMENTATION-BRIEF.md`, or carried as a **flagged assumption** that a named later plan must
honour or refute — an assumption recorded as such is a claim a reviewer can falsify; an assumption left
implicit is not.

| Category | Probe | Resolution | Status |
|---|---|---|---|
| adjacency | Do two nominations adjacent in the key space collide, or separate? | Two nominations agreeing on all eight key columns collide and the second is rejected; two differing only in `parent_nomination_id` separate and both are admitted — the multi-party presidential case the operator gave as the reason for the key's shape (brief § 11.7). Behavioural discharge is backstopped by `162-12`'s constraint and `162-17`'s two-directional pgTAP pair. | resolved |
| empty | What does the key enforce when its columns are NULL? | Every `nominations` row carries three NULL entity FKs, because `104-nominations.sql`'s CHECK requires exactly one of the four entity FKs to be non-null, and `parent_nomination_id` is NULL on every top-level nomination. Under PostgreSQL's default NULLS-DISTINCT semantics a plain `UNIQUE` over the eight columns therefore never conflicts and enforces nothing at all. `NULLS NOT DISTINCT` is what makes the NULL case comparable, and it pins the PostgreSQL floor at 15 (`supabase/config.toml:39`, `major_version = 15`). | resolved |
| ordering | Does anything depend on the declaration order of `grant_permission`'s members? | **Normative assumption, unverified.** The declaration order is presentational only: it is § 4's list order and § 5's row order, and **no predicate may compare or sort enum members by ordinal.** Nothing in the brief tests this and no source document confirms it. `162-03` and `162-04` must honour it or contradict it deliberately. | assumption |
| idempotency | Is a second identical call, or a second identical grant, a no-op? | **Assumption, unverified.** `user_can` is a pure read whose second call on unchanged inputs returns the same answer, and a `grants` row is identified by the full key (`user_id`, `scope`, `target_type`, `target_id`, `role`), so re-granting the same right is a no-op rather than a duplicate row. The brief specifies the key but never states the re-grant behaviour. `162-03` must make it true or refute it. | assumption |
| concurrency | What separates two candidates racing to create the same placeholder parent nomination? | The **`UNIQUE NULLS NOT DISTINCT` constraint, not a policy predicate.** Brief § 11.7 is explicit: the § 11.5 guard-3 `NOT EXISTS` predicate stays as a fast path and a better error message, this constraint is the guarantee, and the race is closed by the database. Behavioural discharge is backstopped by `162-12` and `162-17`. | resolved |

**`162-12` writes the constraint and names it explicitly**, following the precedent already set two
lines below it in the same `CREATE TABLE`: `nominations_election_round_check` is named in source because
a disposition document cites it and pgTAP's `throws_ok` has to match it. The same reasoning applies
here, because `162-17` asserts this constraint by name.

**`162-17` asserts it in both directions** — a genuine duplicate rejected, **and** the same candidate
nominated under two different parents accepted. A test that only checked rejection would stay green if
someone later "simplified" the key by dropping `parent_nomination_id`, which is precisely the column
that admits the case the operator gave as the reason for the key's shape.

**The constraint's own comment must record the PostgreSQL 15 floor.** A downgrade would not fail to
apply: it would silently turn the constraint into the no-op described in the `empty` row above, leaving
something that looks like a guarantee in the schema, reads like one in review, and enforces nothing.

## 9. Prohibitions

These four bind **every plan in phase 162**, not only this one.

- **No policy re-derives a rule that `user_can` already answers.** One mechanism, not a parallel
  implementation, is this phase's own test for every deviation — a policy that re-derives the rule is
  wrong even when it is correct, because the next edit to the rule will not reach it.
- **No plan in this phase writes a numbered migration file.** No database has been published (operator
  ruling, brief § 10.2), so the schema is declarative: `00001_initial_schema.sql` is **regenerated** and
  reviewed as a diff in the same commit as the `schema/` edit that caused it, and there is no `000NN`
  sequence to append to.
- **No `UNIQUE` constraint on `nominations` is written without `NULLS NOT DISTINCT`** (D-12c, D-24).
  Written plain, it enforces nothing on this table — see § 8's `empty` row for why.
- **No plan completes while an E2E test is red.** There are no known-flaky exemptions, and a test that
  did not run counts as a failure, not a pass (`CLAUDE.md` § E2E Hard Rule).

## 10. How the other eighteen plans cite this SPEC

Later plans cite this document **by section number**. §§ 3, 4, 5 and 7 are reproductions whose authority
remains `162-IMPLEMENTATION-BRIEF.md` §§ 3.1–3.4; a disagreement between this SPEC and a plan is
resolved by correcting whichever of the two departs from the brief, and a disagreement between this SPEC
and the brief is resolved in the brief's favour (§ 1).

| Section | Implemented by |
|---|---|
| § 3 — the grant model | `162-03` (the table), `162-04` (`user_can`, `is_child_nominee`) |
| § 4 — the 23-member enum | `162-03` |
| § 5 — the matrix | `162-04` |
| § 6 — level-1 / ProjectEditor | `162-17` (the flow check criterion 7 asks for) |
| § 7 — public read | `162-07` (columns), `162-08` (anon policies), `162-13` (name-freeze trigger), `162-16` (`published` deletion) |
| § 8 — edge coverage | `162-12` (the constraint), `162-17` (both directions) |
| § 9 — prohibitions | every plan |

**Brief § 3.5 — where each new setting goes — is not reproduced here**, because it is a table of
implementation homes rather than a statement of who may do what, and `162-07` owns it. **One line of it
is stated here anyway, because it changes the meaning of a column that already exists:**
`elections.election_type` is **repurposed** to carry the nomination shape (`organization_only` /
`candidate_only` / `organization_list`), and its current `'general'` / `'local'` meaning is deleted
along with its historical traces (D-16, corrected in place on 2026-09-15 in favour of the operator's
free-text note, which overrules the box it contradicted). There is **no** `nomination_shape` column. The
premise was verified rather than taken on trust: `election_type` has exactly one production consumer and
nothing reads the value it feeds, so no product behaviour depends on the old values. `162-07` carries
the change and the measured trace list.

The other § 3.5 homes are unchanged and uncontroversial: `open_for_voters` and `lock_nominations` as
typed columns on `projects`, the auth-method matrix in `app_settings.settings` JSONB, and
`entities.confirmed` declared inside each of the four entity tables' `CREATE TABLE` bodies (D-15, D-10).
