# Phase 79: Determinism Recovery (Cascading-Race Fix + Constants Regen) — Research

**Researched:** 2026-05-12
**Domain:** E2E test determinism — Playwright project-dependency cascade unblock; Supabase auth-session propagation + SvelteKit `(protected)/+layout` hydration race; parity-script constants regen with strict 3-run SHA-256 identity gate; long-running unattended agent gate execution
**Confidence:** HIGH (every concrete claim verified by reading source files at HEAD; locked decisions D-01..D-16 + Phase 73 D-09 IMGPROXY structural binding + Phase 75 SHA-256 anchor protocol cross-referenced against current code state)

---

<user_constraints>

## User Constraints (from 79-CONTEXT.md)

### Locked Decisions

**Fix Path for Cascading Race (DETERM-04)**

- **D-01:** Primary path is FRONTEND RACE FIX; FALLBACK is test restructure. RCA + fix plans land first attempting to patch the underlying post-set-password redirect race at the application layer. Test restructure becomes the contingent path if the frontend fix doesn't resolve the cascade.
- **D-02:** Fallback trigger is TIME-BOXED at 1 RCA plan + 1 fix plan. If after those 2 plans the 3-run cold-start cascade still reproduces 3/3, pivot immediately to restructure.
- **D-03:** Fallback restructure shape — `register-fresh-candidate.setup.ts` extracts registration + ToU acceptance. New setup project at `tests/tests/setup/register-fresh-candidate.setup.ts` extracts steps 1-7 of the current `should register the fresh candidate via email link` test. Mirrors `auth.setup.ts`'s retry-tolerance pattern (3-attempt loop). New project depends on `candidate-app`; `candidate-app-mutation` then depends on the new setup project instead of `candidate-app`. Downstream tests `loginAsCandidate(page)` and proceed.
- **D-04:** RCA plan instruments BOTH hypotheses in parallel. Hypothesis 1 (auth session propagation) — Playwright network panel captures Supabase session cookies + JWT state at the `client.setPassword() → /login redirect` window. Hypothesis 2 (ToU hydration timing) — Playwright network panel + console logs capture SvelteKit hydration timing on the post-redirect `/login` page (or wherever ToU should render) + ToU checkbox render timing.
- **D-05:** RCA artifacts are COMMITTED traces + RESEARCH.md section. Network panel + console logs + screenshots land in `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/rca-traces/`; findings inline in the phase's RESEARCH.md §"DETERM-04 RCA".
- **D-06:** If one hypothesis is empirically disproven, RESEARCH.md DOCUMENTS THE DISPROOF and the fix plan focuses solely on the confirmed root cause. The disproven path is NOT instrumented in the fix; disproof evidence is preserved for future races.

**Constants Regen (DETERM-05)**

- **D-07:** Mechanism — COPY `regen-constants.mjs` into Phase 79 post-fix/. Source: `.planning/milestones/v2.9-phases/73-determinism-baseline/post-fix/regen-constants.mjs`. Destination: `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs`. Phase 79's copy is the canonical Phase 79 regen artifact; archived original stays as v2.9 historical record. The `IMGPROXY_TIED_TITLES` list preserved verbatim.
- **D-08:** Regen gate — STRICT SHA-256 IDENTITY across 3 cold-start runs. Compute `sha256(sorted("<projectName> :: <specFile> > <specTitle>|<status>\n") for each test entry)` per run; only regen if all 3 hashes match. Matches Phase 75 SC #4 precedent (recorded hash `7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc`).
- **D-09:** Instability protocol — RE-RUN + INVESTIGATE the flake first. If 3-run SHA-256 identity FAILS, pause regen, add 3 more cold-start runs (6 total). If the flake reproduces, file follow-up todo + escalate to operator via STATUS.md flag. If the 3 fresh runs are SHA-identical, use those as regen source. Cap at one re-run cycle.
- **D-10:** Commit shape — ONE ATOMIC COMMIT per DETERM-05 plan. Single commit lands: (1) `post-fix/run-{1,2,3}.json`, (2) `post-fix/sha256.txt`, (3) `post-fix/regen-output.txt`, (4) constants update in `tests/scripts/diff-playwright-reports.ts`, (5) `post-fix/imgproxy-audit.txt`.

**3-Run Cold-Start Gate Execution**

- **D-11:** Gate runner — AGENT-INLINE via `Bash(run_in_background=true)`. Each cold-start is ~54 min; ~162 min total wall time + agent supervision (excluding pre-gate confirm). No operator interruption.
- **D-12:** Pre-gate confirm — DETERM-04 fix plan ends with a 1-RUN cold-start smoke BEFORE handing off to the 3-run gate.
- **D-13:** Cold-start protocol per run — `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean` (LANDMINE-9 manual chain); spin up Vite in background; capture JSON; kill Vite.
- **D-14:** imgproxy 502 recovery — `supabase stop && supabase start && yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean`; restart Vite; re-capture into the SAME `run-N.json` (overwrite). Cap 2 retries. Escalate to operator via STATUS.md if a single run needs 3+ retries.
- **D-15:** User pre-departure setup — operator kills Vite (port 5173); Supabase stays up. Agent assumes Supabase is healthy on entry.
- **D-16:** Wake-up artifact — `STATUS.md` at phase root, updated at every agent wake-up.

### Claude's Discretion

- Exact instrumentation tooling for the RCA plan (Playwright tracing API, custom console.log hooks, Supabase admin API session inspection) — pick whatever produces the clearest evidence; commit the chosen approach into RESEARCH.md.
- Whether to retain the `loginIfRedirectedToLoginPage` helper in the test file under both fix paths (frontend race fix → keep; restructure path → move into setup project).
- Whether to add a regression test for the post-fix behavior — defer to planner if cost is non-trivial.
- Naming of the new setup project under the restructure path: `register-fresh-candidate-setup` is suggested; planner picks the final name.

### Deferred Ideas (OUT OF SCOPE)

- **Regression test for post-fix ToU hydration timing** — future hygiene plan could add a `candidate-profile-tou-hydration.spec.ts` regression test. NOT in v2.10 scope.
- **Generic post-`updateUser({password})` redirect race generalization** — if RCA confirms hypothesis 1, the fix MAY generalize to `updateUser` flows elsewhere. Out of Phase 79 scope; capture as a follow-up todo if non-trivial.
- **Splitting `candidate-profile.spec.ts` into separate files** — Phase 76 §Recommendation #3. Not chosen for Phase 79.

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **DETERM-04** | `candidate-profile.spec.ts:85-145` registration → set-password → ToU race resolved. After fix, the spec runs to completion in cold-start without "did not run" cascade through `auth-setup → candidate-app → candidate-app-mutation → re-auth-setup → candidate-app-settings → candidate-app-password`. 3 consecutive cold-start runs show identical pass/fail sets. | §"DETERM-04 RCA Strategy" + §"Frontend Race Fix Surface" + §"Restructure Fallback Shape" enumerate the dual-hypothesis instrumentation plan, the per-hypothesis fix landing site, and the fallback restructure file/config diff. |
| **DETERM-05** | Parity-script constants regenerated from a clean 3-run cold-start baseline; SHA-256-identical pass-sets across 3 runs; expected ~63 PASS_LOCKED. Regenerated baseline becomes v2.10 verification anchor for Phases 80-82. | §"3-Run Cold-Start Gate Protocol" + §"Constants Regen Execution" enumerate the cold-start chain, SHA-256 identity computation, imgproxy 502 recovery, and the step-by-step regen→commit flow. §"Dependency on Phases 80-82" identifies the anchor's downstream consumers. |

</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

The planner must enforce these CLAUDE.md directives during plan authoring:

| Constraint | Source | Phase 79 Impact |
|------------|--------|------------------|
| **LANDMINE-9 yarn `&&`-chain forwarding** | `Seeding local data` + `LANDMINE-9` callout | The 3-run cold-start chain MUST use the explicit manual form `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean`. Do NOT use `yarn db:reset-with-data --likert-only` — yarn appends trailing args to the LAST command (`dev:clean`), not `db:seed` in the middle. |
| **Svelte 5 Context Destructuring Rule** | `Context Destructuring Rule (Svelte 5)` | If RCA confirms Hypothesis 2 (ToU hydration timing), the fix MUST follow the documented `getCandidateContext()` reactive-accessor pattern (`ctx.X` reads, not destructured). Specifically: `candCtx.isAuthenticated` (reactive getter) on `register/password/+page.svelte:45` is already a reactive read — confirm any new reactive reads in the fix follow the same pattern. |
| **`// reason:` and `// svelte-warning: accepted` formats** | `Svelte Warning-Accepted Format` | If RCA reveals a Svelte-compiler-emitted false-positive that can't be cleanly fixed, use `// svelte-warning: accepted — <rationale>`. If an ESLint rule needs acceptance, use `// reason: <rationale>`. Sparingly — preferred outcome is fix at source. |
| **`dev:*` deprecated aliases preserved through v2.10** | `Seeding local data` | The agent's cold-start script MUST use `db:reset` / `db:seed` / `dev:clean` (canonical), NOT `dev:reset` / `dev:seed` (deprecated stderr-warning forwarders). |
| **TypeScript strict — avoid `any`, prefer explicit types** | `Important Implementation Notes` | Any TS code added under the restructure path (setup project) follows strict typing. |
| **Accessibility — WCAG 2.1 AA** | `Important Implementation Notes` | No a11y impact for Phase 79 (no UI changes); planner may skip a11y verification step. |

---

## Summary

Phase 79 has two sequential REQs: DETERM-04 (cascading-race fix) is the unlock condition for DETERM-05 (parity-script constants regen). The race lives in the `should register the fresh candidate via email link` test at `candidate-profile.spec.ts:87-147`, specifically at line 139's `expect(touCheckbox).toBeVisible({ timeout: 10000 })`. Because `test.describe.configure({ mode: 'serial' })` (line 66) puts the entire describe block in serial mode AND because `candidate-app-mutation` → `re-auth-setup` → `candidate-app-settings` → `candidate-app-password` is a hard project-dependency chain in `tests/playwright.config.ts:122-164`, registration's failure cascade-skips ~43 downstream tests with "did not run" status.

The locked path is FRONTEND RACE FIX FIRST (D-01), time-boxed to 1 RCA plan + 1 fix plan (D-02). RCA instruments both hypotheses in parallel (D-04) — Hypothesis 1 is the Supabase auth session propagation window between `register/password/+page.svelte:81 setPassword()` and `await goto(CandAppLogin)` (line 93). Hypothesis 2 is the SvelteKit hydration order on the `(protected)/+layout.svelte:73-105` `$derived` chain that gates `validity.candidate.termsOfUseAccepted && !termsSubmitted → layoutState === 'terms'`. If both plans fail, restructure to `register-fresh-candidate.setup.ts` and break the cascade at the Playwright project boundary.

DETERM-05 runs after DETERM-04 green: copy `regen-constants.mjs` into Phase 79 post-fix/, execute the 3-run cold-start gate (~162 min wall time) agent-inline via `Bash(run_in_background)`, verify SHA-256 identity per Phase 75 precedent, audit IMGPROXY_TIED_TITLES for zero collisions, regenerate the three arrays, update `tests/scripts/diff-playwright-reports.ts`, atomic-commit everything.

