import path from 'path';
import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-node';

// The repo-root `.env` lives two levels above `apps/frontend`. `apps/frontend/package.json` declares `type: module`, so `__dirname` is unavailable here — derive the repo root from `import.meta.url`, the same idiom `vite.config.ts` already uses.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    runes: true
  },
  kit: {
    adapter: adapter({}),
    // Point SvelteKit's env loader at the repo-root `.env`, the canonical env file (its template is the root `.env.example`).
    //
    // Without this, `kit.env.dir` defaults to `process.cwd()`. `yarn workspace @openvaa/frontend dev` runs vite with cwd `apps/frontend`, so SvelteKit would read `apps/frontend/.env`, and every variable set only at the root would be `undefined` in `$env/dynamic/public` and `$env/dynamic/private`. The `??` defaults in `$lib/utils/constants.ts` then turn those into plausible-looking values: `PUBLIC_IDENTITY_PROVIDER_TYPE` becomes `'signicat-ftn'` whatever the root file says, and an empty client id and authorize endpoint make `signicatProvider.getAuthorizeUrl` emit a relative url, so clicking "Identify yourself" just reloads the page.
    //
    // `vite.projectIdEnv.ts` covers the two project ids (`PUBLIC_PROJECT_ID`/`E2E_PROJECT_ID`) for a different reason: SvelteKit's `loadEnv` lets any `process.env` entry override the file, an empty one included, so that bridge runs first, in the Vite config, and writes the file's ids wherever the shell left them empty. Do not add more per-variable bridges like it; this setting makes them unnecessary.
    //
    // Safe by SvelteKit's own design: `$env/*/public` exposes only `PUBLIC_`-prefixed keys, so pointing the loader at a file full of secrets does not widen what reaches the browser.
    env: {
      dir: repoRoot
    },
    alias: {
      $types: path.resolve('./src/lib/types'),
      $voter: path.resolve('./src/lib/voter'),
      $candidate: path.resolve('./src/lib/candidate'),
      $layouts: path.resolve('./src/lib/layouts')
    },
    version: {
      pollInterval: 5 * 60 * 1000
    }
  },
  vitePlugin: {
    dynamicCompileOptions({ filename }) {
      if (!filename.includes('node_modules')) {
        return { runes: true };
      }
    }
  }
};

export default config;
