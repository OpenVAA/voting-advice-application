import {
  Alliance,
  AllianceNomination,
  AnswerFormatter,
  AnyEntityVariantData,
  AnyNominationVariantPublicData,
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
  QuestionVariant,
  QuestionVariantData
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
  multipleTextAnswer: AnswerFormatter<typeof QUESTION_TYPE.MultipleText>;
  numberAnswer: AnswerFormatter<typeof QUESTION_TYPE.Number>;
  textAnswer: AnswerFormatter<typeof QUESTION_TYPE.Text>;
};

/**
 * Used to check that `DataRoot` implements methods for accessing the `RootFormatters` methods.
 */
export type FormatterMethods = {
  [KType in keyof RootFormatters as `format${Capitalize<KType>}`]: RootFormatters[KType];
};

/**
 * The names of `DataRoot` child collections and their respective classes.
 */
export type RootCollections = {
  constituencies: Constituency;
  constituencyGroups: ConstituencyGroup;
  elections: Election;
  // Questions and categories
  questionCategories: QuestionCategory;
  questions: QuestionVariant;
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
    questions: Array<QuestionVariantData>;
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
