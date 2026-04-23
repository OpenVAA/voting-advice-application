/**
 * Asset inventory lock (GEN-10).
 *
 * Fails if:
 *   - Portrait count drifts from 30 (D-58-05 locked count).
 *   - Naming pattern drifts from `portrait-NN.jpg` (deterministic cycling in Writer).
 *   - Any file is empty or not a JPEG.
 *   - LICENSE.md is missing.
 *
 * D-22 contract: pure I/O via `node:fs`. No Supabase imports.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'portraits');
const EXPECTED_COUNT = 30;
const FILENAME_PATTERN = /^portrait-(0[1-9]|[12][0-9]|30)\.jpg$/;

// JPEG magic number: FF D8 FF
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

describe('portrait assets (GEN-10)', () => {
  const files = readdirSync(ASSETS_DIR);
  const portraits = files.filter((f) => f.endsWith('.jpg'));

  it('contains exactly 30 portrait JPEG files (D-58-05)', () => {
    expect(portraits.length).toBe(EXPECTED_COUNT);
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

  it('portrait filenames sort deterministically (writer cycles portraits[i % 30])', () => {
    const sorted = [...portraits].sort();
    // portrait-01.jpg must sort first, portrait-30.jpg must sort last.
    expect(sorted[0]).toBe('portrait-01.jpg');
    expect(sorted[sorted.length - 1]).toBe('portrait-30.jpg');
  });
});
