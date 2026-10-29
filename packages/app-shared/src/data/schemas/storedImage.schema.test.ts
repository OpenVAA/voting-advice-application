/**
 * `StoredImageSchema` — the stored shape of the `image` JSONB column on the seven content tables.
 *
 * Covers the `{ path }`-only minimum, every optional member, the top-level unknown-key rejection and the NESTED `focalPoint` unknown-key rejection, which is the case a top-level-only `.strict()` would silently strip.
 */

import { describe, expect, it } from 'vitest';
import { StoredImageSchema } from './storedImage.schema';

describe('StoredImageSchema', () => {
  it('accepts the minimum stored payload — a bare `path`', () => {
    const result = StoredImageSchema.safeParse({ path: 'a/b.png' });
    expect(result.success).toBe(true);
  });

  it('accepts every optional member together', () => {
    const input = {
      path: 'a/b.png',
      pathDark: 'a/b-dark.png',
      alt: 'An image.',
      width: 640,
      height: 480,
      focalPoint: { x: 1, y: 2 }
    };
    const result = StoredImageSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual(input);
  });

  it('rejects a missing `path` — it is the one required member', () => {
    const result = StoredImageSchema.safeParse({ alt: 'No path here.' });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['path']);
  });

  it('LEVEL 1: rejects an unknown key at the top level', () => {
    const result = StoredImageSchema.safeParse({ path: 'a/b.png', bogus: 1 });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && JSON.stringify(result.error.issues)).toMatch(/bogus/);
  });

  it('LEVEL 2: rejects an unknown key INSIDE `focalPoint`', () => {
    // Top-level strictness alone does NOT reach here: measured at zod 4.3.6, a top-level-only strict schema parses this input with SUCCESS and silently strips `bogus`. This case is why `focalPoint` carries its own strict setting.
    const result = StoredImageSchema.safeParse({ path: 'a/b.png', focalPoint: { x: 1, y: 2, bogus: 3 } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['focalPoint']);
  });

  it('`.nullable()` accepts `null`, because every image column is nullable', () => {
    expect(StoredImageSchema.nullable().safeParse(null).success).toBe(true);
  });

  it('rejects a non-string `path`', () => {
    expect(StoredImageSchema.safeParse({ path: 42 }).success).toBe(false);
  });
});
