---
phase: 158-routing-auth-surface-harmonisation
plan: 12
subsystem: frontend-auth
status: complete
tags: [authorization, admin, form-actions, role-gate, OB-5, D10-C09, REVIEW-RT-05]
requires:
  - 158-05 (lib/auth/roles.ts — the single role declaration)
  - 158-06
  - 157.2 CR-01 (requireVerifiedAdmin and the 401/403 split)
provides:
  - requireAdminIdentity — the ONE admin authorization decision, shared by all eight admin call sites
  - requireAdminAction — the form-action presentation of that decision
  - 158-SWALLOWED-ERROR-MEASUREMENT.md § 5 — the operator's arm answer, read by 158-15 as its starting input
affects:
  - the six /api/admin/jobs/** endpoints (through requireVerifiedAdmin, behaviour unchanged)
  - both admin form actions (now refuse an authenticated non-admin themselves)
tech-stack:
  added: []
  patterns:
    - "one decision, two thin presentations: the decision returns a discriminated verdict and names neither Response nor ActionFailure"
key-files:
  created:
    - apps/frontend/src/lib/server/admin/requireAdminIdentity.ts
    - apps/frontend/src/lib/server/admin/requireAdminAction.ts
    - apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
  modified:
    - apps/frontend/src/lib/server/admin/requireVerifiedAdmin.ts
    - apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts
    - apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts
    - .planning/phases/158-routing-auth-surface-harmonisation/158-SWALLOWED-ERROR-MEASUREMENT.md
decisions:
  - "OB-5's arm is `thrown-pin` plus the measured asymmetry, on the operator's governing principle of maximum consistency; deliverables 2-4 are 158-15's."
  - "The admin gate is the FIRST statement of each form action, ahead of form-body parsing, not merely ahead of the writer — so an unauthorized caller receives no input-validation feedback and the two siblings are byte-identical."
  - "The role test consumes the single declaration TRANSITIVELY, through the normalised `role` that SupabaseDataWriter._getBasicUserData derives with hasAnyRole(userRoles, ADMIN_ROLES); no new file spells a role name."
metrics:
  duration: ~35m (continuation agent, Task 3 only)
  completed: 2026-09-02
actuals:
  tokens: 21000
  tasks: 3
  commits: 2
---

# Phase 158 Plan 12: One Admin-Identity Decision, Two Thin Wrappers Summary

Eight admin call sites — the six `/api/admin/jobs/**` endpoints and the two admin form actions — now share
one admin-identity decision; the two form actions refuse an authenticated non-admin themselves, before any
privileged work, and the refusal was seen to fail before it was seen to pass.

**This summary is written by a continuation agent.** Task 1 (the measurement) was completed by a prior
executor at commit `f83108a7e`; Task 2 was a `blocking-human` decision checkpoint, now answered. This
agent executed Task 3 and recorded the answer.

---

## 1. The operator's answer to Task 2, verbatim

Recorded verbatim in § 5 of `158-SWALLOWED-ERROR-MEASUREMENT.md` and reproduced here.

```
ARM SELECTED: thrown-pin  (plus the newly measured asymmetry)
DATE:         2026-09-02
MEASURED AT:  HEAD 8bf3320f9 (branch integration/ship-12-squash); measurement committed as f83108a7e
```

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

**Did OB-5's stated mechanism reproduce? NO.** In one sentence: `UniversalAdapter.fetch` throws on
`!response.ok` (`universalAdapter.ts:60-66`) before `parseResponse` is ever handed a non-2xx, so the class
is closed by the caller rather than by the helper — OB-5's author read `post()`, jumped to
`parseResponse`, found no `ok` check, and concluded the 403 was swallowed without reading `this.fetch` one
method up in the same file.

**One number in the answer was re-checked before being propagated to `158-15`**, because it is an input to
another plan rather than prose: `git grep -n "parseResponse(" -- 'src/**/*.ts' | grep -v '\.test\.ts'`
returns exactly `universalAdapter.ts:90` and `universalAdapter.ts:132`. The operator's two line numbers
are correct.

---

## 2. The measurement and its arm (Task 1, carried forward)

Full artifact: `158-SWALLOWED-ERROR-MEASUREMENT.md` (346 lines at `f83108a7e`, extended here).

