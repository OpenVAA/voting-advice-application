import type {Schema, Attribute} from '@strapi/strapi';

export interface LabelsActionLabels extends Schema.Component {
  collectionName: 'components_labels_action_labels';
  info: {
    displayName: 'ActionLabels';
    description: '';
  };
  attributes: {
    startButton: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Start Finding Candidates!'>;
    electionInfo: Attribute.Text &
      Attribute.Required &
      Attribute.DefaultTo<'Information About the Elections'>;
    howItWorks: Attribute.Text &
      Attribute.Required &
      Attribute.DefaultTo<'How Does This App Work?'>;
    help: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Help'>;
    startQuestions: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Start the Questionnaire'>;
    home: Attribute.String & Attribute.Required & Attribute.DefaultTo<'home'>;
    opinions: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Opinions'>;
    results: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Results'>;
    yourList: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Your List'>;
  };
}

export interface LabelsViewTexts extends Schema.Component {
  collectionName: 'components_labels_view_texts';
  info: {
    displayName: 'ViewTexts';
    description: '';
  };
  attributes: {
    publishedBy: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Published by {publisher}'>;
    madeWith: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Made with '>;
    yourOpinionsTitle: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Tell Your Opinions'>;
    questionsTip: Attribute.Text &
      Attribute.DefaultTo<'Tip: If you don\u2019t care about an issue, you can skip it.'>;
    appTitle: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Election Compass'>;
    frontpageIngress: Attribute.Text &
      Attribute.DefaultTo<'With this application you can compare candidates in the elections on {electionDate, date, ::yyyyMMdd} based on their opinions, parties and other data.'>;
    yourOpinionsIngress: Attribute.Text &
      Attribute.DefaultTo<'Next, the app will ask your opinions on {numStatements} statements about political issues and values, which the candidates have also answered. After you\u2019ve answered them, the app will find the candidates that best agree with your opinions. The statements are grouped into {numCategories} categories. You can answer all of them or only select those you find important.'>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'labels.action-labels': LabelsActionLabels;
      'labels.view-texts': LabelsViewTexts;
    }
  }
}
