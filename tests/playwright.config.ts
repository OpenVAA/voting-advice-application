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
    }
  ]
});
