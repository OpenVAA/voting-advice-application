/**
 * `StoredCustomizationSchema` — the stored shape of the `app_settings.customization` JSONB column.
 *
 * Covers the `{}` case both the column default and the provider's `PGRST116` branch produce, the four measured stored-vs-application divergences, and one unknown-key rejection per nesting level: top level, inside an image, and inside a `candidateAppFAQ` entry.
 */

import { describe, expect, it } from 'vitest';
import { StoredCustomizationSchema } from './storedCustomization.schema';

describe('StoredCustomizationSchema', () => {
  it("accepts `{}` — the column defaults to `'{}'::jsonb` and the provider returns `{}` on PGRST116", () => {
    expect(StoredCustomizationSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a representative full payload with every measured stored-shape divergence', () => {
    const input = {
      publisherName: { en: 'The Publisher', fi: 'Julkaisija' },
      publisherLogo: { path: 'brand/logo.png', pathDark: 'brand/logo-dark.png', alt: 'Logo' },
      poster: { path: 'brand/poster.png' },
      candPoster: { path: 'brand/cand-poster.png', focalPoint: { x: 0.5, y: 0.25 } },
      translationOverrides: { 'common.next': { en: 'Onwards', fi: 'Eteenpäin' } },
      candidateAppFAQ: [{ question: { en: 'How?' }, answer: { en: 'Like this.' } }]
    };
    const result = StoredCustomizationSchema.safeParse(input);
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data).toEqual(input);
  });

  it('LEVEL 1: rejects an unknown key at the top level', () => {
    const result = StoredCustomizationSchema.safeParse({ bogusTopLevel: 1 });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && JSON.stringify(result.error.issues)).toMatch(/bogusTopLevel/);
  });

  it('LEVEL 2: rejects an unknown key inside `publisherLogo`, which reuses `StoredImageSchema`', () => {
    // The image member is the shared `StoredImageSchema`, so this case also proves the reuse is by reference rather than by a re-declared, laxer copy.
    const result = StoredCustomizationSchema.safeParse({ publisherLogo: { path: 'a.png', bogusImageKey: 1 } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['publisherLogo']);
  });

  it('LEVEL 2: rejects an unknown key inside a `candidateAppFAQ` entry', () => {
    // Top-level strictness alone does NOT reach into an array element: measured at zod 4.3.6, a top-level-only strict schema parses this input with SUCCESS and silently strips `bogusFaqKey`.
    const result = StoredCustomizationSchema.safeParse({
      candidateAppFAQ: [{ question: { en: 'How?' }, answer: { en: 'Like this.' }, bogusFaqKey: 1 }]
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['candidateAppFAQ', 0]);
  });

  it('rejects a plain-string `publisherName` — the stored form is a locale object', () => {
    const result = StoredCustomizationSchema.safeParse({ publisherName: 'The Publisher' });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['publisherName']);
  });

  it('rejects an image given as a resolved URL — the stored form is a storage path', () => {
    expect(StoredCustomizationSchema.safeParse({ poster: { url: 'https://example.test/p.png' } }).success).toBe(false);
  });
});
