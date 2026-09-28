---
phase: 79
plan: 02F
type: execute
wave: 2
depends_on:
  - "79-01"
triggered_by: "plan-02-failure-of-d02-time-box"
contingent: true
xor_with:
  - "79-02"
files_modified:
  - tests/tests/setup/register-fresh-candidate.setup.ts
  - tests/playwright.config.ts
  - tests/tests/specs/candidate/candidate-profile.spec.ts
  - .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0.json
  - .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/STATUS.md
autonomous: true
requirements:
  - DETERM-04
tags:
  - determinism
  - e2e
  - restructure
  - playwright
  - fallback

must_haves:
  truths:
    - "This plan ONLY executes if 79-02's D-12 1-run cold-start smoke shows `candidate-profile.spec.ts cascade-skip > 0` AND STATUS.md `## Escalation Flags` contains `RCA pivot-to-restructure trigger: Y` per D-02 time-box"
    - "If 79-02 succeeded (PASS path), this plan is a no-op and the orchestrator skips it"
    - "New setup project `register-fresh-candidate-setup` extracts registration + ToU acceptance steps 1-7 per D-03; mirrors `auth.setup.ts:23-57` retry-tolerance pattern"
    - "`tests/playwright.config.ts` has the new project entry; `candidate-app-mutation` `dependencies` field points at `register-fresh-candidate-setup` (no longer at `candidate-app`)"
    - "`tests/tests/specs/candidate/candidate-profile.spec.ts` has the registration test (lines 87-147) removed; serial-mode keep-vs-remove choice documented in commit"
    - "1-run cold-start smoke (`post-fix/run-0.json`) shows zero cascade-skip for the candidate-profile describe-block-downstream tests"
    - "IMGPROXY_TIED_TITLES collision check passes — the new setup test title MUST NOT match any of the 14 `endsWith` patterns at `regen-constants.mjs:64-78` (per L4)"
  artifacts:
    - path: "tests/tests/setup/register-fresh-candidate.setup.ts"
      provides: "New Playwright setup project for registration + ToU acceptance flow"
      contains: "setup('register fresh candidate via email link', ...) + waitForTouCheckbox 3-attempt retry helper"
    - path: "tests/playwright.config.ts (modified)"
      provides: "New project entry `register-fresh-candidate-setup` inserted between `candidate-app` and `candidate-app-mutation`; `candidate-app-mutation.dependencies` repointed"
    - path: "tests/tests/specs/candidate/candidate-profile.spec.ts (modified)"
      provides: "Registration test removed; helper `loginIfRedirectedToLoginPage` either removed or moved to the setup file; remaining 6 tests use `loginAsCandidate()` unchanged"
    - path: ".planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0.json"
      provides: "1-run cold-start smoke (D-12 confirm) — overwrites the 79-02 FAIL-path attempt; demonstrates restructure path's cascade-elimination"
  key_links:
    - from: "tests/playwright.config.ts new project entry"
      to: "tests/tests/setup/register-fresh-candidate.setup.ts"
      via: "testMatch: /register-fresh-candidate\\.setup\\.ts/, dependencies: ['candidate-app']"
      pattern: "register-fresh-candidate-setup"
    - from: "tests/playwright.config.ts candidate-app-mutation entry"
      to: "register-fresh-candidate-setup (new dependency)"
      via: "dependencies: ['register-fresh-candidate-setup']"
      pattern: "dependencies:\\s*\\[\\s*'register-fresh-candidate-setup'"
    - from: "register-fresh-candidate.setup.ts waitForTouCheckbox helper"
      to: "auth.setup.ts:23-57 waitForLoginForm pattern (canonical retry-tolerance)"
      via: "3-attempt loop with re-navigation + manual login if needed"
      pattern: "for \\(let attempt = 0; attempt < maxAttempts; attempt"
---

<objective>
**Contingent plan — only executes if Plan 02 (79-02) failed the D-02 time-box.** Restructure the registration test out of `candidate-profile.spec.ts`'s serial describe block into a new Playwright setup project (`register-fresh-candidate-setup`) per locked decision D-03. The new setup mirrors `auth.setup.ts:23-57`'s 3-attempt retry-tolerance pattern. The restructure breaks the in-describe-block serial-cascade contract (the dominant cascade propagator) and absorbs intermittent failures via retries.

