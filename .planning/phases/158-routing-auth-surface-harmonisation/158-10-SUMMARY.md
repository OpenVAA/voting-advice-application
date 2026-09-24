---
phase: 158-routing-auth-surface-harmonisation
plan: 10
subsystem: auth
tags: [admin, sveltekit, supabase, ssr, universal-load, measurement, roadmap, planning-record]

# Dependency graph
requires:
  - phase: 157.2-per-request-adapter-instancing
    provides: per-request cookie-bearing Supabase client (the mechanism criterion 8 consumes), CR-01's requireVerifiedAdmin with its 401/403 split, and the deletion of /api/auth/login
  - phase: 158-routing-auth-surface-harmonisation
    provides: "158-06 — the candidate auth callback/logout move that changed the auth/logout control's hit count from 10 to 9"
provides:
  - "158-ADMIN-BASELINE.md — the eight-row admin observation table re-measured at this phase's own HEAD, in two database states, with its arm named and the operator's verbatim answer"
  - "ARM: GREEN — criterion 8's direct-entry/refresh bounce does not reproduce at 5f122efd5; it needs no code change"
  - "158-D10-DISPOSITIONS.md — B3(a)'s resolution of EDGE-RT-03-unclassified, the 26-row D10 edge ledger with computed arithmetic, and the OB-1..OB-6 status board"
  - "The OB-6 text correction: the unauthenticated jobs arm is 401, not 403 — 403 is reserved for an authenticated non-admin"
  - "A corrected ROADMAP criterion-8 amendment, so 158-09's closing gate traces criterion 8 against a true statement"
affects: [158-11, 158-12, 158-13, 158-14, 158-15, 158-16, 158-17, 158-09]

actuals:
  tokens: 13602
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Measure-then-branch: a blocking human checkpoint sits between the measurement and the disposition, and both arms are fixed in advance by the carried obligation"
    - "Every zero is paired with a positive control in the same run; a control that also returns zero invalidates the result rather than confirming it"
    - "Scoped single-sentence ROADMAP replacement, size-gated by git diff --numstat, never a whole-file write"

key-files:
  created:
    - .planning/phases/158-routing-auth-surface-harmonisation/158-ADMIN-BASELINE.md
    - .planning/phases/158-routing-auth-surface-harmonisation/158-D10-DISPOSITIONS.md
  modified:
    - .planning/ROADMAP.md

key-decisions:
  - "Operator selected the GREEN arm: criterion 8 needs no code change and becomes a durable regression spec carried by criterion 11's spec, owned by 158-16"
  - "OB-6's own wording 'the 307 and the 403' is corrected to 'the 307 and the 401' — requireVerifiedAdmin returns 401 for a missing session and reserves 403 for an authenticated non-admin (CR-01's split)"
  - "The authoritative measurement was retaken under yarn db:reset-with-data, because the plan's stated precondition (yarn db:reset) yields a database in which every page is a 200 on the error boundary"
  - "EDGE-RT-03-unclassified is resolved as accepted (B3(a)) in this artifact rather than in its owning plan, because 158-01-PLAN.md is byte-frozen and already executed"
  - "The D10 edge ledger's range was widened from the plan's stated 158-10..158-16 to 158-10..158-17, because 158-17 carries three D10-C12 edges the stated range would have silently dropped"
  - "The measured edge census is 26 == 22 authored + 4 flagged, not the 25 == 21 + 4 the plan's preamble asserted; the computed figure stands and the divergence is recorded"
  - "This plan's ROADMAP edit is a ruled exception authorised by OB-6; the prohibitions in 158-08 and 158-09 are not overridden and still bind those plans"

patterns-established:
  - "Instrument-vacuity disclosure: when a detector's control also returns zero, the run records the instrument failure rather than the apparent pass (STATE A's login-form detector)"
  - "Database-state provenance on every HTTP observation, so a status code can be read as evidence about the code path rather than about the seed"

requirements-completed: [D10-C08, D10-C10, REVIEW-RT-01]

