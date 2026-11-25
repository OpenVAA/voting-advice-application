import type { ParentEntityDetailsContent, ServedEntityType } from '@openvaa/app-shared';
import type { TranslationKey } from '$types';

/**
 * When an identity field must be filled while it is editable: `always`, `requiredLocale` for a locale-keyed field that needs an entry in the required locale alone, or `never`.
 */
export type IdentityFieldRequirement = 'always' | 'requiredLocale' | 'never';

/**
 * One name field of the identity section.
 */
export type IdentityFieldDescriptor = {
  /** The entity property the field edits. */
  property: 'firstName' | 'lastName' | 'name' | 'shortName';
  /** The `Input` kind the field is rendered with. */
  inputType: 'text' | 'text-multilingual';
  /** The key of the field's label. */
  label: TranslationKey;
  /** When the field must be filled while it is editable. A locked field is never required. */
  required: IdentityFieldRequirement;
  /** The test id of the field. */
  testId: string;
  /** The `autocomplete` token, for a field that collects the user's own name. */
  autocomplete?: 'given-name' | 'family-name';
  /** The key of the help line shown under the field while it is editable. */
  info?: TranslationKey;
};

/**
 * What differs between the pages of two entity types beyond the key of a text. A text whose key is one key with the type as its last part is not a member: a page builds that key from `servedEntityTypeOf`, as in `` t(`contestantApp.nominations.parent.other.${entityType}`) ``. Whether a name can be edited is the same rule for every type and is not a member.
 */
export type EntityDescriptor = {
  /** The name fields of the identity section, in the order they are shown. */
  identityFields: ReadonlyArray<IdentityFieldDescriptor>;
  /** The key of the help line under the image field, where the type has one. */
  imageInfo?: TranslationKey;
  /** Whether the colour field is offered, and the keys of its label and help line when it is. */
  colorField: { offered: false } | { offered: true; label: TranslationKey; info: TranslationKey };
  /** The name the home page greets the user by, read from the entity's data as the store holds it. An entity may have none yet. */
  greetingName: (entity: { firstName?: string | null; name?: string | null }) => string | null | undefined;
  /** The key of the label of the row that names what a nomination stands under: the list of a candidate, the alliance of a party. */
  nominationParentLabel: TranslationKey;
  /** The tabs the preview leaves out. */
  previewExcludeTabs: ReadonlyArray<ParentEntityDetailsContent>;
  /** Whether the preview shows how the entity is tagged beside its children, and the key of the line's lead-in when it does. */
  previewTagLine: { shown: false } | { shown: true; label: TranslationKey };
};

/**
 * The descriptor of each entity type the application serves.
 */
export const ENTITY_DESCRIPTORS = {
  candidate: {
    identityFields: [
      {
        property: 'firstName',
        inputType: 'text',
        label: 'common.firstName',
        /** Decides that a candidate's first name must be filled while it is editable: a blank one shows the required badge and leaves the profile incomplete. */
        required: 'always',
        testId: 'profile-first-name',
        autocomplete: 'given-name'
      },
      {
        property: 'lastName',
        inputType: 'text',
        label: 'common.lastName',
        /** Decides the same for a candidate's last name. */
        required: 'always',
        testId: 'profile-last-name',
        autocomplete: 'family-name'
      }
    ],
    colorField: { offered: false },
    greetingName: (entity) => entity.firstName,
    nominationParentLabel: 'common.electionList',
    previewExcludeTabs: [],
    previewTagLine: { shown: false }
  },
  organization: {
    identityFields: [
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
    ],
    imageInfo: 'contestantApp.basicInfo.logoInfo',
    colorField: { offered: true, label: 'common.color', info: 'contestantApp.basicInfo.colorInfo' },
    greetingName: (entity) => entity.name,
    nominationParentLabel: 'common.alliance.singular',
    previewExcludeTabs: ['children'],
    previewTagLine: { shown: true, label: 'contestantApp.preview.tagLabel' }
  }
} as const satisfies Record<ServedEntityType, EntityDescriptor>;

/**
 * The entity type a page renders for: the candidate while the type is not known, so that a page renders the candidate's fields and texts, locked, before the selected entity is read.
 * @param type - The served entity type, or `undefined` when it is not known.
 * @returns The type.
 */
export function servedEntityTypeOf(type: ServedEntityType | undefined): ServedEntityType {
  return type ?? 'candidate';
}

/**
 * The descriptor of an entity type. The candidate's is returned while the type is not known, so that a page renders the candidate's fields, locked, before the selected entity is read.
 * @param type - The served entity type, or `undefined` when it is not known.
 * @returns The descriptor.
 */
export function entityDescriptorOf(type: ServedEntityType | undefined): EntityDescriptor {
  return ENTITY_DESCRIPTORS[servedEntityTypeOf(type)];
}
