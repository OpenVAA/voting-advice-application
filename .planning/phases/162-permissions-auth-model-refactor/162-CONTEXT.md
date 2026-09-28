# Phase 162: Permissions & Auth Model Refactor - Context

**Gathered:** 2026-09-15
**Status:** Ready for planning
**Derived from:** `162-USER-RIGHTS.md` (operator, 2026-09-14), `162-DISCUSSION-POINTS.md` (ticked by the
operator) and `162-IMPLEMENTATION-BRIEF.md` (the measured delta, the target model and the wave sequence).
Per the standing convention: an unticked box resolves to its `★ RECOMMENDED` option; a ticked
non-recommended box overrules the `★`; and free-text `**NOTE:**` beats every box.
**Measured against:** worktree `voting-advice-application-gsd`, branch `integration/ship-12-squash`,
HEAD `440a7780f`, 2026-09-14/15. Facts 16–39 in the brief were measured in-session against that tree.

<domain>
## Phase Boundary

**Who may do what to which object is answered by one grants matrix and one set of predicates**, rather
than by ~97 RLS policies that each re-derive the rule. Satisfies **PRESHIP-02**, which the source document
marks **blocking ship**. It is the last unshipped phase of v2.15.

Delivers, as a database-layer statement of the matrix in `<decisions>` below:

1. **`grants`** keyed `(user_id, scope, target_type, target_id, role)`, replacing `user_roles`; a
   **23-member `grant_permission` enum**; `user_can(scope, target_id, permission)` encoding the whole
   matrix in one place; `is_child_nominee` (direct parent only).
2. **The 97-policy rewrite** — 80 table policies and all 15 storage policies routed through `user_can`,
   with the 18 inline `auth_user_id = auth.uid()` re-derivations folded in and `is_candidate_self` deleted.
3. **Visibility reduced to one mechanism** — `projects.open_for_voters` plus two confirmation states
   (`nominations.confirmed`, `entities.confirmed`). The **10 per-row `published` columns are deleted**.
4. **New entity-user write capability** — entity users create and edit their own nominations, and a child
   nominee may create its own unconfirmed parent nomination.
5. **A fully declarative schema** — the 25 `ALTER TABLE … ADD COLUMN` sites in `schema/` merged into their
   `CREATE TABLE` bodies, `00002`–`00008` folded into a regenerated `00001`, and the parity gate collapsed
   to the one-line `cmp` its own docblock says the fold enables.
6. **`162-SPEC.md`** as the fixed normative reference (K4's stated home), plus pgTAP, a structural
   non-collapse guard, a per-verb storage paired assertion and a negative-control ledger.

## Explicitly NOT in this phase

- **Sign-up methods** (the auth-method × entity-type matrix, entity `email` / registration-code columns,
  the `code` / `open` / `parent_email` flows, entity-type selection at the identity entry point, and the
  `/candidate/complete-registration` route that fact 18 shows is **missing today**) → a new phase, brief
  § 6.1. **Recommended for v2.16** (§ 8.5).
- **The entity-app 9-step task flow** (self-service nomination wired to a real write — fact 22 shows the UI
  already collects nominations and the writer silently drops them; re-answer on nomination change; ToU and
  password steps unified) → a new phase, brief § 6.2.
- **A suggested-changes store** → **dropped by operator ruling** (see D-01).
- Per `162-DISCUSSION-POINTS.md` A5(a): any new admin/candidate UI; `packages/data` model changes; the
  `argument-condensation` / `question-info` job surfaces; the bank-auth / OIDC identity path.

</domain>

<decisions>
## Implementation Decisions

**All nine § 8 rulings in the brief are resolved.** Four by operator tick, one by direct matrix edit, one
by explicit ruling, three by the ★ default. Nothing is blocked on an operator answer.

### Requirement amendments (operator-authored)

- **D-01 — PRESHIP-02 criterion 4 is amended by the operator.** *"Yes — record it as my amendment."* No
  `change_suggestions` table and no `suggest` member of `grant_permission`; users who want a change they
  cannot make message an admin. PRESHIP-02 keeps its blocking-ship status; it loses only the
  `suggest for approval` branch and its tests. `162-DISCUSSION-POINTS.md` C3 is ticked **(c)**, which
  overrules that decision's ★. **162-01 quotes this ruling in `162-SPEC.md`; 162-02 edits the PRESHIP-02
  row in `REQUIREMENTS.md` and the ROADMAP entry to match.**
- **D-02 — criterion 1 is amended: two role levels, not three.** `admin` and `editor`. The eight user types
  in `162-USER-RIGHTS.md` span only those two; editor-management is the project-scope permission
  `project.manage_editors` and the entity-scope equivalent is `entity.invite_children`, so no third level
  is needed. An unused `owner` member in a security enum is untested surface. (Brief § 8.1(a).)
- **D-03 — criterion 6 is widened** (operator tick, A4(a)): **all 15** storage policies route through
  `user_can`. K2 assumed storage already followed table access by construction; that is false for the
  `candidate_*` family, which is a parallel implementation in exactly the sense criterion 6 forbids.

  **⚠ The census is CORRECTED 2026-09-15 and re-measured from `400-storage.sql`.** This decision
  previously read "the 7 `candidate_*` ones", and brief fact 3 carries the same slip — **seven is the
  NON-CALLER count, not the `candidate_*` count.** Measured:

  | Figure | Previously stated | Measured |
  |---|---|---|
  | Storage policies | 15 | **15** ✓ |
  | Policies routing through `can_access_project` | "already follows table access" | **8** — `authenticated_select_{public,private}_assets` + the six `admin_*` |
  | Policies **not** routing through it | — | **7** |
  | `candidate_*` policies | 7 | **6** — insert/update/delete × public/private |
  | The 7th non-caller | called "the eighth" | **`anon_select_public_assets`** |
  | `can_access_project` call sites | 11 | **10** — the 11th grep hit is the file's own `Depends on:` header comment |
  | Inline `EXISTS` sub-selects | 12 | **12** ✓ |

  **Why this matters beyond arithmetic:** an acceptance criterion asserting "7 `candidate_*` policies"
  would go red against a correct implementation. **162-14 and 162-17 must use the measured split.** Note
  also that the non-callers are not all the same problem — the six `candidate_*` inline a re-derivation,
  while `anon_select_public_assets` is an anon-read policy that belongs with § 3.4's visibility rules.

### The grants model

- **D-04 — `grants` replaces `user_roles` outright** (B1(a)); `user_roles`, `user_role_type` and
  `role_scope_type` are gone by the end of the phase. Under D-14 "gone" means absent from the declarative
  schema, not a `DROP` appended to it.
- **D-05 — one `entity` scope with a `target_type` discriminator** (B3(a)), with a CHECK tying
  `target_type IS NOT NULL` to `scope = 'entity'`. Not four entity scopes.
- **D-06 — `user_can` reads the grant set from the JWT, with table lookups only for hierarchy** (B5(a),
  hybrid). `is_child_nominee` is **direct parent only** (D4(a)) — a recursive CTE inside 97 policies is a
  performance hazard nothing has asked for.

  **⚠ CORRECTED 2026-09-15 — which permission `is_child_nominee` actually serves.** An earlier note here
  said the child hop is used by `entity.read_answers`, citing an `own + children` cell for OrgEditor in
  brief § 3.3. **That cell does not exist.** Every committed revision of § 3.3 reads
  `| entity.read_answers | ✓ | ✓ | ✓ | ✓ | own | own | own |` — the operator narrowed it to plain `own`
  before the documents were committed, and the stale reading was mine.

  **The corrected reading is what the other two sources have said all along**, so nothing in the model
  changes — only this note:
  - `162-USER-RIGHTS.md:90` — *"read contents and related entities basic (not answers unless public) data"*,
    which is a **nomination** right, not an entity-answers right.
  - Brief § 3.4 — *"via `is_child_nominee`, a related entity's **basic data only** (not answers unless
    public)"*.
  - Brief § 1.10 — records this explicitly as `is_child_nominee`'s role **narrowing**: `PRE-SHIP-REFACTORING.md`
    had it letting an organization's owner *edit* a candidate's data; `162-USER-RIGHTS.md` grants only
    `invite children` plus read of related-entity basic data.

  **So the child hop serves `nomination.read`, not `entity.read_answers`.** A parent reading a child's
  *answers* would contradict all three sources. 162-04 carries this as a `checkpoint:decision` with that
  as its recommended option — ratified once, since it decides whether `is_child_nominee` is reachable from
  the answers path at all.
