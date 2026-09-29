# Phase 158 — Obligations Carried In From Phase 157.2

**Created 2026-09-01.** These are not new decisions. They are commitments made during Phase 157.2 that
158 must discharge, recorded here so a re-plan cannot lose them.

---

## OB-1 — Two admin universal loads are still serialised behind the root load

**Status: OPEN. 158 must either apply the fix or record acceptance with a reason.**

### What happened

Phase 157.2 moved every load to a per-request Supabase client. Children taking that client from
`await parent()` **serialised nested loads behind the root load's four Supabase round-trips**. That surfaced
as a deterministic WCAG 2.1 AA failure on the voter side — `routes/+layout.svelte:149-157` sets focus once
inside a single `requestAnimationFrame` with no retry, so on cold entry the `<h1>` had not mounted and
keyboard / screen-reader users were left on `<body>`. Caught by `a11y-smoke.spec.ts:300` (NAVA11Y-02).

**The operator ruled option (a+) on 2026-09-01:** every newly-serialised nested load gets its own
`+layout.server.ts` returning the filtered cookie array, so it builds its own client from its own `data`
with no `await parent()` for the client.

Three loads were newly serialised. **Only one could legally be treated in 157.2:**

| Load | Newly serialised | Treated in 157.2 |
|---|---|---|
| `routes/(voters)/(located)/+layout.ts` | yes | ✅ (a+) applied |
| `routes/admin/(protected)/argument-condensation/+layout.ts:11` | **yes** | ❌ blocked |
| `routes/admin/(protected)/question-info/+layout.ts:11` | **yes** | ❌ blocked |

`routes/(voters)/nominations/+layout.ts` and `routes/admin/(protected)/+layout.ts` were **not** newly
serialised — both already awaited `parent()` unconditionally for other data — so they take the client from a
call they were already making. No action needed there.

### Why 157.2 did not do it

`157.2-03-PLAN.md:52` carries an explicit prohibition with a mechanical verification:
*"The three files under `routes/admin/(protected)/` remain `+layout.ts` files and no new `+layout.server.ts`
is added beneath `routes/admin/`"* — on the stated grounds that the admin route surface is **158's**
territory. The executor declined to override a specific, mechanically-checked prohibition on the strength of
a general instruction, and flagged the gap rather than exempting the two loads silently. That was correct.

### What 158 owes

Either:
- **(i) Apply (a+) to both loads** — give each its own `+layout.server.ts` deriving the filtered array from
  the shared `SUPABASE_COOKIE_PREFIX` constant (never a literal — a `cookieOptions.name` change must not be
  able to silently empty an array, because **an empty cookie array is an anonymous client that raises no
  error**). Discharge the `httpOnly` prohibition per new server load **by observation**: a rendered SSR
  payload for a page carrying `id_token`, `oidc_state`, `oidc_nonce` and `oidc_code_verifier` must contain
  none of their values, with an `sb-`-prefixed sentinel present as the positive control proving the payload
  genuinely carries the array; **or**
- **(ii) Record the serialisation as accepted for these two routes**, with the reason stated.

**The bounded case for (ii), from 157.2's measurement:** both routes sit behind admin auth, neither is on a
hot path, both are covered by the green suite, and their common parent already blocked on the root load
before 157.2. The risk is latency, not a known failure.

**The case against (ii):** 158 criterion 11 requires an admin spec that *"survives a page refresh — the
refresh is the half the universal-load defect breaks."* That is exactly the cold-entry path where
serialisation bites. If 158 adds that spec while leaving these two serialised, the spec is testing the path
most likely to expose the very latency this obligation is about.

### Related, deferred, not this

Option (c) — streaming the root load's datasets so `parent()` resolves immediately, preserving single
construction *and* parallelism — is filed for a spike at v2.15 close:
`.planning/todos/pending/2026-09-01-spike-streamed-root-load-ssr-parallelism.md`. If that spike succeeds,
it may delete the `+layout.server.ts` files (a+) adds. Do not attempt it inside 158.

---

## OB-2 — `/api/auth/login` was DELETED by 157.2; 158's A4 becomes a verification

Operator ruling, 2026-08-31. The route had **zero callers** — the only references were two comments (at
`candidate/login/+page.server.ts:4` and `admin/login/+page.server.ts:4`) explaining that each login form
action deliberately uses `event.locals.supabase` directly instead, because a nested API-route response's
`Set-Cookie` headers do not propagate to the browser.

**158 must not re-plan a deletion that has already happened.** A4 changes from *perform the removal* to
*verify the route is gone and no caller reappeared*.

---

## OB-3 — Six `/api/admin/jobs/**` endpoints were relying on singleton contamination

Found and fixed during 157.2 wave 3. All six were passing a bare `fetch` to `getUserData`, so
`_getBasicUserData` asked an **anonymous** client for a session. They worked only because the writer
singleton had usually been contaminated with a real client by an earlier request — **ruling D10's shape,
alive in the tree**.

