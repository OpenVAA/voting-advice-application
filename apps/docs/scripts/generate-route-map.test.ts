import { mkdir, mkdtemp, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateRouteMap } from './generate-route-map';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'docs-routes-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('generateRouteMap', () => {
  it('writes the map alone, removing what an earlier run left in the output directory', async () => {
    const out = path.join(root, 'out');
    await mkdir(path.join(out, 'old'), { recursive: true });
    await writeFile(path.join(out, 'old', '+page.md'), '# Old\n');

    await generateRouteMap({ outputDir: out });

    expect(await readdir(out)).toEqual(['README.md']);
  });
});
