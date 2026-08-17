# Running the Development Environment

Make sure that you’re using the recommended Node version (see [Requirements](/developers-guide/development/requirements)) by running `node -v`. If needed set the correct version with `nvm use <VERSION>`.

First, install dependencies for all workspaces:

```bash
yarn install
```

To build and run development Docker images for the entire stack (frontend, backend and DB), in the project's root directory:

- Make a copy of the `.env.example` file and rename the copy as `.env`
- Run `yarn dev`
- If you run into errors, try checking the tips related to Docker in [Troubleshooting](/developers-guide/troubleshooting).

The `yarn dev` script will automatically build all the shared packages and start watching them for changes. If these change, they will be rerebuilt and the frontend restarted to reflect the changes.

To bring down the Docker stack properly (delete all containers, images and named volumes which include backend DB volume with potentially seeded mock data) run:

```bash
yarn dev:down
```

**When running the project in Docker, only use the `.env` file in project root. You usually
don't have to touch the separate .env files for frontend and backend.**

If you want to seed backend DB with mock data (e.g. for demonstration, development or testing purposes purposes), please follow the instructions [here](/developers-guide/backend/mock-data-generation).

### Hot Reloading the Backend

Development Docker images will listen to changes in the files and allow hot reloading, meaning the Docker images don't need to be re-generated after making changes to the codebase. Hot reloading is enabled by default in the frontend, but for backend this can be enabled by adding the volume `- ./:/opt` as a mounted point in [docker-compose.dev.yml](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/docker-compose.dev.yml) and re-building the Docker container. However, this can make the development process slow at times, so it is not recommended to keep that on unless doing direct development on the backend source code.
