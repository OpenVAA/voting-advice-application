import {
  CollectionTypeSchema,
  StringAttribute,
  RequiredAttribute,
  SetMinMaxLength,
  JSONAttribute,
  DefaultTo,
  RelationAttribute,
  DateTimeAttribute,
  PrivateAttribute,
  EmailAttribute,
  UniqueAttribute,
  PasswordAttribute,
  BooleanAttribute,
  EnumerationAttribute,
  BigIntegerAttribute,
  IntegerAttribute,
  DecimalAttribute,
  SetMinMax,
  TextAttribute,
  SetPluginOptions,
  MediaAttribute,
  DateAttribute,
  RichTextAttribute,
  ComponentAttribute,
  ComponentSchema
} from '@strapi/strapi';

export interface AdminPermission extends CollectionTypeSchema {
  info: {
    name: 'Permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
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
    action: StringAttribute &
      RequiredAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }>;
    subject: StringAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }>;
    properties: JSONAttribute & DefaultTo<{}>;
    conditions: JSONAttribute & DefaultTo<[]>;
    role: RelationAttribute<'admin::permission', 'manyToOne', 'admin::role'>;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'admin::permission', 'oneToOne', 'admin::user'> & PrivateAttribute;
    updatedBy: RelationAttribute<'admin::permission', 'oneToOne', 'admin::user'> & PrivateAttribute;
  };
}

export interface AdminUser extends CollectionTypeSchema {
  info: {
    name: 'User';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
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
    firstname: StringAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }>;
    lastname: StringAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }>;
    username: StringAttribute;
    email: EmailAttribute &
      RequiredAttribute &
      PrivateAttribute &
      UniqueAttribute &
      SetMinMaxLength<{
        minLength: 6;
      }>;
    password: PasswordAttribute &
      PrivateAttribute &
      SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: StringAttribute & PrivateAttribute;
    registrationToken: StringAttribute & PrivateAttribute;
    isActive: BooleanAttribute & PrivateAttribute & DefaultTo<false>;
    roles: RelationAttribute<'admin::user', 'manyToMany', 'admin::role'> & PrivateAttribute;
    blocked: BooleanAttribute & PrivateAttribute & DefaultTo<false>;
    preferedLanguage: StringAttribute;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'admin::user', 'oneToOne', 'admin::user'> & PrivateAttribute;
    updatedBy: RelationAttribute<'admin::user', 'oneToOne', 'admin::user'> & PrivateAttribute;
  };
}

export interface AdminRole extends CollectionTypeSchema {
  info: {
    name: 'Role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
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
    name: StringAttribute &
      RequiredAttribute &
      UniqueAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }>;
    code: StringAttribute &
      RequiredAttribute &
      UniqueAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }>;
    description: StringAttribute;
    users: RelationAttribute<'admin::role', 'manyToMany', 'admin::user'>;
    permissions: RelationAttribute<'admin::role', 'oneToMany', 'admin::permission'>;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'admin::role', 'oneToOne', 'admin::user'> & PrivateAttribute;
    updatedBy: RelationAttribute<'admin::role', 'oneToOne', 'admin::user'> & PrivateAttribute;
  };
}

export interface AdminApiToken extends CollectionTypeSchema {
  info: {
    name: 'Api Token';
    singularName: 'api-token';
    pluralName: 'api-tokens';
    displayName: 'Api Token';
    description: '';
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
    name: StringAttribute &
      RequiredAttribute &
      UniqueAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }>;
    description: StringAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }> &
      DefaultTo<''>;
    type: EnumerationAttribute<['read-only', 'full-access', 'custom']> &
      RequiredAttribute &
      DefaultTo<'read-only'>;
    accessKey: StringAttribute &
      RequiredAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: DateTimeAttribute;
    permissions: RelationAttribute<'admin::api-token', 'oneToMany', 'admin::api-token-permission'>;
    expiresAt: DateTimeAttribute;
    lifespan: BigIntegerAttribute;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'admin::api-token', 'oneToOne', 'admin::user'> & PrivateAttribute;
    updatedBy: RelationAttribute<'admin::api-token', 'oneToOne', 'admin::user'> & PrivateAttribute;
  };
}