coverage:
  - id: D1
    description: "The eight-row admin observation table re-measured at this phase's own HEAD, in two database states, with the arm named"
    requirement: D10-C08
    verification:
      - kind: manual_procedural
        ref: ".planning/phases/158-routing-auth-surface-harmonisation/158-ADMIN-BASELINE.md § STATE B — eight curl observations, each quoting a command and a status code"
        status: pass
    human_judgment: true
    rationale: "The arm is a human-read measurement over a live stack; the durable automated half is criterion 11's spec, owned by 158-16 and not yet written."
  - id: D2
    description: "The generic /api/auth/login route is verified absent and caller-free, by a search proved non-vacuous in the same run"
    requirement: D10-C10
    verification:
      - kind: other
        ref: "git grep -nF 'api/auth/login' -- apps packages tests (0 hits) with six positive controls against /api/auth/logout returning 1, 9, 1, 1, 99, 2"
        status: pass
    human_judgment: false
  - id: D3
    description: "The ROADMAP's criterion-8 amendment corrected against the measurement, scoped to one sentence"
    requirement: REVIEW-RT-01
    verification:
      - kind: other
        ref: "git diff --stat -- .planning/ROADMAP.md → 1 file, 1 insertion, 1 deletion; git diff -U0 | grep -cE '^[-+]### Phase ' → 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "158-D10-DISPOSITIONS.md — B3(a)'s resolution, the 26-row edge ledger with computed arithmetic, and the OB-1..OB-6 status board"
    verification:
      - kind: other
        ref: "grep -cE '^\\| *(EDGE-|C(0[89]|1[0-3])-)' 158-D10-DISPOSITIONS.md → 26; flagged rows → 4; authored rows → 22; grep -c 'EDGE-RT-03-unclassified' → 2"
        status: pass
    human_judgment: false

duration: 18min
completed: 2026-09-02
status: complete
---

# Phase 158 Plan 10: Measure the admin path, then dispose — Summary

**Criterion 8's direct-entry/refresh bounce was re-measured end to end at this phase's own HEAD and did not reproduce — `ARM: GREEN`, operator-confirmed — so the ROADMAP's stale "still owes the universal-load half" amendment was corrected in one sentence, and the phase's D10 dispositions now live in one 26-row ledger that also carries three measurement findings the four wave-5 plans would otherwise have inherited wrong.**

## Performance

- **Duration:** 18 min for Task 3 (this continuation agent, `10:39:23Z+03` → `10:57:07Z+03`). Task 1's elapsed time was not recorded by the prior executor; it included two full `db:reset` cycles and two dev-server bring-ups.
- **Tasks:** 3 (Task 1 auto, Task 2 `checkpoint:decision` `gate="blocking-human"`, Task 3 auto)
- **Files modified:** 3 (2 created, 1 edited by 2 lines)

## Accomplishments

- **Criterion 8 was re-measured, not assumed.** OB-6's whole point was that the only end-to-end observation predated HEAD by 23 commits, two of which touched the path. It was retaken at `5f122efd5` and lands GREEN.
- **The measurement caught three things nobody planned for**, all now carried into `158-D10-DISPOSITIONS.md` § 3 for the four wave-5 plans: the unauthenticated jobs arm is **401, not 403**; `yarn db:reset` alone produces a database in which **every admin page is a 200 on the error boundary**; and the authenticated admin SSR payload **carries the whole session in the clear** — the exact shape `158-13` is about to change.
- **Criterion 10's absence was proved by an instrument shown to find a route that is there** — five zeros, six non-zero controls, same run.
- **The ROADMAP now says about criterion 8 what the measurement says**, in one replaced sentence: 1 insertion, 1 deletion, no other phase entry touched.
- **B3(a) resolved without a byte of a frozen plan changing.**

## Task Commits

