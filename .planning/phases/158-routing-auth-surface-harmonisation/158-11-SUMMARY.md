---
phase: 158-routing-auth-surface-harmonisation
plan: 11
subsystem: auth
tags: [sveltekit, hooks, routing, session-gate, admin, vitest]

requires:
  - phase: 158-01
    provides: "the `$lib/routes` locus, `isCandidateRoute` / `isProtectedRoute`, and a request hook already keyed on `route.id`"
  - phase: 158-02
    provides: "`routeConsistency.test.ts` — the guard binding the protected-route pattern, the route tree and the hook, plus the negative-control ledger"
  - phase: 158-06
    provides: "the candidate auth endpoints under `/api/candidate/auth/*`, and the measured handler order `sequence(supabaseHandle, paraglideHandle, appGateHandle)`"
provides:
  - "`APP_GATES` — one frozen table declaring both gated applications as data, with `AppGate`, `GateRedirect` and `GateRedirectContext`"
  - "`isAdminRoute` — segment-exact Admin App membership, mirroring `isCandidateRoute`'s mechanism"
  - "`resolveAppGate` — first-matching-row lookup over the declared table"
  - "a request hook that gates the Admin App for the first time, from the same table that gates the Candidate App"
  - "check C5 in `routeConsistency.test.ts`: a gated application subtree with no gate row fails the unit suite, named"
  - "Section C of the negative-control ledger: three planted guard controls plus one live observation of the gate refusing"
affects: [158-12, 158-13, 158-16, admin-app, candidate-app, request-hook]

actuals:
  tokens: 27094
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "Per-application auth policy as ROWS OF A DECLARED TABLE, not as arms of a conditional in the handler"
    - "A redirect descriptor is a status + a route KEY + a parameters function — never a pre-built path string"
    - "A guard that binds the gate table to the route tree on disk, so a new application cannot ship ungated"

key-files:
  created:
    - apps/frontend/src/lib/routes/appGates.ts
    - apps/frontend/src/lib/routes/appGates.test.ts
  modified:
    - apps/frontend/src/hooks.server.ts
    - apps/frontend/src/lib/routes/index.ts
    - apps/frontend/src/lib/routes/routeConsistency.test.ts
    - .planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "The two applications' redirect shapes genuinely differ (candidate 303 + redirectTo; admin 307 + errorMessage) and the table carries the difference as data rather than normalising either — normalising would silently change what one login page renders."
  - "`candidateAuthHandle` renamed `appGateHandle`: a handler named for one application while gating two is exactly the drift this phase removes. The guard's identifier constant was updated in the same commit, because the guard locates the handler by declared identifier."
  - "`pathname.replace` survives in the handler as a VALUE extraction for the candidate `redirectTo`. Removing it would change the candidate arm's emitted query parameter, which Task 2's own criterion 2 forbids. No pathname MEMBERSHIP test survives."
  - "`safeRedirectTarget` was NOT added to the hook: measured, the hook has never called it — the validator runs at the two login ACTIONS that consume the value. Adding it would change the emitted parameter for exotic paths."
  - "On the unauthenticated arm the new hook row is defence in depth, not the sole gate: the admin protected layout still bounces identically. Recorded rather than overstated."

patterns-established:
  - "Gate table: per-app knowledge is a predicate plus two redirect descriptors; the handler is a loop with no application named in a conditional"
  - "Guard binds tree → table: an application subtree is derived mechanically (a top-level directory containing a `(protected)` group), so the public voter surface is an EXCLUSION with a stated reason rather than an omission"
  - "A gate is proven by observing it REFUSE in the running application, with a plant that flips the discriminating response, not by observing a green suite"

requirements-completed: [D10-C09, REVIEW-RT-04]

