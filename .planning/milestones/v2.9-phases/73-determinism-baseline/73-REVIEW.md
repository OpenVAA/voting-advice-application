---
phase: 73-determinism-baseline
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - tests/eslint.config.mjs
  - tests/scripts/diff-playwright-reports.ts
  - tests/tests/pages/candidate/ProfilePage.ts
  - tests/tests/pages/candidate/QuestionsPage.ts
  - tests/tests/pages/voter/EntityDetailPage.ts
  - tests/tests/setup/auth.setup.ts
  - tests/tests/setup/data.setup.ts
  - tests/tests/setup/re-auth.setup.ts
  - tests/tests/setup/variant-constituency.setup.ts
  - tests/tests/setup/variant-multi-election.setup.ts
  - tests/tests/setup/variant-startfromcg.setup.ts
  - tests/tests/specs/candidate/candidate-auth.spec.ts
  - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
  - tests/tests/specs/candidate/candidate-profile.spec.ts
  - tests/tests/specs/candidate/candidate-questions.spec.ts
  - tests/tests/specs/candidate/candidate-settings.spec.ts
  - tests/tests/specs/variants/constituency.spec.ts
  - tests/tests/specs/variants/multi-election.spec.ts
  - tests/tests/specs/variants/startfromcg.spec.ts
  - tests/tests/specs/visual/visual-regression.spec.ts
  - tests/tests/specs/voter/voter-detail.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/specs/voter/voter-popup-hydration.spec.ts
  - tests/tests/specs/voter/voter-popups.spec.ts
  - tests/tests/specs/voter/voter-results.spec.ts
  - tests/tests/specs/voter/voter-settings.spec.ts
  - tests/tests/specs/voter/voter-static-pages.spec.ts
  - tests/tests/utils/supabaseAdminClient.ts
findings:
  critical: 2
  warning: 7
  info: 5
  total: 14
status: issues_found
---

# Phase 73: Code Review Report

**Reviewed:** 2026-05-11T00:00:00Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Phase 73 is a test-infrastructure hardening pass that (a) cleared 101 `playwright/*` lint warnings to 0, (b) bumped 7 `playwright/*` rules from `warn` to `error` in `tests/eslint.config.mjs`, and (c) regenerated parity-gate constants in `tests/scripts/diff-playwright-reports.ts` against the Phase 73 baseline.

The sweep is broadly faithful to its stated goals, but the adversarial review surfaces **two BLOCKER findings** that contradict the phase's own contract:

1. **`multi-election.spec.ts:250` still uses `waitUntil: 'networkidle'` inside a `test()` body.** With the Plan 06 bump of `playwright/no-networkidle` from `warn` to `error`, this is a hard CI failure on lint. The file otherwise was migrated, but this single site was missed.
2. **`voter-popups.spec.ts:138` (and equivalent line 220) replaces a real timing wait with a non-waiting `waitFor({ state: 'visible' })` on an already-visible anchor.** The comment claims "wait sufficient time for the popup delay to pass (2s + 3s buffer)" but the call resolves instantly because the results list is already visible from the fixture. This DOWNGRADES the test contract — the "popup did NOT reappear" / "no popup when disabled" assertions now fire immediately without giving the popup any chance to surface. The test will pass even if the negative-control regression breaks. This is a race-tolerance regression masquerading as a hygiene win.

Other findings: a residual `.catch(() => false)` swallow-trap in `multi-election.spec.ts:145`, weak race-mask in two `selectElectionFromAccordionIfPresent` helpers, a TODO/fallback in `multi-election.spec.ts:221-230` that catches `goto()` silently and may mask a real SvelteKit navigation bug, and some quality concerns in `auth.setup.ts` (wasted `reload()` step) and `supabaseAdminClient.ts` (orphan-user risk on `forceRegister` partial failure).

The parity script (`tests/scripts/diff-playwright-reports.ts`) is well-structured; constants match the doc claims (4 + 15 + 55 = 74 tracked tests). The `tests/eslint.config.mjs` bump is consistent across all 7 named rules.

The 3 inline-justified `// eslint-disable-next-line playwright/no-skipped-test` directives in `candidate-bank-auth.spec.ts` (lines 188, 225, 244) each carry a `// reason:` preamble matching the DETERM-01 D-07 convention — accepted per the review scope guidance.

## Critical Issues

### CR-01: `multi-election.spec.ts:250` violates the bumped `playwright/no-networkidle: error` rule