**Primary recommendation:** Plan partition is **Plan 01 (RCA, dual-hypothesis instrumentation)** → **Plan 02 (frontend fix per RCA findings + 1-run smoke confirm)** → **Plan 02-fallback (test restructure, only if Plan 02 fails)** → **Plan 03 (DETERM-05 3-run gate + regen + STATUS.md handoff)**. Plan 03 is the long-running unattended-agent plan.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cascading-race fix (Hypothesis 1 path) | Frontend Server (SSR) / Supabase adapter | Frontend Client | The race is in the `setPassword` → `goto(login)` → server-side `safeGetSession` → client hydration handshake. If the session-establishment cookie write hasn't completed before `goto(login)` issues a new request, the `/login` page server-load sees a fresh session and the candidateAuthHandle in `hooks.server.ts:65-77` may not redirect to home; the ToU surface lives behind `(protected)/+layout.svelte`'s `validity.candidate` server-loaded data. |
| Cascading-race fix (Hypothesis 2 path) | Frontend Client (Svelte 5 hydration) | Frontend Server (SSR) | The `(protected)/+layout.svelte:73-105` `$derived.by` chain (`validity`) and the 4-state `layoutState` enum (`'loading' \| 'error' \| 'terms' \| 'ready'`) are pure client-reactive computations over server-loaded `data.candidateUserData`. If hydration starts before `data.candidateUserData.candidate.terms_of_use_accepted` has propagated through `userData.init(snapshot.userData)` (line 139), `layoutState === 'ready'` may flash before flipping to `'terms'`, causing the `terms-checkbox` to render late. |
| Restructure fallback (new setup project) | Test infrastructure (Playwright project dependency graph) | — | The Playwright config tier owns project-dependency-chain composition. Breaking the cascade is a pure infra change — extract registration into a `register-fresh-candidate.setup.ts` project that mirrors `auth.setup.ts:23-57`'s 3-attempt retry-tolerance loop; `candidate-app-mutation` depends on the new setup project; setup failure no longer cascades into in-spec downstream tests. |
| 3-run cold-start gate execution | Test infrastructure (Playwright runner + Supabase) | Infra (Bash agent harness via `run_in_background`) | The gate is a 3× repetition of a deterministic cold-start chain; the agent harness owns the orchestration (Bash `run_in_background` + completion notification per D-11). Per-run state is `db:reset` + `db:seed --likert-only` + `dev:clean` (LANDMINE-9 manual chain per D-13) + `playwright test --workers=1 --reporter=json`. |
| Constants regen | Tooling layer (`tests/scripts/diff-playwright-reports.ts`) | Phase artifact (`post-fix/regen-constants.mjs`) | The parity-script constants are 3 arrays of FQ test IDs; the regen script reads `run-3.json` and partitions tests per the IMGPROXY_TIED_TITLES structural binding (Phase 73 D-09). The constants update lands in tooling; the regen artifact lives in the phase's post-fix/ directory per the self-contained Phase 73 pattern. |
| STATUS.md wake-up dashboard | Phase artifact (`.planning/phases/79-…/STATUS.md`) | Agent harness | Markdown file at phase root, updated at every agent wake-up. Operator's single read-on-return surface. |

---

## DETERM-04 RCA Strategy

### Hypothesis Map

Two candidate root causes were carried forward from the Phase 76 deferred-items todo (verified at `.planning/todos/pending/2026-05-12-candidate-profile-cascading-race.md:31-37`):

**Hypothesis 1 (auth session propagation):** The post-`client.setPassword` redirect to `/login` happens before the auth session is fully propagated. The fresh session that lands at `/login` does not yet have a ToU acknowledgment cookie, so the ToU checkbox surface is skipped (or never renders).

**Hypothesis 2 (ToU hydration timing):** ToU acknowledgment is gated on a context that hasn't yet hydrated (race in SvelteKit hydration of `(protected)/+layout.svelte`'s `$derived` chain over `data.candidateUserData.candidate.termsOfUseAccepted`).

### Code Path Map (the redirect chain in detail)

Verified by reading source at HEAD:

```
candidate-profile.spec.ts:113-115        : page.goto(toCallbackUrl(rawLink))
                                          → /candidate/auth/callback?token_hash=…&type=invite
candidate/auth/callback/+server.ts:20-42 : verifyOtp({token_hash, type:'invite'})
                                          → on success: redirect 303 → /{lang}/candidate/register/password?email=…
                                          → @supabase/ssr's cookies.setAll() (createSupabaseServerClient:14-18)
                                            sets the session cookies on THIS response
candidate-profile.spec.ts:117-123        : fill password + confirm + submit
register/password/+page.svelte:81-93     : setPassword({password})          [HYPOTHESIS 1 WINDOW]
                                            → supabaseDataWriter._setPassword (supabaseDataWriter.ts:83-89)
                                            → this.supabase.auth.updateUser({password})   [browser client]
                                          candCtx.newUserEmail = email
                                          await goto($getRoute('CandAppLogin'))           [client-side nav]
candidate-profile.spec.ts:129            : client.setPassword(...) via SupabaseAdminClient
                                          (admin updateUserById — defensive, NOT the race window)
candidate-profile.spec.ts:131-135        : waitForURL((url) =>
                                            url.pathname.includes('/login') || .includes('/candidate'))
                                          loginIfRedirectedToLoginPage(...)
                                            → if /login: manual login form fill + submit
                                            → /login form POST → login/+page.server.ts:14-58
                                              → signInWithPassword + JWT role check + redirect 303 → /candidate
                                          → server resolves (protected)/+layout.server.ts:20-97
                                            → fetches candidateUserData + questionData
                                            → returns to client
(protected)/+layout.svelte:73-105        : $derived.by validity chain                     [HYPOTHESIS 2 WINDOW]
                                            → if validity.candidate.termsOfUseAccepted is falsy
                                              AND !termsSubmitted
                                              → layoutState === 'terms'
                                              → renders <TermsOfUseForm bind:termsAccepted={termsAcceptedLocal}/>
                                              → renders <input testid="terms-checkbox">
candidate-profile.spec.ts:138-140        : expect(touCheckbox).toBeVisible({timeout: 10000})
                                          ← THIS IS WHERE THE TEST FAILS
```

**The hypothesis-discriminating signal:**

- IF Hypothesis 1: the post-login URL at the failure moment is `/login` (manual-login click happened but did not navigate away — the cookies set by `signInWithPassword` didn't take effect in the same request OR the cookies were not present on the redirected request).
- IF Hypothesis 2: the post-login URL is `/candidate` (login succeeded, server redirect happened, `(protected)/+layout.svelte` rendered) but `layoutState !== 'terms'` at the moment the test polls — i.e. the `$derived.by` chain resolved `termsOfUseAccepted` as truthy OR `validity.state === 'loading'` longer than expected OR `data.candidateUserData.candidate.terms_of_use_accepted` is in some indeterminate state.

### Hypothesis 1 Instrumentation (auth session propagation)

**Goal:** Capture session cookie + JWT state at every transition in the redirect chain. Empirical evidence — when, exactly, does the session cookie become readable to subsequent requests?

**Playwright primitives — preferred (already on):**

1. **Tracing is ALREADY ON** (`tests/playwright.config.ts:80 `trace: 'on'`). Every test run emits a `trace.zip` per test with network panel + console logs + screenshots + DOM snapshots. The RCA plan's failure-run `trace.zip` already captures Hypothesis 1 evidence — no NEW instrumentation needed for the network panel.
2. **`page.context().cookies()`** at three checkpoints: (a) immediately after the password submit click (line 123); (b) immediately after `client.setPassword(...)` admin call returns (line 129); (c) at the start of step 6 (line 131). Compare cookie names + values + expiry. Look for `sb-<project-ref>-auth-token` (Supabase's `@supabase/ssr` cookie name pattern with browser default storage).
3. **`page.evaluate(() => window.localStorage)`** at the same three checkpoints. The browser client (`apps/frontend/src/lib/supabase/browser.ts:11-15`) uses `createBrowserClient` which defaults to LocalStorage for the session; the server client (`apps/frontend/src/lib/supabase/server.ts:10-21`) uses cookies. The race may be that the BROWSER updates LocalStorage before the SERVER cookie write completes.
4. **`page.on('request')` + `page.on('response')` listeners** registered at test start, logging URL + cookies sent + Set-Cookie headers received. Captures the network trace inline (independent of trace.zip) for cross-correlation.

**Server-side primitives (optional, only if Playwright network panel is ambiguous):**

5. **Add temporary `console.log()` hooks** in `hooks.server.ts:supabaseHandle:safeGetSession` and `candidateAuthHandle` to log session state per request. Captured in Vite dev server stderr; redirect Vite stderr to a file during the run. The RCA plan can remove these console.logs at fix-plan time (they're explicitly temporary scaffolding).

**Concrete checkpoint list (for Plan 01 instrumented test):**

```typescript
// Plan 01 instrumented test (registration-rca.spec.ts in post-fix/rca-traces/):
await page.goto(toCallbackUrl(rawLink));
await captureState(page, 'after-callback-goto');
// ... fill set-password form, click submit ...
await captureState(page, 'after-set-password-submit');
await page.waitForURL(/login|candidate/, { timeout: 15000 });
await captureState(page, 'after-redirect-settled');
// ... if on /login, fill + submit ...
await captureState(page, 'after-login-form-submit');
await page.waitForURL((url) => !url.pathname.includes('/login'));
await captureState(page, 'after-login-settled');
// ... at this point Hypothesis 2 kicks in ...
```

**`captureState` helper** writes per-checkpoint to `post-fix/rca-traces/state-<checkpoint>.json`: URL, cookies, localStorage snapshot, sessionStorage snapshot, raw HTML of the body. Total artifact: ~5 checkpoints × ~3 runs = 15 JSON files (small).

### Hypothesis 2 Instrumentation (ToU hydration timing)

**Goal:** Capture the `$derived.by` chain's resolution timing for `validity.candidate.termsOfUseAccepted` vs the polling-budget expiration.

**Playwright primitives:**

1. **`page.waitForFunction(() => window.__phase79RcaHydrated)` with a custom flag.** Temporarily add `window.__phase79RcaHydrated = { ts: Date.now() }` inside the `$effect` block at `(protected)/+layout.svelte:120-141` (the `dr.update(() => provideQuestionData/EntityData/NominationData; userData.init)` boundary). RCA-only — removed at fix time.
2. **`page.evaluate()` to read `validity.candidate.termsOfUseAccepted` indirectly** via DOM observation: poll `page.getByTestId('terms-checkbox').count()` AND `page.getByTestId('candidate-home-status').count()` at 50ms intervals between checkpoints. The pattern that emerges from these polls discriminates the failure mode:
   - **Hypothesis 2A confirmed:** `terms-checkbox` count goes from 0 → 1 within the 10s timeout (so it eventually renders, but late). Fix: increase the timeout, OR make `validity` more synchronous, OR wait for hydration.
   - **Hypothesis 2B confirmed:** `terms-checkbox` count stays 0 the whole time, AND `candidate-home-status` count goes 0 → 1 (so `layoutState === 'ready'` flashed THROUGH `'terms'`). Fix: gate `layoutState` differently, OR ensure `terms_of_use_accepted` is null/false during the hydration window.
   - **Hypothesis 2C:** `terms-checkbox` count stays 0, AND `candidate-home-status` count stays 0 (we're stuck in `'loading'` or `'error'`). Fix: separate concern — server-load failure or data-fetch issue.
3. **DOM snapshot via Playwright `page.locator('main').innerHTML()`** at the failure moment (`{ timeout: 10000 }` expired). Captures the rendered state — was it `<Loading />`? `<ErrorMessage />`? Some half-rendered `<TermsOfUseForm>`? The Loading→Terms→Ready flash pattern documents in v2.6 60-RESEARCH §Pattern 1 (cited in the layout file's comment at line 70-72).

**Server-side primitives:**

4. **Temporary `console.log()` in `(protected)/+layout.server.ts:50-54`** logging `userData.candidate.terms_of_use_accepted`'s actual value as it leaves the server. This eliminates "the data wasn't there" as a hypothesis vs "the data was there but reactivity didn't fire."

**Concrete instrumentation diff (Plan 01):**

```svelte
<!-- (protected)/+layout.svelte — RCA-ONLY instrumentation, removed at fix time -->
$effect(() => {
  if (validity.state !== 'resolved') return;
  // ... existing snapshot + untrack + dr.update + userData.init ...
  // RCA Phase 79: hydration completion marker
  if (typeof window !== 'undefined') {
    (window as any).__phase79RcaHydrated = {
      ts: Date.now(),
      termsAccepted: validity.candidate.termsOfUseAccepted,
      layoutState: layoutState
    };
    console.log('[RCA] Hydration complete:', (window as any).__phase79RcaHydrated);
  }
});
```

**Expected RCA artifact:** `post-fix/rca-traces/` contains: (a) the failing test's `trace.zip`; (b) per-checkpoint `state-<checkpoint>.json` files for H1; (c) `console-logs.txt` for both H1 + H2 server-side hooks; (d) DOM-snapshot HTML at the failure moment; (e) a `RCA-FINDINGS.md` summarizing which hypothesis (or both) the evidence supports.

### What RCA Disproves

Per D-06, if one hypothesis is empirically disproven, document the disproof and focus fix on the confirmed root cause. Concrete disproof tests:

- **H1 disproven if:** at the failure moment, `page.url()` is `/candidate` (NOT `/login`) AND `page.context().cookies()` shows a valid `sb-<…>-auth-token`. Conclusion: login succeeded; the race is post-login.
- **H2 disproven if:** at the failure moment, `page.url()` is `/login` (the URL never advanced) AND no `sb-<…>-auth-token` cookie is set. Conclusion: login failed; the race is upstream of layout hydration.

The likely outcome based on the source-of-truth todo (which describes "URL re-redirects to `/login`... but the subsequent Terms-of-Use checkbox never surfaces") is **a combined H1+H2 mode where login eventually succeeds but the hydration race separately prevents the ToU checkbox from rendering within the 10s budget**. The RCA must distinguish whether one fix resolves both or whether they're truly independent.

---

## Frontend Race Fix Surface

### IF Hypothesis 1 confirms (auth session propagation)

**Most likely fix landing site:** `apps/frontend/src/routes/candidate/register/password/+page.svelte:81-93` — the invite-flow branch of `handleSubmit()`. Current shape:

```typescript
const result = await setPassword({ password }).catch((e) => { ... });
if (result?.type !== 'success') { status = 'error'; return; }
candCtx.newUserEmail = email;
status = 'success';
await goto($getRoute('CandAppLogin'));
```

**Probable fix shapes (planner picks one based on RCA evidence):**

1. **Explicit session sync wait.** After `setPassword({password})` resolves, call `await candCtx.dataWriter.getCandidateUserData(...)` or `await this.supabase.auth.getSession()` to force a session refresh before `goto`. The `updateUser({password})` call may not re-fetch the session cookies; an explicit `getSession()` round-trip after `updateUser` ensures the browser client has the latest cookies. (Source: `@supabase/supabase-js` docs — `updateUser` does not refresh the auth state on the client side automatically.)
2. **Server-side redirect instead of client-side.** Convert the password-set submit to a SvelteKit form action (`+page.server.ts`) so the server signs in + sets cookies + redirects in a single response. Pattern precedent: `apps/frontend/src/routes/candidate/login/+page.server.ts` already uses this pattern at lines 23-57. Move `setPassword` flow to mirror it.
3. **`invalidateAll()` before goto.** Call `await invalidate('app:supabase')` or `await invalidateAll()` between `setPassword` resolution and `goto(CandAppLogin)` — forces SvelteKit to re-run the server load chain (including `hooks.server.ts`'s `safeGetSession`).

**Secondary fix sites if H1 isolates to a deeper layer:**

- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:83-89` (`_setPassword`) — could explicitly call `await this.supabase.auth.getSession()` after `updateUser` to refresh cookies.
- `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts:55-58` (`setPassword` wrapper) — could chain a `await getSession()` inside the wrapper for all consumers.

### IF Hypothesis 2 confirms (ToU hydration timing)

**Most likely fix landing site:** `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:99-105` — the `layoutState` `$derived` chain. Current shape:

```typescript
const layoutState = $derived<'loading' | 'error' | 'terms' | 'ready'>(
  validity.state === 'error'
    ? 'error'
    : !validity.candidate.termsOfUseAccepted && !termsSubmitted
      ? 'terms'
      : 'ready'
);
```

**Probable fix shapes (planner picks based on RCA evidence):**

1. **Add explicit `'loading'` gate for the unresolved state.** Current code never returns `'loading'`; it falls through to `'terms'` or `'ready'` based on `validity.candidate.termsOfUseAccepted`. If `validity.candidate` is briefly undefined during hydration (Hypothesis 2B), the chain mis-renders. Add: `validity.state !== 'resolved' ? 'loading' : ...`. (Source: lines 73-94 already establish `validity.state === 'error' | 'resolved'`; there's no `'loading'` state because the loader awaits — but the `$derived.by` evaluates synchronously at the first paint before `data.candidateUserData` may have hydrated through to the client.)
2. **Decouple `termsSubmitted` from the `$derived` chain.** The state flow `validity.candidate.termsOfUseAccepted=null → termsAcceptedLocal=true → handleSubmit → userData.setTermsOfUseAccepted → userData.save → termsSubmitted=true` requires `validity` to re-evaluate after `userData.save()`. If `userData.savedCandidateData.termsOfUseAccepted` does not flow back into `data.candidateUserData.candidate` reactively (which is plausible — `data` is a SvelteKit page-data prop, NOT a reactive store), the `$derived` only updates because of the local `termsSubmitted` flag. The race may be that `userData.init(snapshot.userData)` (line 139, inside `untrack`) is fully synchronous BUT downstream consumers of `validity` evaluate before the assignment lands. Fix: ensure `userData.init` writes complete before any consumer of `validity` re-evaluates.
3. **Async `userData.init` flush.** If `userData.init` triggers any internal `$state` writes that need a microtask to settle, await a tick + re-derive. (Plan-time decision based on RCA.)

**Secondary fix sites if H2 isolates deeper:**

- `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts:155-159` (`setTermsOfUseAccepted` + `resetTermsOfUseAccepted`) — could surface a more granular hydration signal.
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:355-365` (savedCandidateData reads) — could expose an explicit `isHydrated` accessor.

### IF Both Hypotheses Confirm (combined H1+H2 mode)

Likely outcome per the source todo's narrative. The fix is sequential: (a) resolve H1 first so the URL settles deterministically at `/candidate` (not `/login`), then (b) resolve H2 so the hydration race doesn't separately suppress ToU rendering. The fix-plan smoke per D-12 (1-run cold-start confirm) measures the cascade-skip count; if it drops to zero after only H1's fix, H2 may have been a downstream symptom of H1 and is auto-resolved.

---

## Restructure Fallback Shape

### File Layout

**New file:** `tests/tests/setup/register-fresh-candidate.setup.ts`

Mirrors `tests/tests/setup/auth.setup.ts:1-98` structure. Pattern:

```typescript
import { expect, test as setup } from '@playwright/test';
import { extractLinkFromHtml, getLatestEmailHtml, toCallbackUrl,
         countEmailsForRecipient } from '../utils/emailHelper';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import { E2E_ADDENDUM_CANDIDATES } from '../utils/e2eFixtureRefs';
import { testIds } from '../utils/testIds';
import type { Page } from '@playwright/test';

// Retry-tolerant ToU-checkbox-render wait — mirrors auth.setup.ts:23-57's
// waitForLoginForm 3-attempt loop, adapted for the post-registration
// landing state.
async function waitForTouCheckbox(page: Page, candidateEmail: string,
                                   candidatePassword: string,
                                   maxAttempts = 3): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const touCheckbox = page.getByTestId(testIds.candidate.terms.checkbox);
      await touCheckbox.waitFor({ state: 'visible', timeout: 10000 });
      return;  // checkbox rendered
    } catch {
      if (attempt < maxAttempts - 1) {
        // Re-attempt: navigate to /candidate, log in if redirected, retry
        await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));
        if (page.url().includes('login')) {
          await page.getByTestId(testIds.candidate.login.email).fill(candidateEmail);
          await page.getByTestId(testIds.candidate.login.password).fill(candidatePassword);
          await page.getByTestId(testIds.candidate.login.submit).click();
          await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
        }
      } else {
        throw new Error(`ToU checkbox did not appear after ${attempt + 1} attempts.`);
      }
    }
  }
}