coverage:
  - id: D1
    description: "`APP_GATES`, `AppGate`, `isAdminRoute` and `resolveAppGate` declared in `$lib/routes/appGates.ts` and re-exported from the barrel; segment-exact admin membership, frozen table, declared order, both rows' redirect descriptors"
    requirement: "D10-C09"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/routes/appGates.test.ts (40 tests)"
        status: pass
      - kind: other
        ref: "yarn typecheck --force; yarn lint:check — both exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The request hook gates the Admin App for the first time, from the same table that gates the Candidate App; the session is fetched only after a row matches; no role check enters the hook"
    requirement: "D10-C09"
    verification:
      - kind: other
        ref: "grep -v \"^\\s*[*/]\" apps/frontend/src/hooks.server.ts | grep -cE \"pathname\\.(includes|endsWith)\" → 0 (control on a planted copy → 1)"
        status: pass
      - kind: other
        ref: "grep -v \"^\\s*[*/]\" apps/frontend/src/hooks.server.ts | grep -cE \"getUserData|user_roles|\\.role\" → 0 (control on a planted copy → 1)"
        status: pass
      - kind: manual_procedural
        ref: "158-NEGATIVE-CONTROL-LEDGER.md § Section C, control C4 — live curl run on a fresh dev server; unauthenticated /admin → 307, authenticated /admin/login → 303 flips to 200 with the row removed"
        status: pass
    human_judgment: true
    rationale: "The live observation is a one-off manual curl run, not a re-runnable assertion. The durable E2E half is criterion 11's spec, owned by 158-16; until it lands, a human should re-read the ledger rows against the running app."
  - id: D3
    description: "Check C5: a gated application subtree the route tree carries and the gate table has no row for fails the unit suite, naming the subtree; the admin row's error-message value is bound to the admin protected layout's own"
    requirement: "REVIEW-RT-04"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/routes/routeConsistency.test.ts (46 tests, was 40)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Three planted negative controls plus one live gate observation, recorded in Section C of the phase negative-control ledger with verbatim output"
    requirement: "D10-C09"
    verification:
      - kind: manual_procedural
        ref: ".planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md § Section C (controls C1–C4)"
        status: pass
    human_judgment: true
    rationale: "The controls are one-off planted observations; nothing in the suite re-runs them. A human confirms the recorded rows describe the guard that actually shipped."

duration: 25min
completed: 2026-09-02
status: complete
---

# Phase 158 Plan 11: Gate the Admin App from the request hook, through one declared table

**The Admin App is gated by the request hook for the first time — as the second ROW of a frozen `APP_GATES` table keyed on `route.id`, with the Candidate App's outcomes byte-for-byte unchanged, a guard that fails naming any application subtree without a row, and the gate observed refusing in the running application.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-09-02T08:05Z
- **Completed:** 2026-09-02T08:30Z
- **Tasks:** 3
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- **The Admin App now has a request-hook gate.** It had none: its only protection was the protected layout's own load. The gate is a row, not a second conditional.
- **Both applications' gates are one table.** `APP_GATES` is frozen, ordered, and holds per-app knowledge as data: a route-id predicate, a login route key, and two redirect descriptors carrying their own status codes.
- **The handler names neither application.** It resolves one row from `route.id`, returns early when none matches, fetches the session once, and applies that row's descriptors through `buildRoute`.
- **A new application subtree cannot ship ungated.** Check C5 derives "gated application subtree" mechanically from the route tree and fails, by name, when one has no row.
- **The gate was observed refusing, live** — and the observation was made discriminating by a plant that flips the response, rather than resting on a green suite.

## Task Commits

1. **Task 1: Declare the app-gate table and `isAdminRoute`** — `f91a6332e` (test, RED) → `a30e6bb65` (feat, GREEN)
2. **Task 2: Make the request hook loop over the table, and add the admin gate** — `c28d0d3d2` (feat)
3. **Task 3: Extend the consistency guard, and record the negative controls** — `30032a84a` (test)

## The gate table as landed

