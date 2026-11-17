import { afterEach, describe, expect, it, vi } from 'vitest';
import * as entityDescriptor from './entityDescriptor';
import { isHiddenIfMissingAnswers } from './hideIfMissingAnswers';

afterEach(() => {
  vi.restoreAllMocks();
});

/** The settings with the two keys as given. */
function settings(hideIfMissingAnswers: { candidate?: boolean; organization?: boolean }): {
  entities: { hideIfMissingAnswers: { candidate?: boolean; organization?: boolean } };
} {
  return { entities: { hideIfMissingAnswers } };
}

describe('isHiddenIfMissingAnswers', () => {
  it.each([
    ['candidate', { candidate: true, organization: false }, true],
    ['candidate', { candidate: false, organization: true }, false],
    ['organization', { candidate: false, organization: true }, true],
    ['organization', { candidate: true, organization: false }, false]
  ] as const)('reads the key of the %s for %j', (entityType, hideIfMissingAnswers, expected) => {
    expect(isHiddenIfMissingAnswers({ entityType, appSettings: settings(hideIfMissingAnswers) })).toBe(expected);
  });

  it.each([
    ['the key is absent', settings({})],
    ['the setting is absent', { entities: {} }],
    ['the settings hold no entities root', {}]
  ])('is false when %s', (_, appSettings) => {
    expect(isHiddenIfMissingAnswers({ entityType: 'organization', appSettings })).toBe(false);
    expect(isHiddenIfMissingAnswers({ entityType: 'candidate', appSettings })).toBe(false);
  });

  it("reads the candidate's key while the entity's type is not known", () => {
    expect(
      isHiddenIfMissingAnswers({
        entityType: undefined,
        appSettings: settings({ candidate: true, organization: false })
      })
    ).toBe(true);
    expect(
      isHiddenIfMissingAnswers({
        entityType: undefined,
        appSettings: settings({ candidate: false, organization: true })
      })
    ).toBe(false);
  });

  it('is false for a type whose descriptor names no key, whatever the setting holds', () => {
    const { hideIfMissingAnswersKey: _, ...withoutKey } = entityDescriptor.ENTITY_DESCRIPTORS.organization;
    vi.spyOn(entityDescriptor, 'entityDescriptorOf').mockReturnValue(withoutKey);

    expect(
      isHiddenIfMissingAnswers({
        entityType: 'organization',
        appSettings: settings({ candidate: true, organization: true })
      })
    ).toBe(false);
  });
});