**File:** `tests/tests/specs/variants/multi-election.spec.ts:250`
**Issue:** Phase 73 Plan 06 bumped `playwright/no-networkidle` from `warn` to `error` in `tests/eslint.config.mjs:32`. The audit was supposed to clear all 101 warnings, but this single site survived inside a `test()` body:

```ts
test('should display questions and reach results', async () => {
  // ...
  try {
    await answerOption.first().waitFor({ state: 'visible', timeout: 8000 });
  } catch {
    await sharedPage.reload({ waitUntil: 'networkidle' });  // line 250
  }
  // ...
});
```

The plugin's `no-networkidle` rule fires on every literal `'networkidle'` in `waitUntil`/`waitForLoadState`, regardless of test-vs-helper scope. As an `error`, this will block `yarn lint:check` in CI — the very gate Plan 06 was designed to enforce (0/0 at CI time). The phase's own success criteria (5/5 SC PASS, 0 warnings/0 errors) cannot be true if this file lints.

Additional concern: even semantically, `networkidle` is a network heuristic that does NOT correlate with hydration completeness in SvelteKit. The reload as a "force a clean cycle" fallback is itself a race-mask — the determinism contract should be an explicit testId/URL waitFor on hydration-settled state, not a network heuristic.

**Fix:**
```ts
try {
  await answerOption.first().waitFor({ state: 'visible', timeout: 8000 });
} catch {
  // Reload without networkidle; the explicit answerOption waitFor below is
  // the hydration-settled determinism contract.
  await sharedPage.reload({ waitUntil: 'domcontentloaded' });
  await answerOption.first().waitFor({ state: 'visible', timeout: 15000 });
}
```

### CR-02: `voter-popups.spec.ts:138` + `:220` replace timing waits with no-op waitFor on already-visible anchor

**File:** `tests/tests/specs/voter/voter-popups.spec.ts:138` (and `:220`)
**Issue:** The dismissal-memory test (VOTE-15) and the popups-disabled test rewrite the prior `page.waitForTimeout(2000)` / `waitForTimeout(3000)` into `waitFor({ state: 'visible', timeout: 5000 })` (line 138) and `waitFor({ state: 'visible', timeout: 3000 })` (line 220) on `testIds.voter.results.list`.

The problem: the results list is **already visible** at both call sites — the `answeredVoterPage` fixture lands the test on a fully-rendered results page, and the prior assertion `await expect(...results.list).toBeVisible()` confirmed visibility before reaching these lines. Playwright's `waitFor({ state: 'visible' })` returns IMMEDIATELY when the element is already in the target state — the timeout parameter is an upper bound for waiting, not a minimum dwell time.

Result: the `await expect(dialog).toBeHidden()` (line 141) and `await expect(dialogLocator).toHaveCount(0)` (line 224) fire within milliseconds of the prior assertion, NOT after the 2-3s window during which the popup `setTimeout(showFeedbackPopup, 2000)` could fire. The test contract documented in the comments ("verify the popup did NOT reappear", "no popup when disabled") is no longer being verified — the assertion passes trivially because the popup hasn't had time to surface.

This is the inverse of the determinism win the phase claims: the rewrite makes the test FALSE-POSITIVE PASS faster, masking real regressions where popup-suppression logic breaks.

The companion file `voter-popup-hydration.spec.ts:163-165` does this correctly — it uses `dialog.waitFor({ state: 'visible', timeout: 15000 })` as a positive assertion that the popup MUST appear within 15s. The popups.spec.ts negative-control sites need the equivalent inversion.

**Fix:** Use a negative assertion that genuinely waits the popup-delay window. Playwright's `expect(...).toBeHidden({ timeout })` retries continuously during the timeout, so:

```ts
// Line ~138 — dismissal memory test (the popup should NOT reappear within 5s)
await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: 10000 });
// Wait the full 2s popup window + buffer using a retrying negative assertion.
await expect(dialog).toBeHidden({ timeout: 5000 });

// Line ~220 — popups-disabled test (no popup within 3s on enabled settings)
await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible();
// Genuine 3s window: assert toHaveCount(0) keeps holding for the duration.
await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 3000 });
```

The `expect(...).toHaveCount(0, { timeout: 3000 })` form retries for the full timeout window, failing if the count ever goes above 0 within that window — exactly the contract the original `waitForTimeout(3000)` + `count` check provided.