| Row | Predicate | Login route | Authenticated-on-login | Unauthenticated-in-`(protected)` |
|---|---|---|---|---|
| 0 — Candidate App | `isCandidateRoute` | `CandAppLogin` | **303** → `CandAppHome`, no params | **303** → `CandAppLogin`, params `{ redirectTo }` |
| 1 — Admin App | `isAdminRoute` | `AdminAppLogin` | **303** → `AdminAppHome`, no params | **307** → `AdminAppLogin`, params `{ errorMessage: 'loginFailed' }` |

`isAdminRoute` mirrors `isCandidateRoute` exactly:

```ts
// route.ts (158-01)                        // appGates.ts (this plan)
return routeId === CANDIDATE ||             return routeId === ADMIN ||
  routeId.startsWith(`${CANDIDATE}/`);        routeId.startsWith(`${ADMIN}/`);
```

**The admin row's error-message value, quoted from both files to show they match:**

```ts
// apps/frontend/src/routes/admin/(protected)/+layout.ts
return redirect(
  307,
  buildRoute({ route: 'AdminAppLogin', locale: lang, errorMessage: 'loginFailed' })
);
```

```ts
// apps/frontend/src/lib/routes/appGates.ts — ADMIN_GATE.whenUnauthenticatedInProtectedGroup
status: 307,
route: 'AdminAppLogin',
params: () => ({ errorMessage: 'loginFailed' })
```

That agreement is no longer prose: C5's third case reads `admin/(protected)/+layout.ts` off disk and asserts it contains `errorMessage: '<the row's value>'`, with `AdminAppLogin` asserted present in the same file as the non-vacuity half.

## Before and after, quoted

### The anchored API-root early return — UNCHANGED, byte for byte

Before (`f91a6332e^`) and after are the same two lines, preceded by the same comment:

```ts
// Skip non-route and API requests. The API test stays a `startsWith` on the pathname on purpose: it guards a served URL prefix rather than a route id, so it is correct as written and is not an instance of the defect fixed below.
if (route?.id == null || pathname.startsWith(NORMALIZED_API_ROOT)) {
  return resolve(event);
}
```

`git diff` over this plan's commits shows no `-`/`+` pair touching either line.

### Candidate redirect 1 — authenticated caller on the candidate login page

```ts
// BEFORE
if (session && routeId === ROUTE.CandAppLogin) {
  redirect(303, buildRoute({ route: 'CandAppHome', locale }));
}

// AFTER
if (session && routeId === ROUTE[gate.loginRoute]) {
  const { status, route: target, params } = gate.whenAuthenticatedOnLogin;
  redirect(status, buildRoute({ route: target, locale, ...params({ redirectTo: '' }) }));
}
```

For the candidate row `gate.loginRoute` is `'CandAppLogin'`, `status` is `303`, `target` is `'CandAppHome'` and `params()` is `{}`. **Status, target and parameters identical.** Measured live: authenticated `GET /candidate/login` → `303`, `location: http://localhost:5273/candidate`.

### Candidate redirect 2 — unauthenticated caller inside the candidate protected group

```ts
// BEFORE
if (!session && isProtectedRoute(routeId)) {
  const cleanPath = pathname.replace(new RegExp(`^/${locale}`), '');
  redirect(303, buildRoute({ route: 'CandAppLogin', locale, redirectTo: cleanPath.substring(1) }));
}

// AFTER
if (!session && isProtectedRoute(routeId)) {
  const { status, route: target, params } = gate.whenUnauthenticatedInProtectedGroup;
  const cleanPath = pathname.replace(new RegExp(`^/${locale}`), '');
  redirect(status, buildRoute({ route: target, locale, ...params({ redirectTo: cleanPath.substring(1) }) }));
}
```

For the candidate row `status` is `303`, `target` is `'CandAppLogin'` and `params({ redirectTo })` is `{ redirectTo }`. **Status, target and parameters identical, including the redirect target.** Measured live: unauthenticated `GET /candidate/profile` → `303`, `location: …/candidate/login?redirectTo=candidate%2Fprofile`.

