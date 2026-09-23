# 158 — What an authenticated non-admin's POST to an admin form action actually does

**Measured at HEAD `8bf3320f99add80785ad382fd1e1a420b465746d`, branch `integration/ship-12-squash`, 2026-09-02.**
Written by `158-12` Task 1. Read by `158-12` Task 2 (the operator checkpoint) and by `158-15`, which owns
OB-5's remaining deliverables.

---

## ARM: THROWN

**OB-5's stated mechanism does NOT reproduce at this HEAD.** The job-start refusal becomes an `Error`
inside `UniversalAdapter.fetch` before `parseResponse` is ever called, so the feature function is never
reached: no job record is created, no language-model provider is contacted, and no row is written.

The retraction already recorded at commit `b5c9bb68d` ("the OB-5 exploit claim does not reproduce at
HEAD") and the `⚠ CORRECTION TO OB-5` block in `158-CARRIED-OBLIGATIONS.md` are both **confirmed by live
observation**, not merely by re-reading the source. This artifact is the observation.

**What IS real, and was also observed:** the two admin form actions have no admin gate of their own, so an
authenticated non-admin's POST *does* enter each action body, *does* construct a data writer, and *does*
issue the privileged call — it is only stopped one layer deeper, at the API route. The refusal then
surfaces to the caller as **`fail(500)`** carrying an **adapter-internal message naming an internal route**,
not as an authorization status. That is the defect this plan's Task 3 closes.

---

## 1. The static trace

Every file and function between the form action's writer call and the job-start endpoint's refusal, with
the deciding lines quoted.

| # | File | Symbol | What it does with the refusal |
|---|---|---|---|
| 1 | `apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts` | `actions.default` | Calls `dataWriter.startJob(...)` at line 33, inside a `try` whose `catch` (lines 47–51) turns any throw into `fail(500, …)` |
| 1′ | `apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts` | `actions.default` | Same shape; `startJob` at line 58, `catch` at lines 76–79 |
| 2 | `apps/frontend/src/lib/api/dataWriter.ts` | `createDataWriter` | `new SupabaseDataWriter(resolveAdapterConfig(source))` — a fresh writer per request |
| 3 | `apps/frontend/src/lib/api/base/universalDataWriter.ts` | `startJob` (lines 197–202) | `return (await this.post({ url: UNIVERSAL_API_ROUTES.jobStart, body })) as JobInfo`. **Not overridden by `SupabaseDataWriter`** — verified: the only `startJob` definitions in `apps/frontend/src` are this one and unrelated test helpers |
| 4 | `apps/frontend/src/lib/api/base/universalAdapter.ts` | `post` (lines 107–135) | Line 131: `const response = await this.fetch(url, fullInit, options);` — **`this.fetch`, the class's own wrapper method, not the injected `#fetch`** |
| 5 | `apps/frontend/src/lib/api/base/universalAdapter.ts` | `fetch` (lines 36–69) | **THE DECIDING LINES.** See below |
| 6 | `apps/frontend/src/lib/api/utils/parseResponse.ts` | `parseResponse` | Never reached with a non-2xx, because step 5 throws first |
| 7 | `apps/frontend/src/routes/api/admin/jobs/start/+server.ts` | `POST` (lines 18–20) | `const denied = await requireVerifiedAdmin({ fetch, locals }); if (denied) return denied;` — the gate runs before any body parse |
| 8 | `apps/frontend/src/lib/server/admin/requireVerifiedAdmin.ts` | `requireVerifiedAdmin` (lines 20–35) | Produces the refusal: **401 for a missing session, 403 for an authenticated non-admin** |

### The deciding lines — `universalAdapter.ts:60-66`

```ts
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message = body?.message ?? '(Could not parse error message from Response.)';
      throw new Error(
        `Error with UniversalAdapter.fetch when parsing response from '${maybeCachedUrl}': ${response.status} • ${message}`
      );
    }
```

This is inside `UniversalAdapter.fetch`, **one method above `post` in the same file**. It is the line
OB-5's author did not read; the ruling jumped from `post` straight to `parseResponse`.

### The line OB-5 correctly describes, and why it is harmless today — `parseResponse.ts:10-12`

```ts
  switch (parser) {
    case 'json':
      return response.json() as ParsedResponse<TParser>;
```

`parseResponse` genuinely never inspects `response.ok` or `response.status`. **It has exactly two
production call sites**, both inside `UniversalAdapter` and both downstream of the throw above:

```
apps/frontend/src/lib/api/base/universalAdapter.ts:90:    return parseResponse(response, parser) as ParsedResponse<   ← get()
apps/frontend/src/lib/api/base/universalAdapter.ts:132:    return parseResponse(response, parser) as ParsedResponse<  ← post()
```

(`git grep -nw parseResponse -- apps/frontend/src`, test files excluded.) So the class is closed **by the
caller, not by the helper**. A third caller added tomorrow, anywhere, reopens it with no test to stop it.
That residue is the whole of what deliverable 2 still has to answer for.

### The refusal the gate actually produces — `requireVerifiedAdmin.ts:28-32`

```ts
  const { session } = await locals.safeGetSession();
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  if ((await getUserData({ fetch, locals }))?.role !== 'admin') return json({ error: 'Forbidden' }, { status: 403 });
```

**401 for a missing session; 403 for an authenticated non-admin.** This is CR-01's split. Note for anyone
writing a spec against it: `157.2`'s summary and OB-6's original text both said *403* for the
unauthenticated arm, and `158-10` corrected that to *401*. A spec asserting 403 on the unauthenticated arm
fails on a correct tree.

### The pre-existing regression that already pins the throw

`apps/frontend/src/lib/api/base/universalAdapter.test.ts:70-81`

```ts
    test('should throw error when response is not ok', async () => {
      const mockResponse = { ok: false, status: 404, json: vi.fn().mockResolvedValue({ message: 'Not found' }) } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);
      await expect(adapter.fetch('http://openvaa.org/api')).rejects.toThrow(
        /Error with UniversalAdapter\.fetch when parsing response.*404.*Not found/
      );
    });
```

It pins `UniversalAdapter.fetch`. It does **not** pin `parseResponse`'s own contract, and it does not pin
the end-to-end action behaviour.

---

## 2. The runtime observations

### Method

- **One fresh dev server on `FRONTEND_PORT=5273`**, started with `yarn workspace @openvaa/frontend dev`
  (deliberately **not** `yarn dev`, whose `dev:clean` step wipes `.svelte-kit` and the Vite cache that the
  developer's own `:5173` server is using). The pre-existing `:5173` server was neither stopped, nor
  trusted, nor used, and was still listening after teardown.
- **Served-application identity asserted before any observation**, by the E2E-preflight method:

  | probe | result |
  |---|---|
  | `GET /@fs/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/frontend/src/routes/+layout.svelte` | **200** |
  | negative control — the same path under the *sibling* checkout `…/voting-advice-application/` | **403** |

  The control fires, so the 200 is evidence of *this* checkout and not merely of *a* server.
- **Database:** left exactly as found. **No temporary identity was created.** The database already carried
  both identities this measurement needs — `apps/supabase/supabase/seed.sql` seeds `admin@openvaa.test`
  with the `project_admin` role and `candidate@openvaa.test` with the `candidate` role. The `candidate`
  identity *is* an authenticated non-admin, so the plan's "create a temporary non-admin identity" step was
  **unnecessary**, and the concern the phase brief raised about writing auth users into the developer's
  database does not arise. See § 4 for the leftover assertions.
- Login went through the **real form actions** (`/candidate/login`, `/admin/login`), using the seed
  password held in `apps/supabase/supabase/seed.sql`. **No credential or token value is transcribed
  anywhere in this artifact.** `curl` never followed redirects.
- Database state at measurement time: `db:reset-with-data`, 1 election (`seed_election_default`,
  `07d1438c-7024-4e38-af31-7e9ac8a6510e`), 26 questions, **765** public rows.

### Observation 1 — authenticated NON-ADMIN

Identity: `candidate@openvaa.test`, role `candidate`. Signed in through `/candidate/login`; a
`sb-127-auth-token` cookie was set.

**Discriminating proof the session was live and authenticated** (upstream trap #4 — a status can be
produced by more than one layer): authenticated `GET /candidate/login` → **`303` → `/candidate`**, the
`appGates` bounce `158-11` added. An unauthenticated caller gets `200` and the login page there, so the
303 can only come from a live session. A second, independent witness: `GET /candidate` → `307` →
`/candidate/login?errorMessage=candidateNoNomination` — an error message only an *authenticated* caller
can reach; an unauthenticated one gets `errorMessage=loginFailed`.

#### 1a. `POST /admin/argument-condensation`

Request: `Origin: http://localhost:5273`, `x-sveltekit-action: true`,
`electionId=07d1438c-7024-4e38-af31-7e9ac8a6510e`.

- **Status:** `HTTP/1.1 200 OK`, `content-type: application/json` (SvelteKit's action envelope; the
  action's own status is inside it)
- **Body, verbatim:**

  ```json
  {"type":"failure","status":500,"data":"[{\"type\":1,\"error\":2},\"error\",\"Error with UniversalAdapter.fetch when parsing response from '/api/admin/jobs/start': 403 • (Could not parse error message from Response.)\"]"}
  ```

- **Did the writer call throw or return?** **THREW.** The message is `UniversalAdapter.fetch`'s, verbatim
  from `universalAdapter.ts:63-65`.
- **Did the job feature run?** **NO.** `condenseArguments` was never entered.
- **Was the language-model provider reached?** **NO.** Zero matches for
  `openai|anthropic|llmProvider|getLLMProvider|api\.openai|Loading election` in the server log. (The
  `[PromptRegistry] Registered 28 prompts` lines are module-import-time registration, not a provider call.)
- **Was a job record row created?** **NO.** `public.admin_jobs` = 0 before and after.
- **Server log line, verbatim:**

  ```
  msg: "[Admin App argument condensation] Error with UniversalAdapter.fetch when parsing response from '/api/admin/jobs/start': 403 • (Could not parse error message from Response.)",
  severityText: 'ERROR'
  ```

#### 1b. `POST /admin/question-info`

Same identity and origin; `electionId=07d1438c-…`, `operations=terms`.

- **Status:** `HTTP/1.1 200 OK`, `content-type: application/json`
- **Body, verbatim:**

  ```json
  {"type":"failure","status":500,"data":"[{\"type\":1,\"error\":2},\"error\",\"Internal server error\"]"}
  ```

- **Threw or returned?** **THREW** — same seam. The action's `catch` substitutes a generic message, so the
  internals do not reach the caller here.
- **Job feature run?** **NO.** **Provider reached?** **NO.** **Job record row?** **NO.**
- **Server log line, verbatim:**

  ```
  msg: "[Admin App question info] Error with UniversalAdapter.fetch when parsing response from '/api/admin/jobs/start': 403 • (Could not parse error message from Response.)",
  severityText: 'ERROR'
  ```

**The asymmetry between 1a and 1b is itself a finding.** Both actions return `fail(500)`, but
`argument-condensation` puts the adapter's message — which names an internal API route and an internal
class — into the response body, while `question-info` returns `'Internal server error'`. One of the two
leaks; neither reports authorization.

### Observation 2 — NO session (the control)

- `GET /admin/argument-condensation` → **`307`** → `http://localhost:5273/admin/login?errorMessage=loginFailed`
- `POST /admin/argument-condensation` → SvelteKit envelope, verbatim:

  ```json
  {"type":"redirect","status":307,"location":"http://localhost:5273/admin/login?errorMessage=loginFailed"}
  ```

- `POST /admin/question-info` → the same 307 redirect envelope.
- **Job feature run?** **NO.** **Provider reached?** **NO.** **Job record row?** **NO.** **Threw?** No —
  the action body is never entered at all.

**The control does what a control must: it separates the arms.** Unauthenticated, the redirect gate stops
the request *before* the action body. Authenticated-but-not-admin, the request passes that gate and enters
the action body — which is exactly why the gate must also exist *at the action*, and exactly why the two
observations differ in kind rather than in degree.

### Observation 3 — the 401/403 split at the gate itself, with a positive control

Three arms against `POST /api/admin/jobs/start`, same server, same request body:

| arm | identity | status | body, verbatim |
|---|---|---|---|
| A | no session | **401** | `{"error":"Unauthorized"}` |
| B | authenticated non-admin (`candidate@openvaa.test`) | **403** | `{"error":"Forbidden"}` |
| C | authenticated admin (`admin@openvaa.test`, `project_admin`) — **positive control** | **200** | a `JobInfo` object (a second identical call then returned `An active job for this feature is already running`, the endpoint's duplicate guard) |

Arm C is what makes arms A and B evidence rather than noise: the same endpoint, reached the same way, lets
an admin through. Without it, a 403 could have been produced by a malformed session rather than by the
role test. The 401/403 split — **401 for a missing session, 403 for an authenticated non-admin** — is
therefore confirmed live at this HEAD and must be preserved by anything Task 3 does.

The in-memory job arm C created lived only in the throwaway `:5273` server's process and died with it;
`public.admin_jobs` was 0 before and after (§ 4).

---

## 3. The blast-radius census

Owed on either arm, and taken by **compiling**, not by grepping.

**Baseline first.** `yarn typecheck --force` on the unmodified tree: **exit 0**, 22/22 tasks successful,
`svelte-check found 0 errors and 0 warnings` for `@openvaa/frontend`. `--force` rather than plain
`yarn typecheck` because a stale `tsconfig.tsbuildinfo` survives an ordinary run and would let a cached
pass masquerade as a fresh one.

**The exact throwaway change** — the "discriminated result callers must narrow" shape of deliverable 2,
applied to `parseResponse`'s own contract, in `apps/frontend/src/lib/api/utils/parseResponse.ts`:

```diff
 export type ParsedResponse<TParser extends ResponseParser> = TParser extends 'json' | undefined
-  ? Promise<unknown>
+  ? Promise<{ ok: true; value: unknown } | { ok: false; status: number }>
   : TParser extends 'text'
```

**Command run:** `yarn typecheck --force`
**Result:** **exit 1** — `svelte-check found 11 errors and 0 warnings in 2 files`.

**Rejected call sites — 11, in 2 files:**

| # | Site | Cast target the compiler rejected |
|---|---|---|
| 1 | `apps/frontend/src/lib/api/base/universalDataWriter.ts:62:12` | `DataApiActionResult` |
| 2 | `apps/frontend/src/lib/api/base/universalDataWriter.ts:107:12` | `DataApiActionResult` |
| 3 | `apps/frontend/src/lib/api/base/universalDataWriter.ts:114:7` | `DataApiActionResult` |
| 4 | `apps/frontend/src/lib/api/base/universalDataWriter.ts:183:12` | `JobInfo[]` |
| 5 | `apps/frontend/src/lib/api/base/universalDataWriter.ts:191:12` | `JobInfo[]` |
| 6 | `apps/frontend/src/lib/api/base/universalDataWriter.ts:198:12` | `JobInfo` — **this is `startJob`** |
| 7 | `apps/frontend/src/lib/api/base/universalDataWriter.ts:205:12` | `JobInfo` |
| 8 | `apps/frontend/src/lib/api/base/universalDataWriter.ts:211:12` | `DataApiActionResult` |
| 9 | `apps/frontend/src/lib/api/base/universalDataWriter.ts:218:12` | `DataApiActionResult` |
| 10 | `apps/frontend/src/lib/api/adapters/apiRoute/apiRouteAdapter.ts:22:14` | `Promise<ApiRouteReturnType<TApi>>` |
| 11 | `apps/frontend/src/lib/api/adapters/apiRoute/apiRouteAdapter.ts:31:14` | `Promise<ApiRouteReturnType<TApi>>` |

Representative diagnostic, verbatim:

```
Error: Conversion of type '{ ok: true; value: unknown; } | { ok: false; status: number; }' to type 'JobInfo'
may be a mistake because neither type sufficiently overlaps with the other. If this was intentional,
convert the expression to 'unknown' first.
  Type '{ ok: false; status: number; }' is missing the following properties from type 'JobInfo':
  id, jobType, author, progress, and 5 more.
```

**Two caveats `158-15` must carry, or the number will mislead it.**

1. **11 is a floor, not a ceiling, and the reason is the `as` casts.** Every rejected site is an
   `as SomeDomainType` cast. Those casts are a *firewall*: because each writer method declares a concrete
   return type (`Promise<JobInfo>`), the stricter shape is absorbed at the cast and does **not** propagate
   to the writer's own callers. Change the declared return types too and the census grows. The compiler
   answered the question that was asked of it — "who must change at the seam" — not "who is affected".
2. **This shape only covers the `'json' | undefined` arm.** Call sites using `parser: 'text' | 'blob' |
   'none'` are untouched by it. A stricter shape spanning all arms would produce a larger census.

**The throwaway change was reverted completely.** `git checkout --` on the one file; the file then
`diff`ed byte-identical against a copy taken before the edit, and
`git status --porcelain apps packages tests scripts` printed nothing.

---

## 4. Teardown and leftover assertions

**No identity was created, so none had to be deleted** — the two identities used are permanent fixtures of
`seed.sql`. What logging in *did* create was two auth sessions, and those were removed by id, leaving the
developer's four pre-existing sessions (created 08:18–08:46 UTC, all before this measurement's first login
at 10:27 UTC) untouched.

| assertion | value |
|---|---|
| `auth.sessions` created by this measurement (`created_at > 10:00 UTC`) | **0** |
| `auth.sessions` total (pre-existing, developer's own) | **4** — unchanged |
| `auth.users` | **2** — unchanged from baseline |
| `public.user_roles` | **2** — unchanged from baseline |
| `public.admin_jobs` | **0** — unchanged from baseline |
| `public` rows total (`sum(n_live_tup)`) | **765** — unchanged from baseline |
| `:5273` listeners after teardown | **0** |
| developer's `:5173` server | still listening — never stopped, never used |
| `git status --porcelain apps packages tests scripts` | *(empty)* |

Re-measured figure differing from a planning document: the phase brief records the seeded database as
**752 rows**; measured here as **765** (`sum(n_live_tup)` over `pg_stat_user_tables`, `public` schema).
The difference is not a discrepancy in the seed — `n_live_tup` is Postgres's *estimate*, refreshed by
autovacuum, and it drifts with activity between two readings of the same data. Both figures describe the
same `db:reset-with-data` state.

---

## 5. The operator's answer (Task 2 checkpoint)

```
ARM SELECTED: thrown-pin  (plus the newly measured asymmetry)
DATE:         2026-09-02
MEASURED AT:  HEAD 8bf3320f9 (branch integration/ship-12-squash); measurement committed as f83108a7e
RECORDED BY:  158-12 Task 3 (continuation executor), from the operator's answer to the Task 2
              blocking-human checkpoint
```

**Did OB-5's stated mechanism reproduce? NO.** In one sentence: `UniversalAdapter.fetch` throws on
`!response.ok` (`universalAdapter.ts:60-66`) before `parseResponse` is ever handed a non-2xx, so the
class OB-5 describes is closed by the caller rather than by the helper, and OB-5's author reached the
opposite conclusion by reading `post()` and jumping to `parseResponse` without reading `this.fetch` one
method up in the same file.

### The answer, verbatim

> **`thrown-pin` + the asymmetry, with MAXIMUM CONSISTENCY as the governing principle.**
>
> The operator's instruction was, verbatim: *"Strive for maximum consistency."* Applied to this decision
> it selects the `thrown-pin` arm AND folds in the newly measured asymmetry, because leaving two sibling
> admin form actions with divergent failure handling is exactly the inconsistency to remove.
>
> This shapes deliverables 2–4, which belong to **158-15**, as follows:
> 1. **`parseResponse` gets its OWN refusal of a non-2xx**, plus a standing regression that pins the
>    seam, plus the census run so the pin is proven not to break a consumer. The substance of "a non-2xx
>    must not become a value" is still delivered. Justification, measured: `parseResponse` has exactly 2
>    production callers (`universalAdapter.ts:90` and `:132`), both already behind the throw — a third
>    caller added tomorrow reopens the class with no test to stop it. Record honestly that this is
>    NARROWER than OB-5's text, so a reader comparing plan to ruling sees why.
> 2. **The refusal `parseResponse` performs must be CONSISTENT with the refusal `universalAdapter`
>    already performs** — same predicate, same notion of what counts as a refusal. Two different answers
>    to "is this response a refusal?" in one adapter is the same defect class in a new place.
> 3. **Harmonise the two admin form actions' failure shape, and stop the internal leak.** Measured:
>    `argument-condensation` returns `fail(500)` carrying an adapter-internal message naming an internal
>    API route (`Error with UniversalAdapter.fetch when parsing response from '/api/admin/jobs/start':
>    403 • …`), while `question-info` returns a generic `'Internal server error'`. Both siblings must
>    return the same shape, and the adapter-internal detail naming an internal route must not reach the
>    client. This asymmetry was NOT in OB-5 — it was found by Task 1's measurement.
>
> **Two caveats 158-15 must carry forward:** (a) the 11-site census is a **FLOOR, not a ceiling** —
> every rejected site is an `as SomeDomainType` cast acting as a firewall, so changing the declared
> return types too grows the count; (b) the census covers only the `'json' | undefined` arm —
> `'text' | 'blob' | 'none'` sites are untouched.

### What `158-15` consumes from here

The census call-site list is **§ 3 above**: 11 rejected sites in 2 files, measured by compiling
(`yarn typecheck --force`, exit 1, `svelte-check found 11 errors and 0 warnings in 2 files`), with both
caveats stated there as well as in the answer.

### What `158-12` Task 3 landed instead, and what it did NOT

Deliverable 1 was owed on every arm and is closed: both admin form actions now carry the same admin gate,
as their FIRST statement, ahead of any writer construction. See `158-12-SUMMARY.md`.

Deliverable 3 of the answer above — harmonising the two actions' 500-failure shape and stopping the
adapter-internal leak — is **158-15's**, and was deliberately NOT done here. Task 3 removes the
*authorization* instance of that leak by construction, because a non-admin no longer reaches the writer
at all; the leak remains reachable for every OTHER upstream failure (a 409 from an already-running job,
a 500, a network error), and the two siblings still disagree about it. That is the work `158-15` owns.

---

## 6. What `158-15` did with this, and what class it belongs to

Written by `158-15`, so a reader arriving at the ruling in § 5 finds the outcome attached to it
rather than having to reconstruct it from three summaries.

**Did the ruling's stated mechanism reproduce? NO — and `158-15` did not resurrect it.** The
retraction at `b5c9bb68d` and § 0 of this document are confirmed twice over: once by `158-12`'s live
observation, and again here, by `158-15` running the pre-change `parseResponse` directly and finding
that it is `UniversalAdapter.fetch`, not the helper, that stops a non-2xx. No remedy was written for
a conversion that does not happen.

**Which arm was applied: `thrown-pin`, plus the asymmetry.** In full:

1. `parseResponse` now refuses a refused response **itself**, throwing ahead of its parser switch, so
   the property no longer depends on the arrangement of its two callers. Recorded honestly: this is
   **narrower than OB-5's text**, which asked for the shared writer stack to be rewritten. The
   justification is measured, not asserted — the helper had exactly two production callers, both
   already behind the throw, so what was actually open was the *next* caller, and that is what a
   contract on the helper closes.
2. The refusal `parseResponse` performs is the **same predicate** `UniversalAdapter.fetch` performs:
   both call the one exported `isRefusedResponse`, so the two cannot drift into disagreeing about
   what a refusal is. This was the ruling's consistency requirement and it is now structural rather
   than conventional.
3. Both admin form actions answer an upstream failure with **one shape**, and the adapter-internal
   message naming an internal API route goes to the server log and nowhere else. The remainder of
   `T-158-65` — the leak that survived `158-12` for 409/500/network failures — is closed.

**The class.** The seam's own docstring names it in one sentence, without citing any planning path:
*a helper that hands back the body of a refused response is a degrader — it turns a failure into a
value the caller cannot tell apart from success, and every caller that does not know to check first
inherits the hole.*

**One correction to the plan's own framing, stated rather than quietly worked around.** `158-15`'s
plan requires that one sentence to assert this is *"the same fail-loudly class an earlier operator
ruling named on the write path"* — i.e. ruling D8, where a failed parse degraded to an empty value.
The ⚠ CORRECTION block in `158-CARRIED-OBLIGATIONS.md` **withdraws exactly that claim**: "The read
path already fails loudly. D8's class is not present here." Writing the plan's sentence verbatim
would have re-recorded a retracted finding. What was written instead names the degrader class
*prospectively* — the property the helper must not acquire — which is true, is the reason the
contract exists, and does not contradict the retraction. The plan text and the correction disagree;
the correction is the later and the measured one, and it wins.

**Evidence.** `158-NEGATIVE-CONTROL-LEDGER.md` § Section F: four rows, each with an observed red half
and an observed green half, plus the reconciliation of the trial census in § 3 above (11 sites, the
discriminated-result arm) against the landed census (0 sites, the throw arm) and the runtime evidence
that stands in for what a throw makes invisible to the compiler.
