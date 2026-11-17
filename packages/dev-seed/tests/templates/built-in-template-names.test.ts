/**
 * The access-gating datasets the registry offers.
 *
 * `perm-access-disable` serves every `access.*` mode: its spec re-seeds the settings row once per mode. A dataset for a single mode would duplicate it, so the registry holds none. The single-mode names are built from their parts, so a search of the tree for either name finds no copy of it.
 *
 * contract: pure registry assertions. No Supabase imports.
 */

import { describe, expect, it } from 'vitest';
import { BUILT_IN_TEMPLATES } from '../../src';

const SINGLE_MODE_NAMES = ['voter', 'contestant'].map((app) => `perm-disable-${app}-app`);

describe('BUILT_IN_TEMPLATES — the access-gating datasets', () => {
  it('holds perm-access-disable, which serves every access mode', () => {
    expect(Object.keys(BUILT_IN_TEMPLATES)).toContain('perm-access-disable');
  });

  it.each(SINGLE_MODE_NAMES)('holds no single-mode dataset %s', (name) => {
    expect(Object.keys(BUILT_IN_TEMPLATES)).not.toContain(name);
  });
});
