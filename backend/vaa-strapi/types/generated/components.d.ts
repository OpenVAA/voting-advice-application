import type { Schema, Struct } from '@strapi/strapi';

export interface CustomizationCandidateAppFaq extends Struct.ComponentSchema {
  collectionName: 'components_customization_candidate_app_faqs';
  info: {
    description: '';
    displayName: 'Candidate App FAQ';
  };
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Required;
    question: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface CustomizationTranslationOverride extends Struct.ComponentSchema {
  collectionName: 'components_customization_translation_overrides';
  info: {
    description: '';
    displayName: 'Translation Override';
  };
  attributes: {
    translationKey: Schema.Attribute.String & Schema.Attribute.Required;
    translations: Schema.Attribute.Component<'customization.translation-override-translation', true>;
  };
}

export interface CustomizationTranslationOverrideTranslation extends Struct.ComponentSchema {
  collectionName: 'components_customization_translation_override_translations';
  info: {
    description: '';
    displayName: 'Translation Override - Translation';
  };
  attributes: {
    locale: Schema.Attribute.String & Schema.Attribute.Required;
    translation: Schema.Attribute.Text;
  };
}

export interface SettingsAccess extends Struct.ComponentSchema {
  collectionName: 'components_settings_accesses';
  info: {
    displayName: 'Access';
  };
  attributes: {
    answersLocked: Schema.Attribute.Boolean;
    candidateApp: Schema.Attribute.Boolean;
    underMaintenance: Schema.Attribute.Boolean;
    voterApp: Schema.Attribute.Boolean;
  };
}

export interface SettingsElections extends Struct.ComponentSchema {
  collectionName: 'components_settings_elections';
  info: {
    description: '';
    displayName: 'Elections';
  };
  attributes: {
    disallowSelection: Schema.Attribute.Boolean;
    showElectionTags: Schema.Attribute.Boolean;
    startFromConstituencyGroup: Schema.Attribute.String;
  };
}

export interface SettingsEntities extends Struct.ComponentSchema {
  collectionName: 'components_settings_entities';
  info: {
    description: '';
    displayName: 'Entities';
  };
  attributes: {
    hideIfMissingAnswers: Schema.Attribute.Component<'settings.hide-if-missing-answers', false>;
  };
}

export interface SettingsEntityDetails extends Struct.ComponentSchema {
  collectionName: 'components_settings_entity_details';
  info: {
    description: '';
    displayName: 'Entity Details';
  };
  attributes: {
    contents: Schema.Attribute.Component<'settings.entity-details-contents', false> & Schema.Attribute.Required;
    showMissingAnswers: Schema.Attribute.Component<'settings.entity-details-show-missing-answers', false> &
      Schema.Attribute.Required;
    showMissingElectionSymbol: Schema.Attribute.Component<'settings.entity-details-show-missing-elsmbl', false> &
      Schema.Attribute.Required;
  };
}

export interface SettingsEntityDetailsContents extends Struct.ComponentSchema {
  collectionName: 'components_settings_entity_details_contents';
  info: {
    description: '';
    displayName: 'Entity Details - Contents';
  };
  attributes: {
    candidate: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.CustomField<'plugin::multi-select.multi-select', ['info', 'opinions']>;
    organization: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.CustomField<'plugin::multi-select.multi-select', ['candidates', 'info', 'opinions']>;
  };
}

export interface SettingsEntityDetailsShowMissingAnswers extends Struct.ComponentSchema {
  collectionName: 'components_settings_entity_details_show_missing_answers';
  info: {
    description: '';
    displayName: 'Entity Details - Show Missing Answers';
  };
  attributes: {
    candidate: Schema.Attribute.Boolean & Schema.Attribute.Required;
    organization: Schema.Attribute.Boolean & Schema.Attribute.Required;
  };
}

export interface SettingsEntityDetailsShowMissingElsmbl extends Struct.ComponentSchema {
  collectionName: 'components_settings_entity_details_show_missing_elsmbls';
  info: {
    description: '';
    displayName: 'Entity Details - Show Missing Election Symbol';
  };
  attributes: {
    candidate: Schema.Attribute.Boolean & Schema.Attribute.Required;
    organization: Schema.Attribute.Boolean & Schema.Attribute.Required;
  };
}

export interface SettingsHeader extends Struct.ComponentSchema {
  collectionName: 'components_settings_headers';
  info: {
    description: '';
    displayName: 'Header';
  };
  attributes: {
    showFeedback: Schema.Attribute.Boolean & Schema.Attribute.Required;
    showHelp: Schema.Attribute.Boolean & Schema.Attribute.Required;
  };
}

export interface SettingsHeaderStyle extends Struct.ComponentSchema {
  collectionName: 'components_settings_header_styles';
  info: {
    displayName: 'Header Style';
  };
  attributes: {
    dark: Schema.Attribute.Component<'settings.header-style-dark', false>;
    imgPosition: Schema.Attribute.String;
    imgSize: Schema.Attribute.String;
    light: Schema.Attribute.Component<'settings.header-style-light', false>;
  };
}

export interface SettingsHeaderStyleDark extends Struct.ComponentSchema {
  collectionName: 'components_settings_header_style_darks';
  info: {
    displayName: 'Header Style - Dark';
  };
  attributes: {
    bgColor: Schema.Attribute.String;
    overImgBgColor: Schema.Attribute.String;
  };
}

export interface SettingsHeaderStyleLight extends Struct.ComponentSchema {
  collectionName: 'components_settings_header_style_lights';
  info: {
    displayName: 'Header Style - Light';
  };
  attributes: {
    bgColor: Schema.Attribute.String;
    overImgBgColor: Schema.Attribute.String;
  };
}

export interface SettingsHideIfMissingAnswers extends Struct.ComponentSchema {
  collectionName: 'components_settings_hide_if_missing_answers';
  info: {
    description: '';
    displayName: 'hideIfMissingAnswers';
  };
  attributes: {
    candidate: Schema.Attribute.Boolean;
  };
}

export interface SettingsMatching extends Struct.ComponentSchema {
  collectionName: 'components_settings_matchings';
  info: {
    description: '';
    displayName: 'Matching';
  };
  attributes: {
    minimumAnswers: Schema.Attribute.Integer & Schema.Attribute.Required;
    organizationMatching: Schema.Attribute.Enumeration<['none', 'answersOnly', 'impute']> & Schema.Attribute.Required;
  };
}

export interface SettingsNotifications extends Struct.ComponentSchema {
  collectionName: 'components_settings_notifications';
  info: {
    description: '';
    displayName: 'Notifications';
  };
  attributes: {
    candidateApp: Schema.Attribute.Component<'settings.notifications-notification-data', false>;
    voterApp: Schema.Attribute.Component<'settings.notifications-notification-data', false>;
  };
}

export interface SettingsNotificationsNotificationData extends Struct.ComponentSchema {
  collectionName: 'components_settings_notifications_notification_data';
  info: {
    description: '';
    displayName: 'Notifications - NotificationData';
  };
  attributes: {
    content: Schema.Attribute.JSON & Schema.Attribute.Required;
    icon: Schema.Attribute.String;
    show: Schema.Attribute.Boolean;
    title: Schema.Attribute.JSON & Schema.Attribute.Required;
  };
}

export interface SettingsQuestions extends Struct.ComponentSchema {
  collectionName: 'components_settings_questions';
  info: {
    description: '';
    displayName: 'Questions';
  };
  attributes: {
    categoryIntros: Schema.Attribute.Component<'settings.questions-category-intros', false>;
    questionsIntro: Schema.Attribute.Component<'settings.questions-intro', false> & Schema.Attribute.Required;
    showCategoryTags: Schema.Attribute.Boolean & Schema.Attribute.Required;
    showResultsLink: Schema.Attribute.Boolean;
  };
}

export interface SettingsQuestionsCategoryIntros extends Struct.ComponentSchema {
  collectionName: 'components_settings_questions_category_intros';
  info: {
    description: '';
    displayName: 'Questions - Category Intros';
  };
  attributes: {
    allowSkip: Schema.Attribute.Boolean;
    show: Schema.Attribute.Boolean & Schema.Attribute.Required;
  };
}

export interface SettingsQuestionsIntro extends Struct.ComponentSchema {
  collectionName: 'components_settings_questions_intros';
  info: {
    description: '';
    displayName: 'Questions - Intro';
  };
  attributes: {
    allowCategorySelection: Schema.Attribute.Boolean;
    show: Schema.Attribute.Boolean & Schema.Attribute.Required;
  };
}

export interface SettingsResults extends Struct.ComponentSchema {
  collectionName: 'components_settings_results';
  info: {
    description: '';
    displayName: 'Results';
  };
  attributes: {
    candidateCardContents: Schema.Attribute.Component<'settings.results-candidate-card-contents', true> &
      Schema.Attribute.Required;
    organizationCardContents: Schema.Attribute.Component<'settings.results-party-card-contents', true> &
      Schema.Attribute.Required;
    sections: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.CustomField<'plugin::multi-select.multi-select', ['candidate', 'organization']>;
    showFeedbackPopup: Schema.Attribute.Integer;
    showSurveyPopup: Schema.Attribute.Integer;
  };
}

export interface SettingsResultsCandidateCardContents extends Struct.ComponentSchema {
  collectionName: 'components_settings_results_candidate_card_contents';
  info: {
    displayName: 'Results - Candidate Card Contents';
  };
  attributes: {
    content: Schema.Attribute.Enumeration<['submatches', 'question']> & Schema.Attribute.Required;
    question_format: Schema.Attribute.Enumeration<['default', 'tag']>;
    question_hideLabel: Schema.Attribute.Boolean;
    question_id: Schema.Attribute.String;
  };
}

export interface SettingsResultsPartyCardContents extends Struct.ComponentSchema {
  collectionName: 'components_settings_results_party_card_contents';
  info: {
    displayName: 'Results - Candidate Card Contents';
  };
  attributes: {
    content: Schema.Attribute.Enumeration<['submatches', 'candidates', 'question']> & Schema.Attribute.Required;
    question_format: Schema.Attribute.Enumeration<['default', 'tag']>;
    question_hideLabel: Schema.Attribute.Boolean;
    question_id: Schema.Attribute.String;
  };
}

export interface SettingsSurvey extends Struct.ComponentSchema {
  collectionName: 'components_settings_surveys';
  info: {
    description: '';
    displayName: 'Survey';
  };
  attributes: {
    linkTemplate: Schema.Attribute.String & Schema.Attribute.Required;
    showIn: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.CustomField<
        'plugin::multi-select.multi-select',
        ['frontpage', 'entityDetails', 'navigation', 'resultsPopup']
      >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'customization.candidate-app-faq': CustomizationCandidateAppFaq;
      'customization.translation-override': CustomizationTranslationOverride;
      'customization.translation-override-translation': CustomizationTranslationOverrideTranslation;
      'settings.access': SettingsAccess;
      'settings.elections': SettingsElections;
      'settings.entities': SettingsEntities;
      'settings.entity-details': SettingsEntityDetails;
      'settings.entity-details-contents': SettingsEntityDetailsContents;
      'settings.entity-details-show-missing-answers': SettingsEntityDetailsShowMissingAnswers;
      'settings.entity-details-show-missing-elsmbl': SettingsEntityDetailsShowMissingElsmbl;
      'settings.header': SettingsHeader;
      'settings.header-style': SettingsHeaderStyle;
      'settings.header-style-dark': SettingsHeaderStyleDark;
      'settings.header-style-light': SettingsHeaderStyleLight;
      'settings.hide-if-missing-answers': SettingsHideIfMissingAnswers;
      'settings.matching': SettingsMatching;
      'settings.notifications': SettingsNotifications;
      'settings.notifications-notification-data': SettingsNotificationsNotificationData;
      'settings.questions': SettingsQuestions;
      'settings.questions-category-intros': SettingsQuestionsCategoryIntros;
      'settings.questions-intro': SettingsQuestionsIntro;
      'settings.results': SettingsResults;
      'settings.results-candidate-card-contents': SettingsResultsCandidateCardContents;
      'settings.results-party-card-contents': SettingsResultsPartyCardContents;
      'settings.survey': SettingsSurvey;
    }
  }
}
