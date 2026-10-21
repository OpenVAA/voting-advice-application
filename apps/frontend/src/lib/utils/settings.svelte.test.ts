import { describe, expect, it } from 'vitest';
import { mergeAppSettings } from './settings';
import type { DynamicSettings } from '@openvaa/app-shared';

/**
 * The merge target may be a deep `$state` proxy: the app context holds its effective settings in one. A proxy that holds a list cannot be passed to `structuredClone`, so the merge has to build its result without cloning the target.
 */
describe('mergeAppSettings over a `$state` proxy target', () => {
  it('merges without throwing and without unwrapping the list the proxy holds', () => {
    const target = $state({
      access: { voterApp: true, contestantApp: true },
      results: { sections: ['candidate', 'organization'] }
    });
    // The control: this is the kind of value a cloning merge fails on.
    expect(() => structuredClone(target)).toThrow();

    const result = mergeAppSettings(
      target as unknown as AppSettings,
      { access: { voterApp: false } } as unknown as DynamicSettings
    );

    expect(result.access).toEqual({ voterApp: false, contestantApp: true });
    expect(result.results.sections).toEqual(['candidate', 'organization']);
    expect(target.access.voterApp).toBe(true);
  });
});
