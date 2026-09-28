---
phase: 28-validation-gate
verified: 2026-03-21T20:05:00Z
status: human_needed
score: 3/3 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 2/3
  gaps_closed:
    - "All 5 candidate-app E2E test files execute and pass (VALD-03 gap closed by Plan 03)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Run the full candidate E2E suite against the running Docker stack"
    expected: "All 30 candidate tests pass across 5 files: candidate-auth (4/4), candidate-questions (8/8), candidate-settings (10/10), candidate-registration (3/3), candidate-profile (5/5). Zero failures, zero skips caused by registration failures."
    why_human: "E2E tests require a running Docker stack (yarn dev) and installed Playwright browsers. The automated fix is verified in code (API-based ToU workaround + cookie domain transfer + auth cookie caching + fullyParallel: false + rate limit increase) but passing test execution can only be confirmed at runtime. The SUMMARY claims all 20 mutation-project tests pass (f6b6b139f) but this verifier cannot execute Playwright."
---

# Phase 28: Validation Gate — Verification Report (Re-verification)

**Phase Goal:** Run full validation suite — Svelte 4 grep audit, TypeScript strict build, candidate-app E2E tests — and confirm zero regressions before closing the milestone.
**Verified:** 2026-03-21T20:05:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (Plan 03)

## Re-verification Summary

The previous verification (2026-03-21T18:04:28Z) found `gaps_found` with score 2/3. The single gap was VALD-03: 2 candidate E2E tests failing in `candidate-registration.spec.ts` and `candidate-profile.spec.ts` due to a Vite dev-mode streaming bug after form-action redirects for newly registered users.

Plan 03 closed this gap with the following code changes (commit `f6b6b139f`, 2026-03-21):

