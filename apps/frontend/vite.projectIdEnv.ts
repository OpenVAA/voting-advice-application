import { loadEnv } from 'vite';

/**
 * The two project-id keys carried from the repo root into the Vite process environment. `loadEnv` treats them as prefixes, so what it returns can also carry a longer key such as `PUBLIC_PROJECT_ID_OLD`. Only these two keys are written, so nothing else in the root env file reaches the process environment.
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
 * SvelteKit reads the repo-root `.env` itself (`kit.env.dir` in `svelte.config.js`), but its `loadEnv` lets any `process.env` entry override the file, an empty one included. This function runs first, in the Vite config, and writes the file's project ids into `process.env` wherever the shell left them unset, empty or whitespace-only, so SvelteKit then sees the file value and a non-blank shell value still wins.
 *
 * A key already carrying a non-blank value in `target` is left alone. A key present in neither source is left ABSENT: this function never invents a value, because a project id substituted here would be a silent fallback the adapter could not tell from a configured one.
 * @param options - The mode, the repo root to read from, and the record to write into.
 * @returns The env-file values, overridden by any non-blank `process.env` value, before `target` was written.
 */
export function resolveProjectIdEnv({ mode, repoRoot, target }: ResolveProjectIdEnvOptions): Record<string, string> {
  const loaded = loadWithoutEmptyShellValues(mode, repoRoot);

  for (const key of PROJECT_ID_ENV_KEYS) {
    if (!isBlank(target[key])) continue;
    const value = loaded[key];
    if (isBlank(value)) continue;
    target[key] = value;
  }

  return loaded;
}

/**
 * Whether an env value carries no information: absent, empty or whitespace-only.
 * @param value - The value to test.
 * @returns `true` when the value is blank.
 */
function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim() === '';
}

/**
 * Run `loadEnv` for the project-id keys with any key the shell set to a blank value removed from `process.env` for the duration of the call, so its overlay cannot replace a file value with a blank one. The removed values are restored afterwards.
 * @param mode - Vite's mode.
 * @param repoRoot - The directory holding the repo-root env file.
 * @returns What `loadEnv` resolved.
 */
function loadWithoutEmptyShellValues(mode: string, repoRoot: string): Record<string, string> {
  const removed = PROJECT_ID_ENV_KEYS.flatMap((key) => {
    const value = process.env[key];
    return value !== undefined && isBlank(value) ? [[key, value] as const] : [];
  });
  for (const [key] of removed) delete process.env[key];
  try {
    return loadEnv(mode, repoRoot, [...PROJECT_ID_ENV_KEYS]);
  } finally {
    for (const [key, value] of removed) process.env[key] = value;
  }
}
