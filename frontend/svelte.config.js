import adapter from '@sveltejs/adapter-node';
import path from 'path';
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    sveltePreprocess({
      postcss: true
    })
  ],
  kit: {
    adapter: adapter({}),
    alias: {
      // These aliases nay need to be added to vitest.config.js as well. See: https://github.com/sveltejs/kit/issues/5962
      $types: path.resolve('./src/lib/types'),
      $voter: path.resolve('./src/lib/voter'),
      $candidate: path.resolve('./src/lib/candidate')
    }
  }
};

export default config;
