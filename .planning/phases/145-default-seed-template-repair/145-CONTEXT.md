# Phase 145: Default Seed Template Repair - Context

**Gathered:** 2026-08-24
**Status:** Ready for planning
**Measured at HEAD:** `e74ae377e` (live local Supabase, app running on :5173)

<domain>
## Phase Boundary

Make `yarn db:reset-with-data` produce a dataset that the voter app's **anon** client can actually
read — specifically, restore the Candidates tab on the voter results page — and lock that in with a
regression guard that is observed failing against today's template before it is claimed to guard.

**In scope:** `packages/dev-seed` — `templates/default.ts`, `templates/defaults/candidates-override.ts`,
the `PUBLISHABLE_TABLES` comment block in `supabaseAdminClient.ts`, `tests/templates/default.test.ts`,
`tests/integration/default-template.integration.test.ts`, and the `external_id` idiom (TMPL-04).

**Out of scope:** the database schema and its RLS policies (measured correct — see D-02); the
frontend results-rendering path (measured correct — 8 parties render through it today); the
`apps/frontend` cookie-lifecycle crash found en route (D-07); a repo-wide audit of the other 9
publishable tables (deferred).

</domain>

<decisions>
## Implementation Decisions

All ten items in `145-DISCUSSION-POINTS.md` were presented with a ★ RECOMMENDED option each.
Per the standing convention (unchecked = recommended wins), **all 8 decision items resolved to their
recommended option; 0 overrules.** Every decision below rests on a measurement recorded in that
doc's measurement table (M-1 … M-14), taken in this working tree today — not on the todo's or the
roadmap's claims, two of which were disproved.

### Root cause (criterion 3)

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

### Scope corrections (the roadmap premise is partly stale)

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

### The fix

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

### The guard (criterion 2) — the crux

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

### Verification surface (criterion 1)

- **D-08:** Verify on **one constituency, both entity types, both states, plus a same-session
  role-differential RPC check**. The app-level check is what criterion 1 asks for; the RPC check
  (M-4) is what makes the result *diagnostic* rather than anecdotal, localising the failure to the
  RLS boundary rather than the UI — without it, criterion 3's naming is not defensible. Use
  Pirkanmaa (`c_05`), whose 48 candidates is the smallest count, so a wrong number is visible at a
  glance. — **Reversibility:** reversible.

### Out of scope, with a record

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's own measured baseline
- `.planning/phases/145-default-seed-template-repair/145-DISCUSSION-POINTS.md` — **read first.**
  Measurements M-1 … M-14 and the full option set behind every decision above. Two roadmap claims and
  one todo claim are disproved there with evidence; planning against the roadmap's wording without
  reading this will reproduce a stale premise.

### The defect's mechanism
- `apps/supabase/migrations/` → policies `anon_select_candidates` / `anon_select_organizations` —
  the asymmetric predicates that are the root cause's proximate half (M-5). **Correct as written; do
  not modify.**
- `packages/dev-seed/src/supabaseAdminClient.ts:165-235` — the `PUBLISHABLE_TABLES` auto-default and
  the comment that overstates its coverage. D-03 part (2) edits the comment only.
