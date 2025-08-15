import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type UserConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }): UserConfig => {
  // Only add development aliases when in development mode
  const devAliases =
    mode === 'development'
      ? {
          '@openvaa/app-shared': '/opt/packages/app-shared/src',
          '@openvaa/argument-condensation': '/opt/packages/argument-condensation/src',
          '@openvaa/core': '/opt/packages/core/src',
          '@openvaa/data': '/opt/packages/data/src',
          '@openvaa/filters': '/opt/packages/filters/src',
          '@openvaa/llm': '/opt/packages/llm/src',
          '@openvaa/matching': '/opt/packages/matching/src'
        }
      : undefined;

  return {
    resolve: {
      preserveSymlinks: true,
      alias: devAliases
    },
    plugins: [sveltekit(), viteTsConfigPaths()],
    server: {
      port: Number(process.env.FRONTEND_PORT)
    }
  };
});
