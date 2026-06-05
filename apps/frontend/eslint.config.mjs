import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { default as sharedConfig } from '@openvaa/shared-config/eslint';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import parser from 'svelte-eslint-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  ...sharedConfig,
  ...compat.extends('plugin:svelte/prettier'),
  {
    ignores: [
      'ios/*',
      'android/*',
      '**/.DS_Store',
      '**/node_modules',
      'build',
      '.svelte-kit',
      'package',
      '**/.env',
      '**/.env.*',
      '!**/.env.example',
      '**/pnpm-lock.yaml',
      '**/package-lock.json',
      '**/yarn.lock',
      'src/app.html',
      'src/error.html'
    ]
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      },

      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',

      parserOptions: {
        extraFileExtensions: ['.svelte']
      }
    },

    settings: {
      'svelte/typescript': true
    }
  },
  {
    files: ['**/*.svelte'],

    languageOptions: {
      parser: parser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  },
  // CLEAN-02 (v2.11 K1 guard): ban `svelte/store` in migrated contexts/routes so any
  // reintroduction of the store seam fails `yarn lint:check`. Scoped to D-02's globs only
  // (lib/contexts/** + routes/**); D-03 backlogs widening to lib/components/** + lib/utils/**.
  // Flat config REPLACES (does not merge) the `no-restricted-imports` array for in-scope files,
  // so the inherited deep-relative-`lib` `patterns` ban (shared-config/eslint.config.mjs:147-152)
  // is re-included VERBATIM here, or it would silently drop for these files (RESEARCH Pitfall 3).
  {
    files: ['src/lib/contexts/**/*.{ts,svelte}', 'src/routes/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'svelte/store',
              message:
                'svelte/store is banned in migrated contexts/routes (v2.11 K1). Use $state/$derived rune handles exposing `current`. See .planning/v2.11-DECISIONS.md K1.'
            }
          ],
          patterns: [
            {
              regex: '^(\\.\\./){2,}lib(/|$)',
              message: 'Use the $lib alias instead of deep relative imports. Example: import X from "$lib/components/Foo".'
            }
          ]
        }
      ]
    }
  }
];
