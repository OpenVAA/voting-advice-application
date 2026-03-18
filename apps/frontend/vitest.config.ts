import path from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    alias: [
      // Paraglide generated output doesn't exist during tests.
      // These must come before the $lib alias to prevent $lib from matching first.
      {
        find: '$lib/paraglide/runtime',
        replacement: path.resolve(__dirname, 'src/lib/i18n/tests/__mocks__/paraglide-runtime.ts')
      },
      {
        find: '$lib/paraglide/messages',
        replacement: path.resolve(__dirname, 'src/lib/i18n/tests/__mocks__/paraglide-messages.ts')
      },
      // SvelteKit built-in aliases (not available via @sveltejs/vite-plugin-svelte)
      { find: '$lib', replacement: path.resolve(__dirname, 'src/lib') },
      { find: '$types', replacement: path.resolve(__dirname, 'src/lib/types') },
      { find: '$voter', replacement: path.resolve(__dirname, 'src/lib/voter') },
      { find: '$candidate', replacement: path.resolve(__dirname, 'src/lib/candidate') },
      // SvelteKit env modules stub
      {
        find: '$env/dynamic/public',
        replacement: path.resolve(__dirname, 'src/lib/i18n/tests/__mocks__/env-dynamic-public.ts')
      },
      {
        find: '$app/environment',
        replacement: path.resolve(__dirname, 'src/lib/i18n/tests/__mocks__/app-environment.ts')
      }
    ]
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
