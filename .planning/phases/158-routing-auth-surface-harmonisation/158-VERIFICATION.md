---
phase: 158-routing-auth-surface-harmonisation
verified: 2026-09-02T15:10:41Z
status: passed
score: 13/13 roadmap success criteria verified; 7/7 REVIEW-RT requirements satisfied; 6/6 carried obligations (OB-1..OB-6) discharged
behavior_unverified: 0
overrides_applied: 0
human_verification_disposition: accepted-deferred
human_verification_decided_by: operator
human_verification_decided: 2026-09-02
human_verification_note: "NOT tested and passed. The two items below were reviewed by the operator at the phase close and accepted as tracked follow-up rather than blockers, on this report's own recommendation. Both are pre-existing, already-disclosed residual-risk windows needing an environment unavailable to an agent. They remain OPEN: item 1 at .planning/todos/pending/2026-09-02-close-bank-auth-oidc-round-trip-window.md (consolidating WINDOWS.md rows 217/220/221/222) and item 2 at .planning/todos/pending/2026-09-02-forgot-password-pkce-code-not-exchanged.md (WINDOWS.md row 219). Neither blocks Phase 159. Status is 'passed' on the thirteen ROADMAP criteria, 7/7 REVIEW-RT requirements and 6/6 carried obligations - not on these two items, which were never executed."
human_verification_deferred:
  - test: "Run the opt-in PLAYWRIGHT_BANK_AUTH suite (bank-auth, bank-auth-journey projects) against a live mock OIDC issuer, per tests/IDURA-TEST-RUNBOOK.md, after 158-03's 18-site cookie-name rewrite and 158-06's callback/logout endpoint move."
    expected: "The full OIDC login round trip (authorize -> callback -> token exchange -> session cookie set under the new $lib/cookies names) completes end to end, and the candidate lands authenticated."
    why_human: "Requires standing up the mock OIDC issuer plus the frontend's own IdP-pointing env, which is explicitly operator/deployment-environment responsibility and is not available in this sandbox. No static check can substitute for a live external-IdP round trip. Already logged as an accepted open window (WINDOWS.md rows 217, 220, 221, 222) — the phase's own gate (158-09) closed with this window explicitly open and the operator selected to proceed. This item asks a human to close that window before the bank-auth surface is trusted in production, not to re-litigate phase completion."
  - test: "Confirm the in-app forgot-password flow (candidate/auth/callback via the PKCE `?code=` redirect) actually completes for a real recovery e-mail, given 158-06 found the handler reads only `?token_hash=` and falls through to the login error redirect on the `?code=` branch."
    expected: "Either the flow is fixed to accept both PKCE forms, or this is formally accepted as a pre-existing, phase-158-independent defect (it predates the route move and reproduces on the pre-move path too)."
    why_human: "Already filed as WINDOWS.md row 219 and disclosed in 158-06-SUMMARY.md as pre-existing and out of REVIEW-RT-03's scope; recorded here so it is not lost, not because 158 owed a fix for it."
---

# Phase 158: Routing & Auth Surface Harmonisation Verification Report

**Phase Goal:** There is one login path, one place route strings are defined, and one place cookie names are declared — and a test fails when a fourth appears. Scope widened by operator ruling D10: the admin app works again, is gated and role-checked, `/api/auth/login` is deleted, the admin app has E2E coverage, an admin job never holds the initiating request's credentials past its start, and no server load serialises a refresh token into the HTML payload.

**Verified:** 2026-09-02T15:10:41Z
**Status:** passed — with two human-verification items accepted as tracked follow-up (see frontmatter `human_verification_disposition`)
**Re-verification:** No — initial verification

## Verification method and posture

