# VAA Strapi Backend

## Preparing backend dependencies

Backend module depends on `@openvaa/app-shared` and you need to build it prior to using `@openvaa/strapi` directly (no need if you use it via Docker):

```bash
yarn workspace @openvaa/app-shared install
yarn workspace @openvaa/app-shared build
```

Backend module contains `strapi-plugin-import-export-entries` directory which is a separate git repository. In order to initialise it you need to run:

```bash
git submodule update --init --recursive
```

To build the submodule in `strapi-plugin-import-export-entries` directory run:

```bash
yarn install
yarn build
```

## Running the backend separately

0. You should be running Strapi with Node version 18.20.4. Use of nvm is encouraged. **Additionally, you need Docker!**
1. Install dependencies by running `yarn install`.
2. Copy or rename the `.env.example` to `.env` before running any of the commands.
3. Run `docker compose -f docker-compose.dev.yml up postgres` to start Postgres container.
4. Run `yarn dev` or `yarn start` to run the Strapi server directly.

## Re-generating Types

Run `yarn strapi ts:generate-types` to re-generate `types` folder.

## Mock data

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
