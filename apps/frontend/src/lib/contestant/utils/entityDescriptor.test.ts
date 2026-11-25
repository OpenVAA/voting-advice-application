/**
 * The per-type descriptor: one entry for each entity type the application serves, each holding every member a page reads and no other, and a lookup that answers with the candidate's entry when the type is not known. Beside it, the keys the pages build from the type: each names a message of the English catalogue for every served type.
 */

import { SERVED_ENTITY_TYPES } from '@openvaa/app-shared';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { ENTITY_DESCRIPTORS, entityDescriptorOf, servedEntityTypeOf } from './entityDescriptor';
import type { EntityDescriptor, IdentityFieldDescriptor } from './entityDescriptor';

const englishMessagesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  'messages',
  'en'
);

/** The namespaces of the English catalogue: each message file's name without its extension. */
const NAMESPACES: Array<string> = fs.readdirSync(englishMessagesDir).map((filename) => filename.replace(/\.json$/, ''));

/**
 * The English text of a message key, read from the catalogue files: the vitest configuration replaces the compiled messages with mocks. A namespace may itself hold a dot, so the key's namespace is the longest one the key starts with.
 */
function englishMessage(key: unknown): unknown {
  if (typeof key !== 'string') return undefined;
  const namespace = NAMESPACES.filter((candidate) => key.startsWith(`${candidate}.`)).sort(
    (a, b) => b.length - a.length
  )[0];
  if (!namespace) return undefined;
  let value: unknown = JSON.parse(fs.readFileSync(path.join(englishMessagesDir, `${namespace}.json`), 'utf8'))[
    namespace
  ];
  for (const part of key.slice(namespace.length + 1).split('.'))
    value = (value as Record<string, unknown> | undefined)?.[part];
  return value;
}

/** The members every entry holds. */
const MEMBERS: Array<keyof EntityDescriptor> = [
  'identityFields',
  'colorField',
  'greetingName',
  'nominationParentLabel',
  'previewExcludeTabs',
  'previewTagLine'
];

/** The members an entry may leave out. */
const OPTIONAL_MEMBERS: Array<keyof EntityDescriptor> = ['imageInfo'];

/** The keys the pages build from the entity type, each without the type it ends in. */
const PER_TYPE_KEY_STEMS: Array<string> = [
  'dynamic.contestantAppBasicInfo.identity.title',
  'dynamic.contestantAppBasicInfo.identity.name.locked',
  'dynamic.contestantAppBasicInfo.identity.name.editable',
  'dynamic.contestantAppBasicInfo.identity.emptyPlaceholder',
  'common.entityImage',
  'common.electionSymbol',
  'contestantApp.error.nameLocked',
  'contestantApp.basicInfo.instructions',
  'contestantApp.basicInfo.instructionsNoQuestions',
  'contestantApp.basicInfo.removeImage',
  'contestantApp.home.ingress.notDone',
  'contestantApp.home.ingress.notDoneNoQuestions',
  'contestantApp.home.ingress.noNomination',
  'contestantApp.common.closedReason.noNomination',
  'contestantApp.nominations.description',
  'contestantApp.nominations.empty',
  'contestantApp.nominations.descriptionEditable',
  'contestantApp.nominations.emptyEditable',
  'contestantApp.nominations.emptyNoElection',
  'contestantApp.nominations.elections.title',
  'contestantApp.nominations.elections.ingress',
  'contestantApp.nominations.constituencies.title',
  'contestantApp.nominations.constituencies.ingress',
  'contestantApp.nominations.constituencies.noElection',
  'contestantApp.nominations.details.symbolInfo',
  'contestantApp.nominations.parent.none',
  'contestantApp.nominations.parent.other',
  'contestantApp.nominations.parent.otherLabel',
  'contestantApp.nominations.parent.otherInfo',
  'contestantApp.nominations.error.otherRequired',
  'contestantApp.nominations.parent.notNominatedHint',
  'contestantApp.nominations.parent.noOptions',
  'contestantApp.preview.tip'
];

