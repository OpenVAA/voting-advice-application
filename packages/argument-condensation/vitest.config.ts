/**
 * Necessary for `/vitest.workspace.ts` to recognize this module as a test workspace. Also configure tests to download the prompt registry before running tests.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
  }
});
