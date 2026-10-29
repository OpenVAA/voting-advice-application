/**
 * Every built-in template's `contestantApp` settings root.
 *
 * Each entry of `BUILT_IN_TEMPLATES` states the whole root in `app_settings.fixed[0].settings`: the question settings, the served entity types and both registration rows. The root is parsed through `StoredSettingsSchema` and the parsed value equals the declaration, so a template names no value twice and lists every value in canonical order.
 *
 * A template with no settings fragment fails by name; there is no skip list.
 *
 * contract: pure shape assertions. No Supabase imports.
 */

import { StoredSettingsSchema } from '@openvaa/app-shared';
import { describe, expect, it } from 'vitest';
import { BUILT_IN_TEMPLATES } from '../../src';
import { MINIMAL_BASE_APP_SETTINGS } from '../../src/templates/e2e/perm/shared';

type FragmentView = { fixed?: Array<Record<string, unknown>> };
type ContestantAppRoot = {
  questions?: Record<string, unknown>;
  entityTypes?: unknown;
  registrationModes?: Record<string, unknown>;
};

const TEMPLATE_NAMES = Object.keys(BUILT_IN_TEMPLATES);
const checked = new Set<string>();

/**
 * The served entity types and registration modes each dataset family declares. The E2E base dataset serves both types, the perm family keeps the single-type app, and the two differ on purpose. Three perm datasets are each a family of their own, because an organization's editor signs in on them: `perm-organization-editing`, `perm-no-nomination` and `perm-contestant-nominations` serve both types.
 */
const SERVED_BY_FAMILY = {
  default: {
    title: 'serves both entity types and allows every registration mode for both',
    entityTypes: ['candidate', 'organization'],
    registrationModes: {
      candidate: ['identity_provider', 'email', 'code'],
      organization: ['identity_provider', 'email', 'code']
    }
  },
  'e2e/base': {
    title: 'serves both entity types, with email and code registration for both',
    entityTypes: ['candidate', 'organization'],
    registrationModes: { candidate: ['email', 'code'], organization: ['email', 'code'] }
  },
  'perm-organization-editing': {
    title: 'serves both entity types, with email and code registration for candidates and none for organizations',
    entityTypes: ['candidate', 'organization'],
    registrationModes: { candidate: ['email', 'code'], organization: [] }
  },
  'perm-no-nomination': {
    title: 'serves both entity types, with email and code registration for candidates and none for organizations',
    entityTypes: ['candidate', 'organization'],
    registrationModes: { candidate: ['email', 'code'], organization: [] }
  },
  'perm-contestant-nominations': {
    title: 'serves both entity types, with email and code registration for candidates and none for organizations',
    entityTypes: ['candidate', 'organization'],
    registrationModes: { candidate: ['email', 'code'], organization: [] }
  },
  perm: {
    title: 'serves candidates only, and states email and code registration for both entity types',
    entityTypes: ['candidate'],
    registrationModes: { candidate: ['email', 'code'], organization: ['email', 'code'] }
  }
};

function familyOf(name: string): keyof typeof SERVED_BY_FAMILY {
  return name === 'default' ||
    name === 'e2e/base' ||
    name === 'perm-organization-editing' ||
    name === 'perm-no-nomination' ||
    name === 'perm-contestant-nominations'
    ? name
    : 'perm';
}

/**
 * The settings object a built-in template writes, or an error that names the template.
 */
function settingsOf(name: string): Record<string, unknown> {
  const fragment = (BUILT_IN_TEMPLATES[name] as unknown as Record<string, unknown>).app_settings as
    FragmentView | undefined;
  const settings = fragment?.fixed?.[0]?.settings;
  if (settings == null || typeof settings !== 'object' || Array.isArray(settings))
    throw new Error(`built-in template '${name}' has no app_settings.fixed[0].settings object`);
  return settings as Record<string, unknown>;
}

function rootOf(name: string): ContestantAppRoot {
  return (settingsOf(name).contestantApp ?? {}) as ContestantAppRoot;
}

function sortedKeys(value: unknown): string {
  return value != null && typeof value === 'object' ? Object.keys(value).sort().join(',') : '';
}

describe.each(TEMPLATE_NAMES)('BUILT_IN_TEMPLATES[%s] — the contestantApp root', (name) => {
  it('states exactly the question settings, the served entity types and the registration modes', () => {
    checked.add(name);
    const root = rootOf(name);
    expect(sortedKeys(root)).toBe('entityTypes,questions,registrationModes');
    expect(sortedKeys(root.questions)).toBe('hideHero,hideVideo');
    expect(sortedKeys(root.registrationModes)).toBe('candidate,organization');
  });

  it('is accepted by the stored-settings schema and equals what the schema reads back', () => {
    const root = rootOf(name);
    const result = StoredSettingsSchema.safeParse({ contestantApp: root });
    expect(result.success).toBe(true);
    expect(result.data?.contestantApp).toEqual(root);
  });

  const served = SERVED_BY_FAMILY[familyOf(name)];

  it(served.title, () => {
    const root = rootOf(name);
    expect(root.entityTypes).toEqual(served.entityTypes);
    expect(root.registrationModes).toEqual(served.registrationModes);
  });
});

describe('BUILT_IN_TEMPLATES — the contestantApp root across the registry', () => {
  it('is checked in every built-in template', () => {
    expect(checked.size).toBeGreaterThan(0);
    expect(checked.size).toBe(Object.keys(BUILT_IN_TEMPLATES).length);
  });

  it('holds exactly one template of the default family, one of the E2E base family, one that serves organizations to their editors, and the perm family', () => {
    const families = TEMPLATE_NAMES.map(familyOf);
    expect(families.filter((family) => family === 'default')).toHaveLength(1);
    expect(families.filter((family) => family === 'e2e/base')).toHaveLength(1);
    expect(families.filter((family) => family === 'perm-organization-editing')).toHaveLength(1);
    expect(families.filter((family) => family === 'perm').length).toBeGreaterThan(0);
  });

  it('holds exactly one template of the family whose entities are served to their editors with or without a nomination', () => {
    expect(TEMPLATE_NAMES.map(familyOf).filter((family) => family === 'perm-no-nomination')).toHaveLength(1);
  });

  it('holds exactly one template of the family whose entities are served to their editors to define their nominations', () => {
    expect(TEMPLATE_NAMES.map(familyOf).filter((family) => family === 'perm-contestant-nominations')).toHaveLength(1);
  });

  it('the minimal perm settings serve candidates only while the E2E base serves both types, on purpose', () => {
    const minimal = ((MINIMAL_BASE_APP_SETTINGS as Record<string, unknown>).contestantApp ?? {}) as ContestantAppRoot;
    expect(minimal.entityTypes).toEqual(['candidate']);
    expect(rootOf('e2e/base').entityTypes).toEqual(['candidate', 'organization']);
    expect(minimal.registrationModes).toEqual(rootOf('e2e/base').registrationModes);
  });

  it('perm-hide-hero hides the hero and keeps the two lists of the minimal base', () => {
    const root = rootOf('perm-hide-hero');
    const reference = ((MINIMAL_BASE_APP_SETTINGS as Record<string, unknown>).contestantApp ?? {}) as ContestantAppRoot;
    expect(root.questions).toEqual({ hideHero: true, hideVideo: false });
    expect(root.entityTypes).toEqual(['candidate']);
    expect(root.entityTypes).toEqual(reference.entityTypes);
    expect(root.registrationModes).toEqual({ candidate: ['email', 'code'], organization: ['email', 'code'] });
    expect(root.registrationModes).toEqual(reference.registrationModes);
  });
});
