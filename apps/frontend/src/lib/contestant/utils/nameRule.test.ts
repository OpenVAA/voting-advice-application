/**
 * The one rule for when a name field can be edited, the three states it yields, the locale a name is required in, and when a name field lacks its required value. The rule reads whether the entity is confirmed and whether answers are locked, and an entity that is not known is never editable.
 */

import { staticSettings } from '@openvaa/app-shared';
import { describe, expect, it } from 'vitest';
import { defaultLocale } from '$lib/i18n';
import { isNameEditable, isRequiredNameMissing, nameState, requiredNameLocale } from './nameRule';
import type { UserEntity } from '$lib/api/base/dataWriter.type';
import type { NameState } from './nameRule';

const UNCONFIRMED_CANDIDATE: UserEntity = {
  type: 'candidate',
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Alice',
  lastName: 'Alpha',
  confirmed: false
};
const CONFIRMED_CANDIDATE: UserEntity = { ...UNCONFIRMED_CANDIDATE, confirmed: true };
const UNCONFIRMED_ORGANIZATION: UserEntity = {
  type: 'organization',
  id: '33333333-3333-4333-8333-333333333333',
  name: 'The Example Party',
  confirmed: false
};
const CONFIRMED_ORGANIZATION: UserEntity = { ...UNCONFIRMED_ORGANIZATION, confirmed: true };

type RuleCase = {
  title: string;
  entity: Pick<UserEntity, 'confirmed'> | undefined;
  answersLocked: boolean;
  editable: boolean;
  state: NameState;
};

const RULE_CASES: Array<RuleCase> = [
  {
    title: 'an unknown entity, answers not locked',
    entity: undefined,
    answersLocked: false,
    editable: false,
    state: 'locked-answers'
  },
  {
    title: 'an unknown entity, answers locked',
    entity: undefined,
    answersLocked: true,
    editable: false,
    state: 'locked-answers'
  },
  {
    title: 'an unconfirmed candidate, answers not locked',
    entity: UNCONFIRMED_CANDIDATE,
    answersLocked: false,
    editable: true,
    state: 'editable'
  },
  {
    title: 'an unconfirmed organization, answers not locked',
    entity: UNCONFIRMED_ORGANIZATION,
    answersLocked: false,
    editable: true,
    state: 'editable'
  },
  {
    title: 'a confirmed candidate, answers not locked',
    entity: CONFIRMED_CANDIDATE,
    answersLocked: false,
    editable: false,
    state: 'locked-confirmed'
  },
  {
    title: 'a confirmed organization, answers locked',
    entity: CONFIRMED_ORGANIZATION,
    answersLocked: true,
    editable: false,
    state: 'locked-confirmed'
  },
  {
    title: 'an unconfirmed candidate, answers locked',
    entity: UNCONFIRMED_CANDIDATE,
    answersLocked: true,
    editable: false,
    state: 'locked-answers'
  },
  {
    title: 'an unconfirmed organization, answers locked',
    entity: UNCONFIRMED_ORGANIZATION,
    answersLocked: true,
    editable: false,
    state: 'locked-answers'
  }
];

describe('isNameEditable', () => {
  it.each(RULE_CASES)('is $editable for $title', ({ entity, answersLocked, editable }) => {
    expect(isNameEditable(entity, answersLocked)).toBe(editable);
  });

  it('needs the confirmation state alone of the entity', () => {
    expect(isNameEditable({ confirmed: false }, false)).toBe(true);
    expect(isNameEditable({ confirmed: true }, false)).toBe(false);
  });
});

describe('nameState', () => {
  it.each(RULE_CASES)('is $state for $title', ({ entity, answersLocked, state }) => {
    expect(nameState(entity, answersLocked)).toBe(state);
  });

  it('is editable exactly when the name is editable', () => {
    for (const { entity, answersLocked } of RULE_CASES)
      expect(nameState(entity, answersLocked) === 'editable').toBe(isNameEditable(entity, answersLocked));
  });
});

describe('requiredNameLocale', () => {
  it('returns the default locale of the i18n module', () => {
    expect(requiredNameLocale()).toBe(defaultLocale);
  });

  it('returns the locale the static settings mark as the default, or their first locale when none is marked', () => {
    const { supportedLocales } = staticSettings;
    const marked = supportedLocales.filter((locale) => locale.isDefault).at(-1) ?? supportedLocales[0];

    expect(requiredNameLocale()).toBe(marked.code);
  });
});

describe('isRequiredNameMissing', () => {
  const NO_NAMES = { text: {}, byLocale: {} };

  it('reads a field that is always required from the texts: blank, whitespace or absent is missing', () => {
    const field = { property: 'firstName', required: 'always' } as const;

    expect(isRequiredNameMissing(field, { text: { firstName: 'Alice' }, byLocale: {} })).toBe(false);
    expect(isRequiredNameMissing(field, { text: { firstName: '' }, byLocale: {} })).toBe(true);
    expect(isRequiredNameMissing(field, { text: { firstName: '  ' }, byLocale: {} })).toBe(true);
    expect(isRequiredNameMissing(field, NO_NAMES)).toBe(true);
    // Another field's text does not stand in for it.
    expect(isRequiredNameMissing(field, { text: { lastName: 'Alpha' }, byLocale: {} })).toBe(true);
  });

  it('reads a field that requires one locale from the entries by locale, in the required locale alone', () => {
    const field = { property: 'name', required: 'requiredLocale' } as const;
    const required = requiredNameLocale();
    const other = required === 'fi' ? 'sv' : 'fi';

    expect(isRequiredNameMissing(field, { text: {}, byLocale: { name: { [required]: 'The Example Party' } } })).toBe(
      false
    );
    expect(isRequiredNameMissing(field, { text: {}, byLocale: { name: { [other]: 'Esimerkkipuolue' } } })).toBe(true);
    expect(isRequiredNameMissing(field, { text: {}, byLocale: { name: { [required]: ' ' } } })).toBe(true);
    expect(isRequiredNameMissing(field, { text: {}, byLocale: { name: null } })).toBe(true);
    expect(isRequiredNameMissing(field, NO_NAMES)).toBe(true);
    // The name as one text does not stand in for its entry in the required locale.
    expect(isRequiredNameMissing(field, { text: { name: 'The Example Party' }, byLocale: {} })).toBe(true);
  });

  it('never finds a field that is never required missing', () => {
    expect(isRequiredNameMissing({ property: 'shortName', required: 'never' }, NO_NAMES)).toBe(false);
  });
});
