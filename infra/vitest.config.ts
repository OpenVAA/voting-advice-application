/**
 * Vitest config for the unit tests of the infrastructure scripts, `infra/scripts/**\/*.test.ts`.
 *
 * `infra/` is not a workspace, so turbo does not reach this config. The root `test:unit` script runs it as a link of its chain, through `yarn test:unit:infra`, and `scripts/assert-unit-test-coverage.mjs` fails `yarn test:unit` when that link is missing.
 *
 * To run it alone, or one file of it:
 *
 * ```sh
 * yarn test:unit:infra
 * yarn test:unit:infra probe-hosted
 * ```
 */

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // `include` is read against this directory whichever directory the run is started from.
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    globals: true,
    environment: 'node',
    include: ['scripts/**/*.test.ts']
  }
});
