// Phase 64-02 repro-only Playwright config — DO NOT include in CI.
// Purpose: run deeplink-repro.spec.ts in isolation, bypassing the data-setup → auth-setup → ...
// project dependency chain in `tests/playwright.config.ts`. The voter app must already be seeded
// (Plan 64-02 Task 1 Step 1 `yarn dev:reset-with-data` covers this) and the dev server must be
// running on localhost:5173 (`yarn workspace @openvaa/frontend dev` in another terminal covers
// this).
//
// This file lives under .planning/ and is NEVER auto-collected by the project's playwright test
// runner — it must be referenced explicitly via `-c` when running the repro spec.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.', // resolves to .planning/phases/64-voter-results-reactivity-completion/repro/
  testMatch: /deeplink-repro\.spec\.ts/,
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['line']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:5173',
    trace: 'on'
  }
  // No `projects:` block — no data-setup / auth-setup dependency chain.
  // No `webServer:` block — caller starts `yarn workspace @openvaa/frontend dev` separately.
});
