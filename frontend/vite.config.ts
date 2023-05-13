import {sveltekit} from '@sveltejs/kit/vite';
import type {UserConfig} from 'vite';

const config: UserConfig = {
  plugins: [sveltekit()],
  esbuild: {
    supported: {
      'top-level-await': true //browsers can handle top-level-await features
    }
  }
};

export default config;
