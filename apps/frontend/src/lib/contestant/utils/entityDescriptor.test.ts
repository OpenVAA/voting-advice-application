/**
 * The per-type descriptor: one entry for each entity type the application serves, each holding every member a page reads and no other, and a lookup that answers with the candidate's entry when the type is not known.
 */

import { SERVED_ENTITY_TYPES } from '@openvaa/app-shared';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { ENTITY_DESCRIPTORS, entityDescriptorOf } from './entityDescriptor';
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
  'identityTitle',
  'nameSentence',
  'lockedInfoPlaceholder',
  'imageLabel',
  'colorField',
  'nameRefusedMessage',
  'instructions',
  'instructionsNoQuestions',
  'homeNotDone',
  'homeNotDoneNoQuestions',
  'homeNoNomination',
  'closedReasonNoNomination',
  'greetingName',
  'nominationsDescription',
  'nominationsEmpty',
  'nominationParentLabel',
  'electionSymbolLabel',
  'nominationsDescriptionEditable',
  'nominationsEmptyEditable',
  'nominationsEmptyNoElection',
  'nominationElectionsTitle',
  'nominationElectionsIngress',
  'nominationConstituenciesTitle',
  'nominationConstituenciesIngress',
  'nominationConstituenciesNoElection',
  'electionSymbolInfo',
  'parentNone',
  'parentOther',
  'parentOtherLabel',
  'parentOtherInfo',
  'parentOtherRequired',
  'parentNotNominatedHint',
  'parentNoOptions',
  'previewTip',
  'previewExcludeTabs',
  'previewTagLine'
];

/** The members an entry may leave out. */
const OPTIONAL_MEMBERS: Array<keyof EntityDescriptor> = ['imageInfo', 'hideIfMissingAnswersKey'];

/** The members that are a whole sentence written once for each type: about a missing nomination, a closed entry and the nominations view. */
const NOMINATION_SENTENCE_MEMBERS: Array<keyof EntityDescriptor> = [
  'homeNoNomination',
  'closedReasonNoNomination',
  'nominationsEmpty',
  'nominationsDescription'
];

/** Those members and the label of what a nomination stands under. */
const NOMINATION_KEY_MEMBERS: Array<keyof EntityDescriptor> = [...NOMINATION_SENTENCE_MEMBERS, 'nominationParentLabel'];

