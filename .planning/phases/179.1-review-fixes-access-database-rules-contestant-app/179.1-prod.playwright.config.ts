// A Playwright config for one driven run against a production server, used by 179.1-prod-drive.sh alone.
//
// It is NOT an E2E run. The suite's preflight requires the served application to echo this checkout through Vite's /@fs,
// which a production server cannot, so this config sets no globalSetup. No flag or variable of the suite is bypassed, and
// tests/scripts/e2e-run.sh stays the only way to run the suite. No E2E verdict reads a driven run, and no void marker
// exists for one: caffeinate and `pmset -g log` are what a red with no other cause is read against. It covers the projects
// below, on Chromium, and nothing else.
//
// Traces are off here: a trace is a zip holding the page's own resources, which the driver's check for the API key could
// not read.

import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import suite from '../../../tests/playwright.config';
import type { Project } from '@playwright/test';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../tests');

const KEPT = [
  'data-setup-base',
  'data-teardown-base',
  'auth-setup',
  'data-setup-entity-selection',
  'data-teardown-entity-selection',
  'contestant-entity-selection',
  'data-setup-admin-auth',
  'data-teardown-admin-access',
  'admin-access',
  'contestant-password-recovery'
];

const projects: Array<Project> = KEPT.map((name) => {
  const project = (suite.projects ?? []).find((candidate) => candidate.name === name);
  if (!project) throw new Error(`179.1-prod.playwright.config.ts: the suite has no project named ${name}`);
  return {
    ...project,
    ...(project.testDir ? { testDir: path.resolve(TESTS_ROOT, project.testDir) } : {}),
    dependencies:
      name === 'data-setup-admin-auth'
        ? ['data-setup-base']
        : project.dependencies?.filter((dependency) => KEPT.includes(dependency))
  };
});

export default defineConfig({
  ...suite,
  projects,
  globalSetup: undefined,
  webServer: undefined,
  workers: 1,
  use: { ...suite.use, trace: 'off' },
  reporter: [['line'], ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_FILE }]]
});