- **D-07 — the user-type → grant-row mapping:**

  | User type | `scope` | `target_type` | `role` |
  |---|---|---|---|
  | RootAdmin | `global` | — | `admin` |
  | AccountAdmin | `account` | — | `admin` |
  | ProjectAdmin | `project` | — | `admin` |
  | ProjectEditor | `project` | — | `editor` |
  | Candidate | `entity` | `candidate` | `editor` |
  | OrganizationEditor | `entity` | `organization` | `editor` |
  | FactionEditor | `entity` | `faction` | `editor` |
  | AllianceEditor | `entity` | `alliance` | `editor` |

  **`ProjectEditor` is K4's "level-1 permissions short of full"** — `ProjectAdmin` minus
  `manage_editors`, minus `project.edit_project_settings`, minus `nomination.confirm`. K4 is satisfied by
  this row, not by a separate definition.

### The permission enum — 23 members

- **D-08 — the verb of `user_can` is a 23-member enum**, not `162-DISCUSSION-POINTS.md` B4's 3-verb
  read/edit/manage triple, which is far too coarse: the source separates `edit elections` from
  `edit questions` from `edit entities` from `edit nominations`, and `confirm` from `edit`.
  **The canonical list and the full role × permission matrix are `162-IMPLEMENTATION-BRIEF.md` §§ 3.2–3.3
  — the planner must read them; they are not restated here.** Three members are not in
  `162-USER-RIGHTS.md`'s list of 20 and exist because of the amendments:
  - **`project.edit_project_settings` / `project.edit_app_settings`** — D-09.
  - **`entity.confirm`** — D-10.
  - **`nomination.create_parent`** — D-12.
- **D-09 — "edit settings" splits along one line: does a policy read the value?** (Brief § 11.1.)
  `project.edit_project_settings` governs `projects` (`open_for_voters`, `lock_nominations` — the flags
  **RLS itself reads**) and is **admin only**. `project.edit_app_settings` governs `app_settings`
  (`settings` and `customization` JSONB — theme, copy, the auth-method matrix; read by the app, **never by
  a policy**) and **editors hold it too**. That line is also K3's line, so the split costs no new concept.
  An editor can retheme and re-word the running application without being able to open it to the public.
- **D-09a — ProjectEditor's three previously-unstated cells**, resolved by the operator directly in the
  matrix: `feedback.read` **✓**, `feedback.manage` **✓**, project settings **—**.

### Confirmation and public visibility

- **D-10 — `entities.confirmed boolean NOT NULL DEFAULT false`** on all four entity tables, backfilled
  `true` for existing rows. **Fact 28: no entity table has any confirmation concept today.** Set `true`
  by identity-provider sign-up, or by seeding with a name **and** an email or registration code (that
  second path depends on phase § 6.1 — fact 16 records that entities carry no `email` and no code column
  today, so **in 162 the only automatic setter is `identity-callback`**). Admins and project editors
  toggle it via `entity.confirm`.
- **D-11 — public read is transitive and conjunctive.** A nomination is public only when the project is
  open for voters **AND** the nomination is confirmed **AND** every entity that nomination links carries
  `confirmed = true`; an entity is public only through such a nomination. A confirmed nomination of an
  unconfirmed candidate is invisible, and so is the candidate. This closes a real hole: an admin could
  otherwise seed a placeholder name, confirm the nomination, and publish the placeholder.
- **D-11a — name immutability is conditional on `confirmed`, not absolute** (§ 8.7(a)). Protected name
  columns are writable while the entity is unconfirmed and frozen once it is confirmed — **frozen for the
  entity user; still editable by a holder of `entity.edit_immutable`** (admin / project editor). Otherwise
  `entity.edit_immutable` would be a permission nobody can exercise, and an operator could not fix a typo
  in a confirmed surname without unconfirming them. **Fact 27: a column grant cannot express this** —
  `303-column-grants.sql` is a single global REVOKE/GRANT pair — so it is a trigger reading `OLD.confirmed`,
  not a `WITH CHECK`.
- **D-11b — the 10 `published` columns are DELETED inside this phase** (operator tick, § 8.4(b),
  overruling the ★ that would have kept them one more phase). `open_for_voters` + the two confirmation
  states become the whole story, so after 162 there is **exactly one** way to ask whether a row is public
  — which is what criterion 2 asks for. **Fact 25: `access.voterApp` is an app-level switch, not an RLS
  one — "open for voters" has no database-level meaning today.**
- **D-11c — flip `nominations.unconfirmed` to `nominations.confirmed`.** Fact 20: the existing column
  defaults `false` meaning *confirmed*, while D-10's new column defaults `false` meaning *unconfirmed*.
  Two adjacent booleans reading in opposite directions is a defect waiting to happen, and 162-12 is already
  rewriting every reader.

### Nominations

- **D-12 — a child nominee may create its own unconfirmed parent nomination** (brief § 11.5). **The
  hierarchy already exists** — fact 32: `validate_nomination()` already requires a candidate's parent to be
  an organization or faction nomination, already enforces the shared
  (`election_id`, `constituency_id`, `election_round`) triple, and already returns early for a NULL parent,
  **so the independent-candidate exception is already the schema's behaviour and needs no work.** What is
  missing is only the right to insert the parent row — granted as `nomination.create_parent`, its **own**
  verb rather than a widening of `nomination.edit`'s `own` scope, because the row being inserted belongs to
  an organization and is by definition not the candidate's.
  **Five guards, all five required** — see brief § 11.5; the substantive ones are that the row is created
  unconfirmed, that no nomination already exists for that (organization, election, constituency, round),
  that `lock_nominations` is false, and that the candidate is inserting their own child nomination too.
- **D-12a — the free-text branch.** When the party is not an entity yet: **no parent row is created**, the
  candidate's own nomination carries `parent_nomination_id = NULL` and
  `custom_data.requestedParentOrganization = "<free text>"`, and an admin resolves it at confirmation time.
  ⚠ **That row is byte-identical to an independent candidate's in every column** — the *only* distinguisher
  is the presence of the key. Three consequences: the admin queue keys off that presence, not a status
  column; **a nomination carrying the key must not be confirmable** until an admin resolves it, or a
  candidate who asked for a party is published as an independent; and § 6.2's UI must make the candidate
  *choose* rather than infer.
- **D-12b — whose parent may a candidate create: any organization in the project** (operator tick,
  § 8.9(b)). D-13 removes the column the ★ option depended on, so tick and amendment agree. The reachable
  row count is bounded by D-12c's constraint, and nothing is published until an admin confirms, so this is
  a **queue-noise** surface rather than a public-facing one — but 162-12 still caps how many unconfirmed
  parents one candidate may originate, and the admin queue shows who created each.
- **D-12c — the nomination uniqueness key** is
  `(candidate_id, faction_id, organization_id, alliance_id, parent_nomination_id, election_id,
  constituency_id, election_round)` — an entity may be nominated once per election/constituency/round
  **unless nominated by a different parent**, which is what admits multiple parties nominating the same
  presidential candidate. **Fact 33: no uniqueness constraint exists on `nominations` today** beyond
  `external_id`.
  ⚠ **It MUST be written `UNIQUE NULLS NOT DISTINCT` — see D-24, which makes this a phase-wide rule and
  records that `user_roles` already carries the same hole today.** Written as a plain `UNIQUE` it enforces **nothing**
  on this table: `104-nominations.sql`'s CHECK guarantees exactly one of the four entity FKs is non-null,
  so **every row has three NULL entity FKs**, and `parent_nomination_id` is NULL for every top-level
  nomination — under default NULLS-DISTINCT semantics no two rows ever conflict. It would look like a
  guarantee in the schema, in review and in the diff, and close nothing. **Fact 36: `NULLS NOT DISTINCT` is
  a PostgreSQL 15 feature and `config.toml` pins `major_version = 15`** — available with no margin, so the
  constraint's comment must say it pins the floor. Name the constraint explicitly, per the precedent of
  `nominations_election_round_check` two lines below it in the same file.
