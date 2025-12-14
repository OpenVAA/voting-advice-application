# Developer Guide

Instructions for developers and contributors.

## Table of Contents

- [Quick start](quick-start.md) - Get up and running quickly with Docker
- [App and repo structure](app-and-repo-structure.md) - Overview of the monorepo structure
- [Development](development.md) - Development environment setup and workflows
- [Testing](testing.md) - Unit and E2E testing
- [Deployment](deployment.md) - Deploying the application to production
- [Contributing](contributing.md) - Guidelines for contributing to the project
- [Backend](backend.md) - Backend (Strapi) documentation
- [Frontend](frontend.md) - Frontend (SvelteKit) documentation
- [Localization](localization.md) - Internationalization and localization
- [App Settings](app-settings.md) - Application configuration
- [App Customization](app-customization.md) - Customizing the application
- [Candidate User Management](candidate-user-management.md) - Managing candidate users
- [LLM features](llm-features.md) - Experimental LLM features
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
- [Code Review Checklist](code-review-checklist.md) - Checklist for code reviews
- [Auto Documentation](auto-documentation.md) - Automatic documentation generation system

## Full Table of Contents

### [Quick start](quick-start.md)

(No subsections)

### [App and repo structure](app-and-repo-structure.md)

(No subsections)

### [Development](development.md)