`getUserData` now takes `AdapterSource & { parent? }` and the endpoints pass `{ fetch, locals }`.

**Why 158 needs to know:** these six endpoints are the ones 158 criterion 11's admin spec will exercise.
Their pre-157.2 behaviour was *accidentally* correct, so any 158 baseline measured before that fix would be
measuring the contamination, not the fix.

---

## OB-4 — `hooks.server.ts` anchors have drifted four times

157.2 deliberately did not touch `apps/frontend/src/hooks.server.ts` for this reason. 158's anchors into that
file drifted again from 157.1's `configureLogger` block (12 lines). **158 must re-measure every anchor in
that file at HEAD before planning against it** — this is the fourth drift, and stale anchors have cost this
phase family repeatedly.

---

# Operator rulings, 2026-09-01 (plan-phase)

Both were put to the operator during the 158 re-plan pass, after the scoped D10 research and the
orchestrator's verification of it. They are **decisions, not recommendations**, and they bind planning.

## OB-5 — The swallowed-error class is fixed IN 158, not filed

**Ruling: "Fix the actions AND the class in 158."**

### The defect

`lib/api/utils/parseResponse.ts` switches on the parser and returns `response.json()`. It **never
inspects `response.ok` or `response.status`, and never throws on a non-2xx.** Its only caller path of
interest here is `lib/api/base/universalAdapter.ts` `post()`, which ends
`const response = await this.fetch(...); return parseResponse(response, parser)`.

So a 4xx *body* becomes a plausible-looking domain object. Concretely, for an authenticated non-admin
POSTing either admin form action at HEAD `f7b85a18f`:

1. `if (!session)` passes — they are authenticated
2. `getBasicUserData()` returns their own email
3. `startJob()` reaches `routes/api/admin/jobs/start/+server.ts`, whose `requireVerifiedAdmin` correctly
   returns **403 `{ error: 'Forbidden' }`** — and that body is parsed as ordinary JSON and returned as
   the value. **No throw.** `jobInfo.id` is `undefined`
4. `condenseArguments({ ..., jobId: undefined })` **runs** — `new PipelineController(jobId)` and
   `createJobRecorder({ jobId, ... })` have no validity guard — through `loadElectionData` and on to the
   LLM provider. The `admin_jobs` insert is refused by RLS (`admin_insert_admin_jobs` →
   `can_access_project`) only **after** the spend

### Why it is not "a missing role check"

The role check is present and correct. `requireVerifiedAdmin` (landed by CR-01 in 157.2) does the
verifying `safeGetSession()` round-trip and then the `role !== 'admin'` test, and it covers all six job
endpoints. **The gap is that its rejection is silently discarded by the caller's writer stack.** Planning
against "add the missing check" would close two call sites and leave the class open in a file every
adapter consumer goes through.

### What 158 owes

1. **Both admin form actions** get their own role check before any writer call — consuming
   `lib/auth/roles.ts` (created by `158-05`), never a third copy of the role-name array.
2. **The class itself:** `universalAdapter.post` (and the sibling verbs that share the shape) must stop
   converting a non-2xx into a value — either throw, or return a discriminated result the callers must
   narrow. Fix every call site the change breaks; the compiler and `yarn typecheck` are the census.
3. **A job-start guard:** a missing or invalid `jobId` is rejected outright rather than carried into
   `PipelineController`. This overlaps criterion 12's surface — coordinate, do not duplicate.
4. **Regression evidence in the D8 house style:** a proven RED→GREEN round trip. The RED must be the
   swallowed 403 specifically — a test that fails because the 403 became a value, and passes because it
   no longer does.

**This is ruling D8's fail-loudly class on the read path** (D8 was `safeParse` degrading a failed parse
to an empty value). Treat it as the same class and say so in the plan.

**Blast radius is real and is the reason this is called out here rather than left to the executor:** the
writer stack is shared by every adapter consumer, and plans `158-01`…`158-08` do not touch it. Expect
the diff to reach well outside `routes/admin/`.

## OB-6 — Criterion 8 is RE-MEASURED before it is planned

**Ruling: "Re-measure first, then decide."**

The research reports criterion 8 (the admin universal-load direct-entry/refresh bounce) as **fully
delivered** by 157.2, not half — citing `157.2-09-SUMMARY.md`'s real observation of 200 on direct entry,
200 on refresh, 200 on both jobs routes, and 307/403 unauthenticated. **The ROADMAP's 2026-09-01
amendment, which says the universal-load half is still owed, is therefore wrong** and should be
corrected by this phase.

**But that observation is at `4925f2e81`, 23 commits back, and two later commits — `889b7d6ad` (CR-01)
and `bc7a884c7` (IN-06) — touch this exact path.** So it is not planned as delivered on the strength of
the summary alone.

**The admin wave's FIRST task re-runs the measurement at current HEAD** — authenticated admin: direct
entry to `/admin`, refresh, and one `/api/admin/jobs/*` call; unauthenticated: the 307 and the 403.
Then it branches:

