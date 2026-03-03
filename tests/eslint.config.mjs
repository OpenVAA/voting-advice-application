import { default as sharedConfig } from '@openvaa/shared-config/eslint';
import playwright from 'eslint-plugin-playwright';

export default [
  ...sharedConfig,
  {
    ignores: ['playwright*']
  },
  {
    // Apply Playwright rules to all test files
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,

      // === Error rules (hard enforcement) ===
      // Enforce getByTestId over raw CSS/text selectors
      'playwright/no-raw-locators': 'error',
      // No waitForTimeout — use waitFor conditions instead
      'playwright/no-wait-for-timeout': 'error',
      // Must await Playwright async methods
      'playwright/missing-playwright-await': 'error',
      // No test.only in committed code
      'playwright/no-focused-test': 'error',
      // Prefer web-first assertions (toBeVisible over manual checks)
      'playwright/prefer-web-first-assertions': 'error',

      // === Warning rules (soft enforcement) ===
      // No page.pause() in committed code
      'playwright/no-page-pause': 'warn',
      // No test.skip — prefer conditional skip
      'playwright/no-skipped-test': 'warn',

      // === Disable shared config rules that conflict with test patterns ===
      // Tests use arrow functions in test() callbacks
      'func-style': 'off'
    }
  }
];
