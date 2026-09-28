/**
 * Vitest config for `tests/` test-utility unit tests. Restricted to
 * `tests/utils/**\/*.test.ts` so we do NOT pick up the Playwright spec files in
 * `tests/specs/**` (those are e2e tests run by Playwright, NOT vitest).
 *
 * Note: this config is NOT yet listed in the root `vitest.workspace.ts`
 * (which currently only includes `packages/**`). Authors who add a tests
 * unit-test entry should run it directly via:
 *
 *   yarn vitest run --config tests/vitest.config.ts
 *
 * Or from inside `tests/`:
 *
 *   cd tests && npx vitest run --config vitest.config.ts
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/utils/**/*.test.ts']
  }
});
