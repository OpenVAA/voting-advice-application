# Phase 158: Routing & Auth Surface Harmonisation — Research

**Researched:** 2026-08-28
**Measurement HEAD:** `db220cb5f`, branch `integration/ship-12-squash` (working tree carries only untracked `.planning/` plan files; no source-tree modifications)
**Domain:** SvelteKit 2 route/auth surface consolidation, file moves with import codemods, source-level architecture guards
**Confidence:** HIGH for everything measured on the tree; MEDIUM only where a Phase 157 decision is still open

---

## Summary

Phase 158 is a **refactor-and-guard** phase, not a feature phase. Every one of its seven criteria is a
move, an extraction, or a standing test. That makes measurement — not library research — the load-bearing
work, and this document is almost entirely measurement.

Four findings change how the phase must be planned, and none of them are in `158-CONTEXT.md`:

1. **`/api/auth/login` has literally zero callers.** `UNIVERSAL_API_ROUTES.login`
   (`universalApiRoutes.ts:12`) is referenced nowhere; the exported `LoginParams`/`LoginResult` types are
   imported nowhere; the only other mentions are two doc comments saying the login actions deliberately
   *bypass* it. Criterion 1's conditional deletion clause therefore **fires on the measurement**, which puts
   it in direct tension with D-G3(a)'s "three thin entry points". This must go to the operator as a
   `checkpoint:decision`, not be resolved by a planner.
2. **The routes-locus move has importers outside `apps/frontend`.** `tests/tests/utils/buildRoute.ts:2-3`
   and `tests/tests/utils/axeScan.ts:39` import `route.ts` by **deep relative path**
   (`../../../apps/frontend/src/lib/utils/route/route`), bypassing `$lib` entirely. Fact 21's "24 files"
   was measured inside `apps/frontend/src` only and misses them. Miss these and `yarn typecheck:tests`
   goes red and the whole Playwright suite fails to compile.
3. **There is an 18th cookie write site, and it is not a `cookies.set()` call.**
   `routes/candidate/preregister/+page.svelte:111` writes `oidc_code_verifier` via
   `document.cookie = \`oidc_code_verifier=…\`` — the *only* producer of that cookie, client-side. A
   detector that greps `cookies.get|set|delete` misses the one write site the const module most needs to
   cover. This resolves the 17-vs-18 discrepancy definitively: **17 `cookies.*` sites + 1 `document.cookie`
   site = 18 write/read sites across 6 files.**
4. **Criterion 7's rewrite needs no new markup at all.** `Input.svelte:656` already renders
   `<ErrorMessage … data-testid="input-error">`, and `Input.svelte:389-390` already puts `containerProps`
   (which carries `profile-image-upload`) on the **outermost** container that encloses it. The reviewer's
   "put the testid in the parent and use a child selector" is satisfied by deleting the wrapper `<div>` and
   changing the fixture to `getByTestId('profile-image-upload').getByTestId('input-error')`. `input-error`
   currently has **zero** consumers. The `:281-288` comment's argument ("a testid inside Input would be
   ambiguous") was true when written and is now obsolete, because the disambiguation is the *container*,
   not the message.

**Primary recommendation:** Plan 158 as six serialised-then-parallel slices with the `$lib/routes/` move as
a tracer that lands first and alone; route every scope-widening (whole-directory move, `/api/auth/login`
deletion, the `/api` auth-route relocation that touches a Supabase redirect allowlist) through an explicit
`checkpoint:decision`; and build both source tests as **plain Node scripts wired into `lint:check`**, copying
`scripts/assert-a11y-scan-wiring.mjs`, with a vitest self-test copying `lib/_guards/eslint-store-guard.test.ts`.

---

## User Constraints (from CONTEXT.md)

`158-CONTEXT.md` is the authority. Its decisions are reproduced here in index form only — **plan from the
CONTEXT's prose sections, not from this list.** Nothing below re-litigates a decision; where research
*widens* a decision it says so explicitly and marks it a deviation requiring a checkpoint.

### Locked Decisions

- **D-G1** (won by tick): create `apps/frontend/src/lib/routes/`; move `buildRoute.ts`, `route.ts`,
  `loginRedirectTarget.ts`, and define the `(protected)` pattern there; run one import codemod.
  **Binding NOTES:** additionally produce a **proposal document** for what else should move out of
  `lib/utils/` directly under `lib/`. *A proposal, not a migration. No file beyond the four named moves.*
- **D-G2** (won by default): create `apps/frontend/src/lib/cookies/index.ts` — a **frozen const map** of the
  cookie names, plus a source test with **exactly two failure modes**: a cookie-name literal at a write
  site, and two colliding names.
- **D-G3** (won by tick): **one shared server helper in `$lib/auth`**; `admin/login`, `candidate/login` and
  `api/auth/login` keep their own thin entry points. Rejected: funnelling through `/api/auth/login`; a role
  parameter on the login path. Folded in: the `['project_admin','account_admin','super_admin']` mapping at
  `admin/login/+page.server.ts:43` extracts to the same `$lib/auth` utility; `candidate/auth/callback` and
  `candidate/auth/logout` move under `/api`.
- **D-G4** (won by default): match on **`route.id`**, not `pathname`, in `hooks.server.ts`. Rejected: an
  anchored `pathname` regex; both.
- **D-G5** (won by tick, **scope overruled by binding NOTES**): file all six follow-up comments into
  `.planning/todos/pending/`; **classify each blocking/non-blocking and record the classification**;
  **implement the blocking ones inside 158 or 159**, in whichever phase owns the comment's file.
- **D-N1**: Phase 152's planning-reference scan lands in `yarn lint:check` before this phase. Every comment
  158 writes must satisfy it — **no `.planning/` path references, no `--` as a dash.**
- **D-N2**: follow-up comments land in `.planning/todos/pending/`, filed during the owning phase, with the
  file:line anchor preserved and blocking ones flagged.
- **D-N3**: one `<padded>-CONTEXT.md` per phase plus a `<padded>-DISCUSSION-LOG.md` pointer.
- **D-0.1**: the 33-fact table is the run's factual baseline and `.planning/ROADMAP.md:1003-1217` is
  corrected in place. **158's planning must not edit ROADMAP.md.**

### Claude's Discretion

- Internal file layout of `$lib/routes/` (flat vs. preserved `route/` subdir), and whether an `index.ts`
  barrel is kept — provided imports resolve and the `(protected)` pattern is exported from there.
- The mechanism of the two source tests (AST rule, grep-based vitest, or ESLint rule) — **provided both
  stated failure modes are demonstrated failing before they are claimed to guard.**
- The shape and filename of the `lib/utils` proposal document, provided it lives in the phase directory and
  names sections, not individual files only.
- The signature and internal decomposition of the shared `$lib/auth` login helper.

### Deferred Ideas (OUT OF SCOPE)

- Mass-moving anything out of `lib/utils/` — D-G1's NOTES buys a proposal document and nothing more.
- Merging the three login routes into one route, or adding a role parameter to a login path.
- Implementing the *non*-blocking follow-ups.
- The `$effect` census, component consolidation and context work — Phase 159.
- Renaming/restructuring `logDebugError` and the adapter-leakage source test — Phase 157 criterion 6.

---

## Phase Requirements

`REVIEW-RT-01..07` **do exist** in `.planning/REQUIREMENTS.md` — at `:141-147`, with a per-ID traceability
table at `:296-302` and a phase rollup at `:339`. **CONTEXT `<open>` #6 is stale** (it was measured before a
concurrent agent wrote them in). See the Requirement Discrepancy Register below — three of the seven carry
data contradicted by the tree.

| ID | Requirement (source) | Research support |
|----|----------------------|------------------|
| REVIEW-RT-01 | `REQUIREMENTS.md:141` — one login path; `/api` login deleted if the collapse leaves it unused | § D — full diff of the three entry points, helper signature, and the **zero-caller measurement** that makes the deletion clause fire |
| REVIEW-RT-02 | `REQUIREMENTS.md:142` — cookie names from one const module + a test with two failure modes | § C — definitive 18-site table across 6 files, the `document.cookie` site, and the detector design that excludes the Supabase SSR bridge without a file exclusion |
| REVIEW-RT-03 | `REQUIREMENTS.md:143` — routes built with `buildRoute`; definitions in one locus | § A (the move + codemod) and § F (the bounded, prioritised hand-built-route sweep) |
| REVIEW-RT-04 | `REQUIREMENTS.md:144` — `(protected)` pattern in the new locus; hook no longer misfires on a subpath; consistency test | § E — exact rewrite, the pattern's real current home, and the consistency-test design with both failure modes |
| REVIEW-RT-05 | `REQUIREMENTS.md:145` — permissions mapping extracted; `loginRedirectTarget.ts` moves; candidate auth callback + logout move under `/api` | § A + § D — including the **Supabase redirect-allowlist blast radius** of the callback move |
| REVIEW-RT-06 | `REQUIREMENTS.md:146` — `candidate/(protected)/+page.svelte:38` defaults-plus-overrides + badge set up front | § G — the full branch chain, the invariant-vs-varying prop split, and the downstream consumers |
| REVIEW-RT-07 | `REQUIREMENTS.md:147` — no test-only element; theme-colour defaults removed; maintenance title per reviewer markup | § H — the `input-error` finding that makes the rewrite markup-free, plus the exact `+layout.svelte` edits |

### Requirement Discrepancy Register

**The requirement text is stale; the code is not wrong.** A verifier tracing 158's work against these
anchors will fail correct work. **This researcher may not edit `.planning/REQUIREMENTS.md`** — the planner
should carry this table into a plan task the operator approves.

| Req ID | Claim as written | Measured truth | Evidence (file:line) |
|--------|------------------|----------------|----------------------|
| REVIEW-RT-04 (`REQUIREMENTS.md:144`) | "`hooks.server.ts:68`'s `pathname.includes('/candidate')` is gone (measured `:68`; the roadmap previously said `:69`)" | The defect is at **`:69`**. `:68` is the comment `// Handle candidate auth redirects`. The requirement text asserts the roadmap was wrong; the roadmap was right. | `apps/frontend/src/hooks.server.ts:68-69` |
| REVIEW-RT-04 (`REQUIREMENTS.md:144`) | "`route.id` already being in scope at `:66`" | `route` enters scope at **`:59`** — `const { url, route } = event;` | `apps/frontend/src/hooks.server.ts:59` |
| REVIEW-RT-04 (`REQUIREMENTS.md:144`) | "already used for the `(protected)` check at `:72`" | The `(protected)` check is at **`:74`**. `:72` is `redirect(303, \`/${locale}/candidate\`);` | `apps/frontend/src/hooks.server.ts:72,74` |
| REVIEW-RT-02 (`REQUIREMENTS.md:142`) | "5 files / **18** call sites" | **6 files / 18 sites** — 17 `cookies.*` calls in 5 files plus 1 `document.cookie` write in a 6th. The ROADMAP's corrected "5 files / 17" is also incomplete. | § C table below; `routes/candidate/preregister/+page.svelte:111` |
| REVIEW-RT-07 (`REQUIREMENTS.md:147`) | "the test id at `candidate/(protected)/profile/+page.svelte:281`" | The `<div data-testid="profile-image-error">` is at **`:289`**. `:281-288` is the explanatory comment block. | `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:281-289` |
| REVIEW-RT-07 (`REQUIREMENTS.md:147`) | "theme-colour defaults are removed at `+layout.svelte:215`" (singular anchor) | **Two** defaults: light `?? '#d1ebee'` at `:215` and dark `?? '#1f2324'` at `:219`. Both must go. | `apps/frontend/src/routes/+layout.svelte:215,219` |
| REVIEW-RT-01 (`REQUIREMENTS.md:141`) | "the generic `/api` login route **is deleted** rather than kept if the collapse leaves it unused" | Phrased more assertively than the ROADMAP criterion, and it **collides with D-G3(a)**, which keeps all three entry points by construction. The antecedent ("leaves it unused") is measured TRUE today — see § D. | `universalApiRoutes.ts:12`; zero references repo-wide |

Also note, without an edit: the ROADMAP Phase 158 entry's own "second pass" preamble
(`.planning/ROADMAP.md:1127`) **already carries the correct `:69`/`:74`/`:59`**. It is `REQUIREMENTS.md:144`
that is now the sole surviving home of the debunked numbers.

**Recommendation for § J:** do NOT "accept the criteria as authoritative because requirements are absent."
The requirements exist. Recommend instead: **accept `158-CONTEXT.md`'s measured anchors as authoritative
for coordinates, `REQUIREMENTS.md` as authoritative for intent**, and record the discrepancy register in the
phase's summary artifact so the verifier traces to the right lines.

---

## Project Constraints (from CLAUDE.md)

| Directive | Source | Consequence for 158 |
|-----------|--------|---------------------|
| **E2E failures are a CARDINAL FAILURE.** No task completes while any E2E test fails. No "known-flaky" exemption. "Did not run" counts as a failure. | `CLAUDE.md` § E2E Hard Rule | The route moves under `/api`, the hooks redirect rewrite and the testid rewrite are the three highest-risk changes. Full-suite green is the phase gate. |
| **Prefer the full E2E suite for interim verification** (`yarn test:e2e`), not ad-hoc checks. | same | Plans should gate waves on the full suite, not on greps. |
| E2E preflight asserts the served app came from *this* checkout via `/@fs`; no skip flag exists. | same | See § J prerequisites. |
| **Context Destructuring Rule (Svelte 5).** `appSettings`, `dataRoot`, `locale` and the array accessors are reactive accessors — read via `ctx.X`, never destructure. `dataRoot` additionally must be read **directly** in the consuming tracking scope (no intermediate alias). | `CLAUDE.md` § Context Destructuring Rule | Binding on § G's `candidate/(protected)/+page.svelte` rewrite. That file already complies at `:26-29`; the rewrite must not regress it. |
| **Svelte warning-accepted format:** `// svelte-warning: accepted — <rationale>` immediately above the line. | `CLAUDE.md` | Only if the § G/§ H rewrites raise a compiler warning. |
| Never commit sensitive data; WCAG 2.1 AA; strict TypeScript, avoid `any`; all user-facing strings localised. | `CLAUDE.md` § Important Implementation Notes | § H's title change touches i18n keys `dynamic.appName` / `maintenance.title` — both already exist. |
| **Always check the code review checklist** at `.agents/code-review-checklist.md`. | `CLAUDE.md` § Code Review | Add as a plan-level verification step. |
| `$lib` → `apps/frontend/src/lib` is a SvelteKit built-in; project aliases are `$types`, `$voter`, `$candidate`. | `CLAUDE.md`; `apps/frontend/svelte.config.js:11-15` | **No alias change is needed for `$lib/routes/` or `$lib/cookies/`.** See § A.3. |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route-string construction (`buildRoute`, `ROUTE`) | Shared frontend lib (`$lib/routes/`) | Browser + Frontend Server | Called from both `+page.svelte` (browser) and `+page.server.ts` / `hooks.server.ts` (server). Must stay isomorphic — it already is: `buildRoute.ts` imports only `$app/paths`, `$lib/paraglide/runtime` and `qs`. |
| `(protected)` route pattern | Shared frontend lib (`$lib/routes/`) | Frontend Server (hook) | The hook is the only consumer today, but the consistency test needs it importable from a neutral locus. |
| Post-login redirect-target validation (`safeRedirectTarget`) | **Frontend Server only** | — | Validates attacker-controlled form input. Moving it to `$lib/routes/` makes it importable by browser code; that is harmless but the security property is server-side. Keep the function pure and side-effect-free (it already is). |
| Password login + role check | **Frontend Server** (form actions) | API/Backend (Supabase) | `signInWithPassword` must run on the response that carries the `Set-Cookie` — both login files document exactly this at `:4-9` / `:3-8`. A shared helper must therefore take `locals`, not create its own client. |
| Permissions/role mapping (`project_admin`/`account_admin`/`super_admin`) | Shared frontend lib (`$lib/auth`) | API/Backend (RLS, authoritative) | The frontend mapping is a *convenience gate*; the DB's RLS is the real boundary. Extracting it must not read as making the frontend authoritative. |
| Cookie-name declaration | Shared frontend lib (`$lib/cookies/`) | Frontend Server (all writers) | Every writer is server-side except the one `document.cookie` write in the browser — so the const module must be browser-safe (a plain frozen object; no `$env/dynamic/private`). |
| Candidate-route detection / auth redirect | **Frontend Server** (`hooks.server.ts`) | — | Runs before any load function; `route.id` is only available here and in load functions. |
| Supabase auth callback / logout endpoints | **Frontend Server** (`/api` routes) | API/Backend + out-of-repo config | Moving these changes an **exact-match** Supabase redirect allowlist. See § D.4. |

---

## A. The `$lib/routes/` move (D-G1, criteria 3/4/5)

### A.1 — Current state, re-measured

`apps/frontend/src/lib/routes/` **does not exist** (`ls` → No such file or directory). ✅ Fact 21 confirmed.

`apps/frontend/src/lib/utils/route/` holds 8 files:

| File | Lines | Exported from the barrel? | Notes |
|------|------:|---------------------------|-------|
| `buildRoute.ts` | ~118 | yes | **Moves (D-G1).** Imports `./filterPersistent`, `./params`, `./parseParams`, `./route`, and `../removeDuplicates` |
| `route.ts` | ~95 | yes | **Moves (D-G1).** Zero imports — a pure const module |
| `params.ts` | — | yes | |
| `parseParams.ts` | — | yes | imports `./params` |
| `parseParams.test.ts` | — | n/a | imports `./parseParams` |
| `impliedParams.ts` | — | yes | |
| `filterPersistent.ts` | — | **NO** | imports `./params`; deliberately outside the barrel |
| `index.ts` | 5 | — | `export * from './buildRoute' \| './impliedParams' \| './params' \| './parseParams' \| './route'` |

**`buildRoute.ts` has an outbound dependency on a file outside `route/`:**
`apps/frontend/src/lib/utils/route/buildRoute.ts:8` — `import { removeDuplicates } from '../removeDuplicates';`.
After the move this becomes `'../utils/removeDuplicates'` (or `$lib/utils/removeDuplicates`). **The codemod
must rewrite this relative import too** — it is invisible to any grep for `utils/route`.

**`(protected)` is NOT undefined today.** Fact 21 says "No `(protected)` pattern constant exists anywhere —
the only occurrence is the inline string in `hooks.server.ts`." **That is wrong.** Measured:

```
apps/frontend/src/hooks.server.ts:74                   if (!session && route.id.includes('(protected)')) {
apps/frontend/src/lib/utils/route/route.ts:2           const CANDIDATE_PROT = `${CANDIDATE}/(protected)`;
apps/frontend/src/lib/utils/route/route.ts:6           const ADMIN_PROT = `${ADMIN}/(protected)`;
apps/frontend/src/routes/loginRedirectTarget.ts:13     (a prose mention in a docblock)
```

`route.ts:2` and `:6` are **module-private consts** (not exported) that embed the literal, and every
`CandApp*`/`AdminApp*` route id in `ROUTE` is built from them. So criterion 4's "define the `(protected)`
pattern in that locus" is best read as **export what already exists**, not invent something new — the file
that must hold it is the same file that already holds it privately. That materially lowers the risk of the
consistency test drifting from `ROUTE`.

### A.2 — The importer census (re-measured; the CONTEXT's count is incomplete)

**Inside `apps/frontend/src`** — 24 files *contain* the string `utils/route`, but only **22 actually import
from it**; 2 of the 24 are comment-only doc references.

**8 under `lib/`** (all real imports):

| # | File:line | Imports |
|---|-----------|---------|
| 1 | `lib/admin/features.ts:1` | `type Route` |
| 2 | `lib/candidate/components/preregisteredNotification/PreregisteredNotification.svelte:24` | `type Route` |
| 3 | `lib/contexts/app/getRoute.svelte.ts:2` and `:3` | `buildRoute`; `type RouteOptions` |
| 4 | `lib/contexts/candidate/candidateContext.svelte.ts:10` | `getImpliedElectionIds` |
| 5 | `lib/contexts/filter/filterContext.svelte.ts:4` | `parseParams` |
| 6 | `lib/contexts/utils/paramState.svelte.ts:2` and `:3` | `parseParams`; `type ArrayParam, Param` |
| 7 | `lib/contexts/voter/voterContext.svelte.ts:7` | `getImpliedConstituencyIds, getImpliedElectionIds` |
| 8 | `lib/dynamic-components/logoutButton/LogoutButton.type.ts:2` | `type Route` |

**14 under `routes/` with real imports:**

