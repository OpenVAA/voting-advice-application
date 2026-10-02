# Architecture

OpenVAA is a monorepo of Yarn workspaces: every directory under `packages/` and `apps/` is a separate npm package with its own `package.json` and README. [Turborepo](/developers-guide/development/monorepo) runs the build, lint, type-check and unit-test tasks across them.

## Workspaces

- Core logic
  - [`@openvaa/core`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/core) — core types, interfaces and utilities
  - [`@openvaa/data`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/data) — the data model for elections, candidates, questions and answers
  - [`@openvaa/matching`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/matching) — matching algorithms with several distance metrics
  - [`@openvaa/filters`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/filters) — filtering entities by their properties and answers
- Application
  - [`@openvaa/app-shared`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/app-shared) — settings and utilities shared by the frontend and the dev tooling
  - [`@openvaa/frontend`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend) — the SvelteKit app: the voter app, the [Candidate app](/developers-guide/candidate-app/pre-registration-and-invitation) and the [Admin app](/developers-guide/admin-app)
  - [`@openvaa/supabase`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/supabase) — the [backend](/developers-guide/backend/intro): schema, migrations, row-level security policies, Edge Functions and pgTAP tests
- LLM features, used by the Admin app
  - [`@openvaa/llm`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/llm)
  - [`@openvaa/argument-condensation`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/argument-condensation)
  - [`@openvaa/question-info`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/question-info)
- Development
  - [`@openvaa/dev-seed`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/dev-seed) — template-driven seed data for local development and E2E tests (see [Seed data](/developers-guide/development/seed-data))
  - [`@openvaa/dev-tools`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/dev-tools) — maintainer tooling (key generation, JWKS utilities)
  - [`@openvaa/shared-config`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/shared-config) — shared ESLint, TypeScript and build configuration
  - [`@openvaa/supabase-types`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/supabase-types) — TypeScript types generated from the database schema (see [Generated types](/developers-guide/backend/generated-types))
- Documentation
  - [`@openvaa/docs`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/docs) — this site

## How the packages depend on each other

The core logic packages form a chain. Each arrow points from a package to the packages that build on it:

`@openvaa/core` → `@openvaa/data`, `@openvaa/matching`, `@openvaa/filters` → `@openvaa/app-shared` → `@openvaa/frontend`

In detail:

- `@openvaa/core` depends on no other workspace.
- `@openvaa/data` and `@openvaa/matching` depend on `@openvaa/core`; `@openvaa/filters` depends on `@openvaa/core` and `@openvaa/data`.
- `@openvaa/app-shared` depends on `@openvaa/data`.
- `@openvaa/llm` depends on `@openvaa/core` and `@openvaa/app-shared`; `@openvaa/question-info` and `@openvaa/argument-condensation` build on `@openvaa/llm`.
- `@openvaa/frontend` depends on all of the above and on `@openvaa/supabase-types`.
- `@openvaa/dev-seed` depends on `@openvaa/core`, `@openvaa/matching`, `@openvaa/app-shared` and `@openvaa/supabase-types`.
- The backend, `@openvaa/supabase`, depends on no other workspace. Its schema reaches TypeScript through `@openvaa/supabase-types`, which `yarn db:types` regenerates from the local database.

## Data flow

The frontend talks to Supabase directly, through `@supabase/supabase-js`. There is no application server between the app and the database API.

- **Reads.** A route calls `createDataProvider` and names where its Supabase client comes from: the request's own cookie-bearing client on the server, a client the caller already holds, or the browser tab's single client. The provider queries the database API with that client, so the caller's session and the database's row-level security decide what it can see. Queries on project-scoped tables are also limited to the project in `PUBLIC_PROJECT_ID`.
- **Writes.** `createDataWriter`, `createAdminWriter` and `createFeedbackWriter` return the writers, built the same way, from the same three client sources.
- **Edge Functions.** Steps that need privileges the browser must not have, such as bank-authentication callbacks, candidate invitations and email, run as [Edge Functions](/developers-guide/backend/edge-functions) inside Supabase.

`createDataProvider` always returns the Supabase data provider. The tree also holds a `local` server adapter, which reads JSON files from `LOCAL_DATA_DIR` and serves them through the `/api/data/[collection]` route, and an `apiRoute` adapter for reading that route. The server adapter is loaded only when `dataAdapter.type` in the [static settings](/developers-guide/configuration/static-settings) is `local`; it is `supabase`. [Data API and adapters](/developers-guide/frontend/data-api-and-adapters) describes the adapters in detail.
