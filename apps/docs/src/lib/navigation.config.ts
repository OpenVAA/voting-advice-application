/**
 * Automatically updated navigation configuration Check and prepare update with scripts/generate-navigation-config.ts To mark fix sections titles, set `fixedTitle: true` for them, otherwise the titles are updated automatically.
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
        title: 'Architecture',
        route: '/developers-guide/architecture'
      },
      {
        title: 'Development',
        route: '/developers-guide/development',
        children: [
          {
            title: 'Requirements',
            route: '/developers-guide/development/requirements'
          },
          {
            title: 'Running the development environment',
            route: '/developers-guide/development/running-the-development-environment'
          },
          {
            title: 'Monorepo and Turborepo',
            route: '/developers-guide/development/monorepo'
          },
          {
            title: 'Seed data (dev-seed)',
            route: '/developers-guide/development/seed-data'
          },
          {
            title: 'Testing',
            route: '/developers-guide/development/testing'
          }
        ]
      },
      {
        title: 'Configuration',
        route: '/developers-guide/configuration',
        children: [
          {
            title: 'Overview',
            route: '/developers-guide/configuration/intro',
            fixedTitle: true
          },
          {
            title: 'Environment variables',
            route: '/developers-guide/configuration/environmental-variables'
          },
          {
            title: 'Static settings',
            route: '/developers-guide/configuration/static-settings'
          },
          {
            title: 'App settings',
            route: '/developers-guide/configuration/app-settings'
          },
          {
            title: 'App customization',
            route: '/developers-guide/configuration/app-customization'
          }
        ]
      },
      {
        title: 'Backend (Supabase)',
        route: '/developers-guide/backend',
        fixedTitle: true,
        children: [
          {
            title: 'Overview',
            route: '/developers-guide/backend/intro',
            fixedTitle: true
          },
          {
            title: 'Authentication and authorisation',
            route: '/developers-guide/backend/authentication'
          },
          {
            title: 'Edge Functions',
            route: '/developers-guide/backend/edge-functions'
          },
          {
            title: 'Email',
            route: '/developers-guide/backend/email'
          },
          {
            title: 'Data import and deletion',
            route: '/developers-guide/backend/data-import-and-deletion'
          },
          {
            title: 'Generated types',
            route: '/developers-guide/backend/generated-types'
          }
        ]
      },
      {
        title: 'Frontend',
        route: '/developers-guide/frontend',
        children: [
          {
            title: 'Overview',
            route: '/developers-guide/frontend/intro',
            fixedTitle: true
          },
          {
            title: 'Routing',
            route: '/developers-guide/frontend/routing'
          },
          {
            title: 'Contexts',
            route: '/developers-guide/frontend/contexts'
          },
          {
            title: 'Data API and adapters',
            route: '/developers-guide/frontend/data-api-and-adapters'
          },
          {
            title: 'Components',
            route: '/developers-guide/frontend/components'
          },
          {
            title: 'Styling',
            route: '/developers-guide/frontend/styling'
          }
        ]
      },
      {
        title: 'Localization',
        route: '/developers-guide/localization',
        children: [
          {
            title: 'Overview',
            route: '/developers-guide/localization/intro',
            fixedTitle: true
          },
          {
            title: 'Supported locales',
            route: '/developers-guide/localization/supported-locales'
          },
          {
            title: 'Locale resolution',
            route: '/developers-guide/localization/locale-resolution'
          },
          {
            title: 'Translations and overrides',
            route: '/developers-guide/localization/translations-and-overrides'
          },
          {
            title: 'Multi-locale data',
            route: '/developers-guide/localization/storing-multi-locale-data'
          }
        ]
      },
      {
        title: 'Candidate app',
        route: '/developers-guide/candidate-app',
        fixedTitle: true,
        children: [
          {
            title: 'Pre-registration and invitation',
            route: '/developers-guide/candidate-app/pre-registration-and-invitation'
          },
          {
            title: 'Registration',
            route: '/developers-guide/candidate-app/registration'
          },
          {
            title: 'Login and password reset',
            route: '/developers-guide/candidate-app/login-and-password-reset'
          },
          {
            title: 'Bank authentication (OIDC)',
            route: '/developers-guide/candidate-app/bank-authentication'
          },
          {
            title: 'Password validation',
            route: '/developers-guide/candidate-app/password-validation'
          }
        ]
      },
      {
        title: 'Admin app',
        route: '/developers-guide/admin-app'
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
        title: 'Troubleshooting',
        route: '/developers-guide/troubleshooting'
      },
      {
        title: 'About these docs',
        route: '/developers-guide/about-these-docs'
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
