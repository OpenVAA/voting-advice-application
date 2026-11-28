/**
 * Asset inventory lock.
 *
 * Fails if:
 *   - The pool is empty.
 *   - A portrait's name drifts from `portrait-NN.jpg`, the Writer's own filter, so the Writer would skip it.
 *   - Any file is empty or not a JPEG.
 *   - LICENSE.md is missing.
 *
 * contract: pure I/O via `node:fs`. No Supabase imports.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'portraits');
const FILENAME_PATTERN = /^portrait-\d{2}\.jpg$/;

// JPEG magic number: FF D8 FF
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

describe('portrait assets', () => {
  const files = readdirSync(ASSETS_DIR);
  const portraits = files.filter((f) => f.endsWith('.jpg'));

  it('contains at least one portrait JPEG file', () => {
    expect(portraits.length).toBeGreaterThan(0);
  });

  it('every portrait matches the portrait-NN.jpg naming pattern', () => {
    for (const f of portraits) {
      expect(f).toMatch(FILENAME_PATTERN);
    }
  });

  it('every portrait is a non-empty JPEG file', () => {
    for (const f of portraits) {
      const path = join(ASSETS_DIR, f);
      const stats = statSync(path);
      expect(stats.size).toBeGreaterThan(0);
      const head = readFileSync(path).subarray(0, 3);
      expect(head.equals(JPEG_MAGIC)).toBe(true);
    }
  });

  it('LICENSE.md is present in the assets directory', () => {
    expect(files).toContain('LICENSE.md');
  });
});
