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
 *     -> candidate-app-settings -> candidate-app-password
 *   data-setup -> voter-app (read-only specs)
 *   data-setup -> voter-app-settings -> voter-app-popups (settings-mutating specs)
 *   (data-teardown runs after all projects complete)
 *
 * Configuration variant projects run sequentially AFTER the default suite:
 *   [candidate-app-password, voter-app-popups] -> data-setup-multi-election -> variant-multi-election
 *     -> variant-results-sections -> data-setup-constituency -> variant-constituency
 *     -> data-setup-startfromcg -> variant-startfromcg
 *   (data-teardown-variants runs after all variant setups complete)
 *
 * Candidate specs are split into four groups:
 *   - candidate-app: auth + questions (sequential — fullyParallel:false prevents
 *     concurrent server requests that race on the Supabase session layer)
 *   - candidate-app-mutation: registration + profile (create users via invite)
 *   - candidate-app-settings: settings (mutates global app settings like disabled/maintenance —
 *     must run alone)
 *   - candidate-app-password: logout + password change (session-destructive —
 *     runs LAST because updateUser({password}) revokes refresh tokens)
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

    // 4a. Candidate app: auth + questions (sequential to prevent concurrent
    //     server requests that race on Supabase session/DataWriter singletons)
    {
      name: 'candidate-app',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-(auth|questions|translation)\.spec\.ts/,
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['auth-setup']
    },

    // 4b. Candidate app: registration + profile (create users via invite)
    {
      name: 'candidate-app-mutation',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-(registration|profile|profile-validation)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['candidate-app']
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
    {
      name: 'candidate-app-settings',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-settings\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['re-auth-setup']
    },

    // 4d. Candidate app: logout + password change (session-destructive —
    //     runs LAST because updateUser({password}) revokes refresh tokens)
    {
      name: 'candidate-app-password',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-password\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['candidate-app-settings']
    },

    // 5a. Voter app: core journey, results, detail, static-pages (parallel-safe — read-only settings)
    {
      name: 'voter-app',
      testDir: './tests/specs/voter',
      testIgnore: /voter-(settings|popups)\.spec\.ts/,
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
    {
      name: 'data-setup-multi-election',
      testMatch: /variant-multi-election\.setup\.ts/,
      teardown: 'data-teardown-variants',
      dependencies: ['candidate-app-password', 'voter-app-popups']
    },
    {
      name: 'variant-multi-election',
      testDir: './tests/specs/variants',
      testMatch: /multi-election\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['data-setup-multi-election']
    },

    // Variant: results sections (CONF-05, CONF-06) — uses multi-election dataset
    {
      name: 'variant-results-sections',
      testDir: './tests/specs/variants',
      testMatch: /results-sections\.spec\.ts/,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['variant-multi-election'] // Runs after multi-election, reuses same data
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

    // Variant: allowopen (Phase 77 SETTINGS-02 — display-side reframing per LANDMINE-1)
    {
      name: 'data-setup-allowopen',
      testMatch: /variant-allowopen\.setup\.ts/,
      teardown: 'data-teardown-variants',
      dependencies: ['variant-Ne-Nc'] // Sequential: wait for previous variant (LANDMINE-6)
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
    },
    {
      // Candidate-required cell — logs in as Alpha (reuses STORAGE_STATE from
      // auth-setup; auth schema is NOT touched by dataset reset, so Alpha's
      // pre-registered credentials remain valid against the variant's
      // candidate row). Placed inside the variant project per RESEARCH OQ-3
      // resolution (option B) to sidestep candidate-app-mutation's testMatch
      // regex AND the upstream auth-setup race (LANDMINE-D).
      name: 'variant-hidden-required-candidate',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-required-info\.spec\.ts/,
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['variant-hidden-required-voter']
    },

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
      : [])
  ]
});
