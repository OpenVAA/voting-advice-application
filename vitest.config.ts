/**
 * Root Vitest configuration, used only when `vitest` runs from the repository root (`yarn test:unit:watch`). Each entry in `test.projects` is a package's own `vitest.config.ts`, which runs as a separate project with its own settings.
 *
 * CI and `yarn test:unit` do not go through this file: turbo runs each workspace's `test:unit` script from the workspace directory, and `scripts/assert-unit-test-coverage.mjs` checks that every workspace with tests is executed that way.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*/vitest.config.ts']
  }
});
