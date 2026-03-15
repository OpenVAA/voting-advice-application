# `@openvaa/strapi`: OpenVAA Strapi Backend

## Preparing backend dependencies

Backend module depends on `@openvaa/app-shared` and you need to build it prior to using `@openvaa/strapi` directly (no need if you use it via Docker):

```bash
yarn workspace @openvaa/app-shared install
yarn workspace @openvaa/app-shared build
```

## Plugins

- Email uses AWS SES, see [Candidate App documentation](/docs/candidate-app/candidates.md)
- Upload uses AWS S3, see [plugins.ts](config/plugins.ts)
- [OpenVAA Strapi Admin Tools plugin](src/plugins/openvaa-admin-tools/README.md) (local plugin)

## Running the backend separately

0. You should be running Strapi with the Node version specified under `engines` in the root [package.json](../../package.json). Use of nvm is encouraged. **Additionally, you need Docker!**
1. Install dependencies by running `yarn install`.
2. Copy or rename the `.env.example` to `.env` before running any of the commands.
3. Run `docker compose -f docker-compose.dev.yml up postgres` to start Postgres container.
4. Run `yarn dev` or `yarn start` to run the Strapi server directly.

## Re-generating types

Run `yarn strapi ts:generate-types` to re-generate `types` folder.

## Customized behaviour

The Strapi backend has been customized in many ways to cater to VAA needs. The current implementation is split between direct edits to Strapi code and some functions implemented in the [OpenVAA Admin Tools plugin](src/plugins/openvaa-admin-tools/README.md). Most of the customizations should be migrated to the plugin in the future.

### Default data loading

Some data is automatically loaded when Strapi is initialized. The data include:

- [Question Types](src/functions/loadDefaultData.ts)
- [App Settings](src/functions/loadDefaultAppSettings.ts)
- [Translation overrides](src/functions/loadDynamicTranslations.ts) (under the `dynamic` key)

API permissions are also set by defaul by [setDefaultApiPermissions.ts](src/functions/setDefaultApiPermissions.ts).

> Note that some of the defaults are **not** loaded if mock data generations is enabled.

### Mock data generation

**NOTE: This feature must only be used for local development and testing (not on production).**

The backend DB can be seeded with generated mock data using Faker.js. The data contains example profiles for candidates, parties, questions, elections and is useful for demostration, development and testing purposes.

Mock data can be seeded only once on initialising the backend DB or on each restart of the Strapi backend service. This behaviour is controled by variables in `.env` file:

```bash
GENERATE_MOCK_DATA_ON_INITIALISE=true
GENERATE_MOCK_DATA_ON_RESTART=false
```

To enable mock data generation, set the `GENERATE_MOCK_DATA_ON_INITIALISE` variable as true. This will create mock data if the database is empty or give a warning if database is not empty and thus mock data could not be generated.

You can also set `GENERATE_MOCK_DATA_ON_RESTART` as true. This will generate new mock data every time the Strapi instance is restarted.

**Please keep in mind that setting this variable as true will clear the database contents of existing candidates, parties, elections, and so on and should only be used for debugging purposes.**
Setting `GENERATE_MOCK_DATA_ON_RESTART` as true will override `GENERATE_MOCK_DATA_ON_INITIALISE` setting.

**Note: you need to modify these variables in the relevant `.env` file (located either in the project's root directory or in `backend/vaa-strapi`) depending on how you choose to run the backend service locally.**

### Authentication

Standard read calls require no authentication and are included in the default permissions, which are customized in the [Users’ permissions plugin](./src/extensions/users-permissions/strapi-server.ts).

Furthermore, all API routes are configured

Write calls require authentication:

- For registered Candidates, this is handled by creating a user. Read more in the [Candidate App documentation](/docs/candidate-app/candidates.md).
- For pre-registration, an API token with the `users-permissions.candidate.preregister` priviledge is required, which must be saved in the `BACKEND_API_TOKEN` env variable. Read more on creating the token in the [Strapi documenation](https://docs.strapi.io/user-docs/settings/API-tokens#creating-a-new-api-token).

#### Adding new content types

If you add new content types that should be accessible, make sure:

1. Edit the `CONTENT_API` list in [api.ts](src/util/api.ts) to grant read rights to the public
2. Add the permission in the [Users’ permissions plugin](./src/extensions/users-permissions/strapi-server.ts) so that registered users are granted access sa well
3. Also make sure that the route config includes the default restrictions:

```ts
// /src/api/<COLLECTION>/routes/<COLLECTION>.ts
export default factories.createCoreRouter('api::<COLLECTION>.<COLLECTION>', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: ['global::restrict-populate']
    },
    findOne: {
      policies: ['global::restrict-populate']
    }
  }
});
```

#### Global policies

See the policies defined in [src/policies/](src/policies) for global access control policies available.

---

## Official documentation from Strapi

Strapi comes with a fully featured [Command Line Interface](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html) (CLI) which lets you scaffold and manage your project in seconds.

### Development

Start your Strapi application with auto-reload enabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-develop)

```
yarn dev
```

### Start

Start your Strapi application with auto-reload disabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-start)

```
yarn start
```

### Build

Build your admin panel. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-build)

```
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project. Find the one that suits you in the [deployment section of the documentation](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/deployment.html).

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://docs.strapi.io) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!
