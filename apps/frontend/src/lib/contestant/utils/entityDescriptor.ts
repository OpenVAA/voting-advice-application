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
 * The keys of the home page's explanation while the profile is not complete: one for each served entity type, and for each a variant for an entity with no opinion questions to answer.
 */
export type HomeNotDoneKey = Extract<
  TranslationKey,
  `contestantApp.home.ingress.${'notDone' | 'notDoneNoQuestions'}.${ServedEntityType}`
>;

/**
 * Everything that differs between the pages of two entity types. A page reads the members and never the type. Whether a name can be edited is the same rule for every type and is not a member.
 */
export type EntityDescriptor = {
  /** The name fields of the identity section, in the order they are shown. */
  identityFields: ReadonlyArray<IdentityFieldDescriptor>;
  /** The key of the identity section's heading. */
  identityTitle: TranslationKey;
  /** The keys of the sentence above the name fields: `locked` while the entity is confirmed, `editable` while the names can be changed. */
  nameSentence: { locked: TranslationKey; editable: TranslationKey };
  /** The key of the placeholder of a locked info question that has no value. */
  lockedInfoPlaceholder: TranslationKey;
  /** The key of the image field's label. */
  imageLabel: TranslationKey;
  /** The key of the help line under the image field, where the type has one. */
  imageInfo?: TranslationKey;
  /** Whether the colour field is offered, and the keys of its label and help line when it is. */
  colorField: { offered: false } | { offered: true; label: TranslationKey; info: TranslationKey };
  /** The key of the message shown when a save of the names is refused because the entity has been confirmed. */
  nameRefusedMessage: TranslationKey;
  /** The key of the profile page's instructions. */
  instructions: TranslationKey;
  /** The key of the profile page's instructions for an entity with no opinion questions to answer. */
  instructionsNoQuestions: TranslationKey;
  /** The key of the home page's explanation while the profile is not complete. */
  homeNotDone: HomeNotDoneKey;
  /** The key of that explanation for an entity with no opinion questions to answer. */
  homeNotDoneNoQuestions: HomeNotDoneKey;
  /** The key of the home page's explanation while the entity has no nomination: what a nomination is and what follows it. */
  homeNoNomination: TranslationKey;
  /** The key of the sentence under the closed entries of the home page and of the menu while the entity has no nomination: what opens once it has one. */
  closedReasonNoNomination: TranslationKey;
  /** The name the home page greets the user by, read from the entity's data as the store holds it. An entity may have none yet. */
  greetingName: (entity: { firstName?: string | null; name?: string | null }) => string | null | undefined;
  /** The key of the sentence above the entity's nominations. */
  nominationsDescription: TranslationKey;
  /** The key of the sentence the nominations view shows in place of the nominations while the entity has none: what is missing and whom to ask. */
  nominationsEmpty: TranslationKey;
  /** The key of the label of the row that names what a nomination stands under: the list of a candidate, the alliance of a party. */
  nominationParentLabel: TranslationKey;
  /** The key of the label of a nomination's election symbol. */
  electionSymbolLabel: TranslationKey;
  /** The key of the sentence above the entity's nominations on the nominations view while the user can edit them: what can be changed and until when. */
  nominationsDescriptionEditable: TranslationKey;
  /** The key of the sentence the nominations view shows in place of the nominations while the entity has none and the user can define one: what a nomination says. */
  nominationsEmptyEditable: TranslationKey;
  /** The key of the sentence the nominations view shows in place of the nominations while no election of the application admits the entity's type. */
  nominationsEmptyNoElection: TranslationKey;
  /** The key of the title of the nomination editor's election step: the question of which elections the entity stands in. */
  nominationElectionsTitle: TranslationKey;
  /** The key of the instruction under the title of the nomination editor's election step. */
  nominationElectionsIngress: TranslationKey;
  /** The key of the title of the nomination editor's constituency step: the question of the entity's constituency. */
  nominationConstituenciesTitle: TranslationKey;
  /** The key of the instruction under the title of the nomination editor's constituency step. */
  nominationConstituenciesIngress: TranslationKey;
  /** The key of the sentence the nomination editor's constituency step shows for a constituency in which no election that admits the entity's type is held. */
  nominationConstituenciesNoElection: TranslationKey;
  /** The key of the help line under the election symbol field of a card of the nomination editor's details step. */
  electionSymbolInfo: TranslationKey;
  /** The key of the option of the nomination editor's parent selector that names no parent: no party for a candidate, no alliance for a party. */
  parentNone: TranslationKey;
  /** The key of the option of the nomination editor's parent selector that opens the field for a parent that is not listed. */
  parentOther: TranslationKey;
  /** The key of the label of the field for the name of a parent that is not listed, in the nomination editor's parent selector. */
  parentOtherLabel: TranslationKey;
  /** The key of the help line under that name field. */
  parentOtherInfo: TranslationKey;
  /** The key of the error shown on that name field while the option that opens it is chosen and the name is blank. */
  parentOtherRequired: TranslationKey;
  /** The key of the hint under an option of the nomination editor's parent selector whose parent has no nomination in the card's election and constituency: what choosing it adds. */
  parentNotNominatedHint: TranslationKey;
  /** The key of the line under the legend of the nomination editor's parent selector while no parent is listed. */
  parentNoOptions: TranslationKey;
  /** The key of `entities.hideIfMissingAnswers` that says whether the entity is hidden from voters while it has unanswered opinion questions. Left out, the entity is never told that it is hidden. */
  hideIfMissingAnswersKey?: ServedEntityType;
  /** The key of the note above the preview. */
  previewTip: TranslationKey;
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
    identityTitle: 'dynamic.contestantAppBasicInfo.identity.title.candidate',
    nameSentence: {
      locked: 'dynamic.contestantAppBasicInfo.identity.name.locked.candidate',
      editable: 'dynamic.contestantAppBasicInfo.identity.name.editable.candidate'
    },
    lockedInfoPlaceholder: 'dynamic.contestantAppBasicInfo.identity.emptyPlaceholder.candidate',
    imageLabel: 'common.entityImage.candidate',
    colorField: { offered: false },
    nameRefusedMessage: 'contestantApp.error.nameLocked.candidate',
    instructions: 'contestantApp.basicInfo.instructions.candidate',
    instructionsNoQuestions: 'contestantApp.basicInfo.instructionsNoQuestions.candidate',
    homeNotDone: 'contestantApp.home.ingress.notDone.candidate',
    homeNotDoneNoQuestions: 'contestantApp.home.ingress.notDoneNoQuestions.candidate',
    homeNoNomination: 'contestantApp.home.ingress.noNomination.candidate',
    closedReasonNoNomination: 'contestantApp.common.closedReason.noNomination.candidate',
    greetingName: (entity) => entity.firstName,
    nominationsDescription: 'contestantApp.nominations.description.candidate',
    nominationsEmpty: 'contestantApp.nominations.empty.candidate',
    nominationParentLabel: 'common.electionList',
    electionSymbolLabel: 'common.electionSymbol.candidate',
    nominationsDescriptionEditable: 'contestantApp.nominations.descriptionEditable.candidate',
    nominationsEmptyEditable: 'contestantApp.nominations.emptyEditable.candidate',
    nominationsEmptyNoElection: 'contestantApp.nominations.emptyNoElection.candidate',
    nominationElectionsTitle: 'contestantApp.nominations.elections.title.candidate',
    nominationElectionsIngress: 'contestantApp.nominations.elections.ingress.candidate',
    nominationConstituenciesTitle: 'contestantApp.nominations.constituencies.title.candidate',
    nominationConstituenciesIngress: 'contestantApp.nominations.constituencies.ingress.candidate',
    nominationConstituenciesNoElection: 'contestantApp.nominations.constituencies.noElection.candidate',
    electionSymbolInfo: 'contestantApp.nominations.details.symbolInfo.candidate',
    parentNone: 'contestantApp.nominations.parent.none.candidate',
    parentOther: 'contestantApp.nominations.parent.other.candidate',
    parentOtherLabel: 'contestantApp.nominations.parent.otherLabel.candidate',
    parentOtherInfo: 'contestantApp.nominations.parent.otherInfo.candidate',
    parentOtherRequired: 'contestantApp.nominations.error.otherRequired.candidate',
    parentNotNominatedHint: 'contestantApp.nominations.parent.notNominatedHint.candidate',
    parentNoOptions: 'contestantApp.nominations.parent.noOptions.candidate',
    hideIfMissingAnswersKey: 'candidate',
    previewTip: 'contestantApp.preview.tip.candidate',
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
    identityTitle: 'dynamic.contestantAppBasicInfo.identity.title.organization',
    nameSentence: {
      locked: 'dynamic.contestantAppBasicInfo.identity.name.locked.organization',
      editable: 'dynamic.contestantAppBasicInfo.identity.name.editable.organization'
    },
    lockedInfoPlaceholder: 'dynamic.contestantAppBasicInfo.identity.emptyPlaceholder.organization',
    imageLabel: 'common.entityImage.organization',
    imageInfo: 'contestantApp.basicInfo.logoInfo',
    colorField: { offered: true, label: 'common.color', info: 'contestantApp.basicInfo.colorInfo' },
    nameRefusedMessage: 'contestantApp.error.nameLocked.organization',
    instructions: 'contestantApp.basicInfo.instructions.organization',
    instructionsNoQuestions: 'contestantApp.basicInfo.instructionsNoQuestions.organization',
    homeNotDone: 'contestantApp.home.ingress.notDone.organization',
    homeNotDoneNoQuestions: 'contestantApp.home.ingress.notDoneNoQuestions.organization',
    homeNoNomination: 'contestantApp.home.ingress.noNomination.organization',
    closedReasonNoNomination: 'contestantApp.common.closedReason.noNomination.organization',
    greetingName: (entity) => entity.name,
    nominationsDescription: 'contestantApp.nominations.description.organization',
    nominationsEmpty: 'contestantApp.nominations.empty.organization',
    nominationParentLabel: 'common.alliance.singular',
    electionSymbolLabel: 'common.electionSymbol.organization',
    nominationsDescriptionEditable: 'contestantApp.nominations.descriptionEditable.organization',
    nominationsEmptyEditable: 'contestantApp.nominations.emptyEditable.organization',
    nominationsEmptyNoElection: 'contestantApp.nominations.emptyNoElection.organization',
    nominationElectionsTitle: 'contestantApp.nominations.elections.title.organization',
    nominationElectionsIngress: 'contestantApp.nominations.elections.ingress.organization',
    nominationConstituenciesTitle: 'contestantApp.nominations.constituencies.title.organization',
    nominationConstituenciesIngress: 'contestantApp.nominations.constituencies.ingress.organization',
    nominationConstituenciesNoElection: 'contestantApp.nominations.constituencies.noElection.organization',
    electionSymbolInfo: 'contestantApp.nominations.details.symbolInfo.organization',
    parentNone: 'contestantApp.nominations.parent.none.organization',
    parentOther: 'contestantApp.nominations.parent.other.organization',
    parentOtherLabel: 'contestantApp.nominations.parent.otherLabel.organization',
    parentOtherInfo: 'contestantApp.nominations.parent.otherInfo.organization',
    parentOtherRequired: 'contestantApp.nominations.error.otherRequired.organization',
    parentNotNominatedHint: 'contestantApp.nominations.parent.notNominatedHint.organization',
    parentNoOptions: 'contestantApp.nominations.parent.noOptions.organization',
    /** Decides that an organization is told when it is hidden from voters for unanswered opinion questions. The sentence is true only where the voter application applies the setting to organizations. */
    hideIfMissingAnswersKey: 'organization',
    previewTip: 'contestantApp.preview.tip.organization',
    previewExcludeTabs: ['children'],
    previewTagLine: { shown: true, label: 'contestantApp.preview.tagLabel' }
  }
} as const satisfies Record<ServedEntityType, EntityDescriptor>;

/**
 * The descriptor of an entity type. The candidate's is returned while the type is not known, so that a page renders the candidate's fields, locked, before the selected entity is read.
 * @param type - The served entity type, or `undefined` when it is not known.
 * @returns The descriptor.
 */
export function entityDescriptorOf(type: ServedEntityType | undefined): EntityDescriptor {
  return ENTITY_DESCRIPTORS[type ?? 'candidate'];
}
