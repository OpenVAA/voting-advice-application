import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createValidationResult, markdownPass, parseArgs, validateStubs } from './validate-links';

describe('markdownPass', () => {
  it('rewrites markdown in default mode', () => {
    expect(markdownPass(parseArgs([]))).toEqual({ runs: true, writes: true });
  });

  it('writes no markdown when --only leaves out md-link', () => {
    expect(markdownPass(parseArgs(['--only', 'svelte-href'])).writes).toBe(false);
    expect(markdownPass(parseArgs(['--only', 'anchor'])).writes).toBe(false);
  });

  it('writes nothing in check mode', () => {
    expect(markdownPass(parseArgs(['--check'])).writes).toBe(false);
  });
});

describe('validateStubs', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'docs-stubs-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  async function writeStub(prerender: string): Promise<void> {
    await mkdir(path.join(root, 'old-page'));
    await writeFile(
      path.join(root, 'old-page', '+page.ts'),
      `import { redirect } from '@sveltejs/kit';\n\n${prerender}export function load() {\n  redirect(308, '/developers-guide/about-these-docs');\n}\n`
    );
  }

  it('reports a stub that does not export prerender = true as a stub finding', async () => {
    await writeStub('');
    const result = createValidationResult();
    await validateStubs(result, root);

    expect(result.stubs).toBe(1);
    expect(result.findings.map((f) => f.kind)).toEqual(['stub']);
    expect(result.findings[0].reason).toContain('export const prerender = true');
  });

  it('reports nothing for a stub that exports prerender = true and redirects to a page', async () => {
    await writeStub('export const prerender = true;\n\n');
    const result = createValidationResult();
    await validateStubs(result, root);

    expect(result.stubs).toBe(1);
    expect(result.findings).toEqual([]);
  });
});