**`ARM: THROWN`.** The static trace runs form action → `createDataWriter` →
`UniversalDataWriter.startJob` → `UniversalAdapter.post` → **`UniversalAdapter.fetch`** (the class's own
wrapper, not the injected `#fetch`) → the `!response.ok` throw at `universalAdapter.ts:60-66`.
`parseResponse` is never reached with a non-2xx. Live: an authenticated non-admin's POST to both admin
actions THREW, the job feature did not run, no LLM provider was reached, no `admin_jobs` row was created.
The 401/403 split was confirmed with a positive control — no session → 401; authenticated non-admin →
403; authenticated `project_admin` → 200 with a `JobInfo`.

**What IS real, and is what Task 3 closed:** the two actions had no admin gate of their own, so a
non-admin's POST entered the action body, constructed a privileged writer, and issued the privileged call
— stopped only one layer deeper, at the API route, with the refusal reaching the caller as `fail(500)`
carrying an adapter-internal message naming an internal route.

**The census `158-15` consumes** (§ 3 of the artifact, measured by compiling — baseline `yarn typecheck
--force` exit 0, throwaway change exit 1, `svelte-check found 11 errors and 0 warnings in 2 files`):

| # | Site | Cast target rejected |
|---|---|---|
| 1–3 | `universalDataWriter.ts:62:12`, `:107:12`, `:114:7` | `DataApiActionResult` |
| 4–5 | `universalDataWriter.ts:183:12`, `:191:12` | `JobInfo[]` |
| 6–7 | `universalDataWriter.ts:198:12` (**`startJob`**), `:205:12` | `JobInfo` |
| 8–9 | `universalDataWriter.ts:211:12`, `:218:12` | `DataApiActionResult` |
| 10–11 | `apiRouteAdapter.ts:22:14`, `:31:14` | `Promise<ApiRouteReturnType<TApi>>` |

Both caveats (floor-not-ceiling; `'json' | undefined` arm only) travel with the number.

---

## 3. Task 3 — what landed

### The shared decision

`apps/frontend/src/lib/server/admin/requireAdminIdentity.ts` — the two-step decision (the verifying
`safeGetSession()` round trip, then the admin-role test) returning a **discriminated verdict**:

```ts
export type AdminIdentityVerdict =
  | { outcome: 'allowed' }
  | { outcome: 'unauthenticated' }
  | { outcome: 'forbidden' };
```

It returns a verdict rather than a `Response` or an `ActionFailure` — that is what makes it shareable by a
JSON endpoint and a form action. `requireVerifiedAdmin`'s docstring reasoning ("why a read is not a
verification", "why `safeGetSession` and nothing else") moved onto it, since the argument belongs with the
decision, not with one of its two presentations.

`grep -cE "from '@sveltejs/kit'" apps/frontend/src/lib/server/admin/requireAdminIdentity.ts` → **0**. The
decision knows nothing about how it will be presented.

### `requireVerifiedAdmin` — before and after

| | Before | After |
|---|---|---|
| Exported name | `requireVerifiedAdmin` | `requireVerifiedAdmin` — unchanged |
| Parameters | `{ fetch: Fetch; locals: App.Locals }` | `{ fetch: Fetch; locals: App.Locals }` — unchanged |
| Return | `Promise<Response \| undefined>` | `Promise<Response \| undefined>` — unchanged |
| No session | `json({ error: 'Unauthorized' }, { status: 401 })` | `json({ error: 'Unauthorized' }, { status: 401 })` |
| Verified non-admin | `json({ error: 'Forbidden' }, { status: 403 })` | `json({ error: 'Forbidden' }, { status: 403 })` |
| Verified admin | `undefined` | `undefined` |

Body before: `const { session } = await locals.safeGetSession(); if (!session) return json(…401); if ((await
getUserData({ fetch, locals }))?.role !== 'admin') return json(…403); return undefined;`
Body after: one call to `requireAdminIdentity` and a three-arm `switch` over the verdict. None of the six
endpoints changes; three spec cases assert the pair rather than only the new shape.

### The form-action presentation

`requireAdminAction.ts` — the second thin wrapper. The **only** thing it contains is the rejection shape:

- `unauthenticated` → `fail(401, { type: 'error', error: 'Authentication required' })` — the message both
  actions already returned for this case, preserved verbatim so the pages' rendering is unchanged
- `forbidden` → `fail(403, { type: 'error', error: 'Administrator access required' })`
- `allowed` → `undefined`

