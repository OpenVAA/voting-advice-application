import { describe, expect, it } from 'vitest';
import { mergeAppSettings } from './settings';
import type { DynamicSettings, StaticSettings } from '@openvaa/app-shared';

/**
 * Wave-0 purity gate for `mergeAppSettings` (CTX-01 / D-05, Pattern 8).
 *
 * The historical bug: `mergeAppSettings` returned `Object.assign(target, nonNull)`,
 * mutating the shared `staticSettings` module reference and polluting every other
 * context that read it. The fix makes the merge a pure spread
 * `{ ...target, ...nonNull }`. These tests pin that purity.
 *
 * NB: the real `StaticSettings`/`DynamicSettings` are deep objects; the merge is a
 * shallow root-key merge that drops nullish values. We exercise that contract with
 * small representative objects cast to the public types — the behaviour under test
 * (root-key spread + nullish filter + no `target` mutation) is shape-agnostic.
 */
describe('mergeAppSettings', () => {
  it('returns a new object equal to { ...target, ...nonNull(additional) }', () => {
    const target = { colors: { primary: 'red' }, locales: ['en'] } as unknown as StaticSettings;
    const additional = { matching: { algorithm: 'manhattan' } } as unknown as DynamicSettings;

    const result = mergeAppSettings(target, additional);

    expect(result).toEqual({
      colors: { primary: 'red' },
      locales: ['en'],
      matching: { algorithm: 'manhattan' }
    });
  });

  it('does not mutate the target object (no shared-ref mutation)', () => {
    const target = { colors: { primary: 'red' }, locales: ['en'] } as unknown as StaticSettings;
    const targetSnapshot = JSON.parse(JSON.stringify(target));
    const additional = { matching: { algorithm: 'manhattan' } } as unknown as DynamicSettings;

    const result = mergeAppSettings(target, additional);

    // target must be structurally unchanged after the call.
    expect(target).toEqual(targetSnapshot);
    // and the returned object must be a different reference than target.
    expect(result).not.toBe(target);
  });

  it('filters out null/undefined values in additional (does not overwrite populated target keys)', () => {
    const target = { colors: { primary: 'red' }, locales: ['en'] } as unknown as StaticSettings;
    const additional = { colors: null, locales: undefined, matching: { algorithm: 'manhattan' } } as unknown as DynamicSettings;

    const result = mergeAppSettings(target, additional) as unknown as Record<string, unknown>;

    expect(result.colors).toEqual({ primary: 'red' });
    expect(result.locales).toEqual(['en']);
    expect(result.matching).toEqual({ algorithm: 'manhattan' });
  });

  it('overrides the corresponding target key when additional has a non-null value', () => {
    const target = { colors: { primary: 'red' } } as unknown as StaticSettings;
    const additional = { colors: { primary: 'blue' } } as unknown as DynamicSettings;

    const result = mergeAppSettings(target, additional) as unknown as Record<string, unknown>;

    expect(result.colors).toEqual({ primary: 'blue' });
  });
});
