# Phase 158 — Discussion Points, Addendum & Amendment

**Phase:** 158 — Routing & Auth Surface Harmonisation
**Why an addendum:** 158 already has a filled `158-CONTEXT.md` (2026-08-28), `158-RESEARCH.md`,
`158-PATTERNS.md`, `158-VALIDATION.md` and **9 plans**. This document does **not** re-open the five
decisions already settled there (G1–G5) or the 33-fact baseline. It covers exactly two things:

1. **The D10 widening** — operator ruling D10 (2026-08-31) folded the admin-app outage into this phase
   after the existing context and plans were written.
2. **The standing open questions** — `158-CONTEXT.md` § *Open Questions and Uncovered Ground* left 8 items
   explicitly unsettled ("must be resolved during planning or research"). They are settleable now, and
   settling them here is cheaper than eight mid-execution checkpoints.

**Plus one amendment.** §0 corrects a claim in `158-CONTEXT.md` that has since gone stale. It is an
**amendment, not an addendum** — the stale text must be edited where it lives, because a planner reading
only `158-CONTEXT.md` would otherwise act on a wrong anchor for the third time in this phase's life.

**How to read / fill:**

- Every decision lists its options as checkboxes. **Exactly one option per decision is marked `★ RECOMMENDED`.**
- **Leaving every box in a decision unchecked = choosing the `★ RECOMMENDED` option.**
- **To overrule, tick a different option.** One box per decision.
- `**EDIT:**` / `**NOTE:**` free text beats every box.
- **⚠ DECIDE** marks shape-changing decisions — there are **5**: **A1, A5, B1, C1, C2**.

**Grounding** — every file re-read at HEAD `7a164a03a`, branch `integration/ship-12-squash`, 2026-08-31:

`apps/frontend/src/hooks.server.ts` · `apps/frontend/src/routes/admin/**` ·
`apps/frontend/src/routes/api/admin/jobs/**` (6 routes) · `apps/frontend/src/routes/api/auth/login/+server.ts` ·
`apps/frontend/src/lib/auth/getUserData.ts` · `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` ·
`apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` ·
`apps/frontend/src/lib/server/api/dataProvider.ts` · `tests/tests/specs/**` (42 spec files) ·
`.planning/phases/158-*/{158-CONTEXT.md,158-01-PLAN.md…158-09-PLAN.md}` ·
`.planning/v2.15-OPERATOR-DECISIONS-2026-08-31.md`.

---

## 0. Amendment — what has changed on the tree since 158-CONTEXT.md was written

