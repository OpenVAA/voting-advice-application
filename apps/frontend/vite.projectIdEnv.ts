import { loadEnv } from 'vite';

/**
 * The two project-id keys carried from the repo root into the Vite process environment. They are named literally rather than matched by a prefix, so nothing else in the root env file is pulled into the bundle.
 */
const PROJECT_ID_ENV_KEYS = ['PUBLIC_PROJECT_ID', 'E2E_PROJECT_ID'] as const;

/** What `resolveProjectIdEnv` needs to do its work. */
export type ResolveProjectIdEnvOptions = {
  /** Vite's mode, forwarded to `loadEnv` so a `.env.<mode>` file is honoured exactly as Vite would honour it. */
  mode: string;
  /** The directory holding the repo-root env file. */
  repoRoot: string;
  /** The environment record to write the resolved values into. In the Vite config this is `process.env`. */
  target: Record<string, string | undefined>;
};

/**
 * Copy the project-id keys from the repo-root env file into `target`.
 *
 * The repo-root `.env` is not the file SvelteKit reads. SvelteKit calls `loadEnv(mode, kit.env.dir, '')` with `kit.env.dir` defaulting to `process.cwd()`, and the frontend workspace's cwd is `apps/frontend` — so a value written only in the repo-root file never reaches `$env/dynamic/public` on its own. This function is the bridge, and it is the same shape the `FRONTEND_PORT` read in `vite.config.ts` already uses.
 *
 * A key already carrying a non-empty value in `target` is left alone, so a one-off shell prefix keeps winning over a persistent value in the file. A key present in neither source is left ABSENT: this function never invents a value, because a project id substituted here would be a silent fallback the adapter could not tell from a configured one.
 * @param options - The mode, the repo root to read from, and the record to write into.
 * @returns The record `loadEnv` resolved, before any of the write-back rules were applied.
 */
export function resolveProjectIdEnv({ mode, repoRoot, target }: ResolveProjectIdEnvOptions): Record<string, string> {
  const loaded = loadEnv(mode, repoRoot, [...PROJECT_ID_ENV_KEYS]);

  for (const key of PROJECT_ID_ENV_KEYS) {
    const existing = target[key];
    if (existing !== undefined && existing !== '') continue;
    const value = loaded[key];
    if (value === undefined || value === '') continue;
    target[key] = value;
  }

  return loaded;
}