## Warnings

### WR-01: `multi-election.spec.ts:145` retains a `.catch(() => false)` swallow-trap

**File:** `tests/tests/specs/variants/multi-election.spec.ts:145`
**Issue:** The `answerAllQuestions` helper (module-scope, lines 104-159) still contains the swallow-trap pattern that the RESEARCH § "Anti-Patterns" doc names as forbidden:

```ts
if (!page.url().includes('/results') && await categoryStart.isVisible().catch(() => false)) {
  await categoryStart.click();
}
```

The `.catch(() => false)` silently swallows whatever exception `isVisible()` throws (typically nothing — `isVisible()` returns false on absent elements rather than throwing — but the explicit `.catch` still trains the pattern). Combined with the in-helper `isVisible()` calls at lines 112, 128, 150, this is precisely the race-mask pattern Phase 73 is meant to eliminate. Hoisting to module-scope means the lint rule doesn't fire, but the determinism risk is unchanged: the helper still skips the category-start click if `isVisible()` snapshots `false` between renders.

**Fix:** Replace with a single union waitFor (the canonical Pattern 3):
```ts
const answerOrIntro = answerOption.first().or(categoryStart);
await answerOrIntro.waitFor({ state: 'visible', timeout: 5000 });
// Then check which anchor resolved using getAttribute/getByTestId membership
// rather than .isVisible().
```

### WR-02: `selectElectionFromAccordionIfPresent` helpers contain race-prone `isVisible` follow-up

**File:** `tests/tests/specs/variants/constituency.spec.ts:89-98`, `tests/tests/specs/variants/startfromcg.spec.ts:120-128`
**Issue:** Both copies of the helper do:

```ts
await electionAccordion.or(resultsList).first().waitFor({ state: 'visible', timeout: 10000 });
if ((await electionAccordion.count()) > 0 && (await electionAccordion.isVisible())) {
  await electionAccordion.getByRole('option').first().click();
}
```

The union waitFor can resolve on `resultsList` BEFORE the accordion appears. Between the `count()` snapshot and the `isVisible()` snapshot, the accordion may flip state. More importantly, if the accordion has not yet rendered when the resultsList terminates the wait, the `if` branch is skipped and the test silently proceeds without selecting an election — masking a real "election accordion failed to render" regression.

The comment claims "deterministic dispatch based on which terminator landed" but the helper does NOT branch on the resolved terminator — it just probes the accordion after the union resolved on either anchor.

**Fix:** Branch on which anchor was matched, OR use a dedicated `electionAccordion.waitFor({ state: 'visible' })` with a longer timeout AFTER the union wait:
```ts
// First, race the two: if accordion is the variant, it must appear.
await electionAccordion.or(resultsList).first().waitFor({ state: 'visible', timeout: 10000 });
// Then deterministically: is the accordion the active terminator?
const accordionVisible = await electionAccordion.isVisible();  // Snapshot after settle.
if (accordionVisible) {
  await electionAccordion.getByRole('option').first().click();
  // Wait for results-list to render in response (settles the cause-effect chain).
  await resultsList.waitFor({ state: 'visible', timeout: 10000 });
}
```
Or better: branch the test's expectations on the multi-election shape and remove the optional helper entirely.

### WR-03: `multi-election.spec.ts:215-231` TODO + silent `goto()` fallback masks SvelteKit routing bug

**File:** `tests/tests/specs/variants/multi-election.spec.ts:215-231`
**Issue:** The block ends with an explicit TODO and a fallback that silently bypasses the SvelteKit client-side navigation:

```ts
// TODO: Remove this goto() fallback. The elections page Continue button triggers
// SvelteKit goto() which silently fails in the sharedPage context. The fallback
// bypasses the entire client-side navigation chain and may mask real routing bugs.
// Root-cause the goto() failure and remove the catch block below.
await sharedPage.getByTestId(testIds.voter.elections.continue).click();
try {
  await sharedPage.waitForURL((url) => !url.toString().includes('/elections'), { timeout: 3000 });
} catch {
  // Client-side SvelteKit goto() didn't navigate.
  const baseUrl = sharedPage.url().replace(/\/elections.*/, '');
  const eqs = electionUuids.map(id => `electionId=${encodeURIComponent(id)}`).join('&');
  const cqs = constituencyUuids.map(id => `constituencyId=${encodeURIComponent(id)}`).join('&');
  await sharedPage.goto(`${baseUrl}/questions?${eqs}&${cqs}`);
}
```