- **D-12d — `parent_nomination_id`'s `ON DELETE CASCADE` needs a deliberate ruling** (fact 35). When an
  admin rejects a candidate-created placeholder by deleting it, **every candidate nomination under it is
  silently deleted** — including candidates who joined later and did not create it. Before D-12 no non-admin
  could create a parent, so this never mattered. Either the admin flow re-points children first, or the FK
  becomes `ON DELETE RESTRICT`. **Do not leave it CASCADE by default.**

### Entity columns

- **D-13 — `organization_id` moves from `candidates` to `factions`.** Removed from `candidates`; added to
  `factions` as `uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE` (`NOT NULL` is the
  operator's "required"; `SET NULL` is foreclosed by it and a faction without its organization is not a
  meaningful row). **A faction's parent nomination must be the nomination of that faction's own
  organization** — a tightening of the existing `validate_nomination()` check from *an* organization to
  *the* organization, and **fact 37** is that `factions` has no such column today, so a faction can
  currently be nominated under any organization at all.
  ✅ **This closes RES-7 / T-144-11**, open since 2026-08-23 (`WINDOWS.md` row 59): `column-map.ts` maps
  both `organization_id` (candidates, line 17) and `organization_id_nom` (nominations, line 32) to the same
  `organizationId` property, and `PROPERTY_MAP` is a last-wins reversal, so `FIELD_MAP.organizationId`
  resolves to a column on no table. **The collision's sole cause is two tables sharing a column name, one
  of which is now going away.** Close the todo in the same commit.

### Uniqueness keys — a phase-wide rule, added 2026-09-15

- **D-24 — every multi-column UNIQUE this phase writes must be `UNIQUE NULLS NOT DISTINCT`.** Two new
  constraints fall under it (`grants`' key and D-12c's nomination key), and both are no-ops without it.

  **The trap, stated once:** PostgreSQL's default `UNIQUE` treats NULLs as **distinct**, so two rows never
  conflict if any keyed column is NULL in either of them. A key containing a nullable column therefore
  enforces nothing *for exactly the rows that column is nullable for* — while looking like a guarantee in
  the schema, in review, and in the diff.

  **It is not hypothetical here — the schema already has one, and it is the table `grants` replaces:**

  ```
  user_roles: UNIQUE (user_id, role, scope_type, scope_id)
              scope_id uuid,  -- NULL for super_admin (global scope)
  ```

  Measured on this tree's PostgreSQL 15.8: two byte-identical global-scope grants **both insert**.
  `UNIQUE NULLS NOT DISTINCT` rejects the second, naming the constraint. **So the highest-privilege row in
  the system is the one the existing constraint cannot deduplicate**, and that is a live privilege-escalation
  surface, not a tidiness issue: revoking one of two duplicate rows leaves the privilege standing.

  **Swept, so the scope is known and bounded:** `user_roles` is the **only** existing instance — no other
  multi-column UNIQUE in `schema/` has a nullable member — and `NULLS NOT DISTINCT` appears **zero** times
  repo-wide. There is no analog to copy; both new constraints are writing something the tree has never used.

  **Applies to 162-03** (the `grants` key — `target_type` and `target_id` are NULL on every non-entity row,
  so three of the four scopes are unprotected without it) and **162-12** (D-12c — the `nominations` key,
  where the exactly-one-entity-FK CHECK guarantees **three** NULL columns in every row, so a plain `UNIQUE`
  protects nothing at all). **Fact 36: `NULLS NOT DISTINCT` is a PostgreSQL 15 feature and `config.toml:39`
  pins `major_version = 15`** — available with no margin, so each constraint's comment must say it pins the
  floor. A downgrade would silently turn both into the no-op above rather than fail to apply.

  **162-17 asserts both constraints by name, in both directions** — a duplicate rejected, and the
  legitimately-distinct case admitted.

### Settings homes (K3)

- **D-15 — RLS-read flags are typed columns on `projects`** (K3): `open_for_voters boolean NOT NULL DEFAULT
  false` (existing rows backfilled `true`, per D2(a)) and `lock_nominations`. **App-flow config stays in
  `app_settings.settings` JSONB**, typed in `dynamicSettings.type.ts` — fact 24: that table is already the
  established home, one row per project, `anon`-readable, and `preRegistration.enabled` already lives
  there. Putting settings on `projects` too would create the drift K3 was avoiding.