| # | Fact | Evidence |
|---|---|---|
| 1 | **⚠ The `hooks.server.ts` anchors have drifted a THIRD time, and both the ROADMAP and `158-CONTEXT.md` are now wrong.** Measured now: `const { url, route } = event;` at **`:66`** · `pathname.includes('/candidate')` at **`:76`** · `route.id.includes('(protected)')` at **`:81`**. Both documents assert `:59` / `:69` / `:74`. **Cause: Phase 157 added the logger import and the `configureLogger` block above them.** `158-CONTEXT.md` § Open Questions ¶1 says "this context file is the authority on the numbers" — it is no longer | `hooks.server.ts:66,76,81` measured this session vs `158-CONTEXT.md` ¶1 and `ROADMAP.md` Phase 158 criterion 4 |
| 2 | The two hand-built redirect strings criterion 3 must sweep have moved with them: **`:79`** and **`:83`** (context says `:72`, `:76`) | `hooks.server.ts:79,83` |
| 3 | **Open question 3 is CONFIRMED.** `lib/server/api/dataProvider.ts:12` **is** the `default:` arm of the adapter `switch`, exactly as the context hypothesised; `lib/api/dataProvider.ts` is the one-line re-export | `lib/server/api/dataProvider.ts:8-14` |
| 4 | **The admin app is broken in THREE places, not the two D10 names.** (a) `admin/(protected)/+layout.ts:19` bounces to login; (b) all six `/api/admin/jobs/*` routes 403; **(c) the admin form actions return 500** — `getBasicUserData()` throws `'No active session'` before any role check is reached, so they fail earlier than "session check but no role check" describes | `admin/(protected)/+layout.ts:19,21-31` · `api/admin/jobs/active/+server.ts:17-18` (and its 5 siblings) · `admin/(protected)/argument-condensation/+page.server.ts:24-31` + `supabaseDataWriter.ts:149-150` |
| 5 | The single root cause is one branch: **only 2 of the 17 adapter `init()` sites pass `serverClient`**, both in the candidate protected layout. Every admin site falls into the plain-`createClient` branch that never reads forwarded cookies | `supabaseAdapter.ts:39-44` · the `serverClient:` grep returns only `candidate/(protected)/+layout.server.ts:29,71` |
| 6 | `admin/+layout.server.ts` **does** supply `session` from `locals.safeGetSession()`, so `getUserData`'s `parent` guard passes — the failure is downstream, in the adapter, not in the session check | `admin/+layout.server.ts:7-10` · `lib/auth/getUserData.ts:21-27` |
| 7 | **No `ssr = false` exists anywhere under `routes/admin/`** (the only two in the tree are under `candidate/preregister` and `candidate/register`), so the universal load runs on the server and SvelteKit does not re-run it client-side to recover | `grep 'export const ssr'` → 2 hits, both candidate |
| 8 | **`/api/auth/login` has zero callers.** The only two mentions in the tree are doc-comments in the candidate and admin login actions explaining why they deliberately do *not* use it | `candidate/login/+page.server.ts:4` · `admin/login/+page.server.ts:4` |
| 9 | Its oracle is exact: `apiFail(400)` for bad credentials at `:25`, `apiFail(403)` for **valid** credentials with the wrong role at `:42`. The 403 therefore confirms a working username/password pair to an unauthenticated caller | `api/auth/login/+server.ts:25,35-42` |
| 10 | **Zero E2E specs navigate to any `/admin` route.** 42 spec files; every "admin" match is Supabase *admin API* usage inside fixtures, never the admin app | `grep "/admin" tests/tests/specs` → no navigation hits |
| 11 | `158-01`'s flagged assumption **`EDGE-RT-03-unclassified` is benign**: the probe could not classify REVIEW-RT-03 into an edge category because it is a move-plus-codemod, and the plan already mitigates the real risk (census incompleteness) with an exhaustive zero-residue grep | `158-01-PLAN.md:25-33` |
| 12 | The 9 plans predate D10 by three days and **none of them touches `routes/admin/**`, `routes/api/admin/**` or `api/auth/login`** | `files_modified` across `158-01…09-PLAN.md` |

### 0.1 — Accept the amendment and the 12 facts?

- [ ] **(a) Accept; and `158-CONTEXT.md` ¶1 + the ROADMAP entry are edited to the measured numbers** —
      ★ RECOMMENDED — an addendum alone would leave the stale `:59`/`:69`/`:74` sitting in the document a
      planner actually reads. See C1 for what replaces them.
- [ ] **(b) Accept, but a fact is wrong or incomplete** — annotate it and I re-verify before planning.

---

## A. The D10 widening ⚠

### A1 ⚠ DECIDE — How does 158 restore admin auth?

Fact 5: one branch causes all three breakages. Phase 157.2 (ruling D11) is already scheduled to thread a
per-request, cookie-bearing client to every server-side site.

- [ ] **(a) Consume 157.2's per-request adapter; 158 adds only the admin-specific wiring, the gate, the role
      checks and the proof** — ★ RECOMMENDED — it is the split both rulings assume, it means 158 writes no
      adapter internals, and the restoration is then a consequence of a mechanism that is itself tested
      rather than a bespoke patch on six routes.
- [ ] **(b) Thread `locals.supabase` by hand at each admin site inside 158** — independent of 157.2, so 158
      cannot be blocked by it. Duplicates 157.2's work on the same lines one phase later, and leaves the
      `/api/admin/jobs/*` routes (which have `event` but call a `fetch`-only helper) needing a second pattern.
- [ ] **(c) Fix it in 157.2 entirely, including the gate and the E2E; 158 keeps its original 7 criteria** —
      closes the outage a phase sooner; moves auth-surface work into a phase about adapter lifetimes.

### A2 — Are the admin form actions in scope?

Fact 4(c): they are broken in a way D10's text does not describe — 500, not a missing role check.

- [ ] **(a) Yes — restore them AND add the role check D10 asks for** — ★ RECOMMENDED — they are the third
      face of the same root cause, and "session check but no role check" only becomes the true description
      once they work at all. Fixing the outage without the role check would ship a working action that any
      authenticated non-admin can invoke.
- [ ] **(b) Restore them; file the role check as a todo for Phase 162 (Permissions & Auth Model)** — keeps
      158 narrower and puts authorization with the authorization phase. Leaves a live privilege gap open
      across at least four phases.
- [ ] **(c) Out of scope; D10 named only the routes and the layout** — smallest reading of the ruling.

### A3 — What shape does the `/admin` gate take in `hooks.server.ts`?