- `apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts:70-73` — the
  `if (!nominations.length) return [entityType, undefined]` line that drops the whole `candidate`
  leaf, which is what makes an RLS-invisible entity type present as a *missing tab* rather than an
  empty list.
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:137-146` —
  `entityTabs` derives from `Object.keys(matches[electionId])`, i.e. the tab set is the nomination
  tree's key set. Confirms the symptom is upstream of the UI.

### What "correct" looks like
- `packages/dev-seed/src/templates/e2e/base.ts:1018-1225` — the known-good template. Sets
  `terms_of_use_accepted: '2025-01-01T00:00:00.000Z'` on its candidates and **deliberately omits it
  on `ca-aa-hidden` and `ca-aa-unregistered`**. Those two omissions are a live negative control that
  D-03's rejected option B would have destroyed — do not "fix" them.
- `packages/dev-seed/src/template/permittedKeys.ts:296` — `terms_of_use_accepted` already permitted
  (M-10); no guard change needed.

### The files being changed
- `packages/dev-seed/src/templates/defaults/candidates-override.ts:130-160` — the row producer.
- `packages/dev-seed/src/templates/default.ts` — the `fixed[]` rows and the `external_id` idiom.
- `packages/dev-seed/tests/integration/default-template.integration.test.ts:184-200` — the
  service-role integration test that D-04 extends with an anon client.
- `packages/dev-seed/tests/templates/default.test.ts` — the 27 pure-I/O tests D-04 adds to.

### Standing rules this phase inherits
- `.planning/REQUIREMENTS.md:7-13` — the milestone's standing acceptance rule (prove the guard fails
  before claiming it guards). D-06 is its discharge here.
- `.planning/ROADMAP.md` § Phase 145 — the four success criteria. Criterion 1's *(currently …)*
  parentheticals and TMPL-04's wording are corrected by D-01 / D-05.
- `.planning/todos/pending/2026-06-06-fix-broken-default-seed-template.md` — the originating todo;
  two of its three symptoms are disproved (M-2, M-12). Corrected by D-01 / D-05.
- Precedent for the record-correction pattern: `.planning/phases/143-*/143-CONTEXT.md` D-01 and
  `.planning/phases/144-*/144-DISCUSSION-POINTS.md` D-01.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`default-template.integration.test.ts`'s live-Supabase harness** — already wired into CI's
  `dev-seed-integration` job with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` exported and
  `DEV_SEED_INTEGRATION_REQUIRED=1` guarding against a silent skip. D-04's anon assertion rides this;
  it needs an anon key beside the service-role one, not a new job.
- **`e2e/base.ts`'s candidate rows** — the literal `'2025-01-01T00:00:00.000Z'` and the two
  deliberate omissions are both the model for the fix and a ready-made cross-template consistency
  assertion.
- **`145-DISCUSSION-POINTS.md` M-4's role-differential RPC probe** —
  `set local role anon; select entity_type, count(*) from get_nominations(…)` is a two-line,
  re-runnable diagnostic. It belongs in the evidence map, not just in this doc.

### Established Patterns
- **Ledger-first plan ordering** (Phase 144, 143) — the negative-control ledger's first half must be
  captured before the fix lands, so plan 01 writes zero product bytes. Overrides tracer-first per the
  milestone's standing acceptance rule.
- **Record correction as a task, not a footnote** (Phase 143 D-01, Phase 144 D-01) — when a roadmap
  premise is disproved, the correction lands *after* the gates, in its own plan, with the disproof
  cited.
- **`skipIf`-gated live-Supabase integration tests** — the pattern for anything needing a real DB in
  `packages/dev-seed/tests/integration/`.

### Integration Points
- `bulk_import` RPC ← `supabaseAdminClient.bulkImport()` ← `Writer.write()` ← `runPipeline()`. The
  `terms_of_use_accepted` value must survive the `stripped` projection in
  `supabaseAdminClient.ts:202-230` — it is a real column, so it passes `NON_COLUMN_FIELDS`, but the
  plan should assert that rather than assume it.
- `get_nominations` RPC → `supabaseDataProvider._getNominationData()` → `DataRoot` →
  `nominationAndQuestionState` → `matchState` → `entityTabs`. The whole chain was traced; the failure
  is at the first hop and everything downstream is correct.

</code_context>

<specifics>
## Specific Ideas

- The fix is **one column on one override**. Resist scope inflation: M-10 shows no type change, no
  guard change, and no schema change is needed. The *work* in this phase is the proof, the guard, and
  the record correction — not the edit.
- Use `e2e/base`'s exact literal `'2025-01-01T00:00:00.000Z'` rather than a computed timestamp, so the
  two templates diff cleanly and the value stays deterministic (the default template pins `seed: 42`
  for determinism; a `now()`-derived value would break that property).
- Pirkanmaa / `c_05` / constituency `4d9c87e5-7894-4f98-82d6-670e1b46f017` is the verification
  constituency (48 candidates, 8 orgs, 2 alliances) per D-08.

</specifics>

<deferred>
## Deferred Ideas

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

### Reviewed Todos (not folded)
- `.planning/todos/pending/2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md` — touches
  `packages/dev-seed` and the live DB, but is about test-suite teardown hygiene, not the default
  template's content. Out of scope for TMPL-03/04.

</deferred>

---

*Phase: 145-default-seed-template-repair*
*Context gathered: 2026-08-24*