1. **Task 1: Re-measure the admin path at this HEAD, and verify the generic login route is absent** — `fdbb40d21` (docs) — created `158-ADMIN-BASELINE.md`
2. **Task 2: DECIDE — criterion 8's disposition, on the measured arm** — no commit (blocking human checkpoint; the answer is recorded in Task 3's commit)
3. **Task 3: Apply the arm, correct the ROADMAP, and write the D10 disposition ledger** — `2e5e65d84` (docs)

**Plan metadata:** see the final `docs(158-10)` commit.

## The measurement, verbatim

**HEAD:** `5f122efd51dae8daa662a905eca5c77a56a33cc3` · **Branch:** `integration/ship-12-squash` · **Measured:** 2026-09-02
**Database state:** **STATE B** — `yarn db:reset-with-data` (`seed.sql` + dev-seed `default`; 1 election, 5 constituencies, 26 questions, 377 nominations, **752 rows**). One fresh `yarn dev` on `FRONTEND_PORT=5173`, served-application identity asserted by the `/@fs` preflight before the run. `curl` never followed redirects; every status below is the **first** response.
**Identity:** a temporary `project_admin`, `scope_type` `project`, `scope_id` read at runtime from `packages/dev-seed/src/supabaseAdminClient.ts` — the narrowest role in `ADMIN_ROLES` that `_getBasicUserData` maps to `role: 'admin'` (T-158-51).

| # | Observation | Command | Observed |
|---|---|---|---|
| 1 | unauthenticated GET of the admin app root | `curl -s -i -o r -w '%{http_code}' 'http://localhost:5173/admin'` | **`307`**, `size_download=0`, `location: http://localhost:5173/admin/login?errorMessage=loginFailed` — fails closed |
| 2 | login through the admin login form action | `curl -s -X POST 'http://localhost:5173/admin/login' -H 'x-sveltekit-action: true' -H 'accept: application/json' --data-urlencode email=… --data-urlencode password=…` | **`200`**, 73 bytes, body `{"type":"redirect","status":303,"location":"http://localhost:5173/admin"}`; exactly one session cookie set, name `sb-127-auth-token` (value not recorded) |
| 3 | authenticated direct entry — a fresh GET of the admin app root, no prior client-side navigation | `curl -s -i -b jar -o r 'http://localhost:5173/admin'` | **`200`**, 224 117 bytes, **no `location` header at all** (the first response IS this 200), `node_ids: [0, 7, 8, 31]` |
| 4 | refresh — the same GET again | `curl -s -i -b jar -o r 'http://localhost:5173/admin'` | **`200`**, 224 117 bytes — **byte-identical to row 3**, no `location` header, `node_ids: [0, 7, 8, 31]` |
| 5 | refresh of a nested protected admin route | `curl -s -i -b jar -o r 'http://localhost:5173/admin/jobs'` | **`200`**, 224 138 bytes, no `location` header, `node_ids: [0, 7, 8, 10, 33]` |
| 6 | authenticated GET of the active-jobs endpoint | `curl -s -b jar 'http://localhost:5173/api/admin/jobs/active'` | **`200`**, 2 bytes, body `[]` |
| 7 | authenticated GET of the past-jobs endpoint | `curl -s -b jar 'http://localhost:5173/api/admin/jobs/past'` | **`200`**, 2 bytes, body `[]` |
| 8 | the same two endpoints unauthenticated | `curl -s 'http://localhost:5173/api/admin/jobs/{active,past}'` | **`401`** and **`401`**, 24 bytes each, body `{"error":"Unauthorized"}` — still fails closed. **NOT 403** |

**Row 3, read strictly.** First-response status **200**, `location` header **absent**, and the returned HTML **does not carry the admin login form's markup** — `<form>` 1, `id="email"` 0, `id="password"` 0, `autocomplete="current-password"` 0, `data-testid="error-message"` 0. That zero is a measurement and not a broken detector: the same three greps return **1 / 1 / 1** against `GET /admin/login` in the same run, and the `node_ids` sets differ (`[0, 7, 8, 31]` vs `[0, 7, 35]`), so row 3 is a different SvelteKit node stack, not the login page served at 200.

