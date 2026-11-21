// 174.1-read-views.config.ts — the Playwright configuration of the two user steps of the plan `views` of 174.1-read.mjs.
//
// Not part of the suite and run by 174.1-read.mjs alone, which gives each invocation the two addresses and the two
// session paths in its environment. It declares two projects over the two files beside it:
//
//   views-users-register     registers the plan's two users through the suite's own `registerAndStoreSession` and
//                            stores their sessions. It signs each user in through the served login form, so it runs
//                            behind the suite's own global setup: the served-application preflight, on the suite's
//                            base URL.
//   views-users-unregister   removes the two users. It opens no page, so 174.1-read.mjs runs it with
//                            READ1741_USERS_STEP=unregister, under which this configuration names no global setup:
//                            the users are then removed whether or not the session's server still listens.
//
// The base URL, the per-test timeout and the trace setting are read off the suite's configuration, not restated.

import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import suite from '../../../tests/playwright.config';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');

const opensNoPage = process.env.READ1741_USERS_STEP === 'unregister';

export default defineConfig({
  testDir: HERE,
  outputDir: path.join(REPO_ROOT, 'tests/playwright-results'),
  ...(opensNoPage ? {} : { globalSetup: path.join(REPO_ROOT, 'tests/global-setup.ts') }),
  timeout: suite.timeout,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  use: { baseURL: suite.use?.baseURL, trace: suite.use?.trace },
  projects: [
    {
      name: 'views-users-register',
      testMatch: /174\.1-read-views\.register\.ts$/,
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'views-users-unregister',
      testMatch: /174\.1-read-views\.unregister\.ts$/
    }
  ]
});
