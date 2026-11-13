/**
 * Vitest config for the unit tests of the E2E harness's own utilities. Restricted to `tests/utils/**\/*.test.ts` so that it does not pick up the Playwright spec files in `tests/specs/**`, which Playwright runs.
 *
 * `tests/` is not a workspace, so turbo does not reach this config. The root `test:unit` script runs it as its last link, through `yarn test:unit:tests`, and `scripts/assert-unit-test-coverage.mjs` fails `yarn test:unit` when that link is missing.
 *
 * To run it alone, or one file of it:
 *
 *   yarn test:unit:tests
 *   yarn test:unit:tests mailedLink
 */

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // `include` is read against this directory whichever directory the run is started from.
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/utils/**/*.test.ts']
  }
});
