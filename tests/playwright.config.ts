import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { TESTS_DIR } from './tests/utils/testsDir';

dotenv.config();

export const STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/user.json');

/**
 * Playwright configuration with project dependencies pattern.
 *
 * Projects execute in dependency order:
 *   data-setup -> auth-setup -> candidate-app -> candidate-app-mutation -> re-auth-setup
 *     -> candidate-app-settings
 *   data-setup -> voter-app (read-only specs)
 *   data-setup -> voter-app-settings -> voter-app-popups (settings-mutating specs)
 *   (data-teardown runs after all projects complete)
 *
 * Configuration variant projects run sequentially AFTER the default suite:
 *   [candidate-app-settings, voter-app-popups] -> data-setup-multi-election -> variant-multi-election
 *     -> variant-results-sections -> data-setup-constituency -> variant-constituency
 *     -> data-setup-startfromcg -> variant-startfromcg
 *   (data-teardown-variants runs after all variant setups complete)
 *
 * Phase 89 Plan LAST retired the candidate-app-password project (its lone
 * spec candidate-password.spec.ts was deleted; coverage absorbed by
 * candidate-mega-journey.spec.ts). The variant-multi-election chain was
 * rerouted to anchor on candidate-app-settings — the new last surviving
 * candidate project — preserving the sequencing constraint that variants
 * run AFTER the default candidate-app suite completes.
 *
 * Candidate specs are split into three groups (post-89-LAST):
 *   - candidate-app: translation (sequential — fullyParallel:false prevents
 *     concurrent server requests that race on the Supabase session layer)
 *   - candidate-app-mutation: profile (creates users via invite)
 *   - candidate-app-settings: settings residual (mutates global app settings
 *     like hideHero/answersLocked — must run alone)
 *
 * Voter specs are split into three groups:
 *   - voter-app: core journey, results, detail, static-pages (parallel-safe — read-only settings)
 *   - voter-app-settings: settings spec (mutates global app settings — must run alone)
 *   - voter-app-popups: popups spec (mutates global app settings — must run alone, after settings)
 *
 * See https://playwright.dev/docs/test-global-setup-teardown
 */