**ARM: GREEN.** Rows 3, 4 and 6 are all 2xx; row 1 and row 8 both still fail closed. Criterion 8's defect does not reproduce at `5f122efd5`.

**STATE A** — the plan's own stated precondition, `yarn db:reset` — was measured too and is recorded in the artifact: **every status matches STATE B**, and **every rendered admin page is the error boundary** at HTTP 200. See "Issues Encountered".

## The temporary identity's deletion, with the leftover counts asserted

Both temporary identities (one per state) were deleted through the auth admin API and the leftovers **counted, not assumed**. Counts are observed numbers returned by the service-role client. Pre-existing baseline before each creation: `auth_users_total` = **2**, `admin_jobs_total` = **0**.

| Assertion | STATE A identity `2fd7bb94-…3163a` | STATE B identity `1bf54fdb-…bad2` |
|---|--:|--:|
| `auth.users` rows with that id | **0** | **0** |
| `auth.users` rows with that email | **0** | **0** |
| `public.user_roles` rows for that user | **0** | **0** |
| `public.admin_jobs` rows authored by that email | **0** | **0** |
| `auth.users` total afterwards (baseline was 2) | **2** | **2** |
| error from any of the four counts | `null` | `null` |

**Post-teardown confirmation (STATE B):** replaying the deleted identity's session cookie against `GET /admin` returns **`307` → `/admin/login?errorMessage=loginFailed`**. The gate is live and the identity is genuinely gone. The driver script `.tmp-158-10-measure.mjs` was deleted; `git status --porcelain apps packages tests scripts` prints nothing.

## Criterion 10 / OB-2 — the searches and their positive controls