- [Requirements](development.md#requirements)
- [Running the Development Environment](development.md#running-the-development-environment)
  - [Hot Reloading the Backend](development.md#hot-reloading-the-backend)
- [Monorepo](development.md#monorepo)
  - [Module resolution](development.md#module-resolution)
- [Roadmap](development.md#roadmap)

### [Testing](testing.md)

- [Unit tests](testing.md#unit-tests)
- [E2E tests](testing.md#e2e-tests)

### [Deployment](deployment.md)

- [Costs](deployment.md#costs)
- [Setup with Render and AWS](deployment.md#setup-with-render-and-aws)
  - [1. Fork](deployment.md#1-fork)
  - [2. Configure AWS](deployment.md#2-configure-aws)
  - [3. Create Render project](deployment.md#3-create-render-project)
  - [4. Create Postgres database](deployment.md#4-create-postgres-database)
  - [5. Create the Backend web service](deployment.md#5-create-the-backend-web-service)
  - [6. Create the Frontend web service](deployment.md#6-create-the-frontend-web-service)
  - [7. Create a Strapi Admin](deployment.md#7-create-a-strapi-admin)
  - [8. Fill in further `env` variables](deployment.md#8-fill-in-further-env-variables)
  - [9. Use your own domain name for the frontend](deployment.md#9-use-your-own-domain-name-for-the-frontend)
- [Manually Creating a Production Build](deployment.md#manually-creating-a-production-build)
  - [Build from Dockerimage](deployment.md#build-from-dockerimage)
  - [Building the frontend separately](deployment.md#building-the-frontend-separately)
  - [Building the backend separately](deployment.md#building-the-backend-separately)

### [Contributing](contributing.md)

- [Recommended IDE settings (Code)](contributing.md#recommended-ide-settings-code)
- [AI agents](contributing.md#ai-agents)
- [Issues](contributing.md#issues)
  - [Create a new issue](contributing.md#create-a-new-issue)
  - [Search for an issue](contributing.md#search-for-an-issue)
  - [Issue labels](contributing.md#issue-labels)
- [Contribute](contributing.md#contribute)
  - [Commit your update](contributing.md#commit-your-update)
- [Workflows](contributing.md#workflows)
- [Pull Request](contributing.md#pull-request)
- [Your PR is ready to be merged!](contributing.md#your-pr-is-ready-to-be-merged)
- [Self-review](contributing.md#self-review)
- [Code style guide](contributing.md#code-style-guide)
  - [Principles](contributing.md#principles)
  - [Comments](contributing.md#comments)
  - [TypeScript](contributing.md#typescript)
  - [CSS](contributing.md#css)
  - [Svelte components](contributing.md#svelte-components)

### [Backend](backend.md)

- [Preparing backend dependencies](backend.md#preparing-backend-dependencies)
- [Plugins](backend.md#plugins)
- [Running the backend separately](backend.md#running-the-backend-separately)
- [Re-generating types](backend.md#re-generating-types)
- [Customized behaviour](backend.md#customized-behaviour)
- [Default data loading](backend.md#default-data-loading)
- [Mock data generation](backend.md#mock-data-generation)
  - [Mock users](backend.md#mock-users)
- [Authentication](backend.md#authentication)
  - [Adding new content types](backend.md#adding-new-content-types)
- [Security](backend.md#security)
  - [filter-by-candidate](backend.md#filter-by-candidate)
  - [owned-by-candidate](backend.md#owned-by-candidate)
  - [restrictPopulate](backend.md#restrictpopulate)
  - [restrictFilters](backend.md#restrictfilters)
  - [restrictFields](backend.md#restrictfields)
  - [restrictBody](backend.md#restrictbody)
  - [restrictResourceOwnedByCandidate](backend.md#restrictresourceownedbycandidate)
  - [Preset](backend.md#preset)
- [OpenVAA admin tools plugin for Strapi](backend.md#openvaa-admin-tools-plugin-for-strapi)
  - [Status: preliminary](backend.md#status-preliminary)
  - [Installation](backend.md#installation)
  - [Developing](backend.md#developing)
  - [Usage](backend.md#usage)
  - [Functions](backend.md#functions)
  - [Access control](backend.md#access-control)

### [Frontend](frontend.md)

- [Components](frontend.md#components)
  - [Dynamic and static components](frontend.md#dynamic-and-static-components)
- [Contexts](frontend.md#contexts)
  - [Contexts vs global stores](frontend.md#contexts-vs-global-stores)
  - [Example of Context Use](frontend.md#example-of-context-use)
- [Accessing data and state management](frontend.md#accessing-data-and-state-management)
  - [Example: loading cascade for the `/(voter)/(located)/questions` route](frontend.md#example-loading-cascade-for-the--voter-located-questions-route)
- [Data API](frontend.md#data-api)
  - [Cache](frontend.md#cache)
  - [Folder structure](frontend.md#folder-structure)
  - [Classes and interfaces](frontend.md#classes-and-interfaces)
- [Environmental variables](frontend.md#environmental-variables)
- [Routing](frontend.md#routing)
  - [Building routes](frontend.md#building-routes)
- [Styling](frontend.md#styling)
  - [Tailwind classes](frontend.md#tailwind-classes)
  - [Colors](frontend.md#colors)
  - [Z-index](frontend.md#z-index)
  - [Default styling](frontend.md#default-styling)
- [Setting up the application for local development using Docker](frontend.md#setting-up-the-application-for-local-development-using-docker)

### [Localization](localization.md)

- [Localization in the frontend](localization.md#localization-in-the-frontend)
  - [Value interpolation](localization.md#value-interpolation)
  - [Localized default values in components](localization.md#localized-default-values-in-components)
  - [Localized texts included in dynamically loaded data](localization.md#localized-texts-included-in-dynamically-loaded-data)
- [Storing multi-locale data](localization.md#storing-multi-locale-data)
- [Localization in Strapi](localization.md#localization-in-strapi)
- [Local translations](localization.md#local-translations)
  - [The `TranslationKey` type](localization.md#the-translationkey-type)
- [Locale routes](localization.md#locale-routes)
  - [The `getRoute` helper](localization.md#the-getroute-helper)
- [Locale selection step-by-step](localization.md#locale-selection-step-by-step)
- [Supported locales](localization.md#supported-locales)
  - [Adding new locales](localization.md#adding-new-locales)

### [App Settings](app-settings.md)

- [Adding New Settings](app-settings.md#adding-new-settings)

### [App Customization](app-customization.md)

- [Adding New Customization Options](app-customization.md#adding-new-customization-options)

### [Candidate User Management](candidate-user-management.md)

- [Mock Data](candidate-user-management.md#mock-data)
- [Creating a New Candidate](candidate-user-management.md#creating-a-new-candidate)
  - [Using Registration Key](candidate-user-management.md#using-registration-key)
  - [Manually](candidate-user-management.md#manually)
  - [Pre-Registration](candidate-user-management.md#pre-registration)
- [Resetting the Password](candidate-user-management.md#resetting-the-password)
- [Registration Process in Strapi](candidate-user-management.md#registration-process-in-strapi)
  - [Email Templates](candidate-user-management.md#email-templates)
  - [Templates](candidate-user-management.md#templates)
- [Password Validation](candidate-user-management.md#password-validation)
  - [Frontend](candidate-user-management.md#frontend)
  - [Backend](candidate-user-management.md#backend)
  - [Password requirements](candidate-user-management.md#password-requirements)

### [LLM features](llm-features.md)

(No subsections)

### [Troubleshooting](troubleshooting.md)

- [Commit error: 'Husky not found'](troubleshooting.md#commit-error-husky-not-found)
- [Commit error: 'TypeError: Cannot read properties of undefined (reading 'font')' error when running `/generateTranslationKeyType.ts`](troubleshooting.md#commit-error-typeerror-cannot-read-properties-of-undefined-reading-font-error-when-running--generatetranslationkeytypets)
- [Docker error related to `frozen lockfile` when running `yarn dev`](troubleshooting.md#docker-error-related-to-frozen-lockfile-when-running-yarn-dev)
- [Docker error: Load metadata for docker.io/library/node:foo](troubleshooting.md#docker-error-load-metadata-for-dockerio-library-nodefoo)
- [Docker error: 'No space left on device' error](troubleshooting.md#docker-error-no-space-left-on-device-error)
- [Docker error: Service "foo" can't be used with `extends` as it declare `depends_on`](troubleshooting.md#docker-error-service-foo-cant-be-used-with-extends-as-it-declare-dependson)
- [Frontend: Candidate registration fails with 'Bad Request' error](troubleshooting.md#frontend-candidate-registration-fails-with-bad-request-error)
- [Frontend: Changes to the content in Strapi not updated in the frontend](troubleshooting.md#frontend-changes-to-the-content-in-strapi-not-updated-in-the-frontend)
- [Frontend: Server error when trying to access frontend](troubleshooting.md#frontend-server-error-when-trying-to-access-frontend)
- [Frontend: Strapi relations are not populated](troubleshooting.md#frontend-strapi-relations-are-not-populated)
- [Playwright: `TimeoutError` when locating elements and running the tests locally](troubleshooting.md#playwright-timeouterror-when-locating-elements-and-running-the-tests-locally)
- [Strapi: Content model is reset after restart](troubleshooting.md#strapi-content-model-is-reset-after-restart)
- [Strapi error: 'Relation already exists' error on restart after editing the content model](troubleshooting.md#strapi-error-relation-already-exists-error-on-restart-after-editing-the-content-model)

### [Code Review Checklist](code-review-checklist.md)

(No subsections)