export interface AdminApiTokenPermission extends CollectionTypeSchema {
  info: {
    name: 'API Token Permission';
    description: '';
    singularName: 'api-token-permission';
    pluralName: 'api-token-permissions';
    displayName: 'API Token Permission';
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
    action: StringAttribute &
      RequiredAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }>;
    token: RelationAttribute<'admin::api-token-permission', 'manyToOne', 'admin::api-token'>;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'admin::api-token-permission', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'admin::api-token-permission', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
  };
}

export interface AdminTransferToken extends CollectionTypeSchema {
  info: {
    name: 'Transfer Token';
    singularName: 'transfer-token';
    pluralName: 'transfer-tokens';
    displayName: 'Transfer Token';
    description: '';
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
    name: StringAttribute &
      RequiredAttribute &
      UniqueAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }>;
    description: StringAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }> &
      DefaultTo<''>;
    accessKey: StringAttribute &
      RequiredAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: DateTimeAttribute;
    permissions: RelationAttribute<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    expiresAt: DateTimeAttribute;
    lifespan: BigIntegerAttribute;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'admin::transfer-token', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'admin::transfer-token', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
  };
}

export interface AdminTransferTokenPermission extends CollectionTypeSchema {
  info: {
    name: 'Transfer Token Permission';
    description: '';
    singularName: 'transfer-token-permission';
    pluralName: 'transfer-token-permissions';
    displayName: 'Transfer Token Permission';
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
    action: StringAttribute &
      RequiredAttribute &
      SetMinMaxLength<{
        minLength: 1;
      }>;
    token: RelationAttribute<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'admin::transfer-token-permission', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'admin::transfer-token-permission', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
  };
}

export interface PluginUploadFile extends CollectionTypeSchema {
  info: {
    singularName: 'file';
    pluralName: 'files';
    displayName: 'File';
    description: '';
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
    name: StringAttribute & RequiredAttribute;
    alternativeText: StringAttribute;
    caption: StringAttribute;
    width: IntegerAttribute;
    height: IntegerAttribute;
    formats: JSONAttribute;
    hash: StringAttribute & RequiredAttribute;
    ext: StringAttribute;
    mime: StringAttribute & RequiredAttribute;
    size: DecimalAttribute & RequiredAttribute;
    url: StringAttribute & RequiredAttribute;
    previewUrl: StringAttribute;
    provider: StringAttribute & RequiredAttribute;
    provider_metadata: JSONAttribute;
    related: RelationAttribute<'plugin::upload.file', 'morphToMany'>;
    folder: RelationAttribute<'plugin::upload.file', 'manyToOne', 'plugin::upload.folder'> &
      PrivateAttribute;
    folderPath: StringAttribute &
      RequiredAttribute &
      PrivateAttribute &
      SetMinMax<{
        min: 1;
      }>;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'plugin::upload.file', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'plugin::upload.file', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
  };
}

export interface PluginUploadFolder extends CollectionTypeSchema {
  info: {
    singularName: 'folder';
    pluralName: 'folders';
    displayName: 'Folder';
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
    name: StringAttribute &
      RequiredAttribute &
      SetMinMax<{
        min: 1;
      }>;
    pathId: IntegerAttribute & RequiredAttribute & UniqueAttribute;
    parent: RelationAttribute<'plugin::upload.folder', 'manyToOne', 'plugin::upload.folder'>;
    children: RelationAttribute<'plugin::upload.folder', 'oneToMany', 'plugin::upload.folder'>;
    files: RelationAttribute<'plugin::upload.folder', 'oneToMany', 'plugin::upload.file'>;
    path: StringAttribute &
      RequiredAttribute &
      SetMinMax<{
        min: 1;
      }>;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'plugin::upload.folder', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'plugin::upload.folder', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
  };
}

