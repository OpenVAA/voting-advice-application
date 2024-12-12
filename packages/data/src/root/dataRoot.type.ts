import {
  Alliance,
  AllianceNomination,
  Answer,
  AnswerFormatter,
  AnswerValue,
  AnyEntityVariantData,
  AnyNominationVariantPublicData,
  AnyQuestionVariant,
  AnyQuestionVariantData,
  ArrayAnswerFormatter,
  Candidate,
  CandidateNomination,
  Constituency,
  ConstituencyData,
  ConstituencyGroup,
  ConstituencyGroupData,
  Election,
  ElectionData,
  EntityVariantTree,
  Faction,
  FactionNomination,
  Formatter,
  MissingAnswerFormatter,
  NominationVariantTree,
  Organization,
  OrganizationNomination,
  QUESTION_TYPE,
  QuestionCategory,
  QuestionCategoryData,
  QuestionVariant
} from '../internal';

/**
 * The formatter functions stored in `DataRoot.format`.
 */
export type RootFormatters = {
  allianceName: Formatter<Alliance>;
  allianceShortName: Formatter<Alliance>;
  candidateName: Formatter<Candidate>;
  candidateShortName: Formatter<Candidate>;
  factionName: Formatter<Faction>;
  booleanAnswer: AnswerFormatter<typeof QUESTION_TYPE.Boolean>;
  dateAnswer: AnswerFormatter<typeof QUESTION_TYPE.Date>;
  imageAnswer: AnswerFormatter<typeof QUESTION_TYPE.Image>;
  missingAnswer: MissingAnswerFormatter;
  multipleTextAnswer: ArrayAnswerFormatter;
  numberAnswer: AnswerFormatter<typeof QUESTION_TYPE.Number>;
  textAnswer: AnswerFormatter<typeof QUESTION_TYPE.Text>;
};

/**
 * Used for enforcing typing for `DataRoot.formatAnswer`.
 */
export interface AnswerFormatterParams<TQuestion extends AnyQuestionVariant> {
  answer?: Answer<AnswerValue[TQuestion['type']]> | null;
  question: QuestionVariant[TQuestion['type']];
}

/**
 * The names of `DataRoot` child collections and their respective classes.
 */
export type RootCollections = {
  constituencies: Constituency;
  constituencyGroups: ConstituencyGroup;
  elections: Election;
  // Questions and categories
  questionCategories: QuestionCategory;
  questions: AnyQuestionVariant;
  // Entities
  alliances: Alliance;
  candidates: Candidate;
  factions: Faction;
  organizations: Organization;
  // Nominations
  allianceNominations: AllianceNomination;
  candidateNominations: CandidateNomination;
  factionNominations: FactionNomination;
  organizationNominations: OrganizationNomination;
};

/**
 * A hierarchical data format for providing all VAA data at once.
 */
export type FullVaaData<
  TEntities extends EntityVariantTree | Array<AnyEntityVariantData> = EntityVariantTree | Array<AnyEntityVariantData>,
  TNominations extends NominationVariantTree | Array<AnyNominationVariantPublicData> =
    | NominationVariantTree
    | Array<AnyNominationVariantPublicData>
> = {
  elections: Array<ElectionData>;
  constituencies: {
    groups: Array<ConstituencyGroupData>;
    constituencies: Array<ConstituencyData>;
  };
  questions: {
    categories: Array<QuestionCategoryData>;
    questions: Array<AnyQuestionVariantData>;
  };
  /**
   * Entities can be provided either as a hierarchical tree or as an array of fully-specified entities.
   */
  entities: TEntities;
  /**
   * Nomimations can be provided either as a hierarchical tree or as an array of fully-specified nominations.
   */
  nominations: TNominations;
};
