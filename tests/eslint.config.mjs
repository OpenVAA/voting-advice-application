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

      // === Warning rules (aspirational — existing tests have many violations) ===
      // Enforce getByTestId over raw CSS/text selectors
      'playwright/no-raw-locators': 'warn',
      // No waitForTimeout — use waitFor conditions instead
      'playwright/no-wait-for-timeout': 'warn',
      // Prefer web-first assertions (toBeVisible over manual checks)
      'playwright/prefer-web-first-assertions': 'warn',
      // No page.pause() in committed code
      'playwright/no-page-pause': 'warn',
      // No test.skip — prefer conditional skip
      'playwright/no-skipped-test': 'warn',
      // No conditionals in tests (existing tests use many)
      'playwright/no-conditional-in-test': 'warn',
      // No networkidle — prefer load or domcontentloaded
      'playwright/no-networkidle': 'warn',

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
