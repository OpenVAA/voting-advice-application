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
    electionInfo: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Information about the elections'>;
    howItWorks: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'How does this app work?'>;
    help: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Help'>;
    searchMunicipality: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Your Municipality or Town'>;
    startQuestions: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Start the Questionnaire'>;
    selectCategories: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Select Categories'>;
    previous: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Previous'>;
    answerCategoryQuestions: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Answer {{0}} Questions'>;
    readMore: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Read More'>;
    skip: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Skip'>;
    filter: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Filter Results'>;
    alphaOrder: Attribute.String & Attribute.Required & Attribute.DefaultTo<'A-Z'>;
    bestMatchOrder: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Best Match'>;
    addToList: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Add to List'>;
    candidateBasicInfo: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Basic Info'>;
    candidateOpinions: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Opinions'>;
    home: Attribute.String & Attribute.Required & Attribute.DefaultTo<'home'>;
    constituency: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Constituency'>;
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
    toolTitle: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Election Compass'>;
    toolDescription: Attribute.Text &
      Attribute.Required &
      Attribute.DefaultTo<'With this application you can compare candidates in the elections on {{0}} based on their opinions, parties and other data.'>;
    publishedBy: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Published by {{0}}'>;
    madeWith: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Made with {{0}}'>;
    selectMunicipalityTitle: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Select Your Municipality'>;
    selectMunicipalityDescription: Attribute.Text &
      Attribute.Required &
      Attribute.DefaultTo<'In these elections, you can only vote for candidates in your own constituency. Select your municipality and the app will find it for you.'>;
    yourConstituency: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Your constituency is {{0}}'>;
    yourOpinionsTitle: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Tell Your Opinions'>;
    yourOpinionsDescription: Attribute.Text &
      Attribute.Required &
      Attribute.DefaultTo<'Next, the app will ask your opinions on {{0}} statements about political issues and values, which the candidates have also answered. After you\'ve answered them, the app will find the candidates that best agree with your opinions. The statements are grouped into {{1}} categories. You can answer all of them or only select those you find important.'>;
    questionsTip: Attribute.String &
      Attribute.DefaultTo<'Tip: If you don\u2019t care about a single issue or a category of them, you can skip it later.'>;
    yourCandidatesTitle: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Your Candidates'>;
    yourCandidatesDescription: Attribute.Text &
      Attribute.Required &
      Attribute.DefaultTo<'These are the candidates in your constituency. The best matches are first on the list. You can also see which {{0}} best match your opinions. To narrow down the results, you can also use {{1}}.'>;
    yourPartiesTitle: Attribute.String & Attribute.Required & Attribute.DefaultTo<'Your Parties'>;
    yourPartiesDescription: Attribute.Text &
      Attribute.Required &
      Attribute.DefaultTo<'These are the parties in your constituency. The best matches are first on the list. You can also see which individual {{0}} best match your opinions. To narrow down the results, you can also use {{1}}.'>;
  };
}

declare module '@strapi/strapi' {
  export module Shared {
    export interface Components {
      'labels.action-labels': LabelsActionLabels;
      'labels.view-texts': LabelsViewTexts;
    }
  }
}
