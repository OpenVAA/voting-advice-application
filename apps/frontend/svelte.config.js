import adapter from '@sveltejs/adapter-node';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // No preprocess array -- Svelte 5 handles TypeScript natively
  kit: {
    adapter: adapter({}),
    alias: {
      $types: path.resolve('./src/lib/types'),
      $voter: path.resolve('./src/lib/voter'),
      $candidate: path.resolve('./src/lib/candidate')
    },
    version: {
      pollInterval: 5 * 60 * 1000
    }
  }
};

export default config;