/** The members that pick, by type, a sentence of the nomination editor or of the nominations view while it can be edited, each with the key that both types' keys begin with. */
const NOMINATION_EDITOR_MEMBERS: Array<[keyof EntityDescriptor, string]> = [
  ['nominationsDescriptionEditable', 'contestantApp.nominations.descriptionEditable'],
  ['nominationsEmptyEditable', 'contestantApp.nominations.emptyEditable'],
  ['nominationsEmptyNoElection', 'contestantApp.nominations.emptyNoElection'],
  ['nominationElectionsTitle', 'contestantApp.nominations.elections.title'],
  ['nominationElectionsIngress', 'contestantApp.nominations.elections.ingress'],
  ['nominationConstituenciesTitle', 'contestantApp.nominations.constituencies.title'],
  ['nominationConstituenciesIngress', 'contestantApp.nominations.constituencies.ingress'],
  ['nominationConstituenciesNoElection', 'contestantApp.nominations.constituencies.noElection'],
  ['electionSymbolInfo', 'contestantApp.nominations.details.symbolInfo'],
  ['parentNone', 'contestantApp.nominations.parent.none'],
  ['parentOther', 'contestantApp.nominations.parent.other'],
  ['parentOtherLabel', 'contestantApp.nominations.parent.otherLabel'],
  ['parentOtherInfo', 'contestantApp.nominations.parent.otherInfo'],
  ['parentOtherRequired', 'contestantApp.nominations.error.otherRequired'],
  ['parentNotNominatedHint', 'contestantApp.nominations.parent.notNominatedHint'],
  ['parentNoOptions', 'contestantApp.nominations.parent.noOptions']
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
    expect(descriptor.nameSentence.locked).toBeDefined();
    expect(descriptor.nameSentence.editable).toBeDefined();
  });

  it.each(SERVED_ENTITY_TYPES)('holds no member beyond the listed ones for the %s, so no lock rule', (type) => {
    const allowed: Array<string> = [...MEMBERS, ...OPTIONAL_MEMBERS];

    expect(Object.keys(ENTITY_DESCRIPTORS[type]).filter((member) => !allowed.includes(member))).toEqual([]);
  });

  describe('the candidate', () => {
    const descriptor: EntityDescriptor = ENTITY_DESCRIPTORS.candidate;

    it('has the first and last name as single-line text, each with its autocomplete token and always required', () => {
      expect(descriptor.identityFields).toEqual(CANDIDATE_FIELDS);
    });

    it('is not offered the colour field', () => {
      expect(descriptor.colorField).toEqual({ offered: false });
    });

    it('has a portrait with no help line', () => {
      expect(descriptor.imageLabel).toBe('common.entityImage.candidate');
      expect(descriptor.imageInfo).toBeUndefined();
    });

    it('previews every tab and shows no tag line', () => {
      expect(descriptor.previewExcludeTabs).toEqual([]);
      expect(descriptor.previewTagLine).toEqual({ shown: false });
    });

    it('reads the candidate’s key of the setting that hides entities with missing answers', () => {
      expect(descriptor.hideIfMissingAnswersKey).toBe('candidate');
    });

    it('is greeted by first name', () => {
      expect(descriptor.greetingName({ firstName: 'Alice', name: 'Alice Alpha' })).toBe('Alice');
    });

    it('reads the candidate’s sentence of every pair', () => {
      expect(descriptor).toMatchObject({
        identityTitle: 'dynamic.contestantAppBasicInfo.identity.title.candidate',
        nameSentence: {
          locked: 'dynamic.contestantAppBasicInfo.identity.name.locked.candidate',
          editable: 'dynamic.contestantAppBasicInfo.identity.name.editable.candidate'
        },
        lockedInfoPlaceholder: 'dynamic.contestantAppBasicInfo.identity.emptyPlaceholder.candidate',
        nameRefusedMessage: 'contestantApp.error.nameLocked.candidate',
        instructions: 'contestantApp.basicInfo.instructions.candidate',
        instructionsNoQuestions: 'contestantApp.basicInfo.instructionsNoQuestions.candidate',
        homeNotDone: 'contestantApp.home.ingress.notDone.candidate',
        homeNotDoneNoQuestions: 'contestantApp.home.ingress.notDoneNoQuestions.candidate',
        homeNoNomination: 'contestantApp.home.ingress.noNomination.candidate',
        closedReasonNoNomination: 'contestantApp.common.closedReason.noNomination.candidate',
        nominationsDescription: 'contestantApp.nominations.description.candidate',
        nominationsEmpty: 'contestantApp.nominations.empty.candidate',
        electionSymbolLabel: 'common.electionSymbol.candidate',
        previewTip: 'contestantApp.preview.tip.candidate'
      });
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

    it('has a logo with a help line', () => {
      expect(descriptor.imageLabel).toBe('common.entityImage.organization');
      expect(descriptor.imageInfo).toBe('contestantApp.basicInfo.logoInfo');
    });

    it('previews without the children tab and shows the tag line', () => {
      expect(descriptor.previewExcludeTabs).toEqual(['children']);
      expect(descriptor.previewTagLine).toEqual({ shown: true, label: 'contestantApp.preview.tagLabel' });
    });

    it('reads the organization’s key of the setting that hides entities with missing answers', () => {
      expect(descriptor.hideIfMissingAnswersKey).toBe('organization');
    });

    it('is greeted by its name', () => {
      expect(descriptor.greetingName({ name: 'The Example Party' })).toBe('The Example Party');
    });

    it('reads the organization’s sentence of every pair', () => {
      expect(descriptor).toMatchObject({
        identityTitle: 'dynamic.contestantAppBasicInfo.identity.title.organization',
        nameSentence: {
          locked: 'dynamic.contestantAppBasicInfo.identity.name.locked.organization',
          editable: 'dynamic.contestantAppBasicInfo.identity.name.editable.organization'
        },
        lockedInfoPlaceholder: 'dynamic.contestantAppBasicInfo.identity.emptyPlaceholder.organization',
        nameRefusedMessage: 'contestantApp.error.nameLocked.organization',
        instructions: 'contestantApp.basicInfo.instructions.organization',
        instructionsNoQuestions: 'contestantApp.basicInfo.instructionsNoQuestions.organization',
        homeNotDone: 'contestantApp.home.ingress.notDone.organization',
        homeNotDoneNoQuestions: 'contestantApp.home.ingress.notDoneNoQuestions.organization',
        homeNoNomination: 'contestantApp.home.ingress.noNomination.organization',
        closedReasonNoNomination: 'contestantApp.common.closedReason.noNomination.organization',
        nominationsDescription: 'contestantApp.nominations.description.organization',
        nominationsEmpty: 'contestantApp.nominations.empty.organization',
        electionSymbolLabel: 'common.electionSymbol.organization',
        previewTip: 'contestantApp.preview.tip.organization'
      });
    });

    it('labels what a nomination stands under as an alliance', () => {
      expect(descriptor.nominationParentLabel).toBe('common.alliance.singular');
    });
  });

  describe('the keys of a missing nomination, a closed entry and the nominations view', () => {
    it.each(SERVED_ENTITY_TYPES)('each name a message of the English catalogue for the %s', (type) => {
      const descriptor: EntityDescriptor = ENTITY_DESCRIPTORS[type];

      for (const member of NOMINATION_KEY_MEMBERS) {
        const message = englishMessage(descriptor[member]);
        expect(message, member).toBeTypeOf('string');
        expect((message as string).trim(), member).not.toBe('');
      }
    });

    it.each(NOMINATION_SENTENCE_MEMBERS)('%s is a different sentence for each type', (member) => {
      const candidate: EntityDescriptor = ENTITY_DESCRIPTORS.candidate;
      const organization: EntityDescriptor = ENTITY_DESCRIPTORS.organization;

      expect(candidate[member]).toBeTypeOf('string');
      expect(organization[member]).toBeTypeOf('string');
      expect(organization[member]).not.toBe(candidate[member]);
      expect(englishMessage(organization[member])).not.toBe(englishMessage(candidate[member]));
    });

    it('names no key under contestantApp.basicInfo.nominations', () => {
      for (const type of SERVED_ENTITY_TYPES)
        expect(JSON.stringify(ENTITY_DESCRIPTORS[type])).not.toContain('contestantApp.basicInfo.nominations');
    });
  });
});

