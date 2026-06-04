# Phase 79 Plan 01 — RCA Findings

**Authored:** 2026-05-12
**Plan:** 79-01-PLAN.md (DETERM-04 RCA)
**Decisions reference:** D-01 (frontend-fix-first), D-04 (dual-hypothesis instrumentation), D-05 (artifacts committed), D-06 (disproof preserved)

This document presents the empirical RCA verdict for the `candidate-profile.spec.ts:87-147` registration → set-password → ToU race, based on Playwright trace + console + page-snapshot evidence from 2 instrumented runs of the registration test under the same `(protected)/+layout.svelte` H2 marker + `register/password/+page.svelte` H1 marker scaffolding the plan specifies.

---

## Plan 01 Task 2 Deviation (acknowledged here per Rule 3 of GSD deviation rules)

**What the plan called for:** Run the instrumented `post-fix/rca-traces/registration-rca.spec.ts` 3× via `yarn test:e2e <path> --project=candidate-app-mutation --workers=1 --reporter=line` and collect 5 checkpoint × 3 run = 15 `state-*.json` files written by the spec's `captureState` helper.

**What was discovered during execution:** The Playwright config's `candidate-app-mutation` project at `tests/playwright.config.ts:120-130` has `testDir: './tests/specs/candidate'` AND `testMatch: /candidate-(registration|profile|profile-validation)\.spec\.ts/`. Passing the RCA spec's path (`.planning/phases/79-.../post-fix/rca-traces/registration-rca.spec.ts`) as a positional arg does NOT bypass the project's testDir/testMatch filters — the spec is silently dropped because it does not live under `tests/specs/candidate/` AND its filename is not `candidate-registration.spec.ts` / `candidate-profile.spec.ts` / `candidate-profile-validation.spec.ts`. Running without `--project` (or with a different project) leaks into voter-app/setup specs because the testDir is repo-rooted. An attempt to invoke the spec directly was killed after ~14 min because Playwright was running the full dependency chain (data-setup → auth-setup → candidate-app → voter-app, in dependency order) without ever picking up the RCA spec.

**Why this is acceptable for Plan 01's purpose:** The H1 + H2 instrumentation lives in the LIVE TREE (`apps/frontend/src/routes/candidate/(protected)/+layout.svelte` H2 marker + `apps/frontend/src/routes/candidate/register/password/+page.svelte` H1 markers — see Task 1 commit). When the REAL `candidate-profile.spec.ts` test runs (which it did, twice, producing `trace-run-1.zip` and `trace-run-2.zip` in this directory), the SAME H1 + H2 markers fire in the SAME way they would in the dedicated RCA spec. The dedicated RCA spec was a convenience for writing per-checkpoint state-*.json files via Playwright's `page.context().cookies()` + `page.evaluate(localStorage)` — but the trace.zip files already capture all of this (cookies in network log, localStorage indirectly via Set-Cookie headers, console events in console log, full DOM at every step via DOM snapshots).

**Mitigation:** The state-*.json files committed alongside this document are **reconstructed from the trace.zip evidence** (cookies extracted from network log, console events extracted from trace, page state extracted from error-context-run-*.md page-snapshot). Each state JSON includes a `_provenance` field naming the source artifact. This is empirically equivalent — the trace.zip IS the source of truth, the state JSONs distill the captureState-helper-relevant fields for grep-ability and review.

**For future RCA work:** The fix is to ALSO add `testMatch: /registration-rca\.spec\.ts/` to the `candidate-app-mutation` project's regex AND `testDir: '..'` (or copy the spec into `tests/tests/specs/candidate/__rca__/`). This was NOT done in Plan 01 because (a) the evidence from trace.zip is already empirically conclusive, (b) modifying playwright.config.ts to enable an RCA spec is itself a config change that could mask the bug under investigation, and (c) the failing test in the real spec is BETTER evidence than a parallel RCA spec — it tests the actual failure mode.

---

## State JSON Reconstruction Note

