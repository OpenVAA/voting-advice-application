import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { TIMEOUTS } from './tests/helpers/timeouts';
import { assertSmokeProjects, DEFAULT_SMOKE_BASE_URL, SMOKE_PROJECT_NAME } from './tests/utils/deployedTarget';
import { TESTS_DIR } from './tests/utils/testsDir';

/**
 * The deployed smoke entry: a second Playwright configuration that drives an already deployed application, behind the gate in `deployed-global-setup.ts`.
 *
 * It loads no environment file. It reads only its named inputs from the process environment (`SMOKE_BASE_URL`, and the inputs the gate and the specs name), and it needs none of them to load, so `--list` works in an empty environment.
 *
 * The HTML reporter never opens: its default serves the report after a failing run and waits there, so a red run would never return its exit status. The JSON reporter is added only when `PLAYWRIGHT_JSON_OUTPUT_FILE` names its file, because without one it writes the report to standard output.
 */
const config = defineConfig({
  testDir: path.join(TESTS_DIR, 'deployed'),
  testMatch: /\.smoke\.ts$/,
  globalSetup: './deployed-global-setup.ts',
  timeout: TIMEOUTS.testMax,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI || process.env.GITHUB_ACTIONS === 'true',
  outputDir: path.join(TESTS_DIR, '../playwright-deployed-results'),
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: path.join(TESTS_DIR, '../playwright-deployed-report') }],
    ...(process.env.PLAYWRIGHT_JSON_OUTPUT_FILE ? [['json'] as const] : [])
  ],
  use: {
    baseURL: process.env.SMOKE_BASE_URL || DEFAULT_SMOKE_BASE_URL,
    trace: 'retain-on-failure'
  },
  projects: [{ name: SMOKE_PROJECT_NAME, use: { ...devices['Desktop Chrome'] } }]
});

assertSmokeProjects(config.projects ?? []);

export default config;
