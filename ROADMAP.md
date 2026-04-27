# Roadmap to `v0.2 Akita`

This a rough sketch which is defined more fully in `.planning` when moving forward.

## E2E testing framework and coverage

Rewrite the current E2E (in tests) tests to follow an extensible, modular paradigm:

1. use testids for finding elements instead of texts
2. enable using a pre-defined dataset
3. reset db state after tests so that re-running them will work
4. enable testing with different options
5. use user stories as a base on which actual tests are created
6. test both the candidate app (some pre-existing test are defined) and the voter app

Create helper utilities for common tasks, so that these are easy to replace when the app changes.

For 2 and 3, we can use the Supabase admin client to import and delete test data.

For 4, we can change the dynamicSettings.ts file and rebuild the web app, or update app_settings in the database. In dev mode, changes are automatically reflected.

For 5–6, first write user stories for the candidate app based on the current e2e tests. Then mine the documentation in /docs for user stories for the voter app, with regard to how different settings are supposed to function.

Regarding certain features, such as one vs. multiple elections, we should have multiple test datasets to facilitate these. These can be created separatetly once the logic and needs are clear.

## Build skills for Claude

Mine the /docs/src/routes and /packages/\*/README.md contents for information and build the following skills for Claude.

Use the /skill-creator skill for building the skills.

### openvaa-architect

The architect will know the different packages and how the frontend architecture, including data loading and contexts work.
It will know about the api routes, candidate, voter and (preliminary) admin apps.
It will know about the Supabase backend (schema, Edge Functions, auth).
It will know about /packages/app-shared and /packages/core and /packages/shared-config

Figure out if we need different skills for:

- contexts: frontend/src/lib/contexts
- data api: frontend/src/lib/api + frontend/src/lib/server/api
- settings: packages/app-shared/src/settings

### openvaa-components-expert

It will know about static and dynamic components, their documentation, organization, conventions, what are available etc.

It will connect to the other experts for certain components:

- if they use the data model => openvaa-data-expert
- if they use matching => openvaa-matching-expert
- if they use filters => openvaa-filters-expert

### openvaa-data-expert

It will know how the data model /packages/data works

### openvaa-matching-expert

It will know how the matching algorithm in /packages/matching works

### openvaa-filters-expert

It will know how the filters in /packages/filters works

### openvaa-llm-expert

It will know how the experimental llm packages work:
/packages/llm
/packages/argument-condensation
/packages/question-info

## Refresh monorepo structure

### Plan a workflow for version management

Everything is currently v0.1.0 but we want to start bumping them.
How to handle packages versioning? Should they always have the same v as the main app even when they haven't changed?

### Confirm the the current package organization is smart

Check for recommended patterns.
Check if the repo should use turborepo or some other manager or if yarn is still valid.
(Bear in mind that we might switch to Deno later.)

## Migrate from Svelte 4 to Svelte 5

Leverage automatic updating as much as possible.
Check all issues and in-code TODOs tagged with Svelte 5.
At the time update:

### Tailwind to latest

Change current definitions to use css variables.
Check how we could enable setting theme colors and fonts from the frontend by editing settings stored in the db.
These are currently in staticSettings but they ought to be dynamic.

### Daisy UI to latest

### i18n

We probably need to rewrite the i18n logic.
Optimally all translations could then be moved to their package and consumed by any other part of the repo.

### e2e tests

Check if the current test logic needs to be rewritten.

## Investigate moving from Node to Deno

Check support and possible pitfalls for other users of the repo.

## Migrate admin functions to the frontend Admin App

All basic admin functions should be moved to the Admin App but some direct db editing can be left as links to the Supabase dashboard.
If there are some ready-made components for embedding editable Supabase tables in the Svelte app, it would be great.