Purpose: Honor D-01's primary-fix-first contract by only running this restructure when the frontend race fix has been empirically attempted and exhausted (per D-02). Provide a deterministic-exit fallback so v2.10 can complete even if the underlying frontend race is too deep to fix at the application layer.

Output: New setup file `tests/tests/setup/register-fresh-candidate.setup.ts`; amended `tests/playwright.config.ts` (project insertion + dependency repointing); pruned `tests/tests/specs/candidate/candidate-profile.spec.ts` (registration test removed); D-12 1-run cold-start smoke `post-fix/run-0.json` with zero cascade-skip; atomic commit. STATUS.md updated with restructure-path-taken marker.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-CONTEXT.md
@.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-RESEARCH.md
@.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-VALIDATION.md
@.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/rca-traces/RCA-FINDINGS.md
@.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-01-SUMMARY.md
@CLAUDE.md

<interfaces>
<!-- Key code surfaces extracted from HEAD. Executor uses these verbatim. -->

From `tests/tests/setup/auth.setup.ts:23-57` (the canonical retry-tolerance pattern to mirror):
```typescript
async function waitForLoginForm(page: Page, maxAttempts = 3): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await page.goto(buildRoute({ route: 'CandAppLogin', locale: 'en' }), { waitUntil: 'domcontentloaded' });
      const emailInput = page.getByTestId(testIds.candidate.login.email);
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      return;
    } catch (err) {
      if (attempt < maxAttempts - 1) continue;
      throw new Error(`Login form did not load after ${maxAttempts} attempts: ${err}`);
    }
  }
}
```

From `tests/tests/specs/candidate/candidate-profile.spec.ts:87-147` (the registration test to extract):
- All 7 numbered steps (Send email, Poll Inbucket, Extract link, Set password, admin setPassword, race-tolerant URL settle, manual login if redirected, ToU acceptance) — see RESEARCH §"Restructure Fallback Shape" §"File Layout" for the full structural template.

From `tests/tests/specs/candidate/candidate-profile.spec.ts:48-63` (`loginIfRedirectedToLoginPage` helper):
- Move into `register-fresh-candidate.setup.ts` as a file-local helper. The 6 remaining tests in `candidate-profile.spec.ts` use `loginAsCandidate(page)` at lines 152, 171, 185, 208, 245, 271 — they do NOT need `loginIfRedirectedToLoginPage`.

Required playwright.config.ts diff (RESEARCH §"tests/playwright.config.ts Diff"):
Insert NEW project between `candidate-app` (lines 108-118) and `candidate-app-mutation` (lines 121-130):
```typescript
{
  name: 'register-fresh-candidate-setup',
  testMatch: /register-fresh-candidate\.setup\.ts/,
  dependencies: ['candidate-app']
},
```
Amend `candidate-app-mutation` (line 129): `dependencies: ['candidate-app']` → `dependencies: ['register-fresh-candidate-setup']`.

IMGPROXY_TIED_TITLES collision check (RESEARCH §"Constants Regen Execution" Step 2 + L4):
The new setup test title MUST NOT `endsWith('> ' + pattern)` for any of these 14 patterns (verified at `.planning/milestones/v2.9-phases/73-determinism-baseline/post-fix/regen-constants.mjs:64-78`):
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

Recommended setup title: `register fresh candidate via email link` (lowercased; zero collision risk by inspection).

D-12 1-run cold-start smoke chain (RESEARCH §"3-Run Cold-Start Gate Protocol"):
```bash
yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean
yarn workspace @openvaa/frontend dev &
VITE_PID=$!
for i in $(seq 1 60); do curl -fsS -o /dev/null http://localhost:5173/ 2>/dev/null && break; sleep 1; done
yarn test:e2e --workers=1 --reporter=json > .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0.json 2> .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0.stderr.log
kill $VITE_PID
```