/** The stems of the sentences about a missing nomination, a closed entry and the nominations view, each written once for each type. */
const NOMINATION_SENTENCE_STEMS: Array<string> = [
  'contestantApp.home.ingress.noNomination',
  'contestantApp.common.closedReason.noNomination',
  'contestantApp.nominations.empty',
  'contestantApp.nominations.description'
];

/** The namespace that holds the sentences of the nominations view and of the nomination editor. */
const NOMINATIONS_NAMESPACE = 'contestantApp.nominations';

/**
 * The keys of the messages under a node of a catalogue, each begun with the key of the node.
 */
function keysUnder(node: unknown, prefix: string): Array<string> {
  if (node === null || typeof node !== 'object') return [prefix];
  return Object.entries(node).flatMap(([part, child]) => keysUnder(child, `${prefix}.${part}`));
}

/**
 * Every key of a namespace of the English catalogue, read from its file.
 */
function englishKeysOf(namespace: string): Array<string> {
  return keysUnder(
    JSON.parse(fs.readFileSync(path.join(englishMessagesDir, `${namespace}.json`), 'utf8'))[namespace],
    namespace
  );
}

/**
 * The keys of a list that end in a type's name, each without that ending.
 */
function stemsOf(keys: Array<string>, type: string): Array<string> {
  return keys.filter((key) => key.endsWith(`.${type}`)).map((key) => key.slice(0, -type.length - 1));
}

const CANDIDATE_FIELDS: Array<IdentityFieldDescriptor> = [
  {
    property: 'firstName',
    inputType: 'text',
    label: 'common.firstName',
    required: 'always',
    testId: 'profile-first-name',
    autocomplete: 'given-name'
  },
  {
    property: 'lastName',
    inputType: 'text',
    label: 'common.lastName',
    required: 'always',
    testId: 'profile-last-name',
    autocomplete: 'family-name'
  }
];

const ORGANIZATION_FIELDS: Array<IdentityFieldDescriptor> = [
  {
    property: 'name',
    inputType: 'text-multilingual',
    label: 'common.name',
    required: 'requiredLocale',
    testId: 'profile-name'
  },
  {
    property: 'shortName',
    inputType: 'text-multilingual',
    label: 'common.shortName',
    required: 'never',
    testId: 'profile-short-name',
    info: 'contestantApp.basicInfo.shortNameInfo'
  }
];

