import type {Schema, Attribute} from '@strapi/strapi';

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
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
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::permission', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::permission', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
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
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    username: Attribute.String;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    registrationToken: Attribute.String & Attribute.Private;
    isActive: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> & Attribute.Private;
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    preferedLanguage: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> & Attribute.Private;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
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
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
    permissions: Attribute.Relation<'admin::role', 'oneToMany', 'admin::permission'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> & Attribute.Private;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> & Attribute.Private;
  };
}

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
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
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<'admin::api-token', 'oneToMany', 'admin::api-token-permission'>;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::api-token', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::api-token', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
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
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<'admin::api-token-permission', 'manyToOne', 'admin::api-token'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::api-token-permission', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::api-token-permission', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
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
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::transfer-token', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::transfer-token', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
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
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::transfer-token-permission', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::transfer-token-permission', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
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
    name: Attribute.String & Attribute.Required;
    alternativeText: Attribute.String;
    caption: Attribute.String;
    width: Attribute.Integer;
    height: Attribute.Integer;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    ext: Attribute.String;
    mime: Attribute.String & Attribute.Required;
    size: Attribute.Decimal & Attribute.Required;
    url: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    folder: Attribute.Relation<'plugin::upload.file', 'manyToOne', 'plugin::upload.folder'> &
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
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::upload.file', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'plugin::upload.file', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
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
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    parent: Attribute.Relation<'plugin::upload.folder', 'manyToOne', 'plugin::upload.folder'>;
    children: Attribute.Relation<'plugin::upload.folder', 'oneToMany', 'plugin::upload.folder'>;
    files: Attribute.Relation<'plugin::upload.folder', 'oneToMany', 'plugin::upload.file'>;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::upload.folder', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'plugin::upload.folder', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    singularName: 'release';
    pluralName: 'releases';
    displayName: 'Release';
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
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    scheduledAt: Attribute.DateTime;
    timezone: Attribute.String;
    status: Attribute.Enumeration<['ready', 'blocked', 'failed', 'done', 'empty']> &
      Attribute.Required;
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::content-releases.release', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'plugin::content-releases.release', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    singularName: 'release-action';
    pluralName: 'release-actions';
    displayName: 'Release Action';
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
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    entry: Attribute.Relation<'plugin::content-releases.release-action', 'morphToOne'>;
    contentType: Attribute.String & Attribute.Required;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    isEntryValid: Attribute.Boolean;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
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
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 50;
        },
        number
      >;
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::i18n.locale', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'plugin::i18n.locale', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission extends Schema.CollectionType {
  collectionName: 'up_permissions';
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
    action: Attribute.String & Attribute.Required;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
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
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    description: Attribute.String;
    type: Attribute.String & Attribute.Unique;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::users-permissions.role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'plugin::users-permissions.role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    name: 'user';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Attribute.String;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    candidate: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'api::candidate.candidate'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'plugin::users-permissions.user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'plugin::users-permissions.user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiAnswerAnswer extends Schema.CollectionType {
  collectionName: 'answers';
  info: {
    singularName: 'answer';
    pluralName: 'answers';
    displayName: 'Answers';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    candidate: Attribute.Relation<'api::answer.answer', 'manyToOne', 'api::candidate.candidate'>;
    party: Attribute.Relation<'api::answer.answer', 'manyToOne', 'api::party.party'>;
    value: Attribute.JSON & Attribute.Required;
    question: Attribute.Relation<'api::answer.answer', 'manyToOne', 'api::question.question'>;
    openAnswer: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::answer.answer', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::answer.answer', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiAppSettingAppSetting extends Schema.CollectionType {
  collectionName: 'app_settings';
  info: {
    singularName: 'app-setting';
    pluralName: 'app-settings';
    displayName: 'App Settings';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    publisherName: Attribute.JSON;
    publisherLogo: Attribute.Media;
    publisherLogoDark: Attribute.Media;
    customData: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::app-setting.app-setting', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::app-setting.app-setting', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiCandidateCandidate extends Schema.CollectionType {
  collectionName: 'candidates';
  info: {
    singularName: 'candidate';
    pluralName: 'candidates';
    displayName: 'Candidates';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    email: Attribute.String & Attribute.Private;
    registrationKey: Attribute.String & Attribute.Private;
    user: Attribute.Relation<
      'api::candidate.candidate',
      'oneToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Private;
    firstName: Attribute.String & Attribute.Required;
    lastName: Attribute.String & Attribute.Required;
    birthday: Attribute.String;
    unaffiliated: Attribute.Boolean & Attribute.Required;
    photo: Attribute.Media;
    manifesto: Attribute.Text;
    motherTongues: Attribute.Relation<
      'api::candidate.candidate',
      'oneToMany',
      'api::language.language'
    >;
    otherLanguages: Attribute.Relation<
      'api::candidate.candidate',
      'oneToMany',
      'api::language.language'
    >;
    politicalExperience: Attribute.Text & Attribute.Required;
    party: Attribute.Relation<'api::candidate.candidate', 'manyToOne', 'api::party.party'>;
    answers: Attribute.Relation<'api::candidate.candidate', 'oneToMany', 'api::answer.answer'>;
    nominations: Attribute.Relation<
      'api::candidate.candidate',
      'oneToMany',
      'api::nomination.nomination'
    >;
    candidateAttributes: Attribute.Relation<
      'api::candidate.candidate',
      'oneToMany',
      'api::candidate-attribute.candidate-attribute'
    >;
    gender: Attribute.Relation<'api::candidate.candidate', 'oneToOne', 'api::gender.gender'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::candidate.candidate', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::candidate.candidate', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiCandidateAttributeCandidateAttribute extends Schema.CollectionType {
  collectionName: 'candidate_attributes';
  info: {
    singularName: 'candidate-attribute';
    pluralName: 'candidate-attributes';
    displayName: 'Candidate Attributes';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    questionType: Attribute.Relation<
      'api::candidate-attribute.candidate-attribute',
      'oneToOne',
      'api::question-type.question-type'
    >;
    candidate: Attribute.Relation<
      'api::candidate-attribute.candidate-attribute',
      'manyToOne',
      'api::candidate.candidate'
    >;
    name: Attribute.JSON;
    shortName: Attribute.JSON;
    info: Attribute.JSON;
    fillingInfo: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::candidate-attribute.candidate-attribute',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::candidate-attribute.candidate-attribute',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiConstituencyConstituency extends Schema.CollectionType {
  collectionName: 'constituencies';
  info: {
    singularName: 'constituency';
    pluralName: 'constituencies';
    displayName: 'Constituencies';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    type: Attribute.Enumeration<['geographic', 'ethnic']> & Attribute.Required;
    elections: Attribute.Relation<
      'api::constituency.constituency',
      'manyToMany',
      'api::election.election'
    >;
    nominations: Attribute.Relation<
      'api::constituency.constituency',
      'oneToMany',
      'api::nomination.nomination'
    >;
    name: Attribute.JSON;
    shortName: Attribute.JSON;
    info: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::constituency.constituency', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::constituency.constituency', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiElectionElection extends Schema.CollectionType {
  collectionName: 'elections';
  info: {
    singularName: 'election';
    pluralName: 'elections';
    displayName: 'Elections';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    electionStartDate: Attribute.Date & Attribute.Required;
    electionDate: Attribute.Date & Attribute.Required;
    electionType: Attribute.Enumeration<['local', 'presidential', 'congress']>;
    electionAppLabel: Attribute.Relation<
      'api::election.election',
      'manyToOne',
      'api::election-app-label.election-app-label'
    >;
    constituencies: Attribute.Relation<
      'api::election.election',
      'manyToMany',
      'api::constituency.constituency'
    >;
    nominations: Attribute.Relation<
      'api::election.election',
      'oneToMany',
      'api::nomination.nomination'
    >;
    question_categories: Attribute.Relation<
      'api::election.election',
      'manyToMany',
      'api::question-category.question-category'
    >;
    name: Attribute.JSON;
    shortName: Attribute.JSON;
    organizer: Attribute.JSON;
    info: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::election.election', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::election.election', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiElectionAppLabelElectionAppLabel extends Schema.CollectionType {
  collectionName: 'election_app_label';
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
    elections: Attribute.Relation<
      'api::election-app-label.election-app-label',
      'oneToMany',
      'api::election.election'
    >;
    actionLabels: Attribute.Component<'labels.action-labels'> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    viewTexts: Attribute.Component<'labels.view-texts'> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::election-app-label.election-app-label',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::election-app-label.election-app-label',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    localizations: Attribute.Relation<
      'api::election-app-label.election-app-label',
      'oneToMany',
      'api::election-app-label.election-app-label'
    >;
    locale: Attribute.String;
  };
}

export interface ApiGenderGender extends Schema.CollectionType {
  collectionName: 'genders';
  info: {
    singularName: 'gender';
    pluralName: 'genders';
    displayName: 'Genders';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::gender.gender', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::gender.gender', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiLanguageLanguage extends Schema.CollectionType {
  collectionName: 'languages';
  info: {
    singularName: 'language';
    pluralName: 'languages';
    displayName: 'Languages';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    localisationCode: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::language.language', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::language.language', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiNominationNomination extends Schema.CollectionType {
  collectionName: 'nominations';
  info: {
    singularName: 'nomination';
    pluralName: 'nominations';
    displayName: 'Nominations';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    election: Attribute.Relation<
      'api::nomination.nomination',
      'manyToOne',
      'api::election.election'
    >;
    constituency: Attribute.Relation<
      'api::nomination.nomination',
      'manyToOne',
      'api::constituency.constituency'
    >;
    candidate: Attribute.Relation<
      'api::nomination.nomination',
      'manyToOne',
      'api::candidate.candidate'
    >;
    party: Attribute.Relation<'api::nomination.nomination', 'manyToOne', 'api::party.party'>;
    type: Attribute.String;
    electionSymbol: Attribute.String;
    electionRound: Attribute.Integer & Attribute.Required & Attribute.DefaultTo<1>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::nomination.nomination', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::nomination.nomination', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiPartyParty extends Schema.CollectionType {
  collectionName: 'parties';
  info: {
    singularName: 'party';
    pluralName: 'parties';
    displayName: 'Parties';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    logo: Attribute.Media;
    candidates: Attribute.Relation<'api::party.party', 'oneToMany', 'api::candidate.candidate'>;
    answers: Attribute.Relation<'api::party.party', 'oneToMany', 'api::answer.answer'>;
    nominations: Attribute.Relation<'api::party.party', 'oneToMany', 'api::nomination.nomination'>;
    color: Attribute.String;
    name: Attribute.JSON;
    shortName: Attribute.JSON;
    info: Attribute.JSON;
    colorDark: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::party.party', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::party.party', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiQuestionQuestion extends Schema.CollectionType {
  collectionName: 'questions';
  info: {
    singularName: 'question';
    pluralName: 'questions';
    displayName: 'Questions';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    questionType: Attribute.Relation<
      'api::question.question',
      'manyToOne',
      'api::question-type.question-type'
    >;
    answers: Attribute.Relation<'api::question.question', 'oneToMany', 'api::answer.answer'>;
    category: Attribute.Relation<
      'api::question.question',
      'manyToOne',
      'api::question-category.question-category'
    >;
    text: Attribute.JSON;
    info: Attribute.JSON;
    fillingInfo: Attribute.JSON;
    shortName: Attribute.JSON;
    allowOpen: Attribute.Boolean & Attribute.DefaultTo<true>;
    filterable: Attribute.Boolean & Attribute.DefaultTo<false>;
    customData: Attribute.JSON;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::question.question', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::question.question', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiQuestionCategoryQuestionCategory extends Schema.CollectionType {
  collectionName: 'question_categories';
  info: {
    singularName: 'question-category';
    pluralName: 'question-categories';
    displayName: 'Question Categories';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    order: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    elections: Attribute.Relation<
      'api::question-category.question-category',
      'manyToMany',
      'api::election.election'
    >;
    name: Attribute.JSON;
    shortName: Attribute.JSON;
    info: Attribute.JSON;
    questions: Attribute.Relation<
      'api::question-category.question-category',
      'oneToMany',
      'api::question.question'
    >;
    type: Attribute.Enumeration<['opinion', 'info']> & Attribute.DefaultTo<'opinion'>;
    color: Attribute.String;
    colorDark: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::question-category.question-category',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
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
    singularName: 'question-type';
    pluralName: 'question-types';
    displayName: 'Question Types';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    name: Attribute.String & Attribute.Required;
    settings: Attribute.JSON;
    info: Attribute.Text;
    questions: Attribute.Relation<
      'api::question-type.question-type',
      'oneToMany',
      'api::question.question'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::question-type.question-type', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::question-type.question-type', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::permission': AdminPermission;
      'admin::user': AdminUser;
      'admin::role': AdminRole;
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
      'api::answer.answer': ApiAnswerAnswer;
      'api::app-setting.app-setting': ApiAppSettingAppSetting;
      'api::candidate.candidate': ApiCandidateCandidate;
      'api::candidate-attribute.candidate-attribute': ApiCandidateAttributeCandidateAttribute;
      'api::constituency.constituency': ApiConstituencyConstituency;
      'api::election.election': ApiElectionElection;
      'api::election-app-label.election-app-label': ApiElectionAppLabelElectionAppLabel;
      'api::gender.gender': ApiGenderGender;
      'api::language.language': ApiLanguageLanguage;
      'api::nomination.nomination': ApiNominationNomination;
      'api::party.party': ApiPartyParty;
      'api::question.question': ApiQuestionQuestion;
      'api::question-category.question-category': ApiQuestionCategoryQuestionCategory;
      'api::question-type.question-type': ApiQuestionTypeQuestionType;
    }
  }
}