**The 401/403 split is preserved exactly** — CR-01's deliberate design, confirmed live by Task 1's
Observation 3. It was not "corrected" toward 157.2's stale 403-for-unauthenticated.

### The ordering, quoted from each file

Both actions open with the **same two lines, byte-identical**:
`diff <(sed -n '16,18p' argument-condensation/+page.server.ts) <(sed -n '17,19p' question-info/+page.server.ts)`
→ **exit 0**.

```
      // THE ADMIN GATE, AND IT IS FIRST — before the form body is read, before the writer is constructed, before any writer call. …
      const denied = await requireAdminAction({ fetch, locals });
      if (denied) return denied;
```

| File | Gate | `createDataWriter` | `startJob` | Feature call |
|---|---|---|---|---|
| `argument-condensation/+page.server.ts` | **line 16** | line 29 | line 34 | line 40 |
| `question-info/+page.server.ts` | **line 17** | line 54 | line 59 | line 65 |

**A deliberate strengthening beyond the plan's letter, on the maximum-consistency principle.** The plan
required the gate to precede the *writer*; both actions previously checked the session only after parsing
the form body and returning `fail(400)` for bad input. The gate is now the **first statement of the action**
instead, ahead of parsing. Two reasons: an unauthorized caller now receives no input-validation feedback,
and — the governing reason — it is the only placement at which the two siblings can be byte-identical,
since their parsing preambles differ in length (`question-info` parses five further fields). The
observable change is narrow: a non-admin submitting a *malformed* form now gets 403 rather than 400.

Both actions dropped their bare session check. Neither spells a role name nor performs a role comparison:
`grep -cE "(project_admin|account_admin|super_admin|role !==|role ===)"` over both files → **0 and 0**.

### Which role spelling was found, and where it came from

`lib/auth/roles.ts` (created by `158-05`) declares `ADMIN_ROLES = ['project_admin', 'account_admin',
'super_admin'] as const satisfies ReadonlyArray<UserRole>` and the predicate `hasAnyRole(claims, allowed)`.

**The identity read returns a NORMALISED role, so that is what the gate tests.**
`BasicUserData.role` is `'candidate' | 'admin' | null` (`dataWriter.type.ts:237,240`), and the
normalisation happens once, in `SupabaseDataWriter._getBasicUserData`, which already consumes the single
declaration: `if (hasAnyRole(userRoles, CANDIDATE_ROLES)) role = 'candidate'; else if (hasAnyRole(userRoles,
ADMIN_ROLES)) role = 'admin';`. Testing `?.role !== 'admin'` therefore consumes the one declaration
**transitively**, and no file this plan touched spells a database role name.

The spec's fixtures import `ADMIN_ROLES` / `CANDIDATE_ROLES` and build their token claims from them, rather
than transcribing literals — so the new test file is not a further copy either, and a rename in the
migration the declaration follows propagates into the fixtures.

---

## 4. The round trip — RED before GREEN, assertions byte-identical

**Byte-identity proof first:** `git diff ccdd97129 -- apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts`
→ **exit 0, empty output**. The spec was not touched between the halves.

### RED — `ccdd97129`, the actions ungated

```
   × the two admin form actions refuse an authenticated non-admin THEMSELVES, before any privileged work
     > argument-condensation refuses a verified non-admin with 403 and never reaches the job-start endpoint 6ms
     → expected undefined to be 403 // Object.is equality
   × the two admin form actions refuse an authenticated non-admin THEMSELVES, before any privileged work
     > question-info refuses a verified non-admin with 403 and never reaches the job-start endpoint 66ms
     → expected undefined to be 403 // Object.is equality
      Tests  2 failed | 15 passed (17)
```

`expected undefined to be 403` is the strong form of the red, and worth reading carefully: the result had
**no `.status` at all** because the ungated action returned `{ type: 'success' }`. Against a job-start
endpoint stubbed to answer 200 — as it would for anyone past the API gate — a verified *candidate's* POST
constructed the writer, fetched the endpoint, and ran the whole feature. The action itself had no opinion
about who was calling.

### GREEN — `326c7aa28`, both actions gated

```
 Test Files  1 passed (1)
      Tests  17 passed (17)
```

### The 17 cases

