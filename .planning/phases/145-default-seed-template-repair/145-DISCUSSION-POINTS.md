# Phase 145 — Discussion Points

**Phase**: Default Seed Template Repair
**Requirements**: TMPL-03, TMPL-04
**Domain**: `packages/dev-seed` — make `yarn db:reset-with-data` produce a dataset the **voter app's
anon client** can actually read, and prove it with a guard that fails against today's template.

**How to use this doc**: every item lists its options with a checkbox next to each. One option per
item carries **★ RECOMMENDED**. **Leave everything unchecked to accept every recommendation.** Tick
a box only to *overrule* the recommendation for that item. Add free-text under any item if you want
something neither option covers.

---

## Measurements taken during this discussion

Everything below was measured in this working tree today at HEAD `e74ae377e`, against a live local
Supabase, with the app actually running. Nothing here is inferred from the todo or the roadmap.

| # | Measurement | Result |
|---|---|---|
| M-1 | Does `yarn db:reset-with-data` succeed? | **YES** — 752 rows in 9.06 s: 1 election, 1 constituency_group, 5 constituencies, 8 organizations, 327 candidates, 26 questions, 4 question_categories, 2 alliances, **377 nominations**, 1 app_settings, 327 portraits uploaded |
| M-2 | Todo symptom 1 — "0 parties in results" | **DOES NOT REPRODUCE.** The results page renders **“8 parties in constituency Pirkanmaa”** with all 8 party cards |
| M-3 | Todo symptom 2 — "candidates tab not shown" | **REPRODUCES.** Entity tabs render as **`Parties │ Alliances`** — no Candidates tab |
| M-4 | `get_nominations(election, constituency)` row counts, **by database role** | as `postgres`: `candidate 48 · organization 8 · alliance 2`. as **`anon`**: `organization 8 · alliance 2 · **candidate 0**` |
| M-5 | The two anon RLS predicates | `anon_select_candidates` = `published = true AND terms_of_use_accepted IS NOT NULL AND terms_of_use_accepted < now()` — **three clauses**. `anon_select_organizations` = `published = true` — **one clause** |
| M-6 | Candidate column state after the default seed | 328 rows · **327 `published = true`** · **0 with `terms_of_use_accepted`** · **0 anon-visible** |
| M-7 | Why `published` is set but `terms_of_use_accepted` is not | `supabaseAdminClient.ts:176-187` — a `PUBLISHABLE_TABLES` set auto-defaults `published = true` on 10 tables. Its own comment gives the rationale: *"gated by anon RLS (`USING (published = true)`)"*. `candidates` is in that set, but its anon predicate is **not** `USING (published = true)` — the auto-default satisfies **1 of 3** clauses and produces a false sense of coverage |
| M-8 | Does `e2e/base` (the template that renders correctly) set it? | **YES** — `terms_of_use_accepted: '2025-01-01T00:00:00.000Z'`, **32 occurrences**, and **deliberately omitted on exactly 2** (`ca-aa-hidden`, `ca-aa-unregistered`) as an in-repo negative control. `default.ts` + `defaults/*.ts`: **0 occurrences** |
| M-9 | Does setting that one column fix it? | **YES, measured both ways in one session.** `update candidates set terms_of_use_accepted=… where external_id like 'seed_%'` → RPC as anon returns `candidate 48`, and the page renders **“48 candidates in constituency Pirkanmaa”** with the **Candidates tab present**, portraits and party flags. Reverted → tab gone again |
| M-10 | Does the fix need any Phase-144 type or guard change? | **NO.** `packages/dev-seed` typechecks clean today (`tsc --noEmit` exit 0) and `terms_of_use_accepted` is already permitted at `permittedKeys.ts:296` |
| M-11 | Why did the existing tests not catch this? | `default.test.ts` — **27 tests, all pure I/O**, none asserting anon visibility. `default-template.integration.test.ts` — runs against live Supabase in CI's `dev-seed-integration` job, but authenticates with the **service-role key**, which **bypasses RLS**. Both are structurally blind to this defect |
| M-12 | Todo symptom 3 — "mixed naming of constants" | **NOT the constants.** Both files use UPPER_SNAKE throughout. The real divergence is the **`external_id` idiom**: `e2e/base` is kebab-case with a uniform `test-e2e-base-<typecode>-<discriminator>` scheme; `default.ts` uses snake_case with **6 unrelated idioms** — `election_default`, `cg_default`, `c_01`, `party_blue`, `cat_economy`, `appsettings_default`, `cand_0000` |
| M-13 | Do the hand-authored `fixed[]` rows get the `seed_` prefix? | **YES** — every table is 100 % `seed_`-prefixed. (`app_settings` is 0/1 because it routes through `updateAppSettings`/`merge_jsonb_column` into seed.sql's bootstrap row, not `bulk_import`.) No teardown gap |
| M-14 | Incidental, found en route | A **cold direct navigation to `/results`** with no prior session **crashes the dev server** with an uncaught `Cannot use cookies.set(...) after the response has been generated` at `apps/frontend/src/lib/supabase/server.ts:12`. Unrelated to the seed data; see D-07 |

**The one-sentence root cause:** the default template's candidates are written with
`published = true` by the `PUBLISHABLE_TABLES` auto-default but never receive
`terms_of_use_accepted`, and `anon_select_candidates` requires **both** — so the voter app's anon
client sees zero candidates, `get_nominations` returns zero candidate rows, the `candidate` leaf is
dropped from the nomination tree, and the Candidates tab never renders. Organizations render because
their anon predicate is the one-clause `published = true` that the auto-default does satisfy.

---

## D-01 — Symptom 1 is stale; the phase re-scopes and corrects the record

The roadmap's criterion 1 and requirement TMPL-03 both assert *"renders parties/organizations
(currently 0)"*. Per **M-2** that half is **already true today** — 8 parties render. The todo was
filed 2026-06-06 during v2.11 Phase 101; `49a23512e` (*"fix(119-02): reconcile default.ts docstrings
+ defensive hideIfMissingAnswers (UNBLK-03)"*, 2026-06-15) landed nine days later and, together with
the Phase-67 alliance/app-settings work, closed the parties half without the todo being updated.

This is the Phase-143 / Phase-144 shape for the third time: the roadmap's premise was overtaken by a
commit, and the remedy is to re-scope and correct the record rather than build to a stale premise.

- [x] **A ★ RECOMMENDED — Keep both criterion-1 clauses as *assertions*, re-scope only the
      *(currently …)* parentheticals.** The phase still has to prove parties **and** the candidates
      tab both render — that is the deliverable and it does not shrink. What changes is the recorded
      starting state: parties are recorded as **already passing at phase start** (with M-2 as the
      evidence), the candidates tab as **failing**. Both get a measured before/after in one session
      per the criterion's own wording. Correct ROADMAP criterion 1, `REQUIREMENTS.md:70` (TMPL-03),
      and the todo, citing `49a23512e` and this doc's M-2.
- [ ] **B — Drop the parties clause from criterion 1 entirely** since it already passes. Cheaper,
      but it deletes a live regression assertion for a symptom that regressed once already.
- [ ] **C — Treat the roadmap as authoritative and hunt for a parties defect anyway.** Would spend
      the phase looking for something M-2 shows is not there.

---

## D-02 — How the root cause is *named* (criterion 3)

Criterion 3 requires the cause be **named with evidence**, and offers three candidate namings:
*organizations/nominations not seeded*, *`app_settings.results.sections` missing an entity type*, or
*constant-naming drift*. **All three are disproved:** M-1 shows organizations and nominations are
seeded (8 / 377); the seeded `results.sections` is `['candidate','organization','alliance']` — the
candidate entry is present; M-12 shows the constants are not drifted.

- [x] **A ★ RECOMMENDED — Name it as the RLS-predicate asymmetry that the `PUBLISHABLE_TABLES`
      auto-default silently fails to cover** (M-4 → M-8), and record the three disproved namings
      alongside it so a future reader does not re-derive them. The evidence chain is four measured
      links: role-differential RPC output (M-4) → the two policy predicates (M-5) → the column state
      (M-6) → the auto-default's own stated-but-unmet rationale (M-7), closed by the both-ways
      toggle in M-9. Record explicitly that **this is a `dev-seed` defect, not a schema or RLS
      defect** — the policy is correct; the template does not satisfy it.
- [ ] **B — Name it as "the default template omits `terms_of_use_accepted`."** True but shallow: it
      does not explain why `published` *was* set, so the next table with a multi-clause anon
      predicate reopens the same hole.
- [ ] **C — Name it as an RLS bug and relax `anon_select_candidates`.** Would make unaccepted-terms
      candidates publicly visible — a privacy regression, and `e2e/base` depends on the current
      predicate for its two hidden-candidate specs (M-8).

---

## D-03 — Where the fix lands

Three layers could carry it. They are not equivalent: only one closes the class.

- [x] **A ★ RECOMMENDED — Set it in `candidatesOverride` (the row producer), *and* make the
      auto-default honest.** Two parts: (1) `defaults/candidates-override.ts` emits
      `terms_of_use_accepted` on every row it produces, matching `e2e/base`'s literal
      `'2025-01-01T00:00:00.000Z'` so the two templates read alike; (2) rename/annotate the
      `PUBLISHABLE_TABLES` block in `supabaseAdminClient.ts:176-187` so its comment stops claiming
      a coverage it does not have for `candidates`, and states the three-clause predicate explicitly.
      Part (2) writes **zero behavioural bytes** — it is the record correction that stops the next
      author trusting the auto-default.
- [ ] **B — Extend the auto-default to also stamp `terms_of_use_accepted` on `candidates`.** Fixes
      every template at once, but silently backdates terms acceptance for **all** seeds including
      `e2e/base`, whose `ca-aa-hidden` / `ca-aa-unregistered` rows depend on its absence (M-8). Would
      break those specs and destroy an existing negative control.
- [ ] **C — Set it only on `default.ts`'s `fixed[]` rows.** The 327 candidates come from
      `candidatesOverride`, not `fixed[]` — this would land on nothing.

---

## D-04 — The standing regression guard (criterion 2) — which client it authenticates as

This is the crux. Per **M-11** the reason a broken template survived ~11 weeks with a green suite is
that *every* existing check reads as `service_role` or reads nothing at all. A guard that repeats
that mistake would be green on day one and blind forever — precisely what this milestone's standing
acceptance rule exists to forbid.

- [x] **A ★ RECOMMENDED — Extend `default-template.integration.test.ts` with an assertion that
      calls `get_nominations` through an **anon** client and requires `candidate > 0` (and
      `organization > 0`).** It already runs against live Supabase in CI's dedicated
      `dev-seed-integration` job (M-11), so no new CI wiring is needed; it needs a second client
      built from the anon key beside the existing service-role one. This is the **only** option that
      exercises the actual failing path — the RLS predicate — and it fails today by construction.
      Pair it with a cheap pure-I/O assertion in `default.test.ts` that every emitted candidate row
      carries `terms_of_use_accepted`, so the fast suite catches a regression too.
- [ ] **B — Pure-I/O assertion in `default.test.ts` only.** Fast and dependency-free, but it asserts
      the *fix* rather than the *symptom* — it cannot catch a future fourth RLS clause, which is the
      class the phase is closing.
- [ ] **C — A Playwright E2E spec that seeds `default` and asserts the Candidates tab.** Closest to
      the user-visible symptom, but the E2E suite is pinned to `e2e/*` templates; seeding `default`
      mid-suite would contaminate the shared DB and put a cardinal-rule gate at risk for a check the
      integration job can make more cheaply.

---

## D-05 — What TMPL-04 actually reconciles

TMPL-04 says *"constant naming is reconciled with the `e2e/base` conventions."* Per **M-12** the
constants are not the divergent thing. The `external_id` idiom is.

- [x] **A ★ RECOMMENDED — Re-scope TMPL-04 to the `external_id` idiom, and make it internally
      consistent rather than identical to `e2e/base`.** `e2e/base`'s `test-e2e-base-` namespace is
      correct *for a test fixture* and would be wrong on the demo dataset. Adopt the *scheme*
      (`<typecode>-<discriminator>`, one idiom for all collections) while keeping demo-appropriate
      names, and document the deliberate divergence — criterion 4 explicitly allows documented
      divergence. Record that the *constants* were measured and found already consistent, so the
      requirement's original wording is corrected rather than silently reinterpreted.
      **Note:** `external_id` is a stable identifier that `db:seed:teardown` and the E2E fixtures
      key on — the renames must be proven not to strand rows (M-13 shows the `seed_` prefix is
      auto-applied, so the blast radius is the base names only).
- [ ] **B — Adopt `e2e/base`'s scheme verbatim, `test-e2e-base-` prefix included.** Makes the demo
      dataset look like a test fixture to the developer it exists to impress.
- [ ] **C — Leave the idiom alone and mark TMPL-04 satisfied by M-12.** Defensible on the letter of
      the requirement, but leaves the "hard to reason about" complaint the todo actually filed.

---

## D-06 — Negative-control shape (the milestone's standing acceptance rule)

The rule: prove the guard fails before claiming it guards — run it twice, once against the old state
to demonstrate blindness, once against the new one to demonstrate the catch.

- [x] **A ★ RECOMMENDED — Two measured pairs, both halves executed in-phase, recorded in a
      `145-NEGATIVE-CONTROL-LEDGER.md`.** Pair 1 (the guard catches the defect): the new anon
      assertion runs against the **pre-fix** `candidatesOverride` → RED; against the fixed one →
      GREEN. Pair 2 (the guard is not merely restating the fix): the anon assertion runs against a
      template whose candidates carry `terms_of_use_accepted` but are `published = false` → RED,
      proving it asserts *anon visibility* and not *one column's presence*. M-9 already supplies the
      manual both-ways observation for pair 1 at the app level; the ledger needs the automated ones.
- [ ] **B — Pair 1 only.** Meets the letter of the rule; leaves the guard indistinguishable from an
      assertion on the fix.
- [ ] **C — Cite M-9 as the negative control.** M-9 is a *manual DB toggle*, not a run of the guard.
      The rule requires the guard itself to be observed failing.

---

## D-07 — The `/results` cold-entry dev-server crash (M-14)

Navigating directly to `/results` with no prior session killed the dev server outright with an
uncaught rejection in `apps/frontend/src/lib/supabase/server.ts:12`. It is reproducible and it is a
first-run developer-experience defect — but it is a **frontend hooks/cookie-lifecycle** bug with no
connection to seed data, and criterion 3 forbids fixing symptoms by trial.

- [x] **A ★ RECOMMENDED — File as a standing todo with the M-14 reproduction, out of scope here.**
      Phase 145's boundary is `packages/dev-seed`. Absorbing an `apps/frontend` server-lifecycle fix
      would widen it past what the roadmap scoped and past what the plans can verify.
- [ ] **B — Fix it inside Phase 145** because it is on the same first-run path.
- [ ] **C — Ignore it.** It crashes the dev server; leaving no record wastes the observation.

---

## D-08 — Which surfaces criterion 1 is verified on

Criterion 1 requires "verified in the running app … confirmed absent against the pre-fix template in
the same session."

- [x] **A ★ RECOMMENDED — One constituency, both entity types, both states, plus a same-session
      role-differential RPC check.** The app-level check is what the criterion asks for (M-2/M-3/M-9
      already demonstrate the shape); the RPC check (M-4) is what makes the result *diagnostic*
      rather than anecdotal, because it localises the failure to the RLS boundary rather than to the
      UI. Verify on Pirkanmaa (`c_05`), which has the smallest candidate count — 48 — so a wrong
      count is visible at a glance.
- [ ] **B — All five constituencies.** Five times the work; the failure mode is not
      constituency-specific (M-4 is a role difference, not a scope difference).
- [ ] **C — App-level only.** Meets the criterion's letter and loses the evidence that makes
      criterion 3's naming defensible.

---

## Deferred ideas (captured, not acted on)

- **Cold `/results` navigation crashes the dev server** (M-14) — todo per D-07.
- **A repo-wide audit of multi-clause anon RLS predicates vs `PUBLISHABLE_TABLES`.** `candidates` is
  the one found here; whether any of the other 9 publishable tables has a predicate the auto-default
  under-satisfies was **not measured**. Worth its own small phase — it is the general form of this
  defect, and answering it here would widen Phase 145 past TMPL-03/04.
- **The `default.test.ts` blindness class** (M-11) — 27 green tests over a dataset the app cannot
  read. Related to this milestone's ASSERT family; no action inside 145 beyond D-04's additions.
