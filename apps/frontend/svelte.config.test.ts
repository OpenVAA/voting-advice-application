// @vitest-environment node

// Node environment for the same reason as `vite.projectIdEnv.test.ts`: this file touches the real filesystem and the SvelteKit config, neither of which wants the project-wide jsdom realm.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import config from './svelte.config.js';

/**
 * Guard on `kit.env.dir`.
 *
 * This is a REGRESSION TEST, not a tidiness check. With `kit.env.dir` unset, SvelteKit defaults it to `process.cwd()`, and `yarn workspace @openvaa/frontend dev` runs vite with cwd `apps/frontend` — so the repo-root `.env` that `.env.example`, `CLAUDE.md` and `apps/frontend/.env.example` all name as the canonical file was never read. Every variable written only at the root silently resolved to `undefined`, and the `??` defaults in `$lib/utils/constants.ts` turned that into plausible-looking values instead of an error: bank auth selected the Signicat provider no matter what the root file said, and emitted an authorize url with an empty `client_id` and no origin.
 *
 * The defect was invisible for the life of the repo because a stale, gitignored `apps/frontend/.env` happened to carry the two Supabase keys, so the app kept working and only the identity-provider feature broke. Nothing but a test can notice that, which is why this one exists. See `.planning/debug/resolved/idura-bank-auth-empty-client.md`.
 */
describe('svelte.config.js — kit.env.dir', () => {
  const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
  const frontendDir = fileURLToPath(new URL('.', import.meta.url));

  it('is set at all (an absent value silently defaults to process.cwd())', () => {
    expect(config.kit?.env?.dir).toBeDefined();
  });

  it('points at the repo root, not at the frontend workspace', () => {
    // Compared with the trailing separator normalised away: `fileURLToPath` on a directory URL keeps it, and whether the config carries one is not the property under test.
    const strip = (p: string) => p.replace(/[/\\]+$/, '');

    expect(strip(config.kit?.env?.dir as string)).toBe(strip(repoRoot));
    expect(strip(config.kit?.env?.dir as string)).not.toBe(strip(frontendDir));
  });

  it('points at a directory that actually holds the canonical env template', () => {
    // `.env` itself is untracked and absent on CI, so assert on the committed template that sits beside it. If this resolves somewhere without an `.env.example`, the path is wrong regardless of what the string looks like.
    expect(existsSync(join(config.kit?.env?.dir as string, '.env.example'))).toBe(true);
  });

  it('resolves the identity-provider variables the frontend reads, which the frontend workspace does not', async () => {
    // The end-to-end property, and the one that actually failed: ask Vite to resolve env the way SvelteKit will, from both candidate directories, and assert the chosen one is the directory where the identity-provider names exist.
    //
    // Skipped rather than failed when the checkout has no configured root `.env` (CI, a fresh clone): the absence of an untracked file is not a regression in this config. The three cases above are the unconditional guard.
    const { loadEnv } = await import('vite');
    const NAME = 'PUBLIC_IDENTITY_PROVIDER_TYPE';

    const fromRoot = loadEnv('development', repoRoot, '')[NAME];
    if (fromRoot === undefined || fromRoot === '') return;

    const fromConfiguredDir = loadEnv('development', config.kit?.env?.dir as string, '')[NAME];
    expect(fromConfiguredDir).toBe(fromRoot);
  });
});

/**
 * Guard on `kit.version.name`, the build id.
 *
 * The name is what `/_app/version.json` and the `version` export of `$app/environment` carry, and what the client's version poll compares. A build given `BUILD_SHA` must carry that value. A build given none must leave the name undefined, so that kit falls back to its time-based default.
 *
 * The empty-string case is the load-bearing one. An unset Docker build argument reaches the build as an empty value, and kit accepts an empty string as a name: every build would then share one version, and the client's version poll would never see a new deployment.
 *
 * The config reads the variable when its module is evaluated, so each case sets the variable, resets the module registry and imports the config again.
 */
describe('svelte.config.js — kit.version.name', () => {
  /** The variable the build id is read from. */
  const BUILD_SHA = 'BUILD_SHA';

  /** The interval of the client's version poll, which the build id must leave alone. */
  const POLL_INTERVAL_MS = 5 * 60 * 1000;

  /** The value the variable had when this file was loaded, restored after each case. */
  const initialBuildSha = process.env[BUILD_SHA];

  /** Set the variable, or remove it when `value` is `undefined`. */
  function setBuildSha(value: string | undefined): void {
    if (value === undefined) Reflect.deleteProperty(process.env, BUILD_SHA);
    else process.env[BUILD_SHA] = value;
  }

  /** Import the config afresh, as a build started with `buildSha` in its environment evaluates it. `undefined` stands for an unset variable. */
  async function configBuiltWith(buildSha: string | undefined): Promise<typeof config> {
    setBuildSha(buildSha);
    vi.resetModules();
    return (await import('./svelte.config.js')).default;
  }

  afterEach(() => {
    setBuildSha(initialBuildSha);
    vi.resetModules();
  });

  it('is the BUILD_SHA the build was given', async () => {
    const built = await configBuiltWith('abc1234');
    expect(built.kit?.version?.name).toBe('abc1234');
  });

  it('is undefined when BUILD_SHA is unset', async () => {
    const built = await configBuiltWith(undefined);
    expect(built.kit?.version?.name).toBeUndefined();
  });

  it('is undefined, not the empty string, when BUILD_SHA is empty', async () => {
    const built = await configBuiltWith('');
    expect(built.kit?.version?.name).toBeUndefined();
  });

  it.each([
    ['set', 'abc1234'],
    ['unset', undefined],
    ['empty', '']
  ])('leaves the poll interval alone when BUILD_SHA is %s', async (_state, buildSha) => {
    const built = await configBuiltWith(buildSha);
    expect(built.kit?.version?.pollInterval).toBe(POLL_INTERVAL_MS);
  });
});