### The ordering — the session is fetched AFTER the row lookup

```ts
const routeId = route.id;

const gate = resolveAppGate(routeId);
if (!gate) return resolve(event);

const { session } = await event.locals.safeGetSession();
```

A request that belongs to no gated application — every public voter page — returns at `if (!gate)` and performs **no session round trip at all**. Measured live: unauthenticated `GET /` → `200`, unaffected.

## The two comment-filtered greps, with their controls

| Check | Command | Result | Positive control (same command, planted copy) |
|---|---|--:|--:|
| No pathname substring/suffix search | `grep -v "^\s*[*/]" apps/frontend/src/hooks.server.ts \| grep -cE "pathname\.(includes\|endsWith)"` | **0** | **1** |
| No role read | `grep -v "^\s*[*/]" apps/frontend/src/hooks.server.ts \| grep -cE "getUserData\|user_roles\|\.role"` | **0** | **1** |

Both zeros are measurements: the same instrument returns 1 against a copy of the same file carrying `pathname.includes('/candidate')` and `userData.role === 'admin'`. Neither zero was reported before its control was seen non-zero.

Two more, from Task 1's acceptance criteria, likewise controlled:

| Check | Result | Positive control |
|---|--:|--:|
| `grep -v "^\s*[*/]" appGates.ts \| grep -cE "'/(admin\|candidate)"` — no pre-built path string | **0** | **2** (same grep on `route.ts`) |
| `grep -cE '^(let\|var) ' appGates.ts` — no module-level mutable binding | **0** | **2** (same grep on a two-line planted file) |

## The negative controls

Four rows appended as **Section C** of `158-NEGATIVE-CONTROL-LEDGER.md`, each with verbatim output for both halves. Sections A and B were not touched; the file's own completeness note already anticipates later sections, so no existing table was edited. `grep -cE '^\|'` over the ledger went **85 → 123**, an increase of **38** against the required 3.

| Control | Plant | Red | Green after removal |
|---|---|---|---|
| **C1** | `admin/(protected)/__probe__/+page.svelte`, no `ROUTE` entry | 48 tests, **1 failed** — C1 names `/admin/(protected)/__probe__` and the served `/admin/__probe__` | 46 tests, 46 passed |
| **C2** | the admin row deleted from `APP_GATES` | 45 tests, **2 failed** — C5 names `/admin` and lists `Rows declared today: Candidate App` | 46 tests, 46 passed |
| **C3** | `pathname.includes('/candidate')` reinstated in the handler body | 46 tests, **1 failed** — C4 names `pathname.includes(` and quotes the source line, under the handler's current identifier `appGateHandle` | 46 tests, 46 passed |
| **C4** | the admin row deleted in the RUNNING application | authenticated `/admin/login` **303 → 200** | row restored, **200 → 303** |

**Control C3 records both halves in one run**, which is the point of scoping C4 by shape rather than by file: in the same red run the sibling assertion *"the handler body was located and the scan reached real source"* stayed **GREEN**, and that assertion requires the extracted body to contain the anchored `pathname.startsWith(`. The banned substring construct was caught; the correct anchored prefix test a few lines above it was not.

**Control C4 is the row that matters, and its second half is recorded honestly.** The unauthenticated `307` does NOT by itself prove the new row is live — the admin protected layout has always issued the same 307 to the same target, so hook and layout are indistinguishable from outside on that arm. The discriminating observation is the **authenticated login-page bounce**, which the admin login page cannot produce on its own (it sits outside the `(protected)` group and its `+page.server.ts` exports `actions` and no `load`). With the row removed it is `200`; with the row restored it is `303 → /admin`. On the unauthenticated arm the hook row is **defence in depth, not the sole gate** — it refuses one layer earlier, before the root layout load and before the layout's `getUserData` round trip.