setup('register fresh candidate via email link', async ({ page }) => {
  setup.setTimeout(90000);

  const client = new SupabaseAdminClient();
  const candidateEmail = E2E_ADDENDUM_CANDIDATES[1].email!;
  const candidateExternalId = E2E_ADDENDUM_CANDIDATES[1].external_id;
  const candidatePassword = 'ProfileTestPass1!';

  // Step 1: count + send registration email + poll Inbucket
  // (verbatim from candidate-profile.spec.ts:89-107)
  // Step 2: extract link + navigate to callback URL (lines 109-113)
  // Step 3: set password + admin setPassword belt-and-suspenders (115-129)
  // Step 4: race-tolerant URL settle + manual login if redirected (131-135)
  // Step 5: retry-tolerant ToU checkbox wait + accept + continue (137-143)
  //   → use waitForTouCheckbox(page, ...) instead of inline single-shot waitFor
  // Step 6: verify candidate home reached (line 146)

  // No storageState write — downstream tests use loginAsCandidate() (already
  // present in candidate-profile.spec.ts:78-85) since serial mode does NOT
  // share contexts. Optional: write a storageState file for the freshly-
  // registered candidate if downstream tests want to skip the login step.
});
```

### `tests/playwright.config.ts` Diff

**Current chain (lines 99-164):**

```
data-setup → auth-setup → candidate-app → candidate-app-mutation
                              → re-auth-setup → candidate-app-settings → candidate-app-password
```

**Post-restructure chain:**

```
data-setup → auth-setup → candidate-app → register-fresh-candidate-setup → candidate-app-mutation
                                              → re-auth-setup → candidate-app-settings → candidate-app-password
```

**Diff:**

```typescript
// Insert NEW project between 'candidate-app' (lines 108-118) and
// 'candidate-app-mutation' (lines 121-130):
{
  name: 'register-fresh-candidate-setup',
  testMatch: /register-fresh-candidate\.setup\.ts/,
  dependencies: ['candidate-app']
  // No 'use.storageState' — registration starts unauthenticated per
  // candidate-profile.spec.ts:30 test.use({ storageState: { cookies: [], origins: [] }})
},

