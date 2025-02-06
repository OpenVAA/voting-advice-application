import type { Attribute, Schema } from '@strapi/strapi';

export interface CustomizationCandidateAppFaq extends Schema.Component {
  collectionName: 'components_customization_candidate_app_faqs';
  info: {
    description: '';
    displayName: 'Candidate App FAQ';
  };
  attributes: {
    answer: Attribute.Text & Attribute.Required;
    locale: Attribute.String & Attribute.Required;
    question: Attribute.Text & Attribute.Required;
  };
}

export interface CustomizationTranslationOverride extends Schema.Component {
  collectionName: 'components_customization_translation_overrides';
  info: {
    description: '';
    displayName: 'Translation Override';
  };
  attributes: {
    translationKey: Attribute.String & Attribute.Required;
    translations: Attribute.Component<
      'customization.translation-override-translation',
      true
    >;
  };
}

export interface CustomizationTranslationOverrideTranslation
  extends Schema.Component {
  collectionName: 'components_customization_translation_override_translations';
  info: {
    description: '';
    displayName: 'Translation Override - Translation';
  };
  attributes: {
    locale: Attribute.String & Attribute.Required;
    translation: Attribute.Text;
  };
}

export interface SettingsElections extends Schema.Component {
  collectionName: 'components_settings_elections';
  info: {
    displayName: 'Elections';
  };
  attributes: {
    disallowSelection: Attribute.Boolean;
  };
}

export interface SettingsEntities extends Schema.Component {
  collectionName: 'components_settings_entities';
  info: {
    description: '';
    displayName: 'Entities';
  };
  attributes: {
    hideIfMissingAnswers: Attribute.Component<'settings.hide-if-missing-answers'>;
  };
}

export interface SettingsEntityDetails extends Schema.Component {
  collectionName: 'components_settings_entity_details';
  info: {
    description: '';
    displayName: 'Entity Details';
  };
  attributes: {
    contents: Attribute.Component<'settings.entity-details-contents'> &
      Attribute.Required;
    showMissingAnswers: Attribute.Component<'settings.entity-details-show-missing-answers'> &
      Attribute.Required;
    showMissingElectionSymbol: Attribute.Component<'settings.entity-details-show-missing-elsmbl'> &
      Attribute.Required;
  };
}

export interface SettingsEntityDetailsContents extends Schema.Component {
  collectionName: 'components_settings_entity_details_contents';
  info: {
    description: '';
    displayName: 'Entity Details - Contents';
  };
  attributes: {
    candidate: Attribute.JSON &
      Attribute.Required &
      Attribute.CustomField<
        'plugin::multi-select.multi-select',
        ['info', 'opinions']
      >;
    organization: Attribute.JSON &
      Attribute.Required &
      Attribute.CustomField<
        'plugin::multi-select.multi-select',
        ['candidates', 'info', 'opinions']
      >;
  };
}

export interface SettingsEntityDetailsShowMissingAnswers
  extends Schema.Component {
  collectionName: 'components_settings_entity_details_show_missing_answers';
  info: {
    description: '';
    displayName: 'Entity Details - Show Missing Answers';
  };
  attributes: {
    candidate: Attribute.Boolean & Attribute.Required;
    organization: Attribute.Boolean & Attribute.Required;
  };
}

export interface SettingsEntityDetailsShowMissingElsmbl
  extends Schema.Component {
  collectionName: 'components_settings_entity_details_show_missing_elsmbls';
  info: {
    description: '';
    displayName: 'Entity Details - Show Missing Election Symbol';
  };
  attributes: {
    candidate: Attribute.Boolean & Attribute.Required;
    organization: Attribute.Boolean & Attribute.Required;
  };
}

export interface SettingsHeader extends Schema.Component {
  collectionName: 'components_settings_headers';
  info: {
    description: '';
    displayName: 'Header';
  };
  attributes: {
    showFeedback: Attribute.Boolean & Attribute.Required;
    showHelp: Attribute.Boolean & Attribute.Required;
  };
}

export interface SettingsHeaderStyle extends Schema.Component {
  collectionName: 'components_settings_header_styles';
  info: {
    displayName: 'Header Style';
  };
  attributes: {
    dark: Attribute.Component<'settings.header-style-dark'>;
    imgPosition: Attribute.String;
    imgSize: Attribute.String;
    light: Attribute.Component<'settings.header-style-light'>;
  };
}

export interface SettingsHeaderStyleDark extends Schema.Component {
  collectionName: 'components_settings_header_style_darks';
  info: {
    displayName: 'Header Style - Dark';
  };
  attributes: {
    bgColor: Attribute.String;
    overImgBgColor: Attribute.String;
  };
}

