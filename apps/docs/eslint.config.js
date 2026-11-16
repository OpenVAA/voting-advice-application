import { default as sharedConfig, tsParser } from '@openvaa/shared-config/eslint';
import svelte from 'eslint-plugin-svelte';

export default [
  { ignores: ['.svelte-kit'] },
  ...sharedConfig,
  ...svelte.configs.prettier,
  { files: ['**/*.svelte'], languageOptions: { parserOptions: { parser: tsParser } } }
];
