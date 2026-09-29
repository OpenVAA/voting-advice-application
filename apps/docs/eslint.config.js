import { default as sharedConfig } from '@openvaa/shared-config/eslint';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';

export default [prettier, ...svelte.configs.prettier, ...sharedConfig];
