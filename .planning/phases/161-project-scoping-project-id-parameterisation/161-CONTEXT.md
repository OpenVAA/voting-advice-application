# Phase 161: Project Scoping — `PROJECT_ID` Parameterisation - Context

**Gathered:** 2026-08-28
**Status:** Ready for planning
**Source of decisions:** `.planning/v2.15-DISCUSSION-POINTS.md` § J (J1–J2), § D3, § 0 fact 27, § N — the
operator's filled decision document, read at branch `integration/ship-12-squash`, HEAD `e1ab15f71`.

<domain>
## Phase Boundary

Every query this application issues names the project it is for, and an E2E run creates its own
project instead of requiring the whole local database to be reset first.

Delivers, in the roadmap's four criteria:

1. **A `PROJECT_ID` environment variable that does not exist today**, defaulting to the default project
   id and documented in `.env.example`. Its starting point is the hardcoded
   `const DEFAULT_SEED_PROJECT_ID = '00000000-0000-0000-0000-000000000001'` at
   `apps/supabase/supabase/functions/identity-callback/index.ts:31`.
2. **Every project-scoped query parameterised by it**, with a **guard** — not a reviewer — catching a
   query that is missing the parameter.
3. **`yarn test:e2e` no longer requiring `yarn db:reset` as a precondition**, proven by running the
   full suite green **twice in a row without an intervening reset**.
4. **The E2E prerequisite documentation in `CLAUDE.md` and `tests/README.md` updated to match**, with a
   grep for the retired "reset the DB first" instruction returning nothing.

Satisfies PRESHIP-01 (see `<open>` — that id is not registered in `.planning/REQUIREMENTS.md`).
Source: `PRE-SHIP-REFACTORING.md:3-6` § item 1.

**Depends on: Phase 156 (Supabase Schema Corrections).** What 161 assumes 156 has delivered:

- The `party` → `organization` rename (E1) has settled, so the project-scoped table list this phase
  must declare (criterion 2's guard) names tables that will not be renamed underneath it.
- The `303-column-grants.sql` and `102-entities.sql` column changes (E3, E4) have settled, so the
  adapter's column projections are stable while 161 rewrites their `.eq()` chains.
- 156's dispositions doc (E5a) exists, so schema questions 161 uncovers have a place to land rather
  than being re-litigated inside this phase.
- **161 does NOT assume 156 fixed the `app_settings` FK cascade gap** — see `<facts>` F9 and `<open>`
  O-1. That gap is discovered this session and is not in 156's criterion set.

**Downstream: Phase 162 (Permissions & Auth Model Refactor) depends on 161** — its roadmap entry reads
"**Depends on**: Phases 156 and 161 (schema and project scoping settle first)", and it is marked
**blocking ship**. So the `PROJECT_ID` shape this phase lands is an **interface 162 will be planned
against later**: the name of the variable, where it is resolved (server vs. client), and the predicate
the guard enforces all become inputs to 162's `grants` / `user_can(scope, uuid, verb)` model. 162's own
discussion is explicitly still open — the operator wrote **"Consider the phase 162 discussion open. I
will fill it in later."** (`v2.15-DISCUSSION-POINTS.md:728`) — so 161 must not assume any particular
162 shape, but must leave the project-id resolution point named and single.

**Not in scope:**

- The permissions/grants model itself (Phase 162).
- Multi-project *serving* — each deployed instance still serves exactly one project. This phase makes
  that fact explicit and enforced; it does not build tenant switching.
- Phase 155's `identity-callback` env-default hardening (see D-D3 below — 155 owns that edit).
- Any change to the E2E preflight (Phase 137's `globalSetup` gate), which this phase composes with
  rather than modifies.

</domain>

<decisions>
## Implementation Decisions

Per the decision document's own stated rule (`v2.15-DISCUSSION-POINTS.md:11-19`): **exactly one option
per decision carries `★ RECOMMENDED`; leaving every box unchecked = choosing the ★ option — identical
to ticking it.** A ticked non-recommended box overrules the ★; `**EDIT:**` / `**NOTE:**` free text
beats every box.

**In § J (this phase's section) the operator ticked nothing and wrote no free text.** Both J1 and J2
are therefore **CHOSEN at their ★ RECOMMENDED option, by default rather than by tick**. That is a
decision, not an absence of one.

### D-J1 ⚠ DECIDE — What guard catches an unparameterised query? (roadmap criterion 2)

**Question:** criterion 2 says "a query missing the parameter is caught by a guard rather than by a
reviewer". What is that guard?

**Won: option (a), by default (★ RECOMMENDED, unticked).**

> **(a) An ESLint/source rule asserting every `.from(<project-scoped table>)` chain in the adapter
> carries a `project_id` filter, with the scoped-table list declared explicitly.**

**Winning rationale (verbatim from the decision doc):** "criterion 2 says 'caught by a guard rather
than by a reviewer'; a declared table list is readable and fails at the call site. Same enforcement
shape as F4a, so one mechanism covers both."

**Rejected, and why (recorded so they are not re-proposed):**

- **(b) Rely on RLS to enforce scoping in the database** — "defence in depth and impossible to bypass;
  RLS returns *empty results* rather than failing, so an unparameterised query is silently wrong
  exactly where the phase wants it loud." **This is the decisive argument and it must survive into
  planning:** RLS is not the guard. RLS may still be *present* as defence in depth; it does not
  discharge criterion 2.
- **(c) Review-only, no guard** — "the criterion names the guard as the deliverable."

**What this binds, and what it leaves open:**

- **Binding:** the guard is *static*, fails *at the call site*, and reads from an **explicitly declared
  list of project-scoped tables**. The list is configuration a reader can audit, not an inferred set.
- **Binding:** it shares its enforcement shape with **F4(a)** (Phase 157's adapter-import guard), which
  chose "ESLint `no-restricted-imports` with an explicit `files`-scoped allowlist, enforced by
  `lint:check`". "One mechanism covers both" means the same *gate* (`lint:check`) and the same
  *posture* (declared allowlist, fails by name).
- **Claude's discretion / for research:** whether the mechanism is a custom ESLint rule or a committed
  `scripts/assert-*.mjs` node script. `no-restricted-imports` cannot express "this `.from()` chain
  lacks an `.eq('project_id', …)`", so F4(a)'s literal rule does not transfer — only its shape does.
  Both idioms already exist in-tree (F10 below). Planner picks; the criterion is met either way as
  long as it runs inside `yarn lint:check`.
- **Scope note for the planner:** the guard must cover the **read** path as well as the write path.
  Today the read path (`dataProvider/`) has **zero** `project_id` references (F5) — a guard scoped to
  "where `project_id` already appears" would pass a completely unscoped provider.

### D-J2 — E2E project lifecycle (roadmap criterion 3)

**Question:** who creates the test project, when, and who tears it down, such that `yarn test:e2e` no
longer requires `yarn db:reset`?

**Won: option (a), by default (★ RECOMMENDED, unticked).**

> **(a) A fixed `E2E_PROJECT_ID`, created by Playwright global setup if absent and torn down after.**

**Winning rationale (verbatim from the decision doc):** "deterministic, debuggable (the same id every
run), composes with the existing preflight in global setup, and satisfies 'green twice in a row
without an intervening reset' by construction. Note the known interaction: seed teardown must
unregister invited auth users (already fixed 2026-06-02) or the second run hits 'already registered'."

**Rejected, and why:**

- **(b) A fresh uuid per run** — "perfect isolation between runs; leaks a project per crashed run and
  makes a failed run's data unfindable afterwards."
- **(c) One project per Playwright worker** — "maximal parallel isolation; multiplies seed cost by the
  worker count and complicates every fixture that assumes one dataset."

**The lifecycle, stated in enough detail to plan against:**

| Question | Answer |
|---|---|
| **Which id?** | A **fixed, well-known** `E2E_PROJECT_ID`. It must be **distinct** from the default/seed project id `00000000-0000-0000-0000-000000000001`, which is what `TEST_PROJECT_ID` and `DEFAULT_SEED_PROJECT_ID` both already are (F6) — reusing it would leave E2E sharing the default project and would not deliver criterion 3. |
| **Who creates it?** | Playwright's **`globalSetup`** — the same hook Phase 137's preflight lives in (`tests/playwright.config.ts`) — **if absent**. Creation is idempotent: present → reuse, absent → create. |
| **When?** | Before the first spec body, alongside/after the preflight. `globalSetup` is the only hook that covers 100% of invocations (`yarn test:e2e`, bare `npx playwright test`, `--project=X`, `--grep`) — Phase 137 D-04 chose it for exactly this reason, and the setup-project graph has parallel dependency-less roots so a dependency edge would leave a family ungated. |
| **Who tears it down?** | The run's own teardown. Because `E2E_PROJECT_ID` is fixed and creation is idempotent, teardown MAY be a no-op that leaves the project row in place between runs — what matters is that run *N+1* starts from a state run *N* left, with no `db:reset` in between. The planner must state which it is. |
| **What must be true for "twice in a row" to hold?** | The known auth-user interaction: seed teardown unregisters invited auth users (fixed 2026-06-02, in project memory) or the second run hits "already registered". |

**Structural constraint the planner must respect — this nearly forces (a):** the frontend resolves
public env through **`$env/dynamic/public`** (`apps/frontend/src/lib/utils/constants.ts:1`), read from
the *server process's* environment. `yarn dev` is started **before** the suite (the preflight asserts a
live server on the port and has no skip path). A uuid minted inside Playwright's `globalSetup`
therefore **cannot reach an already-running dev server** without restarting it. A **fixed** id known
ahead of time is the only lifecycle compatible with the existing start-server-then-run-suite workflow.
Option (b) is not merely worse here; it is close to unimplementable without restructuring how the dev
server is launched.

### D-D3 — The 155/161 boundary on `identity-callback:197`

**Question:** `identity-callback/index.ts:197` reads
`const projectId = project_id || Deno.env.get('DEFAULT_PROJECT_ID') || DEFAULT_SEED_PROJECT_ID;`
Phase 155's D2 says throw on missing env defaults; Phase 161 introduces `PROJECT_ID`. Which phase
touches this line?

**Won: option (a), by default (★ RECOMMENDED, unticked).**

> **(a) Throw in 155 on missing `DEFAULT_PROJECT_ID`; let 161 rename/converge the variable.**

**Winning rationale (verbatim):** "155 ships its own criterion without waiting on 161, and 161's
parameterisation arrives at a call site that already fails loudly rather than one that silently seeds."

**Ownership — record this so 155 and 161 neither collide nor both skip it:**

| Artifact | Owner | What that phase does |
|---|---|---|
| `identity-callback/index.ts:197` — the `\|\|` env-default chain | **Phase 155** | Removes the silent fallback; the function **throws** when `DEFAULT_PROJECT_ID` is missing. Covered by 155's D2(a) guard ("no `Deno.env.get(...)` followed by `??`/`\|\|` in the functions tree"). |
| `identity-callback/index.ts:31` — `const DEFAULT_SEED_PROJECT_ID = '00000000-…-0001'` | **Phase 161** | Removes / parameterises the constant itself. Criterion 161-1's own words: "The value it replaces is the hardcoded `const DEFAULT_SEED_PROJECT_ID` … that constant is the starting point, and it no longer supplies a silent fallback once the variable exists." |
| The **name** — `DEFAULT_PROJECT_ID` vs. `PROJECT_ID` | **Phase 161** | 161 owns the "rename/converge the variable" half. See `<open>` O-2 — the name is genuinely contested across three sources. |

**Sequencing consequence 161 must plan for:** 155 runs *before* 161 and will have made line 197 throw.
When 161 arrives, that line is expected to read as a throw-on-missing, **not** as the `||` chain quoted
above. If 155 has not yet landed when 161 is planned, the planner must not assume it — but must also
not re-do 155's edit. Verify the line's actual state at planning time.

**Rejected, and why:** (b) "Defer this one site to 161" — "leaves a named criterion-2 site open through
six intervening phases, and 155's guard (D2a) would have to carve out an exception." (c) "Introduce
`PROJECT_ID` early, in 155" — "pulls 161's central decision into a phase that has not discussed it, and
161's guard work would land against a half-built convention."

### Applicable cross-cutting decisions (§ N)

All three § N decisions are **unticked → ★ RECOMMENDED wins by default.**

- **D-N1 (a):** Phase 152's comment-hygiene scan lands in **`yarn lint:check`** and runs *before* 161.
  Consequence for this phase: **every comment 161 writes is authored under the post-152 convention** —
  no planning-artifact paths, no phase/plan numbers, no decision ids, no historical narrative in
  source comments. 161 will add comments (a declared scoped-table list wants explanation; so does a
  fixed `E2E_PROJECT_ID`); they must survive 152's committed scan.
- **D-N2 (a):** Follow-up items 161 uncovers but does not fix are filed as
  **`.planning/todos/pending/` entries during this phase** — that register is already this project's
  mechanism and `/gsd-discuss-phase` cross-references it automatically. This is where the `<open>`
  items below go if the planner scopes them out.
- **D-N3 (a):** This document is the phase's CONTEXT.md; the shared decision record stays at
  `.planning/v2.15-DISCUSSION-POINTS.md` § J / § D3 / § 0 / § N. Downstream agents read this file;
  the shared doc is the citation, not a second required read.

### § 0.1 — the factual baseline (the one ticked box that touches this phase)

The operator **ticked (c)** at `v2.15-DISCUSSION-POINTS.md:77`:

> **(c) Also correct `.planning/ROADMAP.md:1003-1217` in place** — the nine ⚑ rows are edited into the
> phase entries now, so the roadmap stops carrying false premises.

(c) reads "**Also**" — it is additive to the ★ (a), so both hold: **all 33 § 0 facts are the run's
factual baseline**, each phase's CONTEXT.md restates the ones it owns, *and* the ROADMAP is being
corrected in place. **A separate agent is doing that ROADMAP edit concurrently with this document.**

**Precedence rule, applied here:** where the roadmap and a § 0 fact disagree, **the fact wins.** As
read this session the Phase 161 roadmap entry (`ROADMAP.md:1168-1183`) already carries its
"**Corrected 2026-08-28** … fact 27" preamble and agrees with fact 27 — so on the ⚑ point there is no
live disagreement to resolve. One roadmap number is *not* a § 0 fact and is restated with a
measurement below: the "31 `project_id` references" baseline (F4).

### Claude's Discretion

- The concrete guard mechanism for D-J1 (custom ESLint rule vs. `scripts/assert-*.mjs`), provided it
  runs in `yarn lint:check` and reads from an explicitly declared table list.
- The literal value of the fixed `E2E_PROJECT_ID` uuid, provided it is not
  `00000000-0000-0000-0000-000000000001`.
- Whether teardown deletes the E2E project row or leaves it for idempotent reuse — but the choice must
  be **stated** and must survive the twice-in-a-row proof.
- Module layout of the project-create/teardown helper and where it sits relative to
  `tests/tests/utils/supabaseAdminClient.ts`.
- Exact wording of the `CLAUDE.md` / `tests/README.md` edits (criterion 4), within the site list in F11.


### Decision index (machine-readable)

One bullet per decision above, in the grammar `plan-phase`'s decision-coverage gate parses.
The sections carry the reasoning and evidence; **this is an index, not a summary — plan from
the sections.** It lives inside `<decisions>` because the parser reads only this block when
one is present, and ignores `###` headings entirely.

- **D-J1:** What guard catches an unparameterised query? (roadmap criterion 2)
- **D-J2:** E2E project lifecycle (roadmap criterion 3)
- **D-D3:** The 155/161 boundary on `identity-callback:197`

</decisions>

<facts>
## Measured Facts

All measured this session at branch `integration/ship-12-squash`, HEAD `e1ab15f71`. Every file:line
below was opened and confirmed.

### F1 ⚑ — fact 27: no `PROJECT_ID` env exists at all. The default project id is hardcoded.

`apps/supabase/supabase/functions/identity-callback/index.ts:31`

```ts
const DEFAULT_SEED_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
```

**This constant is the phase's actual starting point.** There is no `PROJECT_ID` variable anywhere in
the repo — a repo-wide grep for `PROJECT_ID` returns only: `DEFAULT_PROJECT_ID` (the Edge Function env,
documented at `identity-callback/index.ts:22`, read at `:197`), `TEST_PROJECT_ID` (the dev-seed / tests
constant), `PROJECT_IDS` (an unrelated k6 benchmark array), the `PRE-SHIP-REFACTORING.md:4` line asking
for the variable, and vendored yarn code. **The variable criterion 1 requires does not exist; it is
created from zero.**

### F2 — the D3 collision site, verbatim

`apps/supabase/supabase/functions/identity-callback/index.ts:197`

```ts
const projectId = project_id || Deno.env.get('DEFAULT_PROJECT_ID') || DEFAULT_SEED_PROJECT_ID;
```

Both the § 0 fact-13 line numbers (`:169,197,361`) and fact 27's `:31` are confirmed correct as
measured; the roadmap's *earlier* numbers (`:168,196,341`) were the drifted ones and are already
corrected. `identity-callback/index.ts:22` documents the env: "DEFAULT_PROJECT_ID: Project to assign
self-registered candidates to".

### F3 — the schema is already project-scoped; only the code is not

`apps/supabase/supabase/schema/100-tenancy.sql:16-22` defines `public.projects`, and its header at `:3`
states "All content tables reference projects via project_id FK with ON DELETE CASCADE." Measured, **13
tables carry a `project_id` FK to `public.projects`**. No schema change is needed to *scope* queries —
the columns are all there. (One FK is missing its cascade; see F9.)

### F4 — the "31 `project_id` references" baseline, measured

The roadmap's criterion 2 states "the adapter carries **31 `project_id` references** today as the
baseline to convert". That number is **not** a § 0 fact, so it is restated here with a measurement:

| Location | `project_id` refs |
|---|---:|
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | 12 |
| `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts` | 4 |
| `apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts` | 4 |
| `…/dataWriter/supabaseDataWriter.test.ts` + `…/adminWriter/supabaseAdminWriter.test.ts` | 11 |
| **Total under `adapters/supabase/`** | **31** |
| `apps/frontend/src/lib/api/adapters/supabase/dataProvider/**` | **0** |

**31 is correct** — but 11 of them are in two test files, and **20 are in production sources, all three
of which are writers.** The count is a fair baseline; it is not a map of the work.

### F5 ⚠ — the read path is not project-scoped at all, and a pending todo already says so

`.planning/todos/pending/frontend-project-id-scoping.md` (priority: **high**, filed from the Phase 58
UAT session, 2026-04-23) is this phase's most important existing input. Its measurement:

> The frontend's Supabase data provider (`…/dataProvider/supabaseDataProvider.ts`) currently queries all
> content tables (`elections`, `constituencies`, `candidates`, `nominations`, `questions`,
> `question_categories`, `organizations`, `app_settings`, …) **without a `project_id` filter**.
> Multi-tenant separation today relies entirely on RLS (`anon` sees only `published = true` rows) — it
> does not scope by project.

Independently confirmed: **zero** `project_id` / `projectId` occurrences under `dataProvider/`. The
todo's own five-step minimal shape is a ready-made skeleton for criterion 1 + 2:

1. Add the env to `.env.example`, document in `CLAUDE.md` (Deployment section).
2. Expose via `constants.<VAR>` alongside `PUBLIC_SUPABASE_URL` (`apps/frontend/src/lib/utils/constants.ts`).
3. Chain `.eq('project_id', …)` on every query against a project-scoped table. `app_settings` is
   `UNIQUE(project_id)` so `.single()` + `.eq` is the right shape there.
4. `get_nominations` RPC already receives `p_election_id`/`p_constituency_id`; **confirm whether it
   also needs a `p_project_id` parameter or whether the join chain guarantees project scoping
   transitively.**
5. If unset, **fail fast with a descriptive error at adapter construction**.

Its scope boundary is also useful: "Voter (anon) paths only in this ticket. Candidate/admin paths
authenticate and already have project context via `can_access_project()`." 161's criterion 2 says
*every* project-scoped query, so 161 is **wider** than the todo — but the todo's fail-fast-at-construction
idea (step 5) is a second, runtime guard that complements the static guard D-J1 chose.

Note the todo names the variable **`PUBLIC_PROJECT_ID`**, not `PROJECT_ID`. See `<open>` O-2.

### F6 — `TEST_PROJECT_ID` already exists, and it is the *same uuid* as `DEFAULT_SEED_PROJECT_ID`

- `packages/dev-seed/src/supabaseAdminClient.ts:37` —
  `export const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000001';` ("Stable UUID for the
  default test project, from seed.sql.")
- Re-exported for the suite at `tests/tests/utils/supabaseAdminClient.ts:45,52`.
- `packages/dev-seed/src/ctx.ts:88` — `projectId: template.projectId ?? '00000000-0000-0000-0000-000000000001'`.

**Consequence for D-J2:** today "the test project" and "the default project" are the *same row*. A
`E2E_PROJECT_ID` that reuses this uuid would deliver nothing. The phase needs a genuinely distinct id.

### F7 ✅ — dev-seed can already seed into an arbitrary project id

This is the largest existing enabler for criterion 3, and it means the seeding half of J2(a) is mostly
already built:

- `packages/dev-seed/src/template/schema.ts:124` — `projectId: z.string().regex(UUID_SHAPE, 'Invalid UUID').optional()`
  — templates already accept and validate a project id.
- `packages/dev-seed/src/writer.ts:74` — `projectId?: string;` on the writer options, consumed at `:110`.
- `packages/dev-seed/src/ctx.ts:88` — the default applies only when the template omits it.

### F8 ⚠ — but dev-seed cannot CREATE or DELETE a project

`packages/dev-seed/src/supabaseAdminClient.ts:15-18`:

> Bulk-import routing note: `bulk_import` RPC's `processing_order` accepts exactly 11 of 16 non-system
> tables. **`accounts`, `projects`**, `feedback`, `constituency_group_constituencies`,
> `election_constituency_groups` are **NOT** in that list. Callers must route those elsewhere (**writer
> strips accounts/projects**, …).

And `runTeardown` deletes by **`external_id` prefix** across `ALLOWED_TEARDOWN_TABLES` (10 tables,
`packages/dev-seed/src/index.ts:96`) — it has no notion of a project. **So "create the project if
absent, tear it down after" is genuinely new capability**, most likely a direct service-role
insert/delete against `public.projects` (plus its required `accounts` parent — `projects.account_id` is
`NOT NULL REFERENCES public.accounts(id)`, `100-tenancy.sql:18`).

### F9 ⚑ NEW (not in § 0, not in 156's criteria) — `app_settings` is the one `project_id` FK without `ON DELETE CASCADE`

Measured across `apps/supabase/supabase/schema/*.sql` — 13 FKs to `public.projects`, 12 with
`ON DELETE CASCADE`, one without:

```
106-app-settings.sql:8   project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id),
```

versus e.g. `101-elections.sql:5`, `102-entities.sql:5,26,54,74`, `103-questions.sql:7,32`,
`104-nominations.sql:17`, `107-feedback.sql:24`, `108-admin-jobs.sql:9` — all `… ON DELETE CASCADE`.

**Why it matters to this phase:** "delete the project row and everything under it disappears" is the
cleanest possible E2E teardown and is what makes criterion 3 achievable without `db:reset`. As the
schema stands, `DELETE FROM public.projects WHERE id = <E2E_PROJECT_ID>` will **fail with a foreign-key
violation** raised by `app_settings`, unless the `app_settings` row is deleted first. Filed as `<open>`
O-1 because the fix is a schema change and schema is Phase **156**'s domain — 161's upstream.

### F10 — the guard's landing zone already exists, with three precedents

- `package.json:35` — `"lint:check": "turbo run lint && eslint … tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring"`.
  The chain is the gate; membership in it is what "enforced by `lint:check`" means (and Phase 144
  established that the assertion is on **chain membership**, not position).
- `package.json:25-27` — three committed node guards already in this shape:
  `scripts/assert-unit-test-coverage.mjs`, `scripts/assert-i18n-catalog-namespaces.mjs`,
  `scripts/assert-a11y-scan-wiring.mjs`.
- `packages/shared-config/eslint.config.mjs:144` — `no-restricted-imports` is already configured, which
  is the literal mechanism F4(a) chose for Phase 157. It **cannot** express D-J1's predicate (an
  import rule cannot see a missing `.eq()` on a call chain), so 161 shares 157's *shape*, not its rule.

### F11 — criterion 4's exact doc targets

| Site | Current text |
|---|---|
| `CLAUDE.md:281-285` | The "Running tests after changes" block: `# Full E2E (requires Supabase running)` / `yarn db:reset` / `yarn dev` / `# Wait for services to be healthy` / `yarn test:e2e`. **This is the primary retired instruction.** |
| `tests/README.md:83` | The manual reseed chain: `yarn db:reset && yarn db:seed --template e2e/base && yarn dev:clean`. |
| `tests/README.md:248` | State assumption: "Fresh database with only `test-` prefixed rows". |
| `tests/README.md:276` | Pitfall: "**`yarn db:reset` in another terminal will wipe the suite mid-run** — the teardown projects are the only legitimate path to clear test data." |
| `tests/README.md:7` | `# Prereqs: yarn install && (in another shell) yarn dev` — already correct; states no reset. |

**The literal string "reset the DB first" does not appear anywhere in the repo.** Criterion 4's grep is
therefore a *class* grep (`db:reset` as a stated E2E precondition in live docs), not a literal one.
Phase 137's D-14 set the precedent for scoping such a grep: **live docs only** — `CLAUDE.md`,
`tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md`; archived `.planning/milestones/**` is untouched
because those are the historical record. Apply the same scoping here, and note that
`CLAUDE.md:17,81,82,92,93,307,403` document `db:reset` as a *command* — those stay; only the ones
stating it as an **E2E precondition** are retired.

### F12 — how E2E isolates today: `external_id` prefixes inside one shared project

- `tests/tests/setup/shared/setupFromTemplate.ts:97-98` — `probeFreshDatabasePrecondition(client, prefix)`,
  gated by `const requireFresh = process.env.E2E_REQUIRE_FRESH_DB === 'true';`. **Default is a
  `console.warn`, not a failure.** `:77` — `const BASELINE_SEED_PREFIX = 'seed_';` excludes dev-seed's
  own baseline rows from the contamination probe.
- `tests/tests/setup/shared/base.setup.ts:38` — the base setup pre-wipes foreign namespaces
  (`'e2e-perm-'`, `'e2e-bankauth-'`) before seeding, with an in-file comment explaining that an aborted
  run used to "silently wedge voter-journey's exact-count assertions in the blocking default suite
  until an out-of-band `yarn db:reset`".
- `tests/README.md:260-272` — the setup/teardown project table; every teardown is prefix-scoped.

**Read this as the problem statement for criterion 3.** The whole prefix apparatus exists *because*
every dataset shares one project. A per-run project makes contamination structurally impossible rather
than swept — and `E2E_REQUIRE_FRESH_DB` / `probeFreshDatabasePrecondition` become candidates for
retirement or re-aiming once scoping is by project. **The planner must decide their fate explicitly**;
leaving a warn-by-default freshness probe that no longer describes reality is exactly the stale-doc
class this milestone exists to close.

### F13 — the known contamination incident this phase would have prevented

`.planning/todos/pending/2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md`: `yarn test:unit`
tears down only in `beforeAll` with no `afterAll` counterpart
(`packages/dev-seed/tests/integration/default-template.integration.test.ts:191`), leaving the entire
`default` template (`elections=1 · question_categories=4 · questions=26 · candidates=328 ·
nominations=377`) in the live DB. Phase 144 lost a full suite to it — **8 failed / 79 did not run / 48
passed** — and recovered `135 passed / 0 failed` only by re-inserting a `db:reset`. The todo's option 2
is "make `yarn test:e2e` refuse to start against a dirty database (promote the existing freshness probe
from a warning to a hard failure)". **161 makes a third answer available**: with per-project scoping,
`test:unit`'s residue lands in the *default* project and is invisible to an E2E run scoped to
`E2E_PROJECT_ID`. If the planner believes that, it must be **proven**, not asserted — seed the
contamination deliberately, then run the suite green.

### F14 — the E2E cardinal rule applies with full force to this phase's own verification

Per `CLAUDE.md` § "E2E Hard Rule (cardinal failure)", quoted because every clause bites here:

> **Failing E2E tests are a CARDINAL FAILURE. No task may proceed, complete, or be marked done while
> any E2E test is failing — the tests must pass first, full stop.**
>
> - **No "known-flaky" exemptions.** … A test that fails intermittently is a real defect … and MUST be
>   ironed out — not skipped, retried-until-green, or annotated as flaky.
> - **Prefer E2E for interim verification.** … The recommended method is to **run the whole suite**
>   (`yarn test:e2e`) … a full-suite run is the trusted signal.
> - A "did not run" E2E test counts as a failure … not a pass.

**This phase changes the suite's own preconditions.** Its central criterion is therefore only
provable by a **full-suite run, twice, with no `db:reset` between them** — a per-spec smoke, a
`--grep`, or a single-project run does not discharge criterion 3. Both runs must be green under the
full definition above (0 failed, 0 did-not-run, no flakes waived).

### F15 — known local E2E prerequisites a planner must budget for

From project memory and the live harness:

- **One fresh dev server on the configured port**, started before the suite. There is **no Playwright
  `webServer`** for the main suite; a stale server steals the port. `yarn dev` now fails loudly on a
  taken port (`strictPort`, Phase 137 D-08).
- **The preflight cannot be skipped.** `tests/README.md:16-30` — Playwright's `globalSetup` asserts the
  served application echoes *this* working tree's absolute path via Vite's `/@fs` endpoint, aborts with
  exit 1 before the first spec, and "there is no bypass flag and no bypass environment variable".
  `FRONTEND_PORT` moves the target, it does not disable the check. **D-J2's project creation lands in
  this same hook** — sequence it after the preflight so an identity failure is still the first thing
  reported.
- **Disk pressure has voided full-suite runs before.**
  `.planning/todos/pending/2026-08-27-147-full-suite-disk-headroom-falling.md`: headroom falls
  **~0.5–1 GiB per full-suite `db:reset` cycle**, `147-02` **lost two full-suite runs to ENOSPC**, and
  under the hard rule a voided run must be re-taken in full (~10.4 min each). The space is in the
  Docker layer; **`tests/e2e-runs/` is cited by the phase registers and must not be deleted.** Check
  headroom *before* committing to the twice-in-a-row gate. Ironically, this phase's success removes the
  per-run `db:reset` that drives the growth.

### F16 — the frontend reads public env dynamically

`apps/frontend/src/lib/utils/constants.ts:1` — `import { env } from '$env/dynamic/public';`, with a
flat `constants` object exposing each `PUBLIC_*` var (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`,
…). This is the exact site the F5 todo's step 2 names, and the reason D-J2's fixed id is structurally
forced (see D-J2).

</facts>

<open>
## Open Questions

Uncovered by the decision document; **not invented answers** — each needs a planner or researcher call.

- **O-1 — `app_settings` blocks project deletion (F9).** `106-app-settings.sql:8` is the only
  `project_id` FK without `ON DELETE CASCADE`, so `DELETE FROM public.projects WHERE id = …` raises an
  FK violation. Three ways forward, none chosen: (i) ask **Phase 156** (161's upstream) to add the
  cascade as part of its schema corrections — cleanest, but 156's criteria do not currently name it and
  E5's five investigate-items do not include it; (ii) 161 adds the cascade itself, crossing the 156/161
  schema boundary; (iii) 161's teardown deletes the `app_settings` row explicitly before the project
  row — no schema change, but it means "delete the project" is not self-sufficient and the next table
  added without a cascade reopens the class. **Not resolvable from the decision doc.** If not resolved
  in planning, file per D-N2 as a `.planning/todos/pending/` item.
- **O-2 — the variable's actual name is contested three ways.** `PRE-SHIP-REFACTORING.md:4` and the
  roadmap say **`PROJECT_ID`**; the pending todo says **`PUBLIC_PROJECT_ID`**; the Edge Function reads
  **`DEFAULT_PROJECT_ID`**. These are not interchangeable: SvelteKit's `$env/dynamic/public` only
  exposes `PUBLIC_`-prefixed vars to the client, and the Edge Function runs under Deno with its own
  env. So the honest shape may be **one id with two names** (a `PUBLIC_`-prefixed frontend var and the
  Deno-side var), which criterion 1's singular "a `PROJECT_ID` environment variable" does not
  anticipate. D-D3 assigns the "rename/converge" to 161 but does not say to what. **The planner must
  pick and record it — 162 will be planned against whatever it is.**
- **O-3 — does `get_nominations` need a `p_project_id` parameter?** Step 4 of the F5 todo, unanswered.
  `503-entity-rpcs.sql:11` `get_nominations` and `:97` `get_candidate_user_data` are RPCs; a `.eq()`
  guard cannot see inside them, so criterion 2's "every project-scoped query" either covers RPC bodies
  or explicitly does not. Related: Phase **157** F3(a) lands a **new `get_questions` RPC** in 157 —
  i.e. *before* 161 — so 161 will inherit at least one more RPC read path to scope. The guard's
  treatment of RPCs is undecided.
- **O-4 — the fate of `E2E_REQUIRE_FRESH_DB` and `probeFreshDatabasePrecondition` (F12).** Retire,
  re-aim at the E2E project, or leave? Interacts with the F13 todo, whose option 2 proposes *promoting*
  the probe to a hard failure — the opposite direction from retiring it. Undecided.
- **O-5 — PRESHIP-01 is not a registered requirement.** `.planning/REQUIREMENTS.md` contains **no**
  `PRESHIP-*` (nor `REVIEW-*`) ids, and its "Phase → requirement rollup" (`:167-186`) stops at Phase
  150. The roadmap cites `**Requirements**: PRESHIP-01` for this phase and PRESHIP-02 for 162. A
  traceability gap spanning the whole 152–164 block, not specific to 161; flagged so the verifier does
  not read it as this phase's omission.
- **O-6 — `.env.example` was not readable this session** (blocked by permission settings), so its
  current contents could not be confirmed. Criterion 1 requires the new variable to be documented
  there; the planner must open it. `CLAUDE.md` § Development Environment confirms the file is the
  canonical env template ("Edit the root `.env` file (copied from `.env.example`)"), and Phase 137's
  record notes CI does `cp .env.example .env` — so a change here reaches CI.
- **O-7 — how the running dev server learns `E2E_PROJECT_ID` (F16, D-J2).** The fixed-id decision makes
  it *possible*; it does not say *how*. Options not decided: put it in the root `.env` (persistent,
  affects manual dev too), require `E2E_PROJECT_ID=… yarn dev` (an extra step in the documented
  prereqs, which criterion 4 is simultaneously trying to *shorten*), or default the var to the E2E
  project in dev only. Whatever is chosen becomes part of the criterion-4 doc rewrite, so the two
  criteria must be planned together, not in sequence.
- **O-8 — where the `PROJECT_ID` resolution lives for the writers (F4).** The 20 production
  `project_id` references sit in three *writers* that today receive a project id from their callers;
  the read path has none. Whether 161 centralises resolution in one adapter-construction site (per the
  F5 todo's step 5 fail-fast) or threads it, and how that interacts with the candidate/admin paths that
  already carry project context via `can_access_project()`, is unstated.

</open>

---

*Phase: 161-project-scoping-project-id-parameterisation*
*Context gathered: 2026-08-28*
*Decisions source: `.planning/v2.15-DISCUSSION-POINTS.md` § J (J1, J2) · § D3 · § 0 fact 27 + § 0.1 · § N (N1–N3)*