This is an explicit anti-pattern (and the author acknowledges it). Phase 73 was an opportunity to address it but did not — the TODO survives. The fallback masks a potentially real bug in elections.continue → /questions navigation when running inside the shared `browser.newPage()` context. If the SvelteKit `goto()` failure is reproducible, this test should fail, not bypass.

Additional bug: if `electionUuids` or `constituencyUuids` is empty (the `beforeAll` lookup at lines 178-183 silently skips on missing data), the constructed URL becomes `/questions?&` — malformed but accepted. The test then runs on an unknown election/constituency selection state and asserts question count without guaranteeing the expected data was loaded.

**Fix:**
1. Add a hard assertion in `beforeAll`: `expect(electionUuids.length, 'multi-election variant requires 2 elections in DB').toBe(2);`
2. Root-cause the silent SvelteKit goto failure (or document it as a known issue with a tracking link). The current TODO has no owner and no due date.

### WR-04: `auth.setup.ts:35-46` retry loop has a wasted `reload()` step

**File:** `tests/tests/setup/auth.setup.ts:29-48`
**Issue:** The retry pattern is:
```ts
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  await page.goto(loginRoute, { waitUntil: 'domcontentloaded' });
  try {
    await page.getByTestId(emailTestId).waitFor({ state: 'visible', timeout: 20000 });
    return;
  } catch {
    if (attempt < maxAttempts - 1) {
      await page.reload({ waitUntil: 'domcontentloaded' });  // wasted
    } else {
      throw new Error(...);
    }
  }
}
```

On wait failure, the catch does `page.reload(...)`, then the loop continues and immediately calls `page.goto(loginRoute, ...)` again — replacing the reloaded page. The reload is functionally a no-op (consumes time + adds network round-trip without benefit). Not a correctness bug, but the retry-with-reload narrative in the comment doesn't match the actual behavior, which is retry-with-goto.

