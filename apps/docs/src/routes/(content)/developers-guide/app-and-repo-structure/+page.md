# App and repo structure

The project is a monorepo and it consists of several yarn workspaces (each is a separate NPM module). See the READMEs in each for more information.

- Abstract logic
  - [`@openvaa/core`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/core/)
  - [`@openvaa/data`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/data/)
  - [`@openvaa/filters`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/filters/)
  - [`@openvaa/matching`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/matching/)
- Application
  - [`@openvaa/app-shared`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/)
  - [`@openvaa/frontend`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/)
  - [`@openvaa/supabase`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/) — the backend: schema, migrations, RLS policies, Edge Functions and pgTAP tests
- Experimental LLM features
  - [`@openvaa/argument-condensation`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/argument-condensation/)
  - [`@openvaa/llm`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/llm/)
  - [`@openvaa/question-info`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/question-info/)
- Development
  - [`@openvaa/dev-seed`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/dev-seed/) — deterministic local and E2E seed data
  - [`@openvaa/dev-tools`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/dev-tools/) — maintainer CLIs
  - [`@openvaa/shared-config`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/shared-config/)
  - [`@openvaa/supabase-types`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/supabase-types/) — TypeScript types generated from the database schema
- Documentation (this site)
  - [`@openvaa/docs`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/docs/)