## The live measurement

One fresh dev server on `FRONTEND_PORT=5273` (the pre-existing server on `:5173` was neither stopped nor trusted); served-application identity asserted by the two preflight curls before any observation; database already carrying `seed.sql` + dev-seed `default` (**1 election, 5 constituencies, 2 auth users**, counted); identity `admin@openvaa.test`, the `project_admin` `seed.sql` creates, logged in through the real form action. Nothing was created, so nothing needed tearing down. `curl` never followed redirects.

| # | Observation | Observed |
|---|---|---|
| 1 | unauthenticated `GET /admin` | **307**, size 0, `location: …/admin/login?errorMessage=loginFailed` |
| 2 | unauthenticated `GET /admin/jobs` | **307**, same target |
| 3 | unauthenticated `GET /admin/question-info` | **307**, same target — **not covered by the 158-10 baseline** |
| 4 | unauthenticated `GET /admin/argument-condensation` | **307**, same target — **not covered by the 158-10 baseline** |
| 5 | unauthenticated `GET /admin/login` | **200** — the gate does not over-block |
| 6 | unauthenticated `GET /api/admin/jobs/{active,past}` | **401**, `{"error":"Unauthorized"}` — **401, not 403**, confirming 158-10's OB-6 correction independently |
| 7 | unauthenticated `GET /candidate/profile` | **303** → `…/candidate/login?redirectTo=candidate%2Fprofile` |
| 8 | unauthenticated `GET /` | **200**, unaffected |
| 9 | authenticated `GET /admin` (direct entry, then refresh) | **200** / **200**, byte-identical, no `location` |
| 10 | authenticated `GET /admin/jobs` | **200** |
| 11 | authenticated `GET /admin/login` | **303** → `/admin` — the hook-only proof |
| 12 | authenticated `GET /api/admin/jobs/{active,past}` | **200** `[]` / **200** `[]` |

Rows 1, 9, 10 and 12 reproduce `158-ADMIN-BASELINE.md`'s STATE B exactly: **criterion 8's GREEN arm still holds after the hook rewrite.** Rows 3 and 4 are new coverage the baseline explicitly did not have.

**A 200 is not evidence on its own** — `158-ADMIN-BASELINE.md` recorded a database state where every admin page answered 200 while rendering the error boundary. Counted on the authenticated `/admin` body against the `/admin/login` body in the same run:

| Detector | authenticated `/admin` | `/admin/login` |
|---|--:|--:|
| `id="email"` | **0** | **1** |
| `id="password"` | **0** | **1** |
| `autocomplete="current-password"` | **0** | **1** |
| `data-testid="error-message"` | **0** | 0 |

The three zeros are measurements, not a broken detector.

## Re-derived counts, against the tree as it stands

| Figure | Planning document | Re-measured here | Why they differ |
|---|--:|--:|---|
| `routeConsistency.test.ts` cases | 40 (158-02, ledger § A) | **46** | +6: one non-vacuity case joining the existing block, three C5 subtree/row cases (two generated from `APP_GATES`, two from the tree) and the layout-agreement case |
| `src/lib/routes` suite | 57 at this plan's start | **103** | +40 `appGates.test.ts`, +6 C5 |
| Frontend unit suite | 1396 (158-03, ledger § B) | **1443** | 158-04…158-11's tests; 77 files |
| Ledger `^\|` lines | 85 at this plan's start | **123** | Section C |
| Unauthenticated jobs endpoints | 403 (157.2-09, OB-6 text) | **401** | `requireVerifiedAdmin` returns 401 for a MISSING session, 403 for an authenticated NON-ADMIN — CR-01's split, already corrected by 158-10 and confirmed again here |

## Files Created/Modified

