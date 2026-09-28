// @vitest-environment node

// Node environment for the same reason as `vite.projectIdEnv.test.ts`: this file touches the real filesystem and the SvelteKit config, neither of which wants the project-wide jsdom realm.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
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
