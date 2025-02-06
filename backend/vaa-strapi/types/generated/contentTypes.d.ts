import type { Attribute, Schema } from '@strapi/strapi';

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Attribute.String;
    registrationToken: Attribute.String & Attribute.Private;
    resetPasswordToken: Attribute.String & Attribute.Private;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    username: Attribute.String;
  };
}

export interface ApiAnswerAnswer extends Schema.CollectionType {
  collectionName: 'answers';
  info: {
    description: '';
    displayName: 'Answers';
    pluralName: 'answers';
    singularName: 'answer';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    candidate: Attribute.Relation<
      'api::answer.answer',
      'manyToOne',
      'api::candidate.candidate'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::answer.answer',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    openAnswer: Attribute.JSON;
    party: Attribute.Relation<
      'api::answer.answer',
      'manyToOne',
      'api::party.party'
    >;
    question: Attribute.Relation<
      'api::answer.answer',
      'manyToOne',
      'api::question.question'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::answer.answer',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    value: Attribute.JSON & Attribute.Required;
  };
}

export interface ApiAppCustomizationAppCustomization extends Schema.SingleType {
  collectionName: 'app_customizations';
  info: {
    description: '';
    displayName: 'App Customization';
    pluralName: 'app-customizations';
    singularName: 'app-customization';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    candidateAppFAQ: Attribute.Component<
      'customization.candidate-app-faq',
      true
    >;
    candPoster: Attribute.Media<'images'>;
    candPosterDark: Attribute.Media<'images'>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::app-customization.app-customization',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    poster: Attribute.Media<'images'>;
    posterDark: Attribute.Media<'images'>;
    publisherLogo: Attribute.Media<'images'>;
    publisherLogoDark: Attribute.Media<'images'>;
    publisherName: Attribute.JSON;
    translationOverrides: Attribute.Component<
      'customization.translation-override',
      true
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::app-customization.app-customization',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiAppSettingAppSetting extends Schema.CollectionType {
  collectionName: 'app_settings';
  info: {
    description: '';
    displayName: 'App Settings';
    pluralName: 'app-settings';
    singularName: 'app-setting';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    allowOverwrite: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::app-setting.app-setting',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    elections: Attribute.Component<'settings.elections'>;
    entities: Attribute.Component<'settings.entities'> & Attribute.Required;
    entityDetails: Attribute.Component<'settings.entity-details'> &
      Attribute.Required;
    header: Attribute.Component<'settings.header'> & Attribute.Required;
    headerStyle: Attribute.Component<'settings.header-style'>;
    matching: Attribute.Component<'settings.matching'> & Attribute.Required;
    questions: Attribute.Component<'settings.questions'> & Attribute.Required;
    results: Attribute.Component<'settings.results'> & Attribute.Required;
    survey: Attribute.Component<'settings.survey'>;
    underMaintenance: Attribute.Boolean & Attribute.DefaultTo<false>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::app-setting.app-setting',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCandidateCandidate extends Schema.CollectionType {
  collectionName: 'candidates';
  info: {
    description: '';
    displayName: 'Candidates';
    pluralName: 'candidates';
    singularName: 'candidate';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    answers: Attribute.Relation<
      'api::candidate.candidate',
      'oneToMany',
      'api::answer.answer'
    >;
    appLanguage: Attribute.Relation<
      'api::candidate.candidate',
      'oneToOne',
      'api::language.language'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::candidate.candidate',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    email: Attribute.String & Attribute.Private;
    firstName: Attribute.String & Attribute.Required;
    lastName: Attribute.String & Attribute.Required;
    nomination: Attribute.Relation<
      'api::candidate.candidate',
      'oneToOne',
      'api::nomination.nomination'
    >;
    party: Attribute.Relation<
      'api::candidate.candidate',
      'manyToOne',
      'api::party.party'
    >;
    photo: Attribute.Media<'images'>;
    publishedAt: Attribute.DateTime;
    registrationKey: Attribute.String & Attribute.Private;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::candidate.candidate',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    user: Attribute.Relation<
      'api::candidate.candidate',
      'oneToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Private;
  };
}

export interface ApiConstituencyGroupConstituencyGroup
  extends Schema.CollectionType {
  collectionName: 'constituency_groups';
  info: {
    description: '';
    displayName: 'Constituency Group';
    pluralName: 'constituency-groups';
    singularName: 'constituency-group';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    constituencies: Attribute.Relation<
      'api::constituency-group.constituency-group',
      'oneToMany',
      'api::constituency.constituency'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::constituency-group.constituency-group',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    info: Attribute.JSON;
    name: Attribute.JSON;
    shortName: Attribute.JSON;
    subtype: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::constituency-group.constituency-group',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiConstituencyConstituency extends Schema.CollectionType {
  collectionName: 'constituencies';
  info: {
    description: '';
    displayName: 'Constituencies';
    pluralName: 'constituencies';
    singularName: 'constituency';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::constituency.constituency',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    info: Attribute.JSON;
    keywords: Attribute.JSON;
    name: Attribute.JSON;
    nominations: Attribute.Relation<
      'api::constituency.constituency',
      'oneToMany',
      'api::nomination.nomination'
    >;
    parent: Attribute.Relation<
      'api::constituency.constituency',
      'oneToOne',
      'api::constituency.constituency'
    >;
    shortName: Attribute.JSON;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::constituency.constituency',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiElectionElection extends Schema.CollectionType {
  collectionName: 'elections';
  info: {
    description: '';
    displayName: 'Elections';
    pluralName: 'elections';
    singularName: 'election';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    answersLocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    constituencyGroups: Attribute.Relation<
      'api::election.election',
      'oneToMany',
      'api::constituency-group.constituency-group'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::election.election',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    electionDate: Attribute.Date & Attribute.Required;
    electionStartDate: Attribute.Date & Attribute.Required;
    electionType: Attribute.Enumeration<['local', 'presidential', 'congress']>;
    info: Attribute.JSON;
    name: Attribute.JSON;
    nominations: Attribute.Relation<
      'api::election.election',
      'oneToMany',
      'api::nomination.nomination'
    >;
    publishedAt: Attribute.DateTime;
    shortName: Attribute.JSON;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::election.election',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFeedbackFeedback extends Schema.CollectionType {
  collectionName: 'feedbacks';
  info: {
    description: '';
    displayName: 'Feedback';
    pluralName: 'feedbacks';
    singularName: 'feedback';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::feedback.feedback',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    date: Attribute.DateTime;
    description: Attribute.Text;
    rating: Attribute.Integer &
      Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::feedback.feedback',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    url: Attribute.Text;
    userAgent: Attribute.Text;
  };
}

export interface ApiLanguageLanguage extends Schema.CollectionType {
  collectionName: 'languages';
  info: {
    description: '';
    displayName: 'Languages';
    pluralName: 'languages';
    singularName: 'language';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::language.language',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localisationCode: Attribute.String & Attribute.Required;
    name: Attribute.String & Attribute.Required;
    publishedAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::language.language',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiLlmTestLlmTest extends Schema.CollectionType {
  collectionName: 'llm_tests';
  info: {
    displayName: 'LLM Test';
    pluralName: 'llm-tests';
    singularName: 'llm-test';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::llm-test.llm-test',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    prompt: Attribute.Text;
    response: Attribute.Text;
    timestamp: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::llm-test.llm-test',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiNominationNomination extends Schema.CollectionType {
  collectionName: 'nominations';
  info: {
    description: '';
    displayName: 'Nominations';
    pluralName: 'nominations';
    singularName: 'nomination';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    candidate: Attribute.Relation<
      'api::nomination.nomination',
      'oneToOne',
      'api::candidate.candidate'
    >;
    constituency: Attribute.Relation<
      'api::nomination.nomination',
      'manyToOne',
      'api::constituency.constituency'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::nomination.nomination',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    election: Attribute.Relation<
      'api::nomination.nomination',
      'manyToOne',
      'api::election.election'
    >;
    electionRound: Attribute.Integer &
      Attribute.Required &
      Attribute.DefaultTo<1>;
    electionSymbol: Attribute.String;
    party: Attribute.Relation<
      'api::nomination.nomination',
      'manyToOne',
      'api::party.party'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::nomination.nomination',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPartyParty extends Schema.CollectionType {
  collectionName: 'parties';
  info: {
    description: '';
    displayName: 'Parties';
    pluralName: 'parties';
    singularName: 'party';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    answers: Attribute.Relation<
      'api::party.party',
      'oneToMany',
      'api::answer.answer'
    >;
    candidates: Attribute.Relation<
      'api::party.party',
      'oneToMany',
      'api::candidate.candidate'
    >;
    color: Attribute.String;
    colorDark: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::party.party',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    info: Attribute.JSON;
    logo: Attribute.Media<'images'>;
    name: Attribute.JSON;
    nominations: Attribute.Relation<
      'api::party.party',
      'oneToMany',
      'api::nomination.nomination'
    >;
    publishedAt: Attribute.DateTime;
    shortName: Attribute.JSON;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::party.party',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiQuestionCategoryQuestionCategory
  extends Schema.CollectionType {
  collectionName: 'question_categories';
  info: {
    description: '';
    displayName: 'Question Categories';
    pluralName: 'question-categories';
    singularName: 'question-category';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    color: Attribute.String;
    colorDark: Attribute.String;
    constituencies: Attribute.Relation<
      'api::question-category.question-category',
      'oneToMany',
      'api::constituency.constituency'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::question-category.question-category',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    customData: Attribute.JSON;
    elections: Attribute.Relation<
      'api::question-category.question-category',
      'oneToMany',
      'api::election.election'
    >;
    info: Attribute.JSON;
    name: Attribute.JSON;
    order: Attribute.Integer & Attribute.Required & Attribute.DefaultTo<0>;
    questions: Attribute.Relation<
      'api::question-category.question-category',
      'oneToMany',
      'api::question.question'
    >;
    shortName: Attribute.JSON;
    type: Attribute.Enumeration<['opinion', 'info']> &
      Attribute.DefaultTo<'opinion'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::question-category.question-category',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiQuestionTypeQuestionType extends Schema.CollectionType {
  collectionName: 'question_types';
  info: {
    description: '';
    displayName: 'Question Types';
    pluralName: 'question-types';
    singularName: 'question-type';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::question-type.question-type',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    info: Attribute.Text;
    name: Attribute.String & Attribute.Required;
    settings: Attribute.JSON;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::question-type.question-type',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiQuestionQuestion extends Schema.CollectionType {
  collectionName: 'questions';
  info: {
    description: '';
    displayName: 'Questions';
    pluralName: 'questions';
    singularName: 'question';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    allowOpen: Attribute.Boolean & Attribute.DefaultTo<true>;
    answers: Attribute.Relation<
      'api::question.question',
      'oneToMany',
      'api::answer.answer'
    >;
    category: Attribute.Relation<
      'api::question.question',
      'manyToOne',
      'api::question-category.question-category'
    >;
    constituencies: Attribute.Relation<
      'api::question.question',
      'oneToMany',
      'api::constituency.constituency'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::question.question',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    customData: Attribute.JSON;
    entityType: Attribute.Enumeration<['all', 'candidate', 'party']> &
      Attribute.DefaultTo<'all'>;
    fillingInfo: Attribute.JSON;
    filterable: Attribute.Boolean & Attribute.DefaultTo<false>;
    info: Attribute.JSON;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
    publishedAt: Attribute.DateTime;
    questionType: Attribute.Relation<
      'api::question.question',
      'oneToOne',
      'api::question-type.question-type'
    >;
    required: Attribute.Boolean & Attribute.DefaultTo<true>;
    shortName: Attribute.JSON;
    text: Attribute.JSON;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::question.question',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    scheduledAt: Attribute.DateTime;
    status: Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Attribute.Required;
    timezone: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    entry: Attribute.Relation<
      'plugin::content-releases.release-action',
      'morphToOne'
    >;
    isEntryValid: Attribute.Boolean;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Attribute.String;
    caption: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    ext: Attribute.String;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    height: Attribute.Integer;
    mime: Attribute.String & Attribute.Required;
    name: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    size: Attribute.Decimal & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    url: Attribute.String & Attribute.Required;
    width: Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    type: Attribute.String & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    candidate: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'api::candidate.candidate'
    >;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Attribute.String;
    resetPasswordToken: Attribute.String & Attribute.Private;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::answer.answer': ApiAnswerAnswer;
      'api::app-customization.app-customization': ApiAppCustomizationAppCustomization;
      'api::app-setting.app-setting': ApiAppSettingAppSetting;
      'api::candidate.candidate': ApiCandidateCandidate;
      'api::constituency-group.constituency-group': ApiConstituencyGroupConstituencyGroup;
      'api::constituency.constituency': ApiConstituencyConstituency;
      'api::election.election': ApiElectionElection;
      'api::feedback.feedback': ApiFeedbackFeedback;
      'api::language.language': ApiLanguageLanguage;
      'api::llm-test.llm-test': ApiLlmTestLlmTest;
      'api::nomination.nomination': ApiNominationNomination;
      'api::party.party': ApiPartyParty;
      'api::question-category.question-category': ApiQuestionCategoryQuestionCategory;
      'api::question-type.question-type': ApiQuestionTypeQuestionType;
      'api::question.question': ApiQuestionQuestion;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