describe('the keys of the nomination editor and of the nominations view while it can be edited', () => {
  it.each(NOMINATION_EDITOR_MEMBERS)('%s holds the key of each type', (member, stem) => {
    for (const type of SERVED_ENTITY_TYPES) {
      const descriptor: EntityDescriptor = ENTITY_DESCRIPTORS[type];
      expect(descriptor[member], type).toBe(`${stem}.${type}`);
    }
  });

  it.each(NOMINATION_EDITOR_MEMBERS)('%s names a message of the English catalogue for each type', (member) => {
    for (const type of SERVED_ENTITY_TYPES) {
      const descriptor: EntityDescriptor = ENTITY_DESCRIPTORS[type];
      const message = englishMessage(descriptor[member]);
      expect(message, type).toBeTypeOf('string');
      expect((message as string).trim(), type).not.toBe('');
    }
  });

  it('holds every per-type key of the nominations catalogue in one member, the same member for both types', () => {
    const candidateKeys = englishKeysOf(NOMINATIONS_NAMESPACE).filter((key) => key.endsWith('.candidate'));
    const candidate: Record<string, unknown> = ENTITY_DESCRIPTORS.candidate;
    const organization: Record<string, unknown> = ENTITY_DESCRIPTORS.organization;

    expect(candidateKeys.length).toBeGreaterThanOrEqual(NOMINATION_EDITOR_MEMBERS.length);
    for (const key of candidateKeys) {
      const members = Object.keys(candidate).filter((member) => candidate[member] === key);
      expect(members, key).toHaveLength(1);
      expect(organization[members[0]], key).toBe(key.replace(/\.candidate$/, '.organization'));
    }
  });

  it('leaves no per-type key of the nominations catalogue written for one type alone', () => {
    const keys = englishKeysOf(NOMINATIONS_NAMESPACE);

    expect(stemsOf(keys, 'organization')).toEqual(stemsOf(keys, 'candidate'));
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