// AMEND 'candidate-app-mutation' (line 129):
//   dependencies: ['candidate-app']  →  dependencies: ['register-fresh-candidate-setup']
```

### `candidate-profile.spec.ts` Diff

**Lines 87-147 (the registration test):** DELETE entirely. Setup project owns it.

**Lines 48-63 (`loginIfRedirectedToLoginPage` helper):** MOVE to `register-fresh-candidate.setup.ts` (file-local helper there). DELETE from spec file.

**Lines 65-66 (`test.describe('candidate profile (fresh candidate)', ...) { test.describe.configure({ mode: 'serial' })`):**
- Decision point per CONTEXT integration notes (line 155): the restructure path either keeps `serial` mode (downstream tests no longer cascade on registration since it's in a setup) OR removes it (all downstream tests are independent and use `loginAsCandidate(page)`).
- **Recommendation:** REMOVE `serial` mode. Each remaining test in the describe block already calls `await loginAsCandidate(page)` at its top (lines 152, 171, 185, 208, 245, 271). They are FULLY INDEPENDENT after restructure — registration ran in the setup project, so each test gets a fresh browser context and logs in fresh. Removing `serial` mode allows Playwright to parallelize the 7 remaining tests in the describe block (potentially halving wall-time for `candidate-app-mutation`).

**Lines 78-85 (`loginAsCandidate` helper):** KEEP unchanged.

### Downstream Test Adjustments

After restructure, the remaining tests in `candidate-profile.spec.ts` (lines 149-294) work AS-IS — they already start with `loginAsCandidate(page)`. No spec-body changes needed.

### Restructure Verification

The fix-plan's 1-run cold-start smoke (D-12) verifies:
- `register-fresh-candidate-setup` project runs (single test, registration flow).
- If it FAILS, Playwright marks the project failed; `candidate-app-mutation` cascade-skips, BUT only the 7 in-spec tests in `candidate-profile.spec.ts` cascade. Critically: the cascade STOPS at the project boundary; `re-auth-setup` and downstream (`candidate-app-settings`, `candidate-app-password`) do NOT cascade because the in-spec serial dependency was the propagator, not the project chain.
- Wait — this is wrong on closer reading. The Playwright project chain `register-fresh-candidate-setup → candidate-app-mutation → re-auth-setup → candidate-app-settings → candidate-app-password` IS still chained. Setup failure WOULD still cascade-skip everything downstream of `register-fresh-candidate-setup`. **The cascade benefit comes from retry-tolerance** in the new setup file (3-attempt loop per D-03), which converts intermittent failures into transient retries instead of project-failure cascades.

**Critical correction:** the restructure value-add is NOT cascade-elimination at the project level; it's:
1. **Retry-tolerance** at the setup-project layer (3-attempt `waitForTouCheckbox` loop) absorbs transient flakes.
2. **Isolation** of the registration assertion in a setup means the 6 downstream tests inside `candidate-profile.spec.ts` no longer cascade on serial-mode in-spec failure (they cascade only on setup-project failure, AFTER retries are exhausted).

If retries don't help (the race is deterministic, not flaky), restructure alone won't break the cascade — only the underlying race-fix will. This is why D-01 prioritizes the frontend fix.

---

## 3-Run Cold-Start Gate Protocol

### Pre-flight (agent on entry)

Per D-15 the operator killed Vite before leaving; Supabase is up. Agent verifies on entry:

```bash
# 1. Verify Supabase is healthy (per D-15)
yarn db:status  # canonical alias for yarn supabase:status; reports API/DB/Storage ports

# 2. Confirm Vite port 5173 is free (operator's pre-departure step per D-15)
lsof -ti:5173 || echo "port 5173 free"

# 3. Verify repo HEAD is at the post-DETERM-04-fix commit (Plan 02 or fallback)
git log -1 --oneline
git status --short  # expect clean tree

# 4. Confirm Phase 79 directory exists
ls .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/ \
   || mkdir -p .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/
```

If Vite is NOT free OR Supabase is NOT healthy, write a STATUS.md escalation flag and STOP — do not proceed.

### Per-Run Cold-Start Chain (canonical D-13 form)

For each run N ∈ {1, 2, 3}:

```bash
# Step 1: Cold-start chain — LANDMINE-9 manual form (per CLAUDE.md + D-13).
#   DO NOT use `yarn db:reset-with-data --likert-only` — yarn appends the flag
#   to `dev:clean`, not `db:seed` in the middle of the &&-chain.
yarn db:reset && \
yarn db:seed --template e2e --likert-only && \
yarn dev:clean

# Step 2: Spin up Vite dev server in background (port 5173)
# Use yarn workspace @openvaa/frontend dev — Supabase is already up; we only need Vite.
yarn workspace @openvaa/frontend dev &
VITE_PID=$!

# Step 3: Poll for ready (timeout 60s)
for i in $(seq 1 60); do
  if curl -fsS -o /dev/null http://localhost:5173/ 2>/dev/null; then
    echo "Vite ready after ${i}s"
    break
  fi
  sleep 1
done

# Step 4: Capture full-suite run-N (workers=1 per Phase 75 + Phase 73 protocol)
yarn test:e2e --workers=1 --reporter=json \
  > .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-${N}.json \
  2> .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-${N}.stderr.log
# NOTE: test:e2e is a ROOT script (package.json:28), NOT a workspace-scoped script.
#       Use `yarn test:e2e ...`, NOT `yarn workspace @openvaa/tests test:e2e ...`
#       (there is no @openvaa/tests workspace — verified by listing root + apps/ +
#        packages/ package.json files at HEAD).

# Step 5: Kill Vite, leave Supabase up
kill $VITE_PID 2>/dev/null
wait $VITE_PID 2>/dev/null

# Step 6: Verify run-N.json is well-formed (not empty, not truncated)
node -e "JSON.parse(require('fs').readFileSync('.../run-${N}.json'))" \
  || echo "run-${N}.json malformed — investigate before proceeding"

# Step 7: Detect imgproxy 502 (per D-14)
grep -l "imgproxy\|502" .planning/phases/79-.../post-fix/run-${N}.stderr.log \
  && echo "IMGPROXY 502 detected — triggering D-14 recovery"
```

### Agent Orchestration via `Bash(run_in_background)`

Per D-11 the gate runs agent-inline. Pattern:

```python
# Pseudo-code for the agent's execution loop:
for run_n in [1, 2, 3]:
    # Submit the per-run chain as a background bash job
    bash_call = invoke_bash(
        command=COLD_START_CHAIN_SCRIPT.format(N=run_n),
        run_in_background=True,
        timeout=4500000  # 75 min ceiling per run, leaves 30 min margin over 54-min expected
    )
    # Block until completion notification arrives (agent receives stdout-line events)
    # OR poll once-per-Nmin via Monitor tool until process exits
    wait_for_completion(bash_call)

    # Post-run validation
    run_status = validate_run_json(f"post-fix/run-{run_n}.json")
    if run_status == "imgproxy_502":
        if retry_count < 2:
            execute_d14_recovery()
            retry_run(run_n)  # overwrite run-N.json
        else:
            write_status_md_escalation("3+ imgproxy 502 retries on run-{run_n}")
            return

    update_status_md(f"run-{run_n} of 3 complete, started @ {start}, finished @ {end}")
```

The agent CANNOT use `sleep` polling loops (sleep-loop blocked per system reminder — see tool guidance). Instead, use `run_in_background=True` + completion notification. Per-run wall time is ~54 min; total ~162 min.

### SHA-256 Identity Computation

Per D-08 + Phase 75 precedent (`75-VALIDATION.md:94` + `75-VERIFICATION.md:92-98`):

```bash
# For each run N: extract sorted (test-id|status) lines, hash via shasum -a 256.
# The extraction mirrors `regen-constants.mjs:flattenReport`'s ID format:
#   `<projectName> :: <specFile> > <specTitle>`
# Phase 75 used 110-line sorted files at hash 7084db872e3eca6cf14536981fb94c0fd82e48fb1419c783af7840531f2d85cc.

extract_sorted_status() {
  local RUN_JSON=$1
  local OUT_TXT=$2
  # Use node to walk the JSON (mirror flattenReport in diff-playwright-reports.ts:260-290)
  node --input-type=module -e "
    import { readFileSync, writeFileSync } from 'node:fs';
    const raw = readFileSync(process.argv[1], 'utf8');
    const stripBanner = (s) => { const i = s.indexOf('\n{'); return i === -1 ? s : s.slice(i+1); };
    const rep = JSON.parse(stripBanner(raw));
    const out = [];
    const walk = (suites) => {
      if (!suites) return;
      for (const suite of suites) {
        const suiteFile = suite.file ?? suite.title ?? '';
        for (const spec of suite.specs ?? []) {
          const specFile = spec.file ?? suiteFile;
          const specTitle = spec.title ?? '';
          for (const t of spec.tests ?? []) {
            const projectName = t.projectName ?? '';
            const firstResult = t.results?.[0] ?? {};
            const raw = firstResult.status ?? t.status ?? 'unknown';
            out.push(\`\${projectName} :: \${specFile} > \${specTitle}|\${raw}\`);
          }
        }
        walk(suite.suites);
      }
    };
    walk(rep.suites);
    out.sort();
    writeFileSync(process.argv[2], out.join('\n') + '\n', 'utf8');
  " "$RUN_JSON" "$OUT_TXT"
}

extract_sorted_status post-fix/run-1.json post-fix/run-1-sorted-status.txt
extract_sorted_status post-fix/run-2.json post-fix/run-2-sorted-status.txt
extract_sorted_status post-fix/run-3.json post-fix/run-3-sorted-status.txt

HASH1=$(shasum -a 256 post-fix/run-1-sorted-status.txt | awk '{print $1}')
HASH2=$(shasum -a 256 post-fix/run-2-sorted-status.txt | awk '{print $1}')
HASH3=$(shasum -a 256 post-fix/run-3-sorted-status.txt | awk '{print $1}')

cat > post-fix/sha256.txt <<EOF
Run 1: $HASH1
Run 2: $HASH2
Run 3: $HASH3

Identity: $([ "$HASH1" = "$HASH2" ] && [ "$HASH2" = "$HASH3" ] && echo "PASS — 3-run SHA-256 identical" || echo "FAIL — hashes differ; trigger D-09 protocol")
EOF
```

### imgproxy 502 Detection + Recovery (D-14)

**Detection signals:**

1. **stderr scan:** `grep -E "imgproxy|502" run-${N}.stderr.log`. Phase 73 RESEARCH §Pitfall 5 documents this as "intermittent infrastructure flake."
2. **In-JSON error scan:** Tests in the IMGPROXY_TIED_TITLES list (14 patterns at `regen-constants.mjs:64-78`) show failure with messages containing "502", "Bad Gateway", or imgproxy-specific errors.
3. **Supabase logs:** `yarn workspace @openvaa/supabase status` or `supabase logs imgproxy` — verify the imgproxy container is healthy.

**Recovery protocol (D-14):**

```bash
echo "[$(date -u +%FT%TZ)] IMGPROXY 502 detected on run-${N}, attempt ${retry_count}/2" >> post-fix/imgproxy-retry.log
yarn supabase:stop
yarn supabase:start
# (Supabase takes ~20s to fully boot; poll until db:status returns OK)
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean
yarn workspace @openvaa/frontend dev &
VITE_PID=$!
# Poll Vite ready as before
# Re-capture into the SAME run-N.json (overwrite per D-14)
yarn test:e2e --workers=1 --reporter=json > post-fix/run-${N}.json 2> post-fix/run-${N}.stderr.log
kill $VITE_PID
```

**Cap (D-14):** 2 retries per run. On 3rd attempt: write `STATUS.md` escalation flag with timestamps + log path; do NOT proceed; stop the gate.

---

## Constants Regen Execution

### Step 1: Copy the regen script (D-07)

```bash
cp .planning/milestones/v2.9-phases/73-determinism-baseline/post-fix/regen-constants.mjs \
   .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs
```

**Edit at line 20 only:** the `reportPath` constant. Verbatim source has:
```javascript
const reportPath = join(__dirname, 'run-3-report.json');
```

Phase 79 uses `run-3.json` (per D-13's filename pattern); update line 20:
```javascript
const reportPath = join(__dirname, 'run-3.json');
```

No other edits. The `IMGPROXY_TIED_TITLES` list (lines 64-78) and the partition logic (lines 99-106) are preserved verbatim per D-07.

### Step 2: IMGPROXY_TIED_TITLES Pre-audit

Before running the regen script, verify zero collisions between the 14 IMGPROXY-bound `endsWith()` patterns and any new test titles introduced by Phase 79:

```bash
# Extract all test titles from run-3.json
node --input-type=module -e "
  // ... walk run-3.json, collect spec.title for every test entry ...
" post-fix/run-3.json > post-fix/all-titles.txt

# For each IMGPROXY_TIED_TITLES entry (14 patterns), check no NEW test title endsWith it
node post-fix/regen-constants.mjs 2>&1 | tee post-fix/regen-output.txt
# The script's lines 89-95 emit the match-count assertion. If any pattern
# matches 0 NEW titles, the regen FAILS LOUDLY with exit code 1.
```

**Collision-risk titles to manually audit if the restructure path was taken:**

The restructure adds ONE new test title in the new setup project: `register fresh candidate via email link` (or similar wording per planner's choice of name). Verify it does NOT end with any of these 14 patterns (case-sensitive `endsWith('> ' + pattern)`):

- `should upload a profile image (CAND-03)`
- `should show editable info fields on profile page (CAND-03)`
- `should persist profile image after page reload (CAND-12)`
- `should show read-only warning when answers are locked`
- `should show maintenance page when candidateApp is disabled`
- `should show maintenance page when underMaintenance is true`
- `should display notification popup when enabled`
- `should render help page correctly`
- `should render privacy page correctly`
- `should hide hero when hideHero is enabled`
- `should show hero when hideHero is disabled`
- `should change password and login with new password`
- `should logout and return to login page`
- `re-authenticate as candidate`

A naming like `register fresh candidate via email link` has zero collision risk; planner just confirms via the regen script's match-count assertion. Save the assertion output to `post-fix/imgproxy-audit.txt` per D-10's commit shape.

### Step 3: Run the regen

```bash
cd .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/
node post-fix/regen-constants.mjs > post-fix/regen-output.txt 2>&1

# Inspect stdout: it prints 3 arrays — PASS_LOCKED_TESTS, DATA_RACE_TESTS, CASCADE_TESTS.
# Verify expected count: ~63 PASS_LOCKED (per Phase 79 SC #3); DATA_RACE preserved at 15
# (D-09 structural binding); CASCADE shrinks by ~16 (the cascade-unblocked tests).
```

### Step 4: Update `tests/scripts/diff-playwright-reports.ts`

Paste the 3 emitted arrays into the corresponding `const` declarations:

- **Lines 94-143 (PASS_LOCKED_TESTS, currently 47 entries):** replace with the Phase 79 regen output (expected ~63 entries).
- **Lines 145-162 (DATA_RACE_TESTS, currently 15 entries):** preserve UNCHANGED (D-09 binding intact; the regen script outputs the same 15 IDs because IMGPROXY_TIED_TITLES is verbatim-preserved).
- **Lines 164-199 (CASCADE_TESTS, currently 33 entries):** replace with the Phase 79 regen output (expected ~17 entries, ~16 fewer than Phase 75 baseline).

**Update the regen header comment block at lines 42-92:** prepend a new Phase 79 section narrating the delta. Pattern follows Phase 75's existing block:

```
// -----------------------------------------------------------------------------
// PHASE 79 REGEN (2026-05-XX, Phase 79 Plan 03 — DETERM-05 triggered after
// DETERM-04 resolved the candidate-profile cascading race).
// Source: .planning/phases/79-determinism-recovery-.../post-fix/run-3.json
// Regen script: .planning/phases/79-determinism-recovery-.../post-fix/regen-constants.mjs
//
// PRIOR REGEN (Phase 75, 2026-05-11) replaced by this regen:
// 47 PASS_LOCKED + 15 DATA_RACE + 33 CASCADE = 95 tests.
// Phase 79 baseline: ~63 PASS_LOCKED + 15 DATA_RACE + ~17 CASCADE = ~95 tests.
//   PASS_LOCKED: grew +~16 (47 → ~63). The candidate-profile cascade resolution
//                unblocked downstream candidate-app-mutation + candidate-app-settings
//                + candidate-app-password tests that Phase 75 baseline marked
//                CASCADE due to the registration race.
//   DATA_RACE:   unchanged at 15 — D-09 binding preserved.
//   CASCADE:     shrank −~16 — same delta inverse to PASS_LOCKED.
//
// Phase 79 SC #2 (3-run determinism preserved): 3 cold-start --workers=1 runs
// produced SHA-256-identical sorted (title|status) sets at hash <new-hash>
// across all 3 runs. PARITY GATE: PASS × 3 (pair comparisons 1v2, 2v3, 1v3).
// -----------------------------------------------------------------------------
```

### Step 5: Self-identity smoke test (regen sanity check)

```bash
# Verify the regenerated constants are self-consistent: a parity-gate comparing
# run-3 to itself MUST emit PARITY GATE: PASS.
tsx tests/scripts/diff-playwright-reports.ts \
  post-fix/run-3.json post-fix/run-3.json \
  > post-fix/self-identity-smoke.txt 2>&1

grep "PARITY GATE: PASS" post-fix/self-identity-smoke.txt \
  || echo "SELF-IDENTITY SMOKE FAILED — regen mis-categorized tests; do NOT commit"
```

### Step 6: 3-pair parity gate (matches Phase 75 close pattern)

```bash
# Pair comparisons: 1v2, 2v3, 1v3. All must emit PARITY GATE: PASS.
tsx tests/scripts/diff-playwright-reports.ts post-fix/run-1.json post-fix/run-2.json \
  > post-fix/parity-gate-output.txt 2>&1
echo "=== Pair 2: run-2 vs run-3 ===" >> post-fix/parity-gate-output.txt
tsx tests/scripts/diff-playwright-reports.ts post-fix/run-2.json post-fix/run-3.json \
  >> post-fix/parity-gate-output.txt 2>&1
echo "=== Pair 3: run-1 vs run-3 ===" >> post-fix/parity-gate-output.txt
tsx tests/scripts/diff-playwright-reports.ts post-fix/run-1.json post-fix/run-3.json \
  >> post-fix/parity-gate-output.txt 2>&1
```

### Step 7: Atomic commit (D-10)

```bash
git add \
  .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-{1,2,3}.json \
  .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-{1,2,3}-sorted-status.txt \
  .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/sha256.txt \
  .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs \
  .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-output.txt \
  .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/imgproxy-audit.txt \
  .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/parity-gate-output.txt \
  .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/self-identity-smoke.txt \
  tests/scripts/diff-playwright-reports.ts

git -c core.hooksPath=/dev/null commit -m "$(cat <<'EOF'
feat(79): regenerate parity-script constants from 3-run cold-start baseline

DETERM-05 close: 3 cold-start --workers=1 runs produced SHA-256-identical
sorted (title|status) sets at hash <NEW_HASH>. Regen via post-fix/regen-constants.mjs
(verbatim copy of Phase 73's script with reportPath adjusted to run-3.json
per CONTEXT D-07). IMGPROXY_TIED_TITLES preserved verbatim per Phase 73 D-09
structural binding.

Delta vs Phase 75 baseline:
  PASS_LOCKED: 47 → ~63 (+~16; candidate-profile cascade resolved per DETERM-04)
  DATA_RACE:   15 → 15 (unchanged; D-09 binding intact)
  CASCADE:     33 → ~17 (−~16; inverse of PASS_LOCKED growth)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**Note on git hooks:** Per project_gsd_repo_hook_workaround memory entry, commits in this repo MUST use `git -c core.hooksPath=/dev/null` until the global hook config is fixed.

---

## STATUS.md Schema

Path: `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/STATUS.md`

Updated at every agent wake-up (per D-16). Operator's single-file return surface.

```markdown
# Phase 79 STATUS

**Last updated:** <ISO-8601 UTC timestamp>
**Last agent action:** <one-line summary of what just happened>
**Operator action needed?** <YES | NO>
**Phase verdict so far:** <IN-PROGRESS | DETERM-04-GREEN-DETERM-05-PENDING | GREEN | BLOCKED>

---

## DETERM-04 Status

- [ ] Plan 01 (RCA, dual-hypothesis instrumentation) — <PENDING | IN-PROGRESS | DONE @ <commit-sha>>
- [ ] Plan 02 (frontend fix per RCA findings) — <PENDING | IN-PROGRESS | DONE @ <commit-sha>>
- [ ] Plan 02-fallback (restructure to register-fresh-candidate.setup.ts) — <NOT-TRIGGERED | TRIGGERED | DONE @ <commit-sha>>
- [ ] 1-run cold-start smoke confirm (D-12) — <PENDING | PASS | FAIL>

**Hypothesis verdict:**
- H1 (auth session propagation): <UNDETERMINED | CONFIRMED | DISPROVEN>
- H2 (ToU hydration timing): <UNDETERMINED | CONFIRMED | DISPROVEN>

**RCA artifacts:** `post-fix/rca-traces/` (<N> trace.zip + state-checkpoint JSONs + RCA-FINDINGS.md)

---

## DETERM-05 Status

- [ ] Plan 03 Task 1 (copy regen-constants.mjs + STATUS.md init) — <PENDING | DONE @ <commit-sha>>
- [ ] Plan 03 Task 2 (run-1 cold-start) — <PENDING | IN-PROGRESS started @ <ts> | DONE @ <ts> | FAILED>
- [ ] Plan 03 Task 3 (run-2 cold-start) — <PENDING | IN-PROGRESS | DONE | FAILED>
- [ ] Plan 03 Task 4 (run-3 cold-start) — <PENDING | IN-PROGRESS | DONE | FAILED>
- [ ] Plan 03 Task 5 (SHA-256 identity check) — <PENDING | PASS @ <hash> | FAIL>
- [ ] Plan 03 Task 6 (regen + IMGPROXY audit + atomic commit) — <PENDING | DONE @ <commit-sha>>

**Current run state (if mid-gate):** <e.g., "run-2 of 3 in progress, started 2026-05-13T22:35:00Z, expected completion 2026-05-13T23:29:00Z">

---

## Escalation Flags

(Empty if no escalations needed; otherwise per-item entry)

- [ ] **imgproxy 502 retries:** <count> on run-<N> (cap is 2 per D-14)
- [ ] **SHA-256 mismatch:** <Y/N>; if Y, D-09 protocol triggered (3 more runs)
- [ ] **RCA pivot-to-restructure trigger:** <Y/N>; if Y, Plan 02-fallback initiated
- [ ] **Operator-checkpoint-needed event:** <NONE | <description>>
- [ ] **Unexpected failure:** <description + log path>

---

## What to do on return

(Operator-facing — written in instruction-form)

<e.g., "Run `git log --oneline -5` to see recent commits; STATUS.md is current as of <ts>; no operator action needed unless the 'Escalation Flags' section above has any entries with [x]. Proceed to verify-work step.">

---

## Run Log (append-only)

(Chronological; one line per agent wake-up; bounded growth — older entries trimmed by hand if needed)

- 2026-05-XX HH:MM:SSZ — <action summary>
- 2026-05-XX HH:MM:SSZ — <action summary>
```

**Schema rationale:**
- Section ordering matches operator-priority: "Action needed?" → DETERM-04 → DETERM-05 → escalation flags → return instructions → log.
- Each plan task is a checkbox so operator can scan binary done/not-done at a glance.
- Per-run timestamps (`started @ <ts>`, expected completion) let the operator compute remaining wall-time without re-reading the protocol.
- Escalation flags section is empty in the green path; non-empty means the operator MUST intervene. The operator's return-skim is: open STATUS.md → if §Escalation Flags is empty AND §Phase verdict is GREEN, proceed; otherwise read §"What to do on return".

---

## Dependency on Phases 80-82

Per ROADMAP `.planning/ROADMAP.md:110-156`:

- **Phase 80 (A11Y-04 axe cite-and-fix)** "Depends on Phase 79 (DETERM-04 green required for clean assertion runs — A11Y verification gates benefit from a non-cascading suite). Structurally independent of DETERM-05 constants regen."
- **Phase 81 (A11Y-05/06 email + URL cells)** "Depends on Phase 79 (DETERM-04 green required — A11Y-01 cells extend `candidate-profile-validation.spec.ts` which the cascade blocked)."
- **Phase 82 (A11Y-07 required-empty cell)** "Depends on Phase 79 (DETERM-04 green required — same `candidate-profile-validation.spec.ts` surface as Phase 81)."

**Concrete dependency artifacts Phases 80-82 read:**

1. **`tests/scripts/diff-playwright-reports.ts:94-199`** — the regenerated PASS_LOCKED / DATA_RACE / CASCADE arrays. Phases 80-82's verification gates run `tsx diff-playwright-reports.ts <baseline> <post>` against the Phase 79 baseline (one of the 3 `run-N.json` captures, by convention `run-3.json` per Phase 75 precedent). Any test that Phase 79 locked PASSING must continue to pass; any cascade-baseline entry that moves to fail-outside-DATA_RACE-pool is a regression.
2. **`tests/playwright.config.ts`** — if Phase 79 restructure path was taken, the new `register-fresh-candidate-setup` project entry persists and Phases 80-82 inherit it. Phase 81 (which extends `candidate-profile-validation.spec.ts`) inherits the `candidate-app-mutation` dependency chain — the cascade-unblock is structurally what enables Phase 81's tests to run cleanly.
3. **`.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-3.json`** — the v2.10 verification anchor. Phases 80-82 may treat this file as the baseline for their parity-gate comparisons. (Phase 81/82 verification plans can copy this approach from Phase 75's `post-fix/run-3.json` precedent.)

**Implementation guidance for Plan 03:** ensure `run-3.json` is committed AS-IS (not stripped, not minified) at the atomic commit step. Downstream phases will reference it directly via the path. The `tests/scripts/diff-playwright-reports.ts` regen-header comment block should explicitly call out "Phase 79 baseline is the v2.10 verification anchor; Phases 80, 81, 82 read this file."

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright (catalog-managed version; verified `@playwright/test` in `package.json:57`) + vitest catalog-managed |
| Config file (E2E) | `tests/playwright.config.ts` |
| Config file (unit) | `vitest.workspace.ts` at repo root (verified via `yarn test:unit` → `turbo run test:unit`) |
| Quick run command (E2E single project) | `yarn test:e2e --project=candidate-app-mutation --workers=1 --reporter=line` (~6-10 min for cascade subtree) |
| Quick run command (E2E single test) | `yarn test:e2e --project=candidate-app-mutation --workers=1 -g "should register the fresh candidate via email link" --reporter=line` |
| Full suite command | `yarn test:e2e --workers=1 --reporter=json > post-fix/run-N.json` (~54 min per D-13) |
| Unit-test command (regen script) | `node .planning/phases/79-.../post-fix/regen-constants.mjs` (~5s; reads run-3.json, emits 3 arrays) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DETERM-04 | `candidate-profile.spec.ts:87-147` runs to completion in cold-start | E2E (Playwright) | `yarn test:e2e --project=candidate-app-mutation --workers=1 -g "should register the fresh candidate" --reporter=line` | ✓ existing spec at `tests/tests/specs/candidate/candidate-profile.spec.ts` |
| DETERM-04 | Downstream tests in serial describe block run after registration | E2E (Playwright) | `yarn test:e2e --project=candidate-app-mutation --workers=1 --reporter=line` (full project, 7 tests) | ✓ existing spec |
| DETERM-04 | Cascade chain (`auth-setup → … → candidate-app-password`) completes | E2E (Playwright) | `yarn test:e2e --project=candidate-app-password --workers=1 --reporter=line` (Playwright auto-resolves dependencies) | ✓ existing chain in `tests/playwright.config.ts:99-164` |
| DETERM-04 | 3 consecutive cold-start runs show identical pass/fail sets | E2E gate (manual harness via agent-inline Bash) | per §"3-Run Cold-Start Gate Protocol" above | ✓ harness defined in this RESEARCH; per-run script lives in Plan 03 |
| DETERM-05 | SHA-256 identical sorted (title \| status) across 3 runs | Bash + shasum | per §"SHA-256 Identity Computation" above | — (computed inline; output to `post-fix/sha256.txt`) |
| DETERM-05 | IMGPROXY_TIED_TITLES audit clean (zero collisions with new titles) | regen-constants.mjs internal assertion (lines 84-96) | `node post-fix/regen-constants.mjs` | ✓ assertion exists; will fail loudly on regression |
| DETERM-05 | Regenerated constants self-consistent (parity gate `run-3.json` vs itself = PASS) | Bash + tsx | `tsx tests/scripts/diff-playwright-reports.ts post-fix/run-3.json post-fix/run-3.json` | ✓ |
| DETERM-05 | 3-pair parity gate (1v2, 2v3, 1v3) all emit `PARITY GATE: PASS` | Bash + tsx | per §"Constants Regen Execution" Step 6 | ✓ |

### Sampling Rate

- **Per Plan 01 task commit (RCA instrumentation):** `yarn test:e2e --project=candidate-app-mutation --workers=1 -g "should register" --reporter=line` (~6-10 min; isolated registration test only)
- **Per Plan 02 task commit (frontend fix):** same quick command + `yarn test:unit --filter=@openvaa/frontend` if touching frontend code (~30s)
- **Per Plan 02 close (D-12 1-run smoke confirm):** full per-run cold-start chain (~54 min)
- **Plan 03 gate:** full 3-run cold-start (~162 min) via agent-inline `Bash(run_in_background)`
- **Phase gate (`/gsd-verify-work`):** SHA-256 identity check + 3-pair parity gate + IMGPROXY audit (all artifacts already committed by Plan 03; verify-work step reads them)

### Wave 0 Gaps

- [ ] `tests/tests/setup/register-fresh-candidate.setup.ts` — ONLY IF restructure path triggers (Plan 02-fallback). Mirrors `auth.setup.ts:23-57` retry-tolerance pattern.
- [ ] `.planning/phases/79-.../post-fix/rca-traces/` — directory created by Plan 01 (RCA artifact landing zone).
- [ ] `.planning/phases/79-.../post-fix/regen-constants.mjs` — copied verbatim from Phase 73's archive at Plan 03 start.
- [ ] `.planning/phases/79-.../STATUS.md` — created at Plan 03 Task 1 (could be earlier — operator may want it for Plan 01/02 progress visibility).
- [ ] No new vitest test files needed — DETERM-04 is verified via the existing E2E surface; DETERM-05 is verified via Bash+tsx scripts that already exist.

**Framework install:** None — Playwright + vitest already installed at HEAD per `package.json` + `tests/playwright.config.ts`. No new dependencies.

---

## LANDMINEs

Explicit list with mitigations:

| # | LANDMINE | Source | Mitigation |
|---|----------|--------|------------|
| L1 | **LANDMINE-9: yarn `&&`-chain arg forwarding** | `CLAUDE.md` §"Seeding local data" + Phase 78 CLEAN-05 | Use the explicit manual chain `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean`. NEVER `yarn db:reset-with-data --likert-only` (yarn appends `--likert-only` to `dev:clean`, not `db:seed`). |
| L2 | **imgproxy 502 (Supabase infrastructure flake)** | Phase 73 RESEARCH §Pitfall 5; CONTEXT D-14 | Detect via stderr scan + IMGPROXY_TIED_TITLES failure pattern. Recover via `supabase stop && supabase start && db:reset && db:seed --likert-only && dev:clean`, re-capture into SAME run-N.json. Cap 2 retries; escalate via STATUS.md flag on 3rd. |
| L3 | **Svelte 5 context destructuring rule** | `CLAUDE.md` §"Context Destructuring Rule" | If Hypothesis 2 fix touches `getCandidateContext()` consumers, reactive accessors (`isAuthenticated`, `selectedElections`, etc.) MUST be read via `ctx.X` inside `$derived(...)`, NOT destructured. `register/password/+page.svelte:45` already follows the pattern; preserve it. |
| L4 | **IMGPROXY_TIED_TITLES `endsWith()` collision risk** | Phase 73 D-09 structural binding + `regen-constants.mjs:80` | If restructure path is taken, the new setup project's test title MUST NOT `endsWith('> ' + pattern)` for any of the 14 patterns. The regen script's match-count assertion (lines 84-95) fires LOUDLY on collisions — uncatchable miscount → exit 1. Recommended title: `register fresh candidate via email link` (zero collision risk; checked above). |
| L5 | **Vite cache must be wiped per cold-start** | `CLAUDE.md` §"Seeding local data"; Phase 78 P05 SUMMARY | `yarn dev:clean` deletes `apps/frontend/.svelte-kit` + `apps/frontend/node_modules/.vite`. The 3-run chain MUST include this AFTER `db:reset` + `db:seed`, BEFORE spinning up Vite. Skipping it makes the suite incrementally warm — invalidates the "cold-start" claim. |
| L6 | **Playwright trace.zip files can be large** | `tests/playwright.config.ts:80 trace: 'on'` | Each test emits a trace.zip; ~3-10 MB typical, ~30-50 MB if heavy DOM/screenshots. RCA artifacts (Plan 01 traces committed to `post-fix/rca-traces/`) may total 100-300 MB. **Mitigation:** before committing RCA traces, run `du -sh post-fix/rca-traces/` and selectively commit only the failing-run traces + per-checkpoint state JSONs. If total > 100 MB, ask operator about git LFS or selective stripping. (Run-N.json captures from the 3-run gate are JSON only, ~5-10 MB each — no LFS issue.) |
| L7 | **Serial describe block + project dependency chain — BOTH must break for full cascade-elimination** | Per CONTEXT integration-points §lines 154-156 | The cascade has TWO layers: (a) serial mode INSIDE the describe block (test.describe.configure mode: 'serial'); (b) project dependency chain in playwright.config.ts. Restructure path breaks (a) — registration is no longer in the serial block. Restructure also reroutes (b) but the chain itself persists (just rooted at the new setup project). Cascade-elimination requires the registration setup to PASS deterministically — retry-tolerance helps if the race is intermittent, doesn't help if deterministic. The frontend race fix path (D-01) addresses the underlying cause; restructure (D-03 fallback) addresses the structural propagation only. |
| L8 | **`yarn workspace @openvaa/tests` is NOT a valid workspace target** | Verified by listing `package.json` files in repo + workspaces | `test:e2e` is a ROOT script (`package.json:28`), invoked as `yarn test:e2e ...`. The CONTEXT D-13 wording `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=json ...` is incorrect terminology — the canonical invocation is `yarn test:e2e --workers=1 --reporter=json > ...`. Use the root form in Plan 03's Bash script. |
| L9 | **Git commit hook workaround** | Memory entry `project_gsd_repo_hook_workaround.md` | All commits in this repo MUST use `git -c core.hooksPath=/dev/null commit -m '...'`. Forgetting this triggers a hook failure that may corrupt the working tree state. |
| L10 | **`run_in_background=true` is required for long-running cold-start runs** | Per system reminder on tool guidance; D-11 explicit | Each cold-start is ~54 min; default Bash timeout is 120s. Use `run_in_background=true` + completion notification (do NOT poll with `sleep` loops — system reminder blocks long leading sleeps). Set `timeout` to ~75 min ceiling per run (4,500,000 ms — within the 10-min cap means we need to monitor via completion notifications, not single-Bash-call wait). |
| L11 | **Phase 75's run-3.json filename was `run-3-report.json`; Phase 79's pattern is `run-3.json`** | `regen-constants.mjs:20` vs CONTEXT D-13 | When copying the regen script (D-07), update line 20 `reportPath` from `run-3-report.json` to `run-3.json` (matching D-13's filename convention). Easy to miss; assertion at line 24 fires "ENOENT" if mismatched. |
| L12 | **Tracing `trace: 'on'` (vs `'retain-on-failure'`)** | `tests/playwright.config.ts:80` | Tracing is unconditionally on — every test emits a trace.zip even on success. Full-suite 3-run capture will accumulate ~300-500 trace.zip files in `playwright-results/`. NOT committed — but it bloats disk during the gate; mitigate by `rm -rf playwright-results/` between runs IF disk pressure becomes an issue (the JSON report is captured via `--reporter=json` stdout, NOT from `playwright-results/`, so the cleanup is safe). |

---

## Plan Partitioning Recommendation

Per CONTEXT discretion + the locked decisions D-01 (frontend-fix-first), D-02 (time-boxed at 1 RCA + 1 fix), D-12 (1-run confirm before 3-run gate):

### Plan 01 — DETERM-04 RCA (dual-hypothesis instrumentation)

- **Scope:** Add temporary instrumentation per §"DETERM-04 RCA Strategy"; run the instrumented spec 3 times in a clean environment (NOT full cold-start — `--project=candidate-app-mutation -g "should register"` isolated); commit traces to `post-fix/rca-traces/`; author `post-fix/rca-traces/RCA-FINDINGS.md` summarizing which hypothesis (or both) the evidence supports.
- **Deliverable:** RESEARCH.md §"DETERM-04 RCA" section appended with empirical findings + disproof evidence per D-06.
- **Exit criterion:** clear-enough hypothesis confirmation that Plan 02 can author a targeted fix.
- **Estimated wall time:** 1-2 hours (instrumentation + 3× isolated runs + write-up).
- **Tasks suggestion:**
  - Task 1: add Playwright tracing instrumentation to a clone of the registration test (`tests/tests/specs/candidate/__rca__/registration-rca.spec.ts`, gitignored or scoped under post-fix/); add Svelte component instrumentation (window-flag + console.log) to `(protected)/+layout.svelte` + `register/password/+page.svelte` under a `// RCA` comment marker.
  - Task 2: run 3× isolated registration test; save traces + state-checkpoint JSONs to `post-fix/rca-traces/`.
  - Task 3: analyze traces; write `RCA-FINDINGS.md` + RESEARCH.md §"DETERM-04 RCA" update; document disproof per D-06.
  - Task 4: revert RCA instrumentation (clean git state for Plan 02's fix); commit RCA artifacts + cleanup-revert in one commit.

### Plan 02 — DETERM-04 fix (apply per RCA findings)

- **Scope:** Apply the targeted fix at the landing site identified per §"Frontend Race Fix Surface". Run isolated registration test in clean environment (per-task quick smoke). After fix lands, run the 1-run cold-start confirm per D-12.
- **Deliverable:** code change at one of the candidate sites (`register/password/+page.svelte` for H1 OR `(protected)/+layout.svelte` for H2 OR both); 1-run cold-start smoke shows registration test passes AND downstream tests no longer cascade.
- **Exit criterion (D-12):** 1-run cold-start cascade-skip count for `candidate-profile.spec.ts` describe-block-downstream tests drops to zero. If not zero, iterate Plan 02 (within the time-box of D-02; if still 3/3 cascading after the time-box, trigger Plan 02-fallback).
- **Estimated wall time:** 1-2 hours fix authoring + 1 hour iteration + 54 min D-12 cold-start smoke = ~3-4 hours.
- **Tasks suggestion:**
  - Task 1: implement the targeted fix per RCA Plan 01's identified hypothesis. Run isolated registration test (~10 min). Iterate until pass.
  - Task 2: run `yarn test:e2e --project=candidate-app-mutation --workers=1 --reporter=line` (full project, ~10-20 min). Verify no cascade in the describe block.
  - Task 3: run D-12 1-run cold-start confirm; capture run-0.json to `post-fix/run-0.json` (the pre-gate confirm); STATUS.md update; commit.

### Plan 02-fallback — Restructure to `register-fresh-candidate.setup.ts` (only triggered if Plan 02 fails per D-02)

- **Trigger:** Plan 02 final state shows 3/3 cascade-skip on full cold-start (the time-box bound per D-02).
- **Scope:** Per §"Restructure Fallback Shape" — create new setup file, amend `tests/playwright.config.ts`, prune `candidate-profile.spec.ts` (delete the registration test, optionally remove `serial` mode).
- **Exit criterion:** 1-run cold-start cascade-skip count drops to zero. The retry-tolerant setup absorbs intermittent flakes.
- **Estimated wall time:** ~2-3 hours (file creation + config + verification).
- **Tasks suggestion:**
  - Task 1: author `register-fresh-candidate.setup.ts` with retry-tolerant `waitForTouCheckbox` loop.
  - Task 2: amend `tests/playwright.config.ts` (add project, repoint `candidate-app-mutation` dependency).
  - Task 3: prune `candidate-profile.spec.ts` (delete registration test + helper + optionally remove `serial`).
  - Task 4: 1-run cold-start confirm; STATUS.md update; commit.

### Plan 03 — DETERM-05 3-run cold-start gate + regen + STATUS.md handoff (long-running unattended-agent)

- **Scope:** Per §"3-Run Cold-Start Gate Protocol" + §"Constants Regen Execution" — execute 3 cold-start runs, compute SHA-256 identity, IMGPROXY audit, regen constants, atomic commit.
- **Deliverable:** atomic commit per D-10 with all artifacts.
- **Exit criterion:** atomic commit lands; STATUS.md final state shows GREEN; Phase 79 ready for `/gsd-verify-work`.
- **Estimated wall time:** ~162 min (3 × 54 min cold-start runs) + ~30 min (regen + audit + commit) = ~3-4 hours.
- **Tasks suggestion:**
  - Task 1: copy `regen-constants.mjs` to `post-fix/`; create `STATUS.md`; commit baseline state.
  - Task 2: run-1 cold-start (background); update STATUS.md.
  - Task 3: run-2 cold-start (background); update STATUS.md.
  - Task 4: run-3 cold-start (background); update STATUS.md.
  - Task 5: SHA-256 identity check; if fail → D-09 protocol (3 more runs); if pass → proceed.
  - Task 6: run regen script; IMGPROXY audit; update constants in `tests/scripts/diff-playwright-reports.ts`; self-identity smoke + 3-pair parity gate; atomic commit; STATUS.md final update.

### Note on Plan 03's run-during-operator-absence

Per D-11 + D-15: operator leaves AFTER Plan 02 completes (with D-12 smoke green), so Plan 03 starts unattended. The agent's `Bash(run_in_background=true)` pattern handles wall-time without blocking. The STATUS.md updates between each cold-start run give the operator a return-skim surface.

**If the operator returns mid-Plan-03**, they should:
1. Open STATUS.md
2. Check §"Operator action needed?" — if NO, do nothing; if YES, read §"Escalation Flags" + §"What to do on return"
3. Look at the most recent commit (`git log -1 --oneline`) to see what task last landed
4. Resume `/gsd-execute-work` only AFTER §"Phase verdict so far" reads GREEN

---

## Common Pitfalls

### Pitfall 1: Single-hypothesis tunnel vision during RCA

**What goes wrong:** RCA plan starts by assuming Hypothesis 1 is the cause (because it's the first one listed in the source todo), instruments only H1, finds no smoking gun, and concludes "race is mysterious — go straight to restructure."
**Why it happens:** H1 is more familiar (cookies + auth — debuggable surface); H2 is Svelte-5-reactivity territory which is harder to instrument.
**How to avoid:** Per D-04 the RCA MUST instrument BOTH in parallel. The dual-checkpoint scheme in §"Hypothesis 1 Instrumentation" + §"Hypothesis 2 Instrumentation" is non-overlapping — they can run in the same instrumented test concurrently.
**Warning signs:** RCA plan's task list mentions only "cookies" or only "hydration" — flag and re-scope.

### Pitfall 2: Skipping the LANDMINE-9 manual chain

**What goes wrong:** Agent writes `yarn db:reset-with-data --likert-only` in the Plan 03 Bash script; the `--likert-only` flag forwards to `dev:clean` (no-op), so the seed is run WITHOUT `--likert-only`, voter-fixture tests fail their `voter-questions-start` 10s timeout, the 3 runs produce non-identical pass/fail sets, SHA-256 mismatch triggers D-09 protocol, agent burns another 162 min on 3 more runs that also fail.
**Why it happens:** `db:reset-with-data --likert-only` looks like a single-command convenience; it appears in `package.json:15` as a chained script.
**How to avoid:** Plan 03 Bash script MUST use the explicit manual chain `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean`. Verify in Plan 03 Task 1's authoring.
**Warning signs:** Plan 03 references `db:reset-with-data` — block in plan-check.

### Pitfall 3: Forgetting to revert RCA instrumentation before Plan 02

**What goes wrong:** Plan 01 adds RCA `window.__phase79RcaHydrated` flag + `console.log` hooks to `(protected)/+layout.svelte`. Plan 02 fixes the race but doesn't remove the RCA hooks. The fix-plan commit lands the RCA scaffolding in production code. Future operator sees `console.log` noise + unused window globals.
**Why it happens:** RCA artifacts and production fixes are intermixed in the same files.
**How to avoid:** Plan 01 Task 4 explicitly reverts RCA scaffolding before committing. Plan 02 starts from a clean tree. A grep for `__phase79Rca` + `// RCA` markers at Plan 02 close should return zero hits.
**Warning signs:** Plan 02's commit diff includes `console.log` additions or `window.__` global writes.

### Pitfall 4: Committing the run-N.json files but forgetting the run-N-sorted-status.txt

**What goes wrong:** Plan 03 Task 6's atomic commit includes `run-{1,2,3}.json` + `sha256.txt` but forgets the intermediate `run-{1,2,3}-sorted-status.txt` files. Later, a verifier wants to re-compute the SHA-256 hashes from `run-1.json` to confirm — but the JSON has timestamps + duration fields that vary across runs (verified by inspecting Phase 75's `run-1.json` vs `run-2.json`), so re-extracting the sorted-status from the JSON re-derives the same hash. The intermediate files are reproducible from the JSON, so it's safe to NOT commit them.
**Why it happens:** Phase 75's `post-fix/` directory commits the sorted-status files as audit-trail artifacts; copying that pattern blindly adds files that are redundant.
**How to avoid:** Either commit ALL audit-trail files (the sorted-status .txt files, the parity-gate-output.txt, the self-identity-smoke.txt) for full reproducibility — OR commit only the canonical inputs (`run-{1,2,3}.json` + `sha256.txt`) and let future verifiers re-derive. Phase 75 chose ALL — recommended for Phase 79 too, since the audit-trail value > the disk cost.
**Warning signs:** Plan 03 Task 6's `git add` list omits intermediate audit files.

### Pitfall 5: Treating the H1+H2 combined mode as "two bugs"

**What goes wrong:** RCA finds both H1 and H2 have signal. The fix plan tries to fix both independently in separate commits. The first fix accidentally masks the second hypothesis's evidence. The second fix becomes hard to verify.
**Why it happens:** Bugs frequently chain — H1 (session not propagated) means the login form submit (H1's manifestation) ALSO delays hydration (which manifests as H2). Fixing H1 may auto-resolve H2's apparent symptoms.
**How to avoid:** Plan 02 fix-plan applies the H1 fix first (the more upstream of the two), then re-runs the isolated registration test. If the cascade is now zero, H2 may have been a downstream symptom — STOP and don't apply H2 fix. If H2 still manifests independently, then add H2 fix in a follow-up commit.
**Warning signs:** Plan 02 commits two fixes at once without an intervening verification step.

---

## Sources

### Primary (HIGH confidence — verified at HEAD)

- `tests/tests/specs/candidate/candidate-profile.spec.ts:1-295` (full file read; race surface at lines 87-147)
- `tests/tests/setup/auth.setup.ts:1-98` (retry-tolerance pattern reference)
- `tests/tests/setup/re-auth.setup.ts:1-41` (dual-project re-auth pattern)
- `tests/playwright.config.ts:1-436` (project dependency chain at 99-164)
- `tests/scripts/diff-playwright-reports.ts:1-497` (constants location at 94-199; regen header at 42-92)
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:1-174` (Hypothesis 2 surface)
- `apps/frontend/src/routes/candidate/register/password/+page.svelte:1-147` (Hypothesis 1 surface — `handleSubmit` at 69-110)
- `apps/frontend/src/routes/candidate/auth/callback/+server.ts:1-54` (redirect chain after `verifyOtp`)
- `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts:1-97` (server-load chain)
- `apps/frontend/src/routes/candidate/login/+page.server.ts:1-59` (login form action — H1 fix-precedent for server-side redirect)
- `apps/frontend/src/hooks.server.ts:1-87` (session handling)
- `apps/frontend/src/lib/supabase/server.ts:1-21` (server client cookie handling)
- `apps/frontend/src/lib/supabase/browser.ts:1-15` (browser client)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:50-146` (auth method implementations — `_setPassword` at 83-89, `_register` at 140-146)
- `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts:1-73` (auth context wrappers)
- `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte:1-62` (ToU checkbox at line 53-58, `data-testid="terms-checkbox"`)
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts:155-159` (`setTermsOfUseAccepted`)
- `tests/tests/utils/testIds.ts:1-80` (`candidate.terms.checkbox`, `candidate.register.*`, `candidate.login.*`)
- `tests/tests/utils/supabaseAdminClient.ts:286-294` (admin `setPassword` impl)
- `package.json:1-91` (root scripts; `test:e2e` at line 28; `db:reset` + `db:seed` + `dev:clean` at 14-17; deprecated `dev:*` aliases at 19-26)
- `.planning/milestones/v2.9-phases/73-determinism-baseline/post-fix/regen-constants.mjs:1-123` (canonical regen script; IMGPROXY_TIED_TITLES at 64-78)
- `.planning/milestones/v2.9-phases/75-question-rendering-specs/post-fix/run-1-sorted-status.txt` (SHA-256 source format example)
- `.planning/milestones/v2.9-phases/75-question-rendering-specs/post-fix/parity-gate-output.txt` (3-pair parity gate output format)
- `.planning/milestones/v2.9-phases/75-question-rendering-specs/75-VERIFICATION.md:92-98` (SHA-256 + 3-pair pattern reference)
- `.planning/milestones/v2.9-phases/78-cleanup-hygiene-phase/78-VERIFICATION.md:39-90` (cold-start protocol + IMGPROXY audit precedent)
- `.planning/milestones/v2.9-phases/73-determinism-baseline/73-RESEARCH.md:62, 457-477` (imgproxy 502 recovery + pool-growth pitfall)
- `.planning/todos/pending/2026-05-12-candidate-profile-cascading-race.md:1-63` (source-of-truth todo with H1+H2 hypothesis statements)
- `.planning/milestones/v2.9-phases/76-profile-a11y/deferred-items.md:35-80` (deterministic-failure documentation + cascade-impact analysis)
- `.planning/REQUIREMENTS.md:26-30` (DETERM-04 + DETERM-05 text)
- `.planning/ROADMAP.md:108-156` (Phase 79 + downstream phase definitions)
- `.planning/STATE.md:1-30` (project state)
- `CLAUDE.md` §"Seeding local data" (LANDMINE-9 + cold-start protocol); §"Context Destructuring Rule (Svelte 5)" (reactive-accessor pattern)

### Secondary (verified via cross-reference)

- Phase 73 D-09 IMGPROXY structural binding — cross-referenced via 3 sources: regen-constants.mjs:63-79, diff-playwright-reports.ts:145-162, 78-VERIFICATION.md:80-89.
- Phase 75 SHA-256 anchor `7084db872e…` — cross-referenced via 4 sources: 75-VERIFICATION.md:1, :41, :59, :253.
- `test:e2e` is a ROOT script (NOT workspace-scoped) — verified by reading package.json + listing all package.json files under apps/ + packages/.

### Tertiary (training knowledge — flagged)

- `@supabase/ssr` cookie semantics (browser uses localStorage, server uses cookies, `updateUser` does not auto-refresh client session). Source: training knowledge of Supabase JS SDK + verification via reading the project's adapter code at `supabaseDataWriter.ts:83-89` (where `updateUser` is called WITHOUT a subsequent `getSession`). This is `[ASSUMED]` for the "doesn't auto-refresh" claim — could be verified at RCA time via the H1 instrumentation if planner wants definitive evidence.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@supabase/ssr`'s `updateUser({password})` does NOT automatically refresh the client-side session cookies on the browser client | §"Frontend Race Fix Surface" §H1 fix option 1 | If wrong, the proposed "explicit session sync wait" fix is a no-op; RCA Plan 01 H1 instrumentation will surface this empirically (cookies before/after `setPassword` resolution). LOW risk — fix path is contingent on RCA findings anyway. |
| A2 | The post-`updateUser` redirect happens client-side via `await goto(CandAppLogin)` (line 93) and does NOT go through a server-side response that could carry fresh Set-Cookie headers | §"DETERM-04 RCA — Code Path Map" + §H1 fix option 2 | Verified by reading `register/password/+page.svelte:81-93` — `goto` is from `$app/navigation` (client-side router). MEDIUM confidence. |
| A3 | The Phase 79 regen will yield ~63 PASS_LOCKED (47 v2.9 anchor + ~16 cascade-unblocked) | §"Constants Regen Execution" delta narrative | The number is an estimate from the source todo + ROADMAP SC #3 wording. Actual delta is empirically determined by Plan 03's run-3.json. If the delta is materially different (say +5 or +30), the regen still works mechanically; only the narrative comment block needs adjustment. LOW risk. |
| A4 | Each cold-start run takes ~54 min wall-time (Phase 78 + Phase 73 reference) | §"3-Run Cold-Start Gate Protocol" + §"Plan Partitioning" | Phase 78 78-VERIFICATION.md:43 explicitly says "~54 min (~162 min total)". MEDIUM-HIGH confidence; actual time is hardware-dependent (operator's machine) and may differ. The 75-min `timeout` ceiling per run in the Bash invocation is conservative. |
| A5 | Playwright trace.zip files are 3-50 MB typical | §"LANDMINEs" L6 | Training knowledge + Playwright docs. Actual size depends on test duration + DOM complexity. LOW risk — mitigation is to inspect total size before committing and ask operator if > 100 MB. |
| A6 | The restructure path's `register-fresh-candidate.setup.ts` name has zero IMGPROXY_TIED_TITLES collision | §"Constants Regen Execution" pre-audit | Manually verified all 14 patterns; none ends with "register fresh candidate via email link" or similar. HIGH confidence. Caveat: planner picks final name per CONTEXT D-03 discretion — re-verify at Plan 02-fallback time. |
| A7 | Sleep-loops are blocked by the agent tool harness | §"Plan Partitioning" Plan 03 note + L10 | Stated in the system reminder under Bash tool guidance: "Long leading sleep commands are blocked." Use `run_in_background=true` + completion notifications. HIGH confidence. |
| A8 | `git -c core.hooksPath=/dev/null commit` is the canonical commit form in this repo | §"Constants Regen Execution" Step 7 + L9 | Memory entry `project_gsd_repo_hook_workaround.md` says explicitly. HIGH confidence; planner should preserve this in every commit instruction in Plan 03. |

**Summary:** 8 assumptions logged; most LOW-MEDIUM risk because they're verifiable empirically at execution time (RCA evidence, actual wall-time, actual delta numbers). No HIGH-risk assumptions that could derail the phase.

---

## Open Questions for Planner

1. **Should Plan 01 commit RCA instrumentation code to git (under a `__rca__/` directory) or work entirely off-branch / off-tree?**
   - What we know: D-05 says "RCA artifacts committed" — but artifacts means traces + state JSONs + RCA-FINDINGS.md, not necessarily the instrumented test code itself.
   - What's unclear: if the instrumented test gets committed, Plan 02 needs to also commit the revert; if it's off-tree (e.g. via stash + apply), the agent's workflow is harder to checkpoint.
   - **Recommendation:** commit the instrumented test under `post-fix/rca-traces/registration-rca.spec.ts` (as a SIBLING of the trace files, NOT under `tests/tests/specs/...` where Playwright would discover it). The Svelte component instrumentation (window-flag + console.log) stays in the live tree across Plan 01 → Plan 02 boundary and gets reverted by Plan 01 Task 4. This separates "RCA harness scaffolding" (committed for future-RCA reuse) from "live-tree instrumentation" (revert-required, transient).

2. **If RCA confirms H1+H2 combined mode, should the fix be one commit or two?**
   - What we know: D-06 says "fix plan focuses solely on the confirmed root cause"; "combined" is not explicitly addressed.
   - What's unclear: D-06's intent is to avoid wasted instrumentation in the FIX, but doesn't speak to single-vs-multi commit semantics.
   - **Recommendation:** apply H1 fix first; if 1-run smoke shows zero cascade, STOP — H2 was a downstream symptom; do not apply H2 fix. If H2 still manifests, apply H2 fix in a second commit. Per Pitfall 5.

3. **For the 1-run cold-start confirm (D-12), does it count as the FIRST run of the 3-run gate, or is it a separate pre-gate run?**
   - What we know: D-12 says "1-RUN cold-start smoke BEFORE handing off to the 3-run gate". CONTEXT D-13 + D-11 enumerate 3 runs for DETERM-05.
   - What's unclear: economy of wall-time — could the D-12 confirm count as run-1?
   - **Recommendation:** treat the D-12 confirm as run-0 (separate file `post-fix/run-0.json`). The 3-run gate is a clean, controlled, post-fix-locked execution. The D-12 confirm may have lingering state from Plan 02's iteration (e.g., Vite cache wasn't cleaned between fix attempts). Total wall-time: ~216 min worst-case (54 confirm + 162 gate). Saving 54 min by counting it as run-1 risks an SHA-256 mismatch if Plan 02's iteration left artifacts. Conservative choice: run-0 + run-1 + run-2 + run-3 = 4 cold-starts total.

4. **Should `STATUS.md` be created in Plan 01 or Plan 03?**
   - What we know: D-16 says "STATUS.md at phase root, updated at every agent wake-up". CONTEXT framing implies it's needed for the unattended Plan 03 gate.
   - What's unclear: whether Plan 01 + Plan 02 (both ~3-4 hours wall-time, agent-supervised) also need it for operator-visibility.
   - **Recommendation:** create STATUS.md in Plan 01 Task 1 (i.e., the FIRST plan of Phase 79); update at every plan close + every checkpoint. Cost is negligible (one extra commit per plan close); benefit is uniform operator-return surface throughout the phase, not just Plan 03.

5. **If the 3-run gate produces 3 byte-identical pass-sets but they include 1-2 unexpected NEW failures (not in PASS_LOCKED, not in DATA_RACE, not in CASCADE), is that a regen-block or a regen-with-flag?**
   - What we know: D-08 says "STRICT SHA-256 IDENTITY across 3 runs" — that's about IDENTITY, not categorization. D-09 is for IDENTITY failure.
   - What's unclear: D-08/D-09 don't cover the case where 3 runs are SHA-identical but the categorization shows a regression vs Phase 75 baseline.
   - **Recommendation:** flag-and-regen path: if 3 runs SHA-identical, the underlying determinism contract holds. If they reveal a NEW regression (test that should have passed now consistently fails), the regen still proceeds (the new state is the new anchor), BUT Plan 03 Task 6's atomic commit MUST include a STATUS.md flag + a follow-up todo file documenting the regression. Phases 80-82 will see the new anchor and may need to address the regression. Alternatively, the regen is blocked and the operator decides — but that defeats the unattended-agent pattern. Recommendation: regen-with-flag + follow-up todo + STATUS.md operator-checkpoint flag.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All scripts | ✓ | ≥22 per `package.json:79` | — |
| Yarn | All workspace commands | ✓ | 4.13 per `package.json:80` | — |
| Playwright | E2E tests | ✓ | catalog-managed per `package.json:57` + `tests/playwright.config.ts` | — |
| `tsx` | regen + diff scripts | ✓ | catalog-managed | — |
| Supabase CLI | Local backend (`supabase start/stop`, `db:reset`) | ✓ (assumed per CLAUDE.md §"Development Environment") | — | — |
| Docker (for Supabase containers including imgproxy) | Supabase local | ✓ (assumed) | — | — |
| `shasum -a 256` | SHA-256 identity | ✓ (macOS/Linux built-in) | — | `openssl sha256` fallback |
| `git` | Commits + history | ✓ | — | — |
| `curl` | Vite ready-poll | ✓ | — | `wget` fallback |
| `lsof` | Port-5173-free check | ✓ (macOS/Linux) | — | `netstat -an \| grep 5173` fallback |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** `openssl sha256` if `shasum` is unavailable (unlikely on macOS/Linux).

**Skip condition NOT met:** Phase 79 depends on external tools (Playwright, Supabase, yarn). Audit section required.

---

## Security Domain

Per `.planning/config.json` — no `security_enforcement` key present. Default is enabled, but Phase 79 is a test-infrastructure + frontend-bug-fix phase with no new user-facing surfaces, no new auth flows, no new data writes. The fix touches existing auth code (`register/password/+page.svelte` + `(protected)/+layout.svelte`) which is already in production scope.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (touched by H1 fix path) | `@supabase/ssr` + cookie-based PKCE session — already in place; fix preserves existing controls; no new auth surface introduced |
| V3 Session Management | yes (touched by H1 fix path) | `@supabase/ssr` cookie management via `createServerClient` + `getSession`/`getUser` pattern in `hooks.server.ts:supabaseHandle` — already in place |
| V4 Access Control | yes (read-only) | `candidateAuthHandle` in `hooks.server.ts:54-78` enforces redirect to login for `(protected)` routes — already in place; Phase 79 does not modify access-control surface |
| V5 Input Validation | no | No new input surfaces; password input + ToU checkbox are existing |
| V6 Cryptography | no | No new crypto surface; existing JWT verification in login server action |

**No new security controls required.** The H1 fix path (if chosen) MUST preserve the existing controls — specifically, the `signInWithPassword` + JWT role check at `login/+page.server.ts:23-47` must remain intact (it's the standard auth gate; modifying it requires security review).

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Session-fixation if fix introduces session refresh on the wrong scope | Spoofing | Use Supabase's existing `signOut({scope: 'local'})` + `signInWithPassword` flow; do NOT introduce session-mutation surface that wasn't already there |
| ToU bypass if fix relaxes the `(protected)/+layout.svelte` gate | Elevation of Privilege | Preserve the `validity.candidate.termsOfUseAccepted && !termsSubmitted → layoutState === 'terms'` gate; if H2 fix changes this expression, verify the bypass-not-possible invariant manually |
| Trace.zip artifact leakage if RCA traces capture session tokens | Information Disclosure | RCA traces captured by Plan 01 may include `sb-<…>-auth-token` cookie values. Mitigation: redact or ASCII-armor session tokens before committing trace files. Alternatively, scrub by running `find post-fix/rca-traces -name "*.json" -exec sed -i.bak 's/"value":"sb-[^"]*"/"value":"<REDACTED>"/g' {} \;` before commit. |

**Security risk for Phase 79: LOW.** The phase touches auth surfaces but applies fixes within the existing security envelope. Add a Plan 01 Task note: "RCA trace files may contain session tokens; redact before committing per L-RCA-leak."

---

## Metadata

**Confidence breakdown:**
- DETERM-04 RCA strategy: HIGH — instrumentation primitives verified against Playwright config (`trace: 'on'` already set) + Svelte 5 reactivity model (verified via `(protected)/+layout.svelte` source). Both hypotheses have concrete discriminating signals.
- Frontend race fix surface: MEDIUM — exact fix shape is contingent on RCA findings. The candidate landing sites are verified; the specific code change is described in 3 alternatives per hypothesis.
- Restructure fallback shape: HIGH — exact file diff + config diff specified; mirrors verified `auth.setup.ts` + `re-auth.setup.ts` patterns.
- 3-run gate protocol: HIGH — chain commands verified against `CLAUDE.md` LANDMINE-9 + Phase 78 78-VERIFICATION.md cold-start protocol + Phase 75 SHA-256 precedent.
- Constants regen: HIGH — copy-then-edit recipe verified against `regen-constants.mjs` source + Phase 75 regen-header precedent.
- STATUS.md schema: MEDIUM — pattern is novel for Phase 79 (no prior STATUS.md in archived phases); schema designed to match D-16's "wake-up dashboard" semantics + operator-return-surface intent.
- LANDMINEs: HIGH — all 12 verified against source files at HEAD or against documented Phase 73/78 references.
- Plan partitioning: HIGH — partition matches D-01/D-02/D-12/D-11 sequencing constraints exactly.

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (30 days for stable; the underlying Supabase + Playwright + SvelteKit + Svelte 5 stack is reasonably mature; the v2.10-Phase-79-specific code references are pinned to HEAD as of 2026-05-12 and won't shift unless Phase 79 itself modifies them).

## RESEARCH COMPLETE
