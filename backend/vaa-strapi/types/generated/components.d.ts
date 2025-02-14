import type { Schema, Attribute } from '@strapi/strapi';

export interface SettingsSurvey extends Schema.Component {
  collectionName: 'components_settings_surveys';
  info: {
    displayName: 'Survey';
    description: '';
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

export interface SettingsResults extends Schema.Component {
  collectionName: 'components_settings_results';
  info: {
    displayName: 'Results';
    description: '';
  };
  attributes: {
    sections: Attribute.JSON &
      Attribute.Required &
      Attribute.CustomField<'plugin::multi-select.multi-select', ['candidate', 'party']>;
    showFeedbackPopup: Attribute.Integer;
    showSurveyPopup: Attribute.Integer;
    candidateCardContents: Attribute.Component<'settings.results-candidate-card-contents', true> & Attribute.Required;
    partyCardContents: Attribute.Component<'settings.results-party-card-contents', true> & Attribute.Required;
  };
}

export interface SettingsResultsPartyCardContents extends Schema.Component {
  collectionName: 'components_settings_results_party_card_contents';
  info: {
    displayName: 'Results - Candidate Card Contents';
  };
  attributes: {
    content: Attribute.Enumeration<['submatches', 'candidates', 'question']> & Attribute.Required;
    question_id: Attribute.String;
    question_hideLabel: Attribute.Boolean;
    question_format: Attribute.Enumeration<['default', 'tag']>;
  };
}

export interface SettingsResultsCandidateCardContents extends Schema.Component {
  collectionName: 'components_settings_results_candidate_card_contents';
  info: {
    displayName: 'Results - Candidate Card Contents';
  };
  attributes: {
    content: Attribute.Enumeration<['submatches', 'question']> & Attribute.Required;
    question_id: Attribute.String;
    question_hideLabel: Attribute.Boolean;
    question_format: Attribute.Enumeration<['default', 'tag']>;
  };
}

export interface SettingsQuestions extends Schema.Component {
  collectionName: 'components_settings_questions';
  info: {
    displayName: 'Questions';
    description: '';
  };
  attributes: {
    categoryIntros: Attribute.Component<'settings.questions-category-intros'>;
    questionsIntro: Attribute.Component<'settings.questions-intro'> & Attribute.Required;
    showCategoryTags: Attribute.Boolean & Attribute.Required;
    showResultsLink: Attribute.Boolean;
    dynamicOrdering: Attribute.Component<'settings.questions-ordering'>;
  };
}

export interface SettingsQuestionsIntro extends Schema.Component {
  collectionName: 'components_settings_questions_intros';
  info: {
    displayName: 'Questions - Intro';
    description: '';
  };
  attributes: {
    allowCategorySelection: Attribute.Boolean;
    show: Attribute.Boolean & Attribute.Required;
  };
}

export interface SettingsQuestionsCategoryIntros extends Schema.Component {
  collectionName: 'components_settings_questions_category_intros';
  info: {
    displayName: 'Questions - Category Intros';
    description: '';
  };
  attributes: {
    allowSkip: Attribute.Boolean;
    show: Attribute.Boolean & Attribute.Required;
  };
}

export interface SettingsQuestionsOrdering extends Schema.Component {
  collectionName: 'components_settings_questions_ordering';
  info: {
    displayName: 'Questions - Ordering';
    description: '';
  };
  attributes: {
    enabled: Attribute.Boolean & Attribute.Required;
    suggestions: Attribute.Integer & Attribute.Required;
  };
}

export interface SettingsMatching extends Schema.Component {
  collectionName: 'components_settings_matchings';
  info: {
    displayName: 'Matching';
    description: '';
  };
  attributes: {
    minimumAnswers: Attribute.Integer & Attribute.Required;
    partyMatching: Attribute.Enumeration<['none', 'answersOnly', 'mean', 'median']> & Attribute.Required;
  };
}

export interface SettingsHideIfMissingAnswers extends Schema.Component {
  collectionName: 'components_settings_hide_if_missing_answers';
  info: {
    displayName: 'hideIfMissingAnswers';
  };
  attributes: {
    candidate: Attribute.Boolean;
    party: Attribute.Boolean;
  };
}

export interface SettingsHeader extends Schema.Component {
  collectionName: 'components_settings_headers';
  info: {
    displayName: 'Header';
    description: '';
  };
  attributes: {
    showFeedback: Attribute.Boolean & Attribute.Required;
    showHelp: Attribute.Boolean & Attribute.Required;
  };
}

export interface SettingsEntityDetails extends Schema.Component {
  collectionName: 'components_settings_entity_details';
  info: {
    displayName: 'Entity Details';
    description: '';
  };
  attributes: {
    contents: Attribute.Component<'settings.entity-details-contents'> & Attribute.Required;
    showMissingElectionSymbol: Attribute.Component<'settings.entity-details-show-missing-elsmbl'> & Attribute.Required;
    showMissingAnswers: Attribute.Component<'settings.entity-details-show-missing-answers'> & Attribute.Required;
  };
}

export interface SettingsEntityDetailsShowMissingElsmbl extends Schema.Component {
  collectionName: 'components_settings_entity_details_show_missing_elsmbls';
  info: {
    displayName: 'Entity Details - Show Missing Election Symbol';
    description: '';
  };
  attributes: {
    candidate: Attribute.Boolean & Attribute.Required;
    party: Attribute.Boolean & Attribute.Required;
  };
}

export interface SettingsEntityDetailsShowMissingAnswers extends Schema.Component {
  collectionName: 'components_settings_entity_details_show_missing_answers';
  info: {
    displayName: 'Entity Details - Show Missing Answers';
    description: '';
  };
  attributes: {
    candidate: Attribute.Boolean & Attribute.Required;
    party: Attribute.Boolean & Attribute.Required;
  };
}

export interface SettingsEntityDetailsContents extends Schema.Component {
  collectionName: 'components_settings_entity_details_contents';
  info: {
    displayName: 'Entity Details - Contents';
    description: '';
  };
  attributes: {
    candidate: Attribute.JSON &
      Attribute.Required &
      Attribute.CustomField<'plugin::multi-select.multi-select', ['info', 'opinions']>;
    party: Attribute.JSON &
      Attribute.Required &
      Attribute.CustomField<'plugin::multi-select.multi-select', ['candidates', 'info', 'opinions']>;
  };
}

export interface SettingsEntities extends Schema.Component {
  collectionName: 'components_settings_entities';
  info: {
    displayName: 'Entities';
    description: '';
  };
  attributes: {
    hideIfMissingAnswers: Attribute.Component<'settings.hide-if-missing-answers'>;
  };
}

export interface CustomizationTranslationOverride extends Schema.Component {
  collectionName: 'components_customization_translation_overrides';
  info: {
    displayName: 'Translation Override';
    description: '';
  };
  attributes: {
    translationKey: Attribute.String & Attribute.Required;
    translations: Attribute.Component<'customization.translation-override-translation', true>;
  };
}

export interface CustomizationTranslationOverrideTranslation extends Schema.Component {
  collectionName: 'components_customization_translation_override_translations';
  info: {
    displayName: 'Translation Override - Translation';
    description: '';
  };
  attributes: {
    locale: Attribute.String & Attribute.Required;
    translation: Attribute.Text;
  };
}

export interface CustomizationCandidateAppFaq extends Schema.Component {
  collectionName: 'components_customization_candidate_app_faqs';
  info: {
    displayName: 'Candidate App FAQ';
    description: '';
  };
  attributes: {
    question: Attribute.Text & Attribute.Required;
    answer: Attribute.Text & Attribute.Required;
    locale: Attribute.String & Attribute.Required;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'settings.survey': SettingsSurvey;
      'settings.results': SettingsResults;
      'settings.results-party-card-contents': SettingsResultsPartyCardContents;
      'settings.results-candidate-card-contents': SettingsResultsCandidateCardContents;
      'settings.questions': SettingsQuestions;
      'settings.questions-intro': SettingsQuestionsIntro;
      'settings.questions-category-intros': SettingsQuestionsCategoryIntros;
      'settings.matching': SettingsMatching;
      'settings.hide-if-missing-answers': SettingsHideIfMissingAnswers;
      'settings.header': SettingsHeader;
      'settings.entity-details': SettingsEntityDetails;
      'settings.entity-details-show-missing-elsmbl': SettingsEntityDetailsShowMissingElsmbl;
      'settings.entity-details-show-missing-answers': SettingsEntityDetailsShowMissingAnswers;
      'settings.entity-details-contents': SettingsEntityDetailsContents;
      'settings.entities': SettingsEntities;
      'customization.translation-override': CustomizationTranslationOverride;
      'customization.translation-override-translation': CustomizationTranslationOverrideTranslation;
      'customization.candidate-app-faq': CustomizationCandidateAppFaq;
      'settings.questions-ordering': SettingsQuestionsOrdering;
    }
  }
}
