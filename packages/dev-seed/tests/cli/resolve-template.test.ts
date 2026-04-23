/**
 * resolve-template.ts tests (TMPL-06 + D-58-09 + D-58-10).
 */

import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resolveTemplate } from '../../src/cli/resolve-template';
import type { Template } from '../../src/template/types';

const minimal: Template = { seed: 42 };

// Temp JSON fixture
const TMP_JSON = join(tmpdir(), 'resolve-template-test.json');
const TMP_JSON_BAD = join(tmpdir(), 'resolve-template-test-bad.json');

beforeAll(() => {
  writeFileSync(TMP_JSON, JSON.stringify({ seed: 99, externalIdPrefix: 'x_' }));
  writeFileSync(TMP_JSON_BAD, JSON.stringify({ seed: 'not-a-number' }));
});
afterAll(() => {
  try {
    unlinkSync(TMP_JSON);
  } catch {
    /* ignore */
  }
  try {
    unlinkSync(TMP_JSON_BAD);
  } catch {
    /* ignore */
  }
});

describe('resolveTemplate', () => {
  it('resolves a known built-in name', async () => {
    const r = await resolveTemplate('default', { default: minimal });
    expect(r).toEqual(minimal);
  });

  it('throws for unknown name with built-in list + path suggestion', async () => {
    await expect(resolveTemplate('nope', {})).rejects.toThrow(/Unknown template: 'nope'/);
    await expect(resolveTemplate('nope', {})).rejects.toThrow(/Built-in templates:/);
    await expect(resolveTemplate('nope', {})).rejects.toThrow(/\.\/my-template\.ts/);
  });

  it('lists "(none registered yet)" when built-ins map is empty', async () => {
    await expect(resolveTemplate('nope', {})).rejects.toThrow(/\(none registered yet\)/);
  });

  it('lists built-in names when map is populated', async () => {
    await expect(resolveTemplate('nope', { default: minimal, e2e: minimal })).rejects.toThrow(/default, e2e/);
  });

  it('loads a .json template from absolute path', async () => {
    const r = await resolveTemplate(TMP_JSON, {});
    expect(r.seed).toBe(99);
    expect(r.externalIdPrefix).toBe('x_');
  });

  it('surfaces zod validation errors with template.* field paths', async () => {
    await expect(resolveTemplate(TMP_JSON_BAD, {})).rejects.toThrow(/template\.seed/);
  });

  it('treats `./rel.ts` as a path (not a name lookup)', async () => {
    await expect(resolveTemplate('./rel.ts', { default: minimal })).rejects.toThrow(/Failed to load template module/);
  });

  it('treats `./rel.js` as a path', async () => {
    await expect(resolveTemplate('./rel.js', { default: minimal })).rejects.toThrow(/Failed to load template module/);
  });

  it('treats absolute path starting with `/` as a path', async () => {
    await expect(resolveTemplate('/nonexistent/file.json', {})).rejects.toThrow(/Failed to parse JSON template/);
  });

  it('treats `default.md` as name lookup (extension not in {.ts,.js,.json})', async () => {
    await expect(resolveTemplate('default.md', {})).rejects.toThrow(/Unknown template/);
  });

  it('surfaces JSON.parse errors with path', async () => {
    const badJson = join(tmpdir(), 'malformed.json');
    writeFileSync(badJson, '{ not valid json');
    try {
      await expect(resolveTemplate(badJson, {})).rejects.toThrow(/Failed to parse JSON template at/);
    } finally {
      unlinkSync(badJson);
    }
  });
});
