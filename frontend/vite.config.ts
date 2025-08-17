import { sveltekit } from '@sveltejs/kit/vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  resolve: {
    preserveSymlinks: true
  },
  plugins: [sveltekit(), viteTsConfigPaths()],
  server: {
    port: Number(process.env.FRONTEND_PORT)
  }
};

export default config;
