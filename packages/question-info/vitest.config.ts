/**
 * Makes this package a project of the root `vitest.config.ts`, whose `test.projects` lists the `vitest.config.ts` of every package directly under `packages`. Also configures tests to download the prompt registry before running tests.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts']
  }
});
