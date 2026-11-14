import { default as sharedConfig } from '@openvaa/shared-config/eslint';
import playwright from 'eslint-plugin-playwright';

export default [
  ...sharedConfig,
  {
    // `e2e-runs`: per-run evidence dirs written by tests/scripts/e2e-run.sh.
    // Each holds a full Playwright HTML report, whose bundled vendor JS would otherwise be linted — thousands of errors from third-party minified code, failing `yarn lint:check` for anyone who has run the wrapper. Gitignored too.
    ignores: ['playwright*', 'debug-*', 'e2e-runs']
  },
  {
    // Apply Playwright rules and test-specific overrides to all test files
    files: ['**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,

      // === Error rules (hard enforcement) === Must await Playwright async methods
      'playwright/missing-playwright-await': 'error',
      // No test.only in committed code
      'playwright/no-focused-test': 'error',

      // === Lint-gate hard enforcement (0/0 warnings at CI time) === Bank-auth has 3 inline-justified test.skip directives in contestant-bank-auth.spec.ts — each preceded by `// eslint-disable-next-line playwright/no-skipped-test` with a `// reason:` block. These per-line disables MUST survive.
      // === Forbidden-locator hardening === `no-raw-locators` only catches string-arg `.locator()` and misses `getByText` + non-string `.locator()` args. `no-restricted-locators` matches ANY member-call whose property name is listed — catching bare `page.locator(...)`, chained `.locator(...)`, and `getByText(...)`.
      // `getByRole`/`getByTestId` are intentionally NOT listed (kept allowed).
      // Locale-stable exceptions carry an inline `// reason:` block + `// eslint-disable-next-line playwright/no-restricted-locators`.
      'playwright/no-restricted-locators': [
        'error',
        [
          {
            type: 'getByText',
            message: 'getByText is forbidden — use getByTestId (preferred) or getByRole. See CLAUDE.md.'
          },
          {
            type: 'locator',
            message:
              'Raw .locator() is forbidden — use getByTestId (preferred) or getByRole. Locale-stable exceptions need an inline // reason: + eslint-disable-next-line playwright/no-restricted-locators.'
          }
        ]
      ],
      // Belt-and-braces: keep the string-arg rule too (strict superset overlap).
      'playwright/no-raw-locators': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-skipped-test': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-conditional-expect': 'error',
      // Helpers like `expectLandedOn`, `expectQuestion`, `expectConstituencySelector` wrap `expect()` assertions; whitelist any `expect[A-Z]…` identifier so the rule sees them as assertions. `assert[A-Z]…` helpers (e.g. `assertAxeGates`, `assertDbRowCount`) are likewise assertion wrappers — whitelist them too.
      'playwright/expect-expect': ['error', { assertFunctionPatterns: ['^expect[A-Z]', '^assert[A-Z]'] }],
      // Removing a page's last route turns Chromium's request interception off, and a request the page starts meanwhile can be held by the browser and never answered. `routeUntilEnded` (utils/endableRoute.ts) ends a route without removing it. The enum entry restates the shared config's, which this rule's options replace for these files.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const assertion or a string union type instead.'
        },
        {
          selector: 'CallExpression[callee.property.name=/^unroute(All)?$/]',
          message:
            "unroute() and unrouteAll() can leave a request the page makes meanwhile unanswered for good. End the route with routeUntilEnded's returned function (utils/endableRoute.ts) instead."
        }
      ],

      // === Other plugin warning rules (aspirational) === Prefer web-first assertions (toBeVisible over manual checks)
      'playwright/prefer-web-first-assertions': 'warn',
      // No page.pause() in committed code
      'playwright/no-page-pause': 'warn',

      // === Disable shared config rules that conflict with test patterns === Tests use arrow functions in test() callbacks
      'func-style': 'off',
      // Tests use console.log for debugging output
      'no-console': 'off',
      // Tests may use any for mocking and test utilities
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  {
    // === vitest util unit tests are NOT Playwright specs ===
    // `tests/utils/**/*.test.ts` are vitest unit tests (run via
    // `vitest --config tests/vitest.config.ts`, NOT Playwright). They use vitest's `describe`/`it`/`expect`, which the Playwright plugin's test-structure rules (no-standalone-expect, expect-expect, no-conditional-in-test) misclassify because they only recognise Playwright `test()` blocks. Disable those structure rules here; the forbidden-locator / await rules remain irrelevant (no Page in unit tests).
    files: ['**/utils/**/*.test.ts'],
    rules: {
      'playwright/no-standalone-expect': 'off',
      'playwright/expect-expect': 'off',
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-conditional-expect': 'off'
    }
  },
  {
    // === setup/teardown projects are not assertion tests === Files run under Playwright `setup`/`teardown` projects seed or clean the DB; they intentionally perform side effects (and may branch on filesystem/DB state) rather than asserting. The test-assertion-semantics rules below do not apply to them. Scoped to the `setup/` directory's
    // *.setup.ts / *.teardown.ts files only.
    files: ['**/setup/**/*.setup.ts', '**/setup/**/*.teardown.ts'],
    rules: {
      'playwright/expect-expect': 'off',
      'playwright/no-conditional-in-test': 'off'
    }
  },
  {
    // === The deployed smoke entry holds no service-role client and loads no environment file ===
    // It runs against a hosted deployment, so no module that creates a service-role or Supabase client, and no `.env` loader, may be value-imported here; a type import is allowed.
    // `playwright.deployed.config.ts` itself is outside lint because of the `playwright*` ignore above, and this rule sees direct imports only: `tests/utils/deployedSmokeGuards.test.ts` covers the config and the whole value-import closure instead.
    files: ['tests/deployed/**/*.ts', 'tests/utils/deployedTarget.ts', 'deployed-global-setup.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)(supabaseAdminClient|authApi|accountAccessClient|localSupabaseUrl)(\\.ts)?$',
              allowTypeImports: true,
              message: 'The deployed smoke entry holds no service-role client; a type import is allowed.'
            },
            {
              regex: '^@openvaa/dev-seed$',
              allowTypeImports: true,
              message:
                'The @openvaa/dev-seed barrel re-exports its service-role client; import the template module by path instead.'
            },
            {
              regex: '^@supabase/(supabase-js|ssr)$',
              allowTypeImports: true,
              message: 'The deployed smoke entry creates no Supabase client.'
            },
            {
              regex: '^dotenv(/.*)?$',
              message: 'The deployed smoke entry reads only its named inputs and loads no .env file.'
            }
          ]
        }
      ]
    }
  }
];
