import { staticSettings } from '@openvaa/app-shared';
import { sveltekit } from '@sveltejs/kit/vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import type { UserConfig } from 'vite';

export default async function defineConfig(): Promise<UserConfig> {
  return {
    resolve: {
      preserveSymlinks: true
    },
    plugins: [
      ...(staticSettings.sentry.enabled ? [(await import('@sentry/sveltekit')).sentrySvelteKit()] : []),
      sveltekit(),
      viteTsConfigPaths()
    ],
    server: {
      port: Number(process.env.FRONTEND_PORT)
    }
  };
}
