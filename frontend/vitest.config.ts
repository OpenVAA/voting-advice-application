import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST }), sveltekit()],
  resolve: {
    alias: {
      $lib: path.join(__dirname, './src/lib'),
      $types: path.join(__dirname, './src/lib/types'),
      $voter: path.resolve(__dirname, './src/lib/voter'),
      $candidate: path.resolve(__dirname, './src/lib/candidate')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