export interface PluginI18NLocale extends CollectionTypeSchema {
  info: {
    singularName: 'locale';
    pluralName: 'locales';
    collectionName: 'locales';
    displayName: 'Locale';
    description: '';
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
    name: StringAttribute &
      SetMinMax<{
        min: 1;
        max: 50;
      }>;
    code: StringAttribute & UniqueAttribute;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'plugin::i18n.locale', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'plugin::i18n.locale', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
  };
}

export interface PluginUsersPermissionsPermission extends CollectionTypeSchema {
  info: {
    name: 'permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
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
    action: StringAttribute & RequiredAttribute;
    role: RelationAttribute<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      PrivateAttribute;
    updatedBy: RelationAttribute<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      PrivateAttribute;
  };
}

export interface PluginUsersPermissionsRole extends CollectionTypeSchema {
  info: {
    name: 'role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
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
    name: StringAttribute &
      RequiredAttribute &
      SetMinMaxLength<{
        minLength: 3;
      }>;
    description: StringAttribute;
    type: StringAttribute & UniqueAttribute;
    permissions: RelationAttribute<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    users: RelationAttribute<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'plugin::users-permissions.role', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'plugin::users-permissions.role', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
  };
}

export interface PluginUsersPermissionsUser extends CollectionTypeSchema {
  info: {
    name: 'user';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    username: StringAttribute &
      RequiredAttribute &
      UniqueAttribute &
      SetMinMaxLength<{
        minLength: 3;
      }>;
    email: EmailAttribute &
      RequiredAttribute &
      SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: StringAttribute;
    password: PasswordAttribute &
      PrivateAttribute &
      SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: StringAttribute & PrivateAttribute;
    confirmationToken: StringAttribute & PrivateAttribute;
    confirmed: BooleanAttribute & DefaultTo<false>;
    blocked: BooleanAttribute & DefaultTo<false>;
    role: RelationAttribute<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'plugin::users-permissions.user', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'plugin::users-permissions.user', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
  };
}

export interface ApiAnswerAnswer extends CollectionTypeSchema {
  info: {
    singularName: 'answer';
    pluralName: 'answers';
    displayName: 'Answers';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    answer: TextAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    publishedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'api::answer.answer', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'api::answer.answer', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    localizations: RelationAttribute<'api::answer.answer', 'oneToMany', 'api::answer.answer'>;
    locale: StringAttribute;
  };
}

export interface ApiCandidateCandidate extends CollectionTypeSchema {
  info: {
    singularName: 'candidate';
    pluralName: 'candidates';
    displayName: 'Candidates';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    firstName: StringAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    lastName: StringAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    motherTongues: RelationAttribute<
      'api::candidate.candidate',
      'oneToMany',
      'api::language.language'
    >;
    otherLanguages: RelationAttribute<
      'api::candidate.candidate',
      'oneToMany',
      'api::language.language'
    >;
    politicalExperience: TextAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    otherParties: RelationAttribute<'api::candidate.candidate', 'oneToMany', 'api::party.party'>;
    candidateId: StringAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    candidatePhoto: MediaAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    party: RelationAttribute<'api::candidate.candidate', 'manyToOne', 'api::party.party'>;
    elections: RelationAttribute<
      'api::candidate.candidate',
      'manyToMany',
      'api::election.election'
    >;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    publishedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'api::candidate.candidate', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'api::candidate.candidate', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    localizations: RelationAttribute<
      'api::candidate.candidate',
      'oneToMany',
      'api::candidate.candidate'
    >;
    locale: StringAttribute;
  };
}

