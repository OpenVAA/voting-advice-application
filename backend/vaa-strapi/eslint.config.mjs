import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const compat = new FlatCompat({
  baseDirectory: __filename,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  {
    ignores: [
      '**/.cache',
      '**/build',
      '**/dist',
      '**/node_modules',
      '**/*.json',
      '**/config/*',
      '**/strapi-plugin-import-export-entries',
      '**/generated',
      'config/email-templates'
    ]
  },
  ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'simple-import-sort': simpleImportSort //https://github.com/lydell/eslint-plugin-simple-import-sort?tab=readme-ov-file
    }
  },
  {
    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.jest,
        ...globals.node,
        strapi: true
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'module',

      parserOptions: {
        requireConfigFile: false,

        ecmaFeatures: {
          experimentalObjectRestSpread: true,
          jsx: false
        }
      }
    },

    rules: {
      'no-console': [
        'error',
        {
          allow: ['info', 'warn', 'error']
        }
      ],

      'no-unused-vars': 'warn',

      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: false
        }
      ],

      'func-style': ['warn', 'declaration', { allowArrowFunctions: false }],

      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use const assertion or a string union type instead.'
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
      '@typescript-eslint/no-duplicate-enum-values': 'off',

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
  }
];