- `apps/frontend/src/lib/routes/appGates.ts` — **created.** `APP_GATES`, `AppGate`, `GateRedirect`, `GateRedirectContext`, `isAdminRoute`, `resolveAppGate`.
- `apps/frontend/src/lib/routes/appGates.test.ts` — **created.** 40 cases: segment-exact admin membership with four sibling-prefix cases, predicate disjointness over the whole `ROUTE` map, declared order asserted by row identity, freeze asserted including that a write throws, and both rows' descriptors asserted as values.
- `apps/frontend/src/hooks.server.ts` — **modified.** `candidateAuthHandle` → `appGateHandle`; the single application arm replaced by a table lookup; the admin gate added.
- `apps/frontend/src/lib/routes/index.ts` — **modified.** One barrel line.
- `apps/frontend/src/lib/routes/routeConsistency.test.ts` — **modified.** Check C5 added; the handler identifier constant and the wording that names it updated for the rename; the C4 remediation sentence repointed from `isCandidateRoute` to `resolveAppGate`.
- `.planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md` — **modified, append only.** Section C.

## Decisions Made

1. **The rows' asymmetry is data, not a branch.** The candidate bounce is 303 + `redirectTo`; the admin bounce is 307 + `errorMessage`. Both predate this table. Normalising either would silently change what one of the two login pages renders, which no criterion asked for, so the status code lives in the row.
2. **The admin row also carries an authenticated-on-login bounce.** This is NEW behaviour: before this plan an authenticated admin visiting `/admin/login` got the login page at 200; now they get 303 → `/admin`. It mirrors the candidate app's long-standing shape and is what makes the row symmetric with its sibling. **Named risk:** if the admin protected layout's `handleError` logout ever fails for an authenticated non-admin, `/admin/login` ↔ `/admin` can ping-pong until the browser's redirect cap. The candidate app has carried the identical shape for as long as the hook has existed, and `158-12` adds the role gates that shorten that path.
3. **`isAdminRoute` lives in `appGates.ts`, not beside `isCandidateRoute` in `route.ts`.** The plan's artifact table places it there; the barrel re-exports both from one place, so no consumer can tell. The mechanism — not the location — is what was mirrored.
4. **The hook stayed a session gate.** No `getUserData`, no role read, no database call. The role decision stays in the admin protected layout and, from `158-12`, in the two admin form actions.

## Deviations from Plan

### Auto-fixed / deliberate

**1. [Rule 2 — Missing critical] Renamed `candidateAuthHandle` → `appGateHandle`, touching a file outside Task 2's declared `<files>`**

- **Found during:** Task 2.
- **Issue:** After the rewrite the handler gates two applications while being named for one. That is the same class of defect the phase exists to remove — a name and a behaviour that have drifted apart — and `158-12` … `158-17` will read that name.
- **Fix:** Renamed the handler and the `sequence(...)` member. `routeConsistency.test.ts` locates the handler **by its declared identifier**, so leaving its constant at `candidateAuthHandle` would have made C4's extraction return an empty body; invariant 3 would have failed it loudly, but the suite would have been red between Task 2 and Task 3. The constant and the three strings naming it were therefore updated **in the same commit**, which is why Task 2 touches `routeConsistency.test.ts` although its `<files>` lists only `hooks.server.ts`.
- **Verification:** `git grep -nw candidateAuthHandle -- apps` returns nothing; C4's failure message under control C3 names `appGateHandle`.
- **Committed in:** `c28d0d3d2`.

**2. [Rule 2 — Missing critical] The C4 remediation sentence named a function the hook no longer imports**

- **Found during:** Task 3, while capturing control C3's verbatim output.
- **Issue:** C4's failure text told a future author to "decide membership … through `isCandidateRoute` and `isProtectedRoute`". The hook no longer imports `isCandidateRoute`; membership now goes through `resolveAppGate`. Remediation guidance that points at the wrong symbol is worse than none.
- **Fix:** Repointed to `resolveAppGate and isProtectedRoute`. Control C3 was then **re-planted and re-observed** so the ledger quotes the shipped message rather than the superseded one.
- **Committed in:** `30032a84a`.

