import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      strategy: ['url', 'cookie', 'baseLocale']
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
    sveltekit()
  ],
  resolve: {
    preserveSymlinks: true
  },
  server: {
    port: Number(process.env.FRONTEND_PORT)
  }
});
