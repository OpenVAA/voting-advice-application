/**
 * Phase 84 RCA — standalone Playwright config for cold-start instrumentation.
 *
 * Bypasses the main suite's project dependency graph; runs ONE spec
 * (capture-cold-start.spec.ts) directly against the already-running
 * dev server at http://localhost:5173. No setup projects, no storageState
 * — we instrument the login flow itself to capture the full cold-start
 * imgproxy fetch pattern.
 */
import { defineConfig, devices } from '@playwright/test';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: __dirname,
  testMatch: /capture-cold-start\.spec\.ts/,
  timeout: 180_000,
  reporter: [['list']],
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:5173',
    trace: 'off',
    video: 'off'
  }
});
