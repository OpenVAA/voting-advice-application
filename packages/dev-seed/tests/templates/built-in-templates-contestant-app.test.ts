/**
 * Every built-in template's `contestantApp` settings root.
 *
 * Each entry of `BUILT_IN_TEMPLATES` states the whole root in `app_settings.fixed[0].settings`: the question settings and the served entity types, each with its registration modes. The root is parsed through `StoredSettingsSchema` and the parsed value equals the declaration, so a template names no value twice and lists every value in canonical order.
 *
 * A template with no settings fragment fails by name; there is no skip list.
 *
 * contract: pure shape assertions. No Supabase imports.
 */

import { dynamicSettings, StoredSettingsSchema } from '@openvaa/app-shared';
import { describe, expect, it } from 'vitest';
import { BUILT_IN_TEMPLATES } from '../../src';
import { MINIMAL_BASE_APP_SETTINGS } from '../../src/templates/e2e/perm/shared';

type FragmentView = { fixed?: Array<Record<string, unknown>> };
type ContestantAppRoot = {
  questions?: Record<string, unknown>;
  servedEntityTypes?: Record<string, unknown>;
};

const TEMPLATE_NAMES = Object.keys(BUILT_IN_TEMPLATES);
const checked = new Set<string>();

/**
 * The served entity types, with their registration modes, each dataset family declares. The E2E base dataset serves both types, the perm family keeps the single-type app, and the two differ on purpose. Three perm datasets are each a family of their own, because an organization's editor signs in on them: `perm-organization-editing`, `perm-no-nomination` and `perm-contestant-nominations` serve both types.
 */
const SERVED_BY_FAMILY = {
  default: {
    title: 'serves both entity types, with email and code registration for both',
    servedEntityTypes: {
      candidate: { registrationModes: ['email', 'code'] },
      organization: { registrationModes: ['email', 'code'] }
    }
  },
  'e2e/base': {
    title: 'serves both entity types, with email and code registration for both',
    servedEntityTypes: {
      candidate: { registrationModes: ['email', 'code'] },
      organization: { registrationModes: ['email', 'code'] }
    }
  },
  'perm-organization-editing': {
    title: 'serves both entity types, with email and code registration for candidates and none for organizations',
    servedEntityTypes: {
      candidate: { registrationModes: ['email', 'code'] },
      organization: { registrationModes: [] }
    }
  },
  'perm-no-nomination': {
    title: 'serves both entity types, with email and code registration for candidates and none for organizations',
    servedEntityTypes: {
      candidate: { registrationModes: ['email', 'code'] },
      organization: { registrationModes: [] }
    }
  },
  'perm-contestant-nominations': {
    title: 'serves both entity types, with email and code registration for candidates and none for organizations',
    servedEntityTypes: {
      candidate: { registrationModes: ['email', 'code'] },
      organization: { registrationModes: [] }
    }
  },
  perm: {
    title: 'serves candidates only, with email and code registration',
    servedEntityTypes: { candidate: { registrationModes: ['email', 'code'] } }
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
  it('states every key of the default contestantApp root and of its question settings', () => {
    checked.add(name);
    const root = rootOf(name);
    const wholeRootMessage =
      '`mergeAppSettings` replaces the contestantApp root whole, so the template must state every key';
    expect(sortedKeys(root), wholeRootMessage).toBe(sortedKeys(dynamicSettings.contestantApp));
    expect(sortedKeys(root.questions), wholeRootMessage).toBe(sortedKeys(dynamicSettings.contestantApp.questions));
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
    expect(root.servedEntityTypes).toEqual(served.servedEntityTypes);
  });
});

describe('BUILT_IN_TEMPLATES — the contestantApp root across the registry', () => {
  it('is checked in every built-in template', () => {
    expect(checked.size).toBeGreaterThan(0);
    expect(checked.size).toBe(Object.keys(BUILT_IN_TEMPLATES).length);
  });

  it('the minimal perm settings serve candidates only while the E2E base serves both types, on purpose', () => {
    const minimal = ((MINIMAL_BASE_APP_SETTINGS as Record<string, unknown>).contestantApp ?? {}) as ContestantAppRoot;
    const base = rootOf('e2e/base').servedEntityTypes ?? {};
    expect(Object.keys(minimal.servedEntityTypes ?? {})).toEqual(['candidate']);
    expect(Object.keys(base)).toEqual(['candidate', 'organization']);
    expect(minimal.servedEntityTypes?.candidate).toEqual(base.candidate);
  });

  it('perm-hide-hero hides the hero and keeps the served entity types of the minimal base', () => {
    const root = rootOf('perm-hide-hero');
    const reference = ((MINIMAL_BASE_APP_SETTINGS as Record<string, unknown>).contestantApp ?? {}) as ContestantAppRoot;
    expect(root.questions).toEqual({ hideHero: true, hideVideo: false });
    expect(root.servedEntityTypes).toEqual({ candidate: { registrationModes: ['email', 'code'] } });
    expect(root.servedEntityTypes).toEqual(reference.servedEntityTypes);
  });
});