describe('ENTITY_DESCRIPTORS', () => {
  it('holds an entry for each served entity type and for no other key', () => {
    expect(Object.keys(ENTITY_DESCRIPTORS).sort()).toEqual([...SERVED_ENTITY_TYPES].sort());
  });

  it.each(SERVED_ENTITY_TYPES)('holds every member for the %s', (type) => {
    const descriptor: EntityDescriptor = ENTITY_DESCRIPTORS[type];

    for (const member of MEMBERS) expect(descriptor[member], member).toBeDefined();
  });

  it.each(SERVED_ENTITY_TYPES)('holds no member beyond the listed ones for the %s, so no lock rule', (type) => {
    const allowed: Array<string> = [...MEMBERS, ...OPTIONAL_MEMBERS];

    expect(Object.keys(ENTITY_DESCRIPTORS[type]).filter((member) => !allowed.includes(member))).toEqual([]);
  });

  it('holds no key that is the same key for both types but for its type ending', () => {
    for (const member of [...MEMBERS, ...OPTIONAL_MEMBERS]) {
      const candidate: unknown = ENTITY_DESCRIPTORS.candidate[member as keyof typeof ENTITY_DESCRIPTORS.candidate];
      if (typeof candidate === 'string' && candidate.endsWith('.candidate'))
        expect(
          ENTITY_DESCRIPTORS.organization[member as keyof typeof ENTITY_DESCRIPTORS.organization],
          member
        ).not.toBe(candidate.replace(/\.candidate$/, '.organization'));
    }
  });

  describe('the candidate', () => {
    const descriptor: EntityDescriptor = ENTITY_DESCRIPTORS.candidate;

    it('has the first and last name as single-line text, each with its autocomplete token and always required', () => {
      expect(descriptor.identityFields).toEqual(CANDIDATE_FIELDS);
    });

    it('is not offered the colour field', () => {
      expect(descriptor.colorField).toEqual({ offered: false });
    });

    it('has no help line under the image', () => {
      expect(descriptor.imageInfo).toBeUndefined();
    });

    it('previews every tab and shows no tag line', () => {
      expect(descriptor.previewExcludeTabs).toEqual([]);
      expect(descriptor.previewTagLine).toEqual({ shown: false });
    });

    it('is greeted by first name', () => {
      expect(descriptor.greetingName({ firstName: 'Alice', name: 'Alice Alpha' })).toBe('Alice');
    });

    it('labels what a nomination stands under as an election list', () => {
      expect(descriptor.nominationParentLabel).toBe('common.electionList');
    });
  });

  describe('the organization', () => {
    const descriptor: EntityDescriptor = ENTITY_DESCRIPTORS.organization;

    it('has the name as multilingual text required in the required locale, and the short name as multilingual text never required', () => {
      expect(descriptor.identityFields).toEqual(ORGANIZATION_FIELDS);
    });

    it('is offered the colour field, with its label and help line', () => {
      expect(descriptor.colorField).toEqual({
        offered: true,
        label: 'common.color',
        info: 'contestantApp.basicInfo.colorInfo'
      });
    });

    it('has a help line under the logo', () => {
      expect(descriptor.imageInfo).toBe('contestantApp.basicInfo.logoInfo');
    });

    it('previews without the children tab and shows the tag line', () => {
      expect(descriptor.previewExcludeTabs).toEqual(['children']);
      expect(descriptor.previewTagLine).toEqual({ shown: true, label: 'contestantApp.preview.tagLabel' });
    });

    it('is greeted by its name', () => {
      expect(descriptor.greetingName({ name: 'The Example Party' })).toBe('The Example Party');
    });

    it('labels what a nomination stands under as an alliance', () => {
      expect(descriptor.nominationParentLabel).toBe('common.alliance.singular');
    });
  });
});

describe('the keys the pages build from the entity type', () => {
  it.each(PER_TYPE_KEY_STEMS)('%s names a message of the English catalogue for each type', (stem) => {
    for (const type of SERVED_ENTITY_TYPES) {
      const message = englishMessage(`${stem}.${type}`);
      expect(message, type).toBeTypeOf('string');
      expect((message as string).trim(), type).not.toBe('');
    }
  });

  it.each(NOMINATION_SENTENCE_STEMS)('%s is a different sentence for each type', (stem) => {
    expect(englishMessage(`${stem}.organization`)).not.toBe(englishMessage(`${stem}.candidate`));
  });

  it('leaves no per-type key of the nominations catalogue written for one type alone', () => {
    const keys = englishKeysOf(NOMINATIONS_NAMESPACE);

    expect(stemsOf(keys, 'organization')).toEqual(stemsOf(keys, 'candidate'));
  });
});

describe('servedEntityTypeOf', () => {
  it.each(SERVED_ENTITY_TYPES)('returns the %s as it is', (type) => {
    expect(servedEntityTypeOf(type)).toBe(type);
  });

  it('returns the candidate for an unknown type', () => {
    expect(servedEntityTypeOf(undefined)).toBe('candidate');
  });
});

describe('entityDescriptorOf', () => {
  it.each(SERVED_ENTITY_TYPES)('returns the entry of the %s', (type) => {
    expect(entityDescriptorOf(type)).toBe(ENTITY_DESCRIPTORS[type]);
  });

  it('returns the candidate’s entry for an unknown type', () => {
    expect(entityDescriptorOf(undefined)).toBe(ENTITY_DESCRIPTORS.candidate);
  });
});
