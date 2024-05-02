import {defineConfig} from 'vitest/config';
import {svelte} from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte({hot: !process.env.VITEST})],
  resolve: {
    alias: {
      $lib: path.join(__dirname, './src/lib'),
      $types: path.join(__dirname, './src/lib/types'),
      $voter: path.resolve(__dirname, './src/lib/voter'),
      $candidate: path.resolve(__dirname, './src/lib/candidate'),
      $shared: path.resolve(__dirname, './src/shared')
    }
  },
  test: {
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globals: true,
    environment: 'jsdom'
  }
});