This report does **not** restate the seventeen SUMMARY.md files' claims. Every row in the tables below was checked directly against the tree at `83578fb06` (HEAD at verification time, matching the orchestrator's stated state) by one or more of: reading the actual source file, running the guard scripts live, running a positive control against each guard to prove it is not vacuous, running the frontend unit-test suite and `yarn lint:check` myself, and cross-referencing `git log`/`git grep` against the plans' own claimed measurements. Where I relied on a documented measurement rather than re-running it myself (the full E2E suite, and the admin-baseline curl walk), I say so explicitly and give the reason (cost/state-mutation of re-running a full `db:reset` + E2E cycle) plus the independent evidence that the tree has not changed since that measurement was taken (`git diff --name-only c074bb04d..HEAD` outside `.planning/` is empty — reproduced below).

```
$ git log --oneline -1
83578fb06 docs(158): file the D-N1 enforcement gap the phase gate measured
$ git status --porcelain
?? .planning/milestone.lock          (pre-existing, untracked, unrelated)
$ git diff --name-only c074bb04d..HEAD -- apps packages tests scripts
(empty — every commit since the gate's own full-suite run is under .planning/)
```

## Goal Achievement

### Observable Truths — the thirteen ROADMAP success criteria (authoritative per decision C6(a))

| # | Truth | Status | Evidence (independently measured) |
|---|-------|--------|-------------------------------------|
| 1 | Admin, candidate and generic-API login paths are collapsed onto shared logic; an unused generic `/api` login route is deleted | ✓ VERIFIED | `apps/frontend/src/lib/auth/passwordLogin.ts` exists, exports one `passwordLogin()` helper; both `admin/login/+page.server.ts:16` and `candidate/login/+page.server.ts:16` call it. `git grep -nF "api/auth/login" -- apps packages tests` → **0**; positive control `api/auth/logout` → **1** hit (same command shape, proves the search isn't vacuous). `find apps/frontend/src/routes/api/auth -type f` → exactly one file, `logout/+server.ts`. Unit: `passwordLogin.test.ts` — 17/17 pass (run live). |
| 2 | Every cookie is named from one const module; a test fails on a literal or a collision | ✓ VERIFIED | `apps/frontend/src/lib/cookies/index.ts` declares `COOKIE = { idToken, oidcState, oidcNonce, oidcCodeVerifier }`, frozen. `yarn assert:cookie-names` (wired into `yarn lint:check`) → **"scanned 783 file(s)… 0 violation(s)"**, run live. **Positive control run live by me**: planted a literal `cookies.set('id_token', …)` in a throwaway route file → guard **failed at exit 1**, naming the exact file/line and the exact violation, then the plant was deleted and the guard returned to 0/783. |
| 3 | Route strings built with `buildRoute`; one centralised locus at `$lib/routes/` | ✓ VERIFIED | `apps/frontend/src/lib/routes/` exists with 13 files (`route.ts`, `buildRoute.ts`, `appGates.ts`, `loginRedirectTarget.ts`, `params.ts`, `impliedParams.ts`, `parseParams.ts`, `index.ts`, plus 5 test files). `apps/frontend/src/lib/utils/route/` no longer exists (`ls` → no such directory). `git grep -c "lib/utils/route" -- apps/frontend/src` → **0** residual importers. |
| 4 | `(protected)` pattern defined in that locus; `pathname.includes('/candidate')` gone from `hooks.server.ts`; consistency enforced by test | ✓ VERIFIED | Read `apps/frontend/src/hooks.server.ts` directly: `pathname.includes('/candidate')` is **absent**; the gate handler (`appGateHandle`) calls `resolveAppGate(routeId)` and `isProtectedRoute(routeId)` — both route-id-based, defined once in `$lib/routes`. `apps/frontend/src/lib/routes/routeConsistency.test.ts` (46 tests) and `appGates.test.ts` (40 tests) — both run live, 86/86 pass, including explicit segment-boundary escalation cases (`/admin-tools`, `/administration` must NOT match `isAdminRoute`). |
| 5 | Permissions mapping extracted to a shared utility; `loginRedirectTarget.ts` moved; candidate auth callback/logout moved under `/api` | ✓ VERIFIED | `apps/frontend/src/lib/auth/roles.ts` declares `ADMIN_ROLES`/`CANDIDATE_ROLES` once (read directly), consumed by both login gates. `loginRedirectTarget.ts` lives at `$lib/routes/loginRedirectTarget.ts`. `apps/frontend/src/routes/api/candidate/auth/{callback,logout}/+server.ts` exist; `apps/frontend/src/routes/candidate/auth/` no longer exists (`ls` confirms). **Note:** `REQUIREMENTS.md` line 145's prose still reads "the callback-and-logout-under-`/api` clause is NOT built", explicitly dated "measured at `158-05` close" — this text was never refreshed after `158-06` (which built it, 2026-09-02) and is now stale/inaccurate. It is a documentation staleness issue, not a functional gap — the code has moved, confirmed directly. Flagged for a follow-up doc fix, not a phase blocker. |
| 6 | Candidate home props: defaults once, overrides only | ✓ VERIFIED | `apps/frontend/src/routes/candidate/(protected)/+page.svelte` computes `nextAction`/badges via `computeNextAction`/`computeBadges` helpers in `candidateHome.helpers.ts`, called once with precomputed props. `candidateHome.helpers.test.ts` (12-case characterisation table per `158-04-SUMMARY.md`, confirmed present) exercises it. |
| 7 | Test-only element removed (test id moved to parent); theme-colour defaults removed; maintenance title renders per spec | ✓ VERIFIED | `profile/+page.svelte` carries `data-testid="candidate-profile-info-item"` on the parent wrapping each question (child-selector pattern), no test-only leaf element. `+layout.svelte:99` builds `documentTitle` as `` `${t('dynamic.appName')}${underMaintenance ? ` – ${t('maintenance.title')}` : ''}` `` — i18n keys, no hardcoded fallback string. `??` optional-chaining fallback count in the file's title/theme block: 0 (per `158-09-SUMMARY.md`'s live-measured control, cross-checked by reading the file). |
| 8 | The admin app works again — no direct-entry/refresh bounce | ✓ VERIFIED | `158-ADMIN-BASELINE.md` records a fresh, non-vacuous curl walk (positive-controlled: row-3 discriminator returns 1/1/1 against the login-page control and 0/0/0 against the authenticated admin page) showing 200 on direct entry, 200 on refresh, 200 on a nested protected route, 200 on both jobs endpoints for an authenticated `project_admin`, and 307/401 for unauthenticated — **ARM: GREEN**, operator-selected. The durable regression half is `tests/tests/specs/admin/admin-access.spec.ts`, confirmed present, confirmed part of the phase's own `admin` Playwright project, confirmed to have run at position 125/153 in the gate's own green full-suite run (`git log` shows the spec file existed at `c074bb04d`, the commit the 153/0/0 run was taken against). This is a behavior-dependent truth and it is backed by an actual passing E2E test, not presence alone. |
| 9 | Admin surface gated (not only candidate); admin form actions role-checked | ✓ VERIFIED | (a) `apps/frontend/src/lib/routes/appGates.ts`: `APP_GATES = [CANDIDATE_GATE, ADMIN_GATE]`, one table-driven loop in `hooks.server.ts`'s `appGateHandle`, no per-application conditional. `appGates.test.ts` (40 tests, run live) asserts ordering, freeze, segment-exact membership for both apps. (b) Both `argument-condensation/+page.server.ts` and `question-info/+page.server.ts` call `requireAdminAction({ fetch, locals })` as the **first** statement in their action, before any writer construction (read directly; the two files are otherwise near-identical by `diff`). `requireAdminIdentity.test.ts` — 22/22 pass (run live). |
| 10 | `/api/auth/login` deleted | ✓ VERIFIED | `git grep -nF "api/auth/login" -- apps packages tests` → **0** (re-run live, matches `158-ADMIN-BASELINE.md`'s S1). `git grep -nF "UNIVERSAL_API_ROUTES.login"` → **0**. Positive controls (`api/auth/logout`, `UNIVERSAL_API_ROUTES.logout`) both non-zero in the same run, proving the searches are not vacuous. |
| 11 | First admin E2E coverage, surviving a page refresh | ✓ VERIFIED | Read `tests/tests/specs/admin/admin-access.spec.ts` in full: one test walking cold entry, a real `page.reload()` (not a client-side navigation — the spec's own docstring explains why that distinction is load-bearing), the hook-gate discriminating arm (authenticated GET of the login page must 303 to home), an authenticated jobs-endpoint call, an `httpOnly`-cookie non-leak assertion with both a negative and positive control in one expectation, and a real `admin_jobs` write verified by reading the row back from the database. Confirmed present in the tree at the commit the 153/0/0 gate run was taken against. |
| 12 | Admin job holds its own credential, resolved once, never the initiating request's | ✓ VERIFIED | `apps/frontend/src/lib/supabase/job.ts`: `createSupabaseJobClient` builds a client with `auth: { persistSession: false, autoRefreshToken: false }`. `condenseArguments.ts`/`generateQuestionInfo.ts` resolve `source.locals.safeGetSession()` once, ahead of the job body, and pass the resulting client rather than `source.fetch`. `job.test.ts:43` — `expect(lastOptions().auth).toEqual({ persistSession: false, autoRefreshToken: false })` — run live, passes. |
| 13 | No server load serialises a refresh token; a test asserts it | ✓ VERIFIED | `admin/+layout.server.ts` and `candidate/+layout.server.ts` both return `{ userId, expiresAt }` only — read directly, byte-identical apart from the docblock's application name. `node scripts/assert-no-session-in-loads.mjs` (wired into `yarn lint:check`) run live → **"12 module(s) … 0 violation(s) in the real corpus; self-test flagged 5 line(s) in scripts/fixtures/assert-no-session-in-loads.input.ts (matching the committed expectation)"** — the guard proves its own liveness against a fixture on every run, which is a stronger proof than a bare 0. |

**Score:** 13/13 ROADMAP success criteria verified. 0 behavior-unverified.

### Carried Obligations (OB-1..OB-6, `158-CARRIED-OBLIGATIONS.md`)

| Obligation | Status | Evidence |
|---|---|---|
| OB-1 — two admin universal loads serialised behind the root load | ✓ DISCHARGED (option a+) | Both `argument-condensation/+layout.server.ts` and `question-info/+layout.server.ts` exist, are byte-identical (`diff` run live, empty), each returns a filtered `supabaseCookies` array with no `await parent()` for the client. `layout.server.test.ts` drives both from one spec (confirmed present). |
| OB-2 — `/api/auth/login` deleted upstream; 158's job is verification only | ✓ DISCHARGED | Verified directly, see criterion 10 above. |
| OB-3 — six `/api/admin/jobs/**` endpoints no longer rely on singleton contamination | ✓ DISCHARGED as precondition | `158-10`'s baseline was measured after the 157.2 fix; four of six job endpoints (`start`, `abort-all`, `single/[jobId]/abort`, `single/[jobId]/progress`) remain uncalled by any measurement — correctly disclosed as an open coverage gap in `158-ADMIN-BASELINE.md` and `158-09-SUMMARY.md` §14, not silently dropped. |
| OB-4 — `hooks.server.ts` anchors banned from line numbers | ✓ DISCHARGED | Confirmed: this report and the phase's own artifacts cite the file by expression (`pathname.includes('/candidate')`, `resolveAppGate(routeId)`), never by line number. |
| OB-5 — swallowed-error class | ✓ DISCHARGED (thrown-pin arm, after premise retraction) | Retraction confirmed at commit `b5c9bb68d` (present in `git log`). `requireAdminAction` gates both actions first (verified above); `UniversalAdapter.fetch` throws on `!response.ok` with a regression test (`universalAdapter.test.ts`, "should throw error when response is not ok" — present). |
| OB-6 — criterion 8 re-measured before planning | ✓ DISCHARGED — ARM: GREEN | See criterion 8 above; the ROADMAP's own criterion-8 text has been corrected to read "307 and 401" per the operator's ruling, confirmed by reading the current ROADMAP text (401, not 403, for the unauthenticated arm — matches `requireVerifiedAdmin`'s design). |

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `apps/frontend/src/lib/routes/` (13 files) | Centralised route locus | ✓ VERIFIED | Exists, exported via `index.ts` barrel, old `lib/utils/route` gone |
| `apps/frontend/src/lib/cookies/index.ts` | Cookie-name const module | ✓ VERIFIED | `COOKIE` frozen map, 4 names, guard wired and fires |
| `apps/frontend/src/lib/auth/passwordLogin.ts`, `roles.ts` | Shared login logic + role declarations | ✓ VERIFIED | Both entry points call the same helper; roles declared once |
| `apps/frontend/src/routes/api/candidate/auth/{callback,logout}/+server.ts` | Candidate auth under generic API prefix | ✓ VERIFIED | Present; old `candidate/auth/` directory gone |
| `apps/frontend/src/lib/server/admin/requireAdminAction.ts`, `requireAdminIdentity.ts` | Shared admin-identity decision, form-action wrapper | ✓ VERIFIED | Both wrappers consume one shared decision; both action sites call the wrapper first |
| `apps/frontend/src/lib/supabase/job.ts` | Job's own credential, `persistSession:false` | ✓ VERIFIED | Confirmed by source read + passing unit assertion |
| `apps/frontend/src/routes/admin/+layout.server.ts`, `candidate/+layout.server.ts` | Session projection, not full session | ✓ VERIFIED | Both return `{userId, expiresAt}` only |
| `tests/tests/specs/admin/admin-access.spec.ts` | First admin E2E coverage | ✓ VERIFIED | Present, comprehensive, ran green in the phase's own full-suite run |
| `scripts/assert-cookie-names.mjs`, `scripts/assert-no-session-in-loads.mjs` | Standing guards, chained in `yarn lint:check` | ✓ VERIFIED | Both wired (confirmed in `package.json`'s `lint:check` script), both run live with positive controls |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `hooks.server.ts` `appGateHandle` | `$lib/routes/appGates.ts` | `resolveAppGate(routeId)` | ✓ WIRED | Read directly; the hook imports and calls it |
| `admin/login/+page.server.ts`, `candidate/login/+page.server.ts` | `lib/auth/passwordLogin.ts` | direct import + call | ✓ WIRED | Confirmed at both call sites |
| `argument-condensation/+page.server.ts`, `question-info/+page.server.ts` | `lib/server/admin/requireAdminAction.ts` | first statement in each action | ✓ WIRED | Confirmed by source read; order verified (gate precedes writer construction) |
| `condenseArguments.ts`, `generateQuestionInfo.ts` | `lib/supabase/job.ts` `createSupabaseJobClient` | resolved-once session -> job's own client | ✓ WIRED | Confirmed by source read |
| `yarn lint:check` | `assert:cookie-names`, `assert:no-session-in-loads` | chained script invocation | ✓ WIRED | Confirmed in `package.json`; both ran and reported 0 violations in a live `yarn lint:check` run |
| `tests/tests/specs/admin/admin-access.spec.ts` | `/api/admin/jobs/active`, admin form action | `page.request` calls through real cookies | ✓ WIRED | Spec content read; ran in the gate's full-suite run (position 125/153) |

### Behavioral Spot-Checks (run live during this verification)

| Behavior | Command | Result | Status |
|---|---|---|---|
| Cookie-name guard fires on a literal | planted `cookies.set('id_token', 'literal-violation', {})`, ran `node scripts/assert-cookie-names.mjs` | Exit 1, named the exact file/line | ✓ PASS |
| Cookie-name guard is clean on the real tree | `node scripts/assert-cookie-names.mjs` | "scanned 783 file(s) … 0 violation(s)", exit 0 | ✓ PASS |
| No-session-in-loads guard self-tests on every run | `node scripts/assert-no-session-in-loads.mjs` (via `yarn lint:check`) | "12 module(s) … 0 violation(s) in the real corpus; self-test flagged 5 line(s) … matching the committed expectation" | ✓ PASS |
| `/api/auth/login` absent, `/api/auth/logout` present (positive control) | `git grep -nF "api/auth/login"` vs `git grep -nF "api/auth/logout"` | 0 vs 1 | ✓ PASS |
| Old routes locus gone | `ls apps/frontend/src/lib/utils/route` | no such directory | ✓ PASS |
| `hooks.server.ts` no longer does substring pathname matching for `/candidate` | direct file read | absent; replaced by `resolveAppGate(routeId)` | ✓ PASS |
| Full `yarn lint:check` | `yarn lint:check` | exit 0, all 22 turbo tasks + 10 assert scripts reported clean | ✓ PASS |
| Full `yarn test:unit` | `yarn test:unit` | exit 0, **81 files / 1552 tests**, all pass | ✓ PASS |
| Routes/cookies/auth/admin unit files, isolated | `yarn vitest run src/lib/routes src/lib/cookies src/lib/auth src/lib/server/admin` (frontend workspace) | **8 files / 163 tests**, all pass | ✓ PASS |
| Debt-marker sweep on phase-touched files | `grep -nE "TBD|FIXME|XXX"` over the routes/cookies/auth/admin-server/hooks/admin-spec files | 0 hits | ✓ PASS |

### E2E — relied on documented run, not re-executed here

The full E2E suite (**153 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run**) was run by the phase's own gate at `c074bb04d`, with the admin-access spec confirmed at position 125/153 (setup 124, teardown 126), matching `158-ADMIN-E2E-SCHEDULING.md`'s prediction. I did not re-run the full suite myself: it requires a fresh `yarn db:reset` + a live dev server + roughly the phase's own multi-minute run time, and I independently confirmed `git diff --name-only c074bb04d..HEAD -- apps packages tests scripts` is **empty** — every commit since that run is `.planning/`-only documentation. The green result therefore still covers the exact source tree at HEAD. This matches the orchestrator's own stated state, and I verified the diff-emptiness claim myself rather than trusting it.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| REVIEW-RT-01 | 158-05 | One login path, unused generic route deleted if collapse leaves it so | ✓ SATISFIED | See criterion 1 |
| REVIEW-RT-02 | 158-03 | One cookie-name const module, guarded by test | ✓ SATISFIED | See criterion 2 |
| REVIEW-RT-03 | 158-01, 06, 07 | Routes built with `buildRoute`, one centralised locus | ✓ SATISFIED | See criteria 3, 5 |
| REVIEW-RT-04 | 158-01, 02, 11 | `(protected)` pattern centralised, subpath misfire fixed, consistency enforced | ✓ SATISFIED | See criteria 4, 9a |
| REVIEW-RT-05 | 158-01, 05, 06 | Permissions mapping, `loginRedirectTarget`, callback/logout under `/api` | ✓ SATISFIED (REQUIREMENTS.md prose is stale, see criterion-5 note above) | See criterion 5 |
| REVIEW-RT-06 | 158-04 | Candidate home props: defaults once | ✓ SATISFIED | See criterion 6 |
| REVIEW-RT-07 | 158-04 | Test-only markup removed, theme defaults removed, maintenance title | ✓ SATISFIED | See criterion 7 |

**No orphaned requirements.** `grep -n "Phase 158" .planning/REQUIREMENTS.md` returns exactly these seven ids; the D10 widening's criteria 8-13 are correctly absent from `REQUIREMENTS.md` by decision C6(a) (the ROADMAP is the authoritative trace for this widening) — confirmed this is a deliberate, documented split, not an omission, and it is itself flagged as a documentation-debt item in `158-09-SUMMARY.md` §14 item 9 ("a reader consulting REQUIREMENTS.md alone... misses the whole admin widening").

### Anti-Patterns Found

None (blocker or warning tier) in the files this phase's plans modified. Debt-marker sweep (`TBD|FIXME|XXX`) over the routes/cookies/auth/admin-server/hooks/admin-spec files returned 0 hits. No stub returns, no empty handlers, no hardcoded-empty stub props found in any file read during this verification.

Non-blocking documentation-quality items found (none affect the phase's own success criteria):
- `REQUIREMENTS.md:145`'s REVIEW-RT-05 prose is stale (says "NOT built" for a clause `158-06` subsequently built; the checkbox and summary-table status are correct, only the explanatory prose lags).
- `WINDOWS.md` correctly records the traceability split (row visible in `158-09-SUMMARY.md` §14 item 9) and the D-N1 enforcement-chain gap (filed as `.planning/todos/pending/2026-09-02-chain-d-n1-planning-reference-scan.md`, confirmed present) — both are process/documentation debt, not code defects, and both are already correctly disclosed rather than hidden.

### Human Verification Required

See frontmatter `human_verification` for the full, structured items. Summary:

1. **The `PLAYWRIGHT_BANK_AUTH` OIDC round trip has not been run since the cookie rename** (158-03: 4 names across 17 sites; 158-06: the callback/logout endpoint move). What exists instead — and what I independently confirmed — is a static byte-identity proof of the substitution, a live, positive-controlled guard (0/783 violations, fires on a plant), and unit-test coverage of the individual read/write sites. What is genuinely unproven is the live, end-to-end OIDC handshake against a real (mock) identity provider using the renamed cookies. This is correctly logged as an open window (`WINDOWS.md` rows 217, 220, 221, 222 — I confirmed all four are present and accurately worded) and the phase's own gate closed with this window explicitly open on the operator's own selection. I am surfacing it here because it is exactly the class of thing "only a person can confirm" (an external-service round trip needing an operator-owned environment) — not because I found it undisclosed.
2. **The in-app forgot-password flow cannot complete** via the PKCE `?code=` redirect (the handler only reads `?token_hash=`). Confirmed pre-existing and independent of the route move (158-06's own measurement, reproduced by reading the callback handler). Filed at `WINDOWS.md` row 219. Recorded here for visibility, not as a phase-158 defect.

### Gaps Summary

No gaps. All thirteen ROADMAP success criteria for Phase 158 (including the D10 widening, criteria 8-13) are independently verified against the codebase — not merely claimed in SUMMARY.md files. All six carried obligations (OB-1..OB-6) are discharged with evidence I re-checked directly. All seven `REVIEW-RT-01..07` requirements are satisfied and correctly traced in `REQUIREMENTS.md` with no orphans. `yarn lint:check`, `yarn typecheck` (via the lint chain) and `yarn test:unit` (81 files / 1552 tests) all reproduce green when run live. The standing guards this phase introduced (`assert:cookie-names`, `assert:no-session-in-loads`) were proven non-vacuous with a live positive control during this verification, not merely trusted from the phase's own record.

The phase's own record is unusually well-instrumented and none of my independent checks contradicted it. The two items above are pre-existing, already-disclosed, operator-acknowledged residual risk windows that need a human with the right rig to close — they do not represent an achievement gap in what Phase 158 set out to do, and the phase's own artifacts (WINDOWS.md, `158-09-SUMMARY.md` §14, `158-D10-DISPOSITIONS.md`) already state this. I am not recommending the phase be reopened or replanned; I am recommending the ROADMAP.md phase-level checkbox be ticked, with the two human-verification items tracked as follow-up (they are already tracked in WINDOWS.md, so no new tracking artifact is needed) rather than as a blocking condition on Phase 159.

---

_Verified: 2026-09-02T15:10:41Z_
_Verifier: Claude (gsd-verifier)_
