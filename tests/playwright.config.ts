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
 *   data-setup -> auth-setup -> candidate-app -> candidate-app-mutation -> candidate-app-settings
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
 * Candidate specs are split into three groups because they mutate shared backend state:
 *   - candidate-app: auth + questions (run in parallel — different mutation targets,
 *     JWT stays valid after password changes)
 *   - candidate-app-mutation: registration + profile (create users, change passwords —
 *     must run after auth spec restores the alpha candidate's password)
 *   - candidate-app-settings: settings (mutates global app settings like disabled/maintenance —
 *     must run alone)
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

  /* Per-test timeout */
  timeout: 30000,

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry tests on CI */
  retries: process.env.CI ? 3 : 0,
  /* Opt out of parallel tests on CI. Limit local workers to avoid Strapi admin rate limiting. */
  workers: process.env.CI ? 1 : 4,

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
    // 1. Data setup - imports test dataset via Admin Tools API
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

    // 4a. Candidate app: auth + questions (parallel-safe — different mutation targets)
    {
      name: 'candidate-app',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-(auth|questions)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['auth-setup']
    },

    // 4b. Candidate app: registration + profile (create users, change passwords —
    //     must run after auth restores the alpha candidate's password)
    {
      name: 'candidate-app-mutation',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-(registration|profile)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['candidate-app']
    },

    // 4c. Candidate app: settings (mutates global app settings — must run alone)
    {
      name: 'candidate-app-settings',
      testDir: './tests/specs/candidate',
      testMatch: /candidate-settings\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE
      },
      dependencies: ['candidate-app-mutation']
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
    //     Depends on voter-app so settings mutations only start after all
    //     read-only voter specs complete. Without this ordering, concurrent
    //     settings changes (e.g., enabling categoryIntros) interfere with
    //     voter-app fixtures navigating through the question journey.
    {
      name: 'voter-app-settings',
      testDir: './tests/specs/voter',
      testMatch: /voter-settings\.spec\.ts/,
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome']
      },
      dependencies: ['voter-app']
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
      dependencies: ['candidate-app-settings', 'voter-app-popups']
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
      : [])
  ]
});
