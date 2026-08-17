# App and repo structure

The project is a monorepo and it consists of several yarn workspaces (each is a separate NPM module). See the READMEs in each for more information.

- Abstract logic
  - [`@openvaa/core`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/core/)
  - [`@openvaa/data`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/data/)
  - [`@openvaa/filters`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/filters/)
  - [`@openvaa/matching`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/matching/)
- Application
  - [`@openvaa/app-shared`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/)
  - [`@openvaa/strapi`](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/)
  - [`@openvaa/strapi-admin-tools`](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/src/plugins/openvaa-admin-tools/)
  - [`@openvaa/frontend`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/)
- Experimental LLM features
  - [`@openvaa/argument-condensation`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/argument-condensation/)
  - [`@openvaa/llm`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/llm/)
  - [`@openvaa/question-info`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/question-info/)
- Development
  - [`@openvaa/shared-config`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/shared-config/)
- Documentation (this site)
  - [`@openvaa/docs`](https://github.com/OpenVAA/voting-advice-application/blob/main/docs/)
