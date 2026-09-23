import { describe, expect, it } from 'vitest';
import { mergeAppSettings, mergeInitialAppSettings } from './settings';
import type { DynamicSettings, StaticSettings } from '@openvaa/app-shared';

/**
 * Wave-0 purity gate for `mergeAppSettings` (Pattern 8).
 *
 * The historical bug: `mergeAppSettings` returned `Object.assign(target, nonNull)`, mutating the shared `staticSettings` module reference and polluting every other context that read it. The fix makes the merge a pure spread `{ ...target, ...nonNull }`. These tests pin that purity.
 *
 * NB: the real `StaticSettings`/`DynamicSettings` are deep objects; the merge is a shallow root-key merge that drops nullish values. We exercise that contract with small representative objects cast to the public types — the behaviour under test (root-key spread + nullish filter + no `target` mutation) is shape-agnostic.
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
 * SSR-init assertion. `appContext` folds the DB override into the INITIAL `$state` value via `mergeInitialAppSettings` (read synchronously from `page.data.appSettingsData`). Because the merge happens at init — NOT in an `$effect` (which never runs on the server) — the server-rendered HTML already carries the DB override (no post-hydration default→override flash).
 *
 * These assertions are the unit-level equivalent of asserting `initialMergeIncludedDbOverride === true` in a browser: they pass through the same pure init-merge the `$state(...)` declaration calls, with NO `$effect` flush, and prove a sentinel DB-override value is present in the initial value. They FAIL if the merge is reverted to `$effect`-only (because then `mergeInitialAppSettings` would no longer apply `dbData` and the sentinel would be absent).
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

/**
 * The `access.underMaintenance` fail-safe (criterion 3, decision **B2** as corrected by research **C-2**).
 *
 * `+layout.svelte` used to derive `underMaintenance` from the RAW loader payload — the DB column alone — with the shipped default duplicated inline as `?? false`. Under decision **B1(a)** a malformed settings column never becomes an `Error`; partial-preserve degrades it to `{}`, `isValidResult(…, { allowEmpty: true })` accepts that, and the inline default then resolved the gate to OFF. So a malformed column could silently UN-maintenance a deployment whose build-time `dynamicSettings` had declared `underMaintenance: true`. Nothing was observably broken, because the duplicate coincides with the shipped default — which is exactly why only a fail-safe-direction assertion catches it.
 *
 * These cases assert the merge behaviour the layout now reads. They are paired with the source-level case below, which is what binds them to the layout: the merge has always resolved fail-safe, so a merge-only assertion would have been green before the fix and would prove nothing.
 */
describe('access.underMaintenance fail-safe (the value the maintenance gate reads)', () => {
  const staticPart = { colors: { primary: 'red' } } as unknown as StaticSettings;
  const maintenanceOn = { access: { candidateApp: true, underMaintenance: true } } as unknown as DynamicSettings;
  const maintenanceOff = { access: { candidateApp: true, underMaintenance: false } } as unknown as DynamicSettings;

  it('resolves ON when the build-time settings declare maintenance and the stored column is malformed', () => {
    // A malformed `access` member is dropped whole by partial-preserve (decision A2), so the column reaches the layout as `{}`.
    const malformedColumn = {} as unknown as DynamicSettings;

    const merged = mergeInitialAppSettings(staticPart, maintenanceOn, malformedColumn);

    // The fail-safe direction: the build-time value survives a column that carries nothing usable.
    expect(merged.access?.underMaintenance).toBe(true);
    // And the mechanism of the defect, pinned: reading the RAW payload with an inline default yields the UN-safe answer from the very same inputs. A revert to `validity.appSettingsData.access?.underMaintenance ?? false` reinstates exactly this value.
    const asTheRawPayloadReadWouldResolveIt =
      (malformedColumn as { access?: { underMaintenance?: boolean } }).access?.underMaintenance ?? false;
    expect(asTheRawPayloadReadWouldResolveIt).toBe(false);
  });

  it('resolves ON when the build-time settings declare maintenance and the column is absent entirely', () => {
    const merged = mergeInitialAppSettings(staticPart, maintenanceOn, undefined);

    expect(merged.access?.underMaintenance).toBe(true);
  });

  it('lets an explicit column value override the build-time one (the override layer still overrides)', () => {
    const merged = mergeInitialAppSettings(staticPart, maintenanceOn, maintenanceOff);

    expect(merged.access?.underMaintenance).toBe(false);
  });

  it('resolves OFF when the build-time settings declare no maintenance and there is no column', () => {
    const merged = mergeInitialAppSettings(staticPart, maintenanceOff, undefined);

    expect(merged.access?.underMaintenance).toBe(false);
  });
});

/**
 * The source-level half of the same assertion: that the root layout actually READS the merged value.
 *
 * Stable anchor, deliberately NOT a line citation: the derivation is the `const underMaintenance = $derived(...)` declaration in `apps/frontend/src/routes/+layout.svelte`. Line ranges move on every edit (CONTEXT's own citation for this block was already off by one at both ends); the identifier does not.
 *
 * It lives in this file rather than beside the component because the merge is the thing under test — `+layout.svelte` is a route component with no unit harness, and the merge-behaviour cases above are green both before and after the fix. This case is what makes them mean something: it is the assertion that flips when the derivation's SOURCE changes.
 */
describe('the root layout reads the merged settings for the maintenance gate', () => {
  it('derives underMaintenance from the merged appSettings alias, not from the raw loader payload', async () => {
    const { existsSync, readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    // Resolved from the working directory rather than from `import.meta.url`: vitest serves modules over an http origin, so `import.meta.url` is not a `file:` URL here. Both candidates are tried and the miss is asserted, so a cwd change fails this case loudly instead of silently skipping it.
    const candidates = ['src/routes/+layout.svelte', 'apps/frontend/src/routes/+layout.svelte'].map((rel) =>
      resolve(process.cwd(), rel)
    );
    const layoutPath = candidates.find((candidate) => existsSync(candidate));
    expect(layoutPath, `+layout.svelte not found from cwd ${process.cwd()}`).toBeDefined();
    const layout = readFileSync(layoutPath as string, 'utf8');

    // Sliced from the declaration to its closing `);` rather than taken as one line, so a derivation that is reformatted across several lines is still read whole — a line-wise `find` would silently truncate it and turn the two negative assertions below into no-ops.
    const start = layout.indexOf('const underMaintenance = $derived(');
    expect(start, 'the underMaintenance derivation is no longer declared in +layout.svelte').toBeGreaterThan(-1);
    const derivation = layout.slice(start, layout.indexOf(');', start) + 2);

    // Reads the merged static ∪ dynamic ∪ column value…
    expect(derivation).toContain('appSettings.access');
    // …and NOT the DB column alone, which is what a malformed column degrades to `{}`.
    expect(derivation).not.toContain('validity.appSettingsData');
    // …with no inline duplicate of the shipped default, which is the mechanism by which the gate reset itself.
    expect(derivation).not.toContain('?? false');
  });
});
