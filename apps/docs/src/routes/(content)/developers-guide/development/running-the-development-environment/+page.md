> **Note:** Parts of this page reference the legacy Strapi backend which has been replaced by Supabase. Content will be updated in a future release.

# Running the Development Environment

Make sure that you’re using the recommended Node version (see [Requirements](/developers-guide/development/requirements)) by running `node -v`. If needed set the correct version with `nvm use <VERSION>`.

First, install dependencies for all workspaces:

```bash
yarn install
```

To start the whole development stack — the local Supabase services, the shared-package watcher and the frontend dev server — in the project's root directory:

- Make a copy of the `.env.example` file and rename the copy as `.env`
- Run `yarn dev`
- If you run into errors, try the tips in [Troubleshooting](/developers-guide/troubleshooting).

The `yarn dev` script will automatically build all the shared packages and start watching them for changes. If these change, they will be rerebuilt and the frontend restarted to reflect the changes.

To stop the local backend services again, run:

```bash
yarn db:stop
```

To drop the database and recreate it from the migrations and `seed.sql` — discarding any seeded
data -- run `yarn db:reset`.

**Only use the `.env` file in the project root. You usually don't have to touch the separate
.env files for the individual workspaces.**

If you want to seed backend DB with mock data (e.g. for demonstration, development or testing purposes purposes), please follow the instructions [here](/developers-guide/backend/mock-data-generation).

### Hot Reloading the Backend

Development Docker images will listen to changes in the files and allow hot reloading, meaning the Docker images don't need to be re-generated after making changes to the codebase. Hot reloading is enabled by default in the frontend, but for backend this can be enabled by adding the volume `- ./:/opt` as a mounted point in [docker-compose.dev.yml](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/docker-compose.dev.yml) and re-building the Docker container. However, this can make the development process slow at times, so it is not recommended to keep that on unless doing direct development on the backend source code.