Today `candidateAuthHandle` matches `/candidate` only (fact 1), and criterion 4 is already rewriting it to
`route.id`.

- [ ] **(a) Generalise the existing handle into one table-driven gate covering both `/candidate` and
      `/admin`, keyed on route id** — ★ RECOMMENDED — criterion 4 is rewriting this function anyway, the
      phase's whole thesis is "one place, and a test fails when a fourth appears", and two near-identical
      handles would be exactly the duplication the phase exists to remove.
- [ ] **(b) A parallel `adminAuthHandle` in the same `sequence`** — smaller diff, clearer blame per app;
      creates the second copy of a redirect policy the phase is consolidating.
- [ ] **(c) No hook gate; the `(protected)` layout loads keep owning it** — least change. Leaves
      authorization spread across loaders, and it is the shape that let the outage go unnoticed.

### A4 — `/api/auth/login`

Facts 8 and 9. Criterion 1 already says an unused generic `/api` login route is deleted rather than kept.

- [ ] **(a) Delete the route and its `LoginParams` / `LoginResult` types** — ★ RECOMMENDED — zero callers,
      and the 403-vs-400 split is a credential oracle reachable without authentication. Deleting is both the
      criterion's instruction and the security fix.
- [ ] **(b) Keep it, collapse it onto the shared helper, and flatten the oracle to a single 400** — preserves
      a documented API surface for future non-form clients; keeps an unauthenticated credential endpoint
      alive for a caller that does not exist.
- [ ] **(c) Keep as-is** — not defensible given fact 9.

### A5 ⚠ DECIDE — What does the first admin E2E coverage assert?

Fact 10: zero specs touch the admin app, which is why two green full-suite runs said nothing about a
total outage.

- [ ] **(a) One spec: log in as an admin, land on `admin/(protected)`, **reload the page**, and call one
      `/api/admin/jobs/*` route expecting non-403** — ★ RECOMMENDED — the reload is the half the universal-load
      defect breaks and a navigation-only spec would pass while the bug is live; the jobs call is the half
      the layout spec cannot see. One spec, both failure modes, and it fails today.
- [ ] **(b) (a) plus a negative: a non-admin authenticated user is refused** — also proves A2's role check
      rather than assuming it. One more fixture identity and one more seeded user.
- [ ] **(c) Layout + reload only; leave the API routes to unit tests** — cheapest; the six routes are the
      part with six copies of the same check.
- [ ] **(d) Defer admin E2E to a later phase** — leaves the restoration unproven by the only gate that
      would have caught the original.

**NOTE:** whichever wins, this needs an admin identity in the E2E dataset. Whether `e2e/base` already seeds
one is **unmeasured** and is a research-phase question, not a decision here.

---

## B. The nine existing plans ⚠

### B1 ⚠ DECIDE — What happens to the 9 plans written before D10?

Fact 12: none of them touches any admin path. Waves today: `1: 01,04,08` → `2: 02,05,07` → `3: 03` →
`4: 06` → `5: 09` (gate). `158-01` and `158-04` are `autonomous: false`.

- [ ] **(a) Keep all 9; add new plans for the D10 scope; amend only `158-09` (the gate) and the phase's
      must-haves** — ★ RECOMMENDED — the 9 plans are about the route/cookie/login loci and are untouched by
      the widening; re-planning them would discard correct work and re-run every checkpoint. Only the gate
      plan needs to learn about the new criteria.
- [ ] **(b) Re-plan the phase from scratch against the widened roadmap entry** — one coherent plan set with
      no seams; throws away 9 reviewed plans and their dependency graph, and re-opens the two
      `autonomous: false` checkpoints already reasoned about.
- [ ] **(c) Keep 9, and run the D10 scope as its own sub-phase (158.1)** — clean separation and independent
      gates; contradicts D10, which folded the work into 158 precisely because it is the same surface.

### B2 — Where do the new plans sit in the wave graph?

- [ ] **(a) A new wave after `158-06`, before the `158-09` gate, depending on 157.2** — ★ RECOMMENDED — the
      admin work consumes A1's mechanism and touches `hooks.server.ts`, which `158-01`/`158-02` rewrite; it
      must land after them or the two edits collide.
- [ ] **(b) In parallel with wave 1** — earliest possible outage fix; guarantees a conflict on
      `hooks.server.ts` with `158-01`.
- [ ] **(c) After the gate, as a follow-on** — the gate then measures a phase whose stated criteria are
      not all met.

### B3 — `158-01`'s flagged assumption `EDGE-RT-03-unclassified`