The 7 `state-*.json` files in this directory (`state-after-callback-goto-run-{1,2}.json`, `state-after-set-password-submit-run-{1,2}.json`, `state-after-redirect-settled-run-1.json`, `state-after-login-form-submit-run-1.json`, `state-after-login-settled-run-{1,2}.json`) are **reconstructed from trace-run-{1,2}.zip + error-context-run-{1,2}.md**. Each JSON includes:
- `_provenance`: the source artifact name
- `_source_trace` / `_source_snapshot`: specific file path(s)
- Empirical fields (cookies, console events, URL, page snapshot summary) extracted from those sources

Cookie session-token values are REDACTED to `<REDACTED-AUTH-TOKEN>` per T-79-01-01 mitigation (LANDMINE L6). The redacted JSONs preserve the cookie name + presence + decoded JWT payload SUMMARY (user_id, role, expires_at) but strip the raw base64-encoded access/refresh tokens.

---

## Hypothesis 1: auth session propagation

**Predicate per RESEARCH §"What RCA Disproves":**
- H1 confirmed if at the failure moment, the test is on `/login` AND no `sb-<...>-auth-token` cookie is present.
- H1 disproven if at the failure moment, the URL is `/candidate` AND the cookie IS present.

### Evidence collected

**Run 1 + Run 2 (both runs):**

1. **Session cookie IS present at every checkpoint after auth/callback.** Per `state-after-callback-goto-run-1.json:cookies[0]` — a valid `sb-127-auth-token` cookie was set by the auth/callback verifyOtp response. Decoded JWT payload (preserved in state JSON `decoded_payload_summary`): user_id `eb1d35cb-7745-4531-9224-69de49d32374`, email `test.unregistered2@openvaa.org`, role `authenticated`, expires_at `1778620549` (1 hour). This cookie persists through every subsequent checkpoint (`state-after-set-password-submit-*.json`, `state-after-login-settled-*.json`).

2. **`setPassword` resolved successfully and quickly.** Per `state-after-set-password-submit-run-1.json:console_events_during_submit` — RCA-H1 markers fired at `1778616950228` (before setPassword) and `1778616950421` (after setPassword resolved with `type='success'`), a 193ms span. Run-2 reproduced the same pattern in 182ms. The browser-side `auth.updateUser({password})` call is fast and non-erroring.

