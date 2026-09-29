import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import ViteRestart from 'vite-plugin-restart';
import { PARAGLIDE_OPTIONS } from './paraglide.options';
import { resolveProjectIdEnv } from './vite.projectIdEnv';

// The root `.env` lives two levels above `apps/frontend`. `apps/frontend/package.json` declares `type: module`, so `__dirname` is unavailable here — derive the repo root from `import.meta.url`.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig(({ mode }) => {
  // The prefix is the literal variable name: `FRONTEND_PORT` carries no `VITE_` prefix, so Vite's default prefix would match nothing, and the empty-string prefix would pull in every entry of a secrets file. `loadEnv` overlays `process.env` AFTER the parsed file, so a one-off shell prefix (`FRONTEND_PORT=5273 yarn dev`) still overrides a persistent value in the root `.env`.
  const env = loadEnv(mode, repoRoot, 'FRONTEND_PORT');

  // The project id is carried from the root `.env` into `process.env`, which is where SvelteKit's own `loadEnv` over `apps/frontend` picks it up and exposes it through `$env/dynamic/public`. Only the two named keys cross over; see `vite.projectIdEnv.ts` for why a value already in `process.env` is never overwritten.
  resolveProjectIdEnv({ mode, repoRoot, target: process.env });

  return {
    plugins: [
      tailwindcss(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      paraglideVitePlugin(PARAGLIDE_OPTIONS) as any,
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
      // Refuse a same-address bind so `yarn dev` cannot silently serve on a different port than Playwright targets. This does NOT refuse a wildcard shadow-bind: a process holding the IPv6 wildcard lets Vite additionally bind the more specific loopback address with no bind error at all — that case is caught by the E2E preflight in `tests/global-setup.ts`. Both halves are measured in the planning record (see phase 137).
      strictPort: true
    }
  };
});
