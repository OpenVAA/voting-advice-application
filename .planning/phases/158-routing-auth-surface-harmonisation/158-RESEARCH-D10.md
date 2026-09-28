# Phase 158 — Research addendum: the D10 widening (criteria 8–13)

**Researched:** 2026-09-01
**Measured at HEAD:** `f7b85a18f` (`integration/ship-12-squash`), working tree clean
**Domain:** SvelteKit server/universal load boundary · Supabase SSR auth · admin route surface · Playwright E2E identity fixtures
**Confidence:** HIGH on the delivered-vs-owed ledger and the analogs (every claim below is a file read at this HEAD); MEDIUM on Q1's "already fixed" verdict (the only end-to-end measurement predates 23 commits — see Q1); MEDIUM on the criterion-12 gate design (no admin E2E exists to extend, so the shape is derived from the code path rather than copied).

---

## Scope note

**This file covers ROADMAP Phase 158 success criteria 8–13 only** — the admin-app restoration folded in by operator ruling **D10** (2026-08-31) and the two items added by the Phase 157.2 code review (2026-09-01, findings **WR-05** and **CR-02**). All of it postdates `158-RESEARCH.md`.

**This file deliberately does NOT cover criteria 1–7.** Those live in `158-RESEARCH.md` (164 KB, 2026-08-28) and its nine plans are being KEPT per decision **B1(a)**. Nothing here re-researches the route locus, the cookie const module, the login collapse or the two markup criteria. Where the admin work touches a file a kept plan also touches, that is recorded in **Q7** as a collision, not as a re-plan.

**Binding inputs, treated as settled and not re-opened:**

- `158-DISCUSSION-POINTS-ADDENDUM.md` — all 18 decisions resolve to their `★ RECOMMENDED` option per the document's own "Fill status" clause. A1(a), A2(a), A3(a), A4(a), A5(a), B1(a), B2(a), B3(a), C1(a)…C7(a), D1(a), D2(a) are **inputs**, not questions.
- `158-CARRIED-OBLIGATIONS.md` — OB-1 … OB-4.
- `158-CONTEXT.md` — G-decisions and the 33-fact baseline.
- `./CLAUDE.md` — in particular the **E2E Hard Rule** (a failing or flaky E2E test is a cardinal failure; no "known-flaky" exemptions, no retry-until-green) and the **Context Destructuring Rule**.

**Anchoring convention, per OB-4 and decision C1(a):** every reference to `apps/frontend/src/hooks.server.ts` below cites an **expression**, never a line number. The file has drifted four times in eight days. For other files symbols are preferred; where a line number appears it is stated as measured at HEAD `f7b85a18f`.

---

## Delivered-vs-owed ledger