Fact 11: the probe failed to classify a move-plus-codemod, and the plan already mitigates the real risk.

- [ ] **(a) Resolve it as "accepted — the plan's exhaustive zero-residue grep is the mitigation", recorded in
      the plan** — ★ RECOMMENDED — the residual risk is census incompleteness and the plan addresses exactly
      that; no edge-category criterion would add anything.
- [ ] **(b) Add an explicit edge criterion for REVIEW-RT-03 before executing** — more rigorous; invents a
      category the probe itself could not find.
- [ ] **(c) Leave unresolved and let it raise a checkpoint at execution** — costs a blocking round trip
      mid-run for a question answerable now.

---

## C. Settling the standing open questions

These are `158-CONTEXT.md` § *Open Questions* items 1–8, which that document left explicitly unsettled.

### C1 ⚠ DECIDE — The `hooks.server.ts` anchors (open question 1)

Fact 1: three documents have now carried three different wrong triples for the same three lines, and the
latest drift was caused by an unrelated phase editing the file's imports.

- [ ] **(a) Correct both documents to `:66` / `:76` / `:81`, AND stop citing line numbers for this file —
      cite the expressions (`const { url, route } = event`, `pathname.includes('/candidate')`,
      `route.id.includes('(protected)')`) as the stable anchors** — ★ RECOMMENDED — the numbers have drifted
      three times in four days; the expressions have not changed once. `158-01-PLAN.md`'s own `must_haves`
      already describe the change behaviourally rather than positionally, which is the precedent.
- [ ] **(b) Correct the numbers only** — minimal edit; sets up a fourth drift the next time anything is
      added above line 66.
- [ ] **(c) Leave both documents; note the drift in this addendum** — leaves the wrong numbers in the file
      a planner reads first.

### C2 ⚠ DECIDE — D-G5's blocking classification (open question 2)

The context offers three readings of whether `admin/login/+page.server.ts:27` is a second blocking item.

