/**
 * Automatically updated navigation configuration
 * Check and prepare update with scripts/generate-navigation-config.ts
 * To mark fix sections titles, set `fixedTitle: true` for them, otherwise the titles are updated automatically.
 *
 * NB. Any comments or content other than the navigation object will be removed!
 */

import type { Navigation } from './navigation.type';

export const navigation: Navigation = [
  {
    title: 'About',
    route: '/about',
    children: [
      {
        title: 'About OpenVAA',
        route: '/about/intro'
      },
      {
        title: 'Features',
        route: '/about/features'
      },
      {
        title: 'OpenVAA Association',
        route: '/about/association'
      },
      {
        title: 'OpenVAA ry Association rules',
        route: '/about/rules'
      },
      {
        title: 'The Initial Project',
        route: '/about/project',
        fixedTitle: true
      },
      {
        title: 'Newsletter',
        route: '/about/newsletter'
      },
      {
        title: 'Roadmap',
        route: '/about/roadmap'
      }
    ]
  },
  {
    title: 'Developers’ Guide',
    route: '/developers-guide',
    fixedTitle: true,
    children: [
      {
        title: 'Quick start',
        route: '/developers-guide/quick-start'
      },
      {
        title: 'App and repo structure',
        route: '/developers-guide/app-and-repo-structure'
      },
      {
        title: 'Configuration',
        route: '/developers-guide/configuration',
        children: [
          {
            title: 'Configuration',
            route: '/developers-guide/configuration/intro'
          },
          {
            title: 'Environmental variables',
            route: '/developers-guide/configuration/environmental-variables'
          },
          {
            title: 'Static settings',
            route: '/developers-guide/configuration/static-settings'
          },
          {
            title: 'App Settings',
            route: '/developers-guide/configuration/app-settings'
          },
          {
            title: 'App Customization',
            route: '/developers-guide/configuration/app-customization'
          }
        ]
      },
      {
        title: 'Development',
        route: '/developers-guide/development',
        children: [
          {
            title: 'Docker',
            route: '/developers-guide/development/intro'
          },
          {
            title: 'Requirements',
            route: '/developers-guide/development/requirements'
          },
          {
            title: 'Monorepo',
            route: '/developers-guide/development/monorepo'
          },
          {
            title: 'Running the Development Environment',
            route: '/developers-guide/development/running-the-development-environment'
          },
          {
            title: 'Testing',
            route: '/developers-guide/development/testing'
          }
        ]
      },
      {
        title: 'Deployment',
        route: '/developers-guide/deployment'
      },
      {
        title: 'Contributing',
        route: '/developers-guide/contributing',
        children: [
          {
            title: 'Contribute',
            route: '/developers-guide/contributing/contribute'
          },
          {
            title: 'Issues',
            route: '/developers-guide/contributing/issues'
          },
          {
            title: 'Pull Request',
            route: '/developers-guide/contributing/pull-request'
          },
          {
            title: 'Recommended IDE settings (Code)',
            route: '/developers-guide/contributing/recommended-ide-settings-code'
          },
          {
            title: 'Code style guide',
            route: '/developers-guide/contributing/code-style-guide'
          },
          {
            title: 'Workflows',
            route: '/developers-guide/contributing/workflows'
          },
          {
            title: 'AI agents',
            route: '/developers-guide/contributing/ai-agents'
          }
        ]
      },
      {
        title: 'Backend',
        route: '/developers-guide/backend',
        children: [
          {
            title: 'Strapi',
            route: '/developers-guide/backend/intro'
          },
          {
            title: 'Customized behaviour',
            route: '/developers-guide/backend/customized-behaviour'
          },
          {
            title: 'Plugins',
            route: '/developers-guide/backend/plugins'
          },
          {
            title: 'OpenVAA admin tools plugin for Strapi',
            route: '/developers-guide/backend/openvaa-admin-tools-plugin-for-strapi'
          },
          {
            title: 'Default data loading',
            route: '/developers-guide/backend/default-data-loading'
          },
          {
            title: 'Mock data generation',
            route: '/developers-guide/backend/mock-data-generation'
          },
          {
            title: 'Authentication',
            route: '/developers-guide/backend/authentication'
          },
          {
            title: 'Security',
            route: '/developers-guide/backend/security'
          },
          {
            title: 'Preparing backend dependencies',
            route: '/developers-guide/backend/preparing-backend-dependencies'
          },
          {
            title: 'Running the backend separately',
            route: '/developers-guide/backend/running-the-backend-separately'
          },
          {
            title: 'Re-generating types',
            route: '/developers-guide/backend/re-generating-types'
          }
        ]
      },
      {
        title: 'Frontend',
        route: '/developers-guide/frontend',
        children: [
          {
            title: 'Frontend',
            route: '/developers-guide/frontend/intro'
          },
          {
            title: 'Components',
            route: '/developers-guide/frontend/components'
          },
          {
            title: 'Routing',
            route: '/developers-guide/frontend/routing'
          },
          {
            title: 'Accessing data and state management',
            route: '/developers-guide/frontend/accessing-data-and-state-management'
          },
          {
            title: 'Data API',
            route: '/developers-guide/frontend/data-api'
          },
          {
            title: 'Contexts',
            route: '/developers-guide/frontend/contexts'
          },
          {
            title: 'Environmental variables',
            route: '/developers-guide/frontend/environmental-variables'
          },
          {
            title: 'Styling',
            route: '/developers-guide/frontend/styling'
          },
          {
            title: 'Chatbot',
            route: '/developers-guide/frontend/chatbot'
          }
        ]
      },
      {
        title: 'Localization',
        route: '/developers-guide/localization',
        children: [
          {
            title: 'Localization',
            route: '/developers-guide/localization/intro'
          },
          {
            title: 'Local translations',
            route: '/developers-guide/localization/local-translations'
          },
          {
            title: 'Locale routes',
            route: '/developers-guide/localization/locale-routes'
          },
          {
            title: 'Locale selection step-by-step',
            route: '/developers-guide/localization/locale-selection-step-by-step'
          },
          {
            title: 'Localization in Strapi',
            route: '/developers-guide/localization/localization-in-strapi'
          },
          {
            title: 'Localization in the frontend',
            route: '/developers-guide/localization/localization-in-the-frontend'
          },
          {
            title: 'Storing multi-locale data',
            route: '/developers-guide/localization/storing-multi-locale-data'
          },
          {
            title: 'Supported locales',
            route: '/developers-guide/localization/supported-locales'
          }
        ]
      },
      {
        title: 'Candidate user management',
        route: '/developers-guide/candidate-user-management',
        children: [
          {
            title: 'Creating a New Candidate',
            route: '/developers-guide/candidate-user-management/creating-a-new-candidate'
          },
          {
            title: 'Mock Data',
            route: '/developers-guide/candidate-user-management/mock-data'
          },
          {
            title: 'Password Validation',
            route: '/developers-guide/candidate-user-management/password-validation'
          },
          {
            title: 'Registration Process in Strapi',
            route: '/developers-guide/candidate-user-management/registration-process-in-strapi'
          },
          {
            title: 'Resetting the Password',
            route: '/developers-guide/candidate-user-management/resetting-the-password'
          }
        ]
      },
      {
        title: 'LLM features',
        route: '/developers-guide/llm-features'
      },
      {
        title: 'Automatic Documentation Generation',
        route: '/developers-guide/auto-documentation'
      },
      {
        title: 'Troubleshooting',
        route: '/developers-guide/troubleshooting'
      }
    ]
  },
  {
    title: 'Publishers’ Guide',
    route: '/publishers-guide',
    fixedTitle: true,
    children: [
      {
        title: 'Introduction',
        route: '/publishers-guide/intro'
      },
      {
        title: 'What are VAAs?',
        route: '/publishers-guide/what-are-vaas',
        fixedTitle: true,
        children: [
          {
            title: 'What are VAAs and why are they useful?',
            route: '/publishers-guide/what-are-vaas/intro'
          },
          {
            title: 'Which kind of elections are VAAs used in?',
            route: '/publishers-guide/what-are-vaas/vaas-used'
          }
        ]
      },
      {
        title: 'How to use OpenVAA?',
        route: '/publishers-guide/publish-with-openvaa',
        fixedTitle: true
      },
      {
        title: 'Preparing for publishing a VAA',
        route: '/publishers-guide/preparing',
        fixedTitle: true,
        children: [
          {
            title: 'Designing a VAA',
            route: '/publishers-guide/preparing/intro'
          },
          {
            title: 'Timeline',
            route: '/publishers-guide/preparing/timeline'
          },
          {
            title: 'Who is the target group of the VAA?',
            route: '/publishers-guide/preparing/who-is-the-target-group'
          },
          {
            title: 'Which languages will the VAA be published in?',
            route: '/publishers-guide/preparing/languages-will-the-vaa-be'
          },
          {
            title: 'What are the specifics of the elections?',
            route: '/publishers-guide/preparing/the-specifics-of-the-elections'
          },
          {
            title: 'How should candidates’ and parties’ data be collected?',
            route: '/publishers-guide/preparing/candidates-and-parties-data-be'
          },
          {
            title: 'What are the statements or questions posed?',
            route: '/publishers-guide/preparing/the-statements-or-questions-posed'
          },
          {
            title: 'What other information is collected from candidates and parties?',
            route: '/publishers-guide/preparing/what-other-information-is-collected'
          },
          {
            title: 'How should the recommendations be computed?',
            route: '/publishers-guide/preparing/matching'
          },
          {
            title: 'What should the voter see when using the VAA?',
            route: '/publishers-guide/preparing/the-voter-see-when-using'
          },
          {
            title: 'What should the VAA look and feel like?',
            route: '/publishers-guide/preparing/the-vaa-look-and-feel'
          },
          {
            title: 'How should the application be hosted?',
            route: '/publishers-guide/preparing/the-application-be-hosted'
          },
          {
            title: 'What data should be collected from voters’ use of the VAA?',
            route: '/publishers-guide/preparing/what-data-should-be-collected'
          },
          {
            title: 'Do you want to ask voters to give feedback about the VAA?',
            route: '/publishers-guide/preparing/to-ask-voters-to-give'
          },
          {
            title: 'Do you want to offer a survey for voters to fill?',
            route: '/publishers-guide/preparing/to-offer-a-survey-for'
          }
        ]
      },
      {
        title: 'Data collection',
        route: '/publishers-guide/data-collection',
        children: [
          {
            title: 'Steps for collecting data',
            route: '/publishers-guide/data-collection/intro'
          },
          {
            title: 'Initial data',
            route: '/publishers-guide/data-collection/initial-data'
          },
          {
            title: 'Candidates’ or parties answers',
            route: '/publishers-guide/data-collection/candidates-or-parties-answers'
          },
          {
            title: 'Additional data for the voter application',
            route: '/publishers-guide/data-collection/additional-data-for-the-voter'
          },
          {
            title: 'Data from final election lists',
            route: '/publishers-guide/data-collection/data-from-final-election-lists'
          },
          {
            title: 'Moderation of candidate answers',
            route: '/publishers-guide/data-collection/moderation-of-candidate-answers'
          }
        ]
      },
      {
        title: 'After publishing',
        route: '/publishers-guide/after-publishing-the-vaa',
        fixedTitle: true,
        children: [
          {
            title: 'After publishing the VAA',
            route: '/publishers-guide/after-publishing-the-vaa/intro'
          },
          {
            title: 'User support',
            route: '/publishers-guide/after-publishing-the-vaa/user-support'
          },
          {
            title: 'Marketing',
            route: '/publishers-guide/after-publishing-the-vaa/marketing'
          }
        ]
      },
      {
        title: 'Application settings and features',
        route: '/publishers-guide/app-settings'
      },
      {
        title: 'Other information sources',
        route: '/publishers-guide/other-information-sources'
      }
    ]
  }
];