- **D-16 — `elections.election_type` is REPURPOSED to carry the nomination shape**
  (`organization_only` / `candidate_only` / `organization_list`), and its current `'general'` / `'local'`
  meaning is deleted along with its historical traces. **CORRECTED 2026-09-15** — this decision previously
  read "a new `nomination_shape` column; `election_type` left alone (§ 8.2(a))", which was the ★ default.
  It was wrong: brief § 8.2 carries a bold free-text operator note that overrules the box, and this
  document's own convention is that free-text beats a box.

  > **Reuse election_type for this because the current general, local is not actually used anywhere.
  > Remove historical traces and be careful when updating the seed files, although most or perhaps all
  > will be of the party list type.**

  **The premise was verified, and it holds with one nuance 162-07 must handle.** `election_type` has
  **exactly one production consumer**: `supabaseDataProvider.ts:245` maps it into the data model as
  `subtype: row.election_type ?? row.subtype ?? undefined`. Nothing reads `election.subtype` anywhere in
  the frontend — the only other reference is `dataObject.ts:97`'s generic getter and that adapter's own
  test. **So no product behaviour depends on `'general'` / `'local'`**, which is what the operator's note
  asserts.

  **The full trace list, measured. 162-07 re-derived it anyway (2026-09-16) and the re-derivation was
  right to happen:** it confirmed the three headline counts — 14 template files, 1 production read, 6
  adapter-test assertions — but corrected one anchor below (653, not 582; 582 is the `subtype`
  assertion the change invalidates) and found two omitted traces. Derive, do not trust. Fact 23's "~20 dev-seed
  templates" is high; the real corpus is **14 template files** plus:
  - `apps/supabase/supabase/schema/101-elections.sql:18` — the column declaration (`text`, becomes an enum)
  - `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:245` — **the one
    production read.** Repurposing the column means `subtype` would start receiving nomination shapes;
    **decide deliberately whether that mapping survives at all**, rather than letting it change meaning
    silently. Recommended: drop the `row.election_type ??` term, leaving `subtype: row.subtype`.
  - `supabaseDataProvider.test.ts:534,555,565,595,623,653` — six assertions pinning that mapping,
    including `expect(result[0].subtype).toBe('presidential')`. **They will fail and must be rewritten,
    not deleted.**
  - `packages/dev-seed/src/generators/ElectionsGenerator.ts:47`, `src/template/permittedKeys.ts:106`,
    `tests/fixtures/negctl-elections-sentinel.ts:38`, `README.md:144`
  - `packages/supabase-types/src/column-map.ts:44` (`election_type: 'electionType'`)
  - **`.claude/skills/database/schema-reference.md` — two traces this list omitted** (added
    2026-09-16 by 162-07's re-derivation): the `elections` column line and the column-map line. A
    skill doc is not swept by any test, so a stale one survives every gate and then teaches the next
    agent the retired meaning. **162-07 sweeps them.**

  Note the seeded values are `'general'` / `'local'` / `'presidential'` — a third value the fact did not
  record, live in the adapter test. The operator's note says *"most or perhaps all will be of the party
  list type"*, so the migration default is `organization_list`; confirm per template rather than assuming.
  **`162-SPEC.md` (162-01) must state the repurposing**, since it is a visible change to an existing
  column's meaning.

### Migration and schema mechanics

- **D-14 — the schema is fully declarative and there is no migration sequence.** Operator ruling: *"don't
  care about migrations, no supabase db has been published yet."* Therefore E1 is ticked **(c)** —
  `00001_initial_schema.sql` is rewritten in place — and § 8.8 takes **(a)**: `00002`–`00008` fold into it
  and the files are deleted. Every wave edits `schema/*.sql` declaratively and regenerates `00001`; **no
  plan creates a `000NN` file**, writes a `DROP COLUMN`, or adds a backfill for the sake of a deployed
  database.
  **Two measured reasons this is a risk reduction, not merely a tidy-up** — both from the parity guard's
  own docblock (`scripts/assert-schema-migration-parity.mjs`): *"Folding them into `00001` would collapse
  this check to a one-line `cmp`, but that deletes migration files — the most history-destructive act
  available — so the non-destructive form is used instead"*; and *"It reads ONLY `00001` … This is the
  LARGER of the two blind spots."* A 97-policy rewrite is precisely the change most likely to trip that
  blind spot. The guard's author declined the fold because it was not theirs to choose; it is the
  operator's, and the operator has chosen it.
  **K1's shim lifecycle survives** — it is a sequence of reviewable *commits*, not of files.
- **D-14a — merge the 25 `ALTER TABLE … ADD COLUMN` sites in `schema/` into their `CREATE TABLE` bodies.**
  **Fact 31**, by file: `106-app-settings.sql` ×1 (the operator's own example — the `CREATE TABLE` it
  alters is **thirteen lines above it in the same file**), `102-entities.sql` ×1 (24 lines above),
  `105-answers.sql` ×2, `300-auth-tables.sql` ×10, `500-external-id.sql` ×11. The two intra-file sites are
  unconditional. For the 23 cross-file sites, **move the column declaration and leave the concern file
  owning everything else** — indexes, triggers, grants, and a header comment that says which tables carry
  the column instead of adding it. **`300-auth-tables.sql`'s 10 are the exception: D-11b deletes them, so
  do not merge them.**
- **D-17 — the parity gate re-baselining obligation, restated for D-14** (E2's ★ read against a migration
  sequence that no longer exists): *the regenerated `00001` is reviewed as a diff in the same commit as the
  `schema/` edit that caused it.* `apps/supabase/README.md` also needs rewording, since the
  two-copies-that-must-agree framing is what the fold removes.
- **D-18 — `yarn db:types` regenerates `packages/supabase-types/` in every wave that changes the schema.**
- **D-19 — backfills still matter for the LOCAL database.** D-14 removes the *production* reason for them,
  not the local one: `yarn db:reset` re-seeds from `seed.sql` and the E2E suite builds its own project, so
  `open_for_voters` and `entities.confirmed` still need seed-time values or a reset stack is blank.

- **D-26 — the regenerated artefacts make this phase sequential, and `depends_on` is the only thing
  that enforces it** (measured 2026-09-16). GSD **recomputes** execution waves from each plan's
  `depends_on` and **ignores the frontmatter `wave:` field**, so the brief's § 5 wave numbers are a
  semantic grouping with no effect on what runs in parallel. Measured across the nine written plans:
  **seven regenerate `apps/supabase/supabase/migrations/00001_initial_schema.sql` and six regenerate
  `packages/supabase-types/src/database.ts`.** Both are generated wholesale from `apps/supabase/supabase/schema/`,
  so two plans regenerating them concurrently do not merely conflict — the conflict is **silent**: the
  later writer wins and can drop the earlier plan's schema edit while every test still passes, because
  the tests read the artefact rather than the diff. **Therefore every plan that touches `schema/` must
  name its schema-touching predecessor in `depends_on`**, even where brief § 5 puts them in the same
  wave. 162-07b was the first case and is chained behind 162-07 for exactly this reason — both planners
  reached that conclusion independently. Docs-only plans (162-01, 162-02) share no paths with the schema
  plans and may run alongside them.

### Flows (criterion 7)

- **D-20 — `invite-candidate` is in scope** (operator tick, G2(a)): it writes a grant instead of a
  `user_roles` row, **and its swallowed insert failure becomes a hard abort**. Today it `console.error`s
  and continues, which under the new model means a successfully-invited candidate with **no access at
  all**. Operator note: **"extend to cover all entity types, i.e. organization manager etc."** — the invite
  path is parameterised by entity type, not candidate-only.
- **D-21 — the generalisation is a phase-wide instruction, not a local one.** The operator's A4 note reads:
  *"Also generalise the coverage so that there is a public bucket for each entity type and write access is
  paired with `can edit answers(entity_type, entity_id)`. **This kind of generalisation should be applied
  as widely as possible.**"* Applied in 162-14 (storage), 162-10 and 162-12: **no policy names a single
  entity type where it could take one as an argument.** The G2 note asks for the same thing from the other
  side.
- **D-28 — four late corrections, and the pgTAP ordinal registry** (measured 2026-09-16 by 162-15 and
  162-16, each verified against the tree).

  1. **§ 11.6 says 10 partial indexes; there are 5** — `idx_elections_published`,
     `idx_candidates_published`, `idx_organizations_published`, `idx_questions_published`,
     `idx_nominations_published` — and they live in `300-auth-tables.sql`, not `200-indexes.sql`. The
     10-**column** figure is right. This is the phase's fifth corrected census.
  2. **`test_user_roles()` is called from 9 of the 12 pgTAP files, not all 12** — 66 sites naming 6
     fixture identities; `03-anon-read`, `08-triggers` and `11-question-rpcs` carry none. 162-06's M4 and
     162-15's census measured the same 66/6 independently, so the "all 12" figure is the outlier.
  3. **`502-email-helpers.sql` is a live, UNOWNED dependency on the objects 162-15 retires.** It declares
     `u_role public.user_role_type` and reads `FROM public.user_roles ur`. **No plan 162-01 … 162-14 names
     this file for that reason.** The enums cannot leave while a plpgsql body declares one, so 162-15
     inherits it. It is re-pointed but deliberately **not widened** past two entity kinds — that widening
     belongs to § 6.1's downstream phase.
  4. **`GRANT USAGE ON SCHEMA public TO supabase_auth_admin` sits inside the block 162-15 deletes**
     (`300-auth-tables.sql`, immediately above the `user_roles` grants). It is **schema-level, not
     table-level**: losing it leaves `supabase_auth_admin` unable to execute `custom_access_token_hook`
     (granted in `301-auth-functions.sql`), i.e. **every login fails**. 162-15 asserts it from
     `has_schema_privilege` after the deletion rather than assuming the line survives.

  **pgTAP ordinal registry** — resolved 2026-09-16 after three plans claimed `17-` and two claimed `15-`.
  Each planner picked the next free ordinal against the tree as it stood when it ran, which is correct
  alone and colliding collectively. Current assignment, one creator per file:
  `12-user-can` (162-04) · `13-shim-parity` (162-05) · `14-grants-migration` (162-06) ·
  `15-visibility-flags` (162-07) · `16-anon-visibility` (162-08) · `17-project-structure-authority`
  (162-09) · `18-entity-immutability` (162-13) · `19-entity-policies` (162-10) ·
  `20-storage-authority` (162-14) · `21-entity-organization` (162-07b) · `22-content-policies` (162-11) ·
  `23-nominations-write` (162-12). **A new plan takes the next free ordinal from this list, not from the
  tree.**

- **D-27 — two refinements to D-03's storage census, and one place A4(a) cannot be taken literally**
  (measured 2026-09-16 by 162-14, from the **applied** database rather than the file). First: the 12
  inline re-derivations sit in **8** policies — 8 of them in the six `candidate_*`, and **4 in the two
  `authenticated_select_*`, which ARE callers of `can_access_project`.** So "the non-callers" and "the
  policies carrying inline re-derivations" are overlapping but **different** partitions, and a plan that
  treats them as one set silently leaves four re-derivations standing. Second: **`anon_select_public_assets`
  cannot route through `user_can` in A4(a)'s literal sense.** 162-04 denies a JWT carrying no `grants`
  claim *by construction* — that is one of its named deny classes — and anon is exactly that caller, so
  routing the public-read policy through `user_can` would make every public asset unfetchable. It routes
  through 162-08's visibility helpers instead, and the storage-local copy of the rule is deleted; the
  spirit of A4(a) (one mechanism, no parallel implementation) is kept while its literal wording is not
  reachable. Recorded here rather than left in a plan, because 162-17's criterion-6 evidence must assert
  the right thing.

- **D-25 — the claim-reader census is five modules, not four, and the fifth is an authorisation gate**
  (measured 2026-09-16 at HEAD `cc750d3f3`, correcting `162-DISCUSSION-POINTS.md` fact 11 and brief § 5's
  "four frontend claim readers"). `apps/supabase/supabase/functions/send-email/index.ts` reads
  `payload.user_roles` directly out of the JWT payload and gates **bulk send** on
  `super_admin` / `account_admin` / `project_admin`. It is not a display read: when 162-06 changes the
  claim, `payload.user_roles || []` evaluates to `[]`, `isAdmin` goes false, and every admin loses bulk
  send — a silent authorisation outage in a module no plan named. **162-06 owns it.** Two further
  corrections to the same census: `requireAdminIdentity.ts` reads the *normalised* role rather than the
  raw claim, and there is no `adminJobsAuthorization.ts` in the tree — only
  `apps/frontend/src/routes/api/admin/jobs/adminJobsAuthorization.test.ts`, a test with no module behind
  it, which is its own finding and not this phase's to fix.

- **D-22 — `identity-callback` needs entity-type selection.** Fact 21: it always creates a `candidate` and
  writes `role: 'candidate'`; `162-USER-RIGHTS.md`'s "select entity type if election allows multiple" has
  no implementation and no entry point. In 162 it also becomes the only automatic setter of D-10's
  `confirmed`.

### Claude's Discretion

- The internal shape of `user_can` (CASE ladder, lookup table, or generated) so long as the matrix is
  encoded **once**.
- Wave-boundary commit granularity within the sequence in `162-IMPLEMENTATION-BRIEF.md` § 5.
- The exact form of the non-collapse guard in `lint-schema.mjs` (F2(a)) and of the per-verb storage paired
  assertion (F3(a)).
- Error message wording, subject to D-23.
- **No spike** (§ 8.6(a)): `user_can`'s cost is measured inside wave 1 and a regression is treated as a
  wave-1 defect. `can_access_project` already does a table lookup for the account hop, so the shape is not
  new, and wave 2's shim step is itself the behaviour-neutral measurement point.

- **D-29 — the 50 blocking checkpoints across all 18 plans were answered in one pass on 2026-09-16, and
  the answers are folded into the plans rather than asked during execution.** The answer sheet is
  `.planning/phases/162-permissions-auth-model-refactor/162-CHECKPOINT-DECISIONS.md`. Under its standing
  convention an **unticked box selects that item's ★ RECOMMENDED option**, and the document was returned
  with **one box ticked (S-4(a), which is itself the recommended option) and three operator NOTEs**; every
  other item therefore takes its recommendation. Each plan's `checkpoint:decision` task was converted to
  `type="auto"` carrying a `<ratified>` block that states the answer, its source item and the reasoning the
  operator was shown; each plan's `autonomous` frontmatter flipped `false → true`. **Consequence for
  readers of this phase:** a `<reversibility rating="one-way">` task in these plans no longer has a
  `checkpoint:decision` ahead of it, and `gsd-tools verify plan-structure` warns about exactly that. The
  warning is expected and is not a missing gate — the one-way doors were confirmed by a human **before**
  execution, in the decisions document, rather than mid-run.

- **D-30 — the two matrix gaps S-3 left open were CLOSED by operator disposition, not recorded as
  findings, and the enum is still 23 members.** `162-CHECKPOINT-DECISIONS.md` § S-3 asked whether three
  tables/surfaces the permission enum does not describe should be recorded as findings (option A,
  recommended) or closed by widening the enum (option B). The operator took **(A) — no 24th member** and
  then supplied dispositions in a NOTE, which is neither option as written:

  > account read = any role on account or its projects
  > bulk send = `project.edit_entities`

  Both are expressible over the existing vocabulary, which is why they close the gaps without contradicting
  S-2's ratified 23. The third gap, `admin_jobs`, is answered by **S-4 (ticked): `project.edit_questions`**.
  Where each lands:
  - **Account read → 162-09.** The `accounts` SELECT is gated on **grant existence** — any grant targeting
    this account, or any grant targeting a project belonging to it, plus the global-scope admin — while the
    `accounts` UPDATE keeps `account.edit_settings`. This is **not a `user_can` call**, because `user_can`
    takes a permission and this rule asks about grant existence; it needs its own `SECURITY DEFINER` helper.
    **It is the one place in this phase where the operator's answer adds work the plan did not contain.**
  - **Bulk send → 162-06**, which already owns `send-email` through D-25. The gate becomes
    `project.edit_entities` on the target project, which also **closes 161-13's residual** — *`send-email`
    accepts any admin role without comparing `scope_id` to the project* — because the new gate is
    project-targeted where the old role check was not.
  - **`admin_jobs` → 162-11**, recorded and not revisited.

  **Two knock-on effects on 162-17**, both folded into its plan: `accounts` is **no longer** a
  known-legitimate member of C-11's collapse allow-list (the reason C-11 cited for it was S-3's gap, which
  is now closed), and Q3's "record all three" becomes **record one, close two** — with each closure
  verified against the owning plan's SUMMARY before it is written, so an unwritten gate is still a GAP.

