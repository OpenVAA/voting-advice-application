# Phase 158 — D10 Dispositions

**Written:** 2026-09-02
**HEAD:** `fdbb40d21` (the measurement it applies was taken at `5f122efd51dae8daa662a905eca5c77a56a33cc3`)
**Branch:** `integration/ship-12-squash`
**Produced by:** `158-10`, Task 3, after the operator answered Task 2's `blocking-human` checkpoint with
**`green`**.

This is the phase's single disposition record for the **D10 widening** (ROADMAP criteria 8-13 plus the
carried obligations OB-1…OB-6). It carries four things: B3(a)'s resolution of `158-01`'s flagged
assumption, the widening's full edge ledger with its arithmetic computed, the obligation status board, and
the three measurement findings from `158-10` Task 1 that four sibling plans are about to be dispatched
against.

**Companion artifact:** `158-ADMIN-BASELINE.md` — the measurement itself, and the operator's verbatim answer.

---

## 0. The reading rule this ledger uses (C6(a))

Decision **C6(a)** (`158-DISCUSSION-POINTS-ADDENDUM.md`) ruled that **the ROADMAP's Phase 158 success
criteria are authoritative for tracing**, because `REVIEW-RT-01..07` were never backfilled into
`REQUIREMENTS.md` and backfilling them mid-phase would fork the source of truth.

So throughout this ledger:

- a criterion is cited as `D10-C08` … `D10-C13`, meaning ROADMAP § Phase 158 § Success Criteria, item 8…13;
- a carried obligation is cited as `OB-1` … `OB-6`, meaning `158-CARRIED-OBLIGATIONS.md`;
- no row traces to a `REQ-` id, because none exists for this widening, and inventing one here would be the
  fork C6(a) declined.

---

## 1. B3(a) — `158-01`'s flagged assumption is resolved as accepted

Decision **B3(a)** (`158-DISCUSSION-POINTS-ADDENDUM.md` § B3) resolves `158-01`'s unresolved flagged
assumption as *"accepted — the plan's exhaustive zero-residue grep is the mitigation"*. That resolution is
recorded **here** and not in the plan that carries it.

- **Assumption id:** `EDGE-RT-03-unclassified`
- **Carried by:** `.planning/phases/158-routing-auth-surface-harmonisation/158-01-PLAN.md`,
  `flagged_assumptions[0]`
- **Probe string, transcribed:** `unclassified — review manually`
- **Requirement:** `REVIEW-RT-03` (criterion 3 — the routes locus move plus the import codemod)
- **Status in the owning plan:** `unresolved` — and it stays that way, byte for byte
- **Status here:** **RESOLVED — ACCEPTED**

**The reason, in the operator's own terms.** The deterministic edge probe could not classify a
**move-plus-codemod** into any of its known edge categories, and per the spec-less fallback it was
therefore *not* auto-resolved with a backstop marker. The residual risk such a change actually carries is
**census incompleteness** — a caller the move missed — and `158-01` already mitigates exactly that, with an
exhaustive zero-residue grep rather than with an edge-category criterion. An invented category would add a
criterion the probe itself could not find, and would not narrow the census risk by one file. Option (b) was
declined for that reason; option (c) was declined because it would cost a blocking round trip mid-run for a
question answerable at plan time.

**Why the resolution lives here.** `158-01-PLAN.md` is **byte-frozen** for this pass — decision B1(a) kept
the original nine plans, and `158-01` has already executed (`158-01-SUMMARY.md`, 2026-09-01). Editing a
frozen, already-executed plan to flip a status field would rewrite the record of what was planned. So the
two are joined by a reader rather than merged by an editor: the id above is the join key, the file above is
the other side of it.

**Not counted in the ledger below.** `EDGE-RT-03-unclassified` belongs to `158-01`'s **14-edge ledger for
criteria 1-7**, not to the D10 widening's. The two totals are separate and must not be added
(`158-10-PLAN.md` § "Edge-coverage arithmetic" says so explicitly). It is therefore deliberately absent from
§ 2.

---

## 2. The D10 edge ledger — criteria 8-13 and the carried obligations

One row per probe-surfaced edge. **Placement** is either the plan whose `must_haves.truths` authors it
(`authored`) or the plan whose `flagged_assumptions` block surfaces it unresolved (`flagged`). The
`anchor` column is the line in that plan's frontmatter at which the row was measured, so the census can be
re-run rather than trusted.

