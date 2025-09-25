import type {
  Alliance,
  AllianceNomination,
  BooleanQuestion,
  Candidate,
  CandidateNomination,
  Constituency,
  ConstituencyGroup,
  DateQuestion,
  Election,
  Faction,
  FactionNomination,
  ImageQuestion,
  MultipleChoiceCategoricalQuestion,
  MultipleTextQuestion,
  NumberQuestion,
  Organization,
  OrganizationNomination,
  QuestionCategory,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion,
  TextQuestion
} from '../internal';

/**
 * The `type` of any concrete data object.
 */
export const OBJECT_TYPE = {
  // NB! When editing these, be sure to update `/utils/typeGuard.ts` as well.
  Alliance: 'alliance',
  AllianceNomination: 'allianceNomination',
  BooleanQuestion: 'booleanQuestion',
  Candidate: 'candidate',
  CandidateNomination: 'candidateNomination',
  Constituency: 'constituency',
  ConstituencyGroup: 'constituencyGroup',
  DateQuestion: 'dateQuestion',
  Election: 'election',
  Faction: 'faction',
  FactionNomination: 'factionNomination',
  ImageQuestion: 'imageQuestion',
  MultipleChoiceCategoricalQuestion: 'multipleChoiceCategoricalQuestion',
  MultipleTextQuestion: 'multipleTextQuestion',
  NumberQuestion: 'numberQuestion',
  Organization: 'organization',
  OrganizationNomination: 'organizationNomination',
  QuestionCategory: 'questionCategory',
  SingleChoiceCategoricalQuestion: 'singleChoiceCategoricalQuestion',
  SingleChoiceOrdinalQuestion: 'singleChoiceOrdinalQuestion',
  TextQuestion: 'textQuestion'
} as const;

/**
 * The `type` of any concrete data object.
 */
export type ObjectType = (typeof OBJECT_TYPE)[keyof typeof OBJECT_TYPE];

/**
 * A map of the concrete object classes by their object type.
 */
export type ObjectTypeMap = {
  // NB! When editing these, be sure to update `/utils/typeGuard.ts` as well.
  [OBJECT_TYPE.Alliance]: Alliance;
  [OBJECT_TYPE.AllianceNomination]: AllianceNomination;
  [OBJECT_TYPE.BooleanQuestion]: BooleanQuestion;
  [OBJECT_TYPE.Candidate]: Candidate;
  [OBJECT_TYPE.CandidateNomination]: CandidateNomination;
  [OBJECT_TYPE.Constituency]: Constituency;
  [OBJECT_TYPE.ConstituencyGroup]: ConstituencyGroup;
  [OBJECT_TYPE.DateQuestion]: DateQuestion;
  [OBJECT_TYPE.Election]: Election;
  [OBJECT_TYPE.Faction]: Faction;
  [OBJECT_TYPE.FactionNomination]: FactionNomination;
  [OBJECT_TYPE.ImageQuestion]: ImageQuestion;
  [OBJECT_TYPE.MultipleChoiceCategoricalQuestion]: MultipleChoiceCategoricalQuestion;
  [OBJECT_TYPE.MultipleTextQuestion]: MultipleTextQuestion;
  [OBJECT_TYPE.NumberQuestion]: NumberQuestion;
  [OBJECT_TYPE.Organization]: Organization;
  [OBJECT_TYPE.OrganizationNomination]: OrganizationNomination;
  [OBJECT_TYPE.QuestionCategory]: QuestionCategory;
  [OBJECT_TYPE.SingleChoiceCategoricalQuestion]: SingleChoiceCategoricalQuestion;
  [OBJECT_TYPE.SingleChoiceOrdinalQuestion]: SingleChoiceOrdinalQuestion;
  [OBJECT_TYPE.TextQuestion]: TextQuestion;
};
