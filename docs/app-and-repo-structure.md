# App and repo structure

The project is a monorepo and it consists of several yarn workspaces (each is a separate NPM module). See the READMEs in each for more information.

- Abstract logic
  - [`@openvaa/core`](/packages/core/)
  - [`@openvaa/data`](/packages/data/)
  - [`@openvaa/filters`](/packages/filters/)
  - [`@openvaa/matching`](/packages/matching/)
- Application
  - [`@openvaa/app-shared`](/packages/app-shared/)
  - [`@openvaa/strapi`](/backend/vaa-strapi/)
  - [`@openvaa/strapi-admin-tools`](/backend/vaa-strapi/src/plugins/openvaa-admin-tools/)
  - [`@openvaa/frontend`](/frontend/)
- Experimental LLM features
  - [`@openvaa/argument-condensation`](/packages/argument-condensation/)
  - [`@openvaa/llm`](/packages/llm/)
  - [`@openvaa/question-info`](/packages/question-info/)
- Development
  - [`@openvaa/shared-config`](/packages/shared-config/)
