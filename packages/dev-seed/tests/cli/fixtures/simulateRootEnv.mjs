/**
 * Preload for the `.env` load-order tests in `../localityGuard.test.ts`, passed to a CLI subprocess with `--import` after `tsx`.
 *
 * It simulates the repo-root `.env` without reading or writing the real one, and it makes the subprocess hermetic:
 *
 * - `process.loadEnvFile` copies the entries of `JSON.parse(process.env.SIMULATED_ROOT_ENV)` into `process.env`. Like the real function it leaves a variable that is already set alone, and it ignores the path it is given.
 * - `globalThis.fetch` rejects with a fixed error, so a CLI that gets past the locality guard fails without contacting any Supabase, local or not.
 */

const NETWORK_DISABLED = 'network disabled by simulateRootEnv';

const simulated = JSON.parse(process.env.SIMULATED_ROOT_ENV ?? '{}');

// `Object.assign` rather than `process.loadEnvFile = ...` and `globalThis.fetch = ...`: this package's `tsc` includes `tests/**/*`, and in a JavaScript file a direct assignment to a member of `process` or `globalThis` declares that member's type for the whole program, which would retype both for every caller.
Object.assign(process, {
  loadEnvFile: () => {
    for (const [name, value] of Object.entries(simulated)) {
      if (process.env[name] === undefined) process.env[name] = String(value);
    }
  }
});

Object.assign(globalThis, {
  fetch: () => Promise.reject(new Error(NETWORK_DISABLED))
});