| Edge id | Category | Criterion | Placement | Owning plan | Anchor |
|---|---|---|---|---|---|
| EDGE-C09-adjacency | adjacency | D10-C09 | authored | `158-11` | `must_haves.truths` L28 |
| EDGE-C09-ordering-a | ordering | D10-C09 | authored | `158-11` | `must_haves.truths` L29 |
| EDGE-C09-encoding | encoding | D10-C09 | authored | `158-11` | `must_haves.truths` L30 |
| EDGE-C09-concurrency-a | concurrency | D10-C09 | authored | `158-11` | `must_haves.truths` L31 |
| EDGE-C09-ordering-b | ordering | D10-C09 | authored | `158-12` | `must_haves.truths` L46 |
| EDGE-C09-concurrency-b | concurrency | D10-C09 | authored | `158-12` | `must_haves.truths` L47 |
| EDGE-C13-boundary-a | boundary | D10-C13 | authored | `158-13` | `must_haves.truths` L32 |
| EDGE-C13-boundary-b | boundary | D10-C13 | authored | `158-13` | `must_haves.truths` L33 |
| EDGE-C13-adjacency | adjacency | D10-C13 | authored | `158-13` | `must_haves.truths` L35 |
| EDGE-C13-empty | empty | D10-C13 | authored | `158-13` | `must_haves.truths` L36 |
| EDGE-C13-precision | precision | D10-C13 | authored | `158-13` | `must_haves.truths` L37 |
| EDGE-C13-concurrency | concurrency | D10-C13 | authored | `158-13` | `must_haves.truths` L38 |
| EDGE-OB1-empty | empty | OB-1 | authored | `158-14` | `must_haves.truths` L25 |
| EDGE-OB1-concurrency | concurrency | OB-1 | authored | `158-14` | `must_haves.truths` L28 |
| EDGE-OB5-concurrency | concurrency | OB-5 | authored | `158-15` | `must_haves.truths` L33 |
| EDGE-C11-adjacency | adjacency | D10-C11 | authored | `158-16` | `must_haves.truths` L46 |
| EDGE-C11-idempotency | idempotency | D10-C11 | authored | `158-16` | `must_haves.truths` L48 |
| EDGE-C08-concurrency | concurrency | D10-C08 | authored | `158-16` | `must_haves.truths` L50 |
| EDGE-C12-empty | empty | D10-C12 | authored | `158-16` | `must_haves.truths` L51 |
| EDGE-C12-ordering | ordering | D10-C12 | authored | `158-17` | `must_haves.truths` L27 |
| EDGE-C12-concurrency-a | concurrency | D10-C12 | authored | `158-17` | `must_haves.truths` L28 |
| EDGE-C12-concurrency-b | concurrency | D10-C12 | authored | `158-17` | `must_haves.truths` L29 |
| EDGE-C08-unclassified | unclassified | D10-C08 | **flagged** | `158-10` | `flagged_assumptions[0]` |
| EDGE-C10-unclassified | unclassified | D10-C10 | **flagged** | `158-10` | `flagged_assumptions[1]` |
| EDGE-OB5-unclassified | unclassified | D10-C09 (declared) / OB-5 (subject) | **flagged** | `158-12` | `flagged_assumptions[0]` |
| EDGE-C11-unclassified | unclassified | D10-C11 | **flagged** | `158-16` | `flagged_assumptions[0]` |

### The four flagged rows are flagged, never backstopped

This is the distinction a reader must be able to make, so it is stated rather than implied. A **backstopped**
edge is one the probe could classify and the planner then covered with a `verification: backstop`
`must_haves` entry — those exist elsewhere in this phase (`158-10` itself carries two). A **flagged** edge is
one the probe returned `unclassified — review manually` for, and which the spec-less fallback explicitly
does **not** auto-resolve with a backstop marker. All four rows above are the second kind. Their dispositions:

