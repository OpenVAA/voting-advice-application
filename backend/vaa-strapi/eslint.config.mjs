import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
// import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
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
      'src/api',
      '**/strapi-plugin-import-export-entries',
      'config/email-templates'
    ]
  },
  ...compat.extends('eslint:recommended', 'prettier'),
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

      'func-style': ['warn', 'declaration', { allowArrowFunctions: false }]
    }
  }
];