All searches use `git grep` (tracked files only, so the gitignored `tsconfig.tsbuildinfo` that produced the earlier false positive cannot match) and `-w` rather than `\b` (git's ERE engine does not honour `\b`).

| # | Absence search | Hits | Positive control, same run, same shape | Hits |
|--:|---|--:|---|--:|
| S1 | `git grep -nF "api/auth/login" -- apps packages tests` | **0** | `git grep -nF "api/auth/logout" …` | **1** |
| S1′ | — | — | `git grep -nF "auth/logout" …` (widened) | **9** |
| S2a | `git grep -nF "UNIVERSAL_API_ROUTES.login" …` | **0** | `git grep -nF "UNIVERSAL_API_ROUTES.logout" …` | **1** |
| S2b | ``git grep -nF 'login: `${API_ROOT}' …`` | **0** | ``git grep -nF 'logout: `${API_ROOT}' …`` | **1** |
| S3 | `git grep -nw -e LoginParams -e LoginResult …` | **0** | `git grep -nw DataApiActionResult …` | **99** |
| S4 | ``git grep -nE "fetch\(.*['\"`]/api/auth" -- apps/frontend/src`` | **0** | ``git grep -nE "fetch\(.*['\"`]/api" …`` | **2** |

**Every control is non-zero, so the five zeros are facts about the tree.** `find apps/frontend/src/routes/api/auth -type f` returns exactly one file: `logout/+server.ts`.

## The operator's arm selection, verbatim

Answered 2026-09-02 at Task 2's `blocking-human` checkpoint, against the eight-row STATE B table above, presented in full and not summarised, decided against **HEAD `5f122efd51dae8daa662a905eca5c77a56a33cc3`**.

> **Arm selection: `green`.** Criterion 8 needs no code change. It becomes a durable regression spec, carried forward by criterion 11's spec (owned by 158-16) so the observation outlives the one-off curl. Task 3 therefore APPLIES the green arm: the scoped ROADMAP correction (one sentence, ≤ 12 changed lines, Phase 158 only) to the amendment written 2026-09-01, so the closing gate traces criterion 8 against a true statement. Record the residual risk the arm carries: it rests on one manual observation per database state, so an intermittent break — only under load, only on a cold Vite SSR module — would not be visible; criterion 11's spec running on every full suite is the mitigation.

> **OB-6 text: CORRECT IT where Task 3 records OB-6's status.** OB-6's own wording, "unauthenticated: the 307 and the 403", is stale at this HEAD. Write it as **the 307 and the 401**, and add the reason: `requireVerifiedAdmin` returns `401 Unauthorized` for a MISSING session and reserves `403 Forbidden` for an AUTHENTICATED NON-ADMIN — CR-01's deliberate split, landed after 157.2's observation. Make this correction where the disposition ledger and the ROADMAP record OB-6's status, so a later reader is not led into writing a criterion-11 spec that asserts 403 on the unauthenticated arm and fails on a correct tree. Note explicitly that the 403 arm requires an authenticated non-admin, which NO row in the baseline covers.

Recorded verbatim in `158-ADMIN-BASELINE.md` § "The operator's arm selection" (which previously read *"Awaiting the checkpoint. Not yet answered."*) and here. **No row of the baseline creates an authenticated non-admin**, so the `403` half of `requireVerifiedAdmin` is unexercised — stated in both artifacts so `158-12` does not read the missing row as a missing behaviour.

## The ROADMAP edit — a ruled exception, stated plainly

**Editing `.planning/ROADMAP.md` is a DELIBERATE, ruled exception for `158-10` only.** Its authority is **OB-6**, which instructs the admin wave's first plan to *"correct the ROADMAP amendment as part of the same plan"* on the green arm. The kept plans **`158-08`** and **`158-09`** each carry a prohibition against editing the roadmap. **That prohibition is not overridden — it still binds `158-08` and `158-09`.** A carried obligation outranks a sibling plan's scope fence only for the plan the obligation names. This is written out so a reviewer reading `158-08` or `158-09` alongside this summary does not read the edit as a violation.

**What changed:** the closing sentence of the ROADMAP's 2026-09-01 "Scope widened again" paragraph in § Phase 158 — *"What criterion 8 still owes is the universal-load half — the direct-entry/refresh bounce under `routes/admin/` — not the 403."* — replaced by one sentence recording the re-measurement, `ARM: GREEN`, the citation to `158-ADMIN-BASELINE.md` and the sha, the 307/**401** correction with the `requireVerifiedAdmin` reason, and criterion 8's remaining debt as the durable regression spec `158-16` delivers.

**Diff stat, quoted:**

```
$ git diff --stat -- .planning/ROADMAP.md
 .planning/ROADMAP.md | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

$ git diff -U0 -- .planning/ROADMAP.md | grep -cE '^[-+]### Phase '
0
```

One file, **2 changed lines** (limit 12), **no phase heading in the diff**. Criterion 8's own body text still says 403 and was deliberately left unedited — the plan forbids changing criterion text — so the amendment sentence one paragraph below is what catches a reader who arrives from the criterion.

## The ledger arithmetic

Computed from `158-D10-DISPOSITIONS.md` § 2's rows, not asserted:

```
rows in the ledger table        = 26
  placement == authored         = 22   (158-11:4  158-12:2  158-13:6  158-14:2  158-15:1  158-16:4  158-17:3)
  placement == flagged          =  4   (158-10:2  158-12:1  158-16:1)
26 == 22 + 4                            ✓
```

**This is 26, and `158-10-PLAN.md`'s preamble asserts 25 == 21 + 4.** The plan's own acceptance criterion requires the equation to be *computed from those rows rather than asserted*, so the computed figure stands and the divergence is recorded with its two independent causes:

1. The preamble's range `158-10`…`158-16` **excludes `158-17`, which carries three `D10-C12` edges**. `D10-C12` is inside the widening and `158-16` already carries a fourth `D10-C12` edge, so honouring the stated range would have silently dropped three edges of a criterion the ledger already covers — precisely the failure the no-silent-drop equality exists to catch. The range was widened to `158-10`…`158-17` and the widening is declared in the artifact.
2. **Within the preamble's own range the measured authored count is 19, not 21** (`4+2+6+2+1+4`). The `21` is off by two against the frontmatter it describes.

Net: `19 + 3 = 22 authored`, `+ 4 flagged = 26`. No probe-surfaced D10 edge is unplaced. Reproduce the authored side with `git grep -c '\[edge:' -- .planning/phases/158-routing-auth-surface-harmonisation/158-1{1,2,3,4,5,6,7}-PLAN.md`.

**The four flagged rows** are `EDGE-C08-unclassified` and `EDGE-C10-unclassified` (`158-10`, both now **resolved by measurement**), `EDGE-OB5-unclassified` (`158-12`, **open**) and `EDGE-C11-unclassified` (`158-16`, **open**). They are flagged, never backstopped — the artifact states the difference so a reader can tell them from the entries this phase did backstop.

## Decisions Made

- **GREEN arm applied** (operator, verbatim above). Criterion 8 gains no code change; its debt becomes criterion 11's durable spec in `158-16`.
- **OB-6's "the 307 and the 403" corrected to "the 307 and the 401"**, with the `requireVerifiedAdmin` split as the reason, in both the ledger's OB-6 row and § 3.1 and in the ROADMAP sentence.
- **The authoritative measurement is STATE B (`db:reset-with-data`)**, not the plan's stated `db:reset` precondition. STATE A is retained in the artifact as evidence that the stated precondition is inadequate for this observation — not deleted, because deleting it would hide why the precondition needs rethinking.
- **The `158-09` gate is NOT to be "corrected" toward `db:reset-with-data`** on the strength of this finding. Decision D1(a) rules the closing suite runs after `yarn db:reset`, which is right for specs that seed their own fixtures. The two are different instruments; a note in the artifact says so.
- **B3(a)'s resolution lives in `158-D10-DISPOSITIONS.md`, not in `158-01-PLAN.md`**, which is byte-frozen and already executed. The assumption id is the join key.
- **The edge ledger range widened to include `158-17`** rather than honouring a stated range that would drop three placed edges.
- **Criterion 11's spec is owned by `158-16`, not `158-15`.** `158-10-PLAN.md`'s `key_links` and the baseline's flags (1) and (2) both name `158-15`; the ROADMAP plan list, `158-16-PLAN.md`'s own `requirements: [D10-C11 …]` and its `EDGE-C11-unclassified` assumption, and the operator's answer all say `158-16`. Recorded as a correction in both artifacts rather than silently rewritten, because the measured text is the record and only its addressee was wrong.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's stated `<precondition>` measures the wrong thing; the measurement was retaken under a seeded database**
- **Found during:** Task 1 (prior executor), consumed by Task 3
- **Issue:** The plan's `<precondition>` names `yarn db:reset`. Under that state the database carries `seed.sql` only — 0 elections, 0 constituencies, no app settings — the root DataProvider returns empty, and **every rendered page is the generic error boundary at HTTP 200**. Deciding the arm on that run would have been reading status codes off a page that never rendered.
- **Fix:** The measurement was taken **twice**. STATE A (`db:reset`) is recorded as evidence the precondition is inadequate; STATE B (`db:reset-with-data`, 752 rows) is the authoritative run and the arm is decided on it. That `GET /` on the voter side behaved identically under STATE A is what proves the cause is the seed, not the admin path.
- **Files modified:** `158-ADMIN-BASELINE.md`, `158-D10-DISPOSITIONS.md` § 3.2
- **Verification:** every status code matches between the two states; only the rendered content differs
- **Committed in:** `fdbb40d21` / `2e5e65d84`

**2. [Rule 2 - Missing Critical] Three measurement findings carried into the dispositions, because four plans are about to be dispatched against premises that are wrong at this HEAD**
- **Found during:** Task 3
- **Issue:** The 401-vs-403 split, the `db:reset` error-boundary artifact, and the session-in-the-SSR-payload shape appear in none of the plans, none of the research and not in OB-6. `158-11`…`158-14` (and `158-16`) would have inherited them wrong — most sharply, a criterion-11 spec asserting `403` on the unauthenticated arm **fails on a correct tree**, and a spec asserting only `toBe(200)` **passes on a broken page**.
- **Fix:** `158-D10-DISPOSITIONS.md` § 3 carries all three with their consequences named per plan, and § 3.1's correction is mirrored into the ROADMAP sentence.
- **Files modified:** `158-D10-DISPOSITIONS.md`, `.planning/ROADMAP.md`
- **Verification:** the OB-6 row of the status board and § 3.1 both read "307 and 401"; the ROADMAP sentence reads "307 and **401**" with the reason attached
- **Committed in:** `2e5e65d84`

**3. [Rule 1 - Bug] The plan's asserted edge arithmetic (25 == 21 + 4) does not match the frontmatter it describes**
- **Found during:** Task 3
- **Issue:** The plan's preamble asserts 25 edges across `158-10`…`158-16`. Measured: 19 authored in that range, plus 3 in `158-17` that the range would have silently dropped, plus 4 flagged = **26**.
- **Fix:** The ledger records the computed 26 == 22 + 4 and states both causes of the divergence, per the plan's own acceptance criterion that the equation be computed rather than asserted. The range was widened to `158-17` so no `D10-C12` edge is dropped.
- **Files modified:** `158-D10-DISPOSITIONS.md`
- **Verification:** `grep -cE '^\| *(EDGE-|C(0[89]|1[0-3])-)' → 26`; flagged rows `→ 4`; authored rows `→ 22`
- **Committed in:** `2e5e65d84`

**4. [Rule 1 - Bug] Criterion 11's spec owner is `158-16`, not `158-15`**
- **Found during:** Task 3
- **Issue:** `158-10-PLAN.md`'s `key_links` names `158-15` as "the criterion-11 spec", and `158-ADMIN-BASELINE.md` inherited the wording. `158-16-PLAN.md` carries `requirements: [D10-C11 …]` and `EDGE-C11-unclassified`; `158-15` owns OB-5 deliverables 2-4.
- **Fix:** Correction recorded in both artifacts, with the evidence, rather than the measured text being rewritten.
- **Files modified:** `158-ADMIN-BASELINE.md`, `158-D10-DISPOSITIONS.md` § 3.4
- **Committed in:** `2e5e65d84`

---

**Total deviations:** 4 auto-fixed (2 bugs in the plan's own stated facts, 1 database-state bug, 1 missing-critical carry-forward)
**Impact on plan:** No scope added. Every fix corrects a premise the plan asserted and the measurement contradicted; three of the four exist specifically to stop a wrong premise propagating into the four plans dispatching next.

## Issues Encountered

- **The login-form-markup detector was vacuous under STATE A.** `GET /admin/login` returned 200 with **0 `<form>` tags and 0 `<input>` tags**, because the login page was itself the error boundary — so row 3's "0 hits for `id="email"`" proved nothing, its control being 0 as well. This is the concrete instance of the phase's standing prohibition (*a search or observation is not reported as clean until the same instrument returns non-zero on a control it should catch*). Recorded rather than quietly fixed. Under STATE B the control returns 1 / 1 / 1 and the detector becomes load-bearing.
- **The `auth/logout` widened control dropped from 10 hits to 9** versus the earlier readings at `3c958cccc` and `dbb22feba`. Cause: `158-06` — `supabaseDataWriter.ts:69` now reads `ROUTE.CandAppAuthLogout` where it previously carried the path. The search reflecting `158-06`'s move, not a caller disappearing.
- **`/api/auth/logout` is consumed by the *universal* writer, not the *Supabase* writer.** `UniversalDataWriter.logout()` reads `UNIVERSAL_API_ROUTES.logout`; `SupabaseDataWriter._logout` now posts to `/api/candidate/auth/logout` since `158-06`. Both routes exist, both are live, neither is a duplicate of the other. `/api/auth/logout` and its map key **must be left alone by this phase**.

## Known Stubs

None. This plan creates no source symbols; both artifacts are complete records, and no placeholder text remains — `158-ADMIN-BASELINE.md`'s only stub ("Awaiting the checkpoint. Not yet answered.") was replaced by Task 3.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change. T-158-51 (the temporary privileged identity) and T-158-55 (credentials in a committed artifact) were both mitigated as planned: the identity was `project_admin` scoped to the local test project and is deleted with four zero leftover counts asserted; the artifacts record status codes, byte sizes, commands and cookie **names**, and no cookie or token **value**.

## User Setup Required

None.

## Next Phase Readiness

**Wave 5 can dispatch.** `158-11`, `158-12`, `158-13` and `158-14` should read `158-D10-DISPOSITIONS.md` § 3 before their first task — it is the only place the three corrected premises exist.

Carried forward:

- **`158-16`** owns criterion 11's spec. It must assert **307 + 401** on the unauthenticated arm (never 403), assert **page content** rather than `toBe(200)`, and **seed data in its fixture**. The GREEN arm was taken on the condition that this spec exists — it is the mitigation for the one-observation-per-state residual risk, not an optional follow-on.
- **`158-12`** needs the authenticated non-admin arm, which no row of this baseline supplies; and it must start from the **OB-5 retraction** (`b5c9bb68d`), not from OB-5's body.
- **`158-13`** is changing the shape § 3.3 measured: the admin SSR payload currently carries `supabaseCookies` with the `sb-…-auth-token` value plus `access_token` and `refresh_token`.
- **`158-09`** (the gate) now traces criterion 8 against a corrected ROADMAP sentence. Its `db:reset` precondition stays as D1(a) ruled it.
- Still uncovered by any measurement: the four job endpoints other than `active`/`past`, `/admin/question-info` and `/admin/argument-condensation` (the two OB-1 loads), `AdminAppFactorAnalysis` (still directory-less per `158-02`), and concurrency / cold-module behaviour.

---
*Phase: 158-routing-auth-surface-harmonisation*
*Completed: 2026-09-02*

## Self-Check: PASSED

Verified 2026-09-02 against disk and git, not against the plan text.

| Claim | Check | Result |
|---|---|---|
| `158-ADMIN-BASELINE.md` exists and is non-empty | `test -s` | FOUND |
| `158-D10-DISPOSITIONS.md` exists and is non-empty | `test -s` | FOUND |
| `158-10-SUMMARY.md` exists and is non-empty | `test -s` | FOUND |
| Task 1 commit | `git log --oneline --all \| grep fdbb40d21` | FOUND |
| Task 3 commit | `git log --oneline --all \| grep 2e5e65d84` | FOUND |
| Operator's answer verbatim in both artifacts | `grep -c 'Arm selection: `green`'` | 1 in baseline, 1 in summary |
| Decision sha recorded in both | `grep -c '5f122efd51dae8daa662a905eca5c77a56a33cc3'` | 2 in baseline, 2 in summary |
| OB-6 401 correction present in all three places | `grep -c 'the 307 and the 401'` | 1 baseline, 2 dispositions, 3 summary |
| Ledger rows | `grep -cE '^\| *(EDGE-\|C(0[89]\|1[0-3])-)'` | **26** (≥ 25) |
| Flagged rows | flagged-marked ledger rows | **4** (exactly) |
| Authored rows | authored-marked ledger rows | **22** |
| B3(a) recorded | `grep -c 'EDGE-RT-03-unclassified'` | **2** |
| ROADMAP scope | `git diff --stat` | 1 file, 1 insertion, 1 deletion (limit 12) |
| No sibling phase entry touched | `git diff -U0 \| grep -cE '^[-+]### Phase '` | **0** |
| No frozen plan modified | `git status --porcelain …/*-PLAN.md` | empty |
| No source file modified | `git status --porcelain apps packages tests scripts` | empty |