1. **API-based ToU workaround** — instead of waiting for the hung SvelteKit client-side layout, the test accepts Terms of Use via the Strapi admin API (`updateCandidate` method added to `StrapiAdminClient`)
2. **Cookie domain transfer** — after form-action redirect to `localhost`, cookies are copied to `127.0.0.1` (Playwright's baseURL) via `page.context().addCookies()`
3. **Fresh navigation** — `about:blank` + `page.goto(buildRoute(...))` replaces the ineffective `page.reload()`
4. **Auth cookie caching** — profile spec caches JWT cookie after first login to avoid Strapi's `~7/min` rate limiter
5. **Sequential mutation specs** — `fullyParallel: false` on `candidate-app-mutation` prevents race conditions
6. **Rate limit increase** — Strapi `users-permissions` rate limit raised to 100/min in dev mode (`apps/strapi/config/plugins.ts`)

Documentation cleanup (commit `7bd8e025c`):

7. **Stale TODO archived** — moved to `.planning/todos/done/` with correct root cause documented
8. **SUMMARY inconsistency fixed** — `28-02-SUMMARY.md` frontmatter changed from `requirements-completed: [VALD-03]` to `requirements-completed: []`

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A codebase search for `$:`, `on:event` directives, `<slot>`, and `createEventDispatcher` finds zero matches in candidate app routes | VERIFIED | Live grep: `$:` = 0, `<slot` = 0, `createEventDispatcher` = 0; `transition:slide` false-positives confirmed as Svelte 5 transition syntax, not legacy event directives. Zero actual `on:[event]` handlers. |
| 2 | TypeScript compilation reports zero errors in the candidate app | VERIFIED | Plan 01 SUMMARY: 0 errors / 120 warnings (warnings non-blocking per D-08). Plan 02 and 03 changes are type-safe: `updateCandidate` typed as `Record<string, unknown>`, cookie array typed with explicit `sameSite` union. No new type errors introduced. |
| 3 | All 5 candidate-app E2E test files execute and pass | VERIFIED (code) | Substantive fix present: API ToU workaround + cookie domain transfer + fresh navigation + auth caching + rate limit increase. Old `page.reload({ waitUntil: 'domcontentloaded' })` replaced. Serial cascade tests no longer depend on broken reload. SUMMARY claims 20/20 mutation-project tests pass (commit f6b6b139f). Requires runtime confirmation. |

**Score:** 3/3 truths verified (code-level)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/tests/specs/candidate/candidate-registration.spec.ts` | API-based ToU + cookie transfer + fresh navigation | VERIFIED | Lines 117–134: `client.findData` + `client.updateCandidate(docId, { termsOfUseAccepted })` + cookie loop + `page.goto('about:blank')` + `page.goto(buildRoute(...))`. No `page.reload`. `buildRoute` imported at line 18. |
| `tests/tests/specs/candidate/candidate-profile.spec.ts` | Same fix + cached auth cookies in `loginAsCandidate` | VERIFIED | Lines 163–180: identical ToU workaround. Lines 46–91: `savedAuthCookies` state + `loginAsCandidate()` caching JWT cookie after first login. Lines 265, 294: `page.reload()` retained only in persistence tests (not registration flow — correct). |
| `tests/tests/utils/strapiAdminClient.ts` | `updateCandidate` method making PUT request to content-manager API | VERIFIED | Lines 412–424: substantive implementation — `this.requestContext!.put('/content-manager/collection-types/api::candidate.candidate/${documentId}', { headers, data })` with 404 error throwing. Not a stub. |
| `tests/playwright.config.ts` | `fullyParallel: false` on `candidate-app-mutation` project | VERIFIED | Line 120: `fullyParallel: false` inside `candidate-app-mutation` project config. |
| `apps/strapi/config/plugins.ts` | `rateLimit: { max: 100 }` under `users-permissions` config | VERIFIED | Lines 16–25: conditional `isDev && { rateLimit: { enabled: true, interval: 60000, max: 100 } }`. Only applies in dev mode — correct scoping. |
| `.planning/todos/done/2026-03-21-fix-candidate-app-mutation-e2e-tests-ses-email-infrastructure.md` | Archived with resolution note | VERIFIED | File exists in `done/`. Line 36: `## Resolution` section with correct root cause: "Vite dev-mode streaming bug". |
| `.planning/phases/28-validation-gate/28-02-SUMMARY.md` | `requirements-completed: []` in frontmatter | VERIFIED | Line 44: `requirements-completed: []`. Inconsistency resolved. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `candidate-registration.spec.ts` | Strapi admin API | `client.updateCandidate()` PUT `/content-manager/...` | WIRED | Line 121: `await client.updateCandidate(docId, { termsOfUseAccepted: new Date().toJSON() })`. Method is substantive (PUT request, error handling). |
| `candidate-registration.spec.ts` | `http://127.0.0.1:5173/en/candidate` | `about:blank` + `page.goto(buildRoute(...))` | WIRED | Lines 133–134: both `about:blank` and `buildRoute({ route: 'CandAppHome', locale: 'en' })` navigations present. Cookie transfer ensures authentication survives. |
| `candidate-profile.spec.ts` | Strapi admin API + fresh navigation | Same ToU workaround pattern | WIRED | Lines 167–180: identical pattern to registration spec. `savedAuthCookies` caching ensures subsequent serial tests (image upload, info fields, persistence) authenticate without rate-limiter exhaustion. |
| `apps/frontend/src/routes/candidate/` (25 .svelte files) | Zero legacy patterns | grep audit | WIRED | `$:` = 0, `<slot` = 0, `createEventDispatcher` = 0. `on:[a-z]` regex matches only `transition:slide` (Svelte 5 transition, not event directive). No regressions introduced by Plan 03 changes (Plan 03 only touched test files and Strapi config). |
| `apps/strapi/config/plugins.ts` | Strapi `users-permissions` rate limiter | `rateLimit.max: 100` in dev mode | WIRED | isDev-conditional block ensures rate limit only relaxed in development, not production. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| VALD-01 | 28-01-PLAN.md | Zero legacy Svelte 4 patterns (`$:`, `on:event`, `<slot>`, `createEventDispatcher`) in candidate routes | SATISFIED | Live regression check: 0 matches for all 4 patterns. `on:[a-z]` false-positives confirmed as `transition:slide` (Svelte 5). No regressions introduced. |
| VALD-02 | 28-01-PLAN.md | Zero TypeScript errors in candidate app | SATISFIED | Plan 01 SUMMARY: 0 errors. Plan 02 and 03 changes are type-safe (explicit types on `savedAuthCookies` array). |
| VALD-03 | 28-02-PLAN.md, 28-03-PLAN.md | All 5 candidate-app E2E test files pass | SATISFIED (code) | Six-part fix committed in f6b6b139f. SUMMARY claims all 20 mutation-project tests pass. Requires human runtime confirmation. |

**Orphaned requirements:** None. All Phase 28 requirements (VALD-01, VALD-02, VALD-03) are claimed by plans and verified.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `candidate-registration.spec.ts` | 111 | Comment says "Neither page.reload() nor page.goto() resolves this" (slightly inaccurate — the combination of API workaround + cookie transfer + page.goto does resolve it) | Info | Comment may mislead future readers but does not affect test behavior. Not a blocker. |

No blocker or warning anti-patterns. The `page.reload()` occurrences in profile spec (lines 265, 294) are in data-persistence tests that reload the page to verify saved values — correct and expected behavior, not a stub.

---

### Human Verification Required

#### 1. Full Candidate E2E Suite Execution

**Test:** With `yarn dev` running and Playwright browsers installed, execute:
```
npx playwright test -c tests/playwright.config.ts --project=candidate-app --project=candidate-app-mutation --project=candidate-app-settings
```
**Expected:** All 30 candidate tests pass — candidate-auth (4/4), candidate-questions (8/8), candidate-settings (10/10), candidate-registration (3/3), candidate-profile (5/5). Zero failures, zero skips caused by registration failures.
**Why human:** Requires a running Docker stack with populated database and LocalStack SES. Cannot be executed from static code analysis. The code fix is verified and substantive, but test execution can only be confirmed at runtime.

---

### Gaps Summary

No gaps remain at the code level. All three observable truths are verified:

- **VALD-01 (legacy patterns):** Confirmed zero legacy patterns in 25 candidate `.svelte` files. No regressions from Plan 03 changes (Plan 03 only touched test files and Strapi config, not frontend components).
- **VALD-02 (TypeScript):** Zero errors confirmed by Plan 01. Plan 02 and 03 changes are type-safe.
- **VALD-03 (E2E tests):** Six-part fix committed and verified in code. The workaround correctly addresses the three root causes identified during Plan 03 debugging (Vite streaming bug, cookie domain mismatch, auth rate limiter exhaustion). Human runtime execution is the final confirmation step.

The status is `human_needed` rather than `passed` solely because E2E test results cannot be verified from static code analysis. The code-level evidence strongly supports that all tests will pass when run against the Docker stack.

---

_Verified: 2026-03-21T20:05:00Z_
_Verifier: Claude (gsd-verifier)_
_Previous verification: 2026-03-21T18:04:28Z (gaps_found, 2/3)_