| # | File:line | Imports |
|---|-----------|---------|
| 9 | `routes/(voters)/(located)/+layout.ts:16` | `buildRoute, getImpliedConstituencyIds, getImpliedElectionIds, parseParams` |
| 10 | `routes/(voters)/(located)/questions/+layout.svelte:44` | `FIRST_QUESTION_ID, parseParams` |
| 11 | `routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte:29` | `parseParams` |
| 12 | `routes/(voters)/(located)/results/[[electionTab]]/+layout.ts:2` | `parseParams` |
| 13 | `routes/(voters)/constituencies/+page.svelte:22` **and `:23`** | **DEEP:** `$lib/utils/route/filterPersistent`; `$lib/utils/route/parseParams` |
| 14 | `routes/(voters)/constituencies/+page.ts:20` and `:22` | `buildRoute, getImpliedConstituencyIds, getImpliedElectionIds, parseParams`; `type Route` |
| 15 | `routes/(voters)/elections/+page.ts:21` and `:23` | `buildRoute, getImpliedElectionIds, parseParams`; `type Route` |
| 16 | `routes/(voters)/nominations/+layout.ts:10` | `buildRoute` |
| 17 | `routes/admin/(protected)/+layout.ts:12` | `buildRoute` |
| 18 | `routes/admin/login/+page.server.ts:14` | `buildRoute` |
| 19 | `routes/candidate/(protected)/+layout.server.ts:16` | `buildRoute` |
| 20 | `routes/candidate/(protected)/questions/[questionId]/+page.svelte:36` | `parseParams` |
| 21 | `routes/candidate/login/+page.server.ts:12` | `buildRoute` |
| 22 | `routes/candidate/preregister/+layout.server.ts:3` | `buildRoute` |

**2 comment-only references under `routes/` (no import; still must be rewritten so the docs stay true):**

| File:line | Text |
|-----------|------|
| `routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte:30` | ``` `$lib/utils/route/params.ts`) are literally different identifiers throughout ``` |
| `routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:264` | ``` (existing PERSISTENT_SEARCH_PARAMS member at `$lib/utils/route/params.ts`). ``` |
| `routes/(voters)/(located)/results/[[electionTab]]/+layout.ts:14` | ``` PERSISTENT_SEARCH_PARAMS member at `$lib/utils/route/params.ts`) = ``` (this file *also* has a real import at `:2`, which is why the file count is 16 and the import count is 14) |

⚠ **Caveat:** these three comment references name `params.ts`, which under a **split** move would *not*
relocate. Under a **whole-directory** move they all become stale. Either way the codemod must include them.

**OUTSIDE `apps/frontend` — 2 files the CONTEXT's census does not contain:**

| File:line | Import |
|-----------|--------|
| `tests/tests/utils/buildRoute.ts:2` | `import { ROUTE } from '../../../apps/frontend/src/lib/utils/route/route';` |
| `tests/tests/utils/buildRoute.ts:3` | `import type { Route } from '../../../apps/frontend/src/lib/utils/route/route';` |
| `tests/tests/utils/axeScan.ts:39` | `import type { Route } from '../../../apps/frontend/src/lib/utils/route/route';` |

These are **deep relative** imports from the Playwright workspace, deliberate: `buildRoute.ts:1` says
*"Use direct import to avoid loading other modules which depend on `$app/...`"*. They are **not** covered by
`$lib` and **not** covered by any grep for `$lib/utils/route`. `yarn typecheck:tests`
(`package.json:37`, part of `lint:check` at `:35`) compiles these; missing them turns `lint:check` red and
breaks the entire Playwright suite's compilation.

**`loginRedirectTarget` — exactly 2 importers + 1 doc reference (fact 21 confirmed, verbatim):**

| File:line | Text |
|-----------|------|
| `routes/candidate/login/+page.server.ts:13` | `import { safeRedirectTarget } from '../../loginRedirectTarget';` |
| `routes/admin/login/+page.server.ts:15` | `import { safeRedirectTarget } from '../../loginRedirectTarget';` |
| `apps/frontend/src/routes/README.md:18` | prose: "`loginRedirectTarget.ts` is shared" |

Plus **2 further in-file mentions** the codemod should keep accurate:
`routes/candidate/login/+page.server.ts:20` and `routes/admin/login/+page.server.ts:22` — both
`// Caller-controlled: see \`loginRedirectTarget.ts\`. …`. And `loginRedirectTarget.ts:13` itself mentions
`candidate/(protected)` in prose.

**Census summary the planner should carry:**

| Surface | Files | Import lines |
|---------|------:|-------------:|
| `lib/` importers of `utils/route` | 8 | 10 |
| `routes/` importers of `utils/route` | 14 | 17 |
| `routes/` comment-only mentions of `utils/route` | 3 lines in 3 files (1 overlaps an importer) | — |
| **`tests/` deep-relative importers of `route.ts`** | **2** | **3** |
| `loginRedirectTarget` importers | 2 | 2 (+3 prose mentions incl. `README.md:18`) |
| **Total files touched by the codemod** | **≈27** | — |

### A.3 — Alias resolution: **no config change is required**

`$lib` is a **SvelteKit built-in** alias (`src/lib`), not a project alias. `apps/frontend/svelte.config.js:11-15`
declares only `$types`, `$voter`, `$candidate`. `apps/frontend/tsconfig.json:2` extends
`./.svelte-kit/tsconfig.json`, which SvelteKit generates with the `$lib` path mapping.
`apps/frontend/vitest.config.ts:26` mirrors it: `{ find: '$lib', replacement: path.resolve(__dirname, 'src/lib') }`.

Therefore `$lib/routes` and `$lib/cookies` **resolve automatically** the moment the directories exist, in
`vite`, `svelte-check` and `vitest` alike. **No `svelte.config.js`, `tsconfig.json` or `vitest.config.ts`
edit is needed.** [VERIFIED: apps/frontend/svelte.config.js:11-15, apps/frontend/vitest.config.ts:26-29,
apps/frontend/tsconfig.json:2]

D-G1's rejection of option (c) ("adds a fifth path alias") is consistent with this: option (a) adds **zero**
aliases, which is the strongest argument for it.

### A.4 — Whole-directory move vs. split (CONTEXT `<open>` #4) — **RECOMMENDED: move the whole directory**

**Evidence for the whole-directory move:**

1. **`buildRoute.ts` cannot leave alone.** It imports `./filterPersistent`, `./params`, `./parseParams`,
   `./route` (`buildRoute.ts:4-7,10-11`). A split leaves `$lib/routes/buildRoute.ts` reaching back into
   `$lib/utils/route/` for three modules — the exact "buried under `utils/`" problem D-G1(a) exists to end,
   now made worse by being *half* buried.
2. **The barrel would straddle two loci.** `index.ts` re-exports five modules; two of them would live
   elsewhere. Every one of the 22 in-repo importers imports **through the barrel** except
   `routes/(voters)/constituencies/+page.svelte:22-23`. A straddling barrel means the codemod either
   rewrites nothing (and `$lib/utils/route` stays the discoverable name — criterion 3 unmet) or rewrites
   everything anyway (and the split bought nothing).
3. **Nobody imports `params`/`parseParams`/`impliedParams`/`filterPersistent` for a non-route purpose.**
   All 22 importers are consuming route/URL-param machinery. There is no cohesion argument for keeping half
   of it under `utils/`.
4. **`parseParams.test.ts` colocates with `parseParams.ts`.** A split forces a decision about the test's
   home for no gain.

**Cost of the widening:** four extra files move (`params.ts`, `parseParams.ts` + its test,
`impliedParams.ts`, `filterPersistent.ts`) — a `git mv` of a directory rather than of two files. The import
rewrite is *identical in size either way* because the barrel specifier is the same string.

> ⚠ **DEVIATION — must be raised, not assumed.** D-G1's letter names only `buildRoute.ts` and `route.ts`.
> Moving the whole `route/` directory is a **widening of the decision**. The planner must encode this as a
> `checkpoint:decision` with the two options stated:
> **(A) whole-directory move** — `git mv apps/frontend/src/lib/utils/route apps/frontend/src/lib/routes`,
> then add `loginRedirectTarget.ts` and export the `(protected)` pattern. One specifier rewrite
> (`$lib/utils/route` → `$lib/routes`), plus 3 deep-import rewrites and 1 relative-import fix.
> **(B) split** — move only `buildRoute.ts` + `route.ts`; `$lib/routes/buildRoute.ts` then imports
> `$lib/utils/route/{filterPersistent,params,parseParams}` and the barrel is split in two. Criterion 3's
> "route definitions live in one centralised locus" is only half-satisfied.
> **Recommendation: (A).** Record the widening in the phase summary either way.

### A.5 — Recommended internal layout of `$lib/routes/`

Flat, barrel preserved (Claude's Discretion allows either; flat is the lower-risk choice because it keeps
every existing relative specifier inside the directory valid):

```
apps/frontend/src/lib/routes/
├── index.ts              # barrel: adds './loginRedirectTarget' and './protected' to the existing five
├── buildRoute.ts         # moved; ONE edit: '../removeDuplicates' → '$lib/utils/removeDuplicates'
├── route.ts              # moved; EXPORT the (protected) pattern (see § E.1)
├── params.ts             # moved (option A)
├── parseParams.ts        # moved (option A)
├── parseParams.test.ts   # moved (option A)
├── impliedParams.ts      # moved (option A)
├── filterPersistent.ts   # moved (option A); still NOT in the barrel (preserve current behaviour)
└── loginRedirectTarget.ts # moved from routes/; add to barrel
```

Keep `filterPersistent` out of the barrel — `constituencies/+page.svelte:22` deep-imports it today and
adding it to the barrel would be a behaviour-neutral but unrequested change. Note it in the summary.

### A.6 — Mechanical codemod recipe

```bash
# 0. Preconditions: clean tree; `yarn build` green; note the pre-move importer count.
grep -rn "utils/route" apps/frontend/src tests | grep -v node_modules | wc -l   # expect 30 lines / ~27 files

# 1. The move (option A). Use `git mv` so rename detection keeps blame intact.
git mv apps/frontend/src/lib/utils/route apps/frontend/src/lib/routes
git mv apps/frontend/src/routes/loginRedirectTarget.ts apps/frontend/src/lib/routes/loginRedirectTarget.ts

# 2. Alias-specifier rewrite (covers the barrel AND the two deep imports at constituencies/+page.svelte:22-23,
#    AND the three comment references).
grep -rl "\$lib/utils/route" apps/frontend/src \
  | xargs sed -i '' "s|\$lib/utils/route|\$lib/routes|g"

# 3. The deep RELATIVE imports in tests/ (NOT covered by step 2 — this is the step the CONTEXT's census misses).
grep -rl "apps/frontend/src/lib/utils/route" tests \
  | xargs sed -i '' "s|apps/frontend/src/lib/utils/route|apps/frontend/src/lib/routes|g"

# 4. The one outbound relative import inside the moved file.
#    apps/frontend/src/lib/routes/buildRoute.ts:8  '../removeDuplicates' -> '$lib/utils/removeDuplicates'

# 5. The two loginRedirectTarget importers (relative -> alias).
#    routes/candidate/login/+page.server.ts:13  '../../loginRedirectTarget' -> '$lib/routes'
#    routes/admin/login/+page.server.ts:15      '../../loginRedirectTarget' -> '$lib/routes'
#    (Both files import buildRoute from the same barrel already — merge into one import statement,
#     which `import/order` + prettier will want anyway.)

# 6. Doc reference.
#    apps/frontend/src/routes/README.md:18  — restate that loginRedirectTarget now lives in $lib/routes.

# 7. Residue check — must return ZERO.
grep -rn "utils/route" apps packages tests --exclude-dir=node_modules --exclude-dir=.svelte-kit
grep -rn "loginRedirectTarget" apps tests --exclude-dir=node_modules --exclude-dir=.svelte-kit
```

**Verification, in this order (each must be green before the next):**

| Step | Command | Catches |
|------|---------|---------|
| 1 | `yarn build` | broken module resolution in the package graph |
| 2 | `yarn workspace @openvaa/frontend typecheck` (`svelte-kit sync && svelte-check`) | every `$lib/utils/route` specifier that survived, in `.ts` **and** `.svelte` |
| 3 | `yarn typecheck:tests` (`tsc -p tests/tsconfig.json --noEmit`) | **the two `tests/tests/utils/` deep imports** — this is the step that makes step 3 of the codemod non-optional |
| 4 | `yarn lint:check` | import ordering, the deep-relative-`lib` ban (`apps/frontend/eslint.config.mjs:102-108`), and (post-152) the planning-reference comment scan |
| 5 | `yarn test:unit` | `parseParams.test.ts` still resolves after the move |
| 6 | `yarn test:e2e` (full suite) | the cardinal gate — `tests/tests/utils/buildRoute.ts` is used by the a11y and journey specs |

⚠ **`sed -i ''` is the BSD/macOS form.** On Linux/CI it is `sed -i`. Prefer a small Node script or
`perl -pi -e` if the codemod is to run anywhere but this machine.

⚠ **D-N1 applies to every comment the move touches.** The three `$lib/utils/route/params.ts` comment
references and `README.md:18` are comments/docs the phase rewrites; none may gain a `.planning/` path, and
none may use `--` as a dash.

---

## B. The `lib/utils` PROPOSAL document (D-G1 NOTES — binding, SCOPE-FENCED)

> **SCOPE FENCE, restated so a planner cannot miss it:** this deliverable is **a written proposal**.
> **No file beyond `buildRoute.ts`, `route.ts`, the rest of `route/` (if the § A.4 checkpoint chooses (A)),
> and `loginRedirectTarget.ts` may move in Phase 158.** A plan task that moves `color/` or `matching/` has
> exceeded the decision.

The proposal task is a **writing** task. Everything it needs to reason from is measured below.

### B.1 — Full inventory of `apps/frontend/src/lib/utils/` (measured 2026-08-28)

**Six subdirectories:**

| Subdir | Files | Contents |
|--------|------:|----------|
| `aria/` | 1 | `focus.ts` |
| `color/` | 8 | `adjustContrast.ts`, `ensureColors.ts`, `luminance.ts`, `parseColors.ts`, `parseColorString.ts`, `PreviewColorContrast.svelte`, `rgb.ts`, `rgbToHex.ts` |
| `matching/` | 10 | `imputeParentAnswers.{ts,test.ts,type.ts}`, `index.ts`, `mean.{ts,test.ts}`, `median.{ts,test.ts}`, `mode.{ts,test.ts}` |
| `questions/` | 2 | `electionTags.ts`, `index.ts` |
| `route/` | 8 | leaves under D-G1 (see § A) |
| `text/` | 3 | `abbreviate.ts`, `toNameCase.ts`, `ucFirst.ts` |

**28 top-level files, 1194 lines total** (the total includes the 4 colocated test files):

| File | Lines | | File | Lines |
|------|------:|-|------|------:|
| `settings.test.ts` | 128 | | `entities.ts` | 30 |
| `matches.ts` | 119 | | `image.ts` | 27 |
| `image.test.ts` | 113 | | `freeze.ts` | 26 |
| `sorting.ts` | 77 | | `getAllianceSummary.ts` | 23 |
| `links.ts` | 71 | | `hashIds.ts` | 16 |
| `multiChoiceValidity.test.ts` | 69 | | `purgeNullish.ts` | 15 |
| `components.ts` | 57 | | `constants.ts` | 15 |
| `entityDetails.ts` | 52 | | `logger.ts` | 13 |
| `settings.ts` | 51 | | `timing.ts` | 11 |
| `onKeyboardFocusOut.ts` | 48 | | `sanitize.ts` | 11 |
| `viewTransition.ts` | 44 | | `breakpoints.ts` | 11 |
| `email.ts` | 43 | | `regexp.ts` | 9 |
| `hashIds.test.ts` | 40 | | `removeDuplicates.ts` | 6 |
| `entityCards.ts` | 38 | | `multiChoiceValidity.ts` | 31 |

**`lib/` siblings the proposal must reason against** (`ls apps/frontend/src/lib`, measured):
`_guards/`, `admin/`, `api/`, `auth/`, `candidate/`, `components/`, `contexts/`, `dynamic-components/`,
`i18n/`, `paraglide/`, `server/`, `supabase/`, `types/`, `utils/` — plus, after this phase,
`cookies/` and `routes/`.

### B.2 — Sections the proposal should name (a starting frame, not a verdict)

