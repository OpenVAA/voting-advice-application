import {sveltekit} from '@sveltejs/kit/vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import type {UserConfig} from 'vite';

const config: UserConfig = {
  resolve: {
    preserveSymlinks: true
  },
  plugins: [sveltekit(), viteTsConfigPaths()]
};

export default config;