- [ ] **(a) Reading (iii) — it is discharged upstream by Phase 157 criterion 6, and 158 records a
      cross-reference rather than filing a todo** — ★ RECOMMENDED — 157 shipped the adapter-boundary ESLint
      guard plus its `_guards/` lock-in self-test, which is verbatim what that comment asks for ("a source
      test for ensuring that no adapter-specifics find their way into routes, components or anywhere not
      especially allowed"). The ask is met; a todo would duplicate a delivered guard.
- [ ] **(b) Reading (ii) — the ★ prose is authoritative; the set is seven and 158 owns the second blocking
      item** — the safe fallback if (a)'s "already delivered" claim does not survive contact with the guard's
      actual allowlist.
- [ ] **(c) Reading (i) — the enumeration is authoritative; one blocking item, owned by Phase 159** —
      narrowest; ignores the ★ prose the operator's own document carries.

### C3 — Open question 3: the `dataProvider.ts:12` anchor

Fact 3 confirms the context's hypothesis: the real anchor is `lib/server/api/dataProvider.ts:12`.

- [ ] **(a) Confirmed anchor recorded; the todo is Phase 157's to file, not 158's, so 158 records a
      cross-reference only** — ★ RECOMMENDED — the comment sits in 157's triage bucket, and D-N2 says
      follow-ups are filed during the owning phase. 157 is closed, so this becomes a backlog entry naming
      the corrected anchor.
- [ ] **(b) 158 files the todo anyway, with the corrected anchor** — nothing is lost if 157's close missed
      it; puts a 157 item in 158's ledger.
- [ ] **(c) Drop it** — the comment ("reintroduce the local adapter") is a design question nobody has asked
      for; loses a recorded reviewer request.

### C4 — Open question 4: the `lib/utils/route/` directory split

Six modules and a barrel; D-G1 names two as moving.

- [ ] **(a) Move the whole directory, and record it as a deliberate widening of D-G1** — ★ RECOMMENDED — a
      split leaves the barrel straddling two loci, which is the opposite of the phase's thesis. It is what
      `158-01`'s `must_haves` already assume (one barrel exporting all six symbols).
- [ ] **(b) Move the two named modules and re-point the barrel** — stays inside the letter of D-G1; ships a
      routes locus that is not the routes locus.

### C5 — Open question 5: which cookie write sites the const map covers

`lib/supabase/server.ts` writes Supabase-chosen names through a name-agnostic bridge.

- [ ] **(a) The map covers only names the app itself chooses (the 4); the literal-detecting test must
      exclude the Supabase bridge, and the exclusion is stated in the test rather than implied** —
      ★ RECOMMENDED — the app cannot own a name it does not choose, and an unstated exclusion is how a guard
      quietly stops guarding.
- [ ] **(b) Include the Supabase names too** — "all cookies written by the app" read literally; requires
      naming values Supabase controls and may break on a library upgrade.

### C6 — Open question 6: `REVIEW-RT-01..07` have no `REQUIREMENTS.md` entries

- [ ] **(a) Accept the ROADMAP's seven (now eleven) success criteria as authoritative and record that in
      CONTEXT.md, so the verifier traces to criteria** — ★ RECOMMENDED — it is what every other phase in this
      milestone has effectively done, and backfilling IDs now would fork the source of truth mid-phase.
- [ ] **(b) Backfill REVIEW-RT-01..07 into `REQUIREMENTS.md` first** — restores the traceability chain; a
      documentation task in front of an already-planned phase, and the new D10 criteria would need IDs too.

### C7 — Open question 8: the unbucketed triage comments

Seven comments no criterion names (`hooks.server.ts:17`, `questions/+layout.ts:1`,
`questions/[questionId]/+page.svelte:1`, `(voters)/+layout.svelte:59`,
`api/candidate/preregister/+server.ts:16`, `api/oidc/callback/+server.ts:35`,
`candidate/preregister/+layout.server.ts:9`).

- [ ] **(a) The planner dispositions each one explicitly — fold / defer-with-a-todo / decline-with-a-reason —
      and records the disposition table in the phase** — ★ RECOMMENDED — it is what the context already asks
      for, and an explicit decline is a decision while silence is a leak.
- [ ] **(b) Fold the two that are cheap (`hooks.server.ts:17` rename, `oidc/callback:35` typing) and defer
      the rest** — pre-empts the planner on two items without having measured them.
- [ ] **(c) Defer all seven to the backlog** — keeps the phase tight; three of them sit in files this phase
      is rewriting anyway, so deferring means touching them twice.

**NOTE:** `questions/[questionId]/+page.svelte:1` explicitly collides with spikes 013–016 (View Transitions).
Whatever the disposition, it should not be folded into 158 without that spike's findings in hand.

---

## D. Gates

### D1 — The closing gate

- [ ] **(a) Full E2E (`yarn db:reset` first) + `build` + `lint` + `format` + `test:unit` + `svelte-check` +
      pgTAP, with the new admin spec included** — ★ RECOMMENDED — `158-09` already is the gate plan; it needs
      amending to cover the D10 criteria and to include `svelte-check`, which Phase 157 proved is not
      optional. DB prerequisite is `db:reset`, **not** `db:reset-with-data`.
- [ ] **(b) (a) plus a 3× determinism run** — this phase moves the route locus, rewrites the auth hook and
      adds the first admin spec; three runs would surface an intermittent the single run cannot. ~30 min.
- [ ] **(c) The existing `158-09` gate unchanged** — measures the pre-widening phase and would report green
      on a phase whose new criteria were never checked.

### D2 — Sequencing

- [ ] **(a) `157.1 → 157.2 → 158`, one phase per wave** — ★ RECOMMENDED — 158's A1 consumes 157.2's
      mechanism, and 157.1 changes what the parse helpers return at call sites 158 also edits.
- [ ] **(b) Start 158's non-admin waves (01, 04, 08) in parallel with 157.1/157.2** — recovers wall clock on
      three plans that touch neither adapter; splits the phase's gate across two timelines and risks
      conflicts in `hooks.server.ts`, which 157.1 also edits (the `configureLogger` line).
- [ ] **(c) 158 before 157.2** — the admin outage is live and this is the fastest route to closing it;
      forces A1(b)'s hand-threading, which 157.2 then rewrites.

---

## Fill status

| Section | Decisions | ⚠ DECIDE |
|---|---|---|
| 0. Amendment + baseline | 1 | 0 |
| A. The D10 widening | 5 | 2 (A1, A5) |
| B. The nine existing plans | 3 | 1 (B1) |
| C. Standing open questions | 7 | 2 (C1, C2) |
| D. Gates | 2 | 0 |
| **Total** | **18** | **5** |

**Not re-opened by this document:** decisions D-G1…D-G5, D-N1…D-N3, D-0.1, the 33-fact baseline, the
Claude's-Discretion list, and the 2026-08-29 provider-config drift-guard ruling — all remain as filled in
`158-CONTEXT.md`.

**An untouched document is a complete answer set** — every decision resolves to its `★ RECOMMENDED` option.
Hand it back as-is to accept all 18, or tick/annotate only what you want to overrule.
