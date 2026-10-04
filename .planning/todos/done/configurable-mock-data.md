---
title: Configurable mock data generation for Supabase
priority: medium
source: Manual testing discussion (2026-03-23)
---

Implement configurable mock data generation for Supabase, similar to the old `GENERATE_MOCK_DATA_ON_INITIALISE` model from Strapi. Should support generating realistic fake candidates, questions, elections, etc. for development and demo purposes. Separate from E2E test data — this is for human-facing dev/demo environments.

## Resolution

**Closed 2026-10-02 as satisfied, by Phase 168 plan 168-08 (D-18).** `@openvaa/dev-seed` provides configurable mock data for local
development and demo environments, separate from the E2E data. 168-03 found this (finding F9 in
`.planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-03-CLAIMS.md`), with these anchors:

- `package.json`: `"db:seed": "yarn workspace @openvaa/dev-seed seed"`. The command takes `--template <name|path>`, `--seed <int>` and
  `--external-id-prefix <str>`.
- `package.json`: `"db:reset-with-data": "yarn db:reset && yarn db:seed:default"`, and `"db:seed:default": "yarn db:seed --template default"`.
- `packages/dev-seed/src/templates/index.ts`: `export const BUILT_IN_TEMPLATES: Record<string, Template> = {`. These are the built-in
  templates, including `default` and the E2E ones. Custom templates load from a file path.
- Teardown: `yarn db:seed:teardown`.

It is documented on the new Seed data page (`/developers-guide/development/seed-data`, commit `70ddd6a7a`). The D-11 run on
2026-10-02 applied `yarn db:seed --template default` against the local stack (exit 0; 752 rows, 327 candidates, 327 portraits;
`gate-evidence/168-08-d11-runs.md`).

**Closed rather than narrowed.** The one part of the old Strapi model not reproduced is seeding *automatically on initialise*
(`GENERATE_MOCK_DATA_ON_INITIALISE`). Seeding is now one explicit command (`yarn db:reset-with-data` or `yarn dev:reset-with-data`). This
todo never asked for automatic seeding as such; it asked for configurable generation "similar to" the old model. So the planner closed
it under D-18 rather than leave a narrowed remainder open. Reopen as a new todo if seeding on initialise is wanted.

**Known limitation (168-03 F8, recorded here so it is not dropped).** dev-seed creates no auth users (there is no `auth.admin` /
`createUser` under `packages/dev-seed/src`), so none of the generated candidates can sign in. The only sign-in users locally are the
two that `apps/supabase/supabase/seed.sql` creates (`'candidate@openvaa.test',` and the admin). This is an observation, not a defect.
