# VAA Strapi Backend

## Running the backend separately

0. You should be running Strapi with Node version 16.18.0. Use of nvm is encouraged. **Additionally, you need Docker!**
1. Install dependencies by running `yarn install` or `npm install`
2. Copy or rename the `.env.example` to `.env` before running any of the commands. You should be able to run the Strapi
   instance with either `npm run start` or `npm run dev`.
3. Make sure to run `docker-compose up` to start the Postgres container.
4. Run `yarn dev` or `npm run dev` to run the Strapi server.

A base "Election" Content-Type has been created to play around initially. Please feel free to extend/change it or add
additional Content-Types.

## Updating content models

If the app is run inside Docker and you want to update content models inside Strapi, please make sure you have mounted Strapi as a volume in `docker-compose-dev.yml`.
This allows the content model JSON files to be synced with host OS and will show as changed in Git repository.

## Re-generating Types

Run `npm run strapi ts:generate-types` to re-generate `schemas.d.ts`.

## Mock data

The app allows for fake data to be generated to Strapi using Faker.js. Enabling mock data generation in the environment variables will generate mock data
to the database whenever the app is initialised or restarting.

Mock data contains example profiles for candidates, parties, questions an elections and is useful as an example of application usage as well as frontend development and testing backend capabilities.
Mock data gets published automatically and is thus always ready to be used without requiring any user input.

To enable mock data generation, set the `GENERATE_MOCK_DATA_ON_INITIALISE` variable as true. This will create mock data if the database is empty,
and give a warning if database is not empty and thus mock data could not be generated.

**Development builds only:**

You can optionally set `GENERATE_MOCK_DATA_ON_RESTART` to true. This will generate new mock data on every time the Strapi instance is restarted.
This feature is only enabled in development builds and is mostly intended to assist with development of mock data.
**Please keep in mind that setting this variable as true will clear the database contents of existing candidates, parties, elections, and so on and should only be used for debugging purposes.**
Setting `GENERATE_MOCK_DATA_ON_RESTART` as true will override `GENERATE_MOCK_DATA_ON_INITIALISE` setting.

**Note: if you're running the whole project in Docker, change these values in the `.env` file
in the project root, not in the `backend/vaa-strapi` folder.**

---

## Official documentation from Strapi

Strapi comes with a fully featured [Command Line Interface](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html) (CLI) which lets you scaffold and manage your project in seconds.

### Develop

Start your Strapi application with auto-reload enabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-develop)

```
npm run dev
# or
yarn dev
```

### Start

Start your Strapi application with auto-reload disabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-start)

```
npm run start
# or
yarn start
```

### Build

Build your admin panel. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-build)

```
npm run build
# or
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
