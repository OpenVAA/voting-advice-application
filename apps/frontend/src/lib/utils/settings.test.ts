import { describe, expect, it } from 'vitest';
import { mergeAppSettings, mergeInitialAppSettings } from './settings';
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
    const additional = {
      colors: null,
      locales: undefined,
      matching: { algorithm: 'manhattan' }
    } as unknown as DynamicSettings;

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

/**
 * D-04 (CTX-01) SSR-init assertion. `appContext` folds the DB override into the
 * INITIAL `$state` value via `mergeInitialAppSettings` (read synchronously from
 * `page.data.appSettingsData`). Because the merge happens at init — NOT in an
 * `$effect` (which never runs on the server) — the server-rendered HTML already
 * carries the DB override (no post-hydration default→override flash).
 *
 * These assertions are the unit-level equivalent of spike 008 variantB's
 * `initialMergeIncludedDbOverride === true`: they pass through the same pure
 * init-merge the `$state(...)` declaration calls, with NO `$effect` flush, and
 * prove a sentinel DB-override value is present in the initial value. They FAIL
 * if the merge is reverted to `$effect`-only (because then `mergeInitialAppSettings`
 * would no longer apply `dbData` and the sentinel would be absent).
 */
describe('mergeInitialAppSettings (SSR-init DB-override merge)', () => {
  const staticPart = { colors: { primary: 'red' }, logo: 'default-logo' } as unknown as StaticSettings;
  const dynamicPart = { matching: { algorithm: 'manhattan' } } as unknown as DynamicSettings;

  it('includes a sentinel DB override in the INITIAL value (no $effect needed)', () => {
    // SENTINEL override — distinguishable from both static + dynamic defaults.
    const dbData = { colors: { primary: 'SENTINEL_DB_COLOR' }, logo: 'SENTINEL_DB_LOGO' } as unknown as DynamicSettings;

    const initial = mergeInitialAppSettings(staticPart, dynamicPart, dbData) as unknown as Record<string, unknown>;

    // The DB override IS present in the initial (server/init) value.
    expect(initial.colors).toEqual({ primary: 'SENTINEL_DB_COLOR' });
    expect(initial.logo).toBe('SENTINEL_DB_LOGO');
    // The non-overridden static∪dynamic base is still merged in.
    expect(initial.matching).toEqual({ algorithm: 'manhattan' });
  });

  it('returns the base static∪dynamic merge when dbData is undefined (no DB override available)', () => {
    const initial = mergeInitialAppSettings(staticPart, dynamicPart, undefined) as unknown as Record<string, unknown>;

    expect(initial.colors).toEqual({ primary: 'red' });
    expect(initial.logo).toBe('default-logo');
    expect(initial.matching).toEqual({ algorithm: 'manhattan' });
  });

  it('returns the base merge when dbData is an Error (failed loader result) — does not apply the override', () => {
    const dbData = new Error('appSettingsData load failed') as unknown as DynamicSettings | Error;

    const initial = mergeInitialAppSettings(staticPart, dynamicPart, dbData) as unknown as Record<string, unknown>;

    // Error result must NOT pollute the initial value — base merge only.
    expect(initial.colors).toEqual({ primary: 'red' });
    expect(initial.logo).toBe('default-logo');
  });

  it('does not mutate the static target (purity preserved through the init merge)', () => {
    const target = { colors: { primary: 'red' } } as unknown as StaticSettings;
    const snapshot = JSON.parse(JSON.stringify(target));
    const dbData = { colors: { primary: 'SENTINEL_DB_COLOR' } } as unknown as DynamicSettings;

    mergeInitialAppSettings(target, dynamicPart, dbData);

    expect(target).toEqual(snapshot);
  });
});
