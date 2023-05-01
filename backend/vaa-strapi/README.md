# VAA Strapi Backend

0. You should be running Strapi with Node version 16.18.0. Use of nvm is encouraged. **Additionally, you need Docker!**
1. Install dependencies by running `npm install`
2. Copy or rename the `.env.example` to `.env` before running any of the commands. You should be able to run the Strapi instance with either `npm run start` or `npm run develop`.
3. Make sure to run `docker-compose up` to start the Postgres container.
4. Run `npm run develop` to run the Strapi server.

A base "Election" Content-Type has been created to play around initially. Please feel free to extend/change it or add additional
Content-Types.

## Re-generating Types

Run `npm run strapi ts:generate-types` to re-generate `schemas.d.ts`.

## Mock data

The app allows for fake data to be generated to Strapi using Faker.js. Enabling mock data generation in the environment variables will generate mock data
to the database whenever the app is initialised or restarting. Mock data contains example profiles for candidates and parties and is useful for developing frontend features
and testing the capabilities of the backend. Mock data gets published automatically and is thus always ready to be used without requiring any user input.

---

## Official documentaiton from Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html) (CLI) which lets you scaffold and manage your project in seconds.

### Develop

Start your Strapi application with auto-reload enabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-develop)

```
npm run develop
# or
yarn develop
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