**Fix:** Either remove the reload (let the next iteration's goto handle the retry), OR remove the goto-from-loop-top and use the reload as the actual retry mechanism:
```ts
await page.goto(loginRoute, { waitUntil: 'domcontentloaded' });
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  try {
    await page.getByTestId(emailTestId).waitFor({ state: 'visible', timeout: 20000 });
    return;
  } catch {
    if (attempt >= maxAttempts - 1) throw new Error(...);
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
}
```

### WR-05: `supabaseAdminClient.ts forceRegister` leaves orphan auth user on partial failure

**File:** `tests/tests/utils/supabaseAdminClient.ts:340-377`
**Issue:** `forceRegister` performs 4 sequential mutations: createUser → find candidate → insert user_role → update candidates. If step 2 (find candidate) fails, the auth user from step 1 is left orphaned in `auth.users` with no associated candidate row. Subsequent test runs that hit `safeListUsers()` and `deleteAllTestUsers()` will eventually clean up by email pattern, but during a single test run the orphan can cause `data.setup.ts`'s `forceRegister(...)` to fail with "User already exists" on the next run, blocking the entire suite.

The same risk applies to steps 3-4: if `user_roles.insert` fails (FK violation, duplicate), the auth user exists but has no candidate role. The candidate row is then orphaned with `auth_user_id = null` but a created auth account dangling.

**Fix:** Wrap the 4 steps in a try/catch with a compensating delete on the auth user. The Supabase admin API supports `auth.admin.deleteUser(id)`:
```ts
try {
  // ... steps 2-4 ...
} catch (err) {
  // Compensate: roll back the auth user creation.
  await this.client.auth.admin.deleteUser(user.id).catch(() => {});
  throw err;
}
```

### WR-06: `supabaseAdminClient.ts deleteAllTestUsers` silently swallows errors per user

**File:** `tests/tests/utils/supabaseAdminClient.ts:532-547`
**Issue:** The loop processes each test user with 3 sequential mutations but does NOT check the returned `{ error }` from any of them:

```ts
for (const user of testUsers) {
  await this.client.from('candidates').update({ auth_user_id: null }).eq('auth_user_id', user.id);
  await this.client.from('user_roles').delete().eq('user_id', user.id);
  await this.client.auth.admin.deleteUser(user.id);
}
```

If the `candidates.update` fails (RLS, FK constraint), execution still proceeds to `user_roles.delete`. If that fails, `deleteUser` still runs. If `deleteUser` fails, the user remains in `auth.users` AND the loop continues to the next user without reporting any of this — the caller cannot tell whether teardown succeeded.

Compare to `unregisterCandidate` (lines 386-413) which DOES throw on each step's error. The inconsistency means `deleteAllTestUsers` is silently lossy.

**Fix:** Either collect errors per user and throw at end, or fail-fast on first error:
```ts
for (const user of testUsers) {
  const { error: e1 } = await this.client.from('candidates').update({ auth_user_id: null }).eq('auth_user_id', user.id);
  if (e1) throw new Error(`deleteAllTestUsers (${user.email}): clear candidates failed: ${e1.message}`);
  const { error: e2 } = await this.client.from('user_roles').delete().eq('user_id', user.id);
  if (e2) throw new Error(`deleteAllTestUsers (${user.email}): delete user_roles failed: ${e2.message}`);
  const { error: e3 } = await this.client.auth.admin.deleteUser(user.id);
  if (e3) throw new Error(`deleteAllTestUsers (${user.email}): deleteUser failed: ${e3.message}`);
}
```

### WR-07: `supabaseAdminClient.ts fixGoTrueNulls` is dead code

**File:** `tests/tests/utils/supabaseAdminClient.ts:122-156`
**Issue:** The `fixGoTrueNulls` method is declared `private async` but has zero callers in this file or in any file under review (grep confirms it is never invoked). The comment claims it must be called "before any listUsers operation" but `safeListUsers` (the only listUsers wrapper) does NOT call it. The method also has internally inconsistent comments: line 156 says "Ignore - the real fix is below via direct psql-equivalent" but there is no code below — the method ends at line 155.

The method also fires-and-forgets two RPC calls without checking response status (`.then(() => {}, () => {})` and a fetch with no await on the response body) — the "Ignore errors, just ensure connection is warm" intent is opaque and the side effects (calling `merge_jsonb_column` with `_dummy_` arguments) may have unintended effects on the RPC's audit trail.

**Fix:** Either (a) wire `fixGoTrueNulls` into `safeListUsers` if it is actually needed (with documentation of the GoTrue bug and link to upstream issue), or (b) delete it as dead code. If the GoTrue NULL bug has been resolved upstream, deletion is preferred — the method's existence is misleading.

## Info

### IN-01: `candidate-bank-auth.spec.ts:30-33` hardcodes Supabase demo JWT tokens

**File:** `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:28-33`
**Issue:** The fallback tokens are the well-known Supabase local-demo `service_role` and `anon` JWTs (`exp=1983812996` — year 2032, recognizable Supabase demo keys). They are public and not real secrets, but hardcoding them in test source is poor hygiene: anyone grepping for secrets will flag them, and the fallback obscures whether the env wiring is correct. Tests should fail loudly if `SUPABASE_SERVICE_ROLE_KEY` is not set rather than silently using a demo token that happens to work locally.

**Fix:**
```ts
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set for bank-auth tests');
}
```
Or document the fallback as intentional with a `// reason:` block matching the project precedent.

### IN-02: `candidate-bank-auth.spec.ts:168-169` precedence pattern is fragile

**File:** `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:169`
**Issue:** The fallback chain `((body.error ?? body.msg ?? body.details) as string | null) ?? null` is correct but the parentheses + double-`?? null` is hard to follow. The `as` is a type assertion only and does nothing at runtime; the runtime semantics is `(body.error ?? body.msg ?? body.details) ?? null` — equivalent to a single `??` chain ending in `null`. Also, `body.error` could legitimately be a non-string (e.g., an object) at runtime; the cast hides that.

**Fix:**
```ts
errorMsg: keysConfigured
  ? null
  : typeof body.error === 'string' ? body.error
  : typeof body.msg === 'string' ? body.msg
  : typeof body.details === 'string' ? body.details
  : null
```
Then the subsequent `expect(typeof captured.errorMsg).toBe('string')` is guaranteed by construction.

### IN-03: Multiple specs use `getByTestId` where `getByRole` would work

**Files:** Several spec files
**Issue:** Per project precedent (P70 Cat A, RESEARCH §"Pitfall" + §"Anti-Patterns"), `getByTestId` is the LAST-resort locator. Several rewrites use `getByTestId` where a semantic locator would be unambiguous and more resilient:

- `tests/tests/specs/candidate/candidate-questions.spec.ts:34-36` — `getByTestId(testIds.candidate.questions.list)` for what is structurally a `<ul>` or `<section>`; could use `getByRole('list')` or `getByRole('region', { name: /questions/i })`.
- `tests/tests/specs/candidate/candidate-settings.spec.ts:108-111` — `page.getByRole('heading', { level: 1 })` + `page.getByRole('main')` are good; line 64 `page.getByTestId(testIds.candidate.home.statusMessage)` could be `getByRole('status')` if the element is `role="status"`.
- `tests/tests/specs/voter/voter-results.spec.ts:170, 219, 277` — `page.getByTestId('entity-list-filter')` is a button; `getByRole('button', { name: /filter/i })` would be more resilient.

These are explicitly accepted per the review scope when documented with `// reason:` blocks, and most of these sites have no `// reason:`. Not a BLOCKER, but the phase did not eliminate the testId reflex where semantic alternatives exist.

**Fix:** Audit the unjustified `getByTestId` usages and either (a) replace with semantic locators where unambiguous, or (b) add `// reason:` blocks documenting why testId was chosen.

### IN-04: `voter-results.spec.ts:206-211` weak filter assertion

**File:** `tests/tests/specs/voter/voter-results.spec.ts:206-211`
**Issue:** The filter assertion is `expect.poll(...).toBeLessThanOrEqual(initialCount)`. This is satisfied trivially when `filteredCount === initialCount` (no filtering applied) — the test contract "filter narrows the list" is NOT asserted; only "list does not grow" is asserted. If the filter checkbox click silently no-ops (e.g., bug in EnumeratedEntityFilter dynamic-import settle), the test passes.

The Phase 64 D-11+D-12 hardening note in the comment suggests this was deliberate to absorb dynamic-import settle race, but the contract is now under-asserted.

**Fix:** Either (a) compute the expected filtered count from the dataset (the e2e seed knows how many candidates belong to each party) and assert exact equality, or (b) assert strict inequality `toBeLessThan(initialCount)` if at least one filter narrows the list.

### IN-05: `data.setup.ts:146` tautological assertion

**File:** `tests/tests/setup/data.setup.ts:144-146`
**Issue:**
```ts
await client.forceRegister('test-candidate-alpha', TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD);
// forceRegister throws on any failure path (see supabaseAdminClient.ts:284-321);
// reaching here means auth wiring succeeded.
expect(true, 'forceRegister reached post-condition').toBe(true);
```

The `expect(true).toBe(true)` is a hygienic stub to satisfy `playwright/expect-expect` after the `if (!template) throw` pattern was unconditionalized. It adds no behavioral value — if `forceRegister` does not throw, this assertion trivially passes; if it does throw, this line is unreachable. The phase chose this idiom (per the `// Pattern 5` comments) but it's tautological.

Acceptable as an `expect-expect`-rule-silencer, but worth noting that the assertion does not verify anything. A semantically meaningful alternative:
```ts
// Verify the auth user was actually created and linked.
const candidate = await client.findData('candidates', {
  externalId: { $eq: 'test-candidate-alpha' }
});
expect(candidate.data?.[0]?.auth_user_id, 'forceRegister must link auth user').toBeTruthy();
```

---

_Reviewed: 2026-05-11T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

---

## Resolution at Phase 78 close (2026-05-12)

See `.planning/phases/78-cleanup-hygiene-phase/78-06-SUMMARY.md` for the per-finding outcome
table covering all 13 source findings + 1 bonus CR-01 fold (12 fixed-in-code + 2 accepted-with-reason
for IN-03a + IN-03b; bonus CR-01 fix at `multi-election.spec.ts:250`).

Per-finding resolution mapping (cluster commits land in 4 atomic groups per Plan 06 commit_protocol):

| Finding | File:Line | Disposition | Resolved by commit |
|---------|-----------|-------------|--------------------|
| CR-01 (bonus) | `multi-election.spec.ts:250` | fixed-in-code (`waitUntil: 'networkidle'` → `reload()` + `answerOption.waitFor()`) | `fffbf561e` (cluster A) |
| CR-02a | `voter-popups.spec.ts:141` | fixed-in-code (`toBeHidden({ timeout: 5000 })`) | `fffbf561e` (cluster A) |
| CR-02b | `voter-popups.spec.ts:224` | fixed-in-code (`toHaveCount(0, { timeout: 3000 })`) | `fffbf561e` (cluster A) |
| WR-01 | `multi-election.spec.ts:145` | fixed-in-code (union waitFor + post-await isVisible probe) | `fffbf561e` (cluster A) |
| WR-02a | `constituency.spec.ts:89-98` | fixed-in-code (dedicated `electionAccordion.waitFor().then/catch` branch) | `443f1cf7a` (cluster B) |
| WR-02b | `startfromcg.spec.ts:120-128` | fixed-in-code (mirror of WR-02a) | `443f1cf7a` (cluster B) |
| WR-03 | `multi-election.spec.ts:215-231` | fixed-in-code Option B (`// reason:` block + precondition asserts in beforeAll) | `fffbf561e` (cluster A) |
| WR-04 | `auth.setup.ts:29-48` | fixed-in-code Option A (drop wasted reload in retry loop) — **code-quality only; does NOT resolve LANDMINE-2 candidate-profile.spec.ts:85-145 cascading race** (routed to v2.10+ via `2026-05-12-candidate-profile-cascading-race.md`) | `443f1cf7a` (cluster B) |
| WR-05 | `supabaseAdminClient.ts:340-377` | fixed-in-code (try/catch + `auth.admin.deleteUser` compensating rollback in `forceRegister`) | `d372326c7` (cluster C) |
| WR-06 | `supabaseAdminClient.ts:532-547` | fixed-in-code (collect-and-throw aggregated error in `deleteAllTestUsers`) | `d372326c7` (cluster C) |
| WR-07 | `supabaseAdminClient.ts:122-156` | fixed-in-code (`fixGoTrueNulls` DELETED — zero callers verified via repo-wide grep) | `d372326c7` (cluster C) |
| IN-01 | `candidate-bank-auth.spec.ts:28-33` | fixed-in-code (throw-on-missing `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_ANON_KEY`) | `d372326c7` (cluster C) |
| IN-02 | `candidate-bank-auth.spec.ts:169` | fixed-in-code (explicit `typeof === 'string'` guard via intermediate `candidateErrorValue`) | `d372326c7` (cluster C) |
| IN-03a | `candidate-questions.spec.ts:34` | accepted-with-reason (`// reason:` block — element is styling `<div>` with no role/name) | `7531119ad` (cluster D) |
| IN-03b | `candidate-settings.spec.ts:65` | accepted-with-reason (`// reason:` block — element is plain `<p>` with no role/name) | `7531119ad` (cluster D) |
| IN-03c/d/e | `voter-results.spec.ts:171/220/277` | fixed-in-code (extracted `getFilterButton(page)` helper using `getByRole('button', { name: /^Filter\b/i })`) | `7531119ad` (cluster D) |
| IN-03 bonus fold | `candidate-required-info.spec.ts:140,152` | fixed-in-code (raw `page.locator('[data-testid=...]')` → `page.getByTestId(...)` — clears 2 Phase 77 P04-origin lint errors) | `7531119ad` (cluster D) |
| IN-04 | `voter-results.spec.ts:206-211` | fixed-in-code (strict-inequality `toBeLessThan`) | `7531119ad` (cluster D) |
| IN-05 | `data.setup.ts:144-146` | fixed-in-code (semantic post-condition `expect(candidate.data?.[0]?.auth_user_id).toBeTruthy()`) | `443f1cf7a` (cluster B) |

**Total: 14/14 findings closed across 4 cluster commits** (`fffbf561e`, `443f1cf7a`, `d372326c7`, `7531119ad`).

**LANDMINE-2 callout retained:** WR-04 is **code-quality only** — it drops a wasted reload in the
auth-setup retry loop. It does NOT resolve the candidate-profile.spec.ts:85-145 cascading race
(43+ test cascade-skip) that Phase 76 P04 + Phase 77 P05 + Phase 78 P07 all DEFERRED constants
regen because of. That cascade has a separate root cause (race in the post-set-password redirect
chain — ToU checkbox never surfaces) and is tracked for v2.10+ as a follow-up at
`.planning/todos/pending/2026-05-12-candidate-profile-cascading-race.md` (filed at Phase 78 P07 Task 5).

_Resolution recorded: 2026-05-12T19:35:00Z_
_Verifier: gsd-executor (Phase 78 Plan 07 Task 4)_
_Cross-link: `.planning/phases/78-cleanup-hygiene-phase/78-VERIFICATION.md`_