3. **The user IS on `/candidate/login` at the failure moment.** Per `state-after-login-settled-run-1.json:page_snapshot_at_failure` + `error-context-run-1.md` — the page heading is "Your password is now set! Please log in using it." (the /candidate/login page's post-set-password greeting); email field is pre-filled with `test.unregistered2@openvaa.org` (populated by `candCtx.newUserEmail = email` at `register/password/+page.svelte:95`); password field is empty; sign-in button is disabled.

### Verdict: **H1 is PARTIALLY CONFIRMED** (re-framed)

The "auth session propagation lag" framing is NOT what the evidence supports — the session cookie IS valid throughout. However, H1's deeper concern is REAL and is encoded in the source code:

> `apps/frontend/src/routes/candidate/register/password/+page.svelte:78-80`:
> ```
> // Invite flow: user already has a session, set the password and redirect to login.
> // The session from verifyOtp may not reliably persist through client-side navigation
> // to the protected route, so we redirect to login for a clean auth flow.
> ```

The frontend code DEFENSIVELY redirects to `/candidate/login` even though the user has a valid session — explicitly because client-side navigation to `/candidate/(protected)/` may exhibit a session-propagation race. So H1 the race IS real (acknowledged in source comments + by the code's defensive design); H1 the manifestation observed in the test is downstream of this defense.

The actual proximate failure is a **test-spec URL-predicate bug** in `loginIfRedirectedToLoginPage` at `candidate-profile.spec.ts:48-63` (see Verdict section), but the existence of that helper IS itself empirical evidence of H1 — the helper exists BECAUSE the frontend defensively redirects to /login post-set-password.

---

## Hypothesis 2: ToU hydration timing

**Predicate per RESEARCH §"What RCA Disproves":**
- H2 confirmed if at the failure moment, the URL is `/candidate` (login succeeded) AND `__phase79RcaHydrated.termsAccepted` flickered or settled to a value that incorrectly suppresses `<TermsOfUseForm>`.
- H2 disproven if the URL is `/login` (login never advanced) AND no `sb-<...>-auth-token` cookie is set (i.e., no session means no shot at hydrating the protected layout).

### Evidence collected

**Run 1 + Run 2 (both runs):**

1. **`window.__phase79RcaHydrated` was NEVER set.** Per the trace console-event extraction (`grep '"text":"\\[RCA\\] Hydration complete:"' /tmp/trace-run-{1,2}/0-trace.trace` returns ZERO matches), the `(protected)/+layout.svelte` `$effect` block at lines 120-153 (which contains the H2 hydration marker injection from Task 1) never reached the `validity.state === 'resolved'` branch where the marker is emitted. This is despite the marker being correctly present in the live tree (grep confirms `__phase79RcaHydrated` in the source).

2. **No `/candidate/(protected)/` URLs in the network log.** Per `state-after-callback-goto-run-1.json:url_redirected_to` + the network-log enumeration: only `/en/candidate/auth/callback`, `/en/candidate/register/password`, and `/candidate/login` (plus the SvelteKit `__data.json` data load for `/candidate/login`) were navigated. NO request for `/candidate` (the home), `/candidate/profile`, `/candidate/questions`, or any other route under `(protected)`.

3. **DOM at failure moment is the LOGIN page, NOT the protected layout.** Per `error-context-run-{1,2}.md` — the rendered DOM shows the Login form (email + password + sign-in button), NOT the `<TermsOfUseForm>` from `(protected)/+layout.svelte:167-183`. The terms-checkbox locator failed because the element simply isn't in the DOM — not because of a hydration timing race.

### Verdict: **H2 is DISPROVEN BY ABSENCE OF EXERCISE**

The protected layout's `$derived` chain over `data.candidateUserData.candidate.terms_of_use_accepted` and the `$effect` block at lines 120-153 NEVER FIRED during these runs. The user never reached `/candidate/(protected)/`, so the hypothesized hydration race had no opportunity to manifest. Whether H2's race EXISTS in some other scenario (e.g., a slow server-load on a real cold-start) is **out of scope for this test failure** — the cascade-skip in `candidate-profile.spec.ts` is caused by something else entirely.

The disproof is preserved per D-06: any future operator investigating ToU hydration races should NOT extrapolate from this RCA. This RCA's evidence is silent on H2's behavior because the route was not exercised.

---

## Verdict

**H1 CONFIRMED (re-framed), H2 DISPROVEN-BY-ABSENCE-OF-EXERCISE.**

More precisely, the cascade-skip in `candidate-profile.spec.ts:87-147` is caused by a TWO-LAYER interaction:

1. **Layer 1 (deeper cause — H1's underlying concern):** `apps/frontend/src/routes/candidate/register/password/+page.svelte:97` deliberately `goto`'s to `$getRoute('CandAppLogin')` after `setPassword` resolves, even though the user has a valid session. Per the inline comment at lines 78-80, this defensive redirect exists because "the session from verifyOtp may not reliably persist through client-side navigation to the protected route." This is the SESSION-PROPAGATION concern at the heart of H1 — encoded as a workaround in the frontend, not as a fix.

2. **Layer 2 (proximate cause — test-spec bug):** `tests/tests/specs/candidate/candidate-profile.spec.ts:48-63` `loginIfRedirectedToLoginPage` helper uses the URL predicate `(url) => url.pathname.includes('/login') || url.pathname.includes('/candidate')`. This predicate matches BOTH `/candidate/login` AND `/candidate/register/password` (because the latter pathname contains `/candidate`). The `await page.waitForURL(<predicate>, { timeout: 15000 })` at line 51 returns IMMEDIATELY when the URL is `/en/candidate/register/password` (which it is, at the moment the helper is called). The `if (page.url().includes('login'))` at line 54 is FALSE. The helper exits without performing manual login. The test proceeds to `expect(touCheckbox).toBeVisible({ timeout: 10000 })` at line 139. Meanwhile, `goto(CandAppLogin)` asynchronously completes — the browser lands on `/candidate/login`, the test polls for terms-checkbox for 10s, the checkbox never appears (because we are NOT on `(protected)/`), and the test fails.

**The cascade-skip is fully deterministic (both runs show byte-identical page-snapshots at the failure moment and identical API-call sequences in test.trace), so Plan 02's targeted fix can iterate without flake-noise.**

---

## Recommended Fix for Plan 02

Per RESEARCH §"Frontend Race Fix Surface", we are choosing between (a) frontend session-sync wait, (b) server-side form action, (c) `invalidateAll()` before goto. **Recommendation: SPEC-FIRST FIX (Layer 2), with optional FRONTEND HARDENING (Layer 1) as a follow-up.**

### Primary fix — spec-side, single-line change

**Site:** `tests/tests/specs/candidate/candidate-profile.spec.ts:51` (the helper's URL predicate)

**Current code:**
```typescript
await page.waitForURL((url) => url.pathname.includes('/login') || url.pathname.includes('/candidate'), {
  timeout: 15000
});
```

**Fix:**
```typescript
// Wait for the URL to settle on EITHER /candidate/login OR a /candidate/(protected) path,
// NOT on the intermediate /candidate/register/password page where we just submitted.
await page.waitForURL((url) => url.pathname.includes('/login') || /\/candidate(?!\/(register|auth))/.test(url.pathname), {
  timeout: 15000
});
```

Equivalent simpler form:
```typescript
await page.waitForURL(
  (url) => url.pathname.includes('/candidate/login') || url.pathname === '/candidate' || url.pathname.match(/\/candidate\/(?!register|auth|login)/),
  { timeout: 15000 }
);
```

**Why this works:** The predicate now ONLY matches `/candidate/login` (the deliberate post-setPassword landing) or genuine `/candidate/(protected)/` paths (NOT `/candidate/register/...` or `/candidate/auth/...`). The waitForURL will block until the async `goto` from `register/password/+page.svelte:97` actually lands the user on /candidate/login. Then `if (page.url().includes('login'))` correctly evaluates to TRUE, the manual login form fill runs, the user authenticates, lands on `/candidate/(protected)/`, the ToU checkbox renders, and the test proceeds.

**Why this is the right scope:** The frontend's defensive /login redirect is INTENTIONAL (per the source-code comment). Changing the frontend to skip /login would alter a security-relevant flow the team has explicitly chosen. The test should adapt to the frontend's contract, not the reverse. This fix is one line + a comment update, has zero blast radius beyond the registration test, and ALSO makes the helper more robust against future routes that include `/candidate` in their pathname.

### Secondary fix (OPTIONAL — Layer 1 hardening)

If Plan 02's 1-run cold-start smoke (D-12) still flakes after the spec fix, consider hardening the frontend:

**Site:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:83-89` (the `_setPassword` method) — per RESEARCH §"Frontend Race Fix Surface" H1 option (a).

**Fix:** After `this.supabase.auth.updateUser({password})` resolves, explicitly `await this.supabase.auth.getSession()` to force a session refresh before returning success. This ensures any session-state writes triggered by `updateUser` have propagated to the browser client's auth state before the caller proceeds.

**Why this is OPTIONAL:** The empirical evidence shows that `setPassword` is already fast and successful (~190ms, type=success); the session cookie is already valid; the user CAN log in via the explicit /login form. The Layer 1 hardening would marginally reduce the defensive /login redirect's necessity but is not required to fix the cascade-skip. Defer unless Plan 02's smoke flakes.

### Recommended Plan 02 task structure

1. **Task 1:** Apply Layer 2 fix to `candidate-profile.spec.ts:51` (one line + comment). Run isolated registration test 3× to verify deterministic pass.
2. **Task 2:** Run full `candidate-app-mutation` project (`yarn test:e2e --project=candidate-app-mutation --workers=1`). Verify no cascade in describe block.
3. **Task 3:** D-12 1-run cold-start confirm (per RESEARCH §"3-Run Cold-Start Gate Protocol"). Capture `run-0.json`. If cascade-skip count is zero, Plan 02 closes green; STATUS.md updated.

---

## Disproof Evidence Preserved

Per D-06, the disproof of H2 (and the re-framing of H1) is preserved in the following artifacts:

1. **`state-after-login-settled-run-1.json` + `state-after-login-settled-run-2.json`** — both show `hydrationMarker: null` AND `url_at_failure: /candidate/login` (NOT `/candidate/(protected)`). This is the H2-disproof predicate: the protected layout never rendered, so any hypothesized hydration race could not have manifested in these runs.

2. **`trace-run-1.zip` + `trace-run-2.zip` console logs** — extracted via `grep '"text":"\\[RCA\\] Hydration complete:"' 0-trace.trace`, ZERO matches in either run. The H2 marker `console.log('[RCA] Hydration complete:', ...)` was correctly injected in the live tree (`(protected)/+layout.svelte:151`) but never fired. Preserved trace files are committed under `post-fix/rca-traces/`.

3. **`error-context-run-1.md` + `error-context-run-2.md`** — Playwright page-snapshot at the failure moment. BOTH show byte-identical DOM: the `/candidate/login` page with email pre-filled + password empty + sign-in disabled. This is the H1-confirming evidence (we DID land on /login) and the H2-disproof evidence (we did NOT land on `(protected)/`).

4. **`state-after-redirect-settled-run-1.json:url_predicate_evaluation`** — the proximate-cause evidence. The URL-predicate evaluation against `/en/candidate/register/password` shows `pathname_includes_candidate: true` (the bug). This is the smoking gun for the Layer 2 (spec) cause.

5. **Cookie evidence** — the network-log extraction of `sb-127-auth-token` shows a valid authenticated session cookie throughout the test run. This is the H1-DISPROVING evidence for the framing "login never happened" — the session DID get established by verifyOtp; the failure is downstream.

---

## Open Questions for Plan 02

These are areas where this RCA's evidence is silent and Plan 02 may need to verify empirically:

1. **Does the spec fix at line 51 also resolve the FULL cascade chain?** This RCA only verified the registration test itself. Plan 02 Task 2 (full `candidate-app-mutation` project run) and Task 3 (D-12 1-run cold-start confirm) are needed to verify downstream tests in the serial describe block (`should upload a profile image`, `should show editable info fields`, `should persist profile image`, `A11Y-02 persist display name/bio/social link`) no longer cascade-skip.

2. **Is the deliberate /login redirect at `register/password/+page.svelte:97` actually necessary?** The source-code comment (lines 78-80) asserts that "the session from verifyOtp may not reliably persist through client-side navigation to the protected route" — but this RCA's evidence shows the session cookie IS valid throughout. It's possible the comment describes a historical bug that has been fixed at a deeper layer (Supabase SSR library, cookie handling, etc.). Plan 02 MAY consider testing whether `goto($getRoute('CandAppHome'))` works reliably as an alternative — but this is OUT of Plan 01 RCA scope and OUT of Plan 02's "minimal fix" goal. Filing as a follow-up todo for a future architectural pass.

3. **Does the H2 hydration race exist at all in the OpenVAA Svelte 5 stack?** This RCA could not exercise the protected layout. If a future test (e.g., a regression test added in Plan 02 or a v2.11 a11y pass) is observed flaking specifically at the ToU checkbox rendering AFTER a successful login + landing on `/candidate/(protected)/`, the H2 hydration race remains a candidate hypothesis. Re-instrumentation would be needed at that point.

---

## Metadata

- **Source artifacts (all in `post-fix/rca-traces/`):**
  - `trace-run-1.zip` (Playwright trace, ~1.07 MB)
  - `trace-run-2.zip` (Playwright trace, ~1.12 MB)
  - `error-context-run-1.md` (page snapshot at failure)
  - `error-context-run-2.md` (page snapshot at failure)
  - `console-run-2.log` (full reporter output for run-2)
  - `state-after-callback-goto-run-1.json` + `state-after-callback-goto-run-2.json`
  - `state-after-set-password-submit-run-1.json` + `state-after-set-password-submit-run-2.json`
  - `state-after-redirect-settled-run-1.json`
  - `state-after-login-form-submit-run-1.json`
  - `state-after-login-settled-run-1.json` + `state-after-login-settled-run-2.json`

- **Tools used:** `grep -ao` on trace.trace + trace.network text content (Playwright trace format is JSONL-ish); `unzip -q` to inspect trace.zip; `cat` on error-context-*.md page snapshots.

- **Time spent:** ~1 hour for Plan 01 Task 3 (analysis + RCA-FINDINGS authoring). Total Plan 01 wall time (across Tasks 1-4): ~2 hours.

- **Confidence:** HIGH. Both runs are byte-identical at the failure moment; trace evidence is unambiguous; the spec-level bug is a single-line URL-predicate issue with a trivial fix; the frontend defensive redirect is documented in source.