- **D-31 — `feedback.project_id` becomes `ON DELETE SET NULL`, which requires dropping its `NOT NULL`.**
  The operator's NOTE under § P-4 reads *"Check that feedback has on delete set null for project_id instead
  of delete."* Measured at fold-in time, `107-feedback.sql` declares `project_id uuid NOT NULL REFERENCES
  public.projects (id) ON DELETE CASCADE`, so this is a change and not a confirmation — and it is **two**
  statements, because `ON DELETE SET NULL` cannot fire into a `NOT NULL` column (the project delete would
  raise instead of orphaning the row). Discharged by **162-11 Task 2b**, added for this purpose.
  **One consequence is not settled by the note and is carried as a stated assumption:** both surviving
  policies on the table gate on `project_id`, so a row whose project id has gone NULL would be readable and
  deletable by **nobody** — retaining feedback only to make it unreachable. 162-11 therefore admits the
  **global-scope admin** on `project_id IS NULL` in both predicates, recorded in its SUMMARY under the word
  *assumption* so it can be overruled in one edit.

- **D-32 — `supabase test db` emits a prove summary, never raw TAP, and two classes of verify command
  in this phase were written as if it did.** Measured 2026-09-16 against the live database at the close
  of 162-03, on a fully passing estate (12 files, 401 assertions, exit 0, `Result: PASS`): `^ok` lines
  **0**, `^not ok` lines **0**. Any gate counting raw TAP lines therefore reads zero whether the suite
  passes or fails.
  - **Where it does NOT bite:** the great majority of plans check `RC=$?; test $RC -eq 0`, which is
    correct, and 162-10 additionally greps for prove's `looks like you planned` discrepancy line. No
    change needed.
  - **Where it does bite: 162-15's red-set differential** (`run_estate()`, two sites). Both red-sets come
    back empty regardless, so the comparison reports "nothing reddened" with equal confidence when
    something did — a gate that cannot fail, inside the plan that retires the shims and that must see
    162-06's biconditional RED before retiring it. Flagged in place in `162-15-PLAN.md` with the
    measurement, the dead end (pgTAP is **not resident** — `pg_extension` has no `pgtap` row; the CLI
    creates it transiently, so a bare `psql -f` dies at `plan(26)`), and the instruction to observe the
    replacement instrument red before adopting it. **162-15's executor owns the fix.**

- **D-33 — six `psql` verify sites piped a `ROLLBACK`-bearing `-Atc` result into `tail -1` without
  `-q`, and read the literal string `ROLLBACK` instead of the value.** Reported by 162-03's executor,
  reproduced directly before patching:

  ```
  psql -Atc "BEGIN; SELECT 42 AS n; ROLLBACK;" | tail -1   ->  ROLLBACK
  psql -q -Atc "BEGIN; SELECT 42 AS n; ROLLBACK;" | tail -1 ->  42
  ```

  Fixed in place at all six sites — 162-06 (3), 162-11 (1), 162-12 (1), 162-14 (1) — by adding `-q`,
  which suppresses command tags and cannot alter a value read. Re-scanned afterwards: **0 remaining**.
  Two related defects 162-03 reported are **not** repo-wide and need no sweep: its own Task 6 TAP count
  (superseded by D-32) and its `parseGeneratedEnum` anchor bug (fixed within that plan).

- **D-34 — broken verify instruments in this phase are systemic, not incidental, and at least one class
  reports GREEN on a query that errored.** Every executed plan has found them in its own plan text and
  replaced them: 162-04 four, 162-05 six, 162-06 seven. 162-06's finding is the severe one — a Task-4
  block printed `COMPLETENESS-GREEN` after a `db:reset` had removed the pgTAP helpers, so
  `create_test_data()` did not exist, the measurement came back empty, and a `;`-separated guard chain
  reported success anyway. 162-06 also had to repair **two instruments 162-05 had already documented and
  this plan reintroduced verbatim**, which is what makes it systemic: the defects were harvested between
  plans, so a plan being later is no evidence its gates are sounder.

  **Measured across the eleven then-unexecuted plans (2026-09-16):** 215 `<automated>` blocks, **193
  without `set -e`**, and **87 carrying the risky shape** — a command substitution assigned and then read
  after a `;`, with no failure check between. Concentrated in 162-07 … 162-14 and 162-16; 162-15 has 0 of
  the risky shape and 162-17 carries `set -e` in all 21 of its blocks, so the convention does exist and
  the later planning applied it.

  **Deliberately NOT mass-repaired.** Inserting `set -e` into 193 blocks would redden gates that
  legitimately depend on a non-zero exit mid-chain (`grep -q … || echo`, `cmd || true`), converting a
  silent-pass problem into a false-fail one across the whole phase. The executors have been the effective
  layer — each has caught and repaired its own — so the measurement is handed to them instead, as a
  quantified expectation rather than a warning. **Each remaining executor is told the count and told that
  a gate which cannot fail, or which contradicts its own criterion, is expected here and is to be
  repaired in place and recorded as a deviation** — keeping any ratified figure fixed and confining the
  fix, as 162-05 did when it minted a tenth identity rather than redefine "7 of 45".

  **AMENDED 2026-09-16 after 162-07, which invalidates the risk framing above.** D-34 counted blocks
  *without* `set -e` as the risk population. That was wrong, and the correction makes the exposure larger,
  not smaller: **`set -e` is INERT in this harness.** The executor runs zsh 5.9 through `eval`, where
  `ERR_EXIT` does not abort a failing simple command. Reproduced directly by the orchestrator:

  ```
  $ set -e; false; echo REACHED
  REACHED
  ```

  So the blocks *with* `set -e` are exactly as unguarded as the blocks without it. Recounted over the
  plans still unexecuted at that point: **203 `<automated>` blocks, 22 relying on `set -e`, 181 never
  having it — effective guarded count 0.** Every block must guard explicitly (`|| { echo …; exit 1; }`
  after each step, or `&&`-chaining), and no block may infer safety from a `set -e` on its first line.

  **Two zsh expansion traps follow from the same root and are not theoretical.** Both reproduced:
  - **`"$VAR:path"` applies a zsh history modifier.** With `BASE=abc123`,
    `"$BASE:apps/supabase/schema.sql"` expands to
    `/…/voting-advice-application-gsd/abc123pps/supabase/schema.sql` — the `:a` modifier absolutises the
    path **and eats the `a` from `apps`**. `git show "$BASE:apps/…"` is a common idiom in this phase and
    silently reads a garbage path; with `set -e` inert, the failure is not caught either. The fix is
    braces: `"${BASE}:apps/…"`. **Exposure measured: 2 sites, both inside 162-07 itself (handled there);
    0 in any unexecuted plan.**
  - **`"$VAR[...]"` is parsed as an array subscript**, failing with `bad math expression: operand
    expected` rather than matching. 162-07's own first sweep reported a false `0` from it. **Exposure
    measured: 1 site — `162-14`:629, in the gate that reads that plan's own ratified answers, where an
    error would have made the gate read zero matches. Patched to `${K}[…]` and verified in a live zsh;
    plan still passes `verify plan-structure`.**

- **D-35 — SUPERSEDED BY D-36 on 2026-09-17; recorded for its measurements, not as a live ruling.**
  ~~`entity_is_anon_visible` is FLATTENED, and the duplication it creates is GUARDED by 162-17.~~
  Operator decision 2026-09-17, after a measured investigation, amending V-6(A) in its letter but not its
  intent.

  **The problem 162-10 reported:** the entity SELECT read cost landed at 6.37x anon / 7.31x authenticated
  against a 2.0 budget, caused by nested `SECURITY DEFINER` calls, with a `57014` statement timeout in
  dev-seed under concurrent builds as the first symptom of the consumed headroom. 162-10 correctly
  refused to fix it, because no fix respected both V-6(A) and D-21.

  **What the investigation measured** (orchestrator, 5000 candidates + 5000 confirmed nominations, in a
  rolled-back transaction, each variant checked for row-correctness as well as time):

  | Variant | Time | Rows | Correct |
  |---|---|---|---|
  | Shipped — nested `SECURITY DEFINER`, depth 2 | 273 ms | 5000 | yes |
  | **Flat — one `SECURITY DEFINER`, logic inline** | **53 ms** | 5000 | yes |
  | Fully inline in the policy, no function | 0.44 ms | **0** | **NO** |

  The third row independently reproduces 162-08's original finding — the inline form is fast because it
  returns nothing, `projects` having no anon policy. It is recorded here so the cheap-looking option is
  never re-proposed without its correctness column.

  **Why single-definition and flat are irreconcilable — a fact, not a preference.** A `SECURITY DEFINER`
  function can never be inlined by the PostgreSQL planner. So "one definition" necessarily means "a
  call", and a call made from inside a `SECURITY DEFINER` function **is** the nesting being paid for.
  A core/wrapper arrangement (`SECURITY INVOKER` core + thin `SECURITY DEFINER` wrapper) was built and
  measured at only ~5% — the cores were not inlined — and is recorded as tried and rejected. The per-row
  `SECURITY DEFINER` call is the floor (~10.6 us/row); the nesting adds ~44 us/row on top, which is the
  ~80% that flattening recovers.

  **The ruling.** `entity_is_anon_visible` holds the logic inline. `project_open_for_voters` and
  `entity_has_confirmed_nomination` keep their signatures and their own direct callers, so each of those
  two sub-rules now exists in **two** expressions.

  **162-17 OWES THE GUARD THAT MAKES THIS SAFE**, and it is the whole basis on which the duplication was
  accepted: a clause asserting that the inline form inside `entity_is_anon_visible` is **equivalent** to
  the body of `project_open_for_voters` and of `entity_has_confirmed_nomination`, so divergence is a red
  test rather than a trusted convention. V-6(A)'s *intent* — no silent drift between two spellings of one
  rule — is preserved mechanically; only its letter changes. **Without that clause the duplication is
  unguarded and the ruling's premise fails**, so 162-17 may not treat it as optional.

- **D-36 — SUPERSEDES D-35. The composition is REVERTED to the pre-162-10 shape; V-6 moves from (A) to
  (C).** Operator decision 2026-09-17, taken on corrected measurements after D-35's flattening was
  measured and found neither cheap enough nor landable without a second fenced-file edit.

  **D-35 rested on a number that was wrong, and the record should say so.** The orchestrator's 53 ms
  "flat" figure was a **one-arm body whose correctness column was NO** — it implemented only the
  `candidate` arm, hiding every organization, faction and alliance and collapsing the transitive
  nominations set 5 -> 1. It reproduces at 57.3 ms and is not a valid target. The faithful four-arm
  flattening is 111.5 ms. The corrected table, identical fixture throughout, `md5(prosrc)` captured
  inside each timing transaction, every row checked for row-correctness as a SET:

  | Arrangement | anon | auth | Correct |
  |---|---|---|---|
  | **Pre-162-10 — helpers called at the top of each policy qual** | **39.4 ms** | **30.0 ms** | yes |
  | Flat composition, UNION ALL dispatch | 79.6 ms | 161.7 ms | yes |
  | Flat composition, four-arm CASE | 111.5 ms | 193.0 ms | yes |
  | Shipped — nested composition (162-10 as built) | 271.9 ms | 351.9 ms | yes |
  | One-arm inline (the withdrawn 53 ms target) | 57.3 ms | 141.2 ms | **NO** |

  **The cause is depth, not volume of logic.** Two `SECURITY DEFINER` helpers called at depth 1 cost
  39.4 ms; one `SECURITY DEFINER` composition that internally calls those same two (depth 2) costs
  271.9 ms. Nesting is the whole regression.

  **What is duplicated under D-36 is LESS than under D-35, which is part of why it was chosen.**
  Reverting the composition keeps `project_open_for_voters` and `entity_has_confirmed_nomination` as
  the **single definition of each sub-rule**, called directly. What repeats across the eight policies
  is only the *assembly* — the conjunction pattern. D-35's flattening would have duplicated the
  sub-rule **bodies** themselves, which is the more drift-prone kind.

  **What this costs, stated plainly:** V-6(A) is abandoned in favour of what its own option (C)
  described. "Is this entity publicly visible" is assembled in eight policies rather than composed in
  one; D-21's normalised-identity assertion no longer covers the SELECT family; and **162-17's guard
  must now hold eight assemblies identical rather than one or two expressions equivalent.** D-35's
  equivalence clause is withdrawn with the arrangement that needed it, and replaced by this.

  **What must NOT regress with the revert**, because it is the trap here: 162-10 also closed window 267
  by adding the `user_can('entity', id, 'nomination.read')` hierarchy disjunct to the authenticated
  SELECT policies, and converted twenty policies, and performed the D-21 renames. **Only the
  composition wrapper is being removed.** The hierarchy disjunct, the conversions and the renames all
  stand, and window 267 stays closed.

- **D-37 — count controls as `PLAN − PASSED`, never by counting `not ok` lines.** Discovered by 162-12
  measuring its own instrument, and strictly better than the guidance that preceded it. Two independent
  reasons a `not ok` count reads zero against a genuinely broken estate:
  1. `supabase test db` emits only a **prove summary**, never raw TAP (D-32) — so `grep -c '^not ok'`
     is 0 on a passing estate AND on a failing one.
  2. **A variant that ABORTS the transaction emits no `not ok` at all.** 162-12 scored its
     entity-disjunct control at **0** while that variant actually broke **38 of 40** assertions. This is
     the more dangerous of the two, because it reads zero precisely when the perturbation is most
     destructive — the worse the break, the quieter the instrument.

  **The instrument that works:** read the declared `plan(N)` and the passed count from prove's
  `Files=N, Tests=M` summary, and take the difference. It is immune to both failure modes, and it is
  what 162-12 re-measured all thirteen of its controls with. Every remaining plan should use it for any
  "how many assertions did this perturbation redden" figure.

- **D-38 — O-3(a) MUST NOT be executed literally: `300-auth-tables.sql` is not empty, it holds
  `public.grants`.** Measured by the orchestrator 2026-09-17, before dispatching 162-16.

  **The ruling's premise is false as measured.** O-3 asked what becomes of the file "once this plan and
  162-15 have between them emptied it", and its recommended option (a) justified deletion on § 11.4's
  rule — *"a schema file is where a concern is explained and enforced, and a file with no concern left
  is not one."* That premise was written before 162-03 executed. **162-03 declared the `grants` table in
  this very file**, so the file did not empty; it changed subject.

  Measured at `a2e82645e`:
  - `CREATE TABLE public.grants` appears in **exactly one** file in `schema/` — `300-auth-tables.sql:9`.
  - The file carries **62 non-comment lines**: the `grants` table with its unique key and two CHECKs,
    `idx_grants_scope_target`, its `ENABLE ROW LEVEL SECURITY`, the `supabase_auth_admin` grants, both
    `grants` policies, and the retired-column partial indexes 162-16 is actually there to remove.
  - It contains **zero** references to `user_roles`, `user_role_type` or `role_scope_type` — 162-15
    removed all of them.

  **Deleting it would delete the central table of the entire phase.** The condition option (a) states
  for itself — a file with no concern left — is unmet, so (a) does not apply on its own terms. This is
  not an overrule of the operator's ruling; it is the ruling's stated precondition failing a
  measurement, which is the same class of defect every plan in this phase has found in its own text.

  **What 162-16 does instead:** perform its real job in that file — remove the retired-column partial
  indexes and the column-adding statements — and **keep the file**, which now documents and enforces the
  grant model. Any `Depends on` header naming it stays correct and needs no correction. Record the
  changed subject in a header comment so the next reader is not misled by the filename's history.

</decisions>

<specifics>
## Specific Ideas

- **"One mechanism, not a parallel implementation."** The phase's own goal sentence, and the test for every
  deviation: if a policy re-derives a rule that `user_can` already answers, it is wrong even if it is
  correct.
- **D-23 — follow `validate_nomination()`'s existing error-message discipline.** It raises named, specific
  exceptions for every hierarchy violation (`'Faction nomination parent must be an organization nomination,
  got %'`). D-13's new check must name **both** organizations, or its failure will look identical to the
  existing parent-type error in a seed log.
