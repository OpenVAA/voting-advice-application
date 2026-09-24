// @vitest-environment node

// The node environment is mandatory here, not a preference. This file imports `vite`, which loads esbuild, and esbuild asserts that `new TextEncoder().encode('') instanceof Uint8Array`. Under the project-wide jsdom environment that encoder comes from a different realm and the assertion is false, so esbuild refuses to load and the whole suite fails to collect.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveProjectIdEnv } from './vite.projectIdEnv';

/**
 * The plumbing that carries the project id from the repo-root env file into the Vite process environment.
 *
 * Each case builds its own throwaway directory and hands it in as `repoRoot`, so nothing here depends on the checkout's own `.env`, which is untracked and differs between machines.
 */
describe('resolveProjectIdEnv', () => {
  const roots: Array<string> = [];

  function makeRoot(contents: string | null): string {
    const root = mkdtempSync(join(tmpdir(), 'openvaa-project-id-env-'));
    roots.push(root);
    if (contents !== null) writeFileSync(join(root, '.env'), contents, 'utf8');
    return root;
  }

  afterEach(() => {
    while (roots.length) rmSync(roots.pop() as string, { recursive: true, force: true });
  });

  it('copies both project-id keys out of the repo-root env file into an empty target', () => {
    const repoRoot = makeRoot(
      'PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001\nE2E_PROJECT_ID=00000000-0000-0000-0000-0000000000e2\n'
    );
    const target: Record<string, string | undefined> = {};

    resolveProjectIdEnv({ mode: 'development', repoRoot, target });

    expect(target.PUBLIC_PROJECT_ID).toBe('00000000-0000-0000-0000-000000000001');
    expect(target.E2E_PROJECT_ID).toBe('00000000-0000-0000-0000-0000000000e2');
  });

  it('leaves a value already present in the target alone, so a one-off shell prefix still wins', () => {
    const repoRoot = makeRoot('PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001\n');
    const target: Record<string, string | undefined> = {
      PUBLIC_PROJECT_ID: '00000000-0000-0000-0000-0000000000e2'
    };

    resolveProjectIdEnv({ mode: 'development', repoRoot, target });

    expect(target.PUBLIC_PROJECT_ID).toBe('00000000-0000-0000-0000-0000000000e2');
  });

  it('overwrites an empty-string value in the target, which carries no information', () => {
    const repoRoot = makeRoot('PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001\n');
    const target: Record<string, string | undefined> = { PUBLIC_PROJECT_ID: '' };

    resolveProjectIdEnv({ mode: 'development', repoRoot, target });

    expect(target.PUBLIC_PROJECT_ID).toBe('00000000-0000-0000-0000-000000000001');
  });

  it('invents nothing when neither the target nor the env file carries a value', () => {
    const repoRoot = makeRoot(null);
    const target: Record<string, string | undefined> = {};

    resolveProjectIdEnv({ mode: 'development', repoRoot, target });

    expect('PUBLIC_PROJECT_ID' in target).toBe(false);
    expect('E2E_PROJECT_ID' in target).toBe(false);
  });

  it('reads only the two declared keys, never the rest of the env file', () => {
    const repoRoot = makeRoot(
      'PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001\nIDENTITY_PROVIDER_CLIENT_SECRET=super-secret\n'
    );
    const target: Record<string, string | undefined> = {};

    resolveProjectIdEnv({ mode: 'development', repoRoot, target });

    expect(target.PUBLIC_PROJECT_ID).toBe('00000000-0000-0000-0000-000000000001');
    expect('IDENTITY_PROVIDER_CLIENT_SECRET' in target).toBe(false);
  });
});