export interface ApiCandidateAnswerCandidateAnswer extends CollectionTypeSchema {
  info: {
    singularName: 'candidate-answer';
    pluralName: 'candidate-answers';
    displayName: 'Candidate Answers';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    answerExplainer: TextAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    question: RelationAttribute<
      'api::candidate-answer.candidate-answer',
      'oneToOne',
      'api::question.question'
    >;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    publishedAt: DateTimeAttribute;
    createdBy: RelationAttribute<
      'api::candidate-answer.candidate-answer',
      'oneToOne',
      'admin::user'
    > &
      PrivateAttribute;
    updatedBy: RelationAttribute<
      'api::candidate-answer.candidate-answer',
      'oneToOne',
      'admin::user'
    > &
      PrivateAttribute;
    localizations: RelationAttribute<
      'api::candidate-answer.candidate-answer',
      'oneToMany',
      'api::candidate-answer.candidate-answer'
    >;
    locale: StringAttribute;
  };
}

export interface ApiCategoryCategory extends CollectionTypeSchema {
  info: {
    singularName: 'category';
    pluralName: 'categories';
    displayName: 'Categories';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: StringAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    questions: RelationAttribute<'api::category.category', 'oneToMany', 'api::question.question'>;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    publishedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'api::category.category', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'api::category.category', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    localizations: RelationAttribute<
      'api::category.category',
      'oneToMany',
      'api::category.category'
    >;
    locale: StringAttribute;
  };
}

export interface ApiConstituencyConstituency extends CollectionTypeSchema {
  info: {
    singularName: 'constituency';
    pluralName: 'constituencies';
    displayName: 'Constituencies';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: StringAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    publishedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'api::constituency.constituency', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'api::constituency.constituency', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    localizations: RelationAttribute<
      'api::constituency.constituency',
      'oneToMany',
      'api::constituency.constituency'
    >;
    locale: StringAttribute;
  };
}

export interface ApiElectionElection extends CollectionTypeSchema {
  info: {
    singularName: 'election';
    pluralName: 'elections';
    displayName: 'Elections';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    electionName: StringAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    electionDate: DateAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    electionType: EnumerationAttribute<['local', 'presidential', 'congress']> &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    parties: RelationAttribute<'api::election.election', 'oneToMany', 'api::party.party'>;
    electionDescription: RichTextAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    appTitle: StringAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    constituencies: RelationAttribute<
      'api::election.election',
      'oneToMany',
      'api::constituency.constituency'
    >;
    candidates: RelationAttribute<
      'api::election.election',
      'manyToMany',
      'api::candidate.candidate'
    >;
    categories: RelationAttribute<'api::election.election', 'oneToMany', 'api::category.category'>;
    electionAppLabel: RelationAttribute<
      'api::election.election',
      'manyToOne',
      'api::election-app-label.election-app-label'
    >;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    publishedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'api::election.election', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'api::election.election', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    localizations: RelationAttribute<
      'api::election.election',
      'oneToMany',
      'api::election.election'
    >;
    locale: StringAttribute;
  };
}

export interface ApiElectionAppLabelElectionAppLabel extends CollectionTypeSchema {
  info: {
    singularName: 'election-app-label';
    pluralName: 'election-app-labels';
    displayName: 'Election App Labels';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    name: StringAttribute &
      RequiredAttribute &
      UniqueAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    elections: RelationAttribute<
      'api::election-app-label.election-app-label',
      'oneToMany',
      'api::election.election'
    >;
    appTitle: StringAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    actionLabels: ComponentAttribute<'labels.action-labels'> &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    viewTexts: ComponentAttribute<'labels.view-texts'> &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    publishedAt: DateTimeAttribute;
    createdBy: RelationAttribute<
      'api::election-app-label.election-app-label',
      'oneToOne',
      'admin::user'
    > &
      PrivateAttribute;
    updatedBy: RelationAttribute<
      'api::election-app-label.election-app-label',
      'oneToOne',
      'admin::user'
    > &
      PrivateAttribute;
    localizations: RelationAttribute<
      'api::election-app-label.election-app-label',
      'oneToMany',
      'api::election-app-label.election-app-label'
    >;
    locale: StringAttribute;
  };
}

