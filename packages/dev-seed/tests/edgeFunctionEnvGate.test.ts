/**
 * The Edge Function required-env guard derives its required names from code only. A `Deno.env.get(...)` read that appears in a comment is an example, not a requirement, so the guard's comment blanking must remove it before the enforcement patterns run.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

type CommentFamily = Record<string, boolean>;

interface EdgeFunctionEnvGuard {
  TS_FAMILY: CommentFamily;
  blankComments: (text: string, family: CommentFamily) => string;
}

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');
const GUARD_PATH = resolve(REPO_ROOT, 'scripts/assert-edge-function-env.mjs');

function loadGuard(): Promise<EdgeFunctionEnvGuard> {
  return import(pathToFileURL(GUARD_PATH).href) as Promise<EdgeFunctionEnvGuard>;
}

describe('the Edge Function required-env guard blanks comments before matching', () => {
  it('removes `Deno.env.get` reads inside line and block comments', async () => {
    const { TS_FAMILY, blankComments } = await loadGuard();
    const source = 'const a = 1; // Deno.env.get("X")\n/* Deno.env.get("Y") */\n';
    expect(blankComments(source, TS_FAMILY)).not.toContain('Deno.env.get');
  });

  it('keeps a `Deno.env.get` read in code', async () => {
    const { TS_FAMILY, blankComments } = await loadGuard();
    const source = 'const z = Deno.env.get("Z"); // the Z read\n';
    expect(blankComments(source, TS_FAMILY)).toContain('Deno.env.get("Z")');
  });

  it('preserves offsets and line breaks, so reported line numbers stay true', async () => {
    const { TS_FAMILY, blankComments } = await loadGuard();
    const source = '/* one\n * two\n */\nconst b = 2;\n';
    const blanked = blankComments(source, TS_FAMILY);
    expect(blanked).toHaveLength(source.length);
    expect(blanked.split('\n')).toHaveLength(source.split('\n').length);
    expect(blanked).toContain('const b = 2;');
  });
});
