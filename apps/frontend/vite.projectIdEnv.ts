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
 * SvelteKit reads the repo-root `.env` itself (`kit.env.dir` in `svelte.config.js`), but its `loadEnv` lets any `process.env` entry override the file, an empty one included. This function runs first, in the Vite config, and writes the file's project ids into `process.env` wherever the shell left them unset or empty, so SvelteKit then sees the file value and a non-empty shell value still wins.
 *
 * A key already carrying a non-empty value in `target` is left alone. A key present in neither source is left ABSENT: this function never invents a value, because a project id substituted here would be a silent fallback the adapter could not tell from a configured one.
 * @param options - The mode, the repo root to read from, and the record to write into.
 * @returns The env-file values, overridden by any non-empty `process.env` value, before `target` was written.
 */
export function resolveProjectIdEnv({ mode, repoRoot, target }: ResolveProjectIdEnvOptions): Record<string, string> {
  const loaded = loadWithoutEmptyShellValues(mode, repoRoot);

  for (const key of PROJECT_ID_ENV_KEYS) {
    const existing = target[key];
    if (existing !== undefined && existing !== '') continue;
    const value = loaded[key];
    if (value === undefined || value === '') continue;
    target[key] = value;
  }

  return loaded;
}

/**
 * Run `loadEnv` for the project-id keys with any key the shell set to `''` removed from `process.env` for the duration of the call, so its overlay cannot replace a file value with the empty string. The removed keys are restored afterwards.
 * @param mode - Vite's mode.
 * @param repoRoot - The directory holding the repo-root env file.
 * @returns What `loadEnv` resolved.
 */
function loadWithoutEmptyShellValues(mode: string, repoRoot: string): Record<string, string> {
  const emptied = PROJECT_ID_ENV_KEYS.filter((key) => process.env[key] === '');
  for (const key of emptied) delete process.env[key];
  try {
    return loadEnv(mode, repoRoot, [...PROJECT_ID_ENV_KEYS]);
  } finally {
    for (const key of emptied) process.env[key] = '';
  }
}