### Two places where the plan's prose conflicted with its own criteria; behaviour preservation won

**3. `pathname.replace` survives in the handler.** Task 2's action says *"the anchored API-root test is the only pathname read that survives"*. Its criterion 2 says the candidate arm's outcomes must not change *"including the validated redirect target"*. The `redirectTo` value is derived from the pathname, and a route id has placeholders where that needs resolved values, so the two cannot both be honoured. The `cleanPath` computation was kept verbatim. It is a **value extraction, not a membership search**: the plan's own automated verify greps for `includes|endsWith` and returns 0, and the guard's C4 bans exactly those two. Recorded rather than resolved silently.

**4. `safeRedirectTarget` was not added to the hook.** Task 2's `read_first` calls it *"the redirect-target validator the candidate arm must still call before issuing its bounce"*. **Measured: the hook has never called it.** `loginRedirectTarget.ts`'s own docstring states the arrangement — `hooks.server.ts` is the single legitimate PRODUCER of `?redirectTo=`, and both login **actions** validate on the way back, which is the consumption site that matters. Adding validation in the hook would drop the parameter for any served path the regex rejects, changing the candidate arm's emitted query parameter — which criterion 2 forbids. Not added.

---

**Total deviations:** 2 auto-fixed (both Rule 2), 2 recorded interpretations of conflicting plan prose.
**Impact on plan:** No scope creep. One extra file touched in Task 2 (the guard's identifier constant), forced by the rename it accompanies.

## Issues Encountered

- **A `vitest` `it.each` union type-error** on the mixed `as const` tuple spread in `appGates.test.ts`, caught by `yarn typecheck --force`. Fixed by declaring the case list as `Array<[string, string]>`. Found only because the check was run with `--force`; the cached run would have replayed a stale pass, which is the instrument trap `158-08` recorded.
- **The `src/lib/routes` suite total was mis-stated once in the ledger** as 97 (the figure measured *before* C5 was added) and corrected to **103** before the commit. Both numbers were real runs; only one describes the shipped tree.
- **Port `:5173` was already held by a pre-existing dev server.** Not stopped and not trusted — a one-off `FRONTEND_PORT=5273` server was started for the measurement and shut down afterwards. `:5173` was left exactly as found.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change was introduced; the plan's register (`T-158-56` … `T-158-61`, `T-158-SC`) covers the surface this plan touches, and no package was installed.

## Known Stubs

None.

## Next Phase Readiness

- **`158-12`** (admin form-action role gates) can rely on the hook being a session gate: the role decision has one home in the admin protected layout, and the form actions are the second. Note the baseline still does **not** cover the authenticated non-admin arm — `403 Forbidden` is unexercised by any measurement in this phase so far, and this plan did not create that identity either.
- **`158-13`** (session-free subtree loads) is unaffected by this plan: the hook reads `safeGetSession()` and never the layouts' returned payloads.
- **`158-16`** (criterion 11's E2E spec) now has twelve live rows to encode, four of which the 158-10 baseline did not carry (`/admin/question-info`, `/admin/argument-condensation`, unauthenticated `/admin/login`, authenticated `/admin/login`). **The authenticated `/admin/login` → 303 row is the one that discriminates the hook gate from the layout gate** — a spec asserting only the unauthenticated 307 would pass with the admin row deleted.
- **Standing risk carried forward:** decision 2 above — the admin authenticated-on-login bounce can ping-pong if the protected layout's logout fails. Not observed; named so a later reader is not surprised by it.

---
*Phase: 158-routing-auth-surface-harmonisation*
*Completed: 2026-09-02*

## Self-Check: PASSED

All six created/modified files exist on disk; all five commits (`f91a6332e`, `a30e6bb65`, `c28d0d3d2`, `30032a84a`, `b06476f77`) resolve in `git log`.
