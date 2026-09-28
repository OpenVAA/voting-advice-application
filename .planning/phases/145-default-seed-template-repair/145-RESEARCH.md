# Phase 145: Default Seed Template Repair — Research

**Researched:** 2026-08-24
**Domain:** `packages/dev-seed` seed-template correctness under Postgres row-level security; live-Supabase
regression-guard construction; `external_id` naming reconciliation
**Confidence:** HIGH — every load-bearing claim below was re-measured in this working tree today at
HEAD `38689459d`, against the live local Supabase, or read out of the source-of-truth file with the
line range and a verbatim quote beside it.

**Research posture:** the CONTEXT for this phase records a root cause that was **measured, not
inferred** (M-1 … M-14). This research does **not** re-derive that diagnosis. It (a) independently
re-measured the four load-bearing measurements so the planner is not building on a single session's
observation, (b) resolved the questions the CONTEXT leaves to planning — how the anon client gets a
key, where the guard can live without racing, what the `external_id` rename actually touches — and
(c) **corrects one CONTEXT/DISCUSSION claim** (M-12's "six unrelated idioms") with a measurement that
makes D-05 cheaper and lower-risk than the CONTEXT assumed. See § Corrections to the Upstream Record.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied verbatim from `145-CONTEXT.md` § Implementation Decisions. All 8 decision items resolved to
their ★ RECOMMENDED option; 0 overrules.

**Root cause (criterion 3)**

- **D-02:** The root cause is named as the **RLS-predicate asymmetry that the `PUBLISHABLE_TABLES`
  auto-default silently fails to cover.** `supabaseAdminClient.ts:176-187` auto-defaults
  `published = true` on 10 tables, justified in its own comment by anon RLS being
  `USING (published = true)`. That is true for `organizations`; for `candidates` the anon predicate
  is three clauses — `published = true AND terms_of_use_accepted IS NOT NULL AND
  terms_of_use_accepted < now()` — so the auto-default satisfies 1 of 3 and the seeded candidates are
  invisible to `anon`. Evidence chain: role-differential RPC output (M-4: `postgres` → 48 candidate
  rows, `anon` → 0) → the two policy predicates (M-5) → column state (M-6: 327 published, **0** with
  `terms_of_use_accepted`) → the auto-default's stated-but-unmet rationale (M-7), closed by the
  both-ways toggle in M-9. **This is a `dev-seed` defect, not a schema or RLS defect** — the policy is
  correct and `e2e/base` satisfies it (M-8). The roadmap's three suggested namings are all disproved
  and must be recorded as such: organizations/nominations *are* seeded (8 / 377), the seeded
  `results.sections` *does* contain `candidate`, and the constants are *not* drifted (M-12).
  — **Reversibility:** reversible — a naming on the record, revisable by a later measurement.

**Scope corrections (the roadmap premise is partly stale)**

- **D-01:** **Symptom 1 ("0 parties") does not reproduce** — the results page renders 8 parties today
  (M-2), closed by `49a23512e` (2026-06-15) nine days after the todo was filed. Criterion 1 keeps
  **both** clauses as assertions — the phase must still prove parties *and* the Candidates tab render
  — but the recorded starting state changes: parties **already passing at phase start**, Candidates
  tab **failing**. Correct ROADMAP criterion 1, `REQUIREMENTS.md:70` (TMPL-03), and
  `.planning/todos/pending/2026-06-06-fix-broken-default-seed-template.md`, citing `49a23512e` and M-2.
  This is the third consecutive phase (143, 144, 145) whose roadmap premise was overtaken by a commit;
  the correction pass is a task, not a footnote. — **Reversibility:** reversible.
- **D-05:** **TMPL-04 is re-scoped from "constant naming" to the `external_id` idiom.** The constants
  were measured and are already consistent UPPER_SNAKE in both templates (M-12) — the requirement's
  original wording is corrected, not silently reinterpreted. The genuine divergence is that
  `default.ts` uses six unrelated `external_id` idioms (`election_default`, `cg_default`, `c_01`,
  `party_blue`, `cat_economy`, `appsettings_default`, `cand_0000`) where `e2e/base` uses one uniform
  `<typecode>-<discriminator>` scheme. Adopt the *scheme*, not the `test-e2e-base-` namespace (which is
  right for a fixture and wrong for a demo dataset), and document the deliberate divergence —
  criterion 4 permits it. — **Reversibility:** costly — `external_id` is a stable identifier that
  `db:seed:teardown` and downstream fixtures key on; renames must be proven not to strand rows.
  M-13 measured the `seed_` prefix as auto-applied to `fixed[]` rows too, so the blast radius is the
  base names only, but the proof is required, not assumed.

**The fix**

- **D-03:** Two parts. **(1)** `defaults/candidates-override.ts` emits `terms_of_use_accepted` on
  every row it produces, using `e2e/base`'s literal `'2025-01-01T00:00:00.000Z'` so the two templates
  read alike. **(2)** The `PUBLISHABLE_TABLES` comment block in `supabaseAdminClient.ts:176-187` is
  corrected to stop claiming a coverage it does not have for `candidates`, stating the three-clause
  predicate explicitly. Part (2) writes **zero behavioural bytes** — it is the record correction that
  stops the next author trusting the auto-default. **Explicitly rejected:** extending the auto-default
  to stamp `terms_of_use_accepted` globally — it would backdate terms acceptance for `e2e/base` too,
  breaking its `ca-aa-hidden` / `ca-aa-unregistered` rows and destroying an existing in-repo negative
  control (M-8). Also rejected: setting it on `default.ts`'s `fixed[]` rows, which would land on
  nothing (the 327 candidates come from the override). — **Reversibility:** reversible.
- **D-10 (derived):** The fix needs **no** Phase-144 type or guard change — `packages/dev-seed`
  typechecks clean today and `terms_of_use_accepted` is already permitted at `permittedKeys.ts:296`
  (M-10). Any plan proposing a `permittedKeys` or row-type edit is working from a false premise.

**The guard (criterion 2) — the crux**

- **D-04:** The standing regression guard is an **anon-client** assertion added to
  `tests/integration/default-template.integration.test.ts`: call `get_nominations` through a client
  built from the anon key and require `candidate > 0` and `organization > 0`. That file already runs
  against live Supabase in CI's dedicated `dev-seed-integration` job, so no new CI wiring is needed —
  it needs a second client beside the existing service-role one. **This is the only option that
  exercises the failing path**, and the reason the defect survived ~11 weeks under a green suite is
  that no existing check does: `default.test.ts` is 27 pure-I/O tests asserting nothing about
  visibility, and the integration test authenticates as **service_role, which bypasses RLS** (M-11).
  Paired with a cheap pure-I/O assertion in `default.test.ts` that every emitted candidate row carries
  `terms_of_use_accepted`, so the fast suite catches a regression too. **Rejected:** a Playwright spec
  seeding `default` mid-suite — it would contaminate the shared DB and put a cardinal-rule gate at
  risk for a check the integration job makes more cheaply.
  — **Reversibility:** reversible.
- **D-06:** Negative control is **two measured pairs**, both halves executed in-phase, recorded in a
  new `145-NEGATIVE-CONTROL-LEDGER.md`. **Pair 1** (guard catches the defect): the anon assertion runs
  against the pre-fix `candidatesOverride` → RED; against the fixed one → GREEN. **Pair 2** (guard is
  not merely restating the fix): the anon assertion runs against a template whose candidates carry
  `terms_of_use_accepted` but are `published = false` → RED, proving it asserts *anon visibility*, not
  *one column's presence*. M-9 supplies the manual app-level both-ways observation for pair 1 already;
  the ledger needs the automated halves. **A manual DB toggle is not a negative control** — the rule
  requires the guard itself to be observed failing. — **Reversibility:** reversible.

**Verification surface (criterion 1)**

- **D-08:** Verify on **one constituency, both entity types, both states, plus a same-session
  role-differential RPC check**. The app-level check is what criterion 1 asks for; the RPC check
  (M-4) is what makes the result *diagnostic* rather than anecdotal, localising the failure to the
  RLS boundary rather than the UI — without it, criterion 3's naming is not defensible. Use
  Pirkanmaa (`c_05`), whose 48 candidates is the smallest count, so a wrong number is visible at a
  glance. — **Reversibility:** reversible.

**Out of scope, with a record**

- **D-07:** The cold-`/results` dev-server crash (M-14) is filed as a **standing todo**, not fixed
  here. It is an `apps/frontend` cookie-lifecycle bug with no connection to seed data; absorbing it
  would widen the phase past what the roadmap scoped and past what the plans can verify.
  — **Reversibility:** reversible.

### Claude's Discretion

- Plan count and wave structure. Note the natural ordering constraint: **the guard must be written
  and observed RED before the fix lands** (D-06 pair 1's first half is unrecoverable afterwards
  without a revert). This is the ledger-first ordering Phase 144 used, and it overrides tracer-first
  per the milestone's standing acceptance rule.
- The exact `external_id` scheme chosen under D-05, provided it is one idiom across all collections
  and the divergence from `e2e/base` is documented.

### Deferred Ideas (OUT OF SCOPE)

- **Cold `/results` navigation crashes the dev server** (M-14) — uncaught
  `Cannot use cookies.set(...) after the response has been generated` at
  `apps/frontend/src/lib/supabase/server.ts:12`, reproducible from a session-less direct URL hit.
  File as a standing todo per D-07; belongs to an `apps/frontend` hooks phase, not here.
- **Repo-wide audit of multi-clause anon RLS predicates vs `PUBLISHABLE_TABLES`.** `candidates` is the
  one instance found here. Whether any of the other 9 publishable tables (`elections`,
  `constituency_groups`, `constituencies`, `organizations`, `factions`, `alliances`,
  `question_categories`, `questions`, `nominations`) has an anon predicate the auto-default
  under-satisfies was **not measured**. This is the general form of the defect and deserves its own
  small phase; answering it inside 145 would widen it past TMPL-03/04.
- **The `default.test.ts` blindness class** — 27 green tests over a dataset the app cannot read
  (M-11). Kin to this milestone's ASSERT family; no action in 145 beyond D-04's two additions.
- `.planning/todos/pending/2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md` — reviewed, not
  folded. Test-suite teardown hygiene, not the default template's content.

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID | Description (as written at `.planning/REQUIREMENTS.md:70-71`) | Research Support |
|----|-------------|------------------|
| **TMPL-03** | `yarn db:reset-with-data` produces a dataset whose voter results page renders parties/organizations (currently 0) and shows the candidates tab (currently absent). | § Root Cause, Re-Measured (R-1…R-4 establish both the failing half and the passing half); § The Fix (one column, one file); § Validation Architecture (the anon guard that makes it standing); § Corrections to the Upstream Record item 1 (the `(currently 0)` parenthetical is stale and is corrected by D-01). |
| **TMPL-04** | The `default` template's constant naming is reconciled with the `e2e/base` conventions, so the data shape reads consistently across templates. | § The `external_id` Idiom — What Actually Diverges. The measured divergence is **two typecodes**, not six idioms; the recommended scheme, its blast radius (3 code files), and the strand-proof procedure are all specified there. |

Both requirement rows are currently `- [ ]` at `REQUIREMENTS.md:70-71` and both map to Phase 145 at
`REQUIREMENTS.md:159-160` with status `Pending`. [VERIFIED: .planning/REQUIREMENTS.md:70-71,159-160]

</phase_requirements>

---

## Summary

Phase 145 is a **one-column fix wrapped in three proofs**. The behavioural change is a single key on
a single row-producer: `defaults/candidates-override.ts` must emit
`terms_of_use_accepted: '2025-01-01T00:00:00.000Z'` on each of the 327 candidate rows it builds. Every
other byte the phase writes is evidence, guard, or record correction. The research below therefore
spends most of its effort on the three things that are genuinely hard here — building an **anon**
client in a test harness that has only ever known service_role, proving that client is really anon
(otherwise the new guard joins the blindness class it exists to close), and bounding the
`external_id` rename so it cannot strand rows.

The root cause is confirmed independently of the CONTEXT's session. Calling `get_nominations()` with
no arguments through the local anon key returns `organization 40, alliance 10` and **zero**
candidates; the identical call through the service-role key returns `candidate 327, organization 40,
alliance 10`. The candidates table holds `published = true, terms_of_use_accepted = null`. The anon
policy, read from `apps/supabase/supabase/migrations/00002_…`, requires all three of
`published = true AND terms_of_use_accepted IS NOT NULL AND terms_of_use_accepted < now()`; the RPC is
`SECURITY INVOKER` and additionally drops any nomination whose entity join came back NULL
(`AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL`) — which is exactly why an RLS-invisible entity
type presents as a **missing tab** rather than an empty list. Organizations survive because their
predicate is the single clause the `PUBLISHABLE_TABLES` auto-default happens to satisfy.

Two upstream claims need correcting before planning. First, the CI job that runs the guard exports
**only** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — there is no anon key anywhere in the
dev-seed environment today, and `.env` / `.env.example` are **write-denied in this environment** (a
standing blocker recorded at `.planning/STATE.md:902`). The anon key must therefore come from a
`supabase status -o env` export in CI plus a local-demo-key fallback in the test, mirroring the
existing service-role fallback. Second, M-12's "six unrelated idioms" overstates the `external_id`
divergence: the class-based generators already use one uniform `<typecode>_<zero-padded-index>` scheme
across all eleven collections, and `default.ts`'s hand-authored rows agree with it everywhere except
**two typecodes** — `c_` where the generator says `con_`, and `party_` where the generator says
`org_`. That reduces D-05 from a whole-template rename to 13 literals in one file plus one map in
`alliances-override.ts`.

**Primary recommendation:** add the anon assertion as a **second `it` block inside the existing
`default-template.integration.test.ts`** (never a new file — vitest parallelises across files and the
seeded data is produced by the first block), build its client from
`process.env.SUPABASE_ANON_KEY ?? <local demo anon key>`, gate it with a *guard-of-the-guard* that
proves the client is genuinely anon (`accounts` must return 0 rows for anon and >0 for service_role —
measured), assert `candidate > 0 && organization > 0` from a `get_nominations()` call with **no
arguments** (327 / 40 / 10 post-fix — no UUID lookup needed, and no `gen_random_uuid()` to hard-code),
then fix the one column, then do the two-typecode rename last.

---

## Corrections to the Upstream Record

The CONTEXT explicitly invites this: it warns that two roadmap claims and one todo claim were already
disproved, and asks that stale premises be corrected rather than built on. Two more corrections fall
out of this session's measurements.

| # | Upstream claim | Measured reality | Consequence for planning |
|---|---|---|---|
| C-1 | **M-12 / D-05:** "`default.ts` uses six unrelated `external_id` idioms." | The eleven class-based generators use **one** scheme, `<typecode>_<zero-padded-index>`, and `default.ts`'s hand-authored rows match the generator's typecode on 5 of 7 collections. Only **two** typecodes diverge: `c_01…c_05` (generator: `con_NN`) and `party_blue…party_values` (generator: `org_NN`). `election_default`, `cg_default`, `cat_*`, `appsettings_default`, `cand_NNNN`, `q_NNN`, `alliance_L/R`, `nom_*` all already agree with the generator typecode. [VERIFIED: packages/dev-seed/src/generators/*.ts — see verbatim table in § The `external_id` Idiom] | D-05 is far cheaper and far lower-risk than "costly" implies. The rename is **13 literals in `default.ts` + one `ALLIANCE_MEMBERSHIP` map in `alliances-override.ts`**; everything else that mentions the old names is a docstring. The recommendation also **flips one sub-decision**: `default.ts` should stay **snake_case**, not adopt `e2e/base`'s kebab-case, because its candidates/questions/nominations ids are *generated* as snake and are out of scope — kebab would create a fresh intra-template divergence. That is the "deliberate divergence, documented" criterion 4 permits. |
| C-2 | **D-04 / CONTEXT § Reusable Assets:** "it needs a second client beside the existing service-role one … no new CI wiring is needed." | Half true. No new **job** is needed. But the `dev-seed-integration` job exports **only** `API_URL` → `SUPABASE_URL` and `SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY`; there is no anon key in that environment, and none in `packages/dev-seed` anywhere. [VERIFIED: .github/workflows/main.yaml:205-215] Separately, `.env` and `.env.example` are **read/write-denied** in this environment — the same blocker that stopped Phase 142 adding `SUPABASE_ANON_KEY` there. [VERIFIED: .planning/STATE.md:902] | The plan needs an explicit CI task: parse `ANON_KEY` out of `supabase status -o env` and export it as `SUPABASE_ANON_KEY`, with a `test -n` guard so a CLI change turns CI **red** rather than silently falling back. And the test needs a local fallback that does **not** live in `.env`. Both are specified in § Code Examples. |

**Neither correction changes a locked decision's *direction*** — D-04 still lands in the integration
test, D-05 still adopts one idiom and documents the divergence. They change the *work*, which is what
the planner needs.

---

## Root Cause, Re-Measured

Every row below was taken today, HEAD `38689459d`, against the running local Supabase at
`http://127.0.0.1:54321`, whose database holds the `default` seed at the time of measurement.

| # | Measurement | Result | Tag |
|---|---|---|---|
| R-1 | `POST /rest/v1/rpc/get_nominations` body `{}` as **anon** | `{'organization': 40, 'alliance': 10}` — **candidate absent entirely** | [VERIFIED: live local Supabase, this session] |
| R-2 | Same call as **service_role** | `{'candidate': 327, 'organization': 40, 'alliance': 10}` | [VERIFIED: live local Supabase, this session] |
| R-3 | Same RPC scoped to `p_election_id` = the seeded election, `p_constituency_id` = `seed_c_05` (Pirkanmaa) | anon → `{'organization': 8, 'alliance': 2}`; service_role → `{'candidate': 48, 'organization': 8, 'alliance': 2}` | [VERIFIED: live local Supabase, this session] |
| R-4 | `GET /rest/v1/candidates?select=external_id,published,terms_of_use_accepted` as service_role | Sampled rows: `{"external_id":"seed_cand_0026","published":true,"terms_of_use_accepted":null}` … plus one `{"external_id":null,"published":false,"terms_of_use_accepted":null}` bootstrap row from `seed.sql` | [VERIFIED: live local Supabase, this session] |
| R-5 | `GET /rest/v1/accounts?select=id` — the role-differential control | anon → `[]`; service_role → `[{"id":"00000000-0000-0000-0000-000000000001"}]` | [VERIFIED: live local Supabase, this session] |
| R-6 | `tsc --noEmit` in `packages/dev-seed` | **exit 0** — re-confirms M-10 at today's HEAD | [VERIFIED: this session] |

R-1 vs R-2 is the whole diagnosis in two lines, and R-4 explains it: the rows exist and are
`published`, and they are not anon-visible. R-5 is the control that makes the guard honest (below).

### The two halves of the mechanism, read from source

**Half one — the policy.** Requires all three clauses:

```sql
-- apps/supabase/supabase/migrations/00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql
CREATE POLICY "anon_select_candidates" ON public.candidates FOR SELECT TO anon
  USING (
    published = true
    AND terms_of_use_accepted IS NOT NULL
    AND terms_of_use_accepted < now()
  );
```

[VERIFIED: apps/supabase/supabase/migrations/00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql:28-33]
**Correct as written — do not modify.** Relaxing it would make unaccepted-terms candidates publicly
visible and would break `e2e/base`'s two hidden-candidate specs (D-02 option C, rejected).

**Half two — why it presents as a *missing tab*, not an empty list.** `get_nominations` is
`SECURITY INVOKER` (so anon RLS applies to its `LEFT JOIN`s) and it drops entity-less rows:

```sql
  LEFT JOIN public.candidates c ON n.candidate_id = c.id
  …
  WHERE (p_election_id IS NULL OR n.election_id = p_election_id)
    AND (p_constituency_id IS NULL OR n.constituency_id = p_constituency_id)
    AND (p_include_unconfirmed OR NOT COALESCE(n.unconfirmed, false))
    AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL
```

[VERIFIED: same migration file:102-110; `SECURITY INVOKER` at :80; `GRANT EXECUTE … TO anon, authenticated` at :114]

So the 327 candidate nominations are *present* in `nominations` and anon-visible there, but their
candidate join returns NULL under RLS, the `COALESCE … IS NOT NULL` filter removes them, and the
`candidate` key never appears in the RPC result set. Downstream:

```ts
// apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts
// If there are no nominations for this entityType, we leave the whole leaf undefined
if (!nominations.length) return [entityType, undefined];
```

[VERIFIED: apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts:74-75]

…and the tab set is literally the key set of that tree:

```ts
const entityTabs = $derived<Array<EntityTab>>(
  activeElectionId && voterCtx.matches[activeElectionId]
    ? (Object.keys(voterCtx.matches[activeElectionId]) as Array<EntityType>).map((type) => ({
```

[VERIFIED: apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:139-142]

**The frontend is correct at every hop.** Confirming this matters for criterion 3: it is what licenses
naming the cause at the RLS boundary rather than in the UI.

**Half three — why `published` got set and the other column did not.** The auto-default and its
overstated rationale, verbatim:

```ts
    // Tables with a `published boolean NOT NULL DEFAULT false` column gated by
    // anon RLS (`USING (published = true)`). Seeded rows must be visible to the
    // frontend's anon client, so default `published` to `true` when the record
    // doesn't already set it. Templates can still emit `published: false`
    // explicitly to seed draft rows.
    const PUBLISHABLE_TABLES = new Set([
      'elections',
      'constituency_groups',
      'constituencies',
      'organizations',
      'candidates',
      …
```

[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:171-187 — the comment block at :171-175, the
`Set` at :176-187, which is the range D-03 part (2) names]

The parenthetical `USING (published = true)` is **true for `organizations` and false for
`candidates`**. D-03 part (2) corrects exactly this comment and writes no behavioural bytes.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Satisfying the anon read predicate for seeded candidates | **Seed data (`packages/dev-seed` template/override)** | — | The policy is correct; the data does not satisfy it. Moving this to the DB tier (relaxing RLS) is the rejected D-02 option C and is a privacy regression. |
| Enforcing who may read a candidate row | **Database / RLS** | — | Already correct. Out of scope, explicitly (`145-CONTEXT.md` § Phase Boundary). |
| Detecting a future recurrence | **Test harness — live-Supabase integration test authenticating as anon** | Pure-I/O unit assertion in `default.test.ts` | Only an anon-authenticated read crosses the RLS boundary. The pure-I/O assertion is the cheap early-warning tier and cannot replace it (D-04). |
| Providing the anon credential to that harness | **CI workflow env + test-local fallback** | — | `.env` is write-denied in this environment (`STATE.md:902`), so the credential cannot live where the frontend's does. |
| Rendering entity tabs from the nomination tree | **Frontend (voter context → results layout)** | — | Measured correct end-to-end. Out of scope. |
| Naming consistency of `external_id` values | **Seed template authoring layer (`default.ts` + its overrides)** | Generators (out of scope, but they define the canonical typecodes) | The generators are the de-facto convention; the template should conform to them, not invent a third scheme. |

---

## Standard Stack

**No new dependencies.** Every tool this phase needs is already installed and pinned.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vitest` | `^3.2.4` (catalog) | Runs both the pure-I/O and the live-Supabase assertions | Already the repo's only unit runner; `packages/dev-seed/package.json:16` is `"test:unit": "vitest run"` [VERIFIED: .yarnrc.yml:8; packages/dev-seed/package.json:16] |
| `@supabase/supabase-js` | `^2.49.4` (catalog) | Builds the second (anon) client via `createClient` | Already imported by `default-template.integration.test.ts:73` for the service-role read client — the anon client is the same call with a different key [VERIFIED: .yarnrc.yml:39; packages/dev-seed/tests/integration/default-template.integration.test.ts:73] |
| `typescript` | `^5.8.3` (catalog) | Criterion 4's typecheck gate | `packages/dev-seed/tsconfig.json` `"include": ["src/**/*", "tests/**/*", "scripts/**/*"]` — Phase 144 widened this, so **new test code is typechecked** [VERIFIED: packages/dev-seed/tsconfig.json:12] |
| `supabase` CLI | `^2.78.1` catalog / **2.83.0 installed locally**; CI uses `supabase/setup-cli@v1` with `version: latest` | Supplies `ANON_KEY` via `supabase status -o env` | Already the mechanism the CI job uses for `API_URL`/`SERVICE_ROLE_KEY` [VERIFIED: .yarnrc.yml:38; .github/workflows/main.yaml:167-169,205-215; local `supabase --version` → 2.83.0] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@openvaa/supabase-types` | workspace | `TablesInsert<'candidates'>` — the type behind `CandidatesFixedRow` | Only if a `fixed[]` row is touched. The override's rows are **not** typed against it (see Pitfall 4). |
| `@faker-js/faker` | `^8.4.1` (catalog) | Already used by `candidatesOverride` | Untouched by this phase — do **not** derive the timestamp from faker or `now()` (determinism, see Pitfall 6). |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Anon client via `createClient` + anon JWT | `postgres` role via a direct `psql`/`pg` connection with `set local role anon` (M-4's probe form) | The `set local role anon` form is an excellent *diagnostic* (and belongs in the evidence map), but it is **not the path the app takes** — it skips PostgREST and the JWT. The guard must exercise the app's path. Use the psql form for the ledger's diagnostic rows, the anon JWT for the standing guard. |
| A second `it` in the existing integration file | A new `tests/integration/anon-visibility.integration.test.ts` | **Rejected — race.** Vitest parallelises across *files* by default; a new file would run concurrently with the seeding file and read a half-written or torn-down database. Also duplicates the `DEV_SEED_INTEGRATION_REQUIRED` guard-of-the-guard. |
| `get_nominations()` with no args | `get_nominations(electionId, constituencyId)` with ids resolved by `external_id` | The no-arg form needs no lookup, no UUID, and its expected counts (327/40/10) are already asserted in-memory two blocks above. Use the scoped form only in the ledger's diagnostic rows where D-08 asks for Pirkanmaa specifically. |

**Installation:** none required.

---

## Package Legitimacy Audit

**This phase installs no external packages.** Every library it touches is already a resolved
dependency of `packages/dev-seed` (`@faker-js/faker`, `@openvaa/*` workspace packages,
`@supabase/supabase-js`, `zod`) or a devDependency (`typescript`, `tsx`, `vitest`, `eslint`), all
pinned through the repo's Yarn catalog at `.yarnrc.yml:5-40`. [VERIFIED: packages/dev-seed/package.json:24-36]

| Package | Registry | Disposition |
|---------|----------|-------------|
| — | — | No package additions in scope. The legitimacy gate is **not applicable** to this phase. |

**Packages removed due to [SLOP] verdict:** none — no candidates existed.
**Packages flagged as suspicious [SUS]:** none.

⚠ If a plan proposes adding a package (e.g. a JWT decoder to inspect the anon key's `role` claim),
that plan has left this phase's boundary — the role check has a zero-dependency form (R-5's `accounts`
differential). Run the legitimacy gate before any such addition.

---

## Architecture Patterns

### System Architecture Diagram — where the phase's bytes land in the existing data flow

```
                    ┌───────────────────────────────────────────────────────────┐
   TEMPLATE LAYER   │  defaultTemplate (default.ts)   defaultOverrides           │
   (in-memory)      │    ├ elections.fixed[]            ├ candidates ◄─ THE FIX  │
                    │    ├ constituencies.fixed[] ◄─┐   ├ questions              │
                    │    ├ organizations.fixed[] ◄──┤   ├ nominations            │
                    │    ├ question_categories       │   └ alliances ◄─ RENAME    │
                    │    └ app_settings.fixed[]      └── RENAME (2 typecodes)     │
                    └───────────────────────┬───────────────────────────────────┘
                                            │ runPipeline(template, overrides)
                                            ▼
                    ┌───────────────────────────────────────────────────────────┐
   PIPELINE         │  generators / overrides emit rows → ctx.refs populated     │
                    │  fanOutLocales(rows, template, seed)                      │
                    └───────────────────────┬───────────────────────────────────┘
                                            │ Writer.write(rows, prefix)
                                            ▼
                    ┌───────────────────────────────────────────────────────────┐
   WRITE PATH       │  Pass 0  assertKnownRowProps(data)  ← permits              │
                    │          [writer.ts:181]              terms_of_use_accepted │
                    │                                       [permittedKeys:296]   │
                    │  Pass 1  bulkImport() → strip loop → PUBLISHABLE_TABLES     │
                    │          auto-default `published = true`                    │
                    │          [supabaseAdminClient.ts:171-230] ◄─ COMMENT FIX    │
                    │  Pass 2  importAnswers  Pass 3  linkJoinTables              │
                    └───────────────────────┬───────────────────────────────────┘
                                            │ bulk_import RPC (service_role)
                                            ▼
                    ┌───────────────────────────────────────────────────────────┐
   DATABASE         │  candidates rows: published=true, terms_of_use_accepted=?  │
                    │  ┌──────────────────────────────────────────────────────┐ │
                    │  │ RLS BOUNDARY — anon_select_candidates (3 clauses)     │ │
                    │  │ ✗ pre-fix: 1 of 3 satisfied → row invisible to anon   │ │
                    │  │ ✓ post-fix: 3 of 3 satisfied → row visible to anon    │ │
                    │  └──────────────────────────────────────────────────────┘ │
                    └───────┬───────────────────────────────┬───────────────────┘
                            │ get_nominations()             │ get_nominations()
                            │ SECURITY INVOKER              │ SECURITY INVOKER
              ┌─────────────▼──────────────┐   ┌────────────▼──────────────────┐
   READERS    │ service_role client        │   │ anon client  ◄── THE GUARD    │
              │ (bypasses RLS)             │   │  candidate>0 && organization>0 │
              │ 327/40/10 — BLIND to the   │   │  327/40/10 post-fix            │
              │ defect (M-11)              │   │  0/40/10 pre-fix → RED         │
              └────────────────────────────┘   └────────────┬──────────────────┘
                                                            │ same path the app takes
                                                            ▼
              ┌────────────────────────────────────────────────────────────────┐
   FRONTEND   │ supabaseDataProvider._getNominationData → DataRoot              │
              │  → nominationAndQuestionState  (drops leaf when 0 nominations)  │
              │  → matchState → entityTabs = Object.keys(matches[electionId])   │
              │  → results page: `Parties │ Alliances`  ⟶  `Candidates │ …`     │
              └────────────────────────────────────────────────────────────────┘
```

### Pattern 1: Role-differential assertion (the shape that closes the M-11 blindness class)

**What:** Two clients, one privileged and one not, against the same freshly-written data; assert the
*difference* is the one the RLS policy intends, not merely that the privileged read succeeded.

**When to use:** Any time a test asserts "the app can see X" for data written by a service-role
writer. That describes every existing dev-seed integration assertion, which is why the defect survived
~11 weeks green.

**Why it is not optional here:** `default-template.integration.test.ts` currently builds exactly one
read client, from the service-role key:

```ts
function makeReadClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
```

[VERIFIED: packages/dev-seed/tests/integration/default-template.integration.test.ts:122-130]

The anon client is this function with a different env var and a different fallback literal. **The
fallback pattern is established in-repo** (this function, plus `supabaseAdminClient.ts:48-50`), so
reusing it is conformance, not a shortcut.

### Pattern 2: Guard-of-the-guard (the 136-F5 idiom, already in this file)

**What:** A test that would be *silently vacuous* under a wiring loss carries an assertion that turns
the wiring loss into a red build.

**Existing instance, verbatim** — this file already does it for the skip:

```ts
if (process.env.DEV_SEED_INTEGRATION_REQUIRED === '1' && !hasSupabase) {
  throw new Error(
    'DEV_SEED_INTEGRATION_REQUIRED=1 but SUPABASE_URL is unset. This file carries the ' +
```

[VERIFIED: packages/dev-seed/tests/integration/default-template.integration.test.ts:107-109]

**The new instance this phase needs:** the anon guard's vacuous-pass mode is *a client that is not
actually anon*. If `SUPABASE_ANON_KEY` were ever set to the service-role key (a plausible copy-paste
in a workflow edit), `candidate > 0` would pass forever and the guard would join the very blindness
class it closes. Assert the role differentially, using the measured invariant:

- anon `GET /accounts?select=id` → `[]` (0 rows)
- service_role `GET /accounts?select=id` → 1 row

[VERIFIED: live local Supabase, this session — R-5]

This differential is **invariant across the fix** (the fix touches `candidates`, not `accounts`), so
it is a stable control rather than a restatement of the thing under test.

### Pattern 3: Ledger-first plan ordering (inherited, mandatory)

Phase 144 and 143 both opened with a plan that writes **zero product bytes** and captures every OLD
(blind) half before any behaviour-changing commit exists. The `144-NEGATIVE-CONTROL-LEDGER.md`
front-matter is the template to copy: phase/requirements, opening plan, corpus size asserted in its
own § Completeness table, protocol source, run date, HEAD per half, machine, resolved `$TMPDIR`, and a
**restoration blob-hash table** (`git hash-object`) for every file the phase will edit.
[VERIFIED: .planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md:1-60]

For 145 the blob-hash table should cover at minimum:
`packages/dev-seed/src/templates/defaults/candidates-override.ts`,
`packages/dev-seed/src/templates/default.ts`,
`packages/dev-seed/src/templates/defaults/alliances-override.ts`,
`packages/dev-seed/src/supabaseAdminClient.ts`,
`packages/dev-seed/tests/integration/default-template.integration.test.ts`,
`packages/dev-seed/tests/templates/default.test.ts`,
`.github/workflows/main.yaml`.

### Pattern 4: Injection-and-restore for the negative-control halves

144's protocol for a RED half: make the injection **byte-identical** to the blind half's real state,
run, then post-gate with `git checkout --` + a `git hash-object` comparison against the ledger's
restoration table + a clean `git status`. Every iteration, not once at the end.
[VERIFIED: .planning/REQUIREMENTS.md:57 — "every RED direction using its blind half's **byte-identical** removal and every iteration post-gated with `git checkout --`, a blob-hash comparison … and a clean `git status`"]

Applied here:

- **Pair 1 RED half** — run the new anon assertion at a tree where `candidates-override.ts` is the
  pre-fix blob. Easiest correct form: capture this half **before** the fix commit exists (ledger-first
  ordering makes this free).
- **Pair 2 RED half** — inject `published: false` **alongside** `terms_of_use_accepted` into
  `candidatesOverride`'s row literal, re-seed, run the guard, observe RED, restore. This proves the
  guard asserts *anon visibility* rather than *one column's presence*. `published` is an admitted key
  on `candidates` [VERIFIED: packages/dev-seed/src/template/permittedKeys.ts:292 — `'published',` inside the `candidates:` list that opens at :276], and `bulkImport` honours an explicit value: `if (isPublishable && !('published' in stripped)) { stripped.published = true; }` [VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:227-229].

### Anti-Patterns to Avoid

- **A new integration test file.** Vitest parallelises across files; the anon assertion depends on
  data the seeding block writes. Second `it`, same file, same `describe`.
- **Hard-coding a constituency or election UUID.** `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
  [VERIFIED: apps/supabase/supabase/schema/101-elections.sql:49] — the UUID in the CONTEXT's § Specific
  Ideas (`4d9c87e5-7894-4f98-82d6-670e1b46f017`) is valid only until the next `db:reset`. Resolve by
  `external_id`, or use the no-arg RPC form.
- **Hard-coding an `external_id` literal in the new guard.** The rename lands in the same phase.
  Derive from `defaultTemplate.constituencies.fixed[…].external_id` (plus the prefix) if a scoped
  lookup is needed at all.
- **Adding `terms_of_use_accepted` to `PUBLISHABLE_TABLES`' auto-default.** Explicitly rejected by
  D-03; it would backdate `e2e/base`'s two deliberately-omitted rows and destroy an in-repo negative
  control [VERIFIED: packages/dev-seed/src/templates/e2e/base.ts:1076 — `// terms_of_use_accepted DELIBERATELY absent (refactor-doc:72)`; :1208 — `// terms_of_use_accepted DELIBERATELY absent (TIR4:86-90)`].
- **Setting the column on `default.ts`'s `candidates.fixed[]`.** There is no `fixed[]` on
  `candidates` — the template declares only `candidates: { count: 327 }`
  [VERIFIED: packages/dev-seed/src/templates/default.ts:206-208]. The edit would land on nothing.
- **`yarn <script> --force` / trailing-arg forms.** Yarn appends the argument past the `&&` chain, so
  it silently does nothing on a chained script — `yarn lint:check --force` is **forbidden phase-wide**
  by the milestone's standing gate protocol [VERIFIED: .planning/REQUIREMENTS.md:57]. Use
  `TURBO_FORCE=true yarn lint:check`. (The same hazard is visible in `package.json:19`'s
  `"db:reset-with-e2e-data": "yarn db:reset-with-data --template e2e/base"` — out of scope, but do not
  copy the shape.)

---

## The `external_id` Idiom — What Actually Diverges (TMPL-04)

### Measurement: the generators already define one scheme

Every class-based generator builds its synthetic ids the same way — `${externalIdPrefix}<typecode>_<zero-padded-index>`:

| Collection | Generator idiom | Source |
|---|---|---|
| elections | `election_NN` | `ElectionsGenerator.ts:53` |
| constituency_groups | `cg_NN` | `ConstituencyGroupsGenerator.ts:42` |
| constituencies | **`con_NN`** | `ConstituenciesGenerator.ts:65` |
| organizations | **`org_NN`** | `OrganizationsGenerator.ts:47` |
| factions | `faction_NN` | `FactionsGenerator.ts:45` |
| alliances | `alliance_NN` | `AlliancesGenerator.ts:43` |
| candidates | `cand_NNNN` | `CandidatesGenerator.ts:109` |
| question_categories | `cat_NN` | `QuestionCategoriesGenerator.ts:52` |
| questions | `q_NNN` | `QuestionsGenerator.ts:120` |
| nominations | `nom_cand_NNNN` | `NominationsGenerator.ts:137` |
| app_settings | `appsettings` | `AppSettingsGenerator.ts:80` |

[VERIFIED: packages/dev-seed/src/generators/*.ts, lines as cited]

### `default.ts` against that scheme

| Collection | `default.ts` value | Generator typecode | Verdict |
|---|---|---|---|
| elections | `election_default` | `election` | ✅ conforms (semantic discriminator) |
| constituency_groups | `cg_default` | `cg` | ✅ conforms |
| constituencies | `c_01` … `c_05` | `con` | ❌ **diverges** |
| organizations | `party_blue` … `party_values` | `org` | ❌ **diverges** |
| question_categories | `cat_economy` … `cat_foreign` | `cat` | ✅ conforms |
| app_settings | `appsettings_default` | `appsettings` | ✅ conforms |
| alliances (override) | `alliance_L`, `alliance_R` | `alliance` | ✅ conforms (uppercase discriminator — cosmetic) |
| candidates (override) | `cand_NNNN` | `cand` | ✅ identical to generator |
| questions (override) | `q_NNN` | `q` | ✅ identical to generator |
| nominations (override) | `nom_org_*`, `nom_alliance_*` | `nom_cand_*` | ✅ same family |

[VERIFIED: packages/dev-seed/src/templates/default.ts:46,63,77-81,92-148,165-186,233; defaults/alliances-override.ts:73,81,101,113; defaults/candidates-override.ts:138; defaults/questions-override.ts:149; defaults/nominations-override.ts:156,172]

**Result: two typecodes diverge, not six idioms.** This is C-1 in § Corrections.

### Recommended scheme (Claude's-discretion item, D-05)

> **`<typecode>_<discriminator>`, snake_case, typecode taken from the generator for that collection;
> discriminator semantic for hand-authored rows and zero-padded for synthetic ones.**

Concretely: `c_01…c_05` → `con_01…con_05`; `party_blue…party_values` → `org_blue…org_values`.
Everything else is already conformant and should not be touched.

**The documented deliberate divergence from `e2e/base`** (criterion 4 permits it, and it must be
written down):

1. **snake_case, not kebab-case.** `e2e/base` is kebab (`test-e2e-base-co-mun-ne`)
   [VERIFIED: packages/dev-seed/src/templates/e2e/base.ts — enumerated `external_id` literals this session].
   `default.ts` cannot go kebab without diverging from its *own* generator-produced ids
   (`seed_cand_0000`, `seed_q_000`, `seed_nom_cand_0000`), which are out of scope. Snake is the
   consistent choice **within** the template, which is what "the data shape reads consistently"
   (TMPL-04) actually asks for.
2. **No `test-e2e-base-` namespace.** Already the CONTEXT's D-05 reasoning: right for a fixture,
   wrong for the demo dataset a developer meets first.
3. **Typecodes follow the generators, not `e2e/base`'s two-letter codes** (`el`/`co`/`or`/`ca`/`qg`/`qu`).
   Adopting `e2e/base`'s two-letter codes would put `default.ts` at odds with every id its own
   pipeline generates.

### Blast radius, measured

A repo-wide grep for every `party_*` and `c_0N` literal, excluding `node_modules`, `.git` and
`.planning`, returns:

| File | Occurrences | Kind |
|---|---|---|
| `packages/dev-seed/src/templates/default.ts:77-81, 92-148` | 5 + 8 = **13 literals** | **Code — must change** |
| `packages/dev-seed/src/templates/defaults/alliances-override.ts:40-41` | 6 literals in `ALLIANCE_MEMBERSHIP` | **Code — must change** |
| `packages/dev-seed/src/templates/defaults/alliances-override.ts:5,34-36,46,50-51,98,110` | 9 mentions | Docstrings — update for accuracy |
| `packages/dev-seed/src/templates/defaults/nominations-override.ts:23-24,164-165,192,211,213-214` | 8 mentions | Docstrings only |
| `packages/dev-seed/tests/integration/default-template.integration.test.ts:344,378` | 2 mentions | Comments only |

[VERIFIED: repo-wide grep, this session]

**Zero occurrences outside `packages/dev-seed`.** No Playwright spec, no pgTAP test, no frontend file,
no SQL file references a `default`-template `external_id`. (The pgTAP hits for `party_a` in
`apps/supabase/supabase/tests/database/*.sql` are an unrelated fixture name; `party_vihreat` /
`party_kokoomus` at `packages/dev-seed/src/template/types.ts:105-106` are docstring examples.)

⚠ `packages/dev-seed/tests/templates/default.test.ts` uses **its own local fakes** — `seed_party_${i}`
at :29 and `seed_cat_${i}` at :33 are helper-constructed org/category refs, not references to
`default.ts`. Its two real couplings to a template idiom are the candidate-id assertions at :97
(`/^seed_cand_\d{4}$/`) and :112 (`` `seed_cand_${String(i).padStart(4, '0')}` ``), and **`cand_` is
not being renamed**, so they stand. [VERIFIED: packages/dev-seed/tests/templates/default.test.ts:29,33,97,112]

### The strand proof D-05 demands

`external_id` is the upsert key for `bulk_import` and the `LIKE prefix%` key for teardown. The failure
mode a rename can produce is **duplicate rows on a non-reset database**: seeding the renamed template
over a DB that still holds `seed_party_blue` creates `seed_org_blue` and leaves the old row behind.
`db:reset-with-data` cannot hit this (it resets first), but `yarn db:seed:default` alone can.

The proof is cheap and must be run, not assumed:

1. Seed the **old** template (`yarn db:seed --template default` at the pre-rename blob).
2. Seed the **renamed** template without a reset. Count `organizations` and `constituencies` by
   `external_id LIKE 'seed_%'` → expect 16 and 10 (the strand, made visible).
3. `yarn db:seed:teardown` → count both again → expect **0 of either idiom**, since teardown filters
   on the `seed_` prefix which is unchanged.
4. `yarn db:reset-with-data` → expect 8 and 5, all in the new idiom.

Step 3 is what discharges "must be proven not to strand rows." M-13's finding that the `seed_` prefix
is auto-applied to `fixed[]` rows is what makes step 3 work, and it is re-confirmed by the live data:
every seeded row measured this session carries the `seed_` prefix (e.g. `seed_election_default`,
`seed_c_01`…`seed_c_05`) [VERIFIED: live local Supabase, this session].

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reading data as the voter app reads it | A `set local role anon` SQL probe wrapped in a test | `createClient(url, anonKey)` + `.rpc('get_nominations', …)` | The SQL form skips PostgREST and the JWT — it can pass while the app's real path fails. Keep the SQL form as a *diagnostic* row in the ledger, not as the standing guard. |
| Proving the guard's client is genuinely anon | A JWT decoder / base64 parse of the key's `role` claim | The `accounts` role differential (R-5) | Zero dependencies, and it survives Supabase's newer non-JWT key formats (`sb_publishable_…` / `sb_secret_…`, both already emitted by CLI 2.83.0 alongside the JWTs). A JWT parse would silently stop working on that migration. |
| Getting a local anon key into the test | Adding `SUPABASE_ANON_KEY` to `.env` / `.env.example` | `process.env.SUPABASE_ANON_KEY ?? <local demo anon key literal>` | **`.env` and `.env.example` are read/write-denied in this environment** — the identical attempt was blocked in Phase 142 and recorded as an open blocker [VERIFIED: .planning/STATE.md:902; .planning/WINDOWS.md:64]. The literal-fallback pattern is already in-repo twice. |
| Discovering the election/constituency ids | Hard-coding UUIDs from a prior session | `get_nominations()` with no arguments, or an `external_id` lookup | `gen_random_uuid()` default [VERIFIED: apps/supabase/supabase/schema/101-elections.sql:49]. |
| Timestamping the terms acceptance | `new Date().toISOString()` / faker | The literal `'2025-01-01T00:00:00.000Z'` | Determinism: the template pins `seed: 42` [VERIFIED: packages/dev-seed/src/templates/default.ts:38] and `default.test.ts` Test 9 asserts byte-identical output across calls (`expect(JSON.stringify(rowsA)).toEqual(JSON.stringify(rowsB))`) [VERIFIED: packages/dev-seed/tests/templates/default.test.ts:117-123]. A `now()`-derived value fails that test. |
| Making the fix reach the DB | Adding `terms_of_use_accepted` to `permittedKeys` / a row type | Nothing — it is already permitted | `'terms_of_use_accepted',` sits in the `candidates:` permitted list [VERIFIED: packages/dev-seed/src/template/permittedKeys.ts:296], it is a real column so it survives the `NON_COLUMN_FIELDS` strip, and `COLLECTION_NON_COLUMN_LIST.candidates` is `['email']` only [VERIFIED: packages/dev-seed/src/template/permittedKeys.ts:507-511]. |

**Key insight:** almost everything this phase could "build" already exists one file away. The genuinely
new artefacts are exactly three — the anon client, its role control, and the ledger.

---

## Runtime State Inventory

Included because this phase performs a **rename** (`external_id` values) against a system that stores
those values as durable keys. Every category is answered explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | `public.organizations.external_id` and `public.constituencies.external_id` in the live local database hold the **old** idiom today — measured: `seed_c_01`…`seed_c_05` returned by an anon `GET /rest/v1/constituencies` this session. `nominations.external_id` values are **derived** from the org/constituency ids (`nom_org_${org.external_id}_${constituency.external_id}` [VERIFIED: packages/dev-seed/src/templates/defaults/nominations-override.ts:156]) so they change automatically. Alliance-nom ids likewise (`nom_alliance_${key}_${constituencyExtId}` [VERIFIED: packages/dev-seed/src/templates/defaults/alliances-override.ts:113]). | **Code edit + a data-hygiene step.** No migration: the rows are dev seed data. But the plan must run the four-step strand proof above so "old rows are removed by `seed_`-prefix teardown" is *measured*, not assumed. |
| **Live service config** | **None.** No Supabase Dashboard-held config, no n8n/Datadog/Cloudflare equivalent in this repo. `app_settings` is written by the template itself through `updateAppSettings`/`merge_jsonb_column` into `seed.sql`'s bootstrap row, and the default template's `app_settings.settings` block references **no** `external_id` values (only `entities` and `results` sub-objects) [VERIFIED: packages/dev-seed/src/templates/default.ts:229-265]. | None. |
| **OS-registered state** | **None** — verified by inspection of `package.json` scripts (`db:*` / `dev:*` only) and the absence of any scheduler/daemon registration in this repo. | None. |
| **Secrets / env vars** | **One genuinely new env var: `SUPABASE_ANON_KEY`.** Absent from `packages/dev-seed` entirely, absent from the `dev-seed-integration` CI job [VERIFIED: .github/workflows/main.yaml:205-215], and **cannot be added to `.env`/`.env.example`** in this environment [VERIFIED: .planning/STATE.md:902]. The frontend's equivalent is `PUBLIC_SUPABASE_ANON_KEY`, read via `constants.PUBLIC_SUPABASE_ANON_KEY` [VERIFIED: apps/frontend/src/lib/supabase/server.ts:11] — a *different* namespace, and dev-seed's vitest run does **not** load the root `.env` (only the seed **CLI** does, at `src/cli/seed.ts:47-50`). | **CI workflow edit** (export `ANON_KEY` from `supabase status -o env`) **+ a test-local fallback literal**. Do not attempt the `.env` route; it is a known-blocked path. |
| **Build artifacts / installed packages** | **None.** `packages/dev-seed`'s build script is `"build": "echo 'Nothing to build.'"` [VERIFIED: packages/dev-seed/package.json:13] — there is no `dist/`, no egg-info analogue, and the package is consumed from `./src/index.ts` directly (`"main": "./src/index.ts"` [VERIFIED: packages/dev-seed/package.json:7]). Portrait objects in the `public-assets` bucket are keyed by candidate **UUID**, not `external_id` (`${projectId}/candidates/${candidateId}/seed-portrait.jpg` [VERIFIED: packages/dev-seed/tests/integration/default-template.integration.test.ts:496-498]), and candidate ids are **not** being renamed. | None. |

---

## Common Pitfalls

### Pitfall 1: A new integration test file races the seeding block
**What goes wrong:** The anon assertion reads a database that the seeding block has not written yet,
or has already torn down. Symptom is an intermittent `candidate: 0` — which reads exactly like the
defect, so the team "fixes" a fix that already worked.
**Why it happens:** Vitest's default pool parallelises across *files*; `it` blocks within one `describe`
are sequential. The seeded rows are produced by the existing `it` at
`default-template.integration.test.ts:200`.
**How to avoid:** Second `it`, same `describe.skipIf(!hasSupabase)` block, after the existing one.
**Warning signs:** The assertion passes when run alone (`-t`) and fails in a full run, or vice versa.
**Note:** this also violates CLAUDE.md's no-flaky-tests rule the moment it appears — there is no
"known-flaky" exemption in this repo.

### Pitfall 2: The anon client is not actually anon
**What goes wrong:** The guard passes forever without ever crossing the RLS boundary — the exact
failure mode M-11 describes for the existing suite, reproduced in the check built to prevent it.
**Why it happens:** A copy-paste in the workflow, an env var set to the wrong key, or a fallback
literal pasted from the service-role constant three lines above it in the same file.
**How to avoid:** The `accounts` role differential (R-5) as a precondition inside the same `it`.
**Warning signs:** The pair-1 RED half won't reproduce — the guard is green against the pre-fix tree.
**This is a stop-the-line signal, not a puzzle:** if pair 1 will not go RED, the guard is wrong.

### Pitfall 3: The operation budget rejects a newly-observed call
**What goes wrong:** `expect(unbudgeted).toEqual([])` at
`default-template.integration.test.ts:283-284` fails, because it filters *every* `SupabaseAdminClient`
prototype method with a non-zero count against `BUDGETED_WRITE_OPS`.
**Why it happens:** Only if the anon work is routed through `SupabaseAdminClient`. It must not be —
build a bare `createClient` like `makeReadClient` does, which the spy never sees.
**How to avoid:** Do not extend `SupabaseAdminClient` for this. Also note `afterEach(() => vi.restoreAllMocks())`
[VERIFIED: packages/dev-seed/tests/integration/default-template.integration.test.ts:196-198] restores the
spies between `it` blocks, so a second block is not observed at all.
**Warning signs:** A failure naming a method in the `unbudgeted` array.

### Pitfall 4: Assuming the override's rows are type-checked
**What goes wrong:** A plan writes "criterion 4 — the strict row type will catch a typo in
`terms_of_use_accepted`." It will not.
**Why it happens:** `Overrides` is deliberately loose:

```ts
export type Overrides = {
  [table: string]: (fragment: unknown, ctx: Ctx) => Array<Record<string, unknown>>;
};
```

[VERIFIED: packages/dev-seed/src/types.ts:46-48 — and the docstring at :41-44 says so: "NOT typed
narrowly per-table because overrides are user-supplied … `Record<string, unknown>` is the correct
granularity at this seam."]

Phase 144's `CandidatesFixedRow` = `FixedRow<'candidates'>` applies to `Fragment<TRow>['fixed']`
[VERIFIED: packages/dev-seed/src/template/permittedKeys.ts:1007-1012,1036; src/types.ts:27-30], i.e.
to `default.ts`'s hand-authored rows — **not** to `candidatesOverride`'s output.
**How to avoid:** State plainly that the override's protection is the **runtime** guard
(`assertKnownRowProps(data)` at `packages/dev-seed/src/writer.ts:181`, keyed off
`permittedKeys.ts:296`), and that criterion 4's "typechecks under Phase 144's strict row types" is
satisfied by `default.ts` — which typechecks today at exit 0 (R-6) and must still after the rename.
**Warning signs:** A plan proposing a `permittedKeys` edit (D-10 already forbids it).

### Pitfall 5: Verifying criterion 1 by navigating directly to `/results`
**What goes wrong:** The dev server dies. M-14: uncaught
`Cannot use cookies.set(...) after the response has been generated`, reproducible from a session-less
direct URL hit. The call site is real:

```ts
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' });
```

[VERIFIED: apps/frontend/src/lib/supabase/server.ts:14-16]
**How to avoid:** Walk the warm path — `/` → `/intro` → `/elections` → `/constituencies` →
`/questions` → `/results` — which is the path M-2/M-3/M-9 used. The voter routes are
`(voters)/+page.svelte`, `intro`, `elections`, `constituencies`, `(located)/questions`,
`(located)/results/[[electionTab]]/…` [VERIFIED: apps/frontend/src/routes/(voters)/ tree, this session].
**Warning signs:** Vite exits; the before/after session is lost and criterion 1's "in the same session"
clause is broken.

### Pitfall 6: A computed `terms_of_use_accepted` breaks determinism
**What goes wrong:** `default.test.ts` Test 9 (`deterministic — same ctx/org refs yield byte-identical
rows across calls`) fails, and `tests/determinism.test.ts` may too.
**Why it happens:** `new Date().toISOString()` differs between the two calls inside one test.
**How to avoid:** Use `e2e/base`'s literal `'2025-01-01T00:00:00.000Z'` — 32 occurrences there
[VERIFIED: packages/dev-seed/src/templates/e2e/base.ts:1039,1087,…,1380], which also makes the two
templates diff cleanly, satisfying D-03's "so the two templates read alike."
**Warning signs:** An intermittent JSON-stringify inequality.

### Pitfall 7: `yarn test:unit` re-seeds the live database mid-verification
**What goes wrong:** The app-level before/after evidence for criterion 1 is invalidated because a
test run overwrote the database between the "before" and "after" observations.
**Why it happens:** The integration test writes the full default template and its teardown is
**pre-test only, with no post-test counterpart** — recorded as residue **RES-15**, "`yarn test:unit`
leaves a full seeded dataset in the live local database" [VERIFIED: .planning/REQUIREMENTS.md:57].
**How to avoid:** Sequence the app-level verification and the suite runs deliberately, and record the
order in the ledger. Post-fix, a test run leaves a *correct* dataset, so the hazard is asymmetric —
it bites the **pre-fix** ("before") observation.

### Pitfall 8: The Supabase CLI stops emitting `ANON_KEY`
**What goes wrong:** The CI export silently produces an empty `SUPABASE_ANON_KEY`, the test falls back
to the hard-coded local demo key, that key is wrong for the runner's instance, PostgREST 401s, the
count is 0, and the build goes **red for the wrong reason**.
**Why it happens:** The job pins `supabase/setup-cli@v1` with `version: latest`
[VERIFIED: .github/workflows/main.yaml:167-169], and CLI 2.83.0 already emits the newer
`PUBLISHABLE_KEY` / `SECRET_KEY` pair alongside `ANON_KEY` / `SERVICE_ROLE_KEY` [VERIFIED: `supabase status -o env`, this session].
**How to avoid:** Mirror the existing `test -n "$API_URL" || { echo "::error::…"; exit 1; }` guard
[VERIFIED: .github/workflows/main.yaml:211-212] for `ANON_KEY`, so the *wiring* failure is named at the
export step rather than mis-diagnosed as a seed regression.
**Warning signs:** A red guard with `candidate: 0` on CI while the same tree is green locally.

---

## Code Examples

All snippets below are written against the file's existing conventions and the verbatim values cited
in this document.

### 1. The anon client (mirrors `makeReadClient`, `default-template.integration.test.ts:122-130`)

```ts
/**
 * Ad-hoc ANON client. The mirror of `makeReadClient` above, and the whole point
 * of this file's new assertion: `makeReadClient` authenticates as service_role,
 * which BYPASSES RLS, so every existing assertion in this file is structurally
 * blind to whether the voter app can read the data it just wrote.
 *
 * Fallback literal is the standard local `supabase start` demo anon key — the
 * same pattern `makeReadClient` and `supabaseAdminClient.ts:48-50` use for the
 * service-role key. It is NOT read from the repo-root `.env`: this file runs
 * under vitest, which does not load it (only the seed CLI does, seed.ts:47-50).
 */
function makeAnonClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
  const key =
    process.env.SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
```

The fallback literal is [VERIFIED: `supabase status -o env` on the running local instance, this session
— `ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"`].

### 2. The guard, as a second `it` in the same `describe`

```ts
  it('the seeded dataset is readable by the ANON client — the voter app path (TMPL-03)', async () => {
    const anonClient = makeAnonClient();

    // --- Guard-of-the-guard: prove this client is really anon. ------------
    // Failure mode this closes: if SUPABASE_ANON_KEY were ever set to the
    // service-role key, every assertion below would pass forever WITHOUT
    // crossing the RLS boundary — the exact blindness class this test exists
    // to end. `accounts` has no anon SELECT policy, so anon must see zero rows
    // while service_role sees the bootstrap row.
    const { data: anonAccounts } = await anonClient.from('accounts').select('id');
    expect(anonAccounts ?? []).toHaveLength(0);
    const { data: svcAccounts } = await readClient.from('accounts').select('id');
    expect((svcAccounts ?? []).length).toBeGreaterThan(0);

    // --- The assertion itself. --------------------------------------------
    // No-arg form: no election/constituency UUID to look up, and none to
    // hard-code — `constituencies.id` is `DEFAULT gen_random_uuid()`
    // (101-elections.sql:49), so any literal UUID is valid only until the next
    // `db:reset`. Counts are the same 327 / 40 / 10 asserted in-memory above.
    const { data: noms, error } = await anonClient.rpc('get_nominations', {});
    expect(error).toBeNull();
    const byType = new Map<string, number>();
    for (const row of (noms ?? []) as Array<{ entity_type: string }>) {
      byType.set(row.entity_type, (byType.get(row.entity_type) ?? 0) + 1);
    }
    // Measured 2026-08-24 against the PRE-FIX template: anon saw
    // { organization: 40, alliance: 10 } and NO candidate key at all, while
    // service_role saw { candidate: 327, organization: 40, alliance: 10 }.
    expect(byType.get('candidate') ?? 0).toBeGreaterThan(0);
    expect(byType.get('organization') ?? 0).toBeGreaterThan(0);
  }, 300_000);
```

### 3. The pure-I/O half, for `default.test.ts` (D-04's fast-suite pairing)

```ts
  it('Test 28: every emitted candidate row carries terms_of_use_accepted (anon-RLS precondition)', () => {
    const rows = candidatesOverride({}, makeCtx());
    for (const row of rows) {
      // `anon_select_candidates` requires published = true AND
      // terms_of_use_accepted IS NOT NULL AND terms_of_use_accepted < now().
      // `published` is auto-defaulted by bulkImport's PUBLISHABLE_TABLES set;
      // this column is NOT, and its absence is what made the Candidates tab
      // disappear from the voter results page.
      expect((row as { terms_of_use_accepted?: string }).terms_of_use_accepted).toBe(
        '2025-01-01T00:00:00.000Z'
      );
    }
  });
```

### 4. The CI export (extends the existing step at `.github/workflows/main.yaml:205-215`)

```yaml
      - name: "Export Supabase connection env"
        working-directory: apps/supabase
        run: |
          STATUS="$(supabase status -o env)"
          API_URL="$(printf '%s\n' "$STATUS" | grep '^API_URL=' | cut -d= -f2- | tr -d '"')"
          SERVICE_ROLE_KEY="$(printf '%s\n' "$STATUS" | grep '^SERVICE_ROLE_KEY=' | cut -d= -f2- | tr -d '"')"
          ANON_KEY="$(printf '%s\n' "$STATUS" | grep '^ANON_KEY=' | cut -d= -f2- | tr -d '"')"
          test -n "$API_URL" || { echo "::error::API_URL missing from supabase status"; exit 1; }
          test -n "$SERVICE_ROLE_KEY" || { echo "::error::SERVICE_ROLE_KEY missing from supabase status"; exit 1; }
          # Without this the anon guard falls back to a hard-coded local demo key
          # that will not authenticate against THIS instance, and the resulting
          # red build reads as a seed regression rather than a wiring loss.
          test -n "$ANON_KEY" || { echo "::error::ANON_KEY missing from supabase status"; exit 1; }
          echo "SUPABASE_URL=$API_URL" >> "$GITHUB_ENV"
          echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY" >> "$GITHUB_ENV"
          echo "SUPABASE_ANON_KEY=$ANON_KEY" >> "$GITHUB_ENV"
```

[Structure VERIFIED against .github/workflows/main.yaml:205-215; the `ANON_KEY` line name VERIFIED
against `supabase status -o env` output, this session.]

### 5. The fix itself (`defaults/candidates-override.ts:137-145`)

```ts
    const row: Record<string, unknown> = {
      external_id: `${ctx.externalIdPrefix}cand_${String(i).padStart(4, '0')}`,
      project_id: ctx.projectId,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      sort_order: i,
      is_generated: true,
      organization: partyByIndex[i],
      // Required by `anon_select_candidates`, which is THREE clauses:
      //   published = true AND terms_of_use_accepted IS NOT NULL
      //   AND terms_of_use_accepted < now()
      // `bulkImport`'s PUBLISHABLE_TABLES auto-default supplies only the first,
      // so without this the seeded candidates are invisible to the voter app's
      // anon client and the Candidates tab never renders.
      // Literal (not a computed timestamp) for two reasons: it matches
      // `e2e/base` byte-for-byte so the templates diff cleanly, and the default
      // template pins `seed: 42` — a `now()`-derived value would break the
      // byte-identical determinism `default.test.ts` Test 9 asserts.
      terms_of_use_accepted: '2025-01-01T00:00:00.000Z'
    };
```

[Row literal VERIFIED: packages/dev-seed/src/templates/defaults/candidates-override.ts:137-145]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `anon_select_candidates` = `USING (published = true)` | Three-clause predicate adding `terms_of_use_accepted IS NOT NULL AND … < now()` | Migration `00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql` | The change that stranded `default.ts`. Its own header says why: `CA-AA-Hidden … was seeded with terms_of_use_accepted = NULL but remained visible to the voter app under the v1 RLS rule` [VERIFIED: same file:4-8]. `e2e/base` was updated; `default.ts` was not. |
| `get_nominations` returned nominations whose entity join was RLS-blocked | `AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL` | Same migration, part 2 | Turns an RLS-invisible entity type into an **absent key**, hence an absent tab. |
| `Template.fixed` typed `Array<Record<string, unknown>>` | Per-collection `FixedRow<C>` aliases | Phase 144 (TMPL-01) | `default.ts` is now type-checked; the **overrides are not** (Pitfall 4). |
| `packages/dev-seed` tsconfig `include: ["src/**/*"]` | `["src/**/*", "tests/**/*", "scripts/**/*"]` | Phase 144 | New test code **is** type-checked. `packages/dev-seed`'s **lint** script is still `eslint … src/`, so new test files are **unlinted** — residue **RES-13** [VERIFIED: packages/dev-seed/package.json:14; .planning/REQUIREMENTS.md:57]. |
| Built-in templates bypassed zod validation | `resolveTemplate` returns `validateTemplate(builtIn)` | Phase 144 | Any negative-control fixture template must pass `validateTemplate` [VERIFIED: packages/dev-seed/src/cli/resolve-template.ts:84]. |
| Supabase local keys were JWT-only (`ANON_KEY`/`SERVICE_ROLE_KEY`) | CLI also emits `PUBLISHABLE_KEY` (`sb_publishable_…`) and `SECRET_KEY` (`sb_secret_…`) | Present at CLI 2.83.0 | Do not build the role check on JWT parsing (§ Don't Hand-Roll). |

**Deprecated/outdated:**
- The roadmap's criterion-1 parenthetical *"(currently 0)"* for parties — disproved by M-2 and closed
  by `49a23512e`. Corrected by D-01.
- The todo's symptom 3 *"Mixed naming of constants"* — the constants are fine; the divergence is two
  `external_id` typecodes. Corrected by D-05, narrowed further by C-1 here.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vitest 3.x's default pool parallelises across test **files** but runs `it` blocks within one `describe` sequentially. | Pitfall 1 / Anti-Patterns | Low. If wrong in either direction, the recommendation (same file, second `it`) is still the safe choice — it is strictly more ordered than a new file. |
| A2 | `supabase status -o env` still emits `ANON_KEY` on the CLI version `supabase/setup-cli@v1 · version: latest` resolves to in CI. Measured at **2.83.0 locally**; CI may resolve higher (2.115.0 was advertised as available). | Code Example 4 / Pitfall 8 | Medium. Mitigated by design: the `test -n "$ANON_KEY"` guard converts the failure into a named wiring error at the export step. Confirm on the first CI run. |
| A3 | The `accounts` table has no anon SELECT policy and will keep returning 0 rows for anon after the fix. Measured (R-5) but the policy text was not read from `302-rls.sql`. | Pattern 2 / Code Example 2 | Low-medium. If a future migration grants anon read on `accounts`, the control silently stops discriminating. A plan may prefer to read the policy list and cite it, or pick a table whose anon-denial is asserted in pgTAP. |
| A4 | Renaming `party_*` → `org_*` does not break the `PARTY_CONSTITUENCY_MATRIX` ↔ `PARTY_WEIGHTS` alignment, because those index by **position** in `ctx.refs.organizations`, not by name. | § `external_id` blast radius | Medium. `alliances-override.ts`'s `ALLIANCE_MEMBERSHIP` **does** key by name and must change; `nominations-override.ts` derives from `organizations[orgIdx].external_id` positionally. A plan must re-read `nominations-override.ts` in full before the rename lands. |
| A5 | The four-step strand proof's expected counts (16 orgs / 10 constituencies at step 2) follow from `bulk_import` upserting on `external_id`. Not executed this session. | § The strand proof | Low. The proof *is* the measurement — if the counts differ, the ledger records what actually happened. |
| A6 | The literal `'2025-01-01T00:00:00.000Z'` satisfies `terms_of_use_accepted < now()` for the foreseeable life of this template. | § Don't Hand-Roll / Code Example 5 | Very low — it is in the past and `e2e/base` already relies on it. |

**Nothing in this table is a compliance, retention, or security policy claim.** The one security-shaped
statement in this document — that `anon_select_candidates` must not be relaxed — is a *locked decision*
(D-02 option C, rejected), not an assumption.

---

## Open Questions

1. **Should the guard live only in the integration test, or should the `default.test.ts` half assert
   the value or merely the presence?**
   - What we know: D-04 specifies "a cheap pure-I/O assertion in `default.test.ts` that every emitted
     candidate row carries `terms_of_use_accepted`."
   - What's unclear: asserting the exact literal (`toBe('2025-01-01T00:00:00.000Z')`) also pins the
     cross-template consistency D-03 asks for; asserting only presence (`toBeDefined()`) is looser but
     survives a deliberate future change of the literal.
   - Recommendation: assert the **literal**, and add a second one-line cross-template assertion that
     `e2e/base`'s candidate rows use the same value — that is the "ready-made cross-template
     consistency assertion" the CONTEXT's § Reusable Assets already names. A future literal change then
     fails in one obvious place with an obvious fix.

2. **Where does pair 2's `published = false` injection live — a throwaway edit or a committed fixture?**
   - What we know: `tests/fixtures/negctl-*.ts` is an established home for negative-control template
     fixtures (four exist), and Phase 144's protocol for RED halves is byte-identical injection +
     `git checkout --` + blob-hash restore.
   - What's unclear: a committed fixture is re-runnable evidence; a throwaway injection matches 144's
     protocol exactly and leaves no permanently-broken template in the tree.
   - Recommendation: **throwaway injection with the full 144 restore protocol**, because pair 2's
     assertion is about the *guard's* discrimination, not about a template anyone will seed again.
     Record the injected diff verbatim in the ledger so it is reproducible without the file existing.

3. **Does the `alliance_L` / `alliance_R` uppercase discriminator get lowercased in the D-05 sweep?**
   - What we know: it conforms on typecode (`alliance`, matching `AlliancesGenerator`) but is the only
     uppercase discriminator in the template. `allianceExtId(key, prefix)` and
     `allianceNomExtId(key, constituencyExtId, prefix)` both interpolate it
     [VERIFIED: packages/dev-seed/src/templates/defaults/alliances-override.ts:100-101,112-113].
   - What's unclear: whether "one idiom across all collections" (D-05) reaches case as well as typecode.
   - Recommendation: **leave it**, and say so in the divergence note. It is cosmetic, it widens the
     rename's blast radius into two helper functions and every derived nomination id for no measured
     benefit, and D-05's stated target is the typecode scheme.

4. **Is the `dev-seed-integration` job's `paths-filter`-free design still correct once the guard needs
   an anon key?**
   - What we know: the job deliberately has no path filter, because "a conditional guard is how F5
     happened in the first place" [VERIFIED: .github/workflows/main.yaml:155-160].
   - What's unclear: nothing, really — the answer is yes.
   - Recommendation: do not add a filter. Noted here only so a plan does not "optimise" it.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Local Supabase (Postgres + PostgREST) | The anon guard, the strand proof, criterion 1's app verification | ✓ (running, `GET /rest/v1/` → 200) | API at `http://127.0.0.1:54321` | None — the guard is `describe.skipIf(!hasSupabase)`; without it the phase cannot produce its evidence. |
| `supabase` CLI | `db:reset`, `db:reset-with-data`, `supabase status -o env` | ✓ (via `npx`, not on bare `PATH` in a non-login shell) | 2.83.0 (2.115.0 available) | Invoke as `npx supabase` or through the workspace scripts (`yarn db:*`). |
| `SUPABASE_ANON_KEY` env var | The anon guard | ✗ | — | ✓ Local demo key literal in the test + `ANON_KEY` export in CI (§ Code Examples 1 and 4). |
| `SUPABASE_URL` env var (local) | `describe.skipIf(!hasSupabase)` | ✗ by default in a fresh shell | — | Exported manually before `yarn test:unit`, or the test skips. **A skipped guard is a "did not run", which this project counts as a failure.** |
| `.env` / `.env.example` write access | Would be the natural home for `SUPABASE_ANON_KEY` | ✗ **denied** | — | ✓ Do not use this route (`STATE.md:902`). |
| Node.js | Everything | ✓ | 22.22.1 in CI [VERIFIED: .github/workflows/main.yaml:190-193] | — |
| `psql` / direct `postgres` role | The M-4-style `set local role anon` diagnostic | not verified this session | — | ✓ The PostgREST + anon-JWT probe used throughout this research (curl or `createClient`) reproduces the same differential and is closer to the app's path. |
| Playwright / browsers | Not needed — D-04 rejected the E2E option | n/a | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** `SUPABASE_ANON_KEY` (literal + CI export); local `SUPABASE_URL`
(export before the run); `.env` write access (do not use).

---

## Validation Architecture

`workflow.nyquist_validation` is **absent** from `.planning/config.json`, so it is treated as enabled.
[VERIFIED: .planning/config.json — keys present are `mode`, `depth`, `parallelization`, `commit_docs`,
`model_profile`, `granularity`, `workflow{research, plan_check, verifier, _auto_chain_active, use_worktrees}`,
`model_overrides`]

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `vitest` `^3.2.4` (catalog-pinned) |
| Config file | `packages/dev-seed/vitest.config.ts` — deliberately empty (`export default {};`), present only so the root `vitest.workspace.ts` (`export default ['packages/**/vitest.config.ts'];`) discovers the workspace |
| Quick run command | `yarn workspace @openvaa/dev-seed test:unit` (pure-I/O tests always run; integration block runs only with `SUPABASE_URL` exported) |
| Full suite command | `yarn test:unit` (turbo, `"cache": false` on `test:unit`, so never a replay) |
| Typecheck gate | `TURBO_FORCE=true npx turbo run typecheck` — `packages/dev-seed/tsconfig.json` includes `tests/**/*`, so new spec code is checked |

[VERIFIED: packages/dev-seed/vitest.config.ts; vitest.workspace.ts; turbo.json:8-11; packages/dev-seed/tsconfig.json:12]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TMPL-03 | The seeded default dataset is readable by an **anon** client: `get_nominations()` returns `candidate > 0` and `organization > 0` | integration (live Supabase) | `SUPABASE_URL=… SUPABASE_ANON_KEY=… yarn workspace @openvaa/dev-seed test:unit` | ✅ file exists — `tests/integration/default-template.integration.test.ts`; **the `it` block is new** |
| TMPL-03 | The anon client used by that assertion really is anon (`accounts`: anon 0 / service_role >0) | integration precondition | same command | ❌ new — inside the same `it` |
| TMPL-03 | Every candidate row `candidatesOverride` emits carries `terms_of_use_accepted: '2025-01-01T00:00:00.000Z'` | unit (pure I/O) | `yarn workspace @openvaa/dev-seed test:unit` | ✅ file exists — `tests/templates/default.test.ts` (27 tests); **Test 28 is new** |
| TMPL-03 | Cross-template consistency: `e2e/base`'s candidates use the same literal | unit (pure I/O) | same | ❌ new (see Open Question 1) |
| TMPL-04 | `default.ts` typechecks under the Phase-144 strict row types with no `any` / cast escapes, after the rename | typecheck | `TURBO_FORCE=true npx turbo run typecheck` | ✅ gate exists (exit 0 today — R-6) |
| TMPL-04 | The rename strands no rows: after `db:seed:teardown`, zero rows of either idiom remain | manual, ledger-recorded | four-step procedure in § The strand proof | ❌ new — ledger rows, not a spec |
| criterion 1 | Voter results page shows a non-empty parties list **and** a Candidates tab, both states in one session | manual UAT (warm path, per Pitfall 5) | browser walk `/` → `/intro` → `/elections` → `/constituencies` → `/questions` → `/results` | ❌ manual by design — D-04 rejected the Playwright option |
| criterion 2/3 | The guard is observed RED against the pre-fix tree and against a `published:false` injection | negative-control ledger | 144's injection + `git checkout --` + blob-hash protocol | ❌ new — `145-NEGATIVE-CONTROL-LEDGER.md` |

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/dev-seed test:unit` (with `SUPABASE_URL` exported, so
  the integration block is not silently skipped).
- **Per wave merge:** `yarn test:unit` + `TURBO_FORCE=true npx turbo run typecheck`.
- **Phase gate:** the milestone's standing seven, all at one HEAD, `yarn test:e2e` **last** under
  CLAUDE.md's cardinal rule, after `yarn db:reset` against exactly one fresh dev server
  [VERIFIED: .planning/REQUIREMENTS.md:57 — `yarn test:unit`, `TURBO_FORCE=true yarn lint:check`,
  `yarn format:check`, `TURBO_FORCE=true yarn build`, `yarn workspace @openvaa/frontend check`,
  `TURBO_FORCE=true npx turbo run typecheck`, `yarn test:e2e`].

⚠ **E2E-gate hazard specific to this phase.** The phase's own work re-seeds the live database with the
`default` template, while the E2E suite asserts against `e2e/base`. The gate-7 run must be preceded by
`yarn db:reset` (and the suite's own `data-setup-*` projects), exactly as Phase 144's gate-7 protocol
required — one of 144's two disclosed void attempts was a contaminated database from precisely this
mechanism [VERIFIED: .planning/REQUIREMENTS.md:57].

### Wave 0 Gaps

- [ ] `SUPABASE_ANON_KEY` wiring — CI export step + test-local fallback (blocks every TMPL-03 test row)
- [ ] `145-NEGATIVE-CONTROL-LEDGER.md` — created by the first plan, before any behaviour-changing commit
- [ ] Blob-hash restoration table for the 7 files this phase edits
- [ ] No framework install needed — vitest is present and configured

---

## Security Domain

`security_enforcement` is **absent** from `.planning/config.json`, so it is treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | This phase adds no auth path. The anon "credential" is a public, project-scoped API key by design. |
| V3 Session Management | no | The test clients are constructed with `auth: { autoRefreshToken: false, persistSession: false }` — no session is created. |
| V4 Access Control | **yes** | Postgres RLS (`anon_select_candidates`). **The control is correct and is not modified.** The phase changes *data* so it satisfies the control, and adds the first automated assertion that the control is being satisfied. Relaxing the policy is the rejected D-02 option C. |
| V5 Input Validation | indirect | `assertKnownRowProps` (Pass 0) + zod `validateTemplate` already gate template content; this phase adds one already-permitted key and no new input surface. |
| V6 Cryptography | no | No cryptography. Do **not** hand-roll a JWT decode for the role check (§ Don't Hand-Roll). |
| V7 Error Handling & Logging | minor | The CI `test -n "$ANON_KEY"` guard exists so a wiring loss is a *named* error, not a mis-attributed test failure. |
| V14 Configuration | **yes** | A new secret-shaped env var enters CI. It is the local/ephemeral anon key, not a production credential. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Weakening RLS to make seed data visible | Information Disclosure | **Forbidden here.** Fix the data, not the policy (D-02/D-03). Unaccepted-terms candidates must stay invisible to anon. |
| A test authenticating as service_role and claiming to prove anon visibility | Repudiation (false assurance) | The role differential control (Pattern 2). This is the phase's central security-shaped risk, and it is the exact defect M-11 documents. |
| Committing a real project's anon key into the repo | Information Disclosure | The fallback literal is the **published local `supabase start` demo key**, already committed twice in this repo for service_role. CI overrides it from the running instance. Never paste a hosted-project key. |
| Backdating terms-of-use acceptance on real candidate records | Tampering | Scoped to synthetic `is_generated: true` / `seed_`-prefixed demo rows only. **Do not** implement it as a global auto-default (rejected option B), which would reach `e2e/base`'s deliberately-unaccepted rows. |
| Identifier injection through `external_id` during the rename | Tampering | `external_id` values reach `_bulk_upsert_record` as *values* (`quote_literal`), not identifiers; the unquoted-identifier surface is the **key** path, narrowed to a derived closed set by TMPL-02 and filed as residue **RES-14** [VERIFIED: .planning/REQUIREMENTS.md:69]. The rename introduces no new key names. |

---

## Project Constraints (from CLAUDE.md)

Actionable directives extracted from `./CLAUDE.md`, to be honoured by every plan in this phase:

1. **E2E hard rule — cardinal failure.** No task may proceed, complete, or be marked done while any
   E2E test is failing. **No "known-flaky" exemptions**; a "did not run" counts as a failure. Prefer
   running the **whole** suite (`yarn test:e2e`) for interim verification.
2. **E2E preflight.** Every run begins with the served-application preflight; there is no skip flag.
   `FRONTEND_PORT` is the alternate-port escape hatch.
3. **E2E prerequisites.** `yarn db:reset` + exactly one fresh dev server before the full-suite gate;
   a stale server steals the port.
4. **Never commit sensitive data** (API keys, tokens, `.env` files). The local demo anon key is a
   published non-secret and is already in-tree for service_role — but nothing hosted may be added.
5. **Use TypeScript strictly — avoid `any`, prefer explicit types.** Criterion 4 restates this for
   `default.ts`; it applies equally to the new test code, which **is** typechecked (tsconfig includes
   `tests/**/*`).
6. **Test accessibility / WCAG 2.1 AA** — not engaged by this phase (no UI change).
7. **Localization** — all user-facing strings must support multiple locales. Not engaged: the phase
   adds no user-facing strings. (The template's own 4-locale fan-out is untouched.)
8. **Always check work against `.agents/code-review-checklist.md`.**
9. **`db:*` scripts touch only the database; `dev:*` drive the full stack.** Use `yarn db:reset` (not
   `dev:reset`) when a database-only reset is wanted — `dev:reset` also relaunches the stack.
10. **Context Destructuring Rule (Svelte 5)** — not engaged (no frontend change). Listed so a plan
    that drifts into `apps/frontend` (it should not) knows the rule exists.

---

## Sources

### Primary (HIGH confidence) — measured or read this session

- Live local Supabase at `http://127.0.0.1:54321` — role-differential `get_nominations` probes
  (no-arg and constituency-scoped), `candidates` column state, `accounts` role differential,
  `elections` / `constituencies` `external_id` values. All 2026-08-24, HEAD `38689459d`.
- `supabase status -o env` (CLI 2.83.0) — env key names and the local demo anon key.
- `apps/supabase/supabase/migrations/00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql`
  — the policy and the RPC, read in full.
- `apps/supabase/supabase/schema/503-entity-rpcs.sql`, `501-bulk-operations.sql`, `101-elections.sql`.
- `packages/dev-seed/src/` — `supabaseAdminClient.ts`, `types.ts`, `template/types.ts`,
  `template/permittedKeys.ts`, `templates/default.ts`, `templates/defaults/*.ts`, `cli/seed.ts`,
  `cli/resolve-template.ts`, `cli/teardown.ts`, all eleven `generators/*.ts`.
- `packages/dev-seed/tests/` — `integration/default-template.integration.test.ts` (read in full),
  `templates/default.test.ts`.
- `.github/workflows/main.yaml:135-230` — the `dev-seed-integration` job.
- `apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts`,
  `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte`,
  `apps/frontend/src/lib/supabase/server.ts`.
- `packages/dev-seed/tsconfig.json`, `package.json`, `vitest.config.ts`, root `vitest.workspace.ts`,
  `turbo.json`, `.yarnrc.yml`, root `package.json`.
- `tsc --noEmit` in `packages/dev-seed` → exit 0.

### Secondary (MEDIUM confidence) — in-repo records, cited not re-measured

- `.planning/phases/145-default-seed-template-repair/145-CONTEXT.md` and `145-DISCUSSION-POINTS.md`
  (M-1 … M-14) — the measured baseline this research builds on; M-2, M-3, M-9, M-13, M-14 are taken
  as recorded rather than re-run.
- `.planning/REQUIREMENTS.md` — the standing acceptance rule, TMPL-01/02 evidence clauses, the seven
  gates, residues RES-13/14/15/16.
- `.planning/ROADMAP.md` § Phase 145 — the four success criteria.
- `.planning/STATE.md:902` and `.planning/WINDOWS.md:64` — the `.env` write-denial blocker.
- `.planning/phases/144-…/144-NEGATIVE-CONTROL-LEDGER.md` — the ledger template.
- `.planning/todos/pending/2026-06-06-fix-broken-default-seed-template.md` — the originating todo.

### Tertiary (LOW confidence)

- None. No web search was used and no external documentation was consulted — every question this
  phase raises is answerable from the repository or the running database, and both were available.

---

## Metadata

**Confidence breakdown:**
- Root cause: **HIGH** — re-measured independently of the CONTEXT's session, both roles, two RPC
  argument forms, with the policy and RPC read from the migration file.
- Standard stack: **HIGH** — no new packages; every version read from `.yarnrc.yml` / `package.json`.
- Guard design: **HIGH** for the mechanism and the client construction (measured); **MEDIUM** for A2
  (CI CLI version) and A3 (`accounts` policy durability), both flagged in the Assumptions Log with
  mitigations.
- `external_id` scheme: **HIGH** — the generator idioms and the blast radius were both enumerated by
  grep and file read; the recommendation to stay snake_case follows directly from that enumeration.
- Pitfalls: **HIGH** for 2-8 (each cites a measured line or a recorded residue); **MEDIUM** for 1
  (rests on A1, vitest's default file-level parallelism).

**Research date:** 2026-08-24
**Valid until:** 2026-09-23 (30 days) — but **invalidated earlier** by any of: a migration touching
`anon_select_candidates` or `get_nominations`; a Supabase CLI major bump in CI; a change to
`PUBLISHABLE_TABLES`; or a `db:reset` (which regenerates every UUID cited here, though not the
`external_id` values).