| Flagged edge | Its residual risk | Its disposition at this HEAD |
|---|---|---|
| `EDGE-C08-unclassified` | not an input edge — measurement staleness; the only end-to-end observation predated HEAD by 23 commits, two of which touched the path | **RESOLVED by measurement.** `158-10` Task 1 re-measured at `5f122efd5`; `ARM: GREEN`. Still `unresolved` in the frozen plan text; resolved here. |
| `EDGE-C10-unclassified` | the vacuity of an absence check — a grep for a path that no longer exists reports a pass for the wrong reason | **RESOLVED by measurement with a positive control.** Five absence searches at 0, six control searches non-zero, same run. See `158-ADMIN-BASELINE.md` § criterion 10. |
| `EDGE-OB5-unclassified` | the exploit OB-5 describes may not exist; a fix authored against a non-reproducing defect | **OPEN — owned by `158-12`.** Its Task 1 measures the mechanism in isolation and Task 2 is a blocking checkpoint with three prepared arms. See § 4, OB-5. |
| `EDGE-C11-unclassified` | a first-ever E2E surface with no prior spec to pattern-match against | **OPEN — owned by `158-16`.** Note the owner: **`158-16`, not `158-15`** — see § 3.4. |

### The arithmetic, computed from the rows above

Counted from § 2's table, not asserted:

```
rows in the ledger table                    = 26
  of which placement == authored            = 22
  of which placement == flagged             =  4
                                              ──
26 == 22 + 4                                        ✓
```

Per owning plan, `authored` rows, summing to 22:

```
158-11: 4   158-12: 2   158-13: 6   158-14: 2   158-15: 1   158-16: 4   158-17: 3
        4 + 2 + 6 + 2 + 1 + 4 + 3 = 22                                  ✓
```

Per owning plan, `flagged` rows, summing to 4:

```
158-10: 2   158-12: 1   158-16: 1
        2 + 1 + 1 = 4                                                   ✓
```

Reproduce the authored side directly from the plans:

```
git grep -c '\[edge:' -- \
  .planning/phases/158-routing-auth-surface-harmonisation/158-1{1,2,3,4,5,6,7}-PLAN.md
```

### ⚠ This total is 26, and `158-10-PLAN.md` asserts 25

`158-10-PLAN.md` § "Edge-coverage arithmetic for the D10 widening" states *"25 probe-surfaced edges == 21
authored into `must_haves` across `158-10`…`158-16` + 4 surfaced as flagged assumptions"*. **The measured
census is 26 == 22 + 4.** The plan's own acceptance criterion requires the closing equation's two sides to
be *"computed from those rows rather than asserted"*, so the computed figure stands and the divergence is
recorded rather than reconciled by dropping a row. Two independent causes, both measured:

1. **The stated range `158-10`…`158-16` excludes `158-17`, which carries three D10 edges.** `158-17` is the
   criterion-12 plan (the admin job's own credential); its `must_haves` carry `EDGE-C12-ordering`,
   `EDGE-C12-concurrency-a` and `EDGE-C12-concurrency-b`. `D10-C12` is inside the widening — criteria 8-13 —
   and `158-16` already carries a fourth `D10-C12` edge, so honouring the plan's range would have **silently
   dropped three edges of a criterion the ledger already covers**. That is precisely the failure the
   no-silent-drop equality exists to catch, so the range was widened to `158-10`…`158-17` and the widening is
   declared here.
2. **Within the plan's own stated range the measured authored count is 19, not 21.** `4 + 2 + 6 + 2 + 1 + 4
   = 19`. The preamble's `21` is off by two against the frontmatter it describes. No edge is missing on
   account of it — the two figures happen to net out close because the excluded `158-17` contributes 3 — but
   they are separate errors and are recorded separately.

**Net:** `19 (in-range) + 3 (158-17) = 22 authored`, `+ 4 flagged = 26`. No probe-surfaced D10 edge is
unplaced.

---

## 3. Three measurement findings the sibling plans must carry

`158-11`, `158-12`, `158-13` and `158-14` are dispatched against this document. These three findings are in
none of the plans, none of the research and not in OB-6. They are recorded here because a plan that inherits
the old premise will author a spec that fails on a correct tree, or a spec that passes on a broken page.

### 3.1 The unauthenticated jobs endpoints return **401**, not 403 — the OB-6 correction

**OB-6's own wording is stale at this HEAD.** It instructs the admin wave's first task to measure
*"unauthenticated: the 307 and the 403."* **Write it as: the 307 and the 401.**

The reason: `apps/frontend/src/lib/server/admin/requireVerifiedAdmin.ts` returns **`401 Unauthorized` for a
MISSING session** and reserves **`403 Forbidden` for an AUTHENTICATED NON-ADMIN**. That is CR-01's
deliberate split, landed after `157.2`'s observation — which is why `157.2-09-SUMMARY.md`'s table, and OB-6
quoting it, both say 403. It is not a regression.

Measured (`158-ADMIN-BASELINE.md`, row 8, twice, both database states):
`GET /api/admin/jobs/active` and `GET /api/admin/jobs/past` without a session →
**`401`**, 24 bytes, `{"error":"Unauthorized"}`.

**Consequence for the criterion-11 spec (`158-16`): a spec asserting `403` on the unauthenticated arm WILL
FAIL ON A CORRECT TREE.** The unauthenticated arm is `307` (the page) + `401` (the endpoints).

**And the 403 arm needs an authenticated non-admin, which NO row of the baseline covers.** No row creates a
signed-in user without an admin role, so the `403 Forbidden` half of `requireVerifiedAdmin` is
**unexercised** by the measurement. `158-12` needs that arm; this baseline does not supply it, and a plan
that reads the absence of the row as the absence of the behaviour will be wrong in the other direction.

The same correction is applied to the ROADMAP's criterion-8 amendment sentence (§ Phase 158), which now
reads *"fails closed at 307 and **401**"* with the `requireVerifiedAdmin` reason attached. Criterion 8's own
body text still says 403 and was **deliberately left unedited** — the plan forbids changing criterion text —
so a reader who reaches it from the criterion rather than from the amendment is caught by the amendment
sentence one paragraph below.

### 3.2 `yarn db:reset` — this plan's own stated precondition — makes every admin page a 200 on the error boundary

Measured. After a bare `yarn db:reset` the database carries `seed.sql` only: **0 elections, 0 constituencies,
no app settings**. The root layout's DataProvider then returns empty (`A DataProvider returned an invalid
result. { reason: 'empty' }`, logged at ERROR on every request) and the **whole app renders its generic
error boundary** — `data-testid="error-message"`, *"Something went wrong, sorry!"* — **while still answering
HTTP 200**.

The voter root `GET /` did the same thing under the same state, which is what identifies this as a
**database-state artifact and not an admin-path defect**.

The authoritative measurement was therefore retaken under **`yarn db:reset-with-data`** (default template,
**752 rows**), and the arm is decided on that run. Both runs are recorded in `158-ADMIN-BASELINE.md` as
STATE A and STATE B; every status code matches between them.

**Consequence for any later spec author — `158-16` above all: a spec asserting only `expect(status).toBe(200)`
passes on a page showing "Something went wrong, sorry!".** The spec must assert **page content**, and its
fixture must seed data.

**And the instrument failure this caught is the general lesson, not an aside.** Under the bare state the
login-form-markup detector was itself **vacuous**: `GET /admin/login` returned 200 with **0 `<form>` tags and
0 `<input>` tags**, because the login page WAS the error boundary. Row 3's "0 hits for `id="email"`" proved
nothing, because its control was also 0. The detector only became load-bearing under the seeded state, where
the control returns 1 / 1 / 1. This is the concrete instance of this phase's standing prohibition — *a
guard, search or observation is not reported as clean until the same instrument has been shown to return
non-zero on a control it should catch.*

**Note the collision with decision D1(a):** the closing gate (`158-09`) is ruled to run the full E2E suite
after `yarn db:reset`, **not** `db:reset-with-data`. That is correct for the suite, whose specs seed their
own fixtures. It is **not** a state in which a manual admin page observation means anything. The two are not
in conflict; they are different instruments, and this note exists so `158-09` is not "corrected" toward
`db:reset-with-data` on the strength of this finding.

### 3.3 The authenticated admin SSR payload carries the full session in the clear

Measured on row 3 of the authoritative run. The rendered HTML embeds the SvelteKit data payload, and that
payload contains **`supabaseCookies` including the `sb-…-auth-token` cookie value**, plus a `session` object
carrying **`access_token`** and **`refresh_token`**. Detector: `data:{session:{access_token` → **1 hit** on
row 3, **0** on the login page (whose payload is `data:{session:null}`).

**No values were transcribed into any artifact, and none should be** (T-158-55).

This is recorded as **shape, not verdict.** Per `OB-1`'s own discharge clause an `sb-`-prefixed sentinel in
the payload is the *positive control* proving the forwarded cookie array is genuinely present — so its
presence is by design, and reading this row as a finding of a leak would be wrong.

**Consequence for `158-13`:** `158-13` is the plan that narrows both subtree session loads to a projection —
it is *the plan that makes this subtree session-free* — and **this is the shape it is changing**, measured
rather than assumed. `admin/+layout.server.ts` and `candidate/+layout.server.ts` each still return the whole
`Session`; criterion 13's durable half is the guard that stops a fourth load reintroducing the class.
`158-13`'s own `EDGE-C13-boundary-a` already anticipates the awkward part (the root server loader's
docstring contains the credential's field name in prose, so an unfiltered scan self-invalidates on day one).

### 3.4 An attribution correction that touches all four dispatched plans

`158-10-PLAN.md`'s `key_links` names **`158-15`** as *"the criterion-11 spec"*, and `158-ADMIN-BASELINE.md`'s
flags (1) and (2) inherited that wording. **It is stale.** Measured: `158-16-PLAN.md` carries
`requirements: [D10-C11 …]` and the `EDGE-C11-unclassified` flagged assumption; the ROADMAP's plan list
gives `158-16` as *"the first admin E2E coverage … one spec carrying the reload, the jobs call, the payload
observation and the job-write gate (criterion 11)"* and `158-15` as *"the fail-loudly response seam, the
job-identifier guard and the census (OB-5 deliverables 2-4)"*. The operator's answer to Task 2 says
`158-16` explicitly.

**Criterion 11's spec is owned by `158-16`.** Every "consequence for `158-15`" in `158-ADMIN-BASELINE.md`
reads as a consequence for `158-16`, except its flag (3), which genuinely addresses `158-13`.

---

## 4. The obligation status board

State at the time of writing — 2026-09-02, `fdbb40d21`, waves 1-4 complete and wave 5 dispatching.

| Obligation | Subject | Owning plan(s) this pass | State |
|---|---|---|---|
| OB-1 | two admin universal loads still serialised behind the root load; operator ruled option (a+) | `158-14` (apply a+ to both), with `158-13` adjacent on the payload shape | **OPEN — planned, not executed.** Wave 5. Not exercised by the baseline: `/admin/question-info` and `/admin/argument-condensation` were never requested; row 5 covers `/admin/jobs`, whose `+layout.svelte` takes no `+layout.ts` of its own. |
| OB-2 | `/api/auth/login` was deleted upstream; 158's A4 becomes a verification | `158-05` (the amended checkpoint), `158-08` (`158-API-LOGIN-CALLER-MEASUREMENT.md`), `158-10` Task 1 (the re-verification at this HEAD) | **DISCHARGED.** Five absence searches at 0 (`api/auth/login`, `UNIVERSAL_API_ROUTES.login`, the declaration form, `LoginParams`/`LoginResult`, any frontend fetch of an `/api/auth` path) with six positive controls non-zero in the same run. `find apps/frontend/src/routes/api/auth -type f` returns exactly one file — `logout/+server.ts`. |
| OB-3 | six `/api/admin/jobs/**` endpoints were relying on singleton contamination; fixed in 157.2 wave 3 | consumed by `158-10` (as a measurement precondition) and `158-16` (the spec that exercises them) | **DISCHARGED AS A PRECONDITION.** Its whole content for 158 was *"any 158 baseline measured before that fix is measuring the contamination"*. `158-10`'s baseline is at `5f122efd5`, well after it: authenticated 200/200, unauthenticated 401/401. Four of the six endpoints (`start`, `abort-all`, `single/[jobId]/abort`, `single/[jobId]/progress`) remain uncalled — a POST would have created state the teardown assertion is written to prove absent. `158-16` owns them. |
| OB-4 | `hooks.server.ts` anchors have drifted four times; line numbers are banned in this phase | `158-01` (the first rewrite), `158-11` (the admin gate) | **DISCHARGED** at `f7b85a18f`. Every plan, task and acceptance criterion in this phase anchors on the **expression**, never on a number. Binds `158-11`, which is about to edit that file again. |
| OB-5 | the swallowed-error class: a non-2xx becoming a domain value | `158-12` (deliverable 1 — the form-action role gates), `158-15` (deliverables 2-4 — the seam, the `jobId` guard, the census) | **OPEN, AND ITS PREMISE IS RETRACTED.** See the correction below — start from the retraction, not from OB-5's body. `EDGE-OB5-unclassified` is the ledger row; `158-12` Task 2 is a blocking checkpoint with three prepared arms. |
| OB-6 | criterion 8 is RE-MEASURED before it is planned | `158-10` (this plan) | **DISCHARGED — ARM: GREEN.** Re-measured at `5f122efd5`; the direct-entry/refresh bounce **does not reproduce**. Two corrections to OB-6's own text are recorded below. |

### OB-5 — start from the retraction

`158-CARRIED-OBLIGATIONS.md` carries a **⚠ CORRECTION** dated 2026-09-01, and the retraction was
re-confirmed on the record at **`b5c9bb68d`** (*"docs(158): retract the OB-5 exploit claim — it does not
reproduce at HEAD"*). **The exploit OB-5 describes does not exist.** `parseResponse` genuinely does not
check `response.ok`, but it is never reached with a non-2xx, because `universalAdapter.post`'s
`await this.fetch(...)` goes through `UniversalAdapter`'s own wrapper, which throws on `!response.ok` and
has carried a regression test since before this phase.

What survives, and what `158-12` and `158-15` are actually for:

- the two admin form actions have **no role check of their own** — depth, not an outage fix (criterion 9 /
  A2(a), `158-12`);
- a non-admin's rejection surfaces as `fail(500)` with an adapter-internal message rather than a 403 — a
  real, small defect;
- `parseResponse`'s **own** contract is still unguarded, so a future second caller would reopen the class —
  a standing pin, not a rewrite of the writer stack;
- the `jobId` guard before `PipelineController` (`condenseArguments` genuinely has none) and the regression
  evidence stand on their own merits.

**Only deliverable 2 lost its justification**, and the claim that this is *"ruling D8's fail-loudly class on
the read path"* is **withdrawn** — the read path already fails loudly.

### OB-6 — discharged GREEN, with its residual risk named

The operator selected **`green`** at `158-10`'s Task 2 checkpoint, against the eight-row table at
`5f122efd51dae8daa662a905eca5c77a56a33cc3`. Criterion 8 needs **no code change**. Its remaining debt becomes
a **durable regression spec**, carried forward by criterion 11's spec (**owned by `158-16`** — see § 3.4) so
the observation outlives the one-off curl.

**The residual risk the arm carries, recorded because the operator required it:** it rests on **one manual
observation per database state**, so an intermittent break — only under load, only on a cold Vite SSR module
— would not be visible. **The mitigation is criterion 11's spec running on every full suite.** That is not a
nice-to-have consequence of the green arm; it is the condition on which the green arm was taken.

**Two corrections to OB-6's own text**, both recorded at § 3.1 and in the ROADMAP:

1. *"unauthenticated: the 307 and the 403"* → **the 307 and the 401**, because `requireVerifiedAdmin` returns
   401 for a missing session and reserves 403 for an authenticated non-admin (CR-01's split).
2. OB-6's green arm says the regression spec is *"folded into the criterion 11 spec that A5(a) already
   requires"* — correct, and the plan that delivers it is **`158-16`**.

---

## 5. Cross-references, not duplicates

Two items belong to other artifacts and are named here rather than restated, so a reader can find them and a
later editor does not fork them.

- **C7(a) — the seven unbucketed triage comments.** Dispositioned by the records plan (`158-08`) in
  **`158-TRIAGE-DISPOSITIONS.md`**, which accounts for the full 27-comment Phase 158 bucket and settles the
  D-G5 enumeration contradiction on the record. Not restated here. (Standing note from the addendum:
  `questions/[questionId]/+page.svelte:1` collides with spikes 013–016 and must not be folded into 158
  without those findings in hand.)
- **C6(a) — the tracing rule.** Recorded at § 0 above as the reading rule this ledger uses; the decision
  itself lives in `158-DISCUSSION-POINTS-ADDENDUM.md` § C6.

---

## 6. What this ledger does NOT settle

Stated so a sibling plan does not read a placed edge as a discharged one.

- **A placed edge is not a delivered one.** Every `authored` row above is a `must_haves` truth in a plan that
  has **not yet executed**. The ledger proves no D10 edge was silently dropped at plan time; it proves
  nothing about the tree.
- **The two remaining OPEN flagged rows.** `EDGE-OB5-unclassified` and `EDGE-C11-unclassified` are still
  unresolved and are resolved by their owning plans' own checkpoints, not here.
- **`AdminAppFactorAnalysis`.** Registered in `ROUTE` with two live callers and **no directory**
  (`158-02`; `.planning/todos/pending/2026-09-01-admin-factor-analysis-route-missing.md`). It is carried in
  `KNOWN_UNBUILT_PROTECTED_ROUTES` alongside the dead `AdminAppJob`, and no row of the baseline touches it —
  row 5 exercises `/admin/jobs`, which exists.
- **The authenticated non-admin arm**, `/admin/question-info`, `/admin/argument-condensation`, concurrency
  and cold-module behaviour, and the four job endpoints other than `active` and `past` — all listed in
  `158-ADMIN-BASELINE.md` § "What this measurement does NOT cover", and all still uncovered.
- **`158-01`'s 14-edge ledger for criteria 1-7** is a separate census with a separate total. Do not add the
  two.

---

## 7. Gate closure — the two OPEN flagged rows, settled

**Written by:** `158-09` (the phase gate), at HEAD `c074bb04d`, after the full suite ran green.
**Why here and not in the owning plans:** § 6 states that the two rows *"are resolved by their
owning plans' own checkpoints, not here."* Both owning plans have now executed, and neither wrote
its resolution back into this ledger — `158-12` because the row sits outside its `files_modified`,
`158-16` because it never named the row at all. A ledger row whose owner has finished but whose
status still reads OPEN is a false premise waiting to propagate into Phase 159, so the gate closes
them. **§ 2's table and § 4's board are NOT edited** — the join is by id, as § 1 established for
`EDGE-RT-03-unclassified`.

| Flagged edge | Status in § 2 | Status at this HEAD | Evidence |
|---|---|---|---|
| `EDGE-OB5-unclassified` | OPEN — owned by `158-12` | **RESOLVED — the premise was retracted, and the arm was operator-selected** | `158-12` Task 1 measured the mechanism in isolation (`158-SWALLOWED-ERROR-MEASUREMENT.md`, `ARM: THROWN`, commit `f83108a7e`); Task 2's `blocking-human` checkpoint was answered **`ARM SELECTED: thrown-pin`** on the operator's stated principle *"Strive for maximum consistency."* Deliverables 2–4 landed in `158-15` (`6788813a2`, `d9455d105`, `fcc21f55f`), each with an observed negative control in ledger § F. The residual risk the row named — *"a fix authored against a non-reproducing defect"* — did not materialise: the exploit claim was **retracted on the record** at `b5c9bb68d` BEFORE the fix was authored, and what shipped is the surviving defect (the two admin actions' divergent failure shape) rather than the retracted one. |
| `EDGE-C11-unclassified` | OPEN — owned by `158-16` | **RESOLVED BY DELIVERY, and confirmed by a running spec** | The residual risk was *"a first-ever E2E surface with no prior spec to pattern-match against."* `tests/tests/specs/admin/admin-access.spec.ts` now exists, is wired as a Playwright project, and **ran in the gate's own full-suite run at position 125/153**, with its setup at 124 and its teardown at 126 — the exact positions `158-ADMIN-E2E-SCHEDULING.md`'s reading 2 predicted. Suite result: `153 passed`, 0 failed / 0 flaky / 0 skipped / 0 did-not-run. The surface is no longer unpatterned: it has a spec, a measured schedule, and a green run. |

**Consequence for OB-6's condition.** § 4 records that the green arm was taken *on the condition*
that criterion 11's spec runs on every full suite — *"not a nice-to-have consequence of the green
arm; it is the condition on which the green arm was taken."* **That condition is now met and
observed**, not merely wired: the spec executed inside `yarn test:e2e` with no project filter and
no `--no-deps`, in the default configuration the gate uses.

### What the count in § 2 is at this HEAD

Unchanged and re-verified: `grep -cE '^\| *EDGE-'` returns **26**, `26 == 22 authored + 4 flagged`.
All four flagged rows are now resolved — two by `158-10`'s measurement (§ 2's own table), two here.
**No probe-surfaced D10 edge is unplaced, and none is left open.**
