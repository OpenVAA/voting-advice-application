/**
 * The unit tests of the repository guards. Only `tests/` is collected: `fixtures/` holds inputs the guards read, some of them named like test files, and none of them is a suite.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts']
  }
});
