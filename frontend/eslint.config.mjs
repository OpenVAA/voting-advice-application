import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
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
  {
    ignores: [
      '**/*.cjs',
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
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:svelte/prettier'
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'simple-import-sort': simpleImportSort //https://github.com/lydell/eslint-plugin-simple-import-sort?tab=readme-ov-file
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        ElectionProps: 'writable',
        PartyProps: 'writable',
        CandidateProps: 'writable',
        QuestionProps: 'writable',
        RankingProps: 'writable'
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
    },

    rules: {
      'no-console': [
        'error',
        {
          allow: ['warn', 'error', 'info']
        }
      ],

      'no-undef': 'off',

      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: false
        }
      ],

      '@typescript-eslint/no-duplicate-enum-values': 'off',

      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'generic'
        }
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
          custom: {
            regex: '^T[A-Z]',
            match: true
          }
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase']
        }
      ],

      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            [
              '^\\u0000',
              '^node:',
              '^@?\\w',
              '^',
              '^\\./',
              '^\\.\\./',
              '^\\.',
              '^node:.*\\u0000$',
              '^@?\\w.*\\u0000$',
              '^[^.].*\\u0000$',
              '^\\..*\\u0000$'
            ]
          ]
        }
      ]
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
  }
];