export interface ApiLanguageLanguage extends CollectionTypeSchema {
  info: {
    singularName: 'language';
    pluralName: 'languages';
    displayName: 'Languages';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    language: StringAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    publishedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'api::language.language', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'api::language.language', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    localizations: RelationAttribute<
      'api::language.language',
      'oneToMany',
      'api::language.language'
    >;
    locale: StringAttribute;
  };
}

export interface ApiPartyParty extends CollectionTypeSchema {
  info: {
    singularName: 'party';
    pluralName: 'parties';
    displayName: 'Parties';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    party: StringAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    partyDescription: TextAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    partyAbbreviation: StringAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    logo: MediaAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    mainColor: EnumerationAttribute<['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple']> &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    candidates: RelationAttribute<'api::party.party', 'oneToMany', 'api::candidate.candidate'>;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    publishedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'api::party.party', 'oneToOne', 'admin::user'> & PrivateAttribute;
    updatedBy: RelationAttribute<'api::party.party', 'oneToOne', 'admin::user'> & PrivateAttribute;
    localizations: RelationAttribute<'api::party.party', 'oneToMany', 'api::party.party'>;
    locale: StringAttribute;
  };
}

export interface ApiQuestionQuestion extends CollectionTypeSchema {
  info: {
    singularName: 'question';
    pluralName: 'questions';
    displayName: 'Questions';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    question: TextAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    answers: RelationAttribute<'api::question.question', 'oneToMany', 'api::answer.answer'>;
    questionDescription: TextAttribute &
      RequiredAttribute &
      SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: DateTimeAttribute;
    updatedAt: DateTimeAttribute;
    publishedAt: DateTimeAttribute;
    createdBy: RelationAttribute<'api::question.question', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    updatedBy: RelationAttribute<'api::question.question', 'oneToOne', 'admin::user'> &
      PrivateAttribute;
    localizations: RelationAttribute<
      'api::question.question',
      'oneToMany',
      'api::question.question'
    >;
    locale: StringAttribute;
  };
}

export interface LabelsActionLabels extends ComponentSchema {
  info: {
    displayName: 'ActionLabels';
    description: '';
  };
  attributes: {
    startButton: StringAttribute & RequiredAttribute & DefaultTo<'Start Finding Candidates!'>;
    electionInfo: StringAttribute &
      RequiredAttribute &
      DefaultTo<'Information about the elections'>;
    howItWorks: StringAttribute & RequiredAttribute & DefaultTo<'How does this app work?'>;
    help: StringAttribute & RequiredAttribute & DefaultTo<'Help'>;
    searchMunicipality: StringAttribute &
      RequiredAttribute &
      DefaultTo<'Your Municipality or Town'>;
    startQuestions: StringAttribute & RequiredAttribute & DefaultTo<'Start the Questionnaire'>;
    selectCategories: StringAttribute & RequiredAttribute & DefaultTo<'Select Categories'>;
    previous: StringAttribute & RequiredAttribute & DefaultTo<'Previous'>;
    answerCategoryQuestions: StringAttribute &
      RequiredAttribute &
      DefaultTo<'Answer {{0}} Questions'>;
    readMore: StringAttribute & RequiredAttribute & DefaultTo<'Read More'>;
    skip: StringAttribute & RequiredAttribute & DefaultTo<'Skip'>;
    filter: StringAttribute & RequiredAttribute & DefaultTo<'Filter Results'>;
    alphaOrder: StringAttribute & RequiredAttribute & DefaultTo<'A-Z'>;
    bestMatchOrder: StringAttribute & RequiredAttribute & DefaultTo<'Best Match'>;
    addToList: StringAttribute & RequiredAttribute & DefaultTo<'Add to List'>;
    candidateBasicInfo: StringAttribute & RequiredAttribute & DefaultTo<'Basic Info'>;
    candidateOpinions: StringAttribute & RequiredAttribute & DefaultTo<'Opinions'>;
    home: StringAttribute & RequiredAttribute & DefaultTo<'home'>;
    constituency: StringAttribute & RequiredAttribute & DefaultTo<'Constituency'>;
    opinions: StringAttribute & RequiredAttribute & DefaultTo<'Opinions'>;
    results: StringAttribute & RequiredAttribute & DefaultTo<'Results'>;
    yourList: StringAttribute & RequiredAttribute & DefaultTo<'Your List'>;
  };
}