- **Assert in both directions, always.** D-12c's constraint is the example: a test that only checks that a
  duplicate is rejected would stay green if someone later "simplified" the key by dropping
  `parent_nomination_id` — the case the operator gave as the *reason* for the shape. F4(a)'s negative
  control ledger is the house instrument for this.
- **Wave 2 and wave 6 are where a regression is most likely and least visible** — the shim introduction and
  the shim deletion. Wave 2 must be provably behaviour-neutral.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase's own decision set — read all three, in this order

- `.planning/phases/162-permissions-auth-model-refactor/162-USER-RIGHTS.md` — the operator's statement of
  the target model: eight user types, the 20 atomic rights, the 9-step task flow, the four sign-up methods.
  **Materially newer and more specific than the ROADMAP entry or PRESHIP-02.**
- `.planning/phases/162-permissions-auth-model-refactor/162-IMPLEMENTATION-BRIEF.md` — **the normative
  document for this phase.** § 1 the delta; § 2 facts 16–27 and §§ 11.5–11.8 facts 28–39, all measured at
  HEAD `440a7780f`; § 3 the target model (**§ 3.2 the 23-member enum and § 3.3 the role × permission
  matrix are not restated in this CONTEXT — read them there**); § 3.4 the public-read rules; § 4 the scope
  partition; **§ 5 the wave sequence and its 19 plans**; § 6 the downstream phases; § 8 the nine resolved
  rulings; §§ 10–11 the operator rulings and the eight amendments.
