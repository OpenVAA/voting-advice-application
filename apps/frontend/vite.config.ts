import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import ViteRestart from 'vite-plugin-restart';

// The root `.env` lives two levels above `apps/frontend`. `apps/frontend/package.json` declares
// `type: module`, so `__dirname` is unavailable here — derive the repo root from `import.meta.url`.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig(({ mode }) => {
  // The prefix is the literal variable name: `FRONTEND_PORT` carries no `VITE_` prefix, so Vite's
  // default prefix would match nothing, and the empty-string prefix would pull in every entry of a
  // secrets file. `loadEnv` overlays `process.env` AFTER the parsed file, so a one-off shell prefix
  // (`FRONTEND_PORT=5273 yarn dev`) still overrides a persistent value in the root `.env`.
  const env = loadEnv(mode, repoRoot, 'FRONTEND_PORT');

  return {
    plugins: [
      tailwindcss(),
      paraglideVitePlugin({
        project: './project.inlang',
        outdir: './src/lib/paraglide',
        strategy: ['url', 'cookie', 'baseLocale']
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
      sveltekit(),
      ViteRestart({
        restart: ['../../.env']
      })
    ],
    resolve: {
      preserveSymlinks: true
    },
    server: {
      port: Number(env.FRONTEND_PORT) || 5173,
      // Refuse a same-address bind so `yarn dev` cannot silently serve on a different port than
      // Playwright targets. This does NOT refuse a wildcard shadow-bind: a process holding the IPv6
      // wildcard lets Vite additionally bind the more specific loopback address with no bind error
      // at all — that case is caught by the E2E preflight in `tests/global-setup.ts`. Both halves
      // are measured in `.planning/phases/137-.../137-RESEARCH.md` QUAL-1.
      strictPort: true
    }
  };
});