export interface LabelsViewTexts extends ComponentSchema {
  info: {
    displayName: 'ViewTexts';
    description: '';
  };
  attributes: {
    toolTitle: StringAttribute & RequiredAttribute & DefaultTo<'Election Compass'>;
    toolDescription: TextAttribute &
      RequiredAttribute &
      DefaultTo<'With this application you can compare candidates in the elections on {{0}} based on their opinions, parties and other data.'>;
    publishedBy: StringAttribute & RequiredAttribute & DefaultTo<'Published by {{0}}'>;
    madeWith: StringAttribute & RequiredAttribute & DefaultTo<'Made with {{0}}'>;
    selectMunicipalityTitle: StringAttribute &
      RequiredAttribute &
      DefaultTo<'Select Your Municipality'>;
    selectMunicipalityDescription: TextAttribute &
      RequiredAttribute &
      DefaultTo<'In these elections, you can only vote for candidates in your own constituency. Select your municipality and the app will find it for you.'>;
    yourConstituency: StringAttribute & RequiredAttribute & DefaultTo<'Your constituency is {{0}}'>;
    yourOpinionsTitle: StringAttribute & RequiredAttribute & DefaultTo<'Tell Your Opinions'>;
    yourOpinionsDescription: TextAttribute &
      RequiredAttribute &
      DefaultTo<'Next, the app will ask your opinions on {{0}} statements about political issues and values, which the candidates have also answered. After you\'ve answered them, the app will find the candidates that best agree with your opinions. The statements are grouped into {{1}} categories. You can answer all of them or only select those you find important.'>;
    questionsTip: StringAttribute &
      DefaultTo<'Tip: If you don\u2019t care about a single issue or a category of them, you can skip it later.'>;
    yourCandidatesTitle: StringAttribute & RequiredAttribute & DefaultTo<'Your Candidates'>;
    yourCandidatesDescription: TextAttribute &
      RequiredAttribute &
      DefaultTo<'These are the candidates in your constituency. The best matches are first on the list. You can also see which {{0}} best match your opinions. To narrow down the results, you can also use {{1}}.'>;
    yourPartiesTitle: StringAttribute & RequiredAttribute & DefaultTo<'Your Parties'>;
    yourPartiesDescription: TextAttribute &
      RequiredAttribute &
      DefaultTo<'These are the parties in your constituency. The best matches are first on the list. You can also see which individual {{0}} best match your opinions. To narrow down the results, you can also use {{1}}.'>;
  };
}

declare global {
  namespace Strapi {
    interface Schemas {
      'admin::permission': AdminPermission;
      'admin::user': AdminUser;
      'admin::role': AdminRole;
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
      'api::answer.answer': ApiAnswerAnswer;
      'api::candidate.candidate': ApiCandidateCandidate;
      'api::candidate-answer.candidate-answer': ApiCandidateAnswerCandidateAnswer;
      'api::category.category': ApiCategoryCategory;
      'api::constituency.constituency': ApiConstituencyConstituency;
      'api::election.election': ApiElectionElection;
      'api::election-app-label.election-app-label': ApiElectionAppLabelElectionAppLabel;
      'api::language.language': ApiLanguageLanguage;
      'api::party.party': ApiPartyParty;
      'api::question.question': ApiQuestionQuestion;
      'labels.action-labels': LabelsActionLabels;
      'labels.view-texts': LabelsViewTexts;
    }
  }
}