The single most expensive way to plan this phase wrong is to re-do work 157.2 already did. The roadmap has already had to be corrected once for exactly this (criterion 8's 403 half). This table is the corrective.

| # | Criterion | Already delivered (commit) | Still owed by 158 | Evidence at HEAD `f7b85a18f` |
|---|---|---|---|---|
| **8** | The admin app works again | **Both halves appear delivered.** 403 half: `889b7d6ad` (CR-01) — six `/api/admin/jobs/**` routes now call `requireVerifiedAdmin`, and `_getBasicUserData` does a verifying `getUser()` **first**. Universal-load half: `157.2-02`/`03`/`04` — the root load supplies a cookie-bearing client on the SSR pass and the factories take it explicitly | **The PROOF, not a code change** — a durable regression test (= criterion 11) plus a fresh re-measurement at this HEAD. See Q1 for the caveat that makes this MEDIUM rather than HIGH | `routes/admin/(protected)/+layout.ts:15-36` (universal load, `await parent()` → `supabaseClient`); `routes/+layout.ts:21` (`createSupabaseUniversalClient` from `data.supabaseCookies`); `lib/server/admin/requireVerifiedAdmin.ts`; `157.2-09-SUMMARY.md:267-272` (manual observation: 200 on direct entry, 200 on refresh, 200 on both jobs routes, 307/403 unauthenticated) |
| **9** | `/admin` gated + admin form actions role-checked | **The 500 is gone.** `157.2-06` + `bc7a884c7` — both actions now `safeGetSession()` → `fail(401)` before any writer call, and build their writer from `{ fetch, locals }` | **(a) The `/admin` gate in `hooks.server.ts` is still entirely missing.** **(b) The role check is still missing and is now a LIVE privilege gap** (see Q3 — the outage used to mask it) | `hooks.server.ts`: the only app test in `candidateAuthHandle` is `pathname.includes('/candidate')`; no `/admin` arm exists. `routes/admin/(protected)/argument-condensation/+page.server.ts:24-36` and `question-info/+page.server.ts:49-61`: session check, then `startJob` — no role test anywhere between |
| **10** | `/api/auth/login` deleted | **Fully delivered.** `157.2-04` (per OB-2) | **Verification only.** Confirm the route is absent and no caller reappeared | `find routes/api` → only `routes/api/auth/logout/+server.ts`. `grep -rn "auth/login" apps packages tests --exclude-dir=node_modules` excluding the two live login pages → **0 hits**. The two doc-comments at `candidate/login/+page.server.ts:1-5` and `admin/login/+page.server.ts:1-5` were already generalised to "a nested API route" and name nothing. `lib/api/base/universalApiRoutes.ts` carries no login entry |
| **11** | First admin E2E coverage | **Nothing.** `git diff --name-only` for 157.2 under `tests/` is empty by design (`157.2-09-SUMMARY.md`) | **All of it.** One spec + an admin identity fixture + a Playwright project + a teardown | `grep -rln "/admin" tests/tests/specs/` → **0 files**. Addendum fact 10 still holds |
| **12** | Admin job credential lifetime | **Markers only.** `c89448481` (WR-05) — a `// reason:` at each capture site naming both failure modes and the remedy. **The mechanism change is untouched** | **All of it**, plus its prerequisite gate | `lib/server/admin/features/condenseArguments.ts:44-50` carries the marker and still does `createAdminWriter(source)` where `source = { fetch, locals }`; `generateQuestionInfo.ts` is the byte-identical sibling. `grep -rn 'refreshSession\|refresh_token' lib/server/admin routes/admin` → empty, which is the state `157.2-06`'s prohibition asked for |
| **13** | No server load serialises a refresh token | **Root load only.** `e019007de` (CR-02) — `routes/+layout.server.ts` now returns `{ supabaseCookies }` and nothing else, and is no longer `async` | **The two subtree loads**, plus the durable assertion | `routes/admin/+layout.server.ts:7-9` and `routes/candidate/+layout.server.ts:7-9` are byte-identical two-line loads returning the whole `Session`. Consumer census below is complete at **two** |

**Headline for the planner:** of the six criteria, **two (8 and 10) are verification-only**, one (**9**) is half done with the remaining half now more urgent than the roadmap describes, and three (**11, 12, 13**) are real work. The admin wave is smaller than the roadmap text implies, but criterion 11 is on the critical path for criterion 12 and therefore cannot be trimmed.

---

## Where the addendum has gone stale

The addendum's 12 facts were measured at `7a164a03a`, before Phase 157.2's nine plans, its 20 review fixes and the two docs commits. Re-measured at `f7b85a18f`:

| Fact | Status at HEAD | Correction |
|---|---|---|
| **1** — hooks anchors at `:66` / `:76` / `:81` | **STALE (fourth drift)** | `const { url, route } = event;` is at `:80`, `pathname.includes('/candidate')` at `:90`, `route.id.includes('(protected)')` at `:95`. Cause: 157.1's `resolveLogLevel` / `configureLogger` block. **Do not record the new numbers as guidance** — cite the expressions (C1(a), OB-4) |
| **2** — the two hand-built redirects at `:79` / `:83` | **STALE** | Now `:93` (`redirect(303, \`/${locale}/candidate\`)`) and `:97` (`redirect(303, \`/${locale}/candidate/login?redirectTo=…\`)`). Cite them as *the two `redirect(303, …)` template literals inside `candidateAuthHandle`* |
| **3** — `lib/server/api/dataProvider.ts:12` is the `default:` arm | **HOLDS** | Verified: `switch (type) { case 'local': … default: module = Promise.resolve({}); }`, `default:` at `:12` |
| **4** — three breakages, incl. the form actions returning **500** | **STALE in all three parts** | (a) The `(protected)` layout bounce: not reproducible by inspection and measured 200/200 by `157.2-09` — see Q1. (b) The six jobs routes: fixed by CR-01. (c) **The 500 is gone** — both actions now `safeGetSession()` and `fail(401)` before the writer call. What replaces it is a *missing role check on a working action*, which is strictly worse in security terms than a 500 |
| **5** — only 2 of 17 adapter `init()` sites pass `serverClient` | **VOID** | There are **no `init()` sites left**. `157.2-07`/`08` deleted `init` from the base and the mixin. `grep -rn '\.init(' lib/api routes/` returns one unrelated hit (`candidate/(protected)/+layout.svelte:120`, a `userData.init(snapshot)` call). The whole "plain-`createClient` branch" the fact describes no longer exists — `resolveAdapterConfig` has three named arms and **throws** on a fourth |
| **6** — `admin/+layout.server.ts` supplies `session` so the `parent` guard passes | **HOLDS** — and is exactly what criterion 13 narrows | `routes/admin/+layout.server.ts:7-9` |
| **7** — no `export const ssr = false` under `routes/admin/` | **HOLDS** | `grep -rn "export const ssr" routes/` → 2 hits, both under `candidate/preregister` and `candidate/register` |
| **8** — `/api/auth/login` has zero callers | **SUPERSEDED** | The route is deleted (OB-2). The two doc-comments no longer name it |
| **9** — the 400/403 oracle | **MOOT** | Deleted with the route |
| **10** — zero E2E specs navigate to `/admin` | **HOLDS** | Re-measured: `grep -rln "/admin" tests/tests/specs/` → 0 files |
| **11** — `EDGE-RT-03-unclassified` is benign | **HOLDS** (planning artifact, untouched) | Resolved by B3(a) |
| **12** — none of the 9 plans touches `routes/admin/**`, `routes/api/admin/**` or `api/auth/login` | **STALE in its third clause** | **`158-05-PLAN.md` lists `apps/frontend/src/routes/api/auth/login/+server.ts` in `files_modified` and references it at `:123`, `:163`, `:256`, `:259`, `:307`; `158-08-PLAN.md` reads it at `:97`.** Both plan against a file that no longer exists. B1(a)'s "amend only `158-09`" is therefore **insufficient** — see Q7 |

**One further stale anchor inside a kept plan, worth recording under OB-4:** `158-01-PLAN.md:207` says *"`apps/frontend/src/hooks.server.ts` (whole file, 88 lines)"* and `:215-217` instructs the executor to confirm `const { url, route } = event;` "at line 59". The file is **109 lines** at HEAD and the expression is at `:80`. The plan's own `RE-MEASURE FIRST` instruction covers the drift operationally, but the numbers should be struck rather than left to be re-derived a fifth time.

---

## Q1 — Criterion 8, the universal-load half

### What the code says

`routes/admin/(protected)/+layout.ts` is a universal load with no `ssr = false` anywhere under `routes/admin/` (addendum fact 7, re-verified). On direct entry and on refresh it runs **on the server**. Its chain at HEAD:

1. `const { supabaseClient } = await parent()` (`:17`). `parent()` merges the root `+layout.ts` return, which contains `supabaseClient` built at `routes/+layout.ts:21` by `createSupabaseUniversalClient({ fetch, cookies: data.supabaseCookies })`. On the SSR pass `isBrowser()` is false, so that is a real `createServerClient` over `{ getAll: () => cookies }` — the request's own `sb-<ref>-auth-token` cookies, filtered by `SUPABASE_COOKIE_PREFIX` at `routes/+layout.server.ts:33-35`.
2. `parent()` also merges `routes/admin/+layout.server.ts`'s `{ session }` from `locals.safeGetSession()`, so `getUserData`'s `parent`-based pre-check (`lib/auth/getUserData.ts:36-39`) passes for an authenticated admin.
3. `getUserData({ fetch, client: supabaseClient }, { parent })` (`:20`) → `createDataWriter(source)` → `_getBasicUserData` (`supabaseDataWriter.ts:166`), which now does the **verifying** `getUser()` first and only then reads `user_roles` off the verified access token.
4. `userData.role === 'admin'` → the load returns `{ userData }` and **does not redirect**.

Every link in that chain carries a request-scoped, cookie-bearing client. There is no remaining path to the anonymous `createClient` ruling D10 describes — `resolveAdapterConfig` (`lib/api/dataProvider.ts:59-67`) has three named arms and **throws** rather than falling through.

### What was measured, and by whom

`157.2-09-SUMMARY.md` § *"The manual observation decision A2(a) assigns here"* records a real end-to-end run against the local stack with a temporary `super_admin` (auth admin API + one `user_roles` row, both deleted afterwards, leftover counts verified 0):

| Observation | Result |
|---|---|
| Unauthenticated `GET /admin` | 307 → `/admin/login?errorMessage=loginFailed` |
| Login via the admin form action | 200, `{"type":"redirect","status":303,"location":".../admin"}`, session cookie set |
| **Authenticated direct entry, `GET /admin`** | **200**, 203 522 bytes, zero login-redirect markers in the SSR HTML |
| **Refresh, the same `GET /admin`** | **200**, byte-identical size |
| Refresh of a nested protected route, `GET /admin/jobs` | 200 |
| `GET /api/admin/jobs/{active,past}` authenticated | 200, body `[]` |
| The same two unauthenticated | 403 `{"error":"Forbidden"}` |

Note `/admin` **is** the protected page: `(protected)` is a route group, so `routes/admin/(protected)/+page.svelte` serves `/admin`. The observation therefore exercised `admin/(protected)/+layout.ts` exactly.

### The caveat that keeps this MEDIUM

That observation was taken at `4925f2e81`. HEAD is **23 commits later**, and two of them touch this precise path:

- `889b7d6ad` (CR-01) reordered `_getBasicUserData` to `getUser()` → `getSession()` → decode, and inserted `requireVerifiedAdmin` in front of all six endpoints.
- `bc7a884c7` (IN-06) changed `getUserData`'s signature from `AdapterSource & { parent? }` to `(source, { parent })`, and `admin/(protected)/+layout.ts:20` was updated with it.

Neither change can plausibly *break* the path for a genuine admin — both make the check stricter on the same client — but neither has been observed end to end.

### Recommendation (plannable)

**Criterion 8 is a VERIFY-then-TEST item, not a code-change item.** Plan it as:

1. **Task: re-measure at the phase's own HEAD** using the same method `157.2-09` used (create a temporary `project_admin`/`super_admin` via the auth admin API + one `user_roles` row against `TEST_PROJECT_ID`, log in through the real `/admin/login` form action, `curl` the four observations, delete the account and assert leftover counts are 0). Record the table verbatim. This costs minutes.
2. **If it reproduces green** (expected): criterion 8's remaining debt is discharged by criterion 11's spec, which makes the observation durable. Record the ledger row as *delivered upstream, proven here*.
3. **If it does NOT reproduce**: the plan must then diagnose, and the most likely culprits are the two commits named above — start there, not at the adapter.

**Do not write a code change speculatively.** There is no defect visible in the tree, and a change made against an unreproduced bug is unverifiable.

---

## Q2 — OB-1: the two serialised admin loads

### The exact (a+) implementation to copy

The analog landed in `157.2-03` and is `apps/frontend/src/routes/(voters)/(located)/+layout.server.ts` — 26 lines, of which 8 are code:

```ts
import { SUPABASE_COOKIE_PREFIX } from '$lib/api/dataProvider';
import type { UniversalCookie } from '$lib/api/dataProvider';

export async function load({ cookies }) {
  // ⚠ THE FILTER BELOW IS A DATA-PROTECTION BOUNDARY, NOT A TIDINESS MEASURE …
  const requestCookies = cookies.getAll();
  const supabaseCookies: Array<UniversalCookie> = requestCookies
    .filter(({ name }) => name.startsWith(SUPABASE_COOKIE_PREFIX))
    .map(({ name, value }) => ({ name, value }));

  return { supabaseCookies };
}
```

and its consumer half at `routes/(voters)/(located)/+layout.ts:99-100`:

```ts
const supabaseClient = createSupabaseUniversalClient({ fetch, cookies: data.supabaseCookies });
const dataProvider = createDataProvider({ fetch, client: supabaseClient });
```

— i.e. the load takes `data` (its OWN server load's return, available synchronously) instead of `await parent()`, which is what restores parallelism.

Applied to the two admin loads, `argument-condensation/+layout.ts:7-12` and `question-info/+layout.ts:7-12` (currently byte-identical to each other) become:

```ts
export async function load({ data, fetch }) {
  const lang = getLocale();
  const supabaseClient = createSupabaseUniversalClient({ fetch, cookies: data.supabaseCookies });
  const dataProvider = createDataProvider({ fetch, client: supabaseClient });
  return { questionData: dataProvider.getQuestionData({ locale: lang }).catch((e) => e) };
}
```

**Note the two loads are byte-identical today** (verified by inspection at HEAD). If one is changed the other must be, or the phase ships two idioms for the same problem.

### Where `SUPABASE_COOKIE_PREFIX` lives and how the array is derived

- **Definition:** `apps/frontend/src/lib/supabase/universal.ts:35` — `export const SUPABASE_COOKIE_PREFIX = resolveSupabaseCookiePrefix(constants.PUBLIC_SUPABASE_URL);`
- **Derivation:** `resolveSupabaseCookiePrefix` (`universal.ts:16-22`) returns `` `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token` ``, transcribed from `@supabase/supabase-js@2.99.3`'s default storage key. It **never throws** (both callers evaluate it at module scope); on an unparseable URL it degrades to the wider `'sb-'`.
- **The import path a route must use:** `$lib/api/dataProvider`, **not** `$lib/supabase/universal`. The adapter-boundary ESLint guard's `no-restricted-imports` pattern `^\$lib/(supabase|api/adapters)(/|$)` bans the direct path at every route. `lib/api/dataProvider.ts:8-9` re-exports both `SUPABASE_COOKIE_PREFIX` and `UniversalCookie` for exactly this reason, and the rationale is written out at `dataProvider.ts:7`.
- **Allowlist:** the two new files need **no** `ADAPTER_BOUNDARY_ALLOWLIST` entry. `routes/(voters)/(located)/+layout.server.ts` is not on the list and passes — the guard fires on `.supabase` member access and on the banned import paths, and this shape does neither.

**The prohibition OB-1 states, restated in operational terms:** never write `.filter(({ name }) => name.startsWith('sb-'))`. An empty cookie array produces an **anonymous client that raises no error** — the exact fail-open shape D10 blames — and a literal that stops matching after a `cookieOptions.name` change would compile, lint and run while silently emptying the array. The constant is what makes such a rename break loudly at one place.

### Discharging the `httpOnly` prohibition by observation

There is **no existing "the SSR payload carries no `httpOnly` cookie value" test anywhere in the tree.** The nearest artefacts are:

- `apps/frontend/src/lib/supabase/server.test.ts` (79 lines, added by `91dce36cc`/CR-03) — asserts the *write* side: a cookie whose incoming options say `httpOnly: true` is still written `false`, and that the prefix rejects `sb-feature-flags`. It does **not** touch the payload.
- `routes/(voters)/(located)/layout.load.test.ts` — the only in-tree precedent for driving a route `load` directly in vitest. ⚠ It mocks `$lib/api/dataProvider` as `{ dataProvider: Promise.resolve({ init, … }) }`, a shape that no longer exists after `157.2-07`/`08`; **copy its harness, not its mock.**

**Recommendation — do both halves, because they prove different things:**

1. **Unit half (fast, deterministic, per new server load).** Call `load({ cookies })` with a fake jar containing all four app cookies (`id_token`, `oidc_state`, `oidc_nonce`, `oidc_code_verifier`), one `sb-<ref>-auth-token` sentinel, and one decoy `sb-feature-flags`. Assert the returned array contains **exactly** the sentinel. Follow `server.test.ts`'s shape. This asserts the FILTER.
2. **Render half (discharges OB-1's wording literally).** Inside criterion 11's admin spec, seed the browser context with the four `httpOnly`-class cookie names carrying uniquely-recognisable values plus the real `sb-` session cookies, load the admin page, read `await page.content()`, and assert: **none of the four values appears**, and **an `sb-`-prefixed name does appear**. The sentinel is the positive control — without it a payload that carries nothing at all passes trivially, which is the vacuity failure `scripts/assert-adapter-casts.mjs` § "Check 0" was written to prevent.

### Can the WCAG focus failure bite on the admin side?

**No — not in the same form, and the reason is itself a finding.**

The voter-side failure (NAVA11Y-02, `a11y-smoke.spec.ts:300`) works like this: `routes/+layout.svelte`'s `afterNavigate` sets focus inside a **single** `requestAnimationFrame` with no retry, targeting `document.querySelector('[data-focus-on-nav]') ?? document.querySelector('h1')`. Serialising a nested load behind the root's Supabase round-trips means the `<h1>` has not mounted when that one frame fires, so focus is left on `<body>`.

Measured at HEAD: `grep -rn "data-focus-on-nav|<h1" routes/admin/ lib/admin/` returns **exactly one hit — `routes/admin/login/+page.svelte:78`**. There is **no `<h1>` and no `[data-focus-on-nav]` anywhere under `routes/admin/(protected)/`**. The focus reset is therefore already a no-op on every protected admin route, serialised or not. Serialisation cannot produce the NAVA11Y-02 symptom there because the symptom requires a target that never exists.

Two consequences for the planner:

- **For OB-1:** the case *against* option (ii) ("the spec would test the path most likely to expose the latency") is weaker on the admin side than the obligation's text implies — there is no focus assertion to break. The case *for* (i) rests on latency and on not shipping two idioms for the same problem, which is still sufficient. **Recommend (i)**, as the operator ruled.
- **Separately, and out of scope:** the admin protected surface has **no page heading at all**, so keyboard and screen-reader users get no focus target on any admin navigation. CLAUDE.md requires WCAG 2.1 AA. This is a real, currently unmeasured a11y gap in a surface with zero a11y coverage. It is **not** one of criteria 8–13 and should be **filed as a todo**, not folded in — folding it would put markup design into a phase about auth surfaces.

---

## Q3 — Criterion 9, the `/admin` gate and the role check

### Current state, measured at HEAD

`hooks.server.ts` exports `handle = sequence(supabaseHandle, paraglideHandle, candidateAuthHandle)`. Inside `candidateAuthHandle`:

- `const { url, route } = event;` puts `route` in scope.
- an early return on `route?.id == null || pathname.startsWith(NORMALIZED_API_ROOT)`.
- one app arm, guarded by `pathname.includes('/candidate')`, containing two redirects: `session && pathname.endsWith('candidate/login')` → bounce to the app home; `!session && route.id.includes('(protected)')` → bounce to login with `?redirectTo=`.

There is **no `/admin` arm of any kind.**

### How criterion 4 and criterion 9 compose into ONE rewrite

They do not collide if — and only if — they are sequenced and shaped as follows.

`158-01-PLAN.md` (wave 1, `autonomous: false`) already owns `hooks.server.ts` and already commits to:

- creating `$lib/routes/` exporting `buildRoute`, `ROUTE`, `safeRedirectTarget`, `PROTECTED_GROUP`, **`isCandidateRoute`** and **`isProtectedRoute`** from one barrel (`must_haves.truths[0]`);
- making the hook "decide whether a request is a Candidate-App request from `route.id` alone, never from `url.pathname`" (`truths[2]`);
- routing both redirects through `buildRoute` (`truths[5]`).

So after `158-01`, `candidateAuthHandle` is already a route-id-keyed function whose per-app knowledge is two predicates and two `buildRoute` calls. **The admin plan's edit is then ADDITIVE, not a second rewrite:** generalise the two predicates into one table and add the `/admin` row.

Concretely, the shape the admin plan should land (expressed against the file's own expressions, not lines):

```ts
// in $lib/routes/ — one table, one definition, alongside isCandidateRoute / isProtectedRoute
const APP_GATES = [
  { isRoute: isCandidateRoute, loginRoute: 'CandAppLogin',  homeRoute: 'CandAppHome'  },
  { isRoute: isAdminRoute,     loginRoute: 'AdminAppLogin', homeRoute: 'AdminAppHome' }
] as const;
```

and the hook becomes one loop over `APP_GATES`, replacing the single `pathname.includes('/candidate')` arm. The `(protected)` test stays `isProtectedRoute(route.id)` — it is already shared, because both apps use the same `(protected)` group name (`routes/candidate/(protected)/`, `routes/admin/(protected)/`).

**Sequencing requirement:** the admin plan must depend on `158-01`. B2(a)'s placement (new wave after `158-06`, before the `158-09` gate) satisfies that with margin. If instead the two edits were planned in the same wave they would collide on the same function, which is exactly what B2(b) was rejected for.

**Two shape details the planner must not miss:**

1. **The two apps' redirect shapes differ.** Candidate: `303` + `?redirectTo=<cleanPath>`. Admin's existing bounce (in the protected *layout*, not the hook) is `307` + `?errorMessage=loginFailed` (`admin/(protected)/+layout.ts:24-31`, via `buildRoute({ route: 'AdminAppLogin', errorMessage: 'loginFailed' })`). The table must carry the per-app redirect shape or the admin gate will silently change the admin login page's error rendering. Preserving `errorMessage: 'loginFailed'` for the hook-level bounce is the conservative choice; changing it is a UI behaviour change nobody asked for.
2. **The hook gate is a SESSION gate, not a role gate.** A3(a) says "keyed on route id". The role decision stays where it is — `admin/(protected)/+layout.ts:34` (`if (userData.role !== 'admin') return await handleError('userNotAuthorized')`) and, newly, the form actions. Putting a role check in the hook would require a `getUserData` round-trip on every admin request and would duplicate a decision the layout already makes. **Do not over-scope the hook.**

### The form-action role check — and the fact that it is now a LIVE privilege gap

Addendum fact 4(c) is stale (see the staleness table). Re-measured at HEAD, both admin form actions read:

```ts
const { session } = await locals.safeGetSession();
if (!session) return fail(401, { type: 'error', error: 'Authentication required' });
const dataWriter = createDataWriter({ fetch, locals });
const { email } = await dataWriter.getBasicUserData();
const jobInfo = await dataWriter.startJob({ feature: …, author: email });
```
(`argument-condensation/+page.server.ts:24-36`, `question-info/+page.server.ts:49-61`)

The **500 no longer reproduces** — the writer now carries the request's own cookie-bearing client, so `getBasicUserData()` resolves. What that means:

> **Any authenticated user — a candidate, an organization user, anyone with a valid Supabase session — can now POST these two form actions and start an LLM job.** The check is `if (!session)`. There is no role test between it and `startJob`. `getBasicUserData()` returns `role: 'candidate'` for such a user without objection, and its `email` is written into the `admin_jobs.author` column.

This was **latent before 157.2** because the outage made the action 500 before it could do anything. 157.2 correctly fixed the outage; the privilege gap it uncovered is criterion 9's, and A2(a) already assigns it here. The eventual DB writes are re-checked by RLS (`admin_insert_admin_jobs`, `merge_question_custom_data`), so the *writes* fail — but only **after** the OpenAI spend and after the in-memory job store has been populated. That is the identical consequence chain the CR-01 review documented for the six endpoints, and it now lives on the two form actions.

**Recommendation:** treat criterion 9's role-check half as the **highest-urgency item in the admin wave**, and reuse the predicate criterion 5 is already creating. `158-05-PLAN.md` creates `apps/frontend/src/lib/auth/roles.ts` and extracts the permissions mapping from `admin/login/+page.server.ts`. The mapping is the array `['project_admin', 'account_admin', 'super_admin']`, which today exists in **two hand-written copies**:

- `routes/admin/login/+page.server.ts:40` — `userRoles.some((r) => [...].includes(r.role))`
- `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` inside `_getBasicUserData` — the `else if` arm that sets `role = 'admin'`

The form-action check should be the third consumer of the **one** `roles.ts` predicate, not a third copy — and the cleanest form is a `requireVerifiedAdmin`-shaped helper. **`lib/server/admin/requireVerifiedAdmin.ts` already exists** (landed by CR-01) and does exactly the right two steps for endpoints: `safeGetSession()` → 401, then `getUserData({ fetch, locals })?.role !== 'admin'` → 403. The form-action variant differs only in returning `fail(401)`/`fail(403)` instead of `json(...)`. Extract the decision, keep two thin response wrappers, and the gate is honest in all eight places at once.

**Dependency this creates:** the admin plan carrying the role check depends on **`158-05`** (which creates `lib/auth/roles.ts`). `158-05` is wave 2; B2(a)'s placement is after wave 4. Satisfied.

---

## Q4 — Criterion 11, the first admin E2E spec

Decision A5(a) is binding: **one spec** — log in as an admin, land on `admin/(protected)`, **reload the page**, and call one `/api/admin/jobs/*` route expecting non-403.

### Does `e2e/base` seed an admin identity? — MEASURED: NO, and it structurally cannot

The addendum flagged this as unmeasured and handed it to research. The answer:

- `grep -rn "user_roles|project_admin|super_admin|account_admin" packages/dev-seed/src/` → **zero hits.** dev-seed writes no roles of any kind.
- `packages/dev-seed/src/template/permittedKeys.ts` enumerates **twelve** snake_case collections a template may author rows for. **`user_roles` is not among them**, and `accounts`/`projects` are explicitly excluded because `seed.sql` bootstraps them. A template cannot express a role assignment.
- The convention is documented in `tests/tests/utils/testCredentials.ts:8-14`: *"The `candidates` table has NO email column, so a base candidate is not 'registered' by the seed — the seed only creates the candidate row. **Registration is a RUNTIME act**."*

So the minimal correct way to add an admin identity is a **runtime act in a Playwright setup project**, mirroring `forceRegister` exactly.

### What an admin identity requires

From `apps/supabase/supabase/migrations/00001_initial_schema.sql`:

- `user_role_type` enum: `'candidate' | 'organization' | 'project_admin' | 'account_admin' | 'super_admin'` (`:21-23`)
- `role_scope_type` enum: `'candidate' | 'organization' | 'project' | 'account' | 'global'` (`:25-27`)
- `custom_access_token_hook` (`:1194-1220`) reads `public.user_roles` for the user on **every token issue/refresh** and injects `claims.user_roles` as `[{ role, scope_type, scope_id }]`. This is what makes `_getBasicUserData`'s decode work.

So the identity is: **one auth user + one `user_roles` row** with `role = 'project_admin'`, `scope_type = 'project'`, `scope_id = TEST_PROJECT_ID`. **No candidate row, no `auth_user_id` link.** `TEST_PROJECT_ID` is `'00000000-0000-0000-0000-000000000001'` (`packages/dev-seed/src/supabaseAdminClient.ts:26`), bootstrapped by `seed.sql` and never torn down.

This is precisely `forceRegister` (`tests/tests/utils/supabaseAdminClient.ts:303-345`) minus its steps 2 and 4. The new helper is roughly **20 lines**:

```ts
// tests/tests/utils/supabaseAdminClient.ts — sibling of forceRegister
async forceRegisterAdmin(email: string, password: string): Promise<void> {
  const { data, error } = await this.client.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`forceRegisterAdmin: createUser failed: ${error.message}`);
  try {
    const { error: roleError } = await this.client.from('user_roles').insert({
      user_id: data.user.id, role: 'project_admin', scope_type: 'project', scope_id: this.projectId
    });
    if (roleError) throw new Error(`forceRegisterAdmin: insert user_role failed: ${roleError.message}`);
  } catch (e) { await this.client.auth.admin.deleteUser(data.user.id).catch(() => {}); throw e; }
}
```
The compensating-rollback shape is copied verbatim from `forceRegister:343-352`, and it matters for the same reason: without it a partial failure leaves an orphan auth user that surfaces as `"User already exists"` on every subsequent run — the exact class `project_perm_teardown_leaks_auth_users` records as having been fixed once already.

`unregisterCandidate(email)` (`:437-455`) deletes the auth user **and** its `user_roles` rows, so it works unmodified as the idempotency pre-clear and as the teardown. **Verify this by reading it** rather than assuming: it deletes `user_roles` by `user_id` and clears `candidates.auth_user_id`; the latter is a harmless no-op for an admin with no candidate row.

### The closest analogs to copy

| New artifact | Copy from | Why |
|---|---|---|
| `tests/tests/setup/admin/admin-auth.setup.ts` | **`tests/tests/setup/shared/auth.setup.ts`** (81 lines) | The exact same job for the candidate: `unregisterCandidate` → `forceRegister` → navigate → fill the real login form → `page.context().storageState({ path })`. Its docstring at `:47` states the load-bearing constraint: *"synthetic tokens fail server-side `safeGetSession()` JWT validation, so only a real Supabase-minted session survives the protected candidate layout."* That is doubly true for admin — `_getBasicUserData` now does a verifying `getUser()` round-trip. **Log in through the real `/admin/login` form action; do not mint a cookie.** |
| `tests/tests/utils/adminCredentials.ts` | **`tests/tests/utils/testCredentials.ts`** (27 lines) | Self-contained literals, never derived from a template at module load — that derivation crashed every consumer once when the source template was retired (`testCredentials.ts:6`). Same `@test.openvaa.local` domain, same `Password1!` posture |
| The Playwright project | **`candidate-a11y-scan`** (`playwright.config.ts:325-330`) | The only default-on project that consumes a stored session: `use: { …devices['Desktop Chrome'], storageState: STORAGE_STATE }`, `dependencies: ['data-setup-base', 'auth-setup']`, and an **explicit `testMatch`**. The config's own comment at `:313` explains why the explicit `testMatch` is not bookkeeping: without it a project collects a sibling spec and runs it **without** the stored session, and *"every candidate route would 307 to the login form, and the scan would report a clean zero about a login page. That is the one direction in which this wiring can be silently wrong AND green."* The admin spec is in the identical position |
| The teardown | **`tests/tests/setup/candidate/candidate-journey.teardown.ts`** + `assertTeardown.ts` | `runTeardownAsserted` turns before/after row counts into a hard assertion, and the config comment at `:104` warns that this is only valid if each teardown project owns an `external_id` prefix no other project touches. The admin teardown owns **no seeded rows** — it owns an auth user and a `user_roles` row — so it must not be wired into the prefix-counting machinery; it deletes by email. See the `admin_jobs` residue note in Hazards |
| The spec | **`tests/tests/specs/candidate/candidate-journey.spec.ts`** for structure; there is **no** admin analog | Zero admin specs exist. This is new ground; say so in the plan |

### How to assert the reload so it genuinely exercises the cold path

The failure mode being guarded against is: a warm client-side navigation re-runs the universal load **in the browser**, where `createSupabaseUniversalClient` returns the browser client and the session is present regardless. Only a **server-rendered** entry exercises the path criterion 8 is about. Three requirements, all necessary:

1. **`page.goto(adminHome)` as a fresh document load**, not a click-through from another route. A `goto` to a different origin-path always produces a server render on first entry.
2. **`page.reload()`** — Playwright's reload is a real browser reload and produces a new SSR request. Assert **after** it, on content that only exists past the auth gate (e.g. the admin feature nav, or `data.userData`-derived text), never on the URL alone: `admin/(protected)/+layout.ts` redirects with **307**, which Playwright follows silently, so a URL assertion that passes on `/admin` would also pass on a redirect chain that landed back on `/admin` — but a `waitForURL(/login/)` negative assertion plus a positive content assertion together cannot both be satisfied by the failure.
3. **Assert the absence of the login form explicitly**, mirroring `147-03`'s reach-proof discipline: *"settled URL asserted inside `/candidate` and asserted **not** `/candidate/login`"*. Without the negative half, a scan of a login page reports a confident zero.

For the API half, use Playwright's `page.request.get('/api/admin/jobs/active')` — it inherits the browser context's cookies — and assert `status()` is not 403 **and** is 200, with `body` parseable as an array. `403` and `401` are different failures (`requireVerifiedAdmin` returns 401 for no session, 403 for a non-admin), and distinguishing them in the assertion message will save a debugging cycle.

### Recommendation (plannable)

One new spec file `tests/tests/specs/admin/admin-access.spec.ts` with **one** test, one setup project, one teardown project, one credentials module, one `forceRegisterAdmin` helper. Fold the OB-1 render-level `httpOnly` observation (Q2) into the same spec as a second assertion inside the same test, so the phase adds **one** test to the suite count, not three.

---

## Q5 — Criterion 12, admin job credential lifetime

### The markers (found)

`apps/frontend/src/lib/server/admin/features/condenseArguments.ts:44-50`, immediately above `const adminWriter = createAdminWriter(source);`. Eight lines of `// reason:` naming: the coupling (`source` carries `event.fetch` and `event.locals.supabase`, held for the job's whole multi-minute duration); failure mode 1 (Render's 100 s gateway default vs. a `Set-Cookie` on a response generated at job end); failure mode 2 (`@sveltejs/kit` replacing `event.cookies.set` with a thrower once the response is generated); and the remedy verbatim — *"resolve the verified session once at job start and build the job's client from its tokens with `persistSession: false`, `autoRefreshToken: false` and a plain `fetch`, so no cookie write is ever attempted."*

`generateQuestionInfo.ts` carries the byte-identical marker at its own `createAdminWriter(source)` site. Both were landed by `c89448481`. **The mechanism is untouched.**

### The entry points and the write path

```
routes/admin/(protected)/argument-condensation/+page.server.ts   actions.default
  → safeGetSession() → fail(401)                                  [session, no role check — Q3]
  → createDataWriter({ fetch, locals })  → getBasicUserData()      [action's own writer]
  → dataWriter.startJob({ feature, author: email })                [in-memory job store]
  → condenseArguments({ …, source: { fetch, locals }, jobId })     [AWAITED INLINE — :39]
       → createAdminWriter(source)                            ← THE SITE criterion 12 changes
       → createJobRecorder({ …, adminWriter, … })
       → loadElectionData({ electionId, locale, source })          [real reads]
       → dataRoot.getQuestion(id) for each questionId              [THROWS if not found]
       → getLLMProvider()                                          [THROWS if LLM_OPENAI_API_KEY unset]
       → handleQuestion(…) per question → adminWriter.updateQuestion(…)   [real DB writes]
       → jobRecord.recordCompletion(…) | recordFailure(…)
            → adminWriter.insertJobResult(…)                       [real DB write to admin_jobs]
```

`question-info/+page.server.ts` → `generateQuestionInfo` is the same shape.

`SupabaseAdminWriter` has exactly three write methods (`supabaseAdminWriter.ts`): `updateQuestion` (`:58`, RPC `merge_question_custom_data`), `insertJobResult` (`:74`, insert into `public.admin_jobs`, resolving `project_id` from `elections`), and `sendEmail`. So "the admin LLM write path" is concretely: **the job-owned `AdminWriter`'s `updateQuestion` and `insertJobResult` calls, executing under the initiating admin's credentials against RLS.**

### What "a gate exercising the admin LLM write path" can concretely mean

`getLLMProvider()` (`lib/server/llm/llmProvider.ts:7-19`) constructs a real OpenAI client from `constants.LLM_OPENAI_API_KEY` and throws if unset. `handleQuestion` then makes real, paid, non-deterministic network calls. **An E2E spec must not drive the completion path.** CLAUDE.md's E2E Hard Rule forbids flakiness, and an LLM round-trip is the definition of it.

Three viable gates, measured against the code:

| Gate | Reaches `createAdminWriter(source)` | Reaches a real DB write | Deterministic | Cost |
|---|---|---|---|---|
| **(A) E2E failure-path POST.** Post the form with a valid `electionId` and a **non-existent** `questionIds` value. `dataRoot.getQuestion(id)` **throws** — `packages/data/src/root/dataRoot.ts:388-390` delegates to `getChild`, documented `@throws If the object is not found` — the catch calls `jobRecord.recordFailure(error)` → `adminWriter.insertJobResult({ … endStatus: 'failed' })`, a real RLS-checked insert into `admin_jobs` | ✅ | ✅ (`admin_jobs` insert) | ✅ (no LLM reached — `getLLMProvider()` is at `:137`, **after** the throw) | one form POST |
| **(B) Vitest, the `adminJobLifetime.test.ts` shape.** Extend the existing file: it already mocks `loadElectionData` (park-then-reject), `$lib/api/adminWriter`, `../jobs/jobStore`, `../jobs/pipelineController`, `../../llm/llmProvider`, `@openvaa/argument-condensation` and `@openvaa/question-info`, and observes at `insertJobResult` on the error path | ✅ | ❌ (faked) | ✅ | ~50 lines |
| **(C) E2E completion path** | ✅ | ✅ | ❌ **flaky by construction** | forbidden |

**Two early-exit traps the planner must know about**, both measured in `condenseArguments.ts`:

- `if (!supportedQuestions.length)` (`:109-115`) `return { type: 'success' }` **from inside the try**, before `recordCompletion` — so a run with only unsupported question types makes **no DB write at all**. A gate built on it would be vacuous.
- `if (entities.length === 0)` (`:130-135`) does the same.

Gate (A) avoids both because the throw fires during question *resolution*, upstream of either check.

### Recommendation (plannable)

**Land (B) first and (A) second, and treat (A) as the criterion-11 prerequisite the roadmap names.**

- **(B)** is where the *mechanism* is proven: assert that the job's writer is built from a **session-derived** client (tokens resolved once at job start, `persistSession: false`, `autoRefreshToken: false`, `globalThis.fetch`) rather than from `source`, and that no `cookies.set` is attempted on the post-response path. `adminJobLifetime.test.ts`'s existing tag-attribution apparatus (`taggedSource(tag)` → the fake reports the tag the writer held at each `insertJobResult`) extends directly: the new assertion is that the observed credential is the *job's own* rather than `locals`'.
- **(A)** is where the *integration* is proven, and it is what the `deferred-items.md` entry means by *"this cannot be discharged as a code change alone. It needs an integration gate first."* It is one extra assertion inside criterion 11's spec — post the form, expect a `fail(500)` response body carrying the error, then read back the `admin_jobs` row via `SupabaseAdminClient` and assert its `author` is the test admin's email and `end_status` is `'failed'`. That single round trip covers form-action auth → writer construction → RLS-checked write under the admin identity, which is exactly the surface the credential change moves.

**Suggested implementation shape for the change itself** (from the marker's own text, not invented here): a new `createSupabaseJobClient({ accessToken, refreshToken })` in `lib/supabase/`, re-exported through the `$lib/api/dataProvider` seam like its siblings (the adapter-boundary guard bans `$lib/supabase/*` at every route — `dataProvider.ts:7`), consumed by a fourth arm or a dedicated factory. **Note this touches `AdapterSource`**, whose docstring (`dataProvider.ts:14-32`) argues at length that there are *"three — and only three"* arms and that `resolveAdapterConfig` **throws** on a fourth. Adding a fourth arm without a matching branch there is the failure that docstring exists to prevent. Read `dataProvider.ts:59-67` before designing this.

**Explicitly recorded, per the roadmap's own wording:** this does **NOT** settle decision **B4**'s open question of what a job *should* do when the initiating admin's session expires mid-run. It removes the crash mode. The authority question stays open in `157.2/deferred-items.md` § *"a long-running admin job's initiating admin can have their token expire mid-run"*, and `157.2-06`'s prohibition (`grep -rn 'refreshSession|refresh_token' lib/server/admin routes/admin` → empty) should stay green.

---

## Q6 — Criterion 13, refresh tokens in the SSR payload

### The analog to copy

`e019007de` (CR-02) is the model. It changed `routes/+layout.server.ts` from an `async` load returning `{ session, supabaseCookies }` to a **synchronous** load returning `{ supabaseCookies }`, and — this is the durable half worth copying — it wrote a **`## ⚠ Why there is NO \`session\` here, and why there must not be`** section into the file's own docstring (`routes/+layout.server.ts:14-20`), ending with:

> *"A future consumer that genuinely needs the session at the root gets a PROJECTION — `{ userId, expiresAt }` — and never the token-bearing object."*

That projection rule is already written down. Criterion 13 is applying it one level down.

### The two producers and the complete consumer census (measured at HEAD)

**Producers — exactly two, byte-identical:**

- `routes/admin/+layout.server.ts:7-9`
- `routes/candidate/+layout.server.ts:7-9`

both `export async function load({ locals }) { const { session } = await locals.safeGetSession(); return { session }; }`.

`routes/candidate/(protected)/+layout.server.ts:26` also calls `safeGetSession()` but consumes it for its own guard and returns no session. There is **no `admin/(protected)/+layout.server.ts`** at all.

**Consumers — exactly two, and both need existence only:**

| Consumer | Read | Needs |
|---|---|---|
| `lib/contexts/auth/authContext.svelte.ts:26` | `#isAuthenticated = $derived(!!page.data.session)` | truthiness |
| `lib/auth/getUserData.ts:38` | `if (!parentData.session) return undefined;` | truthiness |

`getUserData` carries a structural type that **also** has to change:

```ts
// lib/auth/getUserData.ts:11
type ParentSessionData = { session?: { access_token: string } | null };
```

Its docstring (`:6-10`) explains why it is structural rather than importing `Session` — the adapter-boundary guard bans `@supabase/supabase-js` outside `src/lib/api/adapters/**`. Note the type **names `access_token`** even though the check only tests truthiness; this was tightened from `unknown` deliberately (*"which made the pre-check accept ANY truthy value as evidence of a session — a string, a number, `true`"*). The narrowing must keep that property: the projection type must still be an object with at least one required field, so a bare `true` is still rejected at the type level.

### The narrowed projection

```ts
// routes/admin/+layout.server.ts  and  routes/candidate/+layout.server.ts — identical
export async function load({ locals }) {
  const { session } = await locals.safeGetSession();
  // A PROJECTION, never the token-bearing object: everything a server load returns is
  // serialised into the hydration payload, and `Session` carries a refresh_token.
  return { session: session ? { userId: session.user.id, expiresAt: session.expires_at ?? null } : null };
}
```

and correspondingly `type ParentSessionData = { session?: { userId: string } | null }`.

`{ userId, expiresAt }` is the shape `routes/+layout.server.ts:20` already names as the sanctioned projection, so using it keeps one vocabulary. `userId` alone would suffice for both consumers; `expiresAt` costs nothing and is the field a future consumer is most likely to want.

**Verify `session.user.id` is available without a further round-trip:** `safeGetSession` (`hooks.server.ts`, inside `supabaseHandle`) returns `{ session, user }` where `user` comes from the verifying `getUser()` call. Reading `session.user.id` reads the *unverified* proxy; reading the returned `user.id` reads the verified one. **Prefer `user.id`** — it is already in scope in the same destructuring and it avoids the `insecureUserWarningProxy` that `@supabase/auth-js` wraps `session.user` in.

### The durable test

**Recommendation: a repo-root assert script wired into `lint:check`**, following the family that already exists — `scripts/assert-adapter-casts.mjs` (287 lines), `assert-comment-hygiene.mjs`, `assert-schema-migration-parity.mjs`, seven others. All are invoked from the root `lint:check` chain. `158-03-PLAN.md` is already adding a tenth (`scripts/assert-cookie-names.mjs`), so this is the phase's own established idiom.

Copy `assert-adapter-casts.mjs`'s **four-check structure**, and in particular its **Check 0 — the corpus is real** (docstring `:16-24`):

> *"an acceptance criterion grepping for a string that occurs nowhere in the repository measured nothing and reported a pass. A guard whose corpus is empty reports zero violations and looks green forever."*

For `scripts/assert-no-session-in-loads.mjs`:

- **Check 0:** the scan resolves at least N `+layout.server.ts` / `+page.server.ts` files under `apps/frontend/src/routes/`, and the three named anchors (`routes/+layout.server.ts`, `routes/admin/+layout.server.ts`, `routes/candidate/+layout.server.ts`) are among them.
- **Check 1 (primary):** no server-load `return` statement in that corpus returns a binding named `session` that was assigned directly from `safeGetSession()` — i.e. the `const { session } = await locals.safeGetSession(); … return { session }` shape, matched as a pair rather than as two independent greps.
- **Check 2 (spelling backstop):** no server load module contains the literal `refresh_token`.
- **Check 3 (negative control):** the script's own fixture — a synthetic module in the token-bearing shape — **is** flagged, so a zero from the real corpus is distinguishable from a zero from an inert guard.

Pair it with a unit test asserting the two narrowed loads return exactly `{ userId, expiresAt }` (or `null`) and no other keys, and with the render-level check from Q2 which already reads `page.content()` — asserting no `refresh_token` substring there is one extra line in a spec that is loading an authenticated admin page anyway.

**Blast radius note:** `authContext.svelte.test.ts` mocks `page.data.session` via a `sessionSource.read()` indirection and asserts reactivity on toggling truthiness (`:63-64`). It should keep passing unchanged, since the projection is still truthy/`null` — but read it before editing, because it is the only test that pins this read.

---

## Q7 — Sequencing and collision surface

Decision **B2(a)** is binding: the new admin plans form a new wave **after `158-06`, before the `158-09` gate.**

Existing waves: `1: 01, 04, 08` → `2: 02, 05, 07` → `3: 03` → `4: 06` → `5: 09`.
With B2(a): `1: 01, 04, 08` → `2: 02, 05, 07` → `3: 03` → `4: 06` → **`5: <admin plans>`** → `6: 09`.

### File-level collision matrix

| File the admin work touches | Kept plan that also touches it | Wave | Collision under B2(a)? |
|---|---|---|---|
| `apps/frontend/src/hooks.server.ts` | **`158-01`** (rewrites `candidateAuthHandle`, creates `isCandidateRoute`/`isProtectedRoute`) | 1 | **No** — admin edit lands three waves later and is additive on top of `158-01`'s rewrite (Q3). This is the collision B2(b) was rejected for |
| `apps/frontend/src/lib/routes/**` (adding `isAdminRoute` + the gate table) | **`158-01`** (creates the locus), `158-06` (`route.ts`), `158-07` (`route.ts`) | 1, 4, 2 | **No** — all land before |
| `apps/frontend/src/lib/auth/*` (`roles.ts`, `index.ts`, `getUserData.ts`) | **`158-05`** creates `lib/auth/roles.ts`, `passwordLogin.ts`, edits `lib/auth/index.ts` | 2 | **No, but a hard DEPENDENCY** — the role check must consume `roles.ts`, not create a third copy of `['project_admin','account_admin','super_admin']`. Criterion 13 also edits `lib/auth/getUserData.ts`, which `158-05` does not touch |
| `tests/tests/utils/supabaseAdminClient.ts` (adding `forceRegisterAdmin`) | **`158-06`** | 4 | **No** — one wave later. But it is a *real* same-file edit; the admin plan must re-read the file at its own start |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (if the role decode is single-sourced onto `roles.ts`) | **`158-06`** | 4 | **No** — one wave later |
| `routes/admin/(protected)/{argument-condensation,question-info}/+layout.ts` + two new `+layout.server.ts` (OB-1) | none | — | **No** |
| `routes/admin/(protected)/{argument-condensation,question-info}/+page.server.ts` (role check) | none | — | **No** |
| `lib/server/admin/features/{condenseArguments,generateQuestionInfo}.ts` (criterion 12) | none | — | **No** |
| `routes/admin/+layout.server.ts`, `routes/candidate/+layout.server.ts` (criterion 13) | none | — | **No** |
| `apps/frontend/eslint.config.mjs` | **`158-06`** | 4 | **No** — and the new admin `+layout.server.ts` files need **no** allowlist entry (Q2) |
| `package.json` (wiring a new assert script into `lint:check`) | **`158-03`** (adds `scripts/assert-cookie-names.mjs` + `package.json`) | 3 | **No** — two waves earlier — but **both edit the same `lint:check` string**. The admin plan must append, not replace, and must re-read the script after `158-03` lands |
| `.planning/…/158-NEGATIVE-CONTROL-LEDGER.md` | `158-02`, `158-03`, `158-09` | 2, 3, 6 | **No** — the admin plans should append rows in the same convention |

**Verdict on B2(a): it avoids every file-level collision.** The three edges it creates (`158-01` → the hook gate; `158-05` → the role predicate; `158-03` → the `lint:check` chain) are all satisfied by the wave ordering, and each should be declared explicitly in the new plans' `depends_on`.

### What B2(a) does NOT cover — two kept plans are themselves stale

**This is the finding that most needs the planner's attention, because B1(a) says "amend only `158-09`".** That is now false:

1. **`158-05-PLAN.md`** lists `apps/frontend/src/routes/api/auth/login/+server.ts` in `files_modified` (`:14`) and reads or asserts against it at `:123`, `:163`, `:256`, `:259`, `:307`. **The file was deleted by `157.2-04`.** Task text at `:163` says *"`git status --porcelain apps/frontend/src/routes/api/auth/login` is empty"* — which is vacuously true of a non-existent path and would report a pass. `:307` says *"If Option B was chosen, … does not exist and `grep -rn "auth/login"` returns only the two doc-comment mentions"* — measured at HEAD, that grep returns **zero** hits, because the doc-comments were already generalised. `158-05` must be amended so its login-collapse task treats the generic route as **already absent** (OB-2) and so its verification is a presence-of-absence check rather than a deletion.
2. **`158-08-PLAN.md:97`** instructs a read of the same deleted file (it is the plan producing `158-API-LOGIN-CALLER-MEASUREMENT.md`, which `158-05`'s checkpoint consumes). The measurement is now trivially "zero callers, route absent" — the plan should be amended to say so rather than to attempt a read that will fail.

**Recommendation:** amend **three** plans, not one — `158-05`, `158-08` and `158-09` — and record the amendment in `158-CARRIED-OBLIGATIONS.md` as OB-2's discharge. Neither `158-05` nor `158-08` needs re-planning; each needs one task rewritten from *perform/measure* to *verify absent*.

---

## Q8 — The closing gate

Decision **D1(a)** is binding, and `158-09` is already the gate plan — it needs **amending**, not replacing.

### What `158-09` currently says, and the three things wrong with it

Its automated line (`158-09-PLAN.md:223`) is:

```
yarn lint:check && yarn test:unit && yarn test:e2e
```

1. **`db:reset` is absent entirely, and the order is the one 157.1 measured as broken.** `yarn test:unit` runs `packages/dev-seed/tests/integration/default-template.integration.test.ts`, which is gated on `describe.skipIf(!process.env.SUPABASE_URL)` — so on a machine with Supabase up (which the gate requires) it **RUNS**, writes 327 candidates / 8 organizations / 4 categories / 377 nominations / 1 election into the live local Supabase, and its teardown leaves them. The voter app then sees two elections. 157.1-08 measured the consequence exactly: **4 failed and 79 did-not-run, deterministic.** The reset must sit **immediately before the E2E half**, never at the head of the chain.
2. **The prerequisite is `yarn db:reset`, NOT `yarn db:reset-with-data`.** The latter seeds the `seed_`-prefixed `default` template into a suite asserting against `e2e/base`, and `setupFromTemplate` whitelists `seed_` in its freshness probe — so the wrong one fails *quietly*. Two prior plan texts had it wrong.
3. **Three of `158-09`'s own claims about the toolchain are now stale.** `:29` and `:109-111` assert that *"a comment scan is not in the lint chain at this branch point"* and that `lint:check` *"runs the turbo lint task, the test-workspace lint, both typechecks and two assertion scripts, and none of them is a comment scan."* Measured at HEAD, root `lint:check` is:

   ```
   turbo run lint && eslint … tests && yarn typecheck:tests && yarn typecheck
     && assert:i18n-catalog-namespaces && assert:a11y-scan-wiring && assert:comment-hygiene
     && assert:edge-env-defaults && assert:declared-binaries && assert:node-engine
     && assert:env-pair-registry && assert:schema-migration-parity && assert:adapter-casts
   ```

   — **nine** assertion scripts, and `assert:comment-hygiene` **is** among them. `158-09`'s diff-scan stand-in is no longer the only enforcement, and its summary must not report a gap that has since been closed.

### `svelte-check` — already present, but say so

`yarn lint:check` → `yarn typecheck` → `turbo run typecheck` → the frontend workspace's `typecheck` script, which is literally `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`. **So `svelte-check` is already in the gate via `lint:check`.** D1(a)'s requirement is met — but state it explicitly in the amended plan, because three times in Phase 157 a green `build` + green `test:unit` sat on top of a defect only the frontend typecheck caught, and a reader who does not know `typecheck` *is* `svelte-check` will assume it is missing and add it twice or not at all. Note that the workspace also has a stricter `check` script (`--fail-on-warnings`) which the gate does **not** run; if the phase wants warnings to be fatal, that is a separate decision.

### pgTAP

There is no yarn script. The command is `supabase test db` run from `apps/supabase`. Two standing rules from STATE.md:

- **Assert `Result: PASS` AND non-zero `Files=` AND `Tests=` above a floor** — never any one alone. `Tests=` is the **PLANNED** count and is identical on pass and fail. Last measured: `Files=12, Tests=379, Result: PASS`, zero `not ok` (157-18).
- **A pgTAP run CONTAMINATES the live database.** `00-helpers.test.sql` defines six fixtures **outside** its `BEGIN;`/`ROLLBACK;`, so they persist in `public`. This matters most before `yarn db:types`, but it is another reason to place pgTAP **before** the `db:reset`, not after.

### The amended gate order (recommended, plannable)

```
1.  yarn build                                  # turbo, cached
2.  yarn lint:check                             # includes typecheck (= svelte-check),
                                                #   typecheck:tests, and 9 assert scripts
3.  yarn format:check
4.  yarn test:unit                              # ⚠ SEEDS THE LIVE DB — must precede the reset
5.  (cd apps/supabase && supabase test db)      # ⚠ CONTAMINATES public — must precede the reset
6.  yarn db:reset                               # ⚠ NOT db:reset-with-data. Immediately before E2E.
7.  start ONE fresh dev server on :5173         # no Playwright webServer; a stale server steals the port
8.  yarn test:e2e                               # full suite, including the new admin spec
```

Steps 6–8 encode the recorded E2E execution prerequisite: one fresh dev server on :5173 and a clean DB immediately before the full-suite gate. The preflight in Playwright's global setup will abort with exit 1 if the server on the port is not this checkout's — read its failure message field by field per `tests/README.md` § Run rather than restarting blindly.

**Also amend `158-09`'s success criteria** to name criteria 8–13 and their artifacts:

- criterion 8 → the re-measured observation table (Q1) + the admin spec passing;
- criterion 9 → the hook gate test + a role-check test (ideally a negative: an authenticated non-admin is refused);
- criterion 10 → `find routes/api/auth` shows only `logout`, and `grep -rn "auth/login" apps packages tests` returns zero;
- criterion 11 → the spec appears in the run's project list and its count is recorded (`150 passed` today → `+1` setup `+1` spec `+1` teardown = expect **153** projects/tests; reconcile the delta explicitly, as `147-05` did, rather than reporting a bare total);
- criterion 12 → the vitest mechanism test + the E2E `admin_jobs` round trip;
- criterion 13 → `node scripts/assert-no-session-in-loads.mjs` exits 0 **and** its negative-control fixture is flagged.

---

## Analog files to copy

| New artifact the phase will create | Closest existing file | Why it is the right analog |
|---|---|---|
| `routes/admin/(protected)/argument-condensation/+layout.server.ts` | `routes/(voters)/(located)/+layout.server.ts` | The (a+) implementation the operator ruled, landed by `157.2-03`. Same constant, same filter, same `httpOnly` reasoning already written out |
| `routes/admin/(protected)/question-info/+layout.server.ts` | its own sibling above | The two admin loads are byte-identical today; keep them so |
| The narrowed `admin/+layout.server.ts` and `candidate/+layout.server.ts` | `routes/+layout.server.ts` post-`e019007de` | Already carries the projection rule (`:20`) and the "why there must not be a session here" docstring section to mirror |
| `lib/routes/` gate table + `isAdminRoute` | `158-01`'s `isCandidateRoute` / `isProtectedRoute` (same barrel) | One definition, per the phase thesis; criterion 4 creates the shape, criterion 9 adds a row |
| The form-action role check | `lib/server/admin/requireVerifiedAdmin.ts` | Landed by CR-01 and already does the exact two steps; only the rejection response differs (`fail()` vs `json()`) |
| `tests/tests/setup/admin/admin-auth.setup.ts` | `tests/tests/setup/shared/auth.setup.ts` | Same job for the candidate: `unregister` → `forceRegister` → real login form → `storageState` |
| `tests/tests/utils/adminCredentials.ts` | `tests/tests/utils/testCredentials.ts` | Self-contained literals; the derived form crashed every consumer once |
| `SupabaseAdminClient.forceRegisterAdmin` | `SupabaseAdminClient.forceRegister` (`:303-345`) | Minus its steps 2 and 4; keep the compensating `deleteUser` rollback verbatim |
| The admin Playwright project | `candidate-a11y-scan` (`playwright.config.ts:325-330`) | The only default-on project consuming a stored session, with the explicit-`testMatch` rationale already written |
| Criterion 12's mechanism test | `lib/server/admin/features/adminJobLifetime.test.ts` | Already mocks every collaborator including `llmProvider`, and already observes at `insertJobResult` on the error path. Its docstring explains why the error path is the observation point |
| Criterion 13's durable assertion | `scripts/assert-adapter-casts.mjs` | The four-check structure, and **Check 0 — the corpus is real**, which is the anti-vacuity discipline this guard most needs |
| The `httpOnly` unit half | `lib/supabase/server.test.ts` (from `91dce36cc`) | The only in-tree cookie-contract test |
| Driving a route `load` in vitest | `routes/(voters)/(located)/layout.load.test.ts` | The only precedent. ⚠ Copy its harness (`runLoad`, `captureRedirect`), **not** its `vi.mock('$lib/api/dataProvider', …)` — that shape was deleted by `157.2-07`/`08` |

---

## Determinism and gate hazards

CLAUDE.md's **E2E Hard Rule** is cardinal: a flaky test is a real defect, never an exemption. These are the hazards this specific work introduces or inherits, each with its mitigation, ordered by likelihood × cost.

| # | Hazard | Mechanism | Mitigation |
|---|---|---|---|
| **H1** | **`app_settings` singleton contamination — the EFLOW-06 class.** | `routes/admin/+layout.svelte:49` renders a "not accessible" page when `!appSettings.access.adminApp`, and the root layout renders the MaintenancePage when `access.underMaintenance`. The perm setups **REPLACE** the `app_settings` singleton row. `packages/dev-seed/src/templates/e2e/perm/perm-access-disable.ts:7` documents a mode setting `underMaintenance: true` — *"the whole app renders the MaintenancePage"*. If that row is live while the admin spec runs, the spec fails on content, intermittently | **Follow the operator-ruled precedent.** `playwright.config.ts:349` records the `bank-auth-journey` decision verbatim: it *"JOINS THE TAIL OF THE PERM SERIAL CHAIN … standing alone bought a fast isolated gate at the cost of `app_settings` singleton safety, and the singleton wins."* Either join the chain (cost: the isolated `--project=admin-access` gate pulls the whole chain and takes full-suite time) or prove non-overlap by scheduling phase, measured on a real run, as `147-02` did for `auth-setup`. **Do not assume `adminApp: true` is safe** — it happens to be `true` in `e2e/base:199`, `perm/shared:104` and the static default, but `underMaintenance` is the live risk and no setting is safe by accident |
| **H2** | **`admin_jobs` residue accumulates forever.** | Criterion 12's gate (A) writes a real `admin_jobs` row. `admin_jobs` is **not** in `ALLOWED_TEARDOWN_TABLES` (that list is the ten seed tables). `election_id` is `ON DELETE SET NULL`, so an election teardown does **not** cascade the row away, and `project_id` cascades only from `projects`, which `seed.sql` bootstraps and nothing deletes | The admin teardown must delete `admin_jobs` rows by `author = <test admin email>` — a clean, prefix-free handle. **Do not** wire it into `runTeardownAsserted`'s before/after prefix counting: that machinery is keyed on `external_id` prefixes and `admin_jobs` has none (`playwright.config.ts:104`) |
| **H3** | **Orphan auth users → `"User already exists"` on re-run.** | The recorded class (`project_perm_teardown_leaks_auth_users`, fixed once already). A `forceRegisterAdmin` that fails between `createUser` and the `user_roles` insert leaves an auth user that collides on every subsequent run | Copy `forceRegister:343-352`'s compensating `auth.admin.deleteUser` rollback **verbatim**, and call `unregisterCandidate(adminEmail)` before `forceRegisterAdmin` in the setup, exactly as `auth.setup.ts:61` does — the docstring at `:49` explains why that pre-clear is safe |
| **H4** | **A "clean zero about a login page."** | If the admin project's `testMatch` is wrong or `storageState` is not wired, the spec runs unauthenticated, every admin route 307s to `/admin/login`, and any assertion written against generic page chrome passes. `playwright.config.ts:313` names this as *"the one direction in which this wiring can be silently wrong AND green"* | Explicit `testMatch` on the project; and in the spec, assert **both** that the settled URL is inside `/admin` **and** that it is not `/admin/login`, plus a positive post-login marker — the `147-03` reach-proof discipline |
| **H5** | **A warm navigation masquerading as a cold entry.** | The whole point of criterion 11's reload is the SSR path. A client-side navigation re-runs the universal load in the browser, where `createSupabaseUniversalClient` returns the tab's browser client and the session is present regardless — so the spec would pass while the defect it guards is live | `page.goto()` for entry and `page.reload()` for the second pass; assert on post-gate content, never on URL alone (307 is followed silently) |
| **H6** | **`yarn test:unit` seeds the live DB.** | Measured: 4 failed / 79 did-not-run, deterministic, on the head-of-chain order. The teardown of `default-template.integration.test.ts` is incomplete; two phases have now paid a documentation workaround instead | `yarn db:reset` **immediately before** the E2E half (Q8). The underlying defect is open in `157.2/deferred-items.md` and is **not** this phase's to fix |
| **H7** | **`db:reset-with-data` instead of `db:reset`.** | Seeds the `seed_`-prefixed `default` template into a suite asserting against `e2e/base`; `setupFromTemplate` whitelists `seed_` in its freshness probe, so **it fails quietly** | Named explicitly in the amended `158-09` command block, with the reason |
| **H8** | **A real OpenAI call inside an E2E test.** | `getLLMProvider()` builds a live client; `handleQuestion` makes paid, non-deterministic network calls | Gate (A) in Q5 throws at `dataRoot.getQuestion(id)` (`:93-94`), **upstream** of `getLLMProvider()` at `:137`. Never drive the completion path. Note the two early-exit branches (`:109`, `:130`) which return success **without any DB write** — a gate built on either is vacuous |
| **H9** | **Disk exhaustion voiding the full-suite run.** | Recorded: ENOSPC voids full-suite runs; the ~53 GiB is Docker.raw sparse bloat that `prune` cannot reclaim (needs in-VM `fstrim` + restart). Host disk falls ~0.5–1 GiB per full-suite run | Check headroom before the gate. **`tests/e2e-runs/` must not be deleted** |
| **H10** | **Vite HMR serving a stale SSR module mid-debug.** | Recorded: HMR serves stale SSR/large modules during E2E debugging, so a fix appears not to work | Restart the dev server before trusting any interim result, per the recorded practice |
| **H11** | **Storage 502 wedge after `db:reset`.** | Recorded alongside the bank-auth determinism work | Verify the stack is healthy (`yarn db:status`) after the reset and before starting the suite |
| **H12** | **The `admin_jobs` RLS insert failing for the test admin.** | `admin_insert_admin_jobs` is scoped by project. A `project_admin` whose `scope_id` is not `TEST_PROJECT_ID` — or an election belonging to a different project — makes `insertJobResult` throw `insertJobResult: …` and the test fails for a reason unrelated to the change | Assign `scope_type: 'project', scope_id: TEST_PROJECT_ID` (`packages/dev-seed/src/supabaseAdminClient.ts:26`), and drive the form with an `electionId` from `e2e/base`, whose rows sit in that project. Assert the failure message on a bad path rather than a bare boolean, so a misconfigured scope names itself |

---

## Open questions for the planner

Each names the measurement that settles it. None is a guess.

| # | Question | Why it is open | The measurement that settles it |
|---|---|---|---|
| **O1** | Does criterion 8's direct-entry/refresh path still return 200 at HEAD `f7b85a18f`? | The only end-to-end observation is at `4925f2e81`, 23 commits back, two of which (`889b7d6ad`, `bc7a884c7`) touch this path. Code inspection says yes; nothing has run | Re-run `157.2-09-SUMMARY.md`'s eight-row observation table at this HEAD, using the same temporary-`super_admin` method. Minutes. **Plan this as the admin wave's first task** |
| **O2** | Does the admin project overlap in scheduling phase with any perm setup that replaces `app_settings`? | H1's mitigation choice (join the perm chain vs. stand alone) turns on it, and the answer is a property of a real run, not of the config | Run the full suite once with the new project added standing alone, and read the per-project **phase assignment** out of that run's own reporter output, as `147-02` did for `auth-setup` (it measured `phase 2 of 80`, `0 of 89 projects moved phase`). If the admin project shares a phase with any perm setup, join the chain |
| **O3** | What exactly does the E2E form POST for criterion 12's gate (A) return, and is the `admin_jobs` row written before or after the response? | `condenseArguments` is `await`ed inline in the action (`:39`), and `recordFailure` → `insertJobResult` runs inside the `catch` before the action returns — so the row should exist by the time the response lands. But that is inference from reading, not observation, and the read-back assertion's timing depends on it | Drive the POST once by hand against the local stack with a bogus `questionIds` value and `select * from admin_jobs order by created_at desc limit 1` immediately after the response. If the row is absent, the assertion needs a poll rather than a straight read |
| **O4** | Does adding a fourth `AdapterSource` arm for the job client fit, or does criterion 12 need a separate factory outside the union? | `dataProvider.ts:14-32` argues at length that there are *"three — and only three"* arms and `resolveAdapterConfig:66` **throws** on a fourth. A job client is per-job, not per-request, which is a different lifetime from all three | Read `lib/api/dataProvider.ts:14-67` and `lib/api/adminWriter.ts` in full at plan time and decide **explicitly**, recording the reason. A fourth arm added without a matching branch in `resolveAdapterConfig` is the exact failure that docstring exists to prevent |
| **O5** | Should the admin protected surface gain a page heading (`<h1>` / `[data-focus-on-nav]`)? | Measured: there is none anywhere under `routes/admin/(protected)/`, so the root layout's `afterNavigate` focus reset is a no-op on every admin route. CLAUDE.md requires WCAG 2.1 AA | Not a criterion-8-to-13 question. **File as a todo**; folding markup design into an auth-surface phase is scope creep, and the a11y phases (76, 80 precedent) are the right home |
| **O6** | Do the two admin `+layout.ts` loads still need `getQuestionData` at all, once each has its own server load? | Both currently return `questionData` unawaited (streaming). The (a+) voter analog keeps its two reads unawaited deliberately (`(located)/+layout.ts:102`) — *"do not 'fix' it by awaiting"* | Preserve the unawaited shape. If the plan proposes awaiting, it must say why, because the voter file's comment explains that the promise captures **this** request's own adapter and is safe under per-request instancing |
| **O7** | Does `158-05`'s login-collapse task still have work to do after `/api/auth/login`'s deletion? | Its `must_haves` and Task 2 were written around a three-way collapse; one of the three is gone. The remaining two (`admin/login`, `candidate/login`) still duplicate the sign-in + role-decode + redirect shape, so there is probably still a collapse — but the plan's own verification steps are now vacuous | Re-read `158-05-PLAN.md` Task 2 against the two surviving files at HEAD, and rewrite its verification from *"the generic route is deleted"* to *"the generic route is absent (verified) and the two remaining actions share one helper"* |

---

## Sources

**Primary — files read at HEAD `f7b85a18f` this session (HIGH confidence).**
`apps/frontend/src/hooks.server.ts` · `routes/+layout.server.ts` · `routes/+layout.ts` · `routes/+layout.svelte` (focus block) · `routes/admin/+layout.server.ts` · `routes/admin/+layout.svelte` · `routes/admin/login/+page.server.ts` · `routes/admin/(protected)/+layout.ts` · `routes/admin/(protected)/+layout.svelte` · `routes/admin/(protected)/argument-condensation/{+layout.ts,+page.server.ts}` · `routes/admin/(protected)/question-info/{+layout.ts,+page.server.ts}` · `routes/candidate/+layout.server.ts` · `routes/candidate/(protected)/+layout.server.ts` · `routes/candidate/login/+page.server.ts` · `routes/(voters)/(located)/{+layout.server.ts,+layout.ts,layout.load.test.ts}` · `routes/api/admin/jobs/active/+server.ts` · `lib/server/admin/requireVerifiedAdmin.ts` · `lib/server/admin/features/condenseArguments.ts` · `lib/server/admin/features/adminJobLifetime.test.ts` · `lib/server/admin/jobs/jobRecord.ts` · `lib/server/llm/llmProvider.ts` · `lib/server/api/dataProvider.ts` · `lib/auth/getUserData.ts` · `lib/api/dataProvider.ts` · `lib/api/adminWriter.ts` · `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (`_getBasicUserData`) · `lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts` · `lib/supabase/universal.ts` · `lib/contexts/auth/authContext.svelte.ts` · `apps/frontend/eslint.config.mjs` (allowlist) · `apps/supabase/supabase/migrations/00001_initial_schema.sql` (enums, `custom_access_token_hook`, `admin_jobs`) · `packages/data/src/root/dataRoot.ts` · `packages/dev-seed/src/{supabaseAdminClient.ts,cli/teardown.ts,template/permittedKeys.ts,templates/e2e/base.ts,templates/e2e/perm/*}` · `tests/playwright.config.ts` · `tests/tests/setup/shared/auth.setup.ts` · `tests/tests/utils/{testCredentials.ts,supabaseAdminClient.ts}` · `tests/tests/specs/a11y/a11y-smoke.spec.ts` · `scripts/assert-adapter-casts.mjs` · root, frontend and supabase `package.json`.

**Primary — planning artifacts (HIGH confidence, authored in-project).**
`.planning/STATE.md` · `.planning/ROADMAP.md` § Phase 158 · `.planning/REQUIREMENTS.md` § Routing & Auth Surface · `.planning/v2.15-OPERATOR-DECISIONS-2026-08-31.md` (D10, D11) · `158-CARRIED-OBLIGATIONS.md` · `158-DISCUSSION-POINTS-ADDENDUM.md` · `158-01/05/08/09-PLAN.md` · `157.2-REVIEW.md` (CR-01, CR-02, CR-03, WR-05) · `157.2-09-SUMMARY.md` · `157.2/deferred-items.md` · `./CLAUDE.md`.

**Git (HIGH confidence).** `889b7d6ad`, `e019007de`, `91dce36cc`, `c89448481`, `bc7a884c7`, `4925f2e81` — commit messages and `--stat` read directly.

**No external sources were consulted.** Every claim in this document is grounded in this repository at this HEAD; nothing rests on training knowledge about SvelteKit or Supabase behaviour that was not confirmed against an in-tree file or docstring.

---

## Metadata

**Confidence breakdown**

| Area | Level | Reason |
|---|---|---|
| Delivered-vs-owed ledger | HIGH | Every row is a file read at HEAD plus a named commit |
| Addendum staleness table | HIGH | All 12 facts re-measured individually |
| Q1 (criterion 8 verdict) | MEDIUM | Code inspection is unambiguous; the end-to-end observation is 23 commits stale. O1 closes it |
| Q2 (OB-1) | HIGH | The (a+) analog exists in-tree and was read in full |
| Q3 (gate + role check) | HIGH | The missing gate and the missing role check are both absences verified by reading the whole of both files |
| Q4 (E2E identity) | HIGH | dev-seed's inability to express a role is structural (`permittedKeys.ts`), not incidental |
| Q5 (job credentials) | MEDIUM | The gate design is derived from the code path; no admin E2E exists to extend. O3 closes the timing question |
| Q6 (refresh token) | HIGH | Producer and consumer censuses are both complete and small |
| Q7 (collisions) | HIGH | Read from the nine plans' own `files_modified` frontmatter |
| Q8 (gate) | HIGH | Commands read from `package.json` at HEAD; the three stale `158-09` claims verified against it |
| Hazards | MEDIUM–HIGH | H1's overlap is the one that needs a run to settle (O2); the rest are recorded, reproduced classes |

**Research date:** 2026-09-01
**Valid until:** ~2026-09-08 for anything anchored to `hooks.server.ts` or the nine plans (both are actively edited); ~30 days for the structural findings (dev-seed's role model, the adapter seam, the RLS shape).

## RESEARCH COMPLETE

---

# ORCHESTRATOR VERIFICATION — 2026-09-01, HEAD `f7b85a18f`

> **⚠ THIS SECTION'S CONCLUSION IS WRONG AND IS RETRACTED. See the CORRECTION TO OB-5 in
> `158-CARRIED-OBLIGATIONS.md`.** `parseResponse` is never reached with a non-2xx response:
> `UniversalAdapter.fetch` — the wrapper `post()` calls, one method up in the same file — contains an
> `if (!response.ok) { ... throw }` branch with a standing regression test. The 403 therefore THROWS,
> the action returns `fail(500)`, and `condenseArguments` is never reached. **There is no LLM spend and
> no exploit.** The section is left in place as the record of the error. The real gap is defense-in-depth
> (the form actions have no role check of their own) plus a wrong status code, not privilege escalation.

**Added by the plan-phase orchestrator, not the researcher.** Per the standing rule that an agent's
root-cause diagnosis is UNCONFIRMED until re-measured, Q3's headline claim was re-traced end to end
before being planned against. **The conclusion holds. The stated mechanism does not, and the difference
changes what criterion 9 must fix.**

## What the research says

> "There is no role test between it and `startJob`." (§ Q3, and the delivered-vs-owed row for criterion 9)

## What is actually there

There **is** a role test. It sits one layer down, and it is correct:

- `routes/api/admin/jobs/start/+server.ts` opens with `const denied = await requireVerifiedAdmin({ fetch, locals }); if (denied) return denied;`
- `lib/server/admin/requireVerifiedAdmin.ts` does the verifying round-trip via `locals.safeGetSession()`
  and then `if ((await getUserData({ fetch, locals }))?.role !== 'admin') return json({ error: 'Forbidden' }, { status: 403 })`

That helper landed with CR-01 in Phase 157.2 and covers all six job endpoints, `start` included. So the
form action's `dataWriter.startJob(...)` **is** role-gated.

## Why the gap is real anyway — the actual mechanism

**The 403 is never observed by the caller, because nothing in the writer stack checks `response.ok`.**

- `universalDataWriter.startJob` → `universalAdapter.post` (`lib/api/base/universalAdapter.ts`)
- `post` ends `const response = await this.fetch(url, fullInit, options); return parseResponse(response, parser)`
- `lib/api/utils/parseResponse.ts` switches on the parser and returns `response.json()`. **It never
  inspects `response.ok` or `response.status`, and it never throws on a non-2xx.**

So for a non-admin caller the chain is:

1. `if (!session)` — passes; they are authenticated
2. `getBasicUserData()` — returns their own email
3. `startJob(...)` — the API route returns **403 `{ error: 'Forbidden' }`**, which is parsed as ordinary
   JSON and returned as the value. **No throw.** `jobInfo` is `{ error: 'Forbidden' }` and `jobInfo.id`
   is `undefined`
4. `condenseArguments({ ..., jobId: jobInfo.id })` — **runs**. Verified: it takes `jobId` straight into
   `new PipelineController(jobId)` and `createJobRecorder({ jobId, ... })` with **no validity guard**,
   then proceeds to `loadElectionData` and onward to the LLM provider

The consequence chain the research described is therefore correct — spend happens, and the eventual
`admin_jobs` write is refused by the `admin_insert_admin_jobs` RLS policy (`WITH CHECK
(can_access_project(project_id))`, which requires an admin role in the JWT) only *after* it. But the
defect is not an absent check. **It is a present check whose rejection is silently discarded.**

## Why this distinction is load-bearing for the plan

1. **"Add a role check to the two form actions" does not close the class.** It closes these two call
   sites. Every other `universalDataWriter` call site still converts an HTTP error response into a
   plausible-looking success value. A `must_haves` predicate written against the two actions alone would
   pass while the class stays open.
2. **This is ruling D8's class, on the read path.** D8 ("fail loudly", Phase 157.1) was about
   `safeParse` degrading a failed parse to an empty value so the caller cannot tell absent from
   malformed. This is the same failure with a different degrader: a 4xx body becomes a domain object.
   The phase should say explicitly whether it fixes `parseResponse`/`post` here or files it, and if it
   files it, against what.
3. **Criterion 12 inherits it.** A job started with `jobId: undefined` is precisely a job whose record
   half is broken from the first instruction — the same surface criterion 12 is rewriting. Whatever
   guard criterion 12 adds at job start should reject a missing/invalid `jobId` outright.
4. **It sharpens criterion 11's negative control.** A5(a) is the happy path plus a reload. The natural
   negative — an authenticated non-admin POSTing the form action — must assert **no LLM invocation and
   no job creation**, not merely a non-2xx form result; today the action would return `fail(500)` from
   a *downstream* failure, which is the wrong reason and would let a naive assertion pass vacuously.

## Corrections to apply when reading this document

- Criterion 9 delivered-vs-owed row, clause (b): "The role check is still missing" → **"The role check
  exists at the API layer (`requireVerifiedAdmin`) and is bypassed at the form-action layer because the
  writer stack discards the 403; the form actions need their own check AND the swallowed-error class
  needs a disposition."**
- § Q3 "There is no role test between it and `startJob`" → as above.
- Everything else in § Q3 — the exploitability, the ordering of spend before the RLS refusal, the
  `158-05` dependency for `lib/auth/roles.ts` — was checked and stands.

**Evidence:** `routes/api/admin/jobs/start/+server.ts`; `lib/server/admin/requireVerifiedAdmin.ts`;
`lib/api/base/universalAdapter.ts` (`post`); `lib/api/utils/parseResponse.ts`;
`lib/server/admin/features/condenseArguments.ts` (`new PipelineController(jobId)`, `createJobRecorder`);
`apps/supabase/supabase/schema/302-rls.sql` (`admin_insert_admin_jobs`);
`apps/supabase/supabase/schema/301-auth-functions.sql` (`can_access_project`).
