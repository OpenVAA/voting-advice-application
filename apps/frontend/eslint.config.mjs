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
      'src/error.html',
      // Frozen Svelte-5 migration spike fixtures (v2.13): kept as regression
      // tests but intentionally not held to production lint standards.
      '**/_spikes-*/**'
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
  // (v2.11 K1 guard): ban `svelte/store` so any reintroduction of the store seam
  // fails `yarn lint:check`. The guard's widening to the whole `src/**` tree is
  // now DONE — see phase 115: the glob covers `src/**/*.{ts,svelte}`, where it
  // previously covered only lib/contexts/** + routes/**. That enforces the
  // rune-only invariant frontend-wide, now that the last real `svelte/store`
  // import has been removed.
  // Flat config REPLACES (does not merge) the `no-restricted-imports` array for in-scope files,
  // so the inherited deep-relative-`lib` `patterns` ban (shared-config/eslint.config.mjs:147-152)
  // is re-included VERBATIM here. Omitting it would silently drop that ban for these
  // files, because the replacement is total rather than additive.
  {
    files: ['src/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'svelte/store',
              message:
                'svelte/store is banned in migrated contexts and routes. Use $state/$derived rune handles exposing `current` instead.'
            }
          ],
          patterns: [
            {
              regex: '^(\\.\\./){2,}lib(/|$)',
              message:
                'Use the $lib alias instead of deep relative imports. Example: import X from "$lib/components/Foo".'
            }
          ]
        }
      ]
    }
  }
];
