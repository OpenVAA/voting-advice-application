import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { TIMEOUTS } from './tests/helpers/timeouts';
import { assertSmokeProjects, SMOKE_PROJECT_NAME, smokeBaseUrl } from './tests/utils/deployedTarget';
import { TESTS_DIR } from './tests/utils/testsDir';

/**
 * The deployed smoke entry: a second Playwright configuration that drives an already deployed application, behind the gate in `deployed-global-setup.ts`.
 *
 * It loads no environment file. It reads only its named inputs from the process environment (`SMOKE_DEPLOYMENT`, the deployment key, default `staging`; `SMOKE_BASE_URL`, default the `public_origin` of that deployment's committed Supabase tfvars; and the inputs the gate and the specs name), and it needs none of them to load, so `--list` works in an empty environment.
 *
 * A run carries the contestant's address and password. What keeps them out of what it writes:
 *
 *   - No HTML report. That reporter titles each fill step with the value typed into the field, on a green run as on a red one. Only the list reporter and, when `PLAYWRIGHT_JSON_OUTPUT_FILE` names its file, the JSON reporter run; without a file the JSON reporter writes its report to standard output.
 *   - `PLAYWRIGHT_NO_COPY_PROMPT=1` turns off the accessibility snapshot of the open page that Playwright writes into `error-context.md` when a failed test closes its browser context. The snapshot holds the value of every input, a password field's included. A failed matcher still writes its own snapshot, so the contestant spec empties the sign-in form before its first assertion whenever the sign-in has not led away from it.
 */
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';

// `TESTS_DIR` is `<repo-root>/tests/tests`, so the root is two levels up.
const repoRoot = path.resolve(TESTS_DIR, '..', '..');

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
  reporter: [['list'], ...(process.env.PLAYWRIGHT_JSON_OUTPUT_FILE ? [['json'] as const] : [])],
  use: {
    baseURL: smokeBaseUrl(process.env, repoRoot),
    trace: 'retain-on-failure'
  },
  projects: [{ name: SMOKE_PROJECT_NAME, use: { ...devices['Desktop Chrome'] } }]
});

assertSmokeProjects(config.projects ?? []);

export default config;