The proposal must name **sections, not individual files** (Claude's Discretion). Six candidate sections
emerge from the inventory; the proposal should adopt, merge or reject each with a reason:

| Proposed section | Members | Argument for promoting to `lib/` | Argument against |
|------------------|---------|----------------------------------|------------------|
| **`lib/theme/`** (or fold into an existing home) | `color/` (8), `viewTransition.ts`, `breakpoints.ts`, `darkMode`-adjacent bits of `settings.ts` | `color/` is the second-largest subdir, is domain-specific (DaisyUI theme tokens, contrast), and carries a `.svelte` file — a component inside `utils/` is a smell in itself | 8 files is small; `PreviewColorContrast.svelte` arguably belongs in `components/` regardless |
| **`lib/matching/`** | `matching/` (10) + `matches.ts` (119) | Largest cohesive cluster (~11 files); it is *the app's core domain*, mirrors the `@openvaa/matching` package name, and `matches.ts` is the largest top-level file | Name collision with the workspace package `@openvaa/matching` could confuse readers — the proposal must address this |
| **`lib/a11y/`** | `aria/focus.ts`, `onKeyboardFocusOut.ts` | WCAG 2.1 AA is a stated project requirement; a named `a11y` locus is discoverable and matches the spike-016 work | Only 2 files today |
| **`lib/text/`** or `lib/format/` | `text/` (3), `abbreviate`/`toNameCase`/`ucFirst`, plus `sanitize.ts`, `regexp.ts` | Genuinely generic string helpers — the *strongest* case for something staying named `utils` | Which is the point: this section is the argument for `utils/` continuing to exist |
| **Absorb into existing siblings** | `entities.ts`, `entityCards.ts`, `entityDetails.ts`, `getAllianceSummary.ts`, `links.ts` → `lib/dynamic-components/` or `lib/types/`; `components.ts` (`concatClass`) → `lib/components/`; `settings.ts`+`settings.test.ts` → adjacent to `@openvaa/app-shared` settings consumers; `questions/` → `lib/components/questions/` | These are not generic utilities — they are helpers *for* a specific sibling. Moving them to the sibling is cheaper than inventing a locus | Each move has its own importer census; the proposal must not pretend they are free |
| **Stays in `utils/` (the residue)** | `freeze.ts`, `purgeNullish.ts`, `removeDuplicates.ts`, `timing.ts`, `hashIds.*`, `image.*`, `email.ts`, `multiChoiceValidity.*`, `constants.ts`, `sorting.ts` | Genuinely cross-cutting, zero-domain helpers. **A proposal that empties `utils/` is wrong** — the residue is the proof that `utils/` earns its name | — |

**Two members with special dispositions the proposal must record:**

- **`logger.ts` (13 lines) — do NOT propose a home.** Phase 157's D-F5 NOTES moves it to
  `packages/app-shared`. The proposal should say so and stop. [VERIFIED: `apps/frontend/src/lib/utils/logger.ts`
  is 13 lines and reads `constants.PUBLIC_DEBUG` + `import.meta.env.DEV`; `157-CONTEXT.md` D-F5]
- **`route/` — already dispositioned by D-G1.** List it as *resolved by this phase*, not as a proposal item.

### B.3 — Selection criteria the proposal should state up front

So the document is a *decision framework* rather than a list of opinions, recommend it state its test
explicitly. A suggested one, grounded in what `lib/` already contains:

> A section leaves `utils/` for `lib/` when **(a)** it names a *domain concept a reader would search for by
> name* (`routes`, `cookies`, `auth`, `matching`, `theme`) rather than a *mechanism* (`freeze`,
> `removeDuplicates`); **(b)** it has ≥ 3 members or is expected to grow; and **(c)** no existing `lib/`
> sibling is already the obvious owner — if one is, absorb rather than promote.

Criterion (c) is what distinguishes this phase's own two moves (`routes/`, `cookies/` — no existing owner)
from `components.ts` (owner: `lib/components/`).

### B.4 — Deliverable shape

- **Location:** the phase directory — `.planning/phases/158-routing-auth-surface-harmonisation/158-LIB-UTILS-PROPOSAL.md`
  (Claude's Discretion on the exact filename; it must live in the phase dir).
- **Must contain:** the § B.1 inventory (so the next reader does not re-measure), the § B.3 criteria, one
  section per proposed grouping with a **recommend / absorb / keep** verdict and a one-paragraph reason, an
  explicit **"not proposed"** list, and a closing statement that **nothing in it is executed by Phase 158**.
- **Must NOT contain:** a migration order, a codemod, or a task list. Those would read as authorisation.

---

## C. Cookies (D-G2, criterion 2)

### C.1 — The definitive call-site table (18 sites, 6 files)

Measured with `grep -rn "cookies\.\(get\|set\|delete\|getAll\|setAll\)"` plus a separate literal search for
the four names, over `apps/frontend/src` and `tests`.

| # | File:line | Op | Cookie name | Notes |
|--:|-----------|----|-------------|-------|
| 1 | `routes/api/oidc/authorize/+server.ts:31` | set | `oidc_state` | the reviewer's original comment anchor |
| 2 | `routes/api/oidc/authorize/+server.ts:40` | set | `oidc_nonce` | |
| 3 | `routes/api/oidc/callback/+server.ts:42` | get | `oidc_state` | |
| 4 | `routes/api/oidc/callback/+server.ts:45` | delete | `oidc_state` | |
| 5 | `routes/api/oidc/callback/+server.ts:46` | delete | `oidc_nonce` | |
| 6 | `routes/api/oidc/callback/+server.ts:50` | delete | `oidc_state` | second delete on a different branch |
| 7 | `routes/api/oidc/callback/+server.ts:56` | get | `oidc_code_verifier` | |
| 8 | `routes/api/oidc/callback/+server.ts:58` | delete | `oidc_code_verifier` | |
| 9 | `routes/api/oidc/callback/+server.ts:91` | get | `oidc_nonce` | |
| 10 | `routes/api/oidc/callback/+server.ts:93` | delete | `oidc_nonce` | |
| 11 | `routes/api/oidc/callback/+server.ts:97` | set | `id_token` | |
| 12 | `routes/api/oidc/token/+server.ts:43` | set | `id_token` | |
| 13 | `routes/api/oidc/token/+server.ts:63` | delete | `id_token` | |
| 14 | `routes/candidate/preregister/+layout.server.ts:24` | get | `id_token` | |
| 15 | `routes/candidate/preregister/+layout.server.ts:33` | delete | `id_token` | |
| 16 | `routes/api/candidate/preregister/+server.ts:6` | get | `id_token` | |
| 17 | `routes/api/candidate/preregister/+server.ts:44` | delete | `id_token` | |
| **18** | **`routes/candidate/preregister/+page.svelte:111`** | **set (`document.cookie`)** | **`oidc_code_verifier`** | **CLIENT-SIDE.** `document.cookie = \`oidc_code_verifier=${codeVerifier}; path=/; max-age=600; secure; samesite=lax\`` |

**Per-file totals:** `api/oidc/callback` 9 · `api/oidc/authorize` 2 · `api/oidc/token` 2 ·
`candidate/preregister/+layout.server.ts` 2 · `api/candidate/preregister` 2 ·
**`candidate/preregister/+page.svelte` 1** = **18 across 6 files**.

**This settles the 17-vs-18 dispute.** Fact 22 measured 17 by scoping to `cookies.*`; `REQUIREMENTS.md:142`
says 18 across 5 files; the ROADMAP's corrected entry says 17 across 5. **The truth is 18 across 6.** Site 18
is not a test file — it is production code, and it is the **only producer of `oidc_code_verifier`** in the
whole app (sites 7 and 8 only read and delete it). A const module that omits it fails the reviewer's own
word: *"Check **all** cookies written by the app."*

**Cookie names — 4, confirmed:** `id_token`, `oidc_state`, `oidc_nonce`, `oidc_code_verifier`.

**Test-file references (out of scope for the const map; in scope for the detector's exclusion set):**
`lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:201-202,218-219` — asserts
`event.cookies.set` was called with `'oidc_state'` / `'oidc_nonce'`. These *should* be rewritten to import
the const so the assertion and the production code cannot drift; that is a bonus, not a requirement.

### C.2 — Closing CONTEXT `<open>` #5: the Supabase SSR bridge must not false-positive

The bridge, verbatim:

```
apps/frontend/src/lib/supabase/server.ts:13      getAll: () => event.cookies.getAll(),
apps/frontend/src/lib/supabase/server.ts:16      event.cookies.set(name, value, { ...options, path: '/' });
```

`name` is a **binding identifier** supplied by `@supabase/ssr`; the app does not choose it. These cookies are
therefore **out of scope for the const map** (the app cannot declare a name it does not own).

**How the detector excludes them without a blanket file exclusion — the rule is syntactic, not positional:**

> The detector flags a cookie operation **only when its first argument is a string literal or a template
> literal with no expressions.** An operation whose first argument is an identifier, a member expression, or
> anything else is not a *name declaration* and is out of scope by construction.

`server.ts:16`'s first argument is the identifier `name` → not a literal → **not flagged**, with no file
exclusion anywhere. `server.ts:13`'s `getAll()` takes no name argument at all → **not flagged**.
Crucially, if someone later writes `event.cookies.set('sb-access-token', …)` **in that same file**, the first
argument *is* a literal and it **is** flagged. That is exactly the property CONTEXT `<open>` #5 asks for: the
bridge is safe, and a real literal cannot hide behind it.

The same rule handles `document.cookie` (site 18) as a **separate detector clause**: an assignment to
`document.cookie` whose right-hand side is a template literal is flagged unless the leading name segment is a
`${…}` interpolation of a `COOKIE` member. Post-fix, site 18 becomes:

```ts
document.cookie = `${COOKIE.oidcCodeVerifier}=${codeVerifier}; path=/; max-age=600; secure; samesite=lax`;
```

⚠ **Additional false-positive class the detector must avoid — measured.** The literal `'id_token'` appears
in the repo as an **OIDC/JSON field name**, not a cookie name, at least here:
`lib/api/utils/auth/providers/idura.ts:111` (`const { id_token } = await response.json()`),
`lib/api/utils/auth/providers/signicat.ts:78` (same), `routes/api/candidate/preregister/+server.ts:17`
(`body: { id_token: idToken }`), and throughout
`apps/supabase/supabase/functions/identity-callback/index.ts`. **A detector that greps for the four *names*
repo-wide is unusable.** The detector must key on the **operation** (`cookies.get|set|delete`,
`document.cookie =`), never on the string.

### C.3 — Detector mechanism: comparison and recommendation

**In-repo precedents, both already load-bearing:**

| Precedent | Shape | Wired into |
|-----------|-------|-----------|
| `apps/frontend/eslint.config.mjs:89-110` + `:111-…` | scoped `no-restricted-imports` / `no-restricted-syntax` blocks | `turbo run lint` → `lint:check` (`package.json:35`) |
| `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` | vitest self-test that runs the **real** ESLint config against synthetic probe files and asserts the guard **fires** and **stays silent** (30 cases) | `yarn test:unit` |
| `scripts/assert-a11y-scan-wiring.mjs` | **plain Node, built-ins only, regex read of source files, `exit 1` naming the specific problem**; explicitly *"deliberately NOT an AST parse"* (its own docblock) | `package.json:35` — `yarn assert:a11y-scan-wiring`, inside both `lint:check` and `test:e2e` |
| `scripts/assert-i18n-catalog-namespaces.mjs`, `scripts/assert-unit-test-coverage.mjs` | same house style | `lint:check` / `test:unit` |

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **(A) Node script in `scripts/`, regex over source, wired into `lint:check`** | Matches the repo's established house style for exactly this job (3 existing scripts). Zero new dependencies. Names the file:line and exits 1. Runs in the gate that already exists. Handles the `document.cookie` clause trivially. | Regex, not AST — must be written carefully (multi-line `cookies.set(\n  'name',` needs a tolerant pattern). | **RECOMMENDED** |
| (B) ESLint rule (`no-restricted-syntax` with an AST selector) | Fails at the exact node; runs in `turbo run lint`. | `no-restricted-syntax` selectors cannot express "literal first argument to a member call named `cookies.set`" **and** the `document.cookie` assignment in one readable rule; a custom rule means a new local plugin package. Also inherits the flat-config REPLACE-not-merge trap documented at `eslint.config.mjs:85-88,115`. And it cannot express the **collision** failure mode at all (that is a value check, not a syntax check). | Rejected |
| (C) ts-morph / TypeScript compiler API vitest test | True AST; precise. | Adds a runtime dependency to a repo that has solved this three times with zero dependencies. `.svelte` files (site 18) are not TS — ts-morph cannot parse `candidate/preregister/+page.svelte` at all without a preprocessor. **This alone disqualifies it**, since site 18 is the one the phase most needs. | Rejected |

**Recommended split — the two failure modes want two homes:**

| Failure mode | Where it lives | Why |
|---|---|---|
| **(i) a cookie-name literal at a write site** | `scripts/assert-cookie-names.mjs`, wired into `lint:check` (`package.json:35`) | It is a *source scan*. Must run in the same gate as the other three scans, and must run without a test runner. |
| **(ii) two cookie names collide** | a vitest test colocated at `apps/frontend/src/lib/cookies/cookies.test.ts` | It is a *value* assertion over the imported const map — `new Set(Object.values(COOKIE)).size === Object.keys(COOKIE).length`. Runs in `yarn test:unit`. No file scan needed. |

Both are cheap; both are named in criterion 2; nothing requires them to share a mechanism.

### C.4 — Proving BOTH failure modes fail before the guard is claimed to work

This is the project's standing rule (`STATE.md:243`, "prove the guard fails before claiming it guards";
precedent `143-NEGATIVE-CONTROL-LEDGER.md`). Concretely, for 158:

**Mode (i) — literal at a write site.** Plant, observe red, remove, observe green. Plant **four** controls,
one per syntactic form, because a regex that catches one may miss the others:

| Control | Planted at | Expected |
|---|---|---|
| single-line `cookies.set('sb-probe', …)` | any `+server.ts` under `routes/api/` | red, naming that file:line |
| multi-line `cookies.set(\n  'sb-probe',\n  …)` | same | red — **this is the one a naive `cookies\.set\('` regex misses** |
| `cookies.get('sb-probe')` | same | red |
| `document.cookie = \`sb-probe=x; path=/\`` | `candidate/preregister/+page.svelte` | red — proves the `.svelte` clause |
| **negative control:** `event.cookies.set(name, value, …)` at `lib/supabase/server.ts:16` **left untouched** | — | **green** — proves the bridge is not excluded by file, but by shape |
| **negative control:** the post-fix `${COOKIE.oidcCodeVerifier}=` form | `candidate/preregister/+page.svelte:111` | green |

**Mode (ii) — collision.** Temporarily add a fifth key with a duplicate value to the frozen map; the vitest
test must go red naming both keys; remove it; green. Also assert `Object.isFrozen(COOKIE)` so the "frozen"
half of D-G2 is checked rather than assumed.

Record all of it in a `158-NEGATIVE-CONTROL-LEDGER.md` in the phase directory, copying the Phase 143 shape.

### C.5 — The const module

```ts
// apps/frontend/src/lib/cookies/index.ts
/**
 * Every cookie name this application chooses. One declaration site, so two files
 * cannot disagree and two cookies cannot silently share a name.
 *
 * NOT covered here: the Supabase auth cookies written through the SSR bridge in
 * `$lib/supabase/server.ts`. Their names are chosen by `@supabase/ssr`, not by
 * this app, so they cannot be declared here.
 */
export const COOKIE = Object.freeze({
  idToken: 'id_token',
  oidcState: 'oidc_state',
  oidcNonce: 'oidc_nonce',
  oidcCodeVerifier: 'oidc_code_verifier'
} as const);

export type CookieName = (typeof COOKIE)[keyof typeof COOKIE];
```

Must be **browser-safe**: site 18 imports it into a `.svelte` component. A plain frozen object with no
`$env/dynamic/private` or `node:` import satisfies that. Placing it at `lib/cookies/index.ts` matches the
reviewer's named location (`api/oidc/authorize/+server.ts:31`: *"place it in `lib/cookies` or so"*) and
D-G2's rejection of putting it in the routes locus.

---

## D. The login collapse (D-G3, criteria 1 and 5)

### D.1 — The three entry points, diffed

**`routes/admin/login/+page.server.ts` (61 lines) and `routes/candidate/login/+page.server.ts` (59 lines)
are near-identical.** Structure, line by line:

| Step | admin | candidate | Same? |
|------|-------|-----------|-------|
| docblock: "uses `locals.supabase` directly instead of `/api/auth/login`, so `Set-Cookie` lands on THIS response" | `:1-10` | `:1-8` | ✅ same argument |
| imports `fail, redirect` / `logDebugError` / `buildRoute` / `safeRedirectTarget` | `:12-15` | `:10-13` | ✅ |
| read `email`, `password` from `formData()` | `:19-21` | `:17-19` | ✅ |
| `safeRedirectTarget(data.get('redirectTo'))` | `:23` | `:21` | ✅ |
| `locals.supabase.auth.signInWithPassword({ email, password })` → `fail(400)` | `:27-31` | `:25-29` | ✅ (log prefix differs) |
| `locals.safeGetSession()` → `fail(500)` | `:34-38` | `:32-36` | ✅ (log message differs) |
| decode JWT: `JSON.parse(atob(session.access_token.split('.')[1]))`, read `payload.user_roles ?? []` | `:41-42` | `:39-40` | ✅ byte-identical logic |
| **role predicate** | `:43` `['project_admin','account_admin','super_admin'].includes(r.role)` | `:41` `r.role === 'candidate' \|\| r.role === 'party'` | ❌ **differs** |
| on failure: `signOut({scope:'local'})` + log + `fail(403)` | `:45-49` | `:43-47` | ✅ (log message differs) |
| **redirect target** | `:51-59` `AdminAppHome` | `:49-57` `CandAppHome` | ❌ **differs** |
| `redirectTo` override: `` `/${locals.currentLocale}/${redirectTo}` `` | `:54` | `:52` | ✅ — **and both are hand-built strings, in criterion 3's sweep** |

**`routes/api/auth/login/+server.ts` (77 lines) is a completely different animal.** It goes through the
`dataWriter` abstraction, not `locals.supabase`; it returns JSON rather than redirecting; it takes an
optional `role` in the request body; it calls `getBasicUserData({authToken:''})` and `backendLogout`; and it
mutates `locals.currentLocale` from `userData.settings.language` (`:48-51`). D-G3's rejection of option (b)
("form actions and a JSON endpoint have different error and redirect semantics") is *measurably* correct.

### D.2 — Proposed `$lib/auth` helper

`lib/auth/` exists today with exactly two files: `getUserData.ts` (1311 bytes) and `index.ts` (31 bytes).
This is an addition to a real directory.

```ts
// apps/frontend/src/lib/auth/roles.ts
/**
 * Role sets the frontend gates on. The database's RLS policies remain the
 * authoritative boundary; these sets decide which app a signed-in user may enter.
 */
export const ADMIN_ROLES = Object.freeze(['project_admin', 'account_admin', 'super_admin'] as const);
export const CANDIDATE_ROLES = Object.freeze(['candidate', 'organization'] as const); // see the 156 note below

export function hasAnyRole(roles: ReadonlyArray<{ role: string }>, allowed: ReadonlyArray<string>): boolean {
  return roles.some((r) => allowed.includes(r.role));
}

/** Extract `user_roles` from a Supabase access token's payload. */
export function readUserRoles(accessToken: string): Array<{ role: string }> { /* the :41-42 / :39-40 body */ }
```

```ts
// apps/frontend/src/lib/auth/passwordLogin.ts
export type PasswordLoginOutcome =
  | { ok: true; session: Session; user: User }
  | { ok: false; status: 400 | 500 | 403; reason: string };

/**
 * Sign in with a password on the CALLER'S response, so Set-Cookie propagates.
 * `locals` is required, not optional -- creating a client here would reintroduce
 * the nested-response bug both route docblocks warn about.
 */
export async function passwordLogin(
  locals: App.Locals,
  opts: { email: string; password: string; allowedRoles: ReadonlyArray<string>; logLabel: string }
): Promise<PasswordLoginOutcome>;
```

**Residue left in each wrapper (this is the whole point of D-G3(a) — the wrappers stay, but become thin):**

```ts
// routes/admin/login/+page.server.ts  -- after
export const actions = {
  default: async ({ request, locals }) => {
    const data = await request.formData();
    const redirectTo = safeRedirectTarget(data.get('redirectTo') as string | null);
    const result = await passwordLogin(locals, {
      email: data.get('email') as string,
      password: data.get('password') as string,
      allowedRoles: ADMIN_ROLES,
      logLabel: 'Admin login'
    });
    if (!result.ok) return fail(result.status);
    return redirect(303, buildRoute({
      route: 'AdminAppHome', locale: locals.currentLocale, ...(redirectTo ? { /* see § F */ } : {})
    }));
  }
};
```

— about 15 lines, from 61. `candidate/login` is the same with `CANDIDATE_ROLES` / `'CandAppHome'` /
`'Candidate login'`. The `logLabel` parameter is what preserves the three distinct log messages per file
without a role switch.

⚠ **The `redirectTo` branch is criterion 3's business, not D-G3's.** Both files today do
`` `/${locals.currentLocale}/${redirectTo}` `` (`admin:54`, `candidate:52`). See § F for the recommended
handling; do **not** silently drop it during the extraction.

### D.3 — Does the admin role triple appear elsewhere? — **measured: NO, in the frontend**

`grep` for `project_admin` across `apps/frontend/src` finds it only at
`routes/admin/login/+page.server.ts:43`. `lib/_guards/` contains exactly one file
(`eslint-store-guard.test.ts`) — it is a lint-guard directory, not an auth-guard directory, despite the name.
So the extraction has **one** frontend consumer today.

It is *not* the only place the concept lives: the role names are a Postgres enum (`user_role_type`) and the
RLS policies in `apps/supabase/` are the authoritative gate (see `REVIEW-DB-02`, `REQUIREMENTS.md:122`).
**Recommendation:** extract as `ADMIN_ROLES` in `$lib/auth`, and have its docblock state plainly that RLS is
authoritative and this set is an app-entry gate — otherwise a future reader mistakes it for the boundary.

⚠ **Phase 156 coupling on the candidate side.** `candidate/login/+page.server.ts:41` reads
`r.role === 'candidate' || r.role === 'party'`, and Phase 156 renames `party` → `organization`
(`REVIEW-DB-01`; `157-CONTEXT.md` names this exact line as an exposed site). If 156 has landed when 158 runs,
`CANDIDATE_ROLES` must be `['candidate','organization']`; if not, `['candidate','party']`. **The extraction
must not silently pick one.** Recommend the plan reads the enum from the tree at execution time and records
which it found. The same predicate also exists at
`lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:180` — a second consumer that could adopt
`CANDIDATE_ROLES`, but that file is Phase 157's surface; leave it.

### D.4 — Moving `candidate/auth/{callback,logout}` under `/api` — the blast radius

**This is the single highest-risk change in the phase**, because one of its consumers is an **exact-match
allowlist outside the frontend**.

| # | Consumer | File:line | What breaks |
|---|----------|-----------|-------------|
| 1 | **Supabase local auth config — exact-URL allowlist** | `apps/supabase/supabase/config.toml:167` — `additional_redirect_urls = ["https://127.0.0.1:3000", "http://127.0.0.1:5173/en/candidate/auth/callback"]` | Invite/recovery emails stop redirecting. The comment at `:165` says *"A list of **exact** URLs"* — no prefix matching. **In-repo fix, but requires `supabase stop && supabase start` to take effect.** |
| 2 | **Supabase Cloud dashboard — the production allowlist** | **OUT OF REPO** | Same breakage in production, invisible to any test. **MUST be flagged as an out-of-repo config change.** |
| 3 | Password-reset email redirect | `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:69` — `` redirectTo: `${origin}/candidate/auth/callback` `` | password reset dead-ends |
| 4 | Client-side logout POST | `supabaseDataWriter.ts:52` — `` await fetch(`/${locale}/candidate/auth/logout`, { method: 'POST' }) `` | httpOnly session cookies never cleared |
| 5 | Unit assertions on both | `supabaseDataWriter.test.ts:125,131,138,141,146,157` (6 lines) | `yarn test:unit` red |
| 6 | E2E callback-URL helper | `tests/tests/fixtures/shared/emailBucket.fixture.ts:214,217` — default `callbackPath = '/en/candidate/auth/callback'` | candidate-journey registration + reset steps fail |
| 7 | E2E invite/reset generation | `tests/tests/utils/supabaseAdminClient.ts:587,628` — both `redirectTo: …/en/candidate/auth/callback` | same |
| 8 | `ROUTE` map | `lib/utils/route/route.ts:54` already maps `CandAppPreregisterIdentityProviderCallback: '/api/oidc/callback'` | precedent that an `/api` path can live in `ROUTE`; the two moved routes should get entries too |

**Two behavioural changes the move causes, both easy to miss:**

- **Locale prefixing disappears.** `/candidate/auth/callback` is a Paraglide-localised page route
  (`vite.config.ts:23` — `strategy: ['url','cookie','baseLocale']`); `/api/*` paths are not. The callback's
  own `const lang = locals.currentLocale ?? 'en'` (`candidate/auth/callback/+server.ts:24`) currently gets
  its locale **from the URL prefix**. After the move it falls back to the cookie strategy, then `'en'`. Every
  redirect the callback emits (`:31,39,44,47,53`) is locale-prefixed — so a Finnish user could land on the
  English password-reset page. **This must be tested, not assumed.**
- **`hooks.server.ts:64` skips `/api` requests entirely** (`pathname.startsWith(NORMALIZED_API_ROOT)` →
  early `resolve`). The `candidateAuthHandle` never runs for the moved routes. That is *correct* for both
  (neither is `(protected)`, and the callback must not be bounced to login), but it is a real semantic change
  worth recording.

> ⚠ **CHECKPOINT recommended.** The `/api` move is a one-way door with an out-of-repo dependency. The planner
> should gate it behind a `checkpoint:human-verify` that (a) confirms the operator will update the Supabase
> Cloud redirect allowlist, and (b) confirms the locale-fallback behaviour is acceptable — or that the moved
> route reads locale from a query param instead.
>
> **A lower-risk sequencing exists and should be offered:** land the `/api` routes as the real
> implementation, keep `candidate/auth/{callback,logout}` as **thin re-export shims** for one milestone, and
> file the shim removal as a todo. This makes the change reversible and removes the out-of-repo coupling from
> the critical path. It does *cost* criterion 5's letter ("move under the generic `/api` routes"), so it is an
> operator call, not a planner call.

### D.5 — `/api/auth/login` has ZERO callers — the measurement

Exhaustive search over `apps`, `packages`, `tests`, `docs` (excluding `node_modules`, `.svelte-kit`):

| Reference | File:line | Kind |
|---|---|---|
| the route definition itself | `routes/api/auth/login/+server.ts` (77 lines) | — |
| `login: \`${API_ROOT}/auth/login\`` | `lib/api/base/universalApiRoutes.ts:12` | a **declared but unused** map entry |
| "instead of going through the `/api/auth/login` route" | `routes/admin/login/+page.server.ts:5` | doc comment saying it is bypassed |
| "instead of going through the /api/auth/login route" | `routes/candidate/login/+page.server.ts:5` | doc comment saying it is bypassed |

**`UNIVERSAL_API_ROUTES.login` is referenced nowhere.** `universalDataWriter.ts` consumes
`.token` (`:57`, `:104`), `.logout` (`:111`), `.preregister` (`:78`), and the six job routes
(`:188,197,205,213,220,228`); `cachifyUrl.ts:8` consumes `.cacheProxy`; `jobStates.svelte.ts:105,108` consume
`.jobsActive`/`.jobsPast`. **`.login` appears in exactly one line of the whole repo — its own definition.**

**The exported types are also orphaned:** `LoginParams` (`+server.ts:59`) and `LoginResult` (`:77`) are
imported by nothing.

**No dynamic construction reaches it.** Every `fetch()` of an `/api/` path in the frontend is either
`UNIVERSAL_API_ROUTES.*` or one of the two literals `'/api/oidc/authorize'`
(`candidate/preregister/+page.svelte:77,96`). No template builds `/auth/login`. No Playwright spec or fixture
requests it (`grep` for `auth/login` over `tests/` returns zero non-artifact hits).

**Asymmetry, confirmed:** `UNIVERSAL_API_ROUTES.logout` **IS** used — `universalDataWriter.ts:111`. Logout
and login are not symmetric, so "delete both or neither" is not an available argument.

> ### ⚠ CHECKPOINT:DECISION — criterion 1's deletion clause fires
>
> The antecedent ("if the generic `/api` login route is left unused by the collapse") is **already true
> before the collapse**. The planner must route this to the operator with **both readings written out**:
>
> **(A) Keep it — D-G3(a)'s letter.** `api/auth/login/+server.ts` becomes the third thin wrapper over the
> shared `$lib/auth` helper. *For:* D-G3(a) is a ticked decision and says "the three route files keep their
> own entry points"; the reviewer's own comment on it (`triage: api/auth/login/+server.ts:1`) is *"Consider
> this also as part of the login harmonisation"* — consider, not delete; a JSON login endpoint is a
> plausible future need for a mobile/admin client. *Against:* it is a **thin wrapper over nothing** — no
> caller exists, so the wrapper cannot be exercised by any test, and an unexercised auth endpoint is attack
> surface. Rewriting it to use `passwordLogin` also changes its semantics (it currently goes through
> `dataWriter`, not `locals.supabase`) with no test to catch a regression.
>
> **(B) Delete it — criterion 1's conditional and `REQUIREMENTS.md:141`.** Remove
> `routes/api/auth/login/`, remove `UNIVERSAL_API_ROUTES.login` (`universalApiRoutes.ts:12`), and leave two
> entry points. *For:* the measurement says it is dead code; deleting dead auth surface is a security
> improvement; `REQUIREMENTS.md:141` states the deletion assertively. *Against:* it contradicts D-G3(a)'s
> "three thin entry points" phrasing, and D-G3's own ⚠ note says the clause "on this choice, does not fire" —
> that note assumed the route had a caller.
>
> **Researcher's reading, offered not imposed:** the CONTEXT's own instruction is *"a fact to measure during
> planning, not to assume in either direction. Record the measurement either way."* The measurement is
> unambiguous. **(B) is the reading the evidence supports**, and D-G3(a)'s substance (no single route, no role
> parameter, a shared helper) survives (B) intact — (B) removes an entry point that has no caller, it does not
> merge two that do. But this is a decision the operator owns, and either way **the measurement above must be
> recorded in the phase summary so the verifier can see why the clause did or did not fire.**

### D.6 — `logDebugError` coupling with Phase 157

`logDebugError` is imported and called across all three login files — **11 call sites plus 3 imports**:

| File | Import | Calls |
|---|---|---|
| `routes/admin/login/+page.server.ts` | `:13` | `:29`, `:36`, `:47` |
| `routes/candidate/login/+page.server.ts` | `:11` | `:27`, `:34`, `:45` |
| `routes/api/auth/login/+server.ts` | `:4` | `:32`, `:42` |

**Phase 157's D-F5 renames the symbol AND moves it to `packages/app-shared`** — every call site imports from
`@openvaa/app-shared`, not `$lib/utils/logger`. Its NOTES are binding and its codemod covers ~85 invocations
and 47 imports across 53 files.

**Coupling rules for 158:**
1. The shared `passwordLogin` helper will absorb 6 of the 11 calls (the two triples in the login actions).
   **If 157 lands first**, write the helper against the post-157 name and import path from the start.
   **If 157 has not landed**, write it against `logDebugError` from `$lib/utils/logger` and accept that 157's
   codemod will rewrite it — that is fine, because 157's codemod is repo-wide and will find `$lib/auth`.
2. **Never reintroduce the old name in a file 157 has already migrated.** The concrete failure mode: 158
   creates `lib/auth/passwordLogin.ts` after 157's codemod ran, with an `import { logDebugError } from
   '$lib/utils/logger'` copied from the old route file. If 157 deleted that module rather than leaving a
   re-export shim, this is a build break; if it left a shim (157's Claude's Discretion allows either), it is a
   silent two-idiom regression. **Recommend a plan task that greps for `logDebugError` in every file 158
   creates or moves, immediately before the phase's final gate.**
3. `$lib/utils/logger` is **not** in 158's move scope. Do not touch it.

---

## E. `hooks.server.ts` (D-G4, criterion 4)

### E.1 — The measured block, and the exact rewrite

```
58  const candidateAuthHandle: Handle = async ({ event, resolve }) => {
59    const { url, route } = event;                              <- route in scope
60    const locale = getLocale();
61    const pathname = url.pathname;
62
63    // Skip non-route and API requests
64    if (route?.id == null || pathname.startsWith(NORMALIZED_API_ROOT)) {
65      return resolve(event);
66    }
67
68    // Handle candidate auth redirects                          <- COMMENT
69    if (pathname.includes('/candidate')) {                      <- THE DEFECT
70      const { session } = await event.locals.safeGetSession();
71      if (session && pathname.endsWith('candidate/login')) {    <- ALSO pathname-based
72        redirect(303, `/${locale}/candidate`);                  <- hand-built route
73      }
74      if (!session && route.id.includes('(protected)')) {       <- the safe idiom
75        const cleanPath = pathname.replace(new RegExp(`^/${locale}`), '');
76        redirect(303, `/${locale}/candidate/login?redirectTo=${cleanPath.substring(1)}`);  <- hand-built
77      }
78    }
79
80    return resolve(event);
81  };
```

[VERIFIED: `apps/frontend/src/hooks.server.ts:58-81`] — `:59` / `:69` / `:74` confirmed exactly as
`158-CONTEXT.md` fact 23 re-measured them and as the ROADMAP's second-pass preamble restored them.

**What `:69` gets wrong:** `pathname.includes('/candidate')` matches (a) the app served from a base path
`/candidate/…` where every route contains the segment, (b) any voter route whose *params* contain the word
(e.g. an entity id or a constituency slug — `/en/results/candidates/candidate-x`), and (c) locale-prefixed
paths only incidentally. `route.id` carries none of that: SvelteKit route ids are base-path-free and
param-placeholder-shaped (`/candidate/(protected)/profile`, `/(voters)/(located)/results/[[electionTab]]/…`).

**The rewrite. Export the patterns from `$lib/routes/route.ts` (they already exist privately at `:1-6`):**

```ts
// apps/frontend/src/lib/routes/route.ts  -- promote the existing private consts to exports
export const CANDIDATE = '/candidate';
export const CANDIDATE_PROT = `${CANDIDATE}/(protected)`;
export const VOTER = '/(voters)';
export const VOTER_LOCATED = `${VOTER}/(located)`;
export const ADMIN = '/admin';
export const ADMIN_PROT = `${ADMIN}/(protected)`;

/** The SvelteKit route-group segment marking a route behind an auth gate. */
export const PROTECTED_GROUP = '(protected)';

/** True when `routeId` names a route inside the Candidate App. */
export function isCandidateRoute(routeId: string): boolean {
  return routeId === CANDIDATE || routeId.startsWith(`${CANDIDATE}/`);
}

/** True when `routeId` names a route behind the `(protected)` group. */
export function isProtectedRoute(routeId: string): boolean {
  return routeId.split('/').includes(PROTECTED_GROUP);
}
```

```ts
// apps/frontend/src/hooks.server.ts  -- after
import { buildRoute, isCandidateRoute, isProtectedRoute, ROUTE } from '$lib/routes';
…
  // Handle candidate auth redirects
  if (isCandidateRoute(route.id)) {
    const { session } = await event.locals.safeGetSession();
    if (session && route.id === ROUTE.CandAppLogin) {
      redirect(303, buildRoute({ route: 'CandAppHome', locale }));
    }
    if (!session && isProtectedRoute(route.id)) {
      const cleanPath = pathname.replace(new RegExp(`^/${locale}`), '');
      redirect(303, buildRoute({ route: 'CandAppLogin', locale, redirectTo: cleanPath.substring(1) }));
    }
  }
```

Four notes on this rewrite:

1. **`route.id` is non-null here** — `:64` has already returned when `route?.id == null`. TypeScript may
   still see `string | null` because the guard is on `route?.id`, not a type predicate. Either narrow with a
   local `const routeId = route.id;` after `:64`, or restructure `:64` as
   `if (route?.id == null || …) return resolve(event); const routeId = route.id;`. **Prefer the latter** — it
   removes the non-null assertion entirely.
2. **`:71` is also pathname-based and equally unsafe.** `pathname.endsWith('candidate/login')` is not named
   by criterion 4 but is the same defect class two lines below the one that is. `route.id === ROUTE.CandAppLogin`
   is exact and free. **Recommend folding it in** and recording the widening.
3. **`isProtectedRoute` uses a segment-split, not `.includes()`.** `route.id.includes('(protected)')`
   (the current `:74`) would match a hypothetical route id containing the substring inside another segment.
   The split form is strictly safer at identical cost.
4. **`:72` and `:76` are criterion 3's hand-built routes** and this rewrite discharges both. `buildRoute` is
   isomorphic (it imports only `$app/paths`, `$lib/paraglide/runtime`, `qs`) so calling it from a server hook
   is safe; `admin/login/+page.server.ts:55` and `candidate/preregister/+layout.server.ts:17` already do.
   ⚠ `redirectTo` is not a declared route param, so `buildRoute` routes it to the **search side** via
   `isRouteParam` (`buildRoute.ts:75-77`) and `qs.stringify` — producing `?redirectTo=…`, which is what `:76`
   builds by hand today. **Verify the produced string matches byte-for-byte** (`qs` percent-encodes; the
   current hand-built form does not). If it differs, `loginRedirectTarget.ts`'s `RELATIVE_APP_PATH` regex
   (`:39`) must still accept the round-tripped value — its character class already permits `%` inside the
   query but **not** in the path segments. **This is a concrete, testable risk; make it an explicit
   verification step.**

### E.2 — The consistency test (pattern ↔ route tree ↔ hook)

**"The route tree" means, mechanically:** the set of directories under `apps/frontend/src/routes/` whose
basename is `(protected)`, discovered by a filesystem walk. Measured today there are exactly two:
`routes/candidate/(protected)/` and `routes/admin/(protected)/`.

The three things that must agree:

| Leg | Source of truth | How to read it |
|---|---|---|
| **Pattern** | `$lib/routes/route.ts` — `PROTECTED_GROUP`, `CANDIDATE_PROT`, `ADMIN_PROT`, and every `ROUTE` value containing `(protected)` | import the module |
| **Route tree** | `apps/frontend/src/routes/**` | `fs.readdirSync` recursive walk; collect directories named `(protected)`, and derive each one's SvelteKit route id by stripping the `apps/frontend/src/routes` prefix |
| **Hook** | `apps/frontend/src/hooks.server.ts` | assert it contains **no** `pathname.includes(` / `pathname.endsWith(` inside `candidateAuthHandle`, and that it imports the predicates from `$lib/routes` |

**Recommended mechanism:** a **vitest test** at `apps/frontend/src/lib/routes/routeConsistency.test.ts`.
Unlike the cookie literal scan, this one **needs to import the module** (to read `ROUTE`) *and* walk the
filesystem — vitest gives both, and `route.ts` has zero imports so it loads in jsdom without any `$app/*`
stub. Complement it with one regex clause inside `scripts/assert-cookie-names.mjs` (or a sibling script) for
the hook-shape leg, so `lint:check` also catches a regression without running the unit suite.

Four assertions:

| # | Assertion | Failure it catches |
|---|-----------|--------------------|
| C1 | Every `(protected)` directory found in the route tree has at least one `ROUTE` entry whose value starts with that group's route id | someone adds `routes/candidate/(protected)/newthing/` and never registers it in `ROUTE` — the hook still guards it (the predicate is structural), but `buildRoute` cannot address it |
| C2 | Every `ROUTE` value containing `PROTECTED_GROUP` corresponds to an existing directory in the route tree | a `ROUTE` entry rots after a route is deleted or renamed |
| C3 | `isProtectedRoute()` returns `true` for every route id derived from the tree walk, and `false` for a sample of non-protected ids (`ROUTE.Home`, `ROUTE.CandAppLogin`, `ROUTE.Results`) | the predicate is a constant — the discriminating half |
| C4 | `hooks.server.ts` source contains no `pathname.includes(` and no `pathname.endsWith(` | the defect class reopens |

**The two failure modes, demonstrated failing (standing rule):**

| Mode | Negative control | Expected |
|---|---|---|
| **(i) pattern drifts from the route tree** | temporarily create `apps/frontend/src/routes/candidate/(protected)/__probe__/+page.svelte` with no `ROUTE` entry | C1 red, naming the directory. Remove → green. Then the mirror: temporarily add `CandAppProbe: '/candidate/(protected)/__gone__'` to `ROUTE` with no directory → C2 red. Remove → green. |
| **(ii) the hook stops using the pattern** | temporarily restore `if (pathname.includes('/candidate')) {` at `hooks.server.ts:69` | C4 red, naming the line. Restore the fix → green. |

Both controls must be **observed red and then observed green**, and recorded in
`158-NEGATIVE-CONTROL-LEDGER.md`. A test that has never been seen red has not been shown to guard anything —
this is the project's standing rule (`STATE.md:243`) and the `eslint-store-guard.test.ts` precedent's whole
reason for existing.

⚠ **C4's regex must be anchored to `candidateAuthHandle`, not the whole file.** A future handler may
legitimately read `pathname` (e.g. the API skip at `:64` uses `pathname.startsWith(NORMALIZED_API_ROOT)`,
which is correct and must not be flagged). Scope the scan to the function body, or ban only
`.includes(`/`.endsWith(` on `pathname` while permitting `.startsWith(`.

### E.3 — `hooks.server.ts:17` (CONTEXT `<open>` #8) — **RECOMMEND: defer with a todo, owned by 157**

Verified anchor: `apps/frontend/src/hooks.server.ts:17` is
`const supabaseHandle: Handle = async ({ event, resolve }) => {`, and `:18` is
`const supabase = createSupabaseServerClient(event);`. The reviewer's ask: *"Paramaterise this dependent on
the adapter configuration and rename to dataAdapterHandle if possible."*

| Disposition | Assessment |
|---|---|
| **Fold into 158** | ❌ The rename is cosmetic; the *parameterisation* half requires a non-Supabase adapter to parameterise against. `lib/server/api/dataProvider.ts:8-14` shows the adapter switch has a `case 'local'` and a `default: Promise.resolve({})` — i.e. **the local adapter is currently disabled**, which is precisely what the 157-owned "reintroduce the local adapter" follow-up is about. Doing the parameterisation now means building an abstraction with one implementation. |
| **Decline** | ❌ It is a real comment on 158's own file and D-N2 says file rather than drop. |
| **✅ Defer with a todo** | The parameterisation is downstream of both Phase 157's adapter boundary (D-F4/REVIEW-ADP-06) and the local-adapter reintroduction. **File `.planning/todos/pending/2026-08-28-hooks-supabase-handle-parameterisation.md`**, anchored at `hooks.server.ts:17`, classified **non-blocking**, cross-referenced to the 157 local-adapter todo. Note in it that the rename half (`supabaseHandle` → `dataAdapterHandle`) is only honest *after* the parameterisation — renaming a hard-coded Supabase handle to `dataAdapterHandle` would make the name lie. |

---

## F. `buildRoute` sweep breadth (CONTEXT `<open>` #8, criterion 3)

Criterion 3 names two anchors and — as the CONTEXT correctly flags — its phrasing "`+server.ts:30` … and
`:31`" hides that these are **two different files**:

- `routes/api/oidc/callback/+server.ts:30` — `throw redirect(303, '/candidate/preregister?error=' + encodeURIComponent(errorParam));` ✅
- `routes/candidate/auth/callback/+server.ts:31` — `` redirect(303, `/${lang}/candidate/password-reset`); `` ✅

Both verified. The sweep is broader. Measured app-wide:

### F.1 — `redirect()` census — 19 sites, 17 hand-built

| Site | Status |
|---|---|
| `routes/(voters)/constituencies/+page.ts:65` | ✅ already `buildRoute(...)` |
| `routes/(voters)/elections/+page.ts:69` | ✅ already `buildRoute(...)` |
| `hooks.server.ts:72` — `` `/${locale}/candidate` `` | ❌ **Tier 1** |
| `hooks.server.ts:76` — `` `/${locale}/candidate/login?redirectTo=…` `` | ❌ **Tier 1** |
| `routes/api/oidc/callback/+server.ts:30,35,47,86,105,112` — six `'/candidate/preregister…'` literals | ❌ **Tier 1** (6 sites; `:30` is the named anchor) |
| `routes/candidate/auth/callback/+server.ts:31,39,44,47,53` — five `` `/${lang}/…` `` templates | ❌ **Tier 1** (5 sites; `:31` is the named anchor) |
| `routes/admin/login/+page.server.ts:54` — `` `/${locals.currentLocale}/${redirectTo}` `` | ❌ **Tier 2** |
| `routes/candidate/login/+page.server.ts:52` — same | ❌ **Tier 2** |
| `routes/(voters)/(located)/results/…/[[id]]/+page.ts:51` — `` `/results${electionSegment}${listSuffix}${url.search}` `` | ⚠ **Tier 3 — recommend EXCLUDE** |
| `routes/(voters)/(located)/results/[[electionTab]]/+layout.ts:82` — `` `/results${url.search}` `` | ⚠ **Tier 3 — recommend EXCLUDE** |
| `routes/(voters)/(located)/results/[[electionTab]]/+layout.ts:92` — `` `/results/${available[0]}${url.search}` `` | ⚠ **Tier 3 — recommend EXCLUDE** |

### F.2 — `goto()` census — essentially clean already

52 `goto(` occurrences across `apps/frontend/src`. **Every one that navigates to an app route already uses
`getRoute.current(...)`** (which is `buildRoute` behind the `getRoute` context handle,
`lib/contexts/app/getRoute.svelte.ts:2`). Exceptions, all deliberate:

| Site | Shape | Recommendation |
|---|---|---|
| `results/[[electionTab]]/+layout.svelte:290,297,302,307,318` | `goto(buildListRoute(...))` — a local helper at `:270-288` that hand-builds `/results/{electionTab}/{plural}` | **EXCLUDE.** Its `:272-282` docblock records a Phase-88 loop fix that depends on the exact absence of a forced `/candidates` segment. Rewriting it through `buildRoute` risks reintroducing a navigation loop. Tier 3. |
| `(voters)/constituencies/+page.svelte:149` | `` goto(`${target.pathname}${merged ? `?${merged}` : ''}`) `` | **EXCLUDE.** `target` is a `URL` already validated against an allowlist (`:125-148`); this is deliberate pass-through of a validated destination, not a route construction. Tier 3. |
| `(voters)/(located)/questions/+layout.svelte:252` | `goto(url, { noScroll })` | `url` is produced upstream; check the producer, not this line. Tier 3. |

### F.3 — Where to draw the line (recommendation)

| Tier | Contents | In scope? |
|---|---|---|
| **Tier 1 — MUST (13 sites, 4 files)** | `hooks.server.ts:72,76`; `api/oidc/callback/+server.ts:30,35,47,86,105,112`; `candidate/auth/callback/+server.ts:31,39,44,47,53` | **YES.** Contains both named anchors, and all 13 are in files the phase is already rewriting for other criteria (D-G4 and the `/api` move). Zero marginal risk. |
| **Tier 2 — SHOULD (2 sites, 2 files)** | `admin/login/+page.server.ts:54`, `candidate/login/+page.server.ts:52` — the `redirectTo` branch | **YES, with care.** These are inside the D-G3 extraction anyway. But see § E.1 note 4: `buildRoute` percent-encodes via `qs` where the hand-built form does not, and this value is attacker-influenced input already validated by `safeRedirectTarget`. **Requires an explicit round-trip test**: a `redirectTo` accepted by `RELATIVE_APP_PATH` (`loginRedirectTarget.ts:39`) must, after `buildRoute` + `qs.stringify` + the browser's decode, still land on the intended path. If it does not round-trip cleanly, **keep the hand-built form and document why** — that is a legitimate criterion-3 exclusion. |
| **Tier 3 — EXCLUDE (6 sites, 4 files)** | the three `/results` `redirect()`s, `buildListRoute`, `constituencies/+page.svelte:149`, `questions/+layout.svelte:252` | **NO.** All are voter-app results/constituency navigation whose exact string shape is load-bearing on Phase 88's URL contract (`route.ts:29-38` documents the 4-segment optional shape and the `electionTab`/`electionId` dissociation). Rewriting them is a *separate* phase-88-aware change with its own regression risk, and criterion 3 names none of them. **Record the exclusion with this reason** so it reads as a decision, not an oversight. |

**Recommended criterion-3 acceptance statement for the planner:** *"Every `redirect()` inside
`hooks.server.ts`, `routes/api/**` and `routes/candidate/**` builds its target with `buildRoute`. The
voter-app results/constituency navigation (6 sites, enumerated) is explicitly excluded because its URL shape
is governed by the Phase 88 route contract; the exclusion is recorded, not implied."* That is bounded,
checkable, and covers both named anchors.

A standing grep is available if the planner wants one, but **do not make it a guard** — it would fail on the
Tier 3 exclusions and require a suppression list that is worse than the prose.

---

## G. Criterion 6 — `candidate/(protected)/+page.svelte:38`

### G.1 — The measured branch chain

`let nextAction = $derived.by(() => { … })` spans `:36-86`. Three arms, each returning a full object literal:

| Prop | Arm A (`profileComplete`, `:39-51`) | Arm B (`unansweredRequiredInfo === 0 && unansweredOpinion !== 0`, `:56-69`) | Arm C (else, `:71-84`) |
|---|---|---|---|
| `title` | `t('candidateApp.home.ready')` | `t('candidateApp.common.greeting', { username })` | `t('candidateApp.common.greeting', { username })` |
| `explanation` | `t('…ingress.ready')` | `t('…ingress.notDone')` | `t('…ingress.notDone')` |
| `tip` | `t('…previewTip')` | **absent** | **absent** |
| `buttonTextBasicInfo` | `answersLocked ? …basicInfo.view : …basicInfo.edit` | same as A | `answersLocked ? …basicInfo.view : …basicInfo.enter` |
| `buttonTextQuestion` | `answersLocked ? …questions.view : …questions.edit` | `answersLocked ? …questions.view : …questions.enter` | same as B |
| `buttonTextPrimaryActions` | `t('…preview')` | `answersLocked ? …questions.view : …questions.enter` | `answersLocked ? …basicInfo.view : …basicInfo.enter` |
| `href` | `getRoute.current('CandAppPreview')` | `getRoute.current('CandAppQuestions')` | `getRoute.current('CandAppProfile')` |

Every arm re-lists all seven props; `tip` is present in one arm only, which is why `:111` guards on
`{#if nextAction.tip}`. That optionality is currently **implicit in the union of three object literals** — a
reader must diff three literals to learn that `tip` is optional. That is the reviewer's complaint.

### G.2 — Downstream consumers (the rewrite must be behaviour-preserving)

| Prop | Consumed at | Notes |
|---|---|---|
| `nextAction.title` | `:89` `<MainContent title={nextAction.title}>` | |
| `nextAction.explanation` | `:108`, inside `<p data-testid="candidate-home-status">` | **E2E-observed** — `testIds.ts:45` `statusMessage` |
| `nextAction.tip` | `:111` (`{#if}`) and `:113`, inside `<p data-testid="candidate-home-tip">` | the optional one |
| `nextAction.buttonTextBasicInfo` | `:119` `<Button text=… data-testid="candidate-home-profile">` | `testIds.ts` `profile` |
| `nextAction.buttonTextQuestion` | `:131` `<Button text=… data-testid="candidate-home-questions">` | `testIds.ts:47` `questions` |
| `nextAction.buttonTextPrimaryActions` | `:158` `<Button variant="main" … data-testid="candidate-home-continue">` | |
| `nextAction.href` | `:160` on the same Button | |

**Not part of `nextAction`, but named by the criterion's "badge set defined up front":** two badge snippets,
each an inline `{#if}` on a context array:

- `:124-128` — profile badge: `{#if candCtx.unansweredRequiredInfoQuestions && …length > 0}` → `<InfoBadge text={String(…length)} />`
- `:137-143` — questions badge: `{#if candCtx.unansweredOpinionQuestions && …length > 0}` → `<InfoBadge text={…length} disabled={candCtx.unansweredRequiredInfoQuestions?.length !== 0} />`

Note the inconsistency the rewrite should preserve-or-fix deliberately: the first wraps in `String(...)`, the
second passes a number.

Three further inline reads that reference the same context values in the template — `:91` `answersLocked`,
`:94` the compound missing-answers condition, `:103` `profileComplete`, `:134`/`:141`/`:149`
`unansweredRequiredInfoQuestions?.length !== 0`. The criterion's "the `if` blocks reference precomputed props
only" argues these should also be precomputed.

### G.3 — Proposed shape

```svelte
<script lang="ts">
  const candCtx = getCandidateContext();
  const { getRoute, t, userData } = candCtx;
  // appSettings is a reactive accessor -- read via candCtx.X, never destructure.
  const appSettings = $derived(candCtx.appSettings);

  // ---- Precomputed facts. Read once, referenced everywhere below. --------------
  const answersLocked      = $derived(candCtx.answersLocked);
  const profileComplete    = $derived(candCtx.profileComplete);
  const missingInfoCount   = $derived(candCtx.unansweredRequiredInfoQuestions?.length ?? 0);
  const missingOpinionCount= $derived(candCtx.unansweredOpinionQuestions?.length ?? 0);
  const infoIncomplete     = $derived(missingInfoCount !== 0);
  const hiddenForMissing   = $derived(
    infoIncomplete || (Boolean(appSettings.entities?.hideIfMissingAnswers?.candidate) && missingOpinionCount !== 0)
  );

  // ---- The badge set, defined up front (criterion 6). --------------------------
  const badges = $derived({
    profile:   missingInfoCount    > 0 ? { text: String(missingInfoCount),  disabled: false }          : undefined,
    questions: missingOpinionCount > 0 ? { text: String(missingOpinionCount), disabled: infoIncomplete } : undefined
  });

  // ---- Every prop takes its default ONCE. -------------------------------------
  const defaults = $derived({
    title: t('candidateApp.common.greeting', { username: userData.current?.candidate.firstName || '?' }),
    explanation: t('candidateApp.home.ingress.notDone'),
    tip: undefined as string | undefined,
    buttonTextBasicInfo: answersLocked ? t('candidateApp.home.basicInfo.view') : t('candidateApp.home.basicInfo.enter'),
    buttonTextQuestion:  answersLocked ? t('candidateApp.home.questions.view')  : t('candidateApp.home.questions.enter'),
    buttonTextPrimaryActions: answersLocked
      ? t('candidateApp.home.basicInfo.view')
      : t('candidateApp.home.basicInfo.enter'),
    href: getRoute.current('CandAppProfile')
  });

  // ---- Cases specify ONLY overrides. ------------------------------------------
  const nextAction = $derived.by(() => {
    if (profileComplete)
      return {
        ...defaults,
        title: t('candidateApp.home.ready'),
        explanation: t('candidateApp.home.ingress.ready'),
        tip: t('candidateApp.home.previewTip'),
        buttonTextBasicInfo: answersLocked
          ? t('candidateApp.home.basicInfo.view')
          : t('candidateApp.home.basicInfo.edit'),
        buttonTextQuestion: answersLocked
          ? t('candidateApp.home.questions.view')
          : t('candidateApp.home.questions.edit'),
        buttonTextPrimaryActions: t('candidateApp.home.preview'),
        href: getRoute.current('CandAppPreview')
      };
    if (!infoIncomplete && missingOpinionCount !== 0)
      return { ...defaults, buttonTextPrimaryActions: defaults.buttonTextQuestion, href: getRoute.current('CandAppQuestions') };
    return defaults;
  });
</script>
```

**Why `defaults` is Arm C:** Arm C is already the `else` branch and its values are the base case for every
prop except `buttonTextBasicInfo`, where Arms A and B share `edit`/`view` and Arm C uses `enter`/`view`. That
single divergence is what Arm A's explicit override handles; Arm B then inherits Arm C's `enter` — **which
is a behaviour change**, since Arm B currently uses `edit`.

> ⚠ **CAUTION — verify before adopting.** Arm B (`:59-61`) uses `basicInfo.edit`; Arm C (`:74-76`) uses
> `basicInfo.enter`. If `defaults` is modelled on Arm C, Arm B must **explicitly override**
> `buttonTextBasicInfo` back to `edit`/`view`. The sketch above omits that override — **add it.** This is
> exactly the class of bug a "defaults + overrides" refactor introduces, and it is invisible to any E2E spec
> (no spec asserts the profile button's *text*; `testIds.ts` `profile` is selected by id). **Recommend a
> table-driven unit test over the three states as part of this task** — see § Validation Architecture.

**Behaviour-preservation checklist for the rewrite:**
1. All three arms produce the same 7 values for the same inputs. Prove with a table, not by reading.
2. `tip` remains `undefined` in Arms B and C so `{#if nextAction.tip}` at `:111` still hides the paragraph.
3. `:94`'s compound condition becomes `hiddenForMissing`; `:103` becomes `profileComplete`; `:134`, `:141`,
   `:149` become `infoIncomplete`.
4. `appSettings` stays a `$derived(candCtx.appSettings)` alias, never destructured (`CLAUDE.md`).
5. `String(...)` vs raw number on `InfoBadge.text` — pick one and state it; `String()` is safer.

### G.4 — Specs covering this page

**No unit test exists** for `candidate/(protected)/+page.svelte` (no `.test.ts` sibling; frontend `test:unit`
is `vitest run` over `apps/frontend`).

**E2E coverage** is via testids, all of which the rewrite must preserve verbatim:
`candidate-home-status` (`:107`), `candidate-home-tip` (`:112`), `candidate-home-profile` (`:123`),
`candidate-home-questions` (`:136`), `candidate-home-preview` (`:151`), `candidate-home-continue` (`:161`),
`candidate-home-logout` (`:162`), `candidate-answers-locked-warning` (`:92`). Registered at
`tests/tests/utils/testIds.ts:26,45,47` and consumed via
`tests/tests/fixtures/candidate/candidateHomePage.fixture.ts:13,17,19,41,45,67`. The specs that drive them
are `tests/tests/specs/candidate/candidate-journey.spec.ts` and
`tests/tests/specs/perm/perm-answers-locked.spec.ts:37`.

**The fixture asserts on `candidate-home-status`'s *text*** (`candidateHomePage.fixture.ts:67` — "Assert the
candidate-home-status paragraph is visible. When `text` …"). So `nextAction.explanation` is E2E-observed
and any change to which arm supplies it is a suite-visible regression.

---

## H. Criterion 7 — testid + layout

### H.1 — The testid rewrite: **no new markup is needed**

Current state:

```
apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
281-288   <!-- comment block: "wrap the image Input in a div carrying `profile-image-error`.
          Input.svelte's <ErrorMessage> at :640-642 is shared across all input types …
          so a testid added inside Input would be ambiguous. Wrapping at the call site
          scopes the testid to image-upload errors only." -->
289       <div data-testid="profile-image-error">     <- the test-only element
290-297     <Input type="image" … containerProps={{ 'data-testid': 'profile-image-upload' }} />
298       </div>
```

**The comment's argument is now obsolete, and here is the evidence:**

| Fact | Evidence |
|---|---|
| `Input.svelte` renders its error with a testid already | `apps/frontend/src/lib/components/input/Input.svelte:655-656` — `{#if error}` → `<ErrorMessage inline message={error} data-testid="input-error" class="my-sm text-center" />` |
| That error node is **inside** the `containerProps` element | `Input.svelte:389-390` opens `<div {...concatClass(containerProps ?? {}, 'w-full flex flex-col items-stretch')}` — the outermost container (the component docblock at `:5` says so: *"The input itself is wrapped in multiple container elements, the outermost of which can be passed the `containerProps` prop"*). The file is 692 lines; `:656` sits inside that div. |
| `profile-image-upload` is exactly that container | `profile/+page.svelte:297` — `containerProps={{ 'data-testid': 'profile-image-upload' }}` |
| `input-error` has **zero** consumers today | `grep -rn "input-error" tests/tests apps/frontend/src` → only the definition at `Input.svelte:656` |
| The comment's premise — "a testid inside Input would be ambiguous" — was about the *message*, and it is answered by the *container* | ambiguity is resolved by scoping: `getByTestId('profile-image-upload').getByTestId('input-error')` addresses this instance and no other |

**Recommended change — three edits, no new element:**

1. **`profile/+page.svelte`:** delete `:289` and `:298` (the wrapper div), and **replace** the `:281-288`
   comment with a short one that records the new contract *and answers the old argument*, e.g.:

   ```
   <!-- Portrait upload. The error surface is Input's own <ErrorMessage>, addressed in tests as
        `input-error` scoped inside this instance's `profile-image-upload` container -- the container
        is what disambiguates it from the other Inputs on this page, so no wrapper element is needed. -->
   ```
   ⚠ **D-N1 applies:** the replacement comment must carry no `.planning/` path and no `--` used as a dash
   (the example above uses `--` in exactly the banned way — write it with a proper dash or restructure).
   Note the *existing* `:282` comment says "see phase 89 Plan 02 (TIR4:75-76 + 166-188)" — a planning
   reference that Phase 152's sweep is already targeting. **Deleting it satisfies both criteria at once.**

2. **`tests/tests/utils/testIds.ts`:** replace `imageError: 'profile-image-error'` (`:40`) with
   `inputError: 'input-error'`, and update the explanatory comment at `:32`. Keep
   `imageUpload: 'profile-image-upload'` (`:30`) unchanged — it becomes the parent handle.

3. **`tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:107`:** change

   ```ts
   const errWrapper = page.getByTestId(testIds.candidate.profile.imageError);
   ```
   to
   ```ts
   const errWrapper = page
     .getByTestId(testIds.candidate.profile.imageUpload)
     .getByTestId(testIds.candidate.profile.inputError);
   ```
   The two `expect` calls at `:108-109` are unchanged. Also update the fixture docblock at `:10,15,89,91`.

**Every spec that selects either testid — the complete list:**

| File:line | What |
|---|---|
| `tests/tests/utils/testIds.ts:30` | `imageUpload: 'profile-image-upload'` — keep |
| `tests/tests/utils/testIds.ts:32` | comment describing `imageError` — update |
| `tests/tests/utils/testIds.ts:40` | `imageError: 'profile-image-error'` — replace |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:103` | `getByTestId(imageUpload).getByRole('button').first().click()` — unchanged |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:107` | the error locator — **the one functional edit** |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts:10,15,89,91` | docblock mentions — update |
| `tests/tests/specs/candidate/candidate-journey.spec.ts:601` | `uploadPortrait({ …, expectError: … })` — **no edit** (goes through the fixture) |
| `tests/tests/specs/candidate/candidate-journey.spec.ts:606` | same — **no edit** |
| `tests/tests/specs/candidate/candidate-journey.spec.ts:611` | `uploadPortrait({ path: VALID_PORTRAIT_PATH })` — no error path, **no edit** |
| `tests/tests/specs/a11y/candidate-a11y.spec.ts:106` | prose mention of `profile-image-error` in an out-of-scope table — update the prose |

**No vitest test selects either testid.** [VERIFIED: `grep -rn "profile-image-error\|profile-image-upload"` over
`apps/frontend/src` and `tests/tests` returns only the sites listed above]

**Verification:** the two `expectError` paths at `candidate-journey.spec.ts:601,606` are the discriminating
test. Run them **before** the change to confirm they pass on `profile-image-error`, and **after** to confirm
they pass on the child selector — and, as a negative control, confirm they **fail** if the child selector is
pointed at a nonexistent testid, so "passes" is not vacuous.

### H.2 — `+layout.svelte` edits (all three, verbatim)

```
211  <svelte:head>
212    <title>{underMaintenance ? t('maintenance.title') : t('dynamic.appName')}</title>
213    <meta
214      name="theme-color"
215      content={staticSettings?.colors?.light?.['base-300'] ?? '#d1ebee'}
216      media="(prefers-color-scheme: light)" />
217    <meta
218      name="theme-color"
219      content={staticSettings?.colors?.dark?.['base-300'] ?? '#1f2324'}
220      media="(prefers-color-scheme: dark)" />
```

[VERIFIED: `apps/frontend/src/routes/+layout.svelte:211-220`]

**Edit 1 — the maintenance title (`:212`).** Reviewer's requested markup, verbatim from the triage
(`.planning/PRE-SHIP-REVIEW-TRIAGE.md`, the `+layout.svelte:212` entry):

```
{t('dynamic.appName')} {#if underMaintenance} – {t('maintenance.title')} {/if}
```

So:

```svelte
<title>{t('dynamic.appName')}{#if underMaintenance} – {t('maintenance.title')}{/if}</title>
```

⚠ Two things to get right. **(a)** The reviewer's snippet has a space before `{#if}` and inside the block;
inside a `<title>` element Svelte emits whitespace literally, so the naive transcription yields
`"OpenVAA  – Maintenance "` (double space, trailing space). Recommend the tightened form above and note the
deviation. **(b)** The character is an **en dash** `–` (U+2013), not a hyphen. Phase 152's comment sweep
targets `--` in *comments*; this is markup text, so it is out of that scope — but the repo has a measured
history with `–` escapes (`REVIEW-HYG-01`, `REQUIREMENTS.md:88`), so write the character itself, never
an escape or an HTML entity.

**Edit 2 and 3 — both theme-colour defaults (`:215` and `:219`).** Remove `?? '#d1ebee'` and
`?? '#1f2324'`:

```svelte
<meta name="theme-color" content={staticSettings.colors.light['base-300']} media="(prefers-color-scheme: light)" />
<meta name="theme-color" content={staticSettings.colors.dark['base-300']} media="(prefers-color-scheme: dark)" />
```

⚠ **The optional-chaining is doing work — decide deliberately.** `staticSettings?.colors?.light?.['base-300']`
guards three levels. Removing only the `??` default leaves `content={undefined}` when a level is missing,
which Svelte renders as an omitted attribute — a silently missing `theme-color`, which is arguably worse than
a wrong default. Since `staticSettings` is a **compile-time constant** from
`packages/app-shared/src/settings/staticSettings.ts` (`CLAUDE.md` § Settings Architecture), the honest fix is
to **drop the optional chaining too** so a missing colour is a typecheck error rather than a runtime silence.
Verify `staticSettings.colors.light['base-300']` and `.dark['base-300']` are non-optional in the type before
doing so; if they are optional in the type, that is the real defect and the reviewer's ask points at it.

**Verification:** the visual-regression project
(`tests/tests/specs/visual/visual-regression.spec.ts`) does not assert on `<meta theme-color>`, and
`voter-dark-mode.spec.ts` asserts rendered colours, not the meta tag. So the theme-colour change is
**typecheck-verified, not E2E-verified** — say so rather than claiming suite coverage. The `<title>` change
**is** observable: any spec asserting on page title would see it. Grep before and after.

---

## I. D-G5 — the six follow-up comments, and the seven unbucketed ones

### I.1 — Resolving the enumeration inconsistency (CONTEXT `<open>` #2 and #3)

I read `.planning/PRE-SHIP-REVIEW-TRIAGE.md:245-317` — Phase 158's whole bucket, **27 comments**, verbatim.

**Finding 1: `dataProvider.ts:12` is NOT in Phase 158's bucket.** The 27 comments in `:249-317` do not
include it. Independent confirmation: `157-CONTEXT.md` D-N2 states plainly *"**157 owns one such comment:**
`apps/frontend/src/lib/api/dataProvider.ts` — 'We should add reintroducing the local adapter as a follow-up
task'."* **The CONTEXT's six-item table put a Phase 157 comment in slot 6.** CONTEXT `<open>` #3's reading is
correct.

**Finding 2: `admin/login/+page.server.ts:27` IS in 158's bucket, and it IS the reviewer's second
"blocking".** Verbatim from the triage:

> **`apps/frontend/src/routes/admin/login/+page.server.ts:27`** — PR #870 (kaljarv)
> "Add as a **blocking** follow-up task a way to make this supabase independent in routes. It should be
> handled by the SupabaseAdapter. We can structure the abstracted model on supabase, though. Also, add a
> source test for ensuring that no adapter-specifics find their way into routes, components or anywhere not
> especially allowed, such as the specific adapter's implementation and hand-picked locations."

So **G5's ★ prose was right and G5's enumerated table was wrong.** The two blocking follow-ups across the
whole review set are `QuestionChoices.svelte:1` (159) and `admin/login/+page.server.ts:27` (158). Reading
**(ii)** of CONTEXT `<open>` #2 is the correct set membership; reading **(iii)** is the correct *disposition*
of the 158 one.

**Finding 3: the anchor `admin/login/+page.server.ts:27` is exact.**
`:27` is `const { error } = await locals.supabase.auth.signInWithPassword({ email, password });`
[VERIFIED: `apps/frontend/src/routes/admin/login/+page.server.ts:27`]

**Finding 4: `lib/api/dataProvider.ts` is one line and cannot carry a `:12`.**
`apps/frontend/src/lib/api/dataProvider.ts` contains exactly
`export { dataProvider } from './adapters/supabase/dataProvider';`. The comment's content matches
`apps/frontend/src/lib/server/api/dataProvider.ts:12` — the `default:` arm of a `switch (type)` whose
`case 'local':` at `:9-10` still imports `./adapters/local/dataProvider`:

```
 6  const { type } = staticSettings.dataAdapter;
 8  switch (type) {
 9    case 'local':
10      module = import('./adapters/local/dataProvider');
11      break;
12    default:
13      module = Promise.resolve({});
14  }
```

[VERIFIED: `apps/frontend/src/lib/server/api/dataProvider.ts:6-14`] CONTEXT `<open>` #3 is confirmed on both
halves.

### I.2 — Recommended disposition, per item

| # | Anchor | Owning phase | Blocking? | Disposition |
|---|--------|-------------|-----------|-------------|
| 1 | `routes/Banner.svelte:9` — "Add this is as a follow up task." (the file's own `### TODO` at `:7-9`: allow layouts to insert arbitrary content in the header, make this a static component `[Svelte 5]`) ✅ anchor verified | **158** | **no** | **File a todo. Do not implement.** |
| 2 | `routes/Header.svelte:44` — "Add as a follow up task, refactoring the header style settings." ✅ anchor verified (`:44` is `const bgColor = $derived.by(() => {`, reading `appSettings.headerStyle.dark/light`) | **158** | **no** | **File a todo. Do not implement.** ⚠ Overlaps Phase 159's `$effect`/`$derived` census — cross-reference it. |
| 3 | `routes/(voters)/(located)/questions/+layout.svelte:144` — "Add a follow up for a e2e test targeting this behaviour." ✅ anchor verified (`:144` is `onMount(() => {`, the once-per-session `?start=` deep-link handler documented at `:138-143`) | **158** | **no** | **File a todo. Do not implement.** |
| 4 | `routes/candidate/preregister/(authenticated)/elections/+page.svelte:1` — "harmonise election and constituency selection logic with the Voter App (mainly `startFromConstituencyGroup`)" ✅ anchor verified (`:1` is `<script lang="ts">`) | **158** | **no** | **File a todo. Do not implement.** ⚠ Cross-reference `perm-startfromcg.spec.ts` — that setting has E2E coverage today, so the harmonisation has a regression surface. |
| 5 | `routes/admin/login/+page.server.ts:27` — "**blocking** … make this supabase independent in routes … Also, add a source test …" ✅ anchor verified | **158** | **YES** | **File a todo, classified BLOCKING, and discharge it by cross-reference to Phase 157 criterion 6 / REVIEW-ADP-06 / D-F4 — NOT by new implementation in 158.** See § I.3. |
| 6 | `lib/components/questions/QuestionChoices.svelte:1` — "Add as a follow-up **blocking** task for me to UAT: - BooleanInput - multi-select choices" | **159** | **YES** | **159 files it and 159 implements it.** Not 158's to file (D-N2: "filed during the owning phase"). 158 should record in its summary that it is 159's, so the item is not lost. |
| — | `lib/server/api/dataProvider.ts:12` — "reintroduce the local adapter" | **157** | no | **157 files it.** Not 158's. `157-CONTEXT.md` D-N2 already assigns it. 158 records the cross-reference only. |

**So Phase 158 files FIVE todos and implements ZERO of them directly.** The orchestrator's sketch said four
todos / zero implemented; the evidence says **five** todos (the fifth being `admin/login:27`, which the
CONTEXT's table omitted) and still **zero implemented by 158** — because the one blocking item 158 owns is
discharged upstream. **The orchestrator's sketch is confirmed on the "158 implements zero" conclusion and
refuted on the count and on which item is #5.**

### I.3 — Why `admin/login:27` is a cross-reference, not new 158 work

Its ask has two halves:

| Half | Where it is already owned | Status |
|---|---|---|
| **(b) "add a source test for ensuring that no adapter-specifics find their way into routes, components or anywhere not especially allowed"** | **Phase 157 criterion 6 / `REQUIREMENTS.md:137` (REVIEW-ADP-06) / D-F4** — an ESLint `no-restricted-imports` block with an **explicit `files`-scoped allowlist**, enforced by `lint:check`, with a negative control at a 9th site | **Fully covered.** Word-for-word the same ask. |
| **(a) "make this supabase independent in routes; it should be handled by the SupabaseAdapter"** | **Phase 157's `<open>` question 3 — UNRESOLVED.** `admin/login/+page.server.ts` is #6 of the 8 leakage sites 157 enumerates (`157-CONTEXT.md` `<facts>` § "Criterion 6 — the eight allowed loci") | **Depends on 157's answer.** |

**Therefore the todo 158 files must be written to survive both 157 outcomes.** Concretely, it should state:
*the source-test half is discharged by REVIEW-ADP-06; the supabase-independence half is discharged iff 157
drives the allowlist to 0 for this file, and remains open iff 157 grandfathers the 8.* Then 158's own
verification step is a **one-line check at execution time**: read 157's shipped allowlist and record whether
`admin/login/+page.server.ts` is in it.

This is the honest disposition. Implementing (a) inside 158 would mean refactoring Supabase auth out of the
login route — which is precisely the work 158 **declares a dependency on 157 to have done**
(`157-CONTEXT.md` `<open>` #3 quotes 158's own dependency line back at it). 158 cannot both depend on it and
do it.

### I.4 — Todo file template (from the observed register convention)

`.planning/todos/pending/` holds **89 files** today (plus `completed/` and `done/` siblings). Convention,
read from `2026-08-28-claude-md-stale-factual-claims.md` and `2026-08-27-147-tou-gate-modal-unscanned.md`:

**Filename:** `<YYYY-MM-DD>-<slug>.md`. Some older files omit the date prefix; **the dated form is the
current convention** — every file created in the last two days uses it.

**Front matter (YAML) — observed fields:**

```markdown
---
created: 2026-08-28T00:00:00.000Z     # ISO; quoted or bare, both appear
title: <one sentence, sentence case, states the problem not the fix>
area: <free text, e.g. "docs" | "E2E / a11y" | "Routing & Auth">
severity: <minor | major>             # optional; present in the 147-era files
source: <phase + artifact that filed it>   # optional but recommended
files:
  - <repo-relative path>
  - <repo-relative path>
resolves_phase: <n>                   # optional — the phase expected to fix it
related_phase: <n>                    # optional
---
```

**Body:** `## Problem` (or a descriptive `## The gap`) with symptom-and-root-cause prose, then `## Solution`,
then optionally `## Why this is filed rather than fixed`. Prose is long-form and cites file:line.

**⚠ For D-G5 the classification must be machine-findable.** The existing convention has **no `blocking:`
field** — `severity:` is the closest and it is optional and free-text. D-G5 step 2 makes the classification a
*deliverable*. **Recommend adding two fields**, and stating in the phase summary that they are new:

```yaml
blocking: false          # the reviewer's own word, verbatim from the PR comment
review_anchor: apps/frontend/src/routes/Banner.svelte:9
```

`review_anchor` preserves the file:line that D-N2 says is the entire reason todos beat ROADMAP backlog
entries. `blocking` makes "implement the blocking ones" mechanically answerable
(`grep -l 'blocking: true' .planning/todos/pending/`).

**Five files for 158 to write:**

| File | `blocking` | `review_anchor` |
|---|---|---|
| `2026-08-28-banner-static-component-arbitrary-header-content.md` | `false` | `apps/frontend/src/routes/Banner.svelte:9` |
| `2026-08-28-header-style-settings-refactor.md` | `false` | `apps/frontend/src/routes/Header.svelte:44` |
| `2026-08-28-questions-layout-start-param-e2e-coverage.md` | `false` | `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:144` |
| `2026-08-28-preregister-election-constituency-selection-harmonisation.md` | `false` | `apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte:1` |
| `2026-08-28-admin-login-supabase-independence.md` | **`true`** | `apps/frontend/src/routes/admin/login/+page.server.ts:27` |

And the classification table must **also** appear in the phase summary artifact (D-G5 step 2 says "in the
todo file's front matter *and* in the phase's summary artifact").

### I.5 — Disposition of the SEVEN unbucketed triage comments (CONTEXT `<open>` #8)

| # | Anchor | Comment | Verified on tree? | Disposition | Reason |
|---|--------|---------|-------------------|-------------|--------|
| 1 | `hooks.server.ts:17` | "Paramaterise this dependent on the adapter configuration and rename to `dataAdapterHandle` if possible." | ✅ `:17` is `const supabaseHandle: Handle = …` | **DEFER with a todo (non-blocking)** | The parameterisation needs a second adapter to parameterise against; `lib/server/api/dataProvider.ts:12`'s `default: Promise.resolve({})` shows the local adapter is currently disabled. Downstream of 157's boundary and of the local-adapter reintroduction. Renaming alone would make the name lie. See § E.3. |
| 2 | `routes/(voters)/(located)/questions/+layout.ts:1` | "Try to drop this." | ✅ 17-line file; `:3-13` is a docblock stating it is a **parity load stub** returning `{}`, deliberately mirroring `results/[[electionTab]]/+layout.ts` | **DECLINE, with the reason recorded** | Dropping it reverses the "unified-layout-with-empty-leaf" shape that spikes 013–016 and Phase 100 established (`.planning/spikes/014b-single-page-url-keyed`, `015-view-transitions-api`). The file's own docblock is the counter-argument. Record the decline; do not file a todo for reversing shipped, spike-validated design. |
| 3 | `routes/(voters)/(located)/questions/[questionId]/+page.svelte:1` | "Check if this is necessary or if some content from the layout can be moved here with the transitions surviving." | ✅ 4-line file; `:1` is `<!-- Empty leaf — rendering owned by questions/+layout.svelte (results shape / see spike 014b). -->` | **DECLINE, with the reason recorded** | Same design. The file **already answers the question in its own first line**, and `.planning/spikes/014b-single-page-url-keyed` + `015-view-transitions-api` are the measured basis. Moving content back into the leaf is what spike 014b tested and rejected. ⚠ Note the existing comment cites "spike 014b" — that is a planning-artifact reference in source, so **Phase 152's scan may flag it**; that is 152's to resolve, not 158's. |
| 4 | `routes/(voters)/+layout.svelte:59` | "As well as this." | ✅ `:59` is `// see phase 86.3-01 wave A fix (cells #1 + #2): …` — a **comment**, not code | **DECLINE — already owned by Phase 151/152** | `REQUIREMENTS.md:89` (REVIEW-HYG-02) names this exact file as the sweep's exemplar and states `:59` is **"gone"** in the disposition. The anchor will not survive 152. Filing a 158 todo against a line 152 deletes would create a dangling anchor — exactly what D-N2 exists to prevent. Cross-reference REVIEW-HYG-02 in the summary. |
| 5 | `routes/api/candidate/preregister/+server.ts:16` | "Check." | ✅ `:16` is `const { data, error: fnError } = await locals.supabase.functions.invoke('identity-callback', {` | **DEFER to 157 by cross-reference; no new todo** | A bare "Check." with no stated concern. The concrete thing at that line is a **direct `locals.supabase.functions.invoke`** in a route — i.e. leakage site #7 of 157's eight. It is already inside 157 criterion 6's scope. Record the cross-reference; do not invent a requirement from one word. |
| 6 | `routes/api/oidc/callback/+server.ts:35` | "Check whether we could use strict type for the error parameters." | ✅ `:35` is `throw redirect(303, '/candidate/preregister?error=missing_code');` | **FOLD into 158** | This is genuinely cheap and 158 is already rewriting all six redirects in this file for criterion 3 (§ F Tier 1). The six error values (`missing_code`, `invalid_state`, `invalid_token`, `token_exchange_failed`, plus the pass-through `errorParam` at `:30` and the bare redirect at `:105`) become a `const OIDC_ERROR = {...} as const` union, consumed by `buildRoute({ route: 'CandAppPreregister', error: OIDC_ERROR.missingCode })`. **Zero marginal cost given the sweep, and it makes the sweep's diff self-documenting.** ⚠ Check whether `candidate/preregister/+page.svelte` reads `?error=` and switches on the values — if so, the union must cover its cases too. |
| 7 | `routes/candidate/preregister/+layout.server.ts:9` | "Extract this to the adapter and use the typing provided with no ad hoc casts." | ✅ `:9` is `const { data: appSettingsRow } = await locals.supabase.from('app_settings').select('settings').limit(1).maybeSingle();` and `:11` carries the ad-hoc cast `(appSettingsRow?.settings as { preRegistration?: { enabled?: boolean } } \| null)` | **DEFER to 157 by cross-reference; no new todo** | This is **exactly** 157's criterion 1 (`REVIEW-ADP-01`: "typed JSONB columns validated on read … the typecasts are gone") applied to the `app_settings` JSONB column, plus leakage site #1 of the eight. `157-CONTEXT.md` `<domain>` already names this file as one of the routing-side comments asking for 157's boundary. The CONTEXT's own "arguably Phase 157's" is right — drop the "arguably". |

**Summary of dispositions:** 1 fold (item 6), 1 defer-with-todo (item 1), 3 declines (items 2, 3, 4), 2
cross-references to 157 (items 5, 7). **Every one is dispositioned; none is silently dropped**, satisfying
D-N2's spirit.

---

## Upstream: Phase 157 — making 158's plans robust to either answer

**Phase 157 has NO `PLAN.md` yet** — only `157-CONTEXT.md` and `157-DISCUSSION-LOG.md`. Its `<open>`
question 3 (grandfather the 8 leakage sites, or drive to 0?) is unresolved and is being planned concurrently.

**The 8 leakage sites 157 enumerates** (`157-CONTEXT.md` `<facts>` § "Criterion 6 — the eight allowed loci"),
against 158's touched-file set:

| # | 157's leakage site | Does 158 touch it? | What 158 does to it |
|---|---|---|---|
| 1 | `routes/candidate/preregister/+layout.server.ts` | **YES** | § C (2 cookie sites: `:24`, `:33`) and § I.5 item 7 (cross-ref) |
| 2 | `routes/candidate/auth/callback/+server.ts` | **YES — moved** | § D.4 — relocated under `/api`; § F Tier 1 — 5 redirects rewritten |
| 3 | `routes/candidate/auth/logout/+server.ts` | **YES — moved** | § D.4 — relocated under `/api` |
| 4 | `routes/candidate/(protected)/+layout.server.ts` | **YES (import only)** | § A — `buildRoute` import specifier rewritten at `:16` |
| 5 | `routes/candidate/login/+page.server.ts` | **YES — rewritten** | § D.1/D.2 — collapsed to a thin wrapper |
| 6 | `routes/admin/login/+page.server.ts` | **YES — rewritten** | § D.1/D.2 + § D.3 (role extraction) + § I.3 (the blocking todo) |
| 7 | `routes/api/candidate/preregister/+server.ts` | **YES** | § C (2 cookie sites: `:6`, `:44`); § I.5 item 5 (cross-ref) |
| 8 | `routes/api/auth/logout/+server.ts` | **no** | untouched — but see below |

**Seven of the eight are in 158's blast radius.** That is a high coupling and the planner must plan for it.

**What 158 must do in each 157 outcome:**

| 157 outcome | Consequence for 158 | Required 158 behaviour |
|---|---|---|
| **(a) 157 grandfathers the 8** — ships an explicit 8-entry ESLint allowlist that 158 (or a later phase) shrinks | 158's route moves **change two of the allowlist's paths**: `routes/candidate/auth/callback/+server.ts` → `routes/api/auth/callback/+server.ts` and `.../logout` → `routes/api/auth/logout/+server.ts`. **The allowlist goes stale the moment 158 moves them**, and a stale `files`-scoped ESLint allowlist fails *open* (the glob matches nothing, the ban does not apply, `lint:check` stays green). | **A plan task that updates 157's allowlist entries in `apps/frontend/eslint.config.mjs` as part of the `/api` move**, plus a verification that the guard still **fires** at the new paths — i.e. re-run 157's negative control against the moved files. Do not assume 157's own self-test covers a path that did not exist when it was written. |
| **(b) 157 drives the allowlist to 0** — refactors all 8 behind the adapter | The two moved files may no longer contain `locals.supabase` at all; the shared `passwordLogin` helper's signature (`§ D.2`, which takes `locals`) may need to take an adapter handle instead | **Do not write `passwordLogin` against `locals.supabase` as an immovable contract.** Keep the Supabase call behind one internal function so its body can be swapped without touching the three wrappers. Also: § I.3's blocking todo becomes **discharged**, and 158's summary should say so. |
| **(c) 157 slips entirely** | Neither the guard nor the `logDebugError` rename exists | 158 still lands D-G1..D-G4 in full. § I.3's todo stays **open and blocking**, cross-referenced forward. `logDebugError` keeps its current name and import path. § D.6 rule 1 covers this. |

**The robustness rule for the planner, stated as an invariant:**

> **No 158 task may have a success criterion that reads "the adapter-leakage allowlist has N entries" or
> "file X no longer imports Supabase."** Those are 157's outcomes. 158's tasks may only *read* the allowlist
> and *record* what they found, or *update path strings within it* to match 158's own moves.

⚠ **One asymmetry worth flagging to the operator:** 158's `/api` move relocates two of the eight sites into
`routes/api/`, which `hooks.server.ts:64` skips and which 157's allowlist may or may not glob. If 157 chooses
(b) and refactors the callback while 158 is moving it, **the two phases edit the same two files**. Recommend
the operator sequence 157 fully before 158 begins the `/api` move, or explicitly hand those two files to one
phase.

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| A source scan that fails `lint:check` and names a file:line | a new bespoke framework, a new dependency | **`scripts/assert-a11y-scan-wiring.mjs`** — copy its shape verbatim (Node built-ins, regex read, `exit 1` naming the problem), wire into `package.json:35` | Three such scripts already exist (`assert-a11y-scan-wiring`, `assert-i18n-catalog-namespaces`, `assert-unit-test-coverage`). Its own docblock argues *why* regex beats AST for single-sourced hand-authored files. |
| Proving a guard actually fires | asserting it exists | **`apps/frontend/src/lib/_guards/eslint-store-guard.test.ts`** — the fire/silent/parse triple, 30 cases, plus a documented negative control | This is the repo's answer to "a test that has never been red guards nothing", and it encodes four correctness invariants (vacuous scope, config resolution, filter by ruleId not count, disambiguate by message not line) that a fresh guard would rediscover the hard way. |
| Building a URL with locale + params | `` `/${locale}/candidate/login?redirectTo=${x}` `` | **`buildRoute`** (`$lib/routes/buildRoute.ts`) — it handles Paraglide's `localizeHref`, `resolveRoute`, persistent search params and array flattening | Hand-built strings are exactly what criterion 3 exists to remove, and the persistent-param merge (`filterPersistent(parseParams(current))`, `buildRoute.ts:60`) is not reproducible by hand. |
| Validating a post-login redirect target | a new regex | **`safeRedirectTarget`** (`loginRedirectTarget.ts:47`) — already written, already documented, already the only validator | It is being *moved*, not rewritten. Its `RELATIVE_APP_PATH` (`:39`) is deliberately conservative and its docblock (`:1-31`) records why. |
| Detecting cookie names in source | grepping for the four name strings | **an operation-keyed detector** (`cookies.get\|set\|delete`, `document.cookie =`) with a literal-first-argument rule | `'id_token'` appears as a JSON field name in ≥ 8 non-cookie places (`idura.ts:111`, `signicat.ts:78`, `api/candidate/preregister/+server.ts:17`, the Edge Function). A name-keyed grep is unusable. |
| Deciding whether a route is `(protected)` | `pathname.includes(...)` | **`route.id`** — already in scope at `hooks.server.ts:59`, and already used correctly two lines below the defect at `:74` | The safe idiom is literally in the same function. |

**Key insight:** this phase has almost no "build" in it. Every mechanism it needs already exists somewhere in
the repo, usually with a docblock explaining a trap the author already fell into. The failure mode for 158 is
**not** inventing something wrong; it is **missing a consumer** — the two `tests/` deep imports, the 18th
cookie site, the Supabase redirect allowlist. Plan for census completeness, not for construction.

---

## Common Pitfalls

### Pitfall 1: the codemod misses the non-`$lib` importers
**What goes wrong:** `sed s|$lib/utils/route|$lib/routes|` is run, `yarn build` and frontend `typecheck` go
green, and the phase looks done. Then `yarn typecheck:tests` fails, and with it the entire Playwright suite —
a **cardinal failure** under CLAUDE.md.
**Why:** `tests/tests/utils/buildRoute.ts:2-3` and `tests/tests/utils/axeScan.ts:39` import by deep relative
path *on purpose* (`buildRoute.ts:1`: "Use direct import to avoid loading other modules which depend on
`$app/...`"). No `$lib` grep finds them.
**How to avoid:** run codemod step 3 (§ A.6) and gate on `yarn typecheck:tests` **before** `yarn lint:check`.
**Warning sign:** the pre-move census says 24 files. It should say ~27.

### Pitfall 2: the cookie detector false-negatives on the one write it most needs
**What goes wrong:** the const module ships, the source test passes, and `oidc_code_verifier` is still
written as a bare literal in a `.svelte` file.
**Why:** `candidate/preregister/+page.svelte:111` uses `document.cookie =`, not `cookies.set()`; and it is a
`.svelte` file, invisible to a TS-only AST walker.
**How to avoid:** the detector needs a **second clause** for `document.cookie` assignment and must scan
`.svelte` as well as `.ts`. Plant the negative control there specifically (§ C.4).
**Warning sign:** the detector's plant-and-observe ledger has fewer than four "red" rows.

### Pitfall 3: the `/api` route move silently breaks auth emails in production
**What goes wrong:** local E2E passes because `config.toml:167` was updated; production invites and password
resets dead-end because the Supabase Cloud allowlist was not.
**Why:** the allowlist is an **exact-URL** list (`config.toml:165` says so) that lives partly outside the
repo.
**How to avoid:** `checkpoint:human-verify` before the move; or the shim sequencing in § D.4.
**Warning sign:** the plan's file list for the move task contains no `apps/supabase/supabase/config.toml`.

### Pitfall 4: the moved callback loses its locale
**What goes wrong:** a Finnish candidate clicks a password-reset link and lands on the English page.
**Why:** `/candidate/auth/callback` is a Paraglide-localised page route; `/api/*` is not. The handler's
`locals.currentLocale ?? 'en'` (`candidate/auth/callback/+server.ts:24`) currently derives from the URL
prefix and would fall back to the cookie strategy, then `'en'`.
**How to avoid:** carry the locale explicitly (a query param on the redirect URL) or assert the cookie
strategy covers it. Test with a non-`en` locale — the E2E fixtures hard-code `/en/` (`emailBucket.fixture.ts:217`),
so **the suite will not catch this**.
**Warning sign:** no plan task mentions locale in connection with the move.

### Pitfall 5: the defaults-plus-overrides rewrite silently changes a button label
**What goes wrong:** `buttonTextBasicInfo` in Arm B flips from `basicInfo.edit` to `basicInfo.enter`.
**Why:** Arms A and B share `edit`/`view`; Arm C uses `enter`/`view`. Modelling `defaults` on Arm C makes
Arm B inherit the wrong string unless it overrides explicitly.
**How to avoid:** a table-driven unit test over the three states, written **before** the rewrite against the
current behaviour (§ Validation Architecture, Wave 0).
**Warning sign:** the rewrite has no new test.

### Pitfall 6: `buildRoute` percent-encodes `redirectTo` where the hand-built form did not
**What goes wrong:** the post-login deep link degrades to the app home, silently — `safeRedirectTarget`
returns `undefined` for a value it would have accepted un-encoded, and both callers fall back
(`loginRedirectTarget.ts:26-31` documents that fallback as *intentional*, so nothing errors).
**Why:** `buildRoute` routes non-route params to `qs.stringify(…, { encodeValuesOnly: true })`
(`buildRoute.ts:88`); `RELATIVE_APP_PATH` (`loginRedirectTarget.ts:39`) permits `%` in the query portion but
**not** in path segments.
**How to avoid:** a round-trip unit test — a value accepted by `RELATIVE_APP_PATH`, pushed through
`buildRoute`, decoded, must still be accepted. If it is not, keep the hand-built form and record the
exclusion (§ F Tier 2).
**Warning sign:** criterion 3's sweep touches `admin:54`/`candidate:52` with no accompanying test.

### Pitfall 7: a comment written by this phase reopens Phase 152's class
**What goes wrong:** `yarn lint:check` goes red on a comment 158 authored, after the work is "done".
**Why:** D-N1. 158 writes many comments — the new `$lib/routes` and `$lib/cookies` module docblocks, the
`profile/+page.svelte` replacement comment, two new test modules, five todo files. Several *existing*
comments 158 relocates already contain planning references (`buildRoute.ts` "see phase 88";
`profile/+page.svelte:282` "see phase 89 Plan 02 (TIR4:75-76 …)"; `questions/[questionId]/+page.svelte:1`
"see spike 014b").
**How to avoid:** treat every comment the phase touches as in scope for 152's convention, and grep for
`.planning/`, `phase `, `spike ` and ` -- ` across the phase's diff before the final gate.
**Warning sign:** a `git diff` of the phase containing the string `.planning/`.

### Pitfall 8: `route.id` is typed `string | null` after the guard
**What goes wrong:** `svelte-check` errors on `isCandidateRoute(route.id)`.
**Why:** `hooks.server.ts:64` guards `route?.id == null` but does not narrow `route.id` for the compiler in
all TS configurations.
**How to avoid:** bind `const routeId = route.id;` immediately after the guard (§ E.1 note 1). Do **not**
reach for `!`.

---

## J. Verification strategy

### J.1 — Requirement authority

**CONTEXT `<open>` #6 is stale.** `REVIEW-RT-01..07` exist at `.planning/REQUIREMENTS.md:141-147`, with
traceability rows at `:296-302` and a rollup at `:339`.

**Recommendation:** record in the phase summary that —

> `.planning/REQUIREMENTS.md:141-147` is authoritative for **intent**; `158-CONTEXT.md`'s `<facts>` section
> (and the Requirement Discrepancy Register in `158-RESEARCH.md`) is authoritative for **coordinates**. Seven
> claims in the requirement text are contradicted by the tree; they are enumerated with evidence and none of
> them changes what the phase must do.

Do **not** recommend "accept the criteria because requirements are absent" — that was true when the CONTEXT
was written and is not true now. Do **not** edit `REQUIREMENTS.md` from this phase (nine phases are being
planned concurrently against it); surface the register instead and let the operator route the correction.

### J.2 — Criterion → verification command map

| Criterion / Req | What must be TRUE | Verification |
|---|---|---|
| **1** / RT-01 | one login implementation behind thin entry points; the `/api` route's fate recorded | `yarn test:unit` + `yarn test:e2e` (candidate-journey login/logout steps); **plus** the recorded zero-caller measurement and the checkpoint outcome in the summary |
| **2** / RT-02 | `$lib/cookies/index.ts` frozen map is the only declaration; test fails on a literal at a write site and on a collision | `node scripts/assert-cookie-names.mjs` (in `lint:check`) + `yarn test:unit` (collision + `Object.isFrozen`) + `158-NEGATIVE-CONTROL-LEDGER.md` showing 4 red plants and 2 green negative controls |
| **3** / RT-03 | routes built with `buildRoute`; definitions in one locus | `grep -rn "utils/route" apps packages tests --exclude-dir=node_modules` → **0**; `yarn typecheck` + `yarn typecheck:tests` green; the Tier-1/2/3 table in the summary as the recorded scope statement |
| **4** / RT-04 | `(protected)` exported from `$lib/routes`; hook matches on `route.id`; consistency enforced by test | `yarn test:unit` → `routeConsistency.test.ts` (C1–C4) + ledger showing both failure modes observed red |
| **5** / RT-05 | permissions mapping in `$lib/auth`; `loginRedirectTarget.ts` in `$lib/routes`; callback + logout under `/api` | `grep -rn "project_admin" apps/frontend/src` → only `lib/auth/roles.ts`; `ls apps/frontend/src/lib/routes/loginRedirectTarget.ts`; `yarn test:e2e` full suite (the invite/reset legs exercise the moved callback) |
| **6** / RT-06 | defaults once, overrides only, badge set up front, `if` blocks reference precomputed props | new `candidateHome.test.ts` table over the 3 states; `yarn test:e2e` (candidate-journey + perm-answers-locked) |
| **7** / RT-07 | no test-only element; both theme-colour defaults gone; title per reviewer markup | `grep -rn "profile-image-error" apps tests` → **0**; `grep -n "?? '#" apps/frontend/src/routes/+layout.svelte` → **0**; `yarn test:e2e` (candidate-journey `:601,606` portrait-error steps) |
| **D-G1 NOTES** | the `lib/utils` proposal document exists, names sections, migrates nothing | file exists in the phase dir; `git diff --stat` shows no file moved out of `lib/utils/` except `route/` |
| **D-G5** | five todos filed with `blocking` + `review_anchor`; classification also in the summary | `ls .planning/todos/pending/2026-08-28-*` → 5 new; `grep -l 'blocking: true' …` → 1 |
| **D-N1** | no comment written by this phase carries a planning reference | `git diff <base>..HEAD -- 'apps/**' 'tests/**' \| grep -n "\.planning/"` → 0; plus `yarn lint:check` once 152's scan is live |

### J.3 — E2E: the cardinal gate

**CLAUDE.md § E2E Hard Rule.** No task completes while any E2E test fails; "did not run" counts as a
failure; there are no known-flaky exemptions.

**Prerequisites, in order (from CLAUDE.md and the project's recorded E2E gotchas):**

1. **One** fresh dev server on the target port. `strictPort: true` (`vite.config.ts:39`) makes `yarn dev`
   fail loudly on a same-address collision. A **stale** server from an earlier session is the classic
   silent-failure mode — kill it first.
2. **Clean DB:** `yarn db:reset` (migrations + `seed.sql`), then let the suite's own setup projects seed.
   Do not skip — several perm projects REPLACE the `app_settings` singleton.
3. **The served-application preflight** in `tests/global-setup.ts` runs first and cannot be skipped. It
   asserts the server serving the page is *this* checkout, via Vite's `/@fs`. `FRONTEND_PORT` is the only
   escape hatch (root `.env` for persistent, a command prefix for one-off).
4. `yarn build` before `yarn dev` if any package changed (this phase changes none, but 157 may have).
5. Run the **whole suite** (`yarn test:e2e`), not a grep. Full-suite green is the trusted signal.

**Highest E2E risk in 158, ranked:**

| Rank | Change | Why | Specs at risk |
|---|---|---|---|
| **1** | **The `/api` route move** (§ D.4) | 8 consumers including an exact-match Supabase allowlist and two E2E helpers that hard-code `/en/candidate/auth/callback` | `candidate-journey.spec.ts` (registration via invite link, password reset), everything downstream via `data-setup-base` |
| **2** | **The hooks redirect rewrite** (§ E.1) | changes *when* an unauthenticated visitor is bounced and *what* URL they are bounced to; `redirectTo` encoding may change | `candidate-journey.spec.ts:291,298,391,456,489,492,1013`; `candidate-a11y.spec.ts:177` (asserts the settled URL is inside `/candidate` and is not `/candidate/login`) |
| **3** | **The testid rewrite** (§ H.1) | 3 spec call sites through 1 fixture; a wrong child selector passes vacuously if the assertion is only `toBeVisible` on a locator that resolves to the container | `candidate-journey.spec.ts:601,606` |
| **4** | **The `$lib/routes` move** (§ A) | `tests/tests/utils/buildRoute.ts` feeds `axeScan.ts`, which feeds `a11y-smoke` and `candidate-a11y-scan` (14 scans) | compile-time — the whole suite fails to build, which is the *good* failure mode |
| **5** | The `candidate/(protected)/+page.svelte` rewrite (§ G) | `candidate-home-status` text is asserted | `candidate-journey.spec.ts`, `perm-answers-locked.spec.ts:37` |
| 6 | cookies const module (§ C) | pure rename of literals to consts | `candidate-bank-auth*.spec.ts` (OIDC cookie round-trip) |
| 7 | `+layout.svelte` title/theme colours (§ H.2) | no spec asserts either | none measured |

### J.4 — D-N1: the planning-reference constraint, called out prominently

> ### ⚠ 158 writes more comments than any other v2.15 phase except 152 itself.
>
> New module docblocks (`$lib/routes/index.ts`, `$lib/routes/loginRedirectTarget.ts` relocation header,
> `$lib/cookies/index.ts`), two new test modules with the long explanatory headers this repo's guards
> conventionally carry, a replacement comment at `profile/+page.svelte:281-288`, an updated
> `apps/frontend/src/routes/README.md:18`, a new `scripts/assert-cookie-names.mjs` docblock, and five todo
> files. **Every one is authored after Phase 152's scan is live in `yarn lint:check`.**
>
> Rules, restated: **no `.planning/` path in a source comment; no phase number, plan number or decision id;
> no `--` used as a dash.** And note that several comments 158 *relocates* already violate this
> (`buildRoute.ts` "see phase 88"; `profile/+page.svelte:282` "see phase 89 Plan 02 (TIR4:75-76 + 166-188)";
> `route.ts:29` "see phase 88"; `questions/[questionId]/+page.svelte:1` "see spike 014b"). Moving a file does
> not re-author its comments, but the diff will show them — **coordinate with Phase 152 rather than fixing
> them unilaterally**, or the two phases produce conflicting edits to the same lines.
>
> **Recommended plan task:** a final pre-gate check —
> `git diff <phase-base>..HEAD -- 'apps/**' 'tests/**' 'scripts/**' | grep -nE '\.planning/|Plan [0-9]|phase [0-9]| -- '`
> must return zero on **added** lines.

---

## Validation Architecture

> `.planning/config.json` has no `workflow.nyquist_validation` key → **treat as enabled**; this section is
> required.

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | **vitest** (`apps/frontend/vitest.config.ts`, jsdom, globals; `apps/frontend/package.json:16` → `vitest run`) |
| Root unit entry | `yarn test:unit` = `yarn assert:unit-coverage && turbo run test:unit` (`package.json:28`) |
| E2E framework | **Playwright** (`tests/playwright.config.ts`, ~45 projects) |
| E2E entry | `yarn test:e2e` = `assert:i18n-catalog-namespaces && assert:a11y-scan-wiring && playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe` (`package.json:30`) |
| Static-scan entry | `yarn lint:check` = `turbo run lint && eslint tests && typecheck:tests && typecheck && assert:i18n-catalog-namespaces && assert:a11y-scan-wiring` (`package.json:35`) |
| Config files | `apps/frontend/vitest.config.ts`, `tests/playwright.config.ts`, `apps/frontend/eslint.config.mjs` |
| Quick run | `yarn workspace @openvaa/frontend test:unit` (seconds) |
| Full suite | `yarn test:e2e` (~135–150 tests) |

### Requirement → test map

| Req | Behaviour | Layer | Automated command | Exists? |
|---|---|---|---|---|
| RT-01 | shared helper produces the same outcomes as the three old paths | unit | `yarn workspace @openvaa/frontend test:unit` → `src/lib/auth/passwordLogin.test.ts` | ❌ **Wave 0** |
| RT-01 | login → protected home; logout → login | e2e | `yarn test:e2e --project=candidate-journey` | ✅ `candidate-journey.spec.ts` |
| RT-02 | a cookie-name literal at a write site fails the gate | static | `node scripts/assert-cookie-names.mjs` | ❌ **Wave 0** |
| RT-02 | two names in the map cannot collide; map is frozen | unit | `…test:unit` → `src/lib/cookies/cookies.test.ts` | ❌ **Wave 0** |
| RT-02 | OIDC cookie round-trip still works end to end | e2e | `yarn test:e2e --project=bank-auth` | ✅ `candidate-bank-auth.spec.ts` |
| RT-03 | no `$lib/utils/route` specifier survives | static | `grep -rn "utils/route" apps packages tests --exclude-dir=node_modules` → 0 | ✅ (a grep, run in the plan) |
| RT-03 | every importer still resolves | static | `yarn typecheck && yarn typecheck:tests` | ✅ |
| RT-03 | `buildRoute` produces the same string the hand-built form did, for the Tier-1 redirects | unit | `…test:unit` → `src/lib/routes/buildRoute.redirects.test.ts` | ❌ **Wave 0** |
| RT-04 | pattern ↔ route tree ↔ hook agree (C1–C4) | unit | `…test:unit` → `src/lib/routes/routeConsistency.test.ts` | ❌ **Wave 0** |
| RT-04 | unauthenticated visit to a protected route redirects to login with `redirectTo` | e2e | `yarn test:e2e --project=candidate-journey` | ✅ (`candidate-journey.spec.ts:391,492`) |
| RT-05 | permissions mapping has exactly one home | static | `grep -rn "project_admin" apps/frontend/src` → 1 file | ✅ (a grep) |
| RT-05 | the moved `/api` callback still completes invite + recovery | e2e | `yarn test:e2e --project=candidate-journey` | ✅ (via `emailBucket.fixture.ts`) |
| RT-06 | the 3 states yield the same 7 props as before | unit | `…test:unit` → `src/routes/candidate/(protected)/candidateHome.test.ts` (or a helper extracted to `$lib/candidate/`) | ❌ **Wave 0** |
| RT-06 | home page renders status/tip/buttons per state | e2e | `yarn test:e2e --project=candidate-journey --project=perm-answers-locked` | ✅ |
| RT-07 | the portrait error is addressable as a child of the upload container | e2e | `yarn test:e2e --project=candidate-journey` (`:601`, `:606`) | ✅ |
| RT-07 | no `profile-image-error` remains | static | `grep -rn "profile-image-error" apps tests --exclude-dir=e2e-runs` → 0 | ✅ (a grep) |
| RT-07 | no theme-colour default remains | static | `grep -n "?? '#" apps/frontend/src/routes/+layout.svelte` → 0 | ✅ (a grep) |
| D-N1 | no planning reference in an added comment | static | the `git diff \| grep` in § J.4 | ❌ **Wave 0** (until 152's scan lands) |

### Sampling rate

- **Per task commit:** `yarn workspace @openvaa/frontend test:unit` + `yarn typecheck` (seconds).
- **Per wave merge:** `yarn lint:check` (includes `typecheck:tests`, which is the codemod's real gate) +
  `yarn test:unit`.
- **After any wave touching routes, auth or testids:** `yarn test:e2e` **full suite**, on a fresh dev server
  and a `yarn db:reset` database. Per CLAUDE.md, the full-suite run is the trusted signal and it "does not
  take long".
- **Phase gate:** full suite green before `/gsd-verify-work`, plus the negative-control ledger complete.

### Wave 0 gaps

- [ ] `apps/frontend/src/lib/cookies/cookies.test.ts` — collision + `Object.isFrozen` (RT-02 mode ii)
- [ ] `scripts/assert-cookie-names.mjs` + its wiring into `package.json:35` (RT-02 mode i)
- [ ] `apps/frontend/src/lib/routes/routeConsistency.test.ts` — C1–C4 (RT-04)
- [ ] `apps/frontend/src/lib/auth/passwordLogin.test.ts` — the three outcomes × two role sets (RT-01)
- [ ] a table-driven test for the `nextAction` states (RT-06) — **written against current behaviour BEFORE
      the § G rewrite**, so it is a characterisation test and Pitfall 5 cannot land silently
- [ ] a `buildRoute` round-trip test for `redirectTo` (RT-03 Tier 2 / Pitfall 6)
- [ ] `.planning/phases/158-routing-auth-surface-harmonisation/158-NEGATIVE-CONTROL-LEDGER.md` — 6 plants for
      RT-02, 3 for RT-04
- [ ] No framework install needed. vitest, Playwright and ESLint are all present and wired.

⚠ **Testing a `+page.svelte`'s `$derived.by` directly is awkward in this repo** (no component-test harness is
in routine use; `vitest.config.ts` mocks `$app/*` but the page imports `MainContent`, `Button`, `InfoBadge`
and the candidate context). **Recommend extracting the `nextAction` computation into a pure function** in
`$lib/candidate/` that takes `{profileComplete, answersLocked, missingInfoCount, missingOpinionCount, t,
getRoute, username}` and returns the 7-prop object. The component then calls it inside `$derived.by`. That
makes RT-06 unit-testable at zero mocking cost and is itself a readability win the criterion asks for.

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node + Yarn 4 workspaces | everything | ✓ | per `package.json:74` `engines` | — |
| vitest | the two new unit tests | ✓ | wired at `apps/frontend/vitest.config.ts` | — |
| Playwright + browsers | the cardinal E2E gate | ✓ | `tests/playwright.config.ts`; `yarn playwright install` if browsers are missing | — |
| ESLint (flat config, `v10_config_lookup_from_file`) | `lint:check`; 157's guard | ✓ | `apps/frontend/eslint.config.mjs` | — |
| Local Supabase (`supabase start`) | E2E, `db:reset` | ✓ per project memory ("E2E runs clean here via host Vite + local Supabase") | — | none — E2E cannot run without it |
| Disk headroom for `tests/e2e-runs/` | full-suite artifacts | ⚠ **unverified this session** | — | project memory records ENOSPC voiding full-suite runs in this worktree, with `Docker.raw` bloat as the reclaimable sink. **Check free space before the phase gate**; `tests/e2e-runs/` is cited by registers and must not be deleted. |

**No new external packages are needed.** Every recommended mechanism uses Node built-ins, vitest, or ESLint —
all already present.

---

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.**

The recommended detector is a plain Node script (built-ins only), matching the three existing
`scripts/assert-*.mjs` precedents; the collision and consistency tests use vitest, already a dev dependency
of `apps/frontend`. The rejected alternative (ts-morph, § C.3 option C) would have introduced a new
dependency and is rejected partly for that reason and decisively because it cannot parse `.svelte`.

**Packages removed due to a `[SLOP]` verdict:** none.
**Packages flagged `[SUS]`:** none.

If a plan nevertheless proposes a dependency, run
`gsd-tools query package-legitimacy check --ecosystem npm <pkg>` plus `npm view <pkg> version` and
`npm view <pkg> scripts.postinstall` before it is added, and gate the install behind a
`checkpoint:human-verify`.

---

## K. Plan decomposition recommendation

`granularity: fine`, tracer-first ON, reversibility gates ON, `parallelization: true`.

### K.1 — One-way doors vs. cheap reversals

| Change | Reversibility | Gate |
|---|---|---|
| **`$lib/routes/` move + ~27-file codemod** | **One-way in practice.** `git revert` works but any concurrent phase that touched a moved file conflicts, and nine phases are being planned against this tree. | Land **first, alone, in its own commit**, with `typecheck:tests` green. Checkpoint on the § A.4 whole-directory widening **before** the move. |
| **`/api` auth-route move** | **One-way with an out-of-repo tail** (Supabase Cloud allowlist). Reverting the code does not revert a dashboard change. | `checkpoint:human-verify` (§ D.4). Consider the shim sequencing. |
| **Deleting `/api/auth/login`** | Reversible in git, but it deletes an exported type surface and a `UNIVERSAL_API_ROUTES` key. | `checkpoint:decision` (§ D.5). |
| **`hooks.server.ts` rewrite** | **Cheap.** ~10 lines, one file, covered by E2E. | none beyond the suite |
| **Cookies const module** | **Cheap.** Pure literal→const substitution; the const module is additive. | none |
| **`candidate/(protected)/+page.svelte` rewrite** | **Cheap.** One file. | the characterisation test must exist first |
| **testid rewrite** | **Cheap.** 3 files. | run the two `expectError` steps before and after |
| **`+layout.svelte` title/colours** | **Cheap.** 3 lines. | typecheck |
| **Filing 5 todos + the proposal doc** | **Free.** `.planning/` only, no source. | none |

### K.2 — The natural tracer slice

**Tracer = the `$lib/routes/` move + the `hooks.server.ts` rewrite + the consistency test.**

It is the right tracer because it is thin end-to-end through the phase's whole thesis (one locus → the
pattern lives there → a test enforces it → the hook consumes it), it touches the largest number of files so
it de-risks the codemod early, and **everything else in the phase either imports from `$lib/routes` or is
independent of it.** It also proves the two hardest verification steps (`typecheck:tests`, and a
negative-control ledger) at the point where they are cheapest to fix.

### K.3 — Recommended plan split (fine granularity)

| Plan | Content | Depends on | Parallel with |
|---|---|---|---|
| **158-01 — routes locus (TRACER)** | `checkpoint:decision` on whole-dir vs split → `git mv` → codemod steps 2–7 (§ A.6) → export `PROTECTED_GROUP` / `isCandidateRoute` / `isProtectedRoute` from `route.ts` → gate on build + typecheck + typecheck:tests + lint:check + test:unit | — | nothing (everything else waits) |
| **158-02 — hook rewrite + consistency test** | `hooks.server.ts:64,69,71,72,74,76` rewrite; `routeConsistency.test.ts` C1–C4; 3 negative-control plants; ledger | 01 | 03, 04 |
| **158-03 — cookies** | `$lib/cookies/index.ts`; rewrite all 18 sites incl. `document.cookie`; `scripts/assert-cookie-names.mjs` + wiring; `cookies.test.ts`; 6 plants; ledger | 01 (only for import-path stability; technically independent) | 02, 04 |
| **158-04 — readability + layout (RT-06, RT-07)** | characterisation test **first**, then the `nextAction` extraction + rewrite; testid rewrite in 3 files; `+layout.svelte` `:212,215,219` | — (fully independent) | 02, 03 — **can start immediately, even before 01** |
| **158-05 — login collapse** | `checkpoint:decision` on `/api/auth/login`; `$lib/auth/roles.ts` + `passwordLogin.ts` + tests; rewrite both wrappers; the Tier-2 `redirectTo` round-trip test | 01 (imports `$lib/routes`), 02 (shares `hooks.server.ts` context) | 03 |
| **158-06 — `/api` auth-route move** | `checkpoint:human-verify`; move callback + logout; update `config.toml:167`, `supabaseDataWriter.ts:52,69`, its 6 test assertions, `emailBucket.fixture.ts:214,217`, `supabaseAdminClient.ts:587,628`; add `ROUTE` entries; locale-fallback verification; **update 157's ESLint allowlist paths** | 01, 05 | nothing — **serialise this one; it is the riskiest** |
| **158-07 — `buildRoute` sweep (Tier 1 residue) + OIDC error union** | the `api/oidc/callback` six redirects + the `OIDC_ERROR` const union (§ I.5 item 6) | 01, 06 (the callback file moves in 06) | — |
| **158-08 — records** | the `lib/utils` proposal doc; 5 todo files with `blocking`/`review_anchor`; the disposition table for the 7 unbucketed comments; the classification table in the summary; the Requirement Discrepancy Register; the `/api/auth/login` measurement record | — | everything (pure `.planning/`) |

**Serialisation rule:** everything that imports route strings must wait for **158-01**. That is 02, 05, 06,
07. **158-03, 158-04 and 158-08 are genuinely parallel** — 04 in particular touches no route string at all
and is the best candidate to run alongside the tracer.

**Wave shape:**

```
Wave 0:  158-04 (characterisation test only)  ||  158-08 (records)
Wave 1:  158-01  (TRACER — alone on the route surface)
Wave 2:  158-02  ||  158-03  ||  158-04 (rest)
Wave 3:  158-05
Wave 4:  158-06  (serialised, checkpointed)
Wave 5:  158-07
Gate:    full E2E suite green; ledger complete; D-N1 diff grep clean
```

### K.4 — Checkpoints the planner must insert

| # | Type | Where | Question |
|---|---|---|---|
| 1 | `checkpoint:decision` | 158-01, before the move | Move the whole `lib/utils/route/` directory (recommended, a widening of D-G1) or split it? (§ A.4) |
| 2 | `checkpoint:decision` | 158-05, before touching `api/auth/login` | Keep it as the third thin wrapper (D-G3(a)'s letter) or delete it (criterion 1's conditional, which the zero-caller measurement makes fire)? (§ D.5) |
| 3 | `checkpoint:human-verify` | 158-06, before the move | Will the operator update the **Supabase Cloud** redirect allowlist? Is the locale-fallback change acceptable, or should the shim sequencing be used instead? (§ D.4) |
| 4 | `checkpoint:decision` (light) | 158-04 | Drop the optional chaining on the theme-colour reads along with the `??` defaults, or keep it? (§ H.2) |
| 5 | *(informational, no gate)* | 158-08 | The Requirement Discrepancy Register — surface to the operator; **158 must not edit `REQUIREMENTS.md` itself.** |

---

## Could Not Measure

Stated explicitly rather than guessed:

1. **Phase 157's answer to its `<open>` question 3** (grandfather the 8 leakage sites or drive to 0).
   157 has no `PLAN.md`. Both branches are covered above; the planner must not write a task whose success
   depends on either.
2. **Whether Phase 152's planning-reference scan is live yet.** Measured: `package.json:35`'s `lint:check`
   currently chains `turbo run lint`, `eslint tests`, `typecheck:tests`, `typecheck`,
   `assert:i18n-catalog-namespaces`, `assert:a11y-scan-wiring` — **no comment scan**. `scripts/` holds three
   `assert-*.mjs` files, none of them a comment scan. So D-N1's guard is **prospective**, not live at HEAD
   `db220cb5f`. 158 must still satisfy the convention, but a `lint:check` run today will not enforce it.
3. **The production Supabase Cloud redirect allowlist.** Out of repo; not inspectable from here. Flagged as
   an operator action in § D.4.
4. **Whether `redirectTo` round-trips cleanly through `buildRoute` + `qs`.** Reasoned from
   `buildRoute.ts:88` and `loginRedirectTarget.ts:39` but **not executed**. § F Tier 2 and Pitfall 6 make it
   a required test rather than an assumption.
5. **Whether `staticSettings.colors.light['base-300']` is optional in its type.** Not opened
   (`packages/app-shared/src/settings/staticSettings.ts` was not read this session). § H.2's recommendation
   to drop the optional chaining is conditional on checking it.
6. **Free disk in this worktree.** Project memory records ENOSPC voiding full-suite runs here. Not measured.
7. **Whether `candidate/preregister/+page.svelte` switches on `?error=` values** — needed to size § I.5
   item 6's `OIDC_ERROR` union. The redirect producers are enumerated; the consumer was not read.
8. **The exact `.planning/PRE-SHIP-REVIEW-TRIAGE.md` line number of the `dataProvider` comment** in 157's
   bucket (the CONTEXT says `:236`). I read `:245-317` (158's bucket) and confirmed the comment is *absent*
   from it, and `157-CONTEXT.md` D-N2 independently assigns it to 157 — which is sufficient for the
   disposition, but the line citation itself is unverified.

---

## State of the Art

| Old approach | Current approach | Impact on 158 |
|---|---|---|
| Route params carried a locale segment (`[[lang=locale]]`) | Paraglide `url` strategy (`vite.config.ts:23`) resolves locale; **no `ROUTE` value carries a locale segment** | `buildRoute` appends the prefix via `localizeHref` (`buildRoute.ts:96`). Hand-built `` `/${locale}/…` `` strings duplicate work `buildRoute` already does — which is criterion 3's real argument. ⚠ `tests/tests/utils/buildRoute.ts:14` still special-cases `'[[lang=locale]]'`; harmless dead code, worth noting. |
| `svelte/store` bridges in contexts | Svelte 5 runes, enforced by a lint guard + a 30-case self-test | 158 writes no new reactive state except in § G; the destructuring rule (CLAUDE.md) binds there. |
| Per-leaf question pages | unified-layout-with-empty-leaf + View Transitions (spikes 013–016, Phase 100) | Makes § I.5 items 2 and 3 **declines**, not deferrals. |
| `party` as a role/enum value | `organization` (Phase 156, `REVIEW-DB-01`) | § D.3's `CANDIDATE_ROLES` must read the enum at execution time, not hard-code either spelling. |
| `logDebugError` in `$lib/utils/logger` | moving to `@openvaa/app-shared`, structured/pino-conformant (Phase 157 D-F5) | § D.6's coupling rules. |

**Deprecated / outdated in this area:**
- The comment at `profile/+page.svelte:281-288` — its premise is obsolete since `input-error` was added at
  `Input.svelte:656` (§ H.1).
- `UNIVERSAL_API_ROUTES.login` (`universalApiRoutes.ts:12`) — declared, never used (§ D.5).
- `LoginParams` / `LoginResult` (`api/auth/login/+server.ts:59,77`) — exported, never imported.
- `tests/tests/utils/buildRoute.ts:14`'s `'[[lang=locale]]'` branch — no `ROUTE` value contains it.

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | `buildRoute` is safe to call from `hooks.server.ts` (it imports only `$app/paths`, `$lib/paraglide/runtime`, `qs`) | § E.1 | Server-side hook breaks at runtime. **Mitigant:** three `+page.server.ts` / `+layout.server.ts` files already call it (`admin/login:55`, `candidate/login:53`, `candidate/preregister/+layout.server.ts:17`), so the pattern is proven server-side — but not from a *hook*, which runs earlier. Verify with one E2E run. |
| A2 | Deleting the `<div data-testid="profile-image-error">` does not change layout | § H.1 | A bare `<div>` with no class inside a `flex flex-col` parent is layout-transparent in almost all cases, but not provably so. **Mitigant:** the visual-regression project would catch a shift. |
| A3 | Paraglide does not localise `/api/*` paths, so the moved callback loses its URL-derived locale | § D.4, Pitfall 4 | If Paraglide *does* prefix `/api`, the move breaks differently (404 on the un-prefixed URL). Either way the move needs a locale test. Not verified against the Paraglide runtime source. |
| A4 | The five 158-owned follow-up comments are all non-blocking except `admin/login:27` | § I.2 | Derived from the reviewer's literal use of the word "blocking" in the triage text — which is the same evidence D-G5's own table uses. Low risk. |
| A5 | `severity:`/`blocking:` front-matter additions are acceptable register convention | § I.4 | The register has no schema; adding fields is additive. Worst case the operator prefers `severity: blocking`. |
| A6 | `route.id` for candidate routes always starts with `/candidate` | § E.1 | True for SvelteKit route ids under `routes/candidate/`, and `ROUTE`'s `CANDIDATE` const (`route.ts:1`) encodes the same assumption. Would break only if a candidate route were nested under a group directory at the top level. |
| A7 | Phase 156 has not yet renamed `party` → `organization` at HEAD `db220cb5f` | § D.3 | `candidate/login/+page.server.ts:41` still reads `r.role === 'party'` — measured. But 156 may land before 158 executes, so the extraction must read the tree, not this document. |

---

## Sources

### Primary (HIGH confidence) — the tree, measured this session at `db220cb5f`

- `apps/frontend/src/hooks.server.ts` (read in full, 88 lines)
- `apps/frontend/src/lib/utils/route/{index.ts,route.ts,buildRoute.ts}` (read in full)
- `apps/frontend/src/routes/loginRedirectTarget.ts` (read in full)
- `apps/frontend/src/routes/{admin,candidate}/login/+page.server.ts` (read in full)
- `apps/frontend/src/routes/api/auth/{login,logout}/+server.ts` (read in full)
- `apps/frontend/src/routes/candidate/auth/{callback,logout}/+server.ts` (read in full)
- `apps/frontend/src/lib/api/base/universalApiRoutes.ts` (read in full)
- `apps/frontend/src/routes/candidate/(protected)/+page.svelte` (read in full, 165 lines)
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:275-305`
- `apps/frontend/src/lib/components/input/Input.svelte:5,23,60,389-390,655-656`
- `apps/frontend/src/routes/+layout.svelte:205-225`
- `apps/frontend/src/lib/server/api/dataProvider.ts`, `apps/frontend/src/lib/api/dataProvider.ts`
- `apps/frontend/{svelte.config.js,tsconfig.json,vitest.config.ts,vite.config.ts,eslint.config.mjs:80-125}`
- `apps/supabase/supabase/config.toml:160-175`
- `package.json:27-37`; `scripts/assert-a11y-scan-wiring.mjs:1-50`
- `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:1-60,90-185`
- `tests/tests/utils/{buildRoute.ts,axeScan.ts:35-45,testIds.ts}`,
  `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts`,
  `tests/tests/fixtures/shared/emailBucket.fixture.ts:214-217`,
  `tests/tests/utils/supabaseAdminClient.ts:584-628`, `tests/playwright.config.ts` (project list)
- `.planning/PRE-SHIP-REVIEW-TRIAGE.md:245-317` (all 27 Phase 158 comments, read verbatim)
- `.planning/REQUIREMENTS.md:141-147,296-302,339`; `.planning/ROADMAP.md:1125-1148`
- `.planning/todos/pending/` (89 files; two read in full for the template)

### Primary (HIGH confidence) — planning inputs

- `.planning/phases/158-routing-auth-surface-harmonisation/158-CONTEXT.md` (read in full, 576 lines)
- `.planning/phases/157-adapter-boundary-typing/157-CONTEXT.md` (read in full, 551 lines)
- `CLAUDE.md`; `.planning/STATE.md:243`; `.planning/config.json`

### Secondary (MEDIUM confidence)

- `.planning/spikes/{013,014a,014b,015,016}-*` — directory names only; used to establish that § I.5 items 2
  and 3 collide with shipped spike-validated design. The spike documents themselves were **not** read.

### Tertiary (LOW confidence)

- None. No web search or external documentation was needed; this phase introduces no new library.

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|---|---|---|
| Importer census (§ A) | **HIGH** | Every line grepped and enumerated; the two out-of-tree importers found and cited |
| Cookie census (§ C) | **HIGH** | Two independent greps (operation-keyed and name-keyed) cross-checked; the 18th site found by the second and confirmed by reading `:95-125` |
| `/api/auth/login` zero callers (§ D.5) | **HIGH** | Four independent greps (`auth/login`, `UNIVERSAL_API_ROUTES`, `LoginParams`, `/api/` literals) over `apps`, `packages`, `tests`, `docs` |
| `hooks.server.ts` anchors (§ E) | **HIGH** | Whole file read with line numbers |
| Criterion 7 rewrite (§ H.1) | **HIGH** | The enabling fact (`input-error` inside the `containerProps` container) verified by reading both ends of `Input.svelte` |
| D-G5 enumeration (§ I) | **HIGH** | The full 27-comment triage bucket read verbatim; the `dataProvider` absence confirmed two ways |
| `/api` move blast radius (§ D.4) | **MEDIUM-HIGH** | All in-repo consumers enumerated; the out-of-repo Cloud allowlist inferred from `config.toml`'s semantics, not inspected |
| Locale-loss on the moved callback (§ D.4, A3) | **MEDIUM** | Reasoned from `vite.config.ts:23` and `hooks.server.ts:64`; not executed |
| `redirectTo` round-trip (§ F Tier 2) | **MEDIUM** | Reasoned from `buildRoute.ts:88` + `loginRedirectTarget.ts:39`; not executed |
| Phase 157 interaction | **MEDIUM** | 157 has no plan; both branches covered, neither observed |

**Research date:** 2026-08-28
**Valid until:** ~2026-09-11 for the code measurements (the tree is under concurrent modification by nine
phases — **re-measure the importer count and the `hooks.server.ts` line numbers at planning time**, per this
phase's own history of drifted anchors). Indefinite for the design recommendations.