export interface SettingsHeaderStyleLight extends Schema.Component {
  collectionName: 'components_settings_header_style_lights';
  info: {
    displayName: 'Header Style - Light';
  };
  attributes: {
    bgColor: Attribute.String;
    overImgBgColor: Attribute.String;
  };
}

export interface SettingsHideIfMissingAnswers extends Schema.Component {
  collectionName: 'components_settings_hide_if_missing_answers';
  info: {
    description: '';
    displayName: 'hideIfMissingAnswers';
  };
  attributes: {
    candidate: Attribute.Boolean;
  };
}

export interface SettingsMatching extends Schema.Component {
  collectionName: 'components_settings_matchings';
  info: {
    description: '';
    displayName: 'Matching';
  };
  attributes: {
    minimumAnswers: Attribute.Integer & Attribute.Required;
    organizationMatching: Attribute.Enumeration<
      ['none', 'answersOnly', 'mean', 'median']
    > &
      Attribute.Required;
  };
}

export interface SettingsQuestions extends Schema.Component {
  collectionName: 'components_settings_questions';
  info: {
    description: '';
    displayName: 'Questions';
  };
  attributes: {
    categoryIntros: Attribute.Component<'settings.questions-category-intros'>;
    questionsIntro: Attribute.Component<'settings.questions-intro'> &
      Attribute.Required;
    showCategoryTags: Attribute.Boolean & Attribute.Required;
    showResultsLink: Attribute.Boolean;
  };
}

export interface SettingsQuestionsCategoryIntros extends Schema.Component {
  collectionName: 'components_settings_questions_category_intros';
  info: {
    description: '';
    displayName: 'Questions - Category Intros';
  };
  attributes: {
    allowSkip: Attribute.Boolean;
    show: Attribute.Boolean & Attribute.Required;
  };
}

export interface SettingsQuestionsIntro extends Schema.Component {
  collectionName: 'components_settings_questions_intros';
  info: {
    description: '';
    displayName: 'Questions - Intro';
  };
  attributes: {
    allowCategorySelection: Attribute.Boolean;
    show: Attribute.Boolean & Attribute.Required;
  };
}

export interface SettingsResults extends Schema.Component {
  collectionName: 'components_settings_results';
  info: {
    description: '';
    displayName: 'Results';
  };
  attributes: {
    candidateCardContents: Attribute.Component<
      'settings.results-candidate-card-contents',
      true
    > &
      Attribute.Required;
    organizationCardContents: Attribute.Component<
      'settings.results-party-card-contents',
      true
    > &
      Attribute.Required;
    sections: Attribute.JSON &
      Attribute.Required &
      Attribute.CustomField<
        'plugin::multi-select.multi-select',
        ['candidate', 'organization']
      >;
    showFeedbackPopup: Attribute.Integer;
    showSurveyPopup: Attribute.Integer;
  };
}

export interface SettingsResultsCandidateCardContents extends Schema.Component {
  collectionName: 'components_settings_results_candidate_card_contents';
  info: {
    displayName: 'Results - Candidate Card Contents';
  };
  attributes: {
    content: Attribute.Enumeration<['submatches', 'question']> &
      Attribute.Required;
    question_format: Attribute.Enumeration<['default', 'tag']>;
    question_hideLabel: Attribute.Boolean;
    question_id: Attribute.String;
  };
}

export interface SettingsResultsPartyCardContents extends Schema.Component {
  collectionName: 'components_settings_results_party_card_contents';
  info: {
    displayName: 'Results - Candidate Card Contents';
  };
  attributes: {
    content: Attribute.Enumeration<['submatches', 'candidates', 'question']> &
      Attribute.Required;
    question_format: Attribute.Enumeration<['default', 'tag']>;
    question_hideLabel: Attribute.Boolean;
    question_id: Attribute.String;
  };
}

export interface SettingsSurvey extends Schema.Component {
  collectionName: 'components_settings_surveys';
  info: {
    description: '';
    displayName: 'Survey';
  };
  attributes: {
    linkTemplate: Attribute.String & Attribute.Required;
    showIn: Attribute.JSON &
      Attribute.Required &
      Attribute.CustomField<
        'plugin::multi-select.multi-select',
        ['frontpage', 'entityDetails', 'navigation', 'resultsPopup']
      >;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'customization.candidate-app-faq': CustomizationCandidateAppFaq;
      'customization.translation-override': CustomizationTranslationOverride;
      'customization.translation-override-translation': CustomizationTranslationOverrideTranslation;
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
