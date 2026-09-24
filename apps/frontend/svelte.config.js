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
    // Point SvelteKit's env loader at the repo-root `.env` — the file `.env.example`, `CLAUDE.md` § Development Environment and even `apps/frontend/.env.example` ("Use the .env.example file in project root for a template") all name as the canonical one.
    //
    // WITHOUT this, `kit.env.dir` defaults to `process.cwd()`, and `yarn workspace @openvaa/frontend dev` runs vite with cwd `apps/frontend` — so SvelteKit read `apps/frontend/.env` and the entire repo-root configuration was invisible to `$env/dynamic/public` and `$env/dynamic/private`. Every variable written only at the root silently became `undefined`, which the `??` defaults in `$lib/utils/constants.ts` then converted into plausible-looking values: `PUBLIC_IDENTITY_PROVIDER_TYPE` fell back to `'signicat'` (selecting the WRONG provider no matter what the root file said) and the client id and authorize endpoint became `''`, which made `signicatProvider.getAuthorizeUrl` emit a RELATIVE url that the browser resolved back to the current route. That is the bank-auth "clicking Identify yourself just reloads the page" defect; see `.planning/debug/resolved/idura-bank-auth-empty-client.md`.
    //
    // This is the general fix for that whole class. `vite.projectIdEnv.ts` is the surviving narrow workaround for ONE instance of it (`PUBLIC_PROJECT_ID`/`E2E_PROJECT_ID`) and stays: it runs earlier, in the Vite config, and still carries the two ids into `process.env` so a one-off shell override keeps winning. Do NOT treat that bridge as a precedent for adding more per-variable bridges — this line is why none are needed.
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
