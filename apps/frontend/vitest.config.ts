import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// `apps/frontend/package.json` declares `type: module`, so `__dirname` does not exist here and this file only ever saw one because Vite's config bundler injects a definition for it. That shim is an implementation detail of the loader, not a property of the module, so derive the directory from `import.meta.url` instead of depending on it.
const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    // Force svelte to resolve via its browser entrypoint so `mount()` / `unmount()` from `svelte` are available in jsdom-backed unit tests.
    // Without this, vitest picks svelte's `index-server.js` (SSR build) and any test that mounts a component fails with `lifecycle_function_unavailable`.
    conditions: ['browser'],
    alias: [
      // Paraglide generated output doesn't exist during tests.
      // These must come before the $lib alias to prevent $lib from matching first.
      {
        find: '$lib/paraglide/runtime',
        replacement: path.resolve(here, 'src/lib/i18n/tests/__mocks__/paraglide-runtime.ts')
      },
      {
        find: '$lib/paraglide/messages',
        replacement: path.resolve(here, 'src/lib/i18n/tests/__mocks__/paraglide-messages.ts')
      },
      // SvelteKit built-in aliases (not available via @sveltejs/vite-plugin-svelte)
      { find: '$lib', replacement: path.resolve(here, 'src/lib') },
      { find: '$types', replacement: path.resolve(here, 'src/lib/types') },
      { find: '$voter', replacement: path.resolve(here, 'src/lib/voter') },
      { find: '$candidate', replacement: path.resolve(here, 'src/lib/candidate') },
      { find: '$layouts', replacement: path.resolve(here, 'src/lib/layouts') },
      // SvelteKit env modules stub
      {
        find: '$env/dynamic/public',
        replacement: path.resolve(here, 'src/lib/i18n/tests/__mocks__/env-dynamic-public.ts')
      },
      {
        find: '$app/environment',
        replacement: path.resolve(here, 'src/lib/i18n/tests/__mocks__/app-environment.ts')
      },
      {
        find: '$app/paths',
        replacement: path.resolve(here, 'src/lib/i18n/tests/__mocks__/app-paths.ts')
      },
      {
        find: '$app/state',
        replacement: path.resolve(here, 'src/lib/i18n/tests/__mocks__/app-state.ts')
      },
      {
        find: '$app/navigation',
        replacement: path.resolve(here, 'src/lib/i18n/tests/__mocks__/app-navigation.ts')
      }
    ]
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
