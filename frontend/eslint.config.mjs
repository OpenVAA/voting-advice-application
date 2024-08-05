import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';

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
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/prettier',
    'plugin:svelte/recommended'
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
      parserOptions: {
        extraFileExtensions: ['.svelte'],
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    },

    settings: {
      'svelte/typescript': true
    }

    // compileOptions: {
    //   postcss: {
    //     configFilePath: './postcss.config.js'
    //   }
    // }
  },
  {
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

      'simple-import-sort/imports': [
        'error',
        { groups: [['^\\u0000', '^node:', '^@?\\w', '^', '^\\.']] }
      ],
      'simple-import-sort/exports': 'error',

      'svelte/no-at-html-tags': 'off'
    }
  },
  {
    files: ['**/*.svelte'],

    languageOptions: {
      parser: svelteParser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  }
];
