import { tmpdir } from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it, vi } from 'vitest';

const DOCS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const startDir = process.cwd();

afterEach(() => {
  process.chdir(startDir);
  vi.resetModules();
});

describe('docs-scripts.config', () => {
  it('roots every directory at the docs workspace whatever directory the script is started from', async () => {
    process.chdir(tmpdir());
    vi.resetModules();
    const config = await import('./docs-scripts.config');

    expect(config.DOCS_ROOT).toBe(DOCS_DIR);
    expect(config.FRONTEND_ROOT).toBe(path.resolve(DOCS_DIR, '..', 'frontend'));
    expect(config.GENERATED_DIR).toBe(path.join(DOCS_DIR, 'scripts', '.temp'));
  });
});