- `.planning/phases/162-permissions-auth-model-refactor/162-DISCUSSION-POINTS.md` — the decision set.
  **Four boxes are ticked** — A4(a), C3(c), E1(c), G2(a) — and **two carry binding margin notes**, on A4
  (D-21) and G2 (D-20). Everything unticked resolves to its `★ RECOMMENDED` option.

### Requirements and roadmap

- `.planning/REQUIREMENTS.md` — **PRESHIP-02**, blocking ship; criterion 4 amended by D-01, criterion 1 by
  D-02, criterion 6 by D-03. **162-02 edits this file.**
- `.planning/ROADMAP.md` § Phase 162 — goal, the seven success criteria, and the 2026-08-28 correction
  recording that criterion 2's read/write collapse is **confirmed present** (`can_access_project` is the
  same predicate on the SELECT policy at `302-rls.sql:84` and the UPDATE policy at `:88-89`).
- `.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § K (K1–K4) — **locked**: the shim lifecycle (K1),
  storage honouring the verb (K2), typed columns on `projects` for settings RLS must read (K3), and the
  SPEC as the home of the level-1 definition (K4).
- `.planning/PRE-SHIP-REFACTORING.md` § Permissions refactoring — the original source statement.

### The schema under rewrite

- `apps/supabase/supabase/schema/302-rls.sql` — the 80 table policies.
- `apps/supabase/supabase/schema/400-storage.sql` — the 15 storage policies, 7 of them the `candidate_*`
  parallel implementation D-03 widens criterion 6 to cover.
- `apps/supabase/supabase/schema/301-auth-functions.sql` — `can_access_project` (`:103`), `has_role`,
  `is_candidate_self`; the predicates D-04's shims wrap and 162-15 deletes.
- `apps/supabase/supabase/schema/300-auth-tables.sql` — `user_roles`, and the 10 `published` columns D-11b
  deletes (`:47-78`, with the file's own comment explaining the ALTER form D-14a addresses).
- `apps/supabase/supabase/schema/104-nominations.sql` — `parent_nomination_id` (`:47`, **`ON DELETE
  CASCADE`** — D-12d), `unconfirmed` (`:48` — D-11c), `custom_data` (`:23` — D-12a's home), the
  exactly-one-entity-FK CHECK (`:50-57`) that makes D-12c's `NULLS NOT DISTINCT` load-bearing, and the
  named-constraint precedent at `:58-59`.
- `apps/supabase/supabase/schema/011-validation-functions.sql` — `validate_nomination()` (`:226`), which
  D-13 tightens and whose error-message discipline D-23 cites.
- `apps/supabase/supabase/schema/102-entities.sql` — the four entity tables D-10 and D-13 change.
- `apps/supabase/supabase/schema/303-column-grants.sql` — **mentions `nominations` zero times** (fact 34):
  it protects only `candidates` and `organizations`, and only their UPDATE. D-12 requires a
  `GRANT INSERT (…)` column list for `nominations`, without which "create an *unconfirmed* parent" is a
  request the database cannot insist on.
- `apps/supabase/supabase/schema/106-app-settings.sql` — D-15's home; `:18` is D-14a's quoted example.
- `apps/supabase/supabase/schema/200-indexes.sql` — no uniqueness on `nominations` (fact 33);
  `idx_candidates_organization_id` (`:32`) goes with D-13.
- `apps/supabase/supabase/schema/500-external-id.sql`, `105-answers.sql` — D-14a's cross-file sites.

### Gates, guards and generated artefacts

- `scripts/assert-schema-migration-parity.mjs` — **read the docblock**; D-14 is built on its two stated
  findings, and D-17 changes what the gate is.
- `apps/supabase/scripts/lint-schema.mjs` — where F2(a)'s structural non-collapse guard lands.
- `apps/supabase/supabase/config.toml:39` — `major_version = 15`, the floor D-12c pins.
- `packages/supabase-types/src/column-map.ts:17,32` — the RES-7 collision D-13 closes.
- `packages/app-shared/src/settings/dynamicSettings.type.ts` — D-15's typed surface; `access.voterApp` is
  the app-level switch fact 25 contrasts with RLS.
- `CLAUDE.md` § Backend — `yarn db:types` after a schema change, `yarn db:lint:sql` against the applied DB.
- **`.claude/skills/database/schema-reference.md` and `rls-policy-map.md`** — `Skill("database")`. The
  policy map is the existing inventory of what this phase rewrites.

### Standing project rules that bind every plan

- **`CLAUDE.md` § E2E Hard Rule** — a failing E2E test is a **cardinal failure**; no plan completes while
  one is red, and there are **no known-flaky exemptions**. F5(a) puts a full suite at each wave boundary.
  **Check `tests/e2e-runs/` disk headroom first** — ENOSPC has voided full-suite runs in this worktree.
- `.agents/code-review-checklist.md` — checked by every plan.
- `tests/README.md` § Run — the preflight, and how to read its failure output field by field.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- **`can_access_project` is the shape `user_can` generalises**, not a departure from it: it already does a
  table lookup for the account hop, which is why § 8.6 rules no spike is needed.
- **`400-storage.sql` already routes through `can_access_project` at 11 sites**, so 8 of the 15 storage
  policies follow table access by construction — the deliverable there is the paired assertion. The other
  7 are non-callers: the **six** `candidate_*` policies plus `anon_select_public_assets` (D-03 — the
  census was corrected 2026-09-15; "7 `candidate_*`" was wrong, seven is the non-caller total).
- **`merge_jsonb_column` / `jsonb_recursive_merge`** (`900-test-helpers.sql`) already supply a patch-apply
  mechanism, should any settings work need one.
- **`custom_data jsonb` already exists on `nominations`** and is already writable, so D-12a's free-text
  branch needs **no new policy** — it is an ordinary self-nomination insert plus a JSONB key.
- **The nomination hierarchy trigger already enforces three of D-12's rules** (fact 32). D-13 adds one
  column to a `SELECT … INTO` that already runs — not a new round trip on the hot path.

### Established patterns

- **Paired `schema/*.sql` + migration edits** (fact 10) — **D-14 ends this**; from 162-02b there is one
  declarative source and a regenerated `00001`.
- **Named constraints under source control** (`nominations_election_round_check`) so pgTAP `throws_ok` has
  a stable handle — D-12c follows it.
- **Negative-control ledgers** as the house evidence instrument (F4(a)), with two-directional measurement
  and disclosed void runs. Phase 144's and 161's ledgers are the exemplars.
- **`RETURNS TABLE` nullability** — Phase 164 audited exactly three such RPCs and installed a single
  override mechanism. D-13 changes two `503-entity-rpcs.sql` return shapes, which is precisely what that
  guard exists to notice.

### Integration points

- **The JWT claim and its four frontend readers**, plus `invite-candidate` (A2(a), D-20) — the claim's
  shape changes from `user_roles` to `grants`, and the access-token hook emits it.
- **`identity-callback`** (D-22) — entity-type selection, the grant write, and D-10's `confirmed`.
- **`dev-seed`, `seed.sql`, the bulk-import RPCs, the adapter and ~43 E2E specs** — the blast radius of
  D-11b and D-13. This is the phase's largest non-policy cost.

### ⚠ Three measurements to take BEFORE writing the code they constrain

Not decisions — each can break a green suite, and each belongs to its plan's first task:

1. **Does any fixture emit a nomination D-12c's key would reject as a duplicate?** Check `seed.sql`, the 30
   built-in dev-seed templates and the E2E fixtures **before** writing the constraint.
2. **Does any fixture emit a faction with no organization?** D-13's column is `NOT NULL`, so such a row
   stops seeding.
3. **What breaks when `candidates.organization_id` leaves the two `503-entity-rpcs.sql` return shapes?**

</code_context>

<deferred>
## Deferred Ideas

- **Sign-up methods and entity onboarding** → brief § 6.1, recommended for **v2.16**. Includes the
  auth-method × entity-type matrix, `email` and `registration_code` columns on the four entity tables, the
  `code` flow wired to the `checkRegistrationKey` contract that **currently throws** (fact 17 — the UI
  strings already ship), the `open` flow, `parent_email` org→candidate invites through
  `entity.invite_children`, entity-type selection at the identity entry point, and **the `confirmed`
  setter D-10 defers to it**.
  ⚠ **Fact 18 is a live defect, not a future feature:** `invite-candidate` redirects to
  `/candidate/complete-registration`, **a route that does not exist** — the only occurrence of the string
  repo-wide is the Edge Function line itself. The e-mail invite flow is **broken end to end today**,
  independently of this phase, and could be pulled forward as a standalone fix.
- **The entity-app 9-step task flow** → brief § 6.2. Includes the identity-confirm step that sets D-10's
  and D-11's two flags together in one act, and **wiring step 7 to a real nomination write** — fact 22:
  the writer contract carries `nominations` through `preregisterWithIdToken` and `_preregister` passes only
  `firstName`, `lastName`, `email`, `projectId`, so **the UI already collects elections and constituencies
  and they are silently discarded**.
- **Suggested changes** → **dropped** by D-01, not deferred.
- **A transitive `is_child_nominee`** (D4(b)/(c)) — direct-parent-only ships; if criterion 1's descendant
  rule later needs two hops, that is a separate, measured change.

</deferred>

---

_Phase: 162-permissions-auth-model-refactor_
_Context gathered: 2026-09-15_
