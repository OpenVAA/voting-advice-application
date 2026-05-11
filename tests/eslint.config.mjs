import { default as sharedConfig } from '@openvaa/shared-config/eslint';
import playwright from 'eslint-plugin-playwright';

export default [
  ...sharedConfig,
  {
    ignores: ['playwright*', 'debug-*']
  },
  {
    // Apply Playwright rules and test-specific overrides to all test files
    files: ['**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,

      // === Error rules (hard enforcement) ===
      // Must await Playwright async methods
      'playwright/missing-playwright-await': 'error',
      // No test.only in committed code
      'playwright/no-focused-test': 'error',

      // === Phase 73 lint-gate bump (was 'warn'; final-step of 2026-05-10-tests-playwright-hygiene-sweep.md) ===
      // Phase 73 Plans 02-05 cleared all 101 warnings; Plan 06 enforces 0/0 at CI time.
      // Bank-auth has 3 inline-justified test.skip directives in candidate-bank-auth.spec.ts
      // per CONTEXT D-07 + Plan 04 D-07 — each preceded by `// eslint-disable-next-line
      // playwright/no-skipped-test` with `// reason:` block. These per-line disables MUST
      // survive this bump.
      'playwright/no-raw-locators': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-skipped-test': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-conditional-expect': 'error',
      'playwright/expect-expect': 'error',

      // === Other plugin warning rules (aspirational; not bumped in Phase 73) ===
      // Prefer web-first assertions (toBeVisible over manual checks)
      'playwright/prefer-web-first-assertions': 'warn',
      // No page.pause() in committed code
      'playwright/no-page-pause': 'warn',

      // === Disable shared config rules that conflict with test patterns ===
      // Tests use arrow functions in test() callbacks
      'func-style': 'off',
      // Tests use console.log for debugging output
      'no-console': 'off',
      // Tests may use any for mocking and test utilities
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  }
];