Git commit form: `git -c core.hooksPath=/dev/null commit -m '...'` (memory: project_gsd_repo_hook_workaround).
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 0: Trigger gate — verify Plan 02 FAIL-path was reached</name>
  <files>
    .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/STATUS.md
  </files>
  <read_first>
    - .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/STATUS.md (looking for `RCA pivot-to-restructure trigger: Y` flag set by 79-02 Task 3 FAIL path)
    - .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-CONTEXT.md (D-01, D-02 — 79-02F runs ONLY if 79-02 failed)
  </read_first>
  <action>
    Confirm this plan should actually execute. Check STATUS.md for the trigger flag set by 79-02 Task 3 FAIL path: `grep -q "RCA pivot-to-restructure trigger: Y" .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/STATUS.md`.

    - If the flag IS present: proceed to Task 1.
    - If the flag is NOT present (79-02 PASS path landed; orchestrator dispatched 79-02F by mistake): write a STATUS.md note "79-02F triggered without 79-02 failure flag — STOPPING" and exit. Do NOT modify any other files.

    Verify `git status --short apps/` is clean (79-02 FAIL path was supposed to revert via `git checkout -- apps/` before flagging — if dirty, run `git -c core.hooksPath=/dev/null checkout -- apps/` to restore baseline so 79-02F starts from post-Plan-01 commit).

    **W-3 cleanup of 79-02 FAIL-path stale artifacts:** Plan 79-02's FAIL path captures `post-fix/iso-run-{1,2,3}.log` and `post-fix/mutation-project-run.log` but does NOT commit them (FAIL path: no commit). Remove them now so 79-02F's atomic commit (Task 4) starts from a clean post-fix/ tree:
    ```bash
    rm -f .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/iso-run-1.log \
          .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/iso-run-2.log \
          .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/iso-run-3.log \
          .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/mutation-project-run.log
    ```
    (Also `rm -f` any `post-fix/run-0.json`/`run-0.stderr.log`/`run-0-summary.txt` left over from a 79-02 FAIL-path D-12 attempt; 79-02F Task 4 will recapture run-0.json from scratch.)
  </action>
  <verify>
    <automated>grep -q "RCA pivot-to-restructure trigger: Y" .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/STATUS.md &amp;&amp; { git -c core.hooksPath=/dev/null status --short apps/ 2>/dev/null | wc -l | awk '$1 == 0 {exit 0} {exit 1}' || git -c core.hooksPath=/dev/null checkout -- apps/; }</automated>
  </verify>
  <acceptance_criteria>
    - STATUS.md contains `RCA pivot-to-restructure trigger: Y`.
    - `git status --short apps/` is empty.
  </acceptance_criteria>
  <done>Trigger gate confirmed; proceeding to restructure tasks.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 1: Author `register-fresh-candidate.setup.ts` with retry-tolerant waitForTouCheckbox helper</name>
  <files>
    tests/tests/setup/register-fresh-candidate.setup.ts
  </files>
  <read_first>
    - .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-CONTEXT.md (D-03)
    - .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-RESEARCH.md §"Restructure Fallback Shape" §"File Layout" (full template)
    - tests/tests/setup/auth.setup.ts (full file; lines 23-57 are the canonical retry-tolerance pattern)
    - tests/tests/specs/candidate/candidate-profile.spec.ts (lines 1-26 for imports; 48-63 for loginIfRedirectedToLoginPage; 87-147 for the registration test body)
    - tests/tests/utils/emailHelper.ts (verify exports: extractLinkFromHtml, getLatestEmailHtml, toCallbackUrl, countEmailsForRecipient)
    - tests/tests/utils/supabaseAdminClient.ts (verify SupabaseAdminClient export)
    - tests/tests/utils/e2eFixtureRefs.ts (verify E2E_ADDENDUM_CANDIDATES export)
    - tests/tests/utils/testIds.ts (verify testIds.candidate.{terms,login,register,home} paths)
    - tests/tests/utils/route.ts (or wherever buildRoute is exported — verify the canonical helper path)
  </read_first>
  <action>
    Create `tests/tests/setup/register-fresh-candidate.setup.ts` per RESEARCH §"Restructure Fallback Shape" §"File Layout" (template skeleton lives at RESEARCH lines 308-367).

    Structure:
    1. Imports (verbatim from candidate-profile.spec.ts:1-26 adjusted for setup/ directory): `expect`, `test as setup`, `Page`, `extractLinkFromHtml`, `getLatestEmailHtml`, `toCallbackUrl`, `countEmailsForRecipient`, `SupabaseAdminClient`, `E2E_ADDENDUM_CANDIDATES`, `testIds`, `buildRoute`.

    2. File-local `waitForTouCheckbox(page, candidateEmail, candidatePassword, maxAttempts = 3)` helper that mirrors `auth.setup.ts:23-57`'s 3-attempt loop pattern:
       - For attempt in 0..maxAttempts-1, try: `page.getByTestId(testIds.candidate.terms.checkbox).waitFor({ state: 'visible', timeout: 10000 })`; return on success.
       - Catch: if not last attempt, navigate to home; if redirected to login, fill email + password + submit + waitForURL away from login; continue loop.
       - On last attempt failure: throw `new Error(`ToU checkbox did not appear after ${maxAttempts} attempts.`)`.

    3. Setup test block with exact title `register fresh candidate via email link` (lowercased — zero IMGPROXY_TIED_TITLES collision risk per L4).
       Body: `setup.setTimeout(90000)`; instantiate `SupabaseAdminClient`; read candidate email/external_id/password from `E2E_ADDENDUM_CANDIDATES[1]`; execute 6 steps verbatim from candidate-profile.spec.ts:89-146 (Send email, Poll Inbucket, Extract link, Set password, admin setPassword, race-tolerant URL settle + inline login-if-redirected, retry-tolerant ToU checkbox wait via `waitForTouCheckbox()`, verify home reached).

    4. No describe block (setup files use `test as setup` directly). No storageState write (downstream tests in candidate-profile.spec.ts use `loginAsCandidate(page)` which logs in fresh per test).

    Reference template: RESEARCH lines 308-367 in `79-RESEARCH.md`.
  </action>
  <verify>
    <automated>test -f tests/tests/setup/register-fresh-candidate.setup.ts &amp;&amp; grep -q "'register fresh candidate via email link'" tests/tests/setup/register-fresh-candidate.setup.ts &amp;&amp; grep -q "waitForTouCheckbox" tests/tests/setup/register-fresh-candidate.setup.ts &amp;&amp; grep -q "maxAttempts" tests/tests/setup/register-fresh-candidate.setup.ts &amp;&amp; grep -q "testIds.candidate.terms.checkbox" tests/tests/setup/register-fresh-candidate.setup.ts &amp;&amp; grep -q "E2E_ADDENDUM_CANDIDATES" tests/tests/setup/register-fresh-candidate.setup.ts &amp;&amp; grep -q "SupabaseAdminClient" tests/tests/setup/register-fresh-candidate.setup.ts</automated>
  </verify>
  <acceptance_criteria>
    - File exists at the path.
    - Test title is exactly `'register fresh candidate via email link'` (single-quoted, lowercased).
    - File contains `waitForTouCheckbox` (helper name) AND `maxAttempts` (loop var).
    - File references `testIds.candidate.terms.checkbox`, `E2E_ADDENDUM_CANDIDATES`, `SupabaseAdminClient`.
    - IMGPROXY collision check: `grep -F "should upload a profile image (CAND-03)" tests/tests/setup/register-fresh-candidate.setup.ts` returns 0 (the title MUST NOT contain any of the 14 patterns from regen-constants.mjs:64-78 via copy-paste error).
  </acceptance_criteria>
  <done>New setup file in place with retry-tolerant ToU checkbox wait, mirroring auth.setup.ts pattern.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Amend `tests/playwright.config.ts` — insert project + repoint candidate-app-mutation</name>
  <files>
    tests/playwright.config.ts
  </files>
  <read_first>
    - tests/playwright.config.ts (full file; project chain at lines 99-164)
    - .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-RESEARCH.md §"tests/playwright.config.ts Diff"
  </read_first>
  <action>
    Apply two edits to `tests/playwright.config.ts`:

    Edit 1 — Insert new project entry between `candidate-app` (currently ending line 118 with `dependencies: ['auth-setup']`) and `candidate-app-mutation` (currently starting line 121):
    ```typescript
    // 4a-bis. Register fresh candidate: extracts registration + ToU acceptance
    //         from candidate-profile.spec.ts:87-147 (Phase 79 Plan 02F per
    //         CONTEXT D-03 restructure path; resolves the in-describe-block
    //         serial-cascade by isolating registration in a retry-tolerant
    //         setup project).
    {
      name: 'register-fresh-candidate-setup',
      testMatch: /register-fresh-candidate\.setup\.ts/,
      dependencies: ['candidate-app']
    },
    ```

    Edit 2 — Amend `candidate-app-mutation` entry (current line 129 `dependencies: ['candidate-app']`): change to `dependencies: ['register-fresh-candidate-setup']`. Leave all other fields (name, testDir, testMatch, use) unchanged.

    Leave downstream chain (re-auth-setup, candidate-app-settings, candidate-app-password) entirely unchanged.

    Final chain shape (commented documentation in code optional but recommended):
    ```
    data-setup → auth-setup → candidate-app → register-fresh-candidate-setup → candidate-app-mutation → re-auth-setup → candidate-app-settings → candidate-app-password
    ```
  </action>
  <verify>
    <automated>grep -q "register-fresh-candidate-setup" tests/playwright.config.ts &amp;&amp; grep -q "testMatch.*register-fresh-candidate" tests/playwright.config.ts &amp;&amp; awk "/name: 'candidate-app-mutation'/,/^\s*\},?$/" tests/playwright.config.ts | grep -q "dependencies:.*'register-fresh-candidate-setup'"</automated>
  </verify>
  <acceptance_criteria>
    - `tests/playwright.config.ts` contains the string `register-fresh-candidate-setup` (the new project name) at least 2 times (definition + dependency reference).
    - `tests/playwright.config.ts` contains the regex `testMatch.*register-fresh-candidate` (the new project's testMatch).
    - Within the `candidate-app-mutation` project block, `dependencies:` array contains `'register-fresh-candidate-setup'` (NOT `'candidate-app'`).
    - File still parses as valid TypeScript (`npx tsc --noEmit --allowImportingTsExtensions tests/playwright.config.ts 2>&1 | grep -F "playwright.config.ts"` returns empty OR exits 0).
  </acceptance_criteria>
  <done>Playwright config has the new setup project; candidate-app-mutation dependency repointed.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Prune `candidate-profile.spec.ts` — remove registration test + helper</name>
  <files>
    tests/tests/specs/candidate/candidate-profile.spec.ts
  </files>
  <read_first>
    - tests/tests/specs/candidate/candidate-profile.spec.ts (full file; specifically lines 48-63 helper, 65-66 serial mode config, 87-147 registration test, 149-294 remaining 6 tests)
    - .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-RESEARCH.md §"candidate-profile.spec.ts Diff" + §"Downstream Test Adjustments"
  </read_first>
  <action>
    Edit `tests/tests/specs/candidate/candidate-profile.spec.ts`:

    1. **Delete lines 87-147 (the registration test):** the entire `test('should register the fresh candidate via email link', async ({ page }) => { ... })` block, including all 8 steps and the trailing `});`.

    2. **Delete lines 48-63 (the `loginIfRedirectedToLoginPage` module-level helper):** this helper is now inlined inside the setup file's registration flow. The remaining 6 tests use `loginAsCandidate(page)` (lines 78-85) which does NOT need this helper.

    3. **Decide on `serial` mode (line 66 `test.describe.configure({ mode: 'serial' })`):** Per RESEARCH §"candidate-profile.spec.ts Diff" §"Lines 65-66 Recommendation": REMOVE `serial` mode. The remaining 6 tests in the describe block all call `loginAsCandidate(page)` at their top (lines 152, 171, 185, 208, 245, 271 in the original file — line numbers shift after deletion); they are FULLY INDEPENDENT post-restructure. Removing `serial` allows Playwright to parallelize.
       Concretely: delete line 66 (`test.describe.configure({ mode: 'serial' });`).
       Document choice in commit message.

    4. **Keep `loginAsCandidate` helper (lines 78-85):** unchanged; used by the remaining 6 tests.

    5. **Keep the rest of the describe block (line 65 + lines 149-294):** the 6 tests remain unchanged.

    Imports: scan the trimmed file for unused imports after deletion (e.g., `extractLinkFromHtml`, `getLatestEmailHtml`, `toCallbackUrl`, `countEmailsForRecipient`, `SupabaseAdminClient`, `E2E_ADDENDUM_CANDIDATES`, `testIds.candidate.register.*`, `testIds.candidate.terms.checkbox`, `testIds.candidate.home.statusMessage` may now be unused at file scope IF not used by the 6 remaining tests). Remove unused imports to keep ESLint clean. Specifically, the imports that supported ONLY the deleted registration test (email helpers + admin client + register testIds + terms checkbox testId) can likely be removed; keep imports used by the 6 remaining tests.

    Run TypeScript / ESLint check on the file to confirm clean diff:
    ```
    yarn workspace @openvaa/tests lint:check tests/tests/specs/candidate/candidate-profile.spec.ts 2>&1 | tail -20
    # OR if there's no per-workspace lint, use root:
    yarn lint:check 2>&1 | grep candidate-profile.spec.ts || echo "clean"
    ```
  </action>
  <verify>
    <automated>! grep -q "should register the fresh candidate via email link" tests/tests/specs/candidate/candidate-profile.spec.ts &amp;&amp; ! grep -q "loginIfRedirectedToLoginPage" tests/tests/specs/candidate/candidate-profile.spec.ts &amp;&amp; ! grep -q "test.describe.configure({ mode: 'serial' })" tests/tests/specs/candidate/candidate-profile.spec.ts &amp;&amp; grep -q "loginAsCandidate" tests/tests/specs/candidate/candidate-profile.spec.ts</automated>
  </verify>
  <acceptance_criteria>
    - File does NOT contain the substring `should register the fresh candidate via email link` (registration test removed).
    - File does NOT contain `loginIfRedirectedToLoginPage` (helper removed).
    - File does NOT contain `test.describe.configure({ mode: 'serial' })` (serial mode removed per RESEARCH recommendation).
    - File DOES contain `loginAsCandidate` (the remaining 6 tests' login helper).
    - File compiles cleanly: `yarn lint:check` does not flag this file (no unused-import warnings; no syntax errors).
  </acceptance_criteria>
  <done>Spec file pruned; registration extracted to setup project; serial mode removed; 6 remaining tests intact.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 4: D-12 1-run cold-start smoke + atomic commit</name>
  <files>
    .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0.json,
    .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0.stderr.log,
    .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0-summary.txt,
    .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/STATUS.md
  </files>
  <read_first>
    - .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-CONTEXT.md (D-12 1-run smoke; D-13 cold-start chain; D-14 imgproxy 502 recovery)
    - .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-RESEARCH.md §"3-Run Cold-Start Gate Protocol" §"Per-Run Cold-Start Chain" + §"imgproxy 502 Detection + Recovery"
    - CLAUDE.md §"Seeding local data" (LANDMINE-9 mandatory)
  </read_first>
  <action>
    Execute the D-12 1-run cold-start smoke. Long-running (~54 min); use `Bash(run_in_background=true)` with timeout 4500000 ms.

    Pre-flight: `yarn db:status` (expect healthy); `lsof -ti:5173 | xargs kill -9 2>/dev/null || true` (kill any stray Vite).

    The chain (verbatim per RESEARCH §"Per-Run Cold-Start Chain" but for run-0):
    ```bash
    set -euo pipefail
    cd /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
    yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean
    yarn workspace @openvaa/frontend dev > /tmp/vite-run-0.log 2>&1 &
    VITE_PID=$!
    for i in $(seq 1 60); do
      if curl -fsS -o /dev/null http://localhost:5173/ 2>/dev/null; then echo "Vite ready after ${i}s"; break; fi
      sleep 1
    done
    yarn test:e2e --workers=1 --reporter=json \
      > .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0.json \
      2> .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0.stderr.log
    kill $VITE_PID 2>/dev/null || true; wait $VITE_PID 2>/dev/null || true
    ```

    D-14 imgproxy 502 recovery (scan stderr, retry up to 2× per RESEARCH §"imgproxy 502 Detection + Recovery"). Same as 79-02 Task 3.

    Extract summary into `post-fix/run-0-summary.txt` using the same node script as 79-02 Task 3 (walks the JSON, counts pass / fail / skipped, computes `candidate-profile.spec.ts cascade-skip` metric).

    Inspect summary:
    - **If `candidate-profile.spec.ts cascade-skip: 0`:** restructure SUCCESS. Atomic commit.
    - **If > 0:** restructure FAILED to break the cascade. This is a deep determinism issue — escalate via STATUS.md: write `## Escalation Flags` entry `Restructure path also failed — operator decision needed`; do NOT commit; STOP. (At this point both D-01 primary AND D-03 fallback are exhausted; the operator must decide whether to widen scope, defer DETERM-04, or pursue a deeper investigation in a new phase.)

    On SUCCESS path, atomic commit:
    ```bash
    git add \
      tests/tests/setup/register-fresh-candidate.setup.ts \
      tests/playwright.config.ts \
      tests/tests/specs/candidate/candidate-profile.spec.ts \
      .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0.json \
      .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0.stderr.log \
      .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0-summary.txt \
      .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/STATUS.md

    git -c core.hooksPath=/dev/null commit -m "$(cat <<'EOF'
    refactor(79-02F): DETERM-04 — restructure registration to setup project

    Plan 02-fallback (79-02F) triggered per CONTEXT D-02 time-box: 79-02
    frontend-fix attempt did not resolve the cold-start cascade. Per D-03,
    extracted the registration + ToU acceptance flow (candidate-profile.spec.ts:87-147)
    into a new Playwright setup project `register-fresh-candidate-setup`
    that mirrors auth.setup.ts's 3-attempt retry-tolerance pattern.

    Changes:
    - NEW: tests/tests/setup/register-fresh-candidate.setup.ts (~80 LOC)
    - MOD: tests/playwright.config.ts (insert new project; repoint candidate-app-mutation dependency)
    - MOD: tests/tests/specs/candidate/candidate-profile.spec.ts (remove registration test + helper; remove serial-mode config)

    Verification:
    - D-12 1-run cold-start smoke: 0 candidate-profile.spec.ts cascade-skip (run-0.json + run-0-summary.txt)
    - IMGPROXY_TIED_TITLES collision check: new title 'register fresh candidate via email link' does NOT match any of 14 patterns (per RESEARCH L4 audit)

    Unblocks: Plan 03 (DETERM-05 3-run gate + constants regen). Note: the
    Plan 03 regen will see the new test title in run-3.json; the IMGPROXY
    audit (D-10) re-verifies zero collisions.

    Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
    EOF
    )"
    ```

    STATUS.md update:
    - DETERM-04 §: Plan 02 DONE-FAILED @ <prev-sha>; Plan 02-fallback DONE @ <new-sha>; 1-run cold-start smoke PASS
    - Clear the `## Escalation Flags` entry `RCA pivot-to-restructure trigger: Y` (it served its purpose)
    - Run Log §: append `Plan 02F Task 4 — restructure complete; D-12 cold-start smoke PASS @ <new-sha>`
  </action>
  <verify>
    <automated>test -f .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0.json &amp;&amp; test -f .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0-summary.txt &amp;&amp; CASCADE=$(grep -E "^candidate-profile.spec.ts cascade-skip" .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0-summary.txt | grep -oE "[0-9]+$") &amp;&amp; { [ "${CASCADE:-1}" = "0" ] &amp;&amp; git -c core.hooksPath=/dev/null log -1 --pretty=format:"%s" | grep -q "79-02F"; } || grep -q "Restructure path also failed" .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/STATUS.md</automated>
  </verify>
  <acceptance_criteria>
    - `run-0.json` exists (well-formed JSON).
    - `run-0-summary.txt` exists with the `candidate-profile.spec.ts cascade-skip` metric line.
    - EITHER: cascade-skip is 0 AND most recent commit subject contains `79-02F` (SUCCESS: restructure committed, Plan 03 unblocked).
    - OR: cascade-skip > 0 AND STATUS.md contains `Restructure path also failed` (deep-failure path — operator escalation required).
    - NEVER: cascade-skip > 0 AND a Plan 02F commit lands.
  </acceptance_criteria>
  <done>D-12 cold-start smoke captured. SUCCESS path: restructure committed; Plan 03 unblocked. DEEP-FAIL path: STATUS.md escalation; operator decision required.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Test infrastructure (Playwright project chain) ↔ application source | The restructure operates entirely within the test-infrastructure tier. No application source changes; auth/session/access-control surfaces untouched. |
| Setup project ↔ admin Supabase client | The new setup file instantiates `SupabaseAdminClient` (uses service-role key to invite users + set passwords). Same client + same usage pattern as the existing registration test it replaces. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-79-02F-01 | Information Disclosure | `register-fresh-candidate.setup.ts` uses `SupabaseAdminClient` with service-role credentials | accept | The admin client was already used by the original `candidate-profile.spec.ts:68` instantiation. Restructure preserves the exact same usage pattern + same credentials source (env vars loaded by the test harness; no new secrets, no new env-var dependencies). Risk: unchanged from baseline. Test-environment only — production credentials are never accessed. |
| T-79-02F-02 | Tampering | New setup project skips access-control gates (registration writes are server-side via Supabase invite + admin setPassword) | accept | The original registration test follows the exact same flow; restructure preserves the trust contract. No new bypass surface introduced. |
| T-79-02F-03 | Denial of Service | Retry loop in `waitForTouCheckbox` could mask a deterministic underlying race | mitigate | The retry loop is bounded at `maxAttempts = 3` per `auth.setup.ts:23-57` canonical pattern. After 3 attempts, the setup throws — Playwright marks the setup project failed, which cascades to downstream projects (same cascade contract as before, just shifted one level up). The retry-tolerance is intended ONLY for intermittent flakes; deterministic races still surface as setup failures. |
| T-79-02F-04 | Information Disclosure | IMGPROXY_TIED_TITLES collision — if the new setup title accidentally matches one of the 14 patterns, the parity-script DATA_RACE pool grows in Phase 79 Plan 03 regen, masking real determinism issues | mitigate | Recommended title `register fresh candidate via email link` was manually audited (RESEARCH §"Constants Regen Execution" Step 2) against all 14 patterns — zero collision. Task 1's acceptance grep also includes a counter-check (`! grep -F "should upload a profile image (CAND-03)" register-fresh-candidate.setup.ts`). Plan 03's regen-constants.mjs `endsWith()` match-count assertion (lines 84-95) fires LOUDLY on collision — double check. |
</threat_model>

<verification>
- 79-02F SUCCESS path: commit lands with the new setup file, amended config, pruned spec, run-0 capture with `candidate-profile.spec.ts cascade-skip: 0`.
- 79-02F DEEP-FAIL path: no commit; STATUS.md `## Escalation Flags` entry `Restructure path also failed — operator decision needed`; operator must intervene before Plan 03 proceeds.
- IMGPROXY collision check passes (the new setup title `register fresh candidate via email link` is not one of the 14 patterns).
- Plan 03's regen will re-run the IMGPROXY_TIED_TITLES audit against the new title (D-10 commit shape requirement).
</verification>

<success_criteria>
The candidate-profile cascading race no longer cascade-skips downstream tests in a cold-start cycle — via test-infrastructure restructure rather than frontend-application fix. `post-fix/run-0-summary.txt` shows `candidate-profile.spec.ts cascade-skip: 0`. New setup project `register-fresh-candidate-setup` is integrated into the Playwright project dependency chain. Spec file pruned; serial-mode removed; 6 remaining tests run independently and use `loginAsCandidate()`. Plan 03 (3-run gate) is unblocked.
</success_criteria>

<output>
After completion, create `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/79-02F-SUMMARY.md` per the GSD summary template, including: trigger reason (which 79-02 attempts exhausted), the cascade-skip count from run-0-summary.txt (must be 0), the new setup project name + dependency chain shape, IMGPROXY collision audit result, and the commit SHA.
</output>