- **Green** → criterion 8 needs no code change. It becomes a durable **regression spec** only, folded
  into the criterion 11 spec that A5(a) already requires (log in as admin, land on `admin/(protected)`,
  reload, call a jobs route expecting non-403 — the reload is the half the universal-load defect broke).
  Correct the ROADMAP amendment as part of the same plan.
- **Red** → the plan branches to the fix, and the measurement is the RED half of its round trip.

Record the measured result in the plan's summary either way. A phase that assumed this and was wrong
would discover it at the closing gate, which is the most expensive place to find it.

---

# ⚠ CORRECTION TO OB-5 — 2026-09-01, measured at HEAD

**OB-5's premise above is WRONG. The exploit it describes does not exist. Read this before planning or
executing anything against OB-5.**

Written by the plan-phase orchestrator, which authored the incorrect OB-5 in the first place. The
gsd-planner measured the mechanism in isolation and reported it as non-reproducing; that report was
re-checked and is correct.

## The error

OB-5 asserts that `parseResponse` never inspects `response.ok`, therefore a 403 becomes a value.
`parseResponse` genuinely does not check `response.ok` — **but it is never reached with a non-2xx
response**, because its only caller checks first.

`universalAdapter.post` ends `const response = await this.fetch(url, fullInit, options); return
parseResponse(response, parser)`. That `this.fetch` is **not** the injected `#fetch` — it is
`UniversalAdapter`'s own wrapper method on the same class, and the wrapper contains:

```
if (!response.ok) {
  const body = await response.json().catch(() => ({}));
  const message = body?.message ?? '(Could not parse error message from Response.)';
  throw new Error(`Error with UniversalAdapter.fetch when parsing response from '...': ${response.status} • ${message}`);
}
```

It has carried a regression test since before this phase:
`universalAdapter.test.ts` — `test('should throw error when response is not ok')`, asserting
`rejects.toThrow(/Error with UniversalAdapter\.fetch when parsing response.*404.*Not found/)`.

**The orchestrator read `post()`, jumped to `parseResponse`, found no `ok` check there, and concluded the
403 was swallowed — without ever reading `this.fetch`'s body one method up in the same file. It checked
the wrong layer.**

## What actually happens for an authenticated non-admin POSTing an admin form action

1. `if (!session)` passes — the caller is authenticated
2. `getBasicUserData()` returns their own email
3. `startJob()` → `/api/admin/jobs/start` → `requireVerifiedAdmin` → **403** → `UniversalAdapter.fetch`
   **THROWS**
4. The action's `catch` returns `fail(500, { type: 'error', error: message })`
5. **`condenseArguments` is never reached. There is no LLM spend, and no job is created.**

## What the real gap is

Defense-in-depth and diagnosability, not privilege escalation:

- The two admin form actions have **no role check of their own**; they rely entirely on the API layer's
  `requireVerifiedAdmin` one call deeper. Criterion 9 and decision A2(a) still want the check at the
  action, and that is still worth doing — but as depth, not as an outage fix.
- A non-admin's rejection surfaces as **`fail(500)` with an adapter-internal message**, not a 403. The
  status is wrong and the message leaks internals. That is a real defect, and it is small.
- `parseResponse`'s **own** contract is still unguarded. Its caller closes the class today; the helper
  does not close it itself, so a future second caller would reopen it. Worth a standing pin, not a
  rewrite of the writer stack.

## Consequences for the plan and for the ruling

- **The operator's ruling "fix the actions AND the class in 158" was given on the strength of a live
  LLM-spend exploit that does not exist.** The premise has changed materially, so the scope is the
  operator's to re-decide. Until they do, the plans keep all four deliverables.
- The planner did **not** narrow OB-5 on its own authority — correctly. `158-12` Task 1 measures the
  mechanism in isolation and Task 2 is a **blocking checkpoint** presenting the trace with three
  prepared arms. Flagged as `EDGE-OB5-unclassified`.
- **OB-5 deliverables 1, 3 and 4 stand on their own merits** regardless: the form-action role checks
  (criterion 9 / A2(a)), the `jobId` guard before `PipelineController` (`condenseArguments` genuinely
  has none, and it overlaps criterion 12), and regression evidence. **Only deliverable 2 — rewriting
  the shared writer stack — loses its justification**, and shrinks to `parseResponse`'s own contract
  plus the standing pin and the census.
- The claim that this is "ruling D8's fail-loudly class on the read path" is **withdrawn**. The read
  path already fails loudly. D8's class is not present here.

**Evidence:** `lib/api/base/universalAdapter.ts` — the `!response.ok` throw inside the `fetch` wrapper,
and `post()`'s `await this.fetch(...)` call to it; `lib/api/base/universalAdapter.test.ts` — `test('should
throw error when response is not ok')`; `lib/api/utils/parseResponse.ts` — no `ok` check, one production
caller.