| Group | Cases |
|---|---|
| `requireAdminIdentity` | no session → unauthenticated; forged unexpired cookie claiming an admin role → unauthenticated (**not** forbidden — the claim was never read); verified non-admin → forbidden; verified with **zero role rows** → forbidden (the plan's backstop truth); verified but identity read yields nothing → forbidden, not a read of a missing value; verified admin → allowed; **two concurrent callers with different sessions each get their own verdict** |
| `requireVerifiedAdmin` | 401 `{error:'Unauthorized'}`; 403 `{error:'Forbidden'}`; `undefined` — the before/after pair |
| `requireAdminAction` | 401 `Authentication required`; 403 `Administrator access required`; `undefined` |
| The two form actions, end to end | each REFUSES a planted non-admin with 403 **and** never called `fetch` and never called the feature; each ADMITS a verified admin and reaches both |

Both directions are proven per the measurement discipline: the refusal is planted, and the admit control
is what makes the refusal discriminating rather than a harness that always returns 403.

---

## 5. Verification

| Gate | Result |
|---|---|
| `yarn workspace @openvaa/frontend vitest run src/lib/server/admin/requireAdminIdentity.test.ts` | **17 passed (17)**, exit 0 |
| `yarn typecheck --force` | exit 0 — 22/22 tasks, `svelte-check found 0 errors and 0 warnings` (frontend and docs) |
| `yarn workspace @openvaa/frontend test:unit` | **1502 passed, 80 files** — exactly +17 tests / +1 file over the 1485 / 79 baseline in STATE.md |
| `yarn lint:check` | exit 0 — all 15 links, including comment-hygiene (1620 files, 0 violations) and `assert-no-session-in-loads` (corpus 12, 0 violations) |
| `git status --porcelain apps packages tests scripts` | empty |
| `grep -cE "from '@sveltejs/kit'" …/requireAdminIdentity.ts` | 0 |
| Role literals / comparisons in both actions | 0 and 0 |
| Gate-block byte-identity across the two siblings | `diff` exit 0 |

**E2E was NOT run.** It needs the developer's `:5173` server and a database reset, both of which are the
user's state, and the environment note for this plan says Task 3's verification is vitest / typecheck /
lint. No E2E test was skipped, retried until green, or annotated as flaky.

---

## 6. Weak gates in the plan — reported rather than leaned on

Per the phase's six proven instrument traps, and the prior agent's flag.

**1. `grep -rlE "'(project_admin|account_admin|super_admin)'" apps/frontend/src | wc -l` is 1 —
UNSATISFIABLE AS WRITTEN, and it is trap #3 (substring match over prose).** It printed **4 at HEAD before
this plan** and **4 after**: `roles.ts` plus three TEST files (`passwordLogin.test.ts`,
`supabaseDataWriter.test.ts`, `adminJobsAuthorization.test.ts`) whose fixtures must name role literals to
build token claims. The gate cannot reach 1 without deleting legitimate fixtures, and it cannot tell a
declaration from a mention. The substantive property is measured instead:

```
grep -rlE "'(project_admin|account_admin|super_admin)'" apps/frontend/src --include='*.ts' \
  --include='*.svelte' | grep -vE '\.test\.ts$'
→ apps/frontend/src/lib/auth/roles.ts        (count = 1)
```

Exactly one **production** declaration, and this plan added zero — the new spec consumes `ADMIN_ROLES` /
`CANDIDATE_ROLES` rather than transcribing them.

**This gate caught a real defect in my own work, which is why it is worth keeping in some form.** My first
draft of `requireAdminIdentity.ts` scored 2 on the production-only count: its docstring contained the
sentence ``Re-spelling `'project_admin' | 'account_admin' | 'super_admin'` in this file would be a third
copy``. A prose mention, in single quotes, indistinguishable to the instrument from a declaration. Reworded
to name no role; count back to 1.

**2. The prior agent's flag on Task 1's `grep -cE 'census|typecheck'` is confirmed** — a bare substring
match over prose that would pass on a document merely mentioning the words. It returned 6, but the
substance it guards (baseline run, exact diff, command, count, 11-row file list) is present in § 3
independently of the gate.

**3. Task 3's `vitest` gate says "fewer than the four behaviour cases are collected" but asserts no count**
— it would pass on a file collecting one case. Not leaned on: the 17 collected cases are enumerated in § 4
by name, and the RED/GREEN pair is what actually establishes the property.

---

## 7. Deviations from Plan

**1. [Rule 2 — missing critical functionality] The gate moved ahead of form parsing, not merely ahead of
the writer.** Described in § 3 with its reasoning and its one observable consequence (a non-admin
submitting a malformed form now gets 403 rather than 400). Driven by the operator's maximum-consistency
principle: it is the only placement at which the two siblings' gate blocks can be byte-identical.

**2. [Rule 1 — bug, in my own test harness] The first RED run was confounded by the harness, and was
re-run.** `new Request(url, { method: 'POST', body: new FormData() })` under jsdom does not derive a
`Content-Type` boundary header, so `request.formData()` rejected the body before either action reached its
own first line — which would have made the red a property of the harness rather than of the gate. Switched
to `URLSearchParams` with an explicit `application/x-www-form-urlencoded` header; the reason is recorded
in the spec at the call site. The confounded run is not the RED reported in § 4. (Incidentally it
corroborated the operator's asymmetry finding: `argument-condensation` surfaced the raw internal message,
`question-info` returned the generic `'Internal server error'`.)

**3. [Rule 3 — blocking] `simple-import-sort` rejected the new import in both actions.** Fixed with
`eslint --fix` on the two files; no logic change.

No architectural changes were needed, so no Rule 4 checkpoint was raised. No packages were installed.

---

## 8. Threat register disposition

| Threat ID | Disposition | Evidence |
|---|---|---|
| T-158-62 (EoP: non-admin invoking either action) | **mitigated** | Gate is the first statement of each action; RED showed the full feature running for a candidate, GREEN shows 403 with `fetch` and the feature both uncalled |
| T-158-63 (Spoofing: role off an unverified token) | **mitigated** | The verifying `safeGetSession()` round trip is the decision's first step; the forged-cookie case asserts `unauthenticated`, not `forbidden` — the claim is never read |
| T-158-64 (Tampering: a third copy of the role names) | **mitigated** | Production declaration count 1; the new spec consumes the declaration; the count caught a prose mention in my own docstring |
| T-158-65 (Info disclosure: transport error in place of an authorization refusal) | **partly mitigated — the remainder is 158-15's** | The *authorization* instance is closed by construction: a non-admin no longer reaches the writer. The leak remains reachable for every OTHER upstream failure (409, 500, network), and the two siblings still disagree about its shape. Recorded in § 5 of the measurement artifact as 158-15's deliverable 3 |
| T-158-66 (Repudiation: fixing an unreproduced mechanism) | **mitigated** | Task 1 measured before anything changed; Task 2 put the arm to a human; the answer is recorded verbatim with the HEAD sha |
| T-158-67 (EoP: the extraction loosening one of the six endpoints) | **mitigated** | Name, parameters and both statuses unchanged and asserted in three spec cases; `adminJobsAuthorization.test.ts` passes unchanged and untouched |
| T-158-SC (supply chain) | **n/a** | No packages installed |

---

## 9. Known Stubs

None. No hardcoded empty value, placeholder string or unwired component was introduced.

---

## 10. Handoff to `158-15`

1. Its starting input is **§ 5 of `158-SWALLOWED-ERROR-MEASUREMENT.md`** — the arm, the answer verbatim,
   and the pointer to the § 3 census.
2. **Deliverable 1 is done and must not be redone**; deliverables 2–4 are 158-15's.
3. **Do not treat the 11-site census as complete work** — it is a floor, and it covers one parser arm.
4. **The internal leak is only partly closed.** § 8 above states exactly which part remains.
5. `requireAdminIdentity` is now the single place a change to what "admin" means can land. A plan that
   adds a seventh admin entry point should call one of the two wrappers, never re-derive the decision.

---

## Self-Check: PASSED

| Claim | Check | Result |
|---|---|---|
| `requireAdminIdentity.ts` | `test -f` | FOUND |
| `requireAdminAction.ts` | `test -f` | FOUND |
| `requireAdminIdentity.test.ts` | `test -f` | FOUND |
| `158-SWALLOWED-ERROR-MEASUREMENT.md` | `test -f` | FOUND |
| RED commit `ccdd97129` | `git log --oneline --all` | FOUND |
| GREEN commit `326c7aa28` | `git log --oneline --all` | FOUND |
| Task 1 commit `f83108a7e` | `git log --oneline --all` | FOUND |