export default defineConfig({
  testDir: TESTS_DIR,
  testIgnore: ['**/*.test.ts'],
  outputDir: path.join(TESTS_DIR, '../playwright-results'),

  /* Screenshot baselines stored alongside specs in a git-trackable directory */
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{ext}',

  /* Per-test timeout — 90s ceiling required for full-suite render-pressured fixtures.
   * Plan 64-04 Task 6 bumped voter.fixture.ts internal waitForURL budgets to 30s, but the
   * per-test wrapper timeout was the binding constraint: under --workers=1 full-suite
   * contention the answer-loop + post-loop waitForURL exceeded 30s and timed out at
   * voter.fixture.ts:85. Path A continuation per .planning/phases/64-voter-results-reactivity-completion/64-03-RECAPTURE-NOTES.md. */
  timeout: 90000,

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry tests on CI */
  retries: process.env.CI ? 3 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 6,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { outputFolder: path.join(TESTS_DIR, '../playwright-report') }]],

  /* Default visual comparison thresholds for toHaveScreenshot */
  expect: {
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixelRatio: 0.01
    }
  },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace for all tests. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',

    baseURL: process.env.FRONTEND_PORT ? `http://localhost:${process.env.FRONTEND_PORT}` : 'http://localhost:5173'
  },

  projects: [
    // === Legacy default + candidate-app + voter-app + variant chains ===
    //
    // The entire pre-Phase-88 e2e chain is gated behind `PLAYWRIGHT_LEGACY=1`.
    // Operator is mid-refactor of these test projects (2026-05-26); by default
    // `yarn test:e2e` runs ONLY the mega-journey chain + the perm-* family.
    // Re-enable the legacy chain with:
    //
    //   PLAYWRIGHT_LEGACY=1 npx playwright test -c tests/playwright.config.ts
    //
    // When refactor is complete, this gate is removed and the relevant
    // projects are kept or retired per the refactor outcome.
    ...(process.env.PLAYWRIGHT_LEGACY
      ? [
    // 1. Data setup - imports test dataset via Supabase Admin Client
    {
      name: 'data-setup',
      testMatch: /data\.setup\.ts/,
      teardown: 'data-teardown'
    },

    // 2. Data teardown - cleans up after all tests complete
    {
      name: 'data-teardown',
      testMatch: /data\.teardown\.ts/
    },

    // 3. Auth setup - logs in as candidate, saves storageState (depends on data being loaded)
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      dependencies: ['data-setup']
    },

    // 4a. Candidate app: translation (sequential to prevent concurrent
    //     server requests that race on Supabase session/DataWriter singletons).
    //     Phase 89 Plan LAST: candidate-auth.spec.ts + candidate-questions.spec.ts
    //     deleted (coverage absorbed by candidate-mega-journey.spec.ts).
    //     Only candidate-translation.spec.ts remains in this project.
    {
      name: 'candidate-app',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-translation\.spec\.ts/,
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['auth-setup']
    },

    // 4b. Candidate app: registration + profile (create users via invite)
    //
    // Phase 86.1 post-fix: `candidate-profile-validation.spec.ts` was lifted
    // OUT of this testMatch into the dedicated `candidate-app-validation`
    // project below. profile-validation logs in as Alpha (TEST_CANDIDATE_*)
    // while registration + profile use fresh E2E_ADDENDUM_CANDIDATES[0]/[1].
    // Running Alpha-login under the same project's parallel mode raced
    // against the sibling specs' Supabase admin calls (inviteUserByEmail +
    // forceRegister on neighbouring rows), occasionally landing the Alpha
    // post-login redirect at `/login` again. Splitting into a sequential
    // dependent project removes the contention entirely.
    //
    // Phase 86.1 post-fix #2: `fullyParallel: false` — registration and
    // profile both perform Supabase admin mutations (inviteUserByEmail,
    // forceRegister, ToU-flag updates) on overlapping candidate rows.
    // Running candidate-registration.spec.ts and candidate-profile.spec.ts
    // in parallel produced an order-of-operations race where the password-
    // reset flow's `complete-registration` step would observe
    // `terms_of_use_accepted IS NULL` for an addendum candidate that the
    // profile spec had just unset (or hadn't yet set), then fail the
    // password-reset gate. Serialising the spec files within this project
    // eliminates the race without forcing the broader candidate chain into
    // single-worker mode.
    // Phase 89 Plan LAST: candidate-registration.spec.ts deleted (coverage
    // absorbed by candidate-mega-journey.spec.ts). Only candidate-profile.spec.ts
    // remains in this project. The fullyParallel:false setting is preserved
    // for future-proofing — adding a second mutation spec back to this
    // project would re-introduce the race documented above.
    {
      name: 'candidate-app-mutation',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-profile\.spec\.ts/,
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['candidate-app']
    },

    // 4b.1 Candidate app: profile-validation (Alpha-login, A11Y-01 cells).
    //      Sequential after candidate-app-mutation to avoid the Alpha-session
    //      race documented above. fullyParallel:false so the 6 IMAGE_CELLS +
    //      TEXT_CELLS tests within the file serialise as well — the
    //      Playwright filechooser actor on macOS Chromium is non-deterministic
    //      across parallel filechooser invocations (see the spec's `Phase 76
    //      P01 Task 4 smoke discovery` doc-comment).
    //
    //      MUST run before `candidate-app-settings` — settings flips global
    //      `app_settings.maintenanceMode` which disables the login form,
    //      breaking Alpha-login inside validation. Sequencing is enforced
    //      from the settings side (line: `candidate-app-settings.dependencies
    //      ⊇ ['candidate-app-validation']`) so we don't have to add a
    //      symmetric dep here.
    {
      name: 'candidate-app-validation',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-profile-validation\.spec\.ts/,
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['candidate-app-mutation']
    },

    // 4b2. Re-auth: mutation tests (password reset) invalidate the alpha
    //      candidate's refresh token, so re-authenticate before settings/password tests.
    //
    //      Phase 84 DETERM-08: repointed from 'candidate-app-mutation' to
    //      'candidate-app' to break the imgproxy-502-cascade chain. The original
    //      'candidate-app-mutation' dependency was a SEQUENCING constraint (run
    //      AFTER mutation), not a data-flow dependency — candidate-app-mutation
    //      tests use the FRESH E2E_ADDENDUM_CANDIDATES[1] candidate (see
    //      candidate-profile.spec.ts:84-86), NOT Alpha. Repointing to
    //      'candidate-app' preserves the data-flow contract (re-auth-setup needs
    //      data-setup + auth-setup to have run, which 'candidate-app' transitively
    //      depends on) while breaking the cascade-skip on mutation failures.
    //      Verified via 84-RCA-FINDINGS.md: 11 candidate-app-settings tests + the
    //      dual-project re-auth.setup.ts entries cold-start fetch zero
    //      /storage/v1/* URLs; their imgproxy-tie is purely cascade-chain, not
    //      initial-paint or prefetch.
    {
      name: 're-auth-setup',
      testMatch: /re-auth\.setup\.ts/,
      dependencies: ['candidate-app']
    },

    // 4c. Candidate app: settings (mutates global app settings — must run alone)
    //     Runs before password tests since those revoke the session token again
    //
    //     Phase 86.1 post-fix: ALSO sequential after `candidate-app-validation`.
    //     Without this dep, validation and settings ran in parallel (both
    //     transitively depend on `candidate-app` but had no direct ordering),
    //     so settings would flip `app_settings.maintenanceMode = true` mid-run
    //     and disable the login submit button for validation's Alpha-login
    //     (`<button disabled data-testid="login-submit">` in the failure trace).
    {
      name: 'candidate-app-settings',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-settings\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['re-auth-setup', 'candidate-app-validation']
    },

    // 4d. RETIRED — Phase 89 Plan LAST.
    //     The former `candidate-app-password` project ran candidate-password.spec.ts
    //     which has been deleted (coverage absorbed by candidate-mega-journey.spec.ts
    //     steps 7-9: forgot-password reset via Inbucket + wrong-password rejection
    //     + new-password login). The dependency anchor for variant-multi-election
    //     has been rerouted to `candidate-app-settings` — the new last surviving
    //     candidate project.

    // 5a. Voter app: core journey, results, detail, static-pages (parallel-safe — read-only settings)
    {
      name: 'voter-app',
      testDir: './tests/specs/voter',
      // Phase 86 DETERM-14: voter-visibility-required was authored ONLY for the
      // `variant-hidden-required-voter` project (variant overlay required to
      // hide `test-voter-q-8`); the spec's negative-presence assertion correctly
      // fails when the overlay does not apply. Excluded here so the spec runs
      // ONLY in `variant-hidden-required-voter`. See §3.7 of 86-RESEARCH.md.
      //
      // Phase 86.1 post-fix: voter-not-located-redirect requires a 2-elections
      // × multi-constituency seed (otherwise getImpliedElectionIds auto-implies
      // and the spec's `/elections?next=…` → `/constituencies?next=…` bounce
      // chain is short-circuited to a direct /results landing). Moved to the
      // `voter-not-located-redirect` project below which reuses the Ne-Nc
      // dataset (2 elections × 3 constituencies each).
      // Phase 88 Plan 01 — `mega-journey` alternation excludes
      // voter-mega-journey.spec.ts (runs under its own data-setup-baseV1
      // chain). The alternation also excludes any future spec named
      // voter-mega-*.spec.ts — keep this in mind when adding sibling
      // mega-journey variants in 88-NN.
      testIgnore: /voter-(settings|popups|visibility-required|not-located-redirect|mega-journey)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome']
      },
      dependencies: ['data-setup']
    },

    // 5b. Voter app: settings (mutates global app settings — must run alone)
    //     Depends on data-setup only (not voter-app) so that pre-existing failures
    //     in read-only voter specs don't block settings verification.
    {
      name: 'voter-app-settings',
      testDir: './tests/specs/voter',
      testMatch: /voter-settings\.spec\.ts/,
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome']
      },
      dependencies: ['data-setup']
    },

    // 5c. Voter app: popups (mutates global app settings — must run alone, after settings)
    //     Depends on voter-app-settings to ensure sequential execution of
    //     settings-mutating specs (Playwright runs files in parallel across workers
    //     even with fullyParallel:false, so separate projects enforce ordering).
    {
      name: 'voter-app-popups',
      testDir: './tests/specs/voter',
      testMatch: /voter-popups\.spec\.ts/,
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome']
      },
      dependencies: ['voter-app-settings']
    },

    // === Configuration Variant Projects ===
    // Variant projects run sequentially AFTER the default suite completes.
    // Each variant has its own dataset loaded by a dedicated setup project.
    // All variant setups share a single teardown project.

    // Shared teardown for all variant projects
    {
      name: 'data-teardown-variants',
      testMatch: /variant-data\.teardown\.ts/
    },

    // Variant: multi-election (CONF-01, CONF-02, CONF-04)
    //
    // PHASE 85 DETERM-11 STRUCTURAL DECOUPLING (2026-05-14):
    //   `voter-app-popups` removed from dependencies. The voter-popups dismissal-
    //   after-reload deterministic FAIL (strict-mode locator violation on the
    //   close button — 3/3 across Phase 84 anchor `04ddfdd85cf…`) was the single
    //   root cause of all 44 variant cascade-skips per `85-RCA-FINDINGS.md`. The
    //   popup test itself is OUT-OF-SCOPE for Phase 85 (D-08 binding — Phase 86
    //   retains DETERM-12 ownership). Severing the dependency structurally
    //   collapses the 47 → ≤5 CASCADE pool without touching the popup test.
    //
    //   PRECEDENT: Phase 84 made the identical structural maneuver on the
    //   re-auth-setup project's dependency at lines 148-152 (commit 93050e4fb).
    //
    //   The remaining `['candidate-app-settings']` dependency (rerouted from
    //   `candidate-app-password` by Phase 89 Plan LAST after that project was
    //   retired) preserves the sequencing constraint that variants run AFTER
    //   the default candidate-app suite completes (so auth.users state +
    //   storageState are stable). `candidate-app-settings` is the new last
    //   surviving candidate project.
    {
      name: 'data-setup-multi-election',
      testMatch: /variant-multi-election\.setup\.ts/,
      teardown: 'data-teardown-variants',
      dependencies: ['candidate-app-settings']
    },
    {
      name: 'variant-multi-election',
      testDir: './tests/specs/variants',
      testMatch: /multi-election\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-multi-election']
    },

    // Variant: results sections (CONF-05, CONF-06) — uses the multi-election
    // dataset.
    //
    // Phase 86.1 post-fix: re-seeded BEFORE running, via a dedicated data
    // setup project (`data-setup-results-sections`) instead of re-using the
    // already-tainted dataset that variant-multi-election leaves behind. The
    // 3-elections-in-modal failure mode (precondition-asserted at
    // `results-sections.spec.ts:144-157`) was reproducing intermittently even
    // though `variant-multi-election` doesn't insert any election rows — the
    // dedicated re-seed eliminates the ambiguity by guaranteeing exactly two
    // elections (test-election-1 + test-election-2) at the moment
    // variant-results-sections's beforeAll begins. Chain remains strictly
    // sequential: data-setup-multi-election → variant-multi-election →
    // data-setup-results-sections → variant-results-sections →
    // data-setup-constituency (the next variant).
    {
      name: 'data-setup-results-sections',
      // Re-uses the same setup test as data-setup-multi-election (matches the
      // same file path) — each project runs the setup independently in its
      // own worker. The setup's first action is `runTeardown('test-', client)`
      // which atomically clears any leftover test-prefixed rows before
      // re-seeding the canonical 2-election shape.
      testMatch: /variant-multi-election\.setup\.ts/,
      teardown: 'data-teardown-variants',
      dependencies: ['variant-multi-election']
    },
    {
      name: 'variant-results-sections',
      testDir: './tests/specs/variants',
      testMatch: /results-sections\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-results-sections']
    },

    // Variant: constituency (CONF-03)
    {
      name: 'data-setup-constituency',
      testMatch: /variant-constituency\.setup\.ts/,
      teardown: 'data-teardown-variants',
      dependencies: ['variant-results-sections'] // Sequential: wait for previous variant to finish
    },
    {
      name: 'variant-constituency',
      testDir: './tests/specs/variants',
      testMatch: /constituency\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-constituency']
    },

    // Variant: startFromConstituencyGroup
    {
      name: 'data-setup-startfromcg',
      testMatch: /variant-startfromcg\.setup\.ts/,
      teardown: 'data-teardown-variants',
      dependencies: ['variant-constituency'] // Sequential: wait for previous variant
    },
    {
      name: 'variant-startfromcg',
      testDir: './tests/specs/variants',
      testMatch: /startfromcg\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-startfromcg']
    },

    // Variant: low-minimum-answers (Phase 74 E2E-02 — browse-without-match)
    {
      name: 'data-setup-low-minimum-answers',
      testMatch: /variant-low-minimum-answers\.setup\.ts/,
      teardown: 'data-teardown-variants',
      dependencies: ['variant-startfromcg'] // Sequential: wait for previous variant (Pitfall 5)
    },
    {
      name: 'variant-low-minimum-answers',
      // E2E-02 spec lives under specs/voter/, not specs/variants/ (CONTEXT D-13)
      testDir: './tests/specs/voter',
      testMatch: /voter-browse-without-match\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-low-minimum-answers']
    },

    // Variant: 1e-Nc (Phase 74 E2E-04 cell 2 — 1 election × 3 constituencies)
    {
      name: 'data-setup-1e-Nc',
      testMatch: /variant-1e-Nc\.setup\.ts/,
      teardown: 'data-teardown-variants',
      dependencies: ['variant-low-minimum-answers'] // Sequential: wait for previous variant (Pitfall 5)
    },
    {
      name: 'variant-1e-Nc',
      testDir: './tests/specs/variants',
      testMatch: /1e-Nc\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-1e-Nc']
    },

    // Variant: Ne-Nc (Phase 74 E2E-04 cell 4 — 2 elections × 3 constituencies each;
    // cross-bleed-free constituency dropdown filtering is the strongest matrix contract)
    {
      name: 'data-setup-Ne-Nc',
      testMatch: /variant-Ne-Nc\.setup\.ts/,
      teardown: 'data-teardown-variants',
      dependencies: ['variant-1e-Nc'] // Sequential: wait for previous variant (Pitfall 5)
    },
    {
      name: 'variant-Ne-Nc',
      testDir: './tests/specs/variants',
      testMatch: /Ne-Nc\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-Ne-Nc']
    },

    // Phase 86.1 post-fix: voter-not-located-redirect (CLEAN-02) reuses the
    // Ne-Nc dataset (2 elections × 3 constituencies). Inserted into the
    // sequential variant chain BETWEEN variant-Ne-Nc and data-setup-allowopen
    // so the next variant's teardown+seed does not clobber the Ne-Nc dataset
    // while these tests are still running (LANDMINE-6).
    //
    // Was previously bound to the default `voter-app` project, which uses the
    // base single-election e2e seed — that auto-implies election+constituency
    // and short-circuits the spec's `?next=` bounce chain, producing direct
    // /results landings. See the spec's doc-comment for the dataset contract.
    {
      name: 'voter-not-located-redirect',
      testDir: './tests/specs/voter',
      testMatch: /voter-not-located-redirect\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['variant-Ne-Nc']
    },

    // Variant: allowopen (Phase 77 SETTINGS-02 — display-side reframing per LANDMINE-1)
    {
      name: 'data-setup-allowopen',
      testMatch: /variant-allowopen\.setup\.ts/,
      teardown: 'data-teardown-variants',
      dependencies: ['voter-not-located-redirect'] // Sequential: wait for previous variant (LANDMINE-6)
    },
    {
      name: 'variant-allowopen',
      testDir: './tests/specs/voter',
      testMatch: /voter-allowopen\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-allowopen']
    },

    // Variant: hidden+required (Phase 77 SETTINGS-03 — visibility filter + required-info enforcement;
    // voter-required cell is PRODUCT-GAP per LANDMINE-3, captured as follow-up todo)
    {
      name: 'data-setup-hidden-required',
      testMatch: /variant-hidden-required\.setup\.ts/,
      teardown: 'data-teardown-variants',
      dependencies: ['variant-allowopen'] // Sequential: wait for previous variant (LANDMINE-6)
    },
    {
      // Voter-hidden cell — walks /questions and asserts the hidden question
      // is absent from the DOM (voterContext filter at
      // voterContext.svelte.ts:215-230). Voter routes only — no candidate
      // auth dependency.
      name: 'variant-hidden-required-voter',
      testDir: './tests/specs/voter',
      testMatch: /voter-visibility-required\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-hidden-required']
    }
    // RETIRED — Phase 89 Plan LAST. The former `variant-hidden-required-candidate`
    // project ran candidate-required-info.spec.ts (the candidate-required cell of
    // SETTINGS-03), which has been deleted (coverage absorbed by candidate-mega-
    // journey.spec.ts steps 12-14: required-badge gate + partial-submit-stays-on-
    // home + complete-fill-advances-to-questions). The remaining
    // `variant-hidden-required-voter` project still consumes
    // `data-setup-hidden-required`, so that setup project STAYS.
        ]
      : []),

    // === Opt-in Specialized Projects ===
    // These projects are gated by environment variables and excluded from
    // the default `yarn test:e2e` run. Enable via:
    //   PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --project=visual-regression
    //   PLAYWRIGHT_PERF=1 npx playwright test -c tests/playwright.config.ts --project=performance

    // Visual regression: screenshot comparison for key pages
    ...(process.env.PLAYWRIGHT_VISUAL
      ? [
          {
            name: 'visual-regression',
            testDir: './tests/specs/visual',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['data-setup', 'auth-setup']
          }
        ]
      : []),

    // Performance budgets: page load timing assertions
    ...(process.env.PLAYWRIGHT_PERF
      ? [
          {
            name: 'performance',
            testDir: './tests/specs/perf',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['data-setup']
          }
        ]
      : []),

    // Accessibility smoke: WCAG 2.1 AA scan via @axe-core/playwright (Phase 76 A11Y-03)
    //   PLAYWRIGHT_A11Y=1 npx playwright test -c tests/playwright.config.ts --project=a11y-smoke
    ...(process.env.PLAYWRIGHT_A11Y
      ? [
          {
            name: 'a11y-smoke',
            testDir: './tests/specs/a11y',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['data-setup']
          }
        ]
      : []),

    // Bank auth (Idura/Signicat): identity-callback Edge Function integration
    //   PLAYWRIGHT_BANK_AUTH=1 npx playwright test -c tests/playwright.config.ts --project=bank-auth
    ...(process.env.PLAYWRIGHT_BANK_AUTH
      ? [
          {
            name: 'bank-auth',
            testDir: './tests/specs/candidate',
            testMatch: /candidate-bank-auth\.spec\.ts/,
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['data-setup']
          }
        ]
      : []),

    // === Phase 88 Plan 01 — mega-journey chain (ISOLATED) ===
    //
    // Appended AFTER all conditional opt-in projects (per Plan 88-01
    // advisory A2). Runs the new baseV1 dataset + voter-mega-journey spec
    // ALONGSIDE the existing suite. Existing project entries are untouched
    // except for the surgical `testIgnore` extension on `voter-app` above
    // (Risk #6 + Plan Task 5 documented exception).
    //
    // Project graph (isolated — no cross-chain dependency):
    //   data-setup-baseV1 → voter-mega-journey
    //   data-setup-baseV1 ↦ data-teardown-baseV1 (via teardown: key)
    //
    // Shared PREFIX='test-' caveat (Plan Risk #4): running the
    // voter-mega-journey project AT THE SAME TIME as the existing e2e
    // chain (e.g. via a no-filter `yarn test:e2e` invocation under
    // default workers) can race on the shared row prefix. Operator
    // intent for 88-01 is to run the mega-journey chain IN ISOLATION
    // via `--project=voter-mega-journey`. A future 88-NN plan
    // decouples the prefixes (`'test-baseV1-'` vs `'test-e2e-'`) so
    // both chains can co-run safely.
    {
      name: 'data-setup-baseV1',
      testMatch: /baseV1\.setup\.ts/,
      teardown: 'data-teardown-baseV1',
      // Anchor the mega-journey chain AFTER the 88-03 perm-* family
      // finishes — perm-not-located-2e2cg is the last spec in that chain.
      // perm-*'s extraTeardownPrefix: ['test-', 'e2e-perm-'] would wipe
      // baseV1 data if they ran in parallel; ordering perm-* first makes
      // every perm spec see only its own e2e-perm-* data, and the final
      // perm teardown leaves a clean DB for baseV1 to seed against.
      dependencies: ['perm-not-located-2e2cg']
    },
    {
      name: 'data-teardown-baseV1',
      testMatch: /baseV1\.teardown\.ts/
    },
    {
      name: 'voter-mega-journey',
      testDir: './tests/specs/voter',
      testMatch: /voter-mega-journey\.spec\.ts/,
      fullyParallel: false, // single-test serial journey
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-baseV1']
    },

    // === Phase 88 Plan 03 — voter permutations chains ===
    //
    // Per 88-03-SCOPE.md post-plan-check resolutions (lines 8-21):
    //   - HIGH-1: specs live under tests/tests/specs/perm/ (NEW directory);
    //     voter-app testIgnore needs NO extension because that project's
    //     testDir is `./tests/specs/voter` — perm specs are categorically
    //     outside its discovery surface.
    //   - HIGH-2: perm-* setups chain SEQUENTIALLY within the perm-* family
    //     to prevent app_settings singleton clobbering. The FIRST perm setup
    //     (data-setup-perm-1e1cg1co) has NO dependencies array — preserves
    //     "no cross-chain dependency to non-perm chains" (the perm-* family
    //     runs in parallel with the existing default + variant + mega-journey
    //     chains).
    //   - Each chain teardowns ITS OWN test-perm-<short>- prefix
    //     (parallel-only contract honored within the family).
    //
    // Sequential chain across the family:
    //   data-setup-perm-1e1cg1co (FIRST — no deps)
    //   → data-setup-perm-2e-shared
    //   → data-setup-perm-2e-asymmetric
    //   → data-setup-perm-startfromcg
    //   → data-setup-perm-disjoint-1co
    //   → data-setup-perm-disable-election-1co
    //   → data-setup-perm-disable-election-2co
    //   → data-setup-perm-not-located-2e2cg

    // Variant 1: perm-1e1cg1co (1 test) — FIRST in chain, no upstream perm dep
    {
      name: 'data-setup-perm-1e1cg1co',
      testMatch: /perm-1e1cg1co\.setup\.ts/,
      teardown: 'data-teardown-perm-1e1cg1co'
      // No upstream dep — perm-* runs FIRST in default mode. The legacy
      // chain (PLAYWRIGHT_LEGACY=1) and the baseV1/mega-journey chain run
      // AFTER perm-* finishes (baseV1 anchors on perm-not-located-2e2cg).
      // This decouples perm-* from any pre-existing failures in
      // mega-journey or the legacy suite while the operator refactors them.
    },
    {
      name: 'data-teardown-perm-1e1cg1co',
      testMatch: /perm-1e1cg1co\.teardown\.ts/
    },
    {
      name: 'perm-1e1cg1co',
      testDir: './tests/specs/perm',
      testMatch: /perm-1e1cg1co\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-1e1cg1co']
    },

    // Variant 2: perm-2e-shared (2 tests) — sequential after perm-1e1cg1co (HIGH-2)
    {
      name: 'data-setup-perm-2e-shared',
      testMatch: /perm-2e-shared\.setup\.ts/,
      teardown: 'data-teardown-perm-2e-shared',
      // Depends on the previous chain's SPEC project (not its setup), so the
      // previous chain's spec finishes before this setup seeds. Playwright
      // forbids setups depending on teardown projects directly, so this is
      // the strictest ordering we can declare. Cross-chain row isolation is
      // enforced inside `setupFromTemplate` via `extraTeardownPrefix:
      // 'test-perm-'` (clears the whole family before seeding this template),
      // so we don't depend on the previous chain's teardown actually finishing
      // before this setup runs. Confirmed via Gate A 2026-05-26.
      dependencies: ['perm-1e1cg1co']
    },
    {
      name: 'data-teardown-perm-2e-shared',
      testMatch: /perm-2e-shared\.teardown\.ts/
    },
    {
      name: 'perm-2e-shared',
      testDir: './tests/specs/perm',
      testMatch: /perm-2e-shared\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-2e-shared']
    },

    // Variant 3: perm-2e-asymmetric (1 test) — sequential after perm-2e-shared
    {
      name: 'data-setup-perm-2e-asymmetric',
      testMatch: /perm-2e-asymmetric\.setup\.ts/,
      teardown: 'data-teardown-perm-2e-asymmetric',
      // Depends on previous SPEC — see data-setup-perm-2e-shared comment above (cross-chain isolation enforced via extraTeardownPrefix in setupFromTemplate).
      dependencies: ['perm-2e-shared']
    },
    {
      name: 'data-teardown-perm-2e-asymmetric',
      testMatch: /perm-2e-asymmetric\.teardown\.ts/
    },
    {
      name: 'perm-2e-asymmetric',
      testDir: './tests/specs/perm',
      testMatch: /perm-2e-asymmetric\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-2e-asymmetric']
    },

    // Variant 4: perm-startfromcg (2 tests) — sequential after perm-2e-asymmetric
    {
      name: 'data-setup-perm-startfromcg',
      testMatch: /perm-startfromcg\.setup\.ts/,
      teardown: 'data-teardown-perm-startfromcg',
      // Depends on previous SPEC — see data-setup-perm-2e-shared comment above (cross-chain isolation enforced via extraTeardownPrefix in setupFromTemplate).
      dependencies: ['perm-2e-asymmetric']
    },
    {
      name: 'data-teardown-perm-startfromcg',
      testMatch: /perm-startfromcg\.teardown\.ts/
    },
    {
      name: 'perm-startfromcg',
      testDir: './tests/specs/perm',
      testMatch: /perm-startfromcg\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-startfromcg']
    },

    // Variant 5: perm-disjoint-1co (2 tests) — sequential after perm-startfromcg
    {
      name: 'data-setup-perm-disjoint-1co',
      testMatch: /perm-disjoint-1co\.setup\.ts/,
      teardown: 'data-teardown-perm-disjoint-1co',
      // Depends on previous SPEC — see data-setup-perm-2e-shared comment above (cross-chain isolation enforced via extraTeardownPrefix in setupFromTemplate).
      dependencies: ['perm-startfromcg']
    },
    {
      name: 'data-teardown-perm-disjoint-1co',
      testMatch: /perm-disjoint-1co\.teardown\.ts/
    },
    {
      name: 'perm-disjoint-1co',
      testDir: './tests/specs/perm',
      testMatch: /perm-disjoint-1co\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disjoint-1co']
    },

    // Variant 6: perm-disable-election-1co (1 test) — sequential after perm-disjoint-1co
    {
      name: 'data-setup-perm-disable-election-1co',
      testMatch: /perm-disable-election-1co\.setup\.ts/,
      teardown: 'data-teardown-perm-disable-election-1co',
      // Depends on previous SPEC — see data-setup-perm-2e-shared comment above (cross-chain isolation enforced via extraTeardownPrefix in setupFromTemplate).
      dependencies: ['perm-disjoint-1co']
    },
    {
      name: 'data-teardown-perm-disable-election-1co',
      testMatch: /perm-disable-election-1co\.teardown\.ts/
    },
    {
      name: 'perm-disable-election-1co',
      testDir: './tests/specs/perm',
      testMatch: /perm-disable-election-1co\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disable-election-1co']
    },

    // Variant 7: perm-disable-election-2co (1 test) — sequential after perm-disable-election-1co
    {
      name: 'data-setup-perm-disable-election-2co',
      testMatch: /perm-disable-election-2co\.setup\.ts/,
      teardown: 'data-teardown-perm-disable-election-2co',
      // Depends on previous SPEC — see data-setup-perm-2e-shared comment above (cross-chain isolation enforced via extraTeardownPrefix in setupFromTemplate).
      dependencies: ['perm-disable-election-1co']
    },
    {
      name: 'data-teardown-perm-disable-election-2co',
      testMatch: /perm-disable-election-2co\.teardown\.ts/
    },
    {
      name: 'perm-disable-election-2co',
      testDir: './tests/specs/perm',
      testMatch: /perm-disable-election-2co\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disable-election-2co']
    },

    // Variant 8: perm-not-located-2e2cg (5 tests) — sequential after perm-disable-election-2co
    {
      name: 'data-setup-perm-not-located-2e2cg',
      testMatch: /perm-not-located-2e2cg\.setup\.ts/,
      teardown: 'data-teardown-perm-not-located-2e2cg',
      // Depends on previous SPEC — see data-setup-perm-2e-shared comment above (cross-chain isolation enforced via extraTeardownPrefix in setupFromTemplate).
      dependencies: ['perm-disable-election-2co']
    },
    {
      name: 'data-teardown-perm-not-located-2e2cg',
      testMatch: /perm-not-located-2e2cg\.teardown\.ts/
    },
    {
      name: 'perm-not-located-2e2cg',
      testDir: './tests/specs/perm',
      testMatch: /perm-not-located-2e2cg\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-not-located-2e2cg']
    },

    // === Phase 89 Plan 03 — candidate mega-journey chain ===
    //
    // REFACTORED 2026-05-31 to break the voter-mega-journey cascade-skip.
    //
    // BEFORE: `data-setup-candidate-mega.dependencies = ['voter-mega-
    // journey']` enforced strict ordering because the setup re-seeded
    // baseV1 via `runTeardown('test-')` which would race with voter-mega-
    // journey's reads. Any voter-mega-journey failure cascade-skipped
    // candidate-mega-journey + the entire 89-04 + 91 perm-* family.
    //
    // AFTER: candidate-mega-setup no longer re-seeds (see
    // tests/tests/setup/candidate-mega.setup.ts). The chain consumes the
    // baseV1 data already seeded by `data-setup-baseV1` and runs as a
    // PARALLEL LEAF alongside voter-mega-journey. Neither cascade-skips
    // the other on spec failure. Their teardowns are independent:
    // baseV1.teardown owns the 'test-' row prefix; candidate-mega.teardown
    // owns only the auth.users row created by the spec's registration step.
    //
    // The setup still guarantees a clean auth.users row for
    // UNREGISTERED_CANDIDATE_EMAIL via idempotent `unregisterCandidate`,
    // so the registration-via-email step lands deterministically.
    //
    // Spec project sets `storageState: { cookies: [], origins: [] }` to
    // start UNAUTHENTICATED — required for the registration-via-email
    // flow (per R13 + candidate-registration.spec.ts:22 precedent).
    {
      name: 'data-setup-candidate-mega',
      testMatch: /candidate-mega\.setup\.ts/,
      teardown: 'data-teardown-candidate-mega',
      dependencies: ['data-setup-baseV1']
    },
    {
      name: 'data-teardown-candidate-mega',
      testMatch: /candidate-mega\.teardown\.ts/
    },
    {
      name: 'candidate-mega-journey',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-mega-journey\.spec\.ts/,
      fullyParallel: false, // single-test serial journey
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] }
      },
      dependencies: ['data-setup-candidate-mega']
    },

    // === Phase 89 Plan 04 — 3 settings-permutation chains (TIR4-PERM-01..03) ===
    //
    // Sequenced AFTER candidate-mega-journey via dependencies on the
    // candidate-mega-journey spec project, and chained sequentially among
    // themselves (perm-disable-voter-app → perm-disable-candidate-app →
    // perm-per-app-notifications) per 88-03 perm-* family precedent.
    //
    // Parallel-safety: each perm template uses a distinct externalIdPrefix
    // ('e2e-perm-novapp-', 'e2e-perm-nocand-', 'e2e-perm-notif-') per D-89-03,
    // and each setup passes `extraTeardownPrefix: ['test-', 'e2e-perm-']`
    // to pre-clear any residual rows from prior chains still mid-teardown.

    // Variant 1: perm-disable-voter-app (1 test) — sequential after candidate-mega-journey
    {
      name: 'data-setup-perm-disable-voter-app',
      testMatch: /perm-disable-voter-app\.setup\.ts/,
      teardown: 'data-teardown-perm-disable-voter-app',
      dependencies: ['candidate-mega-journey']
    },
    {
      name: 'data-teardown-perm-disable-voter-app',
      testMatch: /perm-disable-voter-app\.teardown\.ts/
    },
    {
      name: 'perm-disable-voter-app',
      testDir: './tests/specs/perm',
      testMatch: /perm-disable-voter-app\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disable-voter-app']
    },

    // Variant 2: perm-disable-candidate-app (1 test) — sequential after perm-disable-voter-app
    {
      name: 'data-setup-perm-disable-candidate-app',
      testMatch: /perm-disable-candidate-app\.setup\.ts/,
      teardown: 'data-teardown-perm-disable-candidate-app',
      dependencies: ['perm-disable-voter-app']
    },
    {
      name: 'data-teardown-perm-disable-candidate-app',
      testMatch: /perm-disable-candidate-app\.teardown\.ts/
    },
    {
      name: 'perm-disable-candidate-app',
      testDir: './tests/specs/perm',
      testMatch: /perm-disable-candidate-app\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disable-candidate-app']
    },

    // Variant 3: perm-per-app-notifications (2 tests) — sequential after perm-disable-candidate-app
    {
      name: 'data-setup-perm-per-app-notifications',
      testMatch: /perm-per-app-notifications\.setup\.ts/,
      teardown: 'data-teardown-perm-per-app-notifications',
      dependencies: ['perm-disable-candidate-app']
    },
    {
      name: 'data-teardown-perm-per-app-notifications',
      testMatch: /perm-per-app-notifications\.teardown\.ts/
    },
    {
      name: 'perm-per-app-notifications',
      testDir: './tests/specs/perm',
      testMatch: /perm-per-app-notifications\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-per-app-notifications']
    },

    // Phase 90 Plan 02: perm-missing-nominations (1 test) — TIR5:15-26
    // Sequential after perm-per-app-notifications per the HIGH-2 perm-*
    // sequential invariant (lines 653-660 — app_settings singleton clobbering
    // risk forces sequential chains within the perm family).
    {
      name: 'data-setup-perm-missing-nominations',
      testMatch: /perm-missing-nominations\.setup\.ts/,
      teardown: 'data-teardown-perm-missing-nominations',
      dependencies: ['perm-per-app-notifications']
    },
    {
      name: 'data-teardown-perm-missing-nominations',
      testMatch: /perm-missing-nominations\.teardown\.ts/
    },
    {
      name: 'perm-missing-nominations',
      testDir: './tests/specs/perm',
      testMatch: /perm-missing-nominations\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-missing-nominations']
    },

    // Phase 90 Plan 04: perm-localisation-positive (1 test) — TIR5:52-95.
    // Operates against the 3-locale staticSettings base (en/fi/sv) directly —
    // no runtime override. Sequential after perm-missing-nominations per the
    // HIGH-2 perm-* sequential invariant (lines 653-660 — app_settings
    // singleton clobbering risk forces sequential chains within the perm
    // family).
    {
      name: 'data-setup-perm-localisation-positive',
      testMatch: /perm-localisation-positive\.setup\.ts/,
      teardown: 'data-teardown-perm-localisation-positive',
      dependencies: ['perm-missing-nominations']
    },
    {
      name: 'data-teardown-perm-localisation-positive',
      testMatch: /perm-localisation-positive\.teardown\.ts/
    },
    {
      name: 'perm-localisation-positive',
      testDir: './tests/specs/perm',
      testMatch: /perm-localisation-positive\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-localisation-positive']
    },

    // ===================================================================
    // Phase 91 Plan 02 — 9 new TIR6 Group A settings-permutation chains
    // (D-91-PD-05). 27 new project entries (9 setup + 9 spec + 9 teardown)
    // anchored on perm-localisation-positive per the HIGH-2 invariant
    // (app_settings JSONB singleton clobbering — see RESEARCH §"Playwright
    // Project Chain" + lines 988-991). Sequential chain — no parallel
    // execution within the perm-* family.
    //
    // Chain order:
    //   perm-localisation-positive → perm-answers-locked → perm-hide-hero
    //     → perm-header-show-feedback → perm-header-show-help
    //     → perm-hide-all-nominations → perm-hide-if-missing-answers
    //     → perm-hide-election-tags → perm-hide-category-tags
    //     → perm-disable-allow-open (END)
    // ===================================================================

    // A1 — perm-answers-locked (TIR6:3-14). FULL 3-surface coverage per
    // 91-CONTEXT.md Group A item 1. A1 setup mints a per-perm storage
    // state via real forceRegister + UI login (D-91-PD-06 revised; Phase
    // 91-05 CR-01 closure) consumed by the authenticated sub-tests in
    // perm-answers-locked.spec.ts.
    {
      name: 'data-setup-perm-answers-locked',
      testMatch: /perm-answers-locked\.setup\.ts/,
      teardown: 'data-teardown-perm-answers-locked',
      dependencies: ['perm-localisation-positive']
    },
    {
      name: 'data-teardown-perm-answers-locked',
      testMatch: /perm-answers-locked\.teardown\.ts/
    },
    {
      name: 'perm-answers-locked',
      testDir: './tests/specs/perm',
      testMatch: /perm-answers-locked\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-answers-locked']
    },

    // A2 — perm-hide-hero (TIR6:24-32). Authenticated candidate via
    // real forceRegister + UI login (D-91-PD-06 revised; Phase 91-05
    // CR-01 closure).
    {
      name: 'data-setup-perm-hide-hero',
      testMatch: /perm-hide-hero\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-hero',
      dependencies: ['perm-answers-locked']
    },
    {
      name: 'data-teardown-perm-hide-hero',
      testMatch: /perm-hide-hero\.teardown\.ts/
    },
    {
      name: 'perm-hide-hero',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-hero\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-hero']
    },

    // A3 — perm-header-show-feedback (TIR6:68-77). Unauthenticated voter
    // intro + Banner header-feedback assertion + feedback-form open.
    {
      name: 'data-setup-perm-header-show-feedback',
      testMatch: /perm-header-show-feedback\.setup\.ts/,
      teardown: 'data-teardown-perm-header-show-feedback',
      dependencies: ['perm-hide-hero']
    },
    {
      name: 'data-teardown-perm-header-show-feedback',
      testMatch: /perm-header-show-feedback\.teardown\.ts/
    },
    {
      name: 'perm-header-show-feedback',
      testDir: './tests/specs/perm',
      testMatch: /perm-header-show-feedback\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-header-show-feedback']
    },

    // A4 — perm-header-show-help (TIR6:79-88). Unauthenticated voter
    // intro + Banner header-help button + /en/about URL assertion.
    {
      name: 'data-setup-perm-header-show-help',
      testMatch: /perm-header-show-help\.setup\.ts/,
      teardown: 'data-teardown-perm-header-show-help',
      dependencies: ['perm-header-show-feedback']
    },
    {
      name: 'data-teardown-perm-header-show-help',
      testMatch: /perm-header-show-help\.teardown\.ts/
    },
    {
      name: 'perm-header-show-help',
      testDir: './tests/specs/perm',
      testMatch: /perm-header-show-help\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-header-show-help']
    },

    // A5 — perm-hide-all-nominations (TIR6:90-93). Unauthenticated; spec
    // asserts on 307 redirect from /en/nominations to /en (Pitfall 5).
    {
      name: 'data-setup-perm-hide-all-nominations',
      testMatch: /perm-hide-all-nominations\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-all-nominations',
      dependencies: ['perm-header-show-help']
    },
    {
      name: 'data-teardown-perm-hide-all-nominations',
      testMatch: /perm-hide-all-nominations\.teardown\.ts/
    },
    {
      name: 'perm-hide-all-nominations',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-all-nominations\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-all-nominations']
    },

    // A6 — perm-hide-if-missing-answers (TIR6:95-102). Voter walk asserts
    // ONLY on candidate visibility per Pitfall 6 (no org count assertion).
    {
      name: 'data-setup-perm-hide-if-missing-answers',
      testMatch: /perm-hide-if-missing-answers\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-if-missing-answers',
      dependencies: ['perm-hide-all-nominations']
    },
    {
      name: 'data-teardown-perm-hide-if-missing-answers',
      testMatch: /perm-hide-if-missing-answers\.teardown\.ts/
    },
    {
      name: 'perm-hide-if-missing-answers',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-if-missing-answers\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-if-missing-answers']
    },

    // A7 — perm-hide-election-tags (TIR6:104-108). Voter walk → /questions
    // asserts absence of election-tag testid.
    {
      name: 'data-setup-perm-hide-election-tags',
      testMatch: /perm-hide-election-tags\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-election-tags',
      dependencies: ['perm-hide-if-missing-answers']
    },
    {
      name: 'data-teardown-perm-hide-election-tags',
      testMatch: /perm-hide-election-tags\.teardown\.ts/
    },
    {
      name: 'perm-hide-election-tags',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-election-tags\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-election-tags']
    },

    // A8 — perm-hide-category-tags (TIR6:111-115). Voter walk → /questions
    // asserts absence of category-tag testid.
    {
      name: 'data-setup-perm-hide-category-tags',
      testMatch: /perm-hide-category-tags\.setup\.ts/,
      teardown: 'data-teardown-perm-hide-category-tags',
      dependencies: ['perm-hide-election-tags']
    },
    {
      name: 'data-teardown-perm-hide-category-tags',
      testMatch: /perm-hide-category-tags\.teardown\.ts/
    },
    {
      name: 'perm-hide-category-tags',
      testDir: './tests/specs/perm',
      testMatch: /perm-hide-category-tags\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-hide-category-tags']
    },

    // A9 — perm-disable-allow-open (TIR6:121-142). Two describe blocks per
    // D-91-PD-04 + D-91-PD-06: candidate-side authenticated (via storage
    // state minted in setup) + voter-side unauthenticated /results walk.
    {
      name: 'data-setup-perm-disable-allow-open',
      testMatch: /perm-disable-allow-open\.setup\.ts/,
      teardown: 'data-teardown-perm-disable-allow-open',
      dependencies: ['perm-hide-category-tags']
    },
    {
      name: 'data-teardown-perm-disable-allow-open',
      testMatch: /perm-disable-allow-open\.teardown\.ts/
    },
    {
      name: 'perm-disable-allow-open',
      testDir: './tests/specs/perm',
      testMatch: /perm-disable-allow-open\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-perm-disable-allow-open']
    }
  ]
});